// Nakliye Talebi Veri Tipleri
export interface ShipmentRequest {
  id: string
  trackingCode: string
  status: 'pending' | 'active' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  
  // Yük Bilgileri
  cargoType: 'ev_esyasi' | 'ciftci' | 'kisisel' | 'is_yeri' | 'ozel'
  roomCount: string
  floorCount: string
  hasFurniture: boolean
  hasAppliances: boolean
  hasFragile: boolean
  description: string
  
  // Gönderici Bilgileri
  sender: {
    name: string
    phone: string
    email: string
    address: string
    city: string
    district: string
    postalCode: string
    locationType: 'ev' | 'ofis' | 'magaza' | 'depo'
  }
  
  // Alıcı Bilgileri
  receiver: {
    name: string
    phone: string
    email: string
    address: string
    city: string
    district: string
    postalCode: string
    locationType: 'ev' | 'ofis' | 'magaza' | 'depo'
  }
  
  // Tarih ve Zaman
  schedule: {
    loadingDate: string
    loadingTime: string
    deliveryDate: string
    deliveryTime: string
    loadingWindow: string
    deliveryWindow: string
    flexibleDelivery: boolean
    maxWaitTime: string
  }
  
  // Araç ve Taşıma
  transport: {
    vehicleType: 'van' | 'kamyonet' | 'kamyon'
    loadingFloor: string
    unloadingFloor: string
    loadingAccess: string
    unloadingAccess: string
    loadingInstructions: string
    unloadingInstructions: string
  }
  
  // Ödeme
  payment: {
    method: 'nakit' | 'kredi_karti' | 'havale' | 'pos'
    codAmount: string
    insurance: boolean
    insuranceValue: string
  }
  
  // İletişim
  communication: {
    smsNotification: boolean
    emailNotification: boolean
    phoneNotification: boolean
    whatsappNotification: boolean
    frequency: 'normal' | 'frequent' | 'minimal'
    preferredTime: string
  }
  
  // Güvenlik ve Takip
  security: {
    signatureRequired: boolean
    idVerification: boolean
    photoTracking: boolean
    gpsTracking: boolean
  }
  
  // Özel Notlar
  notes: {
    specialInstructions: string
    deliveryNotes: string
    loadingNotes: string
  }
  
  // Güvenlik ve Gizlilik
  privacy: {
    gdprConsent: boolean
    termsAccepted: boolean
    privacyAccepted: boolean
  }
  
  // Meta Bilgiler
  meta: {
    createdAt: string
    updatedAt: string
    createdBy: string
    estimatedPrice: number
    estimatedDuration: string
    distance: number
    fuelCost: number
    tollCost: number
    totalCost: number
  }
  
  // Teklifler
  offers: ShipmentOffer[]
}

export interface ShipmentOffer {
  id: string
  shipmentId: string
  carrierId: string
  carrierName: string
  carrierRating: number
  carrierExperience: number
  carrierPhone: string
  carrierEmail: string
  
  // Teklif Detayları
  price: number
  currency: 'TRY' | 'USD' | 'EUR'
  estimatedDuration: string
  estimatedDistance: number
  fuelCost: number
  tollCost: number
  totalCost: number
  
  // Araç Bilgileri
  vehicle: {
    type: 'van' | 'kamyonet' | 'kamyon'
    model: string
    year: number
    capacity: string
    licensePlate: string
    driverName: string
    driverPhone: string
    driverLicense: string
  }
  
  // Teklif Durumu
  status: 'pending' | 'accepted' | 'rejected' | 'expired'
  validUntil: string
  specialConditions: string
  notes: string
  
  // Meta Bilgiler
  createdAt: string
  updatedAt: string
  isRecommended: boolean
  isVerified: boolean
}

export interface Carrier {
  id: string
  name: string
  email: string
  phone: string
  rating: number
  experience: number
  totalShipments: number
  successRate: number
  responseTime: number
  
  // Araç Bilgileri
  vehicles: {
    id: string
    type: 'van' | 'kamyonet' | 'kamyon'
    model: string
    year: number
    capacity: string
    licensePlate: string
    isAvailable: boolean
  }[]
  
  // Hizmet Alanları
  serviceAreas: {
    city: string
    district: string
    radius: number
  }[]
  
  // Uzmanlık Alanları
  specialties: string[]
  
  // Meta Bilgiler
  isVerified: boolean
  isOnline: boolean
  lastActive: string
  createdAt: string
}

export interface ShipmentFilter {
  cargoType?: string
  city?: string
  district?: string
  vehicleType?: string
  priceRange?: {
    min: number
    max: number
  }
  dateRange?: {
    start: string
    end: string
  }
  status?: string
  priority?: string
}

export interface ShipmentStats {
  totalRequests: number
  pendingRequests: number
  activeRequests: number
  completedRequests: number
  cancelledRequests: number
  averagePrice: number
  averageDuration: number
  successRate: number
  topCities: {
    city: string
    count: number
  }[]
  topCargoTypes: {
    type: string
    count: number
  }[]
}















