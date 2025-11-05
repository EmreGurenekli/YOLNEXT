const { chromium, request } = require('playwright');

(async () => {
  const baseURL = process.env.BASE_URL || 'http://localhost:5173';
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  try {
    // Pre-link via API to ensure listing reflects
    const api = await request.newContext();
    await api
      .post('http://localhost:5000/api/drivers/admin/driver-codes', {
        data: {
          code: 'DRV-IST-001',
          name: 'Mehmet Kaya',
          licenseNumber: 'B-IST-001',
        },
      })
      .catch(() => {});
    await api.post('http://localhost:5000/api/drivers/link', {
      data: { code: 'DRV-IST-001' },
      headers: { 'X-User-Id': '3' },
    });

    // Go login and select demo nakliyeci
    await page.goto(`${baseURL}/login`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    const btn = page.locator('[data-testid="demo-nakliyeci"]');
    await btn.waitFor({ state: 'visible', timeout: 15000 });
    await btn.click();

    // Go to drivers page
    await page.goto(`${baseURL}/nakliyeci/drivers`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Wait for list to populate
    await page.waitForTimeout(600);
    const emptyState = page.locator('text=Taşıyıcı bulunamadı');
    const isEmptyVisible = await emptyState.count();
    if (isEmptyVisible > 0)
      throw new Error('Empty state still visible after add');
    // Check there is at least one driver card (by Detay button presence)
    const detailBtn = page.getByRole('button', { name: 'Detay' }).first();
    await detailBtn.waitFor({ state: 'visible', timeout: 10000 });

    console.log('✅ Drivers add-by-code works end-to-end');
    process.exit(0);
  } catch (e) {
    console.error('❌ Drivers add-by-code test failed:', e.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
