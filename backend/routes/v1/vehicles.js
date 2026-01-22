const express = require('express');

function createVehiclesRoutes(pool, authenticateToken) {
  const router = express.Router();

  const pickCol = (cols, ...names) => names.find(n => cols.has(n)) || null;
  const qIdent = (c) => (c && /[A-Z]/.test(c) ? `"${c}"` : c);

  // GET /api/vehicles/nakliyeci
  // Frontend expects: { success: true, vehicles: Vehicle[] }
  router.get('/nakliyeci', authenticateToken, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      // If DB not available, return a sensible demo vehicle so RoutePlanner isn't dead.
      if (!pool) {
        return res.json({
          success: true,
          vehicles: [
            {
              id: 1,
              name: 'Demo Araç',
              type: 'kamyon',
              maxWeight: 10000,
              maxVolume: 50,
              currentWeight: 0,
              currentVolume: 0,
            },
          ],
        });
      }

      const defaultVehicles = [
        {
          id: 1,
          name: 'Standart Araç',
          type: 'kamyonet',
          maxWeight: 3500,
          maxVolume: 18,
          currentWeight: 0,
          currentVolume: 0,
        },
        {
          id: 2,
          name: 'Büyük Araç',
          type: 'kamyon',
          maxWeight: 10000,
          maxVolume: 50,
          currentWeight: 0,
          currentVolume: 0,
        },
      ];

      // Check if vehicles table exists
      const tableCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'vehicles'
        ) as exists
      `);

      if (!tableCheck.rows?.[0]?.exists) {
        return res.json({ success: true, vehicles: defaultVehicles });
      }

      const colsRes = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'vehicles' AND table_schema = 'public'`);
      const cols = new Set((colsRes.rows || []).map(r => r.column_name));

      const ownerCol = pickCol(cols, 'owner_id', 'ownerId', 'user_id', 'userId');
      const idCol = pickCol(cols, 'id');
      const nameCol = pickCol(cols, 'name', 'vehicle_name', 'vehicleName', 'title');
      const typeCol = pickCol(cols, 'type', 'vehicle_type', 'vehicleType');
      const maxWeightCol = pickCol(cols, 'max_weight', 'maxWeight', 'capacity_weight', 'capacityWeight', 'weight_capacity');
      const maxVolumeCol = pickCol(cols, 'max_volume', 'maxVolume', 'capacity_volume', 'capacityVolume', 'volume_capacity');
      const currentWeightCol = pickCol(cols, 'current_weight', 'currentWeight');
      const currentVolumeCol = pickCol(cols, 'current_volume', 'currentVolume');
      const createdAtCol = pickCol(cols, 'createdAt', 'created_at');

      if (!ownerCol) {
        return res.json({ success: true, vehicles: [] });
      }

      const selectParts = [];
      selectParts.push(`${qIdent(idCol || 'id')} as id`);
      selectParts.push(`${qIdent(nameCol || 'id')} as name`);
      selectParts.push(`${qIdent(typeCol || 'type')} as type`);
      selectParts.push(`${qIdent(maxWeightCol || 'max_weight')} as "maxWeight"`);
      selectParts.push(`${qIdent(maxVolumeCol || 'max_volume')} as "maxVolume"`);
      selectParts.push(`${qIdent(currentWeightCol || maxWeightCol || '0')} as "currentWeight"`);
      selectParts.push(`${qIdent(currentVolumeCol || maxVolumeCol || '0')} as "currentVolume"`);

      const orderExpr = createdAtCol ? qIdent(createdAtCol) : qIdent(idCol || 'id');

      const q = `SELECT ${selectParts.join(', ')} FROM vehicles WHERE ${qIdent(ownerCol)} = $1 ORDER BY ${orderExpr} DESC`;
      const r = await pool.query(q, [userId]);

      const vehicles = (r.rows || []).map(v => ({
        id: Number(v.id),
        name: v.name != null ? String(v.name) : `Araç #${v.id}`,
        type: v.type != null ? String(v.type) : 'vehicle',
        maxWeight: Number(v.maxWeight || 0),
        maxVolume: Number(v.maxVolume || 0),
        currentWeight: Number(v.currentWeight || 0),
        currentVolume: Number(v.currentVolume || 0),
      }));

      return res.json({ success: true, vehicles: vehicles.length ? vehicles : defaultVehicles });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to load vehicles', details: error.message });
    }
  });

  return router;
}

module.exports = createVehiclesRoutes;
