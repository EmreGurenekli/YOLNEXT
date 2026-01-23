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
    
    // Check Mehmet Yılmaz registration
    const result = await client.query(`
      SELECT id, email, "firstName", "lastName", firstname, lastname, 
             user_type, role, "companyName", companyname, 
             created_at, "createdAt"
      FROM users 
      WHERE email = 'mehmet.yilmaz.nakliyeci@test.com'
      ORDER BY id DESC
      LIMIT 1
    `);
    
    if (result.rows.length > 0) {
      console.log('📋 Mehmet Yılmaz user record:');
      console.log(result.rows[0]);
      
      const user = result.rows[0];
      console.log('\n🔍 Analysis:');
      console.log(`  Email: ${user.email}`);
      console.log(`  Name: ${user.firstName || user.firstname} ${user.lastName || user.lastname}`);
      console.log(`  User Type: ${user.user_type}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Company: ${user.companyName || user.companyname}`);
      console.log(`  Created: ${user.created_at || user.createdAt}`);
      
      if (user.user_type !== 'carrier') {
        console.log('\n❌ PROBLEM FOUND: user_type is not "carrier"!');
        console.log(`   Expected: "carrier"`);
        console.log(`   Actual: "${user.user_type}"`);
      } else {
        console.log('\n✅ User type is correct: "carrier"');
        console.log('   Problem might be in frontend routing logic');
      }
    } else {
      console.log('❌ No user found with email mehmet.yilmaz.nakliyeci@test.com');
    }
    
    // Also check Emre Güven for comparison
    console.log('\n🔍 Checking Emre Güven for comparison...');
    const emreResult = await client.query(`
      SELECT id, email, "firstName", "lastName", user_type, role
      FROM users 
      WHERE email = 'emre.guven.real@test.com'
      ORDER BY id DESC
      LIMIT 1
    `);
    
    if (emreResult.rows.length > 0) {
      console.log('📋 Emre Güven user record:');
      const emre = emreResult.rows[0];
      console.log(`  Email: ${emre.email}`);
      console.log(`  Name: ${emre.firstName} ${emre.lastName}`);
      console.log(`  User Type: ${emre.user_type}`);
      console.log(`  Role: ${emre.role}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkUserType();
