import { test, expect, APIRequestContext, BrowserContext, Page } from '@playwright/test';

function getApiOrigin(): string {
  const raw =
    (process.env.TEST_API_URL && String(process.env.TEST_API_URL)) ||
    (process.env.VITE_API_URL && String(process.env.VITE_API_URL)) ||
    'http://localhost:5000';
  return raw.replace(/\/$/, '').replace(/\/api$/, '');
}

type DemoLoginResult = { token: string; user: any };

async function demoLogin(request: APIRequestContext, apiOrigin: string, panelType: string): Promise<DemoLoginResult> {
  const resp = await request.post(`${apiOrigin}/api/auth/demo-login`, { data: { panelType } });
  expect(resp.ok()).toBeTruthy();
  const json: any = await resp.json();
  const token = json?.data?.token || json?.token;
  const user = json?.data?.user || json?.user;
  expect(token).toBeTruthy();
  return { token: String(token), user };
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

test.describe('Nakliyeciye Özel İlan - Görünürlük', () => {
  test.use({ baseURL: process.env.TEST_URL || 'http://localhost:4173' });

  test('Corporate creates specific shipment -> Nakliyeci sees it in Jobs', async ({ browser, request }) => {
    const apiOrigin = getApiOrigin();

    const corpLogin = await demoLogin(request, apiOrigin, 'corporate');
    const nakLogin = await demoLogin(request, apiOrigin, 'nakliyeci');

    const nakUserId = nakLogin.user?.id ?? nakLogin.user?.userId ?? nakLogin.user?.user_id;
    expect(nakUserId).toBeTruthy();

    const uniq = `PW-EXCL-${Date.now()}`;

    const createResp = await request.post(`${apiOrigin}/api/shipments`, {
      headers: { Authorization: `Bearer ${corpLogin.token}` },
      data: {
        title: `AUTO ${uniq}`,
        description: uniq,
        category: 'general',
        pickupCity: 'Istanbul',
        pickupAddress: `Test pickup ${uniq}`,
        deliveryCity: 'Ankara',
        deliveryAddress: `Test delivery ${uniq}`,
        publishType: 'specific',
        targetNakliyeciId: String(nakUserId),
      },
    });

    expect(createResp.ok()).toBeTruthy();
    const createdJson: any = await createResp.json();
    const createdId = createdJson?.data?.shipment?.id || createdJson?.data?.id || createdJson?.id;
    expect(createdId).toBeTruthy();

    const nakStorage = {
      authToken: nakLogin.token,
      token: nakLogin.token,
      user: JSON.stringify({
        id: String(nakUserId),
        fullName: nakLogin.user?.fullName || nakLogin.user?.name || 'Demo Nakliyeci',
        email: nakLogin.user?.email || 'demo.nakliyeci@yolnext.com',
        role: nakLogin.user?.role || nakLogin.user?.panel_type || 'nakliyeci',
        isVerified: true,
      }),
    };

    const ctx = await authedContext(browser, nakStorage);
    const page: Page = await ctx.newPage();

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        // surface frontend errors in test logs
        console.error('[browser console error]', msg.text());
      }
    });

    await page.goto('/nakliyeci/jobs', { waitUntil: 'domcontentloaded' });
    await expect(page).not.toHaveURL(/\/login/);

    // Ensure the created listing is present on the Jobs page.
    // We search by unique description since the card title may render the route instead of the shipment title.
    await expect(page.locator(`text=${uniq}`).first()).toBeVisible({ timeout: 15000 });

    // Optional: premium badge should be visible for exclusive listing
    await expect(page.getByText('Sana Özel').first()).toBeVisible({ timeout: 15000 });

    await ctx.close();
  });
});
