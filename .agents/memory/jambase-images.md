---
name: JamBase images are Cloudflare-blocked + global artist/venue pins
description: jambase.com images 403 behind a Cloudflare managed challenge (server AND browser); Global map artists/venues are derived from events, not a dataset
---

## JamBase images cannot be loaded directly
`www.jambase.com/wp-content/...` image URLs sit behind a Cloudflare **managed challenge** (`/__mc?return=...`), returning 307→403 HTML for both a datacenter server fetch (even with browser UA + image Accept headers) and a browser CSS `background-image` request (no JS context to solve it).

**Rule:** never assume a JamBase image will load. You cannot proxy it server-side either. Render a deterministic fallback (gradient + name initial) that stays visible when the photo fails, with the photo layered on top.
**Why:** otherwise pins/cards render as empty/dark boxes for the many blocked URLs.
**How to apply:** the photo overlay must be *transparent* when the image fails — use only `background-image:url(...)` (NO opaque background color), so a failed load reveals the gradient+initial beneath. For hero images use CSS multi-background `url(img), linear-gradient(...)`.

## Global mode artists & venues are derived from JamBase events
There is no worldwide artist/venue dataset of our own (DB is local-city only). For a lively zoomed-out map, derive artist pins (from event performers) and venue pins (from event locations) out of the aggregated global-events response, deduped by identifier; nudge co-located performers off the exact venue coord so they don't fully stack.
**Why:** user wants Global mode to feel alive with artists/venues everywhere, not just live-show pins.
**How to apply:** derived pins have no internal detail page, so give them an `externalUrl` (JamBase performer/venue URL) and have the pin popup render an external link instead of the internal router link.

## Gotcha
`lucide-react` exports a `Map` icon; when it's imported, `new Map()` resolves to the icon. Use `new globalThis.Map<…>()` for the built-in.
