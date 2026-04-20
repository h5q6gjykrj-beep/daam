import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import https from "https";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import * as store from "./storage";
import { uploadImageBuffer, uploadPdfBuffer, uploadVideoBuffer, deleteCloudinaryFile, generateSignedUrl } from "./cloudinary";
import { Resend } from "resend";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import type { AuthenticatorTransportFuture } from "@simplewebauthn/types";


// ── WebAuthn config ───────────────────────────────────────────────────────────
const RP_NAME = "منصة دام";
const RP_ID = process.env.WEBAUTHN_RP_ID || "localhost";
const ORIGIN = process.env.WEBAUTHN_ORIGIN || `http://localhost:5000`;

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {

  // ── Health ────────────────────────────────────────────────────────────────
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  app.get('/api/ping', (_req, res) => res.json({ status: 'ok', ts: Date.now() }));

  // ── Stats ─────────────────────────────────────────────────────────────────
  app.get('/api/stats/users-count', async (_req, res) => {
    try {
      const accounts = await store.getAllAccounts();
      const count = Object.keys(accounts).length;
      res.json({ count });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ── Load All (initial page load) ──────────────────────────────────────────
  app.get('/api/data', async (_req, res) => {
    try {
      const data = await store.loadAllData();
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── Auth Login ────────────────────────────────────────────────────────────
  const simpleHash = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  };

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || password === undefined) return res.status(400).json({ error: 'Email and password required' });
      const emailLower = (email as string).toLowerCase();

      // Check authUsers first (admins/moderators store password as-is)
      const authUser = await store.getAuthUserByEmail(emailLower);
      if (authUser) {
        if (authUser.passwordHash !== password) return res.status(401).json({ error: 'Incorrect password' });
        return res.json({ type: 'authUser', authUser });
      }

      // Check regular student accounts
      const account = await store.getAccount(emailLower);
      if (!account) return res.status(404).json({ error: 'Account not registered' });
      if (!account.verified) return res.status(403).json({ error: 'Please verify your email first' });
      if (account.banned) return res.status(403).json({ error: 'Your account is banned: ' + (account.bannedReason || '') });
      const computed = simpleHash(password);
      console.log('[login] storedHash:', account.passwordHash, '| computed:', computed, '| match:', account.passwordHash === computed);
      if (account.passwordHash !== computed) return res.status(401).json({ error: 'Incorrect password' });

      return res.json({ type: 'account', account });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ── Register with email verification ─────────────────────────────────────
  app.post('/api/register', async (req, res) => {
    try {
      const { email, password, name, phone, governorate, wilayat } = req.body;
      if (!email || !password || !name) return res.status(400).json({ error: 'Missing required fields' });

      const emailLower = (email as string).toLowerCase();
      const isModerator = emailLower === 'w.qq89@hotmail.com';

      const existing = await store.getAccount(emailLower);
      if (existing) return res.status(409).json({ error: 'Email already registered' });

      if (!isModerator) {
        if (emailLower.includes('@hotmail.')) return res.status(400).json({ error: 'Hotmail emails are not allowed' });
        const allowedDomains = await store.getAllowedDomains();
        const domain = emailLower.split('@')[1];
        if (!domain || !allowedDomains.includes(domain)) {
          return res.status(400).json({ error: 'Please use an approved university email' });
        }
      }

      const token = crypto.randomBytes(32).toString('hex');
      const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      await store.upsertAccount({
        email: emailLower,
        passwordHash: simpleHash(password as string),
        phone: phone || '',
        region: { governorate: governorate || '', wilayat: wilayat || '' },
        role: isModerator ? 'moderator' : 'student',
        verified: false,
        verificationToken: token,
        verificationExpiry: expiry,
        createdAt: new Date().toISOString(),
      } as any);

      await store.upsertProfile(emailLower, {
        email: emailLower, name: name as string,
        bio: '', major: '', university: 'UTAS', followers: [], following: [],
      });

      // Send verification email
      const verifyUrl = `https://daamtaaleem.com/verify?token=${token}`;
      try {
        console.log('[register] Sending email to:', emailLower);
        console.log('[register] RESEND_API_KEY present:', !!process.env.RESEND_API_KEY);
        const resend = new Resend(process.env.RESEND_API_KEY);
        const resendResult = await resend.emails.send({
          from: 'noreply@daamtaaleem.com',
          to: emailLower,
          subject: 'تأكيد حسابك في منصة دام | Verify your DAAM account',
          headers: { 'X-Priority': '1', 'Importance': 'high' },
          html: `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:Arial,sans-serif;direction:rtl">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:40px 20px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:16px;overflow:hidden;border:1px solid #2a2a2a;max-width:100%">
        <tr><td style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:32px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:28px;font-weight:bold">منصة دام</h1>
          <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px">DAAM Student Platform</p>
        </td></tr>
        <tr><td style="padding:32px">
          <h2 style="color:#e2e8f0;margin:0 0 16px;font-size:20px">مرحباً، ${name}!</h2>
          <p style="color:#94a3b8;line-height:1.7;margin:0 0 24px;font-size:15px">
            شكراً لتسجيلك في منصة دام. لتفعيل حسابك والبدء في النقاش مع زملائك، اضغط على الزر أدناه:
          </p>
          <div style="text-align:center;margin:32px 0">
            <a href="${verifyUrl}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:bold">
              تفعيل الحساب
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
            هذا الرابط صالح لمدة 24 ساعة · This link expires in 24 hours
          </p>
        </td></tr>
        <tr><td style="background:#111;padding:20px;text-align:center">
          <p style="color:#475569;font-size:12px;margin:0">© 2026 DAAM · daamtaaleem.com</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
        });
        console.log('[register] Resend result:', JSON.stringify(resendResult));
      } catch (emailErr: any) {
        console.error('[register] Resend error:', emailErr.message, emailErr);
      }

      return res.json({ ok: true, email: emailLower });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ── Verify Email ──────────────────────────────────────────────────────────
  app.get('/api/verify-email', async (req, res) => {
    try {
      const token = req.query.token as string;
      if (!token) return res.status(400).json({ error: 'Token required' });

      const allAccounts = await store.getAllAccounts();
      const entry = Object.entries(allAccounts).find(([, acc]) => acc.verificationToken === token);
      if (!entry) return res.status(400).json({ error: 'Invalid or already used token' });

      const [, account] = entry;
      if (account.verificationExpiry && new Date(account.verificationExpiry) < new Date()) {
        return res.status(400).json({ error: 'Verification link has expired' });
      }

      await store.upsertAccount({
        ...account, verified: true,
        verificationToken: undefined, verificationExpiry: undefined,
      } as any);

      return res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ── Forgot Password ───────────────────────────────────────────────────────
  app.post('/api/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: 'Email required' });
      const emailLower = (email as string).toLowerCase();

      const account = await store.getAccount(emailLower);
      // Always return ok to prevent email enumeration
      if (!account) return res.json({ ok: true });

      const token = crypto.randomBytes(32).toString('hex');
      const expiry = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

      await store.upsertAccount({ ...account, resetToken: token, resetTokenExpiry: expiry });

      const resetUrl = `https://www.daamtaaleem.com/reset-password?token=${token}`;
      try {
        console.log('[forgot-password] Sending email to:', emailLower);
        console.log('[forgot-password] RESEND_API_KEY present:', !!process.env.RESEND_API_KEY);
        const resend = new Resend(process.env.RESEND_API_KEY);
        const resendResult = await resend.emails.send({
          from: 'noreply@daamtaaleem.com',
          to: emailLower,
          subject: 'إعادة تعيين كلمة المرور | Reset your DAAM password',
          headers: { 'X-Priority': '1', 'Importance': 'high' },
          html: `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:Arial,sans-serif;direction:rtl">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:40px 20px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:16px;overflow:hidden;border:1px solid #2a2a2a;max-width:100%">
        <tr><td style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:32px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:28px;font-weight:bold">منصة دام</h1>
          <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px">DAAM Student Platform</p>
        </td></tr>
        <tr><td style="padding:32px">
          <h2 style="color:#e2e8f0;margin:0 0 16px;font-size:20px">إعادة تعيين كلمة المرور</h2>
          <p style="color:#94a3b8;line-height:1.7;margin:0 0 24px;font-size:15px">
            تلقينا طلباً لإعادة تعيين كلمة مرور حسابك في منصة دام. اضغط على الزر أدناه لإنشاء كلمة مرور جديدة:
          </p>
          <div style="text-align:center;margin:32px 0">
            <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:bold">
              إعادة تعيين كلمة المرور
            </a>
          </div>
          <p style="color:#64748b;font-size:13px;text-align:center;margin:0 0 16px">
            هذا الرابط صالح لمدة ساعة واحدة فقط
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
            إذا لم تطلب إعادة التعيين، تجاهل هذا البريد · If you did not request this, ignore this email.
          </p>
        </td></tr>
        <tr><td style="background:#111;padding:20px;text-align:center">
          <p style="color:#475569;font-size:12px;margin:0">© 2026 DAAM · daamtaaleem.com</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
        });
        console.log('[forgot-password] Resend result:', JSON.stringify(resendResult));
      } catch (emailErr: any) {
        console.error('[forgot-password] Resend error:', emailErr.message, emailErr);
      }

      return res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ── Change Password (authenticated) ──────────────────────────────────────
  app.post('/api/change-password', async (req, res) => {
    try {
      const { email, currentPassword, newPassword } = req.body;
      if (!email || !currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      if ((newPassword as string).length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
      }
      const emailLower = (email as string).toLowerCase();
      const account = await store.getAccount(emailLower);
      if (!account) return res.status(404).json({ error: 'Account not found' });

      if (account.passwordHash !== simpleHash(currentPassword as string)) {
        return res.status(401).json({ error: 'current_password_wrong' });
      }

      await store.upsertAccount({ ...account, passwordHash: simpleHash(newPassword as string) });
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ── Reset Password ────────────────────────────────────────────────────────
  app.post('/api/reset-password', async (req, res) => {
    try {
      const { token, password } = req.body;
      console.log('[reset-password] token present:', !!token, '| password length:', (password as string)?.length);
      if (!token || !password) return res.status(400).json({ error: 'Token and password required' });
      if ((password as string).length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

      const allAccounts = await store.getAllAccounts();
      const entry = Object.entries(allAccounts).find(([, acc]) => acc.resetToken === token);
      console.log('[reset-password] account found:', !!entry);
      if (!entry) return res.status(400).json({ error: 'Invalid or expired reset link' });

      const [, account] = entry;
      console.log('[reset-password] email:', account.email, '| expiry:', account.resetTokenExpiry);
      if (account.resetTokenExpiry && new Date(account.resetTokenExpiry) < new Date()) {
        console.log('[reset-password] token expired');
        return res.status(400).json({ error: 'Reset link has expired' });
      }

      const newHash = simpleHash(password as string);
      console.log('[reset-password] calling updateAccountPassword, newHash prefix:', newHash.slice(0, 8));
      await store.updateAccountPassword(account.email, newHash);
      console.log('[reset-password] updateAccountPassword done');

      return res.json({ ok: true });
    } catch (e: any) {
      console.error('[reset-password] error:', e.message, e);
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

  // ── Campaigns ────────────────────────────────────────────────────────────
  app.get('/api/campaigns', async (_req, res) => {
    try { res.json(await store.getAllCampaigns()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/campaigns', async (req, res) => {
    try {
      await store.upsertCampaign(req.body);
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.patch('/api/campaigns/:id', async (req, res) => {
    try {
      const existing = await store.getCampaignById(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Not found' });
      await store.upsertCampaign({ ...existing, ...req.body, id: req.params.id, updatedAt: new Date().toISOString() });
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.delete('/api/campaigns/:id', async (req, res) => {
    try {
      await store.deleteCampaignById(req.params.id);
      res.json({ ok: true });
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

  // ── Image Upload (avatar / cover) ─────────────────────────────────────────
  app.post('/api/upload/image', (req, res) => {
    imageUpload.single('file')(req, res, async (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") return res.status(400).json({ ok: false, error: "File too large (max 5MB)" });
        return res.status(400).json({ ok: false, error: err.message || "Upload failed" });
      }
      if (!req.file) return res.status(400).json({ ok: false, error: "No file uploaded" });
      try {
        const url = await uploadImageBuffer(req.file.buffer);
        res.json({ ok: true, url });
      } catch (e: any) { res.status(500).json({ ok: false, error: e.message || "Upload failed" }); }
    });
  });

  app.delete('/api/upload/image', async (req, res) => {
    const { url } = req.body;
    if (!url || typeof url !== 'string') return res.status(400).json({ ok: false, error: 'Missing url' });
    try { await deleteCloudinaryFile(url, 'image'); } catch {}
    res.json({ ok: true });
  });


  // ── Campaign Image Upload ─────────────────────────────────────────────────
  app.post('/api/upload/campaign-image', (req, res) => {
    imageUpload.single('file')(req, res, async (err) => {
      if (err) return res.status(400).json({ ok: false, error: err.message || 'Upload failed' });
      if (!req.file) return res.status(400).json({ ok: false, error: 'No file uploaded' });
      try {
        const url = await uploadImageBuffer(req.file.buffer);
        res.json({ ok: true, url });
      } catch (e: any) { res.status(500).json({ ok: false, error: e.message || 'Upload failed' }); }
    });
  });

  // ── PDF Upload ────────────────────────────────────────────────────────────
  app.post('/api/materials/upload', (req, res) => {
    pdfUpload.single('file')(req, res, async (err) => {
      if (err) {
        if (err.message === "PDF only") return res.status(400).json({ ok: false, error: "PDF files only" });
        if (err.code === "LIMIT_FILE_SIZE") return res.status(400).json({ ok: false, error: "File too large (max 10MB)" });
        return res.status(400).json({ ok: false, error: "Upload failed" });
      }
      if (!req.file) return res.status(400).json({ ok: false, error: "No file uploaded" });
      if (req.file.buffer.slice(0, 4).toString('ascii') !== '%PDF')
        return res.status(400).json({ ok: false, error: "Invalid PDF file" });
      try {
        const url = await uploadPdfBuffer(req.file.buffer, req.file.originalname);
        res.json({ ok: true, url, originalName: req.file.originalname });
      } catch (e: any) { res.status(500).json({ ok: false, error: e.message || "Upload failed" }); }
    });
  });

  // ── Campaign Video Upload ─────────────────────────────────────────────────
  app.post('/api/upload/campaign-video', (req, res) => {
    videoUpload.single('file')(req, res, async (err) => {
      if (err) return res.status(400).json({ ok: false, error: err.message || 'Upload failed' });
      if (!req.file) return res.status(400).json({ ok: false, error: 'No file uploaded' });
      try {
        const url = await uploadVideoBuffer(req.file.buffer);
        res.json({ ok: true, url });
      } catch (e: any) { res.status(500).json({ ok: false, error: e.message || 'Upload failed' }); }
    });
  });

  // ── Campaign File (PDF) Upload ────────────────────────────────────────────
  app.post('/api/upload/campaign-file', (req, res) => {
    pdfUpload.single('file')(req, res, async (err) => {
      if (err) return res.status(400).json({ ok: false, error: err.message || 'Upload failed' });
      if (!req.file) return res.status(400).json({ ok: false, error: 'No file uploaded' });
      if (req.file.buffer.slice(0, 4).toString('ascii') !== '%PDF')
        return res.status(400).json({ ok: false, error: 'Invalid PDF file' });
      try {
        const url = await uploadPdfBuffer(req.file.buffer, req.file.originalname);
        res.json({ ok: true, url });
      } catch (e: any) { res.status(500).json({ ok: false, error: e.message || 'Upload failed' }); }
    });
  });

  app.delete('/api/materials', async (req, res) => {
    const { url } = req.body;
    if (!url || typeof url !== 'string') return res.status(400).json({ ok: false, error: 'Missing url' });
    try { await deleteCloudinaryFile(url, 'raw'); } catch {}
    res.json({ ok: true });
  });

  // ── File Proxy (PDF inline viewer) ───────────────────────────────────────
  // Generates a signed Cloudinary URL (valid 1 hour) and redirects the
  // browser to it, so the PDF opens inline without exposing the raw URL.
  app.get('/api/file-proxy', (req, res) => {
    const { url } = req.query;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ ok: false, error: 'Missing url' });
    }

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return res.status(400).json({ ok: false, error: 'Invalid url' });
    }

    if (!parsed.hostname.endsWith('cloudinary.com')) {
      return res.status(403).json({ ok: false, error: 'Forbidden' });
    }

    const signedUrl = generateSignedUrl(url);
    if (!signedUrl) {
      return res.status(400).json({ ok: false, error: 'Could not generate signed URL' });
    }

    https.get(signedUrl, (upstream) => {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="document.pdf"');
      if (upstream.headers['content-length']) {
        res.setHeader('Content-Length', upstream.headers['content-length']);
      }
      upstream.pipe(res);
    }).on('error', () => {
      if (!res.headersSent) res.status(502).json({ ok: false, error: 'Failed to fetch file' });
    });
  });

  // ── WebAuthn ──────────────────────────────────────────────────────────────

  // POST /api/webauthn/register/begin  — requires logged-in user (email in body)
  app.post('/api/webauthn/register/begin', async (req, res) => {
    try {
      const { email } = req.body as { email: string };
      if (!email) return res.status(400).json({ error: 'email required' });
      const emailLower = email.toLowerCase();
      const account = await store.getAccount(emailLower);
      if (!account) return res.status(404).json({ error: 'Account not found' });

      const existingCreds = await store.getWebAuthnCredentials(emailLower);
      const excludeCredentials = existingCreds.map(c => ({
        id: c.credentialId,
        transports: c.transports as AuthenticatorTransportFuture[],
      }));

      const options = await generateRegistrationOptions({
        rpName: RP_NAME,
        rpID: RP_ID,
        userName: emailLower,
        userDisplayName: emailLower,
        attestationType: 'none',
        excludeCredentials,
        authenticatorSelection: {
          residentKey: 'preferred',
          userVerification: 'preferred',
        },
      });

      await store.setWebAuthnChallenge(`reg:${emailLower}`, options.challenge);
      res.json(options);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // POST /api/webauthn/register/complete
  app.post('/api/webauthn/register/complete', async (req, res) => {
    try {
      const { email, credential } = req.body as { email: string; credential: any };
      if (!email || !credential) return res.status(400).json({ error: 'email and credential required' });
      const emailLower = email.toLowerCase();

      const expectedChallenge = await store.getAndDeleteWebAuthnChallenge(`reg:${emailLower}`);
      if (!expectedChallenge) return res.status(400).json({ error: 'Challenge expired or not found' });

      const verification = await verifyRegistrationResponse({
        response: credential,
        expectedChallenge,
        expectedOrigin: ORIGIN,
        expectedRPID: RP_ID,
      });

      if (!verification.verified || !verification.registrationInfo) {
        return res.status(400).json({ error: 'Verification failed' });
      }

      const { credential: credInfo } = verification.registrationInfo;
      await store.saveWebAuthnCredential({
        id: crypto.randomUUID(),
        email: emailLower,
        credentialId: credInfo.id,
        publicKey: Buffer.from(credInfo.publicKey).toString('base64'),
        counter: credInfo.counter,
        transports: (credential.response?.transports ?? []) as string[],
        createdAt: Date.now(),
      });

      // Mark biometricEnabled on account
      const account = await store.getAccount(emailLower);
      if (account) await store.upsertAccount({ ...account, biometricEnabled: true });

      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // POST /api/webauthn/login/begin  — takes email, returns challenge
  app.post('/api/webauthn/login/begin', async (req, res) => {
    try {
      const { email } = req.body as { email: string };
      if (!email) return res.status(400).json({ error: 'email required' });
      const emailLower = email.toLowerCase();

      const creds = await store.getWebAuthnCredentials(emailLower);
      if (creds.length === 0) return res.status(404).json({ error: 'no_credentials' });

      const options = await generateAuthenticationOptions({
        rpID: RP_ID,
        allowCredentials: creds.map(c => ({
          id: c.credentialId,
          transports: c.transports as AuthenticatorTransportFuture[],
        })),
        userVerification: 'preferred',
      });

      await store.setWebAuthnChallenge(`auth:${emailLower}`, options.challenge);
      res.json(options);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // POST /api/webauthn/login/complete
  app.post('/api/webauthn/login/complete', async (req, res) => {
    try {
      const { email, credential } = req.body as { email: string; credential: any };
      if (!email || !credential) return res.status(400).json({ error: 'email and credential required' });
      const emailLower = email.toLowerCase();

      const expectedChallenge = await store.getAndDeleteWebAuthnChallenge(`auth:${emailLower}`);
      if (!expectedChallenge) return res.status(400).json({ error: 'Challenge expired or not found' });

      const storedCred = await store.getWebAuthnCredentialById(credential.id);
      if (!storedCred || storedCred.email !== emailLower) {
        return res.status(400).json({ error: 'Credential not found' });
      }

      const publicKeyBytes = Buffer.from(storedCred.publicKey, 'base64');

      const verification = await verifyAuthenticationResponse({
        response: credential,
        expectedChallenge,
        expectedOrigin: ORIGIN,
        expectedRPID: RP_ID,
        credential: {
          id: storedCred.credentialId,
          publicKey: publicKeyBytes,
          counter: storedCred.counter,
          transports: storedCred.transports as AuthenticatorTransportFuture[],
        },
      });

      if (!verification.verified) return res.status(401).json({ error: 'Verification failed' });

      await store.updateWebAuthnCounter(storedCred.credentialId, verification.authenticationInfo.newCounter);

      const account = await store.getAccount(emailLower);
      if (!account) return res.status(404).json({ error: 'Account not found' });
      if (account.banned) return res.status(403).json({ error: 'Account banned' });

      res.json({ ok: true, type: 'account', account });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  return httpServer;
}
