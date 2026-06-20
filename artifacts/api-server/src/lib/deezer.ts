const BASE = "https://api.deezer.com";

export async function getDeezerArtistImage(name: string): Promise<string | null> {
  try {
    const url = `${BASE}/search/artist?q=${encodeURIComponent(name)}&limit=1`;
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: { name: string; picture_medium: string }[] };
    return json.data?.[0]?.picture_medium ?? null;
  } catch {
    return null;
  }
}
