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
        throw new Error('Invalid input detected');
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
          sanitized[key] = this.sanitizeString(value, fieldSchema.options || {});
        } else if (fieldSchema.type === 'email') {
          sanitized[key] = this.sanitizeEmail(value);
        } else if (fieldSchema.type === 'phone') {
          sanitized[key] = this.sanitizePhone(value);
        } else if (fieldSchema.type === 'number') {
          sanitized[key] = this.sanitizeNumber(value, fieldSchema.options || {});
        } else if (fieldSchema.type === 'object' && typeof value === 'object') {
          sanitized[key] = this.sanitizeObject(value, fieldSchema.schema || {});
        } else {
          sanitized[key] = value;
        }
      } else {
        // Default: sanitize as string if string, keep others
        if (typeof value === 'string') {
          sanitized[key] = this.sanitizeString(value);
        } else if (typeof value === 'object' && value !== null) {
          sanitized[key] = this.sanitizeObject(value);
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
        req.body = this.sanitizeObject(req.body, schema);
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
            sanitized[key] = this.sanitizeString(value, { preventSQLInjection: true });
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
          req.params[key] = this.sanitizeString(req.params[key], { preventSQLInjection: true });
        }
      }
    }
    next();
  }
}

module.exports = InputSanitizer;

