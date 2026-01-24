 const path = require('path');
 const { Pool } = require('pg');
 
 // Ensure scripts can read the same env files as the backend server.
 // This module is primarily used by backend/scripts/* utilities.
 try {
   const dotenv = require('dotenv');
   const root = path.resolve(__dirname, '..', '..');
   dotenv.config({ path: path.join(root, '.env') });
   dotenv.config({ path: path.join(root, 'env.development') });
   // env.local must override env.development so local DB credentials win
   dotenv.config({ path: path.join(root, 'env.local'), override: true });
 } catch (_) {
   // ignore
 }
 
 let pool = null;
 
 function buildPoolConfig() {
   const connectionString = process.env.DATABASE_URL;
   const host = process.env.DATABASE_HOST;
   const port = process.env.DATABASE_PORT ? parseInt(process.env.DATABASE_PORT, 10) : undefined;
   const database = process.env.DATABASE_NAME;
   const user = process.env.DATABASE_USER;
   const password = process.env.DATABASE_PASSWORD;
 
   const cfg = {};
 
  // In production, always prefer DATABASE_URL over individual credentials
  // This prevents local env files from overriding production DATABASE_URL
  if (process.env.NODE_ENV === 'production' && connectionString) {
    console.log('🔧 PRODUCTION MODE: Using DATABASE_URL, ignoring individual DB credentials');
    cfg.connectionString = connectionString;
  } else {
    // Prefer explicit credentials if present (so DATABASE_HOST/etc can override DATABASE_URL)
    const hasExplicit = Boolean(host || port || database || user || password);
    if (!hasExplicit && connectionString) {
      cfg.connectionString = connectionString;
    } else {
      if (host) cfg.host = host;
      if (port) cfg.port = port;
      if (database) cfg.database = database;
      if (user) cfg.user = user;
      if (password) cfg.password = password;
    }
  }
 
   if (process.env.DB_POOL_MAX) {
     const max = parseInt(process.env.DB_POOL_MAX, 10);
     if (Number.isFinite(max) && max > 0) cfg.max = max;
   }
 
  // In production with managed DBs, ssl may be required.
  // Keep it opt-in to avoid breaking local dev.
  if (String(process.env.PGSSLMODE || '').toLowerCase() === 'require') {
    cfg.ssl = { rejectUnauthorized: false };
  }
  
  // Force SSL for Render.com PostgreSQL in production
  if (process.env.NODE_ENV === 'production' && connectionString && connectionString.includes('render.com')) {
    cfg.ssl = { rejectUnauthorized: false };
  }
 
   return cfg;
 }
 
 function getPool() {
   if (pool) return pool;
   pool = new Pool(buildPoolConfig());
   return pool;
 }
 
 module.exports = {
   getPool,
 };


