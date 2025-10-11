const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

const router = express.Router();

// Gerçek gönderi oluşturma
router.post('/create', authenticateToken, [
  body('title').notEmpty().withMessage('Başlık gerekli'),
  body('description').optional(),
  body('category').notEmpty().withMessage('Kategori gerekli'),
  body('pickup_address').notEmpty().withMessage('Alış adresi gerekli'),
  body('pickup_city').notEmpty().withMessage('Alış şehri gerekli'),
  body('delivery_address').notEmpty().withMessage('Teslimat adresi gerekli'),
  body('delivery_city').notEmpty().withMessage('Teslimat şehri gerekli'),
  body('pickup_date').isISO8601().withMessage('Geçerli alış tarihi gerekli'),
  body('delivery_date').isISO8601().withMessage('Geçerli teslimat tarihi gerekli'),
  body('weight_kg').isFloat({ min: 0 }).withMessage('Geçerli ağırlık gerekli'),
  body('budget_min').isFloat({ min: 0 }).withMessage('Geçerli minimum bütçe gerekli'),
  body('budget_max').isFloat({ min: 0 }).withMessage('Geçerli maksimum bütçe gerekli')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz veri',
        errors: errors.array()
      });
    }

    const {
      title, description, category, subcategory,
      pickup_address, pickup_city, pickup_district, pickup_postal_code,
      pickup_latitude, pickup_longitude, pickup_contact_name, pickup_contact_phone,
      delivery_address, delivery_city, delivery_district, delivery_postal_code,
      delivery_latitude, delivery_longitude, delivery_contact_name, delivery_contact_phone,
      weight_kg, volume_m3, length_cm, width_cm, height_cm,
      pickup_date, pickup_time_start, pickup_time_end,
      delivery_date, delivery_time_start, delivery_time_end,
      budget_min, budget_max, special_requirements, insurance_required, insurance_value,
      tags
    } = req.body;

    // Kullanıcı doğrulaması
    const user = await db.get('SELECT * FROM users WHERE id = ? AND is_active = true', [req.user.id]);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    // Gönderi oluştur
    const result = await db.run(`
      INSERT INTO shipments (
        user_id, title, description, category, subcategory,
        pickup_address, pickup_city, pickup_district, pickup_postal_code,
        pickup_latitude, pickup_longitude, pickup_contact_name, pickup_contact_phone,
        delivery_address, delivery_city, delivery_district, delivery_postal_code,
        delivery_latitude, delivery_longitude, delivery_contact_name, delivery_contact_phone,
        weight_kg, volume_m3, length_cm, width_cm, height_cm,
        pickup_date, pickup_time_start, pickup_time_end,
        delivery_date, delivery_time_start, delivery_time_end,
        budget_min, budget_max, special_requirements, insurance_required, insurance_value,
        tags, status, visibility
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      user.id, title, description, category, subcategory,
      pickup_address, pickup_city, pickup_district, pickup_postal_code,
      pickup_latitude, pickup_longitude, pickup_contact_name, pickup_contact_phone,
      delivery_address, delivery_city, delivery_district, delivery_postal_code,
      delivery_latitude, delivery_longitude, delivery_contact_name, delivery_contact_phone,
      weight_kg, volume_m3, length_cm, width_cm, height_cm,
      pickup_date, pickup_time_start, pickup_time_end,
      delivery_date, delivery_time_start, delivery_time_end,
      budget_min, budget_max, special_requirements, insurance_required, insurance_value,
      JSON.stringify(tags || []), 'active', 'public'
    ]);

    // Gönderi detaylarını getir
    const shipment = await db.get(`
      SELECT s.*, u.first_name, u.last_name, u.company_name, u.avatar_url
      FROM shipments s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `, [result.lastID]);

    res.json({
      success: true,
      message: 'Gönderi başarıyla oluşturuldu',
      data: shipment
    });

  } catch (error) {
    console.error('Gönderi oluşturma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message
    });
  }
});

// Aktif gönderileri listele (nakliyeci/taşıyıcı için)
router.get('/active', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, category, city, min_budget, max_budget } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT s.*, u.first_name, u.last_name, u.company_name, u.avatar_url,
             COUNT(o.id) as offer_count
      FROM shipments s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN offers o ON s.id = o.shipment_id
      WHERE s.status = 'active' AND s.visibility = 'public'
    `;
    
    const params = [];
    
    if (category) {
      query += ' AND s.category = ?';
      params.push(category);
    }
    
    if (city) {
      query += ' AND (s.pickup_city = ? OR s.delivery_city = ?)';
      params.push(city, city);
    }
    
    if (min_budget) {
      query += ' AND s.budget_max >= ?';
      params.push(min_budget);
    }
    
    if (max_budget) {
      query += ' AND s.budget_min <= ?';
      params.push(max_budget);
    }

    query += ' GROUP BY s.id ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const shipments = await db.all(query, params);

    // Toplam sayıyı al
    let countQuery = `
      SELECT COUNT(*) as total
      FROM shipments s
      WHERE s.status = 'active' AND s.visibility = 'public'
    `;
    
    const countParams = [];
    if (category) {
      countQuery += ' AND s.category = ?';
      countParams.push(category);
    }
    if (city) {
      countQuery += ' AND (s.pickup_city = ? OR s.delivery_city = ?)';
      countParams.push(city, city);
    }
    if (min_budget) {
      countQuery += ' AND s.budget_max >= ?';
      countParams.push(min_budget);
    }
    if (max_budget) {
      countQuery += ' AND s.budget_min <= ?';
      countParams.push(max_budget);
    }

    const countResult = await db.get(countQuery, countParams);
    const total = countResult.total;

    res.json({
      success: true,
      data: {
        shipments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Gönderi listeleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message
    });
  }
});

// Kullanıcının gönderilerini listele
router.get('/my-shipments', authenticateToken, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT s.*, 
             COUNT(o.id) as offer_count,
             COUNT(CASE WHEN o.status = 'accepted' THEN 1 END) as accepted_offers
      FROM shipments s
      LEFT JOIN offers o ON s.id = o.shipment_id
      WHERE s.user_id = ?
    `;
    
    const params = [req.user.id];
    
    if (status) {
      query += ' AND s.status = ?';
      params.push(status);
    }

    query += ' GROUP BY s.id ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const shipments = await db.all(query, params);

    res.json({
      success: true,
      data: shipments
    });

  } catch (error) {
    console.error('Kullanıcı gönderileri hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message
    });
  }
});

// Gönderi detaylarını getir
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const shipment = await db.get(`
      SELECT s.*, u.first_name, u.last_name, u.company_name, u.avatar_url, u.phone
      FROM shipments s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ? AND s.status != 'draft'
    `, [id]);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Gönderi bulunamadı'
      });
    }

    // Teklifleri getir (eğer kullanıcı gönderi sahibi veya teklif veren ise)
    let offers = [];
    if (shipment.user_id === req.user.id) {
      offers = await db.all(`
        SELECT o.*, u.first_name, u.last_name, u.company_name, u.avatar_url, u.phone,
               v.plate_number, v.vehicle_type, v.max_weight_kg, v.max_volume_m3
        FROM offers o
        JOIN users u ON o.carrier_id = u.id
        LEFT JOIN vehicles v ON u.id = v.owner_id
        WHERE o.shipment_id = ?
        ORDER BY o.created_at DESC
      `, [id]);
    }

    res.json({
      success: true,
      data: {
        shipment,
        offers
      }
    });

  } catch (error) {
    console.error('Gönderi detay hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message
    });
  }
});

// Gönderi durumunu güncelle
router.patch('/:id/status', authenticateToken, [
  body('status').isIn(['active', 'in_progress', 'completed', 'cancelled']).withMessage('Geçersiz durum')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz veri',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { status } = req.body;

    // Gönderi sahibi kontrolü
    const shipment = await db.get('SELECT * FROM shipments WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Gönderi bulunamadı veya yetkiniz yok'
      });
    }

    // Durum güncelle
    await db.run('UPDATE shipments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, id]);

    res.json({
      success: true,
      message: 'Gönderi durumu güncellendi'
    });

  } catch (error) {
    console.error('Gönderi durum güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message
    });
  }
});

module.exports = router;




