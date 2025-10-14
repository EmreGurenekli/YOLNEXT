const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Shipment = sequelize.define('Shipment', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  trackingNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  carrierId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'carriers',
      key: 'id'
    }
  },
  driverId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'drivers',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM(
      'pending',
      'quoted',
      'accepted',
      'picked_up',
      'in_transit',
      'delivered',
      'cancelled',
      'returned'
    ),
    defaultValue: 'pending'
  },
  priority: {
    type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
    defaultValue: 'normal'
  },
  shipmentType: {
    type: DataTypes.ENUM('standard', 'express', 'same_day', 'scheduled'),
    defaultValue: 'standard'
  },
  // Sender Information
  senderName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  senderPhone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  senderEmail: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  senderAddress: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  senderCity: {
    type: DataTypes.STRING,
    allowNull: false
  },
  senderDistrict: {
    type: DataTypes.STRING,
    allowNull: false
  },
  senderPostalCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Receiver Information
  receiverName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  receiverPhone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  receiverEmail: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  receiverAddress: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  receiverCity: {
    type: DataTypes.STRING,
    allowNull: false
  },
  receiverDistrict: {
    type: DataTypes.STRING,
    allowNull: false
  },
  receiverPostalCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Package Information
  packageDescription: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  packageType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  weight: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: false,
    validate: {
      min: 0.1
    }
  },
  dimensions: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {
      length: 0,
      width: 0,
      height: 0,
      unit: 'cm'
    }
  },
  value: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  isFragile: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isDangerous: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  requiresSignature: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // Delivery Information
  pickupDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  deliveryDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  estimatedDelivery: {
    type: DataTypes.DATE,
    allowNull: true
  },
  actualDelivery: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Pricing
  basePrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  finalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  commission: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  // Special Instructions
  specialInstructions: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  deliveryInstructions: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Tracking
  currentLocation: {
    type: DataTypes.GEOMETRY('POINT'),
    allowNull: true
  },
  trackingHistory: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  // Additional Data
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'shipments'
});

module.exports = Shipment;