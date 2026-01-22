/**
 * Automatic Database Backup Scheduler
 * Schedules regular database backups
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const execAsync = promisify(exec);

const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '../backups');
const RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS || '7');
const BACKUP_INTERVAL_HOURS = parseInt(process.env.BACKUP_INTERVAL_HOURS || '24');

async function isPgDumpAvailable() {
  try {
    const cmd = process.platform === 'win32' ? 'where pg_dump' : 'command -v pg_dump';
    await execAsync(cmd);
    return true;
  } catch {
    return false;
  }
}

/**
 * Create backup directory if it doesn't exist
 */
function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`✅ Backup directory created: ${BACKUP_DIR}`);
  }
}

/**
 * Parse DATABASE_URL
 */
function parseDatabaseUrl(databaseUrl) {
  const url = new URL(databaseUrl);
  return {
    host: url.hostname,
    port: url.port || 5432,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
  };
}

/**
 * Create database backup
 */
async function createBackup(databaseUrl) {
  try {
    ensureBackupDir();

    const dbConfig = parseDatabaseUrl(databaseUrl);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(BACKUP_DIR, `yolnext_backup_${timestamp}.sql`);
    const backupFileGz = `${backupFile}.gz`;

    console.log(`🔄 Creating backup: ${backupFileGz}`);

    // Set PGPASSWORD environment variable
    process.env.PGPASSWORD = dbConfig.password;

    // Create backup using pg_dump
    const command = `pg_dump -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} -F c -f "${backupFileGz}"`;

    await execAsync(command);

    // Get file size
    const stats = fs.statSync(backupFileGz);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log(`✅ Backup created: ${backupFileGz} (${fileSizeMB} MB)`);

    // Clean old backups
    cleanOldBackups();

    return backupFileGz;
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    throw error;
  }
}

/**
 * Clean old backups
 */
function cleanOldBackups() {
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    const now = Date.now();
    const retentionMs = RETENTION_DAYS * 24 * 60 * 60 * 1000;
    let deletedCount = 0;

    for (const file of files) {
      if (file.startsWith('yolnext_backup_') && file.endsWith('.sql.gz')) {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(filePath);
        const fileAge = now - stats.mtimeMs;

        if (fileAge > retentionMs) {
          fs.unlinkSync(filePath);
          deletedCount++;
          console.log(`🗑️ Deleted old backup: ${file}`);
        }
      }
    }

    if (deletedCount > 0) {
      console.log(`✅ Cleaned ${deletedCount} old backup(s)`);
    }
  } catch (error) {
    console.error('❌ Error cleaning old backups:', error.message);
  }
}

/**
 * Schedule automatic backups
 */
function scheduleBackups(databaseUrl) {
  ensureBackupDir();

  const disableBackups = String(process.env.DISABLE_BACKUPS || '').toLowerCase() === 'true';
  if (disableBackups) {
    console.log('ℹ️ Backups disabled (DISABLE_BACKUPS=true)');
    return null;
  }

  // If pg_dump is not installed locally, skip scheduler instead of spamming errors.
  isPgDumpAvailable().then(ok => {
    if (!ok) {
      console.warn('⚠️ pg_dump not found; skipping automatic backups. Install PostgreSQL tools or set DISABLE_BACKUPS=true');
      return;
    }

    // Do initial backup
    createBackup(databaseUrl).catch(err => {
      console.error('❌ Initial backup failed:', err.message);
    });

    // Schedule recurring backups
    const intervalMs = BACKUP_INTERVAL_HOURS * 60 * 60 * 1000;
    const intervalId = setInterval(() => {
      createBackup(databaseUrl).catch(err => {
        console.error('❌ Scheduled backup failed:', err.message);
      });
    }, intervalMs);

    console.log(`✅ Backup scheduler active (every ${BACKUP_INTERVAL_HOURS} hours)`);
    return intervalId;
  });

  return null;
}

module.exports = {
  createBackup,
  cleanOldBackups,
  scheduleBackups,
  ensureBackupDir,
};









