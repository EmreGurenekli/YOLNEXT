const path = require('path');
const dotenv = require('dotenv');
const { Pool } = require('pg');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../env.development'), override: true });
dotenv.config({ path: path.resolve(__dirname, '../../env.local'), override: true });

async function checkSupportTables() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔍 Checking support system tables...\n');

    // Check if support tables exist
    const tableCheckQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'support%'
      ORDER BY table_name;
    `;

    const tablesResult = await pool.query(tableCheckQuery);
    
    if (tablesResult.rows.length === 0) {
      console.log('❌ No support tables found in database!');
      console.log('📋 Migration 005_support_system.sql needs to be executed.');
      return false;
    }

    console.log('✅ Found support tables:');
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    // Check support_categories data
    try {
      const categoriesResult = await pool.query('SELECT id, name FROM support_categories ORDER BY id;');
      console.log(`\n📊 Support categories (${categoriesResult.rows.length} found):`);
      categoriesResult.rows.forEach(cat => {
        console.log(`   - ${cat.id}: ${cat.name}`);
      });
    } catch (error) {
      console.log('\n⚠️  Could not query support_categories:', error.message);
      return false;
    }

    // Test API endpoint structure
    console.log('\n🔧 Testing database connectivity for API endpoints...');
    
    try {
      await pool.query('SELECT COUNT(*) FROM support_tickets;');
      console.log('✅ support_tickets table accessible');
    } catch (error) {
      console.log('❌ support_tickets error:', error.message);
      return false;
    }

    try {
      await pool.query('SELECT COUNT(*) FROM support_ticket_messages;');
      console.log('✅ support_ticket_messages table accessible');
    } catch (error) {
      console.log('❌ support_ticket_messages error:', error.message);
      return false;
    }

    console.log('\n🎯 Database support tables status: HEALTHY');
    return true;

  } catch (error) {
    console.error('💥 Database connection error:', error.message);
    return false;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  checkSupportTables().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { checkSupportTables };
