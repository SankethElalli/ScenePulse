import { Router, type IRouter } from "express";
import { ilike } from "drizzle-orm";
import { db, artistsTable } from "@workspace/db";
import {
  parseSpotifyTrackId,
  enqueueSpotifyTrack,
  getSpotifyTrackAnalysis,
  getSimilarTracksFromSpotify,
} from "../lib/cyanite";

const router: IRouter = Router();

// GET /cyanite/from-spotify?url=<spotify track url|uri|id>
// Real Cyanite integration: given a Spotify track, returns the track's audio
// analysis (mood/genre — when the plan permits it) plus similar tracks and the
// de-duped artists behind them, matched against ScenePulse's local artists.
router.get("/cyanite/from-spotify", async (req, res) => {
  const url = typeof req.query.url === "string" ? req.query.url.trim() : "";
  if (!url) {
    res.status(400).json({ error: "url is required" });
    return;
  }

  const trackId = parseSpotifyTrackId(url);
  if (!trackId) {
    res.status(400).json({ error: "Not a valid Spotify track link or id" });
    return;
  }

  // Kick off analysis (idempotent) so it can populate on plans that allow it,
  // then read analysis + similar tracks together.
  await enqueueSpotifyTrack(trackId);

  let analysis;
  let similar;
  try {
    [analysis, similar] = await Promise.all([
      getSpotifyTrackAnalysis(trackId),
      getSimilarTracksFromSpotify(trackId, 20),
    ]);
  } catch (err) {
    res.status(502).json({
      error: err instanceof Error ? err.message : "Cyanite request failed",
    });
    return;
  }

  // Match the similar-track artists against ScenePulse's local roster so the
  // UI can surface "on map" results.
  const artistNames = [...new Set(similar.map((t) => t.artistName).filter(Boolean))];
  const localMatches = await Promise.all(
    artistNames.map(async (name) => {
      const rows = await db
        .select({ id: artistsTable.id })
        .from(artistsTable)
        .where(ilike(artistsTable.artistName, name))
        .limit(1);
      return rows[0] ? { name, artistId: rows[0].id } : null;
    }),
  );
  const matchedByName = new Map(
    localMatches.filter((m): m is { name: string; artistId: string } => m !== null).map((m) => [m.name, m.artistId]),
  );

  res.json({
    spotifyTrackId: trackId,
    analysis,
    similarTracks: similar.map((t) => ({
      ...t,
      localArtistId: matchedByName.get(t.artistName) ?? null,
    })),
    artistNames,
  });
});

export default router;
