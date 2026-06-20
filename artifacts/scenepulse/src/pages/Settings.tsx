import {
  useGetProfile,
  useGetMyArtist,
  useUpdateArtist,
  getGetProfileQueryKey,
  getGetMyArtistQueryKey,
  getGetArtistProfileQueryKey,
  getGetMapPinsQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/contexts/auth";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Camera, Globe, ImagePlus, Instagram, Loader2, LocateFixed, Music2, Link2, User, X, Youtube } from "lucide-react";
import { uploadFile } from "@/lib/storage";
import { detectCity, getCurrentCoords } from "@/lib/geo";
import { Link } from "wouter";

const GENRE_SUGGESTIONS = [
  "Hip-Hop", "R&B", "Pop", "Rock", "Indie", "Electronic", "Jazz",
  "Soul", "Folk", "Metal", "Classical", "Reggae", "Blues", "Punk",
  "Lo-fi", "Ambient", "Trap", "Drill", "Afrobeats", "Latin",
];

function GenreInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState("");
  const add = (g: string) => {
    const t = g.trim();
    if (t && !value.includes(t)) onChange([...value, t]);
    setInput("");
  };
  const remove = (g: string) => onChange(value.filter((v) => v !== g));
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
          <span key={g} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/15 text-primary text-xs font-medium">
            {g}
            <button type="button" onClick={() => remove(g)} className="hover:text-primary/60">
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
      <div className="flex flex-wrap gap-1.5 pt-0.5">
        {GENRE_SUGGESTIONS.filter((g) => !value.includes(g)).slice(0, 12).map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => add(g)}
            className="px-2.5 py-0.5 rounded-full border border-white/10 text-[11px] text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
          >
            {g}
          </button>
        ))}
      </div>
    </div>
  );
}

function SectionHeading({ icon: Icon, title, description }: { icon: typeof User; title: string; description?: string }) {
  return (
    <div className="flex items-center gap-3 pb-4 border-b border-white/5">
      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
    </div>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const artistImageInputRef = useRef<HTMLInputElement>(null);
  const [artistImageUploading, setArtistImageUploading] = useState(false);

  const { data: profile, isLoading } = useGetProfile(user?.id ?? "", {
    query: { enabled: !!user?.id, queryKey: getGetProfileQueryKey(user?.id ?? "") },
  });

  const isArtist = profile?.role === "artist";

  const { data: myArtist } = useGetMyArtist(user?.id ?? "", {
    query: { enabled: !!user?.id && isArtist, retry: false, retryOnMount: false },
  });

  const updateArtist = useUpdateArtist();

  const [artistName, setArtistName] = useState("");
  const [artistCity, setArtistCity] = useState("");
  const [artistBio, setArtistBio] = useState("");
  const [genres, setGenres] = useState<string[]>([]);
  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [artistWebsiteUrl, setArtistWebsiteUrl] = useState("");
  const [artistImageUrl, setArtistImageUrl] = useState("");
  const [detectingCity, setDetectingCity] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (myArtist && !initialized.current) {
      initialized.current = true;
      setArtistName(myArtist.artistName ?? "");
      setArtistCity(myArtist.city ?? "");
      setArtistBio(myArtist.bio ?? "");
      setGenres(myArtist.genres ?? []);
      setSpotifyUrl(myArtist.spotifyUrl ?? "");
      setInstagramUrl(myArtist.instagramUrl ?? "");
      setYoutubeUrl(myArtist.youtubeUrl ?? "");
      setArtistWebsiteUrl(myArtist.websiteUrl ?? "");
      setArtistImageUrl(myArtist.imageUrl ?? "");
    }
  }, [myArtist]);

  const handleDetectCity = async () => {
    setDetectingCity(true);
    try {
      const [cityResult] = await Promise.all([detectCity(), getCurrentCoords()]);
      if (cityResult) setArtistCity(cityResult);
      else toast({ title: "Could not detect location", description: "Allow location access and try again.", variant: "destructive" });
    } finally {
      setDetectingCity(false);
    }
  };

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setArtistImageUploading(true);
    try {
      const url = await uploadFile("Profile", file);
      setArtistImageUrl(url);
      toast({ title: "Photo uploaded — save to apply" });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setArtistImageUploading(false);
    }
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!myArtist?.id) return;
    updateArtist.mutate(
      {
        id: myArtist.id,
        data: {
          artistName: artistName.trim() || undefined,
          city: artistCity.trim() || undefined,
          bio: artistBio.trim() || undefined,
          genres,
          imageUrl: artistImageUrl.trim() || undefined,
          spotifyUrl: spotifyUrl.trim() || undefined,
          instagramUrl: instagramUrl.trim() || undefined,
          youtubeUrl: youtubeUrl.trim() || undefined,
          websiteUrl: artistWebsiteUrl.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: getGetMyArtistQueryKey(user!.id) });
          void queryClient.invalidateQueries({ queryKey: getGetArtistProfileQueryKey(myArtist.id) });
          void queryClient.invalidateQueries({ queryKey: getGetMapPinsQueryKey() });
          toast({ title: "Profile saved" });
        },
        onError: () => toast({ title: "Failed to save", variant: "destructive" }),
      },
    );
  };

  if (isLoading)
    return <div className="flex-1 flex items-center justify-center">Loading…</div>;

  if (!isArtist) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-4xl font-bold mb-8">Settings</h1>
        <div className="glass-card p-8 rounded-3xl text-center space-y-3">
          <User className="w-10 h-10 text-muted-foreground/40 mx-auto" />
          <p className="text-muted-foreground text-sm">Artist settings will appear here once you have an artist profile.</p>
        </div>
      </div>
    );
  }

  if (!myArtist) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-4xl font-bold mb-8">Settings</h1>
        <div className="glass-card p-8 rounded-3xl text-center space-y-3">
          <User className="w-10 h-10 text-muted-foreground/40 mx-auto" />
          <p className="text-muted-foreground text-sm">
            Set up your artist profile from the{" "}
            <Link href="/dashboard" className="text-primary underline">Dashboard</Link>{" "}
            first, then come back here to edit it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-4xl font-bold mb-2">Settings</h1>
      <p className="text-muted-foreground mb-8 text-sm">Manage your artist profile — changes apply to your map pin and public page.</p>

      <form onSubmit={save} className="space-y-4">

        {/* Photo + name hero */}
        <div className="glass-card rounded-3xl p-6">
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 rounded-2xl bg-muted overflow-hidden border-2 border-primary/20 flex items-center justify-center">
                {artistImageUrl ? (
                  <img src={artistImageUrl} alt="Artist photo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-muted-foreground/30">
                    {artistName.charAt(0) || "A"}
                  </span>
                )}
                {artistImageUploading && (
                  <div className="absolute inset-0 rounded-2xl bg-black/60 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => artistImageInputRef.current?.click()}
                disabled={artistImageUploading}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input ref={artistImageInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => void handleImageFile(e)} />
            </div>

            {/* Name + photo action */}
            <div className="flex-1 min-w-0">
              <Input
                value={artistName}
                onChange={(e) => setArtistName(e.target.value)}
                placeholder="Artist / Band name"
                className="bg-transparent border-none text-2xl font-bold px-2 h-auto py-1 focus-visible:ring-0 placeholder:text-muted-foreground/40"
              />
              <button
                type="button"
                onClick={() => artistImageInputRef.current?.click()}
                disabled={artistImageUploading}
                className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 mt-3 ml-2 disabled:opacity-50"
              >
                <ImagePlus className="w-3 h-3" />
                {artistImageUploading ? "Uploading…" : "Change photo"}
              </button>
            </div>
          </div>
        </div>

        {/* Identity */}
        <div className="glass-card rounded-3xl p-6 space-y-5">
          <SectionHeading icon={User} title="Identity" description="Basic info shown on your public profile and map pin" />

          <div className="flex gap-2">
            <Input
              value={artistCity}
              onChange={(e) => setArtistCity(e.target.value)}
              placeholder="City you're based in — e.g. Bengaluru, India"
              className="bg-background/50"
            />
            <Button type="button" size="icon" variant="outline" disabled={detectingCity}
              onClick={() => void handleDetectCity()} title="Auto-detect location" className="shrink-0">
              {detectingCity ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
            </Button>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Bio</label>
            <Textarea
              value={artistBio}
              onChange={(e) => setArtistBio(e.target.value)}
              placeholder="Tell fans and venues about your sound, influences, and what makes you unique…"
              className="resize-none min-h-[110px] bg-background/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Genres</label>
            <GenreInput value={genres} onChange={setGenres} />
          </div>
        </div>

        {/* Music */}
        <div className="glass-card rounded-3xl p-6 space-y-5">
          <SectionHeading icon={Music2} title="Music" description="Your Spotify link powers traction on the heatmap" />

          <div className="space-y-1.5">
            <label className="text-sm font-medium flex items-center gap-1.5 text-muted-foreground">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-[#1DB954] shrink-0"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.5 17.3a.75.75 0 0 1-1.03.247c-2.82-1.722-6.37-2.11-10.55-1.157a.75.75 0 1 1-.334-1.462c4.575-1.043 8.504-.594 11.67 1.339a.75.75 0 0 1 .244 1.033zm1.47-3.27a.94.94 0 0 1-1.29.31c-3.227-1.983-8.145-2.558-11.963-1.4a.938.938 0 0 1-.58-1.787c4.363-1.339 9.79-.69 13.52 1.587a.94.94 0 0 1 .313 1.29zm.127-3.403c-3.868-2.298-10.248-2.51-13.944-1.388a1.125 1.125 0 1 1-.653-2.154c4.243-1.287 11.296-1.038 15.753 1.605a1.125 1.125 0 0 1-1.156 1.937z"/></svg>
              Spotify Artist URL
            </label>
            <Input
              value={spotifyUrl}
              onChange={(e) => setSpotifyUrl(e.target.value)}
              placeholder="https://open.spotify.com/artist/…"
              className="bg-background/50"
            />
            <p className="text-[11px] text-muted-foreground">Open Spotify → your profile → Share → Copy link to artist.</p>
          </div>
        </div>

        {/* Links */}
        <div className="glass-card rounded-3xl p-6 space-y-5">
          <SectionHeading icon={Link2} title="Links" description="Social and web presence — clear a field to remove it" />

          <div className="space-y-3">
            {([
              { icon: Instagram, iconClass: "text-foreground", value: instagramUrl, set: setInstagramUrl, placeholder: "https://instagram.com/…" },
              { icon: Youtube,   iconClass: "text-foreground", value: youtubeUrl,   set: setYoutubeUrl,   placeholder: "https://youtube.com/…" },
              { icon: Globe,     iconClass: "text-foreground", value: artistWebsiteUrl, set: setArtistWebsiteUrl, placeholder: "https://yoursite.com" },
            ] as { icon: typeof Globe; iconClass: string; value: string; set: (v: string) => void; placeholder: string }[]).map(({ icon: Icon, iconClass, value, set, placeholder }) => (
              <div key={placeholder} className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
                  <Icon className={`w-4 h-4 ${iconClass}`} />
                </div>
                <Input
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  placeholder={placeholder}
                  className="bg-background/50 text-sm flex-1"
                />
                {value && (
                  <Button type="button" size="icon" variant="ghost" onClick={() => set("")} className="shrink-0 h-9 w-9">
                    <X className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Save */}
        <div className="flex justify-end pt-2 pb-8">
          <Button type="submit" size="lg" disabled={updateArtist.isPending} className="min-w-[140px]">
            {updateArtist.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</>
            ) : (
              "Save Profile"
            )}
          </Button>
        </div>

      </form>
    </div>
  );
}
