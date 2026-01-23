import { test, expect } from '@playwright/test';
import { demoLogin, getApiOrigin } from './_helpers';

test.describe('Regression: wallet', () => {
  test('Balance + topup intent/confirm (no real payment)', async ({ request }) => {
    const apiOrigin = getApiOrigin();

    const nakliyeci = await demoLogin(request, apiOrigin, 'nakliyeci');

    const bal = await request.get(`${apiOrigin}/api/wallet/balance`, {
      headers: { Authorization: `Bearer ${nakliyeci.token}` },
    });
    expect(bal.ok()).toBeTruthy();

    const intent = await request.post(`${apiOrigin}/api/wallet/topup/intent`, {
      headers: { Authorization: `Bearer ${nakliyeci.token}` },
      data: { amount: 10 },
    });
    // Can be 200 (allow/review) or 403 (risk block). Both are acceptable but must be well-formed.
    expect([200, 403]).toContain(intent.status());

    const intentJson: any = await intent.json().catch(() => null);
    expect(intentJson).toBeTruthy();

    if (intent.status() === 200) {
      const intentId = intentJson?.data?.intentId || intentJson?.data?.id;
      const provider = intentJson?.data?.provider || 'stripe';
      const providerIntentId = intentJson?.data?.providerIntentId;
      expect(intentId || providerIntentId).toBeTruthy();

      // Confirm endpoint (best-effort): should not crash
      const confirm = await request.post(`${apiOrigin}/api/wallet/topup/confirm`, {
        headers: { Authorization: `Bearer ${nakliyeci.token}` },
        data: {
          provider,
          providerIntentId: providerIntentId || String(intentId),
        },
      });
      expect([200, 400, 409]).toContain(confirm.status());
    }
  });
});
