const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Offer = sequelize.define('Offer', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  shipmentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'shipments',
      key: 'id'
    }
  },
  carrierId: {
    type: DataTypes.INTEGER,
    allowNull: false,
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
    type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'expired', 'cancelled'),
    defaultValue: 'pending'
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'TRY'
  },
  estimatedDelivery: {
    type: DataTypes.DATE,
    allowNull: false
  },
  deliveryTime: {
    type: DataTypes.STRING,
    allowNull: true
  },
  pickupDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  deliveryDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  conditions: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  isContracted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  contractTerms: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  acceptedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  rejectedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'offers'
});

module.exports = Offer;