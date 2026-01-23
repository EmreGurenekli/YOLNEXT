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

  let carrierDriversEnsured = false;
  const ensureCarrierDriversTable = async () => {
    if (!pool || carrierDriversEnsured) return;
    try {
      await pool.query(
        `CREATE TABLE IF NOT EXISTS carrier_drivers (
          id SERIAL PRIMARY KEY,
          carrier_id INTEGER NOT NULL,
          driver_id INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE (carrier_id, driver_id)
        )`
      );
    } catch (_) {
      // ignore
    }
    carrierDriversEnsured = true;
  };

  const resolveUsersTable = async () => {
    const tRes = await pool.query(
      `SELECT table_schema
       FROM information_schema.tables
       WHERE table_name = 'users'
       ORDER BY (table_schema = 'public') DESC, table_schema ASC
       LIMIT 1`
    );
    const schema = tRes.rows && tRes.rows[0]?.table_schema ? tRes.rows[0].table_schema : 'public';
    const colsRes = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND table_schema = $1`,
      [schema]
    );
    const cols = new Set((colsRes.rows || []).map(r => r.column_name));
    const pickCol = (...names) => names.find(n => cols.has(n)) || null;
    const qCol = (col) => (col && /[A-Z]/.test(col) ? `"${col}"` : col);
    return {
      schema,
      qCol,
      cols: {
        id: 'id',
        email: pickCol('email', 'emailAddress', 'email_address', 'mail') || 'email',
        fullName: pickCol('fullName', 'full_name', 'name'),
        phone: pickCol('phone', 'phone_number', 'phoneNumber', 'mobile', 'mobile_phone'),
        role: pickCol('role', 'panel_type', 'userType', 'user_type') || 'role',
        driverCode: pickCol('driverCode', 'driver_code', 'code'),
        city: pickCol('city'),
        district: pickCol('district'),
        createdAt: pickCol('createdAt', 'created_at'),
      },
    };
  };

  const resolveRatingsTable = async () => {
    try {
      const tRes = await pool.query(
        `SELECT table_schema
         FROM information_schema.tables
         WHERE table_name = 'ratings'
         ORDER BY (table_schema = 'public') DESC, table_schema ASC
         LIMIT 1`
      );
      const schema = tRes.rows && tRes.rows[0]?.table_schema ? tRes.rows[0].table_schema : null;
      if (!schema) return null;

      const colsRes = await pool.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'ratings' AND table_schema = $1`,
        [schema]
      );
      const cols = new Set((colsRes.rows || []).map(r => r.column_name));
      const pickCol = (...names) => names.find(n => cols.has(n)) || null;
      const qCol = (col) => (col && /[A-Z]/.test(col) ? `"${col}"` : col);

      const ratedId = pickCol('ratedId', 'rated_id', 'ratedid');
      const rating = pickCol('rating');
      if (!ratedId || !rating) return null;

      return { schema, qCol, ratedId, rating };
    } catch (_) {
      return null;
    }
  };

  const resolveCarrierDriversTable = async () => {
    await ensureCarrierDriversTable();
    const tRes = await pool.query(
      `SELECT table_schema
       FROM information_schema.tables
       WHERE table_name = 'carrier_drivers'
       ORDER BY (table_schema = 'public') DESC, table_schema ASC
       LIMIT 1`
    );
    const schema = tRes.rows && tRes.rows[0]?.table_schema ? tRes.rows[0].table_schema : 'public';
    const colsRes = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'carrier_drivers' AND table_schema = $1`,
      [schema]
    );
    const cols = new Set((colsRes.rows || []).map(r => r.column_name));
    const pickCol = (...names) => names.find(n => cols.has(n)) || null;
    const qCol = (col) => (col && /[A-Z]/.test(col) ? `"${col}"` : col);
    return {
      schema,
      qCol,
      cols: {
        carrierId: pickCol('carrier_id', 'carrierId', 'carrierid', 'nakliyeci_id', 'nakliyeciId'),
        driverId: pickCol('driver_id', 'driverId', 'driverid'),
        createdAt: pickCol('createdAt', 'created_at', 'createdat'),
        updatedAt: pickCol('updatedAt', 'updated_at', 'updatedat'),
      },
    };
  };

  const resolveVehiclesTable = async () => {
    try {
      const tRes = await pool.query(
        `SELECT table_schema
         FROM information_schema.tables
         WHERE table_name = 'vehicles'
         ORDER BY (table_schema = 'public') DESC, table_schema ASC
         LIMIT 1`
      );
      const schema = tRes.rows && tRes.rows[0]?.table_schema ? tRes.rows[0].table_schema : null;
      if (!schema) return null;

      const colsRes = await pool.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'vehicles' AND table_schema = $1`,
        [schema]
      );
      const cols = new Set((colsRes.rows || []).map(r => r.column_name));
      const pickCol = (...names) => names.find(n => cols.has(n)) || null;
      const qCol = (col) => (col && /[A-Z]/.test(col) ? `"${col}"` : col);

      const owner_id = pickCol('owner_id', 'owner_id', 'userid', 'user_id');
      const plate = pickCol('plate_number', 'plateNumber', 'plate', 'plate_no', 'plateNo');
      const type = pickCol('type', 'vehicle_type', 'vehicleType');
      if (!owner_id) return null;

      return { schema, qCol, cols: { owner_id, plate, type } };
    } catch (_) {
      return null;
    }
  };

  const resolveShipmentsTable = async () => {
    const tRes = await pool.query(
      `SELECT table_schema
       FROM information_schema.tables
       WHERE table_name = 'shipments'
       ORDER BY (table_schema = 'public') DESC, table_schema ASC
       LIMIT 1`
    );
    const schema = tRes.rows && tRes.rows[0]?.table_schema ? tRes.rows[0].table_schema : 'public';
    const colsRes = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'shipments' AND table_schema = $1`,
      [schema]
    );
    const cols = new Set((colsRes.rows || []).map(r => r.column_name));
    const pickCol = (...names) => names.find(n => cols.has(n)) || null;
    const qCol = (col) => (col && /[A-Z]/.test(col) ? `"${col}"` : col);
    return {
      schema,
      qCol,
      cols: {
        driver: pickCol('driver_id', 'driverId', 'driverID', 'driverid'),
        carrier: pickCol('nakliyeci_id', 'carrier_id', 'carrierId', 'carrierid', 'nakliyeciId', 'nakliyeciid'),
        status: pickCol('status'),
      },
    };
  };

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
      const u = await resolveUsersTable();
      const emailCol = u.qCol(u.cols.email);
      const fullNameExpr = u.cols.fullName ? u.qCol(u.cols.fullName) : null;
      const phoneExpr = u.cols.phone ? u.qCol(u.cols.phone) : null;
      const roleCol = u.qCol(u.cols.role);
      const driverCodeExpr = u.cols.driverCode ? u.qCol(u.cols.driverCode) : null;

      const selectParts = [
        'id',
        `${emailCol} as email`,
        fullNameExpr ? `${fullNameExpr} as "fullName"` : 'NULL as "fullName"',
        phoneExpr ? `${phoneExpr} as phone` : 'NULL as phone',
        `${roleCol} as role`,
        driverCodeExpr ? `${driverCodeExpr} as "driverCode"` : 'NULL as "driverCode"',
      ];
      if (identifier.includes('@')) {
        result = await pool.query(
          `SELECT ${selectParts.join(', ')}
           FROM "${u.schema}".users
           WHERE LOWER(${emailCol}) = $1 AND ${roleCol} = 'tasiyici'`,
          [identifier]
        );
      } else {
        result = await pool.query(
          `SELECT ${selectParts.join(', ')}
           FROM "${u.schema}".users
           WHERE ${driverCodeExpr ? driverCodeExpr : '"driverCode"'} = $1 AND ${roleCol} = 'tasiyici'`,
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
      const identifier = sanitizeIdentifier(
        req.body?.code ||
          req.body?.driverCode ||
          req.body?.driver_code ||
          req.body?.email ||
          req.body?.identifier
      );

      if (!carrierId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }
      if (!identifier) {
        return res.status(400).json({ success: false, message: 'Kod veya e-posta gerekli' });
      }

      const u = await resolveUsersTable();
      const roleCol = u.qCol(u.cols.role);
      const roleResult = await pool.query(`SELECT ${roleCol} as role FROM "${u.schema}".users WHERE id = $1`, [carrierId]);
      if (roleResult.rows.length === 0 || String(roleResult.rows[0].role) !== 'nakliyeci') {
        return res.status(403).json({ success: false, message: 'Sadece nakliyeci taşıyıcı ekleyebilir' });
      }

      const emailCol = u.qCol(u.cols.email);
      const driverRoleCol = u.qCol(u.cols.role);
      const fullNameExpr = u.cols.fullName ? u.qCol(u.cols.fullName) : null;
      const phoneExpr = u.cols.phone ? u.qCol(u.cols.phone) : null;
      const driverCodeExpr = u.cols.driverCode ? u.qCol(u.cols.driverCode) : null;
      const selectParts = [
        'id',
        `${emailCol} as email`,
        fullNameExpr ? `${fullNameExpr} as "fullName"` : 'NULL as "fullName"',
        phoneExpr ? `${phoneExpr} as phone` : 'NULL as phone',
        driverCodeExpr ? `${driverCodeExpr} as "driverCode"` : 'NULL as "driverCode"',
      ];

      let driverResult;
      if (identifier.includes('@')) {
        driverResult = await pool.query(
          `SELECT ${selectParts.join(', ')} FROM "${u.schema}".users
           WHERE LOWER(${emailCol}) = $1 AND ${driverRoleCol} = 'tasiyici'`,
          [identifier]
        );
      } else {
        // Always use the driverCode column if it exists, otherwise fallback to driverCode
        const codeColumn = driverCodeExpr || '"driverCode"';
        driverResult = await pool.query(
          `SELECT ${selectParts.join(', ')} FROM "${u.schema}".users
           WHERE ${codeColumn} = $1 AND ${driverRoleCol} = 'tasiyici'`,
          [identifier]
        );
      }

      if (driverResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Taşıyıcı bulunamadı' });
      }

      const driver = driverResult.rows[0];

      const cdMeta = await resolveCarrierDriversTable();
      if (!cdMeta.cols.carrierId || !cdMeta.cols.driverId) {
        return res.status(500).json({ success: false, message: 'carrier_drivers şeması uyumsuz' });
      }
      const cdTable = `"${cdMeta.schema}".carrier_drivers`;
      const carrierCol = cdMeta.qCol(cdMeta.cols.carrierId);
      const driverCol = cdMeta.qCol(cdMeta.cols.driverId);

      const existing = await pool.query(
        `SELECT id FROM ${cdTable} WHERE ${carrierCol} = $1 AND ${driverCol} = $2`,
        [carrierId, driver.id]
      );
      if (existing.rows.length > 0) {
        return res.json({ success: true, message: 'Zaten eklenmiş' });
      }

      const insertCols = [carrierCol, driverCol];
      const insertVals = ['$1', '$2'];
      if (cdMeta.cols.createdAt) {
        insertCols.push(cdMeta.qCol(cdMeta.cols.createdAt));
        insertVals.push('CURRENT_TIMESTAMP');
      }
      // updatedAt is optional and not always present
      const cdUpdatedAt = cdMeta.qCol(cdMeta.cols.updatedAt || '');
      if (cdMeta.cols.updatedAt) {
        insertCols.push(cdUpdatedAt);
        insertVals.push('CURRENT_TIMESTAMP');
      }
      await pool.query(
        `INSERT INTO ${cdTable} (${insertCols.join(', ')})
         VALUES (${insertVals.join(', ')})`,
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

      const carrierIdText = String(carrierId);

      // Debug logging
      console.log('[DEBUG] /api/drivers/nakliyeci - req.user:', JSON.stringify(req.user), 'carrierId:', carrierIdText);

      // Resolve carrier_drivers table/schema (do NOT assume public)
      const cdMeta = await resolveCarrierDriversTable();
      if (!cdMeta.cols.carrierId || !cdMeta.cols.driverId) {
        return res.json({ success: true, drivers: [] });
      }
      const carrierCol = cdMeta.qCol(cdMeta.cols.carrierId);
      const driverCol = cdMeta.qCol(cdMeta.cols.driverId);
      const cdTable = `"${cdMeta.schema}".carrier_drivers`;
      const cdCreatedAtCol = cdMeta.cols.createdAt ? cdMeta.qCol(cdMeta.cols.createdAt) : null;

      // First, check if there are any linked drivers
      const linkCheck = await pool.query(
        `SELECT COUNT(*) as count FROM ${cdTable} WHERE ${carrierCol}::text = $1::text`,
        [carrierIdText]
      );
      
      console.log('[DEBUG] /api/drivers/nakliyeci - Linked drivers count:', linkCheck.rows[0]?.count);

      // Get drivers with performance metrics and vehicle info
      const u = await resolveUsersTable();
      const fullNameExpr = u.cols.fullName ? `u.${u.qCol(u.cols.fullName)}` : 'NULL';
      const emailExpr = u.cols.email ? `u.${u.qCol(u.cols.email)}` : 'NULL';
      const phoneExpr = u.cols.phone ? `u.${u.qCol(u.cols.phone)}` : 'NULL';
      const codeExpr = u.cols.driverCode ? `u.${u.qCol(u.cols.driverCode)}` : 'NULL';
      const cityExpr = u.cols.city ? `u.${u.qCol(u.cols.city)}` : 'NULL';
      const districtExpr = u.cols.district ? `u.${u.qCol(u.cols.district)}` : 'NULL';
      const joinDateExpr = u.cols.createdAt ? `u.${u.qCol(u.cols.createdAt)}` : 'CURRENT_TIMESTAMP';

      const s = await resolveShipmentsTable();
      const shipmentsTable = `"${s.schema}".shipments`;
      const shipDriverExpr = s.cols.driver ? `s.${s.qCol(s.cols.driver)}` : 'NULL';
      const shipCarrierExpr = s.cols.carrier ? `s.${s.qCol(s.cols.carrier)}` : 'NULL';
      const shipStatusExpr = s.cols.status ? `s.${s.qCol(s.cols.status)}` : 'NULL';

      const rMeta = await resolveRatingsTable();
      const ratingExpr = rMeta
        ? `COALESCE((SELECT AVG(r.${rMeta.qCol(rMeta.rating)})::NUMERIC(3,1) FROM "${rMeta.schema}".ratings r WHERE r.${rMeta.qCol(rMeta.ratedId)} = u.id), 0)`
        : '0';

      const vMeta = await resolveVehiclesTable();
      const vehiclePlateExpr = vMeta && vMeta.cols.plate ? `v.${vMeta.qCol(vMeta.cols.plate)}` : 'NULL';
      const vehicleTypeExpr = vMeta && vMeta.cols.type ? `v.${vMeta.qCol(vMeta.cols.type)}` : 'NULL';
      const vehicleJoin = vMeta
        ? `LEFT JOIN "${vMeta.schema}".vehicles v ON v.${vMeta.qCol(vMeta.cols.owner_id)}::text = u.id::text`
        : '';

      const result = await pool.query(
        `SELECT
           u.id,
           ${fullNameExpr} as name,
           ${emailExpr} as email,
           ${phoneExpr} as phone,
           ${codeExpr} as code,
           ${cityExpr} as city,
           ${districtExpr} as district,
           ${joinDateExpr} as "joinDate",
           ${vehiclePlateExpr} as "vehiclePlate",
           ${vehicleTypeExpr} as "vehicleType",
           COALESCE((
             SELECT COUNT(*)::INTEGER
             FROM ${shipmentsTable} s
             WHERE ${shipDriverExpr} = u.id AND ${shipCarrierExpr}::text = $1::text
           ), 0) as "totalJobs",
           COALESCE((
             SELECT COUNT(*)::INTEGER
             FROM ${shipmentsTable} s
             WHERE ${shipDriverExpr} = u.id 
              AND ${shipCarrierExpr}::text = $1::text
              AND ${shipStatusExpr} = 'delivered'
           ), 0) as "completedJobs",
           COALESCE((
             CASE 
               WHEN (
                 SELECT COUNT(*)::INTEGER
                 FROM ${shipmentsTable} s
                 WHERE ${shipDriverExpr} = u.id AND ${shipCarrierExpr}::text = $1::text
               ) > 0 THEN
                 ROUND((
                   SELECT COUNT(*)::INTEGER
                   FROM ${shipmentsTable} s
                   WHERE ${shipDriverExpr} = u.id 
                    AND ${shipCarrierExpr}::text = $1::text
                     AND ${shipStatusExpr} = 'delivered'
                 )::NUMERIC / 
                 NULLIF((
                   SELECT COUNT(*)::INTEGER
                   FROM ${shipmentsTable} s
                   WHERE ${shipDriverExpr} = u.id AND ${shipCarrierExpr}::text = $1::text
                 ), 0) * 100, 1)
               ELSE 0
             END
           ), 0) as "successRate",
           ${ratingExpr} as rating,
           COALESCE((
             SELECT COUNT(*)::INTEGER
             FROM ${shipmentsTable} s
             WHERE ${shipDriverExpr} = u.id 
              AND ${shipCarrierExpr}::text = $1::text
              AND ${shipStatusExpr} IN ('accepted', 'in_transit', 'picked_up', 'offer_accepted', 'preparing')
           ), 0) as "activeJobs",
           CASE 
             WHEN (
               SELECT COUNT(*)::INTEGER
               FROM ${shipmentsTable} s
               WHERE ${shipDriverExpr} = u.id 
                AND ${shipCarrierExpr}::text = $1::text
                AND ${shipStatusExpr} IN ('accepted', 'in_transit', 'picked_up', 'offer_accepted', 'preparing')
             ) > 0 THEN 'busy'
             ELSE 'available'
           END as status
        FROM ${cdTable} cd
        INNER JOIN "${u.schema}".users u ON u.id::text = cd.${driverCol}::text
        ${vehicleJoin}
        WHERE cd.${carrierCol}::text = $1::text
        ORDER BY ${cdCreatedAtCol ? `cd.${cdCreatedAtCol}` : `cd.${driverCol}`} DESC`,
        [carrierIdText]
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
      const u = await resolveUsersTable();
      const roleCol = u.qCol(u.cols.role);
      const roleResult = await pool.query(`SELECT ${roleCol} as role FROM "${u.schema}".users WHERE id = $1`, [carrierId]);
      if (roleResult.rows.length === 0 || String(roleResult.rows[0].role) !== 'nakliyeci') {
        return res.status(403).json({ success: false, message: 'Sadece nakliyeci taşıyıcı kaldırabilir' });
      }

      // Check if relationship exists
      const cdMeta = await resolveCarrierDriversTable();
      if (!cdMeta.cols.carrierId || !cdMeta.cols.driverId) {
        return res.status(404).json({ success: false, message: 'Taşıyıcı bulunamadı' });
      }
      const cdTable = `"${cdMeta.schema}".carrier_drivers`;
      const carrierCol = cdMeta.qCol(cdMeta.cols.carrierId);
      const driverCol = cdMeta.qCol(cdMeta.cols.driverId);
      const existing = await pool.query(
        `SELECT id FROM ${cdTable} WHERE ${carrierCol} = $1 AND ${driverCol} = $2`,
        [carrierId, driverId]
      );

      if (existing.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Taşıyıcı bulunamadı' });
      }

      // Delete relationship
      await pool.query(
        `DELETE FROM ${cdTable} WHERE ${carrierCol} = $1 AND ${driverCol} = $2`,
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
