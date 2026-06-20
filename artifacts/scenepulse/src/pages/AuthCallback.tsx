import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/auth";
import { useGetProfile } from "@workspace/api-client-react";

/**
 * Landing route for Supabase email-confirmation, magic-link, and OAuth redirects.
 * With PKCE + detectSessionInUrl, supabase-js automatically exchanges the
 * `?code=` in the URL for a session on load. We wait for that session, scrub
 * any auth params from the address bar, and forward the user appropriately:
 * - New / incomplete profile → /onboarding
 * - Returning user with profile → / (map)
 */
export default function AuthCallback() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);

  const { data: profile, isLoading: profileLoading } = useGetProfile(user?.id ?? "", {
    enabled: !!user,
  });

  useEffect(() => {
    const url = new URL(window.location.href);
    const errDesc =
      url.searchParams.get("error_description") ??
      url.hash.match(/error_description=([^&]+)/)?.[1] ??
      null;
    if (errDesc) setError(decodeURIComponent(errDesc.replace(/\+/g, " ")));
  }, []);

  useEffect(() => {
    if (isLoading || error) return;
    if (!user) return;
    if (profileLoading) return;

    window.history.replaceState({}, "", window.location.pathname);

    // Returning user with a complete profile → go straight to the map
    if (profile?.displayName) {
      setLocation("/");
    } else {
      // New user or incomplete profile → complete onboarding first
      setLocation("/onboarding");
    }
  }, [user, isLoading, error, profile, profileLoading, setLocation]);

  // Fallback: if the code exchange never produces a session (expired/invalid
  // link, or opened in a different browser than it was requested from).
  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 8000);
    return () => clearTimeout(t);
  }, []);

  const showError =
    error ??
    (timedOut && !isLoading && !user
      ? "This sign-in link is invalid or has expired. Please request a new one."
      : null);

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="glass-card p-8 rounded-3xl text-center max-w-md">
        {showError ? (
          <>
            <h1 className="text-2xl font-bold mb-2">Confirmation failed</h1>
            <p className="text-muted-foreground">{showError}</p>
            <button
              onClick={() => setLocation("/login")}
              className="mt-6 text-primary hover:underline"
            >
              Back to sign in
            </button>
          </>
        ) : (
          <p className="text-muted-foreground">Signing you in…</p>
        )}
      </div>
    </div>
  );
}
