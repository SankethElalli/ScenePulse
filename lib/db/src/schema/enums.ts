import { pgEnum } from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", [
  "fan",
  "artist",
  "venue",
  "label",
  "admin",
]);

export const eventStatus = pgEnum("event_status", [
  "upcoming",
  "live",
  "past",
  "cancelled",
]);
