const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
<<<<<<< HEAD
    this.transporter = nodemailer.createTransport({
=======
    this.transporter = nodemailer.createTransporter({
>>>>>>> d16e01282458675ee948d13b88a3dc5d9dde5b11
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER || 'your-email@gmail.com',
        pass: process.env.SMTP_PASS || 'your-app-password'
      }
    });
  }

  async sendVerificationEmail(email, verificationCode) {
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@YolNext.com',
      to: email,
      subject: 'YolNext E-posta Doğrulama',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">YolNext Kargo Platform</h2>
          <p>Merhaba,</p>
          <p>Hesabınızı doğrulamak için aşağıdaki kodu kullanın:</p>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #2563eb; margin: 0; font-size: 32px;">${verificationCode}</h1>
          </div>
          <p>Bu kod 10 dakika geçerlidir.</p>
          <p>Eğer bu işlemi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">YolNext Kargo Platform © 2024</p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      console.error('Email gönderme hatası:', error);
      return { success: false, error: error.message };
    }
  }

  async sendPasswordResetEmail(email, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@YolNext.com',
      to: email,
      subject: 'YolNext Şifre Sıfırlama',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">YolNext Kargo Platform</h2>
          <p>Merhaba,</p>
          <p>Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Şifremi Sıfırla</a>
          </div>
          <p>Bu bağlantı 1 saat geçerlidir.</p>
          <p>Eğer bu işlemi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">YolNext Kargo Platform © 2024</p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      console.error('Email gönderme hatası:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();