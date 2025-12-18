const express = require('express');

function sanitizeIdentifier(raw) {
  const input = String(raw || '').trim();
  if (!input) return '';
  
  // Email
  if (input.includes('@')) return input.toLowerCase();
  
  const upper = input.replace(/[ıİ]/g, 'I').toUpperCase();
  const cleaned = upper.replace(/[^A-Z0-9]/g, '');
  
  // Accept YD-12345, YD12345, 12345
  const m = cleaned.match(/^(?:YD)?(\d{4,6})$/);
  if (m) {
    const num = m[1].padStart(5, '0');
    return `YD-${num}`;
  }
  
  if (cleaned.startsWith('YD') && cleaned.length >= 4) {
    const num = cleaned.slice(2).padStart(5, '0');
    return `YD-${num}`;
  }
  
  return upper;
}

function createDriversRoutes(pool, authenticateToken) {
  const router = express.Router();

  router.get('/lookup/:identifier', authenticateToken, async (req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({ success: false, message: 'Database not available' });
      }

      const identifier = sanitizeIdentifier(req.params.identifier);
      if (!identifier) {
        return res.status(400).json({ success: false, message: 'Identifier required' });
      }

      let result;
      if (identifier.includes('@')) {
        result = await pool.query(
          `SELECT id, email, "fullName", phone, role, "driverCode"
           FROM users
           WHERE LOWER(email) = $1 AND role = 'tasiyici'`,
          [identifier]
        );
      } else {
        result = await pool.query(
          `SELECT id, email, "fullName", phone, role, "driverCode"
           FROM users
           WHERE "driverCode" = $1 AND role = 'tasiyici'`,
          [identifier]
        );
      }

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Taşıyıcı bulunamadı' });
      }

      return res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Lookup failed', details: error.message });
    }
  });

  router.post('/link', authenticateToken, express.json({ limit: '1mb' }), async (req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({ success: false, message: 'Database not available' });
      }

      const carrierId = req.user?.id;
      const identifier = sanitizeIdentifier(req.body?.code || req.body?.email || req.body?.identifier);

      if (!carrierId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }
      if (!identifier) {
        return res.status(400).json({ success: false, message: 'Kod veya e-posta gerekli' });
      }

      const roleResult = await pool.query('SELECT role FROM users WHERE id = $1', [carrierId]);
      if (roleResult.rows.length === 0 || roleResult.rows[0].role !== 'nakliyeci') {
        return res.status(403).json({ success: false, message: 'Sadece nakliyeci taşıyıcı ekleyebilir' });
      }

      let driverResult;
      if (identifier.includes('@')) {
        driverResult = await pool.query(
          `SELECT id, email, "fullName", phone, "driverCode" FROM users
           WHERE LOWER(email) = $1 AND role = 'tasiyici'`,
          [identifier]
        );
      } else {
        driverResult = await pool.query(
          `SELECT id, email, "fullName", phone, "driverCode" FROM users
           WHERE "driverCode" = $1 AND role = 'tasiyici'`,
          [identifier]
        );
      }

      if (driverResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Taşıyıcı bulunamadı' });
      }

      const driver = driverResult.rows[0];

      const existing = await pool.query(
        'SELECT id FROM carrier_drivers WHERE carrier_id = $1 AND driver_id = $2',
        [carrierId, driver.id]
      );
      if (existing.rows.length > 0) {
        return res.json({ success: true, message: 'Zaten eklenmiş' });
      }

      await pool.query(
        `INSERT INTO carrier_drivers (carrier_id, driver_id, "createdAt", "updatedAt")
         VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [carrierId, driver.id]
      );

      return res.status(201).json({
        success: true,
        message: 'Taşıyıcı eklendi',
        data: { driver },
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Link failed', details: error.message });
    }
  });

  router.get('/nakliyeci', authenticateToken, async (req, res) => {
    try {
      if (!pool) {
        // Fallback to empty result instead of 500 error
        return res.json({ success: true, drivers: [] });
      }

      const carrierId = req.user?.id;
      if (!carrierId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      // Ensure carrierId is an integer for PostgreSQL
      const carrierIdInt = parseInt(carrierId, 10);
      if (isNaN(carrierIdInt)) {
        return res.status(400).json({ success: false, message: 'Invalid carrier ID' });
      }

      // Debug logging
      console.log('[DEBUG] /api/drivers/nakliyeci - req.user:', JSON.stringify(req.user), 'carrierId:', carrierId, 'carrierIdInt:', carrierIdInt);

      // Check if carrier_drivers table exists
      const tableCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'carrier_drivers'
        )
      `);

      console.log('[DEBUG] /api/drivers/nakliyeci - Table exists:', tableCheck.rows[0]?.exists);

      if (!tableCheck.rows[0]?.exists) {
        // Table doesn't exist, return empty array
        console.log('[DEBUG] /api/drivers/nakliyeci - Table does not exist, returning empty array');
        return res.json({ success: true, drivers: [] });
      }

      // First, check if there are any linked drivers
      const linkCheck = await pool.query(
        'SELECT COUNT(*) as count FROM carrier_drivers WHERE carrier_id = $1',
        [carrierIdInt]
      );
      
      console.log('[DEBUG] /api/drivers/nakliyeci - Linked drivers count:', linkCheck.rows[0]?.count);

      // Get drivers with performance metrics and vehicle info
      const result = await pool.query(
        `SELECT
           u.id,
           u."fullName" as name,
           u.email,
           u.phone,
           u."driverCode" as code,
           u.city,
           u.district,
           u."createdAt" as "joinDate",
           v.plate_number as "vehiclePlate",
           v.type as "vehicleType",
           COALESCE((
             SELECT COUNT(*)::INTEGER
             FROM shipments s
             WHERE s.driver_id = u.id AND s."nakliyeci_id" = $1
           ), 0) as "totalJobs",
           COALESCE((
             SELECT COUNT(*)::INTEGER
             FROM shipments s
             WHERE s.driver_id = u.id 
               AND s."nakliyeci_id" = $1 
               AND s.status = 'delivered'
           ), 0) as "completedJobs",
           COALESCE((
             CASE 
               WHEN (
                 SELECT COUNT(*)::INTEGER
                 FROM shipments s
                 WHERE s.driver_id = u.id AND s."nakliyeci_id" = $1
               ) > 0 THEN
                 ROUND((
                   SELECT COUNT(*)::INTEGER
                   FROM shipments s
                   WHERE s.driver_id = u.id 
                     AND s."nakliyeci_id" = $1 
                     AND s.status = 'delivered'
                 )::NUMERIC / 
                 NULLIF((
                   SELECT COUNT(*)::INTEGER
                   FROM shipments s
                   WHERE s.driver_id = u.id AND s."nakliyeci_id" = $1
                 ), 0) * 100, 1)
               ELSE 0
             END
           ), 0) as "successRate",
           COALESCE((
             SELECT AVG(r.rating)::NUMERIC(3,1)
             FROM ratings r
             WHERE r."ratedId" = u.id
           ), 0) as rating,
           COALESCE((
             SELECT COUNT(*)::INTEGER
             FROM shipments s
             WHERE s.driver_id = u.id 
               AND s."nakliyeci_id" = $1 
               AND s.status IN ('accepted', 'in_transit', 'picked_up', 'offer_accepted', 'preparing')
           ), 0) as "activeJobs",
           CASE 
             WHEN (
               SELECT COUNT(*)::INTEGER
               FROM shipments s
               WHERE s.driver_id = u.id 
                 AND s."nakliyeci_id" = $1 
                 AND s.status IN ('accepted', 'in_transit', 'picked_up', 'offer_accepted', 'preparing')
             ) > 0 THEN 'busy'
             ELSE 'available'
           END as status
        FROM carrier_drivers cd
        INNER JOIN users u ON u.id = cd.driver_id
        LEFT JOIN vehicles v ON v.owner_id = u.id
        WHERE cd.carrier_id = $1
        ORDER BY cd."createdAt" DESC`,
        [carrierIdInt]
      );

      console.log('[DEBUG] /api/drivers/nakliyeci - SQL query result rows:', result.rows.length);
      if (result.rows.length > 0) {
        console.log('[DEBUG] /api/drivers/nakliyeci - First driver:', JSON.stringify(result.rows[0], null, 2));
      }

      // Format drivers with vehicle information
      const formattedDrivers = (result.rows || []).map(driver => ({
        id: String(driver.id), // Ensure ID is string
        name: driver.name || '',
        email: driver.email || '',
        phone: driver.phone || '',
        code: driver.code || '',
        city: driver.city || '',
        district: driver.district || '',
        joinDate: driver.joinDate || new Date().toISOString(),
        totalJobs: driver.totalJobs || 0,
        completedJobs: driver.completedJobs || 0,
        successRate: driver.successRate || 0,
        rating: driver.rating || 0,
        activeJobs: driver.activeJobs || 0,
        status: driver.status || 'available',
        vehicle: {
          plate: driver.vehiclePlate || 'N/A',
          type: driver.vehicleType || 'N/A',
        },
      }));

      // Debug logging
      if (process.env.NODE_ENV === 'development') {
        console.log('[DEBUG] /api/drivers/nakliyeci - Formatted drivers:', formattedDrivers.length);
      }

      return res.json({ success: true, drivers: formattedDrivers });
    } catch (error) {
      // Error logging - only in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching drivers:', error);
        console.error('Error stack:', error.stack);
      }
      // Return empty array instead of 500 error for better UX
      return res.json({ success: true, drivers: [] });
    }
  });

  // Delete driver from carrier
  router.delete('/:driverId', authenticateToken, async (req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({ success: false, message: 'Database not available' });
      }

      const carrierId = req.user?.id;
      const driverId = parseInt(req.params.driverId);

      if (!carrierId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      if (!driverId || isNaN(driverId)) {
        return res.status(400).json({ success: false, message: 'Geçersiz taşıyıcı ID' });
      }

      // Verify carrier role
      const roleResult = await pool.query('SELECT role FROM users WHERE id = $1', [carrierId]);
      if (roleResult.rows.length === 0 || roleResult.rows[0].role !== 'nakliyeci') {
        return res.status(403).json({ success: false, message: 'Sadece nakliyeci taşıyıcı kaldırabilir' });
      }

      // Check if relationship exists
      const existing = await pool.query(
        'SELECT id FROM carrier_drivers WHERE carrier_id = $1 AND driver_id = $2',
        [carrierId, driverId]
      );

      if (existing.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Taşıyıcı bulunamadı' });
      }

      // Delete relationship
      await pool.query(
        'DELETE FROM carrier_drivers WHERE carrier_id = $1 AND driver_id = $2',
        [carrierId, driverId]
      );

      return res.json({ success: true, message: 'Taşıyıcı kaldırıldı' });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to delete driver', details: error.message });
    }
  });

  return router;
}

module.exports = createDriversRoutes;
