import { Router, type IRouter } from "express";
import { fetchArtistStats } from "../lib/songstats";

const router: IRouter = Router();

// GET /songstats/artist-stats?spotifyArtistId=<id>
// Returns Spotify stats (monthly listeners, playlist reach, etc.) from Songstats.
router.get("/songstats/artist-stats", async (req, res) => {
  const spotifyArtistId =
    typeof req.query.spotifyArtistId === "string"
      ? req.query.spotifyArtistId.trim()
      : "";
  if (!spotifyArtistId) {
    res.status(400).json({ error: "spotifyArtistId is required" });
    return;
  }

  const stats = await fetchArtistStats(spotifyArtistId);
  res.json(stats);
});

export default router;
