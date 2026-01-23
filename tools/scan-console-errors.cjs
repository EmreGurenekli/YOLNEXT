const { chromium } = require('playwright');

(async () => {
  const baseURL = process.env.BASE_URL || 'http://localhost:5173';
  const routes = [
    '/',
    '/login',
    '/register',
    // Individual panel
    '/individual/dashboard',
    '/individual/create-shipment',
    '/individual/my-shipments',
    '/individual/messages',
    '/individual/profile',
    '/individual/notifications',
    // Corporate panel
    '/corporate/dashboard',
    '/corporate/create-shipment',
    '/corporate/discounts',
    // Nakliyeci panel
    '/nakliyeci/shipments',
    '/nakliyeci/open-shipments',
    '/nakliyeci/offers',
    '/nakliyeci/offer-shipment',
    // Taşıyıcı panel
    '/tasiyici/dashboard',
    '/tasiyici/shipments',
    '/tasiyici/messages',
    '/tasiyici/profile',
    // Generic pages
    '/offers',
    '/messages',
  ];

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  const summary = [];

  for (const route of routes) {
    const page = await context.newPage();
    const consoleEvents = [];
    const pageErrors = [];

    page.on('console', msg => {
      if (['error', 'warning'].includes(msg.type())) {
        consoleEvents.push({ type: msg.type(), text: msg.text() });
      }
    });
    page.on('pageerror', err => {
      pageErrors.push({ type: 'pageerror', text: err.message });
    });

    try {
      const url = `${baseURL}${route}`;
      const start = Date.now();
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      // Give SPA effects time to settle
      await page.waitForTimeout(1000);
      const loadMs = Date.now() - start;

      summary.push({
        route,
        status: 'ok',
        loadMs,
        consoleErrors: consoleEvents.filter(e => e.type === 'error'),
        consoleWarnings: consoleEvents.filter(e => e.type === 'warning'),
        pageErrors,
      });
    } catch (e) {
      summary.push({
        route,
        status: 'fail',
        error: e.message,
        consoleErrors: consoleEvents.filter(e => e.type === 'error'),
        consoleWarnings: consoleEvents.filter(e => e.type === 'warning'),
        pageErrors,
      });
    } finally {
      await page.close();
    }
  }

  // Pretty print summary
  const fmt = s => s.replace(/\n/g, ' \\n');
  let totalErrors = 0;
  let totalWarnings = 0;
  let totalPageErrors = 0;

  console.log('================ Console Error Scan ================');
  for (const item of summary) {
    const errs = item.consoleErrors.length;
    const warns = item.consoleWarnings.length;
    const pErrs = item.pageErrors.length;
    totalErrors += errs;
    totalWarnings += warns;
    totalPageErrors += pErrs;
    const status = item.status === 'ok' ? 'OK' : 'FAIL';
    console.log(`\n[${status}] ${item.route}  (${item.loadMs ?? '-'} ms)`);
    if (item.error) console.log(`  navError: ${fmt(item.error)}`);
    if (pErrs) {
      console.log(`  pageErrors (${pErrs}):`);
      item.pageErrors
        .slice(0, 10)
        .forEach((e, i) => console.log(`    ${i + 1}. ${fmt(e.text)}`));
    }
    if (errs) {
      console.log(`  consoleErrors (${errs}):`);
      item.consoleErrors
        .slice(0, 10)
        .forEach((e, i) => console.log(`    ${i + 1}. ${fmt(e.text)}`));
    }
    if (warns) {
      console.log(`  consoleWarnings (${warns}):`);
      item.consoleWarnings
        .slice(0, 10)
        .forEach((e, i) => console.log(`    ${i + 1}. ${fmt(e.text)}`));
    }
  }

  console.log('\n================ Totals ================');
  console.log(`Console Errors: ${totalErrors}`);
  console.log(`Console Warnings: ${totalWarnings}`);
  console.log(`Page Errors: ${totalPageErrors}`);

  await context.close();
  await browser.close();
})();
