import {
  pgTable,
  uuid,
  text,
  integer,
  doublePrecision,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { artistsTable } from "./artists";

/**
 * Discoverability tags for an artist (genre/mood/theme), with a relevance
 * score. Sourced from analysis pipelines or seeded. Powers mood/genre search.
 */
export const artistTagsTable = pgTable(
  "artist_tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    artistId: uuid("artist_id")
      .notNull()
      .references(() => artistsTable.id, { onDelete: "cascade" }),
    tag: text("tag").notNull(),
    type: text("type").notNull().default("genre"),
    score: doublePrecision("score").notNull().default(1),
    source: text("source").notNull().default("demo"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [unique("artist_tags_artist_tag_type_uq").on(t.artistId, t.tag, t.type)],
);

export const insertArtistTagSchema = createInsertSchema(artistTagsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertArtistTag = z.infer<typeof insertArtistTagSchema>;
export type ArtistTag = typeof artistTagsTable.$inferSelect;

/**
 * External links for an artist (streaming, social, press, etc.). Ordered by
 * sortOrder for display.
 */
export const artistLinksTable = pgTable("artist_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  artistId: uuid("artist_id")
    .notNull()
    .references(() => artistsTable.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  url: text("url").notNull(),
  label: text("label"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertArtistLinkSchema = createInsertSchema(artistLinksTable).omit({
  id: true,
  createdAt: true,
});
export type InsertArtistLink = z.infer<typeof insertArtistLinkSchema>;
export type ArtistLink = typeof artistLinksTable.$inferSelect;

/**
 * Media gallery items for an artist (image/video/audio). Ordered by sortOrder.
 */
export const artistMediaTable = pgTable("artist_media", {
  id: uuid("id").primaryKey().defaultRandom(),
  artistId: uuid("artist_id")
    .notNull()
    .references(() => artistsTable.id, { onDelete: "cascade" }),
  type: text("type").notNull().default("image"),
  url: text("url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  caption: text("caption"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertArtistMediaSchema = createInsertSchema(artistMediaTable).omit(
  { id: true, createdAt: true },
);
export type InsertArtistMedia = z.infer<typeof insertArtistMediaSchema>;
export type ArtistMedia = typeof artistMediaTable.$inferSelect;
