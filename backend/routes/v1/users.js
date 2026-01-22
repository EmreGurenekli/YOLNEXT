const express = require('express');
const bcrypt = require('bcrypt');

function createUsersRoutes(pool, authenticateToken) {
  const router = express.Router();

  const jsonBody = express.json({ limit: '2mb' });

  const safeJson = (value) => {
    if (value == null) return null;
    if (typeof value === 'object') return value;
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  };

  const normalizeProfileRow = (row) => {
    if (!row) return null;
    const fullName = row.fullName || row.full_name || row.name || null;

    return {
      id: row.id,
      email: row.email,
      fullName,
      role: row.role || row.user_type || row.userType,
      phone: row.phone || null,
      address: row.address || null,
      city: row.city || null,
      district: row.district || null,
      companyName: row.companyName || row.company_name || null,
      taxNumber: row.taxNumber || row.tax_number || null,
      driverCode: row.driverCode || row.driver_code || null,
      nakliyeciCode: row.nakliyeciCode || row.nakliyeci_code || null,
      avatar: row.avatar || row.avatar_url || null,
      preferences: safeJson(row.preferences) || null,
      createdAt: row.createdAt || row.created_at || null,
      updatedAt: row.updatedAt || row.updated_at || null,
    };
  };

  // GET /api/users/profile
  router.get('/profile', authenticateToken, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      if (!pool) {
        return res.json({
          success: true,
          data: {
            user: {
              id: userId,
              email: req.user?.email || null,
              fullName: req.user?.email ? String(req.user.email).split('@')[0] : null,
              role: req.user?.role || null,
            },
          },
        });
      }

      // Schema-aware: select only columns that exist in the current DB
      const tRes = await pool.query(
        `SELECT table_schema
         FROM information_schema.tables
         WHERE table_name = 'users'
         ORDER BY (table_schema = 'public') DESC, table_schema ASC
         LIMIT 1`
      );
      const uSchema = tRes.rows && tRes.rows[0]?.table_schema ? tRes.rows[0].table_schema : 'public';

      const colsRes = await pool.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND table_schema = $1`,
        [uSchema]
      );
      const cols = new Set((colsRes.rows || []).map(r => r.column_name));
      const pickCol = (...names) => names.find(n => cols.has(n)) || null;
      const qCol = (c) => (c && /[A-Z]/.test(c) ? `"${c}"` : c);

      const idCol = pickCol('id') || 'id';
      const emailCol = pickCol('email');
      const roleCol = pickCol('role', 'panel_type', 'panelType', 'user_type', 'userType');
      const fullNameCol = pickCol('fullName', 'full_name', 'name');
      const companyNameCol = pickCol('companyName', 'company_name');
      const taxNumberCol = pickCol('taxNumber', 'tax_number');
      const phoneCol = pickCol('phone');
      const addressCol = pickCol('address');
      const cityCol = pickCol('city');
      const districtCol = pickCol('district');
      const driverCodeCol = pickCol('driverCode', 'driver_code', 'drivercode');
      const nakliyeciCodeCol = pickCol('nakliyeciCode', 'nakliyeci_code', 'nakliyecicode');
      const avatarCol = pickCol('avatar', 'avatar_url');
      const preferencesCol = pickCol('preferences');
      const createdAtCol = pickCol('createdAt', 'created_at');
      const updatedAtCol = pickCol('updatedAt', 'updated_at');

      const selectParts = [];
      selectParts.push(`${qCol(idCol)} as id`);
      if (emailCol) selectParts.push(`${qCol(emailCol)} as email`);
      if (roleCol) selectParts.push(`${qCol(roleCol)} as role`);
      if (fullNameCol) selectParts.push(`${qCol(fullNameCol)} as "fullName"`);
      if (companyNameCol) selectParts.push(`${qCol(companyNameCol)} as "companyName"`);
      if (taxNumberCol) selectParts.push(`${qCol(taxNumberCol)} as "taxNumber"`);
      if (phoneCol) selectParts.push(`${qCol(phoneCol)} as phone`);
      if (addressCol) selectParts.push(`${qCol(addressCol)} as address`);
      if (cityCol) selectParts.push(`${qCol(cityCol)} as city`);
      if (districtCol) selectParts.push(`${qCol(districtCol)} as district`);
      if (driverCodeCol) selectParts.push(`${qCol(driverCodeCol)} as "driverCode"`);
      if (nakliyeciCodeCol) selectParts.push(`${qCol(nakliyeciCodeCol)} as "nakliyeciCode"`);
      if (avatarCol) selectParts.push(`${qCol(avatarCol)} as avatar`);
      if (preferencesCol) selectParts.push(`${qCol(preferencesCol)} as preferences`);
      if (createdAtCol) selectParts.push(`${qCol(createdAtCol)} as "createdAt"`);
      if (updatedAtCol) selectParts.push(`${qCol(updatedAtCol)} as "updatedAt"`);

      const result = await pool.query(
        `SELECT ${selectParts.join(', ')}
         FROM "${uSchema}".users
         WHERE ${qCol(idCol)} = $1`,
        [userId]
      );

      if (!result.rows || result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const user = normalizeProfileRow(result.rows[0]);

      // Ensure legacy users have required share codes
      try {
        const normalizedRole = String(user?.role || '').toLowerCase();
        const usersTable = `"${uSchema}".users`;

        const genRandom = (min, max) => Math.floor(min + Math.random() * (max - min + 1));

        const ensureUniqueCode = async (columnName, prefix) => {
          if (!columnName) return null;
          const colExpr = qCol(columnName);
          const maxAttempts = 30;
          for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
            const randomNum = genRandom(10000, 99999);
            const candidate = `${prefix}-${randomNum}`;
            const exists = await pool.query(
              `SELECT 1 FROM ${usersTable} WHERE ${colExpr} = $1 LIMIT 1`,
              [candidate]
            );
            if (!exists.rows || exists.rows.length === 0) {
              await pool.query(
                `UPDATE ${usersTable} SET ${colExpr} = $1 WHERE ${qCol(idCol)} = $2`,
                [candidate, userId]
              );
              return candidate;
            }
          }
          return null;
        };

        if (normalizedRole === 'nakliyeci' && !user?.nakliyeciCode) {
          const created = await ensureUniqueCode(nakliyeciCodeCol, 'YN');
          if (created) {
            user.nakliyeciCode = created;
          }
        }

        if (normalizedRole === 'tasiyici' && !user?.driverCode) {
          const created = await ensureUniqueCode(driverCodeCol, 'YD');
          if (created) {
            user.driverCode = created;
          }
        }
      } catch (_) {
        // best-effort only
      }

      // Ensure consistent defaults for UI
      user.averageRating = 0;
      user.totalRatings = 0;

      // Best-effort rating summary for profile cards
      if (pool && userId) {
        try {
          const tRes = await pool.query(
            `SELECT table_schema
             FROM information_schema.tables
             WHERE table_name = 'ratings'
             ORDER BY (table_schema = 'public') DESC, table_schema ASC
             LIMIT 1`
          );
          const rSchema = tRes.rows && tRes.rows[0]?.table_schema ? tRes.rows[0].table_schema : 'public';
          const colsRes = await pool.query(
            `SELECT column_name FROM information_schema.columns WHERE table_name = 'ratings' AND table_schema = $1`,
            [rSchema]
          );
          const cols = new Set((colsRes.rows || []).map(r => r.column_name));
          const pickCol = (...names) => names.find(n => cols.has(n)) || null;
          const ratedIdCol = pickCol('ratedId', 'rated_id', 'ratee_id', 'rated_user_id', 'ratedUserId');
          const ratingCol = pickCol('rating');
          const qCol = (c) => (c && /[A-Z]/.test(c) ? `"${c}"` : c);

          if (ratedIdCol && ratingCol) {
            const ratedExpr = qCol(ratedIdCol);
            const ratingExpr = qCol(ratingCol);
            const q = `SELECT AVG(${ratingExpr})::numeric(10,2) as avg, COUNT(*)::integer as cnt FROM "${rSchema}".ratings WHERE ${ratedExpr} = $1`;
            const agg = await pool.query(q, [userId]);
            const row = agg.rows && agg.rows[0] ? agg.rows[0] : null;
            if (row) {
              user.averageRating = Number(row.avg || 0) || 0;
              user.totalRatings = Number(row.cnt || 0) || 0;
            }
          }
        } catch (_) {
          // ignore
        }
      }

      const wantDebug = String(req.query?.debug || '') === '1' && process.env.NODE_ENV !== 'production';
      if (wantDebug) {
        return res.json({
          success: true,
          data: {
            user,
            meta: {
              usersSchema: uSchema,
              roleCol,
              nakliyeciCodeCol,
              driverCodeCol,
            },
          },
          user,
        });
      }

      return res.json({ success: true, data: { user }, user });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to load profile', details: error.message });
    }
  });

  // PUT /api/users/profile
  router.put('/profile', authenticateToken, jsonBody, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }
      if (!pool) {
        return res.json({ success: true, message: 'Profile updated (no-db)', data: { user: { id: userId, ...req.body } } });
      }

      const body = req.body || {};

      const allowed = {
        fullName: body.fullName ?? body.name ?? null,
        phone: body.phone ?? null,
        address: body.address ?? null,
        city: body.city ?? null,
        district: body.district ?? null,
        companyName: body.companyName ?? null,
        taxNumber: body.taxNumber ?? null,
      };

      // Determine column style
      const colsRes = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND table_schema = 'public'`);
      const cols = new Set((colsRes.rows || []).map(r => r.column_name));
      const hasCamel = cols.has('fullName') || cols.has('companyName') || cols.has('updatedAt');

      const setParts = [];
      const params = [];
      const pushSet = (col, value) => {
        if (value === undefined) return;
        if (value === null) return;
        params.push(value);
        const expr = /[A-Z]/.test(col) ? `"${col}"` : col;
        setParts.push(`${expr} = $${params.length}`);
      };

      if (hasCamel) {
        pushSet('fullName', allowed.fullName);
        pushSet('phone', allowed.phone);
        pushSet('address', allowed.address);
        pushSet('city', allowed.city);
        pushSet('district', allowed.district);
        pushSet('companyName', allowed.companyName);
        pushSet('taxNumber', allowed.taxNumber);
        setParts.push('"updatedAt" = CURRENT_TIMESTAMP');
      } else {
        pushSet('full_name', allowed.fullName);
        pushSet('phone', allowed.phone);
        pushSet('address', allowed.address);
        pushSet('city', allowed.city);
        pushSet('district', allowed.district);
        pushSet('company_name', allowed.companyName);
        pushSet('tax_number', allowed.taxNumber);
        setParts.push('updated_at = CURRENT_TIMESTAMP');
      }

      if (setParts.length === 0) {
        // Nothing to update
        return res.json({ success: true, message: 'No changes', data: { user: { id: userId } } });
      }

      params.push(userId);
      await pool.query(`UPDATE users SET ${setParts.join(', ')} WHERE id = $${params.length}`, params);

      // Return updated profile
      const profileRes = await pool.query(`SELECT * FROM users WHERE id = $1`, [userId]);
      const user = normalizeProfileRow(profileRes.rows[0]);
      return res.json({ success: true, message: 'Profile updated', data: { user }, user });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to update profile', details: error.message });
    }
  });

  // PUT /api/users/change-password
  router.put('/change-password', authenticateToken, jsonBody, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const { currentPassword, oldPassword, password, newPassword } = req.body || {};
      const oldPw = currentPassword || oldPassword;
      const newPw = newPassword || password;

      if (!oldPw || !newPw) {
        return res.status(400).json({ success: false, message: 'currentPassword and newPassword are required' });
      }
      if (String(newPw).length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
      }

      if (!pool) {
        return res.json({ success: true, message: 'Password updated (no-db)' });
      }

      const userRes = await pool.query('SELECT password FROM users WHERE id = $1', [userId]);
      if (!userRes.rows || userRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const hash = userRes.rows[0].password;
      const ok = await bcrypt.compare(String(oldPw), String(hash || ''));
      if (!ok) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect' });
      }

      const newHash = await bcrypt.hash(String(newPw), 10);
      try {
        await pool.query('UPDATE users SET password = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $2', [newHash, userId]);
      } catch (_eCamel) {
        await pool.query('UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newHash, userId]);
      }

      return res.json({ success: true, message: 'Password updated' });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to change password', details: error.message });
    }
  });

  // POST /api/users/avatar (best-effort, no multer dependency here)
  router.post('/avatar', authenticateToken, async (_req, res) => {
    return res.status(501).json({ success: false, message: 'Avatar upload not configured in this route' });
  });

  // DELETE /api/users/account
  router.delete('/account', authenticateToken, jsonBody, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const { password } = req.body || {};
      if (!password) {
        return res.status(400).json({ success: false, message: 'Şifre gereklidir' });
      }

      if (!pool) {
        return res.json({ success: true, message: 'Account deletion requested (no-db)' });
      }

      const userRes = await pool.query('SELECT password FROM users WHERE id = $1', [userId]);
      if (!userRes.rows || userRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const ok = await bcrypt.compare(String(password), String(userRes.rows[0].password || ''));
      if (!ok) {
        return res.status(400).json({ success: false, message: 'Şifre yanlış' });
      }

      // Soft-delete if column exists; otherwise hard-delete.
      const colsRes = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND table_schema = 'public'`);
      const cols = new Set((colsRes.rows || []).map(r => r.column_name));

      if (cols.has('isActive')) {
        await pool.query('UPDATE users SET "isActive" = false, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $1', [userId]);
      } else if (cols.has('is_active')) {
        await pool.query('UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [userId]);
      } else {
        await pool.query('DELETE FROM users WHERE id = $1', [userId]);
      }

      return res.json({ success: true, message: 'Hesap silindi' });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Hesap silme başarısız', details: error.message });
    }
  });

  return router;
}

module.exports = createUsersRoutes;
