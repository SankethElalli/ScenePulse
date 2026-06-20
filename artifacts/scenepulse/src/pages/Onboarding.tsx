import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/auth";
import {
  useGetProfile,
  useUpsertProfile,
  useCreateArtist,
  getGetProfileQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Music2, MapPin, User, ArrowRight, CheckCircle2, X, Loader2, Navigation } from "lucide-react";

type ProfileRole = "fan" | "artist" | "venue";

const GENRE_SUGGESTIONS = [
  "Hip-Hop", "R&B", "Pop", "Rock", "Indie", "Electronic", "Jazz",
  "Soul", "Folk", "Metal", "Classical", "Reggae", "Blues", "Punk",
  "Lo-fi", "Ambient", "Trap", "Drill", "Afrobeats", "Latin",
];

function GenreInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [input, setInput] = useState("");

  const add = (genre: string) => {
    const g = genre.trim();
    if (g && !value.includes(g)) onChange([...value, g]);
    setInput("");
  };

  const remove = (genre: string) => onChange(value.filter((v) => v !== genre));

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && input.trim()) {
      e.preventDefault();
      add(input);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 min-h-[32px]">
        {value.map((g) => (
          <span
            key={g}
            className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/15 text-primary text-xs font-medium"
          >
            {g}
            <button type="button" onClick={() => remove(g)}>
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
      </div>
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKey}
        onBlur={() => { if (input.trim()) add(input); }}
        placeholder="Type a genre and press Enter…"
        className="bg-background/50"
      />
      <div className="flex flex-wrap gap-1">
        {GENRE_SUGGESTIONS.filter((g) => !value.includes(g)).slice(0, 10).map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => add(g)}
            className="px-2 py-0.5 rounded-full border border-white/10 text-[11px] text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
          >
            {g}
          </button>
        ))}
      </div>
    </div>
  );
}

function LocateButton({
  locationName,
  onLocated,
  onClear,
}: {
  locationName: string;
  onLocated: (name: string, lat: number, lng: number) => void;
  onClear: () => void;
}) {
  const { toast } = useToast();
  const [locating, setLocating] = useState(false);

  const handleLocate = () => {
    if (!navigator.geolocation) {
      toast({ title: "Geolocation not supported by your browser", variant: "destructive" });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const addr = data.address ?? {};
          const city =
            addr.city || addr.town || addr.suburb || addr.village || addr.county || "";
          const country = addr.country || "";
          const name = city ? `${city}, ${country}` : (data.display_name ?? "Location found");
          onLocated(name, lat, lng);
        } catch {
          onLocated("Location found", lat, lng);
        }
        setLocating(false);
      },
      () => {
        setLocating(false);
        toast({
          title: "Location access denied",
          description: "Please allow location access in your browser to continue.",
          variant: "destructive",
        });
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  if (locationName) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-xl border border-primary/30 bg-primary/5">
        <MapPin className="h-4 w-4 text-primary shrink-0" />
        <span className="text-sm flex-1 font-medium">{locationName}</span>
        <button
          type="button"
          onClick={onClear}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Clear location"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full h-11 gap-2 border-white/10 bg-background/50 hover:bg-background/80 hover:border-primary/40"
      onClick={handleLocate}
      disabled={locating}
    >
      {locating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Navigation className="h-4 w-4" />
      )}
      {locating ? "Locating…" : "Locate me"}
    </Button>
  );
}

export default function Onboarding() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile } = useGetProfile(user?.id ?? "", {
    query: { enabled: !!user?.id, queryKey: getGetProfileQueryKey(user?.id ?? "") },
  });
  const upsertProfile = useUpsertProfile();
  const createArtist = useCreateArtist();

  // Step 1 state
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<ProfileRole>("fan");
  const [locationName, setLocationName] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  // Step 2 state (artist profile)
  const [artistName, setArtistName] = useState("");
  const [artistLocationName, setArtistLocationName] = useState("");
  const [artistLatitude, setArtistLatitude] = useState<number | null>(null);
  const [artistLongitude, setArtistLongitude] = useState<number | null>(null);
  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [bio, setBio] = useState("");
  const [genres, setGenres] = useState<string[]>([]);
  const [instagramUrl, setInstagramUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");

  useEffect(() => {
    const googleName = user?.user_metadata?.full_name as string | undefined;
    setDisplayName((v) => v || profile?.displayName || googleName || "");
    if (profile?.city && !locationName) setLocationName(profile.city);
    if (profile?.role) setRole(profile.role as ProfileRole);
  }, [profile, user]);

  const handleLocated = (name: string, lat: number, lng: number) => {
    setLocationName(name);
    setLatitude(lat);
    setLongitude(lng);
  };

  const handleArtistLocated = (name: string, lat: number, lng: number) => {
    setArtistLocationName(name);
    setArtistLatitude(lat);
    setArtistLongitude(lng);
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    if (!locationName) {
      toast({ title: "Location required", description: "Please tap Locate me to set your location.", variant: "destructive" });
      return;
    }
    try {
      await upsertProfile.mutateAsync({
        data: {
          id: user.id,
          email: user.email ?? profile?.email ?? "",
          role,
          displayName,
          city: locationName,
        },
      });
      queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey(user.id) });

      if (role === "artist") {
        setArtistName((v) => v || displayName);
        setArtistLocationName((v) => v || locationName);
        if (latitude) setArtistLatitude(latitude);
        if (longitude) setArtistLongitude(longitude);
        setStep(2);
      } else {
        toast({ title: "You're all set!", description: "Welcome to ScenePulse." });
        setLocation("/");
      }
    } catch (err: any) {
      toast({ title: "Could not save", description: err?.message || "Please try again.", variant: "destructive" });
    }
  };

  const saveArtist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    if (!artistLocationName) {
      toast({ title: "Location required", description: "Please tap Locate me to set your location.", variant: "destructive" });
      return;
    }
    try {
      await createArtist.mutateAsync({
        data: {
          profileId: user.id,
          artistName: artistName.trim(),
          city: artistLocationName || undefined,
          latitude: artistLatitude ?? undefined,
          longitude: artistLongitude ?? undefined,
          bio: bio.trim() || undefined,
          genres: genres.length ? genres : undefined,
          spotifyUrl: spotifyUrl.trim() || undefined,
          instagramUrl: instagramUrl.trim() || undefined,
          youtubeUrl: youtubeUrl.trim() || undefined,
          websiteUrl: websiteUrl.trim() || undefined,
        },
      });
      toast({ title: "Artist profile created!", description: "You're now on the ScenePulse map." });
      setLocation("/");
    } catch (err: any) {
      toast({ title: "Could not create artist", description: err?.message || "Please try again.", variant: "destructive" });
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-lg">

        {/* Progress */}
        {role === "artist" && (
          <div className="flex items-center gap-2 mb-6 justify-center">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all",
                  step > s
                    ? "bg-primary border-primary text-primary-foreground"
                    : step === s
                      ? "border-primary text-primary"
                      : "border-white/20 text-white/30",
                )}>
                  {step > s ? <CheckCircle2 className="h-4 w-4" /> : s}
                </div>
                {s < 2 && <div className={cn("w-12 h-0.5 rounded-full transition-all", step > s ? "bg-primary" : "bg-white/10")} />}
              </div>
            ))}
          </div>
        )}

        <div className="glass-card p-8 rounded-3xl">

          {/* ── Step 1 ── */}
          {step === 1 && (
            <>
              <div className="text-center mb-8">
                <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-4">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-3xl font-bold">Set up your profile</h1>
                <p className="text-muted-foreground mt-2 text-sm">
                  Tell us who you are and where you're based.
                </p>
              </div>

              <form onSubmit={saveProfile} className="space-y-5">
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
                  <Label>
                    <MapPin className="inline h-3.5 w-3.5 mr-1 text-muted-foreground" />
                    Your Location <span className="text-destructive">*</span>
                  </Label>
                  <LocateButton
                    locationName={locationName}
                    onLocated={handleLocated}
                    onClear={() => { setLocationName(""); setLatitude(null); setLongitude(null); }}
                  />
                  {!locationName && (
                    <p className="text-[11px] text-muted-foreground">
                      We use your location to show you nearby artists, venues and events.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">I am a…</Label>
                  <Select value={role} onValueChange={(v) => setRole(v as ProfileRole)}>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fan">Fan — discover local music</SelectItem>
                      <SelectItem value="artist">Artist — get on the map</SelectItem>
                      <SelectItem value="venue">Venue — list your space</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {role === "artist" && (
                  <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary/80 flex items-start gap-2">
                    <Music2 className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                    Next you'll set up your artist profile — Spotify link, genres, bio — so fans can find you on the map.
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={upsertProfile.isPending || !locationName}
                >
                  {upsertProfile.isPending
                    ? "Saving…"
                    : role === "artist"
                      ? (<>Next <ArrowRight className="ml-1.5 h-4 w-4" /></>)
                      : "Get started"}
                </Button>
              </form>
            </>
          )}

          {/* ── Step 2: Artist profile ── */}
          {step === 2 && (
            <>
              <div className="text-center mb-8">
                <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-4">
                  <Music2 className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold">Your artist profile</h1>
                <p className="text-muted-foreground mt-2 text-sm">
                  This is what fans and venues see when they click your pin on the map.
                </p>
              </div>

              <form onSubmit={saveArtist} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="artistName">Artist / Band name <span className="text-destructive">*</span></Label>
                  <Input
                    id="artistName"
                    placeholder="Stage name or band name"
                    value={artistName}
                    onChange={(e) => setArtistName(e.target.value)}
                    required
                    className="bg-background/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    <MapPin className="inline h-3.5 w-3.5 mr-1 text-muted-foreground" />
                    Based in <span className="text-destructive">*</span>
                  </Label>
                  <LocateButton
                    locationName={artistLocationName}
                    onLocated={handleArtistLocated}
                    onClear={() => { setArtistLocationName(""); setArtistLatitude(null); setArtistLongitude(null); }}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Genres</Label>
                  <GenreInput value={genres} onChange={setGenres} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="spotifyUrl">
                    <svg viewBox="0 0 24 24" className="inline h-3.5 w-3.5 mr-1 fill-[#1DB954]"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.5 17.3a.75.75 0 0 1-1.03.247c-2.82-1.722-6.37-2.11-10.55-1.157a.75.75 0 1 1-.334-1.462c4.575-1.043 8.504-.594 11.67 1.339a.75.75 0 0 1 .244 1.033zm1.47-3.27a.94.94 0 0 1-1.29.31c-3.227-1.983-8.145-2.558-11.963-1.4a.938.938 0 0 1-.58-1.787c4.363-1.339 9.79-.69 13.52 1.587a.94.94 0 0 1 .313 1.29zm.127-3.403c-3.868-2.298-10.248-2.51-13.944-1.388a1.125 1.125 0 1 1-.653-2.154c4.243-1.287 11.296-1.038 15.753 1.605a1.125 1.125 0 0 1-1.156 1.937z"/></svg>
                    Spotify Artist URL
                  </Label>
                  <Input
                    id="spotifyUrl"
                    placeholder="https://open.spotify.com/artist/…"
                    value={spotifyUrl}
                    onChange={(e) => setSpotifyUrl(e.target.value)}
                    className="bg-background/50"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Paste from your Spotify profile → Share → Copy link.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio <span className="text-muted-foreground text-xs">(optional)</span></Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell fans and venues about your sound, influences, and what makes you unique…"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    className="bg-background/50 resize-none"
                  />
                </div>

                <details className="group">
                  <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground select-none list-none flex items-center gap-1">
                    <span className="text-xs border border-white/10 rounded px-1.5 py-0.5 group-open:rotate-90 inline-block transition-transform">▶</span>
                    Add social links (optional)
                  </summary>
                  <div className="mt-3 space-y-3 pl-1">
                    <div className="space-y-1">
                      <Label htmlFor="instagram" className="text-xs">Instagram URL</Label>
                      <Input id="instagram" placeholder="https://instagram.com/…" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} className="bg-background/50 h-8 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="youtube" className="text-xs">YouTube URL</Label>
                      <Input id="youtube" placeholder="https://youtube.com/…" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} className="bg-background/50 h-8 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="website" className="text-xs">Website</Label>
                      <Input id="website" placeholder="https://yoursite.com" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} className="bg-background/50 h-8 text-sm" />
                    </div>
                  </div>
                </details>

                <div className="flex gap-3 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex-1"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-2 flex-grow-[2]"
                    disabled={createArtist.isPending || !artistName.trim() || !artistLocationName}
                  >
                    {createArtist.isPending ? "Creating…" : "Put me on the map"}
                  </Button>
                </div>
              </form>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
