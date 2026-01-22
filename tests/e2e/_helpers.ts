import { APIRequestContext, Browser, BrowserContext, Page, expect } from '@playwright/test';

export function getApiOrigin(): string {
  const raw =
    (process.env.TEST_API_URL && String(process.env.TEST_API_URL)) ||
    (process.env.VITE_API_URL && String(process.env.VITE_API_URL)) ||
    'http://127.0.0.1:5000';
  return raw.replace(/\/$/, '').replace(/\/api$/, '');
}

export type DemoLoginResult = { token: string; user: any };

export async function demoLogin(request: APIRequestContext, apiOrigin: string, panelType: string): Promise<DemoLoginResult> {
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

export function buildStorage(login: DemoLoginResult, fallbackRole: string) {
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

export async function authedContext(browser: Browser, storage: { authToken: string; token: string; user: string }): Promise<BrowserContext> {
  const context = await browser.newContext();
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

export function attachApiFailureGuard(page: Page) {
  const apiFailures: { url: string; status: number }[] = [];

  page.on('response', (resp) => {
    const url = resp.url();
    if (!url.includes('/api/')) return;
    const status = resp.status();
    if (status === 304) return;
    if (status >= 400) apiFailures.push({ url, status });
  });

  return {
    assertNoApiFailures: async () => {
      await page.waitForTimeout(500);
      const hard = apiFailures.filter(f => {
        if (f.url.includes('/api/health')) return false;
        // Some panels may call /api/users/profile during bootstrap; in rare cases it can 404 transiently
        // while still being functional (we assert profile separately in the regression specs).
        if (f.status === 404 && f.url.includes('/api/users/profile')) return false;
        return true;
      });
      expect(hard, JSON.stringify(hard, null, 2)).toEqual([]);
    },
  };
}
