import { pgTable, uuid, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { profilesTable } from "./profiles";
import { artistsTable } from "./artists";

/**
 * A fan/user following an artist. Powers the personalized fan dashboard
 * ("artists you follow").
 */
export const followsTable = pgTable(
  "follows",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    followerProfileId: uuid("follower_profile_id")
      .notNull()
      .references(() => profilesTable.id, { onDelete: "cascade" }),
    artistId: uuid("artist_id")
      .notNull()
      .references(() => artistsTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique("follows_follower_artist_uq").on(t.followerProfileId, t.artistId),
  ],
);

export const insertFollowSchema = createInsertSchema(followsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertFollow = z.infer<typeof insertFollowSchema>;
export type Follow = typeof followsTable.$inferSelect;
