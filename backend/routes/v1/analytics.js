const express = require('express');

function parsePeriodToDays(period) {
  if (!period) return 30;
  const p = String(period);
  if (p === '7days' || p === '7' || p === '7d') return 7;
  if (p === '30days' || p === '30' || p === '30d') return 30;
  if (p === '90days' || p === '90' || p === '90d') return 90;
  if (p === '1year' || p === '365' || p === '365d' || p === '1y') return 365;

  const numeric = parseInt(p, 10);
  if (!Number.isNaN(numeric) && numeric > 0) return numeric;
  return 30;
}

function safeNumber(value, fallback = 0) {
  const n = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(n) ? n : fallback;
}

let ratingsColumnsCache = null;

async function getRatingsColumns(pool) {
  if (ratingsColumnsCache) return ratingsColumnsCache;
  const result = await pool.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name = 'ratings'"
  );
  ratingsColumnsCache = new Set(result.rows.map(r => r.column_name));
  return ratingsColumnsCache;
}

function createAnalyticsRoutes(pool, authenticateToken) {
  const router = express.Router();

  // Public metrics endpoint (frontend performance monitoring compatibility)
  router.post('/metrics', express.json({ limit: '200kb' }), async (req, res) => {
    try {
      // Best-effort: accept metrics payload; storing is optional.
      // If you want persistence later, add an analytics_metrics table.
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to record metrics' });
    }
  });

  // Public event endpoint (Landing A/B + conversion tracking)
  router.post('/event', express.json({ limit: '200kb' }), async (req, res) => {
    try {
      const event = typeof req.body?.event === 'string' ? req.body.event : '';
      const data = req.body?.data && typeof req.body.data === 'object' ? req.body.data : {};
      const ts = typeof req.body?.ts === 'number' ? req.body.ts : Date.now();
      const path = typeof req.body?.path === 'string' ? req.body.path : '';

      if (!event) {
        return res.status(400).json({ success: false, message: 'event is required' });
      }

      // Best-effort: for now we only log. Persist later if needed.
      if (process.env.NODE_ENV === 'production') {
        console.log('📈 analytics.event', {
          event,
          ts,
          path,
          ip: req.ip,
          ua: req.get('User-Agent') || '',
          data,
        });
      }

      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to record event' });
    }
  });

  router.get('/dashboard/:userType', authenticateToken, async (req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({ success: false, message: 'Database not available' });
      }

      const userId = req.user?.id;
      const userType = String(req.params.userType || '').toLowerCase();
      const days = parsePeriodToDays(req.query.period);

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const periodStart = `NOW() - INTERVAL '${days} days'`;

      // Kurumsal gönderici için ownerId üzerinden, nakliyeci için nakliyeci_id üzerinden hesapla
      const isCarrier = userType === 'nakliyeci';
      const shipmentsOwnerCondition = isCarrier
        ? '"nakliyeci_id" = $1'
        : '"ownerId" = $1';

      const totalShipmentsQ = pool.query(
        `SELECT COUNT(*)::int AS total
         FROM shipments
         WHERE ${shipmentsOwnerCondition} AND "createdAt" >= ${periodStart}`,
        [userId]
      );

      const deliveredShipmentsQ = pool.query(
        `SELECT COUNT(*)::int AS total
         FROM shipments
         WHERE ${shipmentsOwnerCondition} AND status IN ('delivered', 'completed') AND "createdAt" >= ${periodStart}`,
        [userId]
      );

      const totalEarningsQ = pool.query(
        `SELECT COALESCE(SUM(price), 0) AS total
         FROM shipments
         WHERE ${shipmentsOwnerCondition} AND status IN ('delivered', 'completed') AND "createdAt" >= ${periodStart}`,
        [userId]
      );

      const avgRatingQ = (async () => {
        const cols = await getRatingsColumns(pool);

        const ratedCol = cols.has('ratedId')
          ? '"ratedId"'
          : cols.has('rated_user_id')
            ? 'rated_user_id'
            : null;
        if (!ratedCol) {
          return { rows: [{ avg: 0 }] };
        }

        const createdCol = cols.has('createdAt')
          ? '"createdAt"'
          : cols.has('created_at')
            ? 'created_at'
            : null;
        const visibleClause = cols.has('isVisible')
          ? ' AND ("isVisible" IS NULL OR "isVisible" = true)'
          : '';
        const createdClause = createdCol
          ? ` AND ${createdCol} >= ${periodStart}`
          : '';

        const q = `SELECT COALESCE(AVG(rating), 0) AS avg FROM ratings WHERE ${ratedCol} = $1${visibleClause}${createdClause}`;
        return pool.query(q, [userId]);
      })();

      const growthQ = pool.query(
        `WITH last_period AS (
           SELECT COUNT(*)::int AS c
           FROM shipments
           WHERE ${shipmentsOwnerCondition.replace(
             '= $1',
             "= $1"
           )} AND "createdAt" >= (NOW() - INTERVAL '30 days')
         ), prev_period AS (
           SELECT COUNT(*)::int AS c
           FROM shipments
           WHERE ${shipmentsOwnerCondition.replace(
             '= $1',
             "= $1"
           )}
             AND "createdAt" < (NOW() - INTERVAL '30 days')
             AND "createdAt" >= (NOW() - INTERVAL '60 days')
         )
         SELECT last_period.c AS last_c, prev_period.c AS prev_c
         FROM last_period, prev_period`,
        [userId]
      );

      const topRoutesQ = pool.query(
        `SELECT
            COALESCE("pickupCity", '') AS "fromCity",
            COALESCE("deliveryCity", '') AS "toCity",
            COUNT(*)::int AS count
         FROM shipments
         WHERE ${shipmentsOwnerCondition} AND "createdAt" >= ${periodStart}
         GROUP BY COALESCE("pickupCity", ''), COALESCE("deliveryCity", '')
         ORDER BY count DESC
         LIMIT 5`,
        [userId]
      );

      const dailyShipmentsQ = pool.query(
        `SELECT
           TO_CHAR(DATE_TRUNC('day', "createdAt"), 'YYYY-MM-DD') AS date,
           COUNT(*)::int AS count
         FROM shipments
         WHERE ${shipmentsOwnerCondition} AND "createdAt" >= (NOW() - INTERVAL '14 days')
         GROUP BY DATE_TRUNC('day', "createdAt")
         ORDER BY DATE_TRUNC('day', "createdAt") ASC`,
        [userId]
      );

      const [
        totalShipmentsR,
        deliveredShipmentsR,
        totalEarningsR,
        avgRatingR,
        growthR,
        topRoutesR,
        dailyShipmentsR,
      ] = await Promise.all([
        totalShipmentsQ,
        deliveredShipmentsQ,
        totalEarningsQ,
        avgRatingQ,
        growthQ,
        topRoutesQ,
        dailyShipmentsQ,
      ]);

      const totalShipments = totalShipmentsR.rows[0]?.total || 0;
      const deliveredShipments = deliveredShipmentsR.rows[0]?.total || 0;
      const successRate =
        totalShipments > 0 ? (deliveredShipments / totalShipments) * 100 : 0;
      const totalEarnings = safeNumber(totalEarningsR.rows[0]?.total, 0);
      const averageRating = safeNumber(avgRatingR.rows[0]?.avg, 0);

      const lastC = growthR.rows[0]?.last_c || 0;
      const prevC = growthR.rows[0]?.prev_c || 0;
      const monthlyGrowth =
        prevC > 0
          ? ((lastC - prevC) / prevC) * 100
          : lastC > 0
            ? 100
            : 0;

      return res.json({
        success: true,
        data: {
          totalShipments,
          deliveredShipments,
          // Frontend beklediği için hem totalRevenue hem de totalEarnings döndür
          totalRevenue: totalEarnings,
          totalEarnings,
          averageRating,
          successRate: parseFloat(successRate.toFixed(1)),
          monthlyGrowth: parseFloat(monthlyGrowth.toFixed(1)),
          topRoutes: topRoutesR.rows,
          dailyShipments: dailyShipmentsR.rows,
          // Aşağıdakiler şu an için kurumsalda kullanılmıyor ama ilerisi için bırakıyoruz
          monthlyTrend: [],
        },
      });
    } catch (error) {
      console.error('Analytics dashboard error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to load analytics dashboard',
        details: error.message,
      });
    }
  });

  router.get('/shipments', authenticateToken, async (req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({ success: false, message: 'Database not available' });
      }

      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const days = parsePeriodToDays(req.query.period);
      const periodStart = `NOW() - INTERVAL '${days} days'`;

      const totalQ = pool.query(
        `SELECT COUNT(*)::int AS total
         FROM shipments
         WHERE "nakliyeci_id" = $1 AND "createdAt" >= ${periodStart}`,
        [userId]
      );

      const byStatusQ = pool.query(
        `SELECT status, COUNT(*)::int AS count
         FROM shipments
         WHERE "nakliyeci_id" = $1 AND "createdAt" >= ${periodStart}
         GROUP BY status
         ORDER BY count DESC`,
        [userId]
      );

      const monthlyTrendQ = pool.query(
        `SELECT
           TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') AS month,
           COUNT(*)::int AS shipments,
           COALESCE(SUM(CASE WHEN status = 'delivered' THEN price ELSE 0 END), 0) AS revenue
         FROM shipments
         WHERE "nakliyeci_id" = $1 AND "createdAt" >= ${periodStart}
         GROUP BY DATE_TRUNC('month', "createdAt")
         ORDER BY DATE_TRUNC('month', "createdAt") ASC`,
        [userId]
      );

      const [totalR, byStatusR, monthlyTrendR] = await Promise.all([totalQ, byStatusQ, monthlyTrendQ]);

      return res.json({
        success: true,
        data: {
          totalShipments: totalR.rows[0]?.total || 0,
          byStatus: byStatusR.rows,
          monthlyTrend: monthlyTrendR.rows.map(r => ({
            month: r.month,
            shipments: r.shipments,
            revenue: safeNumber(r.revenue, 0),
          })),
        },
      });
    } catch (error) {
      console.error('Analytics shipments error:', error);
      return res.status(500).json({ success: false, message: 'Failed to load shipment analytics', details: error.message });
    }
  });

  router.get('/revenue', authenticateToken, async (req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({ success: false, message: 'Database not available' });
      }

      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const days = parsePeriodToDays(req.query.period);
      const periodStart = `NOW() - INTERVAL '${days} days'`;

      const totalsQ = pool.query(
        `SELECT
           COALESCE(SUM(price), 0) AS totalRevenue,
           COALESCE(AVG(price), 0) AS avgOrderValue,
           COUNT(*)::int AS deliveredCount
         FROM shipments
         WHERE "nakliyeci_id" = $1 AND status = 'delivered' AND "createdAt" >= ${periodStart}`,
        [userId]
      );

      const byDayQ = pool.query(
        `SELECT
           TO_CHAR(DATE_TRUNC('day', "createdAt"), 'YYYY-MM-DD') AS date,
           COALESCE(SUM(price), 0) AS revenue
         FROM shipments
         WHERE "nakliyeci_id" = $1 AND status = 'delivered' AND "createdAt" >= ${periodStart}
         GROUP BY DATE_TRUNC('day', "createdAt")
         ORDER BY DATE_TRUNC('day', "createdAt") ASC`,
        [userId]
      );

      const [totalsR, byDayR] = await Promise.all([totalsQ, byDayQ]);

      return res.json({
        success: true,
        data: {
          totalRevenue: safeNumber(totalsR.rows[0]?.totalrevenue, 0),
          averageOrderValue: safeNumber(totalsR.rows[0]?.avgordervalue, 0),
          deliveredCount: totalsR.rows[0]?.deliveredcount || 0,
          revenueByDay: byDayR.rows.map(r => ({
            date: r.date,
            revenue: safeNumber(r.revenue, 0),
          })),
        },
      });
    } catch (error) {
      console.error('Analytics revenue error:', error);
      return res.status(500).json({ success: false, message: 'Failed to load revenue analytics', details: error.message });
    }
  });

  router.get('/performance', authenticateToken, async (req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({ success: false, message: 'Database not available' });
      }

      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const days = parsePeriodToDays(req.query.period);
      const periodStart = `NOW() - INTERVAL '${days} days'`;

      const totalsQ = pool.query(
        `SELECT
           COUNT(*)::int AS totalOffers,
           COUNT(*) FILTER (WHERE status = 'accepted')::int AS acceptedOffers,
           COALESCE(AVG(price), 0) AS avgOffer
         FROM offers
         WHERE "nakliyeci_id" = $1 AND "createdAt" >= ${periodStart}`,
        [userId]
      );

      const monthlyQ = pool.query(
        `SELECT
           TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') AS month,
           COUNT(*)::int AS offers,
           COUNT(*) FILTER (WHERE status = 'accepted')::int AS accepted,
           COALESCE(AVG(price), 0) AS avgOffer
         FROM offers
         WHERE "nakliyeci_id" = $1 AND "createdAt" >= ${periodStart}
         GROUP BY DATE_TRUNC('month', "createdAt")
         ORDER BY DATE_TRUNC('month', "createdAt") ASC`,
        [userId]
      );

      const [totalsR, monthlyR] = await Promise.all([totalsQ, monthlyQ]);
      const totalOffers = totalsR.rows[0]?.totaloffers || 0;
      const acceptedOffers = totalsR.rows[0]?.acceptedoffers || 0;
      const successRate = totalOffers > 0 ? (acceptedOffers / totalOffers) * 100 : 0;

      return res.json({
        success: true,
        data: {
          totalOffers,
          acceptedOffers,
          averageOffer: safeNumber(totalsR.rows[0]?.avgoffer, 0),
          successRate: parseFloat(successRate.toFixed(1)),
          monthlyPerformance: monthlyR.rows.map(r => ({
            month: r.month,
            offers: r.offers,
            accepted: r.accepted,
            averageOffer: safeNumber(r.avgoffer, 0),
          })),
        },
      });
    } catch (error) {
      console.error('Analytics performance error:', error);
      return res.status(500).json({ success: false, message: 'Failed to load performance analytics', details: error.message });
    }
  });

  return router;
}

module.exports = createAnalyticsRoutes;
