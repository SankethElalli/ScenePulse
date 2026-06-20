import { useState } from "react";
import {
  useGetMyVenue,
  useListEvents,
  useCreateEvent,
  useListVenueMedia,
  useAddVenueMedia,
  useDeleteVenueMedia,
  getGetMyVenueQueryKey,
  getListEventsQueryKey,
  getListVenueMediaQueryKey,
} from "@workspace/api-client-react";
import type { Profile } from "@workspace/api-client-react";
import { isNotFound } from "@/lib/api-error";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CalendarPlus, CalendarDays, Image } from "lucide-react";
import { CreateVenueForm } from "./CreateVenueForm";
import { MediaManager } from "./MediaManager";

export function VenueDashboard({ profile }: { profile: Profile }) {
  const {
    data: venue,
    isLoading,
    error,
  } = useGetMyVenue(profile.id, {
    query: { retry: false, queryKey: getGetMyVenueQueryKey(profile.id) },
  });

  if (isLoading)
    return <p className="text-muted-foreground">Loading your dashboard…</p>;

  if (error) {
    if (isNotFound(error)) {
      return (
        <CreateVenueForm profileId={profile.id} defaultCity={profile.city} />
      );
    }
    return (
      <p className="text-destructive">Could not load your venue dashboard.</p>
    );
  }

  if (!venue) return null;

  return <VenueHub venueId={venue.id} venueName={venue.name} />;
}

function VenueHub({
  venueId,
  venueName,
}: {
  venueId: string;
  venueName: string;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: events } = useListEvents({ venueId });
  const createEvent = useCreateEvent();

  const { data: media } = useListVenueMedia(venueId);
  const addMedia = useAddVenueMedia();
  const deleteMedia = useDeleteVenueMedia();

  const [name, setName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [description, setDescription] = useState("");

  const invalidateEvents = () =>
    qc.invalidateQueries({ queryKey: getListEventsQueryKey({ venueId }) });
  const invalidateMedia = () =>
    qc.invalidateQueries({ queryKey: getListVenueMediaQueryKey(venueId) });

  const submitEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !eventDate) return;
    createEvent.mutate(
      {
        data: {
          venueId,
          name: name.trim(),
          eventDate: new Date(eventDate).toISOString(),
          description: description.trim() || undefined,
          status: "upcoming",
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Event posted" });
          setName("");
          setEventDate("");
          setDescription("");
          void invalidateEvents();
        },
        onError: () =>
          toast({ title: "Could not post event", variant: "destructive" }),
      },
    );
  };

  return (
    <div className="space-y-12">
      <header>
        <h1 className="text-4xl font-bold mb-1">{venueName}</h1>
        <p className="text-muted-foreground">
          Your venue hub — post events and manage your gallery.
        </p>
      </header>

      <section className="space-y-5">
        <div className="flex items-center gap-2">
          <CalendarPlus className="w-5 h-5 text-primary" />
          <h2 className="text-2xl font-semibold">Post an event</h2>
        </div>
        <form
          onSubmit={submitEvent}
          className="glass rounded-xl p-4 space-y-3 max-w-2xl"
        >
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="eventName">Event name</Label>
              <Input
                id="eventName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-background/50"
                data-testid="input-event-name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="eventDate">Date &amp; time</Label>
              <Input
                id="eventDate"
                type="datetime-local"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
                className="bg-background/50"
                data-testid="input-event-date"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="eventDesc">Description</Label>
            <Textarea
              id="eventDesc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="bg-background/50"
            />
          </div>
          <Button
            type="submit"
            disabled={createEvent.isPending || !name.trim() || !eventDate}
            data-testid="button-post-event"
          >
            {createEvent.isPending ? "Posting…" : "Post event"}
          </Button>
        </form>
      </section>

      <section className="space-y-5">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-secondary" />
          <h2 className="text-2xl font-semibold">Your events</h2>
        </div>
        {events && events.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {events.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`}>
                <div className="glass-card p-4 rounded-xl flex items-center gap-4 hover-elevate transition-all">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{event.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.eventDate).toLocaleString()}
                    </p>
                  </div>
                  <span className="px-2 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-muted capitalize">
                    {event.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            No events yet. Post your first one above.
          </p>
        )}
      </section>

      <section className="space-y-5">
        <div className="flex items-center gap-2">
          <Image className="w-5 h-5 text-accent" />
          <h2 className="text-2xl font-semibold">Photos &amp; videos</h2>
        </div>
        <MediaManager
          items={media ?? []}
          adding={addMedia.isPending}
          deletingId={
            deleteMedia.isPending ? deleteMedia.variables?.mediaId : null
          }
          onAdd={(input) =>
            addMedia.mutate(
              { id: venueId, data: input },
              {
                onSuccess: () => {
                  toast({ title: "Media added" });
                  void invalidateMedia();
                },
                onError: () =>
                  toast({
                    title: "Could not add media",
                    variant: "destructive",
                  }),
              },
            )
          }
          onDelete={(mediaId) =>
            deleteMedia.mutate(
              { id: venueId, mediaId },
              {
                onSuccess: () => void invalidateMedia(),
                onError: () =>
                  toast({
                    title: "Could not delete media",
                    variant: "destructive",
                  }),
              },
            )
          }
        />
      </section>
    </div>
  );
}
