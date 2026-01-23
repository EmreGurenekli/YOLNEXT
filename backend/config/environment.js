const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

class EnvironmentConfig {
  constructor() {
    this.nodeEnv = process.env.NODE_ENV || 'development';
    this.isDevelopment = this.nodeEnv === 'development';
    this.isProduction = this.nodeEnv === 'production';
    this.isTest = this.nodeEnv === 'test';
  }

  // Database configuration
  get database() {
    return {
      url: process.env.DATABASE_URL || 'postgresql://username:password@localhost:5432/yolnext',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT) || 5432,
      name: process.env.DATABASE_NAME || 'yolnext',
      user: process.env.DATABASE_USER || 'username',
      password: process.env.DATABASE_PASSWORD || 'password',
      ssl: this.isProduction ? { rejectUnauthorized: false } : false,
      maxConnections: parseInt(process.env.DATABASE_MAX_CONNECTIONS) || 20,
      idleTimeout: parseInt(process.env.DATABASE_IDLE_TIMEOUT) || 30000,
      connectionTimeout: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT) || 2000
    };
  }

  // JWT configuration
  get jwt() {
    return {
      secret: process.env.JWT_SECRET || 'yolnext-secret-key-2024',
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
    };
  }

  // Server configuration
  get server() {
    return {
      port: parseInt(process.env.PORT) || 5000,
      host: process.env.HOST || '0.0.0.0',
      corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
      rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
    };
  }

  // Redis configuration
  get redis() {
    return {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || '',
      db: parseInt(process.env.REDIS_DB) || 0
    };
  }

  // Email configuration
  get email() {
    return {
      smtp: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASSWORD || ''
        }
      },
      from: process.env.EMAIL_FROM || 'noreply@yolnext.com'
    };
  }

  // SMS configuration
  get sms() {
    return {
      twilio: {
        accountSid: process.env.TWILIO_ACCOUNT_SID || '',
        authToken: process.env.TWILIO_AUTH_TOKEN || '',
        phoneNumber: process.env.TWILIO_PHONE_NUMBER || ''
      }
    };
  }

  // File upload configuration
  get upload() {
    return {
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB
      uploadPath: process.env.UPLOAD_PATH || './uploads',
      allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,application/pdf').split(',')
    };
  }

  // Security configuration
  get security() {
    return {
      helmet: {
        contentSecurityPolicy: process.env.HELMET_CSP_ENABLED === 'true',
        crossOriginEmbedderPolicy: false
      },
      bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
      sessionSecret: process.env.SESSION_SECRET || 'yolnext-session-secret'
    };
  }

  // Logging configuration
  get logging() {
    return {
      level: process.env.LOG_LEVEL || (this.isDevelopment ? 'debug' : 'info'),
      enableMetrics: process.env.ENABLE_METRICS === 'true',
      logToFile: process.env.LOG_TO_FILE === 'true',
      logFilePath: process.env.LOG_FILE_PATH || './logs/app.log'
    };
  }

  // Monitoring configuration
  get monitoring() {
    return {
      enableHealthChecks: process.env.ENABLE_HEALTH_CHECKS !== 'false',
      enableMetrics: process.env.ENABLE_METRICS === 'true',
      metricsPort: parseInt(process.env.METRICS_PORT) || 9090
    };
  }

  // Frontend configuration
  get frontend() {
    return {
      apiUrl: process.env.VITE_API_URL || 'http://localhost:5000',
      apiTimeout: parseInt(process.env.VITE_API_TIMEOUT) || 10000,
      apiRetryAttempts: parseInt(process.env.VITE_API_RETRY_ATTEMPTS) || 3,
      logLevel: process.env.VITE_LOG_LEVEL || 'info'
    };
  }

  // Validation
  validate() {
    const required = [
      'JWT_SECRET',
      'DATABASE_URL'
    ];

    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    return true;
  }

  // Get all configuration
  get all() {
    return {
      nodeEnv: this.nodeEnv,
      isDevelopment: this.isDevelopment,
      isProduction: this.isProduction,
      isTest: this.isTest,
      database: this.database,
      jwt: this.jwt,
      server: this.server,
      redis: this.redis,
      email: this.email,
      sms: this.sms,
      upload: this.upload,
      security: this.security,
      logging: this.logging,
      monitoring: this.monitoring,
      frontend: this.frontend
    };
  }
}

module.exports = new EnvironmentConfig();


