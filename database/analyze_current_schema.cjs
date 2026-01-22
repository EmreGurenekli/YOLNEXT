const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'yolnext', 
  user: 'postgres',
  password: '2563'
});

async function analyzeCurrentSchema() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Analyzing current database schema and user data...\n');
    
    // Check table schema
    const schemaResult = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Users table schema:');
    schemaResult.rows.forEach(row => {
      console.log(`  ${row.column_name} (${row.data_type}, nullable: ${row.is_nullable})`);
    });
    
    console.log('\n📊 Current user data for problem users:');
    
    // Check Mehmet Yılmaz
    const mehmetResult = await client.query(`
      SELECT id, email, role, user_type, firstname, lastname, "firstName", "lastName"
      FROM users 
      WHERE email = 'mehmet.yilmaz.nakliyeci@test.com'
    `);
    
    if (mehmetResult.rows.length > 0) {
      console.log('\n👤 Mehmet Yılmaz (Nakliyeci):');
      console.log(mehmetResult.rows[0]);
    }
    
    // Check Hasan Korkmaz
    const hasanResult = await client.query(`
      SELECT id, email, role, user_type, firstname, lastname, "firstName", "lastName"
      FROM users 
      WHERE email = 'hasan.korkmaz.tasiyici@test.com'
    `);
    
    if (hasanResult.rows.length > 0) {
      console.log('\n👤 Hasan Korkmaz (Taşıyıcı):');
      console.log(hasanResult.rows[0]);
    }
    
    // Check demo users for reference
    console.log('\n📝 Demo user roles for reference:');
    const demoResult = await client.query(`
      SELECT email, role, user_type 
      FROM users 
      WHERE email LIKE '%demo%' OR email LIKE '%test%'
      ORDER BY email
      LIMIT 5
    `);
    
    demoResult.rows.forEach(row => {
      console.log(`  ${row.email}: role=${row.role}, user_type=${row.user_type}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

analyzeCurrentSchema();
