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
      connectionString:
        process.env.DATABASE_URL ||
        process.env.DB_URL ||
        'postgresql://postgres:2563@localhost:5432/yolnext',
    });
    this.migrationsPath = __dirname;
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

      // Baseline support:
      // This repo may be running against an existing database that already has tables created
      // (from earlier bootstrap scripts). In that case, running 001_initial_schema.sql can fail.
      // If migrations table is empty but users table exists, mark 001-004 as already executed.
      const migCountRes = await this.pool.query('SELECT COUNT(*)::int as count FROM migrations');
      const migCount = (migCountRes.rows && migCountRes.rows[0] && migCountRes.rows[0].count) || 0;

      const hasTable = async (regclass) => {
        try {
          const r = await this.pool.query('SELECT to_regclass($1) as exists', [regclass]);
          return Boolean(r.rows?.[0]?.exists);
        } catch {
          return false;
        }
      };

      // If the DB was bootstrapped outside of migrations (legacy scripts), we may already have core tables.
      // In that case, baseline only the core schema migrations that would otherwise fail.
      // IMPORTANT: do NOT baseline legal compliance migration unless its tables already exist.
      if (Number(migCount) === 0) {
        const hasUsersTable = await hasTable('public.users');
        if (hasUsersTable) {
          const baseline = [
            { version: '001', filename: '001_initial_schema.sql' },
            { version: '002', filename: '002_postgresql_schema.sql' },
            { version: '004', filename: '004_add_district_columns.sql' },
          ];

          // Baseline 003 only if its critical tables already exist.
          const hasConsents = await hasTable('public.user_consents');
          const hasSignatures = await hasTable('public.contract_signatures');
          if (hasConsents && hasSignatures) {
            baseline.push({ version: '003', filename: '003_legal_compliance.sql' });
          }

          for (const b of baseline) {
            await this.pool.query(
              'INSERT INTO migrations (version, filename) VALUES ($1, $2) ON CONFLICT (version) DO NOTHING',
              [b.version, b.filename]
            );
          }
          logger.info('Detected existing schema; baselined migrations (core)');
        }
      }

      // Self-healing: if legal migration was recorded but tables are missing, force it to rerun.
      try {
        const recorded003 = await this.pool.query(
          "SELECT 1 FROM migrations WHERE version = '003' LIMIT 1"
        );
        const has003 = (recorded003.rows || []).length > 0;
        if (has003) {
          const hasConsents = await hasTable('public.user_consents');
          const hasSignatures = await hasTable('public.contract_signatures');
          if (!hasConsents || !hasSignatures) {
            await this.pool.query("DELETE FROM migrations WHERE version = '003'");
            logger.warn('Legal compliance tables missing; unmarked migration 003 to rerun');
          }
        }
      } catch (e) {
        logger.warn('Could not verify legal compliance tables', { error: e?.message });
      }
      
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
