const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { Pool } = require('pg');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../env.development'), override: true });
dotenv.config({ path: path.resolve(__dirname, '../../env.local'), override: true });

async function executeSupportMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🚨 EXECUTING SUPPORT SYSTEM MIGRATION...\n');

    // Read migration file
    const migrationPath = path.resolve(__dirname, '../../database/migrations/005_support_system.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      return false;
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('📋 Migration file loaded, executing SQL...\n');

    // Execute migration
    await pool.query(migrationSQL);
    
    console.log('✅ MIGRATION EXECUTED SUCCESSFULLY!\n');

    // Verify tables created
    const tableCheckQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'support%'
      ORDER BY table_name;
    `;

    const tablesResult = await pool.query(tableCheckQuery);
    
    console.log('🔍 Verification - Created support tables:');
    tablesResult.rows.forEach(row => {
      console.log(`   ✅ ${row.table_name}`);
    });

    // Check categories data
    const categoriesResult = await pool.query('SELECT id, name FROM support_categories ORDER BY id;');
    console.log(`\n📊 Created support categories (${categoriesResult.rows.length} entries):`);
    categoriesResult.rows.forEach(cat => {
      console.log(`   📝 ${cat.id}: ${cat.name}`);
    });

    console.log('\n🎯 SUPPORT SYSTEM MIGRATION: COMPLETED SUCCESSFULLY');
    return true;

  } catch (error) {
    console.error('💥 Migration execution error:', error.message);
    console.error('📋 Full error:', error);
    return false;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  executeSupportMigration().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { executeSupportMigration };
