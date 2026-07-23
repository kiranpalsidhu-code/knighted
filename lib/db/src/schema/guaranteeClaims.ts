import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const guaranteeClaimsTable = pgTable("resume_ready_guarantee_claims", {
  id: serial("id").primaryKey(),
  clerkId: text("clerk_id").notNull(),
  email: text("email"),
  note: text("note"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type GuaranteeClaim = typeof guaranteeClaimsTable.$inferSelect;
