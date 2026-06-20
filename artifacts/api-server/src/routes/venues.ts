import { Router, type IRouter } from "express";
import { and, asc, desc, eq, ilike, type SQL } from "drizzle-orm";
import { db, venuesTable, venueMediaTable } from "@workspace/db";
import {
  ListVenuesQueryParams,
  CreateVenueBody,
  GetVenueParams,
  UpdateVenueParams,
  UpdateVenueBody,
  ListVenueMediaParams,
  AddVenueMediaParams,
  AddVenueMediaBody,
  DeleteVenueMediaParams,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { geocodeCity } from "../lib/geocode";

const router: IRouter = Router();

router.get("/venues", async (req, res) => {
  const { q } = ListVenuesQueryParams.parse(req.query);
  const filters: SQL[] = [];
  if (q) filters.push(ilike(venuesTable.name, `%${q}%`));

  const rows = await db
    .select()
    .from(venuesTable)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(venuesTable.createdAt));
  res.json(rows);
});

router.post("/venues", requireAuth, async (req, res) => {
  const body = CreateVenueBody.parse(req.body);

  let { latitude, longitude } = body;
  if ((!latitude || !longitude) && body.city) {
    const geo = await geocodeCity(body.city);
    if (geo) { latitude = geo.latitude; longitude = geo.longitude; }
  }

  const [venue] = await db
    .insert(venuesTable)
    .values({ ...body, latitude, longitude })
    .returning();
  res.status(201).json(venue);
});

router.get("/venues/:id", async (req, res) => {
  const { id } = GetVenueParams.parse(req.params);
  const [venue] = await db
    .select()
    .from(venuesTable)
    .where(eq(venuesTable.id, id));
  if (!venue) {
    res.status(404).json({ error: "Venue not found" });
    return;
  }
  res.json(venue);
});

router.patch("/venues/:id", requireAuth, async (req, res) => {
  const { id } = UpdateVenueParams.parse(req.params);
  const body = UpdateVenueBody.parse(req.body);

  const [existing] = await db
    .select()
    .from(venuesTable)
    .where(eq(venuesTable.id, id));
  if (!existing) {
    res.status(404).json({ error: "Venue not found" });
    return;
  }
  if (req.userId && existing.profileId !== req.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const [venue] = await db
    .update(venuesTable)
    .set(body)
    .where(eq(venuesTable.id, id))
    .returning();
  res.json(venue);
});

// --- Venue media gallery ---

router.get("/venues/:id/media", async (req, res) => {
  const { id } = ListVenueMediaParams.parse(req.params);
  const rows = await db
    .select()
    .from(venueMediaTable)
    .where(eq(venueMediaTable.venueId, id))
    .orderBy(asc(venueMediaTable.sortOrder), desc(venueMediaTable.createdAt));
  res.json(rows);
});

router.post("/venues/:id/media", requireAuth, async (req, res) => {
  const { id } = AddVenueMediaParams.parse(req.params);
  const body = AddVenueMediaBody.parse(req.body);

  const [venue] = await db
    .select({ profileId: venuesTable.profileId })
    .from(venuesTable)
    .where(eq(venuesTable.id, id));
  if (!venue) {
    res.status(404).json({ error: "Venue not found" });
    return;
  }
  if (req.userId && venue.profileId !== req.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const [media] = await db
    .insert(venueMediaTable)
    .values({
      venueId: id,
      type: body.type ?? "image",
      url: body.url,
      thumbnailUrl: body.thumbnailUrl,
      caption: body.caption,
      sortOrder: body.sortOrder ?? 0,
    })
    .returning();
  res.status(201).json(media);
});

router.delete("/venues/:id/media/:mediaId", requireAuth, async (req, res) => {
  const { id, mediaId } = DeleteVenueMediaParams.parse(req.params);

  const [venue] = await db
    .select({ profileId: venuesTable.profileId })
    .from(venuesTable)
    .where(eq(venuesTable.id, id));
  if (!venue) {
    res.status(404).json({ error: "Venue not found" });
    return;
  }
  if (req.userId && venue.profileId !== req.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  await db
    .delete(venueMediaTable)
    .where(
      and(eq(venueMediaTable.id, mediaId), eq(venueMediaTable.venueId, id)),
    );
  res.json({ success: true });
});

export default router;
