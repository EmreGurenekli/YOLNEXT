class ApiError extends Error {
  constructor(statusCode, message, code, details = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp
    };
  }
}

// Önceden tanımlanmış hatalar
class ValidationError extends ApiError {
  constructor(message, details = null) {
    super(400, message, 'VALIDATION_ERROR', details);
  }
}

class AuthenticationError extends ApiError {
  constructor(message = 'Kimlik doğrulama gerekli') {
    super(401, message, 'AUTHENTICATION_ERROR');
  }
}

class AuthorizationError extends ApiError {
  constructor(message = 'Bu işlem için yetkiniz yok') {
    super(403, message, 'AUTHORIZATION_ERROR');
  }
}

class NotFoundError extends ApiError {
  constructor(resource = 'Kaynak') {
    super(404, `${resource} bulunamadı`, 'NOT_FOUND_ERROR');
  }
}

class ConflictError extends ApiError {
  constructor(message, details = null) {
    super(409, message, 'CONFLICT_ERROR', details);
  }
}

class RateLimitError extends ApiError {
  constructor(message = 'Çok fazla istek gönderildi') {
    super(429, message, 'RATE_LIMIT_ERROR');
  }
}

class DatabaseError extends ApiError {
  constructor(message = 'Veritabanı hatası', details = null) {
    super(500, message, 'DATABASE_ERROR', details);
  }
}

class ExternalServiceError extends ApiError {
  constructor(service, message = 'Dış servis hatası', details = null) {
    super(502, `${service}: ${message}`, 'EXTERNAL_SERVICE_ERROR', details);
  }
}

class PaymentError extends ApiError {
  constructor(message, details = null) {
    super(402, message, 'PAYMENT_ERROR', details);
  }
}

class FileUploadError extends ApiError {
  constructor(message, details = null) {
    super(413, message, 'FILE_UPLOAD_ERROR', details);
  }
}

// Hata işleme middleware'i
const errorHandler = (error, req, res, next) => {
  let apiError = error;

  // Mongoose validation hatası
  if (error.name === 'ValidationError') {
    const details = Object.values(error.errors).map(err => ({
      field: err.path,
      message: err.message
    }));
    apiError = new ValidationError('Geçersiz veri', details);
  }

  // JWT hatası
  if (error.name === 'JsonWebTokenError') {
    apiError = new AuthenticationError('Geçersiz token');
  }

  if (error.name === 'TokenExpiredError') {
    apiError = new AuthenticationError('Token süresi dolmuş');
  }

  // Multer hatası
  if (error.code === 'LIMIT_FILE_SIZE') {
    apiError = new FileUploadError('Dosya boyutu çok büyük');
  }

  if (error.code === 'LIMIT_FILE_COUNT') {
    apiError = new FileUploadError('Çok fazla dosya yüklendi');
  }

  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    apiError = new FileUploadError('Beklenmeyen dosya alanı');
  }

  // SQLite hatası
  if (error.code === 'SQLITE_CONSTRAINT') {
    if (error.message.includes('UNIQUE')) {
      apiError = new ConflictError('Bu kayıt zaten mevcut');
    } else {
      apiError = new DatabaseError('Veritabanı kısıtlaması ihlali');
    }
  }

  // Eğer ApiError değilse, genel sunucu hatası yap
  if (!(apiError instanceof ApiError)) {
    apiError = new ApiError(
      500,
      process.env.NODE_ENV === 'production' ? 'Sunucu hatası' : error.message,
      'INTERNAL_SERVER_ERROR',
      process.env.NODE_ENV === 'development' ? error.stack : null
    );
  }

  // Log hatası
  console.error('API Error:', {
    message: apiError.message,
    code: apiError.code,
    statusCode: apiError.statusCode,
    stack: apiError.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Yanıt gönder
  res.status(apiError.statusCode).json({
    success: false,
    message: apiError.message,
    code: apiError.code,
    ...(apiError.details && { details: apiError.details })
  });
};

// Async hata yakalama wrapper'ı
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Hata oluşturma yardımcı fonksiyonları
const createError = {
  validation: (message, details) => new ValidationError(message, details),
  auth: (message) => new AuthenticationError(message),
  forbidden: (message) => new AuthorizationError(message),
  notFound: (resource) => new NotFoundError(resource),
  conflict: (message, details) => new ConflictError(message, details),
  rateLimit: (message) => new RateLimitError(message),
  database: (message, details) => new DatabaseError(message, details),
  external: (service, message, details) => new ExternalServiceError(service, message, details),
  payment: (message, details) => new PaymentError(message, details),
  fileUpload: (message, details) => new FileUploadError(message, details)
};

module.exports = {
  ApiError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  ExternalServiceError,
  PaymentError,
  FileUploadError,
  errorHandler,
  asyncHandler,
  createError
};



