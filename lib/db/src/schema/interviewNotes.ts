import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const interviewNotesTable = pgTable("resume_ready_interview_notes", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull().default("Untitled Note"),
  content: text("content").notNull().default(""),
  applicationId: integer("application_id"),
  resumeId: integer("resume_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertInterviewNoteSchema = createInsertSchema(interviewNotesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertInterviewNote = z.infer<typeof insertInterviewNoteSchema>;
export type InterviewNote = typeof interviewNotesTable.$inferSelect;
