import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const knightedSeekerProfilesTable = pgTable("knighted_seeker_profiles", {
  userId: text("user_id").primaryKey(),
  jobTitle: text("job_title"),
  skills: text("skills"),
  experienceYears: integer("experience_years"),
  location: text("location"),
  remotePreference: text("remote_preference"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createSeekerProfileSchema = z.object({
  jobTitle: z.string().optional(),
  skills: z.string().optional(),
  experienceYears: z.number().int().min(0).max(50).optional(),
  location: z.string().optional(),
  remotePreference: z.enum(["any", "remote", "hybrid", "onsite"]).optional(),
});

export const createMatchScoreSchema = z.object({
  resumeText: z.string().min(50),
  jobDescription: z.string().min(50),
});

export type KnightedSeekerProfile = typeof knightedSeekerProfilesTable.$inferSelect;
