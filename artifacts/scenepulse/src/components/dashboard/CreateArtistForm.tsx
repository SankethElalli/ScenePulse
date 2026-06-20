import { useState } from "react";
import {
  useCreateArtist,
  getGetMyArtistQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { LocateFixed, Loader2 } from "lucide-react";
import { detectCity, getCurrentCoords } from "@/lib/geo";

export function CreateArtistForm({
  profileId,
  defaultCity,
}: {
  profileId: string;
  defaultCity?: string | null;
}) {
  const create = useCreateArtist();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [artistName, setArtistName] = useState("");
  const [city, setCity] = useState(defaultCity ?? "");
  const [bio, setBio] = useState("");
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
    if (!artistName.trim()) return;
    create.mutate(
      {
        data: {
          profileId,
          artistName: artistName.trim(),
          city: city.trim() || undefined,
          bio: bio.trim() || undefined,
          // Pass exact coords if user granted location — backend will geocode city name as fallback
          latitude: detectedCoords?.lat,
          longitude: detectedCoords?.lng,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Artist profile created", description: "You'll appear on the map shortly." });
          void qc.invalidateQueries({ queryKey: getGetMyArtistQueryKey(profileId) });
        },
        onError: () =>
          toast({ title: "Could not create profile", variant: "destructive" }),
      },
    );
  };

  return (
    <div className="glass-card rounded-2xl p-6 max-w-xl">
      <h2 className="text-2xl font-semibold mb-1">Create your artist profile</h2>
      <p className="text-muted-foreground text-sm mb-5">
        Set up your public page so fans can find and follow you.
      </p>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="artistName">Artist / act name</Label>
          <Input
            id="artistName"
            value={artistName}
            onChange={(e) => setArtistName(e.target.value)}
            required
            className="bg-background/50"
            data-testid="input-artist-name"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="artistCity">
            City
            <span className="ml-1 text-xs text-muted-foreground">(used to place you on the map)</span>
          </Label>
          <div className="flex gap-2">
            <Input
              id="artistCity"
              value={city}
              onChange={(e) => { setCity(e.target.value); setDetectedCoords(null); }}
              placeholder="e.g. Bengaluru, India"
              className="bg-background/50"
              data-testid="input-artist-city"
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
              Exact location captured — you'll appear precisely on the map
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="artistBio">Bio</Label>
          <Textarea
            id="artistBio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="bg-background/50"
          />
        </div>
        <Button
          type="submit"
          disabled={create.isPending || !artistName.trim()}
          data-testid="button-create-artist"
        >
          {create.isPending ? "Creating…" : "Create profile"}
        </Button>
      </form>
    </div>
  );
}
