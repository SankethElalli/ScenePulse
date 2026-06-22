import { useState, useRef } from "react";
import { Fingerprint, Search, X, MapPin, Loader2, Music2, AlertCircle, BookOpen, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface MxTrack {
  trackId: number;
  trackName: string;
  artistName: string;
  albumName: string;
  hasLyrics: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onFindOnMap: (artistName: string) => void;
}

interface LyricsModal {
  track: MxTrack;
  lyricsBody: string;
  copyright: string;
}

export function FingerprintPanel({ open, onClose, onFindOnMap }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MxTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [lyricsModal, setLyricsModal] = useState<LyricsModal | null>(null);
  const [lyricsLoading, setLyricsLoading] = useState<number | null>(null);
  const [lyricsError, setLyricsError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const tooShort = query.trim().length > 0 && query.trim().length < 10;

  const search = async () => {
    const q = query.trim();
    if (!q || q.length < 10) return;
    setLoading(true);
    setSearched(false);
    setError(null);
    setLyricsModal(null);
    try {
      const res = await fetch(`/api/musixmatch/fingerprint?q=${encodeURIComponent(q)}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? `Server error ${res.status}`);
      }
      const data = (await res.json()) as { tracks: MxTrack[] };
      setResults(data.tracks ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
      setResults([]);
    }
    setLoading(false);
    setSearched(true);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") search();
  };

  const handleShowLyrics = async (track: MxTrack) => {
    setLyricsLoading(track.trackId);
    setLyricsError(null);
    try {
      const params = new URLSearchParams({
        trackId: String(track.trackId),
        trackName: track.trackName,
        artistName: track.artistName,
      });
      const res = await fetch(`/api/musixmatch/lyrics?${params}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? "Lyrics not available");
      }
      const data = await res.json() as { lyricsBody: string; copyright: string };
      setLyricsModal({ track, lyricsBody: data.lyricsBody, copyright: data.copyright });
    } catch (e) {
      setLyricsError(e instanceof Error ? e.message : "Could not load lyrics");
    } finally {
      setLyricsLoading(null);
    }
  };

  if (!open) return null;

  // ── Lyrics modal ──────────────────────────────────────────────────────────
  if (lyricsModal) {
    return (
      <>
        <div className="fixed inset-0 z-[9000] bg-black/60 backdrop-blur-sm" onClick={() => setLyricsModal(null)} />
        <div className="fixed inset-x-0 bottom-0 z-[9001] flex justify-center pointer-events-none">
          <div className="pointer-events-auto w-full max-w-lg rounded-t-3xl glass border border-white/10 shadow-2xl flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="px-5 pt-4 pb-3 flex items-start gap-3 shrink-0 border-b border-white/10">
              <button
                onClick={() => setLyricsModal(null)}
                className="mt-0.5 rounded-full p-1 text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{lyricsModal.track.trackName}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {lyricsModal.track.artistName}
                  {lyricsModal.track.albumName ? ` · ${lyricsModal.track.albumName}` : ""}
                </p>
              </div>
              <button
                onClick={onClose}
                className="mt-0.5 rounded-full p-1 text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Lyrics body */}
            <div className="overflow-y-auto flex-1 px-5 py-5">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/90">
                {lyricsModal.lyricsBody.replace(/\*{3,}.*$/s, "").trim()}
              </pre>
              {lyricsModal.copyright && (
                <p className="mt-6 text-[10px] text-muted-foreground/50 leading-snug">
                  {lyricsModal.copyright}
                </p>
              )}
            </div>

            {/* Footer — find on map */}
            <div className="px-5 py-4 border-t border-white/10 shrink-0 flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">Lyrics via Musixmatch</p>
              <Button
                size="sm"
                className="gap-1.5 rounded-xl bg-primary text-primary-foreground"
                onClick={() => { onFindOnMap(lyricsModal.track.artistName); onClose(); }}
              >
                <MapPin className="h-3.5 w-3.5" />
                Find on map
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── Search panel ──────────────────────────────────────────────────────────
  return (
    <>
      <div className="fixed inset-0 z-[9000] bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed bottom-0 inset-x-0 z-[9001] flex justify-center pointer-events-none">
        <div className="pointer-events-auto w-full max-w-lg rounded-t-3xl glass border border-white/10 shadow-2xl px-5 pt-4 pb-safe-bottom pb-8">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />

          <div className="flex items-center gap-3 mb-1">
            <Fingerprint className="h-5 w-5 text-primary shrink-0" />
            <h3 className="font-bold text-base text-foreground">Lyrics Fingerprint</h3>
            <button
              onClick={onClose}
              className="ml-auto rounded-full p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mb-4 ml-8">
            Heard something live? Type <strong>8+ distinctive words</strong> you caught to identify the song.
          </p>

          <div className="flex gap-2 mb-1">
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKey}
              placeholder="e.g. 'keep bleeding keep bleeding love tonight'"
              className="flex-1 rounded-xl bg-white/5 border-white/10 placeholder:text-muted-foreground/50"
              autoFocus
            />
            <Button
              onClick={search}
              disabled={loading || tooShort || !query.trim()}
              className="rounded-xl bg-primary text-primary-foreground shrink-0"
              size="icon"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {tooShort && (
            <p className="text-[11px] text-amber-400/80 ml-1 mb-3">
              Type at least 8 distinctive words for an accurate match
            </p>
          )}
          {!tooShort && <div className="mb-4" />}

          {!searched && !loading && (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <Music2 className="h-8 w-8 text-white/20" />
              <p className="text-xs text-muted-foreground">
                Unique phrases work best — avoid very common words
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive mb-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {lyricsError && (
            <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive mb-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {lyricsError}
            </div>
          )}

          {searched && !error && results.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-6">
              No matches — try more distinctive words or a longer phrase
            </p>
          )}

          {results.length > 0 && (
            <div className="flex flex-col gap-2">
              {results.map((track) => (
                <div
                  key={track.trackId}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border border-white/10 glass px-3 py-2.5",
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {track.trackName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {track.artistName}
                      {track.albumName ? ` · ${track.albumName}` : ""}
                    </p>
                  </div>
                  {track.hasLyrics ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={lyricsLoading === track.trackId}
                      className="shrink-0 text-primary hover:text-primary hover:bg-primary/10 gap-1.5 rounded-lg h-8 px-2.5"
                      onClick={() => handleShowLyrics(track)}
                    >
                      {lyricsLoading === track.trackId
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <BookOpen className="h-3.5 w-3.5" />
                      }
                      <span className="text-xs">
                        {lyricsLoading === track.trackId ? "Loading…" : "Show"}
                      </span>
                    </Button>
                  ) : (
                    <span className="shrink-0 text-xs text-muted-foreground/50 px-2">
                      No lyrics
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
