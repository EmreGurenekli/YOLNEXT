const { Pool } = require('pg');

// PostgreSQL connection
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'yolnext', 
  user: 'postgres',
  password: '2563'
});

async function fixDataCopy() {
  const client = await pool.connect();
  
  try {
    console.log('📋 Copying data from lowercase to camelCase columns...');
    
    // Copy data from lowercase to camelCase columns correctly
    await client.query(`
      UPDATE users SET 
        "firstName" = COALESCE("firstName", firstname),
        "lastName" = COALESCE("lastName", lastname),
        "fullName" = COALESCE("fullName", fullname, 
          CASE 
            WHEN firstname IS NOT NULL AND lastname IS NOT NULL 
            THEN firstname || ' ' || lastname
            ELSE COALESCE(firstname, lastname, 'Kullanıcı')
          END
        ),
        "companyName" = COALESCE("companyName", companyname),
        "isActive" = COALESCE("isActive", isactive, TRUE),
        "createdAt" = COALESCE("createdAt", createdat, CURRENT_TIMESTAMP),
        "updatedAt" = COALESCE("updatedAt", updatedat, CURRENT_TIMESTAMP),
        password = COALESCE(password, '$2b$10$placeholder'),
        role = COALESCE(role, 'individual')
    `);
    
    console.log('✅ Data copied from lowercase to camelCase columns');
    
    // Check result
    const result = await client.query(`
      SELECT id, email, "firstName", "lastName", "fullName", role 
      FROM users 
      WHERE "firstName" IS NOT NULL 
      LIMIT 3
    `);
    
    console.log('📋 Sample updated records:');
    result.rows.forEach(row => {
      console.log(`  ID: ${row.id}, Email: ${row.email}, Name: ${row.firstName} ${row.lastName}, Role: ${row.role}`);
    });
    
    console.log('🎯 Database fixed for registration - camelCase columns populated');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

fixDataCopy();
