export type ConsentCategory = 'necessary' | 'analytics';

export type CookieConsentState = {
  version: string;
  ts: number;
  necessary: true;
  analytics: boolean;
};

const STORAGE_KEY = 'cookieConsent';
const CONSENT_VERSION = 'v1';

export function getConsentVersion(): string {
  return CONSENT_VERSION;
}

export function getCookieConsent(): CookieConsentState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CookieConsentState>;
    if (!parsed || typeof parsed !== 'object') return null;
    if (parsed.version !== CONSENT_VERSION) return null;
    if (parsed.necessary !== true) return null;
    if (typeof parsed.analytics !== 'boolean') return null;
    if (typeof parsed.ts !== 'number') return null;
    return {
      version: CONSENT_VERSION,
      ts: parsed.ts,
      necessary: true,
      analytics: parsed.analytics,
    };
  } catch {
    return null;
  }
}

export function setCookieConsent(next: { analytics: boolean }): CookieConsentState {
  const state: CookieConsentState = {
    version: CONSENT_VERSION,
    ts: Date.now(),
    necessary: true,
    analytics: Boolean(next.analytics),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
  return state;
}

export function clearCookieConsent(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function hasAnalyticsConsent(): boolean {
  const c = getCookieConsent();
  return Boolean(c?.analytics);
}









