export async function safeJsonParse<T = any>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
      throw new Error(`HTTP ${response.status}: Server returned HTML instead of JSON`);
    }
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  const contentType = response.headers.get('content-type');
  if (contentType && !contentType.includes('application/json')) {
    const text = await response.text();
    if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
      throw new Error(`HTTP ${response.status}: Server returned HTML instead of JSON`);
    }
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`);
    }
  }

  try {
    const text = await response.text();
    if (!text || text.trim().length === 0) {
      return {} as T;
    }
    
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
