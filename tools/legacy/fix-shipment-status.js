/**
 * Script to fix shipment status issue
 * This script will update the shipment status from 'waiting_for_offers' to 'offer_accepted'
 * for shipments that have an accepted offer but incorrect status
 */

import pg from 'pg';

const { Pool } = pg;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:2563@localhost:5432/yolnext'
});

async function fixShipmentStatus() {
  try {
    console.log('🔍 Checking for shipments with accepted offers but incorrect status...');
    
    // Find shipments that have accepted offers but wrong status
    const result = await pool.query(`
      SELECT s.id, s.status, s."nakliyeci_id", o.id as offer_id, o.status as offer_status
      FROM shipments s
      INNER JOIN offers o ON s.id = o."shipment_id"
      WHERE o.status = 'accepted' 
      AND s.status != 'offer_accepted'
      AND s.status != 'in_progress'
      AND s.status != 'completed'
      AND s.status != 'delivered'
    `);
    
    console.log(`Found ${result.rows.length} shipments with mismatched status`);
    
    if (result.rows.length === 0) {
      console.log('✅ No shipments need fixing');
      return;
    }
    
    // Fix each shipment
    for (const shipment of result.rows) {
      console.log(`🔧 Fixing shipment ${shipment.id}...`);
      
      // Update shipment status to 'offer_accepted'
      await pool.query(
        `UPDATE shipments 
         SET status = 'offer_accepted', 
             "updatedAt" = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [shipment.id]
      );
      
      console.log(`✅ Shipment ${shipment.id} status updated to 'offer_accepted'`);
    }
    
    console.log('🎉 All shipments fixed successfully!');
  } catch (error) {
    console.error('❌ Error fixing shipment status:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the fix
fixShipmentStatus();