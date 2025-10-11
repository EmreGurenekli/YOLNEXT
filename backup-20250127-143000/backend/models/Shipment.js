const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'senderType'
  },
  senderType: {
    type: String,
    enum: ['IndividualUser', 'CorporateUser'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['ev-esya', 'ofis-esya', 'tarim-urunu', 'kargo', 'ozel-yuk', 'diger']
  },
  weight: {
    type: Number,
    required: true // kg
  },
  volume: {
    type: Number,
    required: true // m³
  },
  value: {
    type: Number,
    required: true // TL
  },
  fromLocation: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    district: { type: String, required: true },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    }
  },
  toLocation: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    district: { type: String, required: true },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    }
  },
  pickupDate: {
    type: Date,
    required: true
  },
  deliveryDate: {
    type: Date,
    required: true
  },
  specialRequirements: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'offers-received', 'assigned', 'in-transit', 'delivered', 'cancelled'],
    default: 'draft'
  },
  assignedCarrier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Carrier',
    default: null
  },
  assignedDriver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    default: null
  },
  finalPrice: {
    type: Number,
    default: null
  },
  commission: {
    type: Number,
    default: null // %1 komisyon
  },
  tracking: {
    currentLocation: {
      address: { type: String },
      city: { type: String },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number }
      },
      timestamp: { type: Date }
    },
    statusHistory: [{
      status: { type: String },
      timestamp: { type: Date, default: Date.now },
      location: { type: String },
      note: { type: String }
    }]
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Shipment', shipmentSchema);