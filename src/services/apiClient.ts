import { getApiConfig, createApiUrl, API_ENDPOINTS } from '../config/api';
import { LoginCredentials } from '../types/auth';

// API Response interface
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  status?: number;
}

// Register data interface
interface RegisterData {
  name: string;
  email: string;
  password: string;
  panel_type: string;
  company_name?: string;
  location?: string;
  phone?: string;
}

// API Error class
class ApiError extends Error {
  status: number;
  response?: Response;
  data?: any;

  constructor(message: string, status: number, response?: Response) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.response = response;
  }
}

// Retry function
const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  retries: number,
  delay: number = 1000
): Promise<T> => {
  try {
    return await requestFn();
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryRequest(requestFn, retries - 1, delay * 2);
    }
    throw error;
  }
};

// Base API request function
const apiRequest = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const config = getApiConfig();
  // Remove /api prefix if present to avoid double /api/api/
  let normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (normalizedEndpoint.startsWith('/api/')) {
    normalizedEndpoint = normalizedEndpoint.substring(4);
  } else if (normalizedEndpoint.startsWith('/api')) {
    normalizedEndpoint = normalizedEndpoint.substring(4);
  }
  const url = createApiUrl(normalizedEndpoint);

  // Default headers
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Add auth token if available
  const token = localStorage.getItem('authToken') || localStorage.getItem('token');
  if (token && token !== 'null' && token !== 'undefined') {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  // Merge headers
  const headers = {
    ...defaultHeaders,
    ...options.headers,
  };

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout);

  try {
    const response = await retryRequest(
      () =>
        fetch(url, {
          ...options,
          headers,
          signal: controller.signal,
        }),
      config.retryAttempts
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Try to get error details from response
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: response.statusText };
      }

      try {
        const msg = String(errorData?.message || errorData?.error?.message || '').toLowerCase();
        const isAuthInvalid =
          (response.status === 401 || response.status === 403) &&
          (msg.includes('invalid or expired token') || msg.includes('invalid token') || msg.includes('expired token'));
        if (isAuthInvalid && typeof window !== 'undefined') {
          try {
            localStorage.removeItem('authToken');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          } catch (_) {
            // ignore
          }
          window.dispatchEvent(new Event('auth:logout'));
        }
      } catch (_) {
        // ignore
      }

      const error = new ApiError(
        errorData.details ||
          errorData.message ||
          `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        response
      );
      error.data = errorData; // Attach full error response
      throw error;
    }

    // Safely parse JSON response
    let data;
    try {
      const text = await response.text();
      if (!text || text.trim().length === 0) {
        // Empty response - return empty success object instead of throwing
        return { success: false, message: 'Sunucudan boş yanıt alındı' };
      }
      data = JSON.parse(text);
    } catch (parseError) {
      // If JSON parse fails, return error object instead of throwing
      // This prevents React from crashing
      return {
        success: false,
        error: `Geçersiz sunucu yanıtı: ${parseError instanceof Error ? parseError.message : 'Ayrıştırma hatası'}`,
        status: response.status,
      };
    }
    
    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('İstek zaman aşımına uğradı', 408);
    }

    // Handle JSON parse errors (e.g., empty response, HTML error pages)
    if (error instanceof TypeError && error.message.includes('JSON')) {
      throw new ApiError('Geçersiz sunucu yanıtı', 500);
    }

    throw new ApiError(
      error instanceof Error ? error.message : 'Ağ hatası',
      0
    );
  }
};

const isDemoToken = () => {
  const token = localStorage.getItem('authToken') || localStorage.getItem('token');
  return !!token && token !== 'null' && token !== 'undefined' && token.startsWith('demo-token-');
};

// API methods
export const api = {
  // GET request
  get: <T = any>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  // POST request
  post: <T = any>(endpoint: string, data?: any, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  // PUT request
  put: <T = any>(endpoint: string, data?: any, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  // DELETE request
  delete: <T = any>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),

  // PATCH request
  patch: <T = any>(endpoint: string, data?: any, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),
};

// Specific API calls
export const authAPI = {
  login: (credentials: LoginCredentials) => api.post(API_ENDPOINTS.LOGIN, credentials),
  register: (data: RegisterData) => api.post(API_ENDPOINTS.REGISTER, data),
  forgotPassword: (email: string) => api.post(API_ENDPOINTS.FORGOT_PASSWORD, { email }),
  resetPassword: (token: string, password: string) =>
    api.post(API_ENDPOINTS.RESET_PASSWORD, { token, password }),
  deleteAccount: (data: { password?: string; reason?: string }) =>
    api.delete(API_ENDPOINTS.DELETE_ACCOUNT),
  getProfile: () => api.get(API_ENDPOINTS.PROFILE),
};

export const shipmentsApi = {
  getAll: () => api.get(API_ENDPOINTS.SHIPMENTS),

  getOpen: () => api.get(API_ENDPOINTS.SHIPMENTS_OPEN),

  getNakliyeci: () => api.get(API_ENDPOINTS.SHIPMENTS_NAKLIYECI),

  getOffers: () => api.get(API_ENDPOINTS.SHIPMENTS_OFFERS),

  getRecentShipments: (userType: string) =>
    api.get(`/api/shipments/recent/${userType}`),

  create: (shipmentData: any) =>
    api.post(API_ENDPOINTS.SHIPMENTS, shipmentData),

  update: (id: string, data: any) =>
    api.put(`${API_ENDPOINTS.SHIPMENTS}/${id}`, data),

  delete: (id: string) => api.delete(`${API_ENDPOINTS.SHIPMENTS}/${id}`),
};

export const offersApi = {
  create: (offerData: any) => api.post(API_ENDPOINTS.OFFERS, offerData),

  accept: (id: string) =>
    api.post(API_ENDPOINTS.OFFERS_ACCEPT.replace(':id', id)),

  reject: (id: string) => api.put(`${API_ENDPOINTS.OFFERS}/${id}/reject`),
};

// Additional API exports for compatibility
export const userAPI = authAPI;
export const dashboardAPI = {
  getStats: (userType: string) => api.get(`dashboard/stats/${userType}`),
};
export const notificationAPI = {
  getUnreadCount: () => {
    if (isDemoToken()) {
      return Promise.resolve({ success: true, data: { unreadCount: 0 } });
    }
    return api.get('/notifications/unread-count');
  },
  getNotifications: () => api.get('/notifications'),
  markAsRead: (id: number) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/mark-all-read'),
  deleteNotification: (id: number) => api.delete(`/notifications/${id}`),
  deleteAllNotifications: () => api.delete('/notifications'),
};
export const shipmentAPI = shipmentsApi;
export const messageAPI = {
  getAll: () => {
    if (isDemoToken()) {
      return Promise.resolve({ success: true, data: [] });
    }
    return api.get('/messages');
  },
  send: (messageData: any) => api.post('/messages', messageData),
  delete: (id: string) => api.delete(`/messages/${id}`),
  deleteConversation: (otherUserId: string | number) => api.delete(`/messages/conversation/${otherUserId}`),
};

export const kvkkAPI = {
  requestDataAccess: () => api.get(API_ENDPOINTS.KVKK_DATA_ACCESS),
  deleteData: () => api.post(API_ENDPOINTS.KVKK_DELETE_DATA),
};

// Carriers API
export const carriersAPI = {
  getCorporate: () => api.get(API_ENDPOINTS.CARRIERS_CORPORATE),
  linkCorporate: (data: { code?: string | null; email?: string | null }) => 
    api.post(API_ENDPOINTS.CARRIERS_CORPORATE_LINK, data),
};

export const driversAPI = {
  link: (data: any) => api.post(API_ENDPOINTS.DRIVERS_LINK, data),
};

// Health check
export const healthCheck = () => api.get(API_ENDPOINTS.HEALTH);

export { ApiError };
export default api;




