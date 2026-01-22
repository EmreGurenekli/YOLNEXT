const { chromium } = require('playwright');

(async () => {
  const baseURL = process.env.BASE_URL || 'http://localhost:5173';
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Go to login and demo login as nakliyeci
    await page.goto(`${baseURL}/login`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    const demoBtn = page.locator('[data-testid="demo-nakliyeci"]');
    if (await demoBtn.count()) {
      await demoBtn.click();
      await page.waitForTimeout(1000);
    }

    // Navigate to jobs page
    await page.goto(`${baseURL}/nakliyeci/jobs`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    await page.waitForTimeout(800);

    const bodyText = await page.textContent('body');
    const visible =
      /Mobilya Taşıma - Kadıköy|Beyaz Eşya - Beşiktaş|Paletli Yük - Gebze/i.test(
        bodyText || ''
      );
    console.log(
      visible ? '✅ Jobs visible on /nakliyeci/jobs' : '❌ Jobs NOT visible'
    );
    process.exitCode = visible ? 0 : 1;
  } catch (e) {
    console.error('❌ Test error:', e.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
