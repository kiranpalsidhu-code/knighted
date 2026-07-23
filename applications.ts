import { pgTable, text, serial, timestamp, date, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const applicationStatusEnum = ["Applied", "PhoneScreen", "Interview", "Offer", "Rejected"] as const;
export type ApplicationStatus = typeof applicationStatusEnum[number];

export const interviewTypeEnum = ["phone", "in_person", "online", "other"] as const;
export type InterviewType = typeof interviewTypeEnum[number];

export type InterviewEntry = {
  id: string;
  date: string;
  type: InterviewType;
  notes?: string;
};

export const applicationsTable = pgTable("resume_ready_applications", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  company: text("company").notNull(),
  role: text("role").notNull(),
  status: text("status").notNull().default("Applied"),
  notes: text("notes"),
  url: text("url"),
  salary: text("salary"),
  recruiterName: text("recruiter_name"),
  recruiterEmail: text("recruiter_email"),
  interviewDate: date("interview_date", { mode: "string" }),
  deadline: date("deadline", { mode: "string" }),
  reminderSentAt: timestamp("reminder_sent_at", { withTimezone: true }),
  appliedDate: date("applied_date", { mode: "string" }),
  interviews: jsonb("interviews").$type<InterviewEntry[]>(),
  appliedAt: timestamp("applied_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertApplicationSchema = createInsertSchema(applicationsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Application = typeof applicationsTable.$inferSelect;
