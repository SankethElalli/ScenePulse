/**
 * Geocode a city name → { latitude, longitude } using OpenStreetMap Nominatim.
 * Free, no API key required. Returns null if nothing found or on error.
 */
export async function geocodeCity(
  city: string,
): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", city);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");

    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent": "ScenePulse/1.0 (https://scenepulse.app)",
        "Accept-Language": "en",
      },
    });
    if (!res.ok) return null;

    const data = (await res.json()) as { lat: string; lon: string }[];
    if (!data.length) return null;

    return {
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon),
    };
  } catch {
    return null;
  }
}
