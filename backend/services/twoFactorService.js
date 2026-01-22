const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

class TwoFactorService {
  constructor() {
    this.issuer = 'YolNext Kargo';
  }

  // 2FA secret oluşturma
  generateSecret(userEmail) {
    const secret = speakeasy.generateSecret({
      name: userEmail,
      issuer: this.issuer,
      length: 32
    });

    return {
      secret: secret.base32,
      qrCodeUrl: secret.otpauth_url
    };
  }

  // QR Code oluşturma
  async generateQRCode(secret) {
    try {
      const qrCodeUrl = await QRCode.toDataURL(secret);
      return qrCodeUrl;
    } catch (error) {
      console.error('QR Code oluşturma hatası:', error);
      return null;
    }
  }

  // TOTP token doğrulama
  verifyToken(secret, token) {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2 // 2 adım tolerans
    });
  }

  // Backup codes oluşturma
  generateBackupCodes() {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
    }
    return codes;
  }

  // SMS ile 2FA kodu gönderme
  async sendSMS2FA(phoneNumber, code) {
    // SMS servisi ile entegrasyon
    console.log(`📱 2FA SMS gönderildi: ${phoneNumber} - Kod: ${code}`);
    return { success: true };
  }

  // Email ile 2FA kodu gönderme
  async sendEmail2FA(email, code) {
    // Email servisi ile entegrasyon
    console.log(`📧 2FA Email gönderildi: ${email} - Kod: ${code}`);
    return { success: true };
  }
}

module.exports = new TwoFactorService();