const mongoose = require('mongoose');

const carrierSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  licenseNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  cities: [{
    type: String,
    required: true
  }],
  address: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true
  },
  wallet: {
    balance: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    totalCommissions: { type: Number, default: 0 }
  },
  stats: {
    totalOffers: { type: Number, default: 0 },
    acceptedOffers: { type: Number, default: 0 },
    completedShipments: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 }
  },
  isVerified: {
    type: Boolean,
    default: false
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

module.exports = mongoose.model('Carrier', carrierSchema);







