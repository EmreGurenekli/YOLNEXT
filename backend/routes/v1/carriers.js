// Corporate carriers routes
const express = require('express');

function createCarrierRoutes(pool, authenticateToken) {
  const router = express.Router();

  // Carrier route management (frontend CarrierManagementModal compatibility)
  router.get('/:carrierId/route', authenticateToken, async (req, res) => {
    return res.json([]);
  });

  router.get('/:carrierId/suggestions', authenticateToken, async (req, res) => {
    return res.json([]);
  });

  router.post('/:carrierId/assign', authenticateToken, express.json({ limit: '10mb' }), async (req, res) => {
    return res.json({ success: true });
  });

  // GET /api/carriers/corporate - Get favori nakliyeciler for corporate user
  router.get('/corporate', authenticateToken, async (req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({
          success: false,
          error: 'Database not available',
        });
      }

      const userId = req.user.id;

      // Verify user is corporate
      const userResult = await pool.query(
        'SELECT role FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      const user = userResult.rows[0];
      const userRole = user.role;

      if (userRole !== 'corporate') {
        return res.status(403).json({
          success: false,
          message: 'Only corporate users can access this endpoint',
        });
      }

      // Get favori nakliyeciler with performance stats - return empty array if table doesn't exist or no carriers
      let carriersResult;
      try {
        carriersResult = await pool.query(
          `SELECT 
            u.id, 
            u."fullName", 
            u."companyName", 
            u.email, 
            u.phone, 
            u.city, 
            u.district, 
            u."nakliyeciCode",
            -- Performance stats with this corporate user
            COUNT(DISTINCT s.id) FILTER (WHERE s."user_id" = $1 AND s."nakliyeci_id" = u.id) as "totalShipments",
            COUNT(DISTINCT s.id) FILTER (WHERE s."user_id" = $1 AND s."nakliyeci_id" = u.id AND s.status = 'delivered') as "completedShipments",
            COALESCE(AVG(r.rating) FILTER (WHERE r."ratedId" = u.id AND r."raterId" = $1), 0) as "averageRating",
            MAX(s."updatedAt") FILTER (WHERE s."user_id" = $1 AND s."nakliyeci_id" = u.id) as "lastActivity"
           FROM users u
           INNER JOIN corporate_carriers cc ON u.id = cc."nakliyeci_id"
           LEFT JOIN shipments s ON s."nakliyeci_id" = u.id AND s."user_id" = $1
           LEFT JOIN ratings r ON r."ratedId" = u.id AND r."raterId" = $1
           WHERE cc."corporate_id" = $1 AND u.role = 'nakliyeci'
           GROUP BY u.id, u."fullName", u."companyName", u.email, u.phone, u.city, u.district, u."nakliyeciCode", cc."createdAt"
           ORDER BY cc."createdAt" DESC`,
          [userId]
        );
      } catch (dbError) {
        console.error('Database error fetching carriers:', dbError.message);
        // If table doesn't exist or other DB error, return empty array
        carriersResult = { rows: [] };
      }

      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.json({
        success: true,
        data: {
          carriers: carriersResult.rows,
        },
      });
    } catch (error) {
      console.error('Error fetching corporate carriers:', error);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.status(500).json({
        success: false,
        error: 'Favori nakliyeciler yüklenemedi',
        details: error.message,
      });
    }
  });

  // POST /api/carriers/corporate/link - Link nakliyeci to corporate user
  router.post('/corporate/link', authenticateToken, express.json({ limit: '10mb' }), async (req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({
          success: false,
          error: 'Database not available',
        });
      }

      const userId = req.user.id;
      const { code, email } = req.body;

      if (!code && !email) {
        return res.status(400).json({
          success: false,
          message: 'Nakliyeci kodu veya e-posta gereklidir',
        });
      }

      // Verify user is corporate
      const userResult = await pool.query(
        'SELECT role FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Kurumsal kullanıcı bulunamadı',
        });
      }

      const user = userResult.rows[0];
      const userRole = user.role;

      if (userRole !== 'corporate') {
        return res.status(403).json({
          success: false,
          message: 'Sadece kurumsal kullanıcılar nakliyeci ekleyebilir',
        });
      }

      // Find nakliyeci user by email or code (ID)
      let nakliyeciUser = null;
      const searchTerm = code || email;

      if (searchTerm.includes('@')) {
        // Search by email
        const searchLower = searchTerm.toLowerCase();
        const nakliyeciResult = await pool.query(
          `SELECT id, "fullName", "companyName", email, phone, role, "nakliyeciCode"
           FROM users
           WHERE LOWER(email) = $1 AND role = 'nakliyeci'`,
          [searchLower]
        );

        if (nakliyeciResult.rows.length > 0) {
          nakliyeciUser = nakliyeciResult.rows[0];
        }
      } else {
        // Search by ID or nakliyeciCode
        // First try to parse as integer for ID search, otherwise search by nakliyeciCode
        const parsedId = parseInt(searchTerm, 10);
        let nakliyeciResult;
        
        if (!isNaN(parsedId) && parsedId.toString() === searchTerm) {
          // It's a valid integer ID
          nakliyeciResult = await pool.query(
            `SELECT id, "fullName", "companyName", email, phone, role, "nakliyeciCode"
             FROM users
             WHERE id = $1 AND role = 'nakliyeci'`,
            [parsedId]
          );
        } else {
          // Search by nakliyeciCode (string)
          nakliyeciResult = await pool.query(
            `SELECT id, "fullName", "companyName", email, phone, role, "nakliyeciCode"
             FROM users
             WHERE "nakliyeciCode" = $1 AND role = 'nakliyeci'`,
            [searchTerm]
          );
        }

        if (nakliyeciResult.rows.length > 0) {
          nakliyeciUser = nakliyeciResult.rows[0];
        }
      }

      if (!nakliyeciUser) {
        return res.status(404).json({
          success: false,
          message: 'Nakliyeci bulunamadı. Lütfen geçerli bir nakliyeci kodu veya e-posta girin.',
        });
      }

      // Check if already linked
      const existingLink = await pool.query(
        'SELECT id FROM corporate_carriers WHERE "corporate_id" = $1 AND "nakliyeci_id" = $2',
        [userId, nakliyeciUser.id]
      );

      if (existingLink.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Bu nakliyeci zaten favorilerinize eklenmiş',
        });
      }

      // Create corporate-nakliyeci relationship
      await pool.query(
        `INSERT INTO corporate_carriers ("corporate_id", "nakliyeci_id", "createdAt", "updatedAt")
         VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [userId, nakliyeciUser.id]
      );

      console.log(`✅ Corporate carrier linked - corporateId: ${userId}, nakliyeciId: ${nakliyeciUser.id}`);

      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.json({
        success: true,
        message: 'Nakliyeci başarıyla favorilerinize eklendi',
        data: {
          nakliyeci: {
            id: nakliyeciUser.id,
            name: nakliyeciUser.fullName,
            companyName: nakliyeciUser.companyName,
            email: nakliyeciUser.email,
          },
        },
      });
    } catch (error) {
      console.error('Error linking corporate carrier:', error);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.status(500).json({
        success: false,
        message: 'Nakliyeci eklenirken hata oluştu',
        error: error.message,
      });
    }
  });

  // DELETE /api/carriers/corporate/:nakliyeciId - Remove nakliyeci from favorites
  router.delete('/corporate/:nakliyeciId', authenticateToken, async (req, res) => {
    console.log('🗑️ DELETE /api/carriers/corporate/:nakliyeciId called', { nakliyeciId: req.params.nakliyeciId, userId: req.user?.id });
    try {
      if (!pool) {
        return res.status(500).json({
          success: false,
          error: 'Database not available',
        });
      }

      const userId = req.user.id;
      const nakliyeciId = parseInt(req.params.nakliyeciId);

      if (!nakliyeciId || isNaN(nakliyeciId)) {
        return res.status(400).json({
          success: false,
          message: 'Geçerli bir nakliyeci ID gereklidir',
        });
      }

      // Verify user is corporate
      const userResult = await pool.query(
        'SELECT role FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Kurumsal kullanıcı bulunamadı',
        });
      }

      const user = userResult.rows[0];
      const userRole = user.role;

      if (userRole !== 'corporate') {
        return res.status(403).json({
          success: false,
          message: 'Sadece kurumsal kullanıcılar nakliyeci silebilir',
        });
      }

      // Check if link exists
      const existingLink = await pool.query(
        'SELECT id FROM corporate_carriers WHERE "corporate_id" = $1 AND "nakliyeci_id" = $2',
        [userId, nakliyeciId]
      );

      if (existingLink.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Bu nakliyeci favorilerinizde bulunamadı',
        });
      }

      // Delete the link
      await pool.query(
        'DELETE FROM corporate_carriers WHERE "corporate_id" = $1 AND "nakliyeci_id" = $2',
        [userId, nakliyeciId]
      );

      console.log(`✅ Corporate carrier unlinked - corporateId: ${userId}, nakliyeciId: ${nakliyeciId}`);

      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.json({
        success: true,
        message: 'Nakliyeci favorilerinizden kaldırıldı',
      });
    } catch (error) {
      console.error('Error unlinking corporate carrier:', error);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.status(500).json({
        success: false,
        message: 'Nakliyeci kaldırılırken hata oluştu',
        error: error.message,
      });
    }
  });

  // GET /api/carriers/nakliyeci/stats - Get stats for nakliyeci (how many corporates added them)
  router.get('/nakliyeci/stats', authenticateToken, async (req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({
          success: false,
          error: 'Database not available',
        });
      }

      const nakliyeciId = req.user.id;

      // Verify user is nakliyeci
      const userResult = await pool.query(
        'SELECT role, "nakliyeciCode" FROM users WHERE id = $1',
        [nakliyeciId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      const user = userResult.rows[0];
      const userRole = user.role;

      if (userRole !== 'nakliyeci') {
        return res.status(403).json({
          success: false,
          message: 'Only nakliyeci users can access this endpoint',
        });
      }

      // Count how many corporate users added this nakliyeci
      let statsResult;
      try {
        statsResult = await pool.query(
          `SELECT COUNT(*) as "favoriteCount"
           FROM corporate_carriers
           WHERE "nakliyeci_id" = $1`,
          [nakliyeciId]
        );
      } catch (dbError) {
        console.error('Database error fetching stats:', dbError.message);
        statsResult = { rows: [{ favoriteCount: '0' }] };
      }

      const favoriteCount = parseInt(statsResult.rows[0].favoriteCount || '0');

      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.json({
        success: true,
        data: {
          nakliyeciCode: user.nakliyeciCode,
          favoriteCount: favoriteCount,
          badge: getBadge(favoriteCount),
          message: getMessage(favoriteCount),
        },
      });
    } catch (error) {
      console.error('Error fetching nakliyeci stats:', error);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.status(500).json({
        success: false,
        error: 'İstatistikler yüklenemedi',
        details: error.message,
      });
    }
  });

  // Helper functions for gamification
  function getBadge(count) {
    if (count === 0) return 'Yeni Başlayan';
    if (count < 5) return 'Yükselen Yıldız';
    if (count < 10) return 'Popüler';
    if (count < 20) return 'Güvenilir';
    if (count < 50) return 'Elit';
    if (count < 100) return 'Efsane';
    return 'İkon';
  }

  function getMessage(count) {
    if (count === 0) return 'Henüz kimse seni eklememiş. Kodunu paylaş ve popüler ol!';
    if (count < 5) return `${count} kurumsal kullanıcı seni favorilerine ekledi. Harika başlangıç!`;
    if (count < 10) return `${count} kurumsal kullanıcı seni favorilerine ekledi. Sen bir yıldızsın! ⭐`;
    if (count < 20) return `${count} kurumsal kullanıcı seni favorilerine ekledi. Güvenilir bir ortaksın!`;
    if (count < 50) return `${count} kurumsal kullanıcı seni favorilerine ekledi. Elit seviyedesin! 🏆`;
    if (count < 100) return `${count} kurumsal kullanıcı seni favorilerine ekledi. Efsane bir nakliyecisin! 🌟`;
    return `${count}+ kurumsal kullanıcı seni favorilerine ekledi. Sen bir ikonsun! 👑`;
  }

  return router;
}

module.exports = createCarrierRoutes;

