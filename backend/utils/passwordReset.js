/**
 * Password Reset Security
 * Implements secure password reset with token expiration and one-time use
 */

const crypto = require('crypto');
const bcrypt = require('bcrypt');

// Token store (use Redis in production)
const resetTokens = new Map();
const TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour
const MAX_ATTEMPTS = 3; // Maximum reset attempts per hour

/**
 * Generate secure reset token
 */
function generateResetToken(userId, email) {
  const token = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  
  resetTokens.set(hashedToken, {
    userId,
    email,
    expiresAt: Date.now() + TOKEN_EXPIRY,
    used: false,
    attempts: 0,
  });
  
  // Cleanup expired tokens
  cleanupExpiredTokens();
  
  return token;
}

/**
 * Validate reset token
 */
function validateResetToken(token) {
  if (!token) {
    return { valid: false, error: 'Token is required' };
  }
  
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const tokenData = resetTokens.get(hashedToken);
  
  if (!tokenData) {
    return { valid: false, error: 'Invalid token' };
  }
  
  if (tokenData.used) {
    return { valid: false, error: 'Token has already been used' };
  }
  
  if (Date.now() > tokenData.expiresAt) {
    resetTokens.delete(hashedToken);
    return { valid: false, error: 'Token has expired' };
  }
  
  if (tokenData.attempts >= MAX_ATTEMPTS) {
    resetTokens.delete(hashedToken);
    return { valid: false, error: 'Maximum attempts exceeded' };
  }
  
  return { valid: true, userId: tokenData.userId, email: tokenData.email };
}

/**
 * Mark token as used
 */
function markTokenAsUsed(token) {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const tokenData = resetTokens.get(hashedToken);
  
  if (tokenData) {
    tokenData.used = true;
    resetTokens.set(hashedToken, tokenData);
  }
}

/**
 * Increment token attempts
 */
function incrementTokenAttempts(token) {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const tokenData = resetTokens.get(hashedToken);
  
  if (tokenData) {
    tokenData.attempts++;
    resetTokens.set(hashedToken, tokenData);
  }
}

/**
 * Cleanup expired tokens
 */
function cleanupExpiredTokens() {
  const now = Date.now();
  for (const [token, data] of resetTokens.entries()) {
    if (now > data.expiresAt) {
      resetTokens.delete(token);
    }
  }
}

/**
 * Validate password strength
 */
function validatePasswordStrength(password) {
  if (!password) {
    return { valid: false, error: 'Password is required' };
  }
  
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }
  
  if (password.length > 128) {
    return { valid: false, error: 'Password is too long (max 128 characters)' };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }
  
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }
  
  // Check for common passwords (basic check)
  const commonPasswords = ['password', '12345678', 'qwerty', 'abc123'];
  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    return { valid: false, error: 'Password is too common' };
  }
  
  return { valid: true };
}

/**
 * Hash password
 */
async function hashPassword(password) {
  return await bcrypt.hash(password, 12);
}

module.exports = {
  generateResetToken,
  validateResetToken,
  markTokenAsUsed,
  incrementTokenAttempts,
  validatePasswordStrength,
  hashPassword,
  cleanupExpiredTokens,
};








