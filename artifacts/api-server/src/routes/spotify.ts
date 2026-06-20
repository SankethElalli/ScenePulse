import { Router, type IRouter } from "express";
import { getArtistTopTrack, parseSpotifyArtistId } from "../lib/spotify";

const router: IRouter = Router();

// GET /spotify/top-track?artistId=<id or URL>
// Returns the artist's #1 top track from Spotify (client-credentials, no user auth needed).
router.get("/spotify/top-track", async (req, res) => {
  const raw = typeof req.query.artistId === "string" ? req.query.artistId.trim() : "";
  if (!raw) {
    res.status(400).json({ error: "artistId is required" });
    return;
  }

  const artistId = parseSpotifyArtistId(raw);
  if (!artistId) {
    res.status(400).json({ error: "Invalid Spotify artist ID or URL" });
    return;
  }

  try {
    const track = await getArtistTopTrack(artistId);
    if (!track) {
      res.status(404).json({ error: "No top track found for this artist" });
      return;
    }
    res.json(track);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    res.status(502).json({ error: msg });
  }
});

export default router;
