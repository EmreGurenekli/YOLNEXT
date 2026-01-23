const express = require('express');
const User = require('../models/User');
const Shipment = require('../models/Shipment');
const Offer = require('../models/Offer');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const router = express.Router();

// Get dashboard stats
router.get('/stats/:userType', async (req, res) => {
  try {
    const userId = req.user?.id;
    const { userType } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    let stats = {};

    switch (userType) {
      case 'individual':
        stats = await getIndividualStats(userId);
        break;
      case 'corporate':
        stats = await getCorporateStats(userId);
        break;
      case 'nakliyeci':
        stats = await getNakliyeciStats(userId);
        break;
      case 'tasiyici':
        stats = await getTasiyiciStats(userId);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid user type',
        });
    }

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Get recent activity
router.get('/recent-activity', async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const activities = [];

    // Get recent shipments
    const recentShipments = await Shipment.findAll({
      where: { userId },
      limit: 5,
      order: [['createdAt', 'DESC']],
    });

    // Get recent offers
    const recentOffers = await Offer.findAll({
      where: { carrierId: userId },
      limit: 5,
      order: [['createdAt', 'DESC']],
    });

    // Get recent messages
    const recentMessages = await Message.findAll({
      where: {
        [Op.or]: [{ senderId: userId }, { receiverId: userId }],
      },
      limit: 5,
      order: [['createdAt', 'DESC']],
    });

    // Get recent notifications
    const recentNotifications = await Notification.findAll({
      where: { userId },
      limit: 5,
      order: [['createdAt', 'DESC']],
    });

    activities.push(
      ...recentShipments.map(s => ({ type: 'shipment', data: s })),
      ...recentOffers.map(o => ({ type: 'offer', data: o })),
      ...recentMessages.map(m => ({ type: 'message', data: m })),
      ...recentNotifications.map(n => ({ type: 'notification', data: n }))
    );

    // Sort by date
    activities.sort(
      (a, b) => new Date(b.data.createdAt) - new Date(a.data.createdAt)
    );

    res.json({
      success: true,
      data: activities.slice(0, 10),
    });
  } catch (error) {
    console.error('Get recent activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Get analytics
router.get('/analytics', async (req, res) => {
  try {
    const userId = req.user?.id;
    const { period = '30d' } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // In a real app, you would have more complex analytics
    const analytics = {
      shipments: {
        total: 0,
        completed: 0,
        pending: 0,
        cancelled: 0,
      },
      revenue: {
        total: 0,
        thisMonth: 0,
        lastMonth: 0,
      },
      trends: {
        shipments: [],
        revenue: [],
      },
    };

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Helper functions
async function getIndividualStats(userId) {
  const totalShipments = await Shipment.count({ where: { userId } });
  const deliveredShipments = await Shipment.count({
    where: { userId, status: 'delivered' },
  });
  const pendingShipments = await Shipment.count({
    where: { userId, status: 'pending' },
  });
  const successRate =
    totalShipments > 0 ? (deliveredShipments / totalShipments) * 100 : 0;

  return {
    totalShipments,
    deliveredShipments,
    pendingShipments,
    successRate: Math.round(successRate * 100) / 100,
    totalSpent: 0,
    thisMonthSpent: 0,
  };
}

async function getCorporateStats(userId) {
  const totalShipments = await Shipment.count({ where: { userId } });
  const deliveredShipments = await Shipment.count({
    where: { userId, status: 'delivered' },
  });
  const pendingShipments = await Shipment.count({
    where: { userId, status: 'pending' },
  });
  const successRate =
    totalShipments > 0 ? (deliveredShipments / totalShipments) * 100 : 0;

  return {
    totalShipments,
    deliveredShipments,
    pendingShipments,
    successRate: Math.round(successRate * 100) / 100,
    totalSpent: 0,
    thisMonthSpent: 0,
    monthlyGrowth: 0,
    activeCarriers: 0,
  };
}

async function getNakliyeciStats(userId) {
  const totalShipments = await Shipment.count({ where: { carrierId: userId } });
  const deliveredShipments = await Shipment.count({
    where: { carrierId: userId, status: 'delivered' },
  });
  const pendingShipments = await Shipment.count({
    where: { carrierId: userId, status: 'pending' },
  });
  const successRate =
    totalShipments > 0 ? (deliveredShipments / totalShipments) * 100 : 0;

  return {
    totalShipments,
    deliveredShipments,
    pendingShipments,
    successRate: Math.round(successRate * 100) / 100,
    totalEarnings: 0,
    thisMonthEarnings: 0,
    monthlyGrowth: 0,
    activeDrivers: 0,
    totalOffers: 0,
    acceptedOffers: 0,
  };
}

async function getTasiyiciStats(userId) {
  const totalJobs = await Shipment.count({ where: { driverId: userId } });
  const completedJobs = await Shipment.count({
    where: { driverId: userId, status: 'delivered' },
  });
  const activeJobs = await Shipment.count({
    where: { driverId: userId, status: 'in_transit' },
  });
  const successRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;

  return {
    totalJobs,
    completedJobs,
    activeJobs,
    successRate: Math.round(successRate * 100) / 100,
    totalEarnings: 0,
    thisMonthEarnings: 0,
    monthlyGrowth: 0,
    rating: 0,
    totalTrips: 0,
    availableJobs: 0,
  };
}

module.exports = router;
