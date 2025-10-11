import axios from 'axios';
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
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});
// Response interceptor for error handling
apiClient.interceptors.response.use((response) => response, (error) => {
    if (error.response?.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    }
    return Promise.reject(error);
});
// Generic request method
const request = async (endpoint, options = {}) => {
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
    }
    catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
};
// Auth API
export const authAPI = {
    async login(credentials) {
        try {
            const response = await apiClient.post('/auth/login', credentials);
            return response.data;
        }
        catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    },
    async register(data) {
        try {
            const response = await apiClient.post('/auth/register', data);
            return response.data;
        }
        catch (error) {
            console.error('Registration failed:', error);
            throw error;
        }
    },
    async verifyToken() {
        try {
            const response = await apiClient.get('/auth/me');
            return response.data;
        }
        catch (error) {
            console.error('Token verification failed:', error);
            throw error;
        }
    },
    async logout() {
        try {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            return Promise.resolve();
        }
        catch (error) {
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
        }
        catch (error) {
            console.error('Get profile failed:', error);
            throw error;
        }
    },
    async updateProfile(data) {
        try {
            const response = await apiClient.put('/users/profile', data);
            return response.data;
        }
        catch (error) {
            console.error('Update profile failed:', error);
            throw error;
        }
    }
};
// Shipments API
export const shipmentsAPI = {
    async getShipments(params) {
        try {
            const response = await apiClient.get('/shipments', { params });
            return response.data;
        }
        catch (error) {
            console.error('Get shipments failed:', error);
            throw error;
        }
    },
    async getShipment(id) {
        try {
            const response = await apiClient.get(`/shipments/${id}`);
            return response.data;
        }
        catch (error) {
            console.error('Get shipment failed:', error);
            throw error;
        }
    },
    async createShipment(data) {
        try {
            const response = await apiClient.post('/shipments', data);
            return response.data;
        }
        catch (error) {
            console.error('Create shipment failed:', error);
            throw error;
        }
    },
    async updateShipment(id, data) {
        try {
            const response = await apiClient.put(`/shipments/${id}`, data);
            return response.data;
        }
        catch (error) {
            console.error('Update shipment failed:', error);
            throw error;
        }
    },
    async deleteShipment(id) {
        try {
            const response = await apiClient.delete(`/shipments/${id}`);
            return response.data;
        }
        catch (error) {
            console.error('Delete shipment failed:', error);
            throw error;
        }
    }
};
// Offers API
export const offersAPI = {
    async createOffer(offerData) {
        try {
            const response = await apiClient.post('/offers', offerData);
            return response.data;
        }
        catch (error) {
            console.error('Create offer failed:', error);
            throw error;
        }
    },
    async getShipmentOffers(shipmentId) {
        try {
            const response = await apiClient.get(`/offers/shipment/${shipmentId}`);
            return response.data;
        }
        catch (error) {
            console.error('Get shipment offers failed:', error);
            throw error;
        }
    },
    async getNakliyeciOffers(status) {
        try {
            const url = status ? `/offers/nakliyeci?status=${status}` : '/offers/nakliyeci';
            const response = await apiClient.get(url);
            return response.data;
        }
        catch (error) {
            console.error('Get nakliyeci offers failed:', error);
            throw error;
        }
    },
    async acceptOffer(offerId) {
        try {
            const response = await apiClient.put(`/offers/${offerId}/accept`);
            return response.data;
        }
        catch (error) {
            console.error('Accept offer failed:', error);
            throw error;
        }
    },
    async rejectOffer(offerId) {
        try {
            const response = await apiClient.put(`/offers/${offerId}/reject`);
            return response.data;
        }
        catch (error) {
            console.error('Reject offer failed:', error);
            throw error;
        }
    },
    async updateOffer(offerId, data) {
        try {
            const response = await apiClient.put(`/offers/${offerId}`, data);
            return response.data;
        }
        catch (error) {
            console.error('Update offer failed:', error);
            throw error;
        }
    },
    async deleteOffer(offerId) {
        try {
            const response = await apiClient.delete(`/offers/${offerId}`);
            return response.data;
        }
        catch (error) {
            console.error('Delete offer failed:', error);
            throw error;
        }
    }
};
// Agreements API
export const agreementsAPI = {
    async createAgreement(offerId) {
        try {
            const response = await apiClient.post('/agreements', { offer_id: offerId });
            return response.data;
        }
        catch (error) {
            console.error('Create agreement failed:', error);
            throw error;
        }
    },
    async getSenderAgreements(status) {
        try {
            const url = status ? `/agreements/sender?status=${status}` : '/agreements/sender';
            const response = await apiClient.get(url);
            return response.data;
        }
        catch (error) {
            console.error('Get sender agreements failed:', error);
            throw error;
        }
    },
    async getNakliyeciAgreements(status) {
        try {
            const url = status ? `/agreements/nakliyeci?status=${status}` : '/agreements/nakliyeci';
            const response = await apiClient.get(url);
            return response.data;
        }
        catch (error) {
            console.error('Get nakliyeci agreements failed:', error);
            throw error;
        }
    },
    async acceptAgreement(agreementId) {
        try {
            const response = await apiClient.put(`/agreements/${agreementId}/accept`);
            return response.data;
        }
        catch (error) {
            console.error('Accept agreement failed:', error);
            throw error;
        }
    },
    async rejectAgreement(agreementId) {
        try {
            const response = await apiClient.put(`/agreements/${agreementId}/reject`);
            return response.data;
        }
        catch (error) {
            console.error('Reject agreement failed:', error);
            throw error;
        }
    },
    async getAgreement(agreementId) {
        try {
            const response = await apiClient.get(`/agreements/${agreementId}`);
            return response.data;
        }
        catch (error) {
            console.error('Get agreement failed:', error);
            throw error;
        }
    }
};
// Tracking API
export const trackingAPI = {
    async updateShipmentStatus(shipmentId, statusData) {
        try {
            const response = await apiClient.put(`/tracking/${shipmentId}/status`, statusData);
            return response.data;
        }
        catch (error) {
            console.error('Update shipment status failed:', error);
            throw error;
        }
    },
    async getTrackingHistory(shipmentId) {
        try {
            const response = await apiClient.get(`/tracking/${shipmentId}/history`);
            return response.data;
        }
        catch (error) {
            console.error('Get tracking history failed:', error);
            throw error;
        }
    },
    async getActiveShipments(userType) {
        try {
            const response = await apiClient.get(`/tracking/${userType}/active`);
            return response.data;
        }
        catch (error) {
            console.error('Get active shipments failed:', error);
            throw error;
        }
    },
    async confirmDelivery(shipmentId, rating, feedback) {
        try {
            const response = await apiClient.put(`/tracking/${shipmentId}/deliver`, { rating, feedback });
            return response.data;
        }
        catch (error) {
            console.error('Confirm delivery failed:', error);
            throw error;
        }
    },
    async getLiveTracking(shipmentId) {
        try {
            const response = await apiClient.get(`/tracking/${shipmentId}/live`);
            return response.data;
        }
        catch (error) {
            console.error('Get live tracking failed:', error);
            throw error;
        }
    }
};
// Commission API
export const commissionAPI = {
    async calculateCommission(agreedPrice) {
        try {
            const response = await apiClient.post('/commission/calculate', { agreedPrice });
            return response.data;
        }
        catch (error) {
            console.error('Calculate commission failed:', error);
            throw error;
        }
    },
    async getCommissionRate() {
        try {
            const response = await apiClient.get('/commission/rate');
            return response.data;
        }
        catch (error) {
            console.error('Get commission rate failed:', error);
            throw error;
        }
    },
    async getCommissionExamples() {
        try {
            const response = await apiClient.get('/commission/examples');
            return response.data;
        }
        catch (error) {
            console.error('Get commission examples failed:', error);
            throw error;
        }
    },
    async getCommissions(status) {
        try {
            const url = status ? `/commission?status=${status}` : '/commission';
            const response = await apiClient.get(url);
            return response.data;
        }
        catch (error) {
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
        }
        catch (error) {
            console.error('Get conversations failed:', error);
            throw error;
        }
    },
    async getMessages(conversationId) {
        try {
            const response = await apiClient.get(`/messages/${conversationId}`);
            return response.data;
        }
        catch (error) {
            console.error('Get messages failed:', error);
            throw error;
        }
    },
    async sendMessage(conversationId, message) {
        try {
            const response = await apiClient.post(`/messages/${conversationId}`, { message });
            return response.data;
        }
        catch (error) {
            console.error('Send message failed:', error);
            throw error;
        }
    },
    async markAsRead(conversationId) {
        try {
            const response = await apiClient.put(`/messages/${conversationId}/read`);
            return response.data;
        }
        catch (error) {
            console.error('Mark as read failed:', error);
            throw error;
        }
    }
};
// Notifications API
export const notificationsAPI = {
    async getNotifications(status) {
        try {
            const url = status ? `/notifications?status=${status}` : '/notifications';
            const response = await apiClient.get(url);
            return response.data;
        }
        catch (error) {
            console.error('Get notifications failed:', error);
            throw error;
        }
    },
    async markAsRead(notificationId) {
        try {
            const response = await apiClient.put(`/notifications/${notificationId}/read`);
            return response.data;
        }
        catch (error) {
            console.error('Mark notification as read failed:', error);
            throw error;
        }
    },
    async markAllAsRead() {
        try {
            const response = await apiClient.put('/notifications/read-all');
            return response.data;
        }
        catch (error) {
            console.error('Mark all notifications as read failed:', error);
            throw error;
        }
    },
    async deleteNotification(notificationId) {
        try {
            const response = await apiClient.delete(`/notifications/${notificationId}`);
            return response.data;
        }
        catch (error) {
            console.error('Delete notification failed:', error);
            throw error;
        }
    }
};
// Analytics API
export const analyticsAPI = {
    async getAnalytics(params) {
        try {
            const response = await apiClient.get('/analytics', { params });
            return response.data;
        }
        catch (error) {
            console.error('Get analytics failed:', error);
            throw error;
        }
    },
    async getDashboardStats() {
        try {
            const response = await apiClient.get('/analytics/dashboard');
            return response.data;
        }
        catch (error) {
            console.error('Get dashboard stats failed:', error);
            throw error;
        }
    }
};
// File Upload API
export const fileAPI = {
    async uploadFile(file, endpoint = '/upload') {
        try {
            const formData = new FormData();
            formData.append('file', file);
            const response = await apiClient.post(endpoint, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        }
        catch (error) {
            console.error('File upload failed:', error);
            throw error;
        }
    },
    async deleteFile(fileId) {
        try {
            const response = await apiClient.delete(`/files/${fileId}`);
            return response.data;
        }
        catch (error) {
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
        }
        catch (error) {
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
