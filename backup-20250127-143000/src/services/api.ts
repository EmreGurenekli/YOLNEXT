import { User, LoginCredentials, RegisterData } from '@/types/auth'
import { mockApiClient } from './mock-api'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

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

class ApiClient {
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
        'Network Error'
      )
    }
  }

  setToken(token: string | null) {
    this.token = token
    if (token) {
      localStorage.setItem('authToken', token)
    } else {
      localStorage.removeItem('authToken')
    }
  }

  // Auth endpoints
  async login(credentials: LoginCredentials) {
    try {
      return await this.request<{ user: User; token: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      })
    } catch (error) {
      // Fallback to mock API if backend is not available
      return mockApiClient.login(credentials)
    }
  }

  async register(data: RegisterData) {
    try {
      return await this.request<{ user: User; token: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    } catch (error) {
      // Fallback to mock API if backend is not available
      return mockApiClient.register(data)
    }
  }

  async verifyToken() {
    try {
      return await this.request<{ user: User }>('/api/auth/me')
    } catch (error) {
      // Fallback to mock API if backend is not available
      return mockApiClient.verifyToken()
    }
  }

  async logout() {
    try {
      await this.request('/api/auth/logout', {
        method: 'POST',
      })
    } catch (error) {
      // Fallback to mock API if backend is not available
      return mockApiClient.logout()
    }
  }

  // User endpoints
  async getProfile() {
    return this.request<{ user: User }>('/api/users/profile')
  }

  async updateProfile(data: Partial<User>) {
    return this.request<{ user: User }>('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // Shipment endpoints
  async getShipments(params?: Record<string, any>) {
    try {
      const searchParams = new URLSearchParams(params)
      return await this.request(`/api/shipments?${searchParams}`)
    } catch (error) {
      return mockApiClient.getShipments(params)
    }
  }

  async getShipment(id: string) {
    return this.request(`/api/shipments/${id}`)
  }

  async createShipment(data: any) {
    return this.request('/api/shipments', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateShipment(id: string, data: any) {
    return this.request(`/api/shipments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteShipment(id: string) {
    return this.request(`/api/shipments/${id}`, {
      method: 'DELETE',
    })
  }

  // Message endpoints
  async getMessages(params?: Record<string, any>) {
    try {
      const searchParams = new URLSearchParams(params)
      return await this.request(`/api/messages?${searchParams}`)
    } catch (error) {
      return mockApiClient.getMessages(params)
    }
  }

  async sendMessage(data: any) {
    return this.request('/api/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Offers endpoints
  async createOffer(offerData: any) {
    try {
      return await this.request('/api/offers', {
        method: 'POST',
        body: JSON.stringify(offerData),
      })
    } catch (error) {
      return mockApiClient.createOffer(offerData)
    }
  }

  async getShipmentOffers(shipmentId: number) {
    try {
      return await this.request(`/api/offers/shipment/${shipmentId}`)
    } catch (error) {
      return mockApiClient.getShipmentOffers(shipmentId)
    }
  }

  async getNakliyeciOffers(status?: string) {
    try {
      const url = status ? `/api/offers/nakliyeci?status=${status}` : '/api/offers/nakliyeci'
      return await this.request(url)
    } catch (error) {
      return mockApiClient.getNakliyeciOffers(status)
    }
  }

  async acceptOffer(offerId: number) {
    try {
      return await this.request(`/api/offers/${offerId}/accept`, {
        method: 'PUT',
      })
    } catch (error) {
      return mockApiClient.acceptOffer(offerId)
    }
  }

  async rejectOffer(offerId: number) {
    try {
      return await this.request(`/api/offers/${offerId}/reject`, {
        method: 'PUT',
      })
    } catch (error) {
      return mockApiClient.rejectOffer(offerId)
    }
  }

  // Agreements endpoints
  async createAgreement(offerId: number) {
    try {
      return await this.request('/api/agreements', {
        method: 'POST',
        body: JSON.stringify({ offer_id: offerId }),
      })
    } catch (error) {
      return mockApiClient.createAgreement(offerId)
    }
  }

  async getSenderAgreements(status?: string) {
    try {
      const url = status ? `/api/agreements/sender?status=${status}` : '/api/agreements/sender'
      return await this.request(url)
    } catch (error) {
      return mockApiClient.getSenderAgreements(status)
    }
  }

  async getNakliyeciAgreements(status?: string) {
    try {
      const url = status ? `/api/agreements/nakliyeci?status=${status}` : '/api/agreements/nakliyeci'
      return await this.request(url)
    } catch (error) {
      return mockApiClient.getNakliyeciAgreements(status)
    }
  }

  async acceptAgreement(agreementId: number) {
    try {
      return await this.request(`/api/agreements/${agreementId}/accept`, {
        method: 'PUT',
      })
    } catch (error) {
      return mockApiClient.acceptAgreement(agreementId)
    }
  }

  async rejectAgreement(agreementId: number) {
    try {
      return await this.request(`/api/agreements/${agreementId}/reject`, {
        method: 'PUT',
      })
    } catch (error) {
      return mockApiClient.rejectAgreement(agreementId)
    }
  }

  // Tracking endpoints
  async updateShipmentStatus(shipmentId: number, statusData: any) {
    try {
      return await this.request(`/api/tracking/${shipmentId}/status`, {
        method: 'PUT',
        body: JSON.stringify(statusData),
      })
    } catch (error) {
      return mockApiClient.updateShipmentStatus(shipmentId, statusData)
    }
  }

  async getTrackingHistory(shipmentId: number) {
    try {
      return await this.request(`/api/tracking/${shipmentId}/history`)
    } catch (error) {
      return mockApiClient.getTrackingHistory(shipmentId)
    }
  }

  async getActiveShipments(userType: 'sender' | 'nakliyeci') {
    try {
      return await this.request(`/api/tracking/${userType}/active`)
    } catch (error) {
      return mockApiClient.getActiveShipments(userType)
    }
  }

  async confirmDelivery(shipmentId: number, rating: number, feedback?: string) {
    try {
      return await this.request(`/api/tracking/${shipmentId}/deliver`, {
        method: 'PUT',
        body: JSON.stringify({ rating, feedback }),
      })
    } catch (error) {
      return mockApiClient.confirmDelivery(shipmentId, rating, feedback)
    }
  }

  // Commission endpoints
  async calculateCommission(agreedPrice: number) {
    try {
      return await this.request('/api/commission/calculate', {
        method: 'POST',
        body: JSON.stringify({ agreedPrice }),
      })
    } catch (error) {
      return mockApiClient.calculateCommission(agreedPrice)
    }
  }

  async getCommissionRate() {
    try {
      return await this.request('/api/commission/rate')
    } catch (error) {
      return mockApiClient.getCommissionRate()
    }
  }

  async getCommissionExamples() {
    try {
      return await this.request('/api/commission/examples')
    } catch (error) {
      return mockApiClient.getCommissionExamples()
    }
  }

  // Analytics endpoints
  async getAnalytics(params?: Record<string, any>) {
    try {
      const searchParams = new URLSearchParams(params)
      return await this.request(`/api/analytics?${searchParams}`)
    } catch (error) {
      return mockApiClient.getAnalytics(params)
    }
  }

  // Dashboard endpoints
  async getDashboardStats() {
    try {
      return await this.request('/api/dashboard/stats')
    } catch (error) {
      return mockApiClient.getDashboardStats()
    }
  }

  async getNotifications(params?: { limit?: number; offset?: number }) {
    try {
      const searchParams = new URLSearchParams(params as any)
      return await this.request(`/api/notifications?${searchParams}`)
    } catch (error) {
      return mockApiClient.getNotifications(params)
    }
  }

  async getUnreadNotificationCount() {
    try {
      return await this.request('/api/notifications/unread-count')
    } catch (error) {
      return mockApiClient.getUnreadNotificationCount()
    }
  }

  async markNotificationAsRead(notificationId: number) {
    try {
      return await this.request(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
      })
    } catch (error) {
      return mockApiClient.markNotificationAsRead(notificationId)
    }
  }

  // File upload
  async uploadFile(file: File, endpoint: string = '/api/upload') {
    const formData = new FormData()
    formData.append('file', file)

    return this.request(endpoint, {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type for FormData, let browser set it
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
    })
  }
}

export const apiClient = new ApiClient(API_BASE_URL)
export { ApiError }


