---
name: Supabase from Replit (DB connection + auth)
description: Why Supabase direct DB connections fail from Replit, which connection string to use, and what auth needs.
---

# Supabase from the Replit environment

## Direct DB host is unreachable from Replit
- Supabase's **direct** connection host `db.<ref>.supabase.co` is IPv6-only on
  newer projects. Replit's environment is IPv4-only, so it resolves to no A/AAAA
  record here and fails with `getaddrinfo ENOTFOUND db.<ref>.supabase.co`.
- **Fix:** use the Supabase **pooler** connection string instead —
  host `<region>.pooler.supabase.com` (e.g. `aws-0-ap-south-1.pooler.supabase.com`),
  username `postgres.<project-ref>`, ports 6543 (transaction) or 5432 (session).
  Get it from Dashboard → Project Settings → Database → "Connection pooling".
- **Why it matters:** a user pasting the dashboard's default "URI" (direct) will
  break the app DB. Always ask for the *pooler* string for use from Replit.

## Connection-string password encoding
- Postgres passwords often contain URL-unsafe chars (`/`, `@`, `:`). If pasted
  unencoded into a connection string, the URL parser misreads the host (stops the
  authority at the first `/`) → `getaddrinfo ENOTFOUND postgres`. The literal
  host "postgres" in that error is the giveaway that the password broke parsing.
- **Why:** the DB layer only falls back to discrete pg fields when it detects a
  malformed URL; well-formed URLs are passed through verbatim so query params
  (e.g. `sslmode`) are preserved. Don't decompose every URL — that drops params.

## Auth vs DB are independent
- Supabase **Auth** (signup/login) only needs `VITE_SUPABASE_URL` +
  `VITE_SUPABASE_ANON_KEY` and talks to `https://<ref>.supabase.co/auth/v1/*`.
  It works regardless of whether the Postgres DB connection is reachable.
- Supabase rejects `@example.com` signups as "invalid email" (400); use a real
  domain (e.g. gmail.com) when smoke-testing signup.

## App DB selection
- `lib/db` picks `SUPABASE_DB_URL` first, else `DATABASE_URL` (Replit Postgres).
  When `SUPABASE_DB_URL` is the unreachable `db.*.supabase.co` direct host, it
  auto-falls back to `DATABASE_URL` with a warning, so the app keeps working until
  a pooler URL is supplied.
