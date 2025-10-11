import { User, LoginCredentials, RegisterData } from '@/types/auth'

class MockApiClient {
  private baseURL: string
  private token: string | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
    this.token = localStorage.getItem('authToken')
  }

  private async mockRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500))

    // Mock responses based on endpoint
    switch (endpoint) {
      case '/api/health':
        return { status: 'OK', timestamp: new Date().toISOString(), message: 'YolNet Backend is running!' } as T

      case '/api/auth/login':
        const { email, password } = JSON.parse(options.body as string)
        const demoUsers = {
          'individual@demo.com': { password: 'demo123', user: { id: 1, name: 'Demo Individual', email: 'individual@demo.com', panel_type: 'individual', location: 'İstanbul' } },
          'corporate@demo.com': { password: 'demo123', user: { id: 2, name: 'Demo Corporate', email: 'corporate@demo.com', panel_type: 'corporate', company_name: 'Demo Şirket A.Ş.', location: 'İstanbul' } },
          'nakliyeci@demo.com': { password: 'demo123', user: { id: 3, name: 'Demo Nakliyeci', email: 'nakliyeci@demo.com', panel_type: 'nakliyeci', company_name: 'Demo Nakliye A.Ş.', location: 'İstanbul' } },
          'tasiyici@demo.com': { password: 'demo123', user: { id: 4, name: 'Demo Tasiyici', email: 'tasiyici@demo.com', panel_type: 'tasiyici', location: 'İstanbul' } }
        }

        if (demoUsers[email] && demoUsers[email].password === password) {
          const token = 'demo-token-' + Date.now()
          this.setToken(token)
          return { message: 'Login successful', token, user: demoUsers[email].user } as T
        } else {
          throw new Error('Invalid credentials')
        }

      case '/api/auth/register':
        const { name, email: regEmail, password: regPassword, panel_type } = JSON.parse(options.body as string)
        const token = 'demo-token-' + Date.now()
        this.setToken(token)
        return { message: 'User created successfully', token, user: { id: Date.now(), name, email: regEmail, panel_type } } as T

      case '/api/auth/me':
        if (!this.token) throw new Error('No token')
        return { user: { id: 1, name: 'Demo User', email: 'demo@example.com', panel_type: 'individual' } } as T

      case '/api/shipments':
        const mockShipments = [
          {
            id: 1,
            title: 'İstanbul - Ankara Kargo',
            description: 'Ev eşyaları taşıma',
            from_location: 'İstanbul',
            to_location: 'Ankara',
            from_address: 'Kadıköy, İstanbul',
            to_address: 'Çankaya, Ankara',
            weight: 25.5,
            volume: 2.5,
            price: 150,
            status: 'pending',
            priority: 'normal',
            vehicle_type: 'Kamyon',
            delivery_date: '2024-01-15',
            created_at: new Date().toISOString()
          },
          {
            id: 2,
            title: 'İzmir - Bursa Eşya Taşıma',
            description: 'Ofis eşyaları',
            from_location: 'İzmir',
            to_location: 'Bursa',
            from_address: 'Konak, İzmir',
            to_address: 'Osmangazi, Bursa',
            weight: 45.0,
            volume: 4.0,
            price: 200,
            status: 'offers_received',
            priority: 'high',
            vehicle_type: 'Tır',
            delivery_date: '2024-01-20',
            created_at: new Date().toISOString()
          },
          {
            id: 3,
            title: 'Antalya - İstanbul Hızlı Kargo',
            description: 'Acil belge gönderimi',
            from_location: 'Antalya',
            to_location: 'İstanbul',
            from_address: 'Muratpaşa, Antalya',
            to_address: 'Beşiktaş, İstanbul',
            weight: 0.5,
            volume: 0.1,
            price: 75,
            status: 'in_transit',
            priority: 'urgent',
            vehicle_type: 'Kamyonet',
            delivery_date: '2024-01-12',
            created_at: new Date().toISOString()
          }
        ]
        return mockShipments as T

      case '/api/messages':
        const mockMessages = [
          {
            id: 1,
            sender_id: 2,
            receiver_id: 1,
            shipment_id: 1,
            message: 'Merhaba, gönderiniz hakkında bilgi alabilir miyim?',
            is_read: false,
            created_at: new Date().toISOString()
          },
          {
            id: 2,
            sender_id: 3,
            receiver_id: 1,
            shipment_id: 2,
            message: 'Teklifimizi değerlendirdiniz mi?',
            is_read: true,
            created_at: new Date().toISOString()
          }
        ]
        return mockMessages as T

      case '/api/wallet':
        return { id: 1, user_id: 1, balance: 1250.50, currency: 'TRY', is_active: true } as T

      case '/api/wallet/transactions':
        const mockTransactions = [
          {
            id: 1,
            user_id: 1,
            wallet_id: 1,
            type: 'deposit',
            amount: 500,
            balance_before: 750.50,
            balance_after: 1250.50,
            description: 'Cüzdana para yatırma',
            reference_id: 'DEP-001',
            status: 'completed',
            created_at: new Date().toISOString()
          },
          {
            id: 2,
            user_id: 1,
            wallet_id: 1,
            type: 'payment',
            amount: -150,
            balance_before: 1400.50,
            balance_after: 1250.50,
            description: 'Gönderi ödemesi',
            reference_id: 'PAY-001',
            status: 'completed',
            created_at: new Date().toISOString()
          }
        ]
        return mockTransactions as T

      case '/api/analytics':
        return {
          totalShipments: 25,
          completedShipments: 20,
          pendingShipments: 5,
          completionRate: 80,
          totalEarnings: 3750,
          monthlyGrowth: 15.5,
          averageRating: 4.8
        } as T

      default:
        throw new Error('Endpoint not found')
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
    return this.mockRequest<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
  }

  async register(data: RegisterData) {
    return this.mockRequest<{ user: User; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async verifyToken() {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No token found');
    }
    
    // Mock user data based on token
    const mockUser: User = {
      id: 1,
      name: 'Demo User',
      email: 'individual@demo.com',
      panel_type: 'individual',
      company_name: 'Demo Company',
      location: 'İstanbul',
      phone: '+90 555 123 45 67',
      avatar: null
    };
    
    return Promise.resolve({ user: mockUser });
  }

  async logout() {
    this.setToken(null)
    return Promise.resolve()
  }

  // User endpoints
  async getProfile() {
    return this.mockRequest<{ user: User }>('/api/auth/me')
  }

  async updateProfile(data: Partial<User>) {
    return this.mockRequest<{ user: User }>('/api/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // Shipment endpoints
  async getShipments(params?: Record<string, any>) {
    return this.mockRequest(`/api/shipments`)
  }

  async getShipment(id: string) {
    return this.mockRequest(`/api/shipments/${id}`)
  }

  async createShipment(data: any) {
    return this.mockRequest('/api/shipments', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateShipment(id: string, data: any) {
    return this.mockRequest(`/api/shipments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteShipment(id: string) {
    return this.mockRequest(`/api/shipments/${id}`, {
      method: 'DELETE',
    })
  }

  // Message endpoints
  async getMessages(params?: Record<string, any>) {
    return this.mockRequest(`/api/messages`)
  }

  async sendMessage(data: any) {
    return this.mockRequest('/api/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Commission endpoints
  async calculateCommission(agreedPrice: number) {
    const commission = {
      agreedPrice,
      commissionRate: 0.01,
      commissionAmount: agreedPrice * 0.01,
      nakliyeciReceives: agreedPrice * 0.99,
      yolnetReceives: agreedPrice * 0.01
    };
    
    return this.mockRequest('/api/commission/calculate', {
      method: 'POST',
      body: JSON.stringify({ agreedPrice }),
    }).then(() => ({ success: true, data: commission }));
  }

  async getCommissionRate() {
    return this.mockRequest('/api/commission/rate').then(() => ({
      success: true,
      data: {
        rate: '1%',
        description: 'YolNet sadece nakliyeci\'den %1 komisyon alır'
      }
    }));
  }

  async getCommissionExamples() {
    const examples = [100, 500, 1000, 5000, 10000].map(price => ({
      agreedPrice: price,
      nakliyeciReceives: price * 0.99,
      yolnetCommission: price * 0.01,
      percentage: '1%'
    }));
    
    return this.mockRequest('/api/commission/examples').then(() => ({
      success: true,
      data: examples
    }));
  }

  // Offers methods
  async createOffer(offerData: any) {
    const offer = {
      id: Math.floor(Math.random() * 10000),
      ...offerData,
      status: 'pending',
      created_at: new Date().toISOString()
    }
    return Promise.resolve(offer)
  }

  async getShipmentOffers(shipmentId: number) {
    const offers = [
      {
        id: 1,
        shipment_id: shipmentId,
        nakliyeci_id: 3,
        price: 1500,
        message: 'Hızlı teslimat yapabilirim',
        estimated_delivery: '2024-01-20T10:00:00Z',
        status: 'pending',
        nakliyeci_name: 'Ekol Lojistik A.Ş.',
        company_name: 'Ekol Lojistik A.Ş.',
        location: 'İstanbul',
        phone: '+90 212 123 45 67',
        avatar: null,
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        shipment_id: shipmentId,
        nakliyeci_id: 4,
        price: 1200,
        message: 'En uygun fiyat garantisi',
        estimated_delivery: '2024-01-22T14:00:00Z',
        status: 'pending',
        nakliyeci_name: 'Aras Kargo',
        company_name: 'Aras Kargo',
        location: 'Ankara',
        phone: '+90 312 987 65 43',
        avatar: null,
        created_at: new Date().toISOString()
      }
    ]
    return Promise.resolve(offers)
  }

  async getNakliyeciOffers(status?: string) {
    const offers = [
      {
        id: 1,
        shipment_id: 1,
        nakliyeci_id: 3,
        price: 1500,
        message: 'Hızlı teslimat yapabilirim',
        estimated_delivery: '2024-01-20T10:00:00Z',
        status: status || 'pending',
        title: 'İstanbul - Ankara Kargo',
        description: 'Acil gönderi',
        from_location: 'İstanbul',
        to_location: 'Ankara',
        weight: 25.5,
        volume: 0.5,
        sender_name: 'Ahmet Yılmaz',
        sender_company: 'ABC Şirketi',
        created_at: new Date().toISOString()
      }
    ]
    return Promise.resolve(offers)
  }

  async acceptOffer(offerId: number) {
    return Promise.resolve({ message: 'Teklif onaylandı', offer_id: offerId })
  }

  async rejectOffer(offerId: number) {
    return Promise.resolve({ message: 'Teklif reddedildi', offer_id: offerId })
  }

  // Agreements methods
  async createAgreement(offerId: number) {
    const agreement = {
      id: Math.floor(Math.random() * 10000),
      offer_id: offerId,
      shipment_id: 1,
      sender_id: 1,
      nakliyeci_id: 3,
      agreed_price: 1500,
      commission_amount: 15,
      nakliyeci_receives: 1485,
      status: 'pending',
      created_at: new Date().toISOString()
    }
    return Promise.resolve(agreement)
  }

  async getSenderAgreements(status?: string) {
    const agreements = [
      {
        id: 1,
        offer_id: 1,
        shipment_id: 1,
        sender_id: 1,
        nakliyeci_id: 3,
        agreed_price: 1500,
        commission_amount: 15,
        nakliyeci_receives: 1485,
        status: status || 'pending',
        title: 'İstanbul - Ankara Kargo',
        from_location: 'İstanbul',
        to_location: 'Ankara',
        weight: 25.5,
        volume: 0.5,
        nakliyeci_name: 'Ekol Lojistik A.Ş.',
        company_name: 'Ekol Lojistik A.Ş.',
        phone: '+90 212 123 45 67',
        avatar: null,
        created_at: new Date().toISOString()
      }
    ]
    return Promise.resolve(agreements)
  }

  async getNakliyeciAgreements(status?: string) {
    const agreements = [
      {
        id: 1,
        offer_id: 1,
        shipment_id: 1,
        sender_id: 1,
        nakliyeci_id: 3,
        agreed_price: 1500,
        commission_amount: 15,
        nakliyeci_receives: 1485,
        status: status || 'pending',
        title: 'İstanbul - Ankara Kargo',
        from_location: 'İstanbul',
        to_location: 'Ankara',
        weight: 25.5,
        volume: 0.5,
        sender_name: 'Ahmet Yılmaz',
        sender_company: 'ABC Şirketi',
        sender_phone: '+90 555 123 45 67',
        created_at: new Date().toISOString()
      }
    ]
    return Promise.resolve(agreements)
  }

  async acceptAgreement(agreementId: number) {
    return Promise.resolve({ message: 'Anlaşma onaylandı', agreement_id: agreementId })
  }

  async rejectAgreement(agreementId: number) {
    return Promise.resolve({ message: 'Anlaşma reddedildi', agreement_id: agreementId })
  }

  // Tracking methods
  async updateShipmentStatus(shipmentId: number, statusData: any) {
    return Promise.resolve({ 
      message: 'Durum güncellendi', 
      shipment_id: shipmentId, 
      status: statusData.status,
      tracking_id: Math.floor(Math.random() * 10000)
    })
  }

  async getTrackingHistory(shipmentId: number) {
    const history = [
      {
        id: 1,
        shipment_id: shipmentId,
        status: 'picked_up',
        location: 'İstanbul',
        notes: 'Gönderi alındı',
        image_url: null,
        updated_by: 3,
        updated_by_name: 'Ekol Lojistik A.Ş.',
        company_name: 'Ekol Lojistik A.Ş.',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 2,
        shipment_id: shipmentId,
        status: 'in_transit',
        location: 'Sakarya',
        notes: 'Yolda',
        image_url: null,
        updated_by: 3,
        updated_by_name: 'Ekol Lojistik A.Ş.',
        company_name: 'Ekol Lojistik A.Ş.',
        created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
      }
    ]
    return Promise.resolve(history)
  }

  async getActiveShipments(userType: 'sender' | 'nakliyeci') {
    const shipments = [
      {
        id: 1,
        title: 'İstanbul - Ankara Kargo',
        from_location: 'İstanbul',
        to_location: 'Ankara',
        weight: 25.5,
        volume: 0.5,
        status: 'in_transit',
        agreed_price: 1500,
        commission_amount: 15,
        nakliyeci_receives: 1485,
        ...(userType === 'sender' ? {
          nakliyeci_name: 'Ekol Lojistik A.Ş.',
          nakliyeci_company: 'Ekol Lojistik A.Ş.',
          nakliyeci_phone: '+90 212 123 45 67'
        } : {
          sender_name: 'Ahmet Yılmaz',
          sender_company: 'ABC Şirketi',
          sender_phone: '+90 555 123 45 67'
        }),
        created_at: new Date().toISOString()
      }
    ]
    return Promise.resolve(shipments)
  }

  async confirmDelivery(shipmentId: number, rating: number, feedback?: string) {
    return Promise.resolve({ message: 'Teslimat onaylandı', shipment_id: shipmentId })
  }

  // Commission methods - removed duplicates

  // Dashboard endpoints
  async getDashboardStats() {
    return Promise.resolve({
      totalShipments: 12,
      deliveredShipments: 8,
      pendingShipments: 3,
      successRate: 85.5,
      totalSpent: 15000,
      thisMonthSpent: 3500,
      totalSavings: 2500,
      thisMonthSavings: 600
    })
  }

  async getNotifications(params?: { limit?: number; offset?: number }) {
    const notifications = [
      {
        id: 1,
        title: 'Yeni Teklif',
        message: 'Gönderiniz için yeni bir teklif geldi',
        type: 'offer',
        is_read: false,
        created_at: new Date().toISOString(),
        action_url: '/individual/offers'
      },
      {
        id: 2,
        title: 'Gönderi Güncellendi',
        message: 'Gönderinizin durumu güncellendi',
        type: 'shipment',
        is_read: true,
        created_at: new Date(Date.now() - 3600000).toISOString(),
        action_url: '/individual/shipments'
      }
    ]
    return Promise.resolve(notifications)
  }

  async getUnreadNotificationCount() {
    return Promise.resolve({ unreadCount: 1 })
  }

  async markNotificationAsRead(notificationId: number) {
    return Promise.resolve({ message: 'Bildirim okundu olarak işaretlendi' })
  }

  // Analytics endpoints
  async getAnalytics(params?: Record<string, any>) {
    return this.mockRequest(`/api/analytics`)
  }

  // File upload
  async uploadFile(file: File, endpoint: string = '/api/upload') {
    return this.mockRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({ filename: file.name, size: file.size }),
    })
  }
}

export const mockApiClient = new MockApiClient('http://localhost:5000')

