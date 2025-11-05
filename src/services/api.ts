import { getApiConfig, createApiUrl, API_ENDPOINTS } from '../config/api';

// API Response interface
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  status?: number;
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
  const url = createApiUrl(endpoint);

  // Default headers
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Add auth token if available
  const token = localStorage.getItem('authToken');
  if (token) {
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
        return { success: false, message: 'Empty server response' };
      }
      data = JSON.parse(text);
    } catch (parseError) {
      // If JSON parse fails, return error object instead of throwing
      // This prevents React from crashing
      return {
        success: false,
        error: `Invalid server response: ${parseError instanceof Error ? parseError.message : 'Parse error'}`,
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
      throw new ApiError('Request timeout', 408);
    }

    // Handle JSON parse errors (e.g., empty response, HTML error pages)
    if (error instanceof TypeError && error.message.includes('JSON')) {
      throw new ApiError('Invalid server response', 500);
    }

    throw new ApiError(
      error instanceof Error ? error.message : 'Network error',
      0
    );
  }
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
export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    api.post(API_ENDPOINTS.LOGIN, credentials),

  register: (userData: any) => api.post(API_ENDPOINTS.REGISTER, userData),

  // Demo login sadece development ortamında kullanılabilir
  demoLogin: (userType: string) => {
    if (import.meta.env.MODE === 'production') {
      throw new Error('Demo login production ortamında devre dışı');
    }
    return api.post(API_ENDPOINTS.DEMO_LOGIN, { userType });
  },

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

  reject: (id: string) => api.post(`${API_ENDPOINTS.OFFERS}/${id}/reject`),
};

// Additional API exports for compatibility
export const authAPI = authApi;
export const userAPI = authApi;
export const dashboardAPI = {
  getStats: (userType: string) => api.get(`/api/dashboard/stats/${userType}`),
};
export const notificationAPI = {
  getUnreadCount: () => api.get('/api/notifications/unread-count'),
  getNotifications: () => api.get('/api/notifications'),
  markAsRead: (id: number) => api.put(`/api/notifications/${id}/read`),
  markAllAsRead: () => api.put('/api/notifications/mark-all-read'),
  deleteNotification: (id: number) => api.delete(`/api/notifications/${id}`),
  deleteAllNotifications: () => api.delete('/api/notifications'),
};
export const shipmentAPI = shipmentsApi;
export const messageAPI = {
  getAll: () => api.get('/api/messages'),
  send: (messageData: any) => api.post('/api/messages', messageData),
};

// Health check
export const healthCheck = () => api.get(API_ENDPOINTS.HEALTH);

export { ApiError };
export default api;
