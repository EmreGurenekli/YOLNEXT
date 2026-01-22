import { test, expect } from '@playwright/test';
import { demoLogin } from './utils/auth';

const panels = ['individual', 'corporate', 'nakliyeci', 'tasiyici'] as const;

test.describe('Matrix user scenarios (smoke per panel)', () => {
  test.use({ baseURL: 'http://localhost:5173' });

  for (const panel of panels) {
    test(`${panel} → dashboard smoke`, async ({ page, request }) => {
      await demoLogin(request, page, panel);
      await page.goto(`/${panel}/dashboard`);
      await expect(page).toHaveURL(new RegExp(`/${panel}/`));
    });

    test(`${panel} → navigation smoke`, async ({ page, request }) => {
      await demoLogin(request, page, panel);
      // Try a few common pages if exist
      const candidatePaths =
        panel === 'individual'
          ? ['dashboard', 'create-shipment', 'my-shipments', 'offers', 'messages', 'live-tracking']
          : panel === 'corporate'
            ? ['dashboard', 'create-shipment', 'shipments', 'offers', 'messages', 'carriers', 'analytics', 'live-tracking']
            : panel === 'nakliyeci'
              ? ['dashboard', 'jobs', 'offers', 'listings', 'drivers', 'active-shipments', 'messages', 'wallet', 'route-planner', 'analytics', 'settings', 'help']
              : ['dashboard', 'market', 'my-offers', 'active-jobs', 'completed-jobs', 'messages', 'settings', 'help'];
      for (const p of candidatePaths) {
        await page.goto(`/${panel}/${p}`);
        await expect(page).toHaveURL(new RegExp(`/${panel}/`));
        await expect(page.getByText('Sayfa Bulunamadı')).toHaveCount(0);
      }
    });
  }
});
