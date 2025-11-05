const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Health endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Mount SQLite-backed routes
// Clear require cache to ensure fresh route loading
delete require.cache[require.resolve('./routes/offers-fixed')];
delete require.cache[require.resolve('./routes/drivers')];
delete require.cache[require.resolve('./routes/shipments-sqlite')];
delete require.cache[require.resolve('./routes/carrier-market')];
delete require.cache[require.resolve('./routes/vehicles')];
delete require.cache[require.resolve('./routes/reviews')];

app.use('/api/offers', require('./routes/offers-fixed'));
app.use('/api/drivers', require('./routes/drivers'));
app.use('/api/shipments', require('./routes/shipments-sqlite'));
app.use('/api/loads', require('./routes/shipments-sqlite')); // Route planner loads
app.use('/api/carrier-market', require('./routes/carrier-market'));
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/reviews', require('./routes/reviews'));

// Dashboard stats - SQLite-backed
app.get('/api/dashboard/stats/:userType', (req, res) => {
  const { userType } = req.params;
  const sqlite3 = require('sqlite3').verbose();
  const path = require('path');
  const dbPath = path.join(__dirname, 'database.sqlite');
  const db = new sqlite3.Database(dbPath);

  const userId = req.headers['x-user-id'] || null;

  // Get stats from database
  Promise.all([
    new Promise(resolve => {
      let query = 'SELECT COUNT(*) as total FROM shipments WHERE 1=1';
      let params = [];
      if (userId) {
        query += ' AND userId = ?';
        params.push(userId);
      }
      if (userType === 'individual' || userType === 'corporate') {
        query += ' AND status IN (?, ?)';
        params.push('pending', 'accepted');
      }
      db.get(query, params, (err, row) => {
        if (err) resolve(0);
        else resolve(row?.total || 0);
      });
    }),
    new Promise(resolve => {
      let query = 'SELECT COUNT(*) as total FROM shipments WHERE status = ?';
      let params = ['completed'];
      if (userId) {
        query += ' AND userId = ?';
        params.push(userId);
      }
      db.get(query, params, (err, row) => {
        if (err) resolve(0);
        else resolve(row?.total || 0);
      });
    }),
    new Promise(resolve => {
      if (userType === 'nakliyeci' && userId) {
        db.get(
          'SELECT COUNT(*) as total FROM offers WHERE carrierId = ? AND status = ?',
          [userId, 'accepted'],
          (err, row) => {
            if (err) resolve(0);
            else resolve(row?.total || 0);
          }
        );
      } else {
        resolve(0);
      }
    }),
  ])
    .then(([totalShipments, completedShipments, acceptedOffers]) => {
      db.close();
      res.json({
        success: true,
        data: {
          stats: {
            userType,
            totalShipments: totalShipments || 0,
            completedShipments: completedShipments || 0,
            acceptedOffers: acceptedOffers || 0,
            totalValue: 0, // Can be calculated from shipments
          },
        },
      });
    })
    .catch(err => {
      db.close();
      res.json({
        success: true,
        data: { stats: { userType, totalShipments: 0, completedShipments: 0 } },
      });
    });
});

// Dashboard panel endpoint
app.get('/api/dashboard/:panel', (req, res) => {
  const { panel } = req.params;
  const sqlite3 = require('sqlite3').verbose();
  const path = require('path');
  const dbPath = path.join(__dirname, 'database.sqlite');
  const db = new sqlite3.Database(dbPath);

  const userId = req.headers['x-user-id'] || null;

  // Get recent shipments
  let query = 'SELECT * FROM shipments WHERE 1=1';
  let params = [];
  if (userId) {
    query += ' AND userId = ?';
    params.push(userId);
  }
  query += ' ORDER BY createdAt DESC LIMIT 5';

  db.all(query, params, (err, shipments) => {
    db.close();
    res.json({
      success: true,
      data: {
        panel,
        stats: {
          shipments: shipments?.length || 0,
          offers: 0,
          messages: 0,
        },
        recent: shipments || [],
      },
    });
  });
});

// Recent shipments
app.get('/api/shipments/recent/:panel', (req, res) => {
  const sqlite3 = require('sqlite3').verbose();
  const path = require('path');
  const dbPath = path.join(__dirname, 'database.sqlite');
  const db = new sqlite3.Database(dbPath);

  const userId = req.headers['x-user-id'] || null;
  let query = 'SELECT * FROM shipments WHERE 1=1';
  let params = [];
  if (userId) {
    query += ' AND userId = ?';
    params.push(userId);
  }
  query += ' ORDER BY createdAt DESC LIMIT 10';

  db.all(query, params, (err, rows) => {
    db.close();
    if (err) {
      return res.json({ success: true, data: [] });
    }
    res.json({ success: true, data: rows || [] });
  });
});

// Notifications - SQLite-backed (basic implementation)
app.get('/api/notifications', (req, res) => {
  const sqlite3 = require('sqlite3').verbose();
  const path = require('path');
  const dbPath = path.join(__dirname, 'database.sqlite');
  const db = new sqlite3.Database(dbPath);

  // Create notifications table if not exists
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      title TEXT,
      message TEXT,
      type TEXT DEFAULT 'info',
      isRead INTEGER DEFAULT 0,
      createdAt TEXT
    )`);

    const userId = req.headers['x-user-id'] || null;
    let query = 'SELECT * FROM notifications WHERE 1=1';
    let params = [];
    if (userId) {
      query += ' AND userId = ?';
      params.push(userId);
    }
    query += ' ORDER BY createdAt DESC LIMIT 50';

    db.all(query, params, (err, rows) => {
      db.close();
      if (err) {
        return res.json({ success: true, data: [] });
      }
      res.json({ success: true, data: rows || [] });
    });
  });
});

app.get('/api/notifications/unread-count', (req, res) => {
  const sqlite3 = require('sqlite3').verbose();
  const path = require('path');
  const dbPath = path.join(__dirname, 'database.sqlite');
  const db = new sqlite3.Database(dbPath);

  const userId = req.headers['x-user-id'] || null;
  if (!userId) {
    db.close();
    return res.json({ success: true, data: { count: 0 } });
  }

  db.get(
    'SELECT COUNT(*) as count FROM notifications WHERE userId = ? AND isRead = 0',
    [userId],
    (err, row) => {
      db.close();
      if (err) {
        return res.json({ success: true, data: { count: 0 } });
      }
      res.json({ success: true, data: { count: row?.count || 0 } });
    }
  );
});

app.put('/api/notifications/read-all', express.json(), (req, res) => {
  const sqlite3 = require('sqlite3').verbose();
  const path = require('path');
  const dbPath = path.join(__dirname, 'database.sqlite');
  const db = new sqlite3.Database(dbPath);

  const userId = req.headers['x-user-id'] || null;
  if (!userId) {
    db.close();
    return res.json({ success: true, message: 'All read' });
  }

  db.run(
    'UPDATE notifications SET isRead = 1 WHERE userId = ?',
    [userId],
    err => {
      db.close();
      if (err) {
        return res.json({ success: true, message: 'All read' });
      }
      res.json({ success: true, message: 'All read' });
    }
  );
});

app.get('/api/notifications/individual', (req, res) => {
  const sqlite3 = require('sqlite3').verbose();
  const path = require('path');
  const dbPath = path.join(__dirname, 'database.sqlite');
  const db = new sqlite3.Database(dbPath);

  const userId = req.headers['x-user-id'] || null;
  if (!userId) {
    db.close();
    return res.json({ success: true, notifications: [] });
  }

  db.all(
    'SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC LIMIT 50',
    [userId],
    (err, rows) => {
      db.close();
      if (err) {
        return res.json({ success: true, notifications: [] });
      }
      res.json({ success: true, notifications: rows || [] });
    }
  );
});

// Messages - Use existing messages-fixed route
app.use('/api/messages', require('./routes/messages-fixed'));

// Users/profile - Basic stub (can be enhanced with SQLite)
app.get('/api/users/profile', (req, res) => {
  const userId = req.headers['x-user-id'] || null;
  res.json({
    success: true,
    data: {
      id: userId || 1,
      firstName: 'Demo',
      lastName: 'User',
      email: 'demo@yolnext.com',
      userType: 'individual',
    },
  });
});

app.put('/api/users/profile', express.json(), (req, res) => {
  res.json({ success: true, message: 'Profile updated' });
});

// Wallet - Basic SQLite implementation
app.get('/api/wallet/balance', (req, res) => {
  const sqlite3 = require('sqlite3').verbose();
  const path = require('path');
  const dbPath = path.join(__dirname, 'database.sqlite');
  const db = new sqlite3.Database(dbPath);

  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS wallets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER UNIQUE,
      balance REAL DEFAULT 0,
      updatedAt TEXT
    )`);

    const userId = req.headers['x-user-id'] || null;
    if (!userId) {
      db.close();
      return res.json({ success: true, data: { balance: 0 } });
    }

    db.get(
      'SELECT balance FROM wallets WHERE userId = ?',
      [userId],
      (err, row) => {
        if (err || !row) {
          // Create wallet if doesn't exist
          db.run(
            'INSERT OR IGNORE INTO wallets (userId, balance, updatedAt) VALUES (?, 0, ?)',
            [userId, new Date().toISOString()],
            () => {
              db.close();
              res.json({ success: true, data: { balance: 0 } });
            }
          );
        } else {
          db.close();
          res.json({ success: true, data: { balance: row.balance || 0 } });
        }
      }
    );
  });
});

app.get('/api/wallet/transactions', (req, res) => {
  const sqlite3 = require('sqlite3').verbose();
  const path = require('path');
  const dbPath = path.join(__dirname, 'database.sqlite');
  const db = new sqlite3.Database(dbPath);

  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS wallet_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      amount REAL,
      type TEXT,
      description TEXT,
      createdAt TEXT
    )`);

    const userId = req.headers['x-user-id'] || null;
    if (!userId) {
      db.close();
      return res.json({ success: true, data: [] });
    }

    db.all(
      'SELECT * FROM wallet_transactions WHERE userId = ? ORDER BY createdAt DESC LIMIT 50',
      [userId],
      (err, rows) => {
        db.close();
        if (err) {
          return res.json({ success: true, data: [] });
        }
        res.json({ success: true, data: rows || [] });
      }
    );
  });
});

app.get('/api/wallet/nakliyeci', (req, res) => {
  const sqlite3 = require('sqlite3').verbose();
  const path = require('path');
  const dbPath = path.join(__dirname, 'database.sqlite');
  const db = new sqlite3.Database(dbPath);

  const userId = req.headers['x-user-id'] || null;
  if (!userId) {
    db.close();
    return res.json({ success: true, data: { balance: 0, transactions: [] } });
  }

  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS wallets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER UNIQUE,
      balance REAL DEFAULT 0,
      updatedAt TEXT
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS wallet_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      amount REAL,
      type TEXT,
      description TEXT,
      createdAt TEXT
    )`);

    Promise.all([
      new Promise(resolve => {
        db.get(
          'SELECT balance FROM wallets WHERE userId = ?',
          [userId],
          (err, row) => {
            if (err || !row) resolve(0);
            else resolve(row.balance || 0);
          }
        );
      }),
      new Promise(resolve => {
        db.all(
          'SELECT * FROM wallet_transactions WHERE userId = ? ORDER BY createdAt DESC LIMIT 20',
          [userId],
          (err, rows) => {
            if (err) resolve([]);
            else resolve(rows || []);
          }
        );
      }),
    ])
      .then(([balance, transactions]) => {
        db.close();
        res.json({ success: true, data: { balance, transactions } });
      })
      .catch(() => {
        db.close();
        res.json({ success: true, data: { balance: 0, transactions: [] } });
      });
  });
});

app.get('/api/wallet/tasiyici', (req, res) => {
  const sqlite3 = require('sqlite3').verbose();
  const path = require('path');
  const dbPath = path.join(__dirname, 'database.sqlite');
  const db = new sqlite3.Database(dbPath);

  const userId = req.headers['x-user-id'] || null;
  if (!userId) {
    db.close();
    return res.json({ success: true, data: { balance: 0, transactions: [] } });
  }

  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS wallets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER UNIQUE,
      balance REAL DEFAULT 0,
      updatedAt TEXT
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS wallet_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      amount REAL,
      type TEXT,
      description TEXT,
      createdAt TEXT
    )`);

    Promise.all([
      new Promise(resolve => {
        db.get(
          'SELECT balance FROM wallets WHERE userId = ?',
          [userId],
          (err, row) => {
            if (err || !row) resolve(0);
            else resolve(row.balance || 0);
          }
        );
      }),
      new Promise(resolve => {
        db.all(
          'SELECT * FROM wallet_transactions WHERE userId = ? ORDER BY createdAt DESC LIMIT 20',
          [userId],
          (err, rows) => {
            if (err) resolve([]);
            else resolve(rows || []);
          }
        );
      }),
    ])
      .then(([balance, transactions]) => {
        db.close();
        res.json({ success: true, data: { balance, transactions } });
      })
      .catch(() => {
        db.close();
        res.json({ success: true, data: { balance: 0, transactions: [] } });
      });
  });
});

// JSON 404 for API
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

app.listen(PORT, () => {
  console.log(`✅ Minimal Offers Backend running on http://localhost:${PORT}`);
});
