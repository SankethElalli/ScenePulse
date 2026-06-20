import crypto from "node:crypto";

const CYANITE_GRAPHQL_URL = "https://api.cyanite.ai/graphql";

/** Extract a Spotify track id from a full URL, URI, or a raw id. */
export function parseSpotifyTrackId(input: string): string | null {
  const trimmed = input.trim();
  // open.spotify.com/track/<id>  (optionally with /intl-xx/ and query string)
  const urlMatch = trimmed.match(/track\/([a-zA-Z0-9]{22})/);
  if (urlMatch) return urlMatch[1];
  // spotify:track:<id>
  const uriMatch = trimmed.match(/spotify:track:([a-zA-Z0-9]{22})/);
  if (uriMatch) return uriMatch[1];
  // bare id
  if (/^[a-zA-Z0-9]{22}$/.test(trimmed)) return trimmed;
  return null;
}

export function isSpotifyTrackInput(input: string): boolean {
  return parseSpotifyTrackId(input) !== null;
}

async function cyaniteGraphQL<T>(
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
  const token = process.env.CYANITE_API_KEY;
  if (!token) throw new Error("CYANITE_API_KEY is not configured");

  const res = await fetch(CYANITE_GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    throw new Error(`Cyanite API error: HTTP ${res.status}`);
  }

  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (json.errors?.length) {
    throw new Error(`Cyanite GraphQL error: ${json.errors[0].message}`);
  }
  if (!json.data) throw new Error("Cyanite returned no data");
  return json.data;
}

/**
 * Best-effort enqueue of a Spotify track so Cyanite begins analysing it. This
 * is required before audio analysis can ever return a Finished result. It is
 * idempotent on Cyanite's side, so we ignore the "already enqueued" outcome.
 */
export async function enqueueSpotifyTrack(trackId: string): Promise<void> {
  const query = `
    mutation($input: SpotifyTrackEnqueueInput!) {
      spotifyTrackEnqueue(input: $input) {
        __typename
      }
    }`;
  try {
    await cyaniteGraphQL(query, { input: { spotifyTrackId: trackId } });
  } catch {
    // Enqueue is opportunistic; analysis availability is gated by plan anyway.
  }
}

export interface CyaniteAnalysis {
  /**
   * "finished"     — tags below are populated.
   * "processing"   — Cyanite is still analysing; retry later.
   * "notAuthorized" — this Cyanite plan does not include Spotify audio analysis.
   * "unavailable"  — not started / failed / unexpected.
   */
  status: "finished" | "processing" | "notAuthorized" | "unavailable";
  genreTags?: string[];
  moodTags?: string[];
  instrumentTags?: string[];
  characterTags?: string[];
  energyLevel?: string | null;
  bpm?: number | null;
  valence?: number | null;
  arousal?: number | null;
}

interface AnalysisNode {
  __typename: string;
  result?: {
    genreTags: string[];
    moodTags: string[];
    instrumentTags: string[];
    characterTags: string[];
    energyLevel: string | null;
    bpmRangeAdjusted: number | null;
    valence: number | null;
    arousal: number | null;
  };
}

/**
 * Fetch mood/genre/instrument tags for a Spotify track. As of Cyanite's March
 * 2025 change, Spotify audio analysis is gated behind a feature permission, so
 * accounts without it receive an AudioAnalysisV7NotAuthorized result — surfaced
 * here as status "notAuthorized" rather than an error.
 */
export async function getSpotifyTrackAnalysis(
  trackId: string,
): Promise<CyaniteAnalysis> {
  const query = `
    query($id: ID!) {
      spotifyTrack(id: $id) {
        ... on SpotifyTrack {
          audioAnalysisV7 {
            __typename
            ... on AudioAnalysisV7Finished {
              result {
                genreTags
                moodTags
                instrumentTags
                characterTags
                energyLevel
                bpmRangeAdjusted
                valence
                arousal
              }
            }
          }
        }
      }
    }`;

  let node: AnalysisNode;
  try {
    const data = await cyaniteGraphQL<{
      spotifyTrack: { audioAnalysisV7: AnalysisNode };
    }>(query, { id: trackId });
    node = data.spotifyTrack.audioAnalysisV7;
  } catch {
    return { status: "unavailable" };
  }

  switch (node.__typename) {
    case "AudioAnalysisV7NotAuthorized":
      return { status: "notAuthorized" };
    case "AudioAnalysisV7Processing":
    case "AudioAnalysisV7Enqueued":
    case "AudioAnalysisV7NotStarted":
      return { status: "processing" };
    case "AudioAnalysisV7Finished": {
      const r = node.result!;
      return {
        status: "finished",
        genreTags: r.genreTags ?? [],
        moodTags: r.moodTags ?? [],
        instrumentTags: r.instrumentTags ?? [],
        characterTags: r.characterTags ?? [],
        energyLevel: r.energyLevel,
        bpm: r.bpmRangeAdjusted,
        valence: r.valence,
        arousal: r.arousal,
      };
    }
    default:
      return { status: "unavailable" };
  }
}

export interface CyaniteSimilarTrack {
  spotifyTrackId: string;
  title: string;
  artistName: string;
  trackName: string;
}

/**
 * Use Cyanite Similarity Search to find tracks similar to a Spotify track.
 * Spotify track titles arrive as "Artist - Song"; we split on the first
 * " - " to recover artist and track names. Unlike audio analysis, similarity
 * search is available without the gated Spotify-analysis permission.
 */
export async function getSimilarTracksFromSpotify(
  trackId: string,
  first = 20,
): Promise<CyaniteSimilarTrack[]> {
  const query = `
    query($id: ID!, $first: Int!) {
      spotifyTrack(id: $id) {
        ... on SpotifyTrack {
          similarTracks(first: $first, target: { spotify: {} }) {
            __typename
            ... on SimilarTracksConnection {
              edges { node { id title } }
            }
          }
        }
      }
    }`;

  const data = await cyaniteGraphQL<{
    spotifyTrack: {
      similarTracks:
        | { __typename: "SimilarTracksConnection"; edges: { node: { id: string; title: string } }[] }
        | { __typename: "SimilarTracksError" };
    };
  }>(query, { id: trackId, first });

  const result = data.spotifyTrack.similarTracks;
  if (result.__typename !== "SimilarTracksConnection") return [];

  const seen = new Set<string>();
  const out: CyaniteSimilarTrack[] = [];
  for (const { node } of result.edges) {
    if (seen.has(node.id)) continue;
    seen.add(node.id);
    const sep = node.title.indexOf(" - ");
    const artistName = sep > 0 ? node.title.slice(0, sep).trim() : node.title.trim();
    const trackName = sep > 0 ? node.title.slice(sep + 3).trim() : "";
    out.push({ spotifyTrackId: node.id, title: node.title, artistName, trackName });
  }
  return out;
}

/**
 * Cyanite signs each non-test webhook request with an HMAC-SHA512 of the raw
 * request body, sent in the `Signature` header (hex-encoded). We verify it
 * against the shared `CYANITE_WEBHOOK_SECRET` chosen when creating the Cyanite
 * integration. See: https://api-docs.cyanite.ai/docs/listening-to-webhook-events
 */
export function verifyCyaniteSignature(
  rawBody: Buffer | string,
  signature: string | undefined,
): boolean {
  const secret = process.env.CYANITE_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const hmac = crypto.createHmac("sha512", secret);
  hmac.update(rawBody);
  const expected = hmac.digest("hex");

  const provided = Buffer.from(signature, "utf8");
  const computed = Buffer.from(expected, "utf8");
  if (provided.length !== computed.length) return false;
  return crypto.timingSafeEqual(provided, computed);
}
