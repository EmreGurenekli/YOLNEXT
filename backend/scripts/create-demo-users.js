// Script to create demo users in the database
// Run: node backend/scripts/create-demo-users.js

require('dotenv').config({ path: require('path').resolve(__dirname, '../../env.local'), override: true });
const bcrypt = require('bcrypt');
const { createDatabasePool } = require('../config/database');

const DATABASE_URL = process.env.DATABASE_URL;
const NODE_ENV = process.env.NODE_ENV || 'development';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'temp_password_change_me';

const demoUsers = [
  {
    email: 'demo.individual@yolnext.com',
    password: DEMO_PASSWORD,
    firstName: 'Demo',
    lastName: 'Bireysel',
    role: 'individual',
    companyName: null,
    taxNumber: null,
  },
  {
    email: 'demo.corporate@yolnext.com',
    password: DEMO_PASSWORD,
    firstName: 'Demo',
    lastName: 'Kurumsal',
    role: 'corporate',
    companyName: 'Demo A.Ş.',
    taxNumber: '1234567890',
  },
  {
    email: 'demo.nakliyeci@yolnext.com',
    password: DEMO_PASSWORD,
    firstName: 'Demo',
    lastName: 'Nakliyeci',
    role: 'nakliyeci',
    companyName: 'Demo Lojistik',
    taxNumber: '9988776655',
  },
  {
    email: 'demo.tasiyici@yolnext.com',
    password: DEMO_PASSWORD,
    firstName: 'Demo',
    lastName: 'Taşıyıcı',
    role: 'tasiyici',
    companyName: null,
    taxNumber: null,
  },
];

async function createDemoUsers() {
  const pool = createDatabasePool(DATABASE_URL, NODE_ENV);

  try {
    console.log('🔍 Checking database connection...');
    await pool.query('SELECT 1');
    console.log('✅ Database connected\n');

    // Resolve users table structure
    const resolveUsersTable = async () => {
      const tRes = await pool.query(
        `SELECT table_schema
         FROM information_schema.tables
         WHERE table_name = 'users'
         ORDER BY (table_schema = 'public') DESC, table_schema ASC
         LIMIT 1`
      );
      const schema = tRes.rows && tRes.rows[0]?.table_schema ? tRes.rows[0].table_schema : 'public';
      const colsRes = await pool.query(
        `SELECT column_name
         FROM information_schema.columns
         WHERE table_name = 'users' AND table_schema = $1`,
        [schema]
      );
      const cols = new Set((colsRes.rows || []).map(r => r.column_name));
      const pick = (...names) => names.find(n => cols.has(n)) || null;
      const qCol = (col) => (col && /[A-Z]/.test(col) ? `"${col}"` : col);

      return {
        schema,
        cols,
        qCol,
        email: pick('email', 'emailAddress', 'email_address', 'mail') || 'email',
        password: pick('password_hash', 'password', 'passwordHash') || 'password_hash',
        firstName: pick('first_name', 'firstname', 'firstName') || 'first_name',
        lastName: pick('last_name', 'lastname', 'lastName') || 'last_name',
        role: pick('user_type', 'role', 'panel_type', 'userType') || 'user_type',
        companyName: pick('company_name', 'companyname', 'companyName') || 'company_name',
        isActive: pick('is_active', 'isactive', 'isActive') || 'is_active',
      };
    };

    const users = await resolveUsersTable();
    const usersTable = `"${users.schema}".users`;
    const q = users.qCol;

    console.log('📝 Creating demo users...\n');

    for (const demoUser of demoUsers) {
      try {
        // Check if user already exists
        const existing = await pool.query(
          `SELECT id FROM ${usersTable} WHERE ${q(users.email)} = $1`,
          [demoUser.email]
        );

        if (existing.rows.length > 0) {
          console.log(`⚠️  User already exists: ${demoUser.email}`);
          
          // Update password to ensure it's correct
          const hashedPassword = await bcrypt.hash(demoUser.password, 10);
          const updateCols = [];
          const updateVals = [];
          const updateParams = [hashedPassword, demoUser.email];
          
          updateCols.push(`${q(users.password)} = $1`);
          
          if (users.firstName && demoUser.firstName) {
            updateCols.push(`${q(users.firstName)} = $${updateParams.length + 1}`);
            updateParams.push(demoUser.firstName);
          }
          if (users.lastName && demoUser.lastName) {
            updateCols.push(`${q(users.lastName)} = $${updateParams.length + 1}`);
            updateParams.push(demoUser.lastName);
          }
          if (users.role) {
            updateCols.push(`${q(users.role)} = $${updateParams.length + 1}`);
            updateParams.push(demoUser.role);
          }
          if (users.companyName && demoUser.companyName) {
            updateCols.push(`${q(users.companyName)} = $${updateParams.length + 1}`);
            updateParams.push(demoUser.companyName);
          }
          if (users.isActive) {
            updateCols.push(`${q(users.isActive)} = true`);
          }

          await pool.query(
            `UPDATE ${usersTable} SET ${updateCols.join(', ')} WHERE ${q(users.email)} = $${updateParams.length}`,
            updateParams
          );
          
          console.log(`✅ Updated user: ${demoUser.email} (Password reset to: ${demoUser.password})`);
        } else {
          // Create new user
          const hashedPassword = await bcrypt.hash(demoUser.password, 10);
          
          const cols = [];
          const vals = [];
          const params = [];
          
          cols.push(q(users.email));
          params.push(demoUser.email);
          vals.push(`$${params.length}`);
          
          cols.push(q(users.password));
          params.push(hashedPassword);
          vals.push(`$${params.length}`);
          
          if (users.firstName) {
            cols.push(q(users.firstName));
            params.push(demoUser.firstName);
            vals.push(`$${params.length}`);
          }
          if (users.lastName) {
            cols.push(q(users.lastName));
            params.push(demoUser.lastName);
            vals.push(`$${params.length}`);
          }
          if (users.role) {
            cols.push(q(users.role));
            params.push(demoUser.role);
            vals.push(`$${params.length}`);
          }
          if (users.companyName && demoUser.companyName) {
            cols.push(q(users.companyName));
            params.push(demoUser.companyName);
            vals.push(`$${params.length}`);
          }
          if (users.isActive) {
            cols.push(q(users.isActive));
            vals.push('true');
          }

          const result = await pool.query(
            `INSERT INTO ${usersTable} (${cols.join(', ')}) VALUES (${vals.join(', ')}) RETURNING id`,
            params
          );

          console.log(`✅ Created user: ${demoUser.email} (ID: ${result.rows[0].id}, Password: ${demoUser.password})`);
        }
      } catch (error) {
        console.error(`❌ Error creating/updating user ${demoUser.email}:`, error.message);
      }
    }

    console.log('\n✅ Demo users creation completed!');
    console.log('\n📋 Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    demoUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.role.toUpperCase()}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Password: ${user.password}`);
      if (user.companyName) {
        console.log(`   Company: ${user.companyName}`);
      }
      console.log('');
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  createDemoUsers().catch(console.error);
}

module.exports = { createDemoUsers };

