const express = require('express');
const cors = require('cors');
const redis = require('redis');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3008;

// Redis client
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.connect().then(() => {
  console.log('✅ Cache Service Redis connected');
}).catch((err) => {
  console.error('❌ Cache Service Redis connection failed:', err);
});

// Middleware
app.use(cors());
app.use(express.json());

// Cache management routes
app.get('/cache/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const value = await redisClient.get(key);
    
    if (value) {
      res.json({ 
        key, 
        value: JSON.parse(value),
        ttl: await redisClient.ttl(key)
      });
    } else {
      res.status(404).json({ error: 'Key not found' });
    }
  } catch (error) {
    console.error('Cache get error:', error);
    res.status(500).json({ error: 'Cache error' });
  }
});

app.post('/cache', async (req, res) => {
  try {
    const { key, value, ttl = 300 } = req.body;
    
    if (!key || !value) {
      return res.status(400).json({ error: 'Key and value required' });
    }

    await redisClient.setEx(key, ttl, JSON.stringify(value));
    res.json({ message: 'Cache set successfully', key, ttl });
  } catch (error) {
    console.error('Cache set error:', error);
    res.status(500).json({ error: 'Cache error' });
  }
});

app.delete('/cache/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const result = await redisClient.del(key);
    
    if (result) {
      res.json({ message: 'Cache deleted successfully', key });
    } else {
      res.status(404).json({ error: 'Key not found' });
    }
  } catch (error) {
    console.error('Cache delete error:', error);
    res.status(500).json({ error: 'Cache error' });
  }
});

app.get('/cache/keys/:pattern', async (req, res) => {
  try {
    const { pattern } = req.params;
    const keys = await redisClient.keys(pattern);
    res.json({ keys, count: keys.length });
  } catch (error) {
    console.error('Cache keys error:', error);
    res.status(500).json({ error: 'Cache error' });
  }
});

app.post('/cache/flush', async (req, res) => {
  try {
    await redisClient.flushAll();
    res.json({ message: 'Cache flushed successfully' });
  } catch (error) {
    console.error('Cache flush error:', error);
    res.status(500).json({ error: 'Cache error' });
  }
});

app.get('/cache/stats', async (req, res) => {
  try {
    const info = await redisClient.info();
    const keys = await redisClient.keys('*');
    
    res.json({
      info: info.split('\r\n').reduce((acc, line) => {
        if (line.includes(':')) {
          const [key, value] = line.split(':');
          acc[key] = value;
        }
        return acc;
      }, {}),
      totalKeys: keys.length,
      memoryUsage: await redisClient.memory('usage')
    });
  } catch (error) {
    console.error('Cache stats error:', error);
    res.status(500).json({ error: 'Cache error' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'cache-service',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`💾 Cache Service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;





