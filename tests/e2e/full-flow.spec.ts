import { test, expect } from '@playwright/test';

function getApiOrigin(): string {
  const raw =
    (process.env.TEST_API_URL && String(process.env.TEST_API_URL)) ||
    (process.env.VITE_API_URL && String(process.env.VITE_API_URL)) ||
    'http://localhost:5000';
  return raw.replace(/\/$/, '').replace(/\/api$/, '');
}

test.describe('YolNext advanced user flow', () => {
  test.use({ baseURL: 'http://localhost:5173' });

  test('homepage → login (demo) → dashboard basic smoke', async ({ page }) => {
    // Home
    await page.goto('/');
    await expect(page).toHaveTitle(/YolNext|Kargo|Lojistik/i);

    // Programmatic demo login to avoid flakiness
    const apiOrigin = getApiOrigin();
    const resp = await page.request.post(
      `${apiOrigin}/api/auth/demo-login`,
      {
        data: { panelType: 'individual' },
      }
    );
    expect(resp.ok()).toBeTruthy();
    const json = await resp.json();
    await page.addInitScript(
      ({ token, user }) => {
        localStorage.setItem('authToken', token);
        const mapped = {
          id:
            user.id && user.id.toString
              ? user.id.toString()
              : String(user.id ?? 'demo'),
          fullName:
            user.name ??
            `${user.firstName ?? 'Demo'} ${user.lastName ?? ''}`.trim(),
          email: user.email,
          role: user.panel_type ?? user.userType ?? 'individual',
          isVerified: true,
        };
        localStorage.setItem('user', JSON.stringify(mapped));
      },
      { token: json.token, user: json.user }
    );
    await page.goto('/individual/dashboard');
    await expect(page).toHaveURL(/\/individual\//, { timeout: 10000 });

    // Core panels links smoke (best-effort)
    // Try navigate to create-shipment if exists
    await page.goto('/individual/create-shipment');
    // Validate page loaded via URL (avoid brittle selectors)
    await expect(page).toHaveURL(/\/individual\/create-shipment/, {
      timeout: 10000,
    });

    // Offers/messages pages (generic checks)
    await page.goto('/offers');
    await expect(page).toHaveURL(/\/offers$/, { timeout: 10000 });

    await page.goto('/messages');
    await expect(page).toHaveURL(/\/messages$/, { timeout: 10000 });
  });
});
