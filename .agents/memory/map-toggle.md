---
name: Map local/global toggle
description: How the Local/Global scope toggle works on the ScenePulse map
---

The toggle is a pill button in the filter chips row in MapShell.tsx.

**Rule:** `globalMode` state (default false = Local). When false and `userCity` is set (from profile.city), `visiblePins` filters to only pins whose city matches `userCity`. When true, all pins show.

**Why:** Users want to see their local scene by default, with an escape hatch to browse globally.

**How to apply:** `userCity` comes from `useGetProfile(user.id)` — only available when signed in. If no city is set on profile, local filter is a no-op (shows all). Toggle is hidden in lyrics/vibe-search mode.
