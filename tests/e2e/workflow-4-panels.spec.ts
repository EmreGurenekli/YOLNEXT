import { test, expect, BrowserContext, Page, APIRequestContext } from '@playwright/test';

function getApiOrigin(): string {
  const raw =
    (process.env.TEST_API_URL && String(process.env.TEST_API_URL)) ||
    (process.env.VITE_API_URL && String(process.env.VITE_API_URL)) ||
    'http://localhost:5000';
  return raw.replace(/\/$/, '').replace(/\/api$/, '');
}

type DemoLoginResult = { token: string; user: any };

async function demoLogin(request: APIRequestContext, apiOrigin: string, panelType: string): Promise<DemoLoginResult> {
  const resp = await request.post(`${apiOrigin}/api/auth/demo-login`, {
    data: { panelType },
  });
  expect(resp.ok()).toBeTruthy();
  const json: any = await resp.json();
  const token = json?.data?.token || json?.token;
  const user = json?.data?.user || json?.user;
  expect(token).toBeTruthy();
  return { token: String(token), user };
}

function attachApiFailureGuards(page: Page) {
  const failures: { url: string; status: number }[] = [];
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on('response', (resp) => {
    try {
      const url = resp.url();
      if (!url.includes('/api/')) return;
      const status = resp.status();
      // ignore cache hits
      if (status === 304) return;
      if (status >= 400) failures.push({ url, status });
    } catch (_) {
      // ignore
    }
  });

  page.on('pageerror', (err) => {
    pageErrors.push(String(err?.message || err));
  });

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  return {
    assertNoApiFailures: async () => {
      // allow late network to settle
      await page.waitForTimeout(500);
      const hard = failures.filter(f => !f.url.includes('/api/health'));
      expect(
        hard,
        JSON.stringify({ apiFailures: hard, consoleErrors, pageErrors }, null, 2)
      ).toEqual([]);
    },
  };
}

async function buildStorageState(login: DemoLoginResult, fallbackRole: string) {
  const user = login.user || {};
  const mapped = {
    id: String(user?.id ?? user?.userId ?? user?.user_id ?? 'demo'),
    fullName: user?.fullName || user?.name || 'Demo User',
    email: user?.email || `demo.${fallbackRole}@yolnext.com`,
    role: user?.role || user?.panel_type || user?.userType || fallbackRole,
    isVerified: true,
  };

  return {
    authToken: login.token,
    token: login.token,
    user: JSON.stringify(mapped),
  };
}

async function authedContext(browser: any, storage: { authToken: string; token: string; user: string }) {
  const context: BrowserContext = await browser.newContext();
  await context.addInitScript(({ storage }) => {
    try {
      localStorage.setItem('authToken', storage.authToken);
      localStorage.setItem('token', storage.token);
      localStorage.setItem('user', storage.user);
    } catch (_) {
      // ignore
    }
  }, { storage });
  return context;
}

test.describe('4-panel comprehensive workflow (API-driven + UI navigation)', () => {
  test.use({ baseURL: process.env.TEST_URL || 'http://localhost:5173' });

  test('individual + corporate + nakliyeci + tasiyici core flows', async ({ browser, request }) => {
    const apiOrigin = getApiOrigin();

    // --- Individual ---
    const indLogin = await demoLogin(request, apiOrigin, 'individual');
    const indStorage = await buildStorageState(indLogin, 'individual');
    const indCtx = await authedContext(browser, indStorage);
    const indPage = await indCtx.newPage();
    const indGuards = attachApiFailureGuards(indPage);

    await indPage.goto('/individual/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(indPage).not.toHaveURL(/\/login/);

    await indPage.goto('/individual/create-shipment', { waitUntil: 'domcontentloaded' });
    await expect(indPage).toHaveURL(/\/individual\/create-shipment/);

    // Create a shipment via API (reliable, not selector-based)
    const indShipmentResp = await request.post(`${apiOrigin}/api/shipments`, {
      headers: { Authorization: `Bearer ${indLogin.token}` },
      data: {
        title: '4-Panel Flow Individual Shipment',
        pickupCity: 'Istanbul',
        pickupAddress: 'Kadikoy',
        deliveryCity: 'Ankara',
        deliveryAddress: 'Cankaya',
        weight: 1,
        volume: 1,
        specialRequirements: '',
      },
    });
    expect(indShipmentResp.ok()).toBeTruthy();
    const indShipJson: any = await indShipmentResp.json();
    const indShipmentId = indShipJson?.data?.shipment?.id || indShipJson?.data?.id || indShipJson?.id;
    expect(indShipmentId).toBeTruthy();

    // Make sure shipments list endpoints work
    const indShipList = await request.get(`${apiOrigin}/api/shipments`, {
      headers: { Authorization: `Bearer ${indLogin.token}` },
    });
    expect(indShipList.ok()).toBeTruthy();

    await indGuards.assertNoApiFailures();
    await indCtx.close();

    // --- Corporate ---
    const corpLogin = await demoLogin(request, apiOrigin, 'corporate');
    const corpStorage = await buildStorageState(corpLogin, 'corporate');
    const corpCtx = await authedContext(browser, corpStorage);
    const corpPage = await corpCtx.newPage();
    const corpGuards = attachApiFailureGuards(corpPage);

    await corpPage.goto('/corporate/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(corpPage).not.toHaveURL(/\/login/);

    await corpPage.goto('/corporate/create-shipment', { waitUntil: 'domcontentloaded' });
    await expect(corpPage).not.toHaveURL(/\/login/);

    const corpShipmentResp = await request.post(`${apiOrigin}/api/shipments`, {
      headers: { Authorization: `Bearer ${corpLogin.token}` },
      data: {
        title: '4-Panel Flow Corporate Shipment',
        pickupCity: 'Izmir',
        pickupAddress: 'Konak',
        deliveryCity: 'Bursa',
        deliveryAddress: 'Nilufer',
        weight: 2,
        volume: 1,
        specialRequirements: '',
      },
    });
    expect(corpShipmentResp.ok()).toBeTruthy();
    const corpShipJson: any = await corpShipmentResp.json();
    const corpShipmentId = corpShipJson?.data?.shipment?.id || corpShipJson?.data?.id || corpShipJson?.id;
    expect(corpShipmentId).toBeTruthy();

    await corpGuards.assertNoApiFailures();
    await corpCtx.close();

    // --- Nakliyeci (offer flow) ---
    const nakLogin = await demoLogin(request, apiOrigin, 'nakliyeci');
    const nakStorage = await buildStorageState(nakLogin, 'nakliyeci');
    const nakCtx = await authedContext(browser, nakStorage);
    const nakPage = await nakCtx.newPage();
    const nakGuards = attachApiFailureGuards(nakPage);

    await nakPage.goto('/nakliyeci/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(nakPage).not.toHaveURL(/\/login/);

    // open shipments page (best-effort route)
    await nakPage.goto('/nakliyeci/open-shipments', { waitUntil: 'domcontentloaded' });
    await expect(nakPage).not.toHaveURL(/\/login/);

    const offerResp = await request.post(`${apiOrigin}/api/offers`, {
      headers: { Authorization: `Bearer ${nakLogin.token}` },
      data: {
        shipmentId: indShipmentId,
        price: 120,
        message: '4-Panel Flow Offer',
        estimatedDelivery: 2,
      },
    });
    expect(offerResp.ok()).toBeTruthy();

    const offersIndRes = await request.get(`${apiOrigin}/api/offers/individual`, {
      headers: { Authorization: `Bearer ${indLogin.token}` },
    });
    expect(offersIndRes.ok()).toBeTruthy();

    await nakGuards.assertNoApiFailures();
    await nakCtx.close();

    // --- Tasiyici ---
    const tasLogin = await demoLogin(request, apiOrigin, 'tasiyici');
    const tasStorage = await buildStorageState(tasLogin, 'tasiyici');
    const tasCtx = await authedContext(browser, tasStorage);
    const tasPage = await tasCtx.newPage();
    const tasGuards = attachApiFailureGuards(tasPage);

    await tasPage.goto('/tasiyici/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(tasPage).not.toHaveURL(/\/login/);

    // jobs/market pages (best-effort)
    await tasPage.goto('/tasiyici/jobs', { waitUntil: 'domcontentloaded' });
    await expect(tasPage).not.toHaveURL(/\/login/);

    await tasPage.goto('/tasiyici/market', { waitUntil: 'domcontentloaded' });
    await expect(tasPage).not.toHaveURL(/\/login/);

    await tasGuards.assertNoApiFailures();
    await tasCtx.close();
  });
});
