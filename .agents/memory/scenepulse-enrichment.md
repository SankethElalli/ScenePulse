---
name: ScenePulse artist enrichment triggers & no-AI rule
description: How/when artist enrichment fires and the project's hard no-AI constraint
---

# ScenePulse artist enrichment

**Hard constraint:** NO AI / NO OpenAI anywhere in ScenePulse. All "intelligence"
(artist summaries, lyric themes/keywords/sentiment, audio genres/moods) is done the
traditional way — curated text, lexicon/frequency extraction, or provider analysis
(Cyanite/Musixmatch) mapped deterministically. There is no embeddings table and no
`ai_summary` column (it is `artists.summary`, curated text).
**Why:** the user set this as a non-negotiable product requirement.

**Enrichment trigger rule:** adding or changing an artist's `spotifyUrl` must trigger
the enrichment pipeline, not just the explicit `POST /artists/:id/enrich` button.
- `POST /artists` dispatches `artist.enrich` when the created artist has a `spotifyUrl`.
- `PATCH /artists/:id` dispatches `artist.enrich` only when `spotifyUrl` is present in
  the body AND differs from the stored value (compare against a pre-update SELECT).
**Why:** a reviewer flagged that "add Spotify URL → enrich" was a required automatic
path, originally only wired to the manual enrich endpoint.

**Division of labor (user directive):** the USER builds all n8n flows themselves.
The agent owns only: (1) outbound triggers on user input, (2) the inbound webhook
contract + frontend mapping, (3) setup/node-config docs. Do NOT build complex n8n
branching/provider logic — `n8n/workflows/artist-enrichment.json` is a minimal
SCAFFOLD (Webhook trigger → NoOp "build here" → two fixed write-back HTTP nodes).
The contract + node configs live in `n8n/README.md`.
**Why:** user explicitly overrode an earlier reviewer push to build artist→track
Spotify resolution + Cyanite branching in n8n.

**Pipeline:** `dispatchN8nEvent("artist.enrich", …)` (outbound, body
`{event,payload,sentAt}`) → user's n8n flow → POSTs back to
`/api/webhooks/n8n/artist.(audio|lyric)_analysis`. Inbound webhook is
secure-by-default: `verifyN8nSecret` returns false (401) when `N8N_WEBHOOK_SECRET` is
unset, so live write-back requires that secret + provider keys (user-provisioned).
Until keys exist, demo data comes from `lib/db/seed-analysis.cjs`.
genres/moods/themes in write-back payloads auto-upsert into discovery tags.

**Provider keys leaked once in an attached PDF (Musixmatch/Songstats/JamBase/Lalal.ai)
— must be treated as compromised + rotated; never hardcode, store as n8n credentials.**
