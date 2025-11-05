const { Pool } = require('pg');

/**
 * Get database configuration based on environment
 */
function getDatabaseConfig() {
  // Check if DATABASE_URL is provided (for production)
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    };
  }
  
  // Use PostgreSQL config if available
  if (process.env.DB_TYPE === 'postgres') {
    return {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'yolnext',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20, // Maximum pool size
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };
  }
  
  // Default to SQLite
  return null;
}

/**
 * Create PostgreSQL pool
 */
let pgPool = null;

function getPostgresPool() {
  if (!pgPool) {
    const config = getDatabaseConfig();
    
    if (!config) {
      console.log('ℹ️ PostgreSQL config not provided, using SQLite');
      return null;
    }
    
    try {
      pgPool = new Pool(config);
      
      // Test connection
      pgPool.on('connect', () => {
        console.log('✅ PostgreSQL connected');
      });
      
      pgPool.on('error', (err) => {
        console.error('❌ PostgreSQL pool error:', err);
      });
      
      console.log('✅ PostgreSQL pool created');
      return pgPool;
    } catch (error) {
      console.error('❌ Error creating PostgreSQL pool:', error);
      return null;
    }
  }
  
  return pgPool;
}

/**
 * Check if using PostgreSQL
 */
function isUsingPostgres() {
  return process.env.DATABASE_URL || process.env.DB_TYPE === 'postgres';
}

/**
 * Execute query on PostgreSQL
 */
async function pgQuery(text, params) {
  const pool = getPostgresPool();
  
  if (!pool) {
    throw new Error('PostgreSQL pool not available');
  }
  
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error('PostgreSQL query error:', error);
    throw error;
  }
}

/**
 * Close PostgreSQL pool
 */
async function closePostgresPool() {
  if (pgPool) {
    await pgPool.end();
    console.log('✅ PostgreSQL pool closed');
  }
}

/**
 * Execute transaction
 */
async function transaction(callback) {
  const pool = getPostgresPool();
  
  if (!pool) {
    throw new Error('PostgreSQL pool not available');
  }
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Migrate SQLite data to PostgreSQL
 */
async function migrateToPostgres(sqliteDb, pgPool) {
  console.log('🔄 Starting migration from SQLite to PostgreSQL...');
  
  try {
    // Get all users
    const users = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM users', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log(`📦 Migrating ${users.length} users...`);
    for (const user of users) {
      await pgPool.query(
        `INSERT INTO users (id, email, password, fullName, role, companyName, taxNumber, phone, address, isVerified, isActive, createdAt, updatedAt) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [user.id, user.email, user.password, user.fullName, user.role, user.companyName, 
         user.taxNumber, user.phone, user.address, user.isVerified, user.isActive, user.createdAt, user.updatedAt]
      );
    }
    
    // Migrate shipments
    const shipments = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM shipments', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log(`📦 Migrating ${shipments.length} shipments...`);
    for (const shipment of shipments) {
      await pgPool.query(
        `INSERT INTO shipments (id, userId, userRole, title, description, pickupAddress, pickupCity, pickupDistrict, 
         deliveryAddress, deliveryCity, deliveryDistrict, pickupDate, deliveryDate, weight, dimensions, 
         specialRequirements, price, status, mainCategory, subCategory, productDescription, contactPerson, 
         email, phone, createdAt, updatedAt) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)`,
        [shipment.id, shipment.userId, shipment.userRole, shipment.title, shipment.description, 
         shipment.pickupAddress, shipment.pickupCity, shipment.pickupDistrict, shipment.deliveryAddress, 
         shipment.deliveryCity, shipment.deliveryDistrict, shipment.pickupDate, shipment.deliveryDate, 
         shipment.weight, shipment.dimensions, shipment.specialRequirements, shipment.price, shipment.status,
         shipment.mainCategory, shipment.subCategory, shipment.productDescription, shipment.contactPerson,
         shipment.email, shipment.phone, shipment.createdAt, shipment.updatedAt]
      );
    }
    
    console.log('✅ Migration completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Migration error:', error);
    return false;
  }
}

module.exports = {
  getPostgresPool,
  isUsingPostgres,
  pgQuery,
  closePostgresPool,
  migrateToPostgres,
  transaction
};
// End of file