const { Sequelize } = require('sequelize');
const path = require('path');

// SQLite database connection
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../database/YolNext.db'),
  logging: false,
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true
  }
});

// Import models
const User = require('./SimpleUser');
const CorporateUser = require('./CorporateUser');
const Carrier = require('./Carrier');
const Driver = require('./Driver');
const IndividualUser = require('./IndividualUser');
const Shipment = require('./Shipment');
const ShipmentRequest = require('./ShipmentRequest');
const Offer = require('./Offer');
const Message = require('./Message');
const Job = require('./Job');
const Payment = require('./Payment');

// Define associations
User.hasMany(Shipment, { foreignKey: 'user_id', as: 'shipments' });
User.hasMany(Offer, { foreignKey: 'carrier_id', as: 'offers' });
User.hasMany(Message, { foreignKey: 'sender_id', as: 'sentMessages' });
User.hasMany(Message, { foreignKey: 'receiver_id', as: 'receivedMessages' });

Shipment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Shipment.hasMany(Offer, { foreignKey: 'shipment_id', as: 'offers' });
Shipment.hasMany(Message, { foreignKey: 'shipment_id', as: 'messages' });

Offer.belongsTo(Shipment, { foreignKey: 'shipment_id', as: 'shipment' });
Offer.belongsTo(User, { foreignKey: 'carrier_id', as: 'carrier' });

Message.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });
Message.belongsTo(User, { foreignKey: 'receiver_id', as: 'receiver' });
Message.belongsTo(Shipment, { foreignKey: 'shipment_id', as: 'shipment' });

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to database:', error);
    return false;
  }
};

// Sync database
const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('✅ Database synchronized successfully');
    return true;
  } catch (error) {
    console.error('❌ Database synchronization error:', error);
    return false;
  }
};

module.exports = {
  sequelize,
  User,
  CorporateUser,
  Carrier,
  Driver,
  IndividualUser,
  Shipment,
  ShipmentRequest,
  Offer,
  Message,
  Job,
  Payment,
  testConnection,
  syncDatabase
};