const { Pool } = require('pg');

// PostgreSQL connection
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'yolnext', 
  user: 'postgres',
  password: '2563'
});

async function checkAndFixHasanUserType() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking Hasan Korkmaz user type...');
    
    // Check Hasan Korkmaz registration - simplified query
    const result = await client.query(`
      SELECT *
      FROM users 
      WHERE email = 'hasan.korkmaz.tasiyici@test.com'
      ORDER BY id DESC
      LIMIT 1
    `);
    
    if (result.rows.length > 0) {
      console.log('📋 Hasan Korkmaz user record:');
      const user = result.rows[0];
      console.log(user);
      
      console.log('\n🔍 Analysis:');
      console.log(`  Email: ${user.email}`);
      console.log(`  Name: ${user.firstName || user.firstname} ${user.lastName || user.lastname}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  ID: ${user.id}`);
      
      if (user.role !== 'driver') {
        console.log('\n🔧 FIXING: user role is not "driver"!');
        console.log(`   Current: "${user.role}" → Target: "driver"`);
        
        // Update Hasan's user type to driver
        const updateResult = await client.query(`
          UPDATE users 
          SET role = 'driver',
              firstname = 'Hasan',
              lastname = 'Korkmaz',
              "firstName" = 'Hasan',
              "lastName" = 'Korkmaz',
              fullname = 'Hasan Korkmaz',
              "fullName" = 'Hasan Korkmaz'
          WHERE email = 'hasan.korkmaz.tasiyici@test.com'
          RETURNING id, email, role, firstname, lastname
        `);
        
        if (updateResult.rows.length > 0) {
          console.log('\n✅ Successfully updated Hasan Korkmaz record:');
          console.log(updateResult.rows[0]);
          console.log(`🎯 User type fixed: ${user.role} → driver`);
        }
      } else {
        console.log('\n✅ User type is correct: "driver"');
      }
    } else {
      console.log('❌ No user found with email hasan.korkmaz.tasiyici@test.com');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkAndFixHasanUserType();
