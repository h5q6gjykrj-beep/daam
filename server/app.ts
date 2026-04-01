import express, { type Request, Response, NextFunction } from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { createServer } from 'http';
import path from 'path';
import { pool } from './db';
import authRouter, { seedDemoUsers } from './auth';
import apiRouter from './api-routes';
import { registerRoutes } from './routes';

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

const PgStore = connectPgSimple(session);

export async function createApp() {
  const app = express();
  const httpServer = createServer(app);

  app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));
  app.use(express.json({ verify: (req: any, _res, buf) => { req.rawBody = buf; } }));
  app.use(express.urlencoded({ extended: false }));

  app.use(session({
    store: new PgStore({ pool, createTableIfMissing: true }),
    secret: process.env.SESSION_SECRET || 'daam-dev-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    },
  }));

  app.use((req, res, next) => {
    const start = Date.now();
    const reqPath = req.path;
    let capturedJson: any;
    const origJson = res.json;
    res.json = function(body: any, ...args: any[]) {
      capturedJson = body;
      return origJson.apply(res, [body, ...args]);
    };
    res.on('finish', () => {
      if (reqPath.startsWith('/api')) {
        let line = `${req.method} ${reqPath} ${res.statusCode} in ${Date.now() - start}ms`;
        if (capturedJson) line += ` :: ${JSON.stringify(capturedJson)}`;
        log(line);
      }
    });
    next();
  });

  app.use('/api/auth', authRouter);
  app.use('/api', apiRouter);
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    res.status(status).json({ message: err.message || 'Internal Server Error' });
  });

  seedDemoUsers().catch(err => console.error('Failed to seed demo users:', err));

  return { app, httpServer };
}
