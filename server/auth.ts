import { Router, type Request, type Response } from 'express';
import crypto from 'crypto';
import { db } from './db';
import { authAccounts, authUsers, profiles as profilesTable } from '@shared/schema';
import { eq } from 'drizzle-orm';

declare module 'express-session' {
  interface SessionData {
    userEmail?: string;
  }
}

const router = Router();

export const MODERATOR_EMAIL = 'w.qq89@hotmail.com';
export const ADMIN_EMAILS = [MODERATOR_EMAIL];
export const DEFAULT_ALLOWED_DOMAINS = ['utas.edu.om'];

export function hashPassword(password: string): string {
  const secret = process.env.SESSION_SECRET || 'daam-dev-secret';
  return crypto.createHmac('sha256', secret).update(password).digest('hex');
}

function safeAccount(account: typeof authAccounts.$inferSelect) {
  const { passwordHash: _pw, ...safe } = account;
  return safe;
}

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, phone, governorate, wilayat } = req.body;
    if (!email || !password || !phone || !governorate || !wilayat) {
      return res.status(400).json({ ok: false, error: 'Missing required fields' });
    }
    const emailLower = (email as string).toLowerCase();
    const emailDomain = emailLower.split('@')[1];
    const isModerator = emailLower === MODERATOR_EMAIL.toLowerCase();
    if (!isModerator && (!emailDomain || !DEFAULT_ALLOWED_DOMAINS.includes(emailDomain))) {
      return res.status(400).json({ ok: false, error: 'Please use an approved university email' });
    }
    const existing = await db.select({ id: authAccounts.id }).from(authAccounts).where(eq(authAccounts.email, emailLower)).limit(1);
    if (existing.length > 0) {
      return res.status(400).json({ ok: false, error: 'Email already registered' });
    }
    const [account] = await db.insert(authAccounts).values({
      email: emailLower,
      passwordHash: hashPassword(password as string),
      phone: phone as string,
      governorate: governorate as string,
      wilayat: wilayat as string,
      role: isModerator ? 'moderator' : 'student',
      verified: true,
    }).returning();
    req.session.userEmail = emailLower;
    res.json({ ok: true, account: safeAccount(account) });
  } catch (err: any) {
    console.error('Register error:', err);
    res.status(500).json({ ok: false, error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ ok: false, error: 'Email and password required' });
    }
    const emailLower = (email as string).toLowerCase();

    // Check auth_accounts first
    const rows = await db.select().from(authAccounts).where(eq(authAccounts.email, emailLower)).limit(1);

    if (rows.length > 0) {
      const account = rows[0];
      if (account.banned) {
        return res.status(403).json({ ok: false, error: 'Your account is banned' + (account.bannedReason ? ': ' + account.bannedReason : '') });
      }
      if (account.passwordHash !== hashPassword(password as string)) {
        return res.status(401).json({ ok: false, error: 'Incorrect password' });
      }
      req.session.userEmail = emailLower;
      return res.json({ ok: true, account: safeAccount(account) });
    }

    // Check auth_users (admin-created moderators)
    const authUserRows = await db.select().from(authUsers).where(eq(authUsers.email, emailLower)).limit(1);
    if (authUserRows.length > 0) {
      const authUser = authUserRows[0];
      if (authUser.passwordHash !== password && authUser.passwordHash !== hashPassword(password as string)) {
        return res.status(401).json({ ok: false, error: 'Incorrect password' });
      }
      req.session.userEmail = emailLower;
      return res.json({ ok: true, account: { email: emailLower, role: authUser.role, verified: true, banned: false } });
    }

    return res.status(401).json({ ok: false, error: 'Account not registered' });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ ok: false, error: 'Login failed' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req: Request, res: Response) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ ok: true });
  });
});

// GET /api/auth/me
router.get('/me', async (req: Request, res: Response) => {
  if (!req.session.userEmail) {
    return res.json({ ok: true, account: null });
  }
  try {
    const rows = await db.select().from(authAccounts).where(eq(authAccounts.email, req.session.userEmail)).limit(1);
    if (rows.length === 0) {
      // Check auth_users
      const authUserRows = await db.select().from(authUsers).where(eq(authUsers.email, req.session.userEmail)).limit(1);
      if (authUserRows.length === 0) {
        req.session.destroy(() => {});
        return res.json({ ok: true, account: null });
      }
      return res.json({ ok: true, account: { email: authUserRows[0].email, role: authUserRows[0].role, verified: true, banned: false } });
    }
    res.json({ ok: true, account: safeAccount(rows[0]) });
  } catch (err: any) {
    console.error('Me error:', err);
    res.status(500).json({ ok: false, error: 'Failed to get user' });
  }
});

// POST /api/auth/change-password
router.post('/change-password', async (req: Request, res: Response) => {
  if (!req.session.userEmail) return res.status(401).json({ ok: false, error: 'Not authenticated' });
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ ok: false, error: 'Missing fields' });
    if ((newPassword as string).length < 8) return res.status(400).json({ ok: false, error: 'Password must be at least 8 characters' });
    const rows = await db.select().from(authAccounts).where(eq(authAccounts.email, req.session.userEmail)).limit(1);
    if (rows.length === 0) return res.status(404).json({ ok: false, error: 'Account not found' });
    if (rows[0].passwordHash !== hashPassword(currentPassword as string)) return res.status(401).json({ ok: false, error: 'Current password is incorrect' });
    await db.update(authAccounts).set({ passwordHash: hashPassword(newPassword as string) }).where(eq(authAccounts.email, req.session.userEmail));
    res.json({ ok: true });
  } catch (err: any) {
    console.error('Change password error:', err);
    res.status(500).json({ ok: false, error: 'Failed to change password' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) return res.status(400).json({ ok: false, error: 'Missing fields' });
    const emailLower = (email as string).toLowerCase();
    if (!ADMIN_EMAILS.includes(emailLower)) return res.status(403).json({ ok: false, error: 'Password reset only available for moderator accounts' });
    if ((newPassword as string).length < 6) return res.status(400).json({ ok: false, error: 'Password must be at least 6 characters' });
    const rows = await db.select({ id: authAccounts.id }).from(authAccounts).where(eq(authAccounts.email, emailLower)).limit(1);
    if (rows.length === 0) return res.status(404).json({ ok: false, error: 'Account not registered' });
    await db.update(authAccounts).set({ passwordHash: hashPassword(newPassword as string) }).where(eq(authAccounts.email, emailLower));
    res.json({ ok: true });
  } catch (err: any) {
    console.error('Reset password error:', err);
    res.status(500).json({ ok: false, error: 'Failed to reset password' });
  }
});

const DEMO_USERS = [
  { email: 'ahmed@utas.edu.om', password: 'Demo123!', phone: '99999999', governorate: 'muscat', wilayat: 'Muscat', role: 'student' as const },
  { email: 'fatima@utas.edu.om', password: 'Demo123!', phone: '99999999', governorate: 'muscat', wilayat: 'Muscat', role: 'student' as const },
  { email: 'mohammed@utas.edu.om', password: 'Demo123!', phone: '99999999', governorate: 'muscat', wilayat: 'Muscat', role: 'student' as const },
  { email: 'sara@utas.edu.om', password: 'Demo123!', phone: '99999999', governorate: 'muscat', wilayat: 'Muscat', role: 'student' as const },
  { email: 'omar@utas.edu.om', password: 'Demo123!', phone: '99999999', governorate: 'muscat', wilayat: 'Muscat', role: 'student' as const },
  { email: MODERATOR_EMAIL, password: 'Demo123!', phone: '', governorate: 'muscat', wilayat: 'Muscat', role: 'moderator' as const },
];

export async function seedDemoUsers() {
  for (const u of DEMO_USERS) {
    try {
      await db.insert(authAccounts).values({
        email: u.email, passwordHash: hashPassword(u.password),
        phone: u.phone, governorate: u.governorate, wilayat: u.wilayat,
        role: u.role, verified: true, isDemo: true,
      }).onConflictDoNothing();
    } catch (_err) {}
  }
}

export default router;
