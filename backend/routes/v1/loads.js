const express = require('express');

function createLoadsRoutes(pool, authenticateToken) {
  const router = express.Router();

  // GET /api/loads/available
  // Frontend expects: { success: true, data: AvailableLoad[] }
  // We derive these from open shipments when possible.
  router.get('/available', authenticateToken, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const scope = typeof req.query?.scope === 'string' ? req.query.scope.trim() : '';

      if (!pool) {
        return res.json({ success: true, data: [] });
      }

      // Use shipments table as source of available loads.
      // First find which schema has the shipments table
      const schemaRes = await pool.query(`
        SELECT table_schema FROM information_schema.tables 
        WHERE table_name = 'shipments' 
        ORDER BY (table_schema = 'public') DESC, table_schema ASC 
        LIMIT 1
      `);
      const shipSchema = schemaRes.rows?.[0]?.table_schema || 'public';
      
      const colsRes = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'shipments' AND table_schema = $1`, [shipSchema]);
      const cols = new Set((colsRes.rows || []).map(r => r.column_name));
      const pickCol = (...names) => names.find(n => cols.has(n)) || null;
      const qIdent = (c) => (c && /[A-Z]/.test(c) ? `"${c}"` : c);

      const idCol = pickCol('id', 'shipment_id', 'shipmentId') || 'id';
      const titleCol = pickCol('title', 'name');
      const pickupAddrCol = pickCol('pickupAddress', 'pickup_address', 'from_address', 'fromAddress', 'pickup_address_text');
      const deliveryAddrCol = pickCol('deliveryAddress', 'delivery_address', 'to_address', 'toAddress', 'delivery_address_text');
      const pickupCityCol = pickCol('pickupCity', 'pickup_city', 'pickupcity', 'from_city', 'fromCity');
      const deliveryCityCol = pickCol('deliveryCity', 'delivery_city', 'deliverycity', 'to_city', 'toCity');
      const weightCol = pickCol('weight');
      const volumeCol = pickCol('volume');
      const priceCol = pickCol('price', 'agreed_price', 'agreedPrice');
      const deadlineCol = pickCol('deadline', 'deliveryDate', 'delivery_date', 'pickup_date', 'pickupDate');
      const statusCol = pickCol('status');
      const carrierCol = pickCol('nakliyeci_id', 'carrier_id');
      const ownerCol = pickCol('ownerId', 'user_id', 'userId');
      const driverCol = pickCol('driver_id', 'driverId', 'driverID', 'driverid');

      const idExpr = `s.${qIdent(idCol)}`;
      const titleExpr = titleCol ? `s.${qIdent(titleCol)}` : 'NULL';
      // Prefer city over address for display, fallback to address if city not available
      const pickupExpr = pickupCityCol ? `s.${qIdent(pickupCityCol)}` : (pickupAddrCol ? `s.${qIdent(pickupAddrCol)}` : 'NULL');
      const deliveryExpr = deliveryCityCol ? `s.${qIdent(deliveryCityCol)}` : (deliveryAddrCol ? `s.${qIdent(deliveryAddrCol)}` : 'NULL');
      const weightExpr = weightCol ? `COALESCE(s.${qIdent(weightCol)}, 0)` : '0';
      const volumeExpr = volumeCol ? `COALESCE(s.${qIdent(volumeCol)}, 0)` : '0';
      const priceExpr = priceCol ? `COALESCE(s.${qIdent(priceCol)}, 0)` : '0';
      const deadlineExpr = deadlineCol ? `s.${qIdent(deadlineCol)}` : 'NULL';

      const ownerExpr = ownerCol ? `s.${qIdent(ownerCol)}` : 'NULL';

      // Resolve driver assignment (shipments driver column + fallback assignment table)
      let assignmentJoin = '';
      let driverIdExpr = driverCol ? `s.${qIdent(driverCol)}` : 'NULL';
      try {
        const assignmentSchemaRes = await pool.query(`
          SELECT table_schema FROM information_schema.tables
          WHERE table_name = 'shipment_driver_assignments'
          ORDER BY (table_schema = 'public') DESC, table_schema ASC
          LIMIT 1
        `);
        const assignSchema = assignmentSchemaRes.rows?.[0]?.table_schema || null;
        if (assignSchema) {
          assignmentJoin = `LEFT JOIN "${assignSchema}".shipment_driver_assignments a ON a.shipment_id::text = ${idExpr}::text`;
          driverIdExpr = driverCol ? `COALESCE(${driverIdExpr}, a.driver_id)` : 'a.driver_id';
        }
      } catch (_) {
        assignmentJoin = '';
      }
      
      // Find users table schema and columns
      let ownerJoin = '';
      let driverJoin = '';
      let ownerNameExpr = 'NULL';
      let ownerPhoneExpr = 'NULL';
      let ownerEmailExpr = 'NULL';
      let driverNameExpr = 'NULL';
      let driverPhoneExpr = 'NULL';
      let driverEmailExpr = 'NULL';
      
      if (ownerCol) {
        try {
          const usersSchemaRes = await pool.query(`
            SELECT table_schema FROM information_schema.tables 
            WHERE table_name = 'users' 
            ORDER BY (table_schema = 'public') DESC, table_schema ASC 
            LIMIT 1
          `);
          const usersSchema = usersSchemaRes.rows?.[0]?.table_schema || 'public';
          
          // Get users table columns
          const userColsRes = await pool.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'users' AND table_schema = $1
          `, [usersSchema]);
          const userCols = new Set((userColsRes.rows || []).map(r => r.column_name));
          
          // Build safe column expressions
          const nameCol = userCols.has('fullName') ? '"fullName"' 
            : userCols.has('full_name') ? 'full_name' 
            : userCols.has('name') ? 'name' 
            : null;
          
          ownerJoin = `LEFT JOIN "${usersSchema}".users u ON ${ownerExpr}::text = u.id::text`;
          ownerNameExpr = nameCol ? `COALESCE(u.${nameCol}, u.email)` : 'u.email';
          ownerPhoneExpr = userCols.has('phone') ? 'u.phone' : 'NULL';
          ownerEmailExpr = userCols.has('email') ? 'u.email' : 'NULL';

          driverJoin = `LEFT JOIN "${usersSchema}".users d ON ${driverIdExpr}::text = d.id::text`;
          driverNameExpr = nameCol ? `COALESCE(d.${nameCol}, d.email)` : 'd.email';
          driverPhoneExpr = userCols.has('phone') ? 'd.phone' : 'NULL';
          driverEmailExpr = userCols.has('email') ? 'd.email' : 'NULL';
        } catch (e) {
          console.error('[LOADS] Error resolving users schema:', e.message);
          ownerJoin = '';
          driverJoin = '';
          ownerNameExpr = 'NULL';
          ownerPhoneExpr = 'NULL';
          ownerEmailExpr = 'NULL';
          driverNameExpr = 'NULL';
          driverPhoneExpr = 'NULL';
          driverEmailExpr = 'NULL';
        }
      }

      // Define availability filter
      // scope=mine:
      //   - shipments assigned to this nakliyeci
      //   - status is active-ish
      // default:
      //   - open-ish statuses
      //   - carrier not assigned
      const openStatuses = ['pending', 'waiting_for_offers', 'open'];
      const activeStatuses = ['offer_accepted', 'accepted', 'assigned', 'in_progress', 'picked_up', 'in_transit', 'delivered', 'completed'];

      let whereParts = [];
      const params = [];

      if (statusCol) {
        if (scope === 'mine') {
          params.push(activeStatuses);
          whereParts.push(`s.${qIdent(statusCol)} = ANY($${params.length})`);
        } else {
          params.push(openStatuses);
          whereParts.push(`s.${qIdent(statusCol)} = ANY($${params.length})`);
        }
      }

      if (carrierCol) {
        if (scope === 'mine') {
          params.push(userId);
          whereParts.push(`s.${qIdent(carrierCol)} = $${params.length}`);
        } else {
          whereParts.push(`s.${qIdent(carrierCol)} IS NULL`);
        }
      }

      const whereSql = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

      const q = `
        SELECT
          ${idExpr} as id,
          ${titleExpr} as title,
          ${pickupExpr} as "pickupAddress",
          ${deliveryExpr} as "deliveryAddress",
          ${weightExpr} as weight,
          ${volumeExpr} as volume,
          ${priceExpr} as price,
          ${deadlineExpr} as deadline,
          ${driverIdExpr} as "driverId",
          ${driverNameExpr} as "driverName",
          ${driverPhoneExpr} as "driverPhone",
          ${driverEmailExpr} as "driverEmail",
          ${ownerNameExpr} as "shipperName",
          ${ownerPhoneExpr} as "shipperPhone",
          ${ownerEmailExpr} as "shipperEmail"
        FROM "${shipSchema}".shipments s
        ${assignmentJoin}
        ${ownerJoin}
        ${driverJoin}
        ${whereSql}
        ORDER BY ${idExpr} DESC
        LIMIT 200
      `;

      const r = await pool.query(q, params);

      const data = (r.rows || []).map(row => ({
        id: row.id,
        title: row.title || `Yük #${row.id}`,
        pickupAddress: row.pickupAddress || '',
        deliveryAddress: row.deliveryAddress || '',
        weight: Number(row.weight || 0),
        volume: Number(row.volume || 0),
        price: Number(row.price || 0),
        deadline: row.deadline ? String(row.deadline) : '',
        distance: 0,
        driver: row.driverId
          ? {
              id: String(row.driverId),
              name: row.driverName || '',
              phone: row.driverPhone || '',
              email: row.driverEmail || '',
            }
          : null,
        shipper: {
          name: row.shipperName || 'Gönderici',
          phone: row.shipperPhone || '',
          email: row.shipperEmail || '',
        },
      }));

      return res.json({ success: true, data });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to load available loads', details: error.message });
    }
  });

  return router;
}

module.exports = createLoadsRoutes;
