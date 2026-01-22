const { Pool } = require('pg');

const conn = process.env.DATABASE_URL || 'postgresql://postgres:2563@localhost:5432/yolnext';

(async () => {
  const pool = new Pool({ connectionString: conn, connectionTimeoutMillis: 5000 });
  try {
    const tables = ['shipments', 'cities'];
    for (const table of tables) {
      const res = await pool.query(
        `SELECT table_schema, column_name, data_type
         FROM information_schema.columns
         WHERE table_name = $1
         ORDER BY table_schema, column_name`,
        [table]
      );

      console.log(`\n=== ${table} columns (${res.rows.length}) ===`);
      for (const r of res.rows) {
        console.log(`${r.table_schema}.${r.column_name} : ${r.data_type}`);
      }
    }

    const shipMeta = await pool.query(
      `SELECT table_schema
       FROM information_schema.tables
       WHERE table_name = 'shipments'
       ORDER BY table_schema ASC`
    );
    console.log(`\nShipments schemas:`, shipMeta.rows.map(r => r.table_schema));

    for (const r of shipMeta.rows) {
      const schema = r.table_schema;
      try {
        const has = await pool.query(`SELECT id FROM "${schema}".shipments LIMIT 1`);
        console.log(`- ${schema}.shipments rows: ${has.rows.length}`);
      } catch (e) {
        console.log(`- ${schema}.shipments rows: error ${e.message}`);
      }
    }
  } catch (e) {
    console.error('inspect-schema failed:', e);
    process.exitCode = 1;
  } finally {
    await pool.end().catch(() => undefined);
  }
})();
