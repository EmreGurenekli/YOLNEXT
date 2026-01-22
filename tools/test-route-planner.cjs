const { chromium, request } = require('playwright');

(async () => {
  const baseURL = process.env.BASE_URL || 'http://localhost:5173';
  const apiURL = process.env.API_URL || 'http://localhost:5000';
  const api = await request.newContext();

  // Seed 2 pending shipments so they appear as loads
  const seeds = [
    {
      title: 'Planner Test 1',
      pickupAddress: 'Ümraniye, İstanbul',
      deliveryAddress: 'Keçiören, Ankara',
      price: 1500,
    },
    {
      title: 'Planner Test 2',
      pickupAddress: 'Karşıyaka, İzmir',
      deliveryAddress: 'Osmangazi, Bursa',
      price: 2200,
    },
  ];
  for (const s of seeds) {
    await api.post(`${apiURL}/api/shipments`, {
      data: { ...s, pickupDate: new Date().toISOString(), weight: 120 },
      headers: { Authorization: 'Bearer demo-jwt-token-e2e' },
    });
  }

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  try {
    await page.goto(`${baseURL}/login`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    const btn = page.locator('[data-testid="demo-nakliyeci"]');
    if (await btn.count()) {
      await btn.click();
    }
    await page.goto(`${baseURL}/nakliyeci/route-planner`, {
      waitUntil: 'networkidle',
    });
    await page.waitForTimeout(800);
    const c1 = await page.locator('text=Ümraniye').count();
    const c2 = await page.locator('text=Karşıyaka').count();
    if (c1 > 0 && c2 > 0) {
      console.log('✅ Route planner shows real loads');
      process.exit(0);
    } else {
      throw new Error('Loads not visible');
    }
  } catch (e) {
    console.error('❌ Route planner test error:', e.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
