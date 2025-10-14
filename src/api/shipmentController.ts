import { Request, Response } from 'express'
import { ShipmentRequest, ShipmentOffer, Carrier } from '../types/shipment'

// Mock veritabanı (gerçek projede MongoDB/PostgreSQL kullanılacak)
let shipments: ShipmentRequest[] = []
let offers: ShipmentOffer[] = []
let carriers: Carrier[] = []

// Takip kodu oluşturma
const generateTrackingCode = (): string => {
  const prefix = 'YN'
  const timestamp = Date.now().toString().slice(-8)
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}${timestamp}${random}`
}

// Nakliye talebi oluşturma
export const createShipmentRequest = async (req: Request, res: Response) => {
  try {
    const {
      cargoType,
      roomCount,
      floorCount,
      hasFurniture,
      hasAppliances,
      hasFragile,
      description,
      sender,
      receiver,
      schedule,
      transport,
      payment,
      communication,
      security,
      notes,
      privacy
    } = req.body

    // Validasyon
    if (!cargoType || !sender || !receiver || !schedule) {
      return res.status(400).json({ message: 'Gerekli alanlar eksik' })
    }

    // Fiyat tahmini
    const basePrice = 500
    const roomMultiplier = parseInt(roomCount) * 200
    const floorMultiplier = parseInt(floorCount) * 100
    const fragileMultiplier = hasFragile ? 300 : 0
    const applianceMultiplier = hasAppliances ? 200 : 0
    const estimatedPrice = basePrice + roomMultiplier + floorMultiplier + fragileMultiplier + applianceMultiplier

    // Mesafe hesaplama (basit)
    const distance = Math.floor(Math.random() * 500) + 50

    const shipment: ShipmentRequest = {
      id: `ship_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      trackingCode: generateTrackingCode(),
      status: 'pending',
      priority: 'normal',
      cargoType,
      roomCount,
      floorCount,
      hasFurniture,
      hasAppliances,
      hasFragile,
      description,
      sender,
      receiver,
      schedule,
      transport,
      payment,
      communication,
      security,
      notes,
      privacy,
      meta: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: req.user?.id || 'anonymous',
        estimatedPrice,
        estimatedDuration: `${Math.floor(distance / 50) + 1}-${Math.floor(distance / 30) + 2} saat`,
        distance,
        fuelCost: distance * 2.5,
        tollCost: distance * 0.5,
        totalCost: estimatedPrice
      },
      offers: []
    }

    shipments.push(shipment)

    // Nakliyecilere bildirim gönder (gerçek projede WebSocket/SSE kullanılacak)
    console.log(`Yeni nakliye talebi: ${shipment.trackingCode}`)

    res.status(201).json(shipment)
  } catch (error) {
    console.error('Error creating shipment:', error)
    res.status(500).json({ message: 'Sunucu hatası' })
  }
}

// Nakliye taleplerini listeleme
export const getShipmentRequests = async (req: Request, res: Response) => {
  try {
    const {
      cargoType,
      city,
      district,
      vehicleType,
      priceRange,
      dateRange,
      status,
      priority
    } = req.query

    let filteredShipments = [...shipments]

    // Filtreleme
    if (cargoType) {
      filteredShipments = filteredShipments.filter(s => s.cargoType === cargoType)
    }
    if (city) {
      filteredShipments = filteredShipments.filter(s => 
        s.sender.city.toLowerCase().includes(city.toString().toLowerCase()) ||
        s.receiver.city.toLowerCase().includes(city.toString().toLowerCase())
      )
    }
    if (vehicleType) {
      filteredShipments = filteredShipments.filter(s => s.transport.vehicleType === vehicleType)
    }
    if (status) {
      filteredShipments = filteredShipments.filter(s => s.status === status)
    }
    if (priority) {
      filteredShipments = filteredShipments.filter(s => s.priority === priority)
    }
    if (priceRange) {
      const range = JSON.parse(priceRange as string)
      filteredShipments = filteredShipments.filter(s => 
        s.meta.estimatedPrice >= range.min && s.meta.estimatedPrice <= range.max
      )
    }

    res.json(filteredShipments)
  } catch (error) {
    console.error('Error getting shipments:', error)
    res.status(500).json({ message: 'Sunucu hatası' })
  }
}

// Tek nakliye talebi getirme
export const getShipmentRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const shipment = shipments.find(s => s.id === id)
    
    if (!shipment) {
      return res.status(404).json({ message: 'Nakliye talebi bulunamadı' })
    }

    res.json(shipment)
  } catch (error) {
    console.error('Error getting shipment:', error)
    res.status(500).json({ message: 'Sunucu hatası' })
  }
}

// Takip kodu ile sorgulama
export const trackShipment = async (req: Request, res: Response) => {
  try {
    const { trackingCode } = req.params
    const shipment = shipments.find(s => s.trackingCode === trackingCode)
    
    if (!shipment) {
      return res.status(404).json({ message: 'Takip kodu bulunamadı' })
    }

    res.json(shipment)
  } catch (error) {
    console.error('Error tracking shipment:', error)
    res.status(500).json({ message: 'Sunucu hatası' })
  }
}

// Teklif oluşturma
export const createOffer = async (req: Request, res: Response) => {
  try {
    const { shipmentId } = req.params
    const offerData = req.body

    const shipment = shipments.find(s => s.id === shipmentId)
    if (!shipment) {
      return res.status(404).json({ message: 'Nakliye talebi bulunamadı' })
    }

    const offer: ShipmentOffer = {
      id: `offer_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      shipmentId,
      ...offerData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    offers.push(offer)
    shipment.offers.push(offer)

    res.status(201).json(offer)
  } catch (error) {
    console.error('Error creating offer:', error)
    res.status(500).json({ message: 'Sunucu hatası' })
  }
}

// Teklifleri listeleme
export const getOffers = async (req: Request, res: Response) => {
  try {
    const { shipmentId } = req.params
    const shipmentOffers = offers.filter(o => o.shipmentId === shipmentId)
    res.json(shipmentOffers)
  } catch (error) {
    console.error('Error getting offers:', error)
    res.status(500).json({ message: 'Sunucu hatası' })
  }
}

// Teklifi kabul etme
export const acceptOffer = async (req: Request, res: Response) => {
  try {
    const { offerId } = req.params
    const offer = offers.find(o => o.id === offerId)
    
    if (!offer) {
      return res.status(404).json({ message: 'Teklif bulunamadı' })
    }

    offer.status = 'accepted'
    offer.updatedAt = new Date().toISOString()

    // Nakliye talebini güncelle
    const shipment = shipments.find(s => s.id === offer.shipmentId)
    if (shipment) {
      shipment.status = 'active'
      shipment.meta.updatedAt = new Date().toISOString()
    }

    res.json(offer)
  } catch (error) {
    console.error('Error accepting offer:', error)
    res.status(500).json({ message: 'Sunucu hatası' })
  }
}

// Teklifi reddetme
export const rejectOffer = async (req: Request, res: Response) => {
  try {
    const { offerId } = req.params
    const offer = offers.find(o => o.id === offerId)
    
    if (!offer) {
      return res.status(404).json({ message: 'Teklif bulunamadı' })
    }

    offer.status = 'rejected'
    offer.updatedAt = new Date().toISOString()

    res.json(offer)
  } catch (error) {
    console.error('Error rejecting offer:', error)
    res.status(500).json({ message: 'Sunucu hatası' })
  }
}

// Taşıyıcıları listeleme
export const getCarriers = async (req: Request, res: Response) => {
  try {
    const { city, vehicleType } = req.query

    let filteredCarriers = [...carriers]

    if (city) {
      filteredCarriers = filteredCarriers.filter(c => 
        c.serviceAreas.some(area => 
          area.city.toLowerCase().includes(city.toString().toLowerCase())
        )
      )
    }

    if (vehicleType) {
      filteredCarriers = filteredCarriers.filter(c => 
        c.vehicles.some(v => v.type === vehicleType)
      )
    }

    res.json(filteredCarriers)
  } catch (error) {
    console.error('Error getting carriers:', error)
    res.status(500).json({ message: 'Sunucu hatası' })
  }
}

// İstatistikler
export const getShipmentStats = async (req: Request, res: Response) => {
  try {
    const stats = {
      totalRequests: shipments.length,
      pendingRequests: shipments.filter(s => s.status === 'pending').length,
      activeRequests: shipments.filter(s => s.status === 'active').length,
      completedRequests: shipments.filter(s => s.status === 'completed').length,
      cancelledRequests: shipments.filter(s => s.status === 'cancelled').length,
      averagePrice: shipments.reduce((acc, s) => acc + s.meta.estimatedPrice, 0) / shipments.length || 0,
      averageDuration: 0, // Hesaplanacak
      successRate: 0, // Hesaplanacak
      topCities: [] as { city: string; count: number }[],
      topCargoTypes: [] as { type: string; count: number }[]
    }

    // Şehir istatistikleri
    const cityCounts: { [key: string]: number } = {}
    shipments.forEach(s => {
      cityCounts[s.sender.city] = (cityCounts[s.sender.city] || 0) + 1
      cityCounts[s.receiver.city] = (cityCounts[s.receiver.city] || 0) + 1
    })
    stats.topCities = Object.entries(cityCounts)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Yük türü istatistikleri
    const cargoTypeCounts: { [key: string]: number } = {}
    shipments.forEach(s => {
      cargoTypeCounts[s.cargoType] = (cargoTypeCounts[s.cargoType] || 0) + 1
    })
    stats.topCargoTypes = Object.entries(cargoTypeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    res.json(stats)
  } catch (error) {
    console.error('Error getting stats:', error)
    res.status(500).json({ message: 'Sunucu hatası' })
  }
}

// Fiyat tahmini
export const estimatePrice = async (req: Request, res: Response) => {
  try {
    const { cargoType, roomCount, distance, vehicleType, hasFragile, hasAppliances } = req.body

    let basePrice = 500
    let factors = []

    // Oda sayısı faktörü
    const roomFactor = parseInt(roomCount) * 200
    basePrice += roomFactor
    factors.push({ name: 'Oda Sayısı', impact: roomFactor })

    // Mesafe faktörü
    const distanceFactor = distance * 2
    basePrice += distanceFactor
    factors.push({ name: 'Mesafe', impact: distanceFactor })

    // Araç türü faktörü
    const vehicleFactor = vehicleType === 'kamyon' ? 300 : vehicleType === 'kamyonet' ? 150 : 0
    basePrice += vehicleFactor
    factors.push({ name: 'Araç Türü', impact: vehicleFactor })

    // Kırılgan eşya faktörü
    if (hasFragile) {
      const fragileFactor = 300
      basePrice += fragileFactor
      factors.push({ name: 'Kırılgan Eşya', impact: fragileFactor })
    }

    // Beyaz eşya faktörü
    if (hasAppliances) {
      const applianceFactor = 200
      basePrice += applianceFactor
      factors.push({ name: 'Beyaz Eşya', impact: applianceFactor })
    }

    const priceRange = {
      min: Math.floor(basePrice * 0.8),
      max: Math.floor(basePrice * 1.2)
    }

    res.json({
      estimatedPrice: Math.floor(basePrice),
      priceRange,
      factors
    })
  } catch (error) {
    console.error('Error estimating price:', error)
    res.status(500).json({ message: 'Sunucu hatası' })
  }
}

// Mesafe hesaplama
export const calculateDistance = async (req: Request, res: Response) => {
  try {
    const { origin, destination } = req.body

    // Basit mesafe hesaplama (gerçek projede Google Maps API kullanılacak)
    const distance = Math.floor(Math.random() * 500) + 50
    const duration = Math.floor(distance / 50) + 1

    res.json({
      distance,
      duration,
      route: [] // Gerçek projede koordinat dizisi döndürülecek
    })
  } catch (error) {
    console.error('Error calculating distance:', error)
    res.status(500).json({ message: 'Sunucu hatası' })
  }
}

// Bildirim gönderme
export const sendNotification = async (req: Request, res: Response) => {
  try {
    const { shipmentId } = req.params
    const { type, message } = req.body

    const shipment = shipments.find(s => s.id === shipmentId)
    if (!shipment) {
      return res.status(404).json({ message: 'Nakliye talebi bulunamadı' })
    }

    // Bildirim gönderme işlemi (gerçek projede SMS/Email servisleri kullanılacak)
    console.log(`Bildirim gönderildi - ${type}: ${message}`)

    res.json({ message: 'Bildirim gönderildi' })
  } catch (error) {
    console.error('Error sending notification:', error)
    res.status(500).json({ message: 'Sunucu hatası' })
  }
}

// Dosya yükleme
export const uploadFile = async (req: Request, res: Response) => {
  try {
    const { shipmentId } = req.params
    // Dosya yükleme işlemi (gerçek projede multer kullanılacak)
    
    res.json({
      url: `https://example.com/uploads/${Date.now()}_file.jpg`,
      filename: 'uploaded_file.jpg'
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    res.status(500).json({ message: 'Sunucu hatası' })
  }
}











