import { pgTable, text, serial, timestamp, jsonb, unique } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const knightedSavedJobsTable = pgTable("knighted_saved_jobs", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  jobId: text("job_id").notNull(),
  jobSnapshot: jsonb("job_snapshot").notNull(),
  savedAt: timestamp("saved_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  unique("knighted_saved_jobs_user_id_job_id_unique").on(table.userId, table.jobId),
]);

export const saveJobInputSchema = z.object({
  jobId: z.string().min(1),
  jobSnapshot: z.object({
    id: z.string(),
    title: z.string(),
    company: z.string(),
    location: z.string(),
    salaryMin: z.number().nullable().optional(),
    salaryMax: z.number().nullable().optional(),
    salaryCurrency: z.string().nullable().optional(),
    description: z.string(),
    url: z.string().nullable().optional(),
    isRemote: z.boolean().optional(),
    employmentType: z.string().nullable().optional(),
    category: z.string().nullable().optional(),
    postedAt: z.string(),
    source: z.string(),
  }),
});

export type SaveJobInput = z.infer<typeof saveJobInputSchema>;
export type KnightedSavedJob = typeof knightedSavedJobsTable.$inferSelect;
