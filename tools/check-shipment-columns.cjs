const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkColumns() {
  try {
    const client = await pool.connect();
    
    // Find schema
    const schemasRes = await client.query(
      `SELECT table_schema
       FROM information_schema.tables
       WHERE table_name = 'shipments'
       ORDER BY table_schema ASC`
    );
    
    console.log('Schemas with shipments table:', schemasRes.rows.map(r => r.table_schema));
    
    for (const row of schemasRes.rows) {
      const schema = row.table_schema;
      console.log(`\n--- Schema: ${schema} ---`);
      
      const colsRes = await client.query(
        `SELECT column_name, data_type 
         FROM information_schema.columns 
         WHERE table_name = 'shipments' AND table_schema = $1`,
        [schema]
      );
      
      const columns = colsRes.rows.map(r => r.column_name);
      console.log('Columns:', columns.join(', '));
      
      // Check for data
      const dataRes = await client.query(`SELECT * FROM "${schema}".shipments LIMIT 1`);
      console.log('Row count:', dataRes.rowCount);
      if (dataRes.rows.length > 0) {
        console.log('Sample row keys:', Object.keys(dataRes.rows[0]).join(', '));
        console.log('Sample row data (from/to):', 
          'from:', dataRes.rows[0].from, 
          'to:', dataRes.rows[0].to,
          'from_city:', dataRes.rows[0].from_city,
          'to_city:', dataRes.rows[0].to_city,
          'pickup_city:', dataRes.rows[0].pickup_city,
          'delivery_city:', dataRes.rows[0].delivery_city
        );
      }
    }
    
    client.release();
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

checkColumns();
