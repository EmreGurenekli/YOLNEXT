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

async function resolveTableMeta(pool, tableName) {
  const tRes = await pool.query(
    `SELECT table_schema
     FROM information_schema.tables
     WHERE table_name = $1
     ORDER BY (table_schema = 'public') DESC, table_schema ASC
     LIMIT 1`,
    [tableName]
  );
  const schema = tRes.rows && tRes.rows[0]?.table_schema ? tRes.rows[0].table_schema : 'public';
  const cRes = await pool.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_name = $1 AND table_schema = $2`,
    [tableName, schema]
  );
  const cols = new Set((cRes.rows || []).map(r => r.column_name));
  return { schema, cols };
}

function pickCol(cols, ...names) {
  for (const n of names) {
    if (cols.has(n)) return n;
  }
  return null;
}

async function getShipmentsMeta(pool) {
  if (shipmentsMetaCache) return shipmentsMetaCache;
  shipmentsMetaCache = await resolveTableMeta(pool, 'shipments');
  return shipmentsMetaCache;
}

async function getOffersMeta(pool) {
  if (offersMetaCache) return offersMetaCache;
  offersMetaCache = await resolveTableMeta(pool, 'offers');
  return offersMetaCache;
}

function safeNumber(value, fallback = 0) {
  const n = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(n) ? n : fallback;
}

let ratingsColumnsCache = null;
let shipmentsMetaCache = null;
let offersMetaCache = null;

async function getRatingsColumns(pool) {
  if (ratingsColumnsCache) return ratingsColumnsCache;

  const tRes = await pool.query(
    `SELECT table_schema
     FROM information_schema.tables
     WHERE table_name = 'ratings'
     ORDER BY (table_schema = 'public') DESC, table_schema ASC
     LIMIT 1`
  );
  const schema = tRes.rows && tRes.rows[0]?.table_schema ? tRes.rows[0].table_schema : 'public';
  const cRes = await pool.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_name = 'ratings' AND table_schema = $1`,
    [schema]
  );
  const cols = new Set((cRes.rows || []).map(r => r.column_name));
  ratingsColumnsCache = { schema, cols };
  return ratingsColumnsCache;
}

function qCol(col) {
  return col && /[A-Z]/.test(col) ? `"${col}"` : col;
}

function createAnalyticsRoutes(pool, authenticateToken) {
  const router = express.Router();

  // Public metrics endpoint (frontend performance monitoring compatibility)
  router.post('/metrics', express.json({ limit: '200kb' }), async (req, res) => {
    try {
      // Best-effort: accept metrics payload; storing is optional.
      // Persist when DB is available (analytics_metrics table is created by init.js).
      if (pool) {
        try {
          const ts = typeof req.body?.ts === 'number' ? req.body.ts : Date.now();
          const path = typeof req.body?.path === 'string' ? req.body.path : '';
          const href = typeof req.body?.href === 'string' ? req.body.href : '';
          const ua = typeof req.body?.ua === 'string' ? req.body.ua : (req.get('User-Agent') || '');
          const ip = req.ip || '';
          const userIdRaw = req.body?.userId ?? req.body?.user_id ?? req.body?.uid ?? null;
          const roleRaw = req.body?.role ?? req.body?.userRole ?? req.body?.user_role ?? null;
          const userId = userIdRaw != null && String(userIdRaw).trim() !== '' ? Number(userIdRaw) : null;
          const role = roleRaw != null ? String(roleRaw).trim().toLowerCase() : null;
          const metrics = req.body?.metrics && typeof req.body.metrics === 'object' ? req.body.metrics : req.body;

          await pool.query(
            `INSERT INTO analytics_metrics (ts, path, href, ua, ip, user_id, role, metrics, created_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,CURRENT_TIMESTAMP)`,
            [ts, path, href, ua, ip, Number.isFinite(userId) ? userId : null, role, JSON.stringify(metrics)]
          );
        } catch (_) {
          // ignore
        }
      }
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to record metrics' });
    }
  });

  // Public event endpoint (Landing A/B + conversion tracking)
  router.post('/event', express.json({ limit: '200kb' }), async (req, res) => {
    try {
      const event = typeof req.body?.event === 'string' ? String(req.body.event).trim().slice(0, 100) : '';
      const data = req.body?.data && typeof req.body.data === 'object' ? req.body.data : {};
      const ts = typeof req.body?.ts === 'number' ? req.body.ts : Date.now();
      const path = typeof req.body?.path === 'string' ? req.body.path : '';
      const href = typeof req.body?.href === 'string' ? req.body.href : '';
      const referrer = typeof req.body?.referrer === 'string' ? req.body.referrer : '';
      const ua = typeof req.body?.ua === 'string' ? req.body.ua : (req.get('User-Agent') || '');

      if (!event) {
        return res.status(400).json({ success: false, message: 'event is required' });
      }

      // Best-effort persistence (analytics_events table is created by init.js).
      if (pool) {
        try {
          const userIdRaw =
            req.body?.userId ?? req.body?.user_id ?? data?.userId ?? data?.user_id ?? data?.uid ?? null;
          const roleRaw =
            req.body?.role ?? req.body?.userRole ?? data?.role ?? data?.userRole ?? data?.user_role ?? null;

          const userId = userIdRaw != null && String(userIdRaw).trim() !== '' ? Number(userIdRaw) : null;
          const role = roleRaw != null ? String(roleRaw).trim().toLowerCase() : null;

          await pool.query(
            `INSERT INTO analytics_events (event, ts, path, href, referrer, ua, ip, user_id, role, data, created_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,CURRENT_TIMESTAMP)`,
            [
              event,
              ts,
              path,
              href,
              referrer,
              ua,
              req.ip || '',
              Number.isFinite(userId) ? userId : null,
              role,
              JSON.stringify(data || {}),
            ]
          );
        } catch (_) {
          // ignore
        }
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
      const role = String(req.user?.role || '').toLowerCase();
      const days = parsePeriodToDays(req.query.period);

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      // Prevent cross-role access (e.g., tasiyici fetching corporate dashboard)
      if (role && userType && role !== userType) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }

      const periodStart = `NOW() - INTERVAL '${days} days'`;

      const shipmentsMeta = await getShipmentsMeta(pool);
      const shipmentsSchema = shipmentsMeta?.schema || 'public';
      const shipmentsCols = shipmentsMeta?.cols || new Set();

      const createdAtCol = pickCol(shipmentsCols, 'createdAt', 'created_at', 'createdat') || 'createdAt';
      const isCarrier = userType === 'nakliyeci';
      const carrierCol = pickCol(shipmentsCols, 'nakliyeci_id', 'carrier_id', 'carrierId', 'nakliyeciId');
      const ownerCol = pickCol(shipmentsCols, 'owner_id', 'owner_id', 'userid', 'userId', 'user_id');

      const ownerKey = isCarrier ? carrierCol : ownerCol;
      if (!ownerKey) {
        return res.status(500).json({ success: false, message: 'Shipments schema not compatible' });
      }

      const shipmentsOwnerCondition = `s.${qCol(ownerKey)}::text = $1::text`;

      const totalShipmentsQ = pool.query(
        `SELECT COUNT(*)::int AS total
         FROM "${shipmentsSchema}".shipments s
         WHERE ${shipmentsOwnerCondition} AND s.${qCol(createdAtCol)} >= ${periodStart}`,
        [userId]
      );

      const deliveredShipmentsQ = pool.query(
        `SELECT COUNT(*)::int AS total
         FROM "${shipmentsSchema}".shipments s
         WHERE ${shipmentsOwnerCondition} AND s.${qCol('status')} IN ('delivered', 'completed') AND s.${qCol(createdAtCol)} >= ${periodStart}`,
        [userId]
      );

      const totalEarningsQ = pool.query(
        `SELECT COALESCE(SUM(${qCol('price')}), 0) AS total
         FROM "${shipmentsSchema}".shipments s
         WHERE ${shipmentsOwnerCondition} AND s.${qCol('status')} IN ('delivered', 'completed') AND s.${qCol(createdAtCol)} >= ${periodStart}`,
        [userId]
      );

      const avgRatingQ = (async () => {
        const meta = await getRatingsColumns(pool);
        const cols = meta?.cols || new Set();
        const schema = meta?.schema || 'public';

        const ratedColRaw = pickCol(
          cols,
          'ratedId',
          'rated_id',
          'ratedid',
          'rated_user_id',
          'rated_userid',
          'ratedUserId',
          'rateduserid'
        );
        const ratedCol = ratedColRaw ? qCol(ratedColRaw) : null;
        if (!ratedCol) {
          return { rows: [{ avg: 0 }] };
        }

        const createdColRaw = pickCol(cols, 'createdAt', 'created_at', 'createdat');
        const createdCol = createdColRaw ? qCol(createdColRaw) : null;

        const visibleColRaw = pickCol(cols, 'isVisible', 'is_visible', 'isvisible');
        const visibleClause = visibleColRaw
          ? ` AND (${qCol(visibleColRaw)} IS NULL OR ${qCol(visibleColRaw)} = true)`
          : '';
        const createdClause = createdCol
          ? ` AND ${createdCol} >= ${periodStart}`
          : '';

        const q = `SELECT COALESCE(AVG(${qCol('rating')}), 0) AS avg
                   FROM "${schema}".ratings
                   WHERE ${ratedCol}::text = $1::text${visibleClause}${createdClause}`;
        return pool.query(q, [userId]);
      })();

      const growthQ = pool.query(
        `WITH last_period AS (
           SELECT COUNT(*)::int AS c
           FROM "${shipmentsSchema}".shipments s
           WHERE ${shipmentsOwnerCondition} AND s.${qCol(createdAtCol)} >= (NOW() - INTERVAL '30 days')
         ), prev_period AS (
           SELECT COUNT(*)::int AS c
           FROM "${shipmentsSchema}".shipments s
           WHERE ${shipmentsOwnerCondition}
             AND s.${qCol(createdAtCol)} < (NOW() - INTERVAL '30 days')
             AND s.${qCol(createdAtCol)} >= (NOW() - INTERVAL '60 days')
         )
         SELECT last_period.c AS last_c, prev_period.c AS prev_c
         FROM last_period, prev_period`,
        [userId]
      );

      const pickupCityCol = pickCol(
        shipmentsCols,
        'pickupCity',
        'pickup_city',
        'pickupcity',
        'fromCity',
        'from_city'
      );
      const deliveryCityCol = pickCol(
        shipmentsCols,
        'deliveryCity',
        'delivery_city',
        'deliverycity',
        'toCity',
        'to_city'
      );

      const fromCityExpr = pickupCityCol
        ? `COALESCE(s.${qCol(pickupCityCol)}, '')`
        : `''`;
      const toCityExpr = deliveryCityCol
        ? `COALESCE(s.${qCol(deliveryCityCol)}, '')`
        : `''`;
      const topRoutesQ = pool.query(
        `SELECT
            ${fromCityExpr} AS "fromCity",
            ${toCityExpr} AS "toCity",
            COUNT(*)::int AS count
         FROM "${shipmentsSchema}".shipments s
         WHERE ${shipmentsOwnerCondition} AND s.${qCol(createdAtCol)} >= ${periodStart}
         GROUP BY ${fromCityExpr}, ${toCityExpr}
         ORDER BY count DESC
         LIMIT 5`,
        [userId]
      );

      const dailyShipmentsQ = pool.query(
        `SELECT
           TO_CHAR(DATE_TRUNC('day', s.${qCol(createdAtCol)}), 'YYYY-MM-DD') AS date,
           COUNT(*)::int AS count
         FROM "${shipmentsSchema}".shipments s
         WHERE ${shipmentsOwnerCondition} AND s.${qCol(createdAtCol)} >= (NOW() - INTERVAL '14 days')
         GROUP BY DATE_TRUNC('day', s.${qCol(createdAtCol)})
         ORDER BY DATE_TRUNC('day', s.${qCol(createdAtCol)}) ASC`,
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

      const shipmentsMeta = await getShipmentsMeta(pool);
      const shipmentsSchema = shipmentsMeta?.schema || 'public';
      const shipmentsCols = shipmentsMeta?.cols || new Set();

      const createdAtCol = pickCol(shipmentsCols, 'createdAt', 'created_at', 'createdat') || 'createdAt';
      const isCarrier = String(req.user?.role || '').toLowerCase() === 'nakliyeci';
      const carrierCol = pickCol(shipmentsCols, 'nakliyeci_id', 'carrier_id', 'carrierId', 'nakliyeciId');
      const ownerCol = pickCol(shipmentsCols, 'owner_id', 'owner_id', 'userid', 'userId', 'user_id');
      const ownerKey = isCarrier ? carrierCol : ownerCol;
      if (!ownerKey) {
        return res.status(500).json({ success: false, message: 'Shipments schema not compatible' });
      }

      const ownerCondition = `s.${qCol(ownerKey)}::text = $1::text`;

      const days = parsePeriodToDays(req.query.period);
      const periodStart = `NOW() - INTERVAL '${days} days'`;

      const totalQ = pool.query(
        `SELECT COUNT(*)::int AS total
         FROM "${shipmentsSchema}".shipments s
         WHERE ${ownerCondition} AND s.${qCol(createdAtCol)} >= ${periodStart}`,
        [userId]
      );

      const byStatusQ = pool.query(
        `SELECT status, COUNT(*)::int AS count
         FROM "${shipmentsSchema}".shipments s
         WHERE ${ownerCondition} AND s.${qCol(createdAtCol)} >= ${periodStart}
         GROUP BY status
         ORDER BY count DESC`,
        [userId]
      );

      const monthlyTrendQ = pool.query(
        `SELECT
           TO_CHAR(DATE_TRUNC('month', s.${qCol(createdAtCol)}), 'YYYY-MM') AS month,
           COUNT(*)::int AS shipments,
           COALESCE(SUM(CASE WHEN s.${qCol('status')} IN ('delivered','completed') THEN ${qCol('price')} ELSE 0 END), 0) AS revenue
         FROM "${shipmentsSchema}".shipments s
         WHERE ${ownerCondition} AND s.${qCol(createdAtCol)} >= ${periodStart}
         GROUP BY DATE_TRUNC('month', s.${qCol(createdAtCol)})
         ORDER BY DATE_TRUNC('month', s.${qCol(createdAtCol)}) ASC`,
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

      const shipmentsMeta = await getShipmentsMeta(pool);
      const shipmentsSchema = shipmentsMeta?.schema || 'public';
      const shipmentsCols = shipmentsMeta?.cols || new Set();
      const createdAtCol = pickCol(shipmentsCols, 'createdAt', 'created_at', 'createdat') || 'createdAt';
      const isCarrier = String(req.user?.role || '').toLowerCase() === 'nakliyeci';
      const carrierCol = pickCol(shipmentsCols, 'nakliyeci_id', 'carrier_id', 'carrierId', 'nakliyeciId');
      const ownerCol = pickCol(shipmentsCols, 'owner_id', 'owner_id', 'userid', 'userId', 'user_id');
      const ownerKey = isCarrier ? carrierCol : ownerCol;
      if (!ownerKey) {
        return res.status(500).json({ success: false, message: 'Shipments schema not compatible' });
      }
      const ownerCondition = `s.${qCol(ownerKey)}::text = $1::text`;

      const days = parsePeriodToDays(req.query.period);
      const periodStart = `NOW() - INTERVAL '${days} days'`;

      const totalsQ = pool.query(
        `SELECT
           COALESCE(SUM(${qCol('price')}), 0) AS totalRevenue,
           COALESCE(AVG(${qCol('price')}), 0) AS avgOrderValue,
           COUNT(*)::int AS deliveredCount
         FROM "${shipmentsSchema}".shipments s
         WHERE ${ownerCondition} AND s.${qCol('status')} IN ('delivered','completed') AND s.${qCol(createdAtCol)} >= ${periodStart}`,
        [userId]
      );

      const byDayQ = pool.query(
        `SELECT
           TO_CHAR(DATE_TRUNC('day', s.${qCol(createdAtCol)}), 'YYYY-MM-DD') AS date,
           COALESCE(SUM(${qCol('price')}), 0) AS revenue
         FROM "${shipmentsSchema}".shipments s
         WHERE ${ownerCondition} AND s.${qCol('status')} IN ('delivered','completed') AND s.${qCol(createdAtCol)} >= ${periodStart}
         GROUP BY DATE_TRUNC('day', s.${qCol(createdAtCol)})
         ORDER BY DATE_TRUNC('day', s.${qCol(createdAtCol)}) ASC`,
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

      const offersMeta = await getOffersMeta(pool);
      const offersSchema = offersMeta?.schema || 'public';
      const offersCols = offersMeta?.cols || new Set();
      const createdAtCol = pickCol(offersCols, 'createdAt', 'created_at', 'createdat') || 'createdAt';
      const isCarrier = String(req.user?.role || '').toLowerCase() === 'nakliyeci';
      const carrierCol = pickCol(offersCols, 'nakliyeci_id', 'carrier_id', 'carrierId', 'nakliyeciId');
      const shipmentIdCol = pickCol(offersCols, 'shipment_id', 'shipmentId', 'shipmentid');
      const statusCol = pickCol(offersCols, 'status') || 'status';

      if (isCarrier) {
        const ownerKey = carrierCol;
        if (!ownerKey) {
          return res.status(500).json({ success: false, message: 'Offers schema not compatible' });
        }
        const ownerCondition = `o.${qCol(ownerKey)}::text = $1::text`;

        const days = parsePeriodToDays(req.query.period);
        const periodStart = `NOW() - INTERVAL '${days} days'`;

        const totalsQ = pool.query(
          `SELECT
             COUNT(*)::int AS totalOffers,
             COUNT(*) FILTER (WHERE o.${qCol(statusCol)} IN ('accepted','offer_accepted'))::int AS acceptedOffers,
             COALESCE(AVG(${qCol('price')}), 0) AS avgOffer
           FROM "${offersSchema}".offers o
           WHERE ${ownerCondition} AND o.${qCol(createdAtCol)} >= ${periodStart}`,
          [userId]
        );

        const monthlyQ = pool.query(
          `SELECT
             TO_CHAR(DATE_TRUNC('month', o.${qCol(createdAtCol)}), 'YYYY-MM') AS month,
             COUNT(*)::int AS offers,
             COUNT(*) FILTER (WHERE o.${qCol(statusCol)} IN ('accepted','offer_accepted'))::int AS accepted,
             COALESCE(AVG(${qCol('price')}), 0) AS avgOffer
           FROM "${offersSchema}".offers o
           WHERE ${ownerCondition} AND o.${qCol(createdAtCol)} >= ${periodStart}
           GROUP BY DATE_TRUNC('month', o.${qCol(createdAtCol)})
           ORDER BY DATE_TRUNC('month', o.${qCol(createdAtCol)}) ASC`,
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
      }

      // Non-carrier roles (individual/corporate): offer performance for shipments owned by this user
      if (!shipmentIdCol) {
        return res.status(500).json({ success: false, message: 'Offers schema not compatible' });
      }

      const shipmentsMeta = await getShipmentsMeta(pool);
      const shipmentsSchema = shipmentsMeta?.schema || 'public';
      const shipmentsCols = shipmentsMeta?.cols || new Set();
      const ownerCol = pickCol(shipmentsCols, 'owner_id', 'owner_id', 'userid', 'userId', 'user_id');
      if (!ownerCol) {
        return res.status(500).json({ success: false, message: 'Shipments schema not compatible' });
      }
      const shipmentsOwnerCondition = `s.${qCol(ownerCol)}::text = $1::text`;
      const offerShipmentJoin = `o.${qCol(shipmentIdCol)}::text = s.${qCol('id')}::text`;

      const days = parsePeriodToDays(req.query.period);
      const periodStart = `NOW() - INTERVAL '${days} days'`;

      const totalsQ = pool.query(
        `SELECT
           COUNT(*)::int AS totalOffers,
           COUNT(*) FILTER (WHERE o.${qCol(statusCol)} IN ('accepted','offer_accepted'))::int AS acceptedOffers,
           COALESCE(AVG(o.${qCol('price')}), 0) AS avgOffer
         FROM "${offersSchema}".offers o
         INNER JOIN "${shipmentsSchema}".shipments s
           ON ${offerShipmentJoin}
         WHERE ${shipmentsOwnerCondition} AND o.${qCol(createdAtCol)} >= ${periodStart}`,
        [userId]
      );

      const monthlyQ = pool.query(
        `SELECT
           TO_CHAR(DATE_TRUNC('month', o.${qCol(createdAtCol)}), 'YYYY-MM') AS month,
           COUNT(*)::int AS offers,
           COUNT(*) FILTER (WHERE o.${qCol(statusCol)} IN ('accepted','offer_accepted'))::int AS accepted,
           COALESCE(AVG(o.${qCol('price')}), 0) AS avgOffer
         FROM "${offersSchema}".offers o
         INNER JOIN "${shipmentsSchema}".shipments s
           ON ${offerShipmentJoin}
         WHERE ${shipmentsOwnerCondition} AND o.${qCol(createdAtCol)} >= ${periodStart}
         GROUP BY DATE_TRUNC('month', o.${qCol(createdAtCol)})
         ORDER BY DATE_TRUNC('month', o.${qCol(createdAtCol)}) ASC`,
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
