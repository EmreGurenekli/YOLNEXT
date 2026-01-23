const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  try {
    // 1. List all columns in shipments table
    const res = await pool.query(`
      SELECT table_schema, column_name 
      FROM information_schema.columns 
      WHERE table_name = 'shipments'
      ORDER BY table_schema, column_name
    `);
    
    console.log('--- SHIPMENTS TABLE COLUMNS ---');
    res.rows.forEach(r => {
      console.log(`${r.table_schema}.${r.column_name}`);
    });

    // 2. Dump specific shipments referenced in offers
    // Use * to see what data is populated
    const ids = [89, 94, 21, 100, 105, 111, 118, 116];
    console.log(`\n--- DATA FOR SHIPMENTS: ${ids.join(', ')} ---`);
    
    // We'll try to guess the schema (usually public)
    const schema = res.rows.length > 0 ? res.rows[0].table_schema : 'public';
    
    const data = await pool.query(`SELECT * FROM "${schema}".shipments WHERE id = ANY($1::int[])`, [ids]);
    
    if (data.rows.length === 0) {
      console.log('No shipments found with these IDs.');
    } else {
      data.rows.forEach(row => {
        console.log(`\nShipment ID: ${row.id}`);
        // Log fields that might contain city info
        const cityFields = Object.keys(row).filter(k => 
          k.toLowerCase().includes('city') || 
          k.toLowerCase().includes('from') || 
          k.toLowerCase().includes('to') || 
          k.toLowerCase().includes('pickup') || 
          k.toLowerCase().includes('delivery') ||
          k.toLowerCase().includes('address')
        );
        
        cityFields.forEach(field => {
          console.log(`  ${field}: ${JSON.stringify(row[field])}`);
        });
      });
    }

  } catch (e) {
    console.error('Error:', e);
  } finally {
    pool.end();
  }
}

run();
