const { chromium, request } = require('playwright');

(async () => {
  const baseURL = process.env.BASE_URL || 'http://localhost:5173';
  const apiURL = process.env.API_URL || 'http://localhost:5000';
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const api = await request.newContext();

  const title = `E2E Gönderi ${Date.now()}`;
  // Create a shipment via API (pending)
  const createResp = await api.post(`${apiURL}/api/shipments`, {
    data: {
      title,
      description: 'E2E test gönderisi',
      pickupAddress: 'Üsküdar, İstanbul',
      deliveryAddress: 'Bornova, İzmir',
      pickupDate: new Date(Date.now() + 3600_000).toISOString(),
      weight: 100,
      price: 1234,
    },
    headers: { Authorization: 'Bearer demo-jwt-token-e2e' },
  });
  if (!createResp.ok()) {
    console.error('❌ Gönderi oluşturma başarısız', createResp.status());
    process.exit(1);
  }

  const page = await context.newPage();
  try {
    await page.goto(`${baseURL}/login`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    const demoBtn = page.locator('[data-testid="demo-nakliyeci"]');
    if (await demoBtn.count()) {
      await demoBtn.click();
      await page.waitForTimeout(800);
    }
    await page.goto(`${baseURL}/nakliyeci/jobs`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    await page.waitForTimeout(800);
    const found = await page.locator(`text=${title}`).count();
    if (found > 0) {
      console.log('✅ Gerçek veriden oluşturulan gönderi ilanlarda görünüyor');
      process.exit(0);
    } else {
      console.error('❌ Gönderi ilanlarda görünmüyor');
      process.exit(1);
    }
  } catch (e) {
    console.error('❌ Test hatası:', e.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
