import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const loadEnvLocal = () => {
  const envPath = path.resolve(__dirname, '..', 'env.local');
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
};

try {
  loadEnvLocal();
} catch (_) {
  // ignore
}

const { Pool } = pg;

async function main() {
  const trackingNumber = process.argv[2];
  if (!trackingNumber) {
    console.error('Usage: node scripts/debug-shipment-driver.js <trackingNumber>');
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is missing (env.local)');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    const { rows: shipTables } = await pool.query(
      `SELECT table_schema
       FROM information_schema.tables
       WHERE table_name = 'shipments'
       ORDER BY (table_schema = 'public') DESC, table_schema ASC
       LIMIT 1`
    );
    const shipSchema = shipTables?.[0]?.table_schema || 'public';

    const { rows: cols } = await pool.query(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_name = 'shipments' AND table_schema = $1
       ORDER BY ordinal_position`,
      [shipSchema]
    );

    const colSet = new Set(cols.map(r => r.column_name));
    const pick = (...names) => names.find(n => colSet.has(n));

    const trackingCol = pick('trackingNumber', 'tracking_number', 'tracking_code', 'tracking');
    if (!trackingCol) {
      console.error('No tracking column found on shipments table.');
      console.error('Columns:', Array.from(colSet).join(', '));
      process.exit(2);
    }

    const driverCol = pick('driver_id', 'driverId', 'driverID', 'driverid', 'assigned_driver_id', 'assignedDriverId');
    const carrierCol = pick('nakliyeci_id', 'carrier_id', 'carrierId', 'carrierid');

    const qIdent = (c) => (/[A-Z]/.test(c) ? `"${c}"` : c);

    console.log('Detected trackingCol:', trackingCol);
    console.log('Detected driverCol:', driverCol || null);
    console.log('Detected carrierCol:', carrierCol || null);

    const q = `SELECT id, ${qIdent(trackingCol)} as tracking, status${driverCol ? `, ${qIdent(driverCol)} as driver_id` : ''}${carrierCol ? `, ${qIdent(carrierCol)} as carrier_id` : ''}
               FROM "${shipSchema}".shipments
               WHERE ${qIdent(trackingCol)} = $1
               LIMIT 1`;

    const { rows } = await pool.query(q, [trackingNumber]);
    if (!rows[0]) {
      console.log('Shipment not found by tracking number:', trackingNumber);
      const recent = await pool.query(
        `SELECT id${trackingCol ? `, ${qIdent(trackingCol)} as tracking` : ''}, status
         FROM "${shipSchema}".shipments
         ORDER BY id DESC
         LIMIT 10`
      );
      console.log('Recent shipments:', recent.rows);
      return;
    }

    const shipment = rows[0];
    console.log('Shipment:', shipment);

    const driverId = shipment.driver_id;
    if (!driverId) {
      console.log('No driver id on shipment.');
      return;
    }

    const u = await pool.query(
      'SELECT id, "fullName" as full_name, phone, email, role FROM users WHERE id = $1',
      [driverId]
    );
    console.log('Driver user:', u.rows[0] || null);
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error('Debug script failed:', e);
  process.exit(1);
});
