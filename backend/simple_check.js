const { Pool } = require('pg');

console.log('Script starting...');

const pool = new Pool({ 
    connectionString: 'postgresql://postgres:2563@localhost:5432/yolnext',
    connectionTimeoutMillis: 5000 
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

(async () => {
  let client;
  try {
    console.log('Attempting to connect...');
    client = await pool.connect();
    console.log('Connected successfully.');
    
    console.log('Querying Shipment 127...');
    const res = await client.query('SELECT * FROM shipments WHERE id = 127');
    console.log('Shipment found:', res.rows.length > 0);
    if (res.rows.length > 0) {
        console.log('Shipment details:', JSON.stringify(res.rows[0], null, 2));
    }

    console.log('Querying Offers for Shipment 127...');
    // Note: column names might be camelCase in DB if created by Sequelize/TypeORM or snake_case if raw SQL.
    // Based on offers.js, it seems to use "shipmentId" (quoted) or shipment_id.
    // Let's try to list all columns of offers table first to be sure.
    const cols = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'offers'`);
    console.log('Offers table columns:', cols.rows.map(r => r.column_name).join(', '));

    const offerRes = await client.query('SELECT * FROM offers WHERE "shipmentId" = 127'); 
    console.log('Offers found:', offerRes.rows.length);
    console.log('Offers data:', JSON.stringify(offerRes.rows, null, 2));

  } catch (err) {
    console.error('Error during execution:', err);
  } finally {
    if (client) client.release();
    await pool.end();
    console.log('Pool ended.');
  }
})();
