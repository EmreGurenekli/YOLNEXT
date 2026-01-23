// Corporate carriers routes
const express = require('express');

function createCarrierRoutes(pool, authenticateToken) {
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

  let cachedUsersCols = undefined;
  const resolveUsersCols = async () => {
    if (cachedUsersCols !== undefined) return cachedUsersCols;
    try {
      const meta = await resolveTable('users');
      cachedUsersCols = {
        schema: meta.schema,
        qCol: meta.qCol,
        fullName: meta.pickCol('fullName', 'full_name', 'name'),
        companyName: meta.pickCol('companyName', 'company_name'),
        email: meta.pickCol('email', 'emailAddress', 'email_address', 'mail'),
        phone: meta.pickCol('phone', 'phone_number', 'phoneNumber', 'mobile', 'mobile_phone'),
        city: meta.pickCol('city'),
        district: meta.pickCol('district'),
        nakliyeciCode: meta.pickCol('nakliyeciCode', 'nakliyeci_code'),
      };
    } catch (_) {
      cachedUsersCols = {
        schema: 'public',
        qCol: (c) => (c && /[A-Z]/.test(c) ? `"${c}"` : c),
        fullName: null,
        companyName: null,
        email: 'email',
        phone: null,
        city: null,
        district: null,
        nakliyeciCode: null,
      };
    }
    return cachedUsersCols;
  };

  let cachedCcCols = undefined;
  const resolveCorporateCarriersCols = async () => {
    if (cachedCcCols !== undefined) return cachedCcCols;
    try {
      const meta = await resolveTable('corporate_carriers');
      cachedCcCols = {
        schema: meta.schema,
        qCol: meta.qCol,
        corporateId: meta.pickCol(
          'corporate_id',
          'corporateId',
          'corporateid',
          'corporate_user_id',
          'corporateUserId',
          'corporateuserid',
          'company_id',
          'companyId',
          'user_id',
          'userId'
        ),
        nakliyeciId: meta.pickCol(
          'nakliyeci_id',
          'nakliyeciId',
          'nakliyeciid',
          'nakliyeci_user_id',
          'nakliyeciUserId',
          'carrier_id',
          'carrierId',
          'carrierid',
          'user_id2',
          'user2_id'
        ),
        createdAt: meta.pickCol('createdAt', 'created_at', 'createdat'),
        updatedAt: meta.pickCol('updatedAt', 'updated_at', 'updatedat'),
      };
    } catch (_) {
      cachedCcCols = {
        schema: 'public',
        qCol: (c) => (c && /[A-Z]/.test(c) ? `"${c}"` : c),
        corporateId: 'corporate_id',
        nakliyeciId: 'nakliyeci_id',
        createdAt: null,
        updatedAt: null,
      };
    }
    return cachedCcCols;
  };

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

      const wantDebug = String(req.query?.debug || '') === '1' && process.env.NODE_ENV !== 'production';

      const userId = req.user.id;

      const usersMeta = await resolveUsersCols();
      const ccMeta = await resolveCorporateCarriersCols();

      // Verify user is corporate
      const userResult = await pool.query(`SELECT role FROM "${usersMeta.schema}".users WHERE id = $1`, [userId]);

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
        if (!ccMeta.corporateId || !ccMeta.nakliyeciId) {
          carriersResult = { rows: [] };
        } else {
          const uFullName = usersMeta.fullName ? `u.${usersMeta.qCol(usersMeta.fullName)}` : 'NULL';
          const uCompany = usersMeta.companyName ? `u.${usersMeta.qCol(usersMeta.companyName)}` : 'NULL';
          const uEmail = usersMeta.email ? `u.${usersMeta.qCol(usersMeta.email)}` : 'NULL';
          const uPhone = usersMeta.phone ? `u.${usersMeta.qCol(usersMeta.phone)}` : 'NULL';
          const uCity = usersMeta.city ? `u.${usersMeta.qCol(usersMeta.city)}` : 'NULL';
          const uDistrict = usersMeta.district ? `u.${usersMeta.qCol(usersMeta.district)}` : 'NULL';
          const uCode = usersMeta.nakliyeciCode ? `u.${usersMeta.qCol(usersMeta.nakliyeciCode)}` : 'NULL';
          const orderExpr = ccMeta.createdAt ? `cc.${ccMeta.qCol(ccMeta.createdAt)}` : 'cc.id';

          carriersResult = await pool.query(
            `SELECT
              u.id,
              ${uFullName} as "fullName",
              ${uCompany} as "companyName",
              ${uEmail} as email,
              ${uPhone} as phone,
              ${uCity} as city,
              ${uDistrict} as district,
              ${uCode} as "nakliyeciCode"
             FROM "${usersMeta.schema}".users u
             INNER JOIN "${ccMeta.schema}".corporate_carriers cc
               ON u.id = cc.${ccMeta.qCol(ccMeta.nakliyeciId)}
             WHERE cc.${ccMeta.qCol(ccMeta.corporateId)} = $1
               AND u.role = 'nakliyeci'
             ORDER BY ${orderExpr} DESC`,
            [userId]
          );
        }
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
          ...(wantDebug
            ? {
                meta: {
                  corporateCarriers: {
                    schema: ccMeta.schema,
                    corporateId: ccMeta.corporateId,
                    nakliyeciId: ccMeta.nakliyeciId,
                    createdAt: ccMeta.createdAt,
                    updatedAt: ccMeta.updatedAt,
                  },
                },
              }
            : {}),
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

      const wantDebug = String(req.query?.debug || '') === '1' && process.env.NODE_ENV !== 'production';

      const userId = req.user.id;
      const { code, email } = req.body;

      const usersMeta = await resolveUsersCols();
      const ccMeta = await resolveCorporateCarriersCols();

      if (!code && !email) {
        return res.status(400).json({
          success: false,
          message: 'Nakliyeci kodu veya e-posta gereklidir',
        });
      }

      // Verify user is corporate
      const userResult = await pool.query(
        `SELECT role FROM "${usersMeta.schema}".users WHERE id = $1`,
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
        const emailCol = usersMeta.email ? usersMeta.qCol(usersMeta.email) : 'email';
        const fullNameCol = usersMeta.fullName ? usersMeta.qCol(usersMeta.fullName) : null;
        const companyCol = usersMeta.companyName ? usersMeta.qCol(usersMeta.companyName) : null;
        const phoneCol = usersMeta.phone ? usersMeta.qCol(usersMeta.phone) : null;
        const codeCol = usersMeta.nakliyeciCode ? usersMeta.qCol(usersMeta.nakliyeciCode) : null;
        const selectParts = [
          'id',
          fullNameCol ? `${fullNameCol} as "fullName"` : 'NULL as "fullName"',
          companyCol ? `${companyCol} as "companyName"` : 'NULL as "companyName"',
          `${emailCol} as email`,
          phoneCol ? `${phoneCol} as phone` : 'NULL as phone',
          'role',
          codeCol ? `${codeCol} as "nakliyeciCode"` : 'NULL as "nakliyeciCode"',
        ];
        const nakliyeciResult = await pool.query(
          `SELECT ${selectParts.join(', ')}
           FROM "${usersMeta.schema}".users
           WHERE LOWER(${emailCol}) = $1 AND role = 'nakliyeci'`,
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
            `SELECT id
                    ${usersMeta.fullName ? `, ${usersMeta.qCol(usersMeta.fullName)} as "fullName"` : ', NULL as "fullName"'}
                    ${usersMeta.companyName ? `, ${usersMeta.qCol(usersMeta.companyName)} as "companyName"` : ', NULL as "companyName"'}
                    , ${usersMeta.email ? `${usersMeta.qCol(usersMeta.email)} as email` : 'NULL as email'}
                    ${usersMeta.phone ? `, ${usersMeta.qCol(usersMeta.phone)} as phone` : ', NULL as phone'}
                    , role
                    ${usersMeta.nakliyeciCode ? `, ${usersMeta.qCol(usersMeta.nakliyeciCode)} as "nakliyeciCode"` : ', NULL as "nakliyeciCode"'}
             FROM "${usersMeta.schema}".users
             WHERE id = $1 AND role = 'nakliyeci'`,
            [parsedId]
          );
        } else {
          // Search by nakliyeciCode (string)
          nakliyeciResult = await pool.query(
            `SELECT id
                    ${usersMeta.fullName ? `, ${usersMeta.qCol(usersMeta.fullName)} as "fullName"` : ', NULL as "fullName"'}
                    ${usersMeta.companyName ? `, ${usersMeta.qCol(usersMeta.companyName)} as "companyName"` : ', NULL as "companyName"'}
                    , ${usersMeta.email ? `${usersMeta.qCol(usersMeta.email)} as email` : 'NULL as email'}
                    ${usersMeta.phone ? `, ${usersMeta.qCol(usersMeta.phone)} as phone` : ', NULL as phone'}
                    , role
                    ${usersMeta.nakliyeciCode ? `, ${usersMeta.qCol(usersMeta.nakliyeciCode)} as "nakliyeciCode"` : ', NULL as "nakliyeciCode"'}
             FROM "${usersMeta.schema}".users
             WHERE ${usersMeta.nakliyeciCode ? usersMeta.qCol(usersMeta.nakliyeciCode) : '"nakliyeciCode"'} = $1 AND role = 'nakliyeci'`,
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
      if (!ccMeta.corporateId || !ccMeta.nakliyeciId) {
        return res.status(500).json({
          success: false,
          message: 'corporate_carriers şeması uyumsuz',
          ...(wantDebug
            ? {
                meta: {
                  corporateCarriers: {
                    schema: ccMeta.schema,
                    corporateId: ccMeta.corporateId,
                    nakliyeciId: ccMeta.nakliyeciId,
                    createdAt: ccMeta.createdAt,
                    updatedAt: ccMeta.updatedAt,
                  },
                },
              }
            : {}),
        });
      }

      const existingLink = await pool.query(
        `SELECT id FROM "${ccMeta.schema}".corporate_carriers
         WHERE ${ccMeta.qCol(ccMeta.corporateId)} = $1 AND ${ccMeta.qCol(ccMeta.nakliyeciId)} = $2`,
        [userId, nakliyeciUser.id]
      );

      if (existingLink.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Bu nakliyeci zaten favorilerinize eklenmiş',
        });
      }

      // Create corporate-nakliyeci relationship
      const insertCols = [ccMeta.qCol(ccMeta.corporateId), ccMeta.qCol(ccMeta.nakliyeciId)];
      const insertVals = ['$1', '$2'];
      if (ccMeta.createdAt) {
        insertCols.push(ccMeta.qCol(ccMeta.createdAt));
        insertVals.push('CURRENT_TIMESTAMP');
      }
      if (ccMeta.updatedAt) {
        insertCols.push(ccMeta.qCol(ccMeta.updatedAt));
        insertVals.push('CURRENT_TIMESTAMP');
      }
      await pool.query(
        `INSERT INTO "${ccMeta.schema}".corporate_carriers (${insertCols.join(', ')})
         VALUES (${insertVals.join(', ')})`,
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

      const usersMeta = await resolveUsersCols();
      const ccMeta = await resolveCorporateCarriersCols();

      if (!nakliyeciId || isNaN(nakliyeciId)) {
        return res.status(400).json({
          success: false,
          message: 'Geçerli bir nakliyeci ID gereklidir',
        });
      }

      // Verify user is corporate
      const userResult = await pool.query(
        `SELECT role FROM "${usersMeta.schema}".users WHERE id = $1`,
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
      if (!ccMeta.corporateId || !ccMeta.nakliyeciId) {
        return res.status(500).json({ success: false, message: 'corporate_carriers şeması uyumsuz' });
      }

      const existingLink = await pool.query(
        `SELECT id FROM "${ccMeta.schema}".corporate_carriers
         WHERE ${ccMeta.qCol(ccMeta.corporateId)} = $1 AND ${ccMeta.qCol(ccMeta.nakliyeciId)} = $2`,
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
        `DELETE FROM "${ccMeta.schema}".corporate_carriers
         WHERE ${ccMeta.qCol(ccMeta.corporateId)} = $1 AND ${ccMeta.qCol(ccMeta.nakliyeciId)} = $2`,
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

