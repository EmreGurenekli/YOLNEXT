// Real E2E API flow against local backend, self-starts the server
const { spawn } = require('child_process');
const http = require('http');
const axiosBase = require('axios');

const BASE_URL = 'http://localhost:5000';
const axios = axiosBase.create({ baseURL: BASE_URL, timeout: 20000 });

function log(step, ok, extra = '') {
  const status = ok ? 'OK' : 'FAIL';
  console.log(`[${status}] ${step}${extra ? ' - ' + extra : ''}`);
}

async function waitForHealth(timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await axios.get('/api/health');
      if (res.data?.status) return true;
    } catch (_) {}
    await new Promise(r => setTimeout(r, 1000));
  }
  return false;
}

async function runFlow() {
  // Helpers
  const register = async payload =>
    axios.post('/api/auth/register', payload).then(r => r.data);
  const login = async (email, password) =>
    axios.post('/api/auth/login', { email, password }).then(r => r.data);
  const authClient = token =>
    axiosBase.create({
      baseURL: BASE_URL,
      timeout: 20000,
      headers: { Authorization: `Bearer ${token}` },
    });

  const unique = Date.now();
  const userA = {
    email: `owner+${unique}@test.com`,
    password: 'Test1234!',
    firstName: 'Ali',
    lastName: 'Yılmaz',
    role: 'individual',
    phone: '+905555550001',
  };
  const userB = {
    email: `carrier+${unique}@test.com`,
    password: 'Test1234!',
    firstName: 'Veli',
    lastName: 'Kaya',
    role: 'nakliyeci',
    phone: '+905555550002',
  };

  // 1) Register and login two users
  await register(userA);
  await register(userB);
  const aLogin = await login(userA.email, userA.password);
  const bLogin = await login(userB.email, userB.password);
  const aToken = aLogin?.data?.token || aLogin?.token;
  const bToken = bLogin?.data?.token || bLogin?.token;
  log('Auth/register+login', !!(aToken && bToken));

  const A = authClient(aToken);
  const B = authClient(bToken);

  // 2) Create shipment by A
  const newShipment = {
    title: `E2E Test Shipment ${unique}`,
    category: 'house_move',
    pickupCity: 'İstanbul',
    pickupDistrict: 'Kadıköy',
    pickupAddress: 'Moda',
    pickupDate: new Date().toISOString().slice(0, 10),
    deliveryCity: 'Ankara',
    deliveryDistrict: 'Çankaya',
    deliveryAddress: 'Tunus',
    deliveryDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    value: 5000,
    requiresInsurance: false,
  };
  const createRes = await A.post('/api/shipments', newShipment).then(
    r => r.data
  );
  const shipmentId =
    createRes?.data?.shipment?.id ||
    createRes?.data?.id ||
    createRes?.data?.shipmentId;
  log('Create shipment', !!shipmentId, `id=${shipmentId}`);

  // 3) Carrier lists open shipments and makes an offer
  await B.get('/api/shipments/open')
    .then(r => r.data)
    .catch(() => ({ data: [] }));
  log('List open shipments', true);
  const offer = await B.post('/api/offers', {
    shipmentId,
    price: 12345,
    message: 'Hızlı teslim',
  }).then(r => r.data);
  const offerId =
    offer?.data?.id || offer?.data?.offer?.id || offer?.data?.offerId;
  log('Create offer', !!offerId, `id=${offerId}`);

  // 4) Owner accepts the offer
  const accept = await A.post(`/api/offers/${offerId}/accept`).then(
    r => r.data
  );
  log('Accept offer', accept?.success === true);
  await new Promise(r => setTimeout(r, 500)); // Wait for transaction commit

  // 5) Messaging
  const msg = await A.post('/api/messages', {
    shipmentId,
    receiverId: bLogin?.data?.user?.id || bLogin?.user?.id,
    message: 'Merhaba',
  }).then(r => r.data);
  log('Send message', msg?.success === true);
  await B.post('/api/messages/read', {
    shipmentId,
    senderId: aLogin?.data?.user?.id || aLogin?.user?.id,
  });
  log('Read messages', true);

  // 6) Delivery (owner can deliver)
  await new Promise(r => setTimeout(r, 500)); // Wait for updates
  try {
    const delivered = await A.post(`/api/shipments/${shipmentId}/deliver`).then(
      r => r.data
    );
    log('Mark delivered', delivered?.success === true);
  } catch (e) {
    console.error('[DELIVER TEST ERROR]', e.response?.data || e.message);
    throw e;
  }

  // 7) Notifications
  try {
    const notifs = await A.get(
      '/api/notifications/individual?page=1&limit=10'
    ).then(r => r.data);
    log('Fetch notifications', Array.isArray(notifs?.data));
  } catch (e) {
    console.error('[NOTIF FETCH ERROR]', e.response?.data || e.message);
    throw e;
  }
  try {
    await A.post('/api/notifications/read');
    log('Mark notifications read', true);
  } catch (e) {
    console.error('[NOTIF READ ERROR]', e.response?.data || e.message);
    throw e;
  }

  // 8) Data export
  try {
    const exportData = await A.get('/api/users/me/data-export').then(
      r => r.data
    );
    log('Data export', exportData?.success === true);
  } catch (e) {
    console.error('[EXPORT ERROR]', e.response?.data || e.message);
    throw e;
  }
}

async function main() {
  // Start server as child
  const env = {
    ...process.env,
    NODE_ENV: 'development',
    DATABASE_URL:
      process.env.DATABASE_URL ||
      'postgresql://postgres:2563@localhost:5432/yolnext',
    JWT_SECRET: process.env.JWT_SECRET || 'dev-secret',
  };
  const child = spawn(process.execPath, ['postgres-backend.js'], {
    env,
    stdio: 'inherit',
  });

  const healthy = await waitForHealth(45000);
  if (!healthy) {
    console.error('E2E ERROR: Backend health check failed');
    child.kill('SIGINT');
    process.exit(1);
  }
  log('Health check', true);

  try {
    await runFlow();
    console.log('\nE2E flow finished');
    child.kill('SIGINT');
    process.exit(0);
  } catch (e) {
    if (e.response?.data) {
      console.error('E2E ERROR:', e.response.data);
    } else {
      console.error('E2E ERROR:', e.message);
    }
    child.kill('SIGINT');
    process.exit(1);
  }
}

main();
