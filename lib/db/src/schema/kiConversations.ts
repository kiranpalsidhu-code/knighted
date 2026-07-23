import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const kiConversationsTable = pgTable("resume_ready_ki_conversations", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull().default("New Chat"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const kiMessagesTable = pgTable("resume_ready_ki_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull(),
  role: text("role").notNull(), // "user" | "assistant"
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertKiConversationSchema = createInsertSchema(kiConversationsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertKiMessageSchema = createInsertSchema(kiMessagesTable).omit({ id: true, createdAt: true });

export type InsertKiConversation = z.infer<typeof insertKiConversationSchema>;
export type InsertKiMessage = z.infer<typeof insertKiMessageSchema>;
export type KiConversation = typeof kiConversationsTable.$inferSelect;
export type KiMessage = typeof kiMessagesTable.$inferSelect;
