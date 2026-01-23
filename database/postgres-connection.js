import pg from 'pg';
const { Pool } = pg;

// PostgreSQL Connection Pool
const pool = new Pool({
  host: process.env.DB_HOST || process.env.DATABASE_HOST || 'localhost',
  port: process.env.DB_PORT || process.env.DATABASE_PORT || 5432,
  database: process.env.DB_NAME || process.env.DATABASE_NAME || process.env.POSTGRES_DB || 'yolnext',
  user: process.env.DB_USER || process.env.DATABASE_USER || process.env.POSTGRES_USER || 'postgres',
  password: process.env.DB_PASSWORD || process.env.DATABASE_PASSWORD || process.env.POSTGRES_PASSWORD || '',
  max: parseInt(process.env.DB_POOL_MAX || '20'), // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
});

// Test connection
pool.on('connect', () => {
  console.log('✅ PostgreSQL connected');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL pool error:', err);
});

// Helper function to execute queries
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'production') {
      console.log('📊 Query executed', { text, duration, rows: res.rowCount });
    }
    return res;
  } catch (error) {
    console.error('❌ Query error:', { text, error: error.message });
    throw error;
  }
};

// Helper function to get a client from the pool (for transactions)
export const getClient = async () => {
  const client = await pool.connect();
  const query = client.query.bind(client);
  const release = client.release.bind(client);
  
  // Set a timeout of 5 seconds, after which we will log this client's last query
  const timeout = setTimeout(() => {
    console.error('⚠️  A client has been checked out for more than 5 seconds!');
  }, 5000);
  
  // Monkey patch the query method to log the query when a client is released
  client.query = (...args) => {
    client.lastQuery = args;
    return query(...args);
  };
  
  client.release = () => {
    clearTimeout(timeout);
    client.query = query;
    client.release = release;
    return release();
  };
  
  return client;
};

// Initialize database tables
export const initializeDatabase = async () => {
  try {
    // Check if tables exist
    const tablesCheck = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'shipments', 'offers')
    `);
    
    if (tablesCheck.rows.length === 0) {
      console.log('⚠️  Database tables not found. Please run database/init.sql or database/real_schema.sql first.');
      return false;
    }
    
    console.log('✅ Database tables found');
    return true;
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    return false;
  }
};

// Close pool
export const closePool = async () => {
  await pool.end();
  console.log('✅ PostgreSQL pool closed');
};

export default pool;
































































