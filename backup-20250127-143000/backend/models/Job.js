const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  shipmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shipment',
    required: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: true
  },
  carrierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Carrier',
    required: true
  },
  status: {
    type: String,
    enum: ['assigned', 'picked-up', 'in-transit', 'delivered', 'cancelled'],
    default: 'assigned'
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  earnings: {
    type: Number,
    required: true
  },
  startDate: {
    type: Date,
    default: null
  },
  endDate: {
    type: Date,
    default: null
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
  rating: {
    score: { type: Number, min: 1, max: 5 },
    comment: { type: String },
    ratedBy: { type: String }, // sender, carrier
    ratedAt: { type: Date }
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

module.exports = mongoose.model('Job', jobSchema);







