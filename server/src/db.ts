import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import os from 'os';

function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  // Find the bundled dev.db SQLite database
  const possiblePaths = [
    path.resolve(process.cwd(), 'prisma/dev.db'),
    path.resolve(process.cwd(), 'server/prisma/dev.db'),
    path.resolve(__dirname, '../prisma/dev.db'),
    path.resolve(__dirname, '../../prisma/dev.db'),
  ];

  let sourceDbPath = '';
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      sourceDbPath = p;
      break;
    }
  }

  // In serverless environments (like Vercel), /var/task is read-only.
  // We copy the database to the writable /tmp directory so writes/WAL work cleanly.
  if (process.env.VERCEL) {
    const tmpDbPath = path.join(os.tmpdir(), 'smartgrid_dev.db');
    if (sourceDbPath && (!fs.existsSync(tmpDbPath) || fs.statSync(tmpDbPath).size === 0)) {
      try {
        fs.copyFileSync(sourceDbPath, tmpDbPath);
        console.log(`📦 Seeded database initialized to writable /tmp: ${tmpDbPath}`);
      } catch (err: any) {
        console.error('Failed to copy database to /tmp:', err.message);
      }
    }
    const normalizedTmpPath = tmpDbPath.replace(/\\/g, '/');
    return `file:${normalizedTmpPath}`;
  }

  if (sourceDbPath) {
    const normalizedPath = sourceDbPath.replace(/\\/g, '/');
    return `file:${normalizedPath}`;
  }

  return 'file:./dev.db';
}

const dbUrl = getDatabaseUrl();
process.env.DATABASE_URL = dbUrl;

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl,
    },
  },
});

