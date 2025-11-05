/**
 * Automated Backup Scheduler
 * Runs daily backups at specified time
 */

const cron = require('node-cron');
const { createBackup } = require('./backup-database');

// Schedule daily backup at 2 AM
// Cron format: minute hour day month day-of-week
const schedule = process.env.BACKUP_SCHEDULE || '0 2 * * *'; // Daily at 2 AM

console.log('📅 Backup scheduler started');
console.log(`⏰ Schedule: ${schedule} (Daily at 2 AM)`);

cron.schedule(schedule, () => {
  console.log(`\n🕐 Scheduled backup started at ${new Date().toISOString()}`);
  createBackup();
}, {
  scheduled: true,
  timezone: 'Europe/Istanbul'
});

// Keep process alive
process.on('SIGINT', () => {
  console.log('\n🛑 Backup scheduler stopped');
  process.exit(0);
});

console.log('✅ Backup scheduler is running. Press Ctrl+C to stop.');

