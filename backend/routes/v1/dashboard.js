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

  // Get dashboard stats by user type (must be before '/' route to avoid route conflicts)
  router.get('/stats/:userType', authenticateToken, async (req, res) => {
    console.log('📊 Dashboard stats route called:', req.params.userType, 'User:', req.user?.id);
    try {
      const userType = req.params.userType;

      if (!pool) {
        return res.status(500).json({
          success: false,
          error: 'Database not available',
        });
      }

      const userId = req.user.id;

      let stats = {};

      if (userType === 'individual') {
        // Individual sender stats
        const [totalShipments, completedShipments, pendingShipments, totalSpent] = await Promise.all([
          queryWithFallback(
            'SELECT COUNT(*) as total FROM shipments WHERE user_id = $1',
            'SELECT COUNT(*) as total FROM shipments WHERE "ownerId" = $1',
            [userId]
          ),
          queryWithFallback(
            "SELECT COUNT(*) as total FROM shipments WHERE user_id = $1 AND status IN ('delivered', 'completed')",
            "SELECT COUNT(*) as total FROM shipments WHERE \"ownerId\" = $1 AND status IN ('delivered', 'completed')",
            [userId]
          ),
          queryWithFallback(
            "SELECT COUNT(*) as total FROM shipments WHERE user_id = $1 AND status IN ('pending', 'waiting_for_offers', 'offer_accepted', 'open')",
            "SELECT COUNT(*) as total FROM shipments WHERE \"ownerId\" = $1 AND status IN ('pending', 'waiting_for_offers', 'offer_accepted', 'open')",
            [userId]
          ),
          queryWithFallback(
            "SELECT COALESCE(SUM(price), 0) as total FROM shipments WHERE user_id = $1 AND status IN ('delivered', 'completed')",
            "SELECT COALESCE(SUM(price), 0) as total FROM shipments WHERE \"ownerId\" = $1 AND status IN ('delivered', 'completed')",
            [userId]
          ),
        ]);

        stats = {
          totalShipments: parseInt(totalShipments.rows[0].total),
          completedShipments: parseInt(completedShipments.rows[0].total),
          pendingShipments: parseInt(pendingShipments.rows[0].total),
          totalSpent: parseFloat(totalSpent.rows[0].total),
        };
      } else if (userType === 'corporate') {
        // Corporate sender stats
        const [totalShipments, completedShipments, pendingShipments, totalSpent] = await Promise.all([
          queryWithFallback(
            'SELECT COUNT(*) as total FROM shipments WHERE user_id = $1',
            'SELECT COUNT(*) as total FROM shipments WHERE "ownerId" = $1',
            [userId]
          ),
          queryWithFallback(
            "SELECT COUNT(*) as total FROM shipments WHERE user_id = $1 AND status IN ('delivered', 'completed')",
            "SELECT COUNT(*) as total FROM shipments WHERE \"ownerId\" = $1 AND status IN ('delivered', 'completed')",
            [userId]
          ),
          queryWithFallback(
            "SELECT COUNT(*) as total FROM shipments WHERE user_id = $1 AND status IN ('pending', 'waiting_for_offers', 'offer_accepted', 'open')",
            "SELECT COUNT(*) as total FROM shipments WHERE \"ownerId\" = $1 AND status IN ('pending', 'waiting_for_offers', 'offer_accepted', 'open')",
            [userId]
          ),
          queryWithFallback(
            "SELECT COALESCE(SUM(price), 0) as total FROM shipments WHERE user_id = $1 AND status IN ('delivered', 'completed')",
            "SELECT COALESCE(SUM(price), 0) as total FROM shipments WHERE \"ownerId\" = $1 AND status IN ('delivered', 'completed')",
            [userId]
          ),
        ]);

        stats = {
          totalShipments: parseInt(totalShipments.rows[0].total),
          completedShipments: parseInt(completedShipments.rows[0].total),
          pendingShipments: parseInt(pendingShipments.rows[0].total),
          totalSpent: parseFloat(totalSpent.rows[0].total),
        };
      } else if (userType === 'nakliyeci') {
        // Nakliyeci stats
        const [totalOffers, acceptedOffers, activeShipments, totalEarnings] = await Promise.all([
          queryWithFallback(
            'SELECT COUNT(*) as total FROM offers WHERE nakliyeci_id = $1',
            'SELECT COUNT(*) as total FROM offers WHERE "nakliyeci_id" = $1',
            [userId]
          ),
          queryWithFallback(
            "SELECT COUNT(*) as total FROM offers WHERE nakliyeci_id = $1 AND status IN ('accepted', 'offer_accepted')",
            "SELECT COUNT(*) as total FROM offers WHERE \"nakliyeci_id\" = $1 AND status IN ('accepted', 'offer_accepted')",
            [userId]
          ),
          queryWithFallback(
            "SELECT COUNT(*) as total FROM shipments WHERE nakliyeci_id = $1 AND status IN ('accepted', 'offer_accepted', 'in_progress', 'picked_up', 'in_transit', 'active')",
            "SELECT COUNT(*) as total FROM shipments WHERE \"nakliyeci_id\" = $1 AND status IN ('accepted', 'offer_accepted', 'in_progress', 'picked_up', 'in_transit', 'active')",
            [userId]
          ),
          queryWithFallback(
            "SELECT COALESCE(SUM(price), 0) as total FROM shipments WHERE nakliyeci_id = $1 AND status IN ('delivered', 'completed')",
            "SELECT COALESCE(SUM(price), 0) as total FROM shipments WHERE \"nakliyeci_id\" = $1 AND status IN ('delivered', 'completed')",
            [userId]
          ),
        ]);

        stats = {
          totalOffers: parseInt(totalOffers.rows[0].total),
          acceptedOffers: parseInt(acceptedOffers.rows[0].total),
          activeShipments: parseInt(activeShipments.rows[0].total),
          totalEarnings: parseFloat(totalEarnings.rows[0].total),
        };
      } else if (userType === 'tasiyici') {
        // Taşıyıcı stats
        const [totalJobs, completedJobs, activeJobs, totalEarnings] = await Promise.all([
          queryWithFallback(
            'SELECT COUNT(*) as total FROM shipments WHERE driver_id = $1',
            'SELECT COUNT(*) as total FROM shipments WHERE "driverId" = $1',
            [userId]
          ),
          queryWithFallback(
            "SELECT COUNT(*) as total FROM shipments WHERE driver_id = $1 AND status IN ('completed', 'delivered')",
            "SELECT COUNT(*) as total FROM shipments WHERE \"driverId\" = $1 AND status IN ('completed', 'delivered')",
            [userId]
          ),
          queryWithFallback(
            "SELECT COUNT(*) as total FROM shipments WHERE driver_id = $1 AND status IN ('accepted', 'offer_accepted', 'in_progress', 'picked_up', 'in_transit', 'active')",
            "SELECT COUNT(*) as total FROM shipments WHERE \"driverId\" = $1 AND status IN ('accepted', 'offer_accepted', 'in_progress', 'picked_up', 'in_transit', 'active')",
            [userId]
          ),
          queryWithFallback(
            "SELECT COALESCE(SUM(price), 0) as total FROM shipments WHERE driver_id = $1 AND status IN ('completed', 'delivered')",
            "SELECT COALESCE(SUM(price), 0) as total FROM shipments WHERE \"driverId\" = $1 AND status IN ('completed', 'delivered')",
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

      res.json({
        success: true,
        data: {
          stats,
        },
      });
    } catch (error) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get dashboard stats',
      });
    }
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
          'SELECT COUNT(*) as total FROM shipments WHERE user_id = $1',
          [userId]
        );

        const openShipmentsResult = await pool.query(
          'SELECT COUNT(*) as total FROM shipments WHERE user_id = $1 AND status = $2',
          [userId, 'waiting_for_offers']
        );

        const offersResult = await pool.query(
          `SELECT COUNT(*) as total 
           FROM offers o
           INNER JOIN shipments s ON o.shipment_id = s.id
           WHERE s.user_id = $1 AND o.status = $2`,
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



