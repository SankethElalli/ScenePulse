const BASE = "https://api.musixmatch.com/ws/1.1";

async function mxGet(
  method: string,
  params: Record<string, string | number>,
): Promise<unknown | null> {
  const apiKey = process.env.MUSIXMATCH_API_KEY;
  if (!apiKey) throw new Error("MUSIXMATCH_API_KEY is not configured");

  const url = new URL(`${BASE}/${method}`);
  url.searchParams.set("apikey", apiKey);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v));
  }

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Musixmatch HTTP ${res.status}`);

  const json = (await res.json()) as {
    message: { header: { status_code: number }; body: unknown };
  };
  const code = json.message?.header?.status_code;
  if (code === 404) return null;
  if (code !== 200) throw new Error(`Musixmatch API status ${code}`);
  return json.message.body;
}

export interface MxTrack {
  trackId: number;
  commontrackId: number;
  trackName: string;
  artistName: string;
  albumName: string;
  hasSubtitles: boolean;
  hasLyrics: boolean;
}

function parseTrack(t: Record<string, unknown>): MxTrack {
  return {
    trackId: t.track_id as number,
    commontrackId: t.commontrack_id as number,
    trackName: (t.track_name as string) ?? "",
    artistName: (t.artist_name as string) ?? "",
    albumName: (t.album_name as string) ?? "",
    hasSubtitles: t.has_subtitles === 1,
    hasLyrics: t.has_lyrics === 1,
  };
}

/** Search tracks by lyric theme / mood / vibe ("heartbreak", "summer vibes"). */
export async function searchByTheme(
  q: string,
  limit = 15,
): Promise<MxTrack[]> {
  const body = (await mxGet("track.search", {
    q_lyrics: q,
    page_size: limit,
    page: 1,
    s_track_rating: "desc",
  })) as { track_list?: Array<{ track: Record<string, unknown> }> } | null;
  if (!body) return [];
  return (body.track_list ?? []).map((item) => parseTrack(item.track));
}

/** Find the top-rated track for a given artist name on Musixmatch. */
export async function getTopTrackByArtist(
  artistName: string,
): Promise<MxTrack | null> {
  const body = (await mxGet("track.search", {
    q_artist: artistName,
    page_size: 1,
    page: 1,
    s_track_rating: "desc",
  })) as { track_list?: Array<{ track: Record<string, unknown> }> } | null;
  if (!body?.track_list?.length) return null;
  return parseTrack(body.track_list[0].track);
}

/** LRC-format synced subtitles for a track ID. */
export async function getSyncedLyrics(trackId: number): Promise<{
  lrc: string;
  durationSeconds: number;
} | null> {
  const body = (await mxGet("track.subtitle.get", {
    track_id: trackId,
    subtitle_format: "lrc",
  })) as {
    subtitle?: { subtitle_body: string; subtitle_length: number };
  } | null;
  if (!body?.subtitle?.subtitle_body) return null;
  return {
    lrc: body.subtitle.subtitle_body,
    durationSeconds: body.subtitle.subtitle_length ?? 0,
  };
}

type LyricsResult = { lyricsBody: string; copyright: string } | null;

function parseLyricsBody(body: unknown): LyricsResult {
  const b = body as { lyrics?: { lyrics_body: string; lyrics_copyright: string } } | null;
  if (!b?.lyrics?.lyrics_body) return null;
  return { lyricsBody: b.lyrics.lyrics_body, copyright: b.lyrics.lyrics_copyright ?? "" };
}

/** Plain lyrics — tries track_id first, then matcher.lyrics.get by name as fallback. */
export async function getPlainLyrics(
  trackId: number,
  trackName?: string,
  artistName?: string,
): Promise<LyricsResult> {
  // 1. Try track.lyrics.get with track_id
  const byId = parseLyricsBody(await mxGet("track.lyrics.get", { track_id: trackId }));
  if (byId) return byId;

  // 2. Fallback: matcher.lyrics.get by track + artist name (works better on community plan)
  if (trackName && artistName) {
    const byName = parseLyricsBody(
      await mxGet("matcher.lyrics.get", { q_track: trackName, q_artist: artistName }).catch(() => null),
    );
    if (byName) return byName;
  }

  return null;
}

/** Identify a track from partial lyrics typed by a fan at a live gig. */
export async function fingerprintByLyrics(
  q: string,
  limit = 5,
): Promise<MxTrack[]> {
  const body = (await mxGet("track.search", {
    q_lyrics: q,
    page_size: limit,
    page: 1,
    s_track_rating: "desc",
  })) as { track_list?: Array<{ track: Record<string, unknown> }> } | null;
  if (!body) return [];
  return (body.track_list ?? []).map((item) => parseTrack(item.track));
}
