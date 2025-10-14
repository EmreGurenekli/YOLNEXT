const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CorporateUser = sequelize.define('CorporateUser', {
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
  tradeRegistryNumber: {
    type: DataTypes.STRING,
    allowNull: true
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
  website: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  industry: {
    type: DataTypes.STRING,
    allowNull: true
  },
  employeeCount: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  annualRevenue: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },
  contactPerson: {
    type: DataTypes.STRING,
    allowNull: false
  },
  contactPhone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  contactEmail: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  verificationDocuments: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  businessLicense: {
    type: DataTypes.STRING,
    allowNull: true
  },
  taxCertificate: {
    type: DataTypes.STRING,
    allowNull: true
  },
  preferences: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'corporate_users'
});

module.exports = CorporateUser;