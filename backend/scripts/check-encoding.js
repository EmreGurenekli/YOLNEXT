const { Pool } = require('pg');

function qIdent(ident) {
  if (!ident) return '';
  return /[A-Z]/.test(ident) ? `"${ident}"` : ident;
}

function pickCol(existingCols, ...candidates) {
  const lower = new Map(existingCols.map(c => [String(c).toLowerCase(), c]));
  for (const c of candidates) {
    if (!c) continue;
    const direct = existingCols.find(x => x === c);
    if (direct) return direct;
    const hit = lower.get(String(c).toLowerCase());
    if (hit) return hit;
  }
  return null;
}

async function main() {
  const cs =
    process.env.DATABASE_URL || 'postgresql://postgres:2563@localhost:5432/yolnext';

  const pool = new Pool({ connectionString: cs });

  try {
    const serverEnc = await pool.query('SHOW server_encoding');
    const clientEnc = await pool.query('SHOW client_encoding');
    const db = await pool.query(
      'SELECT current_database() as datname, pg_encoding_to_char(encoding) AS encoding, datcollate, datctype FROM pg_database WHERE datname = current_database()'
    );

    console.log('--- Postgres Encoding ---');
    console.log({
      server_encoding: serverEnc.rows?.[0]?.server_encoding,
      client_encoding: clientEnc.rows?.[0]?.client_encoding,
      db: db.rows?.[0],
    });

    const colsRes = await pool.query(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'shipments'
       ORDER BY ordinal_position ASC`
    );
    const cols = (colsRes.rows || []).map(r => r.column_name).filter(Boolean);
    if (!cols.length) {
      throw new Error('No columns found for public.shipments');
    }

    const pickupCityCol = pickCol(cols, 'pickupCity', 'pickup_city', 'pickupcity');
    const pickupDistrictCol = pickCol(cols, 'pickupDistrict', 'pickup_district', 'pickupdistric', 'pickupdistrict');
    const pickupAddressCol = pickCol(cols, 'pickupAddress', 'pickup_address', 'pickupaddress', 'from_address');
    const deliveryCityCol = pickCol(cols, 'deliveryCity', 'delivery_city', 'deliverycity');
    const deliveryDistrictCol = pickCol(cols, 'deliveryDistrict', 'delivery_district', 'deliverydistrict');
    const deliveryAddressCol = pickCol(cols, 'deliveryAddress', 'delivery_address', 'deliveryaddress', 'to_address');

    const resolved = {
      pickupCityCol,
      pickupDistrictCol,
      pickupAddressCol,
      deliveryCityCol,
      deliveryDistrictCol,
      deliveryAddressCol,
    };
    console.log('--- Resolved shipments columns ---');
    console.log(resolved);

    const selectFields = [
      pickupCityCol ? `${qIdent(pickupCityCol)} as pickup_city` : `NULL::text as pickup_city`,
      pickupDistrictCol ? `${qIdent(pickupDistrictCol)} as pickup_district` : `NULL::text as pickup_district`,
      pickupAddressCol ? `${qIdent(pickupAddressCol)} as pickup_address` : `NULL::text as pickup_address`,
      deliveryCityCol ? `${qIdent(deliveryCityCol)} as delivery_city` : `NULL::text as delivery_city`,
      deliveryDistrictCol ? `${qIdent(deliveryDistrictCol)} as delivery_district` : `NULL::text as delivery_district`,
      deliveryAddressCol ? `${qIdent(deliveryAddressCol)} as delivery_address` : `NULL::text as delivery_address`,
    ].join(',\n         ');

    // Inspect recent shipment rows for non-ascii characters
    // NOTE: Uses quoted camelCase columns as per the runtime schema.
    const shipments = await pool.query(
      `SELECT
         id,
         ${selectFields}
       FROM shipments
       ORDER BY id DESC
       LIMIT 50`
    );

    console.log('--- Recent shipments (raw text) ---');
    console.table(shipments.rows);

    // Specifically find rows mentioning Kad*
    const whereParts = [];
    if (pickupDistrictCol) whereParts.push(`${qIdent(pickupDistrictCol)} ILIKE $1`);
    if (pickupAddressCol) whereParts.push(`${qIdent(pickupAddressCol)} ILIKE $1`);
    if (deliveryDistrictCol) whereParts.push(`${qIdent(deliveryDistrictCol)} ILIKE $1`);
    if (deliveryAddressCol) whereParts.push(`${qIdent(deliveryAddressCol)} ILIKE $1`);

    const kad = whereParts.length
      ? await pool.query(
          `SELECT
             id,
             ${selectFields}
           FROM shipments
           WHERE (${whereParts.join(' OR ')})
           ORDER BY id DESC
           LIMIT 50`,
          ['%kad%']
        )
      : { rows: [] };

    console.log('--- Shipments matching "%kad%" ---');
    console.table(kad.rows);

    if (whereParts.length) {
      const resolvedPickupDistrict = pickupDistrictCol ? qIdent(pickupDistrictCol) : null;
      const resolvedPickupAddress = pickupAddressCol ? qIdent(pickupAddressCol) : null;
      const resolvedDeliveryDistrict = deliveryDistrictCol ? qIdent(deliveryDistrictCol) : null;
      const resolvedDeliveryAddress = deliveryAddressCol ? qIdent(deliveryAddressCol) : null;

      const hexPick = (expr, alias) =>
        expr
          ? `encode(convert_to(coalesce(${expr}::text, ''), 'UTF8'), 'hex') as ${alias}`
          : `NULL::text as ${alias}`;

      const debugSql = `SELECT
        id,
        ${selectFields},
        ${hexPick(resolvedPickupDistrict, 'pickup_district_hex')},
        ${hexPick(resolvedPickupAddress, 'pickup_address_hex')},
        ${hexPick(resolvedDeliveryDistrict, 'delivery_district_hex')},
        ${hexPick(resolvedDeliveryAddress, 'delivery_address_hex')}
      FROM shipments
      WHERE (${whereParts.join(' OR ')})
      ORDER BY id DESC
      LIMIT 20`;

      const dbg = await pool.query(debugSql, ['%kad%']);
      const hasReplacementChar = (s) => typeof s === 'string' && s.includes('\uFFFD');

      console.log('--- UTF-8 hex debug for "%kad%" rows ---');
      console.table(
        (dbg.rows || []).map(r => ({
          id: r.id,
          pickup_address: r.pickup_address,
          pickup_address_hex: r.pickup_address_hex,
          pickup_district: r.pickup_district,
          pickup_district_hex: r.pickup_district_hex,
          delivery_address: r.delivery_address,
          delivery_address_hex: r.delivery_address_hex,
          delivery_district: r.delivery_district,
          delivery_district_hex: r.delivery_district_hex,
          has_replacement_char:
            hasReplacementChar(r.pickup_address) ||
            hasReplacementChar(r.pickup_district) ||
            hasReplacementChar(r.delivery_address) ||
            hasReplacementChar(r.delivery_district),
        }))
      );
    }
  } finally {
    await pool.end().catch(() => null);
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = main;
