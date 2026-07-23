import { pgTable, text, serial, timestamp, boolean, numeric, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const employmentTypeEnum = ["full_time", "part_time", "contract", "internship"] as const;
export type EmploymentType = typeof employmentTypeEnum[number];

export const knightedJobListingsTable = pgTable("knighted_job_listings", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  company: text("company").notNull(),
  companyWebsite: text("company_website"),
  location: text("location").notNull(),
  isRemote: boolean("is_remote").notNull().default(false),
  employmentType: text("employment_type"),
  salaryMin: numeric("salary_min"),
  salaryMax: numeric("salary_max"),
  salaryCurrency: text("salary_currency").notNull().default("USD"),
  category: text("category"),
  description: text("description").notNull(),
  applyUrl: text("apply_url"),
  contactEmail: text("contact_email").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdByUserId: text("created_by_user_id"),
  isPromoted: boolean("is_promoted").notNull().default(false),
  promotedUntil: timestamp("promoted_until", { withTimezone: true }),
  reviewToken: text("review_token"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  viewCount: integer("view_count").notNull().default(0),
  logoUrl: text("logo_url"),
  isAgency: boolean("is_agency").notNull().default(false),
});

export const insertKnightedJobListingSchema = createInsertSchema(knightedJobListingsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertKnightedJobListing = z.infer<typeof insertKnightedJobListingSchema>;
export type KnightedJobListing = typeof knightedJobListingsTable.$inferSelect;
