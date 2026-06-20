import {
  pgTable,
  uuid,
  text,
  boolean,
  doublePrecision,
  timestamp,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { profilesTable } from "./profiles";

export const artistsTable = pgTable("artists", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id").references(() => profilesTable.id, {
    onDelete: "set null",
  }),
  artistName: text("artist_name").notNull(),
  bio: text("bio"),
  summary: text("summary"),
  genres: text("genres")
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  moodTags: text("mood_tags")
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  themes: text("themes")
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  city: text("city"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  imageUrl: text("image_url"),
  spotifyUrl: text("spotify_url"),
  instagramUrl: text("instagram_url"),
  youtubeUrl: text("youtube_url"),
  websiteUrl: text("website_url"),
  verified: boolean("verified").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertArtistSchema = createInsertSchema(artistsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertArtist = z.infer<typeof insertArtistSchema>;
export type Artist = typeof artistsTable.$inferSelect;
