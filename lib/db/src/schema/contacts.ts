import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const contactsTable = pgTable("resume_ready_contacts", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  company: text("company"),
  role: text("role"),
  email: text("email"),
  phone: text("phone"),
  linkedinUrl: text("linkedin_url"),
  relationship: text("relationship"),
  notes: text("notes"),
  applicationId: integer("application_id"),
  lastContactedAt: timestamp("last_contacted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertContactSchema = createInsertSchema(contactsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contactsTable.$inferSelect;
