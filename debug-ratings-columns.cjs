const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:2563@localhost:5432/yolnext'
});

async function debugRatingsColumns() {
  try {
    // Simulate the resolveTable function from the ratings route
    const resolveTable = async (tableName) => {
      const tRes = await pool.query(
        `SELECT table_schema
         FROM information_schema.tables
         WHERE table_name = $1
         ORDER BY (table_schema = 'public') DESC, table_schema ASC
         LIMIT 1`,
        [tableName]
      );
      const schema = tRes.rows && tRes.rows[0]?.table_schema ? tRes.rows[0].table_schema : 'public';
      const colsRes = await pool.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND table_schema = $2`,
        [tableName, schema]
      );
      const cols = new Set((colsRes.rows || []).map(r => r.column_name));
      const pickCol = (...names) => names.find(n => cols.has(n)) || null;
      const qCol = (col) => (col && /[A-Z]/.test(col) ? `"${col}"` : col);
      return { schema, cols, pickCol, qCol };
    };

    const { schema, cols, pickCol, qCol } = await resolveTable('ratings');
    
    console.log('Schema:', schema);
    console.log('Available columns:', Array.from(cols));
    
    const ratingsCols = {
      idCol: pickCol('id'),
      ratedIdCol: pickCol('ratedId', 'rated_id', 'rated_user_id', 'ratedUserId'),
      raterIdCol: pickCol('raterId', 'rater_id', 'rater_user_id', 'raterUserId'),
      ratingCol: pickCol('rating'),
      commentCol: pickCol('comment', 'message', 'text'),
      shipmentIdCol: pickCol('shipmentId', 'shipment_id'),
      createdAtCol: pickCol('createdAt', 'created_at', 'createdat'),
      updatedAtCol: pickCol('updatedAt', 'updated_at', 'updatedat'),
    };
    
    console.log('\nResolved columns:');
    Object.entries(ratingsCols).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    
    console.log('\nMissing required columns?', {
      ratedIdCol: !ratingsCols.ratedIdCol,
      raterIdCol: !ratingsCols.raterIdCol,
      ratingCol: !ratingsCols.ratingCol,
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

debugRatingsColumns();
