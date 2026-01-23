
require('dotenv').config({ path: 'backend/.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkUser() {
  try {
    const res = await pool.query("SELECT id, email, role, user_type FROM users WHERE email = 'nakliyeci.test.20260113@yolnext.local'");
    console.log('User found:', res.rows[0]);
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

checkUser();
