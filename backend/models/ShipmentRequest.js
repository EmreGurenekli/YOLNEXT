const mongoose = require('mongoose');

const shipmentRequestSchema = new mongoose.Schema({
  // Temel bilgiler
  trackingCode: {
    type: String,
    unique: true,
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Yük bilgileri
  cargoType: {
    type: String,
    enum: ['ev_esyasi', 'kisisel', 'ciftci', 'is_yeri', 'ozel'],
    required: true
  },
  roomCount: String,
  floorCount: String,
  hasFurniture: Boolean,
  hasAppliances: Boolean,
  hasFragile: Boolean,
  description: {
    type: String,
    required: true
  },
  estimatedValue: Number,
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  // Gönderici bilgileri
  sender: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: String,
    address: { type: String, required: true },
    city: String,
    district: String,
    postalCode: String,
    locationType: {
      type: String,
      enum: ['ev', 'ofis', 'magaza', 'depo'],
      default: 'ev'
    }
  },
  
  // Alıcı bilgileri
  receiver: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: String,
    address: { type: String, required: true },
    city: String,
    district: String,
    postalCode: String,
    locationType: {
      type: String,
      enum: ['ev', 'ofis', 'magaza', 'depo'],
      default: 'ev'
    }
  },
  
  // Tarih ve zaman
  schedule: {
    loadingDate: { type: String, required: true },
    loadingTime: String,
    deliveryDate: { type: String, required: true },
    deliveryTime: String,
    loadingWindow: { type: String, default: '09:00-18:00' },
    deliveryWindow: { type: String, default: '09:00-18:00' },
    flexibleDelivery: { type: Boolean, default: true },
    maxWaitTime: { type: String, default: '60' }
  },
  
  // Araç ve taşıma
  transport: {
    vehicleType: {
      type: String,
      enum: ['van', 'kamyonet', 'kamyon'],
      default: 'van'
    },
    weight: { type: Number, default: 0 },
    volume: { type: Number, default: 0 },
    insurance: { type: Boolean, default: false },
    packaging: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
    unloading: { type: Boolean, default: false },
    loadingFloor: { type: String, default: '0' },
    unloadingFloor: { type: String, default: '0' },
    loadingAccess: { type: String, default: 'normal' },
    unloadingAccess: { type: String, default: 'normal' },
    loadingInstructions: String,
    unloadingInstructions: String
  },
  
  // Ödeme bilgileri
  payment: {
    method: {
      type: String,
      enum: ['nakit', 'kredi_karti', 'havale', 'pos'],
      default: 'kredi_karti'
    },
    codAmount: { type: String, default: '0' },
    insurance: { type: Boolean, default: false },
    insuranceValue: { type: String, default: '0' }
  },
  
  // İletişim bilgileri
  communication: {
    smsNotification: { type: Boolean, default: true },
    emailNotification: { type: Boolean, default: false },
    phoneNotification: { type: Boolean, default: false },
    whatsappNotification: { type: Boolean, default: false },
    frequency: {
      type: String,
      enum: ['normal', 'frequent', 'minimal'],
      default: 'normal'
    },
    preferredTime: { type: String, default: '09:00-18:00' }
  },
  
  // Güvenlik ve takip
  security: {
    signatureRequired: { type: Boolean, default: false },
    idVerification: { type: Boolean, default: false },
    photoTracking: { type: Boolean, default: false },
    gpsTracking: { type: Boolean, default: false }
  },
  
  // Notlar
  notes: {
    specialInstructions: String,
    deliveryNotes: String,
    loadingNotes: String
  },
  
  // Gizlilik ve onaylar
  privacy: {
    gdprConsent: { type: Boolean, default: false },
    termsAccepted: { type: Boolean, required: true },
    privacyAccepted: { type: Boolean, required: true }
  },
  
  // Durum yönetimi
  status: {
    type: String,
    enum: [
      'draft', 'active', 'bidding', 'accepted', 
      'in_progress', 'picked_up', 'in_transit', 
      'delivered', 'completed', 'cancelled'
    ],
    default: 'draft'
  },
  
  // Atama bilgileri
  acceptedOfferId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Offer'
  },
  assignedDriverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Fiyat bilgileri
  finalPrice: Number,
  commission: Number,
  
  // Takip bilgileri
  currentLocation: {
    address: String,
    city: String,
    coordinates: {
      lat: Number,
      lng: Number
    },
    timestamp: Date
  },
  
  // Fotoğraflar
  photos: [{
    url: String,
    type: {
      type: String,
      enum: ['pickup', 'in_transit', 'delivery', 'damage']
    },
    timestamp: { type: Date, default: Date.now }
  }],
  
  // Sürücü notları
  driverNotes: String,
  
  // İptal bilgileri
  cancelReason: String,
  cancelledAt: Date,
  
  // Zaman damgaları
  publishedAt: Date,
  assignedAt: Date,
  pickedUpAt: Date,
  deliveredAt: Date,
  completedAt: Date
}, {
  timestamps: true
});

// Index'ler
shipmentRequestSchema.index({ trackingCode: 1 });
shipmentRequestSchema.index({ senderId: 1 });
shipmentRequestSchema.index({ status: 1 });
shipmentRequestSchema.index({ 'sender.city': 1, 'receiver.city': 1 });
shipmentRequestSchema.index({ cargoType: 1 });
shipmentRequestSchema.index({ createdAt: -1 });

// Virtual'lar
shipmentRequestSchema.virtual('isActive').get(function() {
  return ['active', 'bidding', 'accepted', 'in_progress', 'picked_up', 'in_transit'].includes(this.status);
});

shipmentRequestSchema.virtual('isCompleted').get(function() {
  return ['delivered', 'completed'].includes(this.status);
});

shipmentRequestSchema.virtual('canBeCancelled').get(function() {
  return ['draft', 'active', 'bidding', 'accepted'].includes(this.status);
});

// Middleware'ler
shipmentRequestSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('ShipmentRequest', shipmentRequestSchema);





