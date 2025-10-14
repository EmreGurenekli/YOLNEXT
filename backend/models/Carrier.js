const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Carrier = sequelize.define('Carrier', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  companyName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [2, 100]
    }
  },
  taxNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      len: [10, 11]
    }
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  city: {
    type: DataTypes.STRING,
    allowNull: false
  },
  district: {
    type: DataTypes.STRING,
    allowNull: false
  },
  postalCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  website: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  licenseNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  licenseExpiry: {
    type: DataTypes.DATE,
    allowNull: false
  },
  insuranceNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  insuranceExpiry: {
    type: DataTypes.DATE,
    allowNull: true
  },
  rating: {
    type: DataTypes.DECIMAL(2, 1),
    defaultValue: 0.0,
    validate: {
      min: 0,
      max: 5
    }
  },
  totalShipments: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  successfulShipments: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  verificationDocuments: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  serviceAreas: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  vehicleTypes: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  workingHours: {
    type: DataTypes.JSONB,
    defaultValue: {
      monday: { start: '09:00', end: '18:00', isWorking: true },
      tuesday: { start: '09:00', end: '18:00', isWorking: true },
      wednesday: { start: '09:00', end: '18:00', isWorking: true },
      thursday: { start: '09:00', end: '18:00', isWorking: true },
      friday: { start: '09:00', end: '18:00', isWorking: true },
      saturday: { start: '09:00', end: '18:00', isWorking: false },
      sunday: { start: '09:00', end: '18:00', isWorking: false }
    }
  },
  preferences: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'carriers'
});

module.exports = Carrier;