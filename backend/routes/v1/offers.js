// Offers routes - Modular version
const express = require('express');
const router = express.Router();

const { clearCachePattern } = require('../../utils/cache');
const { getPagination } = require('../../utils/routeHelpers');

function createOfferRoutes(pool, a1, a2, a3, a4, a5, a6, a7, a8) {
  const router = require('express').Router();

  // Support multiple call signatures (older route module vs server-modular wiring)
  // Signature A (route module): (pool, io, authenticateToken, offerSpeedLimiter, idempotencyGuard, createNotification, clearCachePattern)
  // Signature B (server-modular): (pool, authenticateToken, createNotification, sendEmail, sendSMS, writeAuditLog, offerSpeedLimiter, idempotencyGuard, io)
  let io = null;
  let authenticateToken = null;
  let offerSpeedLimiter = null;
  let idempotencyGuard = null;
  let createNotification = null;
  let clearCachePatternFn = clearCachePattern;

  const looksLikeIo = (v) => v && typeof v === 'object' && typeof v.to === 'function';

  if (looksLikeIo(a1)) {
    io = a1;
    authenticateToken = a2;
    offerSpeedLimiter = a3;
    idempotencyGuard = a4;
    createNotification = a5;
    clearCachePatternFn = a6 || clearCachePatternFn;
  } else {
    authenticateToken = a1;
    createNotification = a2;
    offerSpeedLimiter = a6;
    idempotencyGuard = a7;
    io = a8 || null;
  }

  const commissionPercentage = 0.01;

  let cachedUsersCompanyCol = null;
  let cachedUsersSchema = null;
  const resolveUsersCompanyCol = async () => {
    if (cachedUsersCompanyCol !== null) {
      return { schema: cachedUsersSchema || 'public', col: cachedUsersCompanyCol };
    }
    try {
      const tRes = await pool.query(
        `SELECT table_schema
         FROM information_schema.tables
         WHERE table_name = 'users'
         ORDER BY (table_schema = 'public') DESC, table_schema ASC
         LIMIT 1`
      );
      const schema = tRes.rows && tRes.rows[0]?.table_schema ? tRes.rows[0].table_schema : 'public';
      cachedUsersSchema = schema;
      const colsRes = await pool.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND table_schema = $1`,
        [schema]
      );
      const cols = new Set((colsRes.rows || []).map(r => r.column_name));
      if (cols.has('companyName')) {
        cachedUsersCompanyCol = '"companyName"';
      } else if (cols.has('company_name')) {
        cachedUsersCompanyCol = 'company_name';
      } else {
        cachedUsersCompanyCol = null;
      }
    } catch (_) {
      cachedUsersCompanyCol = null;
      cachedUsersSchema = cachedUsersSchema || 'public';
    }
    return { schema: cachedUsersSchema || 'public', col: cachedUsersCompanyCol };
  };

  let cachedUsersAuthCols = undefined;
  const resolveUsersAuthCols = async () => {
    if (cachedUsersAuthCols !== undefined) return cachedUsersAuthCols;
    try {
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
      const pick = (...names) => names.find(n => cols.has(n)) || null;
      cachedUsersAuthCols = {
        schema,
        id: pick('id'),
        email: pick('email', 'emailAddress', 'email_address', 'mail'),
        password: pick('password', 'password_hash', 'passwordHash'),
        role: pick('role', 'panel_type', 'userType', 'user_type'),
        isActive: pick('isActive', 'is_active'),
        createdAt: pick('createdAt', 'created_at'),
        updatedAt: pick('updatedAt', 'updated_at'),
      };
    } catch (_) {
      cachedUsersAuthCols = {
        schema: 'public',
        id: 'id',
        email: 'email',
        password: 'password',
        role: 'role',
        isActive: 'isActive',
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
      };
    }
    return cachedUsersAuthCols;
  };

  let cachedUsersNameExprs = undefined;
  const resolveUsersNameExprs = async () => {
    if (cachedUsersNameExprs !== undefined) return cachedUsersNameExprs;
    try {
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
      const has = (c) => c && cols.has(c);
      const qU = (c) => (c && /[A-Z]/.test(c) ? `"${c}"` : c);
      const pick = (...names) => names.find(n => cols.has(n)) || null;

      const fullName = pick('fullName', 'full_name', 'fullname', 'name');
      const firstName = pick('firstName', 'first_name', 'firstname');
      const lastName = pick('lastName', 'last_name', 'lastname');
      const email = pick('email', 'emailAddress', 'email_address', 'mail') || 'email';

      const build = (alias) => {
        const parts = [];
        if (fullName) parts.push(`${alias}.${qU(fullName)}`);
        parts.push(`${alias}.${qU(email)}`);
        if (firstName && lastName) {
          parts.push(`(${alias}.${qU(firstName)} || ' ' || ${alias}.${qU(lastName)})`);
        } else if (firstName) {
          parts.push(`${alias}.${qU(firstName)}`);
        }
        return `COALESCE(${parts.join(', ')})`;
      };

      cachedUsersNameExprs = {
        schema,
        build,
        hasFullName: has(fullName),
      };
    } catch (_) {
      cachedUsersNameExprs = {
        schema: 'public',
        build: (alias) => `COALESCE(${alias}.email)`
      };
    }
    return cachedUsersNameExprs;
  };

  const qUsersAuthCol = (c) => (c && /[A-Z]/.test(c) ? `"${c}"` : c);

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

    const email = user?.email || user?.userEmail;
    if (email) {
      const uCols = await resolveUsersAuthCols();
      const emailCol = uCols.email;
      try {
        if (emailCol) {
          const r = await pool.query(`SELECT id FROM users WHERE ${qUsersAuthCol(emailCol)} = $1 LIMIT 1`, [email]);
          if (r.rows && r.rows[0]?.id) return r.rows[0].id;
        }
      } catch (_) {
        // ignore
      }

      if (user?.isDemo) {
        try {
          const u = await resolveUsersAuthCols();
          const cols = [];
          const vals = [];
          const add = (col, val) => {
            if (!col) return;
            cols.push(qUsersAuthCol(col));
            vals.push(val);
          };

          add(u.email, email);
          add(u.password, '');
          add(u.role, String(user.role || 'nakliyeci'));
          add(u.isActive, true);
          add(u.createdAt, new Date());
          add(u.updatedAt, new Date());

          if (u.email && cols.length) {
            const placeholders = vals.map((_, i) => `$${i + 1}`).join(', ');
            const colList = cols.join(', ');
            const sql = `INSERT INTO users (${colList}) VALUES (${placeholders}) RETURNING id`;
            const created = await pool.query(sql, vals);
            if (created.rows && created.rows[0]?.id) return created.rows[0].id;
          }
        } catch (_) {
          // ignore
        }

        // Re-select in case another request inserted it first
        try {
          if (emailCol) {
            const r2 = await pool.query(`SELECT id FROM users WHERE ${qUsersAuthCol(emailCol)} = $1 LIMIT 1`, [email]);
            if (r2.rows && r2.rows[0]?.id) return r2.rows[0].id;
          }
        } catch (_) {
          // ignore
        }
      }
    }

    return null;
  };

  const userCompanyExpr = async (alias) => {
    const { col } = await resolveUsersCompanyCol();
    return col ? `${alias}.${col}` : 'NULL';
  };

  let cachedShipCols = undefined;
  const resolveShipCols = async () => {
    if (cachedShipCols !== undefined) return cachedShipCols;
    try {
      // IMPORTANT: Prefer the schema that actually contains shipment rows.
      // Some environments have multiple schemas; choosing public-first can select an empty schema
      // which breaks column detection (e.g. pickup_city_id) and downstream city joins.
      const schemasRes = await pool.query(
        `SELECT table_schema
         FROM information_schema.tables
         WHERE table_name = 'shipments'
         ORDER BY table_schema ASC`
      );
      const schemas = (schemasRes.rows || []).map(r => r.table_schema).filter(Boolean);
      let schema = schemas.includes('public') ? 'public' : (schemas[0] || 'public');
      for (const s of schemas) {
        try {
          const hasRow = await pool.query(`SELECT 1 FROM "${s}".shipments LIMIT 1`);
          if ((hasRow.rows || []).length > 0) {
            schema = s;
            break;
          }
        } catch (_) {
          // ignore
        }
      }
      const colsRes = await pool.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'shipments' AND table_schema = $1`,
        [schema]
      );
      const cols = new Set((colsRes.rows || []).map(r => r.column_name));
      const pick = (...names) => names.find(n => cols.has(n)) || null;
      cachedShipCols = {
        schema,
        // Keep both canonical keys and raw variants so COALESCE can include multiple when present
        userId: pick('userId'),
        user_id: pick('user_id'),
        userid: pick('userid'),
        userId: pick('userId'),
        userId: pick('userId'),
        ownerid: pick('ownerid'),
        carrierId: pick('carrierId', 'carrier_id', 'carrierid', 'nakliyeciId', 'nakliyeci_id', 'nakliyeciid'),
        status: pick('status'),
        pickupCity: pick('pickupCity', 'pickup_city', 'pickupcity', 'fromCity', 'from_city', 'fromcity', 'from'),
        fromCity: pick('fromCity', 'from_city', 'fromcity', 'from'),
        pickupCityId: pick('pickup_city_id', 'pickupCityId', 'pickupcityid', 'from_city_id', 'fromCityId', 'fromcityid'),
        deliveryCity: pick('deliveryCity', 'delivery_city', 'deliverycity', 'toCity', 'to_city', 'tocity', 'to'),
        toCity: pick('toCity', 'to_city', 'tocity', 'to'),
        deliveryCityId: pick('delivery_city_id', 'deliveryCityId', 'deliverycityid', 'to_city_id', 'toCityId', 'tocityid'),
        pickupAddress: pick('pickupAddress', 'pickup_address', 'pickupaddress', 'fromAddress', 'from_address', 'fromaddress'),
        deliveryAddress: pick('deliveryAddress', 'delivery_address', 'deliveryaddress', 'toAddress', 'to_address', 'toaddress'),
        weight: pick('weight', 'weight_kg'),
        dimensions: pick('dimensions'),
        specialRequirements: pick('specialRequirements', 'special_requirements'),
      };
    } catch (_) {
      cachedShipCols = {
        schema: 'public',
        userId: null,
        user_id: null,
        userid: null,
        userId: null,
        userId: null,
        ownerid: null,
        carrierId: null,
        status: null,
        pickupCity: null,
        fromCity: null,
        pickupCityId: null,
        deliveryCity: null,
        toCity: null,
        deliveryCityId: null,
        pickupAddress: null,
        deliveryAddress: null,
        weight: null,
        dimensions: null,
        specialRequirements: null,
      };
    }
    return cachedShipCols;
  };

  let cachedCitiesMeta = undefined;
  const resolveCitiesMeta = async () => {
    if (cachedCitiesMeta !== undefined) return cachedCitiesMeta;
    try {
      const schemasRes = await pool.query(
        `SELECT table_schema
         FROM information_schema.tables
         WHERE table_name = 'cities'
         ORDER BY table_schema ASC`
      );
      const schemas = (schemasRes.rows || []).map(r => r.table_schema).filter(Boolean);
      if (!schemas.length) {
        cachedCitiesMeta = { schema: null, idCol: null, nameCol: null };
        return cachedCitiesMeta;
      }

      let schema = null;
      // Prefer a schema that actually contains city rows.
      for (const s of schemas) {
        try {
          const hasRow = await pool.query(`SELECT 1 FROM "${s}".cities LIMIT 1`);
          if ((hasRow.rows || []).length > 0) {
            schema = s;
            break;
          }
        } catch (_) {
          // ignore
        }
      }
      // Fallback preference
      if (!schema) {
        schema = schemas.includes('public') ? 'public' : schemas[0];
      }

      const colsRes = await pool.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'cities' AND table_schema = $1`,
        [schema]
      );
      const cols = new Set((colsRes.rows || []).map(r => r.column_name));
      const pick = (...names) => names.find(n => cols.has(n)) || null;
      cachedCitiesMeta = {
        schema,
        idCol: pick('id', 'city_id', 'cityId', 'cityid'),
        nameCol: pick('name', 'city_name', 'cityName', 'cityname'),
      };
    } catch (_) {
      cachedCitiesMeta = { schema: null, idCol: null, nameCol: null };
    }
    return cachedCitiesMeta;
  };

  let cachedOfferCols = undefined;
  const resolveOfferCols = async () => {
    if (cachedOfferCols !== undefined) return cachedOfferCols;
    try {
      const tRes = await pool.query(
        `SELECT table_schema
         FROM information_schema.tables
         WHERE table_name = 'offers'
         ORDER BY (table_schema = 'public') DESC, table_schema ASC
         LIMIT 1`
      );
      const schema = tRes.rows && tRes.rows[0]?.table_schema ? tRes.rows[0].table_schema : 'public';
      const colsRes = await pool.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'offers' AND table_schema = $1`,
        [schema]
      );
      const cols = new Set((colsRes.rows || []).map(r => r.column_name));
      const pick = (...names) => names.find(n => cols.has(n)) || null;
      const qCol = (c) => (c && /[A-Z]/.test(c) ? `"${c}"` : c);

      cachedOfferCols = {
        schema,
        qCol,
        id: pick('id'),
        shipmentId: pick('shipment_id', 'shipmentId', 'shipmentid', 'shipmentID'),
        carrierId: pick('nakliyeci_id', 'carrier_id', 'carrierId', 'nakliyeciId', 'nakliyeciid'),
        price: pick('price'),
        message: pick('message'),
        estimatedDelivery: pick('estimatedDelivery', 'estimated_delivery', 'estimateddelivery'),
        status: pick('status'),
        createdAt: pick('createdAt', 'created_at', 'createdat'),
        updatedAt: pick('updatedAt', 'updated_at', 'updatedat'),
      };
    } catch (_) {
      cachedOfferCols = {
        schema: 'public',
        qCol: (c) => (c && /[A-Z]/.test(c) ? `"${c}"` : c),
        id: 'id',
        shipmentId: 'shipment_id',
        carrierId: 'nakliyeci_id',
        price: 'price',
        message: 'message',
        estimatedDelivery: 'estimatedDelivery',
        status: 'status',
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
      };
    }
    return cachedOfferCols;
  };

  const qShipCol = (c) => (c && /[A-Z]/.test(c) ? `"${c}"` : c);
  const shipOwnerExprFromMeta = (alias, meta) => {
    if (!meta) return 'NULL';
    const candidates = [];
    const add = (c) => {
      if (c) candidates.push(`${alias}.${qShipCol(c)}`);
    };
    // Prefer columns that are commonly populated in this codebase
    add(meta.userid);
    add(meta.userId);
    add(meta.user_id);
    add(meta.userId);
    add(meta.userId);
    // Deduplicate
    const uniq = [...new Set(candidates)];
    if (uniq.length === 0) return 'NULL';
    if (uniq.length === 1) return uniq[0];
    return `COALESCE(${uniq.join(', ')})`;
  };
  const shipExpr = async (alias, key) => {
    const cols = await resolveShipCols();
    const col = cols[key];
    return col ? `${alias}.${qShipCol(col)}` : 'NULL';
  };

  let cachedOffersCols = undefined;
  const resolveOffersCols = async () => {
    if (cachedOffersCols !== undefined) return cachedOffersCols;
    try {
      const tRes = await pool.query(
        `SELECT table_schema
         FROM information_schema.tables
         WHERE table_name = 'offers'
         ORDER BY (table_schema = 'public') DESC, table_schema ASC
         LIMIT 1`
      );
      const schema = tRes.rows && tRes.rows[0]?.table_schema ? tRes.rows[0].table_schema : 'public';
      const colsRes = await pool.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'offers' AND table_schema = $1`,
        [schema]
      );
      const cols = new Set((colsRes.rows || []).map(r => r.column_name));
      const pick = (...names) => names.find(n => cols.has(n)) || null;

      let estimatedDeliveryType = null;
      const estCol = pick('estimatedDelivery', 'estimated_delivery', 'estimateddelivery');
      try {
        if (estCol) {
          const t = await pool.query(
            `SELECT data_type
             FROM information_schema.columns
             WHERE table_name = 'offers' AND table_schema = $1 AND column_name = $2
             LIMIT 1`,
            [schema, estCol]
          );
          estimatedDeliveryType = t.rows && t.rows[0]?.data_type ? String(t.rows[0].data_type) : null;
        }
      } catch (_) {
        estimatedDeliveryType = null;
      }

      cachedOffersCols = {
        schema,
        id: pick('id'),
        shipmentId: pick('shipment_id', 'shipmentId', 'shipmentid'),
        carrierId: pick('nakliyeci_id', 'carrier_id', 'carrierId', 'carrierid', 'nakliyeciId', 'nakliyeciid'),
        price: pick('price'),
        message: pick('message'),
        estimatedDelivery: estCol,
        estimatedDeliveryType,
        status: pick('status'),
        createdAt: pick('createdAt', 'created_at', 'createdat'),
        updatedAt: pick('updatedAt', 'updated_at', 'updatedat'),
      };
    } catch (_) {
      cachedOffersCols = {
        schema: 'public',
        id: 'id',
        shipmentId: 'shipment_id',
        carrierId: 'nakliyeci_id',
        price: 'price',
        message: 'message',
        estimatedDelivery: null,
        estimatedDeliveryType: null,
        status: 'status',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      };
    }
    return cachedOffersCols;
  };

  const qOfferCol = (c) => (c && /[A-Z]/.test(c) ? `"${c}"` : c);

  let cachedShipmentOwnerCol = undefined;
  const resolveShipmentsOwnerCol = async () => {
    if (cachedShipmentOwnerCol !== undefined) return cachedShipmentOwnerCol;
    try {
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
      const pick = (...names) => names.find(n => cols.has(n)) || null;
      cachedShipmentOwnerCol = pick('user_id', 'userId', 'userid', 'userId', 'userId', 'ownerid');
    } catch (_) {
      cachedShipmentOwnerCol = null;
    }
    return cachedShipmentOwnerCol;
  };

  let cachedShipmentOwnerExpr = undefined;
  const resolveShipmentsOwnerExprForOffers = async () => {
    if (cachedShipmentOwnerExpr !== undefined) return cachedShipmentOwnerExpr;
    try {
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
      const pick = (...names) => names.find(n => cols.has(n)) || null;

      const userIdCol = pick('userId');
      const useridCol = pick('userid');
      const ownerCol = pick('user_id', 'userId', 'userId', 'ownerid', 'userId', 'userid', 'user_id');

      if (userIdCol && useridCol && userIdCol !== useridCol) {
        cachedShipmentOwnerExpr = `COALESCE(s.${qShipCol(userIdCol)}, s.${qShipCol(useridCol)})`;
      } else if (ownerCol) {
        cachedShipmentOwnerExpr = `s.${qShipCol(ownerCol)}`;
      } else {
        cachedShipmentOwnerExpr = null;
      }
    } catch (_) {
      cachedShipmentOwnerExpr = null;
    }
    return cachedShipmentOwnerExpr;
  };

  const parseMoney = (v) => {
    const n = typeof v === 'number' ? v : parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  };

  const round2 = (n) => {
    const x = typeof n === 'number' ? n : parseFloat(n);
    if (!Number.isFinite(x)) return 0;
    return Math.round(x * 100) / 100;
  };

  const calcCommission = (offerPrice) => round2(parseMoney(offerPrice) * commissionPercentage);

  const reserveCommissionHold = async (client, carrierId, offerId, offerPrice) => {
    const commission = calcCommission(offerPrice);
    if (!(commission > 0)) return { commission: 0 };

    let walletResult;
    try {
      walletResult = await client.query(
        'SELECT balance, reserved_balance FROM wallets WHERE user_id = $1 FOR UPDATE',
        [carrierId]
      );
    } catch (e1) {
      try {
        walletResult = await client.query(
          'SELECT balance, reserved_balance FROM wallets WHERE userid = $1 FOR UPDATE',
          [carrierId]
        );
      } catch (e2) {
        walletResult = await client.query(
          'SELECT balance, reserved_balance FROM wallets WHERE "userId" = $1 FOR UPDATE',
          [carrierId]
        );
      }
    }

    if (!walletResult.rows || walletResult.rows.length === 0) {
      // Attempt to auto-create wallet row
      try {
        await client.query(
          'INSERT INTO wallets (user_id, balance, reserved_balance) VALUES ($1, 0, 0) ON CONFLICT (user_id) DO NOTHING',
          [carrierId]
        );
      } catch (eCreate1) {
        try {
          await client.query(
            'INSERT INTO wallets (userid, balance, reserved_balance) VALUES ($1, 0, 0) ON CONFLICT (userid) DO NOTHING',
            [carrierId]
          );
        } catch (eCreate2) {
          try {
            await client.query(
              'INSERT INTO wallets ("userId", balance, reserved_balance) VALUES ($1, 0, 0) ON CONFLICT ("userId") DO NOTHING',
              [carrierId]
            );
          } catch (_) {
            // ignore
          }
        }
      }

      try {
        walletResult = await client.query(
          'SELECT balance, reserved_balance FROM wallets WHERE user_id = $1 FOR UPDATE',
          [carrierId]
        );
      } catch (e1b) {
        try {
          walletResult = await client.query(
            'SELECT balance, reserved_balance FROM wallets WHERE userid = $1 FOR UPDATE',
            [carrierId]
          );
        } catch (e2b) {
          walletResult = await client.query(
            'SELECT balance, reserved_balance FROM wallets WHERE "userId" = $1 FOR UPDATE',
            [carrierId]
          );
        }
      }
    }

    if (!walletResult.rows || walletResult.rows.length === 0) {
      // Attempt to auto-create wallet row (defensive)
      try {
        await client.query(
          'INSERT INTO wallets (user_id, balance, reserved_balance) VALUES ($1, 0, 0) ON CONFLICT (user_id) DO NOTHING',
          [carrierId]
        );
      } catch (eCreate1) {
        try {
          await client.query(
            'INSERT INTO wallets (userid, balance, reserved_balance) VALUES ($1, 0, 0) ON CONFLICT (userid) DO NOTHING',
            [carrierId]
          );
        } catch (eCreate2) {
          try {
            await client.query(
              'INSERT INTO wallets ("userId", balance, reserved_balance) VALUES ($1, 0, 0) ON CONFLICT ("userId") DO NOTHING',
              [carrierId]
            );
          } catch (_) {
            // ignore
          }
        }
      }

      try {
        walletResult = await client.query(
          'SELECT reserved_balance FROM wallets WHERE user_id = $1 FOR UPDATE',
          [carrierId]
        );
      } catch (e1b) {
        try {
          walletResult = await client.query(
            'SELECT reserved_balance FROM wallets WHERE userid = $1 FOR UPDATE',
            [carrierId]
          );
        } catch (e2b) {
          walletResult = await client.query(
            'SELECT reserved_balance FROM wallets WHERE "userId" = $1 FOR UPDATE',
            [carrierId]
          );
        }
      }
    }

    if (!walletResult.rows || walletResult.rows.length === 0) {
      return { error: 'Nakliyeci cüzdanı bulunamadı' };
    }

    const currentBalance = parseMoney(walletResult.rows[0].balance);
    const currentReserved = parseMoney(walletResult.rows[0].reserved_balance);
    const available = currentBalance - currentReserved;

    if (!Number.isFinite(available) || available < commission) {
      return { error: 'Nakliyeci bakiyesi yetersiz' };
    }

    try {
      await client.query(
        'UPDATE wallets SET reserved_balance = COALESCE(reserved_balance, 0) + $1 WHERE user_id = $2',
        [commission, carrierId]
      );
    } catch (e1) {
      try {
        await client.query(
          'UPDATE wallets SET reserved_balance = COALESCE(reserved_balance, 0) + $1 WHERE userid = $2',
          [commission, carrierId]
        );
      } catch (e2) {
        await client.query(
          'UPDATE wallets SET reserved_balance = COALESCE(reserved_balance, 0) + $1 WHERE "userId" = $2',
          [commission, carrierId]
        );
      }
    }

    await client.query(
      `INSERT INTO transactions (user_id, type, amount, status, description, reference_type, reference_id)
       VALUES ($1, 'commission_hold', $2, 'completed', $3, 'offer', $4)
       ON CONFLICT DO NOTHING`,
      [carrierId, commission, `Teklif #${offerId} için %${commissionPercentage * 100} komisyon blokesi`, offerId]
    );

    return { commission };
  };

  const releaseCommissionHold = async (client, carrierId, offerId, offerPrice) => {
    const commission = calcCommission(offerPrice);
    if (!(commission > 0)) return { commission: 0 };

    let walletResult;
    try {
      walletResult = await client.query(
        'SELECT reserved_balance FROM wallets WHERE user_id = $1 FOR UPDATE',
        [carrierId]
      );
    } catch (e1) {
      try {
        walletResult = await client.query(
          'SELECT reserved_balance FROM wallets WHERE userid = $1 FOR UPDATE',
          [carrierId]
        );
      } catch (e2) {
        walletResult = await client.query(
          'SELECT reserved_balance FROM wallets WHERE "userId" = $1 FOR UPDATE',
          [carrierId]
        );
      }
    }

    if (!walletResult.rows || walletResult.rows.length === 0) {
      return { error: 'Nakliyeci cüzdanı bulunamadı' };
    }

    try {
      await client.query(
        'UPDATE wallets SET reserved_balance = GREATEST(COALESCE(reserved_balance, 0) - $1, 0) WHERE user_id = $2',
        [commission, carrierId]
      );
    } catch (e1) {
      try {
        await client.query(
          'UPDATE wallets SET reserved_balance = GREATEST(COALESCE(reserved_balance, 0) - $1, 0) WHERE userid = $2',
          [commission, carrierId]
        );
      } catch (e2) {
        await client.query(
          'UPDATE wallets SET reserved_balance = GREATEST(COALESCE(reserved_balance, 0) - $1, 0) WHERE "userId" = $2',
          [commission, carrierId]
        );
      }
    }

    await client.query(
      `INSERT INTO transactions (user_id, type, amount, status, description, reference_type, reference_id)
       VALUES ($1, 'commission_release', $2, 'completed', $3, 'offer', $4)
       ON CONFLICT DO NOTHING`,
      [carrierId, commission, `Teklif #${offerId} için komisyon blokesi kaldırıldı`, offerId]
    );

    return { commission };
  };

  const emitTo = (room, event, payload) => {
    try {
      if (!io || !room) return;
      io.to(room).emit(event, payload);
    } catch (_) {
      // ignore
    }
  };

  const emitOfferChanged = ({ shipmentId, offerId, status, actorUserId, carrierId, ownerUserId }) => {
    const payload = {
      shipmentId: shipmentId != null ? Number(shipmentId) : null,
      offerId: offerId != null ? Number(offerId) : null,
      status: status || null,
      actorUserId: actorUserId || null,
      ts: Date.now(),
    };

    if (payload.shipmentId) {
      emitTo(`shipment_${payload.shipmentId}`, 'offer_update', payload);
      emitTo(`shipment_${payload.shipmentId}`, 'offer_status_changed', payload);
      emitTo(`shipment_${payload.shipmentId}`, 'shipment_update', payload);
    }
    if (carrierId) {
      emitTo(`user_${carrierId}`, 'offer_update', payload);
    }
    if (ownerUserId) {
      emitTo(`user_${ownerUserId}`, 'offer_update', payload);
    }
  };

  let systemUserIdCache = null;
  const ensureSystemUser = async () => {
    if (!pool) return null;
    if (systemUserIdCache) return systemUserIdCache;
    const email = 'system@yolnext.local';
    try {
      const existing = await pool.query('SELECT id FROM users WHERE email = $1 LIMIT 1', [email]);
      if (existing.rows && existing.rows[0] && existing.rows[0].id) {
        systemUserIdCache = existing.rows[0].id;
        return systemUserIdCache;
      }
    } catch (_) {
      // ignore
    }

    try {
      const inserted = await pool.query(
        `INSERT INTO users (email, password, "firstName", "lastName", "fullName", role, "isActive", "createdAt", "updatedAt")
         VALUES ($1, '', 'YolNext', 'Sistem', 'YolNext Sistem', 'system', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING id`,
        [email]
      );
      systemUserIdCache = inserted.rows[0].id;
      return systemUserIdCache;
    } catch (_eCamel) {
      try {
        const inserted = await pool.query(
          `INSERT INTO users (email, password, first_name, last_name, full_name, role, is_active, created_at, updated_at)
           VALUES ($1, '', 'YolNext', 'Sistem', 'YolNext Sistem', 'system', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
           RETURNING id`,
          [email]
        );
        systemUserIdCache = inserted.rows[0].id;
        return systemUserIdCache;
      } catch (_) {
        return null;
      }
    }
  };

  const insertSystemMessageIfMissing = async ({ shipmentId, receiverId, message }) => {
    if (!pool) return;
    if (!shipmentId || !receiverId || !message) return;

    const systemUserId = await ensureSystemUser();
    if (!systemUserId) return;

    try {
      const exists = await pool.query(
        'SELECT 1 FROM messages WHERE "shipmentId" = $1 AND "receiverId" = $2 AND "senderId" = $3 AND message = $4 LIMIT 1',
        [shipmentId, receiverId, systemUserId, message]
      );
      if (exists.rows && exists.rows.length > 0) return;
    } catch (_eCamel) {
      try {
        const exists = await pool.query(
          'SELECT 1 FROM messages WHERE shipment_id = $1 AND receiver_id = $2 AND sender_id = $3 AND content = $4 LIMIT 1',
          [shipmentId, receiverId, systemUserId, message]
        );
        if (exists.rows && exists.rows.length > 0) return;
      } catch (_) {
        // ignore
      }
    }

    try {
      await pool.query(
        `INSERT INTO messages ("shipmentId", "senderId", "receiverId", message, "messageType", "createdAt")
         VALUES ($1, $2, $3, $4, 'system', CURRENT_TIMESTAMP)`,
        [shipmentId, systemUserId, receiverId, message]
      );
    } catch (_eCamelInsert) {
      try {
        await pool.query(
          `INSERT INTO messages ("shipmentId", "senderId", "receiverId", message, "createdAt")
           VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
          [shipmentId, systemUserId, receiverId, message]
        );
      } catch (_eSnakeInsert) {
        try {
          await pool.query(
            `INSERT INTO messages (shipment_id, sender_id, receiver_id, content, message_type, created_at)
             VALUES ($1, $2, $3, $4, 'system', CURRENT_TIMESTAMP)`,
            [shipmentId, systemUserId, receiverId, message]
          );
        } catch (_) {
          // ignore
        }
      }
    }
  };

  // Get offers for individual/corporate user
  const getIndividualOffersHandler = async (req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({
          success: false,
          error: 'Database not available',
        });
      }

      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }
      const userRole = req.user.role || 'individual';

      if (userRole !== 'individual' && userRole !== 'corporate') {
        return res.status(403).json({
          success: false,
          error: 'This endpoint is only available for individual and corporate users',
        });
      }

      const userId = await resolveUserIdForRequest(req.user);
      if (!userId) {
        return res.status(401).json({ success: false, error: 'User not authenticated' });
      }

      const { status } = req.query;
      const { page, limit, offset } = getPagination(req);

      const offersCols = await resolveOffersCols();
      const offersSchema = offersCols.schema || 'public';
      const offerIdExpr = offersCols.id ? qOfferCol(offersCols.id) : 'id';
      const offerShipmentExpr = offersCols.shipmentId ? qOfferCol(offersCols.shipmentId) : 'shipment_id';
      const offerCarrierExpr = offersCols.carrierId ? qOfferCol(offersCols.carrierId) : 'nakliyeci_id';
      const offerEstimatedExpr = offersCols.estimatedDelivery ? qOfferCol(offersCols.estimatedDelivery) : null;
      const offerCreatedExpr = offersCols.createdAt ? qOfferCol(offersCols.createdAt) : 'created_at';
      const offerUpdatedExpr = offersCols.updatedAt ? qOfferCol(offersCols.updatedAt) : 'updated_at';

      const shipOwnerExpr = await resolveShipmentsOwnerExprForOffers();
      if (!shipOwnerExpr) {
        return res.status(200).json({ success: true, data: [], offers: [], meta: { total: 0, page, limit } });
      }

      // Shipment status column can vary by schema; resolve it to filter out stale pending offers.
      const shipMeta = await resolveShipCols();
      const shipStatusCol = shipMeta?.status || 'status';
      const sStatusExpr = shipStatusCol ? `s.${qShipCol(shipStatusCol)}` : 's.status';
      const pendingStaleFilter = `NOT (o.status = 'pending' AND ${sStatusExpr} NOT IN ('pending', 'open', 'waiting_for_offers'))`;

      const pickupCityExpr = await shipExpr('s', 'pickupCity');
      const pickupAddressExpr = await shipExpr('s', 'pickupAddress');
      const deliveryCityExpr = await shipExpr('s', 'deliveryCity');
      const deliveryAddressExpr = await shipExpr('s', 'deliveryAddress');
      const weightExpr = await shipExpr('s', 'weight');
      const dimensionsExpr = await shipExpr('s', 'dimensions');
      const specialReqExpr = await shipExpr('s', 'specialRequirements');

      // Best-effort: include carrier rating aggregates if ratings table exists.
      let hasRatings = false;
      let ratedIdCol = null;
      let ratedIdExpr = null;
      let ratingsSchema = 'public';
      try {
        const tRes = await pool.query(
          `SELECT table_schema
           FROM information_schema.tables
           WHERE table_name = 'ratings'
           ORDER BY (table_schema = 'public') DESC, table_schema ASC
           LIMIT 1`
        );
        ratingsSchema = tRes.rows && tRes.rows[0]?.table_schema ? tRes.rows[0].table_schema : 'public';
        const rColsRes = await pool.query(
          `SELECT column_name FROM information_schema.columns WHERE table_name = 'ratings' AND table_schema = $1`,
          [ratingsSchema]
        );
        const rCols = new Set((rColsRes.rows || []).map(r => r.column_name));
        hasRatings = rCols.size > 0;
        ratedIdCol = rCols.has('ratedId')
          ? 'ratedId'
          : rCols.has('rated_id')
            ? 'rated_id'
            : rCols.has('ratee_id')
              ? 'ratee_id'
              : rCols.has('ratedid')
                ? 'ratedid'
                : null;
        ratedIdExpr = ratedIdCol ? (/[A-Z]/.test(ratedIdCol) ? `"${ratedIdCol}"` : ratedIdCol) : null;
      } catch (_) {
        hasRatings = false;
        ratedIdCol = null;
        ratedIdExpr = null;
        ratingsSchema = 'public';
      }

      const offerCarrierIdExprForRatings = offersCols.carrierId ? `o.${offerCarrierExpr}` : null;
      const carrierRatingSelectCamel = hasRatings && ratedIdExpr && offerCarrierIdExprForRatings
        ? `COALESCE((SELECT AVG(r.rating)::numeric(10,2) FROM "${ratingsSchema}".ratings r WHERE r.${ratedIdExpr}::text = ${offerCarrierIdExprForRatings}::text), 0) as "carrierRating"`
        : `0 as "carrierRating"`;
      const carrierReviewsSelectCamel = hasRatings && ratedIdExpr && offerCarrierIdExprForRatings
        ? `COALESCE((SELECT COUNT(*) FROM "${ratingsSchema}".ratings r WHERE r.${ratedIdExpr}::text = ${offerCarrierIdExprForRatings}::text), 0) as "carrierReviews"`
        : `0 as "carrierReviews"`;

      const carrierCompany = await userCompanyExpr('c');
      const userCompany = await userCompanyExpr('u');

      const nameExprs = await resolveUsersNameExprs();
      const carrierNameExpr = nameExprs.build('c');
      const userNameExpr = nameExprs.build('u');
      
      // Get carrier verification status from users table
      let carrierVerifiedExpr = 'false';
      try {
        const usersSchema = nameExprs.schema || 'public';
        const usersColsRes = await pool.query(
          `SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND table_schema = $1`,
          [usersSchema]
        );
        const usersCols = new Set((usersColsRes.rows || []).map(r => r.column_name));
        const pickCol = (...names) => names.find(n => usersCols.has(n)) || null;
        const qCol = (c) => (c && /[A-Z]/.test(c) ? `"${c}"` : c);
        const verifiedCol = pickCol('isVerified', 'is_verified', 'verified');
        if (verifiedCol) {
          carrierVerifiedExpr = `COALESCE(c.${qCol(verifiedCol)}, false)`;
        }
      } catch (_) {
        // Keep default false
      }
      
      // Get shipments metadata for completedJobs and successRate
      const shipmentsMeta = await resolveShipCols();
      const pickCol = (...names) => {
        for (const name of names) {
          if (shipmentsMeta[name]) return shipmentsMeta[name];
        }
        return null;
      };
      const qCol = (c) => (c && /[A-Z]/.test(c) ? `"${c}"` : c);
      const shipCarrierCol = pickCol('carrierId', 'carrier_id', 'carrierid', 'nakliyeciId', 'nakliyeci_id', 'nakliyeciid');
      // Use shipStatusCol from line 981 (already defined above) - shipMeta and shipmentsMeta are the same
      const shipStatusColForStats = shipmentsMeta.status || 'status';
      const shipCarrierExpr = shipCarrierCol ? `s2.${qCol(shipCarrierCol)}` : null;
      
      // Calculate completedJobs and successRate for carrier
      const completedJobsExpr = shipCarrierExpr && offerCarrierExpr
        ? `COALESCE((
          SELECT COUNT(*)::INTEGER
          FROM "${shipmentsMeta.schema}".shipments s2
          WHERE ${shipCarrierExpr}::text = o.${offerCarrierExpr}::text
            AND s2.${qCol(shipStatusColForStats)} IN ('delivered', 'completed')
        ), 0)`
        : '0';
      
      const successRateExpr = shipCarrierExpr && offerCarrierExpr
        ? `COALESCE((
          CASE 
            WHEN (
              SELECT COUNT(*)::INTEGER
              FROM "${shipmentsMeta.schema}".shipments s2
              WHERE ${shipCarrierExpr}::text = o.${offerCarrierExpr}::text
            ) > 0 THEN
              ROUND((
                SELECT COUNT(*)::INTEGER
                FROM "${shipmentsMeta.schema}".shipments s2
                WHERE ${shipCarrierExpr}::text = o.${offerCarrierExpr}::text
                  AND s2.${qCol(shipStatusColForStats)} IN ('delivered', 'completed')
              )::NUMERIC / 
              NULLIF((
                SELECT COUNT(*)::INTEGER
                FROM "${shipmentsMeta.schema}".shipments s2
                WHERE ${shipCarrierExpr}::text = o.${offerCarrierExpr}::text
                  AND s2.${qCol(shipStatusColForStats)} IN ('delivered', 'completed', 'cancelled')
              ), 0) * 100, 1)
            ELSE 0
          END
        ), 0)`
        : '0';
      
      const query = `
        SELECT o.${offerIdExpr} as id,
               o.${offerShipmentExpr} as "shipmentId",
               o.${offerCarrierExpr} as "carrierId",
               o.price,
               o.message,
               ${offerEstimatedExpr ? `o.${offerEstimatedExpr}` : 'NULL'} as "estimatedDelivery",
               NULL as "estimatedDuration",
               NULL as "specialNotes",
               o.status,
               NULL as "expiresAt",
               NULL as "isCounterOffer",
               NULL as "parentOfferId",
               ${carrierRatingSelectCamel},
               ${carrierReviewsSelectCamel},
               ${carrierVerifiedExpr} as "carrierVerified",
               ${completedJobsExpr} as "completedJobs",
               ${successRateExpr} as "successRate",
               o.${offerCreatedExpr} as "createdAt",
               o.${offerUpdatedExpr} as "updatedAt",
               COALESCE(s.title, s.description, s."description", '') as "shipmentTitle",
               COALESCE(s.description, s."description", s.title, '') as "shipmentDescription",
               ${pickupCityExpr} as "pickupCity",
               ${pickupCityExpr} as "fromCity",
               ${pickupAddressExpr} as "pickupAddress",
               ${deliveryCityExpr} as "deliveryCity",
               ${deliveryCityExpr} as "toCity",
               ${deliveryAddressExpr} as "deliveryAddress",
               ${weightExpr} as "weight",
               ${dimensionsExpr} as "dimensions",
               ${specialReqExpr} as "specialRequirements",
               ${carrierNameExpr} as "carrierName",
               ${carrierCompany} as "carrierCompany",
               ${userNameExpr} as "userName",
               ${userCompany} as "userCompany"
        FROM "${offersSchema}".offers o
        LEFT JOIN "${shipMeta.schema}".shipments s ON o.${offerShipmentExpr} = s.id
        LEFT JOIN "${nameExprs.schema}".users c ON o.${offerCarrierExpr} = c.id
        LEFT JOIN "${nameExprs.schema}".users u ON ${shipOwnerExpr} = u.id
        WHERE ${shipOwnerExpr} = $1
          AND ${pendingStaleFilter}
      `;

      const params = [userId];

      if (status && status !== 'all') {
        // appended below
      }

      let finalQuery = query;
      if (status && status !== 'all') {
        finalQuery += ` AND o.status = $${params.length + 1}`;
        params.push(status);
      }
      finalQuery += ` ORDER BY o.${offerCreatedExpr} DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const result = await pool.query(finalQuery, params);

      const countParams = status && status !== 'all' ? [userId, status] : [userId];
      const countSql = `SELECT COUNT(*) as count
                        FROM "${offersSchema}".offers o
                        INNER JOIN "${shipMeta.schema}".shipments s ON o.${offerShipmentExpr} = s.id
                        WHERE ${shipOwnerExpr} = $1
                          AND ${pendingStaleFilter}
                          ${status && status !== 'all' ? ` AND o.status = $2` : ''}`;
      const countRes = await pool.query(countSql, countParams);

      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.json({
        success: true,
        data: result.rows,
        offers: result.rows,
        meta: { total: parseInt(countRes.rows[0].count), page, limit },
      });
    } catch (error) {
      // Error logging - always log for debugging
      console.error('Error fetching individual offers:', error);
      console.error('Error stack:', error.stack);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.status(500).json({
        success: false,
        error: 'Teklifler yüklenemedi',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  };

  router.get('/individual', authenticateToken, getIndividualOffersHandler);
  // Compatibility: corporate UI calls /api/offers/corporate
  router.get('/corporate', authenticateToken, getIndividualOffersHandler);

  // Get all offers
  router.get('/', authenticateToken, async (req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({
          success: false,
          error: 'Database not available',
        });
      }

      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const userId = await resolveUserIdForRequest(req.user);
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }
      const userRole = req.user.role || 'individual';
      const { status, shipmentId } = req.query;
      const { page, limit, offset } = getPagination(req);

      const offersMeta = await resolveOffersCols();
      const shipMeta = await resolveShipCols();
      const { schema: usersSchema } = await resolveUsersAuthCols();

      const citiesMeta = await resolveCitiesMeta();
      const citiesSchema = citiesMeta?.schema;
      const citiesIdCol = citiesMeta?.idCol || 'id';
      const citiesNameCol = citiesMeta?.nameCol || 'name';

      const offersSchema = offersMeta.schema || 'public';
      const shipSchema = shipMeta.schema || 'public';

      const offerIdCol = offersMeta.id || 'id';
      const offerShipmentCol = offersMeta.shipmentId || 'shipment_id';
      const offerCarrierCol = offersMeta.carrierId || 'nakliyeci_id';
      const offerPriceCol = offersMeta.price || 'price';
      const offerMessageCol = offersMeta.message || 'message';
      const offerEstCol = offersMeta.estimatedDelivery;
      const offerStatusCol = offersMeta.status || 'status';
      const offerCreatedCol = offersMeta.createdAt || 'created_at';
      const offerUpdatedCol = offersMeta.updatedAt || 'updated_at';

      const shipOwnerCol = await resolveShipmentsOwnerCol();

      const usersNameExprs = await resolveUsersNameExprs();
      const ownerNameExpr = usersNameExprs && typeof usersNameExprs.build === 'function' ? usersNameExprs.build('u') : 'NULL';
      const ownerCompanyExpr = await userCompanyExpr('u');

      const carrierCompany = await userCompanyExpr('c');
      const pickupCityExpr = await shipExpr('s', 'pickupCity');
      const fromCityExpr = await shipExpr('s', 'fromCity');
      const pickupAddressExpr = await shipExpr('s', 'pickupAddress');
      const deliveryCityExpr = await shipExpr('s', 'deliveryCity');
      const toCityExpr = await shipExpr('s', 'toCity');
      const deliveryAddressExpr = await shipExpr('s', 'deliveryAddress');
      const carrierNameExpr = (await resolveUsersNameExprs()).build('c');

      const qCityCol = (c) => (c && /[A-Z]/.test(c) ? `"${c}"` : c);
      const shipPickupCityIdExpr = shipMeta?.pickupCityId ? `s.${qShipCol(shipMeta.pickupCityId)}` : null;
      const shipDeliveryCityIdExpr = shipMeta?.deliveryCityId ? `s.${qShipCol(shipMeta.deliveryCityId)}` : null;

      const pickupCityNameExpr =
        citiesSchema && shipPickupCityIdExpr
          ? `COALESCE(${pickupCityExpr}, pc.${qCityCol(citiesNameCol)})`
          : pickupCityExpr;
      const deliveryCityNameExpr =
        citiesSchema && shipDeliveryCityIdExpr
          ? `COALESCE(${deliveryCityExpr}, dc.${qCityCol(citiesNameCol)})`
          : deliveryCityExpr;

      let query = `
        SELECT o.${qOfferCol(offerIdCol)} as "id",
               o.${qOfferCol(offerShipmentCol)} as "shipmentId",
               o.${qOfferCol(offerCarrierCol)} as "carrierId",
               o.${qOfferCol(offerPriceCol)} as "price",
               o.${qOfferCol(offerMessageCol)} as "message",
               ${offerEstCol ? `o.${qOfferCol(offerEstCol)}` : 'NULL'} as "estimatedDelivery",
               NULL as "estimatedDuration",
               NULL as "specialNotes",
               o.${qOfferCol(offerStatusCol)} as "status",
               NULL as "expiresAt",
               NULL as "isCounterOffer",
               NULL as "parentOfferId",
               o.${qOfferCol(offerCreatedCol)} as "createdAt",
               o.${qOfferCol(offerUpdatedCol)} as "updatedAt",
               COALESCE(s.title, s.description, s."description", '') as "shipmentTitle",
               COALESCE(s.description, s."description", s.title, '') as "shipmentDescription",
               ${pickupCityNameExpr} as "pickupCity",
               ${pickupAddressExpr} as "pickupAddress",
               ${deliveryCityNameExpr} as "deliveryCity",
               ${deliveryAddressExpr} as "deliveryAddress",
               ${ownerNameExpr} as "ownerName",
               ${ownerCompanyExpr} as "ownerCompany",
               ${carrierNameExpr} as "carrierName",
               ${carrierCompany} as "carrierCompany"
        FROM "${offersSchema}".offers o
        INNER JOIN "${shipSchema}".shipments s ON o.${qOfferCol(offerShipmentCol)} = s.id
        ${citiesSchema && shipPickupCityIdExpr ? `LEFT JOIN "${citiesSchema}".cities pc ON ${shipPickupCityIdExpr} = pc.${qCityCol(citiesIdCol)}` : ''}
        ${citiesSchema && shipDeliveryCityIdExpr ? `LEFT JOIN "${citiesSchema}".cities dc ON ${shipDeliveryCityIdExpr} = dc.${qCityCol(citiesIdCol)}` : ''}
        LEFT JOIN "${usersSchema}".users u ON ${shipOwnerCol ? `s.${qShipCol(shipOwnerCol)}` : 'NULL'} = u.id
        LEFT JOIN "${usersSchema}".users c ON o.${qOfferCol(offerCarrierCol)} = c.id
        WHERE 1=1
      `;

      const params = [];

      if (userRole === 'individual' || userRole === 'corporate') {
        if (!shipOwnerCol) {
          query += ' AND 1=0';
        } else {
          query += ` AND s.${qShipCol(shipOwnerCol)} = $${params.length + 1}`;
          params.push(userId);
        }
      } else if (userRole === 'nakliyeci') {
        query += ` AND o.${qOfferCol(offerCarrierCol)} = $${params.length + 1}`;
        params.push(userId);
      }

      if (shipmentId) {
        query += ` AND o.${qOfferCol(offerShipmentCol)} = $${params.length + 1}`;
        params.push(shipmentId);
      }

      if (status && status !== 'all') {
        query += ` AND o.${qOfferCol(offerStatusCol)} = $${params.length + 1}`;
        params.push(status);
      }

      // Build count query separately
      let countQuery = `
        SELECT COUNT(*) as count
        FROM "${offersSchema}".offers o
        INNER JOIN "${shipSchema}".shipments s ON o.${qOfferCol(offerShipmentCol)} = s.id
        WHERE 1=1
      `;
      const countParams = [];

      if (userRole === 'individual' || userRole === 'corporate') {
        if (!shipOwnerCol) {
          countQuery += ' AND 1=0';
        } else {
          countQuery += ` AND s.${qShipCol(shipOwnerCol)} = $${countParams.length + 1}`;
          countParams.push(userId);
        }
      } else if (userRole === 'nakliyeci') {
        countQuery += ` AND o.${qOfferCol(offerCarrierCol)} = $${countParams.length + 1}`;
        countParams.push(userId);
      }

      if (shipmentId) {
        countQuery += ` AND o.${qOfferCol(offerShipmentCol)} = $${countParams.length + 1}`;
        countParams.push(shipmentId);
      }

      if (status && status !== 'all') {
        countQuery += ` AND o.${qOfferCol(offerStatusCol)} = $${countParams.length + 1}`;
        countParams.push(status);
      }

      query += ` ORDER BY o.${qOfferCol(offerCreatedCol)} DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const [result, countRes] = await Promise.all([pool.query(query, params), pool.query(countQuery, countParams)]);

      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.json({
        success: true,
        data: result.rows,
        offers: result.rows,
        meta: { total: parseInt(countRes.rows[0].count), page, limit },
      });
    } catch (error) {
      // Error logging - only in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching offers:', error);
        console.error('Error stack:', error.stack);
        // Guarded logging to avoid ReferenceError if query is undefined
        try {
          console.error('Query:', typeof query !== 'undefined' ? query : '');
          console.error('Params:', params);
        } catch {
          // ignore logging failure
        }
      }
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.status(500).json({
        success: false,
        error: 'Teklifler yüklenemedi',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  });

  // Get offer by ID
  router.get('/:id', authenticateToken, async (req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({
          success: false,
          error: 'Database not available',
        });
      }

      const { id } = req.params;
      const carrierCompany = await userCompanyExpr('c');
      const pickupCityExpr = await shipExpr('s', 'pickupCity');
      const fromCityExpr = await shipExpr('s', 'fromCity');
      const pickupAddressExpr = await shipExpr('s', 'pickupAddress');
      const deliveryCityExpr = await shipExpr('s', 'deliveryCity');
      const toCityExpr = await shipExpr('s', 'toCity');
      const deliveryAddressExpr = await shipExpr('s', 'deliveryAddress');
      // shipment description is not guaranteed in all schemas

      const usersName = await resolveUsersNameExprs();
      const carrierNameExpr = usersName && typeof usersName.build === 'function' ? usersName.build('c') : 'NULL';

      const oCols = await resolveOfferCols();
      if (!oCols?.shipmentId || !oCols?.carrierId) {
        return res.status(500).json({ success: false, error: 'Offers table schema not compatible' });
      }
      const offerTable = `"${oCols.schema}".offers`;
      const oShipmentExpr = `o.${oCols.qCol(oCols.shipmentId)}`;
      const oCarrierExpr = `o.${oCols.qCol(oCols.carrierId)}`;
      const oEstimatedExpr = oCols.estimatedDelivery ? `o.${oCols.qCol(oCols.estimatedDelivery)}` : 'NULL';
      const oCreatedExpr = oCols.createdAt ? `o.${oCols.qCol(oCols.createdAt)}` : 'NULL';
      const oUpdatedExpr = oCols.updatedAt ? `o.${oCols.qCol(oCols.updatedAt)}` : 'NULL';

      const shipMeta = await resolveShipCols();
      const shipSchemaForJoin = shipMeta?.schema || 'public';
      const shipTableForJoin = `"${shipSchemaForJoin}".shipments`;

      const result = await pool.query(
        `SELECT o.id,
               ${oShipmentExpr} as "shipmentId",
               ${oCarrierExpr} as "carrierId",
               o.price,
               o.message,
               ${oEstimatedExpr} as "estimatedDelivery",
               NULL as "estimatedDuration",
               NULL as "specialNotes",
               o.status,
               NULL as "expiresAt",
               NULL as "isCounterOffer",
               NULL as "parentOfferId",
               ${oCreatedExpr} as "createdAt",
               ${oUpdatedExpr} as "updatedAt", 
               COALESCE(s.title, s.description, s."description", '') as "shipmentTitle",
               COALESCE(s.description, s."description", s.title, '') as "shipmentDescription",
                COALESCE(${pickupCityExpr}, '') as "pickupCity",
                COALESCE(${pickupCityExpr}, '') as "fromCity",
                COALESCE(${pickupAddressExpr}, '') as "pickupAddress",
                COALESCE(${deliveryCityExpr}, '') as "deliveryCity",
                COALESCE(${deliveryCityExpr}, '') as "toCity",
                COALESCE(${deliveryAddressExpr}, '') as "deliveryAddress",
                ${carrierNameExpr} as "carrierName",
                ${carrierCompany} as "carrierCompany"
         FROM ${offerTable} o
         INNER JOIN ${shipTableForJoin} s ON ${oShipmentExpr} = s.id
         LEFT JOIN users c ON ${oCarrierExpr} = c.id
         WHERE o.id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Offer not found',
        });
      }

      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      console.error('Error fetching offer:', error);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.status(500).json({
        success: false,
        error: 'Teklif yüklenemedi',
        details: error.message,
      });
    }
  });

  // Create offer
  router.post('/', authenticateToken, offerSpeedLimiter, idempotencyGuard, async (req, res) => {
    try {
      // Validate user authentication
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'User authentication required',
        });
      }

      if (!pool) {
        return res.status(500).json({
          success: false,
          error: 'Database not available',
        });
      }

      const carrierId = await resolveUserIdForRequest(req.user);
      if (!carrierId) {
        return res.status(401).json({
          success: false,
          message: 'User authentication required',
        });
      }
      const { shipmentId, price, message, estimatedDelivery, driverId } = req.body;

      if (!shipmentId || !price) {
        return res.status(400).json({
          success: false,
          message: 'Shipment ID and price are required',
        });
      }

      // Calculate expires_at: 30 minutes from now
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

      // Check if shipment exists and is available for offers
      // Allow both waiting_for_offers and open for backward compatibility
      const shipmentResult = await pool.query(
        'SELECT * FROM shipments WHERE id = $1 AND status = ANY($2::text[])',
        [shipmentId, ['waiting_for_offers', 'open']]
      );

      if (shipmentResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Shipment not found or not available for offers',
        });
      }

      // Check for duplicate offer
      const offersCols = await resolveOffersCols();
      const offerShipmentExpr = offersCols.shipmentId ? qOfferCol(offersCols.shipmentId) : 'shipment_id';
      const offerCarrierExpr = offersCols.carrierId ? qOfferCol(offersCols.carrierId) : 'nakliyeci_id';
      const offerStatusExpr = offersCols.status ? qOfferCol(offersCols.status) : 'status';
      const existingOffer = await pool.query(
        `SELECT ${offersCols.id ? qOfferCol(offersCols.id) : 'id'} as id FROM offers WHERE ${offerShipmentExpr} = $1 AND ${offerCarrierExpr} = $2 AND ${offerStatusExpr} = $3`,
        [shipmentId, carrierId, 'pending']
      );

      if (existingOffer.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'You already have a pending offer for this shipment',
        });
      }

      const bypassCommission = req.user?.isDemo === true;
      const client = await pool.connect();
      let offer;
      try {
        await client.query('BEGIN');

        const cols = offersCols;
        const shipCol = cols.shipmentId ? qOfferCol(cols.shipmentId) : 'shipment_id';
        const carCol = cols.carrierId ? qOfferCol(cols.carrierId) : 'nakliyeci_id';
        const priceCol = cols.price ? qOfferCol(cols.price) : 'price';
        const msgCol = cols.message ? qOfferCol(cols.message) : 'message';
        const estCol = cols.estimatedDelivery ? qOfferCol(cols.estimatedDelivery) : null;
        const statusCol = cols.status ? qOfferCol(cols.status) : 'status';
        const createdCol = cols.createdAt ? qOfferCol(cols.createdAt) : 'created_at';
        const updatedCol = cols.updatedAt ? qOfferCol(cols.updatedAt) : 'updated_at';

        const estType = cols.estimatedDeliveryType ? String(cols.estimatedDeliveryType).toLowerCase() : '';
        const estIsDateLike = estType.includes('timestamp') || estType.includes('date');
        const insertCols = [shipCol, carCol, priceCol];
        const insertVals = ['$1', '$2', '$3'];
        const insertParams = [shipmentId, carrierId, price];
        let nextParamIndex = 3;

        const hasMessage = !!cols.message;
        const hasEstimated = !!cols.estimatedDelivery;

        if (hasMessage) {
          nextParamIndex += 1;
          insertCols.push(msgCol);
          insertVals.push(`$${nextParamIndex}`);
          insertParams.push(message || '');
        }

        let estimatedExprSql = null;
        if (hasEstimated && estCol) {
          nextParamIndex += 1;
          const estParam = `$${nextParamIndex}`;
          insertCols.push(estCol);
          estimatedExprSql = estIsDateLike
            ? `CASE
                 WHEN (${estParam}::text) IS NULL THEN NULL
                 WHEN (${estParam}::text) ~ '^[0-9]+$' THEN CURRENT_TIMESTAMP + ((${estParam}::int) * INTERVAL '1 day')
                 ELSE (${estParam}::timestamp)
               END`
            : estParam;
          insertVals.push(estimatedExprSql);
          insertParams.push(estimatedDelivery || null);
        }

        nextParamIndex += 1;
        insertCols.push(statusCol);
        insertVals.push(`$${nextParamIndex}`);
        insertParams.push('pending');

        insertCols.push(createdCol, updatedCol);
        insertVals.push('CURRENT_TIMESTAMP', 'CURRENT_TIMESTAMP');

        const returningMessage = hasMessage ? msgCol : 'NULL';
        const returningEstimated = hasEstimated && estCol ? estCol : 'NULL';

        // Check if expires_at column exists
        const expiresAtCol = cols.expiresAt || cols.expires_at || null;
        const expiresAtExpr = expiresAtCol ? qOfferCol(expiresAtCol) : null;
        let expiresAtInsert = '';
        let expiresAtReturn = 'NULL as "expiresAt"';
        if (expiresAtExpr) {
          nextParamIndex += 1;
          insertCols.push(expiresAtExpr);
          insertVals.push(`$${nextParamIndex}`);
          insertParams.push(expiresAt.toISOString());
          expiresAtReturn = `${expiresAtExpr} as "expiresAt"`;
        }

        const insertSql = `INSERT INTO offers (${insertCols.join(', ')})
           VALUES (${insertVals.join(', ')})
           RETURNING ${cols.id ? qOfferCol(cols.id) : 'id'} as id,
                     ${shipCol} as "shipmentId",
                     ${carCol} as "carrierId",
                     ${priceCol} as price,
                     ${returningMessage} as message,
                     ${returningEstimated} as "estimatedDelivery",
                     ${statusCol} as status,
                     ${expiresAtReturn},
                     ${createdCol} as "createdAt",
                     ${updatedCol} as "updatedAt"`;

        const result = await client.query(insertSql, insertParams);

        offer = result.rows[0];
        
        // Add expiresAt to response if not in DB
        if (!offer.expiresAt) {
          offer.expiresAt = expiresAt.toISOString();
        }

        // Store driverId in offer metadata if provided (for corridor-based offers)
        if (driverId) {
          offer.driverId = driverId;
        }

        if (!bypassCommission) {
          const r = await reserveCommissionHold(client, carrierId, offer.id, offer.price);
          if (r && r.error) {
            await client.query('ROLLBACK');
            return res.status(402).json({ success: false, message: r.error });
          }
        }

        await client.query('COMMIT');
      } catch (e) {
        try {
          await client.query('ROLLBACK');
        } catch (_) {
          // ignore
        }
        throw e;
      } finally {
        client.release();
      }

      // Notify shipment owner (non-blocking, don't fail if notification fails)
      const shipment = shipmentResult.rows[0];
      const ownerCol = await resolveShipmentsOwnerCol();
      const shipmentOwnerId = ownerCol ? shipment?.[ownerCol] : null;
      if (createNotification && shipmentOwnerId) {
        try {
          await createNotification(
            shipmentOwnerId,
            'new_offer',
            'Yeni Teklif',
            `Gönderiniz için yeni bir teklif aldınız.`,
            `/shipments/${shipmentId}`,
            'normal',
            { offerId: offer.id, shipmentId }
          );
        } catch (notifError) {
          // Log but don't fail the request
          console.error('Error creating notification (non-critical):', notifError);
        }
      }

      try {
        emitOfferChanged({
          shipmentId,
          offerId: offer.id,
          status: offer.status,
          actorUserId: carrierId,
          carrierId,
          ownerUserId: shipmentOwnerId || null,
        });
      } catch (_) {
        // ignore
      }

      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.status(201).json({
        success: true,
        message: 'Teklif başarıyla oluşturuldu',
        data: offer,
      });
    } catch (error) {
      console.error('Error creating offer:', error);
      console.error('Error stack:', error.stack);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.status(500).json({
        success: false,
        error: 'Teklif oluşturulamadı',
        details: process.env.NODE_ENV !== 'production' ? error.message : undefined,
      });
    }
  });

  // Accept offer (support both POST and PUT)
  const acceptOfferHandler = async (req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({
          success: false,
          error: 'Database not available',
        });
      }

      const { id } = req.params;
      const userId = req.user?.id ?? req.user?.userId ?? req.user?.user_id ?? req.user?.userid;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      // Get offer with shipment info
      const oCols = await resolveOfferCols();
      if (!oCols?.shipmentId || !oCols?.carrierId) {
        return res.status(500).json({ success: false, error: 'Offers table schema not compatible' });
      }
      const offerTable = `"${oCols.schema}".offers`;
      const oShipmentExpr = `o.${oCols.qCol(oCols.shipmentId)}`;
      const oCarrierExpr = `o.${oCols.qCol(oCols.carrierId)}`;
      const oEstimatedExpr = oCols.estimatedDelivery ? `o.${oCols.qCol(oCols.estimatedDelivery)}` : 'NULL';
      const oCreatedExpr = oCols.createdAt ? `o.${oCols.qCol(oCols.createdAt)}` : 'NULL';
      const oUpdatedExpr = oCols.updatedAt ? `o.${oCols.qCol(oCols.updatedAt)}` : 'NULL';

      const shipMeta = await resolveShipCols();
      const shipSchemaForJoin = shipMeta?.schema || 'public';
      const shipTableForJoin = `"${shipSchemaForJoin}".shipments`;
      const shipStatusCol = shipMeta?.status || 'status';
      const sOwnerExpr = shipOwnerExprFromMeta('s', shipMeta);
      const sStatusExpr = shipStatusCol ? `s.${qShipCol(shipStatusCol)}` : 's.status';

      const offerResult = await pool.query(
        `SELECT o.id,
               ${oShipmentExpr} as "shipmentId",
               ${oCarrierExpr} as "carrierId",
               o.price,
               o.message,
               ${oEstimatedExpr} as "estimatedDelivery",
               NULL as "estimatedDuration",
               NULL as "specialNotes",
               o.status,
               NULL as "expiresAt",
               NULL as "isCounterOffer",
               NULL as "parentOfferId",
               ${oCreatedExpr} as "createdAt",
               ${oUpdatedExpr} as "updatedAt",
               ${sOwnerExpr} as "shipmentOwnerId",
               ${sStatusExpr} as "shipmentStatus"
         FROM ${offerTable} o
         INNER JOIN ${shipTableForJoin} s ON ${oShipmentExpr} = s.id
         WHERE o.id = $1`,
        [id]
      );

      if (offerResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Offer not found',
        });
      }

      const offer = offerResult.rows[0];
      // Map column names for compatibility
      const shipmentId = offer.shipmentId || offer.shipment_id;
      const carrierId = offer.carrierId || offer.nakliyeci_id || offer.carrier_id;

      // Offer must be pending to be accepted (prevents double-accept)
      // Allow retry if previous attempt failed but shipment wasn't updated
      if (offer.status && offer.status !== 'pending' && offer.status !== 'accepted') {
        return res.status(409).json({
          success: false,
          message: 'Offer is not in a valid state to be accepted',
        });
      }

      // Check if shipment is in correct status
      // Do not allow accept if shipment is already offer_accepted/assigned (prevents double accept).
      // If offer is already accepted, allow this handler to be idempotent and re-apply
      // any missing shipment updates (e.g., after a previous schema mismatch).
      if (offer.status !== 'accepted' && !['pending', 'open', 'waiting_for_offers'].includes(offer.shipmentStatus)) {
        return res.status(400).json({
          success: false,
          message: 'Shipment is not in a valid state to accept offers',
        });
      }

      // Start transaction using a client for proper transaction management
      const client = await pool.connect();
      let rejectedOtherOffers = [];
      
      try {
        await client.query('BEGIN');

        // IMPORTANT: Use the same schema we already resolved earlier for shipments.
        // The DB can have multiple schemas; a public-first heuristic may pick the wrong one
        // and cause us to update a different (empty) shipments table.
        const shipSchema = shipMeta?.schema || 'public';

        const shipColsRes = await client.query(
          `SELECT column_name FROM information_schema.columns WHERE table_name = 'shipments' AND table_schema = $1`,
          [shipSchema]
        );
        const shipCols = new Set((shipColsRes.rows || []).map(r => r.column_name));

        const pickCol = (...names) => names.find(n => shipCols.has(n)) || null;
        const idCol = pickCol('id', 'shipment_id', 'shipmentId');
        const carrierColsAll = [
          'nakliyeci_id',
          'nakliyeciId',
          'carrier_id',
          'carrierId',
          'carrierid',
        ].filter(c => shipCols.has(c));
        const carrierCol = carrierColsAll[0] || null;
        const ownerCol = pickCol('user_id', 'userId', 'userid', 'userId', 'userId', 'ownerid');
        const acceptedOfferColsAll = [
          'acceptedOfferId',
          'accepted_offer_id',
          'acceptedofferid',
          'acceptedOfferID',
        ].filter(c => shipCols.has(c));
        const acceptedOfferCol = acceptedOfferColsAll[0] || null;
        const updatedAtCol = pickCol('updatedAt', 'updated_at');
        const priceCol = pickCol('price');
        const statusCol = pickCol('status');

        if (!idCol || !statusCol) {
          throw new Error('Shipments table schema not compatible for offer accept');
        }

        const idNeedsQuotes = /[A-Z]/.test(idCol);
        const idExpr = idNeedsQuotes ? `"${idCol}"` : idCol;
        const statusNeedsQuotes = /[A-Z]/.test(statusCol);
        const statusExpr = statusNeedsQuotes ? `"${statusCol}"` : statusCol;
        const qAny = (c) => (/[A-Z]/.test(c) ? `"${c}"` : c);
        const carrierExpr = carrierCol ? qAny(carrierCol) : null;
        const acceptedOfferExpr = acceptedOfferCol ? qAny(acceptedOfferCol) : null;
        const carrierNullGuard = carrierColsAll.length
          ? (carrierColsAll.length === 1
              ? `${qAny(carrierColsAll[0])} IS NULL`
              : `COALESCE(${carrierColsAll.map(qAny).join(', ')}) IS NULL`)
          : null;
        const acceptedOfferNullGuard = acceptedOfferColsAll.length
          ? (acceptedOfferColsAll.length === 1
              ? `${qAny(acceptedOfferColsAll[0])} IS NULL`
              : `COALESCE(${acceptedOfferColsAll.map(qAny).join(', ')}) IS NULL`)
          : null;

        const ownerExpr = ownerCol ? (/[A-Z]/.test(ownerCol) ? `"${ownerCol}"` : ownerCol) : null;
        const lockSelectCols = [statusExpr, carrierExpr, acceptedOfferExpr, ownerExpr].filter(Boolean).join(', ');
        const lockSql = `SELECT ${lockSelectCols} FROM "${shipSchema}".shipments WHERE ${idExpr} = $1 FOR UPDATE`;
        const lockedShipmentRes = await client.query(lockSql, [shipmentId]);
        const lockedShipment = lockedShipmentRes.rows && lockedShipmentRes.rows[0] ? lockedShipmentRes.rows[0] : null;
        if (!lockedShipment) {
          return res.status(404).json({ success: false, message: 'Shipment not found' });
        }

        // Check if user owns the shipment (schema-aware)
        const lockedOwner = ownerCol ? (lockedShipment[ownerCol] ?? lockedShipment.user_id ?? lockedShipment.userId) : null;
        const lockedOwnerNorm = lockedOwner != null ? String(lockedOwner) : null;
        const userIdNorm = userId != null ? String(userId) : null;
        if (lockedOwnerNorm != null && userIdNorm != null && lockedOwnerNorm !== userIdNorm) {
          await client.query('ROLLBACK');
          return res.status(403).json({
            success: false,
            message: 'You can only accept offers for your own shipments',
          });
        }

        const lockedStatus = lockedShipment[statusCol] || lockedShipment.status;
        const lockedCarrier = carrierCol ? (lockedShipment[carrierCol] ?? lockedShipment.carrier_id ?? lockedShipment.nakliyeci_id) : null;
        const lockedAcceptedOffer = acceptedOfferCol
          ? (lockedShipment[acceptedOfferCol] ?? lockedShipment.accepted_offer_id ?? lockedShipment.acceptedOfferId)
          : null;

        const lockedCarrierNorm = lockedCarrier != null ? String(lockedCarrier) : null;
        const lockedAcceptedNorm = lockedAcceptedOffer != null ? String(lockedAcceptedOffer) : null;
        const carrierIdNorm = carrierId != null ? String(carrierId) : null;
        const offerIdNorm = offer?.id != null ? String(offer.id) : null;
        const carrierPreassignedSame = lockedCarrierNorm != null && carrierIdNorm != null && lockedCarrierNorm === carrierIdNorm;

        if (lockedCarrier != null || lockedAcceptedOffer != null || lockedStatus === 'offer_accepted') {
          // Idempotency: if this same offer/carrier is already assigned, treat as success.
          if (offer.status === 'accepted' && lockedCarrierNorm === carrierIdNorm && lockedAcceptedNorm === offerIdNorm) {
            await client.query('COMMIT');
            return res.json({
              success: true,
              message: 'Teklif zaten kabul edilmiş',
              data: {
                offerId: offer.id,
                shipmentId,
                carrierId,
                price: offer.price,
                nextSteps: 'Ödeme ve teslimat detaylarını mesajlaşma üzerinden netleştirin.',
              },
            });
          }

          // Special case: corporate publishType=specific can pre-assign carrier on shipment.
          // If the carrier matches and there is no accepted offer yet, allow accepting normally.
          if (carrierPreassignedSame && lockedAcceptedNorm == null && lockedStatus !== 'offer_accepted') {
            // continue
          } else {
            await client.query('ROLLBACK');
            return res.status(409).json({
              success: false,
              message: 'Shipment already assigned or offer already accepted',
            });
          }
        }

        if (!['pending', 'open', 'waiting_for_offers'].includes(String(lockedStatus || ''))) {
          await client.query('ROLLBACK');
          return res.status(409).json({
            success: false,
            message: 'Shipment is not in a valid state to accept offers',
          });
        }

        // Reject other offers for this shipment
        const oColsTx = await resolveOfferCols();
        const offerTableTx = `"${oColsTx.schema}".offers`;
        const shipColExpr = oColsTx.shipmentId ? oColsTx.qCol(oColsTx.shipmentId) : 'shipment_id';
        const carrierColExpr = oColsTx.carrierId ? oColsTx.qCol(oColsTx.carrierId) : 'nakliyeci_id';
        const updatedAtColExpr = oColsTx.updatedAt ? oColsTx.qCol(oColsTx.updatedAt) : null;

        const otherOffersRes = await client.query(
          `SELECT id, ${carrierColExpr} as carrier_id, price
           FROM ${offerTableTx}
           WHERE ${shipColExpr} = $1 AND id != $2 AND status = 'pending'
           FOR UPDATE`,
          [shipmentId, id]
        );

        rejectedOtherOffers = (otherOffersRes.rows || []).map(r => ({
          id: r.id,
          carrierId: r.carrier_id,
          price: r.price,
        }));

        const rejectSetUpdated = updatedAtColExpr ? `, ${updatedAtColExpr} = CURRENT_TIMESTAMP` : '';
        const rejectResult = await client.query(
          `UPDATE ${offerTableTx} SET status = 'rejected'${rejectSetUpdated}
           WHERE ${shipColExpr} = $1 AND id != $2 AND status = 'pending'`,
          [shipmentId, id]
        );
        console.log(`✅ Rejected ${rejectResult.rowCount} other offers for shipment ${shipmentId}`);

        // Accept this offer
        const acceptSetUpdated = updatedAtColExpr ? `, ${updatedAtColExpr} = CURRENT_TIMESTAMP` : '';
        const acceptResult = await client.query(
          `UPDATE ${offerTableTx} SET status = 'accepted'${acceptSetUpdated}
           WHERE id = $1 AND status = 'pending'`,
          [id]
        );
        console.log(`✅ Accepted offer ${id}, rows affected: ${acceptResult.rowCount}`);

        if (acceptResult.rowCount === 0) {
          // Idempotency: offer may already be accepted but shipment update may not have been applied.
          const currentOfferRes = await client.query(
            `SELECT status FROM ${offerTableTx} WHERE id = $1 FOR UPDATE`,
            [id]
          );
          const currentStatus = currentOfferRes.rows && currentOfferRes.rows[0] ? currentOfferRes.rows[0].status : null;
          if (currentStatus !== 'accepted') {
            throw new Error('Offer is no longer available to accept');
          }
        }

        const sets = [];
        const params = [];
        const addSet = (col, value) => {
          if (!col) return;
          params.push(value);
          const placeholder = `$${params.length}`;
          const needsQuotes = /[A-Z]/.test(col);
          const colExpr = needsQuotes ? `"${col}"` : col;
          sets.push(`${colExpr} = ${placeholder}`);
        };

        addSet(statusCol, 'offer_accepted');
        (carrierColsAll.length ? carrierColsAll : [carrierCol]).filter(Boolean).forEach(c => addSet(c, carrierId));
        (acceptedOfferColsAll.length ? acceptedOfferColsAll : [acceptedOfferCol]).filter(Boolean).forEach(c => addSet(c, offer.id));
        addSet(priceCol, offer.price);
        if (updatedAtCol) {
          const needsQuotes = /[A-Z]/.test(updatedAtCol);
          const colExpr = needsQuotes ? `"${updatedAtCol}"` : updatedAtCol;
          sets.push(`${colExpr} = CURRENT_TIMESTAMP`);
        }

        params.push(shipmentId);
        const whereParts = [`${idExpr} = $${params.length}`];
        whereParts.push(`${statusExpr} IN ('pending','open','waiting_for_offers')`);
        // Allow update when carrier is preassigned to the same carrier (publishType=specific).
        if (carrierNullGuard && !carrierPreassignedSame) whereParts.push(carrierNullGuard);
        if (acceptedOfferNullGuard) whereParts.push(acceptedOfferNullGuard);

        const updateSql = `UPDATE "${shipSchema}".shipments SET ${sets.join(', ')} WHERE ${whereParts.join(' AND ')}`;
        const updateResult = await client.query(updateSql, params);
        console.log(`✅ Updated shipment ${shipmentId}, rows affected: ${updateResult.rowCount}`);

        if (!updateResult || updateResult.rowCount === 0) {
          await client.query('ROLLBACK');
          return res.status(409).json({
            success: false,
            message: 'Shipment already assigned or offer already accepted',
          });
        }

        // Verify the update (schema-aware)
        const priceExpr = priceCol ? (/[A-Z]/.test(priceCol) ? `"${priceCol}"` : priceCol) : null;

        const selectCols = [statusExpr, carrierExpr, acceptedOfferExpr, priceExpr].filter(Boolean).join(', ');
        const verifySql = `SELECT ${selectCols} FROM "${shipSchema}".shipments WHERE ${idExpr} = $1`;
        const verifyResult = await client.query(verifySql, [shipmentId]);

        if (!verifyResult.rows || verifyResult.rows.length === 0) {
          throw new Error('Shipment verification failed after offer accept update');
        }

        const updatedShipment = verifyResult.rows[0];
        const gotStatus = updatedShipment[statusCol] || updatedShipment.status;
        if (gotStatus !== 'offer_accepted') {
          throw new Error('Shipment status did not update to offer_accepted');
        }

        // Auto-assign driver if driverId is provided in request body (for corridor-based offers)
        const driverId = req.body?.driverId || null;
        if (driverId) {
          try {
            // Check if shipment_driver_assignments table exists
            const assignmentSchemaRes = await client.query(`
              SELECT table_schema FROM information_schema.tables
              WHERE table_name = 'shipment_driver_assignments'
              ORDER BY (table_schema = 'public') DESC, table_schema ASC
              LIMIT 1
            `);
            const assignSchema = assignmentSchemaRes.rows?.[0]?.table_schema || null;
            
            if (assignSchema) {
              // Check if assignment already exists
              const existingAssign = await client.query(
                `SELECT id FROM "${assignSchema}".shipment_driver_assignments 
                 WHERE shipment_id::text = $1::text AND driver_id::text = $2::text`,
                [shipmentId, driverId]
              );
              
              if (existingAssign.rows.length === 0) {
                // Create assignment
                await client.query(
                  `INSERT INTO "${assignSchema}".shipment_driver_assignments 
                   (shipment_id, driver_id, carrier_id, created_at, updated_at)
                   VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
                  [shipmentId, driverId, carrierId]
                );
                console.log(`✅ Auto-assigned driver ${driverId} to shipment ${shipmentId}`);
              }
            } else {
              // Fallback: try to update shipment's driver_id column directly
              const driverCol = shipMeta?.driverId || shipMeta?.driver_id || null;
              if (driverCol) {
                const driverColExpr = /[A-Z]/.test(driverCol) ? `"${driverCol}"` : driverCol;
                await client.query(
                  `UPDATE "${shipSchema}".shipments SET ${driverColExpr} = $1 WHERE ${idExpr} = $2`,
                  [driverId, shipmentId]
                );
                console.log(`✅ Auto-assigned driver ${driverId} to shipment ${shipmentId} (direct column)`);
              }
            }
          } catch (assignError) {
            // Log but don't fail the offer acceptance
            console.error('Error auto-assigning driver (non-critical):', assignError);
          }
        }

        const debugInfo = req.user?.isDemo === true || process.env.NODE_ENV === 'development'
          ? {
              shipmentUpdate: {
                shipmentId,
                updateRowCount: updateResult.rowCount,
                idCol,
                carrierCol,
                acceptedOfferCol,
                updatedAtCol,
                priceCol,
                statusCol,
                updateSql,
              },
              shipmentVerify: updatedShipment,
            }
          : undefined;

        const commission = calcCommission(offer.price);
        const bypassCommission = req.user?.isDemo === true;

        if (!bypassCommission) {
          for (const o of otherOffersRes.rows || []) {
            const otherCarrierId = o.carrier_id;
            if (!otherCarrierId) continue;
            await releaseCommissionHold(client, otherCarrierId, o.id, o.price);
          }
        }

        if (!bypassCommission && commission > 0) {
          try {
            let walletResult;
            try {
              walletResult = await client.query('SELECT balance, reserved_balance FROM wallets WHERE user_id = $1 FOR UPDATE', [carrierId]);
            } catch (e1) {
              try {
                walletResult = await client.query('SELECT balance, reserved_balance FROM wallets WHERE userid = $1 FOR UPDATE', [carrierId]);
              } catch (e2) {
                walletResult = await client.query('SELECT balance, reserved_balance FROM wallets WHERE "userId" = $1 FOR UPDATE', [carrierId]);
              }
            }

            if (!walletResult.rows || walletResult.rows.length === 0) {
              await client.query('ROLLBACK');
              return res.status(402).json({
                success: false,
                message: 'Nakliyeci cüzdanı bulunamadı veya bakiye yetersiz',
              });
            }

            const currentBalance = parseMoney(walletResult.rows[0].balance);
            const currentReserved = parseMoney(walletResult.rows[0].reserved_balance);
            if (!Number.isFinite(currentBalance) || currentBalance < commission) {
              await client.query('ROLLBACK');
              return res.status(402).json({
                success: false,
                message: 'Nakliyeci bakiyesi yetersiz',
              });
            }

            try {
              await client.query(
                'UPDATE wallets SET balance = balance - $1, reserved_balance = GREATEST(COALESCE(reserved_balance, 0) - $1, 0) WHERE user_id = $2',
                [commission, carrierId]
              );
            } catch (e1) {
              try {
                await client.query(
                  'UPDATE wallets SET balance = balance - $1, reserved_balance = GREATEST(COALESCE(reserved_balance, 0) - $1, 0) WHERE userid = $2',
                  [commission, carrierId]
                );
              } catch (e2) {
                await client.query(
                  'UPDATE wallets SET balance = balance - $1, reserved_balance = GREATEST(COALESCE(reserved_balance, 0) - $1, 0) WHERE "userId" = $2',
                  [commission, carrierId]
                );
              }
            }

            const transactionDescription = `Teklif #${offer.id} için %${commissionPercentage * 100} komisyon`;
            await client.query(
              `INSERT INTO transactions (user_id, type, amount, status, description, reference_type, reference_id)
                   VALUES ($1, 'commission_capture', $2, 'completed', $3, 'offer', $4)
                   ON CONFLICT DO NOTHING`,
              [carrierId, commission, transactionDescription, offer.id]
            );
          } catch (e) {
            await client.query('ROLLBACK');
            return res.status(500).json({
              success: false,
              message: 'Komisyon işlemi sırasında hata oluştu',
            });
          }
        }

        // Auto status system messages (best-effort, low-noise)
        try {
          const sysText = 'Anlaşma tamamlandı. Ödeme tutarı güvence altına alındı. Ödeme detayları (IBAN/alıcı adı/açıklama) ve yükleme saatini mesajlaşma üzerinden yazılı teyitleyin.';
          // Owner and carrier should both see it in the shipment chat
          await insertSystemMessageIfMissing({ shipmentId, receiverId: offer.shipmentOwnerId, message: sysText });
          await insertSystemMessageIfMissing({ shipmentId, receiverId: carrierId, message: sysText });
        } catch (_) {
          // ignore
        }

        await client.query('COMMIT');
        console.log(`✅ Transaction committed successfully for offer ${id}`);

        if (debugInfo && pool) {
          try {
            // Read persisted row (same connection) for debugging
            try {
              const persistedCols = [
                statusCol ? qShipCol(statusCol) : 'status',
                carrierCol ? qShipCol(carrierCol) : null,
                acceptedOfferCol ? qShipCol(acceptedOfferCol) : null,
                priceCol ? qShipCol(priceCol) : 'price',
              ].filter(Boolean).join(', ');
              const persistedSameConn = await client.query(
                `SELECT ${persistedCols} FROM "${shipSchema}".shipments WHERE id = $1`,
                [shipmentId]
              );
              debugInfo.shipmentPersistedReadSameConnection =
                persistedSameConn.rows && persistedSameConn.rows[0] ? persistedSameConn.rows[0] : null;
            } catch (e) {
              debugInfo.shipmentPersistedReadSameConnection = { error: e.message };
            }

            const persisted = await pool.query(
              `SELECT ${[
                statusCol ? qShipCol(statusCol) : 'status',
                carrierCol ? qShipCol(carrierCol) : null,
                acceptedOfferCol ? qShipCol(acceptedOfferCol) : null,
                priceCol ? qShipCol(priceCol) : 'price',
              ].filter(Boolean).join(', ')} FROM "${shipSchema}".shipments WHERE id = $1`,
              [shipmentId]
            );
            debugInfo.shipmentPersistedRead = persisted.rows && persisted.rows[0] ? persisted.rows[0] : null;
            debugInfo.shipmentsSchema = shipSchema;

            try {
              const triggers = await pool.query(
                `SELECT trigger_name, event_manipulation, action_timing, action_statement
                 FROM information_schema.triggers
                 WHERE event_object_table = 'shipments' AND event_object_schema = $1
                 ORDER BY trigger_name ASC`,
                [shipSchema]
              );
              debugInfo.shipmentsTriggers = triggers.rows || [];
            } catch (e) {
              debugInfo.shipmentsTriggers = { error: e.message };
            }
          } catch (e) {
            debugInfo.shipmentPersistedRead = { error: e.message };
            debugInfo.shipmentPersistedReadSameConnection = debugInfo.shipmentPersistedReadSameConnection || { error: e.message };
          }
        }

        // Notify carrier (non-blocking)
        if (createNotification) {
          try {
            await createNotification(
              carrierId,
              'offer_accepted',
              'Teklifiniz Kabul Edildi',
              `Gönderi için verdiğiniz teklif kabul edildi.`,
              `/shipments/${shipmentId}`,
              'success',
              { offerId: offer.id, shipmentId: shipmentId }
            );
          } catch (notifError) {
            console.error('Error creating notification (non-critical):', notifError);
          }
        }

        // Notify other carriers whose offers were auto-rejected (best-effort)
        try {
          if (createNotification && Array.isArray(rejectedOtherOffers) && rejectedOtherOffers.length > 0) {
            const seen = new Set();
            for (const r of rejectedOtherOffers) {
              const otherCarrierId = r?.carrierId;
              const otherOfferId = r?.id;
              if (!otherCarrierId || !otherOfferId) continue;
              const key = `${otherCarrierId}:${otherOfferId}`;
              if (seen.has(key)) continue;
              seen.add(key);
              await createNotification(
                otherCarrierId,
                'offer_rejected',
                'Teklifiniz Reddedildi',
                `Gönderi #${shipmentId} için teklifiniz reddedildi.`,
                `/nakliyeci/offers`,
                'normal',
                { offerId: otherOfferId, shipmentId }
              );
            }
          }
        } catch (_) {
          // ignore
        }

        try {
          emitOfferChanged({
            shipmentId,
            offerId: offer.id,
            status: 'accepted',
            actorUserId: userId,
            carrierId,
            ownerUserId: offer.shipmentOwnerId || null,
          });
        } catch (_) {
          // ignore
        }

        res.setHeader('Content-Type', 'application/json; charset=utf-8');

        try {
          clearCachePatternFn('GET:/api/shipments');
        } catch (_) {
          // ignore cache clear errors
        }

        return res.json({
          success: true,
          message: 'Teklif başarıyla kabul edildi',
          data: {
            offerId: offer.id,
            shipmentId,
            carrierId,
            price: offer.price,
            nextSteps: 'Ödeme ve teslimat detaylarını mesajlaşma üzerinden netleştirin.',
          },
          debug: debugInfo,
        });
      } catch (error) {
        try {
          await client.query('ROLLBACK');
        } catch (rollbackError) {
          console.error('❌ Error rolling back transaction:', rollbackError);
        }
        console.error('Error accepting offer:', error);
        console.error('Error stack:', error.stack);
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        return res.status(500).json({
          success: false,
          error: 'Teklif kabul edilemedi',
          details: error.message,
        });
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error accepting offer:', error);
      console.error('Error stack:', error.stack);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.status(500).json({
        success: false,
        error: 'Teklif kabul edilemedi',
        details: error.message,
      });
    }
  };

  router.post('/:id/accept', authenticateToken, idempotencyGuard, acceptOfferHandler);
  router.put('/:id/accept', authenticateToken, idempotencyGuard, acceptOfferHandler);

  // Reject offer
  router.put('/:id/reject', authenticateToken, async (req, res) => {
    try {
      if (!pool) {
        return res.status(500).json({
          success: false,
          error: 'Database not available',
        });
      }

      const { id } = req.params;
      const userId = req.user?.id ?? req.user?.userId ?? req.user?.user_id ?? req.user?.userid;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const oCols = await resolveOfferCols();
      if (!oCols?.shipmentId || !oCols?.carrierId) {
        return res.status(500).json({ success: false, error: 'Offers table schema not compatible' });
      }
      const offerTable = `"${oCols.schema}".offers`;
      const oShipmentExpr = `o.${oCols.qCol(oCols.shipmentId)}`;
      const oCarrierExpr = `o.${oCols.qCol(oCols.carrierId)}`;
      const oEstimatedExpr = oCols.estimatedDelivery ? `o.${oCols.qCol(oCols.estimatedDelivery)}` : 'NULL';
      const oCreatedExpr = oCols.createdAt ? `o.${oCols.qCol(oCols.createdAt)}` : 'NULL';
      const oUpdatedExpr = oCols.updatedAt ? `o.${oCols.qCol(oCols.updatedAt)}` : 'NULL';

      const shipMeta = await resolveShipCols();
      const shipSchemaForJoin = shipMeta?.schema || 'public';
      const shipTableForJoin = `"${shipSchemaForJoin}".shipments`;
      const sOwnerExpr = shipOwnerExprFromMeta('s', shipMeta);

      // Get offer with shipment info
      const offerResult = await pool.query(
        `SELECT o.id,
               ${oShipmentExpr} as "shipmentId",
               ${oCarrierExpr} as "carrierId",
               o.price,
               o.message,
               ${oEstimatedExpr} as "estimatedDelivery",
               NULL as "estimatedDuration",
               NULL as "specialNotes",
               o.status,
               NULL as "expiresAt",
               NULL as "isCounterOffer",
               NULL as "parentOfferId",
               ${oCreatedExpr} as "createdAt",
               ${oUpdatedExpr} as "updatedAt", ${sOwnerExpr} as "shipmentOwnerId"
         FROM ${offerTable} o
         INNER JOIN ${shipTableForJoin} s ON ${oShipmentExpr} = s.id
         WHERE o.id = $1`,
        [id]
      );

      if (offerResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Offer not found',
        });
      }

      const offer = offerResult.rows[0];

      // Check if user owns the shipment
      if (String(offer.shipmentOwnerId ?? '') !== String(userId ?? '')) {
        return res.status(403).json({
          success: false,
          message: 'You can only reject offers for your own shipments',
        });
      }

      const bypassCommission = req.user?.isDemo === true;
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const oColsTx = await resolveOfferCols();
        const offerTableTx = `"${oColsTx.schema}".offers`;
        const carrierColExpr = oColsTx.carrierId ? oColsTx.qCol(oColsTx.carrierId) : 'nakliyeci_id';
        const updatedAtColExpr = oColsTx.updatedAt ? oColsTx.qCol(oColsTx.updatedAt) : null;

        const lockOfferRes = await client.query(
          `SELECT id, status, ${carrierColExpr} as carrier_id, price
           FROM ${offerTableTx}
           WHERE id = $1
           FOR UPDATE`,
          [id]
        );
        const lockedOffer = lockOfferRes.rows && lockOfferRes.rows[0] ? lockOfferRes.rows[0] : null;
        if (!lockedOffer) {
          await client.query('ROLLBACK');
          return res.status(404).json({ success: false, message: 'Offer not found' });
        }

        const rejectSetUpdated = updatedAtColExpr ? `, ${updatedAtColExpr} = CURRENT_TIMESTAMP` : '';
        await client.query(
          `UPDATE ${offerTableTx} SET status = 'rejected'${rejectSetUpdated}
           WHERE id = $1`,
          [id]
        );

        if (!bypassCommission && lockedOffer.status === 'pending' && lockedOffer.carrier_id) {
          await releaseCommissionHold(client, lockedOffer.carrier_id, lockedOffer.id, lockedOffer.price);
        }

        await client.query('COMMIT');
      } catch (e) {
        try {
          await client.query('ROLLBACK');
        } catch (_) {
          // ignore
        }
        throw e;
      } finally {
        client.release();
      }

      try {
        emitOfferChanged({
          shipmentId: offer.shipmentId,
          offerId: offer.id,
          status: 'rejected',
          actorUserId: userId,
          carrierId: offer.carrierId,
          ownerUserId: offer.shipmentOwnerId,
        });
      } catch (_) {
        // ignore
      }

      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.json({
        success: true,
        message: 'Teklif başarıyla reddedildi',
      });

      // Notify carrier (best-effort)
      try {
        const carrierId = offer.carrierId || offer.carrier_id;
        if (createNotification && carrierId) {
          await createNotification(
            carrierId,
            'offer_rejected',
            'Teklifiniz Reddedildi',
            `Gönderi #${offer.shipmentId} için teklifiniz reddedildi.`,
            `/nakliyeci/offers`,
            'normal',
            { offerId: offer.id, shipmentId: offer.shipmentId }
          );
        }
      } catch (_) {
        // ignore
      }
    } catch (error) {
      console.error('Error rejecting offer:', error);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.status(500).json({
        success: false,
        error: 'Teklif reddedilemedi',
        details: error.message,
      });
    }
  });

  router.delete('/:id', authenticateToken, async (req, res) => {
    try {
      if (!pool) {
        return res.json({ success: true });
      }

      const { id } = req.params;
      const userId = req.user?.id ?? req.user?.userId ?? req.user?.user_id ?? req.user?.userid;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const oCols = await resolveOfferCols();
      if (!oCols?.shipmentId || !oCols?.carrierId) {
        return res.status(500).json({ success: false, error: 'Offers table schema not compatible' });
      }
      const offerTable = `"${oCols.schema}".offers`;
      const shipColExpr = oCols.qCol(oCols.shipmentId);
      const carrierColExpr = oCols.qCol(oCols.carrierId);

      const shipMeta = await resolveShipCols();
      const shipSchema = shipMeta?.schema || 'public';
      const shipTable = `"${shipSchema}".shipments`;
      const shipOwnerCol = shipMeta?.userId || shipMeta?.userId || shipMeta?.userId || shipMeta?.userid || null;
      const shipOwnerSelect = shipOwnerCol ? qShipCol(shipOwnerCol) : null;

      const offerRes = await pool.query(
        `SELECT id, ${carrierColExpr} as carrier_id, ${shipColExpr} as shipment_id
         FROM ${offerTable}
         WHERE id = $1`,
        [id]
      );

      if (offerRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Offer not found' });
      }

      const offer = offerRes.rows[0];
      const carrierId = offer.carrier_id;
      let ownerUserId = null;

      if (carrierId && carrierId !== userId) {
        try {
          if (!shipOwnerSelect) throw new Error('ship owner column not found');
          const ownerRes = await pool.query(
            `SELECT ${shipOwnerSelect} as userId FROM ${shipTable} WHERE id = $1`,
            [offer.shipment_id]
          );
          ownerUserId = ownerRes.rows[0]?.userId;
          if (String(ownerUserId ?? '') !== String(userId ?? '')) {
            return res.status(403).json({ success: false, message: 'Bu teklifi silme yetkiniz yok' });
          }
        } catch (_) {
          return res.status(403).json({ success: false, message: 'Bu teklifi silme yetkiniz yok' });
        }
      }

      // If carrier is deleting their own offer, fetch shipment owner for notification
      if (!ownerUserId) {
        try {
          if (!shipOwnerSelect) throw new Error('ship owner column not found');
          const ownerRes = await pool.query(
            `SELECT ${shipOwnerSelect} as userId FROM ${shipTable} WHERE id = $1`,
            [offer.shipment_id]
          );
          ownerUserId = ownerRes.rows[0]?.userId ?? null;
        } catch (_) {
          ownerUserId = null;
        }
      }

      const bypassCommission = req.user?.isDemo === true;
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const oColsTx = await resolveOfferCols();
        const offerTableTx = `"${oColsTx.schema}".offers`;
        const carrierColExprTx = oColsTx.carrierId ? oColsTx.qCol(oColsTx.carrierId) : 'nakliyeci_id';
        const shipColExprTx = oColsTx.shipmentId ? oColsTx.qCol(oColsTx.shipmentId) : 'shipment_id';

        const lockOfferRes = await client.query(
          `SELECT id, status, ${carrierColExprTx} as carrier_id, ${shipColExprTx} as shipment_id, price
           FROM ${offerTableTx}
           WHERE id = $1
           FOR UPDATE`,
          [id]
        );
        const lockedOffer = lockOfferRes.rows && lockOfferRes.rows[0] ? lockOfferRes.rows[0] : null;
        if (!lockedOffer) {
          await client.query('ROLLBACK');
          return res.status(404).json({ success: false, message: 'Offer not found' });
        }

        if (!bypassCommission && lockedOffer.status === 'pending' && lockedOffer.carrier_id) {
          await releaseCommissionHold(client, lockedOffer.carrier_id, lockedOffer.id, lockedOffer.price);
        }

        await client.query('DELETE FROM offers WHERE id = $1', [id]);
        await client.query('COMMIT');
      } catch (e) {
        try {
          await client.query('ROLLBACK');
        } catch (_) {
          // ignore
        }
        throw e;
      } finally {
        client.release();
      }

      try {
        emitOfferChanged({
          shipmentId: offer.shipment_id,
          offerId: id,
          status: 'deleted',
          actorUserId: userId,
          carrierId,
          ownerUserId: null,
        });
      } catch (_) {
        // ignore
      }

      // Notify counterparty (best-effort)
      try {
        if (createNotification) {
          const actorIsCarrier = carrierId && String(carrierId) === String(userId);
          const actorIsOwner = ownerUserId && String(ownerUserId) === String(userId);

          if (actorIsCarrier && ownerUserId) {
            await createNotification(
              ownerUserId,
              'offer_deleted',
              'Teklif Geri Çekildi',
              `Gönderi #${offer.shipment_id} için bir teklif geri çekildi.`,
              `/shipments/${offer.shipment_id}`,
              'normal',
              { offerId: id, shipmentId: offer.shipment_id }
            );
          }

          if (actorIsOwner && carrierId) {
            await createNotification(
              carrierId,
              'offer_deleted',
              'Teklif Silindi',
              `Gönderi #${offer.shipment_id} için teklifiniz silindi.`,
              `/nakliyeci/offers`,
              'normal',
              { offerId: id, shipmentId: offer.shipment_id }
            );
          }
        }
      } catch (_) {
        // ignore
      }

      return res.json({ success: true });
    } catch (error) {
      console.error('Error deleting offer:', error);
      return res.status(500).json({ success: false, message: 'Failed to delete offer' });
    }
  });

  return router;
}

module.exports = createOfferRoutes;


