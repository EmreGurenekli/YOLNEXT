const express = require('express');
const cors = require('cors');
const redis = require('redis');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3008;

// Redis client with in-memory fallback when Redis is not available
const redisClient = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379
  },
  password: process.env.REDIS_PASSWORD || undefined
});

let redisAvailable = false;
const inMemoryStore = new Map();

function nowMs() { return Date.now(); }

function makePatternRegex(pattern) {
  // very small conversion: * -> .* (anchors applied)
  const esc = pattern.replace(/[-/\\^$+?.()|[\]{}]/g, '\\$&');
  const re = '^' + esc.replace(/\\\*/g, '.*') + '$';
  return new RegExp(re);
}

async function cacheGetRaw(key) {
  if (redisAvailable) return await redisClient.get(key);
  const entry = inMemoryStore.get(key);
  if (!entry) return null;
  if (entry.expiresAt && entry.expiresAt <= nowMs()) { inMemoryStore.delete(key); return null; }
  return JSON.stringify(entry.value);
}

async function cacheSetEx(key, ttl, value) {
  if (redisAvailable) return await redisClient.setEx(key, ttl, JSON.stringify(value));
  const expiresAt = ttl ? (nowMs() + ttl * 1000) : undefined;
  inMemoryStore.set(key, { value, expiresAt });
  return 'OK';
}

async function cacheDel(key) {
  if (redisAvailable) return await redisClient.del(key);
  return inMemoryStore.delete(key) ? 1 : 0;
}

async function cacheKeys(pattern) {
  if (redisAvailable) return await redisClient.keys(pattern);
  const re = makePatternRegex(pattern || '*');
  return Array.from(inMemoryStore.keys()).filter(k => re.test(k));
}

async function cacheFlushAll() {
  if (redisAvailable) return await redisClient.flushAll();
  inMemoryStore.clear();
  return 'OK';
}

async function cacheTtl(key) {
  if (redisAvailable) return await redisClient.ttl(key);
  const entry = inMemoryStore.get(key);
  if (!entry) return -2; // Redis returns -2 when key does not exist
  if (!entry.expiresAt) return -1; // no expire
  const remaining = Math.ceil((entry.expiresAt - nowMs()) / 1000);
  return remaining > 0 ? remaining : -2;
}

async function cacheInfo() {
  if (redisAvailable) return await redisClient.info();
  return `# Server\nredis_version:local-fallback\n# Memory\nused_memory:${JSON.stringify([...inMemoryStore]).reduce((s,kv)=>s+JSON.stringify(kv).length,0)}`;
}

async function cacheMemoryUsage() {
  if (redisAvailable) return await redisClient.memory('usage');
  return JSON.stringify([...inMemoryStore]).reduce((s,kv)=>s+JSON.stringify(kv).length,0);
}

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.connect().then(() => {
  redisAvailable = true;
  console.log('✅ Cache Service Redis connected');
}).catch((err) => {
  redisAvailable = false;
  console.error('❌ Cache Service Redis connection failed — using in-memory fallback:', err && err.message ? err.message : err);
});

// Middleware
app.use(cors());
app.use(express.json());

// Cache management routes
app.get('/cache/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const raw = await cacheGetRaw(key);
    if (raw) {
      res.json({
        key,
        value: JSON.parse(raw),
        ttl: await cacheTtl(key)
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

    await cacheSetEx(key, ttl, value);
    res.json({ message: 'Cache set successfully', key, ttl });
  } catch (error) {
    console.error('Cache set error:', error);
    res.status(500).json({ error: 'Cache error' });
  }
});

app.delete('/cache/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const result = await cacheDel(key);
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
    const keys = await cacheKeys(pattern);
    res.json({ keys, count: keys.length });
  } catch (error) {
    console.error('Cache keys error:', error);
    res.status(500).json({ error: 'Cache error' });
  }
});

app.post('/cache/flush', async (req, res) => {
  try {
    await cacheFlushAll();
    res.json({ message: 'Cache flushed successfully' });
  } catch (error) {
    console.error('Cache flush error:', error);
    res.status(500).json({ error: 'Cache error' });
  }
});

app.get('/cache/stats', async (req, res) => {
  try {
    const info = await cacheInfo();
    const keys = await cacheKeys('*');

    res.json({
      info: info.split('\r\n').reduce((acc, line) => {
        if (line.includes(':')) {
          const [key, value] = line.split(':');
          acc[key] = value;
        }
        return acc;
      }, {}),
      totalKeys: keys.length,
      memoryUsage: await cacheMemoryUsage()
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





