const validator = require('validator');
const xss = require('xss');

/**
 * Input sanitization middleware
 * Sanitizes user input to prevent XSS and injection attacks
 */
class InputSanitizer {
  /**
   * Sanitize string input
   */
  static sanitizeString(value, options = {}) {
    if (typeof value !== 'string') return value;
    
    // Remove null bytes
    value = value.replace(/\0/g, '');
    
    // Trim whitespace
    if (options.trim !== false) {
      value = value.trim();
    }
    
    // XSS protection
    if (options.preventXSS !== false) {
      value = xss(value, {
        whiteList: {},
        stripIgnoreTag: true,
        stripIgnoreTagBody: ['script', 'style'],
      });
    }
    
    // SQL injection basic protection (for search queries)
    if (options.preventSQLInjection) {
      // Remove SQL keywords (basic protection, parameterized queries are the real solution)
      const sqlKeywords = /(union|select|insert|update|delete|drop|create|alter|exec|execute|script)/gi;
      if (sqlKeywords.test(value)) {
        // Return a special marker object instead of throwing
        // This allows the middleware to handle it gracefully
        return { __INVALID_INPUT: true, originalValue: value };
      }
    }
    
    return value;
  }
  
  /**
   * Sanitize email
   */
  static sanitizeEmail(email) {
    if (!email || typeof email !== 'string') return null;
    return validator.normalizeEmail(email);
  }
  
  /**
   * Sanitize phone number (Turkish format)
   */
  static sanitizePhone(phone) {
    if (!phone || typeof phone !== 'string') return null;
    // Remove all non-numeric characters
    phone = phone.replace(/\D/g, '');
    // Format Turkish phone
    if (phone.startsWith('0')) {
      return phone;
    } else if (phone.startsWith('90')) {
      return '0' + phone.substring(2);
    } else if (phone.length === 10) {
      return phone;
    }
    return null;
  }
  
  /**
   * Sanitize number
   */
  static sanitizeNumber(value, options = {}) {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const num = parseFloat(value);
      if (isNaN(num)) return options.default || null;
      if (options.min !== undefined && num < options.min) return options.default || null;
      if (options.max !== undefined && num > options.max) return options.default || null;
      return num;
    }
    return options.default || null;
  }
  
  /**
   * Sanitize object recursively
   */
  static sanitizeObject(obj, schema = {}) {
    if (!obj || typeof obj !== 'object') return obj;
    
    const sanitized = Array.isArray(obj) ? [] : {};
    
    for (const key in obj) {
      if (!obj.hasOwnProperty(key)) continue;
      
      const value = obj[key];
      const fieldSchema = schema[key];
      
      if (fieldSchema) {
        if (fieldSchema.type === 'string') {
          sanitized[key] = InputSanitizer.sanitizeString(value, fieldSchema.options || {});
        } else if (fieldSchema.type === 'email') {
          sanitized[key] = InputSanitizer.sanitizeEmail(value);
        } else if (fieldSchema.type === 'phone') {
          sanitized[key] = InputSanitizer.sanitizePhone(value);
        } else if (fieldSchema.type === 'number') {
          sanitized[key] = InputSanitizer.sanitizeNumber(value, fieldSchema.options || {});
        } else if (fieldSchema.type === 'object' && typeof value === 'object') {
          sanitized[key] = InputSanitizer.sanitizeObject(value, fieldSchema.schema || {});
        } else {
          sanitized[key] = value;
        }
      } else {
        // Default: sanitize as string if string, keep others
        if (typeof value === 'string') {
          sanitized[key] = InputSanitizer.sanitizeString(value);
        } else if (typeof value === 'object' && value !== null) {
          sanitized[key] = InputSanitizer.sanitizeObject(value);
        } else {
          sanitized[key] = value;
        }
      }
    }
    
    return sanitized;
  }
  
  /**
   * Middleware to sanitize request body
   */
  static sanitizeBody(schema = {}) {
    return (req, res, next) => {
      if (req.body && typeof req.body === 'object') {
        req.body = InputSanitizer.sanitizeObject(req.body, schema);
      }
      next();
    };
  }
  
  /**
   * Middleware to sanitize query parameters
   */
  static sanitizeQuery(req, res, next) {
    if (req.query && typeof req.query === 'object') {
      const sanitized = {};
      for (const key in req.query) {
        if (req.query.hasOwnProperty(key)) {
          const value = req.query[key];
          if (typeof value === 'string') {
            const sanitizedValue = InputSanitizer.sanitizeString(value, { preventSQLInjection: true });
            
            // Check if input was marked as invalid
            if (sanitizedValue && typeof sanitizedValue === 'object' && sanitizedValue.__INVALID_INPUT) {
              // SQL injection attempt detected - return 400 Bad Request
              return res.status(400).json({
                success: false,
                error: 'Invalid input detected',
                message: 'Geçersiz arama parametresi'
              });
            }
            
            sanitized[key] = sanitizedValue;
          } else {
            sanitized[key] = value;
          }
        }
      }
      req.query = sanitized;
    }
    next();
  }
  
  /**
   * Middleware to sanitize params
   */
  static sanitizeParams(req, res, next) {
    if (req.params && typeof req.params === 'object') {
      for (const key in req.params) {
        if (req.params.hasOwnProperty(key) && typeof req.params[key] === 'string') {
          const sanitizedValue = InputSanitizer.sanitizeString(req.params[key], { preventSQLInjection: true });
          
          // Check if input was marked as invalid
          if (sanitizedValue && typeof sanitizedValue === 'object' && sanitizedValue.__INVALID_INPUT) {
            // SQL injection attempt detected - return 400 Bad Request
            return res.status(400).json({
              success: false,
              error: 'Invalid input detected',
              message: 'Geçersiz parametre'
            });
          }
          
          req.params[key] = sanitizedValue;
        }
      }
    }
    next();
  }
}

module.exports = InputSanitizer;

