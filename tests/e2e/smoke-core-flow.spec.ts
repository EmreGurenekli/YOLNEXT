import { test, expect } from '@playwright/test';

function getApiOrigin(): string {
  const raw =
    (process.env.TEST_API_URL && String(process.env.TEST_API_URL)) ||
    (process.env.VITE_API_URL && String(process.env.VITE_API_URL)) ||
    'http://localhost:5000';
  return raw.replace(/\/$/, '').replace(/\/api$/, '');
}

test.describe('Core smoke flow (API-driven)', () => {
  test.use({ baseURL: process.env.TEST_URL || 'http://localhost:5173' });

  test('demo individual creates shipment, demo nakliyeci creates offer, individual lists offers', async ({ page }) => {
    const apiOrigin = getApiOrigin();

    const demoLogin = async (panelType: string) => {
      const resp = await page.request.post(`${apiOrigin}/api/auth/demo-login`, {
        data: { panelType },
      });
      expect(resp.ok()).toBeTruthy();
      const json: any = await resp.json();
      const token = json?.data?.token || json?.token;
      const user = json?.data?.user || json?.user;
      expect(token).toBeTruthy();
      return { token: String(token), user };
    };

    const individual = await demoLogin('individual');
    const individualToken = individual.token;

    await page.addInitScript(
      ({ token, user }) => {
        try {
          localStorage.setItem('authToken', token);
          localStorage.setItem('token', token);
          const mapped = {
            id: String(user?.id ?? user?.userId ?? user?.user_id ?? 'demo'),
            fullName: user?.fullName || user?.name || 'Demo User',
            email: user?.email || 'demo@test.com',
            role: user?.role || user?.panel_type || user?.userType || 'individual',
            isVerified: true,
          };
          localStorage.setItem('user', JSON.stringify(mapped));
        } catch (_) {
          // ignore
        }
      },
      { token: individualToken, user: individual.user }
    );

    const shipmentResp = await page.request.post(`${apiOrigin}/api/shipments`, {
      headers: { Authorization: `Bearer ${individualToken}` },
      data: {
        title: 'E2E Smoke Shipment',
        pickupCity: 'Istanbul',
        pickupAddress: 'Kadikoy',
        deliveryCity: 'Ankara',
        deliveryAddress: 'Cankaya',
        weight: 1,
        volume: 1,
        specialRequirements: '',
      },
    });
    expect(shipmentResp.ok()).toBeTruthy();
    const shipmentJson: any = await shipmentResp.json();
    const shipmentId =
      shipmentJson?.data?.shipment?.id ||
      shipmentJson?.data?.id ||
      shipmentJson?.shipment?.id ||
      shipmentJson?.id;
    expect(shipmentId).toBeTruthy();

    const nakliyeci = await demoLogin('nakliyeci');
    const nakliyeciToken = nakliyeci.token;
    const offerResp = await page.request.post(`${apiOrigin}/api/offers`, {
      headers: { Authorization: `Bearer ${nakliyeciToken}` },
      data: {
        shipmentId,
        price: 120,
        message: 'E2E smoke offer',
        estimatedDelivery: 2,
      },
    });
    expect(offerResp.ok()).toBeTruthy();

    const offersResp = await page.request.get(`${apiOrigin}/api/offers/individual`, {
      headers: { Authorization: `Bearer ${individualToken}` },
    });
    expect(offersResp.ok()).toBeTruthy();

    await page.goto('/individual/create-shipment');
    await expect(page).toHaveURL(/\/individual\/create-shipment/);
  });
});
