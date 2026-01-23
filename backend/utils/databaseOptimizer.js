const { Pool } = require('pg');

class DatabaseOptimizer {
  constructor(pool) {
    this.pool = pool;
  }

  // Create optimized indexes for better query performance
  async createIndexes() {
    const indexes = [
      // Shipments table indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shipments_user_id ON shipments(user_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shipments_status ON shipments(status)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shipments_pickup_city ON shipments(pickup_city)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shipments_delivery_city ON shipments(delivery_city)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shipments_created_at ON shipments(created_at)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shipments_pickup_date ON shipments(pickup_date)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shipments_delivery_date ON shipments(delivery_date)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shipments_tracking_number ON shipments(tracking_number)',
      
      // Composite indexes for common queries
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shipments_user_status ON shipments(user_id, status)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shipments_status_created ON shipments(status, created_at)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shipments_cities ON shipments(pickup_city, delivery_city)',
      
      // Offers table indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_offers_shipment_id ON offers(shipment_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_offers_carrier_id ON offers(carrier_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_offers_status ON offers(status)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_offers_created_at ON offers(created_at)',
      
      // Composite indexes for offers
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_offers_shipment_status ON offers(shipment_id, status)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_offers_carrier_status ON offers(carrier_id, status)',
      
      // Users table indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_user_type ON users(user_type)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_is_active ON users(is_active)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON users(created_at)',
      
      // Messages table indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_sender_id ON messages(sender_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_created_at ON messages(created_at)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_is_read ON messages(is_read)',
      
      // Composite indexes for messages
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_receiver_read ON messages(receiver_id, is_read)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_conversation ON messages(
        CASE WHEN sender_id < receiver_id THEN sender_id ELSE receiver_id END,
        CASE WHEN sender_id < receiver_id THEN receiver_id ELSE sender_id END
      )',
      
      // Notifications table indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_is_read ON notifications(is_read)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_created_at ON notifications(created_at)',
      
      // Composite indexes for notifications
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read)',
    ];

    console.log('🔧 Creating database indexes...');
    for (const indexSql of indexes) {
      try {
        await this.pool.query(indexSql);
        console.log(`✅ Created index: ${indexSql.split('IF NOT EXISTS ')[1].split(' ')[0]}`);
      } catch (error) {
        console.warn(`⚠️  Index creation failed: ${error.message}`);
      }
    }
  }

  // Analyze table statistics for query optimization
  async analyzeTables() {
    const tables = [
      'shipments',
      'offers', 
      'users',
      'messages',
      'notifications',
      'drivers',
      'vehicles'
    ];

    console.log('📊 Analyzing table statistics...');
    for (const table of tables) {
      try {
        await this.pool.query(`ANALYZE ${table}`);
        console.log(`✅ Analyzed table: ${table}`);
      } catch (error) {
        console.warn(`⚠️  Table analysis failed for ${table}: ${error.message}`);
      }
    }
  }

  // Optimize slow queries with prepared statements
  async createPreparedStatements() {
    const statements = [
      {
        name: 'get_user_shipments',
        query: `
          SELECT s.*, u.name as user_name, u.email as user_email
          FROM shipments s 
          JOIN users u ON s.user_id = u.id 
          WHERE s.user_id = $1 
          ORDER BY s.created_at DESC 
          LIMIT $2 OFFSET $3
        `
      },
      {
        name: 'get_shipment_offers',
        query: `
          SELECT o.*, u.name as carrier_name, u.email as carrier_email
          FROM offers o 
          JOIN users u ON o.carrier_id = u.id 
          WHERE o.shipment_id = $1 
          ORDER BY o.created_at DESC
        `
      },
      {
        name: 'search_shipments',
        query: `
          SELECT s.*, u.name as user_name
          FROM shipments s 
          JOIN users u ON s.user_id = u.id 
          WHERE (
            s.tracking_number ILIKE $1 OR
            s.pickup_city ILIKE $1 OR
            s.delivery_city ILIKE $1 OR
            s.description ILIKE $1
          )
          AND s.status = ANY($2)
          ORDER BY s.created_at DESC
          LIMIT $3 OFFSET $4
        `
      },
      {
        name: 'get_user_conversations',
        query: `
          SELECT DISTINCT 
            CASE 
              WHEN m.sender_id = $1 THEN m.receiver_id 
              ELSE m.sender_id 
            END as other_user_id,
            u.name as other_user_name,
            u.email as other_user_email,
            MAX(m.created_at) as last_message_time
          FROM messages m 
          JOIN users u ON (
            CASE 
              WHEN m.sender_id = $1 THEN m.receiver_id = u.id 
              ELSE m.sender_id = u.id 
            END
          )
          WHERE (m.sender_id = $1 OR m.receiver_id = $1)
          GROUP BY other_user_id, u.name, u.email
          ORDER BY last_message_time DESC
        `
      }
    ];

    console.log('🚀 Creating prepared statements...');
    for (const statement of statements) {
      try {
        await this.pool.query(`PREPARE ${statement.name} AS ${statement.query}`);
        console.log(`✅ Created prepared statement: ${statement.name}`);
      } catch (error) {
        console.warn(`⚠️  Prepared statement failed for ${statement.name}: ${error.message}`);
      }
    }
  }

  // Implement connection pooling optimization
  async optimizeConnectionPool() {
    console.log('🔧 Optimizing connection pool...');
    
    // Set optimal pool parameters
    const maxConnections = Math.max(20, Math.min(100, require('os').cpus().length * 10));
    const minConnections = Math.max(5, Math.floor(maxConnections / 4));
    
    console.log(`📊 Pool configuration: min=${minConnections}, max=${maxConnections}`);
    
    // Update pool configuration if needed
    if (this.pool.options) {
      this.pool.options.max = maxConnections;
      this.pool.options.min = minConnections;
      this.pool.options.idleTimeoutMillis = 30000;
      this.pool.options.connectionTimeoutMillis = 2000;
    }
  }

  // Create materialized views for complex queries
  async createMaterializedViews() {
    const views = [
      {
        name: 'user_shipment_stats',
        query: `
          CREATE MATERIALIZED VIEW IF NOT EXISTS user_shipment_stats AS
          SELECT 
            user_id,
            COUNT(*) as total_shipments,
            COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_shipments,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_shipments,
            COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as active_shipments,
            AVG(CASE WHEN status = 'delivered' THEN 
              EXTRACT(EPOCH FROM (updated_at - created_at))/3600 
            END) as avg_delivery_hours
          FROM shipments
          GROUP BY user_id
        `
      },
      {
        name: 'carrier_performance_stats',
        query: `
          CREATE MATERIALIZED VIEW IF NOT EXISTS carrier_performance_stats AS
          SELECT 
            o.carrier_id,
            u.name as carrier_name,
            COUNT(o.id) as total_offers,
            COUNT(CASE WHEN o.status = 'accepted' THEN 1 END) as accepted_offers,
            COUNT(CASE WHEN o.status = 'rejected' THEN 1 END) as rejected_offers,
            AVG(o.price) as avg_offer_price,
            MAX(o.created_at) as last_offer_date
          FROM offers o
          JOIN users u ON o.carrier_id = u.id
          GROUP BY o.carrier_id, u.name
        `
      }
    ];

    console.log('📋 Creating materialized views...');
    for (const view of views) {
      try {
        await this.pool.query(view.query);
        console.log(`✅ Created materialized view: ${view.name}`);
      } catch (error) {
        console.warn(`⚠️  Materialized view failed for ${view.name}: ${error.message}`);
      }
    }
  }

  // Refresh materialized views
  async refreshMaterializedViews() {
    const views = ['user_shipment_stats', 'carrier_performance_stats'];
    
    console.log('🔄 Refreshing materialized views...');
    for (const viewName of views) {
      try {
        await this.pool.query(`REFRESH MATERIALIZED VIEW CONCURRENTLY ${viewName}`);
        console.log(`✅ Refreshed view: ${viewName}`);
      } catch (error) {
        console.warn(`⚠️  View refresh failed for ${viewName}: ${error.message}`);
      }
    }
  }

  // Run full optimization
  async optimize() {
    console.log('🚀 Starting database optimization...');
    
    try {
      await this.optimizeConnectionPool();
      await this.createIndexes();
      await this.analyzeTables();
      await this.createPreparedStatements();
      await this.createMaterializedViews();
      await this.refreshMaterializedViews();
      
      console.log('✅ Database optimization completed successfully!');
    } catch (error) {
      console.error('❌ Database optimization failed:', error.message);
      throw error;
    }
  }

  // Monitor query performance
  async getSlowQueries() {
    try {
      const result = await this.pool.query(`
        SELECT 
          query,
          calls,
          total_time,
          mean_time,
          rows
        FROM pg_stat_statements 
        WHERE mean_time > 1000 
        ORDER BY mean_time DESC 
        LIMIT 10
      `);
      
      return result.rows;
    } catch (error) {
      console.warn('⚠️  Could not get slow queries:', error.message);
      return [];
    }
  }

  // Get table sizes and bloat information
  async getTableStats() {
    try {
      const result = await this.pool.query(`
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
          pg_total_relation_size(schemaname||'.'||tablename) as total_size
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size DESC
      `);
      
      return result.rows;
    } catch (error) {
      console.warn('⚠️  Could not get table stats:', error.message);
      return [];
    }
  }
}

module.exports = DatabaseOptimizer;
