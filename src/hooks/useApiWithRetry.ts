import { useState, useCallback, useRef, useEffect } from 'react';
import { ApiError } from '../services/api';

interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

interface UseApiWithRetryReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  execute: (...args: any[]) => Promise<T | null>;
  retry: () => Promise<void>;
  reset: () => void;
}

const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
};

export const useApiWithRetry = <T = any>(
  apiFunction: (...args: any[]) => Promise<T>,
  retryConfig: Partial<RetryConfig> = {}
): UseApiWithRetryReturn<T> => {
  const config = { ...defaultRetryConfig, ...retryConfig };
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const retryCountRef = useRef(0);
  const lastArgsRef = useRef<any[]>([]);

  const calculateDelay = (attempt: number): number => {
    const delay = config.initialDelay * Math.pow(config.backoffFactor, attempt);
    return Math.min(delay, config.maxDelay);
  };

  const executeWithRetry = useCallback(
    async (...args: any[]): Promise<T | null> => {
      lastArgsRef.current = args;
      retryCountRef.current = 0;
      setLoading(true);
      setError(null);

      while (retryCountRef.current <= config.maxRetries) {
        try {
          const result = await apiFunction(...args);
          setData(result);
          setError(null);
          retryCountRef.current = 0;
          return result;
        } catch (err) {
          const error = err as Error;

          // Don't retry for certain error types
          if (
            error instanceof ApiError &&
            (error.status === 400 || // Bad Request
              error.status === 401 || // Unauthorized
              error.status === 403 || // Forbidden
              error.status === 404) // Not Found
          ) {
            setError(error);
            setLoading(false);
            return null;
          }

          retryCountRef.current++;

          if (retryCountRef.current > config.maxRetries) {
            setError(error);
            setLoading(false);
            return null;
          }

          // Wait before retry
          const delay = calculateDelay(retryCountRef.current - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      setLoading(false);
      return null;
    },
    [apiFunction, config]
  );

  const retry = useCallback(async () => {
    if (lastArgsRef.current.length > 0) {
      await executeWithRetry(...lastArgsRef.current);
    }
  }, [executeWithRetry]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
    retryCountRef.current = 0;
    lastArgsRef.current = [];
  }, []);

  return {
    data,
    loading,
    error,
    execute: executeWithRetry,
    retry,
    reset,
  };
};

// Hook for handling network status
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    if (wasOffline) {
      // Trigger a page refresh or data refetch when coming back online
      window.location.reload();
    }
  }, [wasOffline]);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    setWasOffline(true);
  }, []);

  // Set up event listeners
  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return { isOnline, wasOffline };
};

// Hook for handling API errors with user feedback
export const useApiErrorHandler = () => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);

  const handleError = useCallback((error: Error) => {
    let message = 'Bir hata oluştu. Lütfen tekrar deneyin.';

    if (error instanceof ApiError) {
      switch (error.status) {
        case 0:
          message = 'İnternet bağlantınızı kontrol edin.';
          break;
        case 400:
          message = 'Geçersiz istek. Lütfen verilerinizi kontrol edin.';
          break;
        case 401:
          message = 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.';
          break;
        case 403:
          message = 'Bu işlem için yetkiniz bulunmuyor.';
          break;
        case 404:
          message = 'Aranan kaynak bulunamadı.';
          break;
        case 408:
          message = 'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.';
          break;
        case 429:
          message = 'Çok fazla istek gönderdiniz. Lütfen bekleyin.';
          break;
        case 500:
          message = 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.';
          break;
        case 503:
          message = 'Servis geçici olarak kullanılamıyor.';
          break;
        default:
          message = `Bir hata oluştu (${error.status}). Lütfen tekrar deneyin.`;
      }
    } else if (error.message.includes('fetch')) {
      message = 'İnternet bağlantınızı kontrol edin.';
    } else if (error.message.includes('timeout')) {
      message = 'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.';
    }

    setErrorMessage(message);
    setShowError(true);

    // Auto-hide error after 5 seconds
    setTimeout(() => {
      setShowError(false);
      setErrorMessage(null);
    }, 5000);
  }, []);

  const clearError = useCallback(() => {
    setShowError(false);
    setErrorMessage(null);
  }, []);

  return {
    errorMessage,
    showError,
    handleError,
    clearError,
  };
};
