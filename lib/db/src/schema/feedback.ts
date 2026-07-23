import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const feedbackTable = pgTable("resume_ready_feedback", {
  id: serial("id").primaryKey(),
  name: text("name"),
  email: text("email"),
  type: text("type").notNull().default("suggestion"),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Feedback = typeof feedbackTable.$inferSelect;
