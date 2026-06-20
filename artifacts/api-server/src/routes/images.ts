import { Router, type IRouter } from "express";
import { getDeezerArtistImage } from "../lib/deezer";

const router: IRouter = Router();

// GET /images/artist?name=Artist+Name
// Proxies Deezer artist search so the browser avoids CORS issues.
// Returns { imageUrl: string | null }.
router.get("/images/artist", async (req, res) => {
  const name = typeof req.query.name === "string" ? req.query.name.trim() : "";
  if (!name) {
    res.status(400).json({ error: "name is required" });
    return;
  }
  const imageUrl = await getDeezerArtistImage(name);
  res.json({ imageUrl });
});

export default router;
