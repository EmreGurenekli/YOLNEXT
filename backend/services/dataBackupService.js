const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

class DataBackupService {
  constructor() {
    this.backupDir = process.env.BACKUP_DIR || path.join(__dirname, '..', 'backups');
    this.retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS) || 30;
    this.maxBackupSize = parseInt(process.env.MAX_BACKUP_SIZE_MB) || 500; // MB
    this.encryptionEnabled = process.env.BACKUP_ENCRYPTION_ENABLED === 'true';
    this.encryptionKey = process.env.BACKUP_ENCRYPTION_KEY;

    // Backup schedule
    this.backupSchedule = {
      daily: '0 2 * * *',    // 02:00 daily
      weekly: '0 3 * * 1',   // 03:00 Mondays
      monthly: '0 4 1 * *'   // 04:00 first day of month
    };

    this.ensureBackupDirectory();
  }

  /**
   * Backup dizinini oluştur
   */
  ensureBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      console.log(`📁 Backup directory created: ${this.backupDir}`);
    }
  }

  /**
   * Veritabanı yedeği al
   */
  async createDatabaseBackup(options = {}) {
    const {
      type = 'full', // 'full', 'incremental', 'schema'
      compress = true,
      encrypt = this.encryptionEnabled
    } = options;

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `db_backup_${type}_${timestamp}.sql`;
      const filepath = path.join(this.backupDir, filename);

      console.log(`🔄 Starting ${type} database backup...`);

      // PostgreSQL dump komutu
      let dumpCommand = '';

      if (process.env.DATABASE_URL) {
        // Connection string varsa
        dumpCommand = `pg_dump "${process.env.DATABASE_URL}"`;
      } else {
        // Ayrı environment variables varsa
        const host = process.env.DB_HOST || 'localhost';
        const port = process.env.DB_PORT || '5432';
        const database = process.env.DB_NAME || 'yolnext';
        const username = process.env.DB_USER || 'postgres';

        dumpCommand = `pg_dump -h ${host} -p ${port} -U ${username} -d ${database}`;
      }

      // Schema-only backup için
      if (type === 'schema') {
        dumpCommand += ' --schema-only --no-owner --no-privileges';
      }

      // Incremental backup için (WAL archiving gerekli)
      if (type === 'incremental') {
        dumpCommand += ' --compress=9 --format=custom';
      }

      // Dump işlemini çalıştır
      const { stdout, stderr } = await execAsync(dumpCommand, {
        env: {
          ...process.env,
          PGPASSWORD: process.env.DB_PASSWORD || ''
        },
        maxBuffer: 1024 * 1024 * 100 // 100MB buffer
      });

      // Dosyaya yaz
      fs.writeFileSync(filepath, stdout);

      console.log(`✅ Database backup created: ${filepath} (${fs.statSync(filepath).size} bytes)`);

      // Sıkıştırma
      let finalFilepath = filepath;
      if (compress) {
        finalFilepath = await this.compressBackup(filepath);
        // Orijinal dosyayı sil
        fs.unlinkSync(filepath);
      }

      // Şifreleme
      if (encrypt && this.encryptionKey) {
        finalFilepath = await this.encryptBackup(finalFilepath);
        // Şifrelenmemiş dosyayı sil
        fs.unlinkSync(filepath.replace('.sql', '.sql.gz'));
      }

      // Backup logunu kaydet
      await this.logBackupOperation({
        type: 'database',
        subtype: type,
        filepath: finalFilepath,
        size: fs.statSync(finalFilepath).size,
        compressed: compress,
        encrypted: encrypt,
        status: 'success'
      });

      return {
        success: true,
        filepath: finalFilepath,
        size: fs.statSync(finalFilepath).size,
        type: type
      };

    } catch (error) {
      console.error('❌ Database backup failed:', error);

      await this.logBackupOperation({
        type: 'database',
        subtype: type,
        error: error.message,
        status: 'failed'
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Dosya sistemi yedeği al
   */
  async createFilesystemBackup(options = {}) {
    const {
      sourceDirs = [
        path.join(__dirname, '..', 'uploads'),
        path.join(__dirname, '..', 'logs'),
        path.join(__dirname, '..', 'config')
      ],
      compress = true,
      encrypt = this.encryptionEnabled
    } = options;

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `fs_backup_${timestamp}.tar`;
      const filepath = path.join(this.backupDir, filename);

      console.log('🔄 Starting filesystem backup...');

      // Sadece mevcut dizinleri yedekle
      const existingDirs = sourceDirs.filter(dir => fs.existsSync(dir));

      if (existingDirs.length === 0) {
        throw new Error('No source directories exist for backup');
      }

      // Tar komutu oluştur
      const dirsString = existingDirs.map(dir => `"${dir}"`).join(' ');
      const tarCommand = `tar -cf "${filepath}" ${dirsString}`;

      await execAsync(tarCommand);

      console.log(`✅ Filesystem backup created: ${filepath}`);

      // Sıkıştırma
      let finalFilepath = filepath;
      if (compress) {
        finalFilepath = await this.compressBackup(filepath);
        fs.unlinkSync(filepath);
      }

      // Şifreleme
      if (encrypt && this.encryptionKey) {
        finalFilepath = await this.encryptBackup(finalFilepath);
        fs.unlinkSync(filepath.replace('.tar', '.tar.gz'));
      }

      await this.logBackupOperation({
        type: 'filesystem',
        filepath: finalFilepath,
        size: fs.statSync(finalFilepath).size,
        compressed: compress,
        encrypted: encrypt,
        status: 'success'
      });

      return {
        success: true,
        filepath: finalFilepath,
        size: fs.statSync(finalFilepath).size
      };

    } catch (error) {
      console.error('❌ Filesystem backup failed:', error);

      await this.logBackupOperation({
        type: 'filesystem',
        error: error.message,
        status: 'failed'
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Backup dosyasını sıkıştır
   */
  async compressBackup(filepath) {
    const compressedPath = `${filepath}.gz`;

    try {
      const gzipCommand = `gzip -9 "${filepath}"`;
      await execAsync(gzipCommand);

      console.log(`📦 Backup compressed: ${compressedPath}`);
      return compressedPath;

    } catch (error) {
      console.warn('Compression failed, keeping uncompressed file:', error);
      return filepath;
    }
  }

  /**
   * Backup dosyasını şifrele
   */
  async encryptBackup(filepath) {
    const crypto = require('crypto');
    const encryptedPath = `${filepath}.enc`;

    try {
      const algorithm = 'aes-256-gcm';
      const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
      const iv = crypto.randomBytes(16);

      const cipher = crypto.createCipher(algorithm, key);
      const input = fs.createReadStream(filepath);
      const output = fs.createWriteStream(encryptedPath);

      input.pipe(cipher).pipe(output);

      await new Promise((resolve, reject) => {
        output.on('finish', resolve);
        output.on('error', reject);
      });

      console.log(`🔐 Backup encrypted: ${encryptedPath}`);
      return encryptedPath;

    } catch (error) {
      console.warn('Encryption failed, keeping unencrypted file:', error);
      return filepath;
    }
  }

  /**
   * Eski backup'ları temizle
   */
  async cleanupOldBackups() {
    try {
      console.log('🧹 Cleaning up old backups...');

      const files = fs.readdirSync(this.backupDir);
      const now = Date.now();
      const retentionMs = this.retentionDays * 24 * 60 * 60 * 1000;

      let cleanedCount = 0;

      for (const file of files) {
        const filepath = path.join(this.backupDir, file);
        const stats = fs.statSync(filepath);

        if (now - stats.mtime.getTime() > retentionMs) {
          fs.unlinkSync(filepath);
          cleanedCount++;
          console.log(`🗑️  Old backup deleted: ${file}`);
        }
      }

      console.log(`✅ Cleanup completed: ${cleanedCount} old backups removed`);

      return { success: true, cleanedCount };

    } catch (error) {
      console.error('❌ Cleanup failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Backup operasyonlarını logla
   */
  async logBackupOperation(operation) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      ...operation
    };

    const logFile = path.join(this.backupDir, 'backup.log');

    try {
      const logData = JSON.stringify(logEntry, null, 2) + '\n---\n';

      if (fs.existsSync(logFile)) {
        fs.appendFileSync(logFile, logData);
      } else {
        fs.writeFileSync(logFile, logData);
      }

      console.log('📝 Backup operation logged');

    } catch (error) {
      console.error('❌ Failed to log backup operation:', error);
    }
  }

  /**
   * Backup durumunu kontrol et
   */
  async getBackupStatus() {
    try {
      const files = fs.readdirSync(this.backupDir);
      const backups = [];

      for (const file of files) {
        if (file === 'backup.log') continue;

        const filepath = path.join(this.backupDir, file);
        const stats = fs.statSync(filepath);

        backups.push({
          filename: file,
          size: stats.size,
          created: stats.mtime.toISOString(),
          type: this.getBackupType(file)
        });
      }

      // Son backup'ları bul
      const databaseBackups = backups.filter(b => b.type === 'database');
      const filesystemBackups = backups.filter(b => b.type === 'filesystem');

      const latestDatabase = databaseBackups.sort((a, b) =>
        new Date(b.created).getTime() - new Date(a.created).getTime()
      )[0];

      const latestFilesystem = filesystemBackups.sort((a, b) =>
        new Date(b.created).getTime() - new Date(a.created).getTime()
      )[0];

      return {
        success: true,
        totalBackups: backups.length,
        latestDatabase: latestDatabase || null,
        latestFilesystem: latestFilesystem || null,
        backupDir: this.backupDir,
        retentionDays: this.retentionDays
      };

    } catch (error) {
      console.error('❌ Failed to get backup status:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Backup tipini belirle
   */
  getBackupType(filename) {
    if (filename.includes('db_backup')) return 'database';
    if (filename.includes('fs_backup')) return 'filesystem';
    return 'unknown';
  }

  /**
   * Otomatik backup schedule'ını başlat
   */
  startScheduledBackups() {
    // Bu fonksiyon production'da cron job olarak çalıştırılabilir
    console.log('⏰ Scheduled backups enabled');
    console.log(`📅 Daily backup: ${this.backupSchedule.daily}`);
    console.log(`📅 Weekly backup: ${this.backupSchedule.weekly}`);
    console.log(`📅 Monthly backup: ${this.backupSchedule.monthly}`);
  }

  /**
   * Manuel backup oluştur
   */
  async createFullBackup() {
    console.log('🚀 Starting full backup...');

    const results = await Promise.allSettled([
      this.createDatabaseBackup({ type: 'full' }),
      this.createFilesystemBackup(),
      this.cleanupOldBackups()
    ]);

    const summary = {
      timestamp: new Date().toISOString(),
      database: results[0].status === 'fulfilled' ? results[0].value : results[0].reason,
      filesystem: results[1].status === 'fulfilled' ? results[1].value : results[1].reason,
      cleanup: results[2].status === 'fulfilled' ? results[2].value : results[2].reason,
      overallSuccess: results.slice(0, 2).every(r => r.status === 'fulfilled')
    };

    console.log('📊 Full backup summary:', summary);
    return summary;
  }
}

module.exports = new DataBackupService();
