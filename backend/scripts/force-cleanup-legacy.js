#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧹 Force cleaning legacy code...');

const legacyDir = path.join(process.cwd(), 'legacy');

// Function to recursively remove directory
function removeDirectoryRecursive(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`⚠️  Directory not found: ${dirPath}`);
    return;
  }

  try {
    // Create backup first
    const backupDir = path.join(process.cwd(), '..', 'backup', 'legacy-' + new Date().toISOString().slice(0, 10));
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Backup the entire legacy directory
    const backupTarget = path.join(backupDir, 'legacy');
    if (!fs.existsSync(backupTarget)) {
      copyDirectory(dirPath, backupTarget);
      console.log(`📦 Created backup at: ${backupTarget}`);
    }

    // Remove the directory
    fs.rmSync(dirPath, { recursive: true, force: true });
    console.log(`✅ Removed directory: ${dirPath}`);
  } catch (error) {
    console.error(`❌ Error removing directory ${dirPath}:`, error.message);
  }
}

// Function to copy directory recursively
function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Remove the entire legacy directory
removeDirectoryRecursive(legacyDir);

console.log('\n🎉 Force cleanup completed!');
console.log('✨ The legacy directory has been completely removed with backup!');
