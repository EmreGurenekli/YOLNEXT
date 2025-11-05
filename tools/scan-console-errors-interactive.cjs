const { chromium } = require('playwright');

(async () => {
  const baseURL = process.env.BASE_URL || 'http://localhost:5173';

  const roleToRoutes = {
    individual: [
      '/individual/dashboard',
      '/individual/create-shipment',
      '/individual/my-shipments',
      '/messages',
      '/individual/profile',
      '/individual/notifications',
    ],
    corporate: [
      '/corporate/dashboard',
      '/corporate/create-shipment',
      '/offers',
      '/messages',
      '/corporate/discounts',
    ],
    nakliyeci: [
      '/nakliyeci/shipments',
      '/nakliyeci/open-shipments',
      '/nakliyeci/offers',
      '/nakliyeci/offer-shipment',
      '/nakliyeci/jobs',
    ],
    tasiyici: [
      '/tasiyici/dashboard',
      '/tasiyici/shipments',
      '/tasiyici/messages',
      '/tasiyici/profile',
    ],
  };

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const allFindings = [];

  async function loginAs(role) {
    const consoleEvents = [];
    const pageErrors = [];
    const off1 = page.on('console', msg => {
      if (['error', 'warning'].includes(msg.type())) {
        consoleEvents.push({ type: msg.type(), text: msg.text() });
      }
    });
    const off2 = page.on('pageerror', err => {
      pageErrors.push({ type: 'pageerror', text: err.message });
    });
    try {
      await page.goto(`${baseURL}/login`, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });
      const btn = page.locator(`[data-testid="demo-${role}"]`);
      if ((await btn.count()) === 0) {
        return {
          success: false,
          error: 'Demo button not found',
          consoleEvents,
          pageErrors,
        };
      }
      await btn.click();
      await page.waitForTimeout(1500);
      // Heuristic: dashboard URL includes role path or generic /dashboard
      const ok = /dashboard|individual|corporate|nakliyeci|tasiyici/.test(
        page.url()
      );
      return { success: ok, consoleEvents, pageErrors };
    } catch (e) {
      return { success: false, error: e.message, consoleEvents, pageErrors };
    }
  }

  async function scanRoute(route) {
    const consoleEvents = [];
    const pageErrors = [];
    const on1 = page.on('console', msg => {
      if (['error', 'warning'].includes(msg.type())) {
        consoleEvents.push({ type: msg.type(), text: msg.text() });
      }
    });
    const on2 = page.on('pageerror', err => {
      pageErrors.push({ type: 'pageerror', text: err.message });
    });
    try {
      const start = Date.now();
      await page.goto(`${baseURL}${route}`, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });
      await page.waitForTimeout(1000);
      const loadMs = Date.now() - start;
      return { route, status: 'ok', loadMs, consoleEvents, pageErrors };
    } catch (e) {
      return {
        route,
        status: 'fail',
        error: e.message,
        consoleEvents,
        pageErrors,
      };
    }
  }

  for (const role of Object.keys(roleToRoutes)) {
    const loginResult = await loginAs(role);
    allFindings.push({ section: `login:${role}`, ...loginResult });
    for (const r of roleToRoutes[role]) {
      const res = await scanRoute(r);
      allFindings.push({ section: `${role}`, ...res });
    }
  }

  // Output
  const fmt = s => (s || '').replace(/\n/g, ' \\n');
  let totals = { errors: 0, warnings: 0, pageErrors: 0 };
  console.log('========== Interactive Console Error Scan ==========');
  for (const f of allFindings) {
    const eCount = (f.consoleEvents || []).filter(
      e => e.type === 'error'
    ).length;
    const wCount = (f.consoleEvents || []).filter(
      e => e.type === 'warning'
    ).length;
    const pCount = (f.pageErrors || []).length;
    totals.errors += eCount;
    totals.warnings += wCount;
    totals.pageErrors += pCount;
    const label = f.section ? `[${f.section}]` : '';
    const status = f.status || (f.success ? 'ok' : 'fail');
    console.log(
      `\n${label} ${f.route || 'login'} -> ${status.toUpperCase()} (${f.loadMs ?? '-'} ms)`
    );
    if (f.error) console.log(`  error: ${fmt(f.error)}`);
    if (pCount) {
      console.log(`  pageErrors (${pCount}):`);
      f.pageErrors
        .slice(0, 10)
        .forEach((e, i) => console.log(`    ${i + 1}. ${fmt(e.text)}`));
    }
    if (eCount) {
      console.log(`  consoleErrors (${eCount}):`);
      f.consoleEvents
        .filter(e => e.type === 'error')
        .slice(0, 10)
        .forEach((e, i) => console.log(`    ${i + 1}. ${fmt(e.text)}`));
    }
    if (wCount) {
      console.log(`  consoleWarnings (${wCount}):`);
      f.consoleEvents
        .filter(e => e.type === 'warning')
        .slice(0, 10)
        .forEach((e, i) => console.log(`    ${i + 1}. ${fmt(e.text)}`));
    }
  }
  console.log('\n================ Totals ================');
  console.log(`Console Errors: ${totals.errors}`);
  console.log(`Console Warnings: ${totals.warnings}`);
  console.log(`Page Errors: ${totals.pageErrors}`);

  await context.close();
  await browser.close();
})();
