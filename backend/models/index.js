const { sequelize, testConnection } = require('../config/database');

// Import all models
const User = require('./User');
const CorporateUser = require('./CorporateUser');
const Carrier = require('./Carrier');
const Driver = require('./Driver');
const Shipment = require('./Shipment');
const Offer = require('./Offer');

// Define associations
// User associations
User.hasOne(CorporateUser, { foreignKey: 'userId', as: 'corporateProfile' });
User.hasOne(Carrier, { foreignKey: 'userId', as: 'carrierProfile' });
User.hasOne(Driver, { foreignKey: 'userId', as: 'driverProfile' });
User.hasMany(Shipment, { foreignKey: 'senderId', as: 'sentShipments' });

// CorporateUser associations
CorporateUser.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Carrier associations
Carrier.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Carrier.hasMany(Driver, { foreignKey: 'carrierId', as: 'drivers' });
Carrier.hasMany(Shipment, { foreignKey: 'carrierId', as: 'carriedShipments' });
Carrier.hasMany(Offer, { foreignKey: 'carrierId', as: 'offers' });

// Driver associations
Driver.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Driver.belongsTo(Carrier, { foreignKey: 'carrierId', as: 'carrier' });
Driver.hasMany(Shipment, { foreignKey: 'driverId', as: 'drivenShipments' });
Driver.hasMany(Offer, { foreignKey: 'driverId', as: 'offers' });

// Shipment associations
Shipment.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
Shipment.belongsTo(Carrier, { foreignKey: 'carrierId', as: 'carrier' });
Shipment.belongsTo(Driver, { foreignKey: 'driverId', as: 'driver' });
Shipment.hasMany(Offer, { foreignKey: 'shipmentId', as: 'offers' });

// Offer associations
Offer.belongsTo(Shipment, { foreignKey: 'shipmentId', as: 'shipment' });
Offer.belongsTo(Carrier, { foreignKey: 'carrierId', as: 'carrier' });
Offer.belongsTo(Driver, { foreignKey: 'driverId', as: 'driver' });

// Sync database
const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force });
    console.log('✅ Veritabanı modelleri senkronize edildi!');
  } catch (error) {
    console.error('❌ Veritabanı senkronizasyon hatası:', error.message);
  }
};

module.exports = {
  sequelize,
  testConnection,
  User,
  CorporateUser,
  Carrier,
  Driver,
  Shipment,
  Offer,
  syncDatabase
};
