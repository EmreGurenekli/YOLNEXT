const { Pool } = require('pg');

// PostgreSQL connection
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'yolnext', 
  user: 'postgres',
  password: '2563'
});

async function checkSchema() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking users table schema...');
    
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Users table columns:');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name} (${row.data_type}) - nullable: ${row.is_nullable}`);
    });
    
    console.log('\n🔍 Checking if users table has any data...');
    const countResult = await client.query(`SELECT COUNT(*) as count FROM users`);
    console.log(`📊 Users table has ${countResult.rows[0].count} records`);
    
    if (countResult.rows[0].count > 0) {
      console.log('\n📋 Sample user record:');
      const sampleResult = await client.query(`SELECT * FROM users LIMIT 1`);
      console.log(sampleResult.rows[0]);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkSchema();
