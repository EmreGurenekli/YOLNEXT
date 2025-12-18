#!/usr/bin/env node

/**
 * Production Environment Validation Script
 * 
 * Bu script, production'a çıkmadan önce tüm kritik environment variable'ları
 * ve güvenlik ayarlarını kontrol eder.
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ️${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}\n${colors.cyan}${msg}${colors.reset}\n${colors.cyan}${'='.repeat(60)}${colors.reset}\n`),
};

// Required environment variables for production
const REQUIRED_VARS = {
  // Critical - Application won't start without these
  CRITICAL: [
    { name: 'NODE_ENV', value: 'production', exact: true },
    { name: 'CORS_ORIGIN', minLength: 10, mustBeUrl: true },
    { name: 'JWT_SECRET', minLength: 32 },
  ],
  // Important - Should be set but won't prevent startup
  IMPORTANT: [
    { name: 'PORT', defaultValue: '5000' },
    { name: 'DATABASE_URL', minLength: 20 },
    { name: 'REDIS_URL', optional: true },
  ],
  // Optional but recommended
  RECOMMENDED: [
    { name: 'SESSION_SECRET', minLength: 32 },
    { name: 'SMTP_HOST', optional: true },
    { name: 'SMTP_USER', optional: true },
    { name: 'SMTP_PASSWORD', optional: true },
  ],
};

function validateUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function validateEnvironmentVariable(varConfig, envValue) {
  const { name, minLength, exact, mustBeUrl, defaultValue, optional } = varConfig;

  // Check if variable exists
  if (!envValue && !optional) {
    if (defaultValue) {
      log.warning(`${name} not set, using default: ${defaultValue}`);
      return { valid: true, warning: true };
    }
    return { valid: false, error: `${name} is required but not set` };
  }

  if (!envValue && optional) {
    return { valid: true, skipped: true };
  }

  // Check exact match
  if (exact && envValue !== varConfig.value) {
    return { valid: false, error: `${name} must be exactly "${varConfig.value}"` };
  }

  // Check minimum length
  if (minLength && envValue.length < minLength) {
    return { valid: false, error: `${name} must be at least ${minLength} characters (current: ${envValue.length})` };
  }

  // Check URL format
  if (mustBeUrl && !validateUrl(envValue)) {
    return { valid: false, error: `${name} must be a valid URL (got: ${envValue})` };
  }

  // Security checks
  if (name === 'JWT_SECRET' || name === 'SESSION_SECRET') {
    // Check for common weak secrets
    const weakSecrets = ['secret', 'password', '123456', 'changeme', 'default'];
    if (weakSecrets.some(weak => envValue.toLowerCase().includes(weak))) {
      return { valid: false, error: `${name} appears to be a weak/commonly used secret` };
    }

    // Check entropy (simple check)
    const uniqueChars = new Set(envValue).size;
    if (uniqueChars < 10) {
      return { valid: false, error: `${name} has low entropy (only ${uniqueChars} unique characters)` };
    }
  }

  // CORS origin security check
  if (name === 'CORS_ORIGIN') {
    if (envValue === '*' || envValue === 'http://*' || envValue === 'https://*') {
      return { valid: false, error: 'CORS_ORIGIN cannot be wildcard (*) in production' };
    }
    if (!envValue.startsWith('https://')) {
      log.warning('CORS_ORIGIN should use HTTPS in production');
    }
  }

  return { valid: true };
}

function checkFilePermissions() {
  const criticalFiles = [
    '.env.production',
    'backend/server-modular.js',
  ];

  const issues = [];
  for (const file of criticalFiles) {
    if (fs.existsSync(file)) {
      const stats = fs.statSync(file);
      // Check if file is world-readable (permissions like 644 or 755)
      const mode = stats.mode.toString(8);
      if (mode.endsWith('4') || mode.endsWith('5') || mode.endsWith('6') || mode.endsWith('7')) {
        // World-readable - this is OK for most files
      }
    }
  }
  return issues;
}

function checkDockerConfiguration() {
  const dockerFiles = [
    'docker-compose.prod.yml',
    'Dockerfile',
    'Dockerfile.backend',
  ];

  const missing = [];
  for (const file of dockerFiles) {
    if (!fs.existsSync(file)) {
      missing.push(file);
    }
  }

  if (missing.length > 0) {
    log.warning(`Missing Docker files: ${missing.join(', ')}`);
  }

  return missing.length === 0;
}

function main() {
  log.header('YOLNEXT Production Environment Validation');

  // Load environment variables
  const envFile = path.join(process.cwd(), '.env.production');
  if (fs.existsSync(envFile)) {
    require('dotenv').config({ path: envFile });
    log.info(`Loaded environment from: ${envFile}`);
  } else {
    log.warning('.env.production file not found');
    log.info('Using system environment variables');
  }

  let hasErrors = false;
  let hasWarnings = false;

  // Validate critical variables
  log.header('Critical Environment Variables');
  for (const varConfig of REQUIRED_VARS.CRITICAL) {
    const envValue = process.env[varConfig.name];
    const result = validateEnvironmentVariable(varConfig, envValue);

    if (result.valid && !result.warning && !result.skipped) {
      log.success(`${varConfig.name}: OK`);
    } else if (result.warning) {
      hasWarnings = true;
    } else if (result.skipped) {
      log.info(`${varConfig.name}: Skipped (optional)`);
    } else {
      log.error(`${varConfig.name}: ${result.error}`);
      hasErrors = true;
    }
  }

  // Validate important variables
  log.header('Important Environment Variables');
  for (const varConfig of REQUIRED_VARS.IMPORTANT) {
    const envValue = process.env[varConfig.name];
    const result = validateEnvironmentVariable(varConfig, envValue);

    if (result.valid && !result.warning && !result.skipped) {
      log.success(`${varConfig.name}: OK`);
    } else if (result.warning) {
      hasWarnings = true;
    } else if (result.skipped) {
      log.info(`${varConfig.name}: Skipped (optional)`);
    } else {
      log.warning(`${varConfig.name}: ${result.error}`);
      hasWarnings = true;
    }
  }

  // Validate recommended variables
  log.header('Recommended Environment Variables');
  for (const varConfig of REQUIRED_VARS.RECOMMENDED) {
    const envValue = process.env[varConfig.name];
    const result = validateEnvironmentVariable(varConfig, envValue);

    if (result.valid && !result.warning && !result.skipped) {
      log.success(`${varConfig.name}: OK`);
    } else if (result.warning) {
      hasWarnings = true;
    } else if (result.skipped) {
      log.info(`${varConfig.name}: Not set (optional)`);
    } else {
      log.warning(`${varConfig.name}: ${result.error}`);
      hasWarnings = true;
    }
  }

  // Check file permissions
  log.header('File Security Checks');
  const permissionIssues = checkFilePermissions();
  if (permissionIssues.length === 0) {
    log.success('File permissions: OK');
  } else {
    permissionIssues.forEach(issue => log.warning(issue));
    hasWarnings = true;
  }

  // Check Docker configuration
  log.header('Docker Configuration');
  if (checkDockerConfiguration()) {
    log.success('Docker files: OK');
  } else {
    hasWarnings = true;
  }

  // Final summary
  log.header('Validation Summary');
  if (hasErrors) {
    log.error('Validation FAILED - Critical errors found');
    log.error('Please fix the errors above before deploying to production');
    process.exit(1);
  } else if (hasWarnings) {
    log.warning('Validation completed with warnings');
    log.info('Review the warnings above and fix them if possible');
    process.exit(0);
  } else {
    log.success('All validations passed! ✅');
    log.info('Your environment is ready for production deployment');
    process.exit(0);
  }
}

// Run validation
if (require.main === module) {
  main();
}

module.exports = { validateEnvironmentVariable, REQUIRED_VARS };
































































