// SMS Service - Twilio entegrasyonu
const twilio = require('twilio');

class SMSService {
  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID || 'your-account-sid',
      process.env.TWILIO_AUTH_TOKEN || 'your-auth-token'
    );
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || '+1234567890';
  }

  async sendVerificationSMS(phoneNumber, verificationCode) {
    try {
      const message = await this.client.messages.create({
        body: `YolNext doğrulama kodunuz: ${verificationCode}. Bu kod 10 dakika geçerlidir.`,
        from: this.fromNumber,
        to: phoneNumber
      });

      return { 
        success: true, 
        messageId: message.sid 
      };
    } catch (error) {
      console.error('SMS gönderme hatası:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  async sendNotificationSMS(phoneNumber, message) {
    try {
      const result = await this.client.messages.create({
        body: `YolNext: ${message}`,
        from: this.fromNumber,
        to: phoneNumber
      });

      return { 
        success: true, 
        messageId: result.sid 
      };
    } catch (error) {
      console.error('SMS bildirim hatası:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  // Demo için mock SMS service
  async sendMockSMS(phoneNumber, verificationCode) {
    console.log(`📱 Mock SMS gönderildi: ${phoneNumber} - Kod: ${verificationCode}`);
    return { 
      success: true, 
      messageId: 'mock-' + Date.now() 
    };
  }
}

module.exports = new SMSService();