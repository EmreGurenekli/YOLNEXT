const crypto = require('crypto');
const emailService = require('./emailService');

class PasswordResetService {
  constructor() {
    this.resetTokens = new Map(); // Production'da Redis kullanılmalı
  }

  // Reset token oluşturma
  generateResetToken(userId, email) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 saat

    this.resetTokens.set(token, {
      userId,
      email,
      expiresAt,
      used: false
    });

    return token;
  }

  // Reset token doğrulama
  validateResetToken(token) {
    const tokenData = this.resetTokens.get(token);
    
    if (!tokenData) {
      return { valid: false, error: 'Geçersiz token' };
    }

    if (tokenData.used) {
      return { valid: false, error: 'Token zaten kullanılmış' };
    }

    if (new Date() > tokenData.expiresAt) {
      this.resetTokens.delete(token);
      return { valid: false, error: 'Token süresi dolmuş' };
    }

    return { valid: true, userId: tokenData.userId, email: tokenData.email };
  }

  // Token'ı kullanılmış olarak işaretle
  markTokenAsUsed(token) {
    const tokenData = this.resetTokens.get(token);
    if (tokenData) {
      tokenData.used = true;
      this.resetTokens.set(token, tokenData);
    }
  }

  // Reset email gönderme
  async sendResetEmail(email, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    return await emailService.sendPasswordResetEmail(email, resetToken);
  }

  // Token temizleme (süresi dolan tokenları sil)
  cleanupExpiredTokens() {
    const now = new Date();
    for (const [token, data] of this.resetTokens.entries()) {
      if (now > data.expiresAt) {
        this.resetTokens.delete(token);
      }
    }
  }

  // Kullanıcıya ait tüm tokenları sil
  revokeAllUserTokens(userId) {
    for (const [token, data] of this.resetTokens.entries()) {
      if (data.userId === userId) {
        this.resetTokens.delete(token);
      }
    }
  }
}

module.exports = new PasswordResetService();


