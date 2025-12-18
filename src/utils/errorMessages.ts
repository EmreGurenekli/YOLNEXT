// Error message utility functions
export const getErrorMessage = (error: any, defaultMessage: string): string => {
  if (!error) return defaultMessage;

  // If error is a string, return it
  if (typeof error === 'string') {
    return error;
  }

  // If error has a message property
  if (error.message) {
    // Map common error messages to user-friendly Turkish messages
    const errorMap: Record<string, string> = {
      'Network request failed': 'İnternet bağlantısı yok. Lütfen bağlantınızı kontrol edin.',
      'Failed to fetch': 'Sunucuya bağlanılamadı. Lütfen tekrar deneyin.',
      'Unauthorized': 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.',
      'Forbidden': 'Bu işlemi yapma yetkiniz yok.',
      'Not Found': 'İstenen kayıt bulunamadı.',
      'Internal Server Error': 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.',
      'Bad Request': 'Geçersiz istek. Lütfen bilgilerinizi kontrol edin.',
      'Conflict': 'Bu işlem zaten yapılmış veya çakışma var.',
    };

    // Check if error message matches any in the map
    for (const [key, value] of Object.entries(errorMap)) {
      if (error.message.includes(key)) {
        return value;
      }
    }

    // Return the error message if it's in Turkish or seems user-friendly
    if (error.message.length < 100 && !error.message.includes('Error:') && !error.message.includes('at ')) {
      return error.message;
    }
  }

  // If error has a details property
  if (error.details) {
    return typeof error.details === 'string' ? error.details : defaultMessage;
  }

  // If error has a response with data
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  // Default fallback
  return defaultMessage;
};

export const getErrorDetails = (error: any): string | null => {
  if (!error) return null;

  if (error.details && typeof error.details === 'string') {
    return error.details;
  }

  if (error.response?.data?.details) {
    return error.response.data.details;
  }

  return null;
};












