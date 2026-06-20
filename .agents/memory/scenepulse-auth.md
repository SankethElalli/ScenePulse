---
name: ScenePulse Supabase auth flow
description: How signup/login/onboarding and Supabase email confirmation are wired, and why
---

# ScenePulse auth flow

Supabase Auth (email+password) via `@supabase/supabase-js` in `artifacts/scenepulse`.

## Use PKCE, never default implicit flow
The Supabase client MUST be created with `auth: { flowType: "pkce", detectSessionInUrl: true, persistSession: true, autoRefreshToken: true }`.
**Why:** the default implicit flow puts `#access_token=…&refresh_token=…` in the URL after the email-confirmation redirect, which the user flagged as exposing their token. PKCE sends a one-time `?code=` instead, exchanged automatically on load.
**How to apply:** any new Supabase client/option change must keep PKCE. Confirmation/magic-link redirects land on `/auth/callback` (AuthCallback page) which waits for the session then routes to `/onboarding`. `emailRedirectTo` is built from `window.location.origin + BASE_URL + "auth/callback"` and must be in Supabase's Redirect URLs allow-list.

## Signup must branch on session presence
After `supabase.auth.signUp`, `data.session` is NULL when email confirmation is ON (only `data.user` is returned). Do NOT navigate into a protected route in that case — it bounces back to /login and the user sees a blank/stuck app.
**Why:** this exact bug ("after sign in nothing shows up") was caused by always `setLocation('/dashboard')` with no session.
**How to apply:** if `data.session` exists → go to `/onboarding`; else show a "check your email" state. Profile row is upserted right after signUp (backend POST /api/profiles is unguarded) so it exists regardless.

## Simplest UX = disable email confirmation
For instant signup (no email at all), the user can turn OFF "Confirm email" in Supabase → Authentication → Sign In/Providers. Agent cannot toggle this (service_role key can't change auth config). Code handles both on/off.

## ProtectedRoute
Redirect must happen in `useEffect`, not during render (wouter `setLocation` during render is a side-effect-in-render bug).
