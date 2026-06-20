const TOKEN_URL = "https://accounts.spotify.com/api/token";
const API_BASE = "https://api.spotify.com/v1";

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 30_000) {
    return cachedToken.token;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set");
  }

  const creds = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${creds}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`Spotify token fetch failed: ${res.status}`);

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { token: data.access_token, expiresAt: now + data.expires_in * 1000 };
  return cachedToken.token;
}

export interface SpotifyTopTrack {
  trackId: string;
  trackName: string;
  previewUrl: string | null;
  externalUrl: string;
  albumImageUrl: string | null;
  durationMs: number;
}

/** Extract a Spotify artist ID from a full artist URL or a bare ID. */
export function parseSpotifyArtistId(input: string): string | null {
  const trimmed = input.trim();
  const urlMatch = trimmed.match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?artist\/([A-Za-z0-9]{10,})/);
  if (urlMatch) return urlMatch[1];
  const uriMatch = trimmed.match(/spotify:artist:([A-Za-z0-9]{10,})/);
  if (uriMatch) return uriMatch[1];
  if (/^[A-Za-z0-9]{10,}$/.test(trimmed)) return trimmed;
  return null;
}

/** Returns the artist's top track in the given market (default US). */
export async function getArtistTopTrack(
  artistId: string,
  market = "US",
): Promise<SpotifyTopTrack | null> {
  const token = await getAccessToken();
  const res = await fetch(
    `${API_BASE}/artists/${encodeURIComponent(artistId)}/top-tracks?market=${market}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Spotify API error: ${res.status}`);

  const data = (await res.json()) as {
    tracks: Array<{
      id: string;
      name: string;
      preview_url: string | null;
      external_urls: { spotify: string };
      album: { images: Array<{ url: string }> };
      duration_ms: number;
    }>;
  };

  const top = data.tracks?.[0];
  if (!top) return null;

  return {
    trackId: top.id,
    trackName: top.name,
    previewUrl: top.preview_url,
    externalUrl: top.external_urls.spotify,
    albumImageUrl: top.album.images?.[0]?.url ?? null,
    durationMs: top.duration_ms,
  };
}
