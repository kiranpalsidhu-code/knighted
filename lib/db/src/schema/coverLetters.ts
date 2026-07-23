import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const coverLettersTable = pgTable("resume_ready_cover_letters", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  jobTitle: text("job_title").notNull().default(""),
  companyName: text("company_name").notNull().default(""),
  content: text("content").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCoverLetterSchema = createInsertSchema(coverLettersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCoverLetter = z.infer<typeof insertCoverLetterSchema>;
export type CoverLetter = typeof coverLettersTable.$inferSelect;
