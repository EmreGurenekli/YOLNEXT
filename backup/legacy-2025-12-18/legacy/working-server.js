// Genel shipments listesi (filtre: userId)
app.get('/api/shipments', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { status } = req.query;
    const params = [userId];
    let query =
      'SELECT * FROM shipments WHERE userId = $1 ORDER BY created_at DESC';

    if (status) {
      params.push(status);
      query =
        'SELECT * FROM shipments WHERE userId = $1 AND status = $2 ORDER BY created_at DESC';
    }
    const result = await pool.query(query, params);
    res.json({ shipments: result.rows });
  } catch (err) {
    console.error('❌ Get shipments error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Shipment oluşturma
app.post('/api/shipments', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const {
      from_city,
      to_city,
      cargo_type,
      weight = 0,
      volume = 0,
      delivery_date,
      special_requirements,
    } = req.body || {};

    const result = await pool.query(
      `INSERT INTO shipments (
         userId, userRole, from_city, to_city, cargo_type, weight, volume, delivery_date, special_requirements, status, created_at, updated_at
       ) VALUES ($1, 'individual', $2, $3, $4, $5, $6, $7, $8, 'pending', NOW(), NOW()) RETURNING *`,
      [
        userId,
        from_city,
        to_city,
        cargo_type,
        weight,
        volume,
        delivery_date,
        special_requirements,
      ]
    );

    res.status(201).json({ shipment: result.rows[0] });
  } catch (err) {
    console.error('❌ Create shipment error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});
// Eksik endpoint'leri ekle
app.get('/api/offers', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    console.log('📋 Get offers - User ID:', userId);

    const result = await pool.query(
      'SELECT * FROM offers WHERE userId = $1 ORDER BY createdAt DESC LIMIT 50',
      [userId]
    );

    console.log('✅ Found offers:', result.rows.length);
    res.json({ success: true, offers: result.rows });
  } catch (err) {
    console.error('❌ Get offers error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/offers', authenticateToken, async (req, res) => {
  try {
    const { userId, shipmentId, price, message } = req.body;

    const result = await pool.query(
      `INSERT INTO offers (userId, shipmentId, price, message, status, createdAt) 
       VALUES ($1, $2, $3, $4, 'pending', NOW()) RETURNING *`,
      [userId, shipmentId, price, message]
    );

    res.json({ success: true, offer: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    console.log('🔔 Get notifications - User ID:', userId);

    const result = await pool.query(
      'SELECT * FROM notifications WHERE userId = $1 ORDER BY createdAt DESC LIMIT 50',
      [userId]
    );

    console.log('✅ Found notifications:', result.rows.length);
    res.json({ success: true, notifications: result.rows });
  } catch (err) {
    console.error('❌ Get notifications error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Nakliyeci endpoint'leri
app.get('/api/shipments/nakliyeci', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    console.log('🚛 Get nakliyeci shipments - User ID:', userId);

    const result = await pool.query(
      "SELECT * FROM shipments WHERE userRole = 'nakliyeci' AND userId = $1 ORDER BY createdAt DESC LIMIT 50",
      [userId]
    );

    console.log('✅ Found nakliyeci shipments:', result.rows.length);
    res.json({ success: true, shipments: result.rows });
  } catch (err) {
    console.error('❌ Get nakliyeci shipments error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get(
  '/api/shipments/nakliyeci/active',
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user?.id || req.user?.userId;
      const result = await pool.query(
        "SELECT * FROM shipments WHERE userRole = 'nakliyeci' AND userId = $1 AND status = 'active' ORDER BY createdAt DESC",
        [userId]
      );
      res.json({ success: true, shipments: result.rows });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

app.get(
  '/api/shipments/nakliyeci/completed',
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user?.id || req.user?.userId;
      const result = await pool.query(
        "SELECT * FROM shipments WHERE userRole = 'nakliyeci' AND userId = $1 AND status = 'completed' ORDER BY createdAt DESC",
        [userId]
      );
      res.json({ success: true, shipments: result.rows });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

app.get(
  '/api/shipments/nakliyeci/cancelled',
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user?.id || req.user?.userId;
      const result = await pool.query(
        "SELECT * FROM shipments WHERE userRole = 'nakliyeci' AND userId = $1 AND status = 'cancelled' ORDER BY createdAt DESC",
        [userId]
      );
      res.json({ success: true, shipments: result.rows });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// Taşıyıcı endpoint'leri
app.get(
  '/api/shipments/tasiyici/completed',
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user?.id || req.user?.userId;
      const result = await pool.query(
        "SELECT * FROM shipments WHERE userRole = 'tasiyici' AND userId = $1 AND status = 'completed' ORDER BY createdAt DESC",
        [userId]
      );
      res.json({ success: true, shipments: result.rows });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// Kurumsal endpoint'leri
app.get('/api/shipments/corporate', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const result = await pool.query(
      "SELECT * FROM shipments WHERE userRole = 'corporate' AND userId = $1 ORDER BY createdAt DESC LIMIT 50",
      [userId]
    );
    res.json({ success: true, shipments: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/offers/corporate', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const result = await pool.query(
      'SELECT * FROM offers WHERE userId = $1 ORDER BY createdAt DESC LIMIT 50',
      [userId]
    );
    res.json({ success: true, offers: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/offers/individual', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const result = await pool.query(
      'SELECT * FROM offers WHERE userId = $1 ORDER BY createdAt DESC LIMIT 50',
      [userId]
    );
    res.json({ success: true, offers: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get(
  '/api/notifications/individual',
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user?.id || req.user?.userId;
      const result = await pool.query(
        'SELECT * FROM notifications WHERE userId = $1 ORDER BY createdAt DESC LIMIT 50',
        [userId]
      );
      res.json({ success: true, notifications: result.rows });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

app.get(
  '/api/shipments/individual/history',
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user?.id || req.user?.userId;
      const result = await pool.query(
        "SELECT * FROM shipments WHERE userRole = 'individual' AND userId = $1 ORDER BY createdAt DESC LIMIT 50",
        [userId]
      );
      res.json({ success: true, shipments: result.rows });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

app.get('/api/shipments/individual', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const result = await pool.query(
      "SELECT * FROM shipments WHERE userRole = 'individual' AND userId = $1 ORDER BY createdAt DESC LIMIT 50",
      [userId]
    );
    res.json({ success: true, shipments: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Offer accept/reject endpoints
app.post('/api/offers/:id/accept', authenticateToken, async (req, res) => {
  try {
    const offerId = req.params.id;
    const result = await pool.query(
      "UPDATE offers SET status = 'accepted' WHERE id = $1 RETURNING *",
      [offerId]
    );
    res.json({ success: true, offer: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/offers/:id/reject', authenticateToken, async (req, res) => {
  try {
    const offerId = req.params.id;
    const result = await pool.query(
      "UPDATE offers SET status = 'rejected' WHERE id = $1 RETURNING *",
      [offerId]
    );
    res.json({ success: true, offer: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Notification endpoints
app.put('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const result = await pool.query(
      'UPDATE notifications SET isRead = true WHERE id = $1 RETURNING *',
      [notificationId]
    );
    res.json({ success: true, notification: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put(
  '/api/notifications/mark-all-read',
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user?.id || req.user?.userId;
      const result = await pool.query(
        'UPDATE notifications SET isRead = true WHERE userId = $1',
        [userId]
      );
      res.json({ success: true, message: 'All notifications marked as read' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// Shipment tracking endpoints
app.get('/api/shipments/:id/tracking', authenticateToken, async (req, res) => {
  try {
    const shipmentId = req.params.id;
    const result = await pool.query('SELECT * FROM shipments WHERE id = $1', [
      shipmentId,
    ]);
    res.json({ success: true, shipment: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get(
  '/api/shipments/:id/status-history',
  authenticateToken,
  async (req, res) => {
    try {
      const shipmentId = req.params.id;
      const result = await pool.query(
        'SELECT * FROM shipment_status_history WHERE shipmentId = $1 ORDER BY createdAt DESC',
        [shipmentId]
      );
      res.json({ success: true, history: result.rows });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

app.put('/api/shipments/:id/status', authenticateToken, async (req, res) => {
  try {
    const shipmentId = req.params.id;
    const { status } = req.body;
    const result = await pool.query(
      'UPDATE shipments SET status = $1 WHERE id = $2 RETURNING *',
      [status, shipmentId]
    );
    res.json({ success: true, shipment: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Messages endpoints
app.get('/api/messages/:userType', authenticateToken, async (req, res) => {
  try {
    const userType = req.params.userType;
    const userId = req.user?.id || req.user?.userId;
    const result = await pool.query(
      'SELECT * FROM messages WHERE (senderId = $1 OR receiverId = $1) AND userType = $2 ORDER BY createdAt DESC LIMIT 50',
      [userId, userType]
    );
    res.json({ success: true, messages: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/messages', authenticateToken, async (req, res) => {
  try {
    const { receiverId, message, userType } = req.body;
    const senderId = req.user?.id || req.user?.userId;

    const result = await pool.query(
      `INSERT INTO messages (senderId, receiverId, message, userType, createdAt) 
       VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
      [senderId, receiverId, message, userType]
    );

    res.json({ success: true, message: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Dashboard endpoints - Nakliyeci & Taşıyıcı
