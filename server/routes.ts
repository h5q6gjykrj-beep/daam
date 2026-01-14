import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // We don't need backend routes for this specific request as it's client-side only (localStorage).
  // But we keep the structure intact.
  
  const apiRouter = app._router ? app : app; // Compatibility

  // Basic health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  return httpServer;
}
