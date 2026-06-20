import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { artistsTable } from "./artists";

/**
 * A lightweight artist-to-artist collaboration request. Surfaced in the
 * artist dashboard "Collabs" section (incoming/outgoing) where the recipient
 * can accept or decline. No AI / matching engine involved.
 */
export const collaborationRequestsTable = pgTable("collaboration_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  fromArtistId: uuid("from_artist_id")
    .notNull()
    .references(() => artistsTable.id, { onDelete: "cascade" }),
  toArtistId: uuid("to_artist_id")
    .notNull()
    .references(() => artistsTable.id, { onDelete: "cascade" }),
  message: text("message"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertCollaborationRequestSchema = createInsertSchema(
  collaborationRequestsTable,
).omit({ id: true, createdAt: true });
export type InsertCollaborationRequest = z.infer<
  typeof insertCollaborationRequestSchema
>;
export type CollaborationRequest =
  typeof collaborationRequestsTable.$inferSelect;
