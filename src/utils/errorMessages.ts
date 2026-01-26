export const getErrorMessage = (error: any, defaultMessage: string): string => {
  if (!error) return defaultMessage;

  if (typeof error === 'string') {
    return error;
  }

  if (error.message) {
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

    for (const [key, value] of Object.entries(errorMap)) {
      if (error.message.includes(key)) {
        return value;
      }
    }

    if (error.message.length < 100 && !error.message.includes('Error:') && !error.message.includes('at ')) {
      return error.message;
    }
  }

  if (error.details) {
    return typeof error.details === 'string' ? error.details : defaultMessage;
  }

  if (error.response?.data?.message) {
    return error.response.data.message;
  }

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
