const express = require('express');
const { db } = require('../database/init');
const cacheService = require('../services/cache-service');
const loggerService = require('../services/logger-service');
const { asyncHandler } = require('../utils/errors');

const router = express.Router();

// Temel health check
router.get('/', asyncHandler(async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '2.0.0',
    environment: process.env.NODE_ENV || 'development'
  };

  res.json(health);
}));

// Detaylı health check
router.get('/detailed', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  // Veritabanı kontrolü
  const dbHealth = await checkDatabase();
  
  // Redis kontrolü
  const cacheHealth = await checkCache();
  
  // Disk alanı kontrolü
  const diskHealth = await checkDiskSpace();
  
  // Memory kontrolü
  const memoryHealth = checkMemory();
  
  // CPU kontrolü
  const cpuHealth = checkCPU();
  
  const responseTime = Date.now() - startTime;
  
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    responseTime: `${responseTime}ms`,
    uptime: process.uptime(),
    version: process.env.npm_package_version || '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: dbHealth,
      cache: cacheHealth,
      disk: diskHealth,
      memory: memoryHealth,
      cpu: cpuHealth
    },
    system: {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      pid: process.pid
    }
  };

  // Eğer herhangi bir servis sağlıksızsa status'u değiştir
  const unhealthyServices = Object.values(health.services).filter(service => service.status !== 'ok');
  if (unhealthyServices.length > 0) {
    health.status = 'degraded';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
}));

// Veritabanı health check
router.get('/database', asyncHandler(async (req, res) => {
  const dbHealth = await checkDatabase();
  const statusCode = dbHealth.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(dbHealth);
}));

// Cache health check
router.get('/cache', asyncHandler(async (req, res) => {
  const cacheHealth = await checkCache();
  const statusCode = cacheHealth.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(cacheHealth);
}));

// Sistem metrikleri
router.get('/metrics', asyncHandler(async (req, res) => {
  const metrics = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    pid: process.pid,
    environment: process.env.NODE_ENV || 'development'
  };

  res.json(metrics);
}));

// Log istatistikleri
router.get('/logs', asyncHandler(async (req, res) => {
  const logStats = loggerService.getLogStats();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    logs: logStats
  });
}));

// Cache istatistikleri
router.get('/cache-stats', asyncHandler(async (req, res) => {
  const cacheStats = await cacheService.getStats();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    cache: cacheStats
  });
}));

// Yardımcı fonksiyonlar
async function checkDatabase() {
  try {
    const startTime = Date.now();
    
    // Basit bir sorgu çalıştır
    await new Promise((resolve, reject) => {
      db.get('SELECT 1 as test', (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'ok',
      responseTime: `${responseTime}ms`,
      message: 'Database connection successful'
    };
  } catch (error) {
    loggerService.error('Database health check failed', error);
    return {
      status: 'error',
      message: 'Database connection failed',
      error: error.message
    };
  }
}

async function checkCache() {
  try {
    const startTime = Date.now();
    
    // Test key ile cache kontrolü
    const testKey = 'health-check-test';
    await cacheService.set(testKey, 'test-value', 10);
    const cached = await cacheService.get(testKey);
    await cacheService.del(testKey);
    
    const responseTime = Date.now() - startTime;
    
    if (cached === 'test-value') {
      return {
        status: 'ok',
        responseTime: `${responseTime}ms`,
        message: 'Cache connection successful'
      };
    } else {
      return {
        status: 'error',
        message: 'Cache test failed'
      };
    }
  } catch (error) {
    loggerService.error('Cache health check failed', error);
    return {
      status: 'error',
      message: 'Cache connection failed',
      error: error.message
    };
  }
}

async function checkDiskSpace() {
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Mevcut dizinin disk alanını kontrol et
    const stats = fs.statSync('.');
    
    return {
      status: 'ok',
      message: 'Disk space check completed',
      // Bu basit bir kontrol, gerçek disk alanı için 'diskusage' paketi kullanılabilir
    };
  } catch (error) {
    loggerService.error('Disk space check failed', error);
    return {
      status: 'error',
      message: 'Disk space check failed',
      error: error.message
    };
  }
}

function checkMemory() {
  try {
    const memUsage = process.memoryUsage();
    const totalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    const usedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const externalMB = Math.round(memUsage.external / 1024 / 1024);
    
    const usagePercent = Math.round((usedMB / totalMB) * 100);
    
    return {
      status: usagePercent > 90 ? 'warning' : 'ok',
      total: `${totalMB}MB`,
      used: `${usedMB}MB`,
      external: `${externalMB}MB`,
      usagePercent: `${usagePercent}%`,
      message: usagePercent > 90 ? 'High memory usage detected' : 'Memory usage normal'
    };
  } catch (error) {
    loggerService.error('Memory check failed', error);
    return {
      status: 'error',
      message: 'Memory check failed',
      error: error.message
    };
  }
}

function checkCPU() {
  try {
    const cpuUsage = process.cpuUsage();
    const userTime = cpuUsage.user / 1000000; // Mikrosaniyeden saniyeye
    const systemTime = cpuUsage.system / 1000000;
    
    return {
      status: 'ok',
      userTime: `${userTime.toFixed(2)}s`,
      systemTime: `${systemTime.toFixed(2)}s`,
      totalTime: `${(userTime + systemTime).toFixed(2)}s`,
      message: 'CPU usage check completed'
    };
  } catch (error) {
    loggerService.error('CPU check failed', error);
    return {
      status: 'error',
      message: 'CPU check failed',
      error: error.message
    };
  }
}

module.exports = router;



