import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const knightedJobAlertsTable = pgTable("knighted_job_alerts", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  email: text("email").notNull(),
  query: text("query").notNull().default(""),
  location: text("location"),
  employmentType: text("employment_type"),
  remoteOnly: boolean("remote_only").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  lastSentAt: timestamp("last_sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const createJobAlertSchema = z.object({
  email: z.email(),
  query: z.string().default(""),
  location: z.string().optional(),
  employmentType: z.enum(["full_time", "part_time", "contract", "internship"]).optional(),
  remoteOnly: z.boolean().optional().default(false),
});

export type CreateJobAlert = z.infer<typeof createJobAlertSchema>;
export type KnightedJobAlert = typeof knightedJobAlertsTable.$inferSelect;
