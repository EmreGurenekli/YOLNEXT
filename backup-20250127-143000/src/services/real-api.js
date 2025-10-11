const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
class ApiError extends Error {
    constructor(message, status, statusText) {
        super(message);
        Object.defineProperty(this, "status", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: status
        });
        Object.defineProperty(this, "statusText", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: statusText
        });
        this.name = 'ApiError';
    }
}
class RealApiClient {
    constructor(baseURL) {
        Object.defineProperty(this, "baseURL", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "token", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        this.baseURL = baseURL;
        this.token = localStorage.getItem('authToken');
    }
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(this.token && { Authorization: `Bearer ${this.token}` }),
                ...options.headers,
            },
            ...options,
        };
        try {
            const response = await fetch(url, config);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new ApiError(errorData.message || response.statusText, response.status, response.statusText);
            }
            return await response.json();
        }
        catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Network error occurred', 0, 'NETWORK_ERROR');
        }
    }
    // Authentication
    async login(credentials) {
        return this.request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
    }
    async register(userData) {
        return this.request('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }
    async demoLogin(userType) {
        return this.request('/api/auth/demo-login', {
            method: 'POST',
            body: JSON.stringify({ userType })
        });
    }
    async logout() {
        this.token = null;
        localStorage.removeItem('authToken');
        return { success: true, message: 'Logged out successfully' };
    }
    // User Management
    async getProfile() {
        return this.request('/api/users/profile');
    }
    async updateProfile(userData) {
        return this.request('/api/users/profile', {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    }
    // Shipments
    async createShipment(shipmentData) {
        return this.request('/api/shipments/create', {
            method: 'POST',
            body: JSON.stringify(shipmentData)
        });
    }
    async getActiveShipments(params = {}) {
        const queryParams = new URLSearchParams(params).toString();
        return this.request(`/api/shipments/active?${queryParams}`);
    }
    async getMyShipments(params = {}) {
        const queryParams = new URLSearchParams(params).toString();
        return this.request(`/api/shipments/my-shipments?${queryParams}`);
    }
    async getShipmentDetails(id) {
        return this.request(`/api/shipments/${id}`);
    }
    async updateShipmentStatus(id, status) {
        return this.request(`/api/shipments/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });
    }
    // Offers
    async createOffer(offerData) {
        return this.request('/api/offers/create', {
            method: 'POST',
            body: JSON.stringify(offerData)
        });
    }
    async getMyOffers(params = {}) {
        const queryParams = new URLSearchParams(params).toString();
        return this.request(`/api/offers/my-offers?${queryParams}`);
    }
    async acceptOffer(offerId) {
        return this.request(`/api/offers/${offerId}/accept`, {
            method: 'POST'
        });
    }
    async rejectOffer(offerId) {
        return this.request(`/api/offers/${offerId}/reject`, {
            method: 'POST'
        });
    }
    // Orders
    async getMyOrders(params = {}) {
        const queryParams = new URLSearchParams(params).toString();
        return this.request(`/api/orders/my-orders?${queryParams}`);
    }
    async updateOrderStatus(orderId, status) {
        return this.request(`/api/orders/${orderId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });
    }
    // Payments
    async createPayment(paymentData) {
        return this.request('/api/payments/create', {
            method: 'POST',
            body: JSON.stringify(paymentData)
        });
    }
    async getPaymentStatus(paymentReference) {
        return this.request(`/api/payments/status/${paymentReference}`);
    }
    async getWalletBalance() {
        return this.request('/api/payments/wallet/balance');
    }
    async depositToWallet(amount, paymentMethod) {
        return this.request('/api/payments/wallet/deposit', {
            method: 'POST',
            body: JSON.stringify({ amount, payment_method: paymentMethod })
        });
    }
    // Messaging
    async getConversations() {
        return this.request('/api/messaging/conversations');
    }
    async createConversation(shipmentId, otherParticipantId) {
        return this.request('/api/messaging/conversations', {
            method: 'POST',
            body: JSON.stringify({ shipment_id: shipmentId, other_participant_id: otherParticipantId })
        });
    }
    async getMessages(conversationId, params = {}) {
        const queryParams = new URLSearchParams(params).toString();
        return this.request(`/api/messaging/conversations/${conversationId}/messages?${queryParams}`);
    }
    async sendMessage(conversationId, content, messageType = 'text') {
        return this.request(`/api/messaging/conversations/${conversationId}/messages`, {
            method: 'POST',
            body: JSON.stringify({ content, message_type: messageType })
        });
    }
    async uploadFile(conversationId, file) {
        const formData = new FormData();
        formData.append('file', file);
        return this.request(`/api/messaging/conversations/${conversationId}/upload`, {
            method: 'POST',
            headers: {
                // Authorization header'ı manuel olarak ekle
                ...(this.token && { Authorization: `Bearer ${this.token}` })
            },
            body: formData
        });
    }
    async getUnreadMessageCount() {
        return this.request('/api/messaging/unread-count');
    }
    // Notifications
    async getNotifications(params = {}) {
        const queryParams = new URLSearchParams(params).toString();
        return this.request(`/api/notifications?${queryParams}`);
    }
    async markNotificationAsRead(notificationId) {
        return this.request(`/api/notifications/${notificationId}/read`, {
            method: 'PATCH'
        });
    }
    async markAllNotificationsAsRead() {
        return this.request('/api/notifications/read-all', {
            method: 'PATCH'
        });
    }
    async getUnreadNotificationCount() {
        return this.request('/api/notifications/unread-count');
    }
    // Cargo Integration
    async getCargoPriceQuote(shipmentData) {
        return this.request('/api/cargo/price-quote', {
            method: 'POST',
            body: JSON.stringify(shipmentData)
        });
    }
    async compareCargoPrices(shipmentData) {
        return this.request('/api/cargo/compare-prices', {
            method: 'POST',
            body: JSON.stringify(shipmentData)
        });
    }
    async createCargoShipment(company, orderData) {
        return this.request('/api/cargo/create-shipment', {
            method: 'POST',
            body: JSON.stringify({ company, ...orderData })
        });
    }
    async trackCargoShipment(company, trackingNumber) {
        return this.request(`/api/cargo/track/${company}/${trackingNumber}`);
    }
    // Analytics
    async getDashboardStats() {
        return this.request('/api/analytics/dashboard');
    }
    async getShipmentAnalytics(params = {}) {
        const queryParams = new URLSearchParams(params).toString();
        return this.request(`/api/analytics/shipments?${queryParams}`);
    }
    async getFinancialAnalytics(params = {}) {
        const queryParams = new URLSearchParams(params).toString();
        return this.request(`/api/analytics/financial?${queryParams}`);
    }
    // Reports
    async generateReport(reportType, params = {}) {
        return this.request('/api/reports/generate', {
            method: 'POST',
            body: JSON.stringify({ report_type: reportType, ...params })
        });
    }
    async getReportHistory() {
        return this.request('/api/reports/history');
    }
    // KYC
    async uploadKycDocument(documentType, file) {
        const formData = new FormData();
        formData.append('document_type', documentType);
        formData.append('file', file);
        return this.request('/api/kyc/upload', {
            method: 'POST',
            headers: {
                ...(this.token && { Authorization: `Bearer ${this.token}` })
            },
            body: formData
        });
    }
    async getKycStatus() {
        return this.request('/api/kyc/status');
    }
    // Vehicles (for carriers)
    async getMyVehicles() {
        return this.request('/api/vehicles');
    }
    async createVehicle(vehicleData) {
        return this.request('/api/vehicles', {
            method: 'POST',
            body: JSON.stringify(vehicleData)
        });
    }
    async updateVehicle(vehicleId, vehicleData) {
        return this.request(`/api/vehicles/${vehicleId}`, {
            method: 'PUT',
            body: JSON.stringify(vehicleData)
        });
    }
    async deleteVehicle(vehicleId) {
        return this.request(`/api/vehicles/${vehicleId}`, {
            method: 'DELETE'
        });
    }
    // Drivers (for carriers)
    async getMyDrivers() {
        return this.request('/api/drivers');
    }
    async createDriver(driverData) {
        return this.request('/api/drivers', {
            method: 'POST',
            body: JSON.stringify(driverData)
        });
    }
    async updateDriver(driverId, driverData) {
        return this.request(`/api/drivers/${driverId}`, {
            method: 'PUT',
            body: JSON.stringify(driverData)
        });
    }
    async deleteDriver(driverId) {
        return this.request(`/api/drivers/${driverId}`, {
            method: 'DELETE'
        });
    }
    // Reviews
    async createReview(reviewData) {
        return this.request('/api/reviews', {
            method: 'POST',
            body: JSON.stringify(reviewData)
        });
    }
    async getReviews(userId) {
        return this.request(`/api/reviews/user/${userId}`);
    }
    // System Settings
    async getSystemSettings() {
        return this.request('/api/settings');
    }
    // Health Check
    async healthCheck() {
        return this.request('/api/health');
    }
    // Token güncelleme
    setToken(token) {
        this.token = token;
        localStorage.setItem('authToken', token);
    }
    // Token temizleme
    clearToken() {
        this.token = null;
        localStorage.removeItem('authToken');
    }
}
// Singleton instance
const apiClient = new RealApiClient(API_BASE_URL);
export default apiClient;
export { ApiError };
