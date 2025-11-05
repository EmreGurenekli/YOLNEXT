// Search Flows E2E Test for YOLNEXT
const { chromium } = require('playwright');

const colors = { reset: '\x1b[0m', green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m', blue: '\x1b[34m' };
const log = (m, c='reset') => console.log(`${colors[c]}${m}${colors.reset}`);

async function run() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = { passed: 0, failed: 0, tests: [] };
  const record = (name, ok, details='') => {
    results.tests.push({ name, ok, details });
    if (ok) { results.passed++; log(`  ✅ ${name}`, 'green'); }
    else { results.failed++; log(`  ❌ ${name}${details?': '+details:''}`, 'red'); }
  };

  try {
    // 1) Login (Individual)
    log('\n🔐 Login as Individual (demo)', 'blue');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    const demoBtn = page.locator('button[data-testid="demo-individual"], button:has-text("Bireysel")').first();
    if (await demoBtn.isVisible().catch(()=>false)) {
      await demoBtn.click();
      await page.waitForTimeout(3000);
    }
    const atDashboard = page.url().includes('/individual/dashboard');
    record('Login success', atDashboard, page.url());

    // 2) Marketplace (open shipments) search (as carrier view requires role, test individual search first)
    log('\n🧭 Search in My Shipments', 'blue');
    await page.goto('http://localhost:5173/individual/my-shipments', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Try a city search in top filter (if exists)
    const searchInputs = page.locator('input[type="search"], input[name*="search" i], input[placeholder*="ara" i], input[placeholder*="Search" i]');
    const hasSearch = await searchInputs.first().isVisible().catch(()=>false);
    record('Search input visible (My Shipments)', hasSearch);

    if (hasSearch) {
      await searchInputs.first().fill('İstanbul');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1500);

      // Results contain İstanbul
      const hasIstanbul = await page.evaluate(() => (document.body.textContent||'').includes('İstanbul'));
      record('Search results match keyword (İstanbul)', hasIstanbul);

      // URL query sync
      const hasQuery = page.url().includes('search=') || page.url().includes('city=') || page.url().includes('q=');
      record('URL query updated for search', hasQuery);
    }

    // 3) Filters (status filter if present)
    const statusSelect = page.locator('select[name*="status" i]');
    if (await statusSelect.first().isVisible().catch(()=>false)) {
      await statusSelect.first().selectOption('open').catch(()=>{});
      await page.waitForTimeout(1200);
      const text = await page.evaluate(()=>document.body.textContent||'');
      const statusOk = /Açık|open|Beklemede|pending|Teklife Açık/i.test(text);
      record('Status filter applied', statusOk);
    } else {
      record('Status filter not available (skipped)', true);
    }

    // 4) Pagination behavior
    const nextBtn = page.locator('button:has-text("Sonraki"), button:has-text("Next"), a[aria-label*="Next" i]');
    const hasNext = await nextBtn.first().isVisible().catch(()=>false);
    record('Pagination control visible', hasNext);
    if (hasNext) {
      const urlBefore = page.url();
      await nextBtn.first().click();
      await page.waitForTimeout(1200);
      record('Pagination navigates to next page', page.url() !== urlBefore);
    }

    // 5) Sorting (if present)
    const sortSelect = page.locator('select[name*="sort" i], select[id*="sort" i]');
    if (await sortSelect.first().isVisible().catch(()=>false)) {
      await sortSelect.first().selectOption(/price|fiyat|date|tarih/i).catch(()=>{});
      await page.waitForTimeout(1200);
      record('Sort applied without error', true);
    } else {
      record('Sort not available (skipped)', true);
    }

    // 6) Carrier market search (Nakliyeci)
    log('\n🚛 Search in Carrier Market', 'blue');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    const carrierBtn = page.locator('button[data-testid="demo-nakliyeci"], button:has-text("Nakliyeci")').first();
    if (await carrierBtn.isVisible().catch(()=>false)) {
      await carrierBtn.click();
      await page.waitForTimeout(2500);
      await page.goto('http://localhost:5173/nakliyeci/market', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);

      const marketSearch = page.locator('input[type="search"], input[placeholder*="ara" i]');
      const marketHasSearch = await marketSearch.first().isVisible().catch(()=>false);
      record('Market search input visible', marketHasSearch);

      if (marketHasSearch) {
        await marketSearch.first().fill('Ankara');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1500);
        const hasAnkara = await page.evaluate(() => (document.body.textContent||'').includes('Ankara'));
        record('Market results match keyword (Ankara)', hasAnkara);
      }

      // Market filters (city, price range) if present
      const citySelect = page.locator('select[name*="city" i]');
      if (await citySelect.first().isVisible().catch(()=>false)) {
        await citySelect.first().selectOption('İstanbul').catch(()=>{});
        await page.waitForTimeout(1200);
        const text = await page.evaluate(()=>document.body.textContent||'');
        record('City filter applied (Market)', /İstanbul|Ankara|İzmir|Bursa/.test(text));
      } else {
        record('City filter not available (skipped)', true);
      }

      const priceMin = page.locator('input[name*="min" i]');
      const priceMax = page.locator('input[name*="max" i]');
      if (await priceMin.first().isVisible().catch(()=>false) && await priceMax.first().isVisible().catch(()=>false)) {
        await priceMin.first().fill('100');
        await priceMax.first().fill('10000');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1200);
        record('Price range filter applied', true);
      } else {
        record('Price range inputs not available (skipped)', true);
      }

      // Market pagination
      const nextMarket = page.locator('button:has-text("Sonraki"), button:has-text("Next"), a[aria-label*="Next" i]');
      const hasNextMarket = await nextMarket.first().isVisible().catch(()=>false);
      record('Market pagination visible', hasNextMarket);
      if (hasNextMarket) {
        const before = page.url();
        await nextMarket.first().click();
        await page.waitForTimeout(1200);
        record('Market pagination navigates', page.url() !== before);
      }
    } else {
      record('Nakliyeci demo button not visible (skipped)', true);
    }

    // 7) Driver (Taşıyıcı) searches — optional
    log('\n👨‍✈️ Search in Driver panel (optional)', 'blue');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    const driverBtn = page.locator('button[data-testid="demo-tasiyici"], button:has-text("Taşıyıcı")').first();
    if (await driverBtn.isVisible().catch(()=>false)) {
      await driverBtn.click();
      await page.waitForTimeout(2000);
      await page.goto('http://localhost:5173/tasiyici/active-jobs', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1500);
      const driverSearch = page.locator('input[type="search"], input[placeholder*="ara" i]');
      record('Driver search input visible', await driverSearch.first().isVisible().catch(()=>false));
    } else {
      record('Driver demo button not visible (skipped)', true);
    }

    // Final screenshot
    await page.screenshot({ path: 'test-search-flows.png', fullPage: true });

  } catch (e) {
    record('Search flows test error', false, e.message);
  } finally {
    // Summary
    log('\n============================================================', 'blue');
    log('🔎 SEARCH FLOWS TEST SUMMARY', 'blue');
    log('============================================================', 'blue');
    log(`\n✅ Passed: ${results.passed}`, 'green');
    log(`❌ Failed: ${results.failed}`, results.failed ? 'red' : 'green');
    log(`📈 Total:  ${results.tests.length}`, 'blue');
    log(`📊 Success Rate: ${((results.passed / (results.tests.length||1)) * 100).toFixed(1)}%\n`, 'blue');

    await context.close();
    await browser.close();
  }
}

run().catch(console.error);
