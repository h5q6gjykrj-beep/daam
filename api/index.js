var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/vercel-entry.ts
import express from "express";
import { createServer } from "http";

// server/routes.ts
import https from "https";
import crypto2 from "crypto";

// server/storage.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, desc, sql as sql2 } from "drizzle-orm";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  accounts: () => accounts,
  allowedDomains: () => allowedDomains,
  auditLog: () => auditLog,
  authUsers: () => authUsers,
  bans: () => bans,
  campaigns: () => campaigns,
  conversations: () => conversations,
  insertAccountSchema: () => insertAccountSchema,
  insertPostSchema: () => insertPostSchema,
  insertProfileSchema: () => insertProfileSchema,
  insertReplySchema: () => insertReplySchema,
  insertReportSchema: () => insertReportSchema,
  messages: () => messages,
  moderators: () => moderators,
  mutes: () => mutes,
  posts: () => posts,
  profileMaterials: () => profileMaterials,
  profileResearch: () => profileResearch,
  profiles: () => profiles,
  replies: () => replies,
  reports: () => reports,
  settings: () => settings,
  users: () => users,
  webauthnChallenges: () => webauthnChallenges,
  webauthnCredentials: () => webauthnCredentials
});
import { pgTable, text, boolean, bigint, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";
var accounts = pgTable("accounts", {
  email: text("email").primaryKey(),
  passwordHash: text("password_hash").notNull(),
  phone: text("phone").notNull().default(""),
  region: jsonb("region").$type().notNull().default({ governorate: "", wilayat: "" }),
  role: text("role").$type().notNull().default("student"),
  verified: boolean("verified").notNull().default(false),
  verificationToken: text("verification_token"),
  verificationExpiry: text("verification_expiry"),
  resetToken: text("reset_token"),
  resetTokenExpiry: text("reset_token_expiry"),
  rememberMe: boolean("remember_me").default(false),
  biometricEnabled: boolean("biometric_enabled").default(false),
  banned: boolean("banned").default(false),
  bannedReason: text("banned_reason"),
  isDemo: boolean("is_demo").default(false),
  allowDM: text("allow_dm").$type().default("everyone"),
  createdAt: text("created_at").notNull().default(sql`now()::text`)
});
var profiles = pgTable("profiles", {
  email: text("email").primaryKey(),
  name: text("name").notNull().default(""),
  major: text("major").notNull().default(""),
  university: text("university").notNull().default(""),
  level: text("level"),
  avatarColor: text("avatar_color"),
  avatarUrl: text("avatar_url"),
  coverUrl: text("cover_url"),
  interests: jsonb("interests").$type().default([]),
  bio: text("bio"),
  followers: jsonb("followers").$type().default([]),
  following: jsonb("following").$type().default([]),
  showFavorites: boolean("show_favorites").default(true),
  showInterests: boolean("show_interests").default(true),
  extra: jsonb("extra").$type().default({})
});
var posts = pgTable("posts", {
  id: text("id").primaryKey(),
  authorEmail: text("author_email").notNull(),
  content: text("content").notNull(),
  postType: text("post_type").$type().notNull().default("discussion"),
  subject: text("subject"),
  imageUrl: text("image_url"),
  attachments: jsonb("attachments").$type().default([]),
  likedBy: jsonb("liked_by").$type().default([]),
  savedBy: jsonb("saved_by").$type().default([]),
  status: text("status").$type().default("visible"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at")
});
var replies = pgTable("replies", {
  id: text("id").primaryKey(),
  postId: text("post_id").notNull(),
  authorEmail: text("author_email").notNull(),
  content: text("content").notNull(),
  parentId: text("parent_id"),
  createdAt: text("created_at").notNull()
});
var reports = pgTable("reports", {
  id: text("id").primaryKey(),
  targetType: text("target_type").$type().notNull(),
  targetId: text("target_id").notNull(),
  targetTitle: text("target_title").notNull(),
  reason: text("reason").$type().notNull(),
  note: text("note"),
  reporter: text("reporter").notNull(),
  reporterEmail: text("reporter_email").notNull(),
  status: text("status").$type().notNull().default("open"),
  resolutionReason: text("resolution_reason"),
  createdAt: text("created_at").notNull()
});
var moderators = pgTable("moderators", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  permissions: jsonb("permissions").$type().default([]),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  createdBy: text("created_by").notNull()
});
var authUsers = pgTable("auth_users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").$type().notNull().default("student"),
  linkedModeratorId: text("linked_moderator_id"),
  createdAt: bigint("created_at", { mode: "number" }).notNull()
});
var auditLog = pgTable("audit_log", {
  id: text("id").primaryKey(),
  action: text("action").$type().notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  byEmail: text("by_email").notNull(),
  at: bigint("at", { mode: "number" }).notNull(),
  meta: jsonb("meta").$type()
});
var mutes = pgTable("mutes", {
  userEmail: text("user_email").primaryKey(),
  mutedBy: text("muted_by").notNull(),
  reason: text("reason"),
  mutedAt: bigint("muted_at", { mode: "number" }).notNull(),
  expiresAt: bigint("expires_at", { mode: "number" })
});
var bans = pgTable("bans", {
  userEmail: text("user_email").primaryKey(),
  bannedBy: text("banned_by").notNull(),
  reason: text("reason"),
  bannedAt: bigint("banned_at", { mode: "number" }).notNull(),
  expiresAt: bigint("expires_at", { mode: "number" })
});
var conversations = pgTable("conversations", {
  id: text("id").primaryKey(),
  participants: jsonb("participants").$type().notNull(),
  lastMessageAt: text("last_message_at").notNull(),
  lastMessagePreview: text("last_message_preview").notNull().default(""),
  unreadCount: jsonb("unread_count").$type().default({})
});
var messages = pgTable("messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id").notNull(),
  senderEmail: text("sender_email").notNull(),
  content: text("content").notNull(),
  sentAt: text("sent_at").notNull(),
  readBy: jsonb("read_by").$type().default([])
});
var allowedDomains = pgTable("allowed_domains", {
  domain: text("domain").primaryKey()
});
var settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value")
});
var profileMaterials = pgTable("profile_materials", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  title: text("title").notNull(),
  kind: text("kind").$type().notNull(),
  url: text("url"),
  note: text("note"),
  createdAt: bigint("created_at", { mode: "number" }).notNull()
});
var profileResearch = pgTable("profile_research", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  title: text("title").notNull(),
  abstract: text("abstract"),
  tags: jsonb("tags").$type().default([]),
  pdfUrl: text("pdf_url"),
  pdfName: text("pdf_name"),
  createdAt: bigint("created_at", { mode: "number" }).notNull()
});
var campaigns = pgTable("campaigns", {
  id: text("id").primaryKey(),
  data: jsonb("data").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull()
});
var webauthnChallenges = pgTable("webauthn_challenges", {
  key: text("key").primaryKey(),
  challenge: text("challenge").notNull(),
  expiresAt: bigint("expires_at", { mode: "number" }).notNull()
});
var webauthnCredentials = pgTable("webauthn_credentials", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  credentialId: text("credential_id").notNull().unique(),
  publicKey: text("public_key").notNull(),
  counter: bigint("counter", { mode: "number" }).notNull().default(0),
  transports: jsonb("transports").$type().default([]),
  createdAt: bigint("created_at", { mode: "number" }).notNull()
});
var insertAccountSchema = createInsertSchema(accounts);
var insertProfileSchema = createInsertSchema(profiles);
var insertPostSchema = createInsertSchema(posts);
var insertReplySchema = createInsertSchema(replies);
var insertReportSchema = createInsertSchema(reports);
var users = accounts;

// server/storage.ts
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle(pool, { schema: schema_exports });
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}
async function getAccount(email) {
  const row = await db.select().from(accounts).where(eq(accounts.email, email.toLowerCase())).limit(1);
  if (!row[0]) return void 0;
  return rowToAccount(row[0]);
}
async function getAllAccounts() {
  const rows = await db.select().from(accounts);
  const result = {};
  for (const row of rows) result[row.email] = rowToAccount(row);
  return result;
}
async function updateAccountPassword(email, plainPassword) {
  const passwordHash = simpleHash(plainPassword);
  const emailLower = email.toLowerCase();
  await pool.query(
    "UPDATE accounts SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL WHERE email = $2",
    [passwordHash, emailLower]
  );
  await pool.query(
    "UPDATE auth_users SET password_hash = $1 WHERE email = $2",
    [plainPassword, emailLower]
  );
}
async function deleteAccount(email) {
  const emailLower = email.toLowerCase();
  await pool.query("DELETE FROM accounts WHERE email = $1", [emailLower]);
  await pool.query("DELETE FROM auth_users WHERE email = $1", [emailLower]);
  await db.delete(profiles).where(eq(profiles.email, emailLower));
}
async function upsertAccount(acc) {
  await db.insert(accounts).values({
    email: acc.email.toLowerCase(),
    passwordHash: acc.passwordHash,
    phone: acc.phone || "",
    region: acc.region || { governorate: "", wilayat: "" },
    role: acc.role || "student",
    verified: acc.verified ?? false,
    verificationToken: acc.verificationToken,
    verificationExpiry: acc.verificationExpiry,
    resetToken: acc.resetToken,
    resetTokenExpiry: acc.resetTokenExpiry,
    rememberMe: acc.rememberMe ?? false,
    biometricEnabled: acc.biometricEnabled ?? false,
    banned: acc.banned ?? false,
    bannedReason: acc.bannedReason,
    isDemo: acc.isDemo ?? false,
    allowDM: acc.allowDM || "everyone",
    createdAt: acc.createdAt
  }).onConflictDoUpdate({
    target: accounts.email,
    set: {
      passwordHash: sql2`excluded.password_hash`,
      phone: sql2`excluded.phone`,
      region: sql2`excluded.region`,
      role: sql2`excluded.role`,
      verified: sql2`excluded.verified`,
      verificationToken: sql2`excluded.verification_token`,
      verificationExpiry: sql2`excluded.verification_expiry`,
      resetToken: sql2`excluded.reset_token`,
      resetTokenExpiry: sql2`excluded.reset_token_expiry`,
      rememberMe: sql2`excluded.remember_me`,
      biometricEnabled: sql2`excluded.biometric_enabled`,
      banned: sql2`excluded.banned`,
      bannedReason: sql2`excluded.banned_reason`,
      isDemo: sql2`excluded.is_demo`,
      allowDM: sql2`excluded.allow_dm`
    }
  });
}
function rowToAccount(row) {
  return {
    email: row.email,
    passwordHash: row.passwordHash,
    phone: row.phone,
    region: row.region || { governorate: "", wilayat: "" },
    role: row.role || "student",
    verified: row.verified,
    verificationToken: row.verificationToken ?? void 0,
    verificationExpiry: row.verificationExpiry ?? void 0,
    resetToken: row.resetToken ?? void 0,
    resetTokenExpiry: row.resetTokenExpiry ?? void 0,
    rememberMe: row.rememberMe ?? false,
    biometricEnabled: row.biometricEnabled ?? false,
    banned: row.banned ?? false,
    bannedReason: row.bannedReason ?? void 0,
    isDemo: row.isDemo ?? false,
    allowDM: row.allowDM ?? "everyone",
    createdAt: row.createdAt
  };
}
async function getProfile(email) {
  const row = await db.select().from(profiles).where(eq(profiles.email, email)).limit(1);
  if (!row[0]) return void 0;
  return rowToProfile(row[0]);
}
async function getAllProfiles() {
  const rows = await db.select().from(profiles);
  const result = {};
  for (const row of rows) result[row.email] = rowToProfile(row);
  return result;
}
async function upsertProfile(email, data) {
  const existing = await getProfile(email);
  const merged = existing ? { ...existing, ...data } : { email, name: "", major: "", university: "", ...data };
  const extra = {};
  const knownKeys = ["email", "name", "major", "university", "level", "avatarColor", "avatarUrl", "coverUrl", "interests", "bio", "followers", "following", "showFavorites", "showInterests"];
  for (const [k, v] of Object.entries(merged)) {
    if (!knownKeys.includes(k)) extra[k] = v;
  }
  await db.insert(profiles).values({
    email,
    name: merged.name || "",
    major: merged.major || "",
    university: merged.university || "",
    level: merged.level,
    avatarColor: merged.avatarColor,
    avatarUrl: merged.avatarUrl,
    coverUrl: merged.coverUrl,
    interests: merged.interests || [],
    bio: merged.bio,
    followers: merged.followers || [],
    following: merged.following || [],
    showFavorites: merged.showFavorites ?? true,
    showInterests: merged.showInterests ?? true,
    extra
  }).onConflictDoUpdate({
    target: profiles.email,
    set: {
      name: sql2`excluded.name`,
      major: sql2`excluded.major`,
      university: sql2`excluded.university`,
      level: sql2`excluded.level`,
      avatarColor: sql2`excluded.avatar_color`,
      avatarUrl: sql2`excluded.avatar_url`,
      coverUrl: sql2`excluded.cover_url`,
      interests: sql2`excluded.interests`,
      bio: sql2`excluded.bio`,
      followers: sql2`excluded.followers`,
      following: sql2`excluded.following`,
      showFavorites: sql2`excluded.show_favorites`,
      showInterests: sql2`excluded.show_interests`,
      extra: sql2`excluded.extra`
    }
  });
}
function rowToProfile(row) {
  const extra = row.extra || {};
  return {
    email: row.email,
    name: row.name,
    major: row.major,
    university: row.university,
    level: row.level ?? void 0,
    avatarColor: row.avatarColor ?? void 0,
    avatarUrl: row.avatarUrl ?? void 0,
    coverUrl: row.coverUrl ?? void 0,
    interests: row.interests ?? [],
    bio: row.bio ?? void 0,
    followers: row.followers ?? [],
    following: row.following ?? [],
    showFavorites: row.showFavorites ?? true,
    showInterests: row.showInterests ?? true,
    ...extra
  };
}
async function getAllPosts() {
  const [postRows, replyRows] = await Promise.all([
    db.select().from(posts).orderBy(desc(posts.createdAt)),
    db.select().from(replies).orderBy(replies.createdAt)
  ]);
  const replyMap = {};
  for (const r of replyRows) {
    if (!replyMap[r.postId]) replyMap[r.postId] = [];
    replyMap[r.postId].push({ id: r.id, authorEmail: r.authorEmail, content: r.content, createdAt: r.createdAt, parentId: r.parentId ?? void 0 });
  }
  return postRows.map((p) => ({
    id: p.id,
    authorEmail: p.authorEmail,
    content: p.content,
    postType: p.postType || "discussion",
    subject: p.subject ?? void 0,
    imageUrl: p.imageUrl ?? void 0,
    attachments: p.attachments ?? [],
    likedBy: p.likedBy ?? [],
    savedBy: p.savedBy ?? [],
    status: p.status ?? "visible",
    createdAt: p.createdAt,
    updatedAt: p.updatedAt ?? void 0,
    replies: replyMap[p.id] || []
  }));
}
async function createPost(post) {
  await db.insert(posts).values({
    id: post.id,
    authorEmail: post.authorEmail,
    content: post.content,
    postType: post.postType,
    subject: post.subject,
    imageUrl: post.imageUrl,
    attachments: post.attachments || [],
    likedBy: post.likedBy,
    savedBy: post.savedBy,
    status: post.status || "visible",
    createdAt: post.createdAt,
    updatedAt: post.updatedAt
  });
}
async function updatePost(postId, data) {
  const updateData = {};
  if (data.content !== void 0) updateData.content = data.content;
  if (data.postType !== void 0) updateData.postType = data.postType;
  if ("subject" in data) updateData.subject = data.subject;
  if (data.status !== void 0) updateData.status = data.status;
  if (data.likedBy !== void 0) updateData.likedBy = data.likedBy;
  if (data.savedBy !== void 0) updateData.savedBy = data.savedBy;
  if (data.updatedAt !== void 0) updateData.updatedAt = data.updatedAt;
  if (Object.keys(updateData).length > 0)
    await db.update(posts).set(updateData).where(eq(posts.id, postId));
}
async function deletePost(postId) {
  await db.delete(replies).where(eq(replies.postId, postId));
  await db.delete(posts).where(eq(posts.id, postId));
}
async function addReply(reply) {
  await db.insert(replies).values({
    id: reply.id,
    postId: reply.postId,
    authorEmail: reply.authorEmail,
    content: reply.content,
    parentId: reply.parentId,
    createdAt: reply.createdAt
  });
}
async function updateReply(replyId, content) {
  await db.update(replies).set({ content }).where(eq(replies.id, replyId));
}
async function deleteReply(replyId) {
  await db.delete(replies).where(eq(replies.id, replyId));
}
async function getAllReports() {
  const rows = await db.select().from(reports).orderBy(desc(reports.createdAt));
  return rows.map((r) => ({
    id: r.id,
    targetType: r.targetType,
    targetId: r.targetId,
    targetTitle: r.targetTitle,
    reason: r.reason,
    note: r.note ?? void 0,
    reporter: r.reporter,
    reporterEmail: r.reporterEmail,
    status: r.status,
    resolutionReason: r.resolutionReason ?? void 0,
    createdAt: r.createdAt
  }));
}
async function createReport(report) {
  await db.insert(reports).values({
    id: report.id,
    targetType: report.targetType,
    targetId: report.targetId,
    targetTitle: report.targetTitle,
    reason: report.reason,
    note: report.note,
    reporter: report.reporter,
    reporterEmail: report.reporterEmail,
    status: report.status,
    createdAt: report.createdAt
  });
}
async function updateReportStatus(reportId, status, resolutionReason) {
  await db.update(reports).set({ status, resolutionReason }).where(eq(reports.id, reportId));
}
async function getAllModerators() {
  const rows = await db.select().from(moderators);
  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    displayName: r.displayName,
    role: "moderator",
    permissions: r.permissions || [],
    isActive: r.isActive,
    createdAt: Number(r.createdAt),
    createdBy: r.createdBy
  }));
}
async function createModerator(mod) {
  await db.insert(moderators).values({
    id: mod.id,
    email: mod.email,
    displayName: mod.displayName,
    permissions: mod.permissions,
    isActive: mod.isActive,
    createdAt: mod.createdAt,
    createdBy: mod.createdBy
  });
}
async function updateModeratorPermissions(modId, permissions) {
  await db.update(moderators).set({ permissions }).where(eq(moderators.id, modId));
}
async function toggleModeratorActive(modId) {
  const mod = await db.select().from(moderators).where(eq(moderators.id, modId)).limit(1);
  if (mod[0]) await db.update(moderators).set({ isActive: !mod[0].isActive }).where(eq(moderators.id, modId));
}
async function deleteModerator(modId) {
  await db.delete(authUsers).where(eq(authUsers.linkedModeratorId, modId));
  await db.delete(moderators).where(eq(moderators.id, modId));
}
async function getAuthUserByEmail(email) {
  const rows = await db.select().from(authUsers).where(sql2`LOWER(${authUsers.email}) = LOWER(${email})`).limit(1);
  if (!rows[0]) return void 0;
  const r = rows[0];
  return { id: r.id, email: r.email, passwordHash: r.passwordHash, role: r.role, linkedModeratorId: r.linkedModeratorId ?? void 0, createdAt: Number(r.createdAt) };
}
async function getAllAuthUsers() {
  const rows = await db.select().from(authUsers);
  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    passwordHash: r.passwordHash,
    role: r.role,
    linkedModeratorId: r.linkedModeratorId ?? void 0,
    createdAt: Number(r.createdAt)
  }));
}
async function createAuthUser(user) {
  await db.insert(authUsers).values({
    id: user.id,
    email: user.email.toLowerCase(),
    passwordHash: user.passwordHash,
    role: user.role,
    linkedModeratorId: user.linkedModeratorId,
    createdAt: user.createdAt
  }).onConflictDoUpdate({
    target: authUsers.email,
    set: { passwordHash: sql2`excluded.password_hash` }
  });
}
async function getAuditLog(limit = 200) {
  const rows = await db.select().from(auditLog).orderBy(desc(auditLog.at)).limit(limit);
  return rows.map((r) => ({
    id: r.id,
    action: r.action,
    targetType: r.targetType,
    targetId: r.targetId,
    byEmail: r.byEmail,
    at: Number(r.at),
    meta: r.meta ?? void 0
  }));
}
async function addAuditEvent(event) {
  await db.insert(auditLog).values({
    id: event.id,
    action: event.action,
    targetType: event.targetType,
    targetId: event.targetId,
    byEmail: event.byEmail,
    at: event.at,
    meta: event.meta
  }).onConflictDoNothing();
}
async function getAllMutes() {
  const rows = await db.select().from(mutes);
  return rows.map((r) => ({
    userEmail: r.userEmail,
    mutedBy: r.mutedBy,
    reason: r.reason ?? void 0,
    mutedAt: Number(r.mutedAt),
    expiresAt: r.expiresAt ? Number(r.expiresAt) : void 0
  }));
}
async function upsertMute(mute) {
  await db.insert(mutes).values({
    userEmail: mute.userEmail.toLowerCase(),
    mutedBy: mute.mutedBy,
    reason: mute.reason,
    mutedAt: mute.mutedAt,
    expiresAt: mute.expiresAt
  }).onConflictDoUpdate({
    target: mutes.userEmail,
    set: { mutedBy: sql2`excluded.muted_by`, reason: sql2`excluded.reason`, mutedAt: sql2`excluded.muted_at`, expiresAt: sql2`excluded.expires_at` }
  });
}
async function deleteMute(userEmail) {
  await db.delete(mutes).where(eq(mutes.userEmail, userEmail.toLowerCase()));
}
async function getAllBans() {
  const rows = await db.select().from(bans);
  return rows.map((r) => ({
    userEmail: r.userEmail,
    bannedBy: r.bannedBy,
    reason: r.reason ?? void 0,
    bannedAt: Number(r.bannedAt),
    expiresAt: r.expiresAt ? Number(r.expiresAt) : void 0
  }));
}
async function upsertBan(ban) {
  await db.insert(bans).values({
    userEmail: ban.userEmail.toLowerCase(),
    bannedBy: ban.bannedBy,
    reason: ban.reason,
    bannedAt: ban.bannedAt,
    expiresAt: ban.expiresAt
  }).onConflictDoUpdate({
    target: bans.userEmail,
    set: { bannedBy: sql2`excluded.banned_by`, reason: sql2`excluded.reason`, bannedAt: sql2`excluded.banned_at`, expiresAt: sql2`excluded.expires_at` }
  });
}
async function deleteBan(userEmail) {
  await db.delete(bans).where(eq(bans.userEmail, userEmail.toLowerCase()));
}
async function getConversations() {
  const rows = await db.select().from(conversations).orderBy(desc(conversations.lastMessageAt));
  return rows.map((r) => ({
    id: r.id,
    participants: r.participants,
    lastMessageAt: r.lastMessageAt,
    lastMessagePreview: r.lastMessagePreview,
    unreadCount: r.unreadCount || {}
  }));
}
async function upsertConversation(conv) {
  await db.insert(conversations).values({
    id: conv.id,
    participants: conv.participants,
    lastMessageAt: conv.lastMessageAt,
    lastMessagePreview: conv.lastMessagePreview,
    unreadCount: conv.unreadCount
  }).onConflictDoUpdate({
    target: conversations.id,
    set: { lastMessageAt: sql2`excluded.last_message_at`, lastMessagePreview: sql2`excluded.last_message_preview`, unreadCount: sql2`excluded.unread_count` }
  });
}
async function getAllMessages() {
  const rows = await db.select().from(messages).orderBy(messages.sentAt);
  return rows.map((r) => ({
    id: r.id,
    conversationId: r.conversationId,
    senderEmail: r.senderEmail,
    content: r.content,
    sentAt: r.sentAt,
    readBy: r.readBy || []
  }));
}
async function createMessage(msg) {
  await db.insert(messages).values({
    id: msg.id,
    conversationId: msg.conversationId,
    senderEmail: msg.senderEmail,
    content: msg.content,
    sentAt: msg.sentAt,
    readBy: msg.readBy
  });
}
async function markMessagesRead(conversationId, userEmail) {
  const msgs = await db.select().from(messages).where(eq(messages.conversationId, conversationId));
  for (const msg of msgs) {
    const readBy = msg.readBy || [];
    if (!readBy.includes(userEmail))
      await db.update(messages).set({ readBy: [...readBy, userEmail] }).where(eq(messages.id, msg.id));
  }
  const convRows = await db.select().from(conversations).where(eq(conversations.id, conversationId)).limit(1);
  if (convRows[0]) {
    const unreadCount = { ...convRows[0].unreadCount || {}, [userEmail]: 0 };
    await db.update(conversations).set({ unreadCount }).where(eq(conversations.id, conversationId));
  }
}
async function getAllowedDomains() {
  const rows = await db.select().from(allowedDomains);
  return rows.map((r) => r.domain);
}
async function addAllowedDomain(domain) {
  await db.insert(allowedDomains).values({ domain }).onConflictDoNothing();
}
async function removeAllowedDomain(domain) {
  await db.delete(allowedDomains).where(eq(allowedDomains.domain, domain));
}
async function getSetting(key) {
  const row = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  return row[0]?.value ?? null;
}
async function setSetting(key, value) {
  await db.insert(settings).values({ key, value }).onConflictDoUpdate({
    target: settings.key,
    set: { value: sql2`excluded.value` }
  });
}
async function getAllCampaigns() {
  const rows = await db.select().from(campaigns).orderBy(desc(campaigns.updatedAt));
  return rows.map((r) => r.data);
}
async function getCampaignById(id) {
  const rows = await db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1);
  return rows[0]?.data;
}
async function upsertCampaign(campaign) {
  await db.insert(campaigns).values({
    id: campaign.id,
    data: campaign,
    createdAt: campaign.createdAt,
    updatedAt: campaign.updatedAt
  }).onConflictDoUpdate({
    target: campaigns.id,
    set: { data: sql2`excluded.data`, updatedAt: sql2`excluded.updated_at` }
  });
}
async function deleteCampaignById(id) {
  await db.delete(campaigns).where(eq(campaigns.id, id));
}
async function loadAllData() {
  const [
    accountsData,
    profilesData,
    postsData,
    reportsData,
    moderatorsData,
    authUsersData,
    auditLogData,
    mutesData,
    bansData,
    conversationsData,
    messagesData,
    domainsData,
    campaignsData
  ] = await Promise.all([
    getAllAccounts(),
    getAllProfiles(),
    getAllPosts(),
    getAllReports(),
    getAllModerators(),
    getAllAuthUsers(),
    getAuditLog(),
    getAllMutes(),
    getAllBans(),
    getConversations(),
    getAllMessages(),
    getAllowedDomains(),
    getAllCampaigns()
  ]);
  return {
    accounts: accountsData,
    profiles: profilesData,
    posts: postsData,
    reports: reportsData,
    moderators: moderatorsData,
    authUsers: authUsersData,
    auditLog: auditLogData,
    mutes: mutesData,
    bans: bansData,
    conversations: conversationsData,
    messages: messagesData,
    allowedDomains: domainsData,
    campaigns: campaignsData
  };
}
async function getMaterials(email) {
  return db.select().from(profileMaterials).where(eq(profileMaterials.email, email.toLowerCase())).orderBy(desc(profileMaterials.createdAt));
}
async function addMaterial(data) {
  await db.insert(profileMaterials).values({
    id: data.id,
    email: data.email.toLowerCase(),
    title: data.title,
    kind: data.kind,
    url: data.url,
    note: data.note,
    createdAt: data.createdAt
  });
}
async function updateMaterial(id, data) {
  await db.update(profileMaterials).set(data).where(eq(profileMaterials.id, id));
}
async function deleteMaterial(id) {
  await db.delete(profileMaterials).where(eq(profileMaterials.id, id));
}
async function getResearch(email) {
  return db.select().from(profileResearch).where(eq(profileResearch.email, email.toLowerCase())).orderBy(desc(profileResearch.createdAt));
}
async function addResearch(data) {
  await db.insert(profileResearch).values({
    id: data.id,
    email: data.email.toLowerCase(),
    title: data.title,
    abstract: data.abstract,
    tags: data.tags || [],
    pdfUrl: data.pdfUrl,
    pdfName: data.pdfName,
    createdAt: data.createdAt
  });
}
async function updateResearch(id, data) {
  await db.update(profileResearch).set(data).where(eq(profileResearch.id, id));
}
async function deleteResearch(id) {
  await db.delete(profileResearch).where(eq(profileResearch.id, id));
}
async function setWebAuthnChallenge(key, challenge) {
  const expiresAt = Date.now() + 5 * 60 * 1e3;
  await db.insert(webauthnChallenges).values({ key, challenge, expiresAt }).onConflictDoUpdate({ target: webauthnChallenges.key, set: { challenge, expiresAt } });
}
async function getAndDeleteWebAuthnChallenge(key) {
  const rows = await db.select().from(webauthnChallenges).where(eq(webauthnChallenges.key, key)).limit(1);
  if (!rows[0]) return void 0;
  await db.delete(webauthnChallenges).where(eq(webauthnChallenges.key, key));
  if (Date.now() > rows[0].expiresAt) return void 0;
  return rows[0].challenge;
}
async function getWebAuthnCredentials(email) {
  const rows = await db.select().from(webauthnCredentials).where(eq(webauthnCredentials.email, email.toLowerCase()));
  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    credentialId: r.credentialId,
    publicKey: r.publicKey,
    counter: r.counter,
    transports: r.transports ?? [],
    createdAt: r.createdAt
  }));
}
async function getWebAuthnCredentialById(credentialId) {
  const rows = await db.select().from(webauthnCredentials).where(eq(webauthnCredentials.credentialId, credentialId)).limit(1);
  if (!rows[0]) return void 0;
  const r = rows[0];
  return { id: r.id, email: r.email, credentialId: r.credentialId, publicKey: r.publicKey, counter: r.counter, transports: r.transports ?? [], createdAt: r.createdAt };
}
async function saveWebAuthnCredential(cred) {
  await db.insert(webauthnCredentials).values({
    id: cred.id,
    email: cred.email.toLowerCase(),
    credentialId: cred.credentialId,
    publicKey: cred.publicKey,
    counter: cred.counter,
    transports: cred.transports,
    createdAt: cred.createdAt
  });
}
async function updateWebAuthnCounter(credentialId, counter) {
  await db.update(webauthnCredentials).set({ counter }).where(eq(webauthnCredentials.credentialId, credentialId));
}

// server/cloudinary.ts
import { v2 as cloudinary } from "cloudinary";
import crypto from "crypto";
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
function uploadImageBuffer(buffer) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: "daam/images",
        resource_type: "image",
        transformation: [
          { quality: "auto", fetch_format: "auto", width: 2e3, crop: "limit" }
        ]
      },
      (err, result) => {
        if (err || !result) return reject(err ?? new Error("Upload failed"));
        resolve(result.secure_url);
      }
    ).end(buffer);
  });
}
function uploadVideoBuffer(buffer) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: "daam/campaign-videos", resource_type: "video" },
      (err, result) => {
        if (err || !result) return reject(err ?? new Error("Upload failed"));
        resolve(result.secure_url);
      }
    ).end(buffer);
  });
}
function uploadPdfBuffer(buffer, originalName) {
  const publicId = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: "daam/materials",
        resource_type: "raw",
        public_id: publicId,
        context: { original_name: originalName }
      },
      (err, result) => {
        if (err || !result) return reject(err ?? new Error("Upload failed"));
        resolve(result.secure_url);
      }
    ).end(buffer);
  });
}
function extractPublicId(url, resourceType) {
  try {
    const marker = "/upload/";
    const idx = url.indexOf(marker);
    if (idx === -1) return null;
    let id = url.slice(idx + marker.length).replace(/^v\d+\//, "");
    if (resourceType === "image") id = id.replace(/\.[^/.]+$/, "");
    return id;
  } catch {
    return null;
  }
}
function generateSignedUrl(url) {
  const publicId = extractPublicId(url, "raw");
  if (!publicId) return null;
  return cloudinary.url(publicId, {
    type: "upload",
    resource_type: "raw",
    sign_url: true,
    expires_at: Math.floor(Date.now() / 1e3) + 3600,
    secure: true
  });
}
async function deleteCloudinaryFile(url, resourceType) {
  const publicId = extractPublicId(url, resourceType);
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

// server/routes.ts
import { Resend } from "resend";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} from "@simplewebauthn/server";
var RP_NAME = "\u0645\u0646\u0635\u0629 \u062F\u0627\u0645";
var RP_ID = process.env.WEBAUTHN_RP_ID || "localhost";
var ORIGIN = process.env.WEBAUTHN_ORIGIN || `http://localhost:5000`;
async function registerRoutes(httpServer2, app2) {
  app2.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app2.get("/api/ping", (_req, res) => res.json({ status: "ok", ts: Date.now() }));
  app2.get("/api/stats/users-count", async (_req, res) => {
    try {
      const accounts2 = await getAllAccounts();
      const count = Object.keys(accounts2).length;
      res.json({ count });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/data", async (_req, res) => {
    try {
      const data = await loadAllData();
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  const simpleHash2 = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  };
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || password === void 0) return res.status(400).json({ error: "Email and password required" });
      const emailLower = email.toLowerCase();
      const authUser = await getAuthUserByEmail(emailLower);
      if (authUser) {
        if (authUser.passwordHash !== password) return res.status(401).json({ error: "Incorrect password" });
        return res.json({ type: "authUser", authUser });
      }
      const account = await getAccount(emailLower);
      if (!account) return res.status(404).json({ error: "Account not registered" });
      if (!account.verified) return res.status(403).json({ error: "Please verify your email first" });
      if (account.banned) return res.status(403).json({ error: "Your account is banned: " + (account.bannedReason || "") });
      const computed = simpleHash2(password);
      console.log("[login] storedHash:", account.passwordHash, "| computed:", computed, "| match:", account.passwordHash === computed);
      if (account.passwordHash !== computed) return res.status(401).json({ error: "Incorrect password" });
      return res.json({ type: "account", account });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.post("/api/register", async (req, res) => {
    try {
      const { email, password, name, phone, governorate, wilayat } = req.body;
      if (!email || !password || !name) return res.status(400).json({ error: "Missing required fields" });
      const emailLower = email.toLowerCase();
      const isModerator = emailLower === "w.qq89@hotmail.com";
      const existing = await getAccount(emailLower);
      if (existing) return res.status(409).json({ error: "Email already registered" });
      if (!isModerator) {
        if (emailLower.includes("@hotmail.")) return res.status(400).json({ error: "Hotmail emails are not allowed" });
        const allowedDomains2 = await getAllowedDomains();
        const domain = emailLower.split("@")[1];
        if (!domain || !allowedDomains2.includes(domain)) {
          return res.status(400).json({ error: "Please use an approved university email" });
        }
      }
      const token = crypto2.randomBytes(32).toString("hex");
      const expiry = new Date(Date.now() + 24 * 60 * 60 * 1e3).toISOString();
      await upsertAccount({
        email: emailLower,
        passwordHash: simpleHash2(password),
        phone: phone || "",
        region: { governorate: governorate || "", wilayat: wilayat || "" },
        role: isModerator ? "moderator" : "student",
        verified: false,
        verificationToken: token,
        verificationExpiry: expiry,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      await upsertProfile(emailLower, {
        email: emailLower,
        name,
        bio: "",
        major: "",
        university: "UTAS",
        followers: [],
        following: []
      });
      const verifyUrl = `https://daamtaaleem.com/verify?token=${token}`;
      try {
        console.log("[register] Sending email to:", emailLower);
        console.log("[register] RESEND_API_KEY present:", !!process.env.RESEND_API_KEY);
        const resend = new Resend(process.env.RESEND_API_KEY);
        const resendResult = await resend.emails.send({
          from: "noreply@daamtaaleem.com",
          to: emailLower,
          subject: "\u062A\u0623\u0643\u064A\u062F \u062D\u0633\u0627\u0628\u0643 \u0641\u064A \u0645\u0646\u0635\u0629 \u062F\u0627\u0645 | Verify your DAAM account",
          headers: { "X-Priority": "1", "Importance": "high" },
          html: `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:Arial,sans-serif;direction:rtl">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:40px 20px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:16px;overflow:hidden;border:1px solid #2a2a2a;max-width:100%">
        <tr><td style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:32px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:28px;font-weight:bold">\u0645\u0646\u0635\u0629 \u062F\u0627\u0645</h1>
          <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px">DAAM Student Platform</p>
        </td></tr>
        <tr><td style="padding:32px">
          <h2 style="color:#e2e8f0;margin:0 0 16px;font-size:20px">\u0645\u0631\u062D\u0628\u0627\u064B\u060C ${name}!</h2>
          <p style="color:#94a3b8;line-height:1.7;margin:0 0 24px;font-size:15px">
            \u0634\u0643\u0631\u0627\u064B \u0644\u062A\u0633\u062C\u064A\u0644\u0643 \u0641\u064A \u0645\u0646\u0635\u0629 \u062F\u0627\u0645. \u0644\u062A\u0641\u0639\u064A\u0644 \u062D\u0633\u0627\u0628\u0643 \u0648\u0627\u0644\u0628\u062F\u0621 \u0641\u064A \u0627\u0644\u0646\u0642\u0627\u0634 \u0645\u0639 \u0632\u0645\u0644\u0627\u0626\u0643\u060C \u0627\u0636\u063A\u0637 \u0639\u0644\u0649 \u0627\u0644\u0632\u0631 \u0623\u062F\u0646\u0627\u0647:
          </p>
          <div style="text-align:center;margin:32px 0">
            <a href="${verifyUrl}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:bold">
              \u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u062D\u0633\u0627\u0628
            </a>
          </div>
          <hr style="border:none;border-top:1px solid #2a2a2a;margin:24px 0">
          <p style="color:#64748b;font-size:13px;line-height:1.6;margin:0 0 8px;direction:ltr;text-align:left">
            <strong style="color:#94a3b8">Hello, ${name}!</strong><br>
            Thank you for registering on DAAM Platform. Click the button above or the link below to verify your account:
          </p>
          <p style="margin:12px 0 0;direction:ltr;text-align:left">
            <a href="${verifyUrl}" style="color:#7c3aed;font-size:12px;word-break:break-all">${verifyUrl}</a>
          </p>
          <p style="color:#475569;font-size:12px;margin:16px 0 0;text-align:center">
            \u0647\u0630\u0627 \u0627\u0644\u0631\u0627\u0628\u0637 \u0635\u0627\u0644\u062D \u0644\u0645\u062F\u0629 24 \u0633\u0627\u0639\u0629 \xB7 This link expires in 24 hours
          </p>
        </td></tr>
        <tr><td style="background:#111;padding:20px;text-align:center">
          <p style="color:#475569;font-size:12px;margin:0">\xA9 2026 DAAM \xB7 daamtaaleem.com</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
        });
        console.log("[register] Resend result:", JSON.stringify(resendResult));
      } catch (emailErr) {
        console.error("[register] Resend error:", emailErr.message, emailErr);
      }
      return res.json({ ok: true, email: emailLower });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/verify-email", async (req, res) => {
    try {
      const token = req.query.token;
      if (!token) return res.status(400).json({ error: "Token required" });
      const allAccounts = await getAllAccounts();
      const entry = Object.entries(allAccounts).find(([, acc]) => acc.verificationToken === token);
      if (!entry) return res.status(400).json({ error: "Invalid or already used token" });
      const [, account] = entry;
      if (account.verificationExpiry && new Date(account.verificationExpiry) < /* @__PURE__ */ new Date()) {
        return res.status(400).json({ error: "Verification link has expired" });
      }
      await upsertAccount({
        ...account,
        verified: true,
        verificationToken: void 0,
        verificationExpiry: void 0
      });
      return res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.post("/api/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: "Email required" });
      const emailLower = email.toLowerCase();
      const account = await getAccount(emailLower);
      if (!account) return res.json({ ok: true });
      const token = crypto2.randomBytes(32).toString("hex");
      const expiry = new Date(Date.now() + 60 * 60 * 1e3).toISOString();
      await upsertAccount({ ...account, resetToken: token, resetTokenExpiry: expiry });
      const resetUrl = `https://www.daamtaaleem.com/reset-password?token=${token}`;
      try {
        console.log("[forgot-password] Sending email to:", emailLower);
        console.log("[forgot-password] RESEND_API_KEY present:", !!process.env.RESEND_API_KEY);
        const resend = new Resend(process.env.RESEND_API_KEY);
        const resendResult = await resend.emails.send({
          from: "noreply@daamtaaleem.com",
          to: emailLower,
          subject: "\u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 | Reset your DAAM password",
          headers: { "X-Priority": "1", "Importance": "high" },
          html: `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:Arial,sans-serif;direction:rtl">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:40px 20px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:16px;overflow:hidden;border:1px solid #2a2a2a;max-width:100%">
        <tr><td style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:32px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:28px;font-weight:bold">\u0645\u0646\u0635\u0629 \u062F\u0627\u0645</h1>
          <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px">DAAM Student Platform</p>
        </td></tr>
        <tr><td style="padding:32px">
          <h2 style="color:#e2e8f0;margin:0 0 16px;font-size:20px">\u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631</h2>
          <p style="color:#94a3b8;line-height:1.7;margin:0 0 24px;font-size:15px">
            \u062A\u0644\u0642\u064A\u0646\u0627 \u0637\u0644\u0628\u0627\u064B \u0644\u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646 \u0643\u0644\u0645\u0629 \u0645\u0631\u0648\u0631 \u062D\u0633\u0627\u0628\u0643 \u0641\u064A \u0645\u0646\u0635\u0629 \u062F\u0627\u0645. \u0627\u0636\u063A\u0637 \u0639\u0644\u0649 \u0627\u0644\u0632\u0631 \u0623\u062F\u0646\u0627\u0647 \u0644\u0625\u0646\u0634\u0627\u0621 \u0643\u0644\u0645\u0629 \u0645\u0631\u0648\u0631 \u062C\u062F\u064A\u062F\u0629:
          </p>
          <div style="text-align:center;margin:32px 0">
            <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:bold">
              \u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631
            </a>
          </div>
          <p style="color:#64748b;font-size:13px;text-align:center;margin:0 0 16px">
            \u0647\u0630\u0627 \u0627\u0644\u0631\u0627\u0628\u0637 \u0635\u0627\u0644\u062D \u0644\u0645\u062F\u0629 \u0633\u0627\u0639\u0629 \u0648\u0627\u062D\u062F\u0629 \u0641\u0642\u0637
          </p>
          <hr style="border:none;border-top:1px solid #2a2a2a;margin:24px 0">
          <p style="color:#64748b;font-size:13px;line-height:1.6;margin:0 0 8px;direction:ltr;text-align:left">
            <strong style="color:#94a3b8">Password Reset Request</strong><br>
            Click the button above or use the link below to reset your password. This link expires in 1 hour.
          </p>
          <p style="margin:8px 0 0;direction:ltr;text-align:left">
            <a href="${resetUrl}" style="color:#7c3aed;font-size:12px;word-break:break-all">${resetUrl}</a>
          </p>
          <p style="color:#475569;font-size:12px;margin:16px 0 0;text-align:center">
            \u0625\u0630\u0627 \u0644\u0645 \u062A\u0637\u0644\u0628 \u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u0639\u064A\u064A\u0646\u060C \u062A\u062C\u0627\u0647\u0644 \u0647\u0630\u0627 \u0627\u0644\u0628\u0631\u064A\u062F \xB7 If you did not request this, ignore this email.
          </p>
        </td></tr>
        <tr><td style="background:#111;padding:20px;text-align:center">
          <p style="color:#475569;font-size:12px;margin:0">\xA9 2026 DAAM \xB7 daamtaaleem.com</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
        });
        console.log("[forgot-password] Resend result:", JSON.stringify(resendResult));
      } catch (emailErr) {
        console.error("[forgot-password] Resend error:", emailErr.message, emailErr);
      }
      return res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.post("/api/change-password", async (req, res) => {
    try {
      const { email, currentPassword, newPassword } = req.body;
      if (!email || !currentPassword || !newPassword) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      if (newPassword.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters" });
      }
      const emailLower = email.toLowerCase();
      const account = await getAccount(emailLower);
      if (!account) return res.status(404).json({ error: "Account not found" });
      if (account.passwordHash !== simpleHash2(currentPassword)) {
        return res.status(401).json({ error: "current_password_wrong" });
      }
      await upsertAccount({ ...account, passwordHash: simpleHash2(newPassword) });
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.post("/api/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      console.log("[reset-password] token present:", !!token, "| password length:", password?.length);
      if (!token || !password) return res.status(400).json({ error: "Token and password required" });
      if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });
      const allAccounts = await getAllAccounts();
      const entry = Object.entries(allAccounts).find(([, acc]) => acc.resetToken === token);
      console.log("[reset-password] account found:", !!entry);
      if (!entry) return res.status(400).json({ error: "Invalid or expired reset link" });
      const [, account] = entry;
      console.log("[reset-password] email:", account.email, "| expiry:", account.resetTokenExpiry);
      if (account.resetTokenExpiry && new Date(account.resetTokenExpiry) < /* @__PURE__ */ new Date()) {
        console.log("[reset-password] token expired");
        return res.status(400).json({ error: "Reset link has expired" });
      }
      console.log("[reset-password] calling updateAccountPassword for:", account.email);
      await updateAccountPassword(account.email, password);
      console.log("[reset-password] updateAccountPassword done");
      return res.json({ ok: true });
    } catch (e) {
      console.error("[reset-password] error:", e.message, e);
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/accounts/:email", async (req, res) => {
    try {
      const acc = await getAccount(req.params.email);
      if (!acc) return res.status(404).json({ error: "Not found" });
      res.json(acc);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.post("/api/accounts", async (req, res) => {
    try {
      await upsertAccount(req.body);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.patch("/api/accounts/:email", async (req, res) => {
    try {
      const existing = await getAccount(req.params.email);
      if (!existing) return res.status(404).json({ error: "Not found" });
      await upsertAccount({ ...existing, ...req.body, email: req.params.email });
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.delete("/api/accounts/:email", async (req, res) => {
    try {
      await deleteAccount(req.params.email);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/session/verify", async (req, res) => {
    try {
      const email = (req.query.email || "").toLowerCase();
      if (!email) return res.status(400).json({ valid: false });
      const account = await getAccount(email);
      const authUser = await getAuthUserByEmail(email);
      res.json({ valid: !!(account || authUser) });
    } catch (e) {
      res.status(500).json({ valid: true });
    }
  });
  app2.get("/api/profiles/:email", async (req, res) => {
    try {
      const profile = await getProfile(req.params.email);
      if (!profile) return res.status(404).json({ error: "Not found" });
      res.json(profile);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.patch("/api/profiles/:email", async (req, res) => {
    try {
      await upsertProfile(req.params.email, req.body);
      const updated = await getProfile(req.params.email);
      res.json(updated);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/campaigns", async (_req, res) => {
    try {
      res.json(await getAllCampaigns());
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.post("/api/campaigns", async (req, res) => {
    try {
      await upsertCampaign(req.body);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.patch("/api/campaigns/:id", async (req, res) => {
    try {
      const existing = await getCampaignById(req.params.id);
      if (!existing) return res.status(404).json({ error: "Not found" });
      await upsertCampaign({ ...existing, ...req.body, id: req.params.id, updatedAt: (/* @__PURE__ */ new Date()).toISOString() });
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.delete("/api/campaigns/:id", async (req, res) => {
    try {
      await deleteCampaignById(req.params.id);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/posts", async (_req, res) => {
    try {
      const posts2 = await getAllPosts();
      res.json(posts2);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.post("/api/posts", async (req, res) => {
    try {
      await createPost(req.body);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.patch("/api/posts/:id", async (req, res) => {
    try {
      await updatePost(req.params.id, req.body);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.delete("/api/posts/:id", async (req, res) => {
    try {
      await deletePost(req.params.id);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.post("/api/posts/:postId/replies", async (req, res) => {
    try {
      await addReply({ ...req.body, postId: req.params.postId });
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.patch("/api/replies/:replyId", async (req, res) => {
    try {
      await updateReply(req.params.replyId, req.body.content);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.delete("/api/replies/:replyId", async (req, res) => {
    try {
      await deleteReply(req.params.replyId);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/reports", async (_req, res) => {
    try {
      res.json(await getAllReports());
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.post("/api/reports", async (req, res) => {
    try {
      await createReport(req.body);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.patch("/api/reports/:id", async (req, res) => {
    try {
      await updateReportStatus(req.params.id, req.body.status, req.body.resolutionReason);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/moderators", async (_req, res) => {
    try {
      res.json(await getAllModerators());
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.post("/api/moderators", async (req, res) => {
    try {
      await createModerator(req.body.moderator);
      await createAuthUser(req.body.authUser);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.patch("/api/moderators/:id/permissions", async (req, res) => {
    try {
      await updateModeratorPermissions(req.params.id, req.body.permissions);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.patch("/api/moderators/:id/toggle", async (req, res) => {
    try {
      await toggleModeratorActive(req.params.id);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.delete("/api/moderators/:id", async (req, res) => {
    try {
      await deleteModerator(req.params.id);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/auth-users", async (_req, res) => {
    try {
      res.json(await getAllAuthUsers());
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.post("/api/auth-users", async (req, res) => {
    try {
      await createAuthUser(req.body);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/audit-log", async (_req, res) => {
    try {
      res.json(await getAuditLog());
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.post("/api/audit-log", async (req, res) => {
    try {
      await addAuditEvent(req.body);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/mutes", async (_req, res) => {
    try {
      res.json(await getAllMutes());
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.post("/api/mutes", async (req, res) => {
    try {
      await upsertMute(req.body);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.delete("/api/mutes/:email", async (req, res) => {
    try {
      await deleteMute(req.params.email);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/bans", async (_req, res) => {
    try {
      res.json(await getAllBans());
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.post("/api/bans", async (req, res) => {
    try {
      await upsertBan(req.body);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.delete("/api/bans/:email", async (req, res) => {
    try {
      await deleteBan(req.params.email);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/conversations", async (_req, res) => {
    try {
      res.json(await getConversations());
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.post("/api/conversations", async (req, res) => {
    try {
      await upsertConversation(req.body);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.patch("/api/conversations/:id", async (req, res) => {
    try {
      await upsertConversation(req.body);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/messages", async (_req, res) => {
    try {
      res.json(await getAllMessages());
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.post("/api/messages", async (req, res) => {
    try {
      await createMessage(req.body);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.post("/api/conversations/:id/read", async (req, res) => {
    try {
      await markMessagesRead(req.params.id, req.body.userEmail);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/settings/domains", async (_req, res) => {
    try {
      res.json(await getAllowedDomains());
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.post("/api/settings/domains", async (req, res) => {
    try {
      await addAllowedDomain(req.body.domain);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.delete("/api/settings/domains/:domain", async (req, res) => {
    try {
      await removeAllowedDomain(req.params.domain);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/settings/:key", async (req, res) => {
    try {
      const val = await getSetting(req.params.key);
      res.json({ key: req.params.key, value: val });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.post("/api/settings/:key", async (req, res) => {
    try {
      await setSetting(req.params.key, req.body.value);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/profile-materials/:email", async (req, res) => {
    try {
      const items = await getMaterials(req.params.email);
      res.json(items);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.post("/api/profile-materials", async (req, res) => {
    try {
      await addMaterial(req.body);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.patch("/api/profile-materials/:id", async (req, res) => {
    try {
      await updateMaterial(req.params.id, req.body);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.delete("/api/profile-materials/:id", async (req, res) => {
    try {
      await deleteMaterial(req.params.id);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.get("/api/profile-research/:email", async (req, res) => {
    try {
      const items = await getResearch(req.params.email);
      res.json(items);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.post("/api/profile-research", async (req, res) => {
    try {
      await addResearch(req.body);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.patch("/api/profile-research/:id", async (req, res) => {
    try {
      await updateResearch(req.params.id, req.body);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.delete("/api/profile-research/:id", async (req, res) => {
    try {
      await deleteResearch(req.params.id);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.post("/api/upload/image", (req, res) => {
    imageUpload.single("file")(req, res, async (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") return res.status(400).json({ ok: false, error: "File too large (max 5MB)" });
        return res.status(400).json({ ok: false, error: err.message || "Upload failed" });
      }
      if (!req.file) return res.status(400).json({ ok: false, error: "No file uploaded" });
      try {
        const url = await uploadImageBuffer(req.file.buffer);
        res.json({ ok: true, url });
      } catch (e) {
        res.status(500).json({ ok: false, error: e.message || "Upload failed" });
      }
    });
  });
  app2.delete("/api/upload/image", async (req, res) => {
    const { url } = req.body;
    if (!url || typeof url !== "string") return res.status(400).json({ ok: false, error: "Missing url" });
    try {
      await deleteCloudinaryFile(url, "image");
    } catch {
    }
    res.json({ ok: true });
  });
  app2.post("/api/upload/campaign-image", (req, res) => {
    imageUpload.single("file")(req, res, async (err) => {
      if (err) return res.status(400).json({ ok: false, error: err.message || "Upload failed" });
      if (!req.file) return res.status(400).json({ ok: false, error: "No file uploaded" });
      try {
        const url = await uploadImageBuffer(req.file.buffer);
        res.json({ ok: true, url });
      } catch (e) {
        res.status(500).json({ ok: false, error: e.message || "Upload failed" });
      }
    });
  });
  app2.post("/api/materials/upload", (req, res) => {
    pdfUpload.single("file")(req, res, async (err) => {
      if (err) {
        if (err.message === "PDF only") return res.status(400).json({ ok: false, error: "PDF files only" });
        if (err.code === "LIMIT_FILE_SIZE") return res.status(400).json({ ok: false, error: "File too large (max 10MB)" });
        return res.status(400).json({ ok: false, error: "Upload failed" });
      }
      if (!req.file) return res.status(400).json({ ok: false, error: "No file uploaded" });
      if (req.file.buffer.slice(0, 4).toString("ascii") !== "%PDF")
        return res.status(400).json({ ok: false, error: "Invalid PDF file" });
      try {
        const url = await uploadPdfBuffer(req.file.buffer, req.file.originalname);
        res.json({ ok: true, url, originalName: req.file.originalname });
      } catch (e) {
        res.status(500).json({ ok: false, error: e.message || "Upload failed" });
      }
    });
  });
  app2.post("/api/upload/campaign-video", (req, res) => {
    videoUpload.single("file")(req, res, async (err) => {
      if (err) return res.status(400).json({ ok: false, error: err.message || "Upload failed" });
      if (!req.file) return res.status(400).json({ ok: false, error: "No file uploaded" });
      try {
        const url = await uploadVideoBuffer(req.file.buffer);
        res.json({ ok: true, url });
      } catch (e) {
        res.status(500).json({ ok: false, error: e.message || "Upload failed" });
      }
    });
  });
  app2.post("/api/upload/campaign-file", (req, res) => {
    pdfUpload.single("file")(req, res, async (err) => {
      if (err) return res.status(400).json({ ok: false, error: err.message || "Upload failed" });
      if (!req.file) return res.status(400).json({ ok: false, error: "No file uploaded" });
      if (req.file.buffer.slice(0, 4).toString("ascii") !== "%PDF")
        return res.status(400).json({ ok: false, error: "Invalid PDF file" });
      try {
        const url = await uploadPdfBuffer(req.file.buffer, req.file.originalname);
        res.json({ ok: true, url });
      } catch (e) {
        res.status(500).json({ ok: false, error: e.message || "Upload failed" });
      }
    });
  });
  app2.delete("/api/materials", async (req, res) => {
    const { url } = req.body;
    if (!url || typeof url !== "string") return res.status(400).json({ ok: false, error: "Missing url" });
    try {
      await deleteCloudinaryFile(url, "raw");
    } catch {
    }
    res.json({ ok: true });
  });
  app2.get("/api/file-proxy", (req, res) => {
    const { url } = req.query;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ ok: false, error: "Missing url" });
    }
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      return res.status(400).json({ ok: false, error: "Invalid url" });
    }
    if (!parsed.hostname.endsWith("cloudinary.com")) {
      return res.status(403).json({ ok: false, error: "Forbidden" });
    }
    const signedUrl = generateSignedUrl(url);
    if (!signedUrl) {
      return res.status(400).json({ ok: false, error: "Could not generate signed URL" });
    }
    https.get(signedUrl, (upstream) => {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", 'inline; filename="document.pdf"');
      if (upstream.headers["content-length"]) {
        res.setHeader("Content-Length", upstream.headers["content-length"]);
      }
      upstream.pipe(res);
    }).on("error", () => {
      if (!res.headersSent) res.status(502).json({ ok: false, error: "Failed to fetch file" });
    });
  });
  app2.post("/api/webauthn/register/begin", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: "email required" });
      const emailLower = email.toLowerCase();
      const account = await getAccount(emailLower);
      if (!account) return res.status(404).json({ error: "Account not found" });
      const existingCreds = await getWebAuthnCredentials(emailLower);
      const excludeCredentials = existingCreds.map((c) => ({
        id: c.credentialId,
        transports: c.transports
      }));
      const options = await generateRegistrationOptions({
        rpName: RP_NAME,
        rpID: RP_ID,
        userName: emailLower,
        userDisplayName: emailLower,
        attestationType: "none",
        excludeCredentials,
        authenticatorSelection: {
          residentKey: "preferred",
          userVerification: "preferred"
        }
      });
      await setWebAuthnChallenge(`reg:${emailLower}`, options.challenge);
      res.json(options);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.post("/api/webauthn/register/complete", async (req, res) => {
    try {
      const { email, credential } = req.body;
      if (!email || !credential) return res.status(400).json({ error: "email and credential required" });
      const emailLower = email.toLowerCase();
      const expectedChallenge = await getAndDeleteWebAuthnChallenge(`reg:${emailLower}`);
      if (!expectedChallenge) return res.status(400).json({ error: "Challenge expired or not found" });
      const verification = await verifyRegistrationResponse({
        response: credential,
        expectedChallenge,
        expectedOrigin: ORIGIN,
        expectedRPID: RP_ID
      });
      if (!verification.verified || !verification.registrationInfo) {
        return res.status(400).json({ error: "Verification failed" });
      }
      const { credential: credInfo } = verification.registrationInfo;
      await saveWebAuthnCredential({
        id: crypto2.randomUUID(),
        email: emailLower,
        credentialId: credInfo.id,
        publicKey: Buffer.from(credInfo.publicKey).toString("base64"),
        counter: credInfo.counter,
        transports: credential.response?.transports ?? [],
        createdAt: Date.now()
      });
      const account = await getAccount(emailLower);
      if (account) await upsertAccount({ ...account, biometricEnabled: true });
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.post("/api/webauthn/login/begin", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: "email required" });
      const emailLower = email.toLowerCase();
      const creds = await getWebAuthnCredentials(emailLower);
      if (creds.length === 0) return res.status(404).json({ error: "no_credentials" });
      const options = await generateAuthenticationOptions({
        rpID: RP_ID,
        allowCredentials: creds.map((c) => ({
          id: c.credentialId,
          transports: c.transports
        })),
        userVerification: "preferred"
      });
      await setWebAuthnChallenge(`auth:${emailLower}`, options.challenge);
      res.json(options);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app2.post("/api/webauthn/login/complete", async (req, res) => {
    try {
      const { email, credential } = req.body;
      if (!email || !credential) return res.status(400).json({ error: "email and credential required" });
      const emailLower = email.toLowerCase();
      const expectedChallenge = await getAndDeleteWebAuthnChallenge(`auth:${emailLower}`);
      if (!expectedChallenge) return res.status(400).json({ error: "Challenge expired or not found" });
      const storedCred = await getWebAuthnCredentialById(credential.id);
      if (!storedCred || storedCred.email !== emailLower) {
        return res.status(400).json({ error: "Credential not found" });
      }
      const publicKeyBytes = Buffer.from(storedCred.publicKey, "base64");
      const verification = await verifyAuthenticationResponse({
        response: credential,
        expectedChallenge,
        expectedOrigin: ORIGIN,
        expectedRPID: RP_ID,
        credential: {
          id: storedCred.credentialId,
          publicKey: publicKeyBytes,
          counter: storedCred.counter,
          transports: storedCred.transports
        }
      });
      if (!verification.verified) return res.status(401).json({ error: "Verification failed" });
      await updateWebAuthnCounter(storedCred.credentialId, verification.authenticationInfo.newCounter);
      const account = await getAccount(emailLower);
      if (!account) return res.status(404).json({ error: "Account not found" });
      if (account.banned) return res.status(403).json({ error: "Account banned" });
      res.json({ ok: true, type: "account", account });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  return httpServer2;
}

// server/vercel-entry.ts
var app = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false }));
var httpServer = createServer(app);
await registerRoutes(httpServer, app);
var vercel_entry_default = app;
export {
  vercel_entry_default as default
};
