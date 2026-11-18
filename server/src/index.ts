import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import apiRouter from './routes/api.js';
import authRouter from './routes/auth.js';
import { seedDatabase } from './seed.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', apiRouter);
app.use('/api/auth', authRouter);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'HEALTHY', timestamp: new Date() });
});

// ----------------------------------------------------------------
// Static frontend — search for the built client in priority order.
// On Vercel: server/public is copied from client/dist during build.
// Locally:   client/dist is built separately and found by relative path.
// ----------------------------------------------------------------
const possibleClientPaths = [
  // Vercel / production: client build copied here by scripts/copy-client.js
  path.resolve(__dirname, '../public'),
  path.resolve(process.cwd(), 'server/public'),
  // Local dev fall-backs
  path.resolve(process.cwd(), '../client/dist'),
  path.resolve(process.cwd(), 'client/dist'),
  path.resolve(__dirname, '../../client/dist'),
];

let clientDistPath = '';
for (const p of possibleClientPaths) {
  if (fs.existsSync(p)) {
    clientDistPath = p;
    console.log(`Frontend static files found at: ${p}`);
    break;
  }
}

if (clientDistPath) {
  // Serve static assets (JS, CSS, images, etc.)
  app.use(express.static(clientDistPath));

  // SPA fallback — serve index.html for any non-API route
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api') || req.path === '/health') {
      // Should not reach here due to route ordering, but guard just in case
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  // No frontend build found — return server info at root
  app.get('/', (_req, res) => {
    res.json({
      status: 'ONLINE',
      service: 'SMARTGRID Server',
      api: '/api',
      health: '/health',
      note: 'Frontend not built. Run: npm run build:client && npm run copy:client',
      timestamp: new Date()
    });
  });
}

async function startServer() {
  try {
    await seedDatabase();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 SMARTGRID API Server running on http://localhost:${PORT}`);
      console.log(`📡 Endpoints mounted at http://localhost:${PORT}/api`);
      if (clientDistPath) {
        console.log(`🌐 Production frontend served at http://localhost:${PORT}`);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// In local development or standalone server, start the HTTP server
if (!process.env.VERCEL) {
  startServer();
}

export default app;
