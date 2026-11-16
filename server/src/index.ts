import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import apiRouter from './routes/api.js';
import { seedDatabase } from './seed.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', apiRouter);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'HEALTHY', timestamp: new Date() });
});

// Serve frontend static files if built
const possibleClientPaths = [
  path.resolve(process.cwd(), '../client/dist'),
  path.resolve(process.cwd(), 'client/dist'),
  path.resolve(__dirname, '../../client/dist'),
];

let clientDistPath = '';
for (const p of possibleClientPaths) {
  if (fs.existsSync(p)) {
    clientDistPath = p;
    break;
  }
}

// Root fallback endpoint for server
app.get('/', (_req, res) => {
  if (clientDistPath) {
    return res.sendFile(path.join(clientDistPath, 'index.html'));
  }
  res.json({
    status: 'ONLINE',
    service: 'SMARTGRID Server',
    api: '/api',
    health: '/health',
    timestamp: new Date()
  });
});

if (clientDistPath) {
  app.use(express.static(clientDistPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

async function startServer() {
  try {
    await seedDatabase();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`⚡ SMARTGRID API Server running on http://localhost:${PORT}`);
      console.log(`📊 Endpoints mounted at http://localhost:${PORT}/api`);
      if (clientDistPath) {
        console.log(`🚀 Production frontend served at http://localhost:${PORT}`);
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
