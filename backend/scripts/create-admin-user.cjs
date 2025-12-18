const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { getPool } = require('../database/connection');

function generatePassword(length = 18) {
  // URL-safe base64, then trim
  return crypto.randomBytes(32).toString('base64url').slice(0, length);
}

function generateEmail() {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  return `admin.${stamp}@yolnext.local`;
}

async function main() {
  const pool = getPool();

  const email = String(process.env.ADMIN_EMAIL || '').trim();
  const plainPassword = String(process.env.ADMIN_PASSWORD || '').trim();
  const forcePasswordUpdate = String(process.env.FORCE_PASSWORD_UPDATE || '').toLowerCase() === 'true';

  if (!email) {
    console.error('❌ ADMIN_EMAIL is required (use a stable email so credentials do not change every run).');
    console.error('Example: ADMIN_EMAIL=you@yourdomain.com');
    process.exitCode = 1;
    return;
  }

  const fullName = process.env.ADMIN_NAME || 'YolNext Admin';
  const firstName = process.env.ADMIN_FIRST_NAME || 'YolNext';
  const lastName = process.env.ADMIN_LAST_NAME || 'Admin';

  // Ensure uniqueness by email
  const existing = await pool.query('SELECT id, role FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    const id = existing.rows[0].id;
    const shouldUpdatePassword = Boolean(plainPassword) && forcePasswordUpdate;

    if (shouldUpdatePassword) {
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      try {
        await pool.query(
          'UPDATE users SET role = $2, password = $3, "isActive" = true, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $1',
          [id, 'admin', hashedPassword]
        );
      } catch (_eCamel) {
        await pool.query(
          'UPDATE users SET role = $2, password = $3, is_active = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
          [id, 'admin', hashedPassword]
        );
      }
      console.log('✅ Existing user promoted to admin (password updated)');
    } else {
      try {
        await pool.query(
          'UPDATE users SET role = $2, "isActive" = true, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $1',
          [id, 'admin']
        );
      } catch (_eCamel) {
        await pool.query(
          'UPDATE users SET role = $2, is_active = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
          [id, 'admin']
        );
      }
      console.log('✅ Existing user promoted to admin (password unchanged)');
    }

    console.log(`EMAIL=${email}`);
    if (shouldUpdatePassword) console.log(`PASSWORD=${plainPassword}`);
    console.log(`USER_ID=${id}`);
    return;
  }

  if (!plainPassword) {
    console.error('❌ ADMIN_PASSWORD is required for first-time admin creation.');
    console.error('Set ADMIN_PASSWORD once, then you can re-run without changing it.');
    process.exitCode = 1;
    return;
  }

  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  let inserted;
  try {
    inserted = await pool.query(
      `INSERT INTO users (email, password, "firstName", "lastName", "fullName", role, "companyName", "isActive", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
       RETURNING id`,
      [email, hashedPassword, firstName, lastName, fullName, 'admin', null, true]
    );
  } catch (eCamel) {
    // snake_case fallback
    inserted = await pool.query(
      `INSERT INTO users (email, password, first_name, last_name, full_name, role, company_name, is_active, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
       RETURNING id`,
      [email, hashedPassword, firstName, lastName, fullName, 'admin', null, true]
    );
  }

  const id = inserted.rows[0].id;

  console.log('✅ Admin user created');
  console.log(`EMAIL=${email}`);
  console.log(`PASSWORD=${plainPassword}`);
  console.log(`USER_ID=${id}`);
  console.log('IMPORTANT: Save this password securely and change it after first login.');
}

main()
  .catch(err => {
    console.error('❌ Failed to create admin user:', err.message);
    process.exitCode = 1;
  });
