const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/yolnext_db',
});

async function run() {
  try {
    const client = await pool.connect();
    
    console.log('--- CHECKING OFFERS TABLE DATA ---');
    // Select all columns for the last 10 offers
    const res = await client.query(`
      SELECT *
      FROM offers 
      ORDER BY id DESC
      LIMIT 10
    `);
    
    if (res.rows.length > 0) {
        res.rows.forEach(r => {
            console.log(`\nOffer ID: ${r.id}`);
            console.log(`  shipmentid (lowercase): ${r.shipmentid}`);
            console.log(`  shipmentId (camelCase): ${r.shipmentId}`);
            console.log(`  carrierid (lowercase): ${r.carrierid}`);
            console.log(`  carrierId (camelCase): ${r.carrierId}`);
            console.log(`  price: ${r.price}`);
        });
    } else {
        console.log('No offers found.');
    }

    client.release();
  } catch (err) {
    console.error('Error:', err);
  } finally {
    pool.end();
  }
}

run();
