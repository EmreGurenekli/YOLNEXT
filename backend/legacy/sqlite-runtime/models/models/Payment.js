const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Payment = sequelize.define('Payment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    uuid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      unique: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    shipment_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'shipments',
        key: 'id'
      }
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'TRY'
    },
    payment_method: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
      defaultValue: 'pending'
    },
    transaction_id: {
      type: DataTypes.STRING(100),
      unique: true
    },
    stripe_payment_intent_id: {
      type: DataTypes.STRING(100)
    },
    refund_amount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    refund_reason: {
      type: DataTypes.TEXT
    },
    metadata: {
      type: DataTypes.JSON
    }
  }, {
    tableName: 'payments',
    timestamps: true,
    underscored: true
  });

  return Payment;
};