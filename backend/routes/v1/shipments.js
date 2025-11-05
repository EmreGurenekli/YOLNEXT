// Shipments routes - Modular version
const express = require('express');
const { getPagination, generateTrackingNumber } = require('../../utils/routeHelpers');

function createShipmentRoutes(pool, authenticateToken, createNotification, idempotencyGuard) {
  const router = express.Router();

  // Get shipments
  router.get('/', authenticateToken, async (req, res) => {
    try {
      if (req.user && (req.user.isDemo === true || req.user.isDemo)) {
        return res.json({
          success: true,
          data: [],
          shipments: [],
          meta: { total: 0, page: 1, limit: 10 },
        });
      }

      if (!pool) {
        return res.status(500).json({
          success: false,
          error: 'Database not available',
        });
      }

      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const userId = req.user.id;
      const userRole = req.user.role || 'individual';
      const { status, city, search, q } = req.query;
      const searchTerm = search || q || '';

      let query = `
        SELECT s.*, 
               u.fullName as ownerName,
               u.companyName as ownerCompany,
               c.fullName as carrierName,
               c.companyName as carrierCompany
        FROM shipments s
        LEFT JOIN users u ON s.userId = u.id
        LEFT JOIN users c ON s.carrierId = c.id
      `;

      const params = [];
      const conditions = [];

      if (userRole === 'individual' || userRole === 'corporate') {
        conditions.push('s.userId = $1');
        params.push(userId);
      } else if (userRole === 'nakliyeci') {
        conditions.push(
          '(s.status = $1 OR (s.status = $2 AND s.carrierId = $3))'
        );
        params.push('open', 'accepted', userId);
      }

      if (status) {
        conditions.push(`s.status = $${params.length + 1}`);
        params.push(status);
      }

      if (city) {
        conditions.push(
          `(s.pickupCity ILIKE $${params.length + 1} OR s.deliveryCity ILIKE $${params.length + 1})`
        );
        params.push(`%${city}%`);
      }

      if (searchTerm && searchTerm.trim()) {
        const searchParam = `%${searchTerm.trim()}%`;
        conditions.push(
          `(s.title ILIKE $${params.length + 1} OR 
            s.description ILIKE $${params.length + 1} OR 
            s.pickupCity ILIKE $${params.length + 1} OR 
            s.deliveryCity ILIKE $${params.length + 1} OR
            s.pickupAddress ILIKE $${params.length + 1} OR
            s.deliveryAddress ILIKE $${params.length + 1} OR
            s.trackingNumber ILIKE $${params.length + 1})`
        );
        params.push(searchParam, searchParam, searchParam, searchParam, searchParam, searchParam, searchParam);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      const { page, limit, offset } = getPagination(req);
      query += ` ORDER BY s.createdAt DESC LIMIT ${limit} OFFSET ${offset}`;

      const result = await pool.query(query, params);
      const countRes = await pool.query(
        `SELECT COUNT(*) FROM shipments s ${conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''}`,
        params
      );

      res.json({
        success: true,
        data: result.rows,
        shipments: result.rows,
        meta: { total: parseInt(countRes.rows[0].count), page, limit },
      });
    } catch (error) {
      console.error('Error fetching shipments:', error);
      res.status(500).json({
        success: false,
        error: 'Gönderiler yüklenemedi',
        details: error.message,
      });
    }
  });

  // Create shipment
  router.post('/', authenticateToken, idempotencyGuard, async (req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({
          success: false,
          error: 'Database not available',
        });
      }

      const userId = req.user.id;
      const {
        title,
        description,
        category,
        pickupCity,
        pickupDistrict,
        pickupAddress,
        pickupDate,
        deliveryCity,
        deliveryDistrict,
        deliveryAddress,
        deliveryDate,
        weight,
        volume,
        dimensions,
        value,
        requiresInsurance,
        specialRequirements,
      } = req.body;

      if (!pickupCity || !pickupAddress || !deliveryCity || !deliveryAddress) {
        return res.status(400).json({
          success: false,
          message: 'Pickup and delivery addresses are required',
        });
      }

      const trackingNumber = generateTrackingNumber();

      const result = await pool.query(
        `
        INSERT INTO shipments (
          userId, title, description, category,
          pickupCity, pickupDistrict, pickupAddress, pickupDate,
          deliveryCity, deliveryDistrict, deliveryAddress, deliveryDate,
          weight, volume, dimensions, value, requiresInsurance,
          specialRequirements, status, trackingNumber, metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
        RETURNING *
      `,
        [
          userId,
          title || `${pickupCity} → ${deliveryCity}`,
          description,
          category || 'general',
          pickupCity,
          pickupDistrict,
          pickupAddress,
          pickupDate ? new Date(pickupDate) : null,
          deliveryCity,
          deliveryDistrict,
          deliveryAddress,
          deliveryDate ? new Date(deliveryDate) : null,
          weight || 0,
          volume || 0,
          dimensions,
          value || 0,
          requiresInsurance || false,
          specialRequirements,
          'open',
          trackingNumber,
          JSON.stringify({ createdBy: userId, isDemo: req.user.isDemo || false }),
        ]
      );

      const shipment = result.rows[0];

      await createNotification(
        userId,
        'shipment_created',
        'Gönderi Oluşturuldu',
        `Gönderiniz başarıyla oluşturuldu. Takip numaranız: ${trackingNumber}`,
        `/shipments/${shipment.id}`,
        'normal',
        { shipmentId: shipment.id, trackingNumber }
      );

      res.status(201).json({
        success: true,
        message: 'Gönderi başarıyla oluşturuldu',
        data: {
          shipment: shipment,
          id: shipment.id,
        },
      });
    } catch (error) {
      console.error('Error creating shipment:', error);
      res.status(500).json({
        success: false,
        error: 'Gönderi oluşturulamadı',
        details: error.message,
      });
    }
  });

  // Get open shipments (for carriers)
  router.get('/open', authenticateToken, async (req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({
          success: false,
          error: 'Database not available',
        });
      }

      const { page, limit, offset } = getPagination(req);
      const result = await pool.query(
        `SELECT s.*, 
                u.fullName as ownerName,
                u.companyName as ownerCompany
         FROM shipments s
         LEFT JOIN users u ON s.userId = u.id
         WHERE s.status = 'open'
         ORDER BY s.createdAt DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      const countRes = await pool.query(
        "SELECT COUNT(*) FROM shipments WHERE status = 'open'"
      );

      res.json({
        success: true,
        data: result.rows,
        meta: { total: parseInt(countRes.rows[0].count), page, limit },
      });
    } catch (error) {
      console.error('Error fetching open shipments:', error);
      res.status(500).json({
        success: false,
        error: 'Açık gönderiler yüklenemedi',
        details: error.message,
      });
    }
  });

  // Get shipment by ID
  router.get('/:id', async (req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({
          success: false,
          error: 'Database not available',
        });
      }

      const { id } = req.params;
      const result = await pool.query(
        `SELECT s.*, 
                u.fullName as ownerName,
                u.companyName as ownerCompany,
                c.fullName as carrierName,
                c.companyName as carrierCompany
         FROM shipments s
         LEFT JOIN users u ON s.userId = u.id
         LEFT JOIN users c ON s.carrierId = c.id
         WHERE s.id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Shipment not found',
        });
      }

      res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Error fetching shipment:', error);
      res.status(500).json({
        success: false,
        error: 'Gönderi yüklenemedi',
        details: error.message,
      });
    }
  });

  return router;
}

module.exports = createShipmentRoutes;







