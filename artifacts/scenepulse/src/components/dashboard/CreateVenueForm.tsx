import { useState } from "react";
import {
  useCreateVenue,
  getGetMyVenueQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { LocateFixed, Loader2 } from "lucide-react";
import { detectCity, getCurrentCoords } from "@/lib/geo";

export function CreateVenueForm({
  profileId,
  defaultCity,
}: {
  profileId: string;
  defaultCity?: string | null;
}) {
  const create = useCreateVenue();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [city, setCity] = useState(defaultCity ?? "");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [detectingCity, setDetectingCity] = useState(false);
  const [detectedCoords, setDetectedCoords] = useState<{ lat: number; lng: number } | null>(null);

  const handleDetectCity = async () => {
    setDetectingCity(true);
    try {
      const [cityResult, coords] = await Promise.all([
        detectCity(),
        getCurrentCoords(),
      ]);
      if (cityResult) {
        setCity(cityResult);
        if (coords) setDetectedCoords(coords);
      } else {
        toast({
          title: "Could not detect location",
          description: "Allow location access and try again.",
          variant: "destructive",
        });
      }
    } finally {
      setDetectingCity(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    create.mutate(
      {
        data: {
          profileId,
          name: name.trim(),
          city: city.trim() || undefined,
          address: address.trim() || undefined,
          description: description.trim() || undefined,
          latitude: detectedCoords?.lat,
          longitude: detectedCoords?.lng,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Venue created", description: "Your venue will appear on the map shortly." });
          void qc.invalidateQueries({ queryKey: getGetMyVenueQueryKey(profileId) });
        },
        onError: () =>
          toast({ title: "Could not create venue", variant: "destructive" }),
      },
    );
  };

  return (
    <div className="glass-card rounded-2xl p-6 max-w-xl">
      <h2 className="text-2xl font-semibold mb-1">Set up your venue</h2>
      <p className="text-muted-foreground text-sm mb-5">
        Add your space so you can post events and showcase photos.
      </p>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="venueName">Venue name</Label>
          <Input
            id="venueName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="bg-background/50"
            data-testid="input-venue-name"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="venueCity">
              City
              <span className="ml-1 text-xs text-muted-foreground">(for map placement)</span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="venueCity"
                value={city}
                onChange={(e) => { setCity(e.target.value); setDetectedCoords(null); }}
                placeholder="e.g. Mumbai, India"
                className="bg-background/50"
                data-testid="input-venue-city"
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                disabled={detectingCity}
                onClick={() => void handleDetectCity()}
                title="Auto-detect my location"
                className="shrink-0"
              >
                {detectingCity ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LocateFixed className="w-4 h-4" />
                )}
              </Button>
            </div>
            {detectedCoords && (
              <p className="text-xs text-green-500 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500" />
                Exact location captured
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="venueAddress">Address</Label>
            <Input
              id="venueAddress"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="bg-background/50"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="venueDesc">Description</Label>
          <Textarea
            id="venueDesc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="bg-background/50"
          />
        </div>
        <Button
          type="submit"
          disabled={create.isPending || !name.trim()}
          data-testid="button-create-venue"
        >
          {create.isPending ? "Creating…" : "Create venue"}
        </Button>
      </form>
    </div>
  );
}
