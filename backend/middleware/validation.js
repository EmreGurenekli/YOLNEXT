const { body, param, query, validationResult } = require('express-validator');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// User validation rules
const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('userType')
    .isIn(['individual', 'corporate', 'nakliyeci', 'tasiyici'])
    .withMessage('Valid user type is required'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  handleValidationErrors
];

const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Shipment validation rules
const validateShipmentCreation = [
  body('mainCategory')
    .isIn(['house_move', 'office_move', 'furniture', 'electronics', 'other'])
    .withMessage('Valid main category is required'),
  body('productDescription')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Product description must be between 10 and 500 characters'),
  body('pickupCity')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Pickup city is required'),
  body('deliveryCity')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Delivery city is required'),
  body('pickupDate')
    .isISO8601()
    .withMessage('Valid pickup date is required'),
  body('deliveryDate')
    .isISO8601()
    .withMessage('Valid delivery date is required'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('contactPerson')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Contact person name is required'),
  // Türkiye GSM formatı: 05XXXXXXXXX veya +90 5XXXXXXXXX
  body('phone')
    .matches(/^(\+90\s?)?05\d{9}$/)
    .withMessage('Telefon numarası 05XXXXXXXXX formatında olmalıdır'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  handleValidationErrors
];

// Offer validation rules
const validateOfferCreation = [
  body('shipment_id')
    .isInt({ min: 1 })
    .withMessage('Valid shipment ID is required'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('message')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Message must not exceed 500 characters'),
  handleValidationErrors
];

// Message validation rules
const validateMessageCreation = [
  body('receiver_id')
    .isInt({ min: 1 })
    .withMessage('Valid receiver ID is required'),
  body('message')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters'),
  handleValidationErrors
];

// ID parameter validation
const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid ID is required'),
  handleValidationErrors
];

// Query parameter validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

// Sanitization middleware
const sanitizeInput = (req, res, next) => {
  // Remove any potential XSS attempts
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .trim();
  };

  // Sanitize all string fields in body
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeString(req.body[key]);
      }
    }
  }

  // Sanitize query parameters
  if (req.query) {
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeString(req.query[key]);
      }
    }
  }

  next();
};

module.exports = {
  // TR yardımcı doğrulayıcılar
  validateTRPhone: (field = 'phone') => [
    body(field)
      .matches(/^(\+90\s?)?05\d{9}$/)
      .withMessage('Telefon numarası 05XXXXXXXXX formatında olmalıdır'),
    handleValidationErrors
  ],
  validateTCKN: (field = 'tckn') => [
    body(field)
      .matches(/^\d{11}$/)
      .custom(value => {
        // Basit TCKN kontrolü (ilk hane 0 olamaz, checksum basit)
        if (!value || value[0] === '0') return false;
        const digits = value.split('').map(Number);
        const q1 = (
          (7 * (digits[0] + digits[2] + digits[4] + digits[6] + digits[8]) -
            (digits[1] + digits[3] + digits[5] + digits[7])) %
          10
        );
        const q2 = (digits.slice(0, 10).reduce((a, b) => a + b, 0)) % 10;
        return digits[9] === q1 && digits[10] === q2;
      })
      .withMessage('Geçerli bir TCKN giriniz'),
    handleValidationErrors
  ],
  validateVKN: (field = 'vkn') => [
    body(field)
      .matches(/^\d{10}$/)
      .withMessage('Vergi numarası 10 haneli olmalıdır'),
    handleValidationErrors
  ],
  validateUserRegistration,
  validateUserLogin,
  validateShipmentCreation,
  validateOfferCreation,
  validateMessageCreation,
  validateId,
  validatePagination,
  sanitizeInput,
  handleValidationErrors
};
