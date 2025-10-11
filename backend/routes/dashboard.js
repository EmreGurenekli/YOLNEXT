const express = require('express');
const { User, CorporateUser, Carrier, Driver, Shipment, Offer } = require('../models');
const { protect } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.userType;

    let stats = {};

    if (userType === 'individual' || userType === 'corporate') {
      // Sender statistics
      const totalShipments = await Shipment.count({ where: { senderId: userId } });
      const deliveredShipments = await Shipment.count({ 
        where: { senderId: userId, status: 'delivered' } 
      });
      const pendingShipments = await Shipment.count({ 
        where: { senderId: userId, status: 'pending' } 
      });
      const inTransitShipments = await Shipment.count({ 
        where: { senderId: userId, status: 'in_transit' } 
      });

      // Calculate total spent
      const shipments = await Shipment.findAll({
        where: { senderId: userId, status: 'delivered' },
        attributes: ['price']
      });
      const totalSpent = shipments.reduce((sum, shipment) => sum + (shipment.price || 0), 0);

      // This month's spending
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const thisMonthShipments = await Shipment.findAll({
        where: { 
          senderId: userId, 
          status: 'delivered',
          updatedAt: { [require('sequelize').Op.gte]: thisMonth }
        },
        attributes: ['price']
      });
      const thisMonthSpent = thisMonthShipments.reduce((sum, shipment) => sum + (shipment.price || 0), 0);

      stats = {
        totalShipments,
        deliveredShipments,
        pendingShipments,
        inTransitShipments,
        successRate: totalShipments > 0 ? Math.round((deliveredShipments / totalShipments) * 100) : 0,
        totalSpent,
        thisMonthSpent
      };

    } else if (userType === 'carrier') {
      // Carrier statistics
      const carrier = await Carrier.findOne({ where: { userId } });
      if (!carrier) {
        return res.status(404).json({ success: false, message: 'Nakliyeci profili bulunamadı' });
      }

      const totalShipments = await Shipment.count({ where: { carrierId: carrier.id } });
      const deliveredShipments = await Shipment.count({ 
        where: { carrierId: carrier.id, status: 'delivered' } 
      });
      const pendingShipments = await Shipment.count({ 
        where: { carrierId: carrier.id, status: 'pending' } 
      });
      const inTransitShipments = await Shipment.count({ 
        where: { carrierId: carrier.id, status: 'in_transit' } 
      });

      // Calculate total earnings
      const shipments = await Shipment.findAll({
        where: { carrierId: carrier.id, status: 'delivered' },
        attributes: ['price']
      });
      const totalEarnings = shipments.reduce((sum, shipment) => sum + (shipment.price || 0), 0);

      // This month's earnings
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const thisMonthShipments = await Shipment.findAll({
        where: { 
          carrierId: carrier.id, 
          status: 'delivered',
          updatedAt: { [require('sequelize').Op.gte]: thisMonth }
        },
        attributes: ['price']
      });
      const thisMonthEarnings = thisMonthShipments.reduce((sum, shipment) => sum + (shipment.price || 0), 0);

      // Active drivers
      const activeDrivers = await Driver.count({ 
        where: { carrierId: carrier.id, isActive: true } 
      });

      // Total offers
      const totalOffers = await Offer.count({ where: { carrierId: carrier.id } });
      const acceptedOffers = await Offer.count({ 
        where: { carrierId: carrier.id, status: 'accepted' } 
      });

      stats = {
        totalShipments,
        deliveredShipments,
        pendingShipments,
        inTransitShipments,
        successRate: totalShipments > 0 ? Math.round((deliveredShipments / totalShipments) * 100) : 0,
        totalEarnings,
        thisMonthEarnings,
        activeDrivers,
        totalOffers,
        acceptedOffers
      };

    } else if (userType === 'logistics') {
      // Driver statistics
      const driver = await Driver.findOne({ where: { userId } });
      if (!driver) {
        return res.status(404).json({ success: false, message: 'Şoför profili bulunamadı' });
      }

      const totalJobs = await Shipment.count({ where: { driverId: driver.id } });
      const completedJobs = await Shipment.count({ 
        where: { driverId: driver.id, status: 'delivered' } 
      });
      const activeJobs = await Shipment.count({ 
        where: { driverId: driver.id, status: 'in_transit' } 
      });
      const pendingJobs = await Shipment.count({ 
        where: { driverId: driver.id, status: 'pending' } 
      });

      // Calculate total earnings
      const jobs = await Shipment.findAll({
        where: { driverId: driver.id, status: 'delivered' },
        attributes: ['price']
      });
      const totalEarnings = jobs.reduce((sum, job) => sum + (job.price || 0), 0);

      // This month's earnings
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const thisMonthJobs = await Shipment.findAll({
        where: { 
          driverId: driver.id, 
          status: 'delivered',
          updatedAt: { [require('sequelize').Op.gte]: thisMonth }
        },
        attributes: ['price']
      });
      const thisMonthEarnings = thisMonthJobs.reduce((sum, job) => sum + (job.price || 0), 0);

      // Available jobs (jobs without assigned driver)
      const availableJobs = await Shipment.count({ 
        where: { 
          status: 'pending',
          driverId: null
        } 
      });

      stats = {
        totalJobs,
        completedJobs,
        activeJobs,
        pendingJobs,
        successRate: totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0,
        totalEarnings,
        thisMonthEarnings,
        rating: driver.rating || 0,
        totalTrips: completedJobs,
        availableJobs
      };
    }

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error(`Dashboard stats error: ${error.message}`, { 
      service: 'dashboard-stats', 
      userId: req.user.id,
      stack: error.stack 
    });
    res.status(500).json({ 
      success: false, 
      message: 'Dashboard istatistikleri alınamadı' 
    });
  }
});

// @route   GET /api/dashboard/recent-shipments
// @desc    Get recent shipments
// @access  Private
router.get('/recent-shipments', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.userType;
    const limit = parseInt(req.query.limit) || 10;

    let shipments = [];

    if (userType === 'individual' || userType === 'corporate') {
      shipments = await Shipment.findAll({
        where: { senderId: userId },
        include: [
          { model: Carrier, as: 'carrier', attributes: ['companyName'] },
          { model: Driver, as: 'driver', attributes: ['firstName', 'lastName'] }
        ],
        order: [['createdAt', 'DESC']],
        limit
      });
    } else if (userType === 'carrier') {
      const carrier = await Carrier.findOne({ where: { userId } });
      if (carrier) {
        shipments = await Shipment.findAll({
          where: { carrierId: carrier.id },
          include: [
            { model: User, as: 'sender', attributes: ['firstName', 'lastName'] },
            { model: Driver, as: 'driver', attributes: ['firstName', 'lastName'] }
          ],
          order: [['createdAt', 'DESC']],
          limit
        });
      }
    } else if (userType === 'logistics') {
      const driver = await Driver.findOne({ where: { userId } });
      if (driver) {
        shipments = await Shipment.findAll({
          where: { driverId: driver.id },
          include: [
            { model: User, as: 'sender', attributes: ['firstName', 'lastName'] },
            { model: Carrier, as: 'carrier', attributes: ['companyName'] }
          ],
          order: [['createdAt', 'DESC']],
          limit
        });
      }
    }

    res.status(200).json({
      success: true,
      data: shipments
    });

  } catch (error) {
    logger.error(`Recent shipments error: ${error.message}`, { 
      service: 'dashboard-recent-shipments', 
      userId: req.user.id,
      stack: error.stack 
    });
    res.status(500).json({ 
      success: false, 
      message: 'Son gönderiler alınamadı' 
    });
  }
});

// @route   GET /api/dashboard/recent-offers
// @desc    Get recent offers
// @access  Private
router.get('/recent-offers', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.userType;
    const limit = parseInt(req.query.limit) || 10;

    let offers = [];

    if (userType === 'individual' || userType === 'corporate') {
      // Get offers for user's shipments
      const userShipments = await Shipment.findAll({
        where: { senderId: userId },
        attributes: ['id']
      });
      const shipmentIds = userShipments.map(s => s.id);

      offers = await Offer.findAll({
        where: { shipmentId: shipmentIds },
        include: [
          { model: Carrier, as: 'carrier', attributes: ['companyName'] },
          { model: Driver, as: 'driver', attributes: ['firstName', 'lastName'] },
          { model: Shipment, as: 'shipment', attributes: ['trackingNumber'] }
        ],
        order: [['createdAt', 'DESC']],
        limit
      });
    } else if (userType === 'carrier') {
      const carrier = await Carrier.findOne({ where: { userId } });
      if (carrier) {
        offers = await Offer.findAll({
          where: { carrierId: carrier.id },
          include: [
            { model: Shipment, as: 'shipment', attributes: ['trackingNumber'] },
            { model: Driver, as: 'driver', attributes: ['firstName', 'lastName'] }
          ],
          order: [['createdAt', 'DESC']],
          limit
        });
      }
    }

    res.status(200).json({
      success: true,
      data: offers
    });

  } catch (error) {
    logger.error(`Recent offers error: ${error.message}`, { 
      service: 'dashboard-recent-offers', 
      userId: req.user.id,
      stack: error.stack 
    });
    res.status(500).json({ 
      success: false, 
      message: 'Son teklifler alınamadı' 
    });
  }
});

module.exports = router;

