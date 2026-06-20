import {
  useGetVenue,
  getGetVenueQueryKey,
  useListEvents,
  getListEventsQueryKey,
} from "@workspace/api-client-react";
import { Link, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Globe, Instagram, Users } from "lucide-react";

export default function VenueDetail() {
  const params = useParams();
  const id = params.id as string;

  const { data: venue, isLoading, error } = useGetVenue(id, {
    query: { enabled: !!id, queryKey: getGetVenueQueryKey(id) },
  });
  const { data: events } = useListEvents(
    { venueId: id },
    { query: { enabled: !!id, queryKey: getListEventsQueryKey({ venueId: id }) } },
  );

  if (isLoading)
    return (
      <div className="flex-1 flex items-center justify-center">
        Loading venue...
      </div>
    );
  if (error || !venue)
    return (
      <div className="flex-1 flex items-center justify-center text-destructive">
        Error loading venue
      </div>
    );

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 max-w-5xl">
      <Button variant="ghost" size="sm" asChild className="mb-4 sm:mb-6 -ml-3">
        <Link href="/venues">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Venues
        </Link>
      </Button>

      <div className="glass-card rounded-3xl overflow-hidden mb-8 sm:mb-12">
        <div className="h-48 sm:h-64 md:h-80 bg-muted relative w-full">
          {venue.imageUrl ? (
            <img
              src={venue.imageUrl}
              alt={venue.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-secondary/20 to-primary/20">
              <span className="text-6xl font-bold opacity-30">
                {venue.name.charAt(0)}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        </div>

        <div className="px-4 sm:px-6 md:px-12 pb-8 sm:pb-12 relative -mt-12 sm:-mt-16">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 sm:items-end mb-6 sm:mb-8">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-3">
                {venue.name}
              </h1>
              {(venue.city || venue.address) && (
                <div className="flex items-center text-muted-foreground text-sm sm:text-base">
                  <MapPin className="w-4 h-4 mr-2 text-primary shrink-0" />
                  {venue.address
                    ? `${venue.address}${venue.city ? `, ${venue.city}` : ""}`
                    : venue.city}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {venue.websiteUrl && (
                <Button size="icon" variant="outline" asChild>
                  <a href={venue.websiteUrl} target="_blank" rel="noreferrer">
                    <Globe className="w-4 h-4" />
                  </a>
                </Button>
              )}
              {venue.instagramUrl && (
                <Button size="icon" variant="outline" asChild>
                  <a href={venue.instagramUrl} target="_blank" rel="noreferrer">
                    <Instagram className="w-4 h-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-12">
            <div className="md:col-span-2 space-y-6 sm:space-y-8">
              <section>
                <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">About</h2>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed whitespace-pre-line">
                  {venue.description || "No description available."}
                </p>
              </section>
            </div>

            <div className="space-y-4 sm:space-y-6">
              {venue.capacity && (
                <div className="glass p-4 sm:p-6 rounded-2xl flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-secondary/20 flex items-center justify-center text-secondary shrink-0">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wider font-medium">
                      Capacity
                    </div>
                    <div className="text-xl sm:text-2xl font-bold">
                      {venue.capacity.toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 sm:space-y-6">
        <h2 className="text-2xl sm:text-3xl font-bold">Events at this Venue</h2>
        {events && events.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {events.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`}>
                <div className="glass p-3 sm:p-4 rounded-xl flex items-center gap-3 sm:gap-4 hover-elevate transition-all">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-primary/20 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {event.imageUrl ? (
                      <img
                        src={event.imageUrl}
                        className="w-full h-full rounded-lg object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate text-sm sm:text-lg">
                      {event.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {new Date(event.eventDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div
                    className={`shrink-0 px-2 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                      event.status === "upcoming"
                        ? "bg-primary/20 text-primary"
                        : "bg-muted"
                    }`}
                  >
                    {event.status}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="glass p-6 sm:p-8 text-center rounded-xl text-muted-foreground">
            No events scheduled at this venue.
          </div>
        )}
      </div>
    </div>
  );
}
