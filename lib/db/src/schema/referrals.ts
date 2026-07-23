import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const referralsTable = pgTable("resume_ready_referrals", {
  id: serial("id").primaryKey(),
  referrerClerkId: text("referrer_clerk_id").notNull(),
  refereeClerkId: text("referee_clerk_id").notNull().unique(),
  refereeEmail: text("referee_email"),
  rewardMonthsGranted: text("reward_months_granted").notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Referral = typeof referralsTable.$inferSelect;
