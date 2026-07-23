import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const knightedCompanyProfilesTable = pgTable("knighted_company_profiles", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  companyName: text("company_name").notNull(),
  slug: text("slug").notNull().unique(),
  logoUrl: text("logo_url"),
  website: text("website"),
  location: text("location"),
  size: text("size"),
  foundedYear: integer("founded_year"),
  cultureBlurb: text("culture_blurb"),
  techStack: text("tech_stack"),
  benefits: text("benefits"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const upsertCompanyProfileSchema = z.object({
  companyName: z.string().min(1).max(120),
  logoUrl: z.url().optional().or(z.literal("")),
  website: z.string().optional(),
  location: z.string().optional(),
  size: z.string().optional(),
  foundedYear: z.number().int().min(1800).max(2100).optional(),
  cultureBlurb: z.string().max(1000).optional(),
  techStack: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional(),
});

export type UpsertCompanyProfile = z.infer<typeof upsertCompanyProfileSchema>;
export type KnightedCompanyProfile = typeof knightedCompanyProfilesTable.$inferSelect;
