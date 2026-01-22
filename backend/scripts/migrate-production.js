#!/usr/bin/env node
/**
 * Production Database Migration Script
 * Runs all pending migrations in production environment
 */

require('dotenv').config({ path: '.env.production' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = path.join(__dirname, '../migrations');
const SCHEMA_FILE = path.join(__dirname, '../../database/real_schema.sql');

class MigrationRunner {
  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL must be set in production environment');
    }

    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 1, // Use single connection for migrations
    });

    this.migrationsTable = 'schema_migrations';
  }

  async init() {
    console.log('🔧 Initializing migration system...');
    
    // Create migrations tracking table
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS ${this.migrationsTable} (
        id SERIAL PRIMARY KEY,
        version VARCHAR(50) UNIQUE NOT NULL,
        filename VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ Migration system ready');
  }

  async getExecutedMigrations() {
    const result = await this.pool.query(
      `SELECT version FROM ${this.migrationsTable} ORDER BY version`
    );
    return result.rows.map(row => row.version);
  }

  async getPendingMigrations() {
    const executed = await this.getExecutedMigrations();
    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort();

    return files.filter(file => {
      const version = file.replace('.sql', '');
      return !executed.includes(version);
    });
  }

  async runMigration(filename) {
    const filePath = path.join(MIGRATIONS_DIR, filename);
    const sql = fs.readFileSync(filePath, 'utf8');
    const version = filename.replace('.sql', '');

    console.log(`📦 Running migration: ${filename}...`);

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query(
        `INSERT INTO ${this.migrationsTable} (version, filename) VALUES ($1, $2)`,
        [version, filename]
      );
      await client.query('COMMIT');
      console.log(`✅ Migration ${filename} completed`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`❌ Migration ${filename} failed:`, error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  async runInitialSchema() {
    if (!fs.existsSync(SCHEMA_FILE)) {
      console.log('⚠️ Initial schema file not found, skipping...');
      return;
    }

    const executed = await this.getExecutedMigrations();
    if (executed.length > 0) {
      console.log('ℹ️ Migrations already exist, skipping initial schema');
      return;
    }

    console.log('📋 Running initial schema...');
    const sql = fs.readFileSync(SCHEMA_FILE, 'utf8');
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
      console.log('✅ Initial schema created');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Initial schema failed:', error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  async run() {
    try {
      console.log('🚀 Starting production database migration...');
      console.log(`📊 Database: ${process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@')}`);

      await this.init();
      await this.runInitialSchema();

      const pending = await this.getPendingMigrations();
      
      if (pending.length === 0) {
        console.log('✅ No pending migrations');
        return;
      }

      console.log(`📦 Found ${pending.length} pending migration(s)`);

      for (const migration of pending) {
        await this.runMigration(migration);
      }

      console.log('🎉 All migrations completed successfully!');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    } finally {
      await this.pool.end();
    }
  }
}

// Run migrations
if (require.main === module) {
  const runner = new MigrationRunner();
  runner.run().catch(console.error);
}

module.exports = MigrationRunner;

