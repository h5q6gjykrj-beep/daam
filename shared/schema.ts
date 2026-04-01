import { pgTable, text, serial, boolean, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ==================== DATABASE TABLES ====================

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
});

export const insertUserSchema = createInsertSchema(users).pick({ email: true });
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Auth accounts - passwords stored here
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

// User profiles
export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull().default(""),
  major: text("major").notNull().default(""),
  university: text("university").notNull().default("UTAS"),
  level: text("level"),
  college: text("college"),
  avatarColor: text("avatar_color"),
  avatarUrl: text("avatar_url"),
  coverUrl: text("cover_url"),
  interests: jsonb("interests").$type<string[]>().default([]),
  bio: text("bio"),
  showFavorites: boolean("show_favorites").notNull().default(true),
  showInterests: boolean("show_interests").notNull().default(true),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Posts
export const posts = pgTable("posts", {
  id: text("id").primaryKey(),
  authorEmail: text("author_email").notNull(),
  content: text("content").notNull(),
  postType: text("post_type").notNull().default("discussion"),
  subject: text("subject"),
  imageUrl: text("image_url"),
  attachments: jsonb("attachments").$type<any[]>().default([]),
  status: text("status").notNull().default("visible"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
});

// Replies (flat structure with parent_reply_id for nesting)
export const replies = pgTable("replies", {
  id: text("id").primaryKey(),
  postId: text("post_id").notNull(),
  authorEmail: text("author_email").notNull(),
  content: text("content").notNull(),
  parentReplyId: text("parent_reply_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
});

// Post likes
export const postLikes = pgTable("post_likes", {
  postId: text("post_id").notNull(),
  userEmail: text("user_email").notNull(),
});

// Post saves
export const postSaves = pgTable("post_saves", {
  postId: text("post_id").notNull(),
  userEmail: text("user_email").notNull(),
});

// Follows
export const follows = pgTable("follows", {
  followerEmail: text("follower_email").notNull(),
  followingEmail: text("following_email").notNull(),
});

// Reports
export const reports = pgTable("reports", {
  id: text("id").primaryKey(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  targetTitle: text("target_title").notNull(),
  reason: text("reason").notNull(),
  note: text("note"),
  reporterEmail: text("reporter_email").notNull(),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Moderators
export const moderators = pgTable("moderators", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  role: text("role").notNull().default("moderator"),
  permissions: jsonb("permissions").$type<string[]>().default([]),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: text("created_by").notNull(),
});

// Admin-created moderator auth users
export const authUsers = pgTable("auth_users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("moderator"),
  linkedModeratorId: text("linked_moderator_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Mutes
export const mutes = pgTable("mutes", {
  id: serial("id").primaryKey(),
  userEmail: text("user_email").notNull().unique(),
  mutedBy: text("muted_by").notNull(),
  reason: text("reason"),
  mutedAt: timestamp("muted_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
});

// Bans
export const bans = pgTable("bans", {
  id: serial("id").primaryKey(),
  userEmail: text("user_email").notNull().unique(),
  bannedBy: text("banned_by").notNull(),
  reason: text("reason"),
  bannedAt: timestamp("banned_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
});

// Conversations
export const conversations = pgTable("conversations", {
  id: text("id").primaryKey(),
  participant1: text("participant1").notNull(),
  participant2: text("participant2").notNull(),
  lastMessageAt: timestamp("last_message_at").notNull().defaultNow(),
  lastMessagePreview: text("last_message_preview").notNull().default(""),
});

// Direct messages
export const directMessages = pgTable("direct_messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id").notNull(),
  senderEmail: text("sender_email").notNull(),
  content: text("content").notNull(),
  sentAt: timestamp("sent_at").notNull().defaultNow(),
  readBy: jsonb("read_by").$type<string[]>().default([]),
});

// Audit log
export const auditLog = pgTable("audit_log", {
  id: text("id").primaryKey(),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  byEmail: text("by_email").notNull(),
  at: timestamp("at").notNull().defaultNow(),
  meta: jsonb("meta").$type<Record<string, unknown>>(),
});

// Allowed domains
export const allowedDomains = pgTable("allowed_domains", {
  id: serial("id").primaryKey(),
  domain: text("domain").notNull().unique(),
});

// ==================== TYPESCRIPT INTERFACES ====================

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
