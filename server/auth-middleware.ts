import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

const SECRET = process.env.SESSION_SECRET || 'daam_secret_key_2026';

export interface AuthPayload { email: string; role: string; }

export function signToken(email: string, role: string): string {
  return jwt.sign({ email, role }, SECRET, { expiresIn: '30d' });
}

function getPayload(req: Request): AuthPayload | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  try { return jwt.verify(auth.slice(7), SECRET) as AuthPayload; }
  catch { return null; }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const payload = getPayload(req);
  if (!payload) { res.status(401).json({ error: 'Authentication required' }); return; }
  (req as any).authUser = payload;
  next();
}

export function adminMiddleware(req: Request, res: Response, next: NextFunction): void {
  const payload = getPayload(req);
  if (!payload) { res.status(401).json({ error: 'Authentication required' }); return; }
  if (payload.role !== 'admin' && payload.role !== 'moderator') {
    res.status(403).json({ error: 'Admin access required' }); return;
  }
  (req as any).authUser = payload;
  next();
}
