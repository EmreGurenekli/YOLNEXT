#!/usr/bin/env node
/**
 * Comprehensive Test Suite for YolNext Backend
 * Tests all endpoints, workflows, edge cases, and security
 */

const axios = require('axios');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const API_BASE = process.env.TEST_API_URL || 'http://localhost:5000';
const TEST_RESULTS = {
  passed: [],
  failed: [],
  warnings: [],
  total: 0,
  startTime: Date.now(),
};

// Test utilities
function log(category, test, status, details = '') {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} [${category}] ${test}${details ? ': ' + details : ''}`);

  if (status === 'PASS') {
    TEST_RESULTS.passed.push({ category, test, details });
  } else if (status === 'FAIL') {
    TEST_RESULTS.failed.push({ category, test, details, error: details });
  } else {
    TEST_RESULTS.warnings.push({ category, test, details });
  }
  TEST_RESULTS.total++;
}

function assert(condition, category, test, errorMsg) {
  if (condition) {
    log(category, test, 'PASS');
  } else {
    log(category, test, 'FAIL', errorMsg);
    throw new Error(errorMsg);
  }
}

async function apiCall(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${API_BASE}${endpoint}`,
      headers: { 'Content-Type': 'application/json', ...headers },
      validateStatus: () => true, // Don't throw on any status
    };
    if (data) config.data = data;
    const res = await axios(config);
    return res;
  } catch (error) {
    return { status: 0, data: null, error: error.message };
  }
}

// Test data
let testUsers = {};
let testTokens = {};
let testShipmentData = {};
let testOfferData = {};

// ============================================
// CATEGORY 1: Health & Infrastructure
// ============================================

async function testHealthInfrastructure() {
  console.log('\n🏥 Testing Health & Infrastructure...\n');

  // Health check
  const health = await apiCall('GET', '/api/health');
  assert(
    health.status === 200,
    'Health',
    'Health endpoint responds',
    `Status: ${health.status}`
  );
  assert(
    health.data?.status === 'ok',
    'Health',
    'Health status is ok',
    JSON.stringify(health.data)
  );
  assert(
    health.data?.checks?.database?.status === 'healthy',
    'Health',
    'Database is healthy',
    JSON.stringify(health.data.checks)
  );

  // Readiness
  const ready = await apiCall('GET', '/api/health/ready');
  assert(
    ready.status === 200,
    'Health',
    'Readiness probe',
    `Status: ${ready.status}`
  );
  assert(
    ready.data?.ready === true,
    'Health',
    'Service is ready',
    JSON.stringify(ready.data)
  );

  // Liveness
  const live = await apiCall('GET', '/api/health/live');
  assert(
    live.status === 200,
    'Health',
    'Liveness probe',
    `Status: ${live.status}`
  );
  assert(
    live.data?.alive === true,
    'Health',
    'Service is alive',
    JSON.stringify(live.data)
  );

  // Metrics endpoint
  const metrics = await apiCall('GET', '/metrics');
  assert(
    metrics.status === 200,
    'Health',
    'Metrics endpoint',
    `Status: ${metrics.status}`
  );
  assert(
    typeof metrics.data === 'string' &&
      metrics.data.includes('http_request_duration'),
    'Health',
    'Metrics format correct',
    'Missing Prometheus format'
  );
}

// ============================================
// CATEGORY 2: Authentication & Security
// ============================================

async function testAuthenticationSecurity() {
  console.log('\n🔐 Testing Authentication & Security...\n');

  // Test 1: Registration with valid data
  const reg1 = await apiCall('POST', '/api/auth/register', {
    email: `test-user-${Date.now()}@example.com`,
    password: 'SecurePass123!',
    firstName: 'Test',
    lastName: 'User',
  });
  assert(
    reg1.status === 201,
    'Auth',
    'User registration succeeds',
    `Status: ${reg1.status}`
  );
  assert(
    reg1.data?.success === true,
    'Auth',
    'Registration returns success',
    JSON.stringify(reg1.data)
  );
  assert(
    reg1.data?.data?.token,
    'Auth',
    'Registration returns token',
    'No token in response'
  );
  testUsers.individual = reg1.data.data.user;
  testTokens.individual = reg1.data.data.token;

  // Test 2: Registration with invalid email
  const reg2 = await apiCall('POST', '/api/auth/register', {
    email: 'invalid-email',
    password: 'Pass123',
  });
  assert(
    reg2.status === 400,
    'Auth',
    'Invalid email rejected',
    `Status: ${reg2.status}`
  );

  // Test 3: Registration with weak password
  const reg3 = await apiCall('POST', '/api/auth/register', {
    email: `test-${Date.now()}@example.com`,
    password: '123', // Too short
  });
  assert(
    reg3.status === 400,
    'Auth',
    'Weak password rejected',
    `Status: ${reg3.status}`
  );

  // Test 4: Duplicate email registration
  const duplicateEmail = `duplicate-${Date.now()}@example.com`;
  const reg4a = await apiCall('POST', '/api/auth/register', {
    email: duplicateEmail,
    password: 'SecurePass123!',
    firstName: 'First',
  });
  assert(
    reg4a.status === 201,
    'Auth',
    'First registration succeeds',
    `Status: ${reg4a.status}`
  );

  const reg4b = await apiCall('POST', '/api/auth/register', {
    email: duplicateEmail,
    password: 'SecurePass123!',
    firstName: 'Second',
  });
  assert(
    reg4b.status === 400,
    'Auth',
    'Duplicate email rejected',
    `Status: ${reg4b.status}`
  );

  // Test 5: Login with valid credentials
  const loginEmail = `login-${Date.now()}@example.com`;
  await apiCall('POST', '/api/auth/register', {
    email: loginEmail,
    password: 'LoginPass123!',
    firstName: 'Login',
    lastName: 'User',
  });

  const login1 = await apiCall('POST', '/api/auth/login', {
    email: loginEmail,
    password: 'LoginPass123!',
  });
  assert(
    login1.status === 200,
    'Auth',
    'Valid login succeeds',
    `Status: ${login1.status}`
  );
  assert(
    login1.data?.success === true && login1.data?.data?.token,
    'Auth',
    'Login returns token',
    'No token'
  );

  // Test 6: Login with invalid password
  const login2 = await apiCall('POST', '/api/auth/login', {
    email: loginEmail,
    password: 'WrongPassword',
  });
  assert(
    login2.status === 401,
    'Auth',
    'Invalid password rejected',
    `Status: ${login2.status}`
  );

  // Test 7: Login with non-existent email
  const login3 = await apiCall('POST', '/api/auth/login', {
    email: `nonexistent-${Date.now()}@example.com`,
    password: 'AnyPass123!',
  });
  assert(
    login3.status === 401,
    'Auth',
    'Non-existent email rejected',
    `Status: ${login3.status}`
  );

  // Test 8: Demo login blocked in production
  const demoLogin = await apiCall('POST', '/api/auth/demo-login', {
    userType: 'individual',
  });
  // In production should be 404, in dev it works
  const env = process.env.NODE_ENV || 'development';
  if (env === 'production') {
    assert(
      demoLogin.status === 404,
      'Security',
      'Demo login blocked in production',
      `Status: ${demoLogin.status}`
    );
  }

  // Test 9: Protected endpoint without auth
  const protected = await apiCall('GET', '/api/shipments');
  assert(
    protected.status === 401,
    'Security',
    'Protected endpoint requires auth',
    `Status: ${protected.status}`
  );

  // Test 10: Protected endpoint with invalid token
  const invalidToken = await apiCall('GET', '/api/shipments', null, {
    Authorization: 'Bearer invalid-token-12345',
  });
  assert(
    invalidToken.status === 403,
    'Security',
    'Invalid token rejected',
    `Status: ${invalidToken.status}`
  );

  // Test 11: Valid authenticated request
  if (testTokens.individual) {
    const validAuth = await apiCall('GET', '/api/shipments', null, {
      Authorization: `Bearer ${testTokens.individual}`,
    });
    assert(
      validAuth.status === 200,
      'Auth',
      'Valid token works',
      `Status: ${validAuth.status}`
    );
  }
}

// ============================================
// CATEGORY 3: Shipments CRUD
// ============================================

async function testShipments() {
  console.log('\n📦 Testing Shipments...\n');

  if (!testTokens.individual) {
    log('Shipments', 'Setup', 'SKIP', 'No auth token available');
    return;
  }

  const headers = { Authorization: `Bearer ${testTokens.individual}` };

  // Test 1: Create shipment
  const create1 = await apiCall(
    'POST',
    '/api/shipments',
    {
      title: 'Test Shipment',
      pickupCity: 'İstanbul',
      pickupAddress: 'Kadıköy',
      deliveryCity: 'Ankara',
      deliveryAddress: 'Çankaya',
      weight: 100,
      value: 5000,
    },
    headers
  );
  assert(
    create1.status === 201,
    'Shipments',
    'Create shipment',
    `Status: ${create1.status}`
  );
  assert(
    create1.data?.success === true,
    'Shipments',
    'Create returns success',
    JSON.stringify(create1.data)
  );
  assert(
    create1.data?.data?.shipment?.id || create1.data?.data?.id,
    'Shipments',
    'Create returns shipment ID',
    'No ID'
  );
  testShipmentData.individual = create1.data.data.shipment || create1.data.data;

  // Test 2: Create shipment with missing required fields
  const create2 = await apiCall(
    'POST',
    '/api/shipments',
    {
      title: 'Incomplete Shipment',
      // Missing pickup/delivery addresses
    },
    headers
  );
  assert(
    create2.status === 400,
    'Shipments',
    'Missing fields rejected',
    `Status: ${create2.status}`
  );

  // Test 3: List shipments (with pagination)
  const list1 = await apiCall(
    'GET',
    '/api/shipments?page=1&limit=10',
    null,
    headers
  );
  assert(
    list1.status === 200,
    'Shipments',
    'List shipments',
    `Status: ${list1.status}`
  );
  assert(
    Array.isArray(list1.data?.data?.shipments || list1.data?.data),
    'Shipments',
    'List returns array',
    JSON.stringify(list1.data)
  );
  assert(
    list1.data?.meta?.total !== undefined,
    'Shipments',
    'Pagination metadata exists',
    'No meta.total'
  );
  assert(
    typeof list1.data.meta.total === 'number',
    'Shipments',
    'Pagination total is number',
    `Type: ${typeof list1.data.meta.total}`
  );

  // Test 4: List open shipments
  const open1 = await apiCall(
    'GET',
    '/api/shipments/open?page=1&limit=5',
    null,
    headers
  );
  assert(
    open1.status === 200,
    'Shipments',
    'List open shipments',
    `Status: ${open1.status}`
  );
  assert(
    open1.data?.meta?.total !== undefined,
    'Shipments',
    'Open shipments pagination',
    'No meta'
  );

  // Test 5: Get shipment by ID
  if (testShipmentData.individual) {
    const detail1 = await apiCall(
      'GET',
      `/api/shipments/${testShipmentData.individual.id}`,
      null,
      headers
    );
    assert(
      detail1.status === 200 || detail1.status === 404,
      'Shipments',
      'Get shipment detail',
      `Status: ${detail1.status}`
    );
  }

  // Test 6: Idempotency test (same Idempotency-Key)
  if (testTokens.individual) {
    const idempotencyKey = `test-key-${Date.now()}`;
    const idem1 = await apiCall(
      'POST',
      '/api/shipments',
      {
        title: 'Idempotent Test',
        pickupCity: 'İzmir',
        pickupAddress: 'Alsancak',
        deliveryCity: 'Bursa',
        deliveryAddress: 'Osmangazi',
        weight: 50,
      },
      { ...headers, 'Idempotency-Key': idempotencyKey }
    );

    const idem2 = await apiCall(
      'POST',
      '/api/shipments',
      {
        title: 'Idempotent Test (repeat)',
        pickupCity: 'İzmir',
        pickupAddress: 'Alsancak',
        deliveryCity: 'Bursa',
        deliveryAddress: 'Osmangazi',
        weight: 50,
      },
      { ...headers, 'Idempotency-Key': idempotencyKey }
    );

    assert(
      idem2.status === 409,
      'Shipments',
      'Idempotency prevents duplicates',
      `Status: ${idem2.status}`
    );
  }
}

// ============================================
// CATEGORY 4: Offers
// ============================================

async function testOffers() {
  console.log('\n💰 Testing Offers...\n');

  // Create carrier user for offers
  const carrierEmail = `carrier-${Date.now()}@example.com`;
  const carrierReg = await apiCall('POST', '/api/auth/register', {
    email: carrierEmail,
    password: 'CarrierPass123!',
    firstName: 'Carrier',
    lastName: 'User',
    role: 'nakliyeci',
  });

  if (carrierReg.status !== 201) {
    log('Offers', 'Setup', 'SKIP', 'Carrier registration failed');
    return;
  }

  testUsers.carrier = carrierReg.data.data.user;
  testTokens.carrier = carrierReg.data.data.token;
  const carrierHeaders = { Authorization: `Bearer ${testTokens.carrier}` };

  if (!testShipmentData.individual) {
    log('Offers', 'Setup', 'SKIP', 'No shipment available');
    return;
  }

  // Test 1: Create offer
  const create1 = await apiCall(
    'POST',
    '/api/offers',
    {
      shipmentId: testShipmentData.individual.id,
      price: 2500,
      message: 'Test offer message',
    },
    carrierHeaders
  );
  assert(
    create1.status === 201,
    'Offers',
    'Create offer',
    `Status: ${create1.status}`
  );
  assert(
    create1.data?.success === true,
    'Offers',
    'Create returns success',
    JSON.stringify(create1.data)
  );
  testOfferData.pending = create1.data.data;

  // Test 2: Create offer with invalid price
  const create2 = await apiCall(
    'POST',
    '/api/offers',
    {
      shipmentId: testShipmentData.individual.id,
      price: -100,
    },
    carrierHeaders
  );
  assert(
    create2.status === 400,
    'Offers',
    'Invalid price rejected',
    `Status: ${create2.status}`
  );

  // Test 3: Create duplicate offer (same carrier, same shipment)
  const create3 = await apiCall(
    'POST',
    '/api/offers',
    {
      shipmentId: testShipmentData.individual.id,
      price: 3000,
    },
    carrierHeaders
  );
  assert(
    create3.status === 400,
    'Offers',
    'Duplicate offer rejected',
    `Status: ${create3.status}`
  );

  // Test 4: List offers (with pagination)
  const list1 = await apiCall('GET', '/api/offers?page=1&limit=10');
  assert(
    list1.status === 200,
    'Offers',
    'List offers',
    `Status: ${list1.status}`
  );
  assert(
    list1.data?.meta?.total !== undefined,
    'Offers',
    'Offers pagination',
    'No meta'
  );

  // Test 5: Accept offer (by shipment owner)
  if (testOfferData.pending && testTokens.individual) {
    const accept1 = await apiCall(
      'POST',
      `/api/offers/${testOfferData.pending.id}/accept`,
      {},
      {
        Authorization: `Bearer ${testTokens.individual}`,
      }
    );
    assert(
      accept1.status === 200,
      'Offers',
      'Accept offer',
      `Status: ${accept1.status}`
    );
    testOfferData.accepted = testOfferData.pending;
  }

  // Test 6: Accept offer (idempotency)
  if (testOfferData.accepted && testTokens.individual) {
    const idemKey = `offer-accept-${Date.now()}`;
    const idem1 = await apiCall(
      'POST',
      `/api/offers/${testOfferData.accepted.id}/accept`,
      {},
      {
        Authorization: `Bearer ${testTokens.individual}`,
        'Idempotency-Key': idemKey,
      }
    );
    // Should be 400 (already accepted) or 409 (idempotent)
    assert(
      [200, 400, 409].includes(idem1.status),
      'Offers',
      'Accept idempotency',
      `Status: ${idem1.status}`
    );
  }

  // Test 7: Reject offer
  if (testShipmentData.individual) {
    // Create another offer to reject
    const offerToReject = await apiCall(
      'POST',
      '/api/offers',
      {
        shipmentId: testShipmentData.individual.id,
        price: 3500,
      },
      carrierHeaders
    );

    if (offerToReject.status === 201 && testTokens.individual) {
      const reject1 = await apiCall(
        'POST',
        `/api/offers/${offerToReject.data.data.id}/reject`,
        {},
        {
          Authorization: `Bearer ${testTokens.individual}`,
        }
      );
      assert(
        reject1.status === 200,
        'Offers',
        'Reject offer',
        `Status: ${reject1.status}`
      );
    }
  }
}

// ============================================
// CATEGORY 5: Messages
// ============================================

async function testMessages() {
  console.log('\n💬 Testing Messages...\n');

  if (
    !testTokens.individual ||
    !testTokens.carrier ||
    !testShipmentData.individual
  ) {
    log('Messages', 'Setup', 'SKIP', 'Missing prerequisites');
    return;
  }

  const ownerHeaders = { Authorization: `Bearer ${testTokens.individual}` };
  const carrierHeaders = { Authorization: `Bearer ${testTokens.carrier}` };

  // Test 1: Send message
  const send1 = await apiCall(
    'POST',
    '/api/messages',
    {
      shipmentId: testShipmentData.individual.id,
      receiverId: testUsers.carrier.id,
      message: 'Test message from owner',
    },
    ownerHeaders
  );
  assert(
    send1.status === 201,
    'Messages',
    'Send message',
    `Status: ${send1.status}`
  );

  // Test 2: List messages (with pagination)
  const list1 = await apiCall(
    'GET',
    `/api/messages?shipmentId=${testShipmentData.individual.id}&page=1&limit=10`,
    null,
    ownerHeaders
  );
  assert(
    list1.status === 200,
    'Messages',
    'List messages',
    `Status: ${list1.status}`
  );
  assert(
    list1.data?.meta?.total !== undefined,
    'Messages',
    'Messages pagination',
    'No meta'
  );

  // Test 3: Mark messages as read
  const read1 = await apiCall(
    'POST',
    '/api/messages/read',
    {
      shipmentId: testShipmentData.individual.id,
    },
    carrierHeaders
  );
  assert(
    read1.status === 200,
    'Messages',
    'Mark as read',
    `Status: ${read1.status}`
  );

  // Test 4: Send message without auth
  const send2 = await apiCall('POST', '/api/messages', {
    shipmentId: testShipmentData.individual.id,
    receiverId: testUsers.carrier.id,
    message: 'Unauthorized message',
  });
  assert(
    send2.status === 401,
    'Messages',
    'Send requires auth',
    `Status: ${send2.status}`
  );
}

// ============================================
// CATEGORY 6: Notifications
// ============================================

async function testNotifications() {
  console.log('\n🔔 Testing Notifications...\n');

  if (!testTokens.individual) {
    log('Notifications', 'Setup', 'SKIP', 'No auth token');
    return;
  }

  const headers = { Authorization: `Bearer ${testTokens.individual}` };

  // Test 1: Get unread count
  const count1 = await apiCall(
    'GET',
    '/api/notifications/unread-count',
    null,
    headers
  );
  assert(
    count1.status === 200,
    'Notifications',
    'Unread count',
    `Status: ${count1.status}`
  );
  assert(
    typeof count1.data?.data?.count === 'number',
    'Notifications',
    'Count is number',
    JSON.stringify(count1.data)
  );

  // Test 2: List notifications (with pagination)
  const list1 = await apiCall(
    'GET',
    '/api/notifications/individual?page=1&limit=10',
    null,
    headers
  );
  assert(
    list1.status === 200,
    'Notifications',
    'List notifications',
    `Status: ${list1.status}`
  );
  assert(
    list1.data?.meta?.total !== undefined,
    'Notifications',
    'Notifications pagination',
    'No meta'
  );

  // Test 3: Mark notifications as read
  const read1 = await apiCall('POST', '/api/notifications/read', {}, headers);
  assert(
    read1.status === 200,
    'Notifications',
    'Mark as read',
    `Status: ${read1.status}`
  );
}

// ============================================
// CATEGORY 7: User Profile & GDPR
// ============================================

async function testUserProfileGDPR() {
  console.log('\n👤 Testing User Profile & GDPR...\n');

  if (!testTokens.individual) {
    log('Profile', 'Setup', 'SKIP', 'No auth token');
    return;
  }

  const headers = { Authorization: `Bearer ${testTokens.individual}` };

  // Test 1: Get profile (real DB, not demo)
  const profile1 = await apiCall('GET', '/api/users/profile', null, headers);
  assert(
    profile1.status === 200,
    'Profile',
    'Get profile',
    `Status: ${profile1.status}`
  );
  assert(
    profile1.data?.data?.email,
    'Profile',
    'Profile returns email',
    'No email'
  );
  assert(
    profile1.data.data.email !== 'demo@test.com',
    'Profile',
    'Profile is real (not demo)',
    'Demo data detected'
  );

  // Test 2: Data export (GDPR)
  const export1 = await apiCall(
    'GET',
    '/api/users/me/data-export',
    null,
    headers
  );
  assert(
    export1.status === 200,
    'GDPR',
    'Data export',
    `Status: ${export1.status}`
  );
  assert(
    export1.data?.data?.user,
    'GDPR',
    'Export includes user data',
    'No user data'
  );
  assert(
    Array.isArray(export1.data.data.shipments),
    'GDPR',
    'Export includes shipments',
    'No shipments'
  );

  // Test 3: Account deletion (soft delete)
  // Create test user for deletion
  const deleteEmail = `delete-${Date.now()}@example.com`;
  const deleteUser = await apiCall('POST', '/api/auth/register', {
    email: deleteEmail,
    password: 'DeletePass123!',
    firstName: 'Delete',
    lastName: 'User',
  });

  if (deleteUser.status === 201) {
    const deleteToken = deleteUser.data.data.token;
    const deleteReq = await apiCall(
      'POST',
      '/api/users/me/delete',
      {},
      {
        Authorization: `Bearer ${deleteToken}`,
      }
    );
    assert(
      deleteReq.status === 200,
      'GDPR',
      'Account deletion',
      `Status: ${deleteReq.status}`
    );

    // Verify deletion - login should fail
    const loginAfterDelete = await apiCall('POST', '/api/auth/login', {
      email: deleteEmail,
      password: 'DeletePass123!',
    });
    assert(
      loginAfterDelete.status === 403 || loginAfterDelete.status === 401,
      'GDPR',
      'Deleted account cannot login',
      `Status: ${loginAfterDelete.status}`
    );
  }
}

// ============================================
// CATEGORY 8: Delivery & Workflow
// ============================================

async function testDeliveryWorkflow() {
  console.log('\n🚚 Testing Delivery & Workflow...\n');

  if (!testShipmentData.individual || !testTokens.individual) {
    log('Delivery', 'Setup', 'SKIP', 'Missing shipment or token');
    return;
  }

  // Test 1: Mark shipment as delivered (idempotency)
  const deliverKey = `deliver-${Date.now()}`;
  const deliver1 = await apiCall(
    'POST',
    `/api/shipments/${testShipmentData.individual.id}/deliver`,
    {},
    {
      Authorization: `Bearer ${testTokens.individual}`,
      'Idempotency-Key': deliverKey,
    }
  );

  // Should work or return already delivered
  assert(
    [200, 400].includes(deliver1.status),
    'Delivery',
    'Mark as delivered',
    `Status: ${deliver1.status}`
  );

  // Test 2: Idempotency - same key again
  const deliver2 = await apiCall(
    'POST',
    `/api/shipments/${testShipmentData.individual.id}/deliver`,
    {},
    {
      Authorization: `Bearer ${testTokens.individual}`,
      'Idempotency-Key': deliverKey,
    }
  );
  assert(
    [200, 400, 409].includes(deliver2.status),
    'Delivery',
    'Delivery idempotency',
    `Status: ${deliver2.status}`
  );
}

// ============================================
// CATEGORY 9: Rate Limiting & Security
// ============================================

async function testRateLimitingSecurity() {
  console.log('\n🛡️ Testing Rate Limiting & Security...\n');

  // Test 1: CORS headers
  const cors1 = await apiCall('OPTIONS', '/api/shipments', null, {
    Origin: 'https://yolnext.com',
    'Access-Control-Request-Method': 'POST',
  });
  assert(
    cors1.status === 200 || cors1.status === 204,
    'Security',
    'CORS preflight',
    `Status: ${cors1.status}`
  );

  // Test 2: Rate limiting (if configured)
  // Make many rapid requests
  let rateLimitHit = false;
  for (let i = 0; i < 350; i++) {
    const rapid = await apiCall('GET', '/api/health');
    if (rapid.status === 429) {
      rateLimitHit = true;
      break;
    }
  }
  log(
    'Security',
    'Rate limiting',
    rateLimitHit ? 'PASS' : 'WARN',
    rateLimitHit ? 'Rate limit triggered' : 'No rate limit observed'
  );

  // Test 3: Invalid JSON body handling
  const invalidJson = await axios({
    method: 'POST',
    url: `${API_BASE}/api/auth/register`,
    data: 'invalid json string',
    headers: { 'Content-Type': 'application/json' },
    validateStatus: () => true,
  });
  assert(
    invalidJson.status >= 400,
    'Security',
    'Invalid JSON rejected',
    `Status: ${invalidJson.status}`
  );
}

// ============================================
// MAIN TEST RUNNER
// ============================================

async function runAllTests() {
  console.log('🧪 Starting Comprehensive Test Suite');
  console.log(`📍 API Base: ${API_BASE}\n`);

  try {
    await testHealthInfrastructure();
    await testAuthenticationSecurity();
    await testShipments();
    await testOffers();
    await testMessages();
    await testNotifications();
    await testUserProfileGDPR();
    await testDeliveryWorkflow();
    await testRateLimitingSecurity();

    // Generate report
    const duration = Date.now() - TEST_RESULTS.startTime;
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${TEST_RESULTS.passed.length}`);
    console.log(`❌ Failed: ${TEST_RESULTS.failed.length}`);
    console.log(`⚠️  Warnings: ${TEST_RESULTS.warnings.length}`);
    console.log(`📈 Total: ${TEST_RESULTS.total}`);
    console.log(`⏱️  Duration: ${(duration / 1000).toFixed(2)}s`);

    if (TEST_RESULTS.failed.length > 0) {
      console.log('\n❌ FAILED TESTS:');
      TEST_RESULTS.failed.forEach(f => {
        console.log(`   - [${f.category}] ${f.test}: ${f.error}`);
      });
    }

    if (TEST_RESULTS.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      TEST_RESULTS.warnings.forEach(w => {
        console.log(`   - [${w.category}] ${w.test}: ${w.details}`);
      });
    }

    // Save report
    const report = {
      timestamp: new Date().toISOString(),
      duration,
      summary: {
        passed: TEST_RESULTS.passed.length,
        failed: TEST_RESULTS.failed.length,
        warnings: TEST_RESULTS.warnings.length,
        total: TEST_RESULTS.total,
      },
      results: TEST_RESULTS,
    };

    fs.writeFileSync(
      path.join(__dirname, 'test-results.json'),
      JSON.stringify(report, null, 2)
    );

    console.log('\n📄 Full report saved to: test-results.json');

    process.exit(TEST_RESULTS.failed.length > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n💥 Fatal test error:', error);
    process.exit(1);
  }
}

// Start backend if needed, then run tests
if (require.main === module) {
  const env = process.env.NODE_ENV || 'development';

  // Check if backend is running
  axios
    .get(`${API_BASE}/api/health`)
    .then(() => {
      console.log('✅ Backend is running, starting tests...\n');
      runAllTests();
    })
    .catch(() => {
      console.log('⚠️  Backend not responding. Attempting to start...');
      const child = spawn('node', ['postgres-backend.js'], {
        cwd: __dirname,
        env: {
          ...process.env,
          NODE_ENV: env,
          DATABASE_URL:
            process.env.DATABASE_URL ||
            'postgresql://postgres:2563@localhost:5432/yolnext',
          JWT_SECRET: process.env.JWT_SECRET || 'dev-secret',
        },
        stdio: 'inherit',
      });

      // Wait for backend to be ready
      let attempts = 0;
      const checkBackend = setInterval(async () => {
        attempts++;
        try {
          await axios.get(`${API_BASE}/api/health`);
          clearInterval(checkBackend);
          console.log('✅ Backend started, starting tests...\n');
          setTimeout(() => runAllTests(), 2000);
        } catch (e) {
          if (attempts > 30) {
            clearInterval(checkBackend);
            console.error('❌ Backend failed to start');
            process.exit(1);
          }
        }
      }, 1000);

      // Cleanup on exit
      process.on('exit', () => {
        if (child) child.kill();
      });
    });
}

module.exports = { runAllTests };
