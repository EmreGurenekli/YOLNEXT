import { ShipmentRequest, Carrier } from '../types/shipment'

// Mock nakliye talepleri oluşturucu
export const generateMockShipments = (count: number = 20): ShipmentRequest[] => {
  const cargoTypes = ['ev_esyasi', 'ciftci', 'kisisel', 'is_yeri', 'ozel'] as const
  const cities = ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Gaziantep']
  const districts = ['Merkez', 'Kadıköy', 'Beşiktaş', 'Şişli', 'Beyoğlu', 'Üsküdar', 'Fatih', 'Bakırköy']
  const vehicleTypes = ['van', 'kamyonet', 'kamyon'] as const
  const statuses = ['pending', 'active', 'in_progress', 'completed', 'cancelled'] as const
  const priorities = ['low', 'normal', 'high', 'urgent'] as const

  const shipments: ShipmentRequest[] = []

  for (let i = 0; i < count; i++) {
    const cargoType = cargoTypes[Math.floor(Math.random() * cargoTypes.length)]
    const senderCity = cities[Math.floor(Math.random() * cities.length)]
    const receiverCity = cities[Math.floor(Math.random() * cities.length)]
    const roomCount = Math.floor(Math.random() * 5) + 1
    const floorCount = Math.floor(Math.random() * 3) + 1
    const distance = Math.floor(Math.random() * 500) + 50
    const basePrice = 500 + (roomCount * 200) + (floorCount * 100) + distance * 2
    const estimatedPrice = Math.floor(basePrice + (Math.random() * 1000))

    const shipment: ShipmentRequest = {
      id: `ship_${Date.now()}_${i}`,
      trackingCode: `YN${Date.now().toString().slice(-8)}${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      cargoType,
      roomCount: roomCount.toString(),
      floorCount: floorCount.toString(),
      hasFurniture: Math.random() > 0.5,
      hasAppliances: Math.random() > 0.7,
      hasFragile: Math.random() > 0.6,
      description: `${cargoType === 'ev_esyasi' ? 'Ev eşyası taşıma' : 
                   cargoType === 'ciftci' ? 'Çiftçi yükü taşıma' :
                   cargoType === 'kisisel' ? 'Kişisel eşya taşıma' :
                   cargoType === 'is_yeri' ? 'İş yeri eşyası taşıma' : 'Özel eşya taşıma'} - ${roomCount} oda`,
      
      sender: {
        name: `Gönderici ${i + 1}`,
        phone: `+90 555 ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 90) + 10}`,
        email: `sender${i + 1}@example.com`,
        address: `${Math.floor(Math.random() * 100) + 1}. Sokak No:${Math.floor(Math.random() * 50) + 1}`,
        city: senderCity,
        district: districts[Math.floor(Math.random() * districts.length)],
        postalCode: `${Math.floor(Math.random() * 90000) + 10000}`,
        locationType: 'ev'
      },
      
      receiver: {
        name: `Alıcı ${i + 1}`,
        phone: `+90 555 ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 90) + 10}`,
        email: `receiver${i + 1}@example.com`,
        address: `${Math.floor(Math.random() * 100) + 1}. Sokak No:${Math.floor(Math.random() * 50) + 1}`,
        city: receiverCity,
        district: districts[Math.floor(Math.random() * districts.length)],
        postalCode: `${Math.floor(Math.random() * 90000) + 10000}`,
        locationType: 'ev'
      },
      
      schedule: {
        loadingDate: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        loadingTime: '09:00',
        deliveryDate: new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        deliveryTime: '17:00',
        loadingWindow: 'sabah',
        deliveryWindow: 'ogleden_sonra',
        flexibleDelivery: Math.random() > 0.5,
        maxWaitTime: '30'
      },
      
      transport: {
        vehicleType: vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)],
        loadingFloor: Math.floor(Math.random() * 5) + 1,
        unloadingFloor: Math.floor(Math.random() * 5) + 1,
        loadingAccess: 'genis_sokak',
        unloadingAccess: 'genis_sokak',
        loadingInstructions: 'Yükleme sırasında dikkatli olun',
        unloadingInstructions: 'Teslimat sırasında dikkatli olun'
      },
      
      payment: {
        method: 'nakit',
        codAmount: '',
        insurance: Math.random() > 0.7,
        insuranceValue: Math.random() > 0.7 ? (estimatedPrice * 0.1).toString() : ''
      },
      
      communication: {
        smsNotification: true,
        emailNotification: true,
        phoneNotification: Math.random() > 0.5,
        whatsappNotification: Math.random() > 0.5,
        frequency: 'normal',
        preferredTime: '09:00-18:00'
      },
      
      security: {
        signatureRequired: true,
        idVerification: Math.random() > 0.5,
        photoTracking: Math.random() > 0.5,
        gpsTracking: true
      },
      
      notes: {
        specialInstructions: 'Özel talimatlar',
        deliveryNotes: 'Teslimat notları',
        loadingNotes: 'Yükleme notları'
      },
      
      privacy: {
        gdprConsent: true,
        termsAccepted: true,
        privacyAccepted: true
      },
      
      meta: {
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: `user_${Math.floor(Math.random() * 100)}`,
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
  }

  return shipments
}

// Mock taşıyıcılar oluşturucu
export const generateMockCarriers = (count: number = 10): Carrier[] => {
  const cities = ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Gaziantep']
  const companyNames = [
    'Hızlı Nakliyat', 'Güvenli Taşımacılık', 'Express Lojistik', 'Mega Transport',
    'Ultra Kargo', 'Pro Nakliye', 'Elite Taşıma', 'Premium Lojistik',
    'Süper Transport', 'Ace Kargo', 'Fast Line', 'Quick Move'
  ]

  const carriers: Carrier[] = []

  for (let i = 0; i < count; i++) {
    const carrier: Carrier = {
      id: `carrier_${i + 1}`,
      name: companyNames[i % companyNames.length],
      email: `info@${companyNames[i % companyNames.length].toLowerCase().replace(/\s/g, '')}.com`,
      phone: `+90 555 ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 90) + 10}`,
      rating: Math.round((4 + Math.random()) * 10) / 10,
      experience: Math.floor(Math.random() * 10) + 1,
      totalShipments: Math.floor(Math.random() * 1000) + 100,
      successRate: Math.round((85 + Math.random() * 15) * 10) / 10,
      responseTime: Math.floor(Math.random() * 60) + 5,
      
      vehicles: [
        {
          id: `vehicle_${i}_1`,
          type: 'kamyonet',
          model: 'Ford Transit',
          year: 2020 + Math.floor(Math.random() * 4),
          capacity: '3 ton',
          licensePlate: `${Math.floor(Math.random() * 90) + 10} ABC ${Math.floor(Math.random() * 900) + 100}`,
          isAvailable: Math.random() > 0.3
        },
        {
          id: `vehicle_${i}_2`,
          type: 'kamyon',
          model: 'Mercedes Sprinter',
          year: 2019 + Math.floor(Math.random() * 5),
          capacity: '5 ton',
          licensePlate: `${Math.floor(Math.random() * 90) + 10} DEF ${Math.floor(Math.random() * 900) + 100}`,
          isAvailable: Math.random() > 0.4
        }
      ],
      
      serviceAreas: cities.slice(0, Math.floor(Math.random() * 5) + 2).map(city => ({
        city,
        district: 'Tüm İlçeler',
        radius: 50
      })),
      
      specialties: ['Ev Eşyası', 'Ofis Taşıma', 'Kırılgan Yük', 'Hızlı Teslimat'],
      
      isVerified: Math.random() > 0.2,
      isOnline: Math.random() > 0.3,
      lastActive: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    }

    carriers.push(carrier)
  }

  return carriers
}

// Mock teklifler oluşturucu
export const generateMockOffers = (shipments: ShipmentRequest[], carriers: Carrier[]): any[] => {
  const offers: any[] = []

  shipments.forEach((shipment, shipmentIndex) => {
    const offerCount = Math.floor(Math.random() * 5) + 1
    
    for (let i = 0; i < offerCount; i++) {
      const carrier = carriers[Math.floor(Math.random() * carriers.length)]
      const basePrice = shipment.meta.estimatedPrice
      const offerPrice = Math.floor(basePrice * (0.8 + Math.random() * 0.4))
      
      const offer = {
        id: `offer_${shipmentIndex}_${i}`,
        shipmentId: shipment.id,
        carrierId: carrier.id,
        carrierName: carrier.name,
        carrierRating: carrier.rating,
        carrierExperience: carrier.experience,
        carrierPhone: carrier.phone,
        carrierEmail: carrier.email,
        price: offerPrice,
        currency: 'TRY',
        estimatedDuration: `${Math.floor(shipment.meta.distance / 50) + 1}-${Math.floor(shipment.meta.distance / 30) + 2} saat`,
        estimatedDistance: shipment.meta.distance,
        fuelCost: offerPrice * 0.3,
        tollCost: offerPrice * 0.1,
        totalCost: offerPrice,
        vehicle: {
          type: shipment.transport.vehicleType,
          model: 'Ford Transit',
          year: 2020 + Math.floor(Math.random() * 4),
          capacity: '3 ton',
          licensePlate: `${Math.floor(Math.random() * 90) + 10} ABC ${Math.floor(Math.random() * 900) + 100}`,
          driverName: `Şoför ${i + 1}`,
          driverPhone: `+90 555 ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 90) + 10}`,
          driverLicense: `B${Math.floor(Math.random() * 900000000) + 100000000}`
        },
        status: 'pending',
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        specialConditions: '',
        notes: 'Profesyonel hizmet garantisi',
        createdAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        isRecommended: Math.random() > 0.7,
        isVerified: carrier.isVerified
      }

      offers.push(offer)
    }
  })

  return offers
}











