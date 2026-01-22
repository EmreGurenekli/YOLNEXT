const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:2563@localhost:5432/yolnext'
});

async function checkSchema() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'ratings' 
      ORDER BY ordinal_position
    `);
    
    console.log('Ratings table columns:');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type}`);
    });
    
    if (result.rows.length === 0) {
      console.log('Ratings table does not exist');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkSchema();
