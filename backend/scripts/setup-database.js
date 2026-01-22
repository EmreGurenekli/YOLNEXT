const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database setup script
async function setupDatabase() {
  console.log('🗄️ Setting up PostgreSQL database...');
  
  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.log('⚠️ DATABASE_URL not set. Using default connection...');
    process.env.DATABASE_URL = 'postgresql://yolnext:password@localhost:5432/yolnext_dev';
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');

    // Create database if it doesn't exist
    const dbName = process.env.DATABASE_NAME || 'yolnext_dev';
    await pool.query(`CREATE DATABASE ${dbName} ON CONFLICT DO NOTHING`);
    console.log(`✅ Database ${dbName} ready`);

    // Run migrations
    const migrationRunner = require('../migrations/migration-runner');
    await migrationRunner.runMigrations();
    console.log('✅ Migrations completed');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.log('\n📋 Setup instructions:');
    console.log('1. Install PostgreSQL: https://www.postgresql.org/download/');
    console.log('2. Create database: createdb yolnext_dev');
    console.log('3. Set DATABASE_URL: export DATABASE_URL="postgresql://username:password@localhost:5432/yolnext_dev"');
    console.log('4. Run: npm run db:setup');
  } finally {
    await pool.end();
  }
}

// Run setup
if (require.main === module) {
  setupDatabase().catch(console.error);
}

module.exports = setupDatabase;


