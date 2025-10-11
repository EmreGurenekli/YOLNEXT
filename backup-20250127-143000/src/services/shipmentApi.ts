import { ShipmentRequest, ShipmentOffer, Carrier, ShipmentFilter, ShipmentStats } from '../types/shipment'

const API_BASE_URL = 'http://localhost:3001/api'

class ShipmentApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    const token = localStorage.getItem('authToken')
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'API request failed')
      }
      
      return await response.json()
    } catch (error) {
      console.error('API Error:', error)
      throw error
    }
  }

  // Nakliye Talebi Oluşturma
  async createShipmentRequest(data: Omit<ShipmentRequest, 'id' | 'trackingCode' | 'status' | 'meta' | 'offers'>): Promise<ShipmentRequest> {
    return this.request<ShipmentRequest>('/shipments', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Nakliye Taleplerini Listeleme
  async getShipmentRequests(filter?: ShipmentFilter): Promise<ShipmentRequest[]> {
    const params = new URLSearchParams()
    if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
        if (value) {
          if (typeof value === 'object') {
            params.append(key, JSON.stringify(value))
          } else {
            params.append(key, value.toString())
          }
        }
      })
    }
    
    const queryString = params.toString()
    return this.request<ShipmentRequest[]>(`/shipments${queryString ? `?${queryString}` : ''}`)
  }

  // Tek Nakliye Talebi Getirme
  async getShipmentRequest(id: string): Promise<ShipmentRequest> {
    return this.request<ShipmentRequest>(`/shipments/${id}`)
  }

  // Nakliye Talebini Güncelleme
  async updateShipmentRequest(id: string, data: Partial<ShipmentRequest>): Promise<ShipmentRequest> {
    return this.request<ShipmentRequest>(`/shipments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // Nakliye Talebini Silme
  async deleteShipmentRequest(id: string): Promise<void> {
    return this.request<void>(`/shipments/${id}`, {
      method: 'DELETE',
    })
  }

  // Teklif Oluşturma
  async createOffer(shipmentId: string, data: Omit<ShipmentOffer, 'id' | 'shipmentId' | 'createdAt' | 'updatedAt'>): Promise<ShipmentOffer> {
    return this.request<ShipmentOffer>(`/shipments/${shipmentId}/offers`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Teklifleri Listeleme
  async getOffers(shipmentId: string): Promise<ShipmentOffer[]> {
    return this.request<ShipmentOffer[]>(`/shipments/${shipmentId}/offers`)
  }

  // Teklifi Kabul Etme
  async acceptOffer(offerId: string): Promise<ShipmentOffer> {
    return this.request<ShipmentOffer>(`/offers/${offerId}/accept`, {
      method: 'POST',
    })
  }

  // Teklifi Reddetme
  async rejectOffer(offerId: string): Promise<ShipmentOffer> {
    return this.request<ShipmentOffer>(`/offers/${offerId}/reject`, {
      method: 'POST',
    })
  }

  // Taşıyıcıları Listeleme
  async getCarriers(filter?: { city?: string; vehicleType?: string }): Promise<Carrier[]> {
    const params = new URLSearchParams()
    if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
        if (value) {
          params.append(key, value)
        }
      })
    }
    
    const queryString = params.toString()
    return this.request<Carrier[]>(`/carriers${queryString ? `?${queryString}` : ''}`)
  }

  // Tek Taşıyıcı Getirme
  async getCarrier(id: string): Promise<Carrier> {
    return this.request<Carrier>(`/carriers/${id}`)
  }

  // İstatistikler
  async getShipmentStats(): Promise<ShipmentStats> {
    return this.request<ShipmentStats>('/shipments/stats')
  }

  // Takip Kodu ile Sorgulama
  async trackShipment(trackingCode: string): Promise<ShipmentRequest> {
    return this.request<ShipmentRequest>(`/shipments/track/${trackingCode}`)
  }

  // Fiyat Tahmini
  async estimatePrice(data: {
    cargoType: string
    roomCount: string
    distance: number
    vehicleType: string
    hasFragile: boolean
    hasAppliances: boolean
  }): Promise<{
    estimatedPrice: number
    priceRange: { min: number; max: number }
    factors: { name: string; impact: number }[]
  }> {
    return this.request<{
      estimatedPrice: number
      priceRange: { min: number; max: number }
      factors: { name: string; impact: number }[]
    }>('/shipments/estimate-price', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Mesafe Hesaplama
  async calculateDistance(origin: string, destination: string): Promise<{
    distance: number
    duration: number
    route: { lat: number; lng: number }[]
  }> {
    return this.request<{
      distance: number
      duration: number
      route: { lat: number; lng: number }[]
    }>('/shipments/calculate-distance', {
      method: 'POST',
      body: JSON.stringify({ origin, destination }),
    })
  }

  // Bildirim Gönderme
  async sendNotification(shipmentId: string, type: 'sms' | 'email' | 'whatsapp', message: string): Promise<void> {
    return this.request<void>(`/shipments/${shipmentId}/notifications`, {
      method: 'POST',
      body: JSON.stringify({ type, message }),
    })
  }

  // Dosya Yükleme
  async uploadFile(file: File, shipmentId: string): Promise<{ url: string; filename: string }> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('shipmentId', shipmentId)

    return this.request<{ url: string; filename: string }>(`/shipments/${shipmentId}/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        // Content-Type'ı FormData için otomatik ayarla
      },
    })
  }
}

export const shipmentApi = new ShipmentApiService()
export default shipmentApi
