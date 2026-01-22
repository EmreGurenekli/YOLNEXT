#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧹 Starting legacy code cleanup...');

// Legacy files to remove (confirmed unused)
const legacyFiles = [
  'backend/legacy/app.js',
  'backend/legacy/check-database-sqlite.js',
  'backend/legacy/check-db.js',
  'backend/legacy/check-messages-table.js',
  'backend/legacy/clean-backend.js',
  'backend/legacy/create-postgres-db.js',
  'backend/legacy/database-server.js',
  'backend/legacy/final-backend.js',
  'backend/legacy/final-server.js',
  'backend/legacy/migrate-sqlite-to-postgres.js',
  'backend/legacy/minimal-offers-server.js',
  'backend/legacy/minimal-server.js',
  'backend/legacy/postgres-backend.js',
  'backend/legacy/quick-backend.js',
  'backend/legacy/quick-server.js',
  'backend/legacy/realtime-server.js',
  'backend/legacy/server.js',
  'backend/legacy/simple-backend.js',
  'backend/legacy/simple-server.js',
  'backend/legacy/simple-stable-server.js',
  'backend/legacy/working-backend.js',
  'backend/legacy/working-server.js',
];

// Legacy directories to remove
const legacyDirs = [
  'backend/legacy/config',
  'backend/legacy/deployment',
  'backend/legacy/routes',
  'backend/legacy/sqlite-runtime',
  'backend/legacy/backend',
];

// Function to safely remove file
function removeFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`✅ Removed: ${filePath}`);
    } else {
      console.log(`⚠️  File not found: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error removing ${filePath}:`, error.message);
  }
}

// Function to safely remove directory
function removeDirectory(dirPath) {
  try {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
      console.log(`✅ Removed directory: ${dirPath}`);
    } else {
      console.log(`⚠️  Directory not found: ${dirPath}`);
    }
  } catch (error) {
    console.error(`❌ Error removing directory ${dirPath}:`, error.message);
  }
}

// Create backup directory
const backupDir = 'backup/legacy-cleanup-' + new Date().toISOString().slice(0, 10);
if (!fs.existsSync('backup')) {
  fs.mkdirSync('backup');
}
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir);
  console.log(`📁 Created backup directory: ${backupDir}`);
}

// Backup legacy files before removal
console.log('\n📦 Creating backups...');
legacyFiles.forEach(file => {
  const sourcePath = path.join(process.cwd(), file);
  const backupPath = path.join(process.cwd(), backupDir, path.basename(file));
  
  if (fs.existsSync(sourcePath)) {
    try {
      fs.copyFileSync(sourcePath, backupPath);
      console.log(`📋 Backed up: ${file}`);
    } catch (error) {
      console.error(`❌ Error backing up ${file}:`, error.message);
    }
  }
});

// Remove legacy files
console.log('\n🗑️  Removing legacy files...');
legacyFiles.forEach(removeFile);

// Remove legacy directories
console.log('\n🗑️  Removing legacy directories...');
legacyDirs.forEach(removeDirectory);

// Clean up empty legacy directory
const legacyRoot = path.join(process.cwd(), 'backend/legacy');
try {
  if (fs.existsSync(legacyRoot)) {
    const remainingFiles = fs.readdirSync(legacyRoot);
    if (remainingFiles.length === 0) {
      fs.rmdirSync(legacyRoot);
      console.log('✅ Removed empty legacy directory');
    } else {
      console.log(`⚠️  Legacy directory not empty, remaining files: ${remainingFiles.join(', ')}`);
    }
  }
} catch (error) {
  console.error('❌ Error cleaning up legacy directory:', error.message);
}

console.log('\n🎉 Legacy code cleanup completed!');
console.log(`📁 Backup created at: ${backupDir}`);
console.log('\n📊 Summary:');
console.log(`- Files removed: ${legacyFiles.length}`);
console.log(`- Directories removed: ${legacyDirs.length}`);
console.log('\n✨ The project is now cleaner and more maintainable!');
