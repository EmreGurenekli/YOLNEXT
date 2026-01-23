#!/usr/bin/env node

require('dotenv').config();
const { Pool } = require('pg');
const DatabaseOptimizer = require('../utils/databaseOptimizer');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:2563@localhost:5432/yolnext';

async function runOptimization() {
  console.log('🚀 Starting database performance optimization...\n');

  let pool;
  try {
    // Create database connection
    pool = new Pool({
      connectionString: DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    console.log('✅ Connected to database');

    // Create optimizer instance
    const optimizer = new DatabaseOptimizer(pool);

    // Run optimization
    await optimizer.optimize();

    // Get performance statistics
    console.log('\n📊 Performance Statistics:');
    
    const slowQueries = await optimizer.getSlowQueries();
    if (slowQueries.length > 0) {
      console.log('\n🐌 Slow Queries (mean_time > 1s):');
      slowQueries.forEach((query, index) => {
        console.log(`${index + 1}. ${query.query.substring(0, 100)}...`);
        console.log(`   Calls: ${query.calls}, Mean: ${query.mean_time.toFixed(2)}ms`);
      });
    } else {
      console.log('✅ No slow queries detected');
    }

    const tableStats = await optimizer.getTableStats();
    console.log('\n📋 Table Sizes:');
    tableStats.forEach((table, index) => {
      console.log(`${index + 1}. ${table.tablename}: ${table.size}`);
    });

    console.log('\n🎉 Database optimization completed successfully!');
    console.log('💡 Tips for better performance:');
    console.log('   - Regularly run VACUUM ANALYZE on large tables');
    console.log('   - Monitor slow queries and add appropriate indexes');
    console.log('   - Consider partitioning large tables by date');
    console.log('   - Use connection pooling efficiently');

  } catch (error) {
    console.error('❌ Database optimization failed:', error.message);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run optimization if called directly
if (require.main === module) {
  runOptimization();
}

module.exports = { runOptimization };
