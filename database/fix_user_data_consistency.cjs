const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'yolnext', 
  user: 'postgres',
  password: '2563'
});

async function fixUserDataConsistency() {
  const client = await pool.connect();
  
  try {
    console.log('📊 Fixing user data consistency for routing...\n');
    
    // Check current state
    console.log('🔍 Current user states:');
    const currentResult = await client.query(`
      SELECT email, role, firstname, lastname, "firstName", "lastName"
      FROM users 
      WHERE email IN ('mehmet.yilmaz.nakliyeci@test.com', 'hasan.korkmaz.tasiyici@test.com')
      ORDER BY email
    `);
    
    currentResult.rows.forEach(row => {
      console.log(`  ${row.email}:`);
      console.log(`    role: ${row.role}`);
      console.log(`    firstname: ${row.firstname}, lastName: ${row.lastName}`);
      console.log(`    firstName: ${row.firstName}, lastname: ${row.lastname}\n`);
    });
    
    // Fix Mehmet Yılmaz (nakliyeci)
    console.log('🔧 Updating Mehmet Yılmaz (nakliyeci)...');
    await client.query(`
      UPDATE users 
      SET 
        role = 'nakliyeci',
        firstname = 'Mehmet',
        lastname = 'Yılmaz',
        "firstName" = 'Mehmet',
        "lastName" = 'Yılmaz',
        fullname = 'Mehmet Yılmaz',
        "fullName" = 'Mehmet Yılmaz',
        companyname = 'Yılmaz Nakliyat',
        "companyName" = 'Yılmaz Nakliyat',
        isactive = true,
        "isActive" = true
      WHERE email = 'mehmet.yilmaz.nakliyeci@test.com'
    `);
    
    // Fix Hasan Korkmaz (taşıyıcı)
    console.log('🔧 Updating Hasan Korkmaz (taşıyıcı)...');
    await client.query(`
      UPDATE users 
      SET 
        role = 'tasiyici',
        firstname = 'Hasan',
        lastname = 'Korkmaz',
        "firstName" = 'Hasan',
        "lastName" = 'Korkmaz',
        fullname = 'Hasan Korkmaz',
        "fullName" = 'Hasan Korkmaz',
        isactive = true,
        "isActive" = true
      WHERE email = 'hasan.korkmaz.tasiyici@test.com'
    `);
    
    // Verify updates
    console.log('\n✅ Verification - Updated user states:');
    const verifyResult = await client.query(`
      SELECT email, role, firstname, lastname, "firstName", "lastName", fullname, "fullName"
      FROM users 
      WHERE email IN ('mehmet.yilmaz.nakliyeci@test.com', 'hasan.korkmaz.tasiyici@test.com')
      ORDER BY email
    `);
    
    verifyResult.rows.forEach(row => {
      console.log(`  ${row.email}:`);
      console.log(`    role: ${row.role}`);
      console.log(`    names: ${row.firstname} ${row.lastname} | ${row.firstName} ${row.lastName}`);
      console.log(`    fullname: ${row.fullname} | ${row.fullName}\n`);
    });
    
    console.log('🎉 User data consistency fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

fixUserDataConsistency();
