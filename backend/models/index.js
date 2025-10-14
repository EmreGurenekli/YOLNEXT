const { sequelize, testConnection } = require('../config/database');

// Import all models
const User = require('./User');
const CorporateUser = require('./CorporateUser');
const Carrier = require('./Carrier');
const Driver = require('./Driver');
const Shipment = require('./Shipment');
const Offer = require('./Offer');
// const Message = require('./Message');
// const Notification = require('./Notification');
// const Payment = require('./Payment');

// Define associations
// User associations
User.hasOne(CorporateUser, { foreignKey: 'userId', as: 'corporateProfile' });
User.hasOne(Carrier, { foreignKey: 'userId', as: 'carrierProfile' });
User.hasOne(Driver, { foreignKey: 'userId', as: 'driverProfile' });
User.hasMany(Shipment, { foreignKey: 'senderId', as: 'sentShipments' });
// User.hasMany(Message, { foreignKey: 'senderId', as: 'sentMessages' });
// User.hasMany(Message, { foreignKey: 'receiverId', as: 'receivedMessages' });
// User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
// User.hasMany(Payment, { foreignKey: 'userId', as: 'payments' });

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
// Shipment.hasMany(Message, { foreignKey: 'shipmentId', as: 'messages' });
// Shipment.hasMany(Payment, { foreignKey: 'shipmentId', as: 'payments' });

// Offer associations
Offer.belongsTo(Shipment, { foreignKey: 'shipmentId', as: 'shipment' });
Offer.belongsTo(Carrier, { foreignKey: 'carrierId', as: 'carrier' });
Offer.belongsTo(Driver, { foreignKey: 'driverId', as: 'driver' });
// Offer.hasMany(Payment, { foreignKey: 'offerId', as: 'payments' });

// Message associations (temporarily disabled)
// Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
// Message.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });
// Message.belongsTo(Shipment, { foreignKey: 'shipmentId', as: 'shipment' });

// Notification associations (temporarily disabled)
// Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Payment associations (temporarily disabled)
// Payment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
// Payment.belongsTo(Shipment, { foreignKey: 'shipmentId', as: 'shipment' });
// Payment.belongsTo(Offer, { foreignKey: 'offerId', as: 'offer' });

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
  // Message,
  // Notification,
  // Payment,
  syncDatabase
};
