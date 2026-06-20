import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase, isSupabaseConfigured, authRedirectTo } from "@/lib/supabase";
import { useUpsertProfile } from "@workspace/api-client-react";
type ProfileRole = "fan" | "artist" | "venue";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<ProfileRole>("fan");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const upsertProfile = useUpsertProfile();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured || !supabase) {
      toast({ title: "Error", description: "Supabase not configured", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: authRedirectTo ? { emailRedirectTo: authRedirectTo } : undefined,
    });

    if (error) {
      toast({ title: "Signup failed", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    // Create the profile record up front so it exists regardless of whether the
    // session is available now (confirmation off) or after email confirm (on).
    if (data.user) {
      try {
        await upsertProfile.mutateAsync({
          data: {
            id: data.user.id,
            email: data.user.email || email,
            role,
            displayName,
          },
        });
      } catch (err: any) {
        toast({ title: "Profile setup failed", description: err.message || "Unknown error", variant: "destructive" });
        setLoading(false);
        return;
      }
    }

    setLoading(false);

    if (data.session) {
      // Email confirmation disabled — we're already signed in.
      setLocation("/onboarding");
    } else {
      // Email confirmation enabled — no session yet. Don't bounce into a
      // protected route; tell the user to confirm via the emailed link.
      setAwaitingConfirmation(true);
    }
  };

  if (awaitingConfirmation) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-md glass-card p-8 rounded-3xl text-center">
          <h1 className="text-3xl font-bold mb-3">Check your email</h1>
          <p className="text-muted-foreground">
            We sent a confirmation link to <span className="font-semibold">{email}</span>.
            Open it on this device to finish setting up your account.
          </p>
          <div className="mt-8 text-sm">
            <Link href="/login" className="text-primary hover:underline">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md glass-card p-8 rounded-3xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Join ScenePulse</h1>
          <p className="text-muted-foreground mt-2">Create your account to get started</p>
        </div>
        
        <form onSubmit={handleSignup} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input 
              id="displayName" 
              placeholder="Your name or act" 
              value={displayName} 
              onChange={(e) => setDisplayName(e.target.value)} 
              required 
              className="bg-background/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="you@example.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              className="bg-background/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password" 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              className="bg-background/50"
              minLength={6}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">I am a...</Label>
            <Select value={role} onValueChange={(val) => setRole(val as ProfileRole)}>
              <SelectTrigger className="bg-background/50">
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fan">Fan</SelectItem>
                <SelectItem value="artist">Artist</SelectItem>
                <SelectItem value="venue">Venue</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account..." : "Sign Up"}
          </Button>
        </form>
        
        <div className="mt-6 text-center text-sm">
          <span className="text-muted-foreground">Already have an account? </span>
          <Link href="/login" className="text-primary hover:underline">Log in</Link>
        </div>
      </div>
    </div>
  );
}
