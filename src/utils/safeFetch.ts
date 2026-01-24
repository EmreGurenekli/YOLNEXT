/**
 * Safe Fetch Utility - Prevents "Unexpected token '<'" errors
 * 
 * This utility ensures that:
 * 1. Response is checked for OK status
 * 2. Content-Type is validated before parsing JSON
 * 3. HTML error pages are caught and handled gracefully
 * 4. All JSON parsing errors are caught and handled
 */

/**
 * Safely parse JSON from response, handling HTML error pages
 */
export async function safeJsonParse<T = any>(response: Response): Promise<T> {
  // Check if response is OK
  if (!response.ok) {
    const text = await response.text();
    // If it's HTML (error page), throw a proper error
    if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
      throw new Error(`HTTP ${response.status}: Server returned HTML instead of JSON`);
    }
    // Try to parse as JSON for error details
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  // Check Content-Type header
  const contentType = response.headers.get('content-type');
  if (contentType && !contentType.includes('application/json')) {
    // If not JSON, read as text to see what we got
    const text = await response.text();
    if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
      throw new Error(`HTTP ${response.status}: Server returned HTML instead of JSON`);
    }
    // Try to parse anyway (some APIs don't set Content-Type correctly)
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`);
    }
  }

  // Safe JSON parsing
  try {
    const text = await response.text();
    if (!text || text.trim().length === 0) {
      return {} as T;
    }
    
    // Check for HTML before parsing
    const trimmed = text.trim();
    if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')) {
      throw new Error(`HTTP ${response.status}: Server returned HTML instead of JSON`);
    }
    
    return JSON.parse(text) as T;
  } catch (error) {
    if (error instanceof Error && error.message.includes('HTML')) {
      throw error;
    }
    throw new Error(`JSON parse error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Safe fetch wrapper that handles JSON parsing errors
 */
export async function safeFetch<T = any>(
  url: string,
  options?: RequestInit
): Promise<{ ok: boolean; status: number; data: T | null; error: string | null }> {
  try {
    const response = await fetch(url, options);
    const data = await safeJsonParse<T>(response);
    
    return {
      ok: response.ok,
      status: response.status,
      data: response.ok ? data : null,
      error: response.ok ? null : (data as any)?.message || `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
