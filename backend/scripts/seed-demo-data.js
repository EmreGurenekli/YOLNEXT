// Seed demo shipments/offers for demo accounts
// Run: node backend/scripts/seed-demo-data.js
//
// Goal: provide at least one valid record per panel so end-to-end UI checks
// (including /tasiyici/jobs/:id) do not hit 404s with placeholder IDs.
require('dotenv').config({ path: require('path').resolve(__dirname, '../../env.local'), override: true });

const { createDatabasePool } = require('../config/database');

const DATABASE_URL = process.env.DATABASE_URL;
const NODE_ENV = process.env.NODE_ENV || 'development';

const DEMO = {
  individual: 'demo.individual@yolnext.com',
  corporate: 'demo.corporate@yolnext.com',
  nakliyeci: 'demo.nakliyeci@yolnext.com',
  tasiyici: 'demo.tasiyici@yolnext.com',
  admin: 'admin@yolnext.local',
};

const nowIso = () => new Date().toISOString();

async function main() {
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set.');
    process.exit(1);
  }

  const pool = createDatabasePool(DATABASE_URL, NODE_ENV);

  const getCols = async (table) => {
    const r = await pool.query(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_name = $1 AND table_schema = 'public'`,
      [table]
    );
    return new Set((r.rows || []).map((x) => x.column_name));
  };

  const q = (col) => {
    if (!col) return col;
    return /[A-Z]/.test(col) ? `"${col}"` : col;
  };

  const firstExisting = (cols, ...names) => names.find((n) => cols.has(n)) || null;

  const setIfExists = (cols, outCols, outParams, outVals, candidates, value) => {
    for (const col of candidates) {
      if (!cols.has(col)) continue;
      outCols.push(q(col));
      outParams.push(value);
      outVals.push(`$${outParams.length}`);
    }
  };

  const getUserId = async (email) => {
    const r = await pool.query('SELECT id, role FROM users WHERE email = $1 LIMIT 1', [email]);
    return r.rows?.[0]?.id ?? null;
  };

  const upsertShipment = async ({ key, title, ownerId, carrierId, driverId, status }) => {
    const shipmentsCols = await getCols('shipments');

    // Idempotency: try find by metadata->seedKey or by title
    let existingId = null;
    try {
      const r = await pool.query(
        `SELECT id FROM shipments WHERE metadata->>'seedKey' = $1 LIMIT 1`,
        [key]
      );
      existingId = r.rows?.[0]?.id ?? null;
    } catch (_) {
      // metadata might not exist in some schemas; fallback to title match
    }
    if (!existingId) {
      try {
        const r2 = await pool.query('SELECT id FROM shipments WHERE title = $1 LIMIT 1', [title]);
        existingId = r2.rows?.[0]?.id ?? null;
      } catch (_) {}
    }

    const cols = [];
    const params = [];
    const vals = [];

    // Core identity fields
    setIfExists(
      shipmentsCols,
      cols,
      params,
      vals,
      ['userId', 'user_id', 'ownerId', 'owner_id', 'userid'],
      ownerId
    );
    setIfExists(shipmentsCols, cols, params, vals, ['carrierId', 'carrier_id', 'nakliyeci_id'], carrierId);
    setIfExists(shipmentsCols, cols, params, vals, ['driverId', 'driver_id', 'driverid'], driverId);
    setIfExists(shipmentsCols, cols, params, vals, ['status'], status);

    // Required shipping fields (fill all common variants that exist)
    setIfExists(shipmentsCols, cols, params, vals, ['title'], title);
    setIfExists(shipmentsCols, cols, params, vals, ['description'], 'Demo gönderi kaydı (otomatik).');

    setIfExists(
      shipmentsCols,
      cols,
      params,
      vals,
      ['pickupCity', 'pickup_city', 'pickupcity', 'fromCity', 'from_city'],
      'İstanbul'
    );
    setIfExists(
      shipmentsCols,
      cols,
      params,
      vals,
      ['pickupAddress', 'pickup_address', 'pickupaddress'],
      'Kadıköy, İstanbul'
    );
    setIfExists(
      shipmentsCols,
      cols,
      params,
      vals,
      ['deliveryCity', 'delivery_city', 'deliverycity', 'toCity', 'to_city'],
      'Ankara'
    );
    setIfExists(
      shipmentsCols,
      cols,
      params,
      vals,
      ['deliveryAddress', 'delivery_address', 'deliveryaddress'],
      'Çankaya, Ankara'
    );

    // Tracking
    setIfExists(
      shipmentsCols,
      cols,
      params,
      vals,
      ['trackingNumber', 'tracking_number', 'trackingnumber'],
      `YN-${String(Date.now()).slice(-8)}`
    );

    // Metadata (best-effort)
    if (shipmentsCols.has('metadata')) {
      cols.push('metadata');
      params.push(JSON.stringify({ seedKey: key, seededAt: nowIso() }));
      vals.push(`$${params.length}`);
    }

    if (existingId) {
      // Update minimal fields for stability (don’t overwrite addresses unless present in schema)
      const sets = [];
      const uParams = [];
      let i = 1;
      const addSet = (colName, v) => {
        if (!colName) return;
        sets.push(`${q(colName)} = $${i}`);
        uParams.push(v);
        i += 1;
      };

      const ownerCol = firstExisting(shipmentsCols, 'userId', 'user_id', 'ownerId', 'owner_id', 'userid');
      const carrierCol = firstExisting(shipmentsCols, 'carrierId', 'carrier_id', 'nakliyeci_id');
      const driverCol = firstExisting(shipmentsCols, 'driverId', 'driver_id', 'driverid');
      addSet(ownerCol, ownerId);
      addSet(carrierCol, carrierId);
      addSet(driverCol, driverId);
      addSet('status', status);

      if (shipmentsCols.has('metadata')) {
        addSet('metadata', JSON.stringify({ seedKey: key, seededAt: nowIso() }));
      }

      // updated timestamp if exists
      if (shipmentsCols.has('updatedAt')) {
        sets.push(`"updatedAt" = CURRENT_TIMESTAMP`);
      } else if (shipmentsCols.has('updated_at')) {
        sets.push(`updated_at = CURRENT_TIMESTAMP`);
      }

      await pool.query(`UPDATE shipments SET ${sets.join(', ')} WHERE id = $${i}`, [...uParams, existingId]);
      return existingId;
    }

    const insertSql = `INSERT INTO shipments (${cols.join(', ')}) VALUES (${vals.join(', ')}) RETURNING id`;
    const inserted = await pool.query(insertSql, params);
    return inserted.rows?.[0]?.id ?? null;
  };

  const upsertOffer = async ({ key, shipmentId, carrierId, status, price }) => {
    const offersCols = await getCols('offers');

    let existingId = null;
    try {
      const r = await pool.query(`SELECT id FROM offers WHERE message = $1 LIMIT 1`, [key]);
      existingId = r.rows?.[0]?.id ?? null;
    } catch (_) {}

    if (existingId) {
      const sets = [];
      const params = [];
      let i = 1;
      const add = (col, v) => {
        if (!col || !offersCols.has(col)) return;
        sets.push(`${q(col)} = $${i}`);
        params.push(v);
        i += 1;
      };
      add(firstExisting(offersCols, 'shipmentId', 'shipment_id'), shipmentId);
      add(firstExisting(offersCols, 'carrierId', 'carrier_id', 'userId', 'user_id', 'nakliyeci_id'), carrierId);
      add('status', status);
      add('price', price);
      if (offersCols.has('updatedAt')) sets.push(`"updatedAt" = CURRENT_TIMESTAMP`);
      else if (offersCols.has('updated_at')) sets.push(`updated_at = CURRENT_TIMESTAMP`);
      await pool.query(`UPDATE offers SET ${sets.join(', ')} WHERE id = $${i}`, [...params, existingId]);
      return existingId;
    }

    const cols = [];
    const params = [];
    const vals = [];
    const pushCol = (col, v) => {
      if (!col || !offersCols.has(col)) return;
      cols.push(q(col));
      params.push(v);
      vals.push(`$${params.length}`);
    };

    pushCol(firstExisting(offersCols, 'shipmentId', 'shipment_id'), shipmentId);
    pushCol(firstExisting(offersCols, 'carrierId', 'carrier_id', 'userId', 'user_id', 'nakliyeci_id'), carrierId);
    pushCol('price', price);
    pushCol('status', status);
    pushCol('message', key);

    const inserted = await pool.query(
      `INSERT INTO offers (${cols.join(', ')}) VALUES (${vals.join(', ')}) RETURNING id`,
      params
    );
    return inserted.rows?.[0]?.id ?? null;
  };

  try {
    await pool.query('SELECT 1');

    const ids = {
      individual: await getUserId(DEMO.individual),
      corporate: await getUserId(DEMO.corporate),
      nakliyeci: await getUserId(DEMO.nakliyeci),
      tasiyici: await getUserId(DEMO.tasiyici),
      admin: await getUserId(DEMO.admin),
    };

    const missing = Object.entries(ids)
      .filter(([, v]) => !v)
      .map(([k]) => k);
    if (missing.length) {
      console.error(`❌ Missing demo users: ${missing.join(', ')}`);
      process.exitCode = 1;
      return;
    }

    // Shipments:
    // - One awaiting offers (shipper experience)
    // - One active assigned to driver (tasiyici/jobs experience)
    // - One delivered/completed (history experience)
    const s1 = await upsertShipment({
      key: 'demo_shipment_waiting',
      title: 'Demo Gönderi (Teklif Bekliyor)',
      ownerId: ids.individual,
      carrierId: null,
      driverId: null,
      status: 'waiting_for_offers',
    });

    const s2 = await upsertShipment({
      key: 'demo_shipment_active_driver',
      title: 'Demo Gönderi (Taşıyıcıda)',
      ownerId: ids.corporate,
      carrierId: ids.nakliyeci,
      driverId: ids.tasiyici,
      status: 'in_transit',
    });

    const s3 = await upsertShipment({
      key: 'demo_shipment_completed',
      title: 'Demo Gönderi (Tamamlandı)',
      ownerId: ids.individual,
      carrierId: ids.nakliyeci,
      driverId: ids.tasiyici,
      status: 'completed',
    });

    if (!s1 || !s2 || !s3) {
      console.error('❌ Failed to create demo shipments.');
      process.exitCode = 1;
      return;
    }

    // Offers (one offer for waiting shipment)
    await upsertOffer({
      key: 'Demo teklif: Nakliyeci → Gönderi (Teklif Bekliyor)',
      shipmentId: s1,
      carrierId: ids.nakliyeci,
      status: 'pending',
      price: 2500,
    });

    console.log('✅ Demo data seeded.');
    console.log(`- waiting shipment id: ${s1}`);
    console.log(`- driver shipment id: ${s2}`);
    console.log(`- completed shipment id: ${s3}`);
  } catch (e) {
    console.error('❌ Seed failed:', e?.message || e);
    process.exitCode = 1;
  } finally {
    await pool.end().catch(() => null);
  }
}

if (require.main === module) {
  main();
}

