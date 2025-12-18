// Debug script to run the open shipments query as nakliyeci
require('dotenv').config();
const { Pool } = require('pg');
const { getEnv } = require('../utils/envValidator');
const { getPagination } = require('../utils/routeHelpers');

async function run() {
  const pool = new Pool({
    connectionString: getEnv('DATABASE_URL', 'postgresql://postgres:2563@localhost:5432/yolnext'),
    ssl: false,
  });

  try {
    const userId = 1001; // demo nakliyeci
    const { page, limit, offset } = getPagination({ query: { page: 1, limit: 20 } });

    const countSql = `
      SELECT COUNT(*) as count
      FROM shipments s
      WHERE s.status IN ('pending', 'waiting_for_offers', 'open')
      AND s.id NOT IN (
        SELECT o."shipment_id"
        FROM offers o
        WHERE o."nakliyeci_id" = $1 AND o.status = 'pending'
      )
    `;

    const count = await pool.query(countSql, [userId]);
    console.log('count', count.rows);

    const listSql = `
      SELECT s.*,
             u."fullName" as "ownerName",
             u."companyName" as "ownerCompany"
      FROM shipments s
      LEFT JOIN users u ON s."ownerId" = u.id
      WHERE s.status IN ('pending', 'waiting_for_offers', 'open')
      AND s.id NOT IN (
        SELECT o."shipment_id"
        FROM offers o
        WHERE o."nakliyeci_id" = $1 AND o.status = 'pending'
      )
      ORDER BY s."createdAt" DESC
      LIMIT $2 OFFSET $3
    `;

    const res = await pool.query(listSql, [userId, limit, offset]);
    console.log('rows', res.rows.length);
    console.log('sample row', res.rows[0]);
  } catch (e) {
    console.error('ERROR', e);
  } finally {
    await pool.end();
  }
}

run();






