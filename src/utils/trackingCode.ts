export function normalizeTrackingCode(value: any, idFallback?: any): string {
  const v = String(value ?? '').trim();
  const fallback = String(idFallback ?? '').trim();

  if (v && /^YN-/.test(v)) {
    return v;
  }

  if (v && /^TRK/i.test(v)) {
    return v.toUpperCase();
  }

  if (v) {
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) {
      return `TRK${Math.trunc(n).toString().padStart(6, '0')}`;
    }
    return v;
  }

  if (!fallback) return '';

  if (/^YN-/.test(fallback)) {
    return fallback;
  }

  if (/^TRK/i.test(fallback)) {
    return fallback.toUpperCase();
  }

  const n = Number(fallback);
  if (Number.isFinite(n) && n > 0) {
    return `TRK${Math.trunc(n).toString().padStart(6, '0')}`;
  }

  return fallback;
}

export function formatTrackingCode(value: any, idFallback?: any): string {
  return normalizeTrackingCode(value, idFallback);
}
