---
name: Cyanite integration
description: How Cyanite mood/genre analysis is wired into ScenePulse (webhook + GraphQL), and the setup gotchas
---

# Cyanite integration (ScenePulse)

Cyanite (api.cyanite.ai, GraphQL) is the mood/genre/audio-analysis engine. The repo
originally only *referenced* Cyanite in comments — the real analysis was never built;
the `enrich` route dispatched to an unconfigured n8n pipeline and the DB held `source:"demo"`
seeded rows. The schema (`artist_audio_analysis`: energy/valence/danceability/genres/moods)
is purpose-built for Cyanite output.

## Setup chicken-and-egg (important)
- To get a Cyanite **access token** (the API key), you must first create an **Integration**
  in the Cyanite dashboard, which **requires a valid Webhook URL** that returns HTTP 200.
- So the webhook endpoint must exist/be public *before* the user can obtain `CYANITE_API_KEY`.

## Webhook (built: `POST /api/webhooks/cyanite`)
- Cyanite POSTs JSON; handler MUST return 200 (non-200 is retried).
- **Test events** (dashboard "Send Test Event") have `body.type === "TEST"` and carry **no
  `Signature` header** → just return 200.
- Real events: `Signature` header = **HMAC-SHA512(rawBody, secret)** hex. Verify against
  `CYANITE_WEBHOOK_SECRET`. Needs the **raw** body — app.ts captures it via `express.json({verify})`
  into `req.rawBody`. Verifier: `lib/cyanite.ts`.
- The webhook secret is **user-chosen** (or random) and must be identical in the Cyanite
  dashboard and in our `CYANITE_WEBHOOK_SECRET` env.

## Analysis flow (GraphQL, endpoint https://api.cyanite.ai/graphql, Bearer access token)
- Two-step: mutation `spotifyTrackEnqueue(input:{spotifyTrackId})` (variable type `ID!`, NOT `String!`)
  then query `spotifyTrack(id){ audioAnalysisV7 { ... on AudioAnalysisV7Finished { result {...} } } }`.
- Union states: NotStarted/Enqueued/Processing/Finished/Failed/**NotAuthorized**.
- Result tag fields are enums queryable as plain fields (no subselection): `moodTags`, `genreTags`,
  `instrumentTags`, `characterTags`, `energyLevel`, `bpmRangeAdjusted`, `valence`, `arousal`.
- Spotify **track** id parsed from link/uri/bare id; no Spotify API key needed.

## CRITICAL: Spotify audio analysis is plan-gated (the big gotcha)
- Since **Cyanite's March 18 2025 change**, Spotify-track audio analysis (mood/genre tagging) is
  behind a paid **feature permission**. Free/basic/standard tokens get `AudioAnalysisV7NotAuthorized`
  even though enqueue succeeds. This is an **account/plan limit, NOT a code bug** — no code makes the
  API return data it won't authorize. Don't fake/mock it; surface a clear "not enabled on this plan" note.
- **Why:** Cyanite docs say Spotify input is "primarily for Similarity Search"; tagging may be unavailable.
- **What DOES work on a basic token: Similarity Search.** `spotifyTrack(id){ similarTracks(first:N,
  target:{spotify:{}}) { ... on SimilarTracksConnection { edges{node{id title}} } } }`. Use the parent
  track as source via empty `target:{spotify:{}}`. Node `title` is "Artist - Song" → split on first " - "
  to recover artist; match against local artists. This powers "paste link → similar artists".
- **How to apply:** distinguish `notAuthorized` (plan gate) from `unavailable` (transient API/network
  error) in BOTH backend status and UI copy — they need different messages.

## Working endpoint
- `GET /api/cyanite/from-spotify?url=` → `{ analysis:{status,...tags}, similarTracks[], artistNames[] }`.
  Frontend MapShell vibe search detects a Spotify link and calls this instead of Musixmatch.

## Prod note
- After publishing, update the Cyanite Integration webhook URL to the deployed `.replit.app`/custom domain.
