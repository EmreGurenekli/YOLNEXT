const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class PaymentSecurityService {
  constructor() {
    this.encryptionKey = process.env.PAYMENT_ENCRYPTION_KEY;
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32; // 256 bits
    this.ivLength = 16;  // 128 bits for GCM
    this.tagLength = 16; // 128 bits authentication tag
  }

  /**
   * Environment validation for payment services
   */
  validatePaymentEnvironment() {
    const requiredVars = [
      'IYZICO_API_KEY',
      'IYZICO_SECRET_KEY',
      'PAYMENT_ENCRYPTION_KEY',
      'STRIPE_SECRET_KEY'
    ];

    const missing = requiredVars.filter(varName => !process.env[varName]);

    if (missing.length > 0) {
      console.error('🚨 PAYMENT SECURITY ALERT: Missing required environment variables:', missing);
      return {
        valid: false,
        missing: missing,
        message: 'Payment environment validation failed'
      };
    }

    // Validate encryption key strength
    if (this.encryptionKey && this.encryptionKey.length < this.keyLength) {
      console.error('🚨 PAYMENT SECURITY ALERT: Payment encryption key too weak');
      return {
        valid: false,
        message: 'Encryption key too weak'
      };
    }

    return { valid: true };
  }

  /**
   * Encrypt sensitive payment data (card numbers, etc.)
   */
  encryptPaymentData(data) {
    if (!this.encryptionKey) {
      throw new Error('Payment encryption key not configured');
    }

    try {
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipher(this.algorithm, this.encryptionKey);

      let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      return {
        encrypted: encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
      };
    } catch (error) {
      console.error('Payment data encryption failed:', error);
      throw new Error('Payment data encryption failed');
    }
  }

  /**
   * Decrypt sensitive payment data
   */
  decryptPaymentData(encryptedData) {
    if (!this.encryptionKey) {
      throw new Error('Payment encryption key not configured');
    }

    try {
      const { encrypted, iv, authTag } = encryptedData;

      const decipher = crypto.createDecipher(this.algorithm, this.encryptionKey);
      decipher.setAuthTag(Buffer.from(authTag, 'hex'));
      decipher.setAAD(Buffer.from(iv, 'hex'));

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Payment data decryption failed:', error);
      throw new Error('Payment data decryption failed');
    }
  }

  /**
   * Validate PCI compliance for payment data
   */
  validatePCIData(paymentData) {
    const validations = {
      cardNumber: /^[0-9]{13,19}$/,
      expiryDate: /^(0[1-9]|1[0-2])\/([0-9]{2})$/,
      cvv: /^[0-9]{3,4}$/,
      cardholderName: /^[a-zA-Z\s]{2,50}$/
    };

    const results = {};

    for (const [field, regex] of Object.entries(validations)) {
      if (paymentData[field]) {
        results[field] = regex.test(paymentData[field]);
      }
    }

    const isValid = Object.values(results).every(result => result !== false);

    return {
      valid: isValid,
      validations: results,
      message: isValid ? 'PCI validation passed' : 'PCI validation failed'
    };
  }

  /**
   * Sanitize payment data for logging (remove sensitive info)
   */
  sanitizePaymentData(paymentData) {
    const sanitized = { ...paymentData };

    // Remove sensitive fields
    const sensitiveFields = [
      'cardNumber', 'cvv', 'cardCode', 'pin',
      'cardholderName', 'expiryDate', 'expiryMonth', 'expiryYear'
    ];

    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = this.maskField(sanitized[field]);
      }
    });

    return sanitized;
  }

  /**
   * Mask sensitive data for logging
   */
  maskField(value) {
    if (!value || typeof value !== 'string') return value;

    if (value.length <= 4) return '*'.repeat(value.length);

    const visibleChars = 4;
    const maskedChars = value.length - visibleChars;

    return '*'.repeat(maskedChars) + value.slice(-visibleChars);
  }

  /**
   * Generate secure payment token
   */
  generatePaymentToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Validate payment amount (prevent fraud)
   */
  validatePaymentAmount(amount, limits = {}) {
    const {
      minAmount = 1,
      maxAmount = 50000, // Max 50k TL
      allowedDecimals = 2
    } = limits;

    // Check if amount is a valid number
    if (isNaN(amount) || !isFinite(amount)) {
      return { valid: false, reason: 'Invalid amount format' };
    }

    // Check decimal places
    const decimalPlaces = (amount.toString().split('.')[1] || '').length;
    if (decimalPlaces > allowedDecimals) {
      return { valid: false, reason: `Too many decimal places (max ${allowedDecimals})` };
    }

    // Check amount limits
    if (amount < minAmount) {
      return { valid: false, reason: `Amount too small (min ${minAmount})` };
    }

    if (amount > maxAmount) {
      return { valid: false, reason: `Amount too large (max ${maxAmount})` };
    }

    // Check for suspicious patterns (like 999.99)
    if (amount % 100 === 99.99) {
      return { valid: false, reason: 'Suspicious amount pattern' };
    }

    return { valid: true };
  }

  /**
   * Rate limiting for payment attempts
   */
  checkPaymentRateLimit(userId, attempts = []) {
    const now = Date.now();
    const timeWindow = 15 * 60 * 1000; // 15 minutes
    const maxAttempts = 5;

    // Filter attempts within time window
    const recentAttempts = attempts.filter(attempt =>
      (now - attempt.timestamp) < timeWindow
    );

    if (recentAttempts.length >= maxAttempts) {
      const oldestAttempt = Math.min(...recentAttempts.map(a => a.timestamp));
      const resetTime = oldestAttempt + timeWindow;
      return {
        allowed: false,
        resetTime: resetTime,
        remainingTime: Math.ceil((resetTime - now) / 1000)
      };
    }

    return { allowed: true };
  }

  /**
   * Generate payment audit log
   */
  createPaymentAuditLog(action, data, req = null) {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      action: action,
      userId: req?.user?.id || 'system',
      ip: req?.ip || req?.connection?.remoteAddress || 'unknown',
      userAgent: req?.headers?.['user-agent'] || 'unknown',
      sessionId: req?.session?.id || 'unknown',
      data: this.sanitizePaymentData(data)
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('💳 PAYMENT AUDIT:', JSON.stringify(auditEntry, null, 2));
    }

    // TODO: Log to secure audit database/file
    // await this.logToAuditDatabase(auditEntry);

    return auditEntry;
  }

  /**
   * Fraud detection patterns
   */
  detectPaymentFraud(paymentData, userHistory = []) {
    const fraudIndicators = [];

    // Check for unusual amounts
    if (paymentData.amount > 10000) {
      fraudIndicators.push('high_amount');
    }

    // Check for rapid successive payments
    const recentPayments = userHistory.filter(payment =>
      (Date.now() - payment.timestamp) < (24 * 60 * 60 * 1000) // Last 24 hours
    );

    if (recentPayments.length > 10) {
      fraudIndicators.push('high_frequency');
    }

    // Check for round numbers (fraud indicator)
    if (paymentData.amount % 100 === 0 && paymentData.amount > 1000) {
      fraudIndicators.push('round_number');
    }

    // Check for international cards (if domestic market)
    if (paymentData.cardCountry && paymentData.cardCountry !== 'TR') {
      fraudIndicators.push('international_card');
    }

    return {
      isFraudulent: fraudIndicators.length > 0,
      indicators: fraudIndicators,
      riskLevel: fraudIndicators.length > 2 ? 'high' :
                fraudIndicators.length > 0 ? 'medium' : 'low'
    };
  }
}

module.exports = new PaymentSecurityService();
