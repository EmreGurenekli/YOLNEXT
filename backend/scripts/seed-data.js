const { User, CorporateUser, Carrier, Driver, Shipment, Offer } = require('../models');
const bcrypt = require('bcryptjs');

const seedData = async () => {
  try {
    console.log('🌱 Seed data oluşturuluyor...');

    // Test kullanıcıları oluştur
    const users = await Promise.all([
      User.create({
        email: 'individual@test.com',
        password: 'password123',
        firstName: 'Ahmet',
        lastName: 'Yılmaz',
        userType: 'individual',
        phone: '+905551234567',
        isActive: true,
        isVerified: true
      }),
      User.create({
        email: 'corporate@test.com',
        password: 'password123',
        firstName: 'Mehmet',
        lastName: 'Demir',
        userType: 'corporate',
        phone: '+905559876543',
        isActive: true,
        isVerified: true
      }),
      User.create({
        email: 'carrier@test.com',
        password: 'password123',
        firstName: 'Ali',
        lastName: 'Kaya',
        userType: 'carrier',
        phone: '+905556543210',
        isActive: true,
        isVerified: true
      }),
      User.create({
        email: 'driver@test.com',
        password: 'password123',
        firstName: 'Veli',
        lastName: 'Özkan',
        userType: 'logistics',
        phone: '+905551357924',
        isActive: true,
        isVerified: true
      })
    ]);

    console.log('✅ Kullanıcılar oluşturuldu');

    // Kurumsal profil oluştur
    await CorporateUser.create({
      userId: users[1].id,
      companyName: 'ABC Lojistik A.Ş.',
      taxNumber: '1234567890',
      tradeRegistryNumber: '123456',
      address: 'Atatürk Mahallesi, İş Merkezi No:15, Beşiktaş/İstanbul',
      city: 'İstanbul',
      district: 'Beşiktaş',
      postalCode: '34353',
      website: 'https://abclojistik.com',
      industry: 'Lojistik',
      employeeCount: 150,
      annualRevenue: 50000000,
      contactPerson: 'Mehmet Demir',
      contactPhone: '+905559876543',
      contactEmail: 'corporate@test.com',
      isVerified: true
    });

    // Nakliyeci profil oluştur
    const carrier = await Carrier.create({
      userId: users[2].id,
      companyName: 'Hızlı Kargo Ltd.',
      taxNumber: '9876543210',
      address: 'Sanayi Mahallesi, Depo Sokak No:25, Pendik/İstanbul',
      city: 'İstanbul',
      district: 'Pendik',
      postalCode: '34900',
      phone: '+905556543210',
      email: 'carrier@test.com',
      website: 'https://hizlikargo.com',
      licenseNumber: 'LK123456',
      licenseExpiry: new Date('2025-12-31'),
      insuranceNumber: 'INS789012',
      insuranceExpiry: new Date('2025-11-30'),
      rating: 4.5,
      totalShipments: 1250,
      successfulShipments: 1200,
      isVerified: true,
      isActive: true,
      serviceAreas: ['İstanbul', 'Ankara', 'İzmir', 'Bursa'],
      vehicleTypes: ['Kamyon', 'Tır', 'Kamyonet']
    });

    // Şoför profil oluştur
    await Driver.create({
      userId: users[3].id,
      carrierId: carrier.id,
      firstName: 'Veli',
      lastName: 'Özkan',
      phone: '+905551357924',
      email: 'driver@test.com',
      licenseNumber: 'E123456789',
      licenseClass: 'E',
      licenseExpiry: new Date('2026-03-15'),
      identityNumber: '12345678901',
      address: 'Çamlık Mahallesi, Ev Sokak No:8, Kadıköy/İstanbul',
      city: 'İstanbul',
      district: 'Kadıköy',
      postalCode: '34710',
      birthDate: new Date('1985-06-20'),
      rating: 4.8,
      totalTrips: 450,
      successfulTrips: 445,
      isVerified: true,
      isActive: true,
      isAvailable: true,
      vehicleTypes: ['Kamyon', 'Tır']
    });

    console.log('✅ Profiller oluşturuldu');

    // Test gönderileri oluştur
    const shipments = await Promise.all([
      Shipment.create({
        trackingNumber: 'YN001234567',
        senderId: users[0].id,
        status: 'pending',
        priority: 'normal',
        shipmentType: 'standard',
        senderName: 'Ahmet Yılmaz',
        senderPhone: '+905551234567',
        senderEmail: 'individual@test.com',
        senderAddress: 'Ev Mahallesi, Konut Sokak No:12, Şişli/İstanbul',
        senderCity: 'İstanbul',
        senderDistrict: 'Şişli',
        senderPostalCode: '34380',
        receiverName: 'Ayşe Kaya',
        receiverPhone: '+905559876543',
        receiverEmail: 'ayse@example.com',
        receiverAddress: 'İş Merkezi, Ofis Sokak No:45, Çankaya/Ankara',
        receiverCity: 'Ankara',
        receiverDistrict: 'Çankaya',
        receiverPostalCode: '06420',
        packageDescription: 'Elektronik eşya - Laptop ve aksesuarları',
        packageType: 'Elektronik',
        weight: 3.5,
        dimensions: { length: 50, width: 30, height: 20, unit: 'cm' },
        value: 25000,
        isFragile: true,
        requiresSignature: true,
        specialInstructions: 'Dikkatli taşıma gerekiyor',
        deliveryInstructions: 'Sadece iş saatlerinde teslim edin'
      }),
      Shipment.create({
        trackingNumber: 'YN001234568',
        senderId: users[1].id,
        status: 'quoted',
        priority: 'high',
        shipmentType: 'express',
        senderName: 'ABC Lojistik A.Ş.',
        senderPhone: '+905559876543',
        senderEmail: 'corporate@test.com',
        senderAddress: 'Atatürk Mahallesi, İş Merkezi No:15, Beşiktaş/İstanbul',
        senderCity: 'İstanbul',
        senderDistrict: 'Beşiktaş',
        senderPostalCode: '34353',
        receiverName: 'XYZ Şirketi',
        receiverPhone: '+905556789012',
        receiverEmail: 'info@xyz.com',
        receiverAddress: 'Organize Sanayi Bölgesi, Fabrika Sokak No:78, Bornova/İzmir',
        receiverCity: 'İzmir',
        receiverDistrict: 'Bornova',
        receiverPostalCode: '35050',
        packageDescription: 'Endüstriyel parça - Motor ve yedek parçalar',
        packageType: 'Endüstriyel',
        weight: 150.0,
        dimensions: { length: 200, width: 100, height: 80, unit: 'cm' },
        value: 150000,
        isFragile: false,
        requiresSignature: true,
        specialInstructions: 'Ağır yük - Özel araç gerekiyor',
        deliveryInstructions: 'Sadece hafta içi teslim'
      })
    ]);

    console.log('✅ Gönderiler oluşturuldu');

    // Test teklifleri oluştur
    await Promise.all([
      Offer.create({
        shipmentId: shipments[0].id,
        carrierId: carrier.id,
        status: 'pending',
        price: 450.00,
        currency: 'TRY',
        estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 gün sonra
        deliveryTime: '2-3 gün',
        message: 'Güvenli ve hızlı teslimat garantisi',
        conditions: {
          insurance: true,
          tracking: true,
          signature: true
        }
      }),
      Offer.create({
        shipmentId: shipments[1].id,
        carrierId: carrier.id,
        status: 'accepted',
        price: 1200.00,
        currency: 'TRY',
        estimatedDelivery: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 gün sonra
        deliveryTime: '1-2 gün',
        message: 'Express teslimat - Özel araç ile',
        conditions: {
          insurance: true,
          tracking: true,
          signature: true,
          specialVehicle: true
        },
        acceptedAt: new Date()
      })
    ]);

    console.log('✅ Teklifler oluşturuldu');

    console.log('🎉 Seed data başarıyla oluşturuldu!');
    console.log('📧 Test kullanıcıları:');
    console.log('   - individual@test.com / password123');
    console.log('   - corporate@test.com / password123');
    console.log('   - carrier@test.com / password123');
    console.log('   - driver@test.com / password123');

  } catch (error) {
    console.error('❌ Seed data hatası:', error);
  }
};

module.exports = { seedData };

