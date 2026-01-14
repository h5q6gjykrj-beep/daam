import { pgTable, text, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// We are using localStorage as requested, but we define types here for consistency
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Client-side types for localStorage data
export interface LocalPost {
  id: string;
  authorEmail: string;
  content: string;
  createdAt: string;
}

export type Language = 'ar' | 'en';
