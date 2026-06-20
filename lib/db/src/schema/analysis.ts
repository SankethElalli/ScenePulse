import {
  pgTable,
  uuid,
  text,
  doublePrecision,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { artistsTable } from "./artists";

/**
 * Audio analysis for an artist, typically sourced from Cyanite (or seeded
 * demo data until API keys are wired up). One row per artist per analysis run;
 * the latest row (by analyzedAt) is treated as current.
 */
export const artistAudioAnalysisTable = pgTable("artist_audio_analysis", {
  id: uuid("id").primaryKey().defaultRandom(),
  artistId: uuid("artist_id")
    .notNull()
    .references(() => artistsTable.id, { onDelete: "cascade" }),
  energy: doublePrecision("energy"),
  danceability: doublePrecision("danceability"),
  valence: doublePrecision("valence"),
  acousticness: doublePrecision("acousticness"),
  instrumentalness: doublePrecision("instrumentalness"),
  tempo: doublePrecision("tempo"),
  loudness: doublePrecision("loudness"),
  musicalKey: text("musical_key"),
  mode: text("mode"),
  genres: text("genres")
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  moods: text("moods")
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  source: text("source").notNull().default("demo"),
  raw: jsonb("raw"),
  analyzedAt: timestamp("analyzed_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertArtistAudioAnalysisSchema = createInsertSchema(
  artistAudioAnalysisTable,
).omit({ id: true, analyzedAt: true });
export type InsertArtistAudioAnalysis = z.infer<
  typeof insertArtistAudioAnalysisSchema
>;
export type ArtistAudioAnalysis = typeof artistAudioAnalysisTable.$inferSelect;

/**
 * Lyric analysis for an artist, typically sourced from Musixmatch + NLP
 * (or seeded demo data). One row per artist per analysis run.
 */
export const artistLyricAnalysisTable = pgTable("artist_lyric_analysis", {
  id: uuid("id").primaryKey().defaultRandom(),
  artistId: uuid("artist_id")
    .notNull()
    .references(() => artistsTable.id, { onDelete: "cascade" }),
  themes: text("themes")
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  keywords: text("keywords")
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  sentiment: text("sentiment"),
  sentimentScore: doublePrecision("sentiment_score"),
  language: text("language"),
  summary: text("summary"),
  source: text("source").notNull().default("demo"),
  raw: jsonb("raw"),
  analyzedAt: timestamp("analyzed_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertArtistLyricAnalysisSchema = createInsertSchema(
  artistLyricAnalysisTable,
).omit({ id: true, analyzedAt: true });
export type InsertArtistLyricAnalysis = z.infer<
  typeof insertArtistLyricAnalysisSchema
>;
export type ArtistLyricAnalysis = typeof artistLyricAnalysisTable.$inferSelect;
