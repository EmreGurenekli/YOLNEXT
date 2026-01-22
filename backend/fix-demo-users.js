const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:2563@localhost:5432/yolnext'
});

async function fixDemoUsers() {
  try {
    // Update demo nakliyeci city to Ankara
    const updateResult1 = await pool.query(`
      UPDATE users 
      SET city = 'Ankara' 
      WHERE (email = 'demo@nakliyeci.com' OR email LIKE '%nakliyeci%')
      AND role = 'nakliyeci'
    `);
    console.log(`✅ Updated nakliyeci city: ${updateResult1.rowCount} rows`);
    
    // Update other demo users
    const updateResult2 = await pool.query(`
      UPDATE users 
      SET city = 'İstanbul' 
      WHERE (email LIKE '%individual%' OR email = 'demo@yolnext.com')
      AND role = 'individual'
    `);
    console.log(`✅ Updated individual city: ${updateResult2.rowCount} rows`);
    
    const updateResult3 = await pool.query(`
      UPDATE users 
      SET city = 'İstanbul' 
      WHERE (email LIKE '%corporate%' OR email LIKE '%corporate@yolnext.com')
      AND role = 'corporate'
    `);
    console.log(`✅ Updated corporate city: ${updateResult3.rowCount} rows`);
    
    // Also update by ID if they exist (for demo users with IDs 1001, 1002, 1003, 1004)
    // Try to update by converting ID to text
    const updateById = await pool.query(`
      UPDATE users 
      SET city = CASE 
        WHEN id::text = '1003' THEN 'Ankara'
        WHEN id::text = '1001' THEN 'İstanbul'
        WHEN id::text = '1002' THEN 'İstanbul'
        ELSE city
      END
      WHERE id::text IN ('1001', '1002', '1003', '1004')
    `);
    console.log(`✅ Updated by ID: ${updateById.rowCount} rows`);
    
    // Verify updates
    const verifyResult = await pool.query(`
      SELECT email, city, role 
      FROM users 
      WHERE email LIKE '%demo%' OR email LIKE '%nakliyeci%' OR email LIKE '%corporate%' OR id::text IN ('1001', '1002', '1003', '1004')
      LIMIT 10
    `);
    console.log('✅ Updated users:');
    verifyResult.rows.forEach(row => {
      console.log(`  - ${row.email}: ${row.city} (${row.role})`);
    });
    
    pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    pool.end();
  }
}

fixDemoUsers();
