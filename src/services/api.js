// Determine API base URL.
// Endpoints in this file are defined WITHOUT the '/api' prefix (e.g. '/auth/login').
// - In dev, use relative '/api' so Vite proxy can forward to backend.
// - If VITE_API_URL is provided, use it as absolute origin and append '/api'.
// - If VITE_API_URL already ends with '/api', don't append it again.
const getApiBaseUrl = () => {
  if (
  typeof import.meta !== 'undefined' &&
  import.meta &&
  import.meta.env &&
  import.meta.env.VITE_API_URL
  ) {
    const baseUrl = String(import.meta.env.VITE_API_URL).replace(/\/$/, '');
    // If baseUrl already ends with '/api', return it as is
    if (baseUrl.endsWith('/api')) {
      return baseUrl;
    }
    // Otherwise, append '/api'
    return `${baseUrl}/api`;
  }
  return '/api';
};

const API_BASE_URL = getApiBaseUrl();

// Request interceptor
const requestInterceptor = config => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }
  return config;
};

// Response interceptor
const responseInterceptor = response => {
  // Response interceptor - log removed for performance
  // Only log errors in development
  if (import.meta.env.DEV && response.status >= 400) {
    console.error('Response interceptor error status:', response.status);
  }
  if (response.status === 401) {
    // Check if we have a demo token
    const token = localStorage.getItem('authToken');
    // Only redirect to login for real auth tokens, not demo tokens
    if (!token || !token.startsWith('demo-token-')) {
      // Token expired, redirect to login
      // localStorage.removeItem('authToken');
      // localStorage.removeItem('user');
      // window.location.href = '/login';
    }
  }
  return response;
};

// Generic API call function with enhanced error handling
async function apiCall(endpoint, options = {}) {
  // Normalize endpoint to avoid double '/api/api' when API_BASE_URL already includes '/api'
  // Some call sites still pass '/api/...' prefixed endpoints.
  let normalizedEndpoint = typeof endpoint === 'string' ? endpoint : String(endpoint);
  
  // Remove /api prefix if present (API_BASE_URL already includes /api)
  if (normalizedEndpoint.startsWith('/api/')) {
    normalizedEndpoint = normalizedEndpoint.substring(4); // Remove '/api'
  } else if (normalizedEndpoint.startsWith('/api')) {
    normalizedEndpoint = normalizedEndpoint.substring(4); // Remove '/api'
  }
  
  // Ensure endpoint starts with /
  if (!normalizedEndpoint.startsWith('/')) {
    normalizedEndpoint = `/${normalizedEndpoint}`;
  }

  const url = `${API_BASE_URL}${normalizedEndpoint}`;

  // Apply request interceptor
  const config = requestInterceptor({
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Accept': 'application/json; charset=utf-8',
      ...options.headers,
    },
    ...options,
  });

  try {
    const response = await fetch(url, config);

    // Apply response interceptor
    responseInterceptor(response);

    if (!response.ok) {
      const errorText = await response.text();
      let errorData = null;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = null;
      }

      const pickMessage = () => {
        if (errorData && typeof errorData === 'object') {
          return (
            errorData.details ||
            errorData.detail ||
            errorData.error ||
            errorData.message ||
            errorData.msg ||
            null
          );
        }
        return null;
      };

      const apiMessage = pickMessage();
      const bodySnippet =
        typeof errorText === 'string' && errorText.trim()
          ? errorText.trim().slice(0, 500)
          : '';

      throw new Error(
        apiMessage ||
          (bodySnippet ? `${bodySnippet}` : `HTTP error! status: ${response.status}`)
      );
    }

    // Ensure proper UTF-8 decoding
    const responseText = await response.text();
    return JSON.parse(responseText);
  } catch (error) {
    // Enhanced error handling
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      // Backend connection errors are expected when backend is not running
      // Only log if it's not a connection refused error
      if (!error.message.includes('Failed to fetch') && !error.message.includes('ERR_CONNECTION_REFUSED')) {
        if (import.meta.env.DEV) {
          console.error('API call failed:', error);
        }
      }
      throw new Error(
        'Sunucuya bağlanılamıyor. İnternet bağlantınızı kontrol edin.'
      );
    }

    // Only log in development and don't log authentication/connection errors
    if (import.meta.env.DEV && 
        !error.message?.includes('Invalid or expired token') && 
        !error.message?.includes('403') &&
        !error.message?.includes('Failed to fetch') &&
        !error.message?.includes('ERR_CONNECTION_REFUSED')) {
      console.error('API call failed:', error);
    }

    throw error;
  }
}

// Mock API functions removed - all API calls now use real backend endpoints

// API service object
export const api = {
  // Health check
  health: () => apiCall('/health'),

  // Auth API
  auth: {
    login: credentials =>
      apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    register: userData =>
      apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),
    demoLogin: (userType) => apiCall('/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({ userType }),
    }),
    logout: () => {
      console.log('api.js logout function called - DISABLED');
      // localStorage.removeItem('authToken');
      // localStorage.removeItem('user');
      // window.location.href = '/login';
    },
  },

  // Dashboard APIs
  dashboard: {
    individual: () => apiCall('/dashboard/individual'),
    corporate: () => apiCall('/dashboard/corporate'),
    nakliyeci: () => apiCall('/dashboard/nakliyeci'),
    tasiyici: () => apiCall('/dashboard/tasiyici'),
    getStats: userType => apiCall(`/dashboard/stats/${userType}`),
  },

  // Shipments APIs
  shipments: {
    getAll: () => apiCall('/shipments'),
    getById: id => apiCall(`/shipments/${id}`),
    create: data =>
      apiCall('/shipments', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) =>
      apiCall(`/shipments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: id => apiCall(`/shipments/${id}`, { method: 'DELETE' }),
    getOpen: () => apiCall('/shipments/open'),
    getNakliyeci: () => apiCall('/shipments/nakliyeci'),
    getTasiyici: () => apiCall('/shipments/tasiyici'),
    recent: {
      individual: () => apiCall('/shipments/recent/individual'),
      corporate: () => apiCall('/shipments/recent/corporate'),
      nakliyeci: () => apiCall('/shipments/recent/nakliyeci'),
      tasiyici: () => apiCall('/shipments/recent/tasiyici'),
    },
  },

  // Notifications API
  notifications: {
    getAll: () => apiCall('/notifications'),
    getById: id => apiCall(`/notifications/${id}`),
    getUnreadCount: () => apiCall('/notifications/unread-count'),
    markAsRead: id => apiCall(`/notifications/${id}/read`, { method: 'PUT' }),
    markAllAsRead: () => apiCall('/notifications/read-all', { method: 'PUT' }),
    delete: id => apiCall(`/notifications/${id}`, { method: 'DELETE' }),
    deleteAll: () => apiCall('/notifications', { method: 'DELETE' }),
  },

  // Wallet API
  wallet: {
    getBalance: () => apiCall('/wallet/balance'),
    getTransactions: () => apiCall('/wallet/transactions'),
    addFunds: data =>
      apiCall('/wallet/add-funds', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    withdraw: data =>
      apiCall('/wallet/withdraw', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    nakliyeci: () => apiCall('/wallet/nakliyeci'),
    tasiyici: () => apiCall('/wallet/tasiyici'),
  },

  // Messages API
  messages: {
    getAll: () => apiCall('/messages'),
    getById: id => apiCall(`/messages/${id}`),
    send: data =>
      apiCall('/messages', { method: 'POST', body: JSON.stringify(data) }),
    markAsRead: id => apiCall(`/messages/${id}/read`, { method: 'PUT' }),
    delete: id => apiCall(`/messages/${id}`, { method: 'DELETE' }),
  },

  // Offers API
  offers: {
    getAll: () => apiCall('/offers'),
    getById: id => apiCall(`/offers/${id}`),
    create: data =>
      apiCall('/offers', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) =>
      apiCall(`/offers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    accept: id => apiCall(`/offers/${id}/accept`, { method: 'PUT' }),
    reject: id => apiCall(`/offers/${id}/reject`, { method: 'PUT' }),
    delete: id => apiCall(`/offers/${id}`, { method: 'DELETE' }),
  },

  // Users API
  users: {
    getProfile: () => apiCall('/users/profile'),
    updateProfile: data =>
      apiCall('/users/profile', { method: 'PUT', body: JSON.stringify(data) }),
    changePassword: data =>
      apiCall('/users/change-password', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    uploadAvatar: file => {
      const formData = new FormData();
      formData.append('avatar', file);
      return apiCall('/users/avatar', {
        method: 'POST',
        body: formData,
        headers: {}, // Remove Content-Type to let browser set it
      });
    },
  },

  // Analytics API
  analytics: {
    getDashboardStats: (userType, options = {}) => {
      const period = options?.period ? `?period=${encodeURIComponent(options.period)}` : '';
      return apiCall(`/analytics/dashboard/${userType}${period}`);
    },
    getShipmentStats: period =>
      apiCall(`/analytics/shipments?period=${period}`),
    getRevenueStats: period => apiCall(`/analytics/revenue?period=${period}`),
    getPerformanceStats: period =>
      apiCall(`/analytics/performance?period=${period}`),
  },

  // Reports API
  reports: {
    generate: (type, params) =>
      apiCall(`/reports/${type}`, {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    download: reportId => apiCall(`/reports/${reportId}/download`),
    getHistory: () => apiCall('/reports/history'),
  },
};

// Legacy exports for backward compatibility
export const authAPI = api.auth;
export const userAPI = api.users;
export const dashboardAPI = api.dashboard;
export const notificationAPI = api.notifications;
export const shipmentAPI = api.shipments;
export const walletAPI = api.wallet;
export const messageAPI = api.messages;
export const offerAPI = api.offers;
export const analyticsAPI = api.analytics;
export const reportAPI = api.reports;

export default api;
