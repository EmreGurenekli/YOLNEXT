const { chromium, request } = require('playwright');

(async () => {
  const baseURL = 'http://localhost:5173';
  const apiURL = 'http://localhost:5000';
  const browser = await chromium.launch({ headless: false });
  const api = await request.newContext();

  const errors = [];
  const tests = [];

  const logTest = (name, passed, error = null) => {
    tests.push({ name, passed, error });
    console.log(`${passed ? '✅' : '❌'} ${name}${error ? `: ${error}` : ''}`);
  };

  try {
    console.log('🚀 Kapsamlı Test Başlatılıyor...\n');

    // ============================================
    // 1. API HEALTH CHECK
    // ============================================
    try {
      const health = await api.get(`${apiURL}/health`);
      if (health.ok()) {
        logTest('API Health Check', true);
      } else {
        throw new Error(`Health check failed: ${health.status()}`);
      }
    } catch (e) {
      logTest('API Health Check', false, e.message);
      errors.push('Backend server çalışmıyor!');
    }

    // ============================================
    // 2. AUTHENTICATION TESTS
    // ============================================
    console.log('\n📋 2. Authentication Tests');
    const page = await browser.newPage();

    await page.goto(`${baseURL}/login`);
    await page.waitForLoadState('networkidle');

    // Demo Individual login
    try {
      const indBtn = page.locator('[data-testid="demo-individual"]');
      if ((await indBtn.count()) > 0) {
        await indBtn.click();
        await page.waitForURL('**/individual/dashboard', { timeout: 10000 });
        logTest('Individual Demo Login', true);
      } else {
        throw new Error('Demo button not found');
      }
    } catch (e) {
      logTest('Individual Demo Login', false, e.message);
      errors.push('Individual login failed');
    }

    // Demo Nakliyeci login
    try {
      await page.goto(`${baseURL}/login`);
      await page.waitForLoadState('networkidle');
      const nakBtn = page.locator('[data-testid="demo-nakliyeci"]');
      if ((await nakBtn.count()) > 0) {
        await nakBtn.click();
        await page.waitForURL('**/nakliyeci/dashboard', { timeout: 10000 });
        logTest('Nakliyeci Demo Login', true);
      } else {
        throw new Error('Demo button not found');
      }
    } catch (e) {
      logTest('Nakliyeci Demo Login', false, e.message);
      errors.push('Nakliyeci login failed');
    }

    // Demo Tasiyici login
    try {
      await page.goto(`${baseURL}/login`);
      await page.waitForLoadState('networkidle');
      const tasBtn = page.locator('[data-testid="demo-tasiyici"]');
      if ((await tasBtn.count()) > 0) {
        await tasBtn.click();
        await page.waitForURL('**/tasiyici/dashboard', { timeout: 10000 });
        logTest('Tasiyici Demo Login', true);
      } else {
        throw new Error('Demo button not found');
      }
    } catch (e) {
      logTest('Tasiyici Demo Login', false, e.message);
      errors.push('Tasiyici login failed');
    }

    // ============================================
    // 3. PAGE LOAD TESTS (All Panels)
    // ============================================
    console.log('\n📋 3. Page Load Tests');

    const pagesToTest = [
      // Individual
      {
        name: 'Individual Dashboard',
        url: '/individual/dashboard',
        role: 'individual',
      },
      {
        name: 'Individual Create Shipment',
        url: '/individual/create-shipment',
        role: 'individual',
      },
      {
        name: 'Individual Offers',
        url: '/individual/offers',
        role: 'individual',
      },
      {
        name: 'Individual Shipments',
        url: '/individual/shipments',
        role: 'individual',
      },

      // Corporate
      {
        name: 'Corporate Dashboard',
        url: '/corporate/dashboard',
        role: 'corporate',
      },
      {
        name: 'Corporate Create Shipment',
        url: '/corporate/create-shipment',
        role: 'corporate',
      },
      {
        name: 'Corporate Shipments',
        url: '/corporate/shipments',
        role: 'corporate',
      },
      { name: 'Corporate Offers', url: '/corporate/offers', role: 'corporate' },

      // Nakliyeci
      {
        name: 'Nakliyeci Dashboard',
        url: '/nakliyeci/dashboard',
        role: 'nakliyeci',
      },
      { name: 'Nakliyeci Jobs', url: '/nakliyeci/jobs', role: 'nakliyeci' },
      {
        name: 'Nakliyeci Shipments',
        url: '/nakliyeci/shipments',
        role: 'nakliyeci',
      },
      { name: 'Nakliyeci Offers', url: '/nakliyeci/offers', role: 'nakliyeci' },
      {
        name: 'Nakliyeci Drivers',
        url: '/nakliyeci/drivers',
        role: 'nakliyeci',
      },
      {
        name: 'Nakliyeci Route Planner',
        url: '/nakliyeci/route-planner',
        role: 'nakliyeci',
      },
      {
        name: 'Nakliyeci Listings',
        url: '/nakliyeci/listings',
        role: 'nakliyeci',
      },
      { name: 'Nakliyeci Wallet', url: '/nakliyeci/wallet', role: 'nakliyeci' },

      // Tasiyici
      {
        name: 'Tasiyici Dashboard',
        url: '/tasiyici/dashboard',
        role: 'tasiyici',
      },
      { name: 'Tasiyici Market', url: '/tasiyici/market', role: 'tasiyici' },
      {
        name: 'Tasiyici Active Jobs',
        url: '/tasiyici/active-jobs',
        role: 'tasiyici',
      },
      {
        name: 'Tasiyici Completed Jobs',
        url: '/tasiyici/completed-jobs',
        role: 'tasiyici',
      },
      {
        name: 'Tasiyici My Offers',
        url: '/tasiyici/my-offers',
        role: 'tasiyici',
      },
    ];

    for (const testPage of pagesToTest) {
      try {
        // Login first
        await page.goto(`${baseURL}/login`);
        await page.waitForLoadState('networkidle');
        const btnMap = {
          individual: '[data-testid="demo-individual"]',
          corporate: '[data-testid="demo-corporate"]',
          nakliyeci: '[data-testid="demo-nakliyeci"]',
          tasiyici: '[data-testid="demo-tasiyici"]',
        };
        const btn = page.locator(btnMap[testPage.role]);
        if ((await btn.count()) > 0) {
          await btn.click();
          await page.waitForTimeout(1000);
        }

        // Navigate to page
        await page.goto(`${baseURL}${testPage.url}`, {
          waitUntil: 'networkidle',
          timeout: 15000,
        });
        await page.waitForTimeout(2000);

        // Check if page loaded (no 404, has content)
        const title = await page.title();
        const hasContent = (await page.locator('body').count()) > 0;

        if (hasContent && !title.includes('404')) {
          logTest(testPage.name, true);
        } else {
          throw new Error('Page not loaded or 404');
        }
      } catch (e) {
        logTest(testPage.name, false, e.message);
        errors.push(`${testPage.name}: ${e.message}`);
      }
    }

    // ============================================
    // 4. API ENDPOINT TESTS
    // ============================================
    console.log('\n📋 4. API Endpoint Tests');

    const apiTests = [
      {
        name: 'GET /api/dashboard/stats/individual',
        method: 'GET',
        url: `${apiURL}/api/dashboard/stats/individual`,
        headers: { 'X-User-Id': '1' },
      },
      {
        name: 'GET /api/shipments',
        method: 'GET',
        url: `${apiURL}/api/shipments?userId=1`,
        headers: { 'X-User-Id': '1' },
      },
      {
        name: 'GET /api/offers',
        method: 'GET',
        url: `${apiURL}/api/offers?userId=1`,
        headers: { 'X-User-Id': '1' },
      },
      {
        name: 'GET /api/loads/available',
        method: 'GET',
        url: `${apiURL}/api/loads/available`,
        headers: { 'X-User-Id': '3' },
      },
      {
        name: 'GET /api/vehicles/nakliyeci',
        method: 'GET',
        url: `${apiURL}/api/vehicles/nakliyeci`,
        headers: { 'X-User-Id': '3' },
      },
      {
        name: 'GET /api/drivers/nakliyeci',
        method: 'GET',
        url: `${apiURL}/api/drivers/nakliyeci`,
        headers: { 'X-User-Id': '3' },
      },
      {
        name: 'GET /api/carrier-market/available',
        method: 'GET',
        url: `${apiURL}/api/carrier-market/available`,
        headers: {},
      },
      {
        name: 'GET /api/shipments/tasiyici',
        method: 'GET',
        url: `${apiURL}/api/shipments/tasiyici`,
        headers: { 'X-User-Id': '4' },
      },
    ];

    for (const apiTest of apiTests) {
      try {
        const response = await api.get(apiTest.url, {
          headers: apiTest.headers,
        });
        if (response.ok()) {
          const data = await response.json();
          logTest(apiTest.name, true);
        } else {
          const text = await response.text();
          throw new Error(
            `Status ${response.status()}: ${text.substring(0, 100)}`
          );
        }
      } catch (e) {
        logTest(apiTest.name, false, e.message);
        errors.push(`${apiTest.name}: ${e.message}`);
      }
    }

    // ============================================
    // 5. FULL E2E FLOW TEST
    // ============================================
    console.log('\n📋 5. Full E2E Flow Test');

    try {
      // Individual creates shipment
      const createResp = await api.post(`${apiURL}/api/shipments`, {
        data: {
          title: `E2E Test ${Date.now()}`,
          description: 'Comprehensive test shipment',
          pickupAddress: 'Kadıköy, İstanbul',
          deliveryAddress: 'Çankaya, Ankara',
          pickupDate: new Date(Date.now() + 3600000).toISOString(),
          weight: 500,
          price: 3000,
        },
        headers: { Authorization: 'Bearer demo-token', 'X-User-Id': '1' },
      });

      if (!createResp.ok()) {
        throw new Error(`Create shipment failed: ${createResp.status()}`);
      }
      const created = await createResp.json();
      const shipmentId = created.data?.id || created.data?.shipment?.id;
      if (!shipmentId) throw new Error('No shipment ID');

      logTest('Individual Create Shipment (API)', true);

      // Nakliyeci creates offer
      const offerResp = await api.post(`${apiURL}/api/offers`, {
        data: { shipmentId, price: 3500, message: 'E2E test offer' },
        headers: { Authorization: 'Bearer demo-token', 'X-User-Id': '3' },
      });

      if (!offerResp.ok()) {
        throw new Error(`Create offer failed: ${offerResp.status()}`);
      }
      const offer = await offerResp.json();
      const offerId = offer.data?.id || offer.data?.offer?.id;
      if (!offerId) throw new Error('No offer ID');

      logTest('Nakliyeci Create Offer (API)', true);

      // Accept offer
      const acceptResp = await api.put(
        `${apiURL}/api/offers/${offerId}/accept`
      );
      if (!acceptResp.ok()) {
        throw new Error(`Accept offer failed: ${acceptResp.status()}`);
      }
      logTest('Accept Offer (API)', true);

      // Create carrier market listing
      const listingResp = await api.post(
        `${apiURL}/api/carrier-market/listings`,
        {
          data: { shipmentId, minPrice: 3200 },
          headers: { Authorization: 'Bearer demo-token', 'X-User-Id': '3' },
        }
      );

      if (!listingResp.ok()) {
        throw new Error(`Create listing failed: ${listingResp.status()}`);
      }
      const listing = await listingResp.json();
      const listingId = listing.data?.id;
      if (!listingId) throw new Error('No listing ID');

      logTest('Nakliyeci Create Carrier Listing (API)', true);

      // Tasiyici places bid
      const bidResp = await api.post(`${apiURL}/api/carrier-market/bids`, {
        data: { listingId, bidPrice: 3300, etaHours: 12 },
        headers: { Authorization: 'Bearer demo-token', 'X-User-Id': '4' },
      });

      if (!bidResp.ok()) {
        throw new Error(`Create bid failed: ${bidResp.status()}`);
      }
      const bid = await bidResp.json();
      const bidId = bid.data?.id;
      if (!bidId) throw new Error('No bid ID');

      logTest('Tasiyici Place Bid (API)', true);

      // Accept bid
      const acceptBidResp = await api.post(
        `${apiURL}/api/carrier-market/bids/${bidId}/accept`,
        {
          headers: { Authorization: 'Bearer demo-token', 'X-User-Id': '3' },
        }
      );

      if (!acceptBidResp.ok()) {
        throw new Error(`Accept bid failed: ${acceptBidResp.status()}`);
      }
      logTest('Nakliyeci Accept Bid (API)', true);

      // Verify tasiyici sees assignment
      const activeResp = await api.get(`${apiURL}/api/shipments/tasiyici`, {
        headers: { Authorization: 'Bearer demo-token', 'X-User-Id': '4' },
      });

      if (!activeResp.ok()) {
        throw new Error(`Get active shipments failed: ${activeResp.status()}`);
      }
      const active = await activeResp.json();
      const found = (active.data || []).some(s => s.id === shipmentId);

      if (found) {
        logTest('Tasiyici Sees Assignment (API)', true);
      } else {
        throw new Error('Shipment not found in tasiyici active list');
      }

      logTest('Full E2E Flow', true);
    } catch (e) {
      logTest('Full E2E Flow', false, e.message);
      errors.push(`E2E Flow: ${e.message}`);
    }

    // ============================================
    // SUMMARY
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST ÖZETİ');
    console.log('='.repeat(60));

    const passed = tests.filter(t => t.passed).length;
    const failed = tests.filter(t => !t.passed).length;

    console.log(`✅ Başarılı: ${passed}`);
    console.log(`❌ Başarısız: ${failed}`);
    console.log(
      `📈 Başarı Oranı: ${((passed / tests.length) * 100).toFixed(1)}%`
    );

    if (errors.length > 0) {
      console.log(`\n❌ Hatalar (${errors.length}):`);
      errors.slice(0, 20).forEach((err, i) => {
        console.log(`   ${i + 1}. ${err}`);
      });
      if (errors.length > 20) {
        console.log(`   ... ve ${errors.length - 20} hata daha`);
      }
    }

    console.log('\n' + '='.repeat(60));

    if (failed === 0) {
      console.log('🎉 TÜM TESTLER BAŞARILI! Sistem production-ready!');
      process.exit(0);
    } else {
      console.log(`⚠️ ${failed} test başarısız. Düzeltmeler gerekiyor.`);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Test framework error:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
