const { db } = require('../database/init');
const cacheService = require('./cache-service');
const loggerService = require('./logger-service');

class MonitoringService {
  constructor() {
    this.metrics = {
      requests: 0,
      errors: 0,
      responseTime: [],
      activeUsers: new Set(),
      systemUptime: Date.now()
    };
  }

  // İstek metriklerini kaydet
  recordRequest(req, res, responseTime) {
    this.metrics.requests++;
    this.metrics.responseTime.push(responseTime);
    
    // Aktif kullanıcıları takip et
    if (req.user?.id) {
      this.metrics.activeUsers.add(req.user.id);
    }

    // Response time'ı sınırla (son 1000 istek)
    if (this.metrics.responseTime.length > 1000) {
      this.metrics.responseTime = this.metrics.responseTime.slice(-1000);
    }

    // Performans logu
    if (responseTime > 5000) {
      loggerService.logPerformance('Slow Request', responseTime, {
        url: req.url,
        method: req.method,
        userId: req.user?.id
      });
    }
  }

  // Hata metriklerini kaydet
  recordError(error, req) {
    this.metrics.errors++;
    
    loggerService.error('API Error', error, {
      url: req.url,
      method: req.method,
      userId: req.user?.id,
      ip: req.ip
    });
  }

  // Sistem metriklerini al
  getSystemMetrics() {
    const uptime = Date.now() - this.metrics.systemUptime;
    const avgResponseTime = this.metrics.responseTime.length > 0 
      ? this.metrics.responseTime.reduce((a, b) => a + b, 0) / this.metrics.responseTime.length 
      : 0;

    return {
      uptime: Math.floor(uptime / 1000), // saniye
      requests: this.metrics.requests,
      errors: this.metrics.errors,
      errorRate: this.metrics.requests > 0 ? (this.metrics.errors / this.metrics.requests) * 100 : 0,
      avgResponseTime: Math.round(avgResponseTime),
      activeUsers: this.metrics.activeUsers.size,
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    };
  }

  // Veritabanı metriklerini al
  async getDatabaseMetrics() {
    try {
      const metrics = await Promise.all([
        this.getTableCounts(),
        this.getDatabaseSize(),
        this.getQueryPerformance()
      ]);

      return {
        tables: metrics[0],
        size: metrics[1],
        performance: metrics[2]
      };
    } catch (error) {
      loggerService.error('Database metrics error', error);
      return null;
    }
  }

  // Tablo sayılarını al
  async getTableCounts() {
    return new Promise((resolve, reject) => {
      const tables = ['users', 'shipments', 'offers', 'orders', 'messages', 'notifications'];
      const counts = {};

      let completed = 0;
      tables.forEach(table => {
        db.get(`SELECT COUNT(*) as count FROM ${table}`, (err, row) => {
          if (err) {
            counts[table] = 0;
          } else {
            counts[table] = row.count;
          }
          
          completed++;
          if (completed === tables.length) {
            resolve(counts);
          }
        });
      });
    });
  }

  // Veritabanı boyutunu al
  async getDatabaseSize() {
    return new Promise((resolve) => {
      const fs = require('fs');
      const path = require('path');
      
      try {
        const dbPath = path.join(__dirname, '../database/yolnet_real.db');
        const stats = fs.statSync(dbPath);
        resolve({
          size: stats.size,
          sizeMB: Math.round(stats.size / 1024 / 1024 * 100) / 100,
          modified: stats.mtime
        });
      } catch (error) {
        resolve({ size: 0, sizeMB: 0, modified: null });
      }
    });
  }

  // Sorgu performansını al
  async getQueryPerformance() {
    return new Promise((resolve) => {
      // SQLite'da query plan bilgisi al
      db.all("EXPLAIN QUERY PLAN SELECT * FROM users LIMIT 1", (err, rows) => {
        if (err) {
          resolve({ error: err.message });
        } else {
          resolve({ queryPlan: rows });
        }
      });
    });
  }

  // Cache metriklerini al
  async getCacheMetrics() {
    try {
      const stats = await cacheService.getStats();
      return {
        connected: stats?.connected || false,
        memory: stats?.memory || null,
        keyspace: stats?.keyspace || null
      };
    } catch (error) {
      loggerService.error('Cache metrics error', error);
      return { connected: false, error: error.message };
    }
  }

  // Kullanıcı aktivite metriklerini al
  async getUserActivityMetrics(days = 7) {
    try {
      const metrics = await Promise.all([
        this.getNewUsers(days),
        this.getActiveUsers(days),
        this.getUserEngagement(days)
      ]);

      return {
        newUsers: metrics[0],
        activeUsers: metrics[1],
        engagement: metrics[2]
      };
    } catch (error) {
      loggerService.error('User activity metrics error', error);
      return null;
    }
  }

  // Yeni kullanıcılar
  async getNewUsers(days) {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT COUNT(*) as count
        FROM users
        WHERE created_at >= datetime('now', '-${days} days')
      `, (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });
  }

  // Aktif kullanıcılar
  async getActiveUsers(days) {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT COUNT(DISTINCT user_id) as count
        FROM (
          SELECT user_id FROM shipments WHERE created_at >= datetime('now', '-${days} days')
          UNION
          SELECT carrier_id as user_id FROM offers WHERE created_at >= datetime('now', '-${days} days')
          UNION
          SELECT sender_id as user_id FROM messages WHERE created_at >= datetime('now', '-${days} days')
        )
      `, (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });
  }

  // Kullanıcı etkileşimi
  async getUserEngagement(days) {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          COUNT(DISTINCT s.user_id) as users_with_shipments,
          COUNT(DISTINCT o.carrier_id) as users_with_offers,
          COUNT(DISTINCT m.sender_id) as users_with_messages,
          AVG(shipment_count) as avg_shipments_per_user,
          AVG(offer_count) as avg_offers_per_user
        FROM (
          SELECT user_id, COUNT(*) as shipment_count
          FROM shipments
          WHERE created_at >= datetime('now', '-${days} days')
          GROUP BY user_id
        ) s
        LEFT JOIN (
          SELECT carrier_id, COUNT(*) as offer_count
          FROM offers
          WHERE created_at >= datetime('now', '-${days} days')
          GROUP BY carrier_id
        ) o ON s.user_id = o.carrier_id
        LEFT JOIN (
          SELECT sender_id, COUNT(*) as message_count
          FROM messages
          WHERE created_at >= datetime('now', '-${days} days')
          GROUP BY sender_id
        ) m ON s.user_id = m.sender_id
      `, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  // İş metriklerini al
  async getBusinessMetrics(days = 30) {
    try {
      const metrics = await Promise.all([
        this.getShipmentMetrics(days),
        this.getOrderMetrics(days),
        this.getRevenueMetrics(days)
      ]);

      return {
        shipments: metrics[0],
        orders: metrics[1],
        revenue: metrics[2]
      };
    } catch (error) {
      loggerService.error('Business metrics error', error);
      return null;
    }
  }

  // Gönderi metrikleri
  async getShipmentMetrics(days) {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          COUNT(*) as total_shipments,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_shipments,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_shipments,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_shipments,
          AVG(budget_max - budget_min) as avg_budget_range,
          COUNT(DISTINCT pickup_city) as unique_pickup_cities,
          COUNT(DISTINCT delivery_city) as unique_delivery_cities
        FROM shipments
        WHERE created_at >= datetime('now', '-${days} days')
      `, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  // Sipariş metrikleri
  async getOrderMetrics(days) {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          COUNT(*) as total_orders,
          COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
          AVG(total_amount) as avg_order_value,
          SUM(total_amount) as total_order_value,
          AVG(commission_amount) as avg_commission,
          SUM(commission_amount) as total_commission
        FROM orders
        WHERE created_at >= datetime('now', '-${days} days')
      `, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  // Gelir metrikleri
  async getRevenueMetrics(days) {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          SUM(commission_amount) as total_revenue,
          AVG(commission_amount) as avg_revenue_per_order,
          COUNT(DISTINCT DATE(created_at)) as active_days,
          SUM(commission_amount) / COUNT(DISTINCT DATE(created_at)) as daily_avg_revenue
        FROM orders
        WHERE created_at >= datetime('now', '-${days} days')
          AND payment_status = 'paid'
      `, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  // Performans uyarıları
  checkPerformanceAlerts() {
    const alerts = [];
    const metrics = this.getSystemMetrics();

    // Yüksek hata oranı
    if (metrics.errorRate > 5) {
      alerts.push({
        type: 'error_rate',
        severity: 'high',
        message: `Yüksek hata oranı: %${metrics.errorRate.toFixed(2)}`,
        value: metrics.errorRate
      });
    }

    // Yavaş yanıt süresi
    if (metrics.avgResponseTime > 2000) {
      alerts.push({
        type: 'slow_response',
        severity: 'medium',
        message: `Yavaş yanıt süresi: ${metrics.avgResponseTime}ms`,
        value: metrics.avgResponseTime
      });
    }

    // Yüksek bellek kullanımı
    const memoryUsage = metrics.memory.heapUsed / metrics.memory.heapTotal;
    if (memoryUsage > 0.9) {
      alerts.push({
        type: 'high_memory',
        severity: 'high',
        message: `Yüksek bellek kullanımı: %${(memoryUsage * 100).toFixed(2)}`,
        value: memoryUsage
      });
    }

    return alerts;
  }

  // Metrikleri temizle
  resetMetrics() {
    this.metrics = {
      requests: 0,
      errors: 0,
      responseTime: [],
      activeUsers: new Set(),
      systemUptime: Date.now()
    };
    
    loggerService.info('Monitoring metrics reset');
  }

  // Detaylı rapor oluştur
  async generateReport(days = 7) {
    try {
      const [systemMetrics, dbMetrics, cacheMetrics, userMetrics, businessMetrics] = await Promise.all([
        this.getSystemMetrics(),
        this.getDatabaseMetrics(),
        this.getCacheMetrics(),
        this.getUserActivityMetrics(days),
        this.getBusinessMetrics(days)
      ]);

      const alerts = this.checkPerformanceAlerts();

      return {
        timestamp: new Date().toISOString(),
        period: `${days} gün`,
        system: systemMetrics,
        database: dbMetrics,
        cache: cacheMetrics,
        users: userMetrics,
        business: businessMetrics,
        alerts,
        summary: this.generateSummary(systemMetrics, userMetrics, businessMetrics)
      };
    } catch (error) {
      loggerService.error('Report generation error', error);
      throw error;
    }
  }

  // Özet oluştur
  generateSummary(system, users, business) {
    return {
      status: system.errorRate < 1 ? 'excellent' : system.errorRate < 5 ? 'good' : 'needs_attention',
      keyMetrics: {
        totalRequests: system.requests,
        activeUsers: users?.activeUsers || 0,
        newUsers: users?.newUsers || 0,
        totalRevenue: business?.revenue?.total_revenue || 0,
        avgResponseTime: system.avgResponseTime
      },
      recommendations: this.generateRecommendations(system, users, business)
    };
  }

  // Öneriler oluştur
  generateRecommendations(system, users, business) {
    const recommendations = [];

    if (system.avgResponseTime > 1000) {
      recommendations.push('Response time yüksek, cache optimizasyonu gerekli');
    }

    if (system.errorRate > 2) {
      recommendations.push('Hata oranı yüksek, log analizi yapılmalı');
    }

    if (users?.activeUsers < 10) {
      recommendations.push('Aktif kullanıcı sayısı düşük, pazarlama kampanyası gerekli');
    }

    if (business?.revenue?.total_revenue < 1000) {
      recommendations.push('Gelir düşük, fiyatlandırma stratejisi gözden geçirilmeli');
    }

    return recommendations;
  }
}

module.exports = new MonitoringService();



