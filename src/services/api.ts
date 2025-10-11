const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth methods
  async login(email: string, password: string) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.success && response.data?.token) {
      this.token = response.data.token;
      localStorage.setItem('token', this.token);
    }
    
    return response;
  }

  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    userType: 'individual' | 'corporate' | 'carrier' | 'driver';
    phone?: string;
  }) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (response.success && response.data?.token) {
      this.token = response.data.token;
      localStorage.setItem('token', this.token);
    }
    
    return response;
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async logout() {
    const response = await this.request('/auth/logout', {
      method: 'POST',
    });
    
    this.token = null;
    localStorage.removeItem('token');
    
    return response;
  }

  // User methods
  async getUserProfile() {
    return this.request('/users/profile');
  }

  async updateUserProfile(profileData: any) {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async createCorporateProfile(profileData: any) {
    return this.request('/users/corporate-profile', {
      method: 'POST',
      body: JSON.stringify(profileData),
    });
  }

  async createCarrierProfile(profileData: any) {
    return this.request('/users/carrier-profile', {
      method: 'POST',
      body: JSON.stringify(profileData),
    });
  }

  async createDriverProfile(profileData: any) {
    return this.request('/users/driver-profile', {
      method: 'POST',
      body: JSON.stringify(profileData),
    });
  }

  // Shipment methods
  async createShipment(shipmentData: any) {
    return this.request('/shipments', {
      method: 'POST',
      body: JSON.stringify(shipmentData),
    });
  }

  async getShipments(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const queryString = queryParams.toString();
    return this.request(`/shipments${queryString ? `?${queryString}` : ''}`);
  }

  async getShipment(id: string) {
    return this.request(`/shipments/${id}`);
  }

  async updateShipment(id: string, shipmentData: any) {
    return this.request(`/shipments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(shipmentData),
    });
  }

  async cancelShipment(id: string) {
    return this.request(`/shipments/${id}`, {
      method: 'DELETE',
    });
  }

  async trackShipment(trackingNumber: string) {
    return this.request(`/shipments/track/${trackingNumber}`);
  }

  // Offer methods
  async createOffer(offerData: any) {
    return this.request('/offers', {
      method: 'POST',
      body: JSON.stringify(offerData),
    });
  }

  async getOffers(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const queryString = queryParams.toString();
    return this.request(`/offers${queryString ? `?${queryString}` : ''}`);
  }

  async getOffer(id: string) {
    return this.request(`/offers/${id}`);
  }

  async acceptOffer(id: string) {
    return this.request(`/offers/${id}/accept`, {
      method: 'PUT',
    });
  }

  async rejectOffer(id: string) {
    return this.request(`/offers/${id}/reject`, {
      method: 'PUT',
    });
  }

  async cancelOffer(id: string) {
    return this.request(`/offers/${id}`, {
      method: 'DELETE',
    });
  }

  // Carrier methods
  async getCarriers(params?: {
    city?: string;
    serviceArea?: string;
    vehicleType?: string;
    rating?: number;
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.city) queryParams.append('city', params.city);
    if (params?.serviceArea) queryParams.append('serviceArea', params.serviceArea);
    if (params?.vehicleType) queryParams.append('vehicleType', params.vehicleType);
    if (params?.rating) queryParams.append('rating', params.rating.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const queryString = queryParams.toString();
    return this.request(`/carriers${queryString ? `?${queryString}` : ''}`);
  }

  async getCarrier(id: string) {
    return this.request(`/carriers/${id}`);
  }

  async getCarrierOffers(id: string, params?: {
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const queryString = queryParams.toString();
    return this.request(`/carriers/${id}/offers${queryString ? `?${queryString}` : ''}`);
  }

  async getCarrierStats(id: string) {
    return this.request(`/carriers/${id}/stats`);
  }

  // Driver methods
  async getDrivers(params?: {
    city?: string;
    vehicleType?: string;
    rating?: number;
    isAvailable?: boolean;
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.city) queryParams.append('city', params.city);
    if (params?.vehicleType) queryParams.append('vehicleType', params.vehicleType);
    if (params?.rating) queryParams.append('rating', params.rating.toString());
    if (params?.isAvailable !== undefined) queryParams.append('isAvailable', params.isAvailable.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const queryString = queryParams.toString();
    return this.request(`/drivers${queryString ? `?${queryString}` : ''}`);
  }

  async getDriver(id: string) {
    return this.request(`/drivers/${id}`);
  }

  async updateDriverAvailability(id: string, availabilityData: {
    isAvailable: boolean;
    currentLocation?: { lat: number; lng: number };
  }) {
    return this.request(`/drivers/${id}/availability`, {
      method: 'PUT',
      body: JSON.stringify(availabilityData),
    });
  }

  // Notification methods
  async getNotifications(params?: {
    page?: number;
    limit?: number;
    isRead?: boolean;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.isRead !== undefined) queryParams.append('isRead', params.isRead.toString());
    
    const queryString = queryParams.toString();
    return this.request(`/notifications${queryString ? `?${queryString}` : ''}`);
  }

  async markNotificationAsRead(id: string) {
    return this.request(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsAsRead() {
    return this.request('/notifications/read-all', {
      method: 'PUT',
    });
  }

  async deleteNotification(id: string) {
    return this.request(`/notifications/${id}`, {
      method: 'DELETE',
    });
  }

  // Payment methods
  async createPaymentIntent(shipmentId: string, amount: number) {
    return this.request('/payments/create-payment-intent', {
      method: 'POST',
      body: JSON.stringify({ shipmentId, amount }),
    });
  }

  async confirmPayment(paymentIntentId: string, shipmentId: string) {
    return this.request('/payments/confirm-payment', {
      method: 'POST',
      body: JSON.stringify({ paymentIntentId, shipmentId }),
    });
  }

  async getPaymentHistory(params?: {
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const queryString = queryParams.toString();
    return this.request(`/payments/history${queryString ? `?${queryString}` : ''}`);
  }

  async getCommissionHistory(params?: {
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const queryString = queryParams.toString();
    return this.request(`/payments/commission-history${queryString ? `?${queryString}` : ''}`);
  }
}

export default new ApiService();