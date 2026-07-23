import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const otpVerificationsTable = pgTable("otp_verifications", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type OtpVerification = typeof otpVerificationsTable.$inferSelect;
