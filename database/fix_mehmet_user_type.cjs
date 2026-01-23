const { Pool } = require('pg');

// PostgreSQL connection
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'yolnext', 
  user: 'postgres',
  password: '2563'
});

async function fixMehmetUserType() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing Mehmet Yılmaz user type...');
    
    // Update Mehmet's user type to carrier
    const result = await client.query(`
      UPDATE users 
      SET role = 'carrier',
          firstname = 'Mehmet',
          lastname = 'Yılmaz',
          "firstName" = 'Mehmet',
          "lastName" = 'Yılmaz',
          fullname = 'Mehmet Yılmaz',
          "fullName" = 'Mehmet Yılmaz',
          companyname = 'Yılmaz Nakliye ve Lojistik A.Ş.',
          "companyName" = 'Yılmaz Nakliye ve Lojistik A.Ş.'
      WHERE email = 'mehmet.yilmaz.nakliyeci@test.com'
      RETURNING id, email, role, firstname, lastname, companyname
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Successfully updated Mehmet Yılmaz record:');
      console.log(result.rows[0]);
      console.log('\n🎯 User type fixed: individual → carrier');
    } else {
      console.log('❌ No user found to update');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

fixMehmetUserType();
