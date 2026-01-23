const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:2563@localhost:5432/yolnext'
});

async function debugCreatedAt() {
  try {
    // Check if users table has createdat column
    const usersCols = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND table_schema = 'public'
    `);
    
    console.log('Users table columns:');
    usersCols.rows.forEach(row => {
      console.log(`  ${row.column_name}`);
    });
    
    console.log('\nUsers table has createdat:', usersCols.rows.some(r => r.column_name === 'createdat'));
    
    // Check ratings table columns again
    const ratingsCols = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'ratings' AND table_schema = 'public'
    `);
    
    console.log('\nRatings table columns:');
    ratingsCols.rows.forEach(row => {
      console.log(`  ${row.column_name}`);
    });
    
    // Test a simple query
    console.log('\nTesting simple query...');
    const testQuery = `
      SELECT r.id, r.rating, r.createdat, u."fullName" 
      FROM ratings r 
      LEFT JOIN users u ON u.id = r.raterid 
      WHERE r.ratedid = $1 
      ORDER BY r.createdat DESC 
      LIMIT 5
    `;
    
    const result = await pool.query(testQuery, [907]);
    console.log('Query result:', result.rows);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

debugCreatedAt();
