const { chromium, request } = require('playwright');

(async () => {
  const baseURL = process.env.BASE_URL || 'http://localhost:5173';
  const apiURL = process.env.API_URL || 'http://localhost:5000';
  const api = await request.newContext();

  // Seed shipments (pending)
  const seeds = [
    {
      title: 'Mobilya Ev Taşıma',
      pickupAddress: 'Kadıköy, İstanbul',
      deliveryAddress: 'Çankaya, Ankara',
      description: 'mobilya ev eşyası',
      price: 2000,
    },
    {
      title: 'Paletli Yük',
      pickupAddress: 'Konak, İzmir',
      deliveryAddress: 'Nilüfer, Bursa',
      description: '5 palet sanayi',
      price: 3500,
    },
    {
      title: 'Beyaz Eşya Taşıma',
      pickupAddress: 'Beşiktaş, İstanbul',
      deliveryAddress: 'Bornova, İzmir',
      description: 'buzdolabı ve çamaşır',
      price: 1200,
    },
  ];
  for (const s of seeds) {
    await api.post(`${apiURL}/api/shipments`, {
      data: { ...s, pickupDate: new Date().toISOString(), weight: 100 },
      headers: { Authorization: 'Bearer demo-jwt-token-e2e' },
    });
  }

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  try {
    // Login as nakliyeci
    await page.goto(`${baseURL}/login`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    const btn = page.locator('[data-testid="demo-nakliyeci"]');
    if (await btn.count()) {
      await btn.click();
    }
    await page.goto(`${baseURL}/nakliyeci/jobs`, { waitUntil: 'networkidle' });

    // Open filters
    const filterToggle = page.getByRole('button', { name: /filtrele/i });
    if (await filterToggle.count()) {
      await filterToggle.click();
    }

    const input = page.locator('input[placeholder^="örn:"]');
    // Test 1: from:istanbul to:ankara type:mobilya
    await input.fill('from:istanbul to:ankara type:mobilya');
    await page.waitForTimeout(1000);
    const t1 = await page.locator('text=Mobilya Ev Taşıma').count();
    if (!(t1 > 0)) throw new Error('Filter 1 failed');

    // Test 2: to:bursa type:palet
    await input.fill('to:bursa type:palet');
    await page.waitForTimeout(1000);
    const t2 = await page.locator('text=Paletli Yük').count();
    if (!(t2 > 0)) throw new Error('Filter 2 failed');

    // Test 3: from:istanbul to:izmir type:beyaz_esya
    await input.fill('from:istanbul to:izmir type:beyaz_esya');
    await page.waitForTimeout(1000);
    const t3 = await page.locator('text=Beyaz Eşya Taşıma').count();
    if (!(t3 > 0)) throw new Error('Filter 3 failed');

    console.log('✅ Inline filter tests passed');
    process.exit(0);
  } catch (e) {
    console.error('❌ Inline filter test error:', e.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
