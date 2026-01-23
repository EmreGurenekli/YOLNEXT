const cluster = require('cluster');
const os = require('os');

// Load balancer middleware
const loadBalancer = (req, res, next) => {
  // Basit load balancing logic
  const workerId = cluster.worker ? cluster.worker.id : 1;
  req.workerId = workerId;
  next();
};

// Request queue management
const requestQueue = (req, res, next) => {
  // Basit request queue logic
  if (req.method === 'POST' || req.method === 'PUT') {
    // Yüksek öncelikli istekler için özel işlem
    req.priority = 'high';
  } else {
    req.priority = 'normal';
  }
  next();
};

// Health check endpoint
const healthCheck = (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    worker: cluster.worker ? cluster.worker.id : 'master',
    cpu: process.cpuUsage()
  };
  
  res.json(health);
};

// CPU usage monitoring
const cpuMonitoring = (req, res, next) => {
  const cpuUsage = process.cpuUsage();
  const memoryUsage = process.memoryUsage();
  
  // Yüksek CPU kullanımı kontrolü
  if (memoryUsage.heapUsed > 500 * 1024 * 1024) { // 500MB
    console.warn('High memory usage detected:', memoryUsage.heapUsed);
  }
  
  next();
};

module.exports = {
  loadBalancer,
  requestQueue,
  healthCheck,
  cpuMonitoring
};

