import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { venuesTable } from "./venues";

/**
 * Media gallery items for a venue (image/video). Ordered by sortOrder.
 * Managed from the venue dashboard, surfaced on the venue page.
 */
export const venueMediaTable = pgTable("venue_media", {
  id: uuid("id").primaryKey().defaultRandom(),
  venueId: uuid("venue_id")
    .notNull()
    .references(() => venuesTable.id, { onDelete: "cascade" }),
  type: text("type").notNull().default("image"),
  url: text("url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  caption: text("caption"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertVenueMediaSchema = createInsertSchema(venueMediaTable).omit({
  id: true,
  createdAt: true,
});
export type InsertVenueMedia = z.infer<typeof insertVenueMediaSchema>;
export type VenueMedia = typeof venueMediaTable.$inferSelect;
