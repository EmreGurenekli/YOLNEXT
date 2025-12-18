const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:2563@localhost:5432/yolnext'
});

async function fixRole() {
  try {
    // Check current role
    const checkResult = await pool.query(
      `SELECT id, email, role FROM users WHERE email = $1`,
      ['nakliyeci20251202@yolnext.com']
    );
    
    console.log('Current user:', JSON.stringify(checkResult.rows, null, 2));
    
    // Update role
    const updateResult = await pool.query(
      `UPDATE users SET role = 'nakliyeci' WHERE email = $1 RETURNING id, email, role`,
      ['nakliyeci20251202@yolnext.com']
    );
    
    console.log('Updated user:', JSON.stringify(updateResult.rows, null, 2));
    
    pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    pool.end();
  }
}

fixRole();


















































