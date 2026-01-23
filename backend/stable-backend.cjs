const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const PORT = 5000;

// PostgreSQL connection
let pool;
try {
  pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'yolnext',
    password: '2563',
    port: 5432,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  console.log('✅ PostgreSQL pool created');
} catch (error) {
  console.error('❌ Error creating PostgreSQL pool:', error);
}


// ========================================
// GÜVENLİK KODLARI
// ========================================

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access token required' 
    });
  }

  // Demo token kontrolü
  if (token === 'demo-token' || token === 'valid-token') {
    req.user = { id: 1, type: 'individual' };
    next();
  } else {
    return res.status(403).json({ 
      success: false, 
      message: 'Invalid token' 
    });
  }
};

// Input sanitization
const sanitizeInput = (req, res, next) => {
  if (req.body) {
    for (let key in req.body) {
      if (typeof req.body[key] === 'string') {
        // SQL injection koruması
        req.body[key] = req.body[key].replace(/['";]/g, '');
        // XSS koruması
        req.body[key] = req.body[key].replace(/<script[^>]*>.*?</script>/gi, '');
        req.body[key] = req.body[key].replace(/<[^>]*>/g, '');
      }
    }
  }
  next();
};

// Rate limiting
const rateLimitMap = new Map();

const rateLimit = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 dakika
  const maxRequests = 100;

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return next();
  }

  const userLimit = rateLimitMap.get(ip);
  
  if (now > userLimit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return next();
  }

  if (userLimit.count >= maxRequests) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests from this IP'
    });
  }

  userLimit.count++;
  next();
};

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

// Middleware'leri uygula
app.use('/api', sanitizeInput);
app.use('/api', rateLimit);
app.use('/api/shipments', authenticateToken);
app.use('/api/offers', authenticateToken);
app.use('/api/messages', authenticateToken);
app.use('/api/notifications', authenticateToken);
app.use('/api/users', authenticateToken);
app.use('/api/reports', authenticateToken);
app.use('/api/jobs', authenticateToken);

// CSRF token endpoint
app.get('/api/csrf-token', (req, res) => {
  const csrfToken = Math.random().toString(36).substring(2, 15);
  res.json({ csrfToken });
});

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Backend is working!',
    database: pool ? 'Connected' : 'Not connected'
  });
});

// Dashboard endpoints
app.get('/api/dashboard/individual', async (req, res) => {
  try {
    if (!pool) {
      return res.json({
        success: true,
        data: {
          stats: {
            totalShipments: 0,
            completedShipments: 0,
            activeShipments: 0,
            totalOffers: 0,
            totalSavings: 0
          },
          recentShipments: [],
          notifications: []
        }
      });
    }

    const result = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM shipments WHERE userid = 1) as total_shipments,
        (SELECT COUNT(*) FROM shipments WHERE userid = 1 AND status = 'active') as active_shipments,
        (SELECT COUNT(*) FROM offers WHERE shipmentid IN (SELECT id FROM shipments WHERE userid = 1)) as total_offers,
        (SELECT COALESCE(SUM(price), 0) FROM offers WHERE shipmentid IN (SELECT id FROM shipments WHERE userid = 1) AND status = 'accepted') as total_savings
    `);
    
    res.json({
      success: true,
      data: {
        stats: {
          totalShipments: parseInt(result.rows[0].total_shipments),
          completedShipments: parseInt(result.rows[0].total_shipments),
          activeShipments: parseInt(result.rows[0].active_shipments),
          totalOffers: parseInt(result.rows[0].total_offers),
          totalSavings: parseFloat(result.rows[0].total_savings)
        },
        recentShipments: [],
        notifications: []
      }
    });
  } catch (error) {
    console.error('Dashboard individual error:', error);
    res.json({
      success: true,
      data: {
        stats: {
          totalShipments: 0,
          completedShipments: 0,
          activeShipments: 0,
          totalOffers: 0,
          totalSavings: 0
        },
        recentShipments: [],
        notifications: []
      }
    });
  }
});

app.get('/api/dashboard/corporate', async (req, res) => {
  try {
    if (!pool) {
      return res.json({
        success: true,
        data: {
          stats: {
            totalShipments: 0,
            completedShipments: 0,
            activeShipments: 0,
            totalOffers: 0,
            totalSavings: 0
          },
          recentShipments: [],
          notifications: []
        }
      });
    }

    const result = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM shipments WHERE userid = 2) as total_shipments,
        (SELECT COUNT(*) FROM shipments WHERE userid = 2 AND status = 'active') as active_shipments,
        (SELECT COUNT(*) FROM offers WHERE shipmentid IN (SELECT id FROM shipments WHERE userid = 2)) as total_offers,
        (SELECT COALESCE(SUM(price), 0) FROM offers WHERE shipmentid IN (SELECT id FROM shipments WHERE userid = 2) AND status = 'accepted') as total_savings
    `);
    
    res.json({
      success: true,
      data: {
        stats: {
          totalShipments: parseInt(result.rows[0].total_shipments),
          completedShipments: parseInt(result.rows[0].total_shipments),
          activeShipments: parseInt(result.rows[0].active_shipments),
          totalOffers: parseInt(result.rows[0].total_offers),
          totalSavings: parseFloat(result.rows[0].total_savings)
        },
        recentShipments: [],
        notifications: []
      }
    });
  } catch (error) {
    console.error('Dashboard corporate error:', error);
    res.json({
      success: true,
      data: {
        stats: {
          totalShipments: 0,
          completedShipments: 0,
          activeShipments: 0,
          totalOffers: 0,
          totalSavings: 0
        },
        recentShipments: [],
        notifications: []
      }
    });
  }
});

app.get('/api/dashboard/nakliyeci', async (req, res) => {
  try {
    if (!pool) {
      return res.json({
        success: true,
        data: {
          stats: {
            totalOffers: 0,
            acceptedOffers: 0,
            openShipments: 0,
            totalEarnings: 0
          },
          recentOffers: [],
          notifications: []
        }
      });
    }

    const result = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM offers WHERE carrierid = 3) as total_offers,
        (SELECT COUNT(*) FROM offers WHERE carrierid = 3 AND status = 'accepted') as accepted_offers,
        (SELECT COUNT(*) FROM shipments WHERE status = 'open') as open_shipments,
        (SELECT COALESCE(SUM(price), 0) FROM offers WHERE carrierid = 3 AND status = 'accepted') as total_earnings
    `);
    
    res.json({
      success: true,
      data: {
        stats: {
          totalOffers: parseInt(result.rows[0].total_offers),
          acceptedOffers: parseInt(result.rows[0].accepted_offers),
          openShipments: parseInt(result.rows[0].open_shipments),
          totalEarnings: parseFloat(result.rows[0].total_earnings)
        },
        recentOffers: [],
        notifications: []
      }
    });
  } catch (error) {
    console.error('Dashboard nakliyeci error:', error);
    res.json({
      success: true,
      data: {
        stats: {
          totalOffers: 0,
          acceptedOffers: 0,
          openShipments: 0,
          totalEarnings: 0
        },
        recentOffers: [],
        notifications: []
      }
    });
  }
});

app.get('/api/dashboard/tasiyici', async (req, res) => {
  res.json({
    success: true,
    data: {
      stats: {
        totalJobs: 0,
        completedJobs: 0,
        activeJobs: 0,
        totalEarnings: 0
      },
      recentJobs: [],
      notifications: []
    }
  });
});

// Stats endpoints (for compatibility with frontend)
app.get('/api/dashboard/stats/individual', async (req, res) => {
  try {
    if (!pool) {
      return res.json({
        success: true,
        data: {
          stats: {
            totalShipments: 0,
            completedShipments: 0,
            activeShipments: 0,
            totalOffers: 0,
            totalSavings: 0
          }
        }
      });
    }

    const result = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM shipments WHERE userid = 1) as total_shipments,
        (SELECT COUNT(*) FROM shipments WHERE userid = 1 AND status = 'active') as active_shipments,
        (SELECT COUNT(*) FROM offers WHERE shipmentid IN (SELECT id FROM shipments WHERE userid = 1)) as total_offers,
        (SELECT COALESCE(SUM(price), 0) FROM offers WHERE shipmentid IN (SELECT id FROM shipments WHERE userid = 1) AND status = 'accepted') as total_savings
    `);
    
    res.json({
      success: true,
      data: {
        stats: {
          totalShipments: parseInt(result.rows[0].total_shipments),
          completedShipments: parseInt(result.rows[0].total_shipments),
          activeShipments: parseInt(result.rows[0].active_shipments),
          totalOffers: parseInt(result.rows[0].total_offers),
          totalSavings: parseFloat(result.rows[0].total_savings)
        }
      }
    });
  } catch (error) {
    console.error('Stats individual error:', error);
    res.json({
      success: true,
      data: {
        stats: {
          totalShipments: 0,
          completedShipments: 0,
          activeShipments: 0,
          totalOffers: 0,
          totalSavings: 0
        }
      }
    });
  }
});

app.get('/api/dashboard/stats/corporate', async (req, res) => {
  try {
    if (!pool) {
      return res.json({
        success: true,
        data: {
          stats: {
            totalShipments: 0,
            completedShipments: 0,
            activeShipments: 0,
            totalOffers: 0,
            totalSavings: 0
          }
        }
      });
    }

    const result = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM shipments WHERE userid = 2) as total_shipments,
        (SELECT COUNT(*) FROM shipments WHERE userid = 2 AND status = 'active') as active_shipments,
        (SELECT COUNT(*) FROM offers WHERE shipmentid IN (SELECT id FROM shipments WHERE userid = 2)) as total_offers,
        (SELECT COALESCE(SUM(price), 0) FROM offers WHERE shipmentid IN (SELECT id FROM shipments WHERE userid = 2) AND status = 'accepted') as total_savings
    `);
    
    res.json({
      success: true,
      data: {
        stats: {
          totalShipments: parseInt(result.rows[0].total_shipments),
          completedShipments: parseInt(result.rows[0].total_shipments),
          activeShipments: parseInt(result.rows[0].active_shipments),
          totalOffers: parseInt(result.rows[0].total_offers),
          totalSavings: parseFloat(result.rows[0].total_savings)
        }
      }
    });
  } catch (error) {
    console.error('Stats corporate error:', error);
    res.json({
      success: true,
      data: {
        stats: {
          totalShipments: 0,
          completedShipments: 0,
          activeShipments: 0,
          totalOffers: 0,
          totalSavings: 0
        }
      }
    });
  }
});

app.get('/api/dashboard/stats/nakliyeci', async (req, res) => {
  try {
    if (!pool) {
      return res.json({
        success: true,
        data: {
          stats: {
            totalOffers: 0,
            acceptedOffers: 0,
            openShipments: 0,
            totalEarnings: 0
          }
        }
      });
    }

    const result = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM offers WHERE carrierid = 3) as total_offers,
        (SELECT COUNT(*) FROM offers WHERE carrierid = 3 AND status = 'accepted') as accepted_offers,
        (SELECT COUNT(*) FROM shipments WHERE status = 'open') as open_shipments,
        (SELECT COALESCE(SUM(price), 0) FROM offers WHERE carrierid = 3 AND status = 'accepted') as total_earnings
    `);
    
    res.json({
      success: true,
      data: {
        stats: {
          totalOffers: parseInt(result.rows[0].total_offers),
          acceptedOffers: parseInt(result.rows[0].accepted_offers),
          openShipments: parseInt(result.rows[0].open_shipments),
          totalEarnings: parseFloat(result.rows[0].total_earnings)
        }
      }
    });
  } catch (error) {
    console.error('Stats nakliyeci error:', error);
    res.json({
      success: true,
      data: {
        stats: {
          totalOffers: 0,
          acceptedOffers: 0,
          openShipments: 0,
          totalEarnings: 0
        }
      }
    });
  }
});

app.get('/api/dashboard/stats/tasiyici', async (req, res) => {
  res.json({
    success: true,
    data: {
      stats: {
        totalJobs: 0,
        completedJobs: 0,
        activeJobs: 0,
        totalEarnings: 0
      }
    }
  });
});

// Shipments endpoint
app.get('/api/shipments', async (req, res) => {
  try {
    if (!pool) {
      return res.json({
        success: true,
        data: {
          shipments: []
        }
      });
    }

    const result = await pool.query('SELECT * FROM shipments ORDER BY createdat DESC LIMIT 50');
    res.json({
      success: true,
      data: {
        shipments: result.rows
      }
    });
  } catch (error) {
    console.error('Shipments error:', error);
    res.json({
      success: true,
      data: {
        shipments: []
      }
    });
  }
});

// Notifications endpoint
app.get('/api/notifications/unread-count', async (req, res) => {
  res.json({
    success: true,
    data: {
      count: 0
    }
  });
});

// Offers endpoint
app.get('/api/offers/individual', async (req, res) => {
  res.json({
    success: true,
    offers: []
  });
});

// Messages endpoints
app.get('/api/messages', async (req, res) => {
  try {
    if (!pool) {
      return res.json({
        success: true,
        data: []
      });
    }

    const result = await pool.query('SELECT * FROM messages ORDER BY createdat DESC LIMIT 50');
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Messages error:', error);
    res.json({
      success: true,
      data: []
    });
  }
});

// Messages by user type
app.get('/api/messages/individual', async (req, res) => {
  try {
    if (!pool) {
      return res.json({
        success: true,
        conversations: []
      });
    }

    const result = await pool.query(`
      SELECT DISTINCT 
        CASE 
          WHEN senderid = 1 THEN receiverid 
          ELSE senderid 
        END as other_user_id,
        CASE 
          WHEN senderid = 1 THEN 'receiver' 
          ELSE 'sender' 
        END as role,
        MAX(createdat) as last_message_time,
        COUNT(*) as message_count
      FROM messages 
      WHERE senderid = 1 OR receiverid = 1
      GROUP BY other_user_id, role
      ORDER BY last_message_time DESC
    `);
    
    res.json({
      success: true,
      conversations: result.rows
    });
  } catch (error) {
    console.error('Individual messages error:', error);
    res.json({
      success: true,
      conversations: []
    });
  }
});

app.get('/api/messages/corporate', async (req, res) => {
  try {
    if (!pool) {
      return res.json({
        success: true,
        conversations: []
      });
    }

    const result = await pool.query(`
      SELECT DISTINCT 
        CASE 
          WHEN senderid = 2 THEN receiverid 
          ELSE senderid 
        END as other_user_id,
        CASE 
          WHEN senderid = 2 THEN 'receiver' 
          ELSE 'sender' 
        END as role,
        MAX(createdat) as last_message_time,
        COUNT(*) as message_count
      FROM messages 
      WHERE senderid = 2 OR receiverid = 2
      GROUP BY other_user_id, role
      ORDER BY last_message_time DESC
    `);
    
    res.json({
      success: true,
      conversations: result.rows
    });
  } catch (error) {
    console.error('Corporate messages error:', error);
    res.json({
      success: true,
      conversations: []
    });
  }
});

app.get('/api/messages/nakliyeci', async (req, res) => {
  try {
    if (!pool) {
      return res.json({
        success: true,
        conversations: []
      });
    }

    const result = await pool.query(`
      SELECT DISTINCT 
        CASE 
          WHEN senderid = 3 THEN receiverid 
          ELSE senderid 
        END as other_user_id,
        CASE 
          WHEN senderid = 3 THEN 'receiver' 
          ELSE 'sender' 
        END as role,
        MAX(createdat) as last_message_time,
        COUNT(*) as message_count
      FROM messages 
      WHERE senderid = 3 OR receiverid = 3
      GROUP BY other_user_id, role
      ORDER BY last_message_time DESC
    `);
    
    res.json({
      success: true,
      conversations: result.rows
    });
  } catch (error) {
    console.error('Nakliyeci messages error:', error);
    res.json({
      success: true,
      conversations: []
    });
  }
});

app.get('/api/messages/tasiyici', async (req, res) => {
  try {
    if (!pool) {
      return res.json({
        success: true,
        conversations: []
      });
    }

    const result = await pool.query(`
      SELECT DISTINCT 
        CASE 
          WHEN senderid = 4 THEN receiverid 
          ELSE senderid 
        END as other_user_id,
        CASE 
          WHEN senderid = 4 THEN 'receiver' 
          ELSE 'sender' 
        END as role,
        MAX(createdat) as last_message_time,
        COUNT(*) as message_count
      FROM messages 
      WHERE senderid = 4 OR receiverid = 4
      GROUP BY other_user_id, role
      ORDER BY last_message_time DESC
    `);
    
    res.json({
      success: true,
      conversations: result.rows
    });
  } catch (error) {
    console.error('Taşıyıcı messages error:', error);
    res.json({
      success: true,
      conversations: []
    });
  }
});

// Send message endpoint
app.post('/api/messages/send', async (req, res) => {
  try {
    const { senderId, receiverId, message, shipmentId } = req.body;
    
    if (!pool) {
      return res.json({
        success: true,
        message: 'Message sent (mock)'
      });
    }

    const result = await pool.query(
      'INSERT INTO messages (senderid, receiverid, message, shipmentid, createdat) VALUES ($1, $2, $3, $4, NOW())',
      [senderId, receiverId, message, shipmentId]
    );
    
    res.json({
      success: true,
      message: 'Message sent successfully'
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.json({
      success: false,
      message: 'Failed to send message'
    });
  }
});

// Notifications endpoints
app.get('/api/notifications', async (req, res) => {
  try {
    if (!pool) {
      return res.json({
        success: true,
        notifications: []
      });
    }

    const result = await pool.query('SELECT * FROM notifications ORDER BY createdat DESC LIMIT 50');
    res.json({
      success: true,
      notifications: result.rows
    });
  } catch (error) {
    console.error('Notifications error:', error);
    res.json({
      success: true,
      notifications: []
    });
  }
});

app.get('/api/notifications/individual', async (req, res) => {
  try {
    if (!pool) {
      return res.json({
        success: true,
        notifications: []
      });
    }

    const result = await pool.query(`
      SELECT * FROM notifications 
      WHERE userid = 1 OR userid IS NULL
      ORDER BY createdat DESC LIMIT 20
    `);
    
    res.json({
      success: true,
      notifications: result.rows
    });
  } catch (error) {
    console.error('Individual notifications error:', error);
    res.json({
      success: true,
      notifications: []
    });
  }
});

app.get('/api/notifications/corporate', async (req, res) => {
  try {
    if (!pool) {
      return res.json({
        success: true,
        notifications: []
      });
    }

    const result = await pool.query(`
      SELECT * FROM notifications 
      WHERE userid = 2 OR userid IS NULL
      ORDER BY createdat DESC LIMIT 20
    `);
    
    res.json({
      success: true,
      notifications: result.rows
    });
  } catch (error) {
    console.error('Corporate notifications error:', error);
    res.json({
      success: true,
      notifications: []
    });
  }
});

app.get('/api/notifications/nakliyeci', async (req, res) => {
  try {
    if (!pool) {
      return res.json({
        success: true,
        notifications: []
      });
    }

    const result = await pool.query(`
      SELECT * FROM notifications 
      WHERE userid = 3 OR userid IS NULL
      ORDER BY createdat DESC LIMIT 20
    `);
    
    res.json({
      success: true,
      notifications: result.rows
    });
  } catch (error) {
    console.error('Nakliyeci notifications error:', error);
    res.json({
      success: true,
      notifications: []
    });
  }
});

app.get('/api/notifications/tasiyici', async (req, res) => {
  try {
    if (!pool) {
      return res.json({
        success: true,
        notifications: []
      });
    }

    const result = await pool.query(`
      SELECT * FROM notifications 
      WHERE userid = 4 OR userid IS NULL
      ORDER BY createdat DESC LIMIT 20
    `);
    
    res.json({
      success: true,
      notifications: result.rows
    });
  } catch (error) {
    console.error('Taşıyıcı notifications error:', error);
    res.json({
      success: true,
      notifications: []
    });
  }
});

// User profile endpoint
app.get('/api/users/profile', async (req, res) => {
  try {
    if (!pool) {
      return res.json({
        success: true,
        profile: {
          id: 1,
          name: 'Demo User',
          email: 'demo@example.com',
          type: 'individual'
        }
      });
    }

    const result = await pool.query('SELECT * FROM users WHERE id = 1 LIMIT 1');
    
    res.json({
      success: true,
      profile: result.rows[0] || {
        id: 1,
        name: 'Demo User',
        email: 'demo@example.com',
        type: 'individual'
      }
    });
  } catch (error) {
    console.error('User profile error:', error);
    res.json({
      success: true,
      profile: {
        id: 1,
        name: 'Demo User',
        email: 'demo@example.com',
        type: 'individual'
      }
    });
  }
});

// Dashboard stats endpoint
app.get('/api/reports/dashboard-stats', async (req, res) => {
  try {
    if (!pool) {
      return res.json({
        success: true,
        stats: {
          totalShipments: 0,
          activeShipments: 0,
          completedShipments: 0,
          totalOffers: 0,
          unreadMessages: 0,
          notifications: 0
        }
      });
    }

    const shipmentsResult = await pool.query('SELECT COUNT(*) as count FROM shipments');
    const offersResult = await pool.query('SELECT COUNT(*) as count FROM offers');
    const messagesResult = await pool.query('SELECT COUNT(*) as count FROM messages WHERE isread = false');
    const notificationsResult = await pool.query('SELECT COUNT(*) as count FROM notifications WHERE isread = false');
    
    res.json({
      success: true,
      stats: {
        totalShipments: parseInt(shipmentsResult.rows[0]?.count || 0),
        activeShipments: parseInt(shipmentsResult.rows[0]?.count || 0),
        completedShipments: 0,
        totalOffers: parseInt(offersResult.rows[0]?.count || 0),
        unreadMessages: parseInt(messagesResult.rows[0]?.count || 0),
        notifications: parseInt(notificationsResult.rows[0]?.count || 0)
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.json({
      success: true,
      stats: {
        totalShipments: 0,
        activeShipments: 0,
        completedShipments: 0,
        totalOffers: 0,
        unreadMessages: 0,
        notifications: 0
      }
    });
  }
});

// Jobs endpoint for taşıyıcı
app.get('/api/jobs/open', async (req, res) => {
  try {
    if (!pool) {
      return res.json({
        success: true,
        jobs: []
      });
    }

    const result = await pool.query(`
      SELECT s.*, o.price as offer_price, o.note as offer_note
      FROM shipments s
      LEFT JOIN offers o ON s.id = o.shipmentid
      WHERE s.status = 'active'
      ORDER BY s.createdat DESC LIMIT 20
    `);
    
    res.json({
      success: true,
      jobs: result.rows
    });
  } catch (error) {
    console.error('Open jobs error:', error);
    res.json({
      success: true,
      jobs: []
    });
  }
});

// WebSocket events
io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);

  socket.on('join', (data) => {
    console.log('👤 User joined:', data);
    socket.join(data.userRole);
  });

  socket.on('disconnect', () => {
    console.log('🔌 User disconnected:', socket.id);
  });

  socket.on('send-notification', (data) => {
    socket.to(data.targetUserId).emit('notification', data.notification);
  });

  socket.on('send-message', (data) => {
    socket.to(data.roomId).emit('new-message', data);
  });

  socket.on('send-offer', (data) => {
    socket.to(data.shipmentId).emit('new-offer', data);
  });
});

// Start server
async function startServer() {
  try {
    console.log('🚀 Starting Backend...');
    
    // Test PostgreSQL connection
    if (pool) {
      try {
        await pool.query('SELECT 1');
        console.log('✅ PostgreSQL connection test successful');
      } catch (error) {
        console.error('❌ PostgreSQL connection test failed:', error.message);
        console.log('⚠️ Continuing without database...');
      }
    }
    
    server.listen(PORT, () => {
      console.log(`🚀 Backend running on http://localhost:${PORT}`);
      console.log(`✅ Health check: http://localhost:${PORT}/api/health`);
      console.log(`📦 Shipments API: http://localhost:${PORT}/api/shipments`);
      console.log(`🔌 WebSocket: Socket.IO enabled`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
  }
}

startServer();
