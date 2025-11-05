/**
 * Database Backup Script
 * 
 * Creates automated backups of PostgreSQL database
 * Usage: node backend/scripts/backup-database.js
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const config = {
  dbHost: process.env.DB_HOST || 'localhost',
  dbPort: process.env.DB_PORT || 5432,
  dbName: process.env.DB_NAME || 'yolnext',
  dbUser: process.env.DB_USER || 'postgres',
  backupDir: process.env.BACKUP_DIR || path.join(__dirname, '../backups'),
  retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '7'),
};

// Create backup directory if it doesn't exist
if (!fs.existsSync(config.backupDir)) {
  fs.mkdirSync(config.backupDir, { recursive: true });
}

/**
 * Create database backup
 */
function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const backupFile = path.join(config.backupDir, `yolnext_backup_${timestamp}.sql`);
  const backupFileGz = `${backupFile}.gz`;

  console.log(`🔄 Creating backup: ${backupFile}`);

  // Set PGPASSWORD environment variable
  process.env.PGPASSWORD = process.env.DB_PASSWORD;

  // Create backup using pg_dump
  const command = `pg_dump -h ${config.dbHost} -p ${config.dbPort} -U ${config.dbUser} -d ${config.dbName} -F c -f "${backupFileGz}"`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Backup failed: ${error.message}`);
      return;
    }

    if (stderr) {
      console.warn(`⚠️ Backup warnings: ${stderr}`);
    }

    console.log(`✅ Backup created successfully: ${backupFileGz}`);
    
    // Get file size
    const stats = fs.statSync(backupFileGz);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`📦 Backup size: ${fileSizeMB} MB`);

    // Clean old backups
    cleanOldBackups();
  });
}

/**
 * Clean backups older than retention period
 */
function cleanOldBackups() {
  const files = fs.readdirSync(config.backupDir);
  const now = Date.now();
  const retentionMs = config.retentionDays * 24 * 60 * 60 * 1000;

  let deletedCount = 0;

  files.forEach(file => {
    if (file.startsWith('yolnext_backup_') && file.endsWith('.sql.gz')) {
      const filePath = path.join(config.backupDir, file);
      const stats = fs.statSync(filePath);
      const fileAge = now - stats.mtimeMs;

      if (fileAge > retentionMs) {
        fs.unlinkSync(filePath);
        deletedCount++;
        console.log(`🗑️ Deleted old backup: ${file}`);
      }
    }
  });

  if (deletedCount > 0) {
    console.log(`✅ Cleaned ${deletedCount} old backup(s)`);
  }
}

/**
 * Restore database from backup
 */
function restoreBackup(backupFile) {
  if (!fs.existsSync(backupFile)) {
    console.error(`❌ Backup file not found: ${backupFile}`);
    return;
  }

  console.log(`🔄 Restoring from backup: ${backupFile}`);

  process.env.PGPASSWORD = process.env.DB_PASSWORD;

  const command = `pg_restore -h ${config.dbHost} -p ${config.dbPort} -U ${config.dbUser} -d ${config.dbName} -c "${backupFile}"`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Restore failed: ${error.message}`);
      return;
    }

    if (stderr) {
      console.warn(`⚠️ Restore warnings: ${stderr}`);
    }

    console.log(`✅ Database restored successfully from: ${backupFile}`);
  });
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args[0] === 'restore' && args[1]) {
    restoreBackup(args[1]);
  } else {
    createBackup();
  }
}

module.exports = { createBackup, restoreBackup, cleanOldBackups };
