import { pgTable, text, serial, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// We are using localStorage as requested, but we define types here for consistency
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
});

// Auth accounts table - stores passwords and account data in PostgreSQL
export const authAccounts = pgTable("auth_accounts", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  phone: text("phone").notNull().default(""),
  governorate: text("governorate").notNull().default(""),
  wilayat: text("wilayat").notNull().default(""),
  role: text("role").notNull().default("student"),
  verified: boolean("verified").notNull().default(true),
  banned: boolean("banned").notNull().default(false),
  bannedReason: text("banned_reason"),
  isDemo: boolean("is_demo").notNull().default(false),
  allowDM: text("allow_dm").notNull().default("everyone"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Post types for discussion arena
export type PostType = 'question' | 'explanation' | 'summary' | 'discussion';

// User role types
export type UserRole = 'student' | 'moderator';

// Region data structure
export interface Region {
  governorate: string;
  wilayat: string;
}

// Allow DM setting
export type AllowDMSetting = 'everyone' | 'none';

// User account for localStorage (registration data)
export interface UserAccount {
  email: string;
  passwordHash: string; // Simple hash for demo purposes
  phone: string;
  region: Region;
  role: UserRole;
  verified: boolean;
  verificationToken?: string;
  verificationExpiry?: string;
  createdAt: string;
  rememberMe?: boolean;
  biometricEnabled?: boolean;
  banned?: boolean;
  bannedReason?: string;
  isDemo?: boolean;
  allowDM?: AllowDMSetting; // Default: 'everyone'
}

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

export type PostStatus = 'visible' | 'hidden' | 'flagged';

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
  status?: PostStatus;
}

export type Language = 'ar' | 'en';
