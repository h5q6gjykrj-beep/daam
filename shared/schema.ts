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

// Post types for discussion arena
export type PostType = 'question' | 'explanation' | 'summary' | 'discussion';

// User profile for localStorage
export interface UserProfile {
  email: string;
  name: string;
  major: string;
  university: string;
  level?: string; // Academic level (year 1, 2, etc.)
  avatarColor?: string;
  avatarUrl?: string; // Profile photo base64
  coverUrl?: string; // Cover image base64
  interests?: string[]; // Tags like ['math', 'programming']
  bio?: string;
  // Social - followers/following
  followers?: string[]; // Array of email addresses who follow this user
  following?: string[]; // Array of email addresses this user follows
  // Privacy settings
  showFavorites?: boolean; // Default true (public)
  showInterests?: boolean; // Default true (public)
}

// Client-side types for localStorage data
export interface LocalReply {
  id: string;
  authorEmail: string;
  content: string;
  createdAt: string;
  parentId?: string; // ID of parent reply for nested threading
}

export interface Attachment {
  type: 'image' | 'file';
  url: string;  // base64 data URL
  name: string; // original filename
  size: number; // bytes
}

export interface LocalPost {
  id: string;
  authorEmail: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  likedBy: string[];
  replies: LocalReply[];
  postType: PostType;
  subject?: string;
  savedBy: string[];
  imageUrl?: string;
  attachments?: Attachment[];
}

export type Language = 'ar' | 'en';
