#!/usr/bin/env node

import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const servers = [
  {
    name: 'Backend API',
    cwd: path.join(__dirname),
    cmd: npmCmd,
    args: ['run', 'dev:backend'],
    port: 5000,
  },
  {
    name: 'Frontend Dev Server',
    cwd: path.join(__dirname),
    cmd: npmCmd,
    args: ['run', 'dev:frontend'],
    port: 5173,
  },
];

console.log('\n╔════════════════════════════════════════════════╗');
console.log('║  🚀 YOLNEXT DEVELOPMENT SERVERS STARTUP       ║');
console.log('╚════════════════════════════════════════════════╝\n');

servers.forEach((server) => {
  console.log(`📍 Starting ${server.name} on port ${server.port}...`);
  
  const proc = spawn(server.cmd, server.args, {
    cwd: server.cwd,
    stdio: 'inherit',
    shell: true,
  });

  proc.on('error', (err) => {
    console.error(`❌ Error starting ${server.name}:`, err.message);
  });

  proc.on('exit', (code) => {
    console.log(`⚠️  ${server.name} exited with code ${code}`);
  });
});

console.log('\n✅ All servers started! Press Ctrl+C to stop all processes.\n');
console.log('Available URLs:');
console.log('  🌐 Frontend: http://localhost:5173');
console.log('  🔌 Backend:  http://localhost:5000');
console.log('  📚 API Docs: http://localhost:5000/api-docs\n');

process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down all servers...');
  process.exit(0);
});
