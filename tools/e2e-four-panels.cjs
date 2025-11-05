const { chromium, request } = require('playwright');

(async () => {
  const baseURL = process.env.BASE_URL || 'http://localhost:5173';
  const apiURL = process.env.API_URL || 'http://localhost:5000';
  const browser = await chromium.launch({ headless: true });
  const api = await request.newContext();

  const title = `E2E Flow ${Date.now()}`;
  try {
    // 1) Individual creates shipment (API)
    const create = await api.post(`${apiURL}/api/shipments`, {
      data: {
        title,
        description: 'Flow test shipment',
        pickupAddress: 'Kadıköy, İstanbul',
        deliveryAddress: 'Çankaya, Ankara',
        pickupDate: new Date(Date.now() + 3600_000).toISOString(),
        weight: 200,
        price: 1500,
      },
      headers: {
        Authorization: 'Bearer demo-jwt-token-e2e',
        'X-User-Id': '1', // Individual user ID
      },
    });
    if (!create.ok()) {
      const errorText = await create.text();
      throw new Error(
        `create shipment failed: ${create.status()} ${errorText}`
      );
    }
    const created = await create.json();
    const shipmentId = created.data?.id || created.data?.shipment?.id;
    if (!shipmentId) {
      throw new Error('No shipment ID in response: ' + JSON.stringify(created));
    }

    // 2) Nakliyeci sees job and submits offer
    const nakCtx = await browser.newContext();
    const nakPage = await nakCtx.newPage();
    await nakPage.goto(`${baseURL}/login`, { waitUntil: 'networkidle' });
    const nakBtn = nakPage.locator('[data-testid="demo-nakliyeci"]');
    if (await nakBtn.count()) {
      await nakBtn.click();
    }
    await nakPage.goto(`${baseURL}/nakliyeci/jobs`, {
      waitUntil: 'networkidle',
    });
    await nakPage.waitForTimeout(500);
    // Submit offer via API to keep flow stable
    const offerResp = await api.post(`${apiURL}/api/offers`, {
      data: { shipmentId, price: 1800, message: 'Teslim 1 gün' },
      headers: {
        Authorization: 'Bearer demo-jwt-token-e2e',
        'X-User-Id': '3', // Nakliyeci user ID
      },
    });
    if (!offerResp.ok()) {
      const errorText = await offerResp.text();
      throw new Error(
        `offer create failed: ${offerResp.status()} ${errorText}`
      );
    }
    const offer = await offerResp.json();
    const offerId = offer.data?.id || offer.data?.offer?.id;
    if (!offerId) {
      throw new Error('No offer ID in response: ' + JSON.stringify(offer));
    }

    // 3) Gönderici reviews offers and accepts one
    const gndrCtx = await browser.newContext();
    const gndrPage = await gndrCtx.newPage();
    await gndrPage.goto(`${baseURL}/login`, { waitUntil: 'networkidle' });
    const indBtn = gndrPage.locator('[data-testid="demo-individual"]');
    if (await indBtn.count()) {
      await indBtn.click();
    }
    // Accept via API for stability
    const accept = await api.put(`${apiURL}/api/offers/${offerId}/accept`);
    if (!accept.ok()) throw new Error('offer accept failed');

    // 4) Taşıyıcı sees accepted job (navigate dashboard/messages as smoke)
    const tsyCtx = await browser.newContext();
    const tsyPage = await tsyCtx.newPage();
    await tsyPage.goto(`${baseURL}/login`, { waitUntil: 'networkidle' });
    const tsyBtn = tsyPage.locator('[data-testid="demo-tasiyici"]');
    if (await tsyBtn.count()) {
      await tsyBtn.click();
    }
    await tsyPage.goto(`${baseURL}/tasiyici/dashboard`, {
      waitUntil: 'networkidle',
    });
    await tsyPage.waitForTimeout(500);

    console.log('✅ 4-panels real-data flow completed');
    process.exit(0);
  } catch (e) {
    console.error('❌ Flow error:', e.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
