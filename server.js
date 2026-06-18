// Consensus AI Detector Dashboard - Production Server
// Requires: npm run build to have been run (generates .next/standalone/server.js)
const path = require('path');
const fs = require('fs');

const standaloneServer = path.join(__dirname, '.next', 'standalone', 'server.js');

if (!fs.existsSync(standaloneServer)) {
  console.error('ERROR: .next/standalone/server.js not found!');
  console.error('The app has not been built yet. Please run: npm run build');
  console.error('Expected path:', standaloneServer);
  process.exit(1);
}

// Let cPanel assign the PORT via environment variable
// Do NOT override if already set by cPanel
if (!process.env.PORT) {
  process.env.PORT = '3000';
}

// Ensure production mode
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

console.log('Starting Consensus AI Detector Dashboard...');
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL:', process.env.DATABASE_URL || '(not set)');

require(standaloneServer);
