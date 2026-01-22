const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'yolnext', 
  user: 'postgres',
  password: '2563'
});

async function checkPasswordColumn() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking password-related columns in users table...\n');
    
    // Check all columns that might contain password
    const schemaResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND (column_name ILIKE '%password%' OR column_name ILIKE '%pass%')
      ORDER BY column_name
    `);
    
    console.log('📋 Password-related columns:');
    schemaResult.rows.forEach(row => {
      console.log(`  ${row.column_name} (${row.data_type})`);
    });
    
    // Also check a sample user to see actual column names
    console.log('\n🔍 Sample user data structure:');
    const sampleResult = await client.query(`
      SELECT *
      FROM users 
      WHERE email = 'mehmet.yilmaz.nakliyeci@test.com'
      LIMIT 1
    `);
    
    if (sampleResult.rows.length > 0) {
      console.log('📊 Available columns in users table:');
      Object.keys(sampleResult.rows[0]).forEach(col => {
        console.log(`  ${col}`);
      });
      
      const user = sampleResult.rows[0];
      console.log('\n🔐 Password-related field values:');
      if (user.password) console.log(`  password: ${user.password ? '[HASH_EXISTS]' : '[NULL]'}`);
      if (user.password_hash) console.log(`  password_hash: ${user.password_hash ? '[HASH_EXISTS]' : '[NULL]'}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkPasswordColumn();
