const fs = require('fs');
const path = require('path');

/**
 * Schedule automatic database backups
 */
function scheduleBackups(dbPath) {
  const backupsDir = path.join(__dirname, '../backups');
  
  // Create backups directory if it doesn't exist
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
    console.log('✅ Backups directory created');
  }
  
  // Schedule backup every 24 hours
  const backupInterval = 24 * 60 * 60 * 1000; // 24 hours
  
  // Do initial backup
  performBackup(dbPath, backupsDir);
  
  // Schedule recurring backups
  setInterval(() => {
    performBackup(dbPath, backupsDir);
  }, backupInterval);
  
  console.log('✅ Backup scheduler active (24h interval)');
}

/**
 * Perform a database backup
 */
function performBackup(dbPath, backupsDir) {
  try {
    const timestamp = new Date().toISOString().split('T')[0];
    const backupFileName = `database-backup-${timestamp}.sqlite`;
    const backupPath = path.join(backupsDir, backupFileName);
    
    // Check if database file exists
    if (!fs.existsSync(dbPath)) {
      console.warn('⚠️ Database file not found:', dbPath);
      return;
    }
    
    // Copy database file
    fs.copyFileSync(dbPath, backupPath);
    
    // Get backup file size
    const stats = fs.statSync(backupPath);
    const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);
    
    console.log(`✅ Database backed up: ${backupFileName} (${fileSizeMB} MB)`);
    
    // Clean old backups (keep last 7 days)
    cleanupOldBackups(backupsDir);
    
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
  }
}

/**
 * Clean up old backup files
 */
function cleanupOldBackups(backupsDir) {
  try {
    const files = fs.readdirSync(backupsDir);
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    
    files.forEach(file => {
      if (file.startsWith('database-backup-')) {
        const filePath = path.join(backupsDir, file);
        const stats = fs.statSync(filePath);
        const fileAge = now - stats.mtimeMs;
        
        if (fileAge > maxAge) {
          fs.unlinkSync(filePath);
          console.log(`🗑️  Old backup removed: ${file}`);
        }
      }
    });
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  }
}

/**
 * Restore from backup
 */
function restoreFromBackup(backupFileName, dbPath) {
  try {
    const backupsDir = path.join(__dirname, '../backups');
    const backupPath = path.join(backupsDir, backupFileName);
    
    if (!fs.existsSync(backupPath)) {
      throw new Error('Backup file not found');
    }
    
    // Copy backup to main database
    fs.copyFileSync(backupPath, dbPath);
    
    console.log(`✅ Database restored from: ${backupFileName}`);
    
  } catch (error) {
    console.error('❌ Restore failed:', error.message);
    throw error;
  }
}

module.exports = {
  scheduleBackups,
  performBackup,
  cleanupOldBackups,
  restoreFromBackup
};


