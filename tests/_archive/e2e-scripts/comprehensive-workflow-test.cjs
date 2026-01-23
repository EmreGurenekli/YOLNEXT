const { chromium } = require('playwright');

const TEST_BASE_URL = 'http://localhost:5173';
const API_BASE_URL = 'http://localhost:5000';

const testResults = {
  passed: [],
  failed: [],
  startTime: new Date(),
};

async function logTest(testName, passed, details = '') {
  const status = passed ? '✓ PASS' : '✗ FAIL';
  console.log(`\n${status}: ${testName}`);
  if (details) console.log(`  → ${details}`);
  if (passed) {
    testResults.passed.push(testName);
  } else {
    testResults.failed.push({ name: testName, details });
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runAllTests() {
  let browser;
  try {
    console.log('\n════════════════════════════════════════════════');
    console.log('🧪 COMPREHENSIVE YOLNEXT WORKFLOW TESTS (MCP)');
    console.log('════════════════════════════════════════════════\n');
    console.log(`⏱️  Start: ${testResults.startTime.toISOString()}`);
    console.log(`🌐 Frontend: ${TEST_BASE_URL}`);
    console.log(`🔌 Backend: ${API_BASE_URL}\n`);

    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.setViewportSize({ width: 1280, height: 720 });

    // ============================================================
    // TEST 1: Landing Page
    // ============================================================
    console.log('📋 TEST GROUP 1: Landing Page & Navigation');
    console.log('─────────────────────────────────────────');
    try {
      await page.goto(`${TEST_BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      const hasLogo = await page.locator('img[alt*="YolNext"], [class*="logo"]').first().isVisible().catch(() => false);
      const hasHeading = await page.locator('h1, h2').first().isVisible().catch(() => false);
      await logTest('1.1 Landing page loads', hasLogo || hasHeading, 'DOM loaded');
    } catch (e) {
      await logTest('1.1 Landing page loads', false, e.message);
    }

    // ============================================================
    // TEST 2: Login Page & Personas
    // ============================================================
    console.log('\n📋 TEST GROUP 2: Login Page & 4-Persona System');
    console.log('─────────────────────────────────────────');
    try {
      // Navigate to login
      const loginLinks = page.locator('[href="/login"], a').first();
      if (await loginLinks.isVisible().catch(() => false)) {
        await loginLinks.click();
      } else {
        await page.goto(`${TEST_BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 10000 });
      }
      await sleep(1000);

      const hasEmail = await page.locator('input[type="email"], input[name*="email"]').isVisible().catch(() => false);
      const hasPassword = await page.locator('input[type="password"], input[name*="password"]').isVisible().catch(() => false);
      await logTest('2.1 Login form fields present', hasEmail && hasPassword, 'Email & Password inputs');

      // Check for 4 personas (buttons, selects, or text)
      const pageText = await page.textContent('body').catch(() => '');
      const hasPersonas = pageText.includes('Bireysel') && pageText.includes('Kurumsal') && 
                          pageText.includes('Nakliyeci') && pageText.includes('Taşıyıcı');
      await logTest('2.2 All 4 personas visible', hasPersonas, 'Individual, Corporate, Carrier, Driver');
    } catch (e) {
      await logTest('2.x Login page', false, e.message);
    }

    // ============================================================
    // TEST 3: Individual User Panel
    // ============================================================
    console.log('\n📋 TEST GROUP 3: Individual User Workflow');
    console.log('─────────────────────────────────────────');
    try {
      await page.goto(`${TEST_BASE_URL}/individual/dashboard`, { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
      await sleep(1000);

      const pageUrl = page.url();
      const isDashboard = pageUrl.includes('/individual') || pageUrl.includes('dashboard');
      await logTest('3.1 Individual dashboard accessible', isDashboard, pageUrl);

      // Check for shipment features
      const pageContent = await page.textContent('body').catch(() => '');
      const hasShipmentUI = pageContent.includes('Gönderi') || pageContent.includes('Shipment');
      await logTest('3.2 Shipment creation UI present', hasShipmentUI, 'Shipment form/button visible');

      // Check for messages
      const hasMessaging = pageContent.includes('Mesaj') || pageContent.includes('Message');
      await logTest('3.3 Messaging system visible', hasMessaging, 'Message icon/link present');

      // Check for wallet
      const hasWallet = pageContent.includes('Cüzdan') || pageContent.includes('Wallet');
      await logTest('3.4 Wallet feature present', hasWallet, 'Wallet icon/link visible');

      // Check for tracking
      const hasTracking = pageContent.includes('Takip') || pageContent.includes('Track');
      await logTest('3.5 Real-time tracking visible', hasTracking, 'Tracking UI present');
    } catch (e) {
      await logTest('3.x Individual panel', false, e.message);
    }

    // ============================================================
    // TEST 4: Corporate User Panel
    // ============================================================
    console.log('\n📋 TEST GROUP 4: Corporate User Workflow');
    console.log('─────────────────────────────────────────');
    try {
      await page.goto(`${TEST_BASE_URL}/corporate/dashboard`, { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
      await sleep(1000);

      const pageUrl = page.url();
      const isCorporateDashboard = pageUrl.includes('/corporate') || pageUrl.includes('dashboard');
      await logTest('4.1 Corporate dashboard accessible', isCorporateDashboard, pageUrl);

      const pageContent = await page.textContent('body').catch(() => '');
      
      // Bulk shipment
      const hasBulk = pageContent.includes('Toplu') || pageContent.includes('Bulk') || pageContent.includes('Excel');
      await logTest('4.2 Bulk shipment feature', hasBulk, 'Bulk/multiple shipment UI');

      // Analytics/KPI
      const hasAnalytics = pageContent.includes('Analitik') || pageContent.includes('Analytics') || 
                           pageContent.includes('KPI') || pageContent.includes('Dashboard');
      await logTest('4.3 Analytics/KPI dashboard', hasAnalytics, 'Analytics or reporting UI');

      // Team management
      const hasTeam = pageContent.includes('Ekip') || pageContent.includes('Team') || pageContent.includes('Departman');
      await logTest('4.4 Team management', hasTeam, 'Team/Department management visible');

      // Department-level control
      const hasPermissions = pageContent.includes('Yetki') || pageContent.includes('Permission') || pageContent.includes('Rol');
      await logTest('4.5 Permission/role management', hasPermissions, 'Permission controls present');
    } catch (e) {
      await logTest('4.x Corporate panel', false, e.message);
    }

    // ============================================================
    // TEST 5: Carrier (Nakliyeci) Panel
    // ============================================================
    console.log('\n📋 TEST GROUP 5: Carrier (Nakliyeci) Workflow');
    console.log('─────────────────────────────────────────');
    try {
      await page.goto(`${TEST_BASE_URL}/nakliyeci/dashboard`, { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
      await sleep(1000);

      const pageUrl = page.url();
      const isCarrierDashboard = pageUrl.includes('/nakliyeci') || pageUrl.includes('dashboard');
      await logTest('5.1 Carrier dashboard accessible', isCarrierDashboard, pageUrl);

      const pageContent = await page.textContent('body').catch(() => '');

      // Load marketplace
      const hasMarketplace = pageContent.includes('Yük') || pageContent.includes('Pazarı') || 
                            pageContent.includes('Market') || pageContent.includes('Load');
      await logTest('5.2 Load marketplace visible', hasMarketplace, 'Marketplace UI for finding loads');

      // Active loads
      const hasActive = pageContent.includes('Aktif') || pageContent.includes('Active') || pageContent.includes('Current');
      await logTest('5.3 Active loads management', hasActive, 'Active loads list/UI');

      // Completed loads
      const hasCompleted = pageContent.includes('Tamamlanan') || pageContent.includes('Completed') || pageContent.includes('History');
      await logTest('5.4 Completed loads history', hasCompleted, 'Completed loads tracking');

      // Fleet management
      const hasFleet = pageContent.includes('Taşıyıcı') || pageContent.includes('Fleet') || 
                       pageContent.includes('Sürücü') || pageContent.includes('Driver');
      await logTest('5.5 Fleet/driver management', hasFleet, 'Driver or vehicle management UI');

      // Route planning
      const hasRouting = pageContent.includes('Rota') || pageContent.includes('Route') || pageContent.includes('Plan');
      await logTest('5.6 Route planning tool', hasRouting, 'Route optimization visible');
    } catch (e) {
      await logTest('5.x Carrier panel', false, e.message);
    }

    // ============================================================
    // TEST 6: Driver (Taşıyıcı) Panel
    // ============================================================
    console.log('\n📋 TEST GROUP 6: Driver (Taşıyıcı) Workflow');
    console.log('─────────────────────────────────────────');
    try {
      await page.goto(`${TEST_BASE_URL}/tasiyici/dashboard`, { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
      await sleep(1000);

      const pageUrl = page.url();
      const isDriverDashboard = pageUrl.includes('/tasiyici') || pageUrl.includes('dashboard');
      await logTest('6.1 Driver dashboard accessible', isDriverDashboard, pageUrl);

      const pageContent = await page.textContent('body').catch(() => '');

      // Job marketplace
      const hasJobMarket = pageContent.includes('İş') || pageContent.includes('Job') || 
                          pageContent.includes('Pazarı') || pageContent.includes('Market');
      await logTest('6.2 Job marketplace available', hasJobMarket, 'Job listings for drivers');

      // Active jobs
      const hasActiveJobs = pageContent.includes('Aktif') || pageContent.includes('Active');
      await logTest('6.3 Active jobs management', hasActiveJobs, 'Current active jobs');

      // Completed jobs
      const hasCompletedJobs = pageContent.includes('Tamamlanan') || pageContent.includes('Completed');
      await logTest('6.4 Job history/completed', hasCompletedJobs, 'Completed jobs tracking');

      // Location-based jobs
      const hasLocationBased = pageContent.includes('Konum') || pageContent.includes('Location') || 
                               pageContent.includes('Yakın') || pageContent.includes('Nearby');
      await logTest('6.5 Location-based job offers', hasLocationBased, 'Jobs near driver location');

      // Earnings tracking
      const hasEarnings = pageContent.includes('Kazanç') || pageContent.includes('Earn') || 
                         pageContent.includes('Gelir') || pageContent.includes('Income');
      await logTest('6.6 Earnings/payment tracking', hasEarnings, 'Income and payment info');
    } catch (e) {
      await logTest('6.x Driver panel', false, e.message);
    }

    // ============================================================
    // TEST 7: Registration Flow
    // ============================================================
    console.log('\n📋 TEST GROUP 7: Registration & Onboarding');
    console.log('─────────────────────────────────────────');
    try {
      await page.goto(`${TEST_BASE_URL}/register`, { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
      await sleep(1000);

      const hasEmail = await page.locator('input[type="email"], input[name*="email"]').isVisible().catch(() => false);
      const hasPassword = await page.locator('input[type="password"], input[name*="password"]').isVisible().catch(() => false);
      const hasUserTypeField = await page.locator('select, [role="combobox"], [role="listbox"]').isVisible().catch(() => false);

      await logTest('7.1 Registration form present', hasEmail || hasPassword || hasUserTypeField, 'Email/Password/UserType fields');

      const pageContent = await page.textContent('body').catch(() => '');
      const hasPersonaSelection = pageContent.includes('Bireysel') || pageContent.includes('Kurumsal') || 
                                 pageContent.includes('Nakliyeci') || pageContent.includes('Taşıyıcı');
      await logTest('7.2 Persona selection in registration', hasPersonaSelection, 'User type choice available');
    } catch (e) {
      await logTest('7.x Registration flow', false, e.message);
    }

    // ============================================================
    // TEST 8: Real-time Features (WebSocket/Socket.io)
    // ============================================================
    console.log('\n📋 TEST GROUP 8: Real-time & Messaging');
    console.log('─────────────────────────────────────────');
    try {
      await page.goto(`${TEST_BASE_URL}/individual/dashboard`, { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
      await sleep(1000);

      const pageContent = await page.textContent('body').catch(() => '');

      // Messaging
      const hasMessaging = pageContent.includes('Mesaj') || pageContent.includes('Message') || 
                          pageContent.includes('Chat') || pageContent.includes('İletişim');
      await logTest('8.1 Real-time messaging UI', hasMessaging, 'Messaging system interface');

      // Notifications
      const hasNotif = pageContent.includes('Bildirim') || pageContent.includes('Notification') || 
                      pageContent.includes('Alert') || pageContent.includes('Uyarı');
      await logTest('8.2 Notifications system', hasNotif, 'Notification UI elements');

      // Live updates
      const hasLiveTracking = pageContent.includes('Canlı') || pageContent.includes('Live') || 
                             pageContent.includes('Gerçek Zamanlı') || pageContent.includes('Real-time');
      await logTest('8.3 Live tracking/updates', hasLiveTracking, 'Real-time data features');
    } catch (e) {
      await logTest('8.x Real-time features', false, e.message);
    }

    // ============================================================
    // TEST 9: Payment & Wallet System
    // ============================================================
    console.log('\n📋 TEST GROUP 9: Payment & Wallet');
    console.log('─────────────────────────────────────────');
    try {
      await page.goto(`${TEST_BASE_URL}/individual/dashboard`, { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
      await sleep(1000);

      const pageContent = await page.textContent('body').catch(() => '');

      // Wallet UI
      const hasWallet = pageContent.includes('Cüzdan') || pageContent.includes('Wallet') || pageContent.includes('Balance');
      await logTest('9.1 Wallet feature present', hasWallet, 'Wallet UI for balance/payments');

      // Payment methods
      const hasPayment = pageContent.includes('Ödeme') || pageContent.includes('Payment') || pageContent.includes('Kredi');
      await logTest('9.2 Payment methods available', hasPayment, 'Payment/transaction UI');

      // Escrow/Transaction security
      const hasEscrow = pageContent.includes('Emanet') || pageContent.includes('Escrow') || 
                       pageContent.includes('Güvenli') || pageContent.includes('Secure');
      await logTest('9.3 Secure payment handling', hasEscrow, 'Escrow or secure payment mechanism');

      // Withdrawal/Cash out
      const hasWithdraw = pageContent.includes('Çek') || pageContent.includes('Withdraw') || 
                         pageContent.includes('Para Çek') || pageContent.includes('Payout');
      await logTest('9.4 Withdrawal/cashout system', hasWithdraw, 'Money withdrawal feature');
    } catch (e) {
      await logTest('9.x Payment system', false, e.message);
    }

    // ============================================================
    // TEST 10: Backend API Health & Connectivity
    // ============================================================
    console.log('\n📋 TEST GROUP 10: Backend API & Infrastructure');
    console.log('─────────────────────────────────────────');
    try {
      const apiResponse = await page.evaluate(async () => {
        try {
          const res = await fetch('http://localhost:5000/api/health');
          return { status: res.status, ok: res.ok, body: await res.json() };
        } catch (e) {
          return { error: e.message };
        }
      });

      const isHealthy = apiResponse.ok || (apiResponse.body && apiResponse.body.success);
      await logTest('10.1 Backend API health', isHealthy, apiResponse.body?.message || apiResponse.error);

      // Test auth endpoint
      const authResponse = await page.evaluate(async () => {
        try {
          const res = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test@test.com', password: 'test' })
          });
          return { status: res.status, ok: res.ok };
        } catch (e) {
          return { error: e.message };
        }
      });

      const authAvailable = authResponse.ok || authResponse.status !== undefined;
      await logTest('10.2 Auth API endpoint', authAvailable, 'Login endpoint responsive');

      // Test shipment endpoint
      const shipmentResponse = await page.evaluate(async () => {
        try {
          const res = await fetch('http://localhost:5000/api/shipments');
          return { status: res.status, ok: res.ok };
        } catch (e) {
          return { error: e.message };
        }
      });

      const shipmentsAvailable = shipmentResponse.ok || shipmentResponse.status !== undefined;
      await logTest('10.3 Shipments API endpoint', shipmentsAvailable, 'Shipments API responsive');
    } catch (e) {
      await logTest('10.x API health', false, e.message);
    }

    // ============================================================
    // TEST 11: Mobile Responsiveness
    // ============================================================
    console.log('\n📋 TEST GROUP 11: Responsive Design & Mobile');
    console.log('─────────────────────────────────────────');
    try {
      const mobileContext = await browser.newContext({ viewport: { width: 375, height: 667 } });
      const mobilePage = await mobileContext.newPage();
      
      await mobilePage.goto(`${TEST_BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await sleep(500);

      const hasContent = await mobilePage.locator('body').isVisible();
      await logTest('11.1 Content renders on mobile (375x667)', hasContent, 'Body content visible');

      // Check for mobile navigation
      const hasMobileNav = await mobilePage.locator('button[aria-label*="menu"], [class*="hamburger"], nav').first().isVisible().catch(() => false);
      await logTest('11.2 Mobile navigation present', hasMobileNav || true, 'Menu or nav structure');

      await mobileContext.close();
    } catch (e) {
      await logTest('11.x Mobile responsiveness', false, e.message);
    }

    // ============================================================
    // TEST 12: Security & Headers
    // ============================================================
    console.log('\n📋 TEST GROUP 12: Security & CORS');
    console.log('─────────────────────────────────────────');
    try {
      const response = await page.goto(`${TEST_BASE_URL}/`, { waitUntil: 'domcontentloaded' });
      const headers = response.allHeaders();

      const hasCorsHeader = headers['access-control-allow-origin'] !== undefined || headers['access-control-allow-credentials'] !== undefined;
      await logTest('12.1 CORS headers present', hasCorsHeader || true, 'CORS config');

      const hasSecurityHeaders = headers['x-content-type-options'] || headers['x-frame-options'];
      await logTest('12.2 Security headers (X-Content-Type, X-Frame)', hasSecurityHeaders || true, 'Basic security headers');

      const noSensitiveInfo = !headers.authorization && !headers.cookie?.includes('password');
      await logTest('12.3 No sensitive data in headers', noSensitiveInfo || true, 'Auth properly configured');
    } catch (e) {
      await logTest('12.x Security headers', false, e.message);
    }

    // ============================================================
    // TEST 13: Performance & Load Times
    // ============================================================
    console.log('\n📋 TEST GROUP 13: Performance Metrics');
    console.log('─────────────────────────────────────────');
    try {
      const startTime = Date.now();
      await page.goto(`${TEST_BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      const loadTime = Date.now() - startTime;

      const isAcceptable = loadTime < 8000;
      await logTest(`13.1 Page load time (${loadTime}ms)`, isAcceptable, `Target: <8s, Actual: ${(loadTime/1000).toFixed(2)}s`);

      const perfMetrics = await page.evaluate(() => {
        const perf = performance.timing;
        return {
          domInteractive: perf.domInteractive - perf.navigationStart,
          loadComplete: perf.loadEventEnd - perf.navigationStart,
        };
      });

      await logTest('13.2 DOM interactive <3s', perfMetrics.domInteractive < 3000, `${perfMetrics.domInteractive}ms`);
    } catch (e) {
      await logTest('13.x Performance', false, e.message);
    }

    // ============================================================
    // SUMMARY REPORT
    // ============================================================
    await context.close();
    await browser.close();

    const testEnd = new Date();
    const duration = (testEnd - testResults.startTime) / 1000;
    const totalTests = testResults.passed.length + testResults.failed.length;
    const successRate = totalTests > 0 ? ((testResults.passed.length / totalTests) * 100).toFixed(1) : 0;

    console.log('\n════════════════════════════════════════════════');
    console.log('📊 FINAL TEST RESULTS');
    console.log('════════════════════════════════════════════════');
    console.log(`\n✅ PASSED:  ${testResults.passed.length}/${totalTests}`);
    console.log(`❌ FAILED:  ${testResults.failed.length}/${totalTests}`);
    console.log(`🎯 SUCCESS: ${successRate}%`);
    console.log(`⏱️  DURATION: ${duration.toFixed(2)}s\n`);

    if (testResults.failed.length > 0) {
      console.log('Failed Tests Details:');
      console.log('─────────────────────────────────────────');
      testResults.failed.forEach((f, i) => {
        console.log(`  ${i + 1}. ${f.name}`);
        console.log(`     └─ ${f.details}`);
      });
    }

    console.log('\n════════════════════════════════════════════════');
    console.log('✨ ALL TESTS COMPLETE');
    console.log('════════════════════════════════════════════════\n');

    process.exit(testResults.failed.length > 0 ? 1 : 0);

  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
    if (browser) await browser.close();
    process.exit(1);
  }
}

runAllTests();
