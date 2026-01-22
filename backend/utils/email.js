const nodemailer = require('nodemailer');

// Email transporter configuration
let transporter = null;

function getEmailTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        password: process.env.SMTP_PASSWORD
      }
    });
  }
  return transporter;
}

/**
 * Send verification email
 */
async function sendVerificationEmail(email, token) {
  try {
    // Skip if SMTP not configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.warn('⚠️ Email not sent: SMTP not configured');
      return true; // Return success to not block registration
    }
    
    const transporter = getEmailTransporter();
    const verificationUrl = `${process.env.APP_URL || 'http://localhost:5173'}/verify-email?token=${token}`;
    
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'YolNext - Email Doğrulama',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e40af;">Email Doğrulama</h2>
          <p>YolNext hesabınızı doğrulamak için aşağıdaki linke tıklayın:</p>
          <p>
            <a href="${verificationUrl}" style="background-color: #1e40af; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Emailimi Doğrula
            </a>
          </p>
          <p>Veya bu linki tarayıcınıza kopyalayın:</p>
          <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            Bu email otomatik olarak gönderilmiştir. Lütfen yanıt vermeyin.
          </p>
        </div>
      `
    });
    
    console.log(`✅ Verification email sent to: ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    return false;
  }
}

/**
 * Send password reset email
 */
async function sendPasswordResetEmail(email, token) {
  try {
    // Skip if SMTP not configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.warn('⚠️ Email not sent: SMTP not configured');
      return true;
    }
    
    const transporter = getEmailTransporter();
    const resetUrl = `${process.env.APP_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
    
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'YolNext - Şifre Sıfırlama',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Şifre Sıfırlama</h2>
          <p>Şifrenizi sıfırlamak için aşağıdaki linke tıklayın:</p>
          <p>
            <a href="${resetUrl}" style="background-color: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Şifremi Sıfırla
            </a>
          </p>
          <p>Veya bu linki tarayıcınıza kopyalayın:</p>
          <p style="color: #666; word-break: break-all;">${resetUrl}</p>
          <p style="color: #dc2626; font-weight: bold;">Önemli: Bu link 1 saat için geçerlidir.</p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            Bu email otomatik olarak gönderilmiştir. Eğer bu işlemi siz yapmadıysanız, bu emaili görmezden gelebilirsiniz.
          </p>
        </div>
      `
    });
    
    console.log(`✅ Password reset email sent to: ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    return false;
  }
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail
};


