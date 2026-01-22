/**
 * Tracking Code Utility Functions
 * Ensures consistent tracking code formatting across the application
 */

/**
 * Normalizes tracking code to a consistent format
 * Backend generates: YN-{timestamp}-{random}
 * Frontend displays: YN-{timestamp}-{random} (keep as is) or TRK{id} (if numeric ID)
 * 
 * @param value - Raw tracking code from backend (could be YN- format, TRK format, numeric ID, or null)
 * @param idFallback - Fallback ID if value is null/empty
 * @returns Normalized tracking code string
 */
export function normalizeTrackingCode(value: any, idFallback?: any): string {
  const v = String(value ?? '').trim();
  const fallback = String(idFallback ?? '').trim();

  // If value exists and is already in YN- format, keep it as is
  if (v && /^YN-/.test(v)) {
    return v;
  }

  // If value exists and is already in TRK format, keep it as is
  if (v && /^TRK/i.test(v)) {
    return v.toUpperCase();
  }

  // If value is numeric, convert to TRK format
  if (v) {
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) {
      return `TRK${Math.trunc(n).toString().padStart(6, '0')}`;
    }
    // If it's a non-empty string that doesn't match patterns, return as is
    return v;
  }

  // If value is empty, try fallback
  if (!fallback) return '';

  // Check fallback for YN- format
  if (/^YN-/.test(fallback)) {
    return fallback;
  }

  // Check fallback for TRK format
  if (/^TRK/i.test(fallback)) {
    return fallback.toUpperCase();
  }

  // Try to convert fallback to TRK format if numeric
  const n = Number(fallback);
  if (Number.isFinite(n) && n > 0) {
    return `TRK${Math.trunc(n).toString().padStart(6, '0')}`;
  }

  return fallback;
}

/**
 * Formats tracking code for display
 * @param value - Raw tracking code
 * @param idFallback - Fallback ID
 * @returns Formatted tracking code string
 */
export function formatTrackingCode(value: any, idFallback?: any): string {
  return normalizeTrackingCode(value, idFallback);
}

