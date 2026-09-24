import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { connectToDatabase } from './src/server/db';
import { apiRouter, autoSeedIfEmpty } from './src/server/api';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middlewares
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Connect to MongoDB asynchronously
  connectToDatabase().then((connected) => {
    if (connected) {
      autoSeedIfEmpty();
    }
  });

  // Mount API routes FIRST
  app.use('/api', apiRouter);

  // Vite middleware for development vs Static SPA in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[PAA Sentinel Server] Running on http://localhost:${PORT}`);
    console.log(`[PAA Sentinel Server] Bound to 0.0.0.0:${PORT}`);
  });
}

startServer();
