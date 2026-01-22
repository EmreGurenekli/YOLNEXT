const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/yolnext_db',
});

async function run() {
  try {
    const client = await pool.connect();
    console.log('Connected to DB');

    // 1. Get Shipments Columns
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'shipments'
      ORDER BY ordinal_position
    `);
    
    console.log('\n--- SHIPMENTS COLUMNS ---');
    console.log(res.rows.map(r => r.column_name).join(', '));

    // 2. Sample Data
    const data = await client.query('SELECT * FROM shipments LIMIT 5');
    console.log('\n--- SAMPLE SHIPMENT DATA (First 5) ---');
    if (data.rows.length > 0) {
        data.rows.forEach((row, i) => {
            console.log(`\nRow ${i+1} ID: ${row.id}`);
            // Log likely city fields
            Object.keys(row).forEach(k => {
                if (['from', 'to', 'pickup', 'delivery', 'city', 'address'].some(term => k.toLowerCase().includes(term))) {
                    console.log(`  ${k}: ${row[k]}`);
                }
            });
        });
    } else {
        console.log('No shipments found.');
    }

    client.release();
  } catch (err) {
    console.error('Error:', err);
  } finally {
    pool.end();
  }
}

run();
