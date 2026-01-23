/**
 * Environment Variable Validator
 * Validates all critical environment variables at startup
 */

const requiredEnvVars = {
  production: [
    'JWT_SECRET',
    'DATABASE_URL',
    'FRONTEND_ORIGIN',
  ],
  development: [
    'DATABASE_URL',
  ],
  test: [
    'DATABASE_URL',
  ],
};

const optionalEnvVars = {
  // Email configuration
  SMTP_HOST: 'smtp.gmail.com',
  SMTP_PORT: '587',
  SMTP_USER: '',
  SMTP_PASS: '',
  
<<<<<<< HEAD
  // SMS configuration - Removed (not needed)
=======
  // SMS configuration
  TWILIO_ACCOUNT_SID: '',
  TWILIO_AUTH_TOKEN: '',
  TWILIO_PHONE_NUMBER: '',
>>>>>>> d16e01282458675ee948d13b88a3dc5d9dde5b11
  
  // File upload
  MAX_FILE_SIZE: '10485760', // 10MB
  UPLOAD_PATH: './uploads',
  
  // Security
  SENTRY_DSN: '',
  HELMET_CSP_ENABLED: 'false',
  
  // Database
  DB_POOL_MAX: '10',
  DB_IDLE_TIMEOUT: '30000',
  DB_CONNECTION_TIMEOUT: '10000',
  
  // Backup
  BACKUP_DIR: './backups',
  BACKUP_RETENTION_DAYS: '7',
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: '900000', // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: '100',
  
  // Cache
  REDIS_URL: '',
  CACHE_TTL: '3600', // 1 hour
};

/**
 * Validate environment variables
 */
function validateEnvironment() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const required = requiredEnvVars[nodeEnv] || requiredEnvVars.development;
  const missing = [];
  const warnings = [];

  // Check required variables
  for (const varName of required) {
    if (!process.env[varName] || process.env[varName].trim() === '') {
      missing.push(varName);
    }
  }

  // Check critical values
  if (nodeEnv === 'production') {
    if (process.env.JWT_SECRET === 'dev-secret-key-change-in-production' || 
        process.env.JWT_SECRET === 'CHANGE_ME_GENERATE_STRONG_SECRET_MIN_32_CHARS') {
      warnings.push('JWT_SECRET is using default value - MUST be changed in production!');
    }
    
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
      warnings.push('JWT_SECRET should be at least 32 characters long for security');
    }
  }

  // Validate DATABASE_URL format
  if (process.env.DATABASE_URL) {
    if (!process.env.DATABASE_URL.startsWith('postgresql://') && 
        !process.env.DATABASE_URL.startsWith('postgres://')) {
      warnings.push('DATABASE_URL should start with postgresql:// or postgres://');
    }
  }

  // Validate FRONTEND_ORIGIN format
  if (process.env.FRONTEND_ORIGIN) {
    const origins = process.env.FRONTEND_ORIGIN.split(',').map(o => o.trim());
    for (const origin of origins) {
      if (!origin.startsWith('http://') && !origin.startsWith('https://')) {
        warnings.push(`FRONTEND_ORIGIN "${origin}" should start with http:// or https://`);
      }
    }
  }

  // Set defaults for optional variables
  for (const [varName, defaultValue] of Object.entries(optionalEnvVars)) {
    if (!process.env[varName]) {
      process.env[varName] = defaultValue;
    }
  }

  // Report results
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (warnings.length > 0) {
    console.warn('⚠️ Environment variable warnings:');
    warnings.forEach(warning => {
      console.warn(`   - ${warning}`);
    });
  }

  console.log('✅ Environment variables validated');
  return true;
}

/**
 * Get validated environment variable
 */
function getEnv(varName, defaultValue = null) {
  const value = process.env[varName];
  if (!value && defaultValue === null) {
    throw new Error(`Environment variable ${varName} is not set and no default provided`);
  }
  return value || defaultValue;
}

module.exports = {
  validateEnvironment,
  getEnv,
  requiredEnvVars,
  optionalEnvVars,
};









