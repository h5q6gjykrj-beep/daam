import { createApp } from '../server/app';
import type { Request, Response } from 'express';

let appPromise: ReturnType<typeof createApp> | null = null;

export default async function handler(req: Request, res: Response) {
  if (!appPromise) appPromise = createApp();
  const { app } = await appPromise;
  app(req, res);
}
