import { useGetProfile, getGetProfileQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/auth";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { FanDashboard } from "@/components/dashboard/FanDashboard";
import { ArtistDashboard } from "@/components/dashboard/ArtistDashboard";
import { VenueDashboard } from "@/components/dashboard/VenueDashboard";

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();

  const {
    data: profile,
    isLoading: profileLoading,
    error,
  } = useGetProfile(user?.id ?? "", {
    query: {
      enabled: !!user?.id,
      queryKey: getGetProfileQueryKey(user?.id ?? ""),
    },
  });

  if (authLoading || (user && profileLoading))
    return (
      <div className="flex-1 flex items-center justify-center">
        Loading dashboard…
      </div>
    );

  if (!user)
    return (
      <div className="container mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-3xl font-bold">Your dashboard</h1>
        <p className="text-muted-foreground">
          Sign in to see your personalized scene.
        </p>
        <Button asChild>
          <Link href="/">Go home</Link>
        </Button>
      </div>
    );

  if (error || !profile)
    return (
      <div className="container mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-3xl font-bold">Finish setting up</h1>
        <p className="text-muted-foreground">
          We couldn't find your profile yet.
        </p>
        <Button asChild>
          <Link href="/onboarding">Complete onboarding</Link>
        </Button>
      </div>
    );

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {profile.role === "artist" ? (
        <ArtistDashboard profile={profile} />
      ) : profile.role === "venue" ? (
        <VenueDashboard profile={profile} />
      ) : (
        <FanDashboard profile={profile} />
      )}
    </div>
  );
}
