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
      'Network request failed': 'Bağlantı hatası tespit edildi. Lütfen internet bağlantınızı kontrol ederek işlemi yeniden deneyiniz.',
      'Failed to fetch': 'Sunucu ile bağlantı kurulamadı. Sistem yöneticilerimiz sorunu çözmek için çalışıyor, lütfen birkaç dakika sonra tekrar deneyiniz.',
      'Unauthorized': 'Oturum güvenliği nedeniyle yetkilendirmeniz sona ermiştir. Güvenli erişim için lütfen sisteme yeniden giriş yapınız.',
      'Forbidden': 'Bu işlemi gerçekleştirmek için yeterli yetkiniz bulunmamaktadır. Erişim yetkileriniz hakkında bilgi almak için destek ekibimizle iletişime geçiniz.',
      'Not Found': 'Aradığınız kayıt sistemimizde mevcut değildir. Lütfen bilgilerinizi kontrol ederek yeniden deneyiniz.',
      'Internal Server Error': 'Sistemsel bir sorun tespit edilmiştir. Teknik ekibimiz konuyla ilgileniyor, lütfen kısa süre sonra işleminizi tekrar deneyiniz.',
      'Bad Request': 'Girilen bilgilerde hatalı veriler tespit edilmiştir. Lütfen formu kontrol ederek eksik veya hatalı alanları düzeltiniz.',
      'Conflict': 'Bu işlem daha önce tamamlanmış veya aynı anda başka bir işlemle çakışma yaşanmaktadır. Lütfen sayfayı yenileyerek tekrar deneyiniz.',
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






















