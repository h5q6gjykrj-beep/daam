import { pgTable, text, serial, boolean, bigint, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

// ─── Enums / Literal Types ───────────────────────────────────────────────────
export type PostType = 'question' | 'explanation' | 'summary' | 'discussion';
export type UserRole = 'student' | 'moderator';
export type PostStatus = 'visible' | 'hidden' | 'flagged';
export type AllowDMSetting = 'everyone' | 'none';
export type Language = 'ar' | 'en';
export type ReportReason = 'spam' | 'harassment' | 'hate' | 'impersonation' | 'inappropriate' | 'other';
export type ReportTargetType = 'post' | 'comment' | 'user';
export type ReportStatus = 'open' | 'in_review' | 'resolved' | 'dismissed';
export type DaamRole = "admin" | "moderator" | "student";
export type DaamPermission =
  | "mod.posts.delete" | "mod.posts.hide" | "mod.comments.delete"
  | "mod.users.mute" | "mod.users.ban" | "admin.moderators.manage"
  | "admin.settings.manage" | "ai.view" | "ai.settings.edit"
  | "ai.sources.create" | "ai.sources.review" | "ai.train.run"
  | "ai.train.publish" | "ai.analytics.view" | "ai.audit.view";
export type AuditAction =
  | "post.hide" | "post.show" | "post.delete" | "reply.delete"
  | "moderator.create" | "moderator.permissions.update" | "moderator.toggleActive"
  | "moderator.delete" | "report.create" | "report.status.update"
  | "user.mute" | "user.unmute" | "user.ban" | "user.unban";

// ─── Interfaces (shared between client and server) ───────────────────────────
export interface Region { governorate: string; wilayat: string; }
export interface Attachment { type: 'image' | 'file'; url: string; name: string; size: number; }

export interface LocalReply {
  id: string;
  authorEmail: string;
  content: string;
  createdAt: string;
  parentId?: string;
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
  status?: PostStatus;
}

export interface UserProfile {
  email: string;
  name: string;
  major: string;
  university: string;
  level?: string;
  avatarColor?: string;
  avatarUrl?: string;
  coverUrl?: string;
  interests?: string[];
  bio?: string;
  followers?: string[];
  following?: string[];
  showFavorites?: boolean;
  showInterests?: boolean;
  [key: string]: unknown;
}

export interface UserAccount {
  email: string;
  passwordHash: string;
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
  allowDM?: AllowDMSetting;
}

export interface ModeratorAccount {
  id: string;
  email: string;
  displayName: string;
  role: "moderator";
  permissions: DaamPermission[];
  isActive: boolean;
  createdAt: number;
  createdBy: string;
}

export interface LocalAuthUser {
  id: string;
  email: string;
  passwordHash: string;
  role: DaamRole;
  linkedModeratorId?: string;
  createdAt: number;
}

export interface AuditEvent {
  id: string;
  action: AuditAction;
  targetType: "post" | "reply" | "moderator" | "report" | "user" | "comment" | "file";
  targetId: string;
  byEmail: string;
  at: number;
  meta?: Record<string, unknown>;
}

export interface Report {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  targetTitle: string;
  reason: ReportReason;
  note?: string;
  reporter: string;
  reporterEmail: string;
  status: ReportStatus;
  createdAt: string;
  resolutionReason?: string;
}

export interface MuteRecord {
  userEmail: string;
  mutedBy: string;
  reason?: string;
  mutedAt: number;
  expiresAt?: number;
}

export interface BanRecord {
  userEmail: string;
  bannedBy: string;
  reason?: string;
  bannedAt: number;
  expiresAt?: number;
}

export interface Conversation {
  id: string;
  participants: [string, string];
  lastMessageAt: string;
  lastMessagePreview: string;
  unreadCount: Record<string, number>;
}

export interface DirectMessage {
  id: string;
  conversationId: string;
  senderEmail: string;
  content: string;
  sentAt: string;
  readBy: string[];
}

// ─── Drizzle Tables ──────────────────────────────────────────────────────────

export const accounts = pgTable("accounts", {
  email: text("email").primaryKey(),
  passwordHash: text("password_hash").notNull(),
  phone: text("phone").notNull().default(''),
  region: jsonb("region").$type<Region>().notNull().default({ governorate: '', wilayat: '' }),
  role: text("role").$type<UserRole>().notNull().default('student'),
  verified: boolean("verified").notNull().default(false),
  verificationToken: text("verification_token"),
  verificationExpiry: text("verification_expiry"),
  rememberMe: boolean("remember_me").default(false),
  biometricEnabled: boolean("biometric_enabled").default(false),
  banned: boolean("banned").default(false),
  bannedReason: text("banned_reason"),
  isDemo: boolean("is_demo").default(false),
  allowDM: text("allow_dm").$type<AllowDMSetting>().default('everyone'),
  createdAt: text("created_at").notNull().default(sql`now()::text`),
});

export const profiles = pgTable("profiles", {
  email: text("email").primaryKey(),
  name: text("name").notNull().default(''),
  major: text("major").notNull().default(''),
  university: text("university").notNull().default(''),
  level: text("level"),
  avatarColor: text("avatar_color"),
  avatarUrl: text("avatar_url"),
  coverUrl: text("cover_url"),
  interests: jsonb("interests").$type<string[]>().default([]),
  bio: text("bio"),
  followers: jsonb("followers").$type<string[]>().default([]),
  following: jsonb("following").$type<string[]>().default([]),
  showFavorites: boolean("show_favorites").default(true),
  showInterests: boolean("show_interests").default(true),
  extra: jsonb("extra").$type<Record<string, unknown>>().default({}),
});

export const posts = pgTable("posts", {
  id: text("id").primaryKey(),
  authorEmail: text("author_email").notNull(),
  content: text("content").notNull(),
  postType: text("post_type").$type<PostType>().notNull().default('discussion'),
  subject: text("subject"),
  imageUrl: text("image_url"),
  attachments: jsonb("attachments").$type<Attachment[]>().default([]),
  likedBy: jsonb("liked_by").$type<string[]>().default([]),
  savedBy: jsonb("saved_by").$type<string[]>().default([]),
  status: text("status").$type<PostStatus>().default('visible'),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at"),
});

export const replies = pgTable("replies", {
  id: text("id").primaryKey(),
  postId: text("post_id").notNull(),
  authorEmail: text("author_email").notNull(),
  content: text("content").notNull(),
  parentId: text("parent_id"),
  createdAt: text("created_at").notNull(),
});

export const reports = pgTable("reports", {
  id: text("id").primaryKey(),
  targetType: text("target_type").$type<ReportTargetType>().notNull(),
  targetId: text("target_id").notNull(),
  targetTitle: text("target_title").notNull(),
  reason: text("reason").$type<ReportReason>().notNull(),
  note: text("note"),
  reporter: text("reporter").notNull(),
  reporterEmail: text("reporter_email").notNull(),
  status: text("status").$type<ReportStatus>().notNull().default('open'),
  resolutionReason: text("resolution_reason"),
  createdAt: text("created_at").notNull(),
});

export const moderators = pgTable("moderators", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  permissions: jsonb("permissions").$type<DaamPermission[]>().default([]),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: bigint("created_at", { mode: 'number' }).notNull(),
  createdBy: text("created_by").notNull(),
});

export const authUsers = pgTable("auth_users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").$type<DaamRole>().notNull().default('student'),
  linkedModeratorId: text("linked_moderator_id"),
  createdAt: bigint("created_at", { mode: 'number' }).notNull(),
});

export const auditLog = pgTable("audit_log", {
  id: text("id").primaryKey(),
  action: text("action").$type<AuditAction>().notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  byEmail: text("by_email").notNull(),
  at: bigint("at", { mode: 'number' }).notNull(),
  meta: jsonb("meta").$type<Record<string, unknown>>(),
});

export const mutes = pgTable("mutes", {
  userEmail: text("user_email").primaryKey(),
  mutedBy: text("muted_by").notNull(),
  reason: text("reason"),
  mutedAt: bigint("muted_at", { mode: 'number' }).notNull(),
  expiresAt: bigint("expires_at", { mode: 'number' }),
});

export const bans = pgTable("bans", {
  userEmail: text("user_email").primaryKey(),
  bannedBy: text("banned_by").notNull(),
  reason: text("reason"),
  bannedAt: bigint("banned_at", { mode: 'number' }).notNull(),
  expiresAt: bigint("expires_at", { mode: 'number' }),
});

export const conversations = pgTable("conversations", {
  id: text("id").primaryKey(),
  participants: jsonb("participants").$type<[string, string]>().notNull(),
  lastMessageAt: text("last_message_at").notNull(),
  lastMessagePreview: text("last_message_preview").notNull().default(''),
  unreadCount: jsonb("unread_count").$type<Record<string, number>>().default({}),
});

export const messages = pgTable("messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id").notNull(),
  senderEmail: text("sender_email").notNull(),
  content: text("content").notNull(),
  sentAt: text("sent_at").notNull(),
  readBy: jsonb("read_by").$type<string[]>().default([]),
});

export const allowedDomains = pgTable("allowed_domains", {
  domain: text("domain").primaryKey(),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value"),
});

export const profileMaterials = pgTable("profile_materials", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  title: text("title").notNull(),
  kind: text("kind").$type<"pdf" | "link" | "note">().notNull(),
  url: text("url"),
  note: text("note"),
  createdAt: bigint("created_at", { mode: 'number' }).notNull(),
});

export const profileResearch = pgTable("profile_research", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  title: text("title").notNull(),
  abstract: text("abstract"),
  tags: jsonb("tags").$type<string[]>().default([]),
  pdfUrl: text("pdf_url"),
  pdfName: text("pdf_name"),
  createdAt: bigint("created_at", { mode: 'number' }).notNull(),
});

// ─── Insert Schemas ──────────────────────────────────────────────────────────
export const insertAccountSchema = createInsertSchema(accounts);
export const insertProfileSchema = createInsertSchema(profiles);
export const insertPostSchema = createInsertSchema(posts);
export const insertReplySchema = createInsertSchema(replies);
export const insertReportSchema = createInsertSchema(reports);

export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type InsertReply = z.infer<typeof insertReplySchema>;

// Legacy export for backward compatibility
export const users = accounts;
export type User = { id?: number; email: string };
export type InsertUser = { email: string };
