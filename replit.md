# ScenePulse

ScenePulse is an AI-powered local music intelligence platform — discover emerging artists, hidden venues, and underground events, mapped and connected (Spotify × Google Maps × LinkedIn vibe).

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, served at `/api`)
- `pnpm --filter @workspace/scenepulse run dev` — run the web app (Vite, served at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push-force` — push DB schema changes (dev only)
- Required env: `SUPABASE_DB_URL` (preferred) or `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + shadcn/ui + wouter + TanStack Query (NOT Next.js)
- API: Express 5, mounted at `/api`
- DB: PostgreSQL + Drizzle ORM (lat/lng stored as double precision; PostGIS/pgvector deferred)
- Auth/Storage/Realtime: Supabase (frontend client + AuthProvider)
- Maps: Mappls / MapmyIndia (NOT Mapbox), loaded via script tag using `VITE_MAPPLS_KEY`
- Automation: n8n (outbound dispatch + inbound webhooks)
- API codegen: Orval (from OpenAPI spec)

## Where things live

- DB schema (source of truth): `lib/db/src/schema/` (enums, profiles, artists, venues, events)
- API contract (source of truth): `lib/api-spec/openapi.yaml` — `servers: /api`
- Backend routes: `artifacts/api-server/src/routes/` (mounted at `/api` in `app.ts`)
- Frontend: `artifacts/scenepulse/src/` (pages in `src/pages`, theme in `src/index.css`)
- Generated client hooks: `@workspace/api-client-react`; zod/types: `@workspace/api-zod`
- n8n workflows: `n8n/workflows/` (+ `n8n/README.md`)
- Seed images: `artifacts/scenepulse/public/seed/`

## Architecture decisions

- API client uses relative `/api/...` paths (no base URL); the proxy routes `/api` to the API server. The frontend and API are separate artifacts.
- `lib/db` prefers `SUPABASE_DB_URL ?? DATABASE_URL`, so providing the Supabase URL switches the DB without code changes.
- Supabase/Mappls integrations degrade gracefully when their env vars are missing (banner shown, features disabled) so the app runs without keys.
- Artist/venue/event profiles are FULL-PAGE routes (`/artists/:id`, `/venues/:id`, `/events/:id`), never modals.
- Dark-first theme: `dark` class is set on `<html>` in `index.html`.

## Gotchas

- The API server dev command builds once then runs (no watch). After editing `artifacts/api-server/src/**`, RESTART the `artifacts/api-server: API Server` workflow or the old bundle keeps serving.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
