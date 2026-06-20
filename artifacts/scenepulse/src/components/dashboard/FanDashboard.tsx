import { useListFollowedArtists, useListEvents } from "@workspace/api-client-react";
import type { Profile } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Heart, Calendar, MapPin, Compass } from "lucide-react";

export function FanDashboard({ profile }: { profile: Profile }) {
  const city = profile.city ?? undefined;

  const { data: followed, isLoading: loadingFollowed } = useListFollowedArtists(
    profile.id,
  );
  const { data: events, isLoading: loadingEvents } = useListEvents(
    city ? { city, status: "upcoming" } : { status: "upcoming" },
  );

  return (
    <div className="space-y-12">
      <header>
        <h1 className="text-4xl font-bold mb-1">
          Hi{profile.displayName ? `, ${profile.displayName}` : ""} 👋
        </h1>
        <p className="text-muted-foreground">
          Your scene{city ? ` in ${city}` : ""} — artists you follow and what's
          coming up.
        </p>
      </header>

      <section className="space-y-5">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-primary" />
          <h2 className="text-2xl font-semibold">Artists you follow</h2>
        </div>
        {loadingFollowed ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : followed && followed.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {followed.map((artist) => (
              <div
                key={artist.id}
                className="glass-card p-4 rounded-xl flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {artist.imageUrl ? (
                    <img
                      src={artist.imageUrl}
                      alt={artist.artistName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="font-bold">
                      {artist.artistName.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{artist.artistName}</h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {artist.genres?.join(", ")}
                  </p>
                </div>
                <Button size="sm" variant="ghost" asChild>
                  <Link href={`/artists/${artist.id}`}>View</Link>
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass p-8 rounded-xl text-center space-y-3">
            <p className="text-muted-foreground">
              You're not following anyone yet.
            </p>
            <Button asChild>
              <Link href="/discover">
                <Compass className="w-4 h-4 mr-2" /> Discover artists
              </Link>
            </Button>
          </div>
        )}
      </section>

      <section className="space-y-5">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-secondary" />
          <h2 className="text-2xl font-semibold">
            Events near you
            {city ? (
              <span className="ml-2 text-sm font-normal text-muted-foreground inline-flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1" /> {city}
              </span>
            ) : null}
          </h2>
        </div>
        {!city && (
          <div className="glass p-4 rounded-xl text-sm text-muted-foreground">
            Set your city in{" "}
            <Link href="/settings" className="text-primary underline">
              settings
            </Link>{" "}
            to see events around you. Showing all upcoming events for now.
          </div>
        )}
        {loadingEvents ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : events && events.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {events.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`}>
                <div className="glass-card p-4 rounded-xl flex items-center gap-4 hover-elevate transition-all">
                  <div className="w-16 h-16 rounded-lg bg-secondary/20 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {event.imageUrl ? (
                      <img
                        src={event.imageUrl}
                        alt={event.name}
                        className="w-full h-full rounded-lg object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{event.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.eventDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm italic">
            No upcoming events{city ? ` in ${city}` : ""} yet.
          </p>
        )}
      </section>
    </div>
  );
}
