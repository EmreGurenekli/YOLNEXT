const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  shipmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ShipmentRequest',
    required: true
  },
  carrierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  estimatedDays: {
    type: Number,
    required: true,
    min: 1
  },
  vehicleType: {
    type: String,
    enum: ['van', 'kamyonet', 'kamyon'],
    required: true
  },
  notes: {
    type: String,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'expired'],
    default: 'pending'
  },
  acceptedAt: {
    type: Date
  },
  rejectedAt: {
    type: Date
  },
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 gün
    }
  }
}, {
  timestamps: true
});

// Index'ler
offerSchema.index({ shipmentId: 1, carrierId: 1 });
offerSchema.index({ status: 1 });
offerSchema.index({ expiresAt: 1 });

// Virtual'lar
offerSchema.virtual('isExpired').get(function() {
  return this.expiresAt < new Date();
});

// Middleware'ler
offerSchema.pre('save', function(next) {
  if (this.isExpired && this.status === 'pending') {
    this.status = 'expired';
  }
  next();
});

module.exports = mongoose.model('Offer', offerSchema);