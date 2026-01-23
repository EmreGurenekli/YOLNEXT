const express = require('express');
const cors = require('cors');
const wallet = require('./models/Wallet');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'Backend is working!',
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Test endpoint working!',
    data: { test: true },
  });
});

// Auth routes
app.post('/api/auth/register', (req, res) => {
  res.json({
    success: true,
    message: 'User registered successfully',
    user: {
      id: 1,
      email: req.body.email,
      userType: req.body.userType || 'individual',
      firstName: req.body.firstName || 'Test',
      lastName: req.body.lastName || 'User',
    },
    token: 'mock-jwt-token-' + Date.now(),
  });
});

app.post('/api/auth/login', (req, res) => {
  res.json({
    success: true,
    message: 'Login successful',
    user: {
      id: 1,
      email: req.body.email,
      userType: 'individual',
      firstName: 'Test',
      lastName: 'User',
    },
    token: 'mock-jwt-token-' + Date.now(),
  });
});

// Demo login endpoint
app.post('/api/auth/demo-login', (req, res) => {
  const { panelType } = req.body;

  const userTypes = {
    individual: {
      name: 'Bireysel Demo Kullanıcı',
      email: 'demo@bireysel.com',
      panel_type: 'individual',
      company_name: null,
      tax_number: null,
    },
    corporate: {
      name: 'Kurumsal Demo Kullanıcı',
      email: 'demo@kurumsal.com',
      panel_type: 'corporate',
      company_name: 'Demo Şirket A.Ş.',
      tax_number: '1234567890',
    },
    nakliyeci: {
      name: 'Nakliyeci Demo Kullanıcı',
      email: 'demo@nakliyeci.com',
      panel_type: 'nakliyeci',
      company_name: 'Demo Lojistik A.Ş.',
      tax_number: '0987654321',
    },
    tasiyici: {
      name: 'Taşıyıcı Demo Kullanıcı',
      email: 'demo@tasiyici.com',
      panel_type: 'tasiyici',
      company_name: null,
      tax_number: null,
    },
  };

  const user = userTypes[panelType] || userTypes.individual;

  res.json({
    success: true,
    message: 'Demo login successful',
    user: {
      id: Math.floor(Math.random() * 1000),
      ...user,
    },
    token: 'demo-jwt-token-' + Date.now(),
  });
});

// Shipments routes
app.get('/api/shipments', (req, res) => {
  res.json({
    success: true,
    shipments: [
      {
        id: 1,
        title: 'Test Gönderi',
        from: 'İstanbul',
        to: 'Ankara',
        weight: '100kg',
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
    ],
  });
});

// Add the missing /api/shipments/nakliyeci endpoint with real database access
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'database.sqlite');

// Helper function to get database connection
const getDb = () => {
  const db = new sqlite3.Database(dbPath);
  // Ensure tables exist
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS shipments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      pickupAddress TEXT NOT NULL,
      deliveryAddress TEXT NOT NULL,
      pickupDate TEXT,
      weight REAL,
      dimensions TEXT,
      specialRequirements TEXT,
      price REAL,
      status TEXT DEFAULT 'pending',
      createdAt TEXT,
      updatedAt TEXT
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS offers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shipmentId INTEGER,
      carrierId INTEGER,
      price REAL,
      message TEXT,
      estimatedDelivery TEXT,
      status TEXT DEFAULT 'pending',
      createdAt TEXT,
      updatedAt TEXT
    )`);
  });
  return db;
};

// GET /api/shipments/nakliyeci - Get accepted shipments for carriers
app.get('/api/shipments/nakliyeci', (req, res) => {
  try {
    const db = getDb();
    const { page = 1, limit = 10 } = req.query;
    const params = [parseInt(limit), (parseInt(page) - 1) * parseInt(limit)];
    const countSql =
      "SELECT COUNT(*) as total FROM shipments WHERE status = 'accepted'";
    db.get(countSql, [], (err, countResult) => {
      if (err) {
        db.close();
        return res
          .status(500)
          .json({
            success: false,
            message: 'Gönderiler sayılırken hata oluştu',
            error: err.message,
          });
      }
      const { total } = countResult;
      const sql =
        "SELECT * FROM shipments WHERE status = 'accepted' ORDER BY updatedAt DESC LIMIT ? OFFSET ?";
      db.all(sql, params, (err, rows) => {
        if (err) {
          db.close();
          return res
            .status(500)
            .json({
              success: false,
              message: 'Gönderiler alınırken hata oluştu',
              error: err.message,
            });
        }
        const payload = {
          success: true,
          data: rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit)),
          },
        };
        db.close();
        return res.json(payload);
      });
    });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message: 'Gönderiler alınırken hata oluştu',
        error: error.message,
      });
  }
});

app.post('/api/shipments', (req, res) => {
  res.json({
    success: true,
    message: 'Shipment created successfully',
    shipment: {
      id: Math.floor(Math.random() * 1000),
      ...req.body,
      status: 'pending',
      createdAt: new Date().toISOString(),
    },
  });
});

// Offers routes
app.get('/api/offers', (req, res) => {
  res.json({
    success: true,
    offers: [
      {
        id: 1,
        shipmentId: 1,
        price: 500,
        estimatedDays: 2,
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
    ],
  });
});

app.post('/api/offers', (req, res) => {
  res.json({
    success: true,
    message: 'Offer created successfully',
    offer: {
      id: Math.floor(Math.random() * 1000),
      ...req.body,
      status: 'pending',
      createdAt: new Date().toISOString(),
    },
  });
});

// Messages routes
app.get('/api/messages', (req, res) => {
  res.json({
    success: true,
    messages: [
      {
        id: 1,
        senderId: 1,
        receiverId: 2,
        content: 'Test mesajı',
        createdAt: new Date().toISOString(),
      },
    ],
  });
});

app.post('/api/messages', (req, res) => {
  res.json({
    success: true,
    message: 'Message sent successfully',
    messageData: {
      id: Math.floor(Math.random() * 1000),
      ...req.body,
      createdAt: new Date().toISOString(),
    },
  });
});

// Verification routes
app.post('/api/verify/tax-number', (req, res) => {
  res.json({
    success: true,
    message: 'Tax number verified',
    valid: true,
  });
});

app.post('/api/verify/phone', (req, res) => {
  res.json({
    success: true,
    message: 'Phone verification code sent',
    code: '123456',
  });
});

app.post('/api/verify/email', (req, res) => {
  res.json({
    success: true,
    message: 'Email verification code sent',
    code: '123456',
  });
});

// Wallet routes for nakliyeci
app.get('/api/wallet/nakliyeci', async (req, res) => {
  try {
    // For demo purposes, we'll use a fixed user ID
    // In a real implementation, this would come from authentication
    const userId = 1;

    // Get wallet balance
    const balance = await wallet.getBalance(userId);

    // Get transaction history
    const transactionHistory = await wallet.getTransactionHistory(userId, 50);

    // Calculate commission statistics
    let totalCommissions = 0;
    let pendingCommissions = 0;
    let totalRefunds = 0;

    transactionHistory.forEach(transaction => {
      if (transaction.type === 'commission') {
        totalCommissions += transaction.amount;
        if (transaction.status === 'pending') {
          pendingCommissions += transaction.amount;
        }
      } else if (transaction.type === 'refund') {
        totalRefunds += transaction.amount;
      }
    });

    // Format transactions for frontend
    const transactions = transactionHistory.map(transaction => ({
      id: transaction.id,
      offerId: transaction.reference_id || 0,
      shipmentTitle: transaction.description || 'İşlem',
      amount: transaction.amount,
      status: transaction.status || 'completed',
      createdAt: transaction.created_at,
      completedAt: transaction.updated_at,
    }));

    const walletData = {
      balance: balance,
      pendingCommissions: pendingCommissions,
      totalCommissions: totalCommissions,
      totalRefunds: totalRefunds,
      commissionRate: 1.0, // Fixed commission rate
    };

    res.json({
      success: true,
      wallet: walletData,
      transactions: transactions,
    });
  } catch (error) {
    console.error('Wallet data error:', error);
    res.status(500).json({
      success: false,
      message: 'Cüzdan verileri yüklenemedi',
      error: error.message,
    });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({ error: err.message });
});

// Start server
const server = app
  .listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Simple Backend running on http://localhost:${PORT}`);
    console.log(`✅ Backend is working!`);

    // Insert some test data if the database is empty
    const db = getDb();
    db.get('SELECT COUNT(*) as count FROM shipments', [], (err, row) => {
      if (!err && row.count === 0) {
        console.log('📝 Inserting test data...');
        const testData = [
          {
            userId: 1,
            title: 'İstanbul - Ankara Ofis Malzemesi Taşımacılığı',
            description: 'Önemli ofis malzemelerinin güvenli taşınması',
            pickupAddress: 'İstanbul, Beşiktaş',
            deliveryAddress: 'Ankara, Çankaya',
            pickupDate: new Date(
              Date.now() + 2 * 24 * 60 * 60 * 1000
            ).toISOString(),
            weight: 25.5,
            dimensions: '40x30x20',
            specialRequirements: 'Kırılacak eşyalar dikkatli paketlenecek',
            price: 450.0,
            status: 'accepted',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            userId: 2,
            title: 'İzmir - Bursa Elektronik Eşya',
            description: 'Bilgisayar ve ofis ekipmanları',
            pickupAddress: 'İzmir, Karşıyaka',
            deliveryAddress: 'Bursa, Osmangazi',
            pickupDate: new Date(
              Date.now() + 1 * 24 * 60 * 60 * 1000
            ).toISOString(),
            weight: 15.0,
            dimensions: '50x40x30',
            specialRequirements: 'Elektronik eşyalar özel ambalajda',
            price: 320.0,
            status: 'accepted',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            userId: 3,
            title: 'Antalya - İstanbul Ev Eşyaları',
            description: 'Yeni eve taşınma eşyaları',
            pickupAddress: 'Antalya, Lara',
            deliveryAddress: 'İstanbul, Kadıköy',
            pickupDate: new Date(
              Date.now() + 3 * 24 * 60 * 60 * 1000
            ).toISOString(),
            weight: 150.0,
            dimensions: '100x80x60',
            specialRequirements: 'Önemli eşyalar sigorta kapsamına alınacak',
            price: 850.0,
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];

        const stmt = db.prepare(`INSERT INTO shipments 
        (userId, title, description, pickupAddress, deliveryAddress, pickupDate, 
         weight, dimensions, specialRequirements, price, status, createdAt, updatedAt) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

        testData.forEach(data => {
          stmt.run([
            data.userId,
            data.title,
            data.description,
            data.pickupAddress,
            data.deliveryAddress,
            data.pickupDate,
            data.weight,
            data.dimensions,
            data.specialRequirements,
            data.price,
            data.status,
            data.createdAt,
            data.updatedAt,
          ]);
        });

        stmt.finalize();
        console.log('✅ Test data inserted successfully');
      }
      db.close();
    });
  })
  .on('error', err => {
    console.error('❌ Server error:', err);
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use!`);
    }
  });
