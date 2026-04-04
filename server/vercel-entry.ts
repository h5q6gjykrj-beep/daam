import express from 'express';
import { createServer } from 'http';
import { registerRoutes } from './routes';

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false }));

const httpServer = createServer(app);
await registerRoutes(httpServer, app);

export default app;
