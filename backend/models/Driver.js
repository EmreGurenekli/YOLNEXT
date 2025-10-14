const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Driver = sequelize.define('Driver', {
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
  carrierId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'carriers',
      key: 'id'
    }
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [2, 50]
    }
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [2, 50]
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      is: /^[\+]?[1-9][\d]{0,15}$/
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  licenseNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  licenseClass: {
    type: DataTypes.STRING,
    allowNull: false
  },
  licenseExpiry: {
    type: DataTypes.DATE,
    allowNull: false
  },
  identityNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      len: [11, 11]
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
  birthDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  rating: {
    type: DataTypes.DECIMAL(2, 1),
    defaultValue: 0.0,
    validate: {
      min: 0,
      max: 5
    }
  },
  totalTrips: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  successfulTrips: {
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
  isAvailable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  currentLocation: {
    type: DataTypes.GEOMETRY('POINT'),
    allowNull: true
  },
  verificationDocuments: {
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
  tableName: 'drivers'
});

module.exports = Driver;