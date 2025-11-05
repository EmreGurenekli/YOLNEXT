const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ShipmentRequest = sequelize.define('ShipmentRequest', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  pickupAddress: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  deliveryAddress: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  pickupDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  deliveryDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  cargoType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  weight: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  dimensions: {
    type: DataTypes.JSON,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'in_transit', 'delivered', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending'
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  }
}, {
  tableName: 'shipment_requests',
  timestamps: true,
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['status']
    }
  ]
});

module.exports = ShipmentRequest;