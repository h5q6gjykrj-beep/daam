import { createApp } from '../server/app';
import type { Request, Response } from 'express';

let handlerPromise: ReturnType<typeof createApp> | null = null;

function getApp() {
  if (!handlerPromise) {
    handlerPromise = createApp();
  }
  return handlerPromise;
}

export default async function handler(req: Request, res: Response) {
  const { app } = await getApp();
  app(req, res);
}
