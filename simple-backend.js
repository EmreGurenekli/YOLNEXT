const express = require('express');
const cors = require('cors');

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
    message: 'Simple Backend is working!',
  });
});

// Dashboard endpoints
app.get('/api/dashboard/individual', (req, res) => {
  res.json({
    success: true,
    data: {
      stats: {
        totalShipments: 0,
        completedShipments: 0,
        activeShipments: 0,
        totalOffers: 0,
        totalSavings: 0,
      },
      recentShipments: [],
      notifications: [],
    },
  });
});

app.get('/api/dashboard/corporate', (req, res) => {
  res.json({
    success: true,
    data: {
      stats: {
        totalShipments: 0,
        completedShipments: 0,
        activeShipments: 0,
        totalOffers: 0,
        totalSavings: 0,
      },
      recentShipments: [],
      notifications: [],
    },
  });
});

app.get('/api/dashboard/nakliyeci', (req, res) => {
  res.json({
    success: true,
    data: {
      stats: {
        totalOffers: 0,
        acceptedOffers: 0,
        openShipments: 0,
        totalEarnings: 0,
      },
      recentOffers: [],
      notifications: [],
    },
  });
});

app.get('/api/dashboard/tasiyici', (req, res) => {
  res.json({
    success: true,
    data: {
      stats: {
        totalJobs: 0,
        completedJobs: 0,
        activeJobs: 0,
        totalEarnings: 0,
      },
      recentJobs: [],
      notifications: [],
    },
  });
});

// Stats endpoints
app.get('/api/dashboard/stats/individual', (req, res) => {
  res.json({
    success: true,
    data: {
      stats: {
        totalShipments: 0,
        completedShipments: 0,
        activeShipments: 0,
        totalOffers: 0,
        totalSavings: 0,
      },
    },
  });
});

app.get('/api/dashboard/stats/corporate', (req, res) => {
  res.json({
    success: true,
    data: {
      stats: {
        totalShipments: 0,
        completedShipments: 0,
        activeShipments: 0,
        totalOffers: 0,
        totalSavings: 0,
      },
    },
  });
});

app.get('/api/dashboard/stats/nakliyeci', (req, res) => {
  res.json({
    success: true,
    data: {
      stats: {
        totalOffers: 0,
        acceptedOffers: 0,
        openShipments: 0,
        totalEarnings: 0,
      },
    },
  });
});

app.get('/api/dashboard/stats/tasiyici', (req, res) => {
  res.json({
    success: true,
    data: {
      stats: {
        totalJobs: 0,
        completedJobs: 0,
        activeJobs: 0,
        totalEarnings: 0,
      },
    },
  });
});

// Shipments endpoint
app.get('/api/shipments', (req, res) => {
  res.json({
    success: true,
    data: {
      shipments: [],
    },
  });
});

// Notifications endpoint
app.get('/api/notifications/unread-count', (req, res) => {
  res.json({
    success: true,
    data: {
      count: 0,
    },
  });
});

// Offers endpoint
app.get('/api/offers/individual', (req, res) => {
  res.json({
    success: true,
    offers: [],
  });
});

// Messages endpoint
app.get('/api/messages', (req, res) => {
  res.json({
    success: true,
    data: [],
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Simple Backend running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});
