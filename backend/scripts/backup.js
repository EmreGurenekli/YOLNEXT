const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { logger } = require('../utils/logger');

// Backup configuration
const BACKUP_DIR = process.env.BACKUP_DIR || './backups';
const DB_NAME = process.env.DB_NAME || 'yolnet';
const DB_USER = process.env.DB_USER || 'yolnet_user';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 5432;

// Create backup directory if it doesn't exist
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Generate backup filename with timestamp
const generateBackupFilename = () => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `yolnet_backup_${timestamp}.sql`;
};

// Create database backup
const createBackup = async () => {
  return new Promise((resolve, reject) => {
    const filename = generateBackupFilename();
    const filepath = path.join(BACKUP_DIR, filename);
    
    const command = `pg_dump -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -f ${filepath}`;
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        logger.error('Backup creation failed:', error);
        reject(error);
        return;
      }
      
      if (stderr) {
        logger.warn('Backup warnings:', stderr);
      }
      
      logger.info(`Backup created successfully: ${filepath}`);
      resolve(filepath);
    });
  });
};

// Restore database from backup
const restoreBackup = async (backupFile) => {
  return new Promise((resolve, reject) => {
    const filepath = path.join(BACKUP_DIR, backupFile);
    
    if (!fs.existsSync(filepath)) {
      reject(new Error(`Backup file not found: ${filepath}`));
      return;
    }
    
    const command = `psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -f ${filepath}`;
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        logger.error('Backup restoration failed:', error);
        reject(error);
        return;
      }
      
      if (stderr) {
        logger.warn('Restore warnings:', stderr);
      }
      
      logger.info(`Backup restored successfully from: ${filepath}`);
      resolve(true);
    });
  });
};

// List available backups
const listBackups = () => {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.endsWith('.sql'))
      .sort((a, b) => {
        const statA = fs.statSync(path.join(BACKUP_DIR, a));
        const statB = fs.statSync(path.join(BACKUP_DIR, b));
        return statB.mtime - statA.mtime;
      });
    
    return files;
  } catch (error) {
    logger.error('Error listing backups:', error);
    return [];
  }
};

// Clean old backups (keep last 30 days)
const cleanOldBackups = () => {
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    let deletedCount = 0;
    
    files.forEach(file => {
      if (file.endsWith('.sql')) {
        const filepath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(filepath);
        
        if (stats.mtime < thirtyDaysAgo) {
          fs.unlinkSync(filepath);
          deletedCount++;
          logger.info(`Deleted old backup: ${file}`);
        }
      }
    });
    
    logger.info(`Cleaned ${deletedCount} old backup files`);
    return deletedCount;
  } catch (error) {
    logger.error('Error cleaning old backups:', error);
    return 0;
  }
};

// Schedule automatic backups
const scheduleBackups = () => {
  // Daily backup at 2 AM
  const cron = require('node-cron');
  
  cron.schedule('0 2 * * *', async () => {
    try {
      logger.info('Starting scheduled backup...');
      await createBackup();
      await cleanOldBackups();
      logger.info('Scheduled backup completed');
    } catch (error) {
      logger.error('Scheduled backup failed:', error);
    }
  });
  
  logger.info('Backup scheduler started - Daily at 2 AM');
};

module.exports = {
  createBackup,
  restoreBackup,
  listBackups,
  cleanOldBackups,
  scheduleBackups
};





