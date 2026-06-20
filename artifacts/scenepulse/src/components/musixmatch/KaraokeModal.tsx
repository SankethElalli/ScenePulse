import { useState, useEffect, useRef, useCallback } from "react";
import { X, Play, Pause, Music2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface MxTrack {
  trackId: number;
  trackName: string;
  artistName: string;
  albumName: string;
  hasSubtitles: boolean;
  hasLyrics: boolean;
}

interface LyricsData {
  track: MxTrack;
  synced: { lrc: string; durationSeconds: number } | null;
  plain: { lyricsBody: string; copyright: string } | null;
}

interface LyricLine {
  time: number;
  text: string;
}

function parseLrc(lrc: string): LyricLine[] {
  const lines: LyricLine[] = [];
  for (const raw of lrc.split("\n")) {
    const m = raw.match(/\[(\d{1,2}):(\d{2}(?:\.\d+)?)\](.*)/);
    if (!m) continue;
    const text = m[3].trim();
    if (!text) continue;
    lines.push({ time: parseInt(m[1], 10) * 60 + parseFloat(m[2]), text });
  }
  return lines.sort((a, b) => a.time - b.time);
}

function splitPlain(plain: string): LyricLine[] {
  return plain
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("...") && !l.startsWith("*"))
    .slice(0, 40)
    .map((text, i) => ({ time: i * 3.5, text }));
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
}

interface Props {
  artistName: string;
  artistImageUrl?: string | null;
  onClose: () => void;
}

export function KaraokeModal({ artistName, artistImageUrl, onClose }: Props) {
  const [data, setData] = useState<LyricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playhead, setPlayhead] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setLoading(true);
    setFetchError(null);
    fetch(`/api/musixmatch/synced-lyrics?artist=${encodeURIComponent(artistName)}`)
      .then((r) => r.json())
      .then((d: LyricsData & { error?: string }) => {
        if (d.error) setFetchError(d.error);
        else setData(d);
        setLoading(false);
      })
      .catch(() => {
        setFetchError("Could not connect to lyrics service");
        setLoading(false);
      });
  }, [artistName]);

  const lyrics: LyricLine[] = data
    ? data.synced
      ? parseLrc(data.synced.lrc)
      : data.plain
        ? splitPlain(data.plain.lyricsBody)
        : []
    : [];

  const isSynced = Boolean(data?.synced);
  const duration = data?.synced?.durationSeconds ?? lyrics.length * 3.5;

  const currentIdx = lyrics.length
    ? isSynced
      ? lyrics.reduce((best, line, i) => (line.time <= playhead ? i : best), 0)
      : Math.min(Math.floor(playhead / 3.5), lyrics.length - 1)
    : 0;

  useEffect(() => {
    if (!isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setPlayhead((p) => {
        if (duration > 0 && p >= duration) {
          setIsPlaying(false);
          return 0;
        }
        return p + 0.1;
      });
    }, 100);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying, duration]);

  const toggle = useCallback(() => setIsPlaying((p) => !p), []);

  const progressPct = duration > 0 ? Math.min((playhead / duration) * 100, 100) : 0;

  const ytQuery = data?.track
    ? `${data.track.trackName} ${data.track.artistName}`
    : artistName;
  const spotifyQuery = data?.track
    ? `${data.track.trackName} ${data.track.artistName}`
    : artistName;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {artistImageUrl ? (
        <div
          className="absolute inset-0 scale-110"
          style={{
            backgroundImage: `url('${artistImageUrl}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(24px) brightness(0.2)",
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0533] via-[#0b1540] to-[#001a1a]" />
      )}
      <div className="absolute inset-0 bg-black/60" />

      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 rounded-full glass border border-white/20 p-2 text-white/60 hover:text-white transition-colors"
        aria-label="Close lyrics"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="relative z-10 flex flex-col items-center gap-4 w-full max-w-lg px-6 py-8">

        {/* Track info */}
        <div className="text-center">
          {data?.track ? (
            <>
              <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] mb-1">
                Synced Lyrics
              </p>
              <h2 className="text-white font-bold text-lg sm:text-2xl leading-tight">
                {data.track.trackName}
              </h2>
              <p className="text-white/50 text-sm mt-0.5">{data.track.artistName}</p>
              {data.track.albumName && (
                <p className="text-white/30 text-xs mt-0.5">{data.track.albumName}</p>
              )}
            </>
          ) : (
            <h2 className="text-white font-bold text-xl">{artistName}</h2>
          )}
        </div>

        {/* Listen on external platforms */}
        {!loading && !fetchError && data?.track && (
          <div className="flex items-center gap-2">
            <span className="text-white/30 text-[10px] uppercase tracking-wider">Listen on</span>
            <a
              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(ytQuery)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            >
              <ExternalLink className="h-2.5 w-2.5" />
              YouTube
            </a>
            <a
              href={`https://open.spotify.com/search/${encodeURIComponent(spotifyQuery)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            >
              <ExternalLink className="h-2.5 w-2.5" />
              Spotify
            </a>
          </div>
        )}

        {/* Tip when not yet playing */}
        {!loading && !fetchError && lyrics.length > 0 && !isPlaying && playhead === 0 && (
          <p className="text-white/30 text-xs text-center">
            Open the song on YouTube or Spotify, then tap ▶ to follow along
          </p>
        )}

        {/* Lyrics window */}
        <div className="h-56 sm:h-64 w-full flex flex-col items-center justify-center gap-3 sm:gap-4 text-center select-none">
          {loading && (
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-2 w-2 rounded-full bg-white/50 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          )}
          {!loading && fetchError && (
            <div className="flex flex-col items-center gap-3">
              <Music2 className="h-10 w-10 text-white/20" />
              <p className="text-white/40 text-sm">{fetchError}</p>
            </div>
          )}
          {!loading && !fetchError && lyrics.length === 0 && (
            <div className="flex flex-col items-center gap-3">
              <Music2 className="h-10 w-10 text-white/20" />
              <p className="text-white/40 text-sm">No lyrics found for this artist</p>
            </div>
          )}
          {!loading && !fetchError && lyrics.length > 0 &&
            Array.from({ length: 7 }, (_, offset) => {
              const idx = currentIdx - 3 + offset;
              const diff = offset - 3;
              const line = lyrics[idx];
              return (
                <div
                  key={offset}
                  className={cn(
                    "transition-all duration-500 ease-in-out leading-snug px-4 max-w-full",
                    diff === 0
                      ? "text-white font-bold text-lg sm:text-2xl drop-shadow-[0_0_24px_rgba(255,255,255,0.6)]"
                      : Math.abs(diff) === 1
                        ? "text-white/55 text-sm sm:text-base"
                        : Math.abs(diff) === 2
                          ? "text-white/25 text-xs sm:text-sm"
                          : "text-white/10 text-xs",
                  )}
                >
                  {line?.text ?? "\u00A0"}
                </div>
              );
            })
          }
        </div>

        {/* Playback controls */}
        {!loading && !fetchError && lyrics.length > 0 && (
          <div className="w-full flex flex-col items-center gap-3">
            <div
              className="w-full h-1 bg-white/15 rounded-full overflow-hidden cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pct = (e.clientX - rect.left) / rect.width;
                setPlayhead(pct * duration);
              }}
            >
              <div
                className="h-full bg-gradient-to-r from-primary to-secondary transition-none"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="flex items-center gap-5">
              <span className="text-white/30 text-xs w-9 text-right tabular-nums">
                {formatTime(playhead)}
              </span>
              <button
                onClick={toggle}
                className="h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-colors active:scale-95"
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
              </button>
              <span className="text-white/30 text-xs w-9 tabular-nums">
                {formatTime(duration)}
              </span>
            </div>
          </div>
        )}

        <p className="text-white/20 text-[9px] tracking-widest uppercase">
          Lyrics · Musixmatch
        </p>
      </div>
    </div>
  );
}
