import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, desc, sql } from "drizzle-orm";
import * as schema from "@shared/schema";
import type {
  UserAccount, UserProfile, LocalPost, LocalReply, Report, ModeratorAccount,
  LocalAuthUser, AuditEvent, MuteRecord, BanRecord, Conversation, DirectMessage,
  DaamPermission, AuditAction, PostType, PostStatus, ReportStatus, DaamRole,
  WebAuthnCredential,
} from "@shared/schema";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

export async function getAccount(email: string): Promise<UserAccount | undefined> {
  const row = await db.select().from(schema.accounts).where(eq(schema.accounts.email, email.toLowerCase())).limit(1);
  if (!row[0]) return undefined;
  return rowToAccount(row[0]);
}

export async function getAllAccounts(): Promise<Record<string, UserAccount>> {
  const rows = await db.select().from(schema.accounts);
  const result: Record<string, UserAccount> = {};
  for (const row of rows) result[row.email] = rowToAccount(row);
  return result;
}

export async function updateAccountPassword(email: string, plainPassword: string): Promise<void> {
  const passwordHash = simpleHash(plainPassword);
  const emailLower = email.toLowerCase();
  await pool.query(
    'UPDATE accounts SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL WHERE email = $2',
    [passwordHash, emailLower]
  );
  // Also update auth_users if this email is an admin/moderator (auth_users stores passwords as plain text)
  await pool.query(
    'UPDATE auth_users SET password_hash = $1 WHERE email = $2',
    [plainPassword, emailLower]
  );
}

export async function deleteAccount(email: string): Promise<void> {
  const emailLower = email.toLowerCase();
  await pool.query('DELETE FROM accounts WHERE email = $1', [emailLower]);
  await pool.query('DELETE FROM auth_users WHERE email = $1', [emailLower]);
  await db.delete(schema.profiles).where(eq(schema.profiles.email, emailLower));
}

export async function upsertAccount(acc: UserAccount): Promise<void> {
  await db.insert(schema.accounts).values({
    email: acc.email.toLowerCase(), passwordHash: acc.passwordHash,
    phone: acc.phone || '', region: acc.region || { governorate: '', wilayat: '' },
    role: acc.role || 'student', verified: acc.verified ?? false,
    verificationToken: acc.verificationToken, verificationExpiry: acc.verificationExpiry,
    resetToken: acc.resetToken, resetTokenExpiry: acc.resetTokenExpiry,
    rememberMe: acc.rememberMe ?? false, biometricEnabled: acc.biometricEnabled ?? false,
    banned: acc.banned ?? false, bannedReason: acc.bannedReason,
    isDemo: acc.isDemo ?? false, allowDM: acc.allowDM || 'everyone', createdAt: acc.createdAt,
  }).onConflictDoUpdate({
    target: schema.accounts.email,
    set: {
      passwordHash: sql`excluded.password_hash`, phone: sql`excluded.phone`,
      region: sql`excluded.region`, role: sql`excluded.role`,
      verified: sql`excluded.verified`, verificationToken: sql`excluded.verification_token`,
      verificationExpiry: sql`excluded.verification_expiry`,
      resetToken: sql`excluded.reset_token`, resetTokenExpiry: sql`excluded.reset_token_expiry`,
      rememberMe: sql`excluded.remember_me`,
      biometricEnabled: sql`excluded.biometric_enabled`, banned: sql`excluded.banned`,
      bannedReason: sql`excluded.banned_reason`, isDemo: sql`excluded.is_demo`,
      allowDM: sql`excluded.allow_dm`,
    }
  });
}

function rowToAccount(row: typeof schema.accounts.$inferSelect): UserAccount {
  return {
    email: row.email, passwordHash: row.passwordHash, phone: row.phone,
    region: (row.region as any) || { governorate: '', wilayat: '' },
    role: (row.role as any) || 'student', verified: row.verified,
    verificationToken: row.verificationToken ?? undefined, verificationExpiry: row.verificationExpiry ?? undefined,
    resetToken: row.resetToken ?? undefined, resetTokenExpiry: row.resetTokenExpiry ?? undefined,
    rememberMe: row.rememberMe ?? false, biometricEnabled: row.biometricEnabled ?? false,
    banned: row.banned ?? false, bannedReason: row.bannedReason ?? undefined,
    isDemo: row.isDemo ?? false, allowDM: (row.allowDM as any) ?? 'everyone', createdAt: row.createdAt,
  };
}

export async function getProfile(email: string): Promise<UserProfile | undefined> {
  const row = await db.select().from(schema.profiles).where(eq(schema.profiles.email, email)).limit(1);
  if (!row[0]) return undefined;
  return rowToProfile(row[0]);
}

export async function getAllProfiles(): Promise<Record<string, UserProfile>> {
  const rows = await db.select().from(schema.profiles);
  const result: Record<string, UserProfile> = {};
  for (const row of rows) result[row.email] = rowToProfile(row);
  return result;
}

export async function upsertProfile(email: string, data: Partial<UserProfile>): Promise<void> {
  const existing = await getProfile(email);
  const merged = existing ? { ...existing, ...data } : { email, name: '', major: '', university: '', ...data };
  const extra: Record<string, unknown> = {};
  const knownKeys = ['email','name','major','university','level','avatarColor','avatarUrl','coverUrl','interests','bio','followers','following','showFavorites','showInterests'];
  for (const [k, v] of Object.entries(merged)) { if (!knownKeys.includes(k)) extra[k] = v; }
  await db.insert(schema.profiles).values({
    email, name: merged.name || '', major: merged.major || '', university: merged.university || '',
    level: merged.level, avatarColor: merged.avatarColor, avatarUrl: merged.avatarUrl,
    coverUrl: merged.coverUrl, interests: (merged.interests as string[]) || [],
    bio: merged.bio, followers: (merged.followers as string[]) || [],
    following: (merged.following as string[]) || [],
    showFavorites: merged.showFavorites ?? true, showInterests: merged.showInterests ?? true, extra,
  }).onConflictDoUpdate({
    target: schema.profiles.email,
    set: {
      name: sql`excluded.name`, major: sql`excluded.major`, university: sql`excluded.university`,
      level: sql`excluded.level`, avatarColor: sql`excluded.avatar_color`,
      avatarUrl: sql`excluded.avatar_url`, coverUrl: sql`excluded.cover_url`,
      interests: sql`excluded.interests`, bio: sql`excluded.bio`,
      followers: sql`excluded.followers`, following: sql`excluded.following`,
      showFavorites: sql`excluded.show_favorites`, showInterests: sql`excluded.show_interests`,
      extra: sql`excluded.extra`,
    }
  });
}

function rowToProfile(row: typeof schema.profiles.$inferSelect): UserProfile {
  const extra = (row.extra as Record<string, unknown>) || {};
  return {
    email: row.email, name: row.name, major: row.major, university: row.university,
    level: row.level ?? undefined, avatarColor: row.avatarColor ?? undefined,
    avatarUrl: row.avatarUrl ?? undefined, coverUrl: row.coverUrl ?? undefined,
    interests: (row.interests as string[]) ?? [], bio: row.bio ?? undefined,
    followers: (row.followers as string[]) ?? [], following: (row.following as string[]) ?? [],
    showFavorites: row.showFavorites ?? true, showInterests: row.showInterests ?? true, ...extra,
  };
}

export async function getAllPosts(): Promise<LocalPost[]> {
  const [postRows, replyRows] = await Promise.all([
    db.select().from(schema.posts).orderBy(desc(schema.posts.createdAt)),
    db.select().from(schema.replies).orderBy(schema.replies.createdAt),
  ]);
  const replyMap: Record<string, LocalReply[]> = {};
  for (const r of replyRows) {
    if (!replyMap[r.postId]) replyMap[r.postId] = [];
    replyMap[r.postId].push({ id: r.id, authorEmail: r.authorEmail, content: r.content, createdAt: r.createdAt, parentId: r.parentId ?? undefined });
  }
  return postRows.map(p => ({
    id: p.id, authorEmail: p.authorEmail, content: p.content,
    postType: (p.postType as PostType) || 'discussion', subject: p.subject ?? undefined,
    imageUrl: p.imageUrl ?? undefined, attachments: (p.attachments as any[]) ?? [],
    likedBy: (p.likedBy as string[]) ?? [], savedBy: (p.savedBy as string[]) ?? [],
    status: (p.status as PostStatus) ?? 'visible', createdAt: p.createdAt,
    updatedAt: p.updatedAt ?? undefined, replies: replyMap[p.id] || [],
  }));
}

export async function createPost(post: LocalPost): Promise<void> {
  await db.insert(schema.posts).values({
    id: post.id, authorEmail: post.authorEmail, content: post.content,
    postType: post.postType, subject: post.subject, imageUrl: post.imageUrl,
    attachments: post.attachments || [], likedBy: post.likedBy, savedBy: post.savedBy,
    status: post.status || 'visible', createdAt: post.createdAt, updatedAt: post.updatedAt,
  });
}

export async function updatePost(postId: string, data: Partial<{
  content: string; postType: PostType; subject: string | undefined;
  status: PostStatus; likedBy: string[]; savedBy: string[]; updatedAt: string;
}>): Promise<void> {
  const updateData: Record<string, unknown> = {};
  if (data.content !== undefined) updateData.content = data.content;
  if (data.postType !== undefined) updateData.postType = data.postType;
  if ('subject' in data) updateData.subject = data.subject;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.likedBy !== undefined) updateData.likedBy = data.likedBy;
  if (data.savedBy !== undefined) updateData.savedBy = data.savedBy;
  if (data.updatedAt !== undefined) updateData.updatedAt = data.updatedAt;
  if (Object.keys(updateData).length > 0)
    await db.update(schema.posts).set(updateData as any).where(eq(schema.posts.id, postId));
}

export async function deletePost(postId: string): Promise<void> {
  await db.delete(schema.replies).where(eq(schema.replies.postId, postId));
  await db.delete(schema.posts).where(eq(schema.posts.id, postId));
}

export async function addReply(reply: LocalReply & { postId: string }): Promise<void> {
  await db.insert(schema.replies).values({
    id: reply.id, postId: reply.postId, authorEmail: reply.authorEmail,
    content: reply.content, parentId: reply.parentId, createdAt: reply.createdAt,
  });
}

export async function updateReply(replyId: string, content: string): Promise<void> {
  await db.update(schema.replies).set({ content }).where(eq(schema.replies.id, replyId));
}

export async function deleteReply(replyId: string): Promise<void> {
  await db.delete(schema.replies).where(eq(schema.replies.id, replyId));
}

export async function getAllReports(): Promise<Report[]> {
  const rows = await db.select().from(schema.reports).orderBy(desc(schema.reports.createdAt));
  return rows.map(r => ({
    id: r.id, targetType: r.targetType as any, targetId: r.targetId,
    targetTitle: r.targetTitle, reason: r.reason as any, note: r.note ?? undefined,
    reporter: r.reporter, reporterEmail: r.reporterEmail, status: r.status as any,
    resolutionReason: r.resolutionReason ?? undefined, createdAt: r.createdAt,
  }));
}

export async function createReport(report: Report): Promise<void> {
  await db.insert(schema.reports).values({
    id: report.id, targetType: report.targetType, targetId: report.targetId,
    targetTitle: report.targetTitle, reason: report.reason, note: report.note,
    reporter: report.reporter, reporterEmail: report.reporterEmail,
    status: report.status, createdAt: report.createdAt,
  });
}

export async function updateReportStatus(reportId: string, status: ReportStatus, resolutionReason?: string): Promise<void> {
  await db.update(schema.reports).set({ status, resolutionReason }).where(eq(schema.reports.id, reportId));
}

export async function getAllModerators(): Promise<ModeratorAccount[]> {
  const rows = await db.select().from(schema.moderators);
  return rows.map(r => ({
    id: r.id, email: r.email, displayName: r.displayName, role: 'moderator' as const,
    permissions: (r.permissions as DaamPermission[]) || [],
    isActive: r.isActive, createdAt: Number(r.createdAt), createdBy: r.createdBy,
  }));
}

export async function createModerator(mod: ModeratorAccount): Promise<void> {
  await db.insert(schema.moderators).values({
    id: mod.id, email: mod.email, displayName: mod.displayName,
    permissions: mod.permissions, isActive: mod.isActive,
    createdAt: mod.createdAt, createdBy: mod.createdBy,
  });
}

export async function updateModeratorPermissions(modId: string, permissions: DaamPermission[]): Promise<void> {
  await db.update(schema.moderators).set({ permissions }).where(eq(schema.moderators.id, modId));
}

export async function toggleModeratorActive(modId: string): Promise<void> {
  const mod = await db.select().from(schema.moderators).where(eq(schema.moderators.id, modId)).limit(1);
  if (mod[0]) await db.update(schema.moderators).set({ isActive: !mod[0].isActive }).where(eq(schema.moderators.id, modId));
}

export async function deleteModerator(modId: string): Promise<void> {
  await db.delete(schema.authUsers).where(eq(schema.authUsers.linkedModeratorId, modId));
  await db.delete(schema.moderators).where(eq(schema.moderators.id, modId));
}

export async function getAuthUserByEmail(email: string): Promise<LocalAuthUser | undefined> {
  const rows = await db.select().from(schema.authUsers).where(sql`LOWER(${schema.authUsers.email}) = LOWER(${email})`).limit(1);
  if (!rows[0]) return undefined;
  const r = rows[0];
  return { id: r.id, email: r.email, passwordHash: r.passwordHash, role: r.role as DaamRole, linkedModeratorId: r.linkedModeratorId ?? undefined, createdAt: Number(r.createdAt) };
}

export async function getAllAuthUsers(): Promise<LocalAuthUser[]> {
  const rows = await db.select().from(schema.authUsers);
  return rows.map(r => ({
    id: r.id, email: r.email, passwordHash: r.passwordHash, role: r.role as DaamRole,
    linkedModeratorId: r.linkedModeratorId ?? undefined, createdAt: Number(r.createdAt),
  }));
}

export async function createAuthUser(user: LocalAuthUser): Promise<void> {
  await db.insert(schema.authUsers).values({
    id: user.id, email: user.email.toLowerCase(), passwordHash: user.passwordHash,
    role: user.role, linkedModeratorId: user.linkedModeratorId, createdAt: user.createdAt,
  }).onConflictDoUpdate({
    target: schema.authUsers.email,
    set: { passwordHash: sql`excluded.password_hash` }
  });
}

export async function getAuditLog(limit = 200): Promise<AuditEvent[]> {
  const rows = await db.select().from(schema.auditLog).orderBy(desc(schema.auditLog.at)).limit(limit);
  return rows.map(r => ({
    id: r.id, action: r.action as AuditAction, targetType: r.targetType as any,
    targetId: r.targetId, byEmail: r.byEmail, at: Number(r.at), meta: (r.meta as any) ?? undefined,
  }));
}

export async function addAuditEvent(event: AuditEvent): Promise<void> {
  await db.insert(schema.auditLog).values({
    id: event.id, action: event.action, targetType: event.targetType,
    targetId: event.targetId, byEmail: event.byEmail, at: event.at, meta: event.meta,
  }).onConflictDoNothing();
}

export async function getAllMutes(): Promise<MuteRecord[]> {
  const rows = await db.select().from(schema.mutes);
  return rows.map(r => ({
    userEmail: r.userEmail, mutedBy: r.mutedBy, reason: r.reason ?? undefined,
    mutedAt: Number(r.mutedAt), expiresAt: r.expiresAt ? Number(r.expiresAt) : undefined,
  }));
}

export async function upsertMute(mute: MuteRecord): Promise<void> {
  await db.insert(schema.mutes).values({
    userEmail: mute.userEmail.toLowerCase(), mutedBy: mute.mutedBy,
    reason: mute.reason, mutedAt: mute.mutedAt, expiresAt: mute.expiresAt,
  }).onConflictDoUpdate({
    target: schema.mutes.userEmail,
    set: { mutedBy: sql`excluded.muted_by`, reason: sql`excluded.reason`, mutedAt: sql`excluded.muted_at`, expiresAt: sql`excluded.expires_at` }
  });
}

export async function deleteMute(userEmail: string): Promise<void> {
  await db.delete(schema.mutes).where(eq(schema.mutes.userEmail, userEmail.toLowerCase()));
}

export async function getAllBans(): Promise<BanRecord[]> {
  const rows = await db.select().from(schema.bans);
  return rows.map(r => ({
    userEmail: r.userEmail, bannedBy: r.bannedBy, reason: r.reason ?? undefined,
    bannedAt: Number(r.bannedAt), expiresAt: r.expiresAt ? Number(r.expiresAt) : undefined,
  }));
}

export async function upsertBan(ban: BanRecord): Promise<void> {
  await db.insert(schema.bans).values({
    userEmail: ban.userEmail.toLowerCase(), bannedBy: ban.bannedBy,
    reason: ban.reason, bannedAt: ban.bannedAt, expiresAt: ban.expiresAt,
  }).onConflictDoUpdate({
    target: schema.bans.userEmail,
    set: { bannedBy: sql`excluded.banned_by`, reason: sql`excluded.reason`, bannedAt: sql`excluded.banned_at`, expiresAt: sql`excluded.expires_at` }
  });
}

export async function deleteBan(userEmail: string): Promise<void> {
  await db.delete(schema.bans).where(eq(schema.bans.userEmail, userEmail.toLowerCase()));
}

export async function getConversations(): Promise<Conversation[]> {
  const rows = await db.select().from(schema.conversations).orderBy(desc(schema.conversations.lastMessageAt));
  return rows.map(r => ({
    id: r.id, participants: r.participants as [string, string],
    lastMessageAt: r.lastMessageAt, lastMessagePreview: r.lastMessagePreview,
    unreadCount: (r.unreadCount as Record<string, number>) || {},
  }));
}

export async function upsertConversation(conv: Conversation): Promise<void> {
  await db.insert(schema.conversations).values({
    id: conv.id, participants: conv.participants,
    lastMessageAt: conv.lastMessageAt, lastMessagePreview: conv.lastMessagePreview,
    unreadCount: conv.unreadCount,
  }).onConflictDoUpdate({
    target: schema.conversations.id,
    set: { lastMessageAt: sql`excluded.last_message_at`, lastMessagePreview: sql`excluded.last_message_preview`, unreadCount: sql`excluded.unread_count` }
  });
}

export async function getAllMessages(): Promise<DirectMessage[]> {
  const rows = await db.select().from(schema.messages).orderBy(schema.messages.sentAt);
  return rows.map(r => ({
    id: r.id, conversationId: r.conversationId, senderEmail: r.senderEmail,
    content: r.content, sentAt: r.sentAt, readBy: (r.readBy as string[]) || [],
  }));
}

export async function createMessage(msg: DirectMessage): Promise<void> {
  await db.insert(schema.messages).values({
    id: msg.id, conversationId: msg.conversationId, senderEmail: msg.senderEmail,
    content: msg.content, sentAt: msg.sentAt, readBy: msg.readBy,
  });
}

export async function markMessagesRead(conversationId: string, userEmail: string): Promise<void> {
  const msgs = await db.select().from(schema.messages).where(eq(schema.messages.conversationId, conversationId));
  for (const msg of msgs) {
    const readBy = (msg.readBy as string[]) || [];
    if (!readBy.includes(userEmail))
      await db.update(schema.messages).set({ readBy: [...readBy, userEmail] }).where(eq(schema.messages.id, msg.id));
  }
  // Zero out unreadCount for this user in the conversations table
  const convRows = await db.select().from(schema.conversations).where(eq(schema.conversations.id, conversationId)).limit(1);
  if (convRows[0]) {
    const unreadCount = { ...((convRows[0].unreadCount as Record<string, number>) || {}), [userEmail]: 0 };
    await db.update(schema.conversations).set({ unreadCount }).where(eq(schema.conversations.id, conversationId));
  }
}

export async function getAllowedDomains(): Promise<string[]> {
  const rows = await db.select().from(schema.allowedDomains);
  return rows.map(r => r.domain);
}

export async function addAllowedDomain(domain: string): Promise<void> {
  await db.insert(schema.allowedDomains).values({ domain }).onConflictDoNothing();
}

export async function removeAllowedDomain(domain: string): Promise<void> {
  await db.delete(schema.allowedDomains).where(eq(schema.allowedDomains.domain, domain));
}

export async function getSetting(key: string): Promise<unknown> {
  const row = await db.select().from(schema.settings).where(eq(schema.settings.key, key)).limit(1);
  return row[0]?.value ?? null;
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  await db.insert(schema.settings).values({ key, value }).onConflictDoUpdate({
    target: schema.settings.key,
    set: { value: sql`excluded.value` }
  });
}

// ── Campaigns ─────────────────────────────────────────────────────────────────
export async function getAllCampaigns(): Promise<any[]> {
  const rows = await db.select().from(schema.campaigns).orderBy(desc(schema.campaigns.updatedAt));
  return rows.map(r => r.data);
}

export async function getCampaignById(id: string): Promise<any | undefined> {
  const rows = await db.select().from(schema.campaigns).where(eq(schema.campaigns.id, id)).limit(1);
  return rows[0]?.data;
}

export async function upsertCampaign(campaign: any): Promise<void> {
  await db.insert(schema.campaigns).values({
    id: campaign.id,
    data: campaign,
    createdAt: campaign.createdAt,
    updatedAt: campaign.updatedAt,
  }).onConflictDoUpdate({
    target: schema.campaigns.id,
    set: { data: sql`excluded.data`, updatedAt: sql`excluded.updated_at` },
  });
}

export async function deleteCampaignById(id: string): Promise<void> {
  await db.delete(schema.campaigns).where(eq(schema.campaigns.id, id));
}

export async function loadAllData() {
  const [
    accountsData, profilesData, postsData, reportsData,
    moderatorsData, authUsersData, auditLogData,
    mutesData, bansData, conversationsData, messagesData, domainsData, campaignsData
  ] = await Promise.all([
    getAllAccounts(), getAllProfiles(), getAllPosts(), getAllReports(),
    getAllModerators(), getAllAuthUsers(), getAuditLog(),
    getAllMutes(), getAllBans(), getConversations(), getAllMessages(), getAllowedDomains(),
    getAllCampaigns(),
  ]);
  return { accounts: accountsData, profiles: profilesData, posts: postsData, reports: reportsData,
    moderators: moderatorsData, authUsers: authUsersData, auditLog: auditLogData,
    mutes: mutesData, bans: bansData, conversations: conversationsData, messages: messagesData,
    allowedDomains: domainsData, campaigns: campaignsData };
}

// ── Profile Materials ──────────────────────────────────────────────────────────
export async function getMaterials(email: string) {
  return db.select().from(schema.profileMaterials)
    .where(eq(schema.profileMaterials.email, email.toLowerCase()))
    .orderBy(desc(schema.profileMaterials.createdAt));
}

export async function addMaterial(data: { id: string; email: string; title: string; kind: "pdf" | "link" | "note"; url?: string; note?: string; createdAt: number }) {
  await db.insert(schema.profileMaterials).values({
    id: data.id, email: data.email.toLowerCase(), title: data.title, kind: data.kind,
    url: data.url, note: data.note, createdAt: data.createdAt,
  });
}

export async function updateMaterial(id: string, data: Partial<{ title: string; url: string; note: string }>) {
  await db.update(schema.profileMaterials).set(data).where(eq(schema.profileMaterials.id, id));
}

export async function deleteMaterial(id: string) {
  await db.delete(schema.profileMaterials).where(eq(schema.profileMaterials.id, id));
}

// ── Profile Research ───────────────────────────────────────────────────────────
export async function getResearch(email: string) {
  return db.select().from(schema.profileResearch)
    .where(eq(schema.profileResearch.email, email.toLowerCase()))
    .orderBy(desc(schema.profileResearch.createdAt));
}

export async function addResearch(data: { id: string; email: string; title: string; abstract?: string; tags?: string[]; pdfUrl?: string; pdfName?: string; createdAt: number }) {
  await db.insert(schema.profileResearch).values({
    id: data.id, email: data.email.toLowerCase(), title: data.title, abstract: data.abstract,
    tags: data.tags || [], pdfUrl: data.pdfUrl, pdfName: data.pdfName, createdAt: data.createdAt,
  });
}

export async function updateResearch(id: string, data: Partial<{ title: string; abstract: string; tags: string[]; pdfUrl: string; pdfName: string }>) {
  await db.update(schema.profileResearch).set(data).where(eq(schema.profileResearch.id, id));
}

export async function deleteResearch(id: string) {
  await db.delete(schema.profileResearch).where(eq(schema.profileResearch.id, id));
}

// ── WebAuthn Challenges (DB-backed, TTL 5 min) ────────────────────────────────

export async function setWebAuthnChallenge(key: string, challenge: string): Promise<void> {
  const expiresAt = Date.now() + 5 * 60 * 1000;
  await db.insert(schema.webauthnChallenges)
    .values({ key, challenge, expiresAt })
    .onConflictDoUpdate({ target: schema.webauthnChallenges.key, set: { challenge, expiresAt } });
}

export async function getAndDeleteWebAuthnChallenge(key: string): Promise<string | undefined> {
  const rows = await db.select().from(schema.webauthnChallenges).where(eq(schema.webauthnChallenges.key, key)).limit(1);
  if (!rows[0]) return undefined;
  await db.delete(schema.webauthnChallenges).where(eq(schema.webauthnChallenges.key, key));
  if (Date.now() > rows[0].expiresAt) return undefined; // expired
  return rows[0].challenge;
}

// ── WebAuthn ──────────────────────────────────────────────────────────────────

export async function getWebAuthnCredentials(email: string): Promise<WebAuthnCredential[]> {
  const rows = await db.select().from(schema.webauthnCredentials).where(eq(schema.webauthnCredentials.email, email.toLowerCase()));
  return rows.map(r => ({
    id: r.id,
    email: r.email,
    credentialId: r.credentialId,
    publicKey: r.publicKey,
    counter: r.counter,
    transports: (r.transports as string[]) ?? [],
    createdAt: r.createdAt,
  }));
}

export async function getWebAuthnCredentialById(credentialId: string): Promise<WebAuthnCredential | undefined> {
  const rows = await db.select().from(schema.webauthnCredentials).where(eq(schema.webauthnCredentials.credentialId, credentialId)).limit(1);
  if (!rows[0]) return undefined;
  const r = rows[0];
  return { id: r.id, email: r.email, credentialId: r.credentialId, publicKey: r.publicKey, counter: r.counter, transports: (r.transports as string[]) ?? [], createdAt: r.createdAt };
}

export async function saveWebAuthnCredential(cred: WebAuthnCredential): Promise<void> {
  await db.insert(schema.webauthnCredentials).values({
    id: cred.id,
    email: cred.email.toLowerCase(),
    credentialId: cred.credentialId,
    publicKey: cred.publicKey,
    counter: cred.counter,
    transports: cred.transports,
    createdAt: cred.createdAt,
  });
}

export async function updateWebAuthnCounter(credentialId: string, counter: number): Promise<void> {
  await db.update(schema.webauthnCredentials).set({ counter }).where(eq(schema.webauthnCredentials.credentialId, credentialId));
}

export async function deleteWebAuthnCredential(credentialId: string): Promise<void> {
  await db.delete(schema.webauthnCredentials).where(eq(schema.webauthnCredentials.credentialId, credentialId));
}

export const storage = { db };
