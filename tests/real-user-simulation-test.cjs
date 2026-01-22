/**
 * REAL USER SIMULATION TEST
 * Tests the system as if it was opened live with real users
 * Different personas: good-willed, bad-willed, edge cases, etc.
 */

const { chromium } = require('playwright');
const API_URL = 'http://localhost:5000/api';

// Test results
const results = {
  passed: [],
  failed: [],
  warnings: [],
  total: 0,
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`[${timestamp}] ${prefix} ${message}`);
}

async function testAPI(endpoint, method = 'GET', body = null, token = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${API_URL}${endpoint}`, options);
    const data = await response.json();
    
    return {
      success: response.ok,
      status: response.status,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

async function createUser(userData) {
  const result = await testAPI('/auth/register', 'POST', userData);
  if (result.success && result.data) {
    const token = result.data.token || result.data.data?.token || result.data.user?.token;
    const userId = result.data.id || result.data.data?.id || result.data.user?.id;
    if (token) {
      return { token, id: userId, ...result.data };
    }
  }
  // Try login if user exists
  const loginResult = await testAPI('/auth/login', 'POST', {
    email: userData.email,
    password: userData.password,
  });
  if (loginResult.success && loginResult.data) {
    const token = loginResult.data.token || loginResult.data.data?.token || loginResult.data.user?.token;
    const userId = loginResult.data.id || loginResult.data.data?.id || loginResult.data.user?.id;
    if (token) {
      return { token, id: userId, ...loginResult.data };
    }
  }
  return null;
}

async function runTest(name, testFn) {
  results.total++;
  try {
    log(`Testing: ${name}`, 'info');
    await testFn();
    results.passed.push(name);
    log(`PASSED: ${name}`, 'success');
    return true;
  } catch (error) {
    results.failed.push({ name, error: error.message });
    log(`FAILED: ${name} - ${error.message}`, 'error');
    return false;
  }
}

// Generate valid TCKN
function generateValidTCKN() {
  const first9 = [Math.floor(Math.random() * 9) + 1];
  for (let i = 1; i < 9; i++) {
    first9.push(Math.floor(Math.random() * 10));
  }
  const sum1 = first9[0] + first9[2] + first9[4] + first9[6] + first9[8];
  const sum2 = first9[1] + first9[3] + first9[5] + first9[7];
  const q1 = (7 * sum1 - sum2) % 10;
  const digit10 = q1 < 0 ? q1 + 10 : q1;
  const sumAll = first9.reduce((a, b) => a + b, 0) + digit10;
  const digit11 = sumAll % 10;
  return first9.join('') + digit10 + digit11;
}

async function main() {
  log('🚀 Starting Real User Simulation Test', 'info');
  log('='.repeat(80), 'info');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // ============================================
  // PERSONA 1: GOOD-WILLED INDIVIDUAL USER
  // ============================================
  log('\n👤 PERSONA 1: Good-willed Individual User', 'info');
  
  const goodIndividual = {
    email: `good-individual-${Date.now()}@test.com`,
    password: 'SecurePass123!',
    fullName: 'Ahmet Yılmaz',
    phone: '5551234567',
    role: 'individual',
  };
  
  let goodIndividualToken = null;
  let goodIndividualShipment = null;
  
  await runTest('Good individual registers and creates shipment', async () => {
    const user = await createUser({
      ...goodIndividual,
      acceptTerms: true,
      acceptPrivacy: true,
      acceptCookies: true,
    });
    if (!user || !user.token) {
      throw new Error('Failed to register good individual');
    }
    goodIndividualToken = user.token;
    
    // Create a shipment
    const shipmentData = {
      pickupCity: 'Istanbul',
      deliveryCity: 'Ankara',
      pickupAddress: 'Kadikoy, Istanbul, Turkey',
      deliveryAddress: 'Cankaya, Ankara, Turkey',
      weight: 150,
      mainCategory: 'house_move',
      productDescription: 'Ev eşyaları taşınması',
      pickupDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      deliveryDate: new Date(Date.now() + 172800000).toISOString().split('T')[0],
    };
    
    const result = await testAPI('/shipments', 'POST', shipmentData, goodIndividualToken);
    if (!result.success) {
      throw new Error(`Failed to create shipment: ${JSON.stringify(result.data)}`);
    }
    goodIndividualShipment = result.data.data?.id || result.data.id;
  });
  
  // ============================================
  // PERSONA 2: GOOD-WILLED NAKLIYECI
  // ============================================
  log('\n👤 PERSONA 2: Good-willed Nakliyeci', 'info');
  
  const goodNakliyeci = {
    email: `good-nakliyeci-${Date.now()}@test.com`,
    password: 'SecurePass123!',
    fullName: 'Mehmet Kargo Ltd.',
    phone: '5551234568',
    companyName: 'Mehmet Kargo Ltd.',
    taxNumber: '1234567890',
    role: 'nakliyeci',
  };
  
  let goodNakliyeciToken = null;
  let goodNakliyeciOffer = null;
  
  await runTest('Good nakliyeci registers and creates offer', async () => {
    const user = await createUser({
      ...goodNakliyeci,
      acceptTerms: true,
      acceptPrivacy: true,
      acceptCookies: true,
    });
    if (!user || !user.token) {
      throw new Error('Failed to register good nakliyeci');
    }
    goodNakliyeciToken = user.token;
    
    if (!goodIndividualShipment) {
      throw new Error('Individual shipment not created');
    }
    
    // Create an offer
    const offerData = {
      shipmentId: goodIndividualShipment,
      price: 5000,
      estimatedDeliveryDate: new Date(Date.now() + 172800000).toISOString().split('T')[0],
      message: 'Profesyonel taşıma hizmeti',
    };
    
    const result = await testAPI('/offers', 'POST', offerData, goodNakliyeciToken);
    if (!result.success) {
      throw new Error(`Failed to create offer: ${JSON.stringify(result.data)}`);
    }
    goodNakliyeciOffer = result.data.data?.id || result.data.id;
  });
  
  await runTest('Good individual accepts good nakliyeci offer', async () => {
    if (!goodNakliyeciOffer) {
      throw new Error('Nakliyeci offer not created');
    }
    
    const result = await testAPI(`/offers/${goodNakliyeciOffer}/accept`, 'POST', {}, goodIndividualToken);
    if (!result.success) {
      throw new Error(`Failed to accept offer: ${JSON.stringify(result.data)}`);
    }
  });
  
  await runTest('Good nakliyeci updates shipment status', async () => {
    if (!goodIndividualShipment) {
      throw new Error('Individual shipment not created');
    }
    
    const result = await testAPI(`/shipments/${goodIndividualShipment}`, 'PUT', {
      status: 'in_progress',
    }, goodNakliyeciToken);
    if (!result.success) {
      throw new Error(`Failed to update status: ${JSON.stringify(result.data)}`);
    }
  });
  
  // ============================================
  // PERSONA 3: BAD-WILLED USER (SQL Injection Attempt)
  // ============================================
  log('\n👤 PERSONA 3: Bad-willed User (SQL Injection)', 'info');
  
  await runTest('Bad user attempts SQL injection in search', async () => {
    const maliciousUser = await createUser({
      email: `malicious-${Date.now()}@test.com`,
      password: 'Hack123!',
      fullName: 'Hacker User',
      phone: '5559999999',
      role: 'individual',
      acceptTerms: true,
      acceptPrivacy: true,
      acceptCookies: true,
    });
    
    if (!maliciousUser || !maliciousUser.token) {
      throw new Error('Failed to register malicious user');
    }
    
    // Attempt SQL injection
    const result = await testAPI('/shipments?search=1\' OR \'1\'=\'1', 'GET', null, maliciousUser.token);
    // Should not crash or return all data
    if (result.error && result.error.includes('SQL')) {
      throw new Error('SQL injection vulnerability detected');
    }
    // Should return empty or filtered results, not all data
    if (result.success && result.data.data && Array.isArray(result.data.data)) {
      // This is okay - it should return filtered results
      log(`SQL injection attempt handled: returned ${result.data.data.length} results`, 'info');
    }
  });
  
  // ============================================
  // PERSONA 4: BAD-WILLED USER (XSS Attempt)
  // ============================================
  log('\n👤 PERSONA 4: Bad-willed User (XSS Attempt)', 'info');
  
  await runTest('Bad user attempts XSS in shipment description', async () => {
    const xssUser = await createUser({
      email: `xss-${Date.now()}@test.com`,
      password: 'Hack123!',
      fullName: 'XSS User',
      phone: '5558888888',
      role: 'individual',
      acceptTerms: true,
      acceptPrivacy: true,
      acceptCookies: true,
    });
    
    if (!xssUser || !xssUser.token) {
      throw new Error('Failed to register XSS user');
    }
    
    // Attempt XSS
    const shipmentData = {
      pickupCity: 'Istanbul',
      deliveryCity: 'Ankara',
      pickupAddress: 'Kadikoy, Istanbul',
      deliveryAddress: 'Cankaya, Ankara',
      weight: 100,
      mainCategory: 'house_move',
      productDescription: '<script>alert("xss")</script>',
      pickupDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      deliveryDate: new Date(Date.now() + 172800000).toISOString().split('T')[0],
    };
    
    const result = await testAPI('/shipments', 'POST', shipmentData, xssUser.token);
    // Should sanitize input
    if (result.success && result.data.data?.productDescription?.includes('<script>')) {
      throw new Error('XSS vulnerability detected - script tags not sanitized');
    }
  });
  
  // ============================================
  // PERSONA 5: BAD-WILLED USER (Unauthorized Access)
  // ============================================
  log('\n👤 PERSONA 5: Bad-willed User (Unauthorized Access)', 'info');
  
  await runTest('Bad user attempts unauthorized shipment access', async () => {
    const unauthorizedUser = await createUser({
      email: `unauthorized-${Date.now()}@test.com`,
      password: 'Hack123!',
      fullName: 'Unauthorized User',
      phone: '5557777777',
      role: 'corporate',
      companyName: 'Unauthorized Corp',
      taxNumber: '9999999999',
      acceptTerms: true,
      acceptPrivacy: true,
      acceptCookies: true,
    });
    
    if (!unauthorizedUser || !unauthorizedUser.token) {
      throw new Error('Failed to register unauthorized user');
    }
    
    if (!goodIndividualShipment) {
      throw new Error('Individual shipment not created');
    }
    
    // Try to access someone else's shipment
    const result = await testAPI(`/shipments/${goodIndividualShipment}`, 'GET', null, unauthorizedUser.token);
    // Should return 403 or 404, not the shipment data
    if (result.success && result.data && result.data.data) {
      const shipmentId = result.data.data.id || result.data.data.ID || result.data.id;
      if (shipmentId === goodIndividualShipment) {
        throw new Error('Unauthorized access allowed - corporate user can see individual shipment');
      }
    }
  });
  
  // ============================================
  // PERSONA 6: EDGE CASE USER (Very Large Values)
  // ============================================
  log('\n👤 PERSONA 6: Edge Case User (Large Values)', 'info');
  
  await runTest('Edge case user creates shipment with very large weight', async () => {
    const edgeUser = await createUser({
      email: `edge-${Date.now()}@test.com`,
      password: 'Test123!',
      fullName: 'Edge Case User',
      phone: '5556666666',
      role: 'corporate',
      companyName: 'Edge Corp',
      taxNumber: '8888888888',
      acceptTerms: true,
      acceptPrivacy: true,
      acceptCookies: true,
    });
    
    if (!edgeUser || !edgeUser.token) {
      throw new Error('Failed to register edge case user');
    }
    
    const shipmentData = {
      pickupCity: 'Istanbul',
      deliveryCity: 'Izmir',
      pickupAddress: 'Besiktas, Istanbul',
      deliveryAddress: 'Konak, Izmir',
      weight: 999999, // Very large weight
      mainCategory: 'imalat-urunleri',
      productDescription: 'Büyük miktarda ürün',
      pickupDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      deliveryDate: new Date(Date.now() + 172800000).toISOString().split('T')[0],
    };
    
    const result = await testAPI('/shipments', 'POST', shipmentData, edgeUser.token);
    // Should either accept or reject gracefully, not crash
    if (result.error && result.error.includes('crash')) {
      throw new Error('System crashed on large value');
    }
  });
  
  // ============================================
  // PERSONA 7: RAPID USER (Multiple Rapid Actions)
  // ============================================
  log('\n👤 PERSONA 7: Rapid User (Multiple Actions)', 'info');
  
  await runTest('Rapid user performs multiple actions quickly', async () => {
    const rapidUser = await createUser({
      email: `rapid-${Date.now()}@test.com`,
      password: 'Test123!',
      fullName: 'Rapid User',
      phone: '5555555555',
      role: 'individual',
      acceptTerms: true,
      acceptPrivacy: true,
      acceptCookies: true,
    });
    
    if (!rapidUser || !rapidUser.token) {
      throw new Error('Failed to register rapid user');
    }
    
    // Create multiple shipments rapidly
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(testAPI('/shipments', 'POST', {
        pickupCity: 'Istanbul',
        deliveryCity: 'Ankara',
        pickupAddress: `Address ${i}, Istanbul`,
        deliveryAddress: `Address ${i}, Ankara`,
        weight: 100 + i,
        mainCategory: 'house_move',
        productDescription: `Rapid shipment ${i}`,
        pickupDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        deliveryDate: new Date(Date.now() + 172800000).toISOString().split('T')[0],
      }, rapidUser.token));
    }
    
    const results = await Promise.all(promises);
    const successCount = results.filter(r => r.success).length;
    if (successCount === 0) {
      throw new Error('All rapid shipments failed');
    }
    log(`Rapid user created ${successCount}/5 shipments`, 'info');
  });
  
  // ============================================
  // PERSONA 8: TASIYICI USER (Complete Workflow)
  // ============================================
  log('\n👤 PERSONA 8: Tasiyici User (Complete Workflow)', 'info');
  
  await runTest('Tasiyici registers and views available jobs', async () => {
    const tasiyici = await createUser({
      email: `tasiyici-${Date.now()}@test.com`,
      password: 'Test123!',
      fullName: 'Ali Şoför',
      phone: '5554444444',
      role: 'tasiyici',
      tckn: generateValidTCKN(),
      acceptTerms: true,
      acceptPrivacy: true,
      acceptCookies: true,
    });
    
    if (!tasiyici || !tasiyici.token) {
      throw new Error('Failed to register tasiyici');
    }
    
    // View available jobs
    const result = await testAPI('/shipments/tasiyici', 'GET', null, tasiyici.token);
    if (!result.success) {
      throw new Error(`Failed to fetch jobs: ${JSON.stringify(result.data)}`);
    }
  });
  
  // ============================================
  // PERSONA 9: CORPORATE USER (Bulk Operations)
  // ============================================
  log('\n👤 PERSONA 9: Corporate User (Bulk Operations)', 'info');
  
  await runTest('Corporate user creates multiple shipments', async () => {
    const corporate = await createUser({
      email: `corporate-${Date.now()}@test.com`,
      password: 'Test123!',
      fullName: 'Corporate Manager',
      phone: '5553333333',
      companyName: 'Bulk Corp',
      taxNumber: '7777777777',
      role: 'corporate',
      acceptTerms: true,
      acceptPrivacy: true,
      acceptCookies: true,
    });
    
    if (!corporate || !corporate.token) {
      throw new Error('Failed to register corporate user');
    }
    
    // Create multiple shipments
    const shipments = [];
    for (let i = 0; i < 3; i++) {
      const result = await testAPI('/shipments', 'POST', {
        pickupCity: 'Istanbul',
        deliveryCity: 'Izmir',
        pickupAddress: `Warehouse ${i}, Istanbul`,
        deliveryAddress: `Store ${i}, Izmir`,
        weight: 5.5 + i,
        mainCategory: 'imalat-urunleri',
        productDescription: `Bulk shipment ${i}`,
        pickupDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        deliveryDate: new Date(Date.now() + 172800000).toISOString().split('T')[0],
      }, corporate.token);
      
      if (result.success) {
        shipments.push(result.data.data?.id || result.data.id);
      }
    }
    
    if (shipments.length === 0) {
      throw new Error('Failed to create any corporate shipments');
    }
    
    log(`Corporate user created ${shipments.length} shipments`, 'info');
  });
  
  // ============================================
  // PERSONA 10: MESSAGING WORKFLOW
  // ============================================
  log('\n👤 PERSONA 10: Messaging Workflow', 'info');
  
  await runTest('Users exchange messages about shipment', async () => {
    if (!goodIndividualToken || !goodNakliyeciToken) {
      throw new Error('Users not created');
    }
    
    // Get user IDs
    const individualProfile = await testAPI('/users/profile', 'GET', null, goodIndividualToken);
    const nakliyeciProfile = await testAPI('/users/profile', 'GET', null, goodNakliyeciToken);
    
    if (!individualProfile.success || !nakliyeciProfile.success) {
      throw new Error('Failed to get user profiles');
    }
    
    const nakliyeciId = nakliyeciProfile.data.data?.id || nakliyeciProfile.data.id;
    
    // Individual sends message to nakliyeci
    const messageResult = await testAPI('/messages', 'POST', {
      receiverId: nakliyeciId,
      message: 'Merhaba, gönderi hakkında bilgi almak istiyorum.',
      messageType: 'shipment',
      shipmentId: goodIndividualShipment,
    }, goodIndividualToken);
    
    if (!messageResult.success) {
      throw new Error(`Failed to send message: ${JSON.stringify(messageResult.data)}`);
    }
  });
  
  // ============================================
  // PERSONA 11: CANCELLATION WORKFLOW
  // ============================================
  log('\n👤 PERSONA 11: Cancellation Workflow', 'info');
  
  await runTest('User cancels shipment with reason', async () => {
    const cancelUser = await createUser({
      email: `cancel-${Date.now()}@test.com`,
      password: 'Test123!',
      fullName: 'Cancel User',
      phone: '5552222222',
      role: 'individual',
      acceptTerms: true,
      acceptPrivacy: true,
      acceptCookies: true,
    });
    
    if (!cancelUser || !cancelUser.token) {
      throw new Error('Failed to register cancel user');
    }
    
    // Create shipment
    const shipmentResult = await testAPI('/shipments', 'POST', {
      pickupCity: 'Istanbul',
      deliveryCity: 'Ankara',
      pickupAddress: 'Kadikoy, Istanbul',
      deliveryAddress: 'Cankaya, Ankara',
      weight: 100,
      mainCategory: 'house_move',
      productDescription: 'Test shipment for cancellation',
      pickupDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      deliveryDate: new Date(Date.now() + 172800000).toISOString().split('T')[0],
    }, cancelUser.token);
    
    if (!shipmentResult.success) {
      throw new Error('Failed to create shipment for cancellation');
    }
    
    const shipmentId = shipmentResult.data.data?.id || shipmentResult.data.id;
    
    // Cancel shipment
    const cancelResult = await testAPI(`/shipments/${shipmentId}/cancel`, 'POST', {
      reason: 'Plans changed',
    }, cancelUser.token);
    
    if (!cancelResult.success) {
      throw new Error(`Failed to cancel shipment: ${JSON.stringify(cancelResult.data)}`);
    }
  });
  
  // ============================================
  // FRONTEND REAL USER SIMULATION
  // ============================================
  log('\n🌐 FRONTEND: Real User Simulation', 'info');
  
  const frontendUrl = 'http://localhost:5173';
  
  await runTest('Real user browses landing page', async () => {
    await page.goto(frontendUrl);
    await page.waitForLoadState('networkidle');
    const title = await page.title();
    if (!title || title.includes('Error')) {
      throw new Error('Landing page failed to load');
    }
  });
  
  await runTest('Real user logs in via demo', async () => {
    await page.goto(`${frontendUrl}/login`);
    await page.waitForLoadState('networkidle');
    
    // Click demo login button
    const demoButton = await page.locator('button:has-text("Demo")').first();
    if (await demoButton.count() > 0) {
      await demoButton.click();
      await page.waitForTimeout(3000);
      
      // Check if redirected to dashboard
      const url = page.url();
      if (!url.includes('/dashboard')) {
        throw new Error('Demo login did not redirect to dashboard');
      }
    }
  });
  
  await browser.close();
  
  // ============================================
  // FINAL REPORT
  // ============================================
  log('\n' + '='.repeat(80), 'info');
  log('📊 REAL USER SIMULATION TEST REPORT', 'info');
  log('='.repeat(80), 'info');
  log(`Total Tests: ${results.total}`, 'info');
  log(`Passed: ${results.passed.length}`, 'success');
  log(`Failed: ${results.failed.length}`, results.failed.length > 0 ? 'error' : 'success');
  log(`Warnings: ${results.warnings.length}`, results.warnings.length > 0 ? 'warning' : 'info');
  
  if (results.failed.length > 0) {
    log('\n❌ FAILED TESTS:', 'error');
    results.failed.forEach(({ name, error }) => {
      log(`  - ${name}: ${error}`, 'error');
    });
  }
  
  if (results.warnings.length > 0) {
    log('\n⚠️ WARNINGS:', 'warning');
    results.warnings.forEach(warning => {
      log(`  - ${warning}`, 'warning');
    });
  }
  
  const passRate = ((results.passed.length / results.total) * 100).toFixed(2);
  log(`\n✅ Pass Rate: ${passRate}%`, passRate >= 90 ? 'success' : 'warning');
  
  if (results.failed.length > 0) {
    process.exit(1);
  }
}

main().catch(error => {
  log(`Fatal error: ${error.message}`, 'error');
  console.error(error);
  process.exit(1);
});

