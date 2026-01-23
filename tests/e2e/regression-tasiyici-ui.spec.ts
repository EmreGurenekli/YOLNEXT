import { test, expect } from '@playwright/test';
import { attachApiFailureGuard, authedContext, buildStorage, demoLogin, getApiOrigin } from './_helpers';

function getWebOrigin(): string {
  const raw = (process.env.TEST_WEB_URL && String(process.env.TEST_WEB_URL)) || 'http://localhost:5173';
  return raw.replace(/\/$/, '');
}

test.describe('Regression: tasiyici UI status flow', () => {
  test('ActiveJobs status transitions: picked_up -> in_transit -> delivered', async ({ request, browser }) => {
    const apiOrigin = getApiOrigin();
    const webOrigin = getWebOrigin();

    const corporate = await demoLogin(request, apiOrigin, 'corporate');
    const nakliyeci = await demoLogin(request, apiOrigin, 'nakliyeci');
    const tasiyici = await demoLogin(request, apiOrigin, 'tasiyici');

    // --- Setup shipment + accepted offer ---
    const shipRes = await request.post(`${apiOrigin}/api/shipments`, {
      headers: { Authorization: `Bearer ${corporate.token}` },
      data: {
        title: 'Tasiyici UI Regression Shipment',
        pickupCity: 'Istanbul',
        pickupAddress: 'Kadikoy',
        deliveryCity: 'Ankara',
        deliveryAddress: 'Cankaya',
        weight: 1,
        volume: 1,
        specialRequirements: '',
      },
    });
    expect(shipRes.ok()).toBeTruthy();
    const shipJson: any = await shipRes.json();
    const shipmentId = shipJson?.data?.shipment?.id || shipJson?.data?.id || shipJson?.id;
    expect(shipmentId).toBeTruthy();

    const offerRes = await request.post(`${apiOrigin}/api/offers`, {
      headers: { Authorization: `Bearer ${nakliyeci.token}` },
      data: { shipmentId, price: 150, message: 'Offer for tasiyici ui test', estimatedDelivery: 2 },
    });
    expect(offerRes.ok()).toBeTruthy();
    const offerJson: any = await offerRes.json();
    const offerId = offerJson?.data?.offer?.id || offerJson?.data?.id || offerJson?.offer?.id || offerJson?.id;
    expect(offerId).toBeTruthy();

    const acceptRes = await request.post(`${apiOrigin}/api/offers/${offerId}/accept`, {
      headers: { Authorization: `Bearer ${corporate.token}` },
    });
    expect(acceptRes.ok()).toBeTruthy();

    // Some datasets don't populate shipments.nakliyeci_id on accept; demo-only helper forces it.
    const forceAssign = await request.post(`${apiOrigin}/api/shipments/${shipmentId}/demo-force-assign-carrier`, {
      headers: { Authorization: `Bearer ${nakliyeci.token}` },
    });
    expect(forceAssign.ok()).toBeTruthy();

    // --- Link driver and assign to shipment (nakliyeci) ---
    const linkDriver = await request.post(`${apiOrigin}/api/drivers/link`, {
      headers: { Authorization: `Bearer ${nakliyeci.token}` },
      data: { identifier: tasiyici.user?.email },
    });
    expect([200, 201]).toContain(linkDriver.status());

    const assignDriver = await request.post(`${apiOrigin}/api/shipments/${shipmentId}/assign-driver`, {
      headers: { Authorization: `Bearer ${nakliyeci.token}` },
      data: { driverId: tasiyici.user?.id },
    });
    expect(assignDriver.ok()).toBeTruthy();

    // Wait until the shipment detail reflects an operational state for the driver.
    // Some schemas use a fallback assignment table and/or async status updates.
    let lastStatus: any = null;
    for (let i = 0; i < 30; i++) {
      const detRes = await request.get(`${apiOrigin}/api/shipments/${shipmentId}`, {
        headers: { Authorization: `Bearer ${tasiyici.token}` },
      });
      if (detRes.ok()) {
        const detJson: any = await detRes.json().catch(() => null);
        lastStatus = detJson?.data?.status ?? detJson?.shipment?.status ?? detJson?.status;
        if (lastStatus === 'assigned' || lastStatus === 'in_progress') break;
      }
      await new Promise(r => setTimeout(r, 500));
    }
    expect(['assigned', 'in_progress']).toContain(String(lastStatus));

    // --- UI flow (tasiyici) ---
    const context = await authedContext(browser, buildStorage(tasiyici, 'tasiyici'));
    const page = await context.newPage();
    const guard = attachApiFailureGuard(page);

    // Wait until backend reflects the assignment in the tasiyici list.
    // Some deployments use a fallback assignment table and may be slightly eventually consistent.
    for (let i = 0; i < 20; i++) {
      const listRes = await request.get(`${apiOrigin}/api/shipments/tasiyici`, {
        headers: { Authorization: `Bearer ${tasiyici.token}` },
      });
      if (listRes.ok()) {
        const listJson: any = await listRes.json().catch(() => null);
        const rows = (Array.isArray(listJson) ? listJson : listJson?.data || listJson?.shipments || []) as any[];
        if (rows.some(r => String(r?.id) === String(shipmentId))) break;
      }
      await new Promise(r => setTimeout(r, 500));
    }

    await page.goto(`${webOrigin}/tasiyici/jobs/${shipmentId}`, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(new RegExp(`/tasiyici/jobs/${shipmentId}\\b`));

    await page.waitForLoadState('networkidle');

    // Ensure actions are available before trying status transitions.
    await expect(page.getByRole('button', { name: /Yükü Aldım/i })).toBeVisible({ timeout: 30000 });

    // Status transitions
    await page.getByRole('button', { name: /Yükü Aldım/i }).click({ timeout: 20000 });
    await expect(page.getByText('Yük Alındı')).toBeVisible({ timeout: 15000 });

    await page.getByRole('button', { name: /Yola Çıktım/i }).click({ timeout: 20000 });
    await expect(page.getByText('Yolda')).toBeVisible({ timeout: 15000 });

    await page.getByRole('button', { name: /Teslimat/i }).click({ timeout: 20000 });
    await expect(page.getByText('Teslim Edildi')).toBeVisible({ timeout: 15000 });

    // Owner confirms delivery (moves to completed)
    const confirm = await request.post(`${apiOrigin}/api/shipments/${shipmentId}/confirm-delivery`, {
      headers: { Authorization: `Bearer ${corporate.token}` },
    });
    expect(confirm.ok()).toBeTruthy();

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Tamamlandı')).toBeVisible({ timeout: 15000 });

    await guard.assertNoApiFailures();
    await context.close();
  });
});
