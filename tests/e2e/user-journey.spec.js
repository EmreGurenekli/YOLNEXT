import { test, expect } from '@playwright/test';

test.describe('YolNext User Journey', () => {
  test('Individual user complete journey', async ({ page }) => {
    // Navigate to landing page
    await page.goto('/');

    // Click demo Individual card
    // Programmatic demo login
    const resp = await page.request.post(
      'http://localhost:5000/api/auth/demo-login',
      { data: { panelType: 'individual' } }
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

    // Wait for dashboard
    await expect(page).toHaveURL(/.*dashboard/);

    // Navigate to create shipment (URL-based to avoid brittle selectors)
    await page.goto('/individual/create-shipment');
    await expect(page).toHaveURL(/\/individual\/create-shipment/);
  });

  test('Nakliyeci user journey', async ({ page }) => {
    // Login as nakliyeci
    const resp2 = await page.request.post(
      'http://localhost:5000/api/auth/demo-login',
      { data: { panelType: 'nakliyeci' } }
    );
    expect(resp2.ok()).toBeTruthy();
    const json2 = await resp2.json();
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
          role: user.panel_type ?? user.userType ?? 'nakliyeci',
          isVerified: true,
        };
        localStorage.setItem('user', JSON.stringify(mapped));
      },
      { token: json2.token, user: json2.user }
    );
    await page.goto('/nakliyeci/dashboard');

    // Navigate to open shipments (URL-based)
    await page.goto('/nakliyeci/open-shipments');
    await expect(page).toHaveURL(/\/nakliyeci\/open-shipments/);

    // Click on a shipment
    await page.click('[data-testid="shipment-card"]:first-child');

    // Make an offer
    await page.fill('input[name="price"]', '120');
    await page.fill('textarea[name="message"]', 'I can handle this shipment');
    await page.click('button:has-text("Teklif Ver")');

    // Verify offer success
    await expect(
      page.locator('text=Teklif başarıyla gönderildi')
    ).toBeVisible();
  });
});
