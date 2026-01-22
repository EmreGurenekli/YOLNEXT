const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const IndividualUser = sequelize.define('IndividualUser', {
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
  preferences: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      notifications: {
        email: true,
        sms: true,
        push: true
      },
      language: 'tr',
      currency: 'TRY'
    }
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
  tableName: 'individual_users',
  timestamps: true,
  indexes: [
    {
      fields: ['userId']
    }
  ]
});

module.exports = IndividualUser;