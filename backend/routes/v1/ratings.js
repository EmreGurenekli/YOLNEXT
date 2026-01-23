const express = require('express');

function createRatingsRoutes(pool, authenticateToken) {
  const router = express.Router();

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

  const getRatingsCols = async () => {
    const { schema, cols, pickCol, qCol } = await resolveTable('ratings');
    return {
      schema,
      cols: {
        idCol: pickCol('id'),
        ratedIdCol: pickCol('ratedId', 'rated_id', 'ratee_id', 'rated_user_id', 'ratedUserId', 'ratedid'),
        raterIdCol: pickCol('raterId', 'rater_id', 'rater_id', 'rater_user_id', 'raterUserId', 'raterid'),
        ratingCol: pickCol('rating'),
        commentCol: pickCol('comment', 'message', 'text'),
        shipmentIdCol: pickCol('shipmentId', 'shipment_id', 'shipmentid'),
        createdAtCol: pickCol('createdAt', 'created_at', 'createdat'),
        updatedAtCol: pickCol('updatedAt', 'updated_at', 'updatedat'),
      },
      qCol,
    };
  };

  const getUsersCols = async () => {
    const { schema, cols, pickCol, qCol } = await resolveTable('users');
    return {
      schema,
      cols: {
        idCol: pickCol('id'),
        fullNameCol: pickCol('fullName', 'fullname', 'full_name', 'name'),
        emailCol: pickCol('email', 'mail', 'e_mail'),
      },
      qCol,
    };
  };

  router.get('/_meta', authenticateToken, async (_req, res) => {
    try {
      if (!pool) return res.status(500).json({ success: false, message: 'Database not available' });
      const ratings = await getRatingsCols();
      const cntRes = await pool.query(`SELECT COUNT(*)::integer as cnt FROM "${ratings.schema}".ratings`);
      return res.json({
        success: true,
        data: {
          schema: ratings.schema,
          cols: ratings.cols,
          count: cntRes.rows?.[0]?.cnt ?? null,
        },
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Meta failed', error: error.message });
    }
  });

  router.get('/:ratedId', authenticateToken, async (req, res) => {
    try {
      if (!pool) return res.status(500).json({ success: false, message: 'Database not available' });

      const ratedId = String(req.params.ratedId || '').trim();
      if (!ratedId) return res.status(400).json({ success: false, message: 'ratedId gerekli' });

      const ratings = await getRatingsCols();
      const { cols } = ratings;
      if (!cols.ratedIdCol || !cols.raterIdCol || !cols.ratingCol) {
        return res.status(500).json({ success: false, message: 'Ratings schema not compatible' });
      }

      const selectParts = [
        `r.${ratings.qCol(cols.idCol || 'id')} as id`,
        `${ratings.qCol(cols.ratingCol)} as rating`,
        cols.commentCol ? `r.${ratings.qCol(cols.commentCol)} as comment` : `'' as comment`,
        cols.createdAtCol ? `r.${ratings.qCol(cols.createdAtCol)} as created_at` : `CURRENT_TIMESTAMP as created_at`,
        `r.${ratings.qCol(cols.raterIdCol)} as rater_id`,
      ];

      const orderByCol = cols.createdAtCol ? `r.${ratings.qCol(cols.createdAtCol)}` : `r.${ratings.qCol(cols.idCol || 'id')}`;

      const users = await getUsersCols();
      const userIdCol = users.cols.idCol || 'id';
      const userNameCol = users.cols.fullNameCol || 'fullName';
      const userEmailCol = users.cols.emailCol;

      const raterNameExpr = userEmailCol
        ? `COALESCE(NULLIF(TRIM(u.${users.qCol(userNameCol)}), ''), NULLIF(TRIM(u.${users.qCol(userEmailCol)}), ''), '')`
        : `COALESCE(NULLIF(TRIM(u.${users.qCol(userNameCol)}), ''), '')`;

      const q = `SELECT ${selectParts.join(', ')}, ${raterNameExpr} as rater_name
                 FROM "${ratings.schema}".ratings r
                 LEFT JOIN "${users.schema}".users u ON u.${users.qCol(userIdCol)} = r.${ratings.qCol(cols.raterIdCol)}
                 WHERE r.${ratings.qCol(cols.ratedIdCol)}::text = $1
                 ORDER BY ${orderByCol} DESC
                 LIMIT 100`;

      const rowsRes = await pool.query(q, [ratedId]);
      const rows = rowsRes.rows || [];

      const avg = rows.length
        ? rows.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / rows.length
        : 0;

      return res.json({
        success: true,
        data: {
          ratings: rows,
          averageRating: Number.isFinite(avg) ? Number(avg.toFixed(2)) : 0,
          totalRatings: rows.length,
        },
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Değerlendirmeler alınamadı', error: error.message });
    }
  });

  router.post('/', authenticateToken, async (req, res) => {
    try {
      if (!pool) return res.status(500).json({ success: false, message: 'Database not available' });

      const raterId = req.user?.id;
      if (!raterId) return res.status(401).json({ success: false, message: 'Authentication required' });

      const ratedUserId = String(req.body?.ratedUserId || req.body?.rated_user_id || '').trim();
      const ratingValue = Number(req.body?.rating);
      const comment = String(req.body?.comment || '').trim();
      const shipmentIdRaw = req.body?.shipmentId ?? req.body?.shipment_id ?? null;
      const shipmentId = shipmentIdRaw != null && String(shipmentIdRaw).trim() !== '' ? String(shipmentIdRaw).trim() : null;

      if (!ratedUserId || !Number.isFinite(ratingValue)) {
        return res.status(400).json({ success: false, message: 'ratedUserId ve rating gerekli' });
      }
      if (ratingValue < 1 || ratingValue > 5) {
        return res.status(400).json({ success: false, message: 'Puan 1 ile 5 arasında olmalı' });
      }

      // 🔒 SECURITY CHECK 1: Self-rating prevention
      if (raterId === ratedUserId) {
        return res.status(403).json({ success: false, message: 'Kendinizi değerlendiremezsiniz' });
      }

      // 🔒 SECURITY CHECK 2: Shipment completion and relationship validation
      if (shipmentId) {
        const shipmentRes = await pool.query(
          `SELECT id, status, 
           CASE 
             WHEN user_id = $1 THEN 'sender'
             WHEN nakliyeci_id = $1 OR carrier_id = $1 THEN 'carrier'
             WHEN tasiyici_id = $1 OR driver_id = $1 THEN 'driver'
             ELSE 'none'
           END as rater_role,
           CASE 
             WHEN user_id = $2 THEN 'sender'
             WHEN nakliyeci_id = $2 OR carrier_id = $2 THEN 'carrier'
             WHEN tasiyici_id = $2 OR driver_id = $2 THEN 'driver'
             ELSE 'none'
           END as rated_role
           FROM shipments 
           WHERE id = $3 LIMIT 1`,
          [raterId, ratedUserId, shipmentId]
        );

        const shipment = shipmentRes.rows?.[0];
        if (!shipment) {
          return res.status(404).json({ success: false, message: 'Gönderi bulunamadı' });
        }

        // 🔒 SECURITY CHECK 3: Only allow rating after shipment completion
        const completedStatuses = ['delivered', 'completed', 'closed'];
        if (!completedStatuses.includes(shipment.status?.toLowerCase())) {
          return res.status(403).json({ success: false, message: 'Gönderi tamamlanmadan değerlendirme yapılamaz' });
        }

        // 🔒 SECURITY CHECK 4: Relationship validation - only involved parties can rate
        if (shipment.rater_role === 'none' || shipment.rated_role === 'none') {
          return res.status(403).json({ success: false, message: 'Bu gönderiye dahil olmayan kullanıcıları değerlendiremezsiniz' });
        }

        // 🔒 SECURITY CHECK 5: Business logic validation - valid rating relationships
        const validRatingRelations = [
          // Sender can rate carrier/driver
          { rater: 'sender', rated: 'carrier' },
          { rater: 'sender', rated: 'driver' },
          // Carrier can rate sender/driver
          { rater: 'carrier', rated: 'sender' },
          { rater: 'carrier', rated: 'driver' },
          // Driver can rate sender/carrier
          { rater: 'driver', rated: 'sender' },
          { rater: 'driver', rated: 'carrier' }
        ];

        const isValidRelation = validRatingRelations.some(
          rel => rel.rater === shipment.rater_role && rel.rated === shipment.rated_role
        );

        if (!isValidRelation) {
          return res.status(403).json({ success: false, message: 'Bu kullanıcı tipini değerlendirme yetkiniz yok' });
        }
      }

      const ratings = await getRatingsCols();
      const { cols } = ratings;
      if (!cols.ratedIdCol || !cols.raterIdCol || !cols.ratingCol) {
        return res.status(500).json({ success: false, message: 'Ratings schema not compatible' });
      }

      // If there's already a rating for this (rater, rated, shipment) update it; otherwise insert.
      const where = [`${ratings.qCol(cols.ratedIdCol)} = $1`, `${ratings.qCol(cols.raterIdCol)} = $2`];
      const params = [ratedUserId, raterId];
      if (cols.shipmentIdCol && shipmentId) {
        params.push(shipmentId);
        where.push(`${ratings.qCol(cols.shipmentIdCol)} = $${params.length}`);
      } else if (cols.shipmentIdCol && !shipmentId) {
        where.push(`${ratings.qCol(cols.shipmentIdCol)} IS NULL`);
      }

      const existingRes = await pool.query(
        `SELECT ${ratings.qCol(cols.idCol || 'id')} as id
         FROM "${ratings.schema}".ratings
         WHERE ${where.join(' AND ')}
         LIMIT 1`,
        params
      );
      const existing = existingRes.rows && existingRes.rows[0] ? existingRes.rows[0] : null;

      const nowExpr = 'CURRENT_TIMESTAMP';

      if (existing?.id) {
        const updParts = [];
        const updParams = [ratingValue];
        updParts.push(`${ratings.qCol(cols.ratingCol)} = $1`);
        if (cols.commentCol) {
          updParams.push(comment);
          updParts.push(`${ratings.qCol(cols.commentCol)} = $${updParams.length}`);
        }
        if (cols.updatedAtCol) {
          updParts.push(`${ratings.qCol(cols.updatedAtCol)} = ${nowExpr}`);
        }
        updParams.push(existing.id);

        const updQ = `UPDATE "${ratings.schema}".ratings
                      SET ${updParts.join(', ')}
                      WHERE ${ratings.qCol(cols.idCol || 'id')} = $${updParams.length}
                      RETURNING ${ratings.qCol(cols.idCol || 'id')} as id, ${ratings.qCol(cols.ratingCol)} as rating${cols.commentCol ? `, ${ratings.qCol(cols.commentCol)} as comment` : `, '' as comment`}`;
        const updRes = await pool.query(updQ, updParams);
        return res.json({ success: true, data: updRes.rows?.[0] || { id: existing.id, rating: ratingValue, comment } });
      }

      const insertCols = [ratings.qCol(cols.ratedIdCol), ratings.qCol(cols.raterIdCol), ratings.qCol(cols.ratingCol)];
      const insertVals = ['$1', '$2', '$3'];
      const insertParams = [ratedUserId, raterId, ratingValue];

      if (cols.commentCol) {
        insertCols.push(ratings.qCol(cols.commentCol));
        insertParams.push(comment);
        insertVals.push(`$${insertParams.length}`);
      }
      if (cols.shipmentIdCol && shipmentId) {
        insertCols.push(ratings.qCol(cols.shipmentIdCol));
        insertParams.push(shipmentId);
        insertVals.push(`$${insertParams.length}`);
      }
      if (cols.createdAtCol) {
        insertCols.push(ratings.qCol(cols.createdAtCol));
        insertVals.push(nowExpr);
      }
      if (cols.updatedAtCol) {
        insertCols.push(ratings.qCol(cols.updatedAtCol));
        insertVals.push(nowExpr);
      }

      const retCols = [`${ratings.qCol(cols.idCol || 'id')} as id`, `${ratings.qCol(cols.ratingCol)} as rating`];
      if (cols.commentCol) retCols.push(`${ratings.qCol(cols.commentCol)} as comment`);
      if (cols.createdAtCol) retCols.push(`${ratings.qCol(cols.createdAtCol)} as created_at`);

      const insQ = `INSERT INTO "${ratings.schema}".ratings (${insertCols.join(', ')})
                    VALUES (${insertVals.join(', ')})
                    RETURNING ${retCols.join(', ')}`;

      const insRes = await pool.query(insQ, insertParams);
      return res.json({ success: true, data: insRes.rows?.[0] || null });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Değerlendirme gönderilemedi', error: error.message });
    }
  });

  return router;
}

module.exports = createRatingsRoutes;
