const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/yolnext_db',
});

async function run() {
  try {
    const client = await pool.connect();
    
    // 1. Check Offers Table Columns
    const oCols = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'offers'
      ORDER BY ordinal_position
    `);
    console.log('--- OFFERS COLUMNS ---');
    console.log(oCols.rows.map(r => r.column_name).join(', '));

    // 2. Check Data for recent offers
    // We'll try common column names for shipment_id
    let shipmentIdCol = 'shipment_id';
    if (!oCols.rows.find(r => r.column_name === 'shipment_id')) {
        shipmentIdCol = oCols.rows.find(r => r.column_name === 'shipmentid')?.column_name || 'shipment_id';
    }
    
    console.log(`Using shipment_id column: ${shipmentIdCol}`);

    const query = `
      SELECT o.id as offer_id, o.${shipmentIdCol}, 
             s.id as s_id, s.pickupcity, s.deliverycity, s.pickupaddress, s.deliveryaddress
      FROM offers o
      LEFT JOIN shipments s ON o.${shipmentIdCol} = s.id
      ORDER BY o.id DESC
      LIMIT 10
    `;
    
    const res = await client.query(query);
    console.log('\n--- RECENT OFFERS JOINED WITH SHIPMENTS ---');
    console.table(res.rows);

    client.release();
  } catch (err) {
    console.error('Error:', err);
  } finally {
    pool.end();
  }
}

run();
