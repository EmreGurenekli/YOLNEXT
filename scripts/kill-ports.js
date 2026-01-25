// Kill processes on specified ports (Windows compatible)
import { exec } from 'child_process';
import { promisify } from 'util';
const execPromise = promisify(exec);

async function killPort(port) {
  try {
    // Windows: Find process using port and kill it
    const { stdout } = await execPromise(`netstat -ano | findstr :${port}`);
    const lines = stdout.trim().split('\n');
    const pids = new Set();
    
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length > 0) {
        const pid = parts[parts.length - 1];
        if (pid && /^\d+$/.test(pid)) {
          pids.add(pid);
        }
      }
    }
    
    for (const pid of pids) {
      try {
        await execPromise(`taskkill /PID ${pid} /F`);
        console.log(`Killed process ${pid} on port ${port}`);
      } catch (err) {
        // Process might already be dead
      }
    }
    
    if (pids.size === 0) {
      console.log(`No process found on port ${port}`);
    }
  } catch (err) {
    // Port might not be in use
    console.log(`Port ${port} is not in use`);
  }
}

async function main() {
  const ports = process.argv.slice(2);
  if (ports.length === 0) {
    console.log('Usage: node kill-ports.js <port1> <port2> ...');
    process.exit(0);
  }
  
  for (const port of ports) {
    await killPort(port);
  }
}

main().catch(console.error);

