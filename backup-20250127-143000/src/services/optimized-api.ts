import axios from 'axios';

// Types
export interface User {
  id: number;
  name: string;
  email: string;
  panel_type: 'individual' | 'corporate' | 'nakliyeci' | 'tasiyici';
  company_name?: string;
  location?: string;
  avatar?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  panel_type: 'individual' | 'corporate' | 'nakliyeci' | 'tasiyici';
  company_name?: string;
  location?: string;
}

export interface Shipment {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  from_location: string;
  to_location: string;
  from_address?: string;
  to_address?: string;
  weight?: number;
  volume?: number;
  price?: number;
  status: 'pending' | 'offers_received' | 'accepted' | 'in_progress' | 'picked_up' | 'in_transit' | 'delivered' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  vehicle_type?: string;
  delivery_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Offer {
  id: number;
  shipment_id: number;
  nakliyeci_id: number;
  price: number;
  message?: string;
  estimated_delivery?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  created_at: string;
  nakliyeci_name?: string;
  company_name?: string;
  location?: string;
  phone?: string;
  avatar?: string;
}

export interface Agreement {
  id: number;
  offer_id: number;
  shipment_id: number;
  sender_id: number;
  nakliyeci_id: number;
  agreed_price: number;
  commission_amount: number;
  nakliyeci_receives: number;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  created_at: string;
  title?: string;
  from_location?: string;
  to_location?: string;
  weight?: number;
  volume?: number;
  nakliyeci_name?: string;
  company_name?: string;
  phone?: string;
  sender_name?: string;
  sender_company?: string;
  sender_phone?: string;
}

export interface TrackingUpdate {
  id: number;
  shipment_id: number;
  status: string;
  location?: string;
  notes?: string;
  image_url?: string;
  updated_by: number;
  created_at: string;
  updated_by_name?: string;
  company_name?: string;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  action_url?: string;
  created_at: string;
}

export interface CommissionCalculation {
  agreedPrice: number;
  commissionRate: number;
  commissionAmount: number;
  nakliyeciReceives: number;
  yolnetReceives: number;
}

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Generic request method
const request = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
        ...(localStorage.getItem('token') && {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        }),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Auth API
export const authAPI = {
  async login(credentials: LoginCredentials) {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  },

  async register(data: RegisterData) {
    try {
      const response = await apiClient.post('/auth/register', data);
      return response.data;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  },

  async verifyToken() {
    try {
      const response = await apiClient.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error('Token verification failed:', error);
      throw error;
    }
  },

  async logout() {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return Promise.resolve();
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  }
};

// User API
export const userAPI = {
  async getProfile() {
    try {
      const response = await apiClient.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error('Get profile failed:', error);
      throw error;
    }
  },

  async updateProfile(data: Partial<User>) {
    try {
      const response = await apiClient.put('/users/profile', data);
      return response.data;
    } catch (error) {
      console.error('Update profile failed:', error);
      throw error;
    }
  }
};

// Shipments API
export const shipmentsAPI = {
  async getShipments(params?: Record<string, any>) {
    try {
      const response = await apiClient.get('/shipments', { params });
      return response.data;
    } catch (error) {
      console.error('Get shipments failed:', error);
      throw error;
    }
  },

  async getShipment(id: string | number) {
    try {
      const response = await apiClient.get(`/shipments/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get shipment failed:', error);
      throw error;
    }
  },

  async createShipment(data: Partial<Shipment>) {
    try {
      const response = await apiClient.post('/shipments', data);
      return response.data;
    } catch (error) {
      console.error('Create shipment failed:', error);
      throw error;
    }
  },

  async updateShipment(id: string | number, data: Partial<Shipment>) {
    try {
      const response = await apiClient.put(`/shipments/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Update shipment failed:', error);
      throw error;
    }
  },

  async deleteShipment(id: string | number) {
    try {
      const response = await apiClient.delete(`/shipments/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete shipment failed:', error);
      throw error;
    }
  }
};

// Offers API
export const offersAPI = {
  async createOffer(offerData: Partial<Offer>) {
    try {
      const response = await apiClient.post('/offers', offerData);
      return response.data;
    } catch (error) {
      console.error('Create offer failed:', error);
      throw error;
    }
  },

  async getShipmentOffers(shipmentId: number) {
    try {
      const response = await apiClient.get(`/offers/shipment/${shipmentId}`);
      return response.data;
    } catch (error) {
      console.error('Get shipment offers failed:', error);
      throw error;
    }
  },

  async getNakliyeciOffers(status?: string) {
    try {
      const url = status ? `/offers/nakliyeci?status=${status}` : '/offers/nakliyeci';
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      console.error('Get nakliyeci offers failed:', error);
      throw error;
    }
  },

  async acceptOffer(offerId: number) {
    try {
      const response = await apiClient.put(`/offers/${offerId}/accept`);
      return response.data;
    } catch (error) {
      console.error('Accept offer failed:', error);
      throw error;
    }
  },

  async rejectOffer(offerId: number) {
    try {
      const response = await apiClient.put(`/offers/${offerId}/reject`);
      return response.data;
    } catch (error) {
      console.error('Reject offer failed:', error);
      throw error;
    }
  },

  async updateOffer(offerId: number, data: Partial<Offer>) {
    try {
      const response = await apiClient.put(`/offers/${offerId}`, data);
      return response.data;
    } catch (error) {
      console.error('Update offer failed:', error);
      throw error;
    }
  },

  async deleteOffer(offerId: number) {
    try {
      const response = await apiClient.delete(`/offers/${offerId}`);
      return response.data;
    } catch (error) {
      console.error('Delete offer failed:', error);
      throw error;
    }
  }
};

// Agreements API
export const agreementsAPI = {
  async createAgreement(offerId: number) {
    try {
      const response = await apiClient.post('/agreements', { offer_id: offerId });
      return response.data;
    } catch (error) {
      console.error('Create agreement failed:', error);
      throw error;
    }
  },

  async getSenderAgreements(status?: string) {
    try {
      const url = status ? `/agreements/sender?status=${status}` : '/agreements/sender';
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      console.error('Get sender agreements failed:', error);
      throw error;
    }
  },

  async getNakliyeciAgreements(status?: string) {
    try {
      const url = status ? `/agreements/nakliyeci?status=${status}` : '/agreements/nakliyeci';
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      console.error('Get nakliyeci agreements failed:', error);
      throw error;
    }
  },

  async acceptAgreement(agreementId: number) {
    try {
      const response = await apiClient.put(`/agreements/${agreementId}/accept`);
      return response.data;
    } catch (error) {
      console.error('Accept agreement failed:', error);
      throw error;
    }
  },

  async rejectAgreement(agreementId: number) {
    try {
      const response = await apiClient.put(`/agreements/${agreementId}/reject`);
      return response.data;
    } catch (error) {
      console.error('Reject agreement failed:', error);
      throw error;
    }
  },

  async getAgreement(agreementId: number) {
    try {
      const response = await apiClient.get(`/agreements/${agreementId}`);
      return response.data;
    } catch (error) {
      console.error('Get agreement failed:', error);
      throw error;
    }
  }
};

// Tracking API
export const trackingAPI = {
  async updateShipmentStatus(shipmentId: number, statusData: any) {
    try {
      const response = await apiClient.put(`/tracking/${shipmentId}/status`, statusData);
      return response.data;
    } catch (error) {
      console.error('Update shipment status failed:', error);
      throw error;
    }
  },

  async getTrackingHistory(shipmentId: number) {
    try {
      const response = await apiClient.get(`/tracking/${shipmentId}/history`);
      return response.data;
    } catch (error) {
      console.error('Get tracking history failed:', error);
      throw error;
    }
  },

  async getActiveShipments(userType: 'sender' | 'nakliyeci') {
    try {
      const response = await apiClient.get(`/tracking/${userType}/active`);
      return response.data;
    } catch (error) {
      console.error('Get active shipments failed:', error);
      throw error;
    }
  },

  async confirmDelivery(shipmentId: number, rating: number, feedback?: string) {
    try {
      const response = await apiClient.put(`/tracking/${shipmentId}/deliver`, { rating, feedback });
      return response.data;
    } catch (error) {
      console.error('Confirm delivery failed:', error);
      throw error;
    }
  },

  async getLiveTracking(shipmentId: number) {
    try {
      const response = await apiClient.get(`/tracking/${shipmentId}/live`);
      return response.data;
    } catch (error) {
      console.error('Get live tracking failed:', error);
      throw error;
    }
  }
};

// Commission API
export const commissionAPI = {
  async calculateCommission(agreedPrice: number) {
    try {
      const response = await apiClient.post('/commission/calculate', { agreedPrice });
      return response.data;
    } catch (error) {
      console.error('Calculate commission failed:', error);
      throw error;
    }
  },

  async getCommissionRate() {
    try {
      const response = await apiClient.get('/commission/rate');
      return response.data;
    } catch (error) {
      console.error('Get commission rate failed:', error);
      throw error;
    }
  },

  async getCommissionExamples() {
    try {
      const response = await apiClient.get('/commission/examples');
      return response.data;
    } catch (error) {
      console.error('Get commission examples failed:', error);
      throw error;
    }
  },

  async getCommissions(status?: string) {
    try {
      const url = status ? `/commission?status=${status}` : '/commission';
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      console.error('Get commissions failed:', error);
      throw error;
    }
  }
};

// Messages API
export const messagesAPI = {
  async getConversations() {
    try {
      const response = await apiClient.get('/messages/conversations');
      return response.data;
    } catch (error) {
      console.error('Get conversations failed:', error);
      throw error;
    }
  },

  async getMessages(conversationId: string) {
    try {
      const response = await apiClient.get(`/messages/${conversationId}`);
      return response.data;
    } catch (error) {
      console.error('Get messages failed:', error);
      throw error;
    }
  },

  async sendMessage(conversationId: string, message: string) {
    try {
      const response = await apiClient.post(`/messages/${conversationId}`, { message });
      return response.data;
    } catch (error) {
      console.error('Send message failed:', error);
      throw error;
    }
  },

  async markAsRead(conversationId: string) {
    try {
      const response = await apiClient.put(`/messages/${conversationId}/read`);
      return response.data;
    } catch (error) {
      console.error('Mark as read failed:', error);
      throw error;
    }
  }
};

// Notifications API
export const notificationsAPI = {
  async getNotifications(status?: 'all' | 'unread') {
    try {
      const url = status ? `/notifications?status=${status}` : '/notifications';
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      console.error('Get notifications failed:', error);
      throw error;
    }
  },

  async markAsRead(notificationId: number) {
    try {
      const response = await apiClient.put(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error('Mark notification as read failed:', error);
      throw error;
    }
  },

  async markAllAsRead() {
    try {
      const response = await apiClient.put('/notifications/read-all');
      return response.data;
    } catch (error) {
      console.error('Mark all notifications as read failed:', error);
      throw error;
    }
  },

  async deleteNotification(notificationId: number) {
    try {
      const response = await apiClient.delete(`/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      console.error('Delete notification failed:', error);
      throw error;
    }
  }
};

// Analytics API
export const analyticsAPI = {
  async getAnalytics(params?: Record<string, any>) {
    try {
      const response = await apiClient.get('/analytics', { params });
      return response.data;
    } catch (error) {
      console.error('Get analytics failed:', error);
      throw error;
    }
  },

  async getDashboardStats() {
    try {
      const response = await apiClient.get('/analytics/dashboard');
      return response.data;
    } catch (error) {
      console.error('Get dashboard stats failed:', error);
      throw error;
    }
  }
};

// File Upload API
export const fileAPI = {
  async uploadFile(file: File, endpoint: string = '/upload') {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('File upload failed:', error);
      throw error;
    }
  },

  async deleteFile(fileId: string) {
    try {
      const response = await apiClient.delete(`/files/${fileId}`);
      return response.data;
    } catch (error) {
      console.error('Delete file failed:', error);
      throw error;
    }
  }
};

// Health Check API
export const healthAPI = {
  async checkHealth() {
    try {
      const response = await apiClient.get('/health');
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }
};

// Export all APIs
export const api = {
  auth: authAPI,
  user: userAPI,
  shipments: shipmentsAPI,
  offers: offersAPI,
  agreements: agreementsAPI,
  tracking: trackingAPI,
  commission: commissionAPI,
  messages: messagesAPI,
  notifications: notificationsAPI,
  analytics: analyticsAPI,
  file: fileAPI,
  health: healthAPI
};

export default api;

