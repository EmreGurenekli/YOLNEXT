const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:2563@localhost:5432/yolnext'
});

async function fixShipment() {
  try {
    // Update shipment with accepted offer data (without accepted_offer_id column)
    const result = await pool.query(
      `UPDATE shipments 
       SET status = 'in_progress', 
           carrier_id = $1,
           price = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [875, 1500, 30]
    );
    
    console.log('Updated rows:', result.rowCount);
    
    // Verify update
    const verify = await pool.query(
      'SELECT id, status, carrier_id, price FROM shipments WHERE id = 30'
    );
    
    console.log('Shipment after update:', JSON.stringify(verify.rows, null, 2));
    
    pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    pool.end();
  }
}

fixShipment();

