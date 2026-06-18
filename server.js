// Consensus AI Detector Dashboard - Production Server
// Self-bootstrapping: automatically initializes database on first launch.
// No terminal access needed — just upload, extract, set env vars, and Start App.
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// ── Port & env setup ──────────────────────────────────────────────────────────
if (!process.env.PORT) process.env.PORT = '3000';
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

console.log('=== Consensus AI Detector Dashboard ===');
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL:', process.env.DATABASE_URL || '(not set)');

// ── Sanity check: standalone build must exist ─────────────────────────────────
const standaloneServer = path.join(__dirname, '.next', 'standalone', 'server.js');
if (!fs.existsSync(standaloneServer)) {
  console.error('ERROR: .next/standalone/server.js not found. Deploy the standalone build.');
  process.exit(1);
}

// ── Auto-bootstrap database on first run ────────────────────────────────────
// Resolve the SQLite file path from DATABASE_URL (e.g. "file:./prisma/prod.db")
const rawDbUrl = process.env.DATABASE_URL || 'file:./prisma/prod.db';
const dbRelPath = rawDbUrl.replace(/^file:/, '');
const dbAbsPath = path.resolve(__dirname, dbRelPath);

if (!fs.existsSync(dbAbsPath)) {
  console.log('\n[Bootstrap] Database not found at:', dbAbsPath);
  console.log('[Bootstrap] Running first-time database setup (prisma db push + seed)...');

  // Ensure the prisma directory exists
  const prismaDir = path.dirname(dbAbsPath);
  if (!fs.existsSync(prismaDir)) fs.mkdirSync(prismaDir, { recursive: true });

  const opts = { stdio: 'inherit', cwd: __dirname, env: process.env };

  // Determine npx path (cPanel may need full path)
  const npxBin = (() => {
    try { return execSync('which npx', { encoding: 'utf8' }).trim(); } catch (_) { return 'npx'; }
  })();

  try {
    console.log('[Bootstrap] Step 1/2: Creating database schema...');
    execSync(`${npxBin} prisma db push --skip-generate --accept-data-loss`, opts);

    console.log('[Bootstrap] Step 2/2: Seeding demo accounts...');
    execSync(`${npxBin} prisma db seed`, opts);

    console.log('[Bootstrap] ✅ Database initialized successfully!\n');
  } catch (err) {
    console.error('[Bootstrap] ❌ Database initialization failed:', err.message);
    console.error('[Bootstrap] App will still start — you may need to seed manually.');
  }
} else {
  console.log('[Bootstrap] Database found at:', dbAbsPath, '— skipping init.');
}

// ── Start the Next.js standalone server ──────────────────────────────────────
console.log('\n[Server] Starting Next.js...');
require(standaloneServer);
