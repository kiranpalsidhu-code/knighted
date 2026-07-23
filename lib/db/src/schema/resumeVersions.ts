import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";

export const resumeVersionsTable = pgTable("resume_ready_resume_versions", {
  id: serial("id").primaryKey(),
  resumeId: integer("resume_id").notNull(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  label: text("label"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ResumeVersion = typeof resumeVersionsTable.$inferSelect;
