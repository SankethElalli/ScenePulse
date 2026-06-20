---
name: drizzle-kit push column rename in this repo
description: Why drizzle-kit push hangs/errors on column renames here and how to apply them
---

# drizzle-kit push + column renames

`pnpm --filter @workspace/db run push` (and `push-force`) FAIL on column renames or
ambiguous diffs with: "Interactive prompts require a TTY terminal". The column
"rename vs drop+create" resolver needs interactive input, which the agent shell
cannot provide; `--force` only auto-accepts data-loss statements, not the resolver.

**Why:** the push commands run non-interactively (piped), so any drizzle-kit
conflict prompt aborts.

**How to apply:** for renames (or any change that triggers the resolver), apply the
DDL directly against the DB with a small `pg` script (the repo's DB URL is
`SUPABASE_DB_URL`; parse it and use `ssl:{rejectUnauthorized:false}`), e.g.
`alter table X rename column a to b`, then run `push` again — with the DB already
matching the schema, push reports "no changes" and won't prompt. Pure additive
changes (new tables/columns) push fine without this workaround.
