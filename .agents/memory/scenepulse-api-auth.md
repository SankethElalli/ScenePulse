---
name: ScenePulse API auth pattern
description: How JWT auth is wired between the Supabase frontend and the custom Express API server.
---

## Rule
Mutation routes on the custom Express API require the Supabase Bearer JWT. The server verifies it with an admin Supabase client, attaches `req.userId`, and returns 403 if the caller doesn't own the resource. The frontend supplies the token automatically via `setAuthTokenGetter` registered once in `AuthProvider`.

**Why:** The Express API doesn't share Supabase cookie-based session. Mutations (follows, media writes, collaborations) need explicit ownership enforcement.

**How to apply:**
- Add `requireAuth` middleware to any write route.
- Compare `req.userId` against the resource's owner field; return 403 on mismatch.
- Demo/CI safety: if `SUPABASE_SERVICE_ROLE_KEY` is absent, `requireAuth` calls `next()` (graceful skip).
- Musixmatch API key (and any third-party API keys for server-only use) must be stored as Replit **secrets** — never in `.replit` env vars which are versioned.
