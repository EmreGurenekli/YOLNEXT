// Currency formatting
export const formatCurrency = (
  amount: number,
  currency: string = 'TRY'
): string => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const formatNumber = (number: number, decimals: number = 0): string => {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number);
};

// Date formatting
export const formatDate = (
  date: string | Date,
  format: 'short' | 'long' | 'time' = 'short'
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const options: Intl.DateTimeFormatOptions = {
    short: { day: '2-digit', month: '2-digit', year: 'numeric' },
    long: { day: '2-digit', month: 'long', year: 'numeric' },
    time: { hour: '2-digit', minute: '2-digit' },
  }[format] as Intl.DateTimeFormatOptions;

  return new Intl.DateTimeFormat('tr-TR', options).format(dateObj);
};

export const formatDateTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
};

export const formatRelativeTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Az önce';
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)} dakika önce`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} saat önce`;
  if (diffInSeconds < 2592000)
    return `${Math.floor(diffInSeconds / 86400)} gün önce`;
  if (diffInSeconds < 31536000)
    return `${Math.floor(diffInSeconds / 2592000)} ay önce`;
  return `${Math.floor(diffInSeconds / 31536000)} yıl önce`;
};

// Text formatting
export const capitalize = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export const capitalizeWords = (text: string): string => {
  return text
    .split(' ')
    .map(word => capitalize(word))
    .join(' ');
};

export const truncateText = (
  text: string,
  maxLength: number,
  suffix: string = '...'
): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
};

export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

// Phone number formatting
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
  }
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{1})(\d{3})(\d{3})(\d{4})/, '$1 $2 $3 $4');
  }
  return phone;
};

// File size formatting
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Percentage formatting
export const formatPercentage = (
  value: number,
  decimals: number = 1
): string => {
  return `${value.toFixed(decimals)}%`;
};

// Distance formatting
export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
};

// Weight formatting
export const formatWeight = (grams: number): string => {
  if (grams < 1000) {
    return `${grams} g`;
  }
  return `${(grams / 1000).toFixed(1)} kg`;
};

// Volume formatting
export const formatVolume = (cubicMeters: number): string => {
  if (cubicMeters < 1) {
    return `${(cubicMeters * 1000).toFixed(0)} L`;
  }
  return `${cubicMeters.toFixed(1)} m³`;
};

// Rating formatting
export const formatRating = (rating: number, maxRating: number = 5): string => {
  return `${rating.toFixed(1)}/${maxRating}`;
};

// Status formatting
export const formatStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: 'Beklemede',
    accepted: 'Kabul Edildi',
    rejected: 'Reddedildi',
    in_progress: 'Devam Ediyor',
    completed: 'Tamamlandı',
    cancelled: 'İptal Edildi',
    active: 'Aktif',
    inactive: 'Pasif',
    maintenance: 'Bakımda',
    available: 'Müsait',
    assigned: 'Atanmış',
    delivered: 'Teslim Edildi',
    preparing: 'Hazırlanıyor',
    waiting: 'Bekliyor',
    in_transit: 'Yolda',
  };

  return statusMap[status] || capitalize(status);
};

// Color formatting
export const hexToRgb = (
  hex: string
): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

export const rgbToHex = (r: number, g: number, b: number): string => {
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

// URL formatting
export const formatUrl = (url: string): string => {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
};

// Email formatting
export const formatEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

// Address formatting
export const formatAddress = (address: {
  street?: string;
  district?: string;
  city?: string;
  country?: string;
}): string => {
  const parts = [
    address.street,
    address.district,
    address.city,
    address.country,
  ].filter(Boolean);

  return parts.join(', ');
};
