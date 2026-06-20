const BASE = "https://api.data.jambase.com/v3";

export interface JbPerformer {
  name: string;
  identifier: string;
  url: string;
  image?: string;
  genre?: string[];
  isHeadliner?: boolean;
}

export interface JbVenue {
  name: string;
  identifier: string;
  url: string;
  image?: string;
  address?: {
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: { name: string; alternateName: string };
    addressCountry?: { name: string };
  };
  geo?: { latitude: number; longitude: number };
}

export interface JbEvent {
  identifier: string;
  name: string;
  url: string;
  image?: string;
  startDate: string;
  endDate?: string;
  eventStatus: string;
  location: JbVenue;
  performer: JbPerformer[];
  offers?: { url: string; name: string }[];
}

async function jbGet(path: string, params: Record<string, string>): Promise<unknown> {
  const apiKey = process.env.JAMBASE_API_KEY;
  if (!apiKey) throw new Error("JAMBASE_API_KEY is not configured");

  const url = new URL(`${BASE}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) throw new Error(`JamBase HTTP ${res.status}`);
  return res.json();
}

export interface BoundingBox {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
}

/**
 * Fetch tonight's (and next 7 days) events within a bounding box.
 * Uses center + radius approximation from the bounding box.
 */
export async function fetchEventsByBbox(bbox: BoundingBox, perPage = 40): Promise<JbEvent[]> {
  const centerLat = (bbox.swLat + bbox.neLat) / 2;
  const centerLng = (bbox.swLng + bbox.neLng) / 2;

  // Approximate radius in km from the bounding box diagonal
  const latDiff = Math.abs(bbox.neLat - bbox.swLat);
  const lngDiff = Math.abs(bbox.neLng - bbox.swLng);
  const radiusKm = Math.min(
    Math.round(Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 55),
    500,
  );

  const today = new Date().toISOString().slice(0, 10);
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const body = (await jbGet("/events", {
    geoLatitude: String(centerLat),
    geoLongitude: String(centerLng),
    geoRadiusAmount: String(Math.max(radiusKm, 30)),
    geoRadiusUnits: "km",
    eventDateFrom: today,
    eventDateTo: nextWeek,
    perPage: String(perPage),
    sort: "eventDate",
  })) as { events?: JbEvent[] };

  return body.events ?? [];
}

// Major global music hubs — used to populate a lively worldwide "live events"
// view when the user is in Global mode (a single bbox can't cover the planet).
const GLOBAL_MUSIC_HUBS: { lat: number; lng: number }[] = [
  { lat: 40.7128, lng: -74.006 },   // New York
  { lat: 34.0522, lng: -118.2437 }, // Los Angeles
  { lat: 41.8781, lng: -87.6298 },  // Chicago
  { lat: 30.2672, lng: -97.7431 },  // Austin
  { lat: 36.1627, lng: -86.7816 },  // Nashville
  { lat: 51.5074, lng: -0.1278 },   // London
  { lat: 52.52, lng: 13.405 },      // Berlin
  { lat: 48.8566, lng: 2.3522 },    // Paris
  { lat: 52.3676, lng: 4.9041 },    // Amsterdam
  { lat: 43.6532, lng: -79.3832 },  // Toronto
  { lat: -33.8688, lng: 151.2093 }, // Sydney
  { lat: 35.6762, lng: 139.6503 },  // Tokyo
];

/**
 * Fetch live events from a single point (lat/lng) within a radius.
 */
export async function fetchEventsNearPoint(
  lat: number,
  lng: number,
  radiusKm = 60,
  perPage = 15,
): Promise<JbEvent[]> {
  const today = new Date().toISOString().slice(0, 10);
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const body = (await jbGet("/events", {
    geoLatitude: String(lat),
    geoLongitude: String(lng),
    geoRadiusAmount: String(radiusKm),
    geoRadiusUnits: "km",
    eventDateFrom: today,
    eventDateTo: nextWeek,
    perPage: String(perPage),
    sort: "eventDate",
  })) as { events?: JbEvent[] };

  return body.events ?? [];
}

/**
 * Aggregate live events from major global music hubs for a worldwide view.
 * Deduplicates by event identifier and tolerates individual hub failures.
 */
export async function fetchGlobalLiveEvents(perHub = 8): Promise<JbEvent[]> {
  const results = await Promise.allSettled(
    GLOBAL_MUSIC_HUBS.map((h) => fetchEventsNearPoint(h.lat, h.lng, 60, perHub)),
  );
  const byId = new Map<string, JbEvent>();
  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    for (const e of r.value) {
      if (!byId.has(e.identifier)) byId.set(e.identifier, e);
    }
  }
  return [...byId.values()];
}

/**
 * Fetch past events (setlist history) for a venue by JamBase venue identifier.
 */
export async function fetchVenueSetlistHistory(venueIdentifier: string, perPage = 10): Promise<JbEvent[]> {
  const [source, id] = venueIdentifier.split(":");
  const body = (await jbGet("/events", {
    venueId: `${source}:${id}`,
    expandPastEvents: "true",
    sort: "-eventDate",
    perPage: String(perPage),
  })) as { events?: JbEvent[] };

  return body.events ?? [];
}
