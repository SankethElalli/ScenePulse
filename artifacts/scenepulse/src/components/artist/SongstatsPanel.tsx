import { useEffect, useState } from "react";
import { TrendingUp, Music, Users, ListMusic, BarChart3, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SongstatsData {
  monthlyListeners: number | null;
  followersTotal: number | null;
  playlistReachCurrent: number | null;
  playlistsCurrent: number | null;
  popularity: number | null;
  streamsTotal: number | null;
}

function extractSpotifyId(spotifyUrl: string | null | undefined): string | null {
  if (!spotifyUrl) return null;
  const m = spotifyUrl.match(/open\.spotify\.com\/artist\/([A-Za-z0-9]{10,})/);
  return m?.[1] ?? null;
}

function fmt(n: number | null): string {
  if (n === null || n === undefined) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function PopularityBar({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted-foreground text-sm">—</span>;
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground tabular-nums w-6 text-right">{pct}</span>
    </div>
  );
}

const STAT_ITEMS = [
  { key: "monthlyListeners" as const, label: "Monthly Listeners", icon: Users, accent: "text-green-400" },
  { key: "followersTotal" as const, label: "Followers", icon: TrendingUp, accent: "text-blue-400" },
  { key: "playlistReachCurrent" as const, label: "Playlist Reach", icon: ListMusic, accent: "text-purple-400" },
  { key: "playlistsCurrent" as const, label: "On Playlists", icon: Music, accent: "text-pink-400" },
  { key: "streamsTotal" as const, label: "Total Streams", icon: BarChart3, accent: "text-amber-400" },
];

export function SongstatsPanel({ spotifyUrl }: { spotifyUrl: string | null | undefined }) {
  const spotifyId = extractSpotifyId(spotifyUrl);
  const [data, setData] = useState<SongstatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!spotifyId) return;
    setLoading(true);
    setError(false);
    fetch(`/api/songstats/artist-stats?spotifyArtistId=${spotifyId}`)
      .then((r) => {
        if (!r.ok) throw new Error("not ok");
        return r.json() as Promise<SongstatsData>;
      })
      .then((d) => {
        const hasAny = Object.values(d).some((v) => v !== null);
        if (!hasAny) { setError(true); } else { setData(d); }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [spotifyId]);

  if (!spotifyId) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#1DB954]/15">
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#1DB954]">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.5 17.3a.75.75 0 0 1-1.03.247c-2.82-1.722-6.37-2.11-10.55-1.157a.75.75 0 1 1-.334-1.462c4.575-1.043 8.504-.594 11.67 1.339a.75.75 0 0 1 .244 1.033zm1.47-3.27a.94.94 0 0 1-1.29.31c-3.227-1.983-8.145-2.558-11.963-1.4a.938.938 0 0 1-.58-1.787c4.363-1.339 9.79-.69 13.52 1.587a.94.94 0 0 1 .313 1.29zm.127-3.403c-3.868-2.298-10.248-2.51-13.944-1.388a1.125 1.125 0 1 1-.653-2.154c4.243-1.287 11.296-1.038 15.753 1.605a1.125 1.125 0 0 1-1.156 1.937z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold">Streaming Traction</h2>
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#1DB954]/70 bg-[#1DB954]/10 rounded-md px-2 py-0.5">
          Spotify via Songstats
        </span>
      </div>

      {loading && (
        <div className="glass-card rounded-2xl p-6 flex items-center gap-3 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span className="text-sm">Fetching live streaming data…</span>
        </div>
      )}

      {!loading && error && (
        <div className="glass-card rounded-2xl p-5 text-sm text-muted-foreground border border-white/5">
          No streaming data available for this artist yet.
        </div>
      )}

      {!loading && data && (
        <div className="glass-card rounded-2xl overflow-hidden">
          {/* Popularity bar at top */}
          {data.popularity !== null && (
            <div className="px-5 pt-5 pb-3 border-b border-white/5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Spotify Popularity Score
              </p>
              <PopularityBar value={data.popularity} />
            </div>
          )}

          {/* Stat grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-white/5">
            {STAT_ITEMS.filter((s) => s.key !== "streamsTotal" || data.streamsTotal !== null).map((s) => {
              const Icon = s.icon;
              const val = data[s.key];
              return (
                <div key={s.key} className="bg-background/60 px-4 py-4 flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <Icon className={cn("w-3.5 h-3.5 shrink-0", s.accent)} />
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {s.label}
                    </span>
                  </div>
                  <span className={cn("text-2xl font-bold tabular-nums", val === null ? "text-muted-foreground/40" : "text-foreground")}>
                    {fmt(val)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
