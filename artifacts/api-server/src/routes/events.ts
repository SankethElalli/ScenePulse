import { Router, type IRouter } from "express";
import { and, asc, eq, getTableColumns, ilike, type SQL } from "drizzle-orm";
import { db, eventsTable, venuesTable } from "@workspace/db";
import {
  ListEventsQueryParams,
  CreateEventBody,
  GetEventParams,
  UpdateEventParams,
  UpdateEventBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

type EventStatus = "upcoming" | "live" | "past" | "cancelled";

router.get("/events", async (req, res) => {
  const { status, artistId, venueId, city } = ListEventsQueryParams.parse(
    req.query,
  );
  const filters: SQL[] = [];
  if (status) filters.push(eq(eventsTable.status, status as EventStatus));
  if (artistId) filters.push(eq(eventsTable.artistId, artistId));
  if (venueId) filters.push(eq(eventsTable.venueId, venueId));
  if (city) filters.push(ilike(venuesTable.city, city));

  const where = filters.length ? and(...filters) : undefined;

  // When filtering by city we must join the venue (events have no city of
  // their own). Select only the event columns so the response shape is stable.
  const rows = city
    ? await db
        .select(getTableColumns(eventsTable))
        .from(eventsTable)
        .innerJoin(venuesTable, eq(eventsTable.venueId, venuesTable.id))
        .where(where)
        .orderBy(asc(eventsTable.eventDate))
    : await db
        .select()
        .from(eventsTable)
        .where(where)
        .orderBy(asc(eventsTable.eventDate));
  res.json(rows);
});

router.post("/events", async (req, res) => {
  const body = CreateEventBody.parse(req.body);
  const [event] = await db
    .insert(eventsTable)
    .values({
      ...body,
      status: (body.status as EventStatus) ?? "upcoming",
      eventDate: new Date(body.eventDate),
    })
    .returning();
  res.status(201).json(event);
});

router.get("/events/:id", async (req, res) => {
  const { id } = GetEventParams.parse(req.params);
  const [event] = await db
    .select()
    .from(eventsTable)
    .where(eq(eventsTable.id, id));
  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }
  res.json(event);
});

router.patch("/events/:id", async (req, res) => {
  const { id } = UpdateEventParams.parse(req.params);
  const { eventDate, status, ...rest } = UpdateEventBody.parse(req.body);
  const [event] = await db
    .update(eventsTable)
    .set({
      ...rest,
      ...(status ? { status: status as EventStatus } : {}),
      ...(eventDate ? { eventDate: new Date(eventDate) } : {}),
    })
    .where(eq(eventsTable.id, id))
    .returning();
  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }
  res.json(event);
});

export default router;
