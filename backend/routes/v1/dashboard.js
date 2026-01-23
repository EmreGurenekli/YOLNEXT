// Dashboard routes - Modular version
const express = require('express');

function createDashboardRoutes(pool, authenticateToken) {
  const router = express.Router();

  async function queryWithFallback(primaryQuery, fallbackQuery, params) {
    try {
      return await pool.query(primaryQuery, params);
    } catch (error) {
      if (error && error.code === '42703' && fallbackQuery) {
        return await pool.query(fallbackQuery, params);
      }
      throw error;
    }
  }

  const resolveTable = async (tableName) => {
    const tRes = await pool.query(
      `SELECT table_schema
       FROM information_schema.tables
       WHERE table_name = $1
       ORDER BY (table_schema = 'public') DESC, table_schema ASC
       LIMIT 1`,
      [tableName]
    );
    const schema = tRes.rows && tRes.rows[0]?.table_schema ? tRes.rows[0].table_schema : 'public';

    const colsRes = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND table_schema = $2`,
      [tableName, schema]
    );
    const cols = new Set((colsRes.rows || []).map(r => r.column_name));
    const pickCol = (...names) => names.find(n => cols.has(n)) || null;
    const qCol = (col) => (col && /[A-Z]/.test(col) ? `"${col}"` : col);
    return { schema, cols, pickCol, qCol };
  };

  const resolveUserIdForRequest = async (user) => {
    const candidates = [user?.id, user?.userId, user?.user_id, user?.userid].filter(v => v != null);
    for (const c of candidates) {
      const n = typeof c === 'number' ? c : parseInt(String(c), 10);
      if (Number.isFinite(n)) {
        try {
          const exists = await pool.query('SELECT id FROM users WHERE id = $1 LIMIT 1', [n]);
          if (exists.rows && exists.rows[0]?.id) return exists.rows[0].id;
        } catch (_) {
          // ignore
        }
      }
    }
    return null;
  };

  const resolveShipmentsOwnerExpr = async () => {
    const shipmentsMeta = await resolveTable('shipments');
    const ownerCol = shipmentsMeta.pickCol('ownerId', 'owner_id', 'ownerid', 'user_id', 'userId', 'userid');
    const userIdCol = shipmentsMeta.pickCol('userId');
    const useridCol = shipmentsMeta.pickCol('userid');
    if (userIdCol && useridCol && userIdCol !== useridCol) {
      return { shipmentsMeta, ownerExpr: `COALESCE(s.${shipmentsMeta.qCol(userIdCol)}, s.${shipmentsMeta.qCol(useridCol)})` };
    }
    return { shipmentsMeta, ownerExpr: ownerCol ? `s.${shipmentsMeta.qCol(ownerCol)}` : null };
  };

  const handleStatsByUserType = async (req, res, userType) => {
    console.log('📊 Dashboard stats route called:', userType, 'User:', req.user?.id);
    try {
      if (!pool) {
        return res.status(500).json({
          success: false,
          error: 'Database not available',
        });
      }

      const userId = await resolveUserIdForRequest(req.user);
      if (!userId) {
        return res.status(401).json({ success: false, error: 'User not authenticated' });
      }
      let stats = {};

      if (userType === 'individual') {
        const { shipmentsMeta, ownerExpr } = await resolveShipmentsOwnerExpr();
        if (!ownerExpr) {
          return res.json({ success: true, data: { stats: { totalShipments: 0, completedShipments: 0, cancelledShipments: 0, pendingShipments: 0, activeShipments: 0, successRate: 0, totalSpent: 0 } } });
        }

        const shipStatusExpr = shipmentsMeta.pickCol('status') ? `s.${shipmentsMeta.qCol(shipmentsMeta.pickCol('status'))}` : 's.status';
        const shipPriceCol = shipmentsMeta.pickCol('price', 'offerPrice', 'offer_price', 'offerprice');
        const shipPriceExpr = shipPriceCol ? `s.${shipmentsMeta.qCol(shipPriceCol)}` : 's.price';

        const [totalShipments, completedShipments, cancelledShipments, pendingShipments, activeShipments, totalSpent] = await Promise.all([
          pool.query(`SELECT COUNT(*) as total FROM "${shipmentsMeta.schema}".shipments s WHERE ${ownerExpr} = $1`, [userId]),
          pool.query(
            `SELECT COUNT(*) as total FROM "${shipmentsMeta.schema}".shipments s WHERE ${ownerExpr} = $1 AND ${shipStatusExpr} IN ('delivered', 'completed')`,
            [userId]
          ),
          pool.query(
            `SELECT COUNT(*) as total FROM "${shipmentsMeta.schema}".shipments s WHERE ${ownerExpr} = $1 AND ${shipStatusExpr} IN ('cancelled', 'canceled')`,
            [userId]
          ),
          pool.query(
            `SELECT COUNT(*) as total FROM "${shipmentsMeta.schema}".shipments s WHERE ${ownerExpr} = $1 AND ${shipStatusExpr} IN ('pending', 'waiting_for_offers', 'open')`,
            [userId]
          ),
          pool.query(
            `SELECT COUNT(*) as total FROM "${shipmentsMeta.schema}".shipments s WHERE ${ownerExpr} = $1 AND ${shipStatusExpr} IN ('preparing', 'offer_accepted', 'accepted', 'in_progress', 'assigned', 'picked_up', 'in_transit')`,
            [userId]
          ),
          pool.query(
            `SELECT COALESCE(SUM(${shipPriceExpr}), 0) as total FROM "${shipmentsMeta.schema}".shipments s WHERE ${ownerExpr} = $1 AND ${shipStatusExpr} IN ('delivered', 'completed')`,
            [userId]
          ),
        ]);

        const completed = parseInt(completedShipments.rows[0].total);
        const cancelled = parseInt(cancelledShipments.rows[0].total);
        const total = parseInt(totalShipments.rows[0].total);
        const successRate = total > 0
          ? Number(((completed / total) * 100).toFixed(1))
          : 0;

        stats = {
          totalShipments: parseInt(totalShipments.rows[0].total),
          completedShipments: completed,
          cancelledShipments: cancelled,
          pendingShipments: parseInt(pendingShipments.rows[0].total),
          activeShipments: parseInt(activeShipments.rows[0].total),
          successRate,
          totalSpent: parseFloat(totalSpent.rows[0].total),
        };
      } else if (userType === 'corporate') {
        const { shipmentsMeta, ownerExpr } = await resolveShipmentsOwnerExpr();
        if (!ownerExpr) {
          return res.json({ success: true, data: { stats: { totalShipments: 0, completedShipments: 0, cancelledShipments: 0, pendingShipments: 0, activeShipments: 0, successRate: 0, totalSpent: 0 } } });
        }

        const shipStatusExpr = shipmentsMeta.pickCol('status') ? `s.${shipmentsMeta.qCol(shipmentsMeta.pickCol('status'))}` : 's.status';
        const shipPriceCol = shipmentsMeta.pickCol('price', 'offerPrice', 'offer_price', 'offerprice');
        const shipPriceExpr = shipPriceCol ? `s.${shipmentsMeta.qCol(shipPriceCol)}` : 's.price';

        const [totalShipments, completedShipments, cancelledShipments, pendingShipments, activeShipments, totalSpent] = await Promise.all([
          pool.query(`SELECT COUNT(*) as total FROM "${shipmentsMeta.schema}".shipments s WHERE ${ownerExpr} = $1`, [userId]),
          pool.query(
            `SELECT COUNT(*) as total FROM "${shipmentsMeta.schema}".shipments s WHERE ${ownerExpr} = $1 AND ${shipStatusExpr} IN ('delivered', 'completed')`,
            [userId]
          ),
          pool.query(
            `SELECT COUNT(*) as total FROM "${shipmentsMeta.schema}".shipments s WHERE ${ownerExpr} = $1 AND ${shipStatusExpr} IN ('cancelled', 'canceled')`,
            [userId]
          ),
          pool.query(
            `SELECT COUNT(*) as total FROM "${shipmentsMeta.schema}".shipments s WHERE ${ownerExpr} = $1 AND ${shipStatusExpr} IN ('pending', 'waiting_for_offers', 'open')`,
            [userId]
          ),
          pool.query(
            `SELECT COUNT(*) as total FROM "${shipmentsMeta.schema}".shipments s WHERE ${ownerExpr} = $1 AND ${shipStatusExpr} IN ('preparing', 'offer_accepted', 'accepted', 'in_progress', 'assigned', 'picked_up', 'in_transit')`,
            [userId]
          ),
          pool.query(
            `SELECT COALESCE(SUM(${shipPriceExpr}), 0) as total FROM "${shipmentsMeta.schema}".shipments s WHERE ${ownerExpr} = $1 AND ${shipStatusExpr} IN ('delivered', 'completed')`,
            [userId]
          ),
        ]);

        const completed = parseInt(completedShipments.rows[0].total);
        const cancelled = parseInt(cancelledShipments.rows[0].total);
        const total = parseInt(totalShipments.rows[0].total);
        const successRate = total > 0
          ? Number(((completed / total) * 100).toFixed(1))
          : 0;

        stats = {
          totalShipments: parseInt(totalShipments.rows[0].total),
          completedShipments: completed,
          cancelledShipments: cancelled,
          pendingShipments: parseInt(pendingShipments.rows[0].total),
          activeShipments: parseInt(activeShipments.rows[0].total),
          successRate,
          totalSpent: parseFloat(totalSpent.rows[0].total),
        };
      } else if (userType === 'nakliyeci') {
        const [offersMeta, shipmentsMeta, listingsMeta] = await Promise.all([
          resolveTable('offers'),
          resolveTable('shipments'),
          resolveTable('carrier_market_listings'),
        ]);

        const offerCarrierCol = offersMeta.pickCol(
          'nakliyeci_id',
          'nakliyeciId',
          'nakliyeciid',
          'carrier_id',
          'carrierId',
          'carrierid'
        );
        const offerStatusCol = offersMeta.pickCol('status');
        const offerCarrierExpr = offerCarrierCol ? `o.${offersMeta.qCol(offerCarrierCol)}` : null;
        const offerStatusExpr = offerStatusCol ? `o.${offersMeta.qCol(offerStatusCol)}` : 'o.status';

        const shipCarrierCol = shipmentsMeta.pickCol(
          'nakliyeci_id',
          'nakliyeciId',
          'nakliyeciid',
          'carrier_id',
          'carrierId',
          'carrierid'
        );
        const shipStatusCol = shipmentsMeta.pickCol('status');
        const shipPriceCol = shipmentsMeta.pickCol('price', 'offerPrice', 'offer_price', 'offerprice');
        const shipCarrierExpr = shipCarrierCol ? `s.${shipmentsMeta.qCol(shipCarrierCol)}` : null;
        const shipStatusExpr = shipStatusCol ? `s.${shipmentsMeta.qCol(shipStatusCol)}` : 's.status';
        const shipPriceExpr = shipPriceCol ? `s.${shipmentsMeta.qCol(shipPriceCol)}` : null;

        const listingCarrierCol = listingsMeta.pickCol(
          'nakliyeci_id',
          'nakliyeciId',
          'nakliyeciid',
          'createdByCarrierId',
          'created_by_carrier_id',
          'carrier_id',
          'carrierId',
          'carrierid'
        );
        const listingStatusCol = listingsMeta.pickCol('status');
        const listingCarrierExpr = listingCarrierCol
          ? `l.${listingsMeta.qCol(listingCarrierCol)}`
          : null;
        const listingStatusExpr = listingStatusCol ? `l.${listingsMeta.qCol(listingStatusCol)}` : null;

        const emptyCount = { rows: [{ total: '0' }] };
        const emptySum = { rows: [{ total: '0' }] };

        const [
          totalOffers,
          acceptedOffers,
          totalShipments,
          deliveredShipments,
          cancelledShipments,
          activeShipments,
          totalEarnings,
          openListings,
        ] = await Promise.all([
          offerCarrierExpr
            ? pool.query(
                `SELECT COUNT(*) as total FROM "${offersMeta.schema}".offers o WHERE ${offerCarrierExpr} = $1`,
                [userId]
              )
            : Promise.resolve(emptyCount),
          offerCarrierExpr
            ? pool.query(
                `SELECT COUNT(*) as total FROM "${offersMeta.schema}".offers o WHERE ${offerCarrierExpr} = $1 AND ${offerStatusExpr} IN ('accepted', 'offer_accepted')`,
                [userId]
              )
            : Promise.resolve(emptyCount),
          shipCarrierExpr
            ? pool.query(
                `SELECT COUNT(*) as total FROM "${shipmentsMeta.schema}".shipments s WHERE ${shipCarrierExpr} = $1`,
                [userId]
              )
            : Promise.resolve(emptyCount),
          shipCarrierExpr
            ? pool.query(
                `SELECT COUNT(*) as total FROM "${shipmentsMeta.schema}".shipments s WHERE ${shipCarrierExpr} = $1 AND ${shipStatusExpr} IN ('delivered', 'completed')`,
                [userId]
              )
            : Promise.resolve(emptyCount),
          shipCarrierExpr
            ? pool.query(
                `SELECT COUNT(*) as total FROM "${shipmentsMeta.schema}".shipments s WHERE ${shipCarrierExpr} = $1 AND ${shipStatusExpr} IN ('cancelled', 'canceled')`,
                [userId]
              )
            : Promise.resolve(emptyCount),
          shipCarrierExpr
            ? pool.query(
                `SELECT COUNT(*) as total FROM "${shipmentsMeta.schema}".shipments s WHERE ${shipCarrierExpr} = $1 AND ${shipStatusExpr} IN ('offer_accepted', 'accepted', 'assigned', 'in_progress', 'picked_up', 'in_transit', 'delivered', 'active')`,
                [userId]
              )
            : Promise.resolve(emptyCount),
          shipCarrierExpr && shipPriceExpr
            ? pool.query(
                `SELECT COALESCE(SUM(${shipPriceExpr}), 0) as total FROM "${shipmentsMeta.schema}".shipments s WHERE ${shipCarrierExpr} = $1 AND ${shipStatusExpr} IN ('delivered', 'completed')`,
                [userId]
              )
            : Promise.resolve(emptySum),
          listingCarrierExpr
            ? pool.query(
                `SELECT COUNT(*) as total FROM "${listingsMeta.schema}".carrier_market_listings l WHERE ${listingCarrierExpr} = $1${listingStatusExpr ? ` AND ${listingStatusExpr} = 'open'` : ''}`,
                [userId]
              )
            : Promise.resolve(emptyCount),
        ]);

        const delivered = parseInt(deliveredShipments.rows[0].total);
        const cancelled = parseInt(cancelledShipments.rows[0].total);
        const successRate = delivered + cancelled > 0
          ? Number(((delivered / (delivered + cancelled)) * 100).toFixed(1))
          : 0;

        stats = {
          totalOffers: parseInt(totalOffers.rows[0].total),
          acceptedOffers: parseInt(acceptedOffers.rows[0].total),
          activeShipments: parseInt(activeShipments.rows[0].total),
          totalEarnings: parseFloat(totalEarnings.rows[0].total),
          totalShipments: parseInt(totalShipments.rows[0].total),
          deliveredShipments: delivered,
          cancelledShipments: cancelled,
          successRate,
          openListings: parseInt(openListings.rows[0].total),
        };
      } else if (userType === 'tasiyici') {
        const shipmentsMeta = await resolveTable('shipments');
        const driverCol = shipmentsMeta.pickCol('driver_id', 'driverId', 'driverID', 'driverid');
        const statusCol = shipmentsMeta.pickCol('status');
        const priceCol = shipmentsMeta.pickCol('price', 'offerPrice', 'offer_price', 'offerprice');
        const driverExpr = driverCol ? shipmentsMeta.qCol(driverCol) : null;
        const statusExpr = statusCol ? shipmentsMeta.qCol(statusCol) : 'status';
        const priceExpr = priceCol ? shipmentsMeta.qCol(priceCol) : 'price';

        if (!driverExpr) {
          return res.json({ success: true, data: { totalJobs: 0, completedJobs: 0, activeJobs: 0, totalEarnings: 0 } });
        }

        const [totalJobs, completedJobs, activeJobs, totalEarnings] = await Promise.all([
          pool.query(`SELECT COUNT(*) as total FROM "${shipmentsMeta.schema}".shipments WHERE ${driverExpr} = $1`, [userId]),
          pool.query(
            `SELECT COUNT(*) as total FROM "${shipmentsMeta.schema}".shipments WHERE ${driverExpr} = $1 AND ${statusExpr} IN ('completed', 'delivered')`,
            [userId]
          ),
          pool.query(
            `SELECT COUNT(*) as total FROM "${shipmentsMeta.schema}".shipments WHERE ${driverExpr} = $1 AND ${statusExpr} IN ('accepted', 'offer_accepted', 'in_progress', 'picked_up', 'in_transit', 'active')`,
            [userId]
          ),
          pool.query(
            `SELECT COALESCE(SUM(${priceExpr}), 0) as total FROM "${shipmentsMeta.schema}".shipments WHERE ${driverExpr} = $1 AND ${statusExpr} IN ('completed', 'delivered')`,
            [userId]
          ),
        ]);

        stats = {
          totalJobs: parseInt(totalJobs.rows[0].total),
          completedJobs: parseInt(completedJobs.rows[0].total),
          activeJobs: parseInt(activeJobs.rows[0].total),
          totalEarnings: parseFloat(totalEarnings.rows[0].total),
        };
      }

      return res.json({
        success: true,
        data: { stats },
      });
    } catch (error) {
      console.error('Dashboard stats error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to get dashboard stats',
      });
    }
  };

  // Get dashboard stats by user type (must be before '/' route to avoid route conflicts)
  router.get('/stats/:userType', authenticateToken, async (req, res) => {
    return handleStatsByUserType(req, res, req.params.userType);
  });

  // Compatibility: some clients call /api/dashboard/stats (without :userType)
  // We infer userType from the authenticated user's role.
  router.get('/stats', authenticateToken, async (req, res) => {
    const inferred = String(req.user?.role || 'individual').toLowerCase();
    const userType = inferred === 'carrier' ? 'nakliyeci' : inferred;
    return handleStatsByUserType(req, res, userType);
  });

  // Compatibility: some clients call /api/dashboard/analytics
  // Return a minimal payload (real analytics are served under /api/analytics).
  router.get('/analytics', authenticateToken, async (_req, res) => {
    return res.json({ success: true, data: {} });
  });

  // Compatibility: legacy dashboards call /api/dashboard/:panelType
  // e.g. /api/dashboard/individual, /api/dashboard/corporate, /api/dashboard/nakliyeci, /api/dashboard/tasiyici
  router.get('/individual', authenticateToken, async (req, res) => {
    return res.json({ success: true, data: {} });
  });

  router.get('/corporate', authenticateToken, async (req, res) => {
    return res.json({ success: true, data: {} });
  });

  router.get('/nakliyeci', authenticateToken, async (req, res) => {
    return res.json({ success: true, data: {} });
  });

  router.get('/tasiyici', authenticateToken, async (req, res) => {
    return res.json({ success: true, data: {} });
  });

  // Get dashboard data
  router.get('/', authenticateToken, async (req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({
          success: false,
          error: 'Database not available',
        });
      }

      const userId = req.user.id;
      const userRole = req.user.role || 'individual';

      if (userRole === 'individual' || userRole === 'corporate') {
        // Sender dashboard
        const shipmentsResult = await pool.query(
          'SELECT COUNT(*) as total FROM shipments WHERE "userId" = $1',
          [userId]
        );

        const openShipmentsResult = await pool.query(
          'SELECT COUNT(*) as total FROM shipments WHERE "userId" = $1 AND status = $2',
          [userId, 'waiting_for_offers']
        );

        const offersResult = await pool.query(
          `SELECT COUNT(*) as total 
           FROM offers o
           INNER JOIN shipments s ON o.shipment_id = s.id
           WHERE s."userId" = $1 AND o.status = $2`,
          [userId, 'pending']
        );

        res.json({
          success: true,
          data: {
            totalShipments: parseInt(shipmentsResult.rows[0].total),
            openShipments: parseInt(openShipmentsResult.rows[0].total),
            pendingOffers: parseInt(offersResult.rows[0].total),
          },
        });
      } else if (userRole === 'nakliyeci' || userRole === 'carrier') {
        // Carrier dashboard
        const offersResult = await pool.query(
          'SELECT COUNT(*) as total FROM offers WHERE nakliyeci_id = $1',
          [userId]
        );

        const acceptedOffersResult = await pool.query(
          'SELECT COUNT(*) as total FROM offers WHERE nakliyeci_id = $1 AND status = $2',
          [userId, 'accepted']
        );

        res.json({
          success: true,
          data: {
            totalOffers: parseInt(offersResult.rows[0].total),
            acceptedOffers: parseInt(acceptedOffersResult.rows[0].total),
          },
        });
      } else {
        res.json({
          success: true,
          data: {},
        });
      }
    } catch (error) {
      console.error('Dashboard error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get dashboard data',
      });
    }
  });

  return router;
}

module.exports = createDashboardRoutes;



