// Test setup file
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.CORS_ORIGIN = 'http://localhost:3000';
process.env.RATE_LIMIT_WINDOW_MS = '60000';
process.env.RATE_LIMIT_MAX_REQUESTS = '1000';

// Global test timeout
jest.setTimeout(10000);

// Test DB cleanup: remove sqlite file to start fresh each run
beforeAll(() => {
  try {
    const dbFile = path.join(__dirname, '..', 'backend', 'database.sqlite');
    if (fs.existsSync(dbFile)) {
      fs.rmSync(dbFile, { force: true });
    }
    // Create empty DB file to avoid open handles while sqlite3 creates on first connect
    fs.writeFileSync(dbFile, '');
  } catch {}
});

// Not: Windows'ta Jest'i kapatabilecek agresif process kill yapılmıyor.

// Clean database before each test
beforeEach(async () => {
  try {
    const fs = require('fs');
    const path = require('path');
    const dbFile = path.join(__dirname, '..', 'backend', 'database.sqlite');
    if (fs.existsSync(dbFile)) {
      fs.rmSync(dbFile, { force: true });
    }
    // Create empty DB file
    fs.writeFileSync(dbFile, '');
  } catch (error) {
    // Ignore errors
  }
});
