const express = require('express');
const { db } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Track analytics event
router.post('/track', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const { event_type, event_data, page_url } = req.body;
  const ip_address = req.ip || req.connection.remoteAddress;
  const user_agent = req.get('User-Agent');

  db.run(
    `INSERT INTO analytics (user_id, event_type, event_data, page_url, user_agent, ip_address)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      userId,
      event_type,
      JSON.stringify(event_data),
      page_url,
      user_agent,
      ip_address,
    ],
    function (err) {
      if (err) {
        console.error('Analytics tracking error:', err);
        return res.status(500).json({ error: 'Failed to track event' });
      }

      res.json({ message: 'Event tracked successfully' });
    }
  );
});

// Get user analytics
router.get('/user', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const { start_date, end_date, event_type } = req.query;

  let query = `SELECT * FROM analytics WHERE user_id = ?`;
  let params = [userId];

  if (start_date) {
    query += ` AND created_at >= ?`;
    params.push(start_date);
  }

  if (end_date) {
    query += ` AND created_at <= ?`;
    params.push(end_date);
  }

  if (event_type) {
    query += ` AND event_type = ?`;
    params.push(event_type);
  }

  query += ` ORDER BY created_at DESC LIMIT 1000`;

  db.all(query, params, (err, analytics) => {
    if (err) {
      console.error('Get analytics error:', err);
      return res.status(500).json({ error: 'Failed to fetch analytics' });
    }

    // Process analytics data
    const processedAnalytics = analytics.map(item => ({
      ...item,
      event_data: item.event_data ? JSON.parse(item.event_data) : null,
    }));

    res.json(processedAnalytics);
  });
});

// Get dashboard analytics
router.get('/dashboard', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const { period = '30' } = req.query; // days

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(period));

  // Get basic stats
  const queries = [
    // Total events
    `SELECT COUNT(*) as total_events FROM analytics WHERE user_id = ? AND created_at >= ?`,
    // Unique page views
    `SELECT COUNT(DISTINCT page_url) as unique_pages FROM analytics WHERE user_id = ? AND event_type = 'page_view' AND created_at >= ?`,
    // Most visited pages
    `SELECT page_url, COUNT(*) as visits FROM analytics WHERE user_id = ? AND event_type = 'page_view' AND created_at >= ? GROUP BY page_url ORDER BY visits DESC LIMIT 5`,
    // Events by type
    `SELECT event_type, COUNT(*) as count FROM analytics WHERE user_id = ? AND created_at >= ? GROUP BY event_type`,
    // Daily activity
    `SELECT DATE(created_at) as date, COUNT(*) as events FROM analytics WHERE user_id = ? AND created_at >= ? GROUP BY DATE(created_at) ORDER BY date DESC`,
  ];

  const params = [userId, startDate.toISOString()];

  Promise.all(
    queries.map(
      query =>
        new Promise((resolve, reject) => {
          db.all(query, params, (err, result) => {
            if (err) reject(err);
            else resolve(result);
          });
        })
    )
  )
    .then(results => {
      const [totalEvents, uniquePages, topPages, eventsByType, dailyActivity] =
        results;

      res.json({
        total_events: totalEvents[0].total_events,
        unique_pages: uniquePages[0].unique_pages,
        top_pages: topPages,
        events_by_type: eventsByType,
        daily_activity: dailyActivity,
      });
    })
    .catch(err => {
      console.error('Dashboard analytics error:', err);
      res.status(500).json({ error: 'Failed to fetch dashboard analytics' });
    });
});

// Get shipment analytics
router.get('/shipments', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const { period = '30' } = req.query;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(period));

  const queries = [
    // Total shipments
    `SELECT COUNT(*) as total_shipments FROM shipments WHERE user_id = ? AND created_at >= ?`,
    // Shipments by status
    `SELECT status, COUNT(*) as count FROM shipments WHERE user_id = ? AND created_at >= ? GROUP BY status`,
    // Average price
    `SELECT AVG(price) as avg_price FROM shipments WHERE user_id = ? AND price IS NOT NULL AND created_at >= ?`,
    // Monthly trend
    `SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as shipments FROM shipments WHERE user_id = ? AND created_at >= ? GROUP BY strftime('%Y-%m', created_at) ORDER BY month DESC`,
  ];

  const params = [userId, startDate.toISOString()];

  Promise.all(
    queries.map(
      query =>
        new Promise((resolve, reject) => {
          db.all(query, params, (err, result) => {
            if (err) reject(err);
            else resolve(result);
          });
        })
    )
  )
    .then(results => {
      const [totalShipments, shipmentsByStatus, avgPrice, monthlyTrend] =
        results;

      res.json({
        total_shipments: totalShipments[0].total_shipments,
        shipments_by_status: shipmentsByStatus,
        average_price: avgPrice[0].avg_price || 0,
        monthly_trend: monthlyTrend,
      });
    })
    .catch(err => {
      console.error('Shipment analytics error:', err);
      res.status(500).json({ error: 'Failed to fetch shipment analytics' });
    });
});

// Get financial analytics
router.get('/financial', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const { period = '30' } = req.query;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(period));

  const queries = [
    // Wallet balance
    `SELECT balance FROM wallets WHERE user_id = ? AND is_active = 1`,
    // Total transactions
    `SELECT COUNT(*) as total_transactions FROM transactions t JOIN wallets w ON t.wallet_id = w.id WHERE t.user_id = ? AND t.created_at >= ?`,
    // Transaction summary
    `SELECT type, SUM(amount) as total_amount, COUNT(*) as count FROM transactions t JOIN wallets w ON t.wallet_id = w.id WHERE t.user_id = ? AND t.created_at >= ? GROUP BY type`,
    // Monthly financial trend
    `SELECT strftime('%Y-%m', t.created_at) as month, SUM(t.amount) as total_amount FROM transactions t JOIN wallets w ON t.wallet_id = w.id WHERE t.user_id = ? AND t.created_at >= ? GROUP BY strftime('%Y-%m', t.created_at) ORDER BY month DESC`,
  ];

  const params = [userId, startDate.toISOString()];

  Promise.all(
    queries.map(
      query =>
        new Promise((resolve, reject) => {
          db.all(query, params, (err, result) => {
            if (err) reject(err);
            else resolve(result);
          });
        })
    )
  )
    .then(results => {
      const [
        walletBalance,
        totalTransactions,
        transactionSummary,
        monthlyTrend,
      ] = results;

      res.json({
        wallet_balance: walletBalance[0]?.balance || 0,
        total_transactions: totalTransactions[0].total_transactions,
        transaction_summary: transactionSummary,
        monthly_trend: monthlyTrend,
      });
    })
    .catch(err => {
      console.error('Financial analytics error:', err);
      res.status(500).json({ error: 'Failed to fetch financial analytics' });
    });
});

// Get performance analytics (for carriers)
router.get('/performance', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const { period = '30' } = req.query;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(period));

  const queries = [
    // Total offers made
    `SELECT COUNT(*) as total_offers FROM offers WHERE carrier_id = ? AND created_at >= ?`,
    // Accepted offers
    `SELECT COUNT(*) as accepted_offers FROM offers WHERE carrier_id = ? AND status = 'accepted' AND created_at >= ?`,
    // Average offer amount
    `SELECT AVG(price) as avg_offer FROM offers WHERE carrier_id = ? AND created_at >= ?`,
    // Success rate
    `SELECT 
       COUNT(*) as total_offers,
       SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted_offers
     FROM offers WHERE carrier_id = ? AND created_at >= ?`,
    // Monthly performance
    `SELECT 
       strftime('%Y-%m', created_at) as month,
       COUNT(*) as offers,
       SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted
     FROM offers WHERE carrier_id = ? AND created_at >= ? 
     GROUP BY strftime('%Y-%m', created_at) ORDER BY month DESC`,
  ];

  const params = [userId, startDate.toISOString()];

  Promise.all(
    queries.map(
      query =>
        new Promise((resolve, reject) => {
          db.all(query, params, (err, result) => {
            if (err) reject(err);
            else resolve(result);
          });
        })
    )
  )
    .then(results => {
      const [
        totalOffers,
        acceptedOffers,
        avgOffer,
        successRate,
        monthlyPerformance,
      ] = results;

      const successRateData = successRate[0];
      const calculatedSuccessRate =
        successRateData.total_offers > 0
          ? (successRateData.accepted_offers / successRateData.total_offers) *
            100
          : 0;

      res.json({
        total_offers: totalOffers[0].total_offers,
        accepted_offers: acceptedOffers[0].accepted_offers,
        average_offer: avgOffer[0].avg_offer || 0,
        success_rate: calculatedSuccessRate,
        monthly_performance: monthlyPerformance,
      });
    })
    .catch(err => {
      console.error('Performance analytics error:', err);
      res.status(500).json({ error: 'Failed to fetch performance analytics' });
    });
});

module.exports = router;
