import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { teamsTable } from "./teams";

export const matchesTable = pgTable("matches", {
  id: serial("id").primaryKey(),
  homeTeamId: integer("home_team_id").references(() => teamsTable.id),
  awayTeamId: integer("away_team_id").references(() => teamsTable.id),
  matchDate: timestamp("match_date", { withTimezone: true }).notNull(),
  stadium: text("stadium").notNull(),
  city: text("city").notNull(),
  round: text("round").notNull(),
  group: text("group"),
  status: text("status").notNull().default("upcoming"),
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  matchNumber: integer("match_number"),
});

export const insertMatchSchema = createInsertSchema(matchesTable).omit({ id: true });
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Match = typeof matchesTable.$inferSelect;
