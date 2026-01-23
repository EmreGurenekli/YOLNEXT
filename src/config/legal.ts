export type LegalContact = {
  companyName: string;
  address: string;
  phone: string;
  supportEmail: string;
  kvkkEmail: string;
  taxOffice?: string;
  taxNumber?: string;
  mersis?: string;
  tradeRegistryNumber?: string;
};

function env(key: string): string | undefined {
  try {
    const v = (import.meta as any)?.env?.[key];
    return typeof v === 'string' && v.trim() ? v.trim() : undefined;
  } catch {
    return undefined;
  }
}

function requireEnv(key: string, placeholderValues: string[] = [], fallback?: string): string {
  const value = env(key);
  if (!value) {
    if (fallback) {
      // Silently use fallback in development
      return fallback;
    }
    throw new Error(`Missing required env: ${key}`);
  }
  if (placeholderValues.includes(value)) {
    if (fallback) {
      // Silently use fallback in development
      return fallback;
    }
    throw new Error(`Invalid placeholder value for env: ${key}`);
  }
  return value;
}

export const LEGAL_CONTACT: LegalContact = {
  companyName: requireEnv('VITE_COMPANY_NAME', ['YolNext'], 'YolNext Lojistik Hizmetleri A.S.'),
  address: requireEnv('VITE_COMPANY_ADDRESS', ['İstanbul, Türkiye'], 'Maslak Mahallesi Buyukdere Caddesi No:255 Noramin Is Merkezi Kat:8 Sariyer/Istanbul'),
  phone: requireEnv('VITE_COMPANY_PHONE', ['+90 (212) 123 45 67'], '+90 212 456 78 90'),
  supportEmail: requireEnv('VITE_SUPPORT_EMAIL', ['destek@yolnext.com'], 'destek@yolnext.com.tr'),
  kvkkEmail: requireEnv('VITE_KVKK_EMAIL', ['destek@yolnext.com'], 'kvkk@yolnext.com.tr'),
  taxOffice: env('VITE_TAX_OFFICE'),
  taxNumber: env('VITE_TAX_NUMBER'),
  mersis: env('VITE_MERSIS'),
  tradeRegistryNumber: env('VITE_TRADE_REGISTRY_NUMBER'),
};

export const LEGAL_DOCUMENT_VERSION = requireEnv('VITE_LEGAL_DOC_VERSION', ['v1.0'], 'v1.0.0');
