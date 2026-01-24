import { useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';
export interface ErrorInfo {
  message: string;
  code?: string;
  status?: number;
  details?: any;
  timestamp: string;
}

export interface ErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  fallbackMessage?: string;
}

export const useErrorHandler = () => {
  const { showToast } = useToast();
  
  const handleError = useCallback(
    (error: any, options: ErrorHandlerOptions = {}) => {
      const {
        showToast: shouldShowToast = true,        logError = true,
        fallbackMessage = 'Beklenmeyen bir hata oluştu',
      } = options;

      // Extract error information
      const errorInfo: ErrorInfo = {
        message: error?.message || error?.error || fallbackMessage,
        code: error?.code || error?.status?.toString(),
        status: error?.status || error?.response?.status,
        details: error?.response?.data || error?.details,
        timestamp: new Date().toISOString(),
      };

      // Log error to console in development
      if (logError && process.env.NODE_ENV === 'development') {
        console.error('Hata işlendi:', errorInfo);
        console.error('Hata detayı:', error);
      }

      // Show toast notification
      if (shouldShowToast) {
        const message = getErrorMessage(errorInfo);
        showToast({
          type: 'error',
          title: 'Hata',
          message: message,
          duration: 5000,        });
      }

      // In production, you might want to send errors to an external service
      if (logError && process.env.NODE_ENV === 'production') {
        // sendErrorToService(errorInfo);
      }

      return errorInfo;
    },
    []
  );

  const handleApiError = useCallback(
    (error: any) => {
      let message = 'API hatası oluştu';

      if (error?.response?.data?.message) {
        message = error.response.data.message;
      } else if (error?.response?.status) {
        switch (error.response.status) {
          case 400:
            message = 'Geçersiz istek';
            break;
          case 401:
            message = 'Oturum süreniz dolmuş, lütfen tekrar giriş yapın';
            break;
          case 403:
            message = 'Bu işlem için yetkiniz bulunmuyor';
            break;
          case 404:
            message = 'Aranan kaynak bulunamadı';
            break;
          case 422:
            message = 'Gönderilen veriler geçersiz';
            break;
          case 429:
            message = 'Çok fazla istek gönderildi, lütfen bekleyin';
            break;
          case 500:
            message = 'Sunucu hatası oluştu';
            break;
          case 502:
          case 503:
          case 504:
            message = 'Sunucu geçici olarak kullanılamıyor';
            break;
          default:
            message = `HTTP ${error.response.status} hatası`;
        }
      } else if (error?.message) {
        message = error.message;
      }

      return handleError(
        {
          ...error,
          message,
        },
        {
          showToast: true,
          logError: true,
        }
      );
    },
    [handleError]
  );

  const handleNetworkError = useCallback(
    (error: any) => {
      return handleError(
        {
          ...error,
          message: 'İnternet bağlantınızı kontrol edin',
        },
        {
          showToast: true,
          logError: true,
        }
      );
    },
    [handleError]
  );

  const handleValidationError = useCallback(
    (error: any) => {
      return handleError(
        {
          ...error,
          message: 'Form verilerinde hata var, lütfen kontrol edin',
        },
        {
          showToast: true,
          logError: false,
        }
      );
    },
    [handleError]
  );

  return {
    handleError,
    handleApiError,
    handleNetworkError,
    handleValidationError,
  };
};

const getErrorMessage = (errorInfo: ErrorInfo): string => {
  // Customize error messages based on error type
  if (errorInfo.status === 401) {
    return 'Oturum süreniz dolmuş, lütfen tekrar giriş yapın';
  }

  if (errorInfo.status === 403) {
    return 'Bu işlem için yetkiniz bulunmuyor';
  }

  if (errorInfo.status === 404) {
    return 'Aranan kaynak bulunamadı';
  }

  if (errorInfo.status === 422) {
    return 'Gönderilen veriler geçersiz';
  }

  if (errorInfo.status && errorInfo.status >= 500) {
    return 'Sunucu hatası oluştu, lütfen daha sonra tekrar deneyin';
  }

  return errorInfo.message;
};








