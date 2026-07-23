import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const knightedJobApplicationsTable = pgTable("knighted_job_applications", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  linkedinUrl: text("linkedin_url"),
  coverNote: text("cover_note"),
  resumeText: text("resume_text"),
  appliedAt: timestamp("applied_at", { withTimezone: true }).notNull().defaultNow(),
});

export const createJobApplicationSchema = z.object({
  name: z.string().min(2),
  email: z.email(),
  phone: z.string().optional(),
  linkedinUrl: z.string().optional(),
  coverNote: z.string().optional(),
  resumeText: z.string().optional(),
});

export type CreateJobApplication = z.infer<typeof createJobApplicationSchema>;
export type KnightedJobApplication = typeof knightedJobApplicationsTable.$inferSelect;
