const { Pool } = require('pg');

// PostgreSQL connection
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'yolnext', 
  user: 'postgres',
  password: '2563'
});

async function checkUserType() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking Mehmet Yılmaz user type...');
    
    // Check all columns for Mehmet Yılmaz registration
    const result = await client.query(`
      SELECT *
      FROM users 
      WHERE email = 'mehmet.yilmaz.nakliyeci@test.com'
      ORDER BY id DESC
      LIMIT 1
    `);
    
    if (result.rows.length > 0) {
      console.log('📋 Mehmet Yılmaz user record:');
      const user = result.rows[0];
      console.log(user);
      
      // Check which role/type fields exist
      console.log('\n🔍 Role/Type Analysis:');
      console.log(`  role field: ${user.role}`);
      console.log(`  usertype field: ${user.usertype}`);
      
      // Check if it's carrier/nakliyeci
      if (user.role === 'carrier' || user.role === 'nakliyeci') {
        console.log('\n✅ User is registered as carrier/nakliyeci');
        console.log('   Problem is likely in frontend routing logic');
      } else {
        console.log(`\n❌ PROBLEM: User role is "${user.role}", should be "carrier" or "nakliyeci"`);
      }
    } else {
      console.log('❌ No user found with email mehmet.yilmaz.nakliyeci@test.com');
    }
    
    // Also check Emre Güven for comparison
    console.log('\n\n🔍 Checking Emre Güven for comparison...');
    const emreResult = await client.query(`
      SELECT id, email, "firstName", "lastName", firstname, lastname, role
      FROM users 
      WHERE email = 'emre.guven.real@test.com'
      ORDER BY id DESC
      LIMIT 1
    `);
    
    if (emreResult.rows.length > 0) {
      console.log('📋 Emre Güven user record:');
      const emre = emreResult.rows[0];
      console.log(`  Email: ${emre.email}`);
      console.log(`  Name: ${emre.firstName || emre.firstname} ${emre.lastName || emre.lastname}`);
      console.log(`  Role: ${emre.role}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkUserType();
