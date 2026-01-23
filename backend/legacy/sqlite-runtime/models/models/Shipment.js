const { query } = require('../database/connection');

class Shipment {
    constructor(data) {
        this.id = data.id;
        this.userId = data.user_id;
        this.title = data.title;
        this.description = data.description;
        this.fromLocation = data.from_location;
        this.toLocation = data.to_location;
        this.weight = data.weight;
        this.dimensions = data.dimensions;
        this.fragile = data.fragile;
        this.estimatedValue = data.estimated_value;
        this.priority = data.priority;
        this.status = data.status;
        this.pickupDate = data.pickup_date;
        this.deliveryDate = data.delivery_date;
        this.specialInstructions = data.special_instructions;
        this.createdAt = data.created_at;
        this.updatedAt = data.updated_at;
    }

    // Create new shipment
    static async create(shipmentData) {
        const {
            userId,
            title,
            description,
            fromLocation,
            toLocation,
            weight,
            dimensions,
            fragile,
            estimatedValue,
            priority,
            pickupDate,
            deliveryDate,
            specialInstructions
        } = shipmentData;

        const result = await query(
            `INSERT INTO shipments (user_id, title, description, from_location, to_location, 
             weight, dimensions, fragile, estimated_value, priority, pickup_date, delivery_date, special_instructions)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
            [userId, title, description, fromLocation, toLocation, weight, dimensions, 
             fragile, estimatedValue, priority, pickupDate, deliveryDate, specialInstructions]
        );

        return new Shipment(result.rows[0]);
    }

    // Find shipment by ID
    static async findById(id) {
        const result = await query(
            `SELECT s.*, u.first_name, u.last_name, u.email, u.user_type 
             FROM shipments s 
             JOIN users u ON s.user_id = u.id 
             WHERE s.id = $1`,
            [id]
        );
        return result.rows.length > 0 ? new Shipment(result.rows[0]) : null;
    }

    // Get shipments by user ID
    static async findByUserId(userId, limit = 50, offset = 0) {
        const result = await query(
            `SELECT s.*, u.first_name, u.last_name, u.email, u.user_type 
             FROM shipments s 
             JOIN users u ON s.user_id = u.id 
             WHERE s.user_id = $1 
             ORDER BY s.created_at DESC 
             LIMIT $2 OFFSET $3`,
            [userId, limit, offset]
        );

        return result.rows.map(row => new Shipment(row));
    }

    // Get all shipments (for nakliyeci and tasiyici)
    static async findAll(limit = 50, offset = 0, filters = {}) {
        let whereClause = 'WHERE 1=1';
        const values = [];
        let paramCount = 1;

        if (filters.status) {
            whereClause += ` AND s.status = $${paramCount}`;
            values.push(filters.status);
            paramCount++;
        }

        if (filters.fromLocation) {
            whereClause += ` AND s.from_location ILIKE $${paramCount}`;
            values.push(`%${filters.fromLocation}%`);
            paramCount++;
        }

        if (filters.toLocation) {
            whereClause += ` AND s.to_location ILIKE $${paramCount}`;
            values.push(`%${filters.toLocation}%`);
            paramCount++;
        }

        if (filters.weight) {
            whereClause += ` AND s.weight = $${paramCount}`;
            values.push(filters.weight);
            paramCount++;
        }

        values.push(limit, offset);

        const result = await query(
            `SELECT s.*, u.first_name, u.last_name, u.email, u.user_type 
             FROM shipments s 
             JOIN users u ON s.user_id = u.id 
             ${whereClause}
             ORDER BY s.created_at DESC 
             LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
            values
        );

        return result.rows.map(row => new Shipment(row));
    }

    // Update shipment
    async update(updateData) {
        const fields = [];
        const values = [];
        let paramCount = 1;

        Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined) {
                const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
                fields.push(`${dbKey} = $${paramCount}`);
                values.push(updateData[key]);
                paramCount++;
            }
        });

        if (fields.length === 0) return this;

        values.push(this.id);
        const result = await query(
            `UPDATE shipments SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $${paramCount} RETURNING *`,
            values
        );

        return new Shipment(result.rows[0]);
    }

    // Delete shipment
    async delete() {
        await query('DELETE FROM shipments WHERE id = $1', [this.id]);
        return true;
    }

    // Get offers for this shipment
    async getOffers() {
        const result = await query(
            `SELECT o.*, u.first_name, u.last_name, u.email, u.user_type 
             FROM offers o 
             JOIN users u ON o.user_id = u.id 
             WHERE o.shipment_id = $1 
             ORDER BY o.created_at DESC`,
            [this.id]
        );

        return result.rows;
    }

    // Get messages for this shipment
    async getMessages() {
        const result = await query(
            `SELECT m.*, 
                    sender.first_name as sender_first_name, 
                    sender.last_name as sender_last_name,
                    receiver.first_name as receiver_first_name, 
                    receiver.last_name as receiver_last_name
             FROM messages m 
             JOIN users sender ON m.sender_id = sender.id 
             JOIN users receiver ON m.receiver_id = receiver.id 
             WHERE m.shipment_id = $1 
             ORDER BY m.created_at ASC`,
            [this.id]
        );

        return result.rows;
    }

    // Convert to JSON
    toJSON() {
        return {
            id: this.id,
            userId: this.userId,
            title: this.title,
            description: this.description,
            fromLocation: this.fromLocation,
            toLocation: this.toLocation,
            weight: this.weight,
            dimensions: this.dimensions,
            fragile: this.fragile,
            estimatedValue: this.estimatedValue,
            priority: this.priority,
            status: this.status,
            pickupDate: this.pickupDate,
            deliveryDate: this.deliveryDate,
            specialInstructions: this.specialInstructions,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

module.exports = Shipment;
const Shipment = sequelize.define('Shipment', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  trackingNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  senderId: {
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
  driverId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'drivers',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM(
      'pending',
      'quoted',
      'accepted',
      'picked_up',
      'in_transit',
      'delivered',
      'cancelled',
      'returned'
    ),
    defaultValue: 'pending'
  },
  priority: {
    type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
    defaultValue: 'normal'
  },
  shipmentType: {
    type: DataTypes.ENUM('standard', 'express', 'same_day', 'scheduled'),
    defaultValue: 'standard'
  },
  // Sender Information
  senderName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  senderPhone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  senderEmail: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  senderAddress: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  senderCity: {
    type: DataTypes.STRING,
    allowNull: false
  },
  senderDistrict: {
    type: DataTypes.STRING,
    allowNull: false
  },
  senderPostalCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Receiver Information
  receiverName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  receiverPhone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  receiverEmail: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  receiverAddress: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  receiverCity: {
    type: DataTypes.STRING,
    allowNull: false
  },
  receiverDistrict: {
    type: DataTypes.STRING,
    allowNull: false
  },
  receiverPostalCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Package Information
  packageDescription: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  packageType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  weight: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: false,
    validate: {
      min: 0.1
    }
  },
  dimensions: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {
      length: 0,
      width: 0,
      height: 0,
      unit: 'cm'
    }
  },
  value: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  isFragile: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isDangerous: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  requiresSignature: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // Delivery Information
  pickupDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  deliveryDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  estimatedDelivery: {
    type: DataTypes.DATE,
    allowNull: true
  },
  actualDelivery: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Pricing
  basePrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  finalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  commission: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  // Special Instructions
  specialInstructions: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  deliveryInstructions: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Tracking
  currentLocation: {
    type: DataTypes.GEOMETRY('POINT'),
    allowNull: true
  },
  trackingHistory: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  // Additional Data
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'shipments'
});

module.exports = Shipment;