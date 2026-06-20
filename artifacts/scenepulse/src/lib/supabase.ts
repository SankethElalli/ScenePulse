import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        // PKCE keeps the access/refresh tokens OUT of the email link + URL.
        // Confirmation links carry a short-lived one-time `?code=` instead,
        // which supabase-js exchanges for a session via detectSessionInUrl.
        flowType: "pkce",
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/**
 * Where Supabase should send the user after confirming their email / clicking a
 * magic link. This URL must be added to the Supabase Auth "Redirect URLs"
 * allow-list (Authentication → URL Configuration).
 */
export const authRedirectTo =
  typeof window !== "undefined"
    ? `${window.location.origin}${import.meta.env.BASE_URL}auth/callback`
    : undefined;
