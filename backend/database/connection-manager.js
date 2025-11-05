const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class DatabaseConnectionManager {
  constructor() {
    this.connections = new Map();
    this.maxConnections = 10;
    this.connectionTimeout = 30000; // 30 seconds
  }

  // Get or create database connection
  getConnection(dbPath) {
    const fullPath = path.resolve(dbPath);
    
    if (this.connections.has(fullPath)) {
      const connection = this.connections.get(fullPath);
      if (connection.isOpen) {
        return connection;
      } else {
        this.connections.delete(fullPath);
      }
    }

    if (this.connections.size >= this.maxConnections) {
      throw new Error('Maximum database connections reached');
    }

    const db = new sqlite3.Database(fullPath, (err) => {
      if (err) {
        console.error('Database connection error:', err);
        this.connections.delete(fullPath);
        throw err;
      }
    });

    // Set connection timeout
    const timeout = setTimeout(() => {
      this.closeConnection(fullPath);
    }, this.connectionTimeout);

    const connection = {
      db,
      isOpen: true,
      timeout,
      lastUsed: Date.now()
    };

    this.connections.set(fullPath, connection);
    return connection;
  }

  // Close specific connection
  closeConnection(dbPath) {
    const fullPath = path.resolve(dbPath);
    const connection = this.connections.get(fullPath);
    
    if (connection) {
      clearTimeout(connection.timeout);
      connection.db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
        }
      });
      connection.isOpen = false;
      this.connections.delete(fullPath);
    }
  }

  // Close all connections
  closeAllConnections() {
    for (const [path, connection] of this.connections) {
      clearTimeout(connection.timeout);
      connection.db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
        }
      });
      connection.isOpen = false;
    }
    this.connections.clear();
  }

  // Cleanup inactive connections
  cleanupInactiveConnections() {
    const now = Date.now();
    const inactiveThreshold = 60000; // 1 minute

    for (const [path, connection] of this.connections) {
      if (now - connection.lastUsed > inactiveThreshold) {
        this.closeConnection(path);
      }
    }
  }

  // Get connection status
  getStatus() {
    return {
      totalConnections: this.connections.size,
      activeConnections: Array.from(this.connections.values()).filter(c => c.isOpen).length,
      connections: Array.from(this.connections.entries()).map(([path, conn]) => ({
        path,
        isOpen: conn.isOpen,
        lastUsed: conn.lastUsed
      }))
    };
  }

  // Run query with connection management
  async runQuery(dbPath, query, params = []) {
    const connection = this.getConnection(dbPath);
    connection.lastUsed = Date.now();

    return new Promise((resolve, reject) => {
      connection.db.run(query, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  // Get query with connection management
  async getQuery(dbPath, query, params = []) {
    const connection = this.getConnection(dbPath);
    connection.lastUsed = Date.now();

    return new Promise((resolve, reject) => {
      connection.db.get(query, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // All query with connection management
  async allQuery(dbPath, query, params = []) {
    const connection = this.getConnection(dbPath);
    connection.lastUsed = Date.now();

    return new Promise((resolve, reject) => {
      connection.db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
}

// Singleton instance
const connectionManager = new DatabaseConnectionManager();

// Cleanup inactive connections every 5 minutes
setInterval(() => {
  connectionManager.cleanupInactiveConnections();
}, 300000);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Closing database connections...');
  connectionManager.closeAllConnections();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Closing database connections...');
  connectionManager.closeAllConnections();
  process.exit(0);
});

module.exports = connectionManager;

