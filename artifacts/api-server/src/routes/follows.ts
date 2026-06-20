import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db, followsTable, artistsTable } from "@workspace/db";
import {
  ListFollowedArtistsParams,
  GetFollowStatusParams,
  FollowArtistParams,
  UnfollowArtistParams,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/profiles/:id/follows", async (req, res) => {
  const { id } = ListFollowedArtistsParams.parse(req.params);
  const rows = await db
    .select({ artist: artistsTable })
    .from(followsTable)
    .innerJoin(artistsTable, eq(followsTable.artistId, artistsTable.id))
    .where(eq(followsTable.followerProfileId, id))
    .orderBy(desc(followsTable.createdAt));
  res.json(rows.map((r) => r.artist));
});

router.get("/profiles/:id/follows/:artistId", async (req, res) => {
  const { id, artistId } = GetFollowStatusParams.parse(req.params);
  const [row] = await db
    .select()
    .from(followsTable)
    .where(
      and(
        eq(followsTable.followerProfileId, id),
        eq(followsTable.artistId, artistId),
      ),
    );
  res.json({ following: !!row });
});

router.put(
  "/profiles/:id/follows/:artistId",
  requireAuth,
  async (req, res) => {
    const { id, artistId } = FollowArtistParams.parse(req.params);
    if (req.userId && req.userId !== id) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    await db
      .insert(followsTable)
      .values({ followerProfileId: id, artistId })
      .onConflictDoNothing();
    res.json({ following: true });
  },
);

router.delete(
  "/profiles/:id/follows/:artistId",
  requireAuth,
  async (req, res) => {
    const { id, artistId } = UnfollowArtistParams.parse(req.params);
    if (req.userId && req.userId !== id) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    await db
      .delete(followsTable)
      .where(
        and(
          eq(followsTable.followerProfileId, id),
          eq(followsTable.artistId, artistId),
        ),
      );
    res.json({ following: false });
  },
);

export default router;
