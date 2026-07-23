import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("resume_ready_users", {
  clerkId: text("clerk_id").primaryKey(),
  email: text("email").notNull(),
  tier: text("tier").notNull().default("free"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  planType: text("plan_type"),
  planExpiresAt: timestamp("plan_expires_at", { withTimezone: true }),
  referralCode: text("referral_code").notNull().unique(),
  referredByClerkId: text("referred_by_clerk_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
