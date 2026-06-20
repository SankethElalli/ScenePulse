import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { venuesTable } from "./venues";
import { artistsTable } from "./artists";
import { eventStatus } from "./enums";

export const eventsTable = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  venueId: uuid("venue_id").references(() => venuesTable.id, {
    onDelete: "cascade",
  }),
  artistId: uuid("artist_id").references(() => artistsTable.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  description: text("description"),
  eventDate: timestamp("event_date", { withTimezone: true }).notNull(),
  status: eventStatus("status").notNull().default("upcoming"),
  imageUrl: text("image_url"),
  ticketUrl: text("ticket_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertEventSchema = createInsertSchema(eventsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof eventsTable.$inferSelect;
