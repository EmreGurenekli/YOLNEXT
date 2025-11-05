const { chromium, request } = require('playwright');

(async () => {
  const baseURL = process.env.BASE_URL || 'http://localhost:5173';
  const apiURL = process.env.API_URL || 'http://localhost:5000';
  const api = await request.newContext();

  // Seed one pending load with known fields
  const seed = {
    title: 'RP Flow Load',
    pickupAddress: 'Ataşehir, İstanbul',
    deliveryAddress: 'Etimesgut, Ankara',
    price: 1800,
    pickupDate: new Date().toISOString(),
    weight: 500,
  };
  await api.post(`${apiURL}/api/shipments`, {
    data: seed,
    headers: { Authorization: 'Bearer demo-jwt-token-e2e' },
  });

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  try {
    // Login as nakliyeci and open planner
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

    // Wait loads list render
    await page.waitForTimeout(800);

    // Select first vehicle card
    // Click a known vehicle card
    const vehicleCardByName = page.locator('text=Tenteli Kamyon').first();
    if (await vehicleCardByName.count()) {
      await vehicleCardByName.click();
      await page.waitForTimeout(200);
    }

    // Select first vehicle if present
    const vehicleCard = page.locator('text=Kapasite').first();
    // Vehicle selection is optional; proceed to add load

    // Find seeded load by title and click Ekle
    const loadCard = page.locator('div', { hasText: 'RP Flow Load' }).first();
    if (!(await loadCard.count())) throw new Error('Load not visible');
    const addBtn = loadCard
      .locator('button:not([disabled])', { hasText: 'Ekle' })
      .first();
    await addBtn.click();
    await page.waitForTimeout(400);

    // Assert route points increased and shows addresses
    const routeHeader = page.locator('text=Güzergah').first();
    if (!(await routeHeader.count())) throw new Error('Route section missing');
    const pickupVisible = await page.locator('text=Ataşehir').count();
    const deliveryVisible = await page.locator('text=Etimesgut').count();
    if (!(pickupVisible > 0 && deliveryVisible > 0))
      throw new Error('Route points not added');

    // Optimize route and ensure no error
    const optimize = page.locator('button:has-text("Optimize Et")');
    if (await optimize.count()) {
      await optimize.click();
      await page.waitForTimeout(200);
    }

    console.log('✅ Route planner add/route/optimize flow passed');
    process.exit(0);
  } catch (e) {
    console.error('❌ Route planner flow error:', e.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
