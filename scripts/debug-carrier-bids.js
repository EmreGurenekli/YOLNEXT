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

loadEnvLocal();

const { Pool } = pg;

async function main() {
  const carrierEmail = process.argv[2];
  const carrierIdArg = process.argv[3];

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is missing (env.local)');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    // Find carrier id
    let carrierId = carrierIdArg ? Number(carrierIdArg) : null;
    if (!carrierId && carrierEmail) {
      const u = await pool.query('SELECT id, email, "fullName" as full_name, role FROM users WHERE email = $1 LIMIT 1', [carrierEmail]);
      console.log('User by email:', u.rows[0] || null);
      carrierId = u.rows[0]?.id ? Number(u.rows[0].id) : null;
    }

    const tRes = await pool.query(
      `SELECT table_schema
       FROM information_schema.tables
       WHERE table_name = 'carrier_market_bids'
       ORDER BY (table_schema = 'public') DESC, table_schema ASC
       LIMIT 1`
    );
    const schema = tRes.rows?.[0]?.table_schema;
    if (!schema) {
      console.log('carrier_market_bids table not found');
      return;
    }

    const colsRes = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'carrier_market_bids' AND table_schema = $1`,
      [schema]
    );
    const colSet = new Set(colsRes.rows.map(r => r.column_name));
    console.log('carrier_market_bids columns:', Array.from(colSet).sort().join(', '));
    const pick = (...names) => names.find(n => colSet.has(n));
    const qIdent = (c) => (/[A-Z]/.test(c) ? `"${c}"` : c);

    const idCol = pick('id') || 'id';
    const carrierCol = pick('bidderCarrierId', 'bidder_carrier_id', 'carrier_id','carrierId','carrierid','user_id','userId','userid');
    const listingCol = pick('listing_id','listingId','listingid');
    const priceCol = pick('bid_price','bidPrice','bidprice','price');
    const statusCol = pick('status');
    const createdCol = pick('created_at','createdAt','createdat');

    console.log('carrier_market_bids schema:', schema);
    console.log('Detected cols:', { idCol, carrierCol, listingCol, priceCol, statusCol, createdCol });

    // show last 10 bids
    const lastQ = `SELECT ${qIdent(idCol)} as id${carrierCol ? `, ${qIdent(carrierCol)} as carrier_id` : ''}${listingCol ? `, ${qIdent(listingCol)} as listing_id` : ''}${priceCol ? `, ${qIdent(priceCol)} as price` : ''}${statusCol ? `, ${qIdent(statusCol)} as status` : ''}${createdCol ? `, ${qIdent(createdCol)} as created_at` : ''} FROM "${schema}".carrier_market_bids ORDER BY ${qIdent(createdCol || idCol)} DESC LIMIT 10`;
    const last = await pool.query(lastQ);
    console.log('Last 10 bids:', last.rows);

    if (!carrierId) {
      console.log('No carrierId resolved. Pass email as argv[2] or carrierId as argv[3].');
      return;
    }

    if (!carrierCol) {
      console.log('No carrier column detected on carrier_market_bids.');
      return;
    }

    const mineQ = `SELECT ${qIdent(idCol)} as id${listingCol ? `, ${qIdent(listingCol)} as listing_id` : ''}${priceCol ? `, ${qIdent(priceCol)} as price` : ''}${statusCol ? `, ${qIdent(statusCol)} as status` : ''}${createdCol ? `, ${qIdent(createdCol)} as created_at` : ''} FROM "${schema}".carrier_market_bids WHERE ${qIdent(carrierCol)} = $1 ORDER BY ${qIdent(createdCol || idCol)} DESC LIMIT 50`;
    const mine = await pool.query(mineQ, [carrierId]);
    console.log(`Bids for carrierId=${carrierId}:`, mine.rows);
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error('Debug script failed:', e);
  process.exit(1);
});
