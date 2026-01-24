import { createApiUrl } from '../config/api';
import { hasAnalyticsConsent } from '../utils/cookieConsent';

type AnalyticsPayload = Record<string, any>;

function safeJsonParse<T>(value: string | null, fallback: T): T {
  try {
    if (!value) return fallback;
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function getOrCreateAbVariant(key: string, variants: string[] = ['A', 'B']): string {
  if (!hasAnalyticsConsent()) return 'A';
  const existing = safeJsonParse<{ v?: string }>(localStorage.getItem(key), {}).v;
  if (existing && variants.includes(existing)) return existing;

  const v = variants[Math.floor(Math.random() * variants.length)] || 'A';
  try {
    localStorage.setItem(key, JSON.stringify({ v, ts: Date.now() }));
  } catch {
    // ignore
  }
  return v;
}

async function postEvent(event: string, data?: AnalyticsPayload) {
  if (!hasAnalyticsConsent()) return;
  const payload = {
    event,
    data: data || {},
    ts: Date.now(),
    path: window.location.pathname,
    href: window.location.href,
    referrer: document.referrer || '',
    ua: navigator.userAgent,
  };

  try {
    const url = createApiUrl('/api/analytics/event');
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // ignore
  }
}

export const analytics = {
  track: (event: string, data?: AnalyticsPayload) => {
    if (!hasAnalyticsConsent()) return;
    if (import.meta.env.MODE === 'development') {
      console.log('Analitik etkinliği:', event, data);
    }
    void postEvent(event, data);
  },
  ab: {
    getVariant: (experimentKey: string, variants: string[] = ['A', 'B']) =>
      getOrCreateAbVariant(experimentKey, variants),
  },
};










