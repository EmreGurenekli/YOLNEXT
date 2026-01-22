#!/usr/bin/env node

import { execSync } from 'child_process';

const ports = process.argv
  .slice(2)
  .map((p) => String(p).trim())
  .filter(Boolean);

if (ports.length === 0) {
  console.log('kill-ports: no ports provided');
  process.exit(0);
}

const isWindows = process.platform === 'win32';

const run = (cmd) => {
  try {
    return execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'] }).toString();
  } catch (e) {
    const out = (e && e.stdout ? e.stdout.toString() : '') + (e && e.stderr ? e.stderr.toString() : '');
    return out;
  }
};

const parseWindowsNetstatPids = (netstatOutput, port) => {
  const pids = new Set();
  const lines = String(netstatOutput).split(/\r?\n/);
  for (const line of lines) {
    // Example:
    // TCP    127.0.0.1:5173   0.0.0.0:0   LISTENING   11252
    if (!line.includes(`:${port}`)) continue;
    const parts = line.trim().split(/\s+/);
    const pid = parts[parts.length - 1];
    if (pid && /^\d+$/.test(pid)) pids.add(pid);
  }
  return [...pids];
};

const killPidWindows = (pid) => {
  run(`taskkill /PID ${pid} /T /F`);
};

const killPortWindows = (port) => {
  const out = run('netstat -ano');
  const pids = parseWindowsNetstatPids(out, port);
  if (pids.length === 0) {
    console.log(`kill-ports: port ${port} is free`);
    return;
  }
  for (const pid of pids) {
    console.log(`kill-ports: killing PID ${pid} on port ${port}`);
    killPidWindows(pid);
  }
};

const killPortUnix = (port) => {
  // Best-effort; ignore if lsof not available
  const out = run(`lsof -ti tcp:${port} || true`);
  const pids = out
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter((x) => /^\d+$/.test(x));

  if (pids.length === 0) {
    console.log(`kill-ports: port ${port} is free`);
    return;
  }

  for (const pid of pids) {
    console.log(`kill-ports: killing PID ${pid} on port ${port}`);
    run(`kill -9 ${pid}`);
  }
};

for (const port of ports) {
  if (isWindows) {
    killPortWindows(port);
  } else {
    killPortUnix(port);
  }
}
