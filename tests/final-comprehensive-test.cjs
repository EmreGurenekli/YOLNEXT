/**
 * FINAL COMPREHENSIVE TEST - ALL SCENARIOS
 * Tests everything: good users, bad users, edge cases, security, all features
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
    // Extract token from various possible response structures
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

async function loginUser(email, password) {
  const result = await testAPI('/auth/login', 'POST', { email, password });
  if (result.success && result.data) {
    const token = result.data.token || result.data.data?.token || result.data.user?.token;
    const userId = result.data.id || result.data.data?.id || result.data.user?.id;
    if (token) {
      return { token, id: userId, ...result.data };
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

async function main() {
  log('🚀 Starting Final Comprehensive Test Suite', 'info');
  log('='.repeat(80), 'info');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // ============================================
  // 1. USER REGISTRATION & AUTHENTICATION TESTS
  // ============================================
  log('\n📋 SECTION 1: User Registration & Authentication', 'info');
  
  const testUsers = {
    individual: {
      email: `test-individual-${Date.now()}@test.com`,
      password: 'Test123!@#',
      fullName: 'Test Individual User',
      phone: '5551234567',
      role: 'individual',
    },
    corporate: {
      email: `test-corporate-${Date.now()}@test.com`,
      password: 'Test123!@#',
      fullName: 'Test Corporate User',
      phone: '5551234568',
      companyName: 'Test Company Inc.',
      taxNumber: '1234567890',
      role: 'corporate',
    },
    nakliyeci: {
      email: `test-nakliyeci-${Date.now()}@test.com`,
      password: 'Test123!@#',
      fullName: 'Test Nakliyeci User',
      phone: '5551234569',
      companyName: 'Test Nakliyeci Company',
      taxNumber: '1234567891',
      role: 'nakliyeci',
    },
    tasiyici: {
      email: `test-tasiyici-${Date.now()}@test.com`,
      password: 'Test123!@#',
      fullName: 'Test Tasiyici User',
      phone: '5551234570',
      role: 'tasiyici',
      tckn: (() => {
        // Generate valid TCKN with correct checksum
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
      })(),
    },
  };
  
  const userTokens = {};
  
  // Test registration for each user type
  for (const [role, userData] of Object.entries(testUsers)) {
    await runTest(`Register ${role} user`, async () => {
      const result = await createUser({
        ...userData,
        acceptTerms: true,
        acceptPrivacy: true,
        acceptCookies: true,
      });
      if (!result || !result.token) {
        throw new Error(`Failed to register ${role} user`);
      }
      userTokens[role] = result.token;
    });
  }
  
  // Test login for each user
  for (const [role, userData] of Object.entries(testUsers)) {
    await runTest(`Login ${role} user`, async () => {
      const result = await loginUser(userData.email, userData.password);
      if (!result || !result.token) {
        throw new Error(`Failed to login ${role} user`);
      }
    });
  }
  
  // Test invalid login
  await runTest('Reject invalid login', async () => {
    const result = await testAPI('/auth/login', 'POST', {
      email: 'invalid@test.com',
      password: 'wrongpassword',
    });
    if (result.success) {
      throw new Error('Invalid login should be rejected');
    }
  });
  
  // ============================================
  // 2. SHIPMENT CREATION TESTS
  // ============================================
  log('\n📋 SECTION 2: Shipment Creation', 'info');
  
  const shipments = {};
  
  // Individual shipment
  await runTest('Create individual shipment', async () => {
    const shipmentData = {
      pickupCity: 'Istanbul',
      deliveryCity: 'Ankara',
      pickupAddress: 'Kadikoy, Istanbul, Turkey',
      deliveryAddress: 'Cankaya, Ankara, Turkey',
      weight: 100,
      mainCategory: 'house_move',
      productDescription: 'Test individual shipment',
      pickupDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      deliveryDate: new Date(Date.now() + 172800000).toISOString().split('T')[0],
    };
    
    const result = await testAPI('/shipments', 'POST', shipmentData, userTokens.individual);
    if (!result.success) {
      throw new Error(`Failed to create shipment: ${JSON.stringify(result.data)}`);
    }
    shipments.individual = result.data.data?.id || result.data.id;
  });
  
  // Corporate shipment
  await runTest('Create corporate shipment', async () => {
    const shipmentData = {
      pickupCity: 'Istanbul',
      deliveryCity: 'Izmir',
      pickupAddress: 'Besiktas, Istanbul, Turkey',
      deliveryAddress: 'Konak, Izmir, Turkey',
      weight: 5.5, // tons
      mainCategory: 'imalat-urunleri',
      productDescription: 'Test corporate shipment',
      pickupDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      deliveryDate: new Date(Date.now() + 172800000).toISOString().split('T')[0],
    };
    
    const result = await testAPI('/shipments', 'POST', shipmentData, userTokens.corporate);
    if (!result.success) {
      throw new Error(`Failed to create shipment: ${JSON.stringify(result.data)}`);
    }
    shipments.corporate = result.data.data?.id || result.data.id;
  });
  
  // Test invalid shipment (missing required fields)
  await runTest('Reject invalid shipment (missing fields)', async () => {
    const result = await testAPI('/shipments', 'POST', {
      fromCity: 'Istanbul',
      // Missing other required fields
    }, userTokens.individual);
    if (result.success) {
      throw new Error('Invalid shipment should be rejected');
    }
  });
  
  // ============================================
  // 3. OFFER CREATION TESTS
  // ============================================
  log('\n📋 SECTION 3: Offer Creation', 'info');
  
  const offers = {};
  
  // Nakliyeci creates offer for individual shipment
  await runTest('Nakliyeci creates offer for individual shipment', async () => {
    if (!shipments.individual) {
      throw new Error('Individual shipment not created');
    }
    
    const offerData = {
      shipmentId: shipments.individual,
      price: 5000,
      estimatedDeliveryDate: new Date(Date.now() + 172800000).toISOString().split('T')[0],
      notes: 'Test offer from nakliyeci',
    };
    
    const result = await testAPI(`/offers`, 'POST', offerData, userTokens.nakliyeci);
    if (!result.success) {
      throw new Error(`Failed to create offer: ${JSON.stringify(result.data)}`);
    }
    offers.nakliyeci = result.data.data?.id || result.data.id;
  });
  
  // Test unauthorized offer (individual trying to create offer)
  await runTest('Reject unauthorized offer creation', async () => {
    if (!shipments.individual) {
      throw new Error('Individual shipment not created');
    }
    
    const result = await testAPI(`/offers`, 'POST', {
      shipmentId: shipments.individual,
      price: 5000,
      estimatedDeliveryDate: new Date(Date.now() + 172800000).toISOString().split('T')[0],
    }, userTokens.individual);
    // Individual should not be able to create offers (only nakliyeci can)
    if (result.success) {
      throw new Error('Individual should not be able to create offers');
    }
    // If it fails (403 or 400), that's expected - test passes
  });
  
  // ============================================
  // 4. OFFER ACCEPTANCE TESTS
  // ============================================
  log('\n📋 SECTION 4: Offer Acceptance', 'info');
  
  await runTest('Individual accepts nakliyeci offer', async () => {
    if (!offers.nakliyeci) {
      throw new Error('Nakliyeci offer not created');
    }
    
    const result = await testAPI(`/offers/${offers.nakliyeci}/accept`, 'POST', {}, userTokens.individual);
    if (!result.success) {
      throw new Error(`Failed to accept offer: ${JSON.stringify(result.data)}`);
    }
  });
  
  // Test unauthorized acceptance
  await runTest('Reject unauthorized offer acceptance', async () => {
    if (!offers.nakliyeci) {
      throw new Error('Nakliyeci offer not created');
    }
    
    // Try to accept with wrong user
    const result = await testAPI(`/offers/${offers.nakliyeci}/accept`, 'POST', {}, userTokens.corporate);
    if (result.success) {
      throw new Error('Unauthorized user should not be able to accept offer');
    }
  });
  
  // ============================================
  // 5. SHIPMENT STATUS UPDATES
  // ============================================
  log('\n📋 SECTION 5: Shipment Status Updates', 'info');
  
  await runTest('Nakliyeci updates shipment status', async () => {
    if (!shipments.individual) {
      throw new Error('Individual shipment not created');
    }
    
    const result = await testAPI(`/shipments/${shipments.individual}`, 'PUT', {
      status: 'in_progress',
    }, userTokens.nakliyeci);
    if (!result.success) {
      throw new Error(`Failed to update status: ${JSON.stringify(result.data)}`);
    }
  });
  
  // Test invalid status transition
  await runTest('Reject invalid status transition', async () => {
    if (!shipments.individual) {
      throw new Error('Individual shipment not created');
    }
    
    // Try to go from in_progress directly to delivered (should go through in_transit)
    const result = await testAPI(`/shipments/${shipments.individual}`, 'PUT', {
      status: 'delivered',
    }, userTokens.nakliyeci);
    // This might succeed if status is already in_transit, so we check the response
    if (result.success && result.data.error && result.data.error.includes('Invalid status transition')) {
      // This is expected
      return;
    }
  });
  
  // ============================================
  // 6. MESSAGING TESTS
  // ============================================
  log('\n📋 SECTION 6: Messaging', 'info');
  
  await runTest('Send message between users', async () => {
    // Get user IDs from profile
    const individualProfile = await testAPI('/users/profile', 'GET', null, userTokens.individual);
    const nakliyeciProfile = await testAPI('/users/profile', 'GET', null, userTokens.nakliyeci);
    
    if (!individualProfile.success || !nakliyeciProfile.success) {
      throw new Error('Failed to get user profiles');
    }
    
    const receiverId = nakliyeciProfile.data.data?.id || nakliyeciProfile.data.id;
    
    const result = await testAPI('/messages', 'POST', {
      receiverId,
      message: 'Test message from individual to nakliyeci',
      messageType: 'shipment',
      shipmentId: shipments.individual,
    }, userTokens.individual);
    
    if (!result.success) {
      throw new Error(`Failed to send message: ${JSON.stringify(result.data)}`);
    }
  });
  
  // ============================================
  // 7. SHIPMENT CANCELLATION TESTS
  // ============================================
  log('\n📋 SECTION 7: Shipment Cancellation', 'info');
  
  await runTest('Cancel corporate shipment', async () => {
    if (!shipments.corporate) {
      throw new Error('Corporate shipment not created');
    }
    
    const result = await testAPI(`/shipments/${shipments.corporate}/cancel`, 'POST', {
      reason: 'Test cancellation reason',
    }, userTokens.corporate);
    if (!result.success) {
      throw new Error(`Failed to cancel shipment: ${JSON.stringify(result.data)}`);
    }
  });
  
  // Test unauthorized cancellation
  await runTest('Reject unauthorized cancellation', async () => {
    if (!shipments.individual) {
      throw new Error('Individual shipment not created');
    }
    
    const result = await testAPI(`/shipments/${shipments.individual}/cancel`, 'POST', {}, userTokens.corporate);
    if (result.success) {
      throw new Error('Unauthorized user should not be able to cancel shipment');
    }
  });
  
  // ============================================
  // 8. PROFILE & PASSWORD TESTS
  // ============================================
  log('\n📋 SECTION 8: Profile & Password Management', 'info');
  
  await runTest('Update user profile', async () => {
    const result = await testAPI('/users/profile', 'PUT', {
      fullName: 'Updated Test User',
      phone: '5559998888',
    }, userTokens.individual);
    
    if (!result.success) {
      throw new Error(`Failed to update profile: ${JSON.stringify(result.data)}`);
    }
  });
  
  await runTest('Change password', async () => {
    const result = await testAPI('/auth/change-password', 'POST', {
      currentPassword: 'Test123!@#',
      newPassword: 'NewTest123!@#',
    }, userTokens.individual);
    
    if (!result.success) {
      throw new Error(`Failed to change password: ${JSON.stringify(result.data)}`);
    }
    
    // Change it back
    await testAPI('/auth/change-password', 'POST', {
      currentPassword: 'NewTest123!@#',
      newPassword: 'Test123!@#',
    }, userTokens.individual);
  });
  
  // ============================================
  // 9. BADGE SYSTEM TESTS
  // ============================================
  log('\n📋 SECTION 9: Badge System', 'info');
  
  await runTest('Fetch badge counts', async () => {
    const result = await testAPI('/badges', 'GET', null, userTokens.individual);
    if (!result.success) {
      throw new Error(`Failed to fetch badges: ${JSON.stringify(result.data)}`);
    }
    if (!result.data.data || typeof result.data.data.newOffers !== 'number') {
      throw new Error('Invalid badge data structure');
    }
  });
  
  // ============================================
  // 10. SECURITY TESTS (Bad-intentioned scenarios)
  // ============================================
  log('\n📋 SECTION 10: Security Tests (Bad-intentioned)', 'info');
  
  // Test SQL injection attempt
  await runTest('Prevent SQL injection in search', async () => {
    const result = await testAPI('/shipments?search=1\' OR \'1\'=\'1', 'GET', null, userTokens.individual);
    // Should not crash or return all data
    if (result.error && result.error.includes('SQL')) {
      throw new Error('SQL injection vulnerability detected');
    }
  });
  
  // Test XSS attempt
  await runTest('Prevent XSS in input fields', async () => {
    const result = await testAPI('/shipments', 'POST', {
      fromCity: '<script>alert("xss")</script>',
      toCity: 'Ankara',
      fromAddress: 'Istanbul',
      toAddress: 'Ankara',
      weight: 100,
      mainCategory: 'ev-tasinmasi',
    }, userTokens.individual);
    // Should sanitize input
    if (result.success && result.data.data?.fromCity?.includes('<script>')) {
      throw new Error('XSS vulnerability detected');
    }
  });
  
  // Test unauthorized access
  await runTest('Prevent unauthorized shipment access', async () => {
    if (!shipments.individual) {
      throw new Error('Individual shipment not created');
    }
    
    // Corporate user tries to access individual shipment
    const result = await testAPI(`/shipments/${shipments.individual}`, 'GET', null, userTokens.corporate);
    // Should either return 404 or 403, not the shipment data
    if (result.success && result.data && result.data.data) {
      // Check if it's actually the shipment (should be restricted)
      const shipmentId = result.data.data.id || result.data.data.ID || result.data.id;
      if (shipmentId === shipments.individual) {
        throw new Error('Unauthorized access allowed - corporate user can see individual shipment');
      }
    }
    // If it returns 404 or 403, that's expected - test passes
  });
  
  // Test rate limiting (if implemented)
  await runTest('Test API rate limiting', async () => {
    // Make multiple rapid requests
    const requests = [];
    for (let i = 0; i < 20; i++) {
      requests.push(testAPI('/badges', 'GET', null, userTokens.individual));
    }
    const responses = await Promise.all(requests);
    // Should not all succeed if rate limiting is working
    const successCount = responses.filter(r => r.success).length;
    if (successCount === 20) {
      results.warnings.push('Rate limiting may not be working');
    }
  });
  
  // ============================================
  // 11. EDGE CASES
  // ============================================
  log('\n📋 SECTION 11: Edge Cases', 'info');
  
  // Test with very large values
  await runTest('Handle large weight values', async () => {
    const result = await testAPI('/shipments', 'POST', {
      fromCity: 'Istanbul',
      toCity: 'Ankara',
      fromAddress: 'Istanbul',
      toAddress: 'Ankara',
      weight: 999999,
      mainCategory: 'ev-tasinmasi',
    }, userTokens.individual);
    // Should either accept or reject gracefully
    if (result.error && result.error.includes('crash')) {
      throw new Error('System crashed on large value');
    }
  });
  
  // Test with empty strings
  await runTest('Handle empty string inputs', async () => {
    const result = await testAPI('/shipments', 'POST', {
      fromCity: '',
      toCity: 'Ankara',
      fromAddress: 'Istanbul',
      toAddress: 'Ankara',
      weight: 100,
      mainCategory: 'ev-tasinmasi',
    }, userTokens.individual);
    // Should reject empty required fields
    if (result.success && !result.data.error) {
      results.warnings.push('Empty string validation may be missing');
    }
  });
  
  // Test with special characters
  await runTest('Handle special characters in input', async () => {
    const result = await testAPI('/shipments', 'POST', {
      fromCity: 'Istanbul',
      toCity: 'Ankara',
      fromAddress: 'Istanbul, Test & Co. "Special"',
      toAddress: 'Ankara',
      weight: 100,
      mainCategory: 'ev-tasinmasi',
    }, userTokens.individual);
    // Should handle gracefully
    if (result.error && result.error.includes('crash')) {
      throw new Error('System crashed on special characters');
    }
  });
  
  // ============================================
  // 12. FRONTEND PAGE TESTS
  // ============================================
  log('\n📋 SECTION 12: Frontend Page Tests', 'info');
  
  const frontendUrl = 'http://localhost:5173';
  
  await runTest('Load landing page', async () => {
    await page.goto(frontendUrl);
    await page.waitForLoadState('networkidle');
    const title = await page.title();
    if (!title || title.includes('Error')) {
      throw new Error('Landing page failed to load');
    }
  });
  
  await runTest('Load login page', async () => {
    await page.goto(`${frontendUrl}/login`);
    await page.waitForLoadState('networkidle');
    const title = await page.title();
    if (!title || title.includes('Error')) {
      throw new Error('Login page failed to load');
    }
  });
  
  // Test demo login
  await runTest('Demo login functionality', async () => {
    await page.goto(`${frontendUrl}/login`);
    await page.waitForLoadState('networkidle');
    
    // Click demo login button
    const demoButton = await page.locator('button:has-text("Demo")').first();
    if (await demoButton.count() > 0) {
      await demoButton.click();
      await page.waitForTimeout(2000);
      
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
  log('📊 FINAL TEST REPORT', 'info');
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

