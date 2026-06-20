---
name: JamBase geo constraints (bbox size + coordinate ranges)
description: JamBase /events rejects bboxes wider than ~25° AND any out-of-range lat/lng; Global mode needs hub aggregation, not a single bbox
---

## Rules
1. **Bbox span ≤ 25°**: before forwarding a bbox, check `latSpan` and `lngSpan` are ≤ 25; otherwise return `{ pins: [], total: 0 }` without calling JamBase.
2. **Clamp coordinates**: clamp lat to [-90,90] and lng to [-180,180] before sending. Leaflet reports out-of-range bounds when zoomed/panned out, and JamBase returns HTTP 400 for lat>90 or lng>180 (verified by direct curl).
3. **Never 500 the map**: wrap `fetchEventsByBbox` / hub fetches in try/catch and return empty `{ pins: [], total: 0 }` on any upstream error. A failed live-events fetch must never blank the map.

## Why
A single bbox can't cover the planet, and out-of-range coords throw 400→500, which combined with "Live Tonight" (which hides all local DB pins) leaves a totally empty map. Users in low-coverage regions (e.g. Bengaluru, India — 0 JamBase events) perceive this as fully broken.

## Global mode = hub aggregation
For a worldwide "live events" view, do NOT send one giant bbox. Query a curated list of major music hubs (NYC, LA, London, Berlin, Tokyo, Sydney, etc.) via `fetchEventsNearPoint` in parallel (`Promise.allSettled`, tolerate per-hub failure), dedupe by event identifier. Exposed at `GET /jambase/events/global`. The frontend switches between viewport-bbox fetch (Local) and the global endpoint (Global), and the map flies out to a world view (`flyTo([20,0], 2)`) when Global activates so the hub pins are on-screen.

## Where
`artifacts/api-server/src/lib/jambase.ts` (fetchEventsNearPoint, fetchGlobalLiveEvents), `artifacts/api-server/src/routes/jambase.ts` (clamp + try/catch + /global route), `artifacts/scenepulse/src/pages/MapShell.tsx` (Local vs Global fetch), `artifacts/scenepulse/src/components/map/SceneMap.tsx` (ScopeViewController).
