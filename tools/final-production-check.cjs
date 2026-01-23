const { chromium, request } = require('playwright');

(async () => {
  const baseURL = 'http://localhost:5173';
  const apiURL = 'http://localhost:5000';
  const browser = await chromium.launch({ headless: false });
  const api = await request.newContext();

  const errors = [];
  const consoleErrors = [];
  const tests = [];

  const logTest = (name, passed, error = null) => {
    tests.push({ name, passed, error });
    console.log(`${passed ? '✅' : '❌'} ${name}${error ? `: ${error}` : ''}`);
  };

  try {
    console.log('🚀 PRODUCTION READINESS CHECK\n');
    console.log('='.repeat(60));

    // ============================================
    // 1. BACKEND HEALTH
    // ============================================
    console.log('\n📋 1. Backend Health Check');
    try {
      const health = await api.get(`${apiURL}/health`);
      logTest('Backend Server Running', health.ok());
      if (!health.ok()) errors.push('Backend server çalışmıyor');
    } catch (e) {
      logTest('Backend Server Running', false, e.message);
      errors.push('Backend server erişilemez');
      process.exit(1);
    }

    // ============================================
    // 2. FRONTEND CONSOLE ERRORS
    // ============================================
    console.log('\n📋 2. Frontend Console Errors Scan');
    const page = await browser.newPage();

    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('React DevTools') && !text.includes('favicon')) {
          consoleErrors.push(text);
        }
      }
    });

    page.on('pageerror', error => {
      consoleErrors.push(`Page Error: ${error.message}`);
    });

    const pagesToCheck = [
      { name: 'Landing Page', url: '/' },
      { name: 'Login Page', url: '/login' },
      {
        name: 'Individual Dashboard',
        url: '/individual/dashboard',
        role: 'individual',
      },
      {
        name: 'Corporate Dashboard',
        url: '/corporate/dashboard',
        role: 'corporate',
      },
      {
        name: 'Nakliyeci Dashboard',
        url: '/nakliyeci/dashboard',
        role: 'nakliyeci',
      },
      {
        name: 'Tasiyici Dashboard',
        url: '/tasiyici/dashboard',
        role: 'tasiyici',
      },
    ];

    for (const testPage of pagesToCheck) {
      try {
        if (testPage.role) {
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
        }

        await page.goto(`${baseURL}${testPage.url}`, {
          waitUntil: 'networkidle',
          timeout: 15000,
        });
        await page.waitForTimeout(2000);

        const hasErrors = consoleErrors.length > 0;
        if (
          !hasErrors ||
          consoleErrors.filter(
            e => !e.includes('favicon') && !e.includes('React DevTools')
          ).length === 0
        ) {
          logTest(testPage.name, true);
        } else {
          const relevantErrors = consoleErrors.filter(
            e => !e.includes('favicon') && !e.includes('React DevTools')
          );
          logTest(
            testPage.name,
            false,
            `${relevantErrors.length} console error(s)`
          );
          errors.push(
            `${testPage.name}: ${relevantErrors.length} console errors`
          );
        }
      } catch (e) {
        logTest(testPage.name, false, e.message);
        errors.push(`${testPage.name}: ${e.message}`);
      }
    }

    // ============================================
    // 3. CRITICAL API ENDPOINTS
    // ============================================
    console.log('\n📋 3. Critical API Endpoints');
    const apiTests = [
      { name: 'GET /api/health', url: `${apiURL}/health` },
      {
        name: 'GET /api/dashboard/stats/individual',
        url: `${apiURL}/api/dashboard/stats/individual`,
        headers: { 'X-User-Id': '1' },
      },
      {
        name: 'GET /api/shipments',
        url: `${apiURL}/api/shipments?userId=1`,
        headers: { 'X-User-Id': '1' },
      },
      {
        name: 'GET /api/offers',
        url: `${apiURL}/api/offers?userId=1`,
        headers: { 'X-User-Id': '1' },
      },
      {
        name: 'GET /api/loads/available',
        url: `${apiURL}/api/loads/available`,
        headers: { 'X-User-Id': '3' },
      },
      {
        name: 'GET /api/shipments/tasiyici',
        url: `${apiURL}/api/shipments/tasiyici`,
        headers: { 'X-User-Id': '4' },
      },
      {
        name: 'GET /api/carrier-market/available',
        url: `${apiURL}/api/carrier-market/available`,
      },
    ];

    for (const apiTest of apiTests) {
      try {
        const response = await api.get(apiTest.url, {
          headers: apiTest.headers || {},
        });
        if (response.ok()) {
          logTest(apiTest.name, true);
        } else {
          throw new Error(`Status ${response.status()}`);
        }
      } catch (e) {
        logTest(apiTest.name, false, e.message);
        errors.push(`${apiTest.name}: ${e.message}`);
      }
    }

    // ============================================
    // 4. FULL WORKFLOW TEST
    // ============================================
    console.log('\n📋 4. Full Workflow Test');
    try {
      // Create shipment
      const createResp = await api.post(`${apiURL}/api/shipments`, {
        data: {
          title: `Final Check ${Date.now()}`,
          description: 'Final production check',
          pickupAddress: 'Kadıköy, İstanbul',
          deliveryAddress: 'Çankaya, Ankara',
          pickupDate: new Date(Date.now() + 3600000).toISOString(),
          weight: 500,
          price: 3000,
        },
        headers: { Authorization: 'Bearer demo-token', 'X-User-Id': '1' },
      });

      if (!createResp.ok())
        throw new Error(`Create failed: ${createResp.status()}`);
      const created = await createResp.json();
      const shipmentId = created.data?.id || created.data?.shipment?.id;
      if (!shipmentId) throw new Error('No shipment ID');
      logTest('Create Shipment', true);

      // Create offer
      const offerResp = await api.post(`${apiURL}/api/offers`, {
        data: { shipmentId, price: 3500, message: 'Final test offer' },
        headers: { Authorization: 'Bearer demo-token', 'X-User-Id': '3' },
      });

      if (!offerResp.ok())
        throw new Error(`Offer failed: ${offerResp.status()}`);
      const offer = await offerResp.json();
      const offerId = offer.data?.id || offer.data?.offer?.id;
      if (!offerId) throw new Error('No offer ID');
      logTest('Create Offer', true);

      // Accept offer
      const acceptResp = await api.put(
        `${apiURL}/api/offers/${offerId}/accept`
      );
      if (!acceptResp.ok())
        throw new Error(`Accept failed: ${acceptResp.status()}`);
      logTest('Accept Offer', true);

      // Create listing
      const listingResp = await api.post(
        `${apiURL}/api/carrier-market/listings`,
        {
          data: { shipmentId, minPrice: 3200 },
          headers: { Authorization: 'Bearer demo-token', 'X-User-Id': '3' },
        }
      );

      if (!listingResp.ok())
        throw new Error(`Listing failed: ${listingResp.status()}`);
      const listing = await listingResp.json();
      const listingId = listing.data?.id || listing.listingId;
      if (!listingId) throw new Error('No listing ID');
      logTest('Create Carrier Listing', true);

      // Place bid
      const bidResp = await api.post(`${apiURL}/api/carrier-market/bids`, {
        data: { listingId, bidPrice: 3300, etaHours: 12 },
        headers: { Authorization: 'Bearer demo-token', 'X-User-Id': '4' },
      });

      if (!bidResp.ok()) throw new Error(`Bid failed: ${bidResp.status()}`);
      logTest('Place Bid', true);

      logTest('Full Workflow', true);
    } catch (e) {
      logTest('Full Workflow', false, e.message);
      errors.push(`Workflow: ${e.message}`);
    }

    // ============================================
    // SUMMARY
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('📊 PRODUCTION READINESS SUMMARY');
    console.log('='.repeat(60));

    const passed = tests.filter(t => t.passed).length;
    const failed = tests.filter(t => !t.passed).length;

    console.log(`✅ Başarılı Testler: ${passed}`);
    console.log(`❌ Başarısız Testler: ${failed}`);
    console.log(
      `📈 Başarı Oranı: ${((passed / tests.length) * 100).toFixed(1)}%`
    );

    if (consoleErrors.length > 0) {
      const relevantErrors = consoleErrors.filter(
        e => !e.includes('favicon') && !e.includes('React DevTools')
      );
      console.log(`\n⚠️ Console Hataları: ${relevantErrors.length}`);
      if (relevantErrors.length > 0 && relevantErrors.length <= 5) {
        relevantErrors.forEach((err, i) => {
          console.log(`   ${i + 1}. ${err.substring(0, 100)}`);
        });
      }
    }

    if (errors.length > 0) {
      console.log(`\n❌ Kritik Hatalar (${errors.length}):`);
      errors.slice(0, 10).forEach((err, i) => {
        console.log(`   ${i + 1}. ${err}`);
      });
    }

    console.log('\n' + '='.repeat(60));

    if (
      failed === 0 &&
      consoleErrors.filter(
        e => !e.includes('favicon') && !e.includes('React DevTools')
      ).length === 0
    ) {
      console.log('🎉 SİSTEM PRODUCTION-READY! Tüm kontroller başarılı!');
      console.log("✅ Backend API'ler çalışıyor");
      console.log('✅ Frontend sayfalar yükleniyor');
      console.log('✅ Console hataları yok');
      console.log('✅ Tam workflow testi geçti');
      process.exit(0);
    } else {
      console.log(`⚠️ ${failed} test başarısız veya console hataları mevcut.`);
      console.log('🔧 Düzeltmeler gerekiyor.');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Test framework error:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
