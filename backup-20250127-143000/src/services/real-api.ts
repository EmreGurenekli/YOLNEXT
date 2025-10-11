import { User, LoginCredentials, RegisterData, Shipment, Offer, Order, Message, Notification } from '@/types/auth'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

class RealApiClient {
  private baseURL: string
  private token: string | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
    this.token = localStorage.getItem('authToken')
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new ApiError(
          errorData.message || response.statusText,
          response.status,
          response.statusText
        )
      }

      return await response.json()
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError(
        'Network error occurred',
        0,
        'NETWORK_ERROR'
      )
    }
  }

  // Authentication
  async login(credentials: LoginCredentials): Promise<{ success: boolean; data: User; message: string }> {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    })
  }

  async register(userData: RegisterData): Promise<{ success: boolean; data: User; message: string }> {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    })
  }

  async demoLogin(userType: string): Promise<{ success: boolean; data: User; message: string }> {
    return this.request('/api/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({ userType })
    })
  }

  async logout(): Promise<{ success: boolean; message: string }> {
    this.token = null
    localStorage.removeItem('authToken')
    return { success: true, message: 'Logged out successfully' }
  }

  // User Management
  async getProfile(): Promise<{ success: boolean; data: User }> {
    return this.request('/api/users/profile')
  }

  async updateProfile(userData: Partial<User>): Promise<{ success: boolean; data: User; message: string }> {
    return this.request('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify(userData)
    })
  }

  // Shipments
  async createShipment(shipmentData: any): Promise<{ success: boolean; data: Shipment; message: string }> {
    return this.request('/api/shipments/create', {
      method: 'POST',
      body: JSON.stringify(shipmentData)
    })
  }

  async getActiveShipments(params: any = {}): Promise<{ success: boolean; data: { shipments: Shipment[]; pagination: any } }> {
    const queryParams = new URLSearchParams(params).toString()
    return this.request(`/api/shipments/active?${queryParams}`)
  }

  async getMyShipments(params: any = {}): Promise<{ success: boolean; data: Shipment[] }> {
    const queryParams = new URLSearchParams(params).toString()
    return this.request(`/api/shipments/my-shipments?${queryParams}`)
  }

  async getShipmentDetails(id: number): Promise<{ success: boolean; data: { shipment: Shipment; offers: Offer[] } }> {
    return this.request(`/api/shipments/${id}`)
  }

  async updateShipmentStatus(id: number, status: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/api/shipments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    })
  }

  // Offers
  async createOffer(offerData: any): Promise<{ success: boolean; data: Offer; message: string }> {
    return this.request('/api/offers/create', {
      method: 'POST',
      body: JSON.stringify(offerData)
    })
  }

  async getMyOffers(params: any = {}): Promise<{ success: boolean; data: Offer[] }> {
    const queryParams = new URLSearchParams(params).toString()
    return this.request(`/api/offers/my-offers?${queryParams}`)
  }

  async acceptOffer(offerId: number): Promise<{ success: boolean; data: Order; message: string }> {
    return this.request(`/api/offers/${offerId}/accept`, {
      method: 'POST'
    })
  }

  async rejectOffer(offerId: number): Promise<{ success: boolean; message: string }> {
    return this.request(`/api/offers/${offerId}/reject`, {
      method: 'POST'
    })
  }

  // Orders
  async getMyOrders(params: any = {}): Promise<{ success: boolean; data: Order[] }> {
    const queryParams = new URLSearchParams(params).toString()
    return this.request(`/api/orders/my-orders?${queryParams}`)
  }

  async updateOrderStatus(orderId: number, status: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    })
  }

  // Payments
  async createPayment(paymentData: any): Promise<{ success: boolean; data: any; message: string }> {
    return this.request('/api/payments/create', {
      method: 'POST',
      body: JSON.stringify(paymentData)
    })
  }

  async getPaymentStatus(paymentReference: string): Promise<{ success: boolean; data: any }> {
    return this.request(`/api/payments/status/${paymentReference}`)
  }

  async getWalletBalance(): Promise<{ success: boolean; data: { balance: number; currency: string } }> {
    return this.request('/api/payments/wallet/balance')
  }

  async depositToWallet(amount: number, paymentMethod: string): Promise<{ success: boolean; data: any; message: string }> {
    return this.request('/api/payments/wallet/deposit', {
      method: 'POST',
      body: JSON.stringify({ amount, payment_method: paymentMethod })
    })
  }

  // Messaging
  async getConversations(): Promise<{ success: boolean; data: any[] }> {
    return this.request('/api/messaging/conversations')
  }

  async createConversation(shipmentId: number, otherParticipantId: number): Promise<{ success: boolean; data: any }> {
    return this.request('/api/messaging/conversations', {
      method: 'POST',
      body: JSON.stringify({ shipment_id: shipmentId, other_participant_id: otherParticipantId })
    })
  }

  async getMessages(conversationId: number, params: any = {}): Promise<{ success: boolean; data: Message[] }> {
    const queryParams = new URLSearchParams(params).toString()
    return this.request(`/api/messaging/conversations/${conversationId}/messages?${queryParams}`)
  }

  async sendMessage(conversationId: number, content: string, messageType: string = 'text'): Promise<{ success: boolean; data: Message; message: string }> {
    return this.request(`/api/messaging/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, message_type: messageType })
    })
  }

  async uploadFile(conversationId: number, file: File): Promise<{ success: boolean; data: Message; message: string }> {
    const formData = new FormData()
    formData.append('file', file)

    return this.request(`/api/messaging/conversations/${conversationId}/upload`, {
      method: 'POST',
      headers: {
        // Authorization header'ı manuel olarak ekle
        ...(this.token && { Authorization: `Bearer ${this.token}` })
      },
      body: formData
    })
  }

  async getUnreadMessageCount(): Promise<{ success: boolean; data: { unread_count: number } }> {
    return this.request('/api/messaging/unread-count')
  }

  // Notifications
  async getNotifications(params: any = {}): Promise<{ success: boolean; data: Notification[] }> {
    const queryParams = new URLSearchParams(params).toString()
    return this.request(`/api/notifications?${queryParams}`)
  }

  async markNotificationAsRead(notificationId: number): Promise<{ success: boolean; message: string }> {
    return this.request(`/api/notifications/${notificationId}/read`, {
      method: 'PATCH'
    })
  }

  async markAllNotificationsAsRead(): Promise<{ success: boolean; message: string }> {
    return this.request('/api/notifications/read-all', {
      method: 'PATCH'
    })
  }

  async getUnreadNotificationCount(): Promise<{ success: boolean; data: { unread_count: number } }> {
    return this.request('/api/notifications/unread-count')
  }

  // Cargo Integration
  async getCargoPriceQuote(shipmentData: any): Promise<{ success: boolean; data: any }> {
    return this.request('/api/cargo/price-quote', {
      method: 'POST',
      body: JSON.stringify(shipmentData)
    })
  }

  async compareCargoPrices(shipmentData: any): Promise<{ success: boolean; data: any }> {
    return this.request('/api/cargo/compare-prices', {
      method: 'POST',
      body: JSON.stringify(shipmentData)
    })
  }

  async createCargoShipment(company: string, orderData: any): Promise<{ success: boolean; data: any }> {
    return this.request('/api/cargo/create-shipment', {
      method: 'POST',
      body: JSON.stringify({ company, ...orderData })
    })
  }

  async trackCargoShipment(company: string, trackingNumber: string): Promise<{ success: boolean; data: any }> {
    return this.request(`/api/cargo/track/${company}/${trackingNumber}`)
  }

  // Analytics
  async getDashboardStats(): Promise<{ success: boolean; data: any }> {
    return this.request('/api/analytics/dashboard')
  }

  async getShipmentAnalytics(params: any = {}): Promise<{ success: boolean; data: any }> {
    const queryParams = new URLSearchParams(params).toString()
    return this.request(`/api/analytics/shipments?${queryParams}`)
  }

  async getFinancialAnalytics(params: any = {}): Promise<{ success: boolean; data: any }> {
    const queryParams = new URLSearchParams(params).toString()
    return this.request(`/api/analytics/financial?${queryParams}`)
  }

  // Reports
  async generateReport(reportType: string, params: any = {}): Promise<{ success: boolean; data: any }> {
    return this.request('/api/reports/generate', {
      method: 'POST',
      body: JSON.stringify({ report_type: reportType, ...params })
    })
  }

  async getReportHistory(): Promise<{ success: boolean; data: any[] }> {
    return this.request('/api/reports/history')
  }

  // KYC
  async uploadKycDocument(documentType: string, file: File): Promise<{ success: boolean; data: any; message: string }> {
    const formData = new FormData()
    formData.append('document_type', documentType)
    formData.append('file', file)

    return this.request('/api/kyc/upload', {
      method: 'POST',
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` })
      },
      body: formData
    })
  }

  async getKycStatus(): Promise<{ success: boolean; data: any }> {
    return this.request('/api/kyc/status')
  }

  // Vehicles (for carriers)
  async getMyVehicles(): Promise<{ success: boolean; data: any[] }> {
    return this.request('/api/vehicles')
  }

  async createVehicle(vehicleData: any): Promise<{ success: boolean; data: any; message: string }> {
    return this.request('/api/vehicles', {
      method: 'POST',
      body: JSON.stringify(vehicleData)
    })
  }

  async updateVehicle(vehicleId: number, vehicleData: any): Promise<{ success: boolean; data: any; message: string }> {
    return this.request(`/api/vehicles/${vehicleId}`, {
      method: 'PUT',
      body: JSON.stringify(vehicleData)
    })
  }

  async deleteVehicle(vehicleId: number): Promise<{ success: boolean; message: string }> {
    return this.request(`/api/vehicles/${vehicleId}`, {
      method: 'DELETE'
    })
  }

  // Drivers (for carriers)
  async getMyDrivers(): Promise<{ success: boolean; data: any[] }> {
    return this.request('/api/drivers')
  }

  async createDriver(driverData: any): Promise<{ success: boolean; data: any; message: string }> {
    return this.request('/api/drivers', {
      method: 'POST',
      body: JSON.stringify(driverData)
    })
  }

  async updateDriver(driverId: number, driverData: any): Promise<{ success: boolean; data: any; message: string }> {
    return this.request(`/api/drivers/${driverId}`, {
      method: 'PUT',
      body: JSON.stringify(driverData)
    })
  }

  async deleteDriver(driverId: number): Promise<{ success: boolean; message: string }> {
    return this.request(`/api/drivers/${driverId}`, {
      method: 'DELETE'
    })
  }

  // Reviews
  async createReview(reviewData: any): Promise<{ success: boolean; data: any; message: string }> {
    return this.request('/api/reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData)
    })
  }

  async getReviews(userId: number): Promise<{ success: boolean; data: any[] }> {
    return this.request(`/api/reviews/user/${userId}`)
  }

  // System Settings
  async getSystemSettings(): Promise<{ success: boolean; data: any }> {
    return this.request('/api/settings')
  }

  // Health Check
  async healthCheck(): Promise<{ success: boolean; data: any }> {
    return this.request('/api/health')
  }

  // Token güncelleme
  setToken(token: string) {
    this.token = token
    localStorage.setItem('authToken', token)
  }

  // Token temizleme
  clearToken() {
    this.token = null
    localStorage.removeItem('authToken')
  }
}

// Singleton instance
const apiClient = new RealApiClient(API_BASE_URL)

export default apiClient
export { ApiError }




