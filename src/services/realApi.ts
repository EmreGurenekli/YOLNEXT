// Gerçek API servisleri - SQLite veritabanı ile çalışır

const API_BASE_URL = (import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'production'
  ? 'https://api.yolnext.com'
  : 'http://localhost:5000')) + '/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  panel_type: 'individual' | 'corporate' | 'nakliyeci' | 'tasiyici';
  company_name?: string;
  location?: string;
}

interface Shipment {
  id: number;
  trackingCode: string;
  status: string;
  cargoType: string;
  description: string;
  sender: {
    name: string;
    phone: string;
    address: string;
    city: string;
  };
  receiver: {
    name: string;
    phone: string;
    address: string;
    city: string;
  };
  schedule: {
    loadingDate: string;
    deliveryDate: string;
  };
  estimatedValue: number;
  createdAt: string;
  updatedAt: string;
}

interface Offer {
  id: number;
  price: number;
  estimatedDays: number;
  notes: string;
  vehicleType: string;
  status: string;
  carrier: {
    name: string;
    companyName?: string;
    rating: number;
    totalJobs: number;
    completedJobs: number;
  };
  createdAt: string;
}

class RealApiService {
  private token: string | null = null;

  constructor() {
    const t = localStorage.getItem('authToken') || localStorage.getItem('token');
    this.token = t && t !== 'null' && t !== 'undefined' ? t : null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;

    // Refresh token in case AuthContext updated localStorage after service instantiation
    if (!this.token) {
      const t = localStorage.getItem('authToken') || localStorage.getItem('token');
      this.token = t && t !== 'null' && t !== 'undefined' ? t : null;
    }

    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'API hatası');
      }

      return data;
    } catch (error) {
      console.error('API isteği hatası:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Bilinmeyen hata',
      };
    }
  }

  // AUTH ENDPOINTS
  async login(
    email: string,
    password: string
  ): Promise<ApiResponse<{ user: User; token: string }>> {
    const response = await this.request<{ user: User; token: string }>(
      '/real-auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );

    if (response.success && response.data) {
      this.token = response.data.token;
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('token', response.data.token);
    }

    return response;
  }

  async register(userData: {
    name: string;
    email: string;
    password: string;
    panel_type: string;
    company_name?: string;
    location?: string;
  }): Promise<ApiResponse<{ user: User; token: string }>> {
    const response = await this.request<{ user: User; token: string }>(
      '/real-auth/register',
      {
        method: 'POST',
        body: JSON.stringify(userData),
      }
    );

    if (response.success && response.data) {
      this.token = response.data.token;
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('token', response.data.token);
    }

    return response;
  }

  async logout(): Promise<ApiResponse<void>> {
    this.token = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return { success: true };
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.request<User>('/real-auth/me');
  }

  // SHIPMENT ENDPOINTS
  async createShipment(
    shipmentData: any
  ): Promise<ApiResponse<{ shipment: any }>> {
    return this.request<{ shipment: any }>('/real-shipments/create', {
      method: 'POST',
      body: JSON.stringify(shipmentData),
    });
  }

  async publishShipment(shipmentId: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/real-shipments/${shipmentId}/publish`, {
      method: 'POST',
    });
  }

  async getActiveShipments(params?: {
    page?: number;
    limit?: number;
    cargoType?: string;
    fromCity?: string;
    toCity?: string;
  }): Promise<ApiResponse<{ shipments: Shipment[]; pagination: any }>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.cargoType) queryParams.append('cargoType', params.cargoType);
    if (params?.fromCity) queryParams.append('fromCity', params.fromCity);
    if (params?.toCity) queryParams.append('toCity', params.toCity);

    const endpoint = `/real-shipments/active${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request<{ shipments: Shipment[]; pagination: any }>(endpoint);
  }

  async createOffer(
    shipmentId: number,
    offerData: {
      price: number;
      estimatedDays: number;
      notes: string;
      vehicleType: string;
    }
  ): Promise<ApiResponse<{ offerId: number }>> {
    return this.request<{ offerId: number }>(
      `/real-shipments/${shipmentId}/offer`,
      {
        method: 'POST',
        body: JSON.stringify(offerData),
      }
    );
  }

  async getOffers(
    shipmentId: number
  ): Promise<ApiResponse<{ offers: Offer[] }>> {
    return this.request<{ offers: Offer[] }>(
      `/real-shipments/${shipmentId}/offers`
    );
  }

  async acceptOffer(
    shipmentId: number,
    offerId: number
  ): Promise<ApiResponse<void>> {
    return this.request<void>(
      `/real-shipments/${shipmentId}/accept-offer/${offerId}`,
      {
        method: 'POST',
      }
    );
  }

  async trackShipment(
    shipmentId: number
  ): Promise<ApiResponse<{ shipment: any }>> {
    return this.request<{ shipment: any }>(
      `/real-shipments/${shipmentId}/track`
    );
  }

  // DASHBOARD ENDPOINTS
  async getDashboardStats(): Promise<
    ApiResponse<{
      totalShipments: number;
      activeShipments: number;
      completedShipments: number;
      totalEarnings: number;
      thisMonthEarnings: number;
      successRate: number;
    }>
  > {
    return this.request<any>('/dashboard/stats');
  }

  async getMyShipments(): Promise<ApiResponse<{ shipments: Shipment[] }>> {
    return this.request<{ shipments: Shipment[] }>('/dashboard/my-shipments');
  }

  async getMyOffers(): Promise<ApiResponse<{ offers: Offer[] }>> {
    return this.request<{ offers: Offer[] }>('/dashboard/my-offers');
  }

  // NOTIFICATION ENDPOINTS
  async getNotifications(): Promise<ApiResponse<{ notifications: any[] }>> {
    return this.request<{ notifications: any[] }>('/notifications');
  }

  async markNotificationAsRead(
    notificationId: number
  ): Promise<ApiResponse<void>> {
    return this.request<void>(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsAsRead(): Promise<ApiResponse<void>> {
    return this.request<void>('/notifications/mark-all-read', {
      method: 'PUT',
    });
  }

  // PAYMENT ENDPOINTS
  async createPayment(paymentData: {
    shipmentId: number;
    amount: number;
    paymentMethod: string;
  }): Promise<ApiResponse<{ paymentId: number }>> {
    return this.request<{ paymentId: number }>('/payments/create', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  async getPaymentStatus(
    paymentId: number
  ): Promise<ApiResponse<{ status: string }>> {
    return this.request<{ status: string }>(`/payments/${paymentId}/status`);
  }

  // WALLET ENDPOINTS
  async getWalletBalance(): Promise<ApiResponse<{ balance: number }>> {
    return this.request<{ balance: number }>('/wallet/balance');
  }

  async getWalletTransactions(): Promise<ApiResponse<{ transactions: any[] }>> {
    return this.request<{ transactions: any[] }>('/wallet/transactions');
  }

  // MESSAGE ENDPOINTS
  async sendMessage(messageData: {
    receiverId: number;
    shipmentId?: number;
    message: string;
  }): Promise<ApiResponse<{ messageId: number }>> {
    return this.request<{ messageId: number }>('/messages/send', {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  }

  async getMessages(
    shipmentId?: number
  ): Promise<ApiResponse<{ messages: any[] }>> {
    const endpoint = shipmentId
      ? `/messages?shipmentId=${shipmentId}`
      : '/messages';
    return this.request<{ messages: any[] }>(endpoint);
  }

  // STATUS UPDATE ENDPOINTS
  async updateShipmentStatus(
    shipmentId: number,
    status: string,
    data?: any
  ): Promise<ApiResponse<void>> {
    return this.request<void>(`/shipments/${shipmentId}/update-status`, {
      method: 'POST',
      body: JSON.stringify({ status, ...data }),
    });
  }

  // FILE UPLOAD ENDPOINTS
  async uploadFile(
    file: File,
    type: 'photo' | 'document'
  ): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    return this.request<{ url: string }>('/upload', {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type, let browser set it with boundary
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
    });
  }
}

// Singleton instance
export const realApiService = new RealApiService();

// Export types
export type { User, Shipment, Offer, ApiResponse };
