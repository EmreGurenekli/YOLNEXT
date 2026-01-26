/**
 * Services Configuration
 * Setup email service and file upload service
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const errorLogger = require('../utils/errorLogger');

/**
 * Setup email service
 * @returns {object} Email service functions
 */
function setupEmailService() {
  // Simple email service - returns no-op functions if email not configured
  const isEmailConfigured = !!(
    process.env.EMAIL_SMTP_URL ||
    process.env.SMTP_HOST ||
    (process.env.SMTP_USER && process.env.SMTP_PASS)
  );

  if (!isEmailConfigured) {
    errorLogger.warn('Email service not configured - using no-op implementation');
    return {
      sendEmail: async () => {
        errorLogger.warn('Email sending attempted but service not configured');
        return { success: false, message: 'Email service not configured' };
      },
    };
  }

  // If email service is configured, use the actual service
  // Note: emailService.js exports an instance, not a class
  try {
    const emailServiceInstance = require('../services/emailService');
    
    return {
      sendEmail: async (to, subject, html, text) => {
        try {
          // emailService exports an instance with methods
          if (emailServiceInstance.sendEmail) {
            return await emailServiceInstance.sendEmail(to, subject, html, text);
          } else {
            // Fallback: email service not fully configured
            errorLogger.warn('Email service method not available');
            return { success: false, message: 'Email service method not available' };
          }
        } catch (error) {
          errorLogger.error('Email sending failed', { error: error.message });
          return { success: false, error: error.message };
        }
      },
    };
  } catch (error) {
    errorLogger.warn('Email service initialization failed', { error: error.message });
    return {
      sendEmail: async () => {
        return { success: false, message: 'Email service unavailable' };
      },
    };
  }
}

/**
 * Setup file upload service
 * @returns {object} Multer upload middleware
 */
function setupFileUpload() {
  // Ensure uploads directory exists
  const uploadsDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Configure multer storage
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    },
  });

  // File filter
  const fileFilter = (req, file, cb) => {
    // Allow images and documents
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and documents are allowed.'), false);
    }
  };

  // Create multer instance
  const upload = multer({
    storage,
    fileFilter,
    limits: {
      fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB default
      files: 5, // Max 5 files
    },
  });

  return upload;
}

module.exports = {
  setupEmailService,
  setupFileUpload,
};
