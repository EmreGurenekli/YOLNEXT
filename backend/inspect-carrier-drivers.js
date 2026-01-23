const { Pool } = require('pg');

const conn = process.env.DATABASE_URL || 'postgresql://postgres:2563@localhost:5432/yolnext';

(async () => {
  const pool = new Pool({ connectionString: conn, connectionTimeoutMillis: 5000 });
  try {
    const tables = await pool.query(
      `SELECT table_schema, table_name
       FROM information_schema.tables
       WHERE table_name ILIKE '%carrier%driver%'
       ORDER BY table_schema, table_name`
    );
    console.log('Tables like carrier*driver*:', tables.rows);

    const cols = await pool.query(
      `SELECT table_schema, table_name, column_name, data_type
       FROM information_schema.columns
       WHERE table_name ILIKE '%carrier%driver%'
       ORDER BY table_schema, table_name, ordinal_position`
    );
    console.log('Columns:');
    for (const r of cols.rows) {
      console.log(`${r.table_schema}.${r.table_name}.${r.column_name} : ${r.data_type}`);
    }
  } catch (e) {
    console.error('inspect-carrier-drivers failed:', e);
    process.exitCode = 1;
  } finally {
    await pool.end().catch(() => undefined);
  }
})();
