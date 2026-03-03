#!/usr/bin/env node

// Load environment variables from .env file FIRST before anything else
require('dotenv/config');

// Now run the server with tsx
const { spawn } = require('child_process');

const child = spawn('npx', ['tsx', 'server/index.ts'], {
  stdio: 'inherit',
  shell: true,
});

child.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

process.on('SIGINT', () => {
  child.kill();
  process.exit(0);
});
