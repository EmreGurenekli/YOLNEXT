const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Simple logger for migrations
const logger = {
  info: (message, data) => console.log(`[INFO] ${message}`, data || ''),
  error: (message, data) => console.error(`[ERROR] ${message}`, data || ''),
  warn: (message, data) => console.warn(`[WARN] ${message}`, data || ''),
  debug: (message, data) => console.log(`[DEBUG] ${message}`, data || '')
};

class MigrationRunner {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://username:password@localhost:5432/yolnext',
    });
    this.migrationsPath = path.join(__dirname, 'migrations');
  }

  async init() {
    try {
      // Create migrations table if it doesn't exist
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS migrations (
          id SERIAL PRIMARY KEY,
          version VARCHAR(50) UNIQUE NOT NULL,
          filename VARCHAR(255) NOT NULL,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      logger.info('Migration system initialized');
    } catch (error) {
      logger.error('Failed to initialize migration system', { error: error.message });
      throw error;
    }
  }

  async getExecutedMigrations() {
    try {
      const result = await this.pool.query('SELECT version FROM migrations ORDER BY version');
      return result.rows.map(row => row.version);
    } catch (error) {
      logger.error('Failed to get executed migrations', { error: error.message });
      throw error;
    }
  }

  async getMigrationFiles() {
    try {
      const files = fs.readdirSync(this.migrationsPath)
        .filter(file => file.endsWith('.sql'))
        .sort();
      
      return files.map(file => ({
        filename: file,
        version: file.split('_')[0],
        path: path.join(this.migrationsPath, file)
      }));
    } catch (error) {
      logger.error('Failed to get migration files', { error: error.message });
      throw error;
    }
  }

  async executeMigration(migration) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Read migration file
      const sql = fs.readFileSync(migration.path, 'utf8');
      
      // Execute migration
      await client.query(sql);
      
      // Record migration
      await client.query(
        'INSERT INTO migrations (version, filename) VALUES ($1, $2)',
        [migration.version, migration.filename]
      );
      
      await client.query('COMMIT');
      
      logger.info(`Migration executed successfully: ${migration.filename}`);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`Migration failed: ${migration.filename}`, { error: error.message });
      throw error;
    } finally {
      client.release();
    }
  }

  async runMigrations() {
    try {
      await this.init();
      
      const executedMigrations = await this.getExecutedMigrations();
      const migrationFiles = await this.getMigrationFiles();
      
      const pendingMigrations = migrationFiles.filter(
        migration => !executedMigrations.includes(migration.version)
      );
      
      if (pendingMigrations.length === 0) {
        logger.info('No pending migrations');
        return;
      }
      
      logger.info(`Found ${pendingMigrations.length} pending migrations`);
      
      for (const migration of pendingMigrations) {
        await this.executeMigration(migration);
      }
      
      logger.info('All migrations completed successfully');
    } catch (error) {
      logger.error('Migration process failed', { error: error.message });
      throw error;
    }
  }

  async rollbackMigration(version) {
    try {
      const client = await this.pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Remove migration record
        await client.query('DELETE FROM migrations WHERE version = $1', [version]);
        
        await client.query('COMMIT');
        
        logger.info(`Migration rolled back: ${version}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error(`Rollback failed for version: ${version}`, { error: error.message });
      throw error;
    }
  }

  async getStatus() {
    try {
      const executedMigrations = await this.getExecutedMigrations();
      const migrationFiles = await this.getMigrationFiles();
      
      const status = migrationFiles.map(migration => ({
        version: migration.version,
        filename: migration.filename,
        executed: executedMigrations.includes(migration.version),
        executedAt: null // Would need to query for this
      }));
      
      return status;
    } catch (error) {
      logger.error('Failed to get migration status', { error: error.message });
      throw error;
    }
  }

  async close() {
    await this.pool.end();
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];
  const migrationRunner = new MigrationRunner();
  
  (async () => {
    try {
      switch (command) {
        case 'migrate':
          await migrationRunner.runMigrations();
          break;
        case 'status':
          const status = await migrationRunner.getStatus();
          console.table(status);
          break;
        case 'rollback':
          const version = process.argv[3];
          if (!version) {
            console.error('Please provide version to rollback');
            process.exit(1);
          }
          await migrationRunner.rollbackMigration(version);
          break;
        default:
          console.log('Usage: node migration-runner.js [migrate|status|rollback]');
          process.exit(1);
      }
    } catch (error) {
      console.error('Migration error:', error.message);
      process.exit(1);
    } finally {
      await migrationRunner.close();
    }
  })();
}

module.exports = MigrationRunner;
