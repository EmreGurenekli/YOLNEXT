const { Pool } = require('pg');

const pool = new Pool({ 
    connectionString: 'postgresql://postgres:2563@localhost:5432/yolnext',
    connectionTimeoutMillis: 3000,
    query_timeout: 3000
});

(async () => {
  try {
    const client = await pool.connect();
    
    const listRes = await client.query('SELECT id, shipment_id FROM carrier_market_listings WHERE shipment_id = 127');
    console.log(`Listings for 127: ${listRes.rowCount}`);

    if (listRes.rowCount > 0) {
        const listingId = listRes.rows[0].id;
        const bidsRes = await client.query('SELECT id, bid_price, status FROM carrier_market_bids WHERE listing_id = $1', [listingId]);
        console.log(`Bids for listing ${listingId}: ${JSON.stringify(bidsRes.rows)}`);
    } else {
        console.log('No listings found for shipment 127');
    }

    client.release();
  } catch (err) {
    console.log('Check finished with error or empty:', err.message);
  } finally {
    await pool.end();
  }
})();
