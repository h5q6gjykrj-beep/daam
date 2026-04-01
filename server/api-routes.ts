import { Router, type Request, type Response } from 'express';
import { db } from './db';
import {
  profiles as profilesTable,
  authAccounts,
  posts,
  replies,
  postLikes,
  postSaves,
  follows,
  reports,
  moderators,
  authUsers,
  mutes,
  bans,
  conversations,
  directMessages,
  auditLog,
  allowedDomains,
} from '@shared/schema';
import { eq, and, or, inArray, desc } from 'drizzle-orm';
import { ADMIN_EMAILS, hashPassword } from './auth';
import crypto from 'crypto';

const router = Router();

function requireSession(req: Request, res: Response): string | null {
  if (!req.session.userEmail) {
    res.status(401).json({ ok: false, error: 'Not authenticated' });
    return null;
  }
  return req.session.userEmail;
}

function requireAdmin(req: Request, res: Response): string | null {
  const email = requireSession(req, res);
  if (!email) return null;
  if (!ADMIN_EMAILS.includes(email)) {
    res.status(403).json({ ok: false, error: 'Admin access required' });
    return null;
  }
  return email;
}

function newId(): string {
  return crypto.randomUUID();
}

// ==================== PROFILES ====================

// GET /api/profiles/:email
router.get('/profiles/:email', async (req: Request, res: Response) => {
  try {
    const email = req.params.email.toLowerCase();
    const rows = await db.select().from(profilesTable).where(eq(profilesTable.email, email)).limit(1);
    if (rows.length === 0) {
      return res.json({ ok: true, profile: null });
    }
    res.json({ ok: true, profile: rows[0] });
  } catch (err: any) {
    console.error('Get profile error:', err);
    res.status(500).json({ ok: false, error: 'Failed to get profile' });
  }
});

// PUT /api/profiles/:email
router.put('/profiles/:email', async (req: Request, res: Response) => {
  const userEmail = requireSession(req, res);
  if (!userEmail) return;
  try {
    const email = req.params.email.toLowerCase();
    if (userEmail !== email && !ADMIN_EMAILS.includes(userEmail)) {
      return res.status(403).json({ ok: false, error: 'Cannot update another user\'s profile' });
    }
    const { name, major, university, level, college, avatarColor, avatarUrl, coverUrl, interests, bio, showFavorites, showInterests } = req.body;
    const existing = await db.select({ id: profilesTable.id }).from(profilesTable).where(eq(profilesTable.email, email)).limit(1);
    if (existing.length === 0) {
      const [profile] = await db.insert(profilesTable).values({
        email,
        name: name ?? '',
        major: major ?? '',
        university: university ?? 'UTAS',
        level: level ?? null,
        college: college ?? null,
        avatarColor: avatarColor ?? null,
        avatarUrl: avatarUrl ?? null,
        coverUrl: coverUrl ?? null,
        interests: interests ?? [],
        bio: bio ?? null,
        showFavorites: showFavorites !== undefined ? showFavorites : true,
        showInterests: showInterests !== undefined ? showInterests : true,
      }).returning();
      return res.json({ ok: true, profile });
    }
    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (major !== undefined) updateData.major = major;
    if (university !== undefined) updateData.university = university;
    if (level !== undefined) updateData.level = level;
    if (college !== undefined) updateData.college = college;
    if (avatarColor !== undefined) updateData.avatarColor = avatarColor;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    if (coverUrl !== undefined) updateData.coverUrl = coverUrl;
    if (interests !== undefined) updateData.interests = interests;
    if (bio !== undefined) updateData.bio = bio;
    if (showFavorites !== undefined) updateData.showFavorites = showFavorites;
    if (showInterests !== undefined) updateData.showInterests = showInterests;
    const [profile] = await db.update(profilesTable).set(updateData).where(eq(profilesTable.email, email)).returning();
    res.json({ ok: true, profile });
  } catch (err: any) {
    console.error('Update profile error:', err);
    res.status(500).json({ ok: false, error: 'Failed to update profile' });
  }
});

// GET /api/accounts/:email
router.get('/accounts/:email', async (req: Request, res: Response) => {
  try {
    const email = req.params.email.toLowerCase();
    const rows = await db.select().from(authAccounts).where(eq(authAccounts.email, email)).limit(1);
    if (rows.length === 0) {
      return res.json({ ok: true, account: null });
    }
    const { passwordHash: _pw, ...safe } = rows[0];
    res.json({ ok: true, account: safe });
  } catch (err: any) {
    console.error('Get account error:', err);
    res.status(500).json({ ok: false, error: 'Failed to get account' });
  }
});

// PUT /api/accounts/:email
router.put('/accounts/:email', async (req: Request, res: Response) => {
  const userEmail = requireSession(req, res);
  if (!userEmail) return;
  try {
    const email = req.params.email.toLowerCase();
    if (userEmail !== email && !ADMIN_EMAILS.includes(userEmail)) {
      return res.status(403).json({ ok: false, error: 'Cannot update another user\'s account' });
    }
    const { phone, governorate, wilayat, allowDM } = req.body;
    const updateData: Record<string, any> = {};
    if (phone !== undefined) updateData.phone = phone;
    if (governorate !== undefined) updateData.governorate = governorate;
    if (wilayat !== undefined) updateData.wilayat = wilayat;
    if (allowDM !== undefined) updateData.allowDM = allowDM;
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ ok: false, error: 'No fields to update' });
    }
    const [account] = await db.update(authAccounts).set(updateData).where(eq(authAccounts.email, email)).returning();
    if (!account) return res.status(404).json({ ok: false, error: 'Account not found' });
    const { passwordHash: _pw, ...safe } = account;
    res.json({ ok: true, account: safe });
  } catch (err: any) {
    console.error('Update account error:', err);
    res.status(500).json({ ok: false, error: 'Failed to update account' });
  }
});

// ==================== POSTS ====================

// GET /api/posts
router.get('/posts', async (req: Request, res: Response) => {
  try {
    const allPosts = await db.select().from(posts).orderBy(desc(posts.createdAt));
    const allLikes = await db.select().from(postLikes);
    const allSaves = await db.select().from(postSaves);
    const allReplies = await db.select().from(replies).orderBy(replies.createdAt);

    // Build maps
    const likesMap: Record<string, string[]> = {};
    for (const like of allLikes) {
      if (!likesMap[like.postId]) likesMap[like.postId] = [];
      likesMap[like.postId].push(like.userEmail);
    }
    const savesMap: Record<string, string[]> = {};
    for (const save of allSaves) {
      if (!savesMap[save.postId]) savesMap[save.postId] = [];
      savesMap[save.postId].push(save.userEmail);
    }
    const repliesMap: Record<string, typeof allReplies> = {};
    for (const reply of allReplies) {
      if (!repliesMap[reply.postId]) repliesMap[reply.postId] = [];
      repliesMap[reply.postId].push(reply);
    }

    const localPosts = allPosts.map(post => ({
      id: post.id,
      authorEmail: post.authorEmail,
      content: post.content,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt ? post.updatedAt.toISOString() : undefined,
      likedBy: likesMap[post.id] ?? [],
      savedBy: savesMap[post.id] ?? [],
      replies: (repliesMap[post.id] ?? []).map(r => ({
        id: r.id,
        authorEmail: r.authorEmail,
        content: r.content,
        createdAt: r.createdAt.toISOString(),
        parentId: r.parentReplyId ?? undefined,
      })),
      postType: post.postType,
      subject: post.subject ?? undefined,
      imageUrl: post.imageUrl ?? undefined,
      attachments: (post.attachments as any[]) ?? [],
      status: post.status,
    }));

    res.json({ ok: true, posts: localPosts });
  } catch (err: any) {
    console.error('Get posts error:', err);
    res.status(500).json({ ok: false, error: 'Failed to get posts' });
  }
});

// POST /api/posts
router.post('/posts', async (req: Request, res: Response) => {
  const userEmail = requireSession(req, res);
  if (!userEmail) return;
  try {
    const { content, postType, subject, imageUrl, attachments } = req.body;
    if (!content) return res.status(400).json({ ok: false, error: 'Content is required' });
    const id = newId();
    const [post] = await db.insert(posts).values({
      id,
      authorEmail: userEmail,
      content: content as string,
      postType: (postType as string) ?? 'discussion',
      subject: subject ?? null,
      imageUrl: imageUrl ?? null,
      attachments: attachments ?? [],
      status: 'visible',
    }).returning();
    res.json({
      ok: true, post: {
        ...post,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt ? post.updatedAt.toISOString() : undefined,
        likedBy: [], savedBy: [], replies: [],
      }
    });
  } catch (err: any) {
    console.error('Create post error:', err);
    res.status(500).json({ ok: false, error: 'Failed to create post' });
  }
});

// PUT /api/posts/:id
router.put('/posts/:id', async (req: Request, res: Response) => {
  const userEmail = requireSession(req, res);
  if (!userEmail) return;
  try {
    const { id } = req.params;
    const existing = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
    if (existing.length === 0) return res.status(404).json({ ok: false, error: 'Post not found' });
    if (existing[0].authorEmail !== userEmail && !ADMIN_EMAILS.includes(userEmail)) {
      return res.status(403).json({ ok: false, error: 'Not authorized to edit this post' });
    }
    const { content, postType, subject, imageUrl, attachments, status } = req.body;
    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (content !== undefined) updateData.content = content;
    if (postType !== undefined) updateData.postType = postType;
    if (subject !== undefined) updateData.subject = subject;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (attachments !== undefined) updateData.attachments = attachments;
    if (status !== undefined) updateData.status = status;
    const [post] = await db.update(posts).set(updateData).where(eq(posts.id, id)).returning();
    res.json({ ok: true, post: { ...post, createdAt: post.createdAt.toISOString(), updatedAt: post.updatedAt?.toISOString() } });
  } catch (err: any) {
    console.error('Update post error:', err);
    res.status(500).json({ ok: false, error: 'Failed to update post' });
  }
});

// DELETE /api/posts/:id
router.delete('/posts/:id', async (req: Request, res: Response) => {
  const userEmail = requireSession(req, res);
  if (!userEmail) return;
  try {
    const { id } = req.params;
    const existing = await db.select({ authorEmail: posts.authorEmail }).from(posts).where(eq(posts.id, id)).limit(1);
    if (existing.length === 0) return res.status(404).json({ ok: false, error: 'Post not found' });
    if (existing[0].authorEmail !== userEmail && !ADMIN_EMAILS.includes(userEmail)) {
      return res.status(403).json({ ok: false, error: 'Not authorized to delete this post' });
    }
    // Delete related data
    await db.delete(postLikes).where(eq(postLikes.postId, id));
    await db.delete(postSaves).where(eq(postSaves.postId, id));
    await db.delete(replies).where(eq(replies.postId, id));
    await db.delete(posts).where(eq(posts.id, id));
    res.json({ ok: true });
  } catch (err: any) {
    console.error('Delete post error:', err);
    res.status(500).json({ ok: false, error: 'Failed to delete post' });
  }
});

// POST /api/posts/:id/like
router.post('/posts/:id/like', async (req: Request, res: Response) => {
  const userEmail = requireSession(req, res);
  if (!userEmail) return;
  try {
    const postId = req.params.id;
    const existing = await db.select().from(postLikes)
      .where(and(eq(postLikes.postId, postId), eq(postLikes.userEmail, userEmail))).limit(1);
    if (existing.length > 0) {
      await db.delete(postLikes).where(and(eq(postLikes.postId, postId), eq(postLikes.userEmail, userEmail)));
      return res.json({ ok: true, liked: false });
    }
    await db.insert(postLikes).values({ postId, userEmail });
    res.json({ ok: true, liked: true });
  } catch (err: any) {
    console.error('Like post error:', err);
    res.status(500).json({ ok: false, error: 'Failed to toggle like' });
  }
});

// POST /api/posts/:id/save
router.post('/posts/:id/save', async (req: Request, res: Response) => {
  const userEmail = requireSession(req, res);
  if (!userEmail) return;
  try {
    const postId = req.params.id;
    const existing = await db.select().from(postSaves)
      .where(and(eq(postSaves.postId, postId), eq(postSaves.userEmail, userEmail))).limit(1);
    if (existing.length > 0) {
      await db.delete(postSaves).where(and(eq(postSaves.postId, postId), eq(postSaves.userEmail, userEmail)));
      return res.json({ ok: true, saved: false });
    }
    await db.insert(postSaves).values({ postId, userEmail });
    res.json({ ok: true, saved: true });
  } catch (err: any) {
    console.error('Save post error:', err);
    res.status(500).json({ ok: false, error: 'Failed to toggle save' });
  }
});

// POST /api/posts/:id/replies
router.post('/posts/:id/replies', async (req: Request, res: Response) => {
  const userEmail = requireSession(req, res);
  if (!userEmail) return;
  try {
    const postId = req.params.id;
    const { content, parentReplyId } = req.body;
    if (!content) return res.status(400).json({ ok: false, error: 'Content is required' });
    const [reply] = await db.insert(replies).values({
      id: newId(),
      postId,
      authorEmail: userEmail,
      content: content as string,
      parentReplyId: parentReplyId ?? null,
    }).returning();
    res.json({
      ok: true, reply: {
        id: reply.id,
        authorEmail: reply.authorEmail,
        content: reply.content,
        createdAt: reply.createdAt.toISOString(),
        parentId: reply.parentReplyId ?? undefined,
      }
    });
  } catch (err: any) {
    console.error('Add reply error:', err);
    res.status(500).json({ ok: false, error: 'Failed to add reply' });
  }
});

// DELETE /api/posts/:postId/replies/:replyId
router.delete('/posts/:postId/replies/:replyId', async (req: Request, res: Response) => {
  const userEmail = requireSession(req, res);
  if (!userEmail) return;
  try {
    const { postId, replyId } = req.params;
    const existing = await db.select({ authorEmail: replies.authorEmail }).from(replies)
      .where(and(eq(replies.id, replyId), eq(replies.postId, postId))).limit(1);
    if (existing.length === 0) return res.status(404).json({ ok: false, error: 'Reply not found' });
    if (existing[0].authorEmail !== userEmail && !ADMIN_EMAILS.includes(userEmail)) {
      return res.status(403).json({ ok: false, error: 'Not authorized to delete this reply' });
    }
    await db.delete(replies).where(eq(replies.id, replyId));
    res.json({ ok: true });
  } catch (err: any) {
    console.error('Delete reply error:', err);
    res.status(500).json({ ok: false, error: 'Failed to delete reply' });
  }
});

// PUT /api/posts/:postId/replies/:replyId
router.put('/posts/:postId/replies/:replyId', async (req: Request, res: Response) => {
  const userEmail = requireSession(req, res);
  if (!userEmail) return;
  try {
    const { postId, replyId } = req.params;
    const { content } = req.body;
    if (!content) return res.status(400).json({ ok: false, error: 'Content is required' });
    const existing = await db.select({ authorEmail: replies.authorEmail }).from(replies)
      .where(and(eq(replies.id, replyId), eq(replies.postId, postId))).limit(1);
    if (existing.length === 0) return res.status(404).json({ ok: false, error: 'Reply not found' });
    if (existing[0].authorEmail !== userEmail && !ADMIN_EMAILS.includes(userEmail)) {
      return res.status(403).json({ ok: false, error: 'Not authorized to edit this reply' });
    }
    const [reply] = await db.update(replies).set({ content: content as string, updatedAt: new Date() })
      .where(eq(replies.id, replyId)).returning();
    res.json({
      ok: true, reply: {
        id: reply.id,
        authorEmail: reply.authorEmail,
        content: reply.content,
        createdAt: reply.createdAt.toISOString(),
        parentId: reply.parentReplyId ?? undefined,
      }
    });
  } catch (err: any) {
    console.error('Edit reply error:', err);
    res.status(500).json({ ok: false, error: 'Failed to edit reply' });
  }
});

// ==================== FOLLOWS ====================

// POST /api/follows/:targetEmail
router.post('/follows/:targetEmail', async (req: Request, res: Response) => {
  const userEmail = requireSession(req, res);
  if (!userEmail) return;
  try {
    const targetEmail = req.params.targetEmail.toLowerCase();
    if (userEmail === targetEmail) return res.status(400).json({ ok: false, error: 'Cannot follow yourself' });
    const existing = await db.select().from(follows)
      .where(and(eq(follows.followerEmail, userEmail), eq(follows.followingEmail, targetEmail))).limit(1);
    if (existing.length > 0) {
      await db.delete(follows).where(and(eq(follows.followerEmail, userEmail), eq(follows.followingEmail, targetEmail)));
      return res.json({ ok: true, following: false });
    }
    await db.insert(follows).values({ followerEmail: userEmail, followingEmail: targetEmail });
    res.json({ ok: true, following: true });
  } catch (err: any) {
    console.error('Toggle follow error:', err);
    res.status(500).json({ ok: false, error: 'Failed to toggle follow' });
  }
});

// GET /api/follows/check/:targetEmail
router.get('/follows/check/:targetEmail', async (req: Request, res: Response) => {
  const userEmail = requireSession(req, res);
  if (!userEmail) return;
  try {
    const targetEmail = req.params.targetEmail.toLowerCase();
    const existing = await db.select().from(follows)
      .where(and(eq(follows.followerEmail, userEmail), eq(follows.followingEmail, targetEmail))).limit(1);
    res.json({ ok: true, following: existing.length > 0 });
  } catch (err: any) {
    console.error('Check follow error:', err);
    res.status(500).json({ ok: false, error: 'Failed to check follow status' });
  }
});

// ==================== REPORTS ====================

// GET /api/reports
router.get('/reports', async (req: Request, res: Response) => {
  const adminEmail = requireAdmin(req, res);
  if (!adminEmail) return;
  try {
    const allReports = await db.select().from(reports).orderBy(desc(reports.createdAt));
    res.json({ ok: true, reports: allReports.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })) });
  } catch (err: any) {
    console.error('Get reports error:', err);
    res.status(500).json({ ok: false, error: 'Failed to get reports' });
  }
});

// POST /api/reports
router.post('/reports', async (req: Request, res: Response) => {
  const userEmail = requireSession(req, res);
  if (!userEmail) return;
  try {
    const { targetType, targetId, targetTitle, reason, note } = req.body;
    if (!targetType || !targetId || !targetTitle || !reason) {
      return res.status(400).json({ ok: false, error: 'Missing required fields' });
    }
    const [report] = await db.insert(reports).values({
      id: newId(),
      targetType: targetType as string,
      targetId: targetId as string,
      targetTitle: targetTitle as string,
      reason: reason as string,
      note: note ?? null,
      reporterEmail: userEmail,
      status: 'open',
    }).returning();
    res.json({ ok: true, report: { ...report, createdAt: report.createdAt.toISOString() } });
  } catch (err: any) {
    console.error('Submit report error:', err);
    res.status(500).json({ ok: false, error: 'Failed to submit report' });
  }
});

// PUT /api/reports/:id
router.put('/reports/:id', async (req: Request, res: Response) => {
  const adminEmail = requireAdmin(req, res);
  if (!adminEmail) return;
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ ok: false, error: 'Status is required' });
    const [report] = await db.update(reports).set({ status: status as string }).where(eq(reports.id, id)).returning();
    if (!report) return res.status(404).json({ ok: false, error: 'Report not found' });
    res.json({ ok: true, report: { ...report, createdAt: report.createdAt.toISOString() } });
  } catch (err: any) {
    console.error('Update report error:', err);
    res.status(500).json({ ok: false, error: 'Failed to update report' });
  }
});

// ==================== MODERATORS ====================

// GET /api/moderators
router.get('/moderators', async (req: Request, res: Response) => {
  try {
    const allModerators = await db.select().from(moderators).orderBy(desc(moderators.createdAt));
    res.json({ ok: true, moderators: allModerators.map(m => ({ ...m, createdAt: m.createdAt.toISOString() })) });
  } catch (err: any) {
    console.error('Get moderators error:', err);
    res.status(500).json({ ok: false, error: 'Failed to get moderators' });
  }
});

// POST /api/moderators
router.post('/moderators', async (req: Request, res: Response) => {
  const adminEmail = requireAdmin(req, res);
  if (!adminEmail) return;
  try {
    const { email, displayName, role, permissions, password } = req.body;
    if (!email || !displayName) return res.status(400).json({ ok: false, error: 'Email and display name required' });
    const emailLower = (email as string).toLowerCase();
    const modId = newId();
    const [moderator] = await db.insert(moderators).values({
      id: modId,
      email: emailLower,
      displayName: displayName as string,
      role: (role as string) ?? 'moderator',
      permissions: (permissions as string[]) ?? [],
      isActive: true,
      createdBy: adminEmail,
    }).returning();
    // Create auth user entry if password is provided
    if (password) {
      await db.insert(authUsers).values({
        id: newId(),
        email: emailLower,
        passwordHash: hashPassword(password as string),
        role: (role as string) ?? 'moderator',
        linkedModeratorId: modId,
      }).onConflictDoNothing();
    }
    res.json({ ok: true, moderator: { ...moderator, createdAt: moderator.createdAt.toISOString() } });
  } catch (err: any) {
    console.error('Create moderator error:', err);
    res.status(500).json({ ok: false, error: 'Failed to create moderator' });
  }
});

// PUT /api/moderators/:id/permissions
router.put('/moderators/:id/permissions', async (req: Request, res: Response) => {
  const adminEmail = requireAdmin(req, res);
  if (!adminEmail) return;
  try {
    const { id } = req.params;
    const { permissions } = req.body;
    if (!Array.isArray(permissions)) return res.status(400).json({ ok: false, error: 'Permissions must be an array' });
    const [moderator] = await db.update(moderators).set({ permissions }).where(eq(moderators.id, id)).returning();
    if (!moderator) return res.status(404).json({ ok: false, error: 'Moderator not found' });
    res.json({ ok: true, moderator: { ...moderator, createdAt: moderator.createdAt.toISOString() } });
  } catch (err: any) {
    console.error('Update permissions error:', err);
    res.status(500).json({ ok: false, error: 'Failed to update permissions' });
  }
});

// PUT /api/moderators/:id/toggle-active
router.put('/moderators/:id/toggle-active', async (req: Request, res: Response) => {
  const adminEmail = requireAdmin(req, res);
  if (!adminEmail) return;
  try {
    const { id } = req.params;
    const existing = await db.select({ isActive: moderators.isActive }).from(moderators).where(eq(moderators.id, id)).limit(1);
    if (existing.length === 0) return res.status(404).json({ ok: false, error: 'Moderator not found' });
    const [moderator] = await db.update(moderators).set({ isActive: !existing[0].isActive }).where(eq(moderators.id, id)).returning();
    res.json({ ok: true, moderator: { ...moderator, createdAt: moderator.createdAt.toISOString() } });
  } catch (err: any) {
    console.error('Toggle active error:', err);
    res.status(500).json({ ok: false, error: 'Failed to toggle moderator active status' });
  }
});

// DELETE /api/moderators/:id
router.delete('/moderators/:id', async (req: Request, res: Response) => {
  const adminEmail = requireAdmin(req, res);
  if (!adminEmail) return;
  try {
    const { id } = req.params;
    const existing = await db.select({ email: moderators.email }).from(moderators).where(eq(moderators.id, id)).limit(1);
    if (existing.length === 0) return res.status(404).json({ ok: false, error: 'Moderator not found' });
    // Also delete linked auth user
    await db.delete(authUsers).where(eq(authUsers.email, existing[0].email));
    await db.delete(moderators).where(eq(moderators.id, id));
    res.json({ ok: true });
  } catch (err: any) {
    console.error('Delete moderator error:', err);
    res.status(500).json({ ok: false, error: 'Failed to delete moderator' });
  }
});

// ==================== MUTES ====================

// GET /api/mutes
router.get('/mutes', async (req: Request, res: Response) => {
  const adminEmail = requireAdmin(req, res);
  if (!adminEmail) return;
  try {
    const allMutes = await db.select().from(mutes).orderBy(desc(mutes.mutedAt));
    res.json({ ok: true, mutes: allMutes.map(m => ({ ...m, mutedAt: m.mutedAt.toISOString(), expiresAt: m.expiresAt?.toISOString() ?? null })) });
  } catch (err: any) {
    console.error('Get mutes error:', err);
    res.status(500).json({ ok: false, error: 'Failed to get mutes' });
  }
});

// POST /api/mutes
router.post('/mutes', async (req: Request, res: Response) => {
  const adminEmail = requireAdmin(req, res);
  if (!adminEmail) return;
  try {
    const { userEmail, reason, expiresAt } = req.body;
    if (!userEmail) return res.status(400).json({ ok: false, error: 'User email required' });
    const [mute] = await db.insert(mutes).values({
      userEmail: (userEmail as string).toLowerCase(),
      mutedBy: adminEmail,
      reason: reason ?? null,
      expiresAt: expiresAt ? new Date(expiresAt as string) : null,
    }).onConflictDoNothing().returning();
    if (!mute) return res.status(400).json({ ok: false, error: 'User is already muted' });
    res.json({ ok: true, mute: { ...mute, mutedAt: mute.mutedAt.toISOString(), expiresAt: mute.expiresAt?.toISOString() ?? null } });
  } catch (err: any) {
    console.error('Mute user error:', err);
    res.status(500).json({ ok: false, error: 'Failed to mute user' });
  }
});

// DELETE /api/mutes/:userEmail
router.delete('/mutes/:userEmail', async (req: Request, res: Response) => {
  const adminEmail = requireAdmin(req, res);
  if (!adminEmail) return;
  try {
    const userEmail = req.params.userEmail.toLowerCase();
    await db.delete(mutes).where(eq(mutes.userEmail, userEmail));
    res.json({ ok: true });
  } catch (err: any) {
    console.error('Unmute user error:', err);
    res.status(500).json({ ok: false, error: 'Failed to unmute user' });
  }
});

// ==================== BANS ====================

// GET /api/bans
router.get('/bans', async (req: Request, res: Response) => {
  const adminEmail = requireAdmin(req, res);
  if (!adminEmail) return;
  try {
    const allBans = await db.select().from(bans).orderBy(desc(bans.bannedAt));
    res.json({ ok: true, bans: allBans.map(b => ({ ...b, bannedAt: b.bannedAt.toISOString(), expiresAt: b.expiresAt?.toISOString() ?? null })) });
  } catch (err: any) {
    console.error('Get bans error:', err);
    res.status(500).json({ ok: false, error: 'Failed to get bans' });
  }
});

// POST /api/bans
router.post('/bans', async (req: Request, res: Response) => {
  const adminEmail = requireAdmin(req, res);
  if (!adminEmail) return;
  try {
    const { userEmail, reason, expiresAt } = req.body;
    if (!userEmail) return res.status(400).json({ ok: false, error: 'User email required' });
    const targetEmail = (userEmail as string).toLowerCase();
    // Insert ban record
    const [ban] = await db.insert(bans).values({
      userEmail: targetEmail,
      bannedBy: adminEmail,
      reason: reason ?? null,
      expiresAt: expiresAt ? new Date(expiresAt as string) : null,
    }).onConflictDoNothing().returning();
    if (!ban) return res.status(400).json({ ok: false, error: 'User is already banned' });
    // Also update authAccounts banned flag
    await db.update(authAccounts).set({ banned: true, bannedReason: reason ?? null }).where(eq(authAccounts.email, targetEmail));
    res.json({ ok: true, ban: { ...ban, bannedAt: ban.bannedAt.toISOString(), expiresAt: ban.expiresAt?.toISOString() ?? null } });
  } catch (err: any) {
    console.error('Ban user error:', err);
    res.status(500).json({ ok: false, error: 'Failed to ban user' });
  }
});

// DELETE /api/bans/:userEmail
router.delete('/bans/:userEmail', async (req: Request, res: Response) => {
  const adminEmail = requireAdmin(req, res);
  if (!adminEmail) return;
  try {
    const targetEmail = req.params.userEmail.toLowerCase();
    await db.delete(bans).where(eq(bans.userEmail, targetEmail));
    // Unset banned flag on authAccounts
    await db.update(authAccounts).set({ banned: false, bannedReason: null }).where(eq(authAccounts.email, targetEmail));
    res.json({ ok: true });
  } catch (err: any) {
    console.error('Unban user error:', err);
    res.status(500).json({ ok: false, error: 'Failed to unban user' });
  }
});

// ==================== CONVERSATIONS / DMs ====================

// GET /api/conversations
router.get('/conversations', async (req: Request, res: Response) => {
  const userEmail = requireSession(req, res);
  if (!userEmail) return;
  try {
    const convs = await db.select().from(conversations)
      .where(or(eq(conversations.participant1, userEmail), eq(conversations.participant2, userEmail)))
      .orderBy(desc(conversations.lastMessageAt));
    res.json({
      ok: true, conversations: convs.map(c => ({
        ...c,
        lastMessageAt: c.lastMessageAt.toISOString(),
      }))
    });
  } catch (err: any) {
    console.error('Get conversations error:', err);
    res.status(500).json({ ok: false, error: 'Failed to get conversations' });
  }
});

// POST /api/conversations - get or create conversation with another user
router.post('/conversations', async (req: Request, res: Response) => {
  const userEmail = requireSession(req, res);
  if (!userEmail) return;
  try {
    const { otherEmail } = req.body;
    if (!otherEmail) return res.status(400).json({ ok: false, error: 'Other email required' });
    const otherLower = (otherEmail as string).toLowerCase();
    if (userEmail === otherLower) return res.status(400).json({ ok: false, error: 'Cannot start conversation with yourself' });

    // Sort participants to ensure consistent lookup (p1 < p2 alphabetically)
    const [p1, p2] = [userEmail, otherLower].sort();

    const existing = await db.select().from(conversations)
      .where(and(eq(conversations.participant1, p1), eq(conversations.participant2, p2))).limit(1);

    if (existing.length > 0) {
      return res.json({ ok: true, conversation: { ...existing[0], lastMessageAt: existing[0].lastMessageAt.toISOString() } });
    }

    const [conv] = await db.insert(conversations).values({
      id: newId(),
      participant1: p1,
      participant2: p2,
    }).returning();
    res.json({ ok: true, conversation: { ...conv, lastMessageAt: conv.lastMessageAt.toISOString() } });
  } catch (err: any) {
    console.error('Create conversation error:', err);
    res.status(500).json({ ok: false, error: 'Failed to create conversation' });
  }
});

// GET /api/conversations/:id/messages
router.get('/conversations/:id/messages', async (req: Request, res: Response) => {
  const userEmail = requireSession(req, res);
  if (!userEmail) return;
  try {
    const { id } = req.params;
    // Verify user is participant
    const conv = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
    if (conv.length === 0) return res.status(404).json({ ok: false, error: 'Conversation not found' });
    if (conv[0].participant1 !== userEmail && conv[0].participant2 !== userEmail) {
      return res.status(403).json({ ok: false, error: 'Not a participant in this conversation' });
    }
    const msgs = await db.select().from(directMessages).where(eq(directMessages.conversationId, id)).orderBy(directMessages.sentAt);
    res.json({
      ok: true, messages: msgs.map(m => ({
        ...m,
        sentAt: m.sentAt.toISOString(),
        readBy: (m.readBy as string[]) ?? [],
      }))
    });
  } catch (err: any) {
    console.error('Get messages error:', err);
    res.status(500).json({ ok: false, error: 'Failed to get messages' });
  }
});

// POST /api/conversations/:id/messages
router.post('/conversations/:id/messages', async (req: Request, res: Response) => {
  const userEmail = requireSession(req, res);
  if (!userEmail) return;
  try {
    const { id } = req.params;
    const { content } = req.body;
    if (!content) return res.status(400).json({ ok: false, error: 'Content is required' });
    // Verify participant
    const conv = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
    if (conv.length === 0) return res.status(404).json({ ok: false, error: 'Conversation not found' });
    if (conv[0].participant1 !== userEmail && conv[0].participant2 !== userEmail) {
      return res.status(403).json({ ok: false, error: 'Not a participant in this conversation' });
    }
    const preview = (content as string).substring(0, 100);
    const [msg] = await db.insert(directMessages).values({
      id: newId(),
      conversationId: id,
      senderEmail: userEmail,
      content: content as string,
      readBy: [userEmail],
    }).returning();
    // Update conversation last message
    await db.update(conversations).set({ lastMessageAt: new Date(), lastMessagePreview: preview }).where(eq(conversations.id, id));
    res.json({ ok: true, message: { ...msg, sentAt: msg.sentAt.toISOString(), readBy: (msg.readBy as string[]) ?? [] } });
  } catch (err: any) {
    console.error('Send message error:', err);
    res.status(500).json({ ok: false, error: 'Failed to send message' });
  }
});

// PUT /api/conversations/:id/read
router.put('/conversations/:id/read', async (req: Request, res: Response) => {
  const userEmail = requireSession(req, res);
  if (!userEmail) return;
  try {
    const { id } = req.params;
    // Get all messages in conversation not yet read by this user
    const msgs = await db.select().from(directMessages).where(eq(directMessages.conversationId, id));
    for (const msg of msgs) {
      const readBy = (msg.readBy as string[]) ?? [];
      if (!readBy.includes(userEmail)) {
        await db.update(directMessages).set({ readBy: [...readBy, userEmail] }).where(eq(directMessages.id, msg.id));
      }
    }
    res.json({ ok: true });
  } catch (err: any) {
    console.error('Mark read error:', err);
    res.status(500).json({ ok: false, error: 'Failed to mark as read' });
  }
});

// ==================== AUDIT LOG ====================

// GET /api/audit
router.get('/audit', async (req: Request, res: Response) => {
  const adminEmail = requireAdmin(req, res);
  if (!adminEmail) return;
  try {
    const limit = parseInt((req.query.limit as string) ?? '100', 10);
    const logs = await db.select().from(auditLog).orderBy(desc(auditLog.at)).limit(limit);
    res.json({ ok: true, logs: logs.map(l => ({ ...l, at: l.at.toISOString() })) });
  } catch (err: any) {
    console.error('Get audit log error:', err);
    res.status(500).json({ ok: false, error: 'Failed to get audit log' });
  }
});

// POST /api/audit
router.post('/audit', async (req: Request, res: Response) => {
  const userEmail = requireSession(req, res);
  if (!userEmail) return;
  try {
    const { action, targetType, targetId, meta } = req.body;
    if (!action || !targetType || !targetId) return res.status(400).json({ ok: false, error: 'Missing required fields' });
    const [log] = await db.insert(auditLog).values({
      id: newId(),
      action: action as string,
      targetType: targetType as string,
      targetId: targetId as string,
      byEmail: userEmail,
      meta: meta ?? null,
    }).returning();
    res.json({ ok: true, log: { ...log, at: log.at.toISOString() } });
  } catch (err: any) {
    console.error('Add audit log error:', err);
    res.status(500).json({ ok: false, error: 'Failed to add audit event' });
  }
});

// ==================== ALLOWED DOMAINS ====================

// GET /api/allowed-domains
router.get('/allowed-domains', async (req: Request, res: Response) => {
  try {
    const domains = await db.select().from(allowedDomains);
    res.json({ ok: true, domains });
  } catch (err: any) {
    console.error('Get allowed domains error:', err);
    res.status(500).json({ ok: false, error: 'Failed to get allowed domains' });
  }
});

// POST /api/allowed-domains
router.post('/allowed-domains', async (req: Request, res: Response) => {
  const adminEmail = requireAdmin(req, res);
  if (!adminEmail) return;
  try {
    const { domain } = req.body;
    if (!domain) return res.status(400).json({ ok: false, error: 'Domain is required' });
    const [row] = await db.insert(allowedDomains).values({ domain: (domain as string).toLowerCase() }).onConflictDoNothing().returning();
    if (!row) return res.status(400).json({ ok: false, error: 'Domain already exists' });
    res.json({ ok: true, domain: row });
  } catch (err: any) {
    console.error('Add allowed domain error:', err);
    res.status(500).json({ ok: false, error: 'Failed to add domain' });
  }
});

// DELETE /api/allowed-domains/:domain
router.delete('/allowed-domains/:domain', async (req: Request, res: Response) => {
  const adminEmail = requireAdmin(req, res);
  if (!adminEmail) return;
  try {
    const domain = req.params.domain.toLowerCase();
    await db.delete(allowedDomains).where(eq(allowedDomains.domain, domain));
    res.json({ ok: true });
  } catch (err: any) {
    console.error('Remove allowed domain error:', err);
    res.status(500).json({ ok: false, error: 'Failed to remove domain' });
  }
});

// ==================== AUTH USERS (admin-created moderators) ====================

// POST /api/auth-users
router.post('/auth-users', async (req: Request, res: Response) => {
  const adminEmail = requireAdmin(req, res);
  if (!adminEmail) return;
  try {
    const { email, password, role, linkedModeratorId } = req.body;
    if (!email || !password) return res.status(400).json({ ok: false, error: 'Email and password required' });
    const emailLower = (email as string).toLowerCase();
    const [authUser] = await db.insert(authUsers).values({
      id: newId(),
      email: emailLower,
      passwordHash: hashPassword(password as string),
      role: (role as string) ?? 'moderator',
      linkedModeratorId: linkedModeratorId ?? null,
    }).onConflictDoNothing().returning();
    if (!authUser) return res.status(400).json({ ok: false, error: 'Auth user with this email already exists' });
    const { passwordHash: _pw, ...safe } = authUser;
    res.json({ ok: true, authUser: { ...safe, createdAt: authUser.createdAt.toISOString() } });
  } catch (err: any) {
    console.error('Create auth user error:', err);
    res.status(500).json({ ok: false, error: 'Failed to create auth user' });
  }
});

export default router;
