#!/usr/bin/env node

/**
 * Production Startup Script
 * 
 * Bu script production ortamında uygulamayı başlatır.
 * Önce environment validation yapar, sonra backend'i başlatır.
 */

require('dotenv').config({ path: '.env.production' });

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// ANSI colors
const green = '\x1b[32m';
const red = '\x1b[31m';
const yellow = '\x1b[33m';
const reset = '\x1b[0m';
const cyan = '\x1b[36m';

const log = {
  info: (msg) => console.log(`${cyan}ℹ️${reset} ${msg}`),
  success: (msg) => console.log(`${green}✅${reset} ${msg}`),
  error: (msg) => console.log(`${red}❌${reset} ${msg}`),
  warning: (msg) => console.log(`${yellow}⚠️${reset} ${msg}`),
};

// Validate production environment
log.info('Validating production environment...');
try {
  const { validateEnvironmentVariable, REQUIRED_VARS } = require('./validate-production.js');
  
  let hasErrors = false;
  for (const varConfig of REQUIRED_VARS.CRITICAL) {
    const envValue = process.env[varConfig.name];
    const result = validateEnvironmentVariable(varConfig, envValue);
    if (!result.valid) {
      log.error(`${varConfig.name}: ${result.error}`);
      hasErrors = true;
    }
  }
  
  if (hasErrors) {
    log.error('Environment validation failed. Please fix the errors above.');
    log.info('Run: node scripts/validate-production.js for detailed validation');
    process.exit(1);
  }
  log.success('Environment validation passed');
} catch (err) {
  log.warning('Could not run full validation (this is OK if validate-production.js is not available)');
  log.warning('Error: ' + err.message);
  
  // Basic checks
  if (!process.env.CORS_ORIGIN) {
    log.error('CORS_ORIGIN is required in production');
    process.exit(1);
  }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    log.error('JWT_SECRET is required and must be at least 32 characters');
    process.exit(1);
  }
}

const NODE_ENV = process.env.NODE_ENV || 'production';
const PORT = process.env.PORT || 5000;

log.info('🚀 Starting YOLNEXT in production mode...');
log.info(`📡 Port: ${PORT}`);
log.info(`🌍 Environment: ${NODE_ENV}`);
log.info(`🔒 CORS Origin: ${process.env.CORS_ORIGIN || 'NOT SET'}`);

// Check if backend entrypoint exists
const backendFile = path.join(__dirname, '..', 'backend', 'server-modular.js');
if (!fs.existsSync(backendFile)) {
  log.error(`Backend file not found: ${backendFile}`);
  process.exit(1);
}

// Start backend
log.info('Starting backend server...');
const backend = spawn('node', [backendFile], {
  env: { ...process.env, NODE_ENV: 'production' },
  stdio: 'inherit',
  cwd: path.join(__dirname, '..')
});

backend.on('error', (err) => {
  console.error('❌ Backend error:', err);
  process.exit(1);
});

backend.on('exit', (code) => {
  console.log(`Backend exited with code ${code}`);
  process.exit(code);
});

// Handle termination
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  backend.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down...');
  backend.kill('SIGINT');
});















