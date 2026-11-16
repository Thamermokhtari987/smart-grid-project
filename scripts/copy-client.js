#!/usr/bin/env node
/**
 * copy-client.js
 * Copies the Vite client build output (client/dist) into server/public
 * so the Express server can serve the SPA on Vercel.
 */

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const src = path.join(root, 'client', 'dist');
const dest = path.join(root, 'server', 'public');

if (!fs.existsSync(src)) {
  console.error(`[copy-client] ERROR: client/dist not found at ${src}`);
  console.error('[copy-client] Run "npm run build:client" first.');
  process.exit(1);
}

// Remove old server/public and recreate
if (fs.existsSync(dest)) {
  fs.rmSync(dest, { recursive: true, force: true });
}
fs.mkdirSync(dest, { recursive: true });

// Recursive copy
function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const srcPath = path.join(from, entry.name);
    const destPath = path.join(to, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyDir(src, dest);
console.log(`[copy-client] Copied ${src} -> ${dest}`);
