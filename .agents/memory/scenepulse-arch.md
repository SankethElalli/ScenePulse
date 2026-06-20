---
name: ScenePulse architecture
description: High-level architecture and key conventions for the ScenePulse project
---

**Stack:** pnpm monorepo, React+Vite+shadcn+wouter (scenepulse), Express+Drizzle ORM (api-server), Supabase (Postgres DB + Auth).

**Key conventions:**
- No AI/OpenAI anywhere — explicitly excluded.
- API client generated from OpenAPI spec in `packages/api-spec`; hooks in `@workspace/api-client-react`.
- Roles: fan, artist, venue only — organizer was removed.
- DB geocoding: `lib/geocode.ts` uses Nominatim (free, no key). Artists/venues auto-geocode city on POST if no lat/lng provided.
- Map pins: `/api/map/pins` returns all pins with coords. Frontend Local/Global toggle filters by profile.city client-side.

**Why:** Supabase Auth is the single source of truth for identity; profile row (profiles table) stores role + city.
