// Determine API base URL: prefer Vite env root (e.g., http://localhost:5000)
// Endpoints in this file already include '/api/...'
const API_BASE_URL =
  typeof import.meta !== 'undefined' &&
  import.meta &&
  import.meta.env &&
  import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}`
    : '';

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
  if (response.status === 401) {
    // Token expired, redirect to login
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
  return response;
};

// Generic API call function with enhanced error handling
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  // Apply request interceptor
  const config = requestInterceptor({
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  try {
    const response = await fetch(url, config);

    // Apply response interceptor
    responseInterceptor(response);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    return await response.json();
  } catch (error) {
    // Only log in development and don't log authentication errors
    if (import.meta.env.DEV && !error.message?.includes('Invalid or expired token') && !error.message?.includes('403')) {
      console.error('API call failed:', error);
    }

    // Enhanced error handling
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error(
        'Sunucuya bağlanılamıyor. İnternet bağlantınızı kontrol edin.'
      );
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
    demoLogin: () => apiCall('/auth/demo-login', { method: 'POST' }),
    logout: () => {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
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
    getDashboardStats: userType => apiCall(`/analytics/dashboard/${userType}`),
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
