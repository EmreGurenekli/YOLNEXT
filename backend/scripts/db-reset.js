const path = require('path');
const dotenv = require('dotenv');
const { Pool } = require('pg');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../env.development'), override: true });
dotenv.config({ path: path.resolve(__dirname, '../../env.local'), override: true });

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not set.');
    process.exit(1);
  }

  const url = new URL(databaseUrl);
  const dbName = (url.pathname || '').replace(/^\//, '');
  if (!dbName) {
    console.error('❌ Could not parse database name from DATABASE_URL.');
    process.exit(1);
  }

  const adminUrl = new URL(databaseUrl);
  adminUrl.pathname = '/postgres';

  console.log(`🗑️  Resetting database: ${dbName}`);

























  
  const adminPool = new Pool({ connectionString: adminUrl.toString(), ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false });

  try {
    await adminPool.query('SELECT 1');

    // Kick existing connections
    await adminPool.query(
      `SELECT pg_terminate_backend(pid)
       FROM pg_stat_activity
       WHERE datname = $1 AND pid <> pg_backend_pid()`,
      [dbName]
    );

    await adminPool.query(`DROP DATABASE IF EXISTS "${dbName}"`);
    await adminPool.query(`CREATE DATABASE "${dbName}"`);
  } finally {
    await adminPool.end().catch(() => null);
  }

  const appPool = new Pool({ connectionString: databaseUrl, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false });

  try {
    const { createTables, seedData } = require('../database/init');

    const ok = await createTables(appPool);
    if (!ok) {
      console.error('❌ Canonical schema creation/verification failed.');
      process.exitCode = 1;
      return;
    }

    if (typeof seedData === 'function') {
      await seedData(appPool);
    }

    console.log('✅ DB reset complete.');
  } finally {
    await appPool.end().catch(() => null);
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error('❌ DB reset failed:', err);
    process.exit(1);
  });
}

module.exports = main;
