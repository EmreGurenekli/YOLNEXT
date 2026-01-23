const { Pool } = require('pg');

const pool = new Pool({ 
    connectionString: 'postgresql://postgres:2563@localhost:5432/yolnext',
    connectionTimeoutMillis: 5000 
});

(async () => {
  try {
    const client = await pool.connect();
    
    console.log('Checking listings for Shipment 127...');
    const listRes = await client.query('SELECT * FROM carrier_market_listings WHERE shipment_id = 127');
    console.log('Listings found:', listRes.rowCount);
    console.log('Listings:', JSON.stringify(listRes.rows, null, 2));

    if (listRes.rowCount > 0) {
        const listingId = listRes.rows[0].id;
        console.log(`Checking bids for listing ${listingId}...`);
        const bidsRes = await client.query('SELECT * FROM carrier_market_bids WHERE listing_id = $1', [listingId]);
        console.log('Bids found:', bidsRes.rowCount);
        console.log('Bids:', JSON.stringify(bidsRes.rows, null, 2));
    }

    client.release();
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
})();
