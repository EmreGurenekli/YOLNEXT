const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Carrier = sequelize.define('Carrier', {
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
  companyName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  taxNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  vehicleCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  rating: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  preferences: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  },
  notificationSettings: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      email: true,
      sms: true,
      push: true
    }
  }
}, {
  tableName: 'carriers',
  timestamps: true,
  indexes: [
    {
      fields: ['userId']
    }
  ]
});

module.exports = Carrier;