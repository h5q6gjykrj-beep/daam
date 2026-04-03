import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import * as store from "./storage";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads", "materials");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const pdfStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;
    cb(null, `${uniqueSuffix}.pdf`);
  },
});

const pdfUpload = multer({
  storage: pdfStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf" && path.extname(file.originalname).toLowerCase() === ".pdf") cb(null, true);
    else cb(new Error("PDF only"));
  },
});

function isPdfMagicBytes(filePath: string): boolean {
  try {
    const buffer = Buffer.alloc(5);
    const fd = fs.openSync(filePath, "r");
    fs.readSync(fd, buffer, 0, 5, 0);
    fs.closeSync(fd);
    return buffer.toString("ascii", 0, 4) === "%PDF";
  } catch { return false; }
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {

  // ── Health ────────────────────────────────────────────────────────────────
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  // ── Load All (initial page load) ──────────────────────────────────────────
  app.get('/api/data', async (_req, res) => {
    try {
      const data = await store.loadAllData();
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── Accounts ──────────────────────────────────────────────────────────────
  app.get('/api/accounts/:email', async (req, res) => {
    try {
      const acc = await store.getAccount(req.params.email);
      if (!acc) return res.status(404).json({ error: 'Not found' });
      res.json(acc);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/accounts', async (req, res) => {
    try {
      await store.upsertAccount(req.body);
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.patch('/api/accounts/:email', async (req, res) => {
    try {
      const existing = await store.getAccount(req.params.email);
      if (!existing) return res.status(404).json({ error: 'Not found' });
      await store.upsertAccount({ ...existing, ...req.body, email: req.params.email });
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ── Profiles ──────────────────────────────────────────────────────────────
  app.get('/api/profiles/:email', async (req, res) => {
    try {
      const profile = await store.getProfile(req.params.email);
      if (!profile) return res.status(404).json({ error: 'Not found' });
      res.json(profile);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.patch('/api/profiles/:email', async (req, res) => {
    try {
      await store.upsertProfile(req.params.email, req.body);
      const updated = await store.getProfile(req.params.email);
      res.json(updated);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ── Posts ─────────────────────────────────────────────────────────────────
  app.get('/api/posts', async (_req, res) => {
    try {
      const posts = await store.getAllPosts();
      res.json(posts);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/posts', async (req, res) => {
    try {
      await store.createPost(req.body);
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.patch('/api/posts/:id', async (req, res) => {
    try {
      await store.updatePost(req.params.id, req.body);
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.delete('/api/posts/:id', async (req, res) => {
    try {
      await store.deletePost(req.params.id);
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ── Replies ───────────────────────────────────────────────────────────────
  app.post('/api/posts/:postId/replies', async (req, res) => {
    try {
      await store.addReply({ ...req.body, postId: req.params.postId });
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.patch('/api/replies/:replyId', async (req, res) => {
    try {
      await store.updateReply(req.params.replyId, req.body.content);
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.delete('/api/replies/:replyId', async (req, res) => {
    try {
      await store.deleteReply(req.params.replyId);
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ── Reports ───────────────────────────────────────────────────────────────
  app.get('/api/reports', async (_req, res) => {
    try {
      res.json(await store.getAllReports());
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/reports', async (req, res) => {
    try {
      await store.createReport(req.body);
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.patch('/api/reports/:id', async (req, res) => {
    try {
      await store.updateReportStatus(req.params.id, req.body.status, req.body.resolutionReason);
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ── Moderators ────────────────────────────────────────────────────────────
  app.get('/api/moderators', async (_req, res) => {
    try {
      res.json(await store.getAllModerators());
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/moderators', async (req, res) => {
    try {
      await store.createModerator(req.body.moderator);
      await store.createAuthUser(req.body.authUser);
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.patch('/api/moderators/:id/permissions', async (req, res) => {
    try {
      await store.updateModeratorPermissions(req.params.id, req.body.permissions);
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.patch('/api/moderators/:id/toggle', async (req, res) => {
    try {
      await store.toggleModeratorActive(req.params.id);
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.delete('/api/moderators/:id', async (req, res) => {
    try {
      await store.deleteModerator(req.params.id);
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ── Auth Users ────────────────────────────────────────────────────────────
  app.get('/api/auth-users', async (_req, res) => {
    try {
      res.json(await store.getAllAuthUsers());
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/auth-users', async (req, res) => {
    try {
      await store.createAuthUser(req.body);
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ── Audit Log ─────────────────────────────────────────────────────────────
  app.get('/api/audit-log', async (_req, res) => {
    try {
      res.json(await store.getAuditLog());
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/audit-log', async (req, res) => {
    try {
      await store.addAuditEvent(req.body);
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ── Mutes ─────────────────────────────────────────────────────────────────
  app.get('/api/mutes', async (_req, res) => {
    try {
      res.json(await store.getAllMutes());
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/mutes', async (req, res) => {
    try {
      await store.upsertMute(req.body);
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.delete('/api/mutes/:email', async (req, res) => {
    try {
      await store.deleteMute(req.params.email);
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ── Bans ──────────────────────────────────────────────────────────────────
  app.get('/api/bans', async (_req, res) => {
    try {
      res.json(await store.getAllBans());
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/bans', async (req, res) => {
    try {
      await store.upsertBan(req.body);
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.delete('/api/bans/:email', async (req, res) => {
    try {
      await store.deleteBan(req.params.email);
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ── Conversations ─────────────────────────────────────────────────────────
  app.get('/api/conversations', async (_req, res) => {
    try {
      res.json(await store.getConversations());
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/conversations', async (req, res) => {
    try {
      await store.upsertConversation(req.body);
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.patch('/api/conversations/:id', async (req, res) => {
    try {
      await store.upsertConversation(req.body);
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ── Messages ──────────────────────────────────────────────────────────────
  app.get('/api/messages', async (_req, res) => {
    try {
      res.json(await store.getAllMessages());
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/messages', async (req, res) => {
    try {
      await store.createMessage(req.body);
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/conversations/:id/read', async (req, res) => {
    try {
      await store.markMessagesRead(req.params.id, req.body.userEmail);
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ── Allowed Domains ───────────────────────────────────────────────────────
  app.get('/api/settings/domains', async (_req, res) => {
    try {
      res.json(await store.getAllowedDomains());
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/settings/domains', async (req, res) => {
    try {
      await store.addAllowedDomain(req.body.domain);
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.delete('/api/settings/domains/:domain', async (req, res) => {
    try {
      await store.removeAllowedDomain(req.params.domain);
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ── Generic Settings ──────────────────────────────────────────────────────
  app.get('/api/settings/:key', async (req, res) => {
    try {
      const val = await store.getSetting(req.params.key);
      res.json({ key: req.params.key, value: val });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/settings/:key', async (req, res) => {
    try {
      await store.setSetting(req.params.key, req.body.value);
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ── Profile Materials ─────────────────────────────────────────────────────
  app.get('/api/profile-materials/:email', async (req, res) => {
    try {
      const items = await store.getMaterials(req.params.email);
      res.json(items);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/profile-materials', async (req, res) => {
    try {
      await store.addMaterial(req.body);
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.patch('/api/profile-materials/:id', async (req, res) => {
    try {
      await store.updateMaterial(req.params.id, req.body);
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.delete('/api/profile-materials/:id', async (req, res) => {
    try {
      await store.deleteMaterial(req.params.id);
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ── Profile Research ──────────────────────────────────────────────────────
  app.get('/api/profile-research/:email', async (req, res) => {
    try {
      const items = await store.getResearch(req.params.email);
      res.json(items);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/profile-research', async (req, res) => {
    try {
      await store.addResearch(req.body);
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.patch('/api/profile-research/:id', async (req, res) => {
    try {
      await store.updateResearch(req.params.id, req.body);
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.delete('/api/profile-research/:id', async (req, res) => {
    try {
      await store.deleteResearch(req.params.id);
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ── PDF Upload ────────────────────────────────────────────────────────────
  app.post('/api/materials/upload', (req, res, next) => {
    pdfUpload.single('file')(req, res, (err) => {
      if (err) {
        if (err.message === "PDF only") return res.status(400).json({ ok: false, error: "PDF files only" });
        if (err.code === "LIMIT_FILE_SIZE") return res.status(400).json({ ok: false, error: "File too large (max 10MB)" });
        return res.status(400).json({ ok: false, error: "Upload failed" });
      }
      if (!req.file) return res.status(400).json({ ok: false, error: "No file uploaded" });
      const filePath = path.join(UPLOADS_DIR, req.file.filename);
      if (!isPdfMagicBytes(filePath)) {
        fs.unlinkSync(filePath);
        return res.status(400).json({ ok: false, error: "Invalid PDF file" });
      }
      res.json({ ok: true, url: `/uploads/materials/${req.file.filename}`, originalName: req.file.originalname });
    });
  });

  app.delete('/api/materials', (req, res) => {
    const { url } = req.body;
    if (!url || typeof url !== 'string') return res.status(400).json({ ok: false, error: 'Missing url' });
    if (!url.startsWith('/uploads/materials/') || url.includes('..')) return res.status(400).json({ ok: false, error: 'Invalid path' });
    const filename = path.basename(url);
    if (!filename.endsWith('.pdf')) return res.status(400).json({ ok: false, error: 'Invalid file type' });
    try {
      const filePath = path.join(UPLOADS_DIR, filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      res.json({ ok: true });
    } catch { res.status(500).json({ ok: false, error: 'Failed to delete file' }); }
  });

  return httpServer;
}
