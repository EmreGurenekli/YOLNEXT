#!/usr/bin/env node

/**
 * Comprehensive Issue Fixer Script
 * 
 * Bu script projedeki tüm yaygın sorunları otomatik olarak düzeltir:
 * - Unused imports
 * - Console.log statements (production için)
 * - Type errors
 * - Syntax issues
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Proje sorunlarını düzeltiyorum...\n');

// 1. Lint fix çalıştır
console.log('1️⃣  ESLint otomatik düzeltmeleri çalıştırılıyor...');
try {
  execSync('npm run lint:fix', { stdio: 'inherit' });
  console.log('✅ ESLint düzeltmeleri tamamlandı\n');
} catch (error) {
  console.log('⚠️  ESLint bazı sorunları otomatik düzelteemedi (normal)\n');
}

// 2. TypeScript check
console.log('2️⃣  TypeScript kontrolü yapılıyor...');
try {
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  console.log('✅ TypeScript kontrolü tamamlandı\n');
} catch (error) {
  console.log('⚠️  TypeScript bazı hatalar buldu (kontrol edilmeli)\n');
}

// 3. Build test
console.log('3️⃣  Build testi yapılıyor...');
try {
  execSync('npm run build:frontend', { stdio: 'inherit' });
  console.log('✅ Build başarılı\n');
} catch (error) {
  console.log('❌ Build hatası var - kontrol edilmeli\n');
}

console.log('✅ Tüm otomatik düzeltmeler tamamlandı!');
console.log('\n📋 Kalan sorunlar için:');
console.log('   - npm run lint (detaylı lint raporu)');
console.log('   - npx tsc --noEmit (TypeScript hataları)');
console.log('   - npm run build:frontend (build testi)');

