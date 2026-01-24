/**
 * BUSINESS PURPOSE: Formats monetary amounts for display in Turkish Lira
 * Used throughout the platform for shipment prices, carrier earnings, etc.
 * 
 * @param amount - Numeric amount to format (accepts any type, converts to number)
 * @param currency - Currency code (default: 'TRY' for Turkish Lira)
 * @returns Formatted currency string (e.g., "₺1.250,50")
 * 
 * @example
 * formatCurrency(1250.5) // "₺1.250,50"
 * formatCurrency("invalid") // "₺0,00" (safe fallback)
 */
export const formatCurrency = (
  amount: any,
  currency: string = 'TRY'
): string => {
  const n = Number(amount);
  const safe = Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currency,
  }).format(safe);
};

export const formatNumber = (number: number, decimals: number = 0): string => {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number);
};

/**
 * BUSINESS PURPOSE: Formats dates for Turkish users (shipment dates, tracking times, etc.)
 * Critical for pickup dates, delivery dates, and tracking timeline displays
 * 
 * @param date - Date input (string, number, or Date object)
 * @param format - Display format type
 *   - 'short': 15.01.2024 (most common for shipment lists)
 *   - 'long': 15 Ocak 2024 (for detailed views)  
 *   - 'time': 14:30 (for real-time tracking)
 * @returns Turkish-formatted date string
 * 
 * @example
 * formatDate('2024-01-15') // "15.01.2024"
 * formatDate(new Date(), 'long') // "15 Ocak 2024"
 * formatDate('2024-01-15T14:30:00Z', 'time') // "14:30"
 */
export const formatDate = (
  date: any,
  format: 'short' | 'long' | 'time' = 'short'
): string => {
  if (!date) return '';
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (!(dateObj instanceof Date) || !Number.isFinite(dateObj.getTime())) return '';

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
    assigned: 'Devam Ediyor',
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

/**
 * BUSINESS PURPOSE: Cleans shipment titles entered by users for display
 * Removes test data artifacts, automation strings, and invalid characters
 * Essential for professional appearance in shipment lists and tracking
 * 
 * CLEANS OUT:
 * - Test automation strings (AUTO, PW-EXCL-xxx, MCP, etc.)
 * - Development artifacts (Regression, Test, Deneme)
 * - System-generated prefixes that users shouldn't see
 * - Excessive whitespace and special characters
 * 
 * @param value - Raw shipment title input from user
 * @returns Clean, display-ready shipment title
 * 
 * @example
 * sanitizeShipmentTitle('AUTO PW-EXCL-123 Test Shipment Istanbul->Ankara') 
 * // Returns: "Istanbul->Ankara"
 * 
 * sanitizeShipmentTitle('   MCP Ultra - Elektronik Gönderim   ')
 * // Returns: "Elektronik Gönderim"
 */
export const sanitizeShipmentTitle = (value: unknown): string => {
  const raw = String(value ?? '').trim();
  if (!raw) return '';

  // Remove test automation and development artifacts
  const cleaned = raw
    .replace(/^\s*AUTO\s+PW-EXCL-\d+\s*/i, '')           // Remove automation prefixes
    .replace(/\bPW-EXCL-\d+\b/gi, '')                     // Remove test exclusion IDs
    .replace(/^\s*MCP(\s+Ultra)?\s*-\s*/i, '')            // Remove MCP system prefixes
    .replace(/^\s*MCP\s+/i, '')
    .replace(/^\s*Ultra\s*[-\u2010\u2011\u2012\u2013\u2014\u2212:]\s*/i, '')
    .replace(/^\s*Ultra\b\s*/i, '')
    .replace(/^\s*Kapsamlı\s+İş\s+Akışı\s+Testi\s*-\s*/i, '') // Remove test workflow strings
    .replace(/^\s*4-Panel\s+Flow\s*/i, '')                // Remove UI test artifacts
    .replace(/\bUI\s+Regression\s+Shipment\b/gi, '')      // Remove regression test strings
    .replace(/\bComms\/Tracking\b/gi, '')                 // Remove system component names
    .replace(/\bRegression\b/gi, '')                      // Remove "Regression" words
    .replace(/\bShipment\b/gi, '')                        // Remove redundant "Shipment" word
    .replace(/\bTest\b/gi, '')                            // Remove "Test" words
    .replace(/\bDeneme\b/gi, '')                          // Remove "Deneme" (Turkish test)
    .replace(/\bWorkflow\b/gi, '')                        // Remove "Workflow" words
    .replace(/^\s*[-\u2010\u2011\u2012\u2013\u2014\u2212]\s*/i, '') // Remove leading dashes
    .replace(/\s+/g, ' ')                                 // Normalize whitespace
    .trim();

  if (!cleaned) return 'Gönderi';
  if (/^individual\s+shipment$/i.test(cleaned)) return 'Genel Gönderi';
  if (/^shipment$/i.test(cleaned)) return 'Gönderi';

  return cleaned;
};

export const sanitizeMessageText = (value: unknown): string => {
  const raw = String(value ?? '').trim();
  if (!raw) return '';

  const cleaned = raw
    .replace(/\bmesajla(?:s|ş)ma\s+sistemi\s+test\s+ediliyor\b\.?/gi, '')
    .replace(/\bmesajla(?:s|ş)ma\s+sistemi\s+ediliyor\b\.?/gi, '')
    .replace(/\bkapsamlı\s+iş\s+akışı\s+testi\s+devam\s+ediyor\b\.?/gi, '')
    .replace(/\bmesaj\s+testi\b/gi, '')
    .replace(/\breceiver\s+auto\s*\d*\b/gi, '')
    .replace(/\(\s*fix\d+\s*\)/gi, '')
    .replace(/^\s*(E2E)\s*[:\-–—]\s*/i, '')
    .replace(/^\s*(Test|Deneme)\s+(Mesaj[ıi]?|Message)\s*[:\-–—]\s*/i, '')
    .replace(/^\s*(Test|Deneme)\s*[:\-–—]\s*/i, '')
    .replace(/^\s*MCP\s*[:\-–—]\s*/i, '')
    .replace(/^\s*(AUTO\s+)?PW-EXCL-\d+\s*[:\-–—]?\s*/i, '')
    .replace(/\bPW-EXCL-\d+\b/gi, '')
    .replace(/\b(E2E|MCP|Regression)\b/gi, '')
    .replace(/\btest\b/gi, '')
    .replace(/\bdeneme\b/gi, '')
    .replace(/\btest\s+ediliyor\b\.?/gi, '')
    .replace(/\(\s*\)/g, '')
    .replace(/\s*[-–—]+\s*$/g, '')
    .replace(/\.\s*#/g, ' #')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return '';
  if (/^mesaj(\s*\([^)]*\))?\s*[:\-–—]*$/i.test(cleaned)) return '';

  return cleaned;
};

export const sanitizeAddressLabel = (value: unknown): string => {
  const raw = String(value ?? '').trim();
  if (!raw) return '';

  const cleaned = raw
    .replace(/\bPW-EXCL-\d+\b/gi, '')
    .replace(/\bAUTO\b/gi, '')
    .replace(/\bMCP\b/gi, '')
    .replace(/\bTest\b/gi, '')
    .replace(/\bDeneme\b/gi, '')
    .replace(/\bRegression\b/gi, '')
    .replace(/\bShipment\b/gi, '')
    .replace(/\bpickup\b/gi, 'Alım')
    .replace(/\bdelivery\b/gi, 'Teslim')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return '';
  if (/^(Alım|Teslim)$/i.test(cleaned)) return '';

  return cleaned;
};









