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
          ? ['create-shipment', 'shipments']
          : panel === 'nakliyeci'
            ? ['open-shipments']
            : panel === 'tasiyici'
              ? ['jobs', 'earnings']
              : ['dashboard'];
      for (const p of candidatePaths) {
        await page.goto(`/${panel}/${p}`);
        await expect(page).toHaveURL(new RegExp(`/${panel}/`));
      }
    });
  }
});
