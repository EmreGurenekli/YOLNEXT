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

  // PostgreSQL validation hatası
  if (error.code === '23502') { // NOT NULL violation
    apiError = new ValidationError('Zorunlu alanlar eksik', { field: error.column });
  }

  if (error.code === '23503') { // Foreign key violation
    apiError = new ValidationError('İlişkili kayıt bulunamadı', { constraint: error.constraint });
  }

  if (error.code === '23505') { // Unique violation
    apiError = new ConflictError('Bu kayıt zaten mevcut', { constraint: error.constraint });
  }

  if (error.code === '23514') { // Check violation
    apiError = new ValidationError('Veri kısıtlaması ihlali', { constraint: error.constraint });
  }

  // PostgreSQL syntax/type errors
  if (error.code === '22P02' || error.code === '42703') { // Invalid input syntax / Undefined column
    apiError = new ValidationError('Geçersiz veri formatı', { column: error.column });
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

  // PostgreSQL connection errors
  if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
    apiError = new DatabaseError('Veritabanı bağlantı hatası');
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

