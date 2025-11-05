const { query } = require('../database/connection');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class User {
    constructor(data) {
        this.id = data.id;
        this.firstName = data.first_name;
        this.lastName = data.last_name;
        this.email = data.email;
        this.userType = data.user_type;
        this.phone = data.phone;
        this.companyName = data.company_name;
        this.taxNumber = data.tax_number;
        this.driverLicenseNumber = data.driver_license_number;
        this.vehicleType = data.vehicle_type;
        this.vehiclePlate = data.vehicle_plate;
        this.experienceYears = data.experience_years;
        this.isVerified = data.is_verified;
        this.isActive = data.is_active;
        this.createdAt = data.created_at;
        this.updatedAt = data.updated_at;
    }

    // Create new user
    static async create(userData) {
        const {
            firstName,
            lastName,
            email,
            password,
            userType,
            phone,
            companyName,
            taxNumber,
            driverLicenseNumber,
            vehicleType,
            vehiclePlate,
            experienceYears
        } = userData;

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        const result = await query(
            `INSERT INTO users (first_name, last_name, email, password_hash, user_type, phone, 
             company_name, tax_number, driver_license_number, vehicle_type, vehicle_plate, experience_years)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
            [firstName, lastName, email, passwordHash, userType, phone, companyName, 
             taxNumber, driverLicenseNumber, vehicleType, vehiclePlate, experienceYears]
        );

        return new User(result.rows[0]);
    }

    // Find user by email
    static async findByEmail(email) {
        const result = await query('SELECT * FROM users WHERE email = $1', [email]);
        return result.rows.length > 0 ? new User(result.rows[0]) : null;
    }

    // Find user by ID
    static async findById(id) {
        const result = await query('SELECT * FROM users WHERE id = $1', [id]);
        return result.rows.length > 0 ? new User(result.rows[0]) : null;
    }

    // Verify password
    async verifyPassword(password) {
        const result = await query('SELECT password_hash FROM users WHERE id = $1', [this.id]);
        return await bcrypt.compare(password, result.rows[0].password_hash);
    }

    // Generate JWT token
    generateToken() {
        return jwt.sign(
            { 
                id: this.id, 
                email: this.email, 
                userType: this.userType 
            },
            process.env.JWT_SECRET || 'your-super-secret-jwt-key-here',
            { expiresIn: '24h' }
        );
    }

    // Update user
    async update(updateData) {
        const fields = [];
        const values = [];
        let paramCount = 1;

        Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined) {
                fields.push(`${key} = $${paramCount}`);
                values.push(updateData[key]);
                paramCount++;
            }
        });

        if (fields.length === 0) return this;

        values.push(this.id);
        const result = await query(
            `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $${paramCount} RETURNING *`,
            values
        );

        return new User(result.rows[0]);
    }

    // Get user statistics
    async getStats() {
        const stats = {};

        // Get shipment count
        const shipmentResult = await query(
            'SELECT COUNT(*) as count FROM shipments WHERE user_id = $1',
            [this.id]
        );
        stats.shipmentCount = parseInt(shipmentResult.rows[0].count);

        // Get offer count
        const offerResult = await query(
            'SELECT COUNT(*) as count FROM offers WHERE user_id = $1',
            [this.id]
        );
        stats.offerCount = parseInt(offerResult.rows[0].count);

        // Get message count
        const messageResult = await query(
            'SELECT COUNT(*) as count FROM messages WHERE sender_id = $1 OR receiver_id = $1',
            [this.id]
        );
        stats.messageCount = parseInt(messageResult.rows[0].count);

        return stats;
    }

    // Convert to JSON (remove sensitive data)
    toJSON() {
        return {
            id: this.id,
            firstName: this.firstName,
            lastName: this.lastName,
            email: this.email,
            userType: this.userType,
            phone: this.phone,
            companyName: this.companyName,
            taxNumber: this.taxNumber,
            driverLicenseNumber: this.driverLicenseNumber,
            vehicleType: this.vehicleType,
            vehiclePlate: this.vehiclePlate,
            experienceYears: this.experienceYears,
            isVerified: this.isVerified,
            isActive: this.isActive,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

