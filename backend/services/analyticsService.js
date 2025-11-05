class AnalyticsService {
  constructor() {
    this.events = [];
  }

  async trackEvent(userId, eventType, eventData = {}) {
    const event = {
      id: Date.now() + Math.random(),
      userId,
      eventType,
      eventData,
      timestamp: new Date().toISOString(),
      userAgent: eventData.userAgent || 'unknown',
      ip: eventData.ip || 'unknown'
    };

    this.events.push(event);
    
    // Production'da bu veriler veritabanına kaydedilmeli
    console.log(`📊 Analytics Event: ${eventType} - User: ${userId}`);
    
    return { success: true, eventId: event.id };
  }

  async getDashboardStats(userId, timeRange = '30d') {
    // Gerçek analytics verileri
    const stats = {
      totalShipments: 0,
      totalEarnings: 0,
      averageRating: 0,
      responseTime: 0,
      successRate: 0,
      monthlyGrowth: 0,
      topRoutes: [],
      userActivity: []
    };

    // Demo veriler
    if (userId === 'demo') {
      return {
        totalShipments: 25,
        totalEarnings: 12500,
        averageRating: 4.8,
        responseTime: 2.3,
        successRate: 96,
        monthlyGrowth: 15,
        topRoutes: [
          { route: 'İstanbul - Ankara', count: 8 },
          { route: 'İzmir - Bursa', count: 6 },
          { route: 'Ankara - Antalya', count: 4 }
        ],
        userActivity: [
          { date: '2024-01-01', activity: 12 },
          { date: '2024-01-02', activity: 18 },
          { date: '2024-01-03', activity: 15 }
        ]
      };
    }

    return stats;
  }

  async getRevenueAnalytics(userId, period = 'month') {
    return {
      period,
      totalRevenue: 12500,
      revenueGrowth: 15.5,
      averageOrderValue: 500,
      revenueByDay: [
        { date: '2024-01-01', revenue: 1200 },
        { date: '2024-01-02', revenue: 1800 },
        { date: '2024-01-03', revenue: 1500 }
      ]
    };
  }

  async getUserBehaviorAnalytics(userId) {
    return {
      pageViews: 156,
      sessionDuration: 8.5,
      bounceRate: 12.5,
      conversionRate: 3.2,
      topPages: [
        { page: '/dashboard', views: 45 },
        { page: '/create-shipment', views: 32 },
        { page: '/messages', views: 28 }
      ]
    };
  }
}

module.exports = new AnalyticsService();


