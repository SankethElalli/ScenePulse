const BASE = "https://api.songstats.com/enterprise/v1";

export interface SongstatsSpotifyStats {
  monthlyListeners: number | null;
  followersTotal: number | null;
  playlistReachCurrent: number | null;
  playlistsCurrent: number | null;
  popularity: number | null;
  streamsTotal: number | null;
}

async function ssGet(path: string, params: Record<string, string>): Promise<unknown> {
  const apiKey = process.env.SONGSTATS_API_KEY;
  if (!apiKey) throw new Error("SONGSTATS_API_KEY is not configured");

  const url = new URL(`${BASE}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString(), {
    headers: { apikey: apiKey },
  });
  if (!res.ok) throw new Error(`Songstats HTTP ${res.status}`);
  return res.json();
}

export async function fetchArtistStats(spotifyArtistId: string): Promise<SongstatsSpotifyStats> {
  const body = (await ssGet("/artists/stats", {
    spotify_artist_id: spotifyArtistId,
  })) as {
    result?: string;
    stats?: Array<{
      source: string;
      data: Record<string, number>;
    }>;
  };

  const spotifyData = body.stats?.find((s) => s.source === "spotify")?.data ?? {};

  return {
    monthlyListeners: spotifyData.monthly_listeners_current ?? null,
    followersTotal: spotifyData.followers_total ?? null,
    playlistReachCurrent: spotifyData.playlist_reach_current ?? null,
    playlistsCurrent: spotifyData.playlists_current ?? null,
    popularity: spotifyData.popularity_current ?? null,
    streamsTotal: spotifyData.streams_total ?? null,
  };
}
