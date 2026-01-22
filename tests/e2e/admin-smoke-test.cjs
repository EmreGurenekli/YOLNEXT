#!/usr/bin/env node
/**
 * Admin UI Smoke Test
 *
 * Goal: Ensure admin pages load and basic critical actions work end-to-end.
 * - Obtains demo admin JWT via /api/auth/demo-login
 * - Opens /admin/flags
 * - Creates a flag via UI
 *
 * Notes:
 * - Keeps assertions minimal to reduce flakiness.
 */

const { chromium } = require('playwright');
const http = require('http');
const { URL } = require('url');

const BASE_URL = process.env.TEST_URL || 'http://localhost:5173';
const API_URL = process.env.API_URL || 'http://localhost:5000';
const ADMIN_SLUG = process.env.ADMIN_SLUG || 'nx-ctrl-7f3k9q2m';
const ADMIN_BASE = `/${ADMIN_SLUG}`;

async function httpJson(method, path, body) {
  const url = new URL(path, API_URL);
  const client = url.protocol === 'https:' ? require('https') : http;

  return new Promise((resolve, reject) => {
    const req = client.request(
      url,
      {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      },
      res => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => {
          let parsed = null;
          try {
            parsed = data ? JSON.parse(data) : null;
          } catch (_) {
            parsed = null;
          }
          resolve({ statusCode: res.statusCode, json: parsed, text: data });
        });
      }
    );

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });

    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function getDemoAdminToken() {
  const resp = await httpJson('POST', '/api/auth/demo-login', { userType: 'admin' });
  if (!resp.json?.success) {
    throw new Error(`demo-login failed: HTTP ${resp.statusCode} ${resp.text?.slice(0, 200)}`);
  }
  const token = resp.json?.data?.token || resp.json?.token;
  const user = resp.json?.data?.user || resp.json?.user;
  if (!token) throw new Error('demo-login did not return token');
  return { token, user };
}

async function run() {
  console.log('\n==============================================================');
  console.log('🧪 ADMIN UI SMOKE TEST');
  console.log('==============================================================');
  console.log(`Frontend: ${BASE_URL}`);
  console.log(`Backend:  ${API_URL}`);

  const { token, user } = await getDemoAdminToken();
  console.log(`✅ Got demo admin token (len=${token.length}) userId=${user?.id || 'n/a'}`);

  const browser = await chromium.launch({ headless: false, slowMo: 250 });
  const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });

  // Preload auth state
  await context.addInitScript(({ token, user }) => {
    const normalizedUser = {
      ...(user || {}),
      role: 'admin',
      userType: 'admin',
    };
    localStorage.setItem('token', token);
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(normalizedUser));
  }, { token, user });

  const page = await context.newPage();

  try {
    // 1) USERS flow: open drawer -> ban -> create flag -> unban
    await page.goto(`${BASE_URL}${ADMIN_BASE}/users`, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Search user 1010 to reduce flakiness
    await page.getByPlaceholder(/email\s*\/\s*telefon\s*\/\s*userId/i).fill('1010');
    // debounce + fetch
    await page.waitForTimeout(1200);

    // Wait for table to render (can be empty)
    await page.locator('table tbody').waitFor({ state: 'visible', timeout: 20000 });

    const emailCellButton = page.locator('table tbody tr td:nth-child(2) button').first();
    const hasUserRow = await emailCellButton.isVisible().catch(() => false);

    if (hasUserRow) {
      // Open drawer by clicking the Email cell button (more stable than matching by name)
      await emailCellButton.click({ timeout: 15000 });

      const drawer = page.locator('div.fixed.inset-0.z-40').locator('div.max-w-xl');
      await drawer.waitFor({ state: 'visible', timeout: 15000 });

      // Click Ban (scoped to drawer)
      await drawer.getByRole('button', { name: /ban/i }).first().click({ timeout: 15000, force: true });
      await page.getByPlaceholder(/sebep yaz/i).fill(`ui-smoke-ban-${Date.now()}`);
      await page.getByRole('button', { name: /onayla/i }).click({ timeout: 15000 });
      await page.getByText(/kullanıcı banlandı/i).waitFor({ timeout: 20000 });

      // Create flag from drawer
      await drawer.getByRole('button', { name: /^flag$/i }).click({ timeout: 15000, force: true });
      await page.getByPlaceholder(/sebep yaz/i).fill(`ui-smoke-flag-${Date.now()}`);
      await page.getByRole('button', { name: /onayla/i }).click({ timeout: 15000 });
      await page.getByText(/flag oluşturuldu/i).waitFor({ timeout: 20000 });

      // Unban
      await drawer.getByRole('button', { name: /aç/i }).first().click({ timeout: 15000, force: true });
      await page.getByPlaceholder(/sebep yaz/i).fill(`ui-smoke-unban-${Date.now()}`);
      await page.getByRole('button', { name: /onayla/i }).click({ timeout: 15000 });
      await page.getByText(/kullanıcı açıldı/i).waitFor({ timeout: 20000 });

      console.log('✅ Admin Users ban/unban + flag flow OK');
    } else {
      console.log('⚠️ Admin Users list empty; skipping ban/unban flow');
    }

    // 2) FLAGS flow: create a flag and see it in table
    await page.goto(`${BASE_URL}${ADMIN_BASE}/flags`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.getByRole('button', { name: /yeni flag/i }).click({ timeout: 15000 });
    const reason = `ui-smoke-${Date.now()}`;
    await page.getByPlaceholder(/örn: userId/i).fill('1010');
    await page.getByPlaceholder(/sebep yaz/i).fill(reason);
    await page.getByRole('button', { name: /^oluştur$/i }).click();
    await page.getByText(/flag oluşturuldu/i).waitFor({ timeout: 15000 });
    await page.getByText(reason).waitFor({ timeout: 15000 });

    console.log('✅ Admin Flags create flow OK');

    console.log('\n✅ ADMIN UI SMOKE PASSED');
    await browser.close();
    process.exit(0);
  } catch (e) {
    console.error('❌ ADMIN UI SMOKE FAILED:', e?.message || e);
    try { await browser.close(); } catch (_) {}
    process.exit(1);
  }
}

if (require.main === module) {
  run();
}
