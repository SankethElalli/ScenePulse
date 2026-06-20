# ScenePulse × n8n — Setup & Contract

**Division of labor**

- **ScenePulse (this app)** fires outbound events when a user does something
  (e.g. an artist adds a Spotify URL) and exposes inbound webhooks that write
  data back into the database + map.
- **You (n8n)** build the flows in the middle — call Cyanite / Musixmatch /
  Songstats / JamBase, then POST the results back to the inbound webhooks below.

You only need to respect two contracts: the **outbound event payloads** you
receive, and the **inbound write-back payloads** you send. Everything between is
yours.

> **Security:** never commit API keys to this repo. Store every provider key as
> an n8n credential or environment variable. Any key shared in chat/docs should
> be considered compromised — rotate it before going live.

---

## 1. Environment variables

**On n8n:**

| Variable | Purpose |
| --- | --- |
| `SCENEPULSE_API_URL` | Base URL of the ScenePulse API, no trailing slash (e.g. `https://your-app.replit.app`) |
| `N8N_WEBHOOK_SECRET` | Shared secret — must match ScenePulse's value |
| `CYANITE_API_KEY` | Cyanite audio analysis (your flow) |
| `MUSIXMATCH_API_KEY` | Musixmatch lyrics (your flow) |
| `SONGSTATS_API_KEY` | Songstats stats (optional) |
| `JAMBASE_API_KEY` | JamBase gigs (optional) |

**On ScenePulse (Replit Secrets):**

| Secret | Purpose |
| --- | --- |
| `N8N_WEBHOOK_URL` | The Production URL of your enrichment Webhook node. If unset, outbound dispatch is a no-op (app still runs). |
| `N8N_WEBHOOK_SECRET` | Shared secret — must match n8n's value. Inbound webhooks return `401` until this is set. |

---

## 2. Outbound events — what ScenePulse sends YOU

ScenePulse POSTs to `N8N_WEBHOOK_URL` with header
`x-webhook-secret: <N8N_WEBHOOK_SECRET>` and body:

```json
{ "event": "<name>", "payload": { ... }, "sentAt": "<ISO timestamp>" }
```

| Event | Fired when | `payload` fields |
| --- | --- | --- |
| `artist.created` | A new artist is created | `id`, `artistName` |
| `artist.enrich` | An artist is created/updated **with a Spotify URL**, or `POST /artists/:id/enrich` is called | `artistId`, `artistName`, `spotifyUrl` |
| `user.signup` | A user signs up | (see `user-signup.json`) |

In n8n, read these as `{{ $json.body.payload.<field> }}`.

---

## 3. Inbound webhooks — what YOU send back to ScenePulse

POST to `{{ $env.SCENEPULSE_API_URL }}/api/webhooks/n8n/<event>` with headers
`x-webhook-secret: {{ $env.N8N_WEBHOOK_SECRET }}` and `Content-Type: application/json`.

### `artist.audio_analysis` (from Cyanite)

`artistId` is **required**; all else optional. `genres` and `moods` are auto-added
as discovery tags and power map/search filters.

| Field | Type | Notes |
| --- | --- | --- |
| `artistId` | uuid (required) | from the trigger payload |
| `energy`, `danceability`, `valence`, `acousticness`, `instrumentalness` | number 0–1 \| null | |
| `tempo` | number (BPM) \| null | |
| `loudness` | number \| null | |
| `musicalKey`, `mode` | string \| null | e.g. `"C#"`, `"major"` |
| `genres`, `moods` | string[] | become discovery tags |
| `source` | string | e.g. `"cyanite"` |

### `artist.lyric_analysis` (from Musixmatch)

`artistId` **required**; `themes` become discovery tags.

| Field | Type | Notes |
| --- | --- | --- |
| `artistId` | uuid (required) | from the trigger payload |
| `themes`, `keywords` | string[] | `themes` become tags |
| `sentiment` | string \| null | e.g. `"positive"` |
| `sentimentScore` | number -1..1 \| null | |
| `language` | string \| null | |
| `summary` | string \| null | |
| `source` | string | e.g. `"musixmatch"` |

### `artist.verify`

| Field | Type |
| --- | --- |
| `artistId` | uuid (required) → marks the artist verified |

Invalid payloads return `400`; a missing/wrong secret returns `401`.

---

## 4. HTTP write-back node config (n8n)

For each "Write …" node:

- **Method:** `POST`
- **URL:** `={{ $env.SCENEPULSE_API_URL }}/api/webhooks/n8n/artist.audio_analysis`
  (or `.../artist.lyric_analysis`)
- **Headers:** `x-webhook-secret = {{ $env.N8N_WEBHOOK_SECRET }}`,
  `Content-Type = application/json`
- **Body:** JSON matching the tables above. Pull `artistId` from the trigger:
  `{{ $('On Artist Enrich').item.json.body.payload.artistId }}`.

---

## 5. Workflow files (`workflows/`)

Import via **Workflows → Import from File**. These are **scaffolds** — the
trigger + write-back nodes are the fixed contract; you fill in the provider calls.

| File | Trigger | What to build |
| --- | --- | --- |
| `artist-enrichment.json` | `artist.enrich` | Cyanite (audio) + Musixmatch (lyrics) → write-back nodes (already wired) |
| `artist-creation.json` | `artist.created` | optional welcome/verify steps |
| `artist-daily-refresh.json` | schedule | optional Songstats/JamBase refresh |
| `user-signup.json` | `user.signup` | optional onboarding steps |

After importing `artist-enrichment.json`, open the **On Artist Enrich** node, copy
its Production URL, and set it as ScenePulse's `N8N_WEBHOOK_URL` secret.

---

## 6. API → feature mapping (for reference)

| Provider | Feeds | ScenePulse surface |
| --- | --- | --- |
| Cyanite | audio mood/energy/genre/BPM | Artist audio card, map mood/genre filters |
| Musixmatch | lyric themes/keywords/sentiment | Artist lyric card, "songs about …" search |
| Songstats | streaming/social traction | Artist stats (planned) |
| JamBase | local gigs | Venue/gig pins (planned) |
