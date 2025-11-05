// Error handling utilities
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

export class AppError extends Error {
  public status: number;
  public code: string;
  public details: any;

  constructor(
    message: string,
    status: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: any
  ) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const handleApiError = (error: any): ApiError => {
  // Only log in development
  if (import.meta.env.DEV) {
    console.error('API Error:', error);
  }

  if (error instanceof AppError) {
    return {
      message: error.message,
      status: error.status,
      code: error.code,
      details: error.details,
    };
  }

  if (error.response) {
    // Axios error
    return {
      message: error.response.data?.message || 'Sunucu hatası oluştu',
      status: error.response.status,
      code: error.response.data?.code || 'API_ERROR',
      details: error.response.data?.details,
    };
  }

  if (error.request) {
    // Network error
    return {
      message: 'Sunucuya bağlanılamıyor. İnternet bağlantınızı kontrol edin.',
      status: 0,
      code: 'NETWORK_ERROR',
    };
  }

  // Generic error
  return {
    message: error.message || 'Beklenmeyen bir hata oluştu',
    status: 500,
    code: 'UNKNOWN_ERROR',
  };
};

export const getErrorMessage = (error: ApiError): string => {
  const errorMessages: { [key: string]: string } = {
    NETWORK_ERROR:
      'Sunucuya bağlanılamıyor. İnternet bağlantınızı kontrol edin.',
    UNAUTHORIZED: 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.',
    FORBIDDEN: 'Bu işlem için yetkiniz bulunmuyor.',
    NOT_FOUND: 'Aradığınız kaynak bulunamadı.',
    VALIDATION_ERROR: 'Girilen bilgilerde hata var. Lütfen kontrol edin.',
    DUPLICATE_ERROR: 'Bu kayıt zaten mevcut.',
    RATE_LIMIT: 'Çok fazla istek gönderdiniz. Lütfen bekleyin.',
    SERVER_ERROR: 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.',
    TIMEOUT: 'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.',
    UNKNOWN_ERROR: 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.',
  };

  const code = error.code || 'UNKNOWN_ERROR';
  return errorMessages[code as keyof typeof errorMessages] || error.message;
};

export const getErrorSeverity = (
  error: ApiError
): 'low' | 'medium' | 'high' => {
  if (error.status && error.status >= 500) return 'high';
  if (error.status && error.status >= 400) return 'medium';
  return 'low';
};

export const shouldRetry = (error: ApiError): boolean => {
  // Network errors and 5xx errors should be retried
  return (
    error.code === 'NETWORK_ERROR' ||
    (error.status !== undefined && error.status >= 500 && error.status < 600)
  );
};

export const getRetryDelay = (attempt: number): number => {
  // Exponential backoff: 1s, 2s, 4s, 8s, 16s
  return Math.min(1000 * Math.pow(2, attempt), 16000);
};

// Error boundary helper
export const logError = (error: Error, errorInfo?: any) => {
  console.error('Error Boundary caught an error:', error, errorInfo);

  // In production, you might want to send this to an error reporting service
  if (process.env.NODE_ENV === 'production') {
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }
};

// Form validation error helper
export const getFieldError = (
  errors: { [key: string]: string },
  fieldName: string
): string | undefined => {
  return errors[fieldName];
};

// API response helper
export const handleApiResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new AppError(
      errorData.message || `HTTP ${response.status}`,
      response.status,
      errorData.code || 'API_ERROR',
      errorData.details
    );
  }

  return response.json();
};

// Loading state helper
export const withLoading = async <T>(
  asyncFn: () => Promise<T>,
  setLoading: (loading: boolean) => void
): Promise<T> => {
  try {
    setLoading(true);
    return await asyncFn();
  } finally {
    setLoading(false);
  }
};

// Retry helper
export const withRetry = async <T>(
  asyncFn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> => {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await asyncFn();
    } catch (error) {
      lastError = error;
      const apiError = handleApiError(error);

      if (attempt === maxRetries || !shouldRetry(apiError)) {
        throw error;
      }

      const delay = getRetryDelay(attempt);
      if (import.meta.env.DEV) {
        console.log(`Retry attempt ${attempt + 1} in ${delay}ms`);
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};
