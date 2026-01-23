import { test, expect } from '@playwright/test';

test('Gerçek nakliyeci hesabıyla kayıt ol', async ({ page }) => {
  test.skip(!process.env.RUN_REGISTER_E2E, 'Registration E2E is opt-in (set RUN_REGISTER_E2E=1)');
  await page.goto('/');
  await page.click('text=Kayıt Ol');
  await expect(page).toHaveURL(/.*register/);
  await page.click('text=Nakliyeci');
  
  const timestamp = Date.now();
  const testEmail = `nakliyeci_${timestamp}@test.com`;
  const testPhone = `555${timestamp.toString().slice(-7)}`;

  await page.fill('input[name="firstName"]', 'Test');
  await page.fill('input[name="lastName"]', 'Nakliyeci');
  await page.fill('input[name="email"]', testEmail);
  await page.fill('input[name="phone"]', testPhone);
  await page.fill('input[name="password"]', 'Test123!@#');
  await page.fill('input[name="confirmPassword"]', 'Test123!@#');
  await page.fill('input[name="companyName"]', 'Test Nakliye A.Ş.');
  await page.fill('input[name="taxNumber"]', '1234567890');
  await page.fill('input[name="companyAddress"]', 'Test Mahallesi, Test Sokak No:1');
  await page.fill('input[name="companyPhone"]', '02121234567');
  await page.fill('input[name="licenseNumber"]', `LIC${timestamp}`);
  await page.fill('input[name="vehicleCount"]', '5');
  await page.fill('input[name="serviceAreas"]', 'İstanbul, Ankara, İzmir');

  await page.check('input[name="acceptTerms"]');
  await page.check('input[name="acceptPrivacy"]');
  await page.check('input[name="acceptCookies"]');
  await page.check('input[name="acceptKVKK"]');

  await page.click('button[type="submit"]:has-text("Kayıt Ol")');
  await page.waitForTimeout(3000);

  const errorMessage = await page.locator('.error, [role="alert"], .text-red-500').first();
  if (await errorMessage.isVisible()) {
    const errorText = await errorMessage.textContent();
    console.log('Registration error:', errorText);
    throw new Error(`Registration failed: ${errorText}`);
  }

  const currentUrl = page.url();
  console.log('After registration, current URL:', currentUrl);
  expect(currentUrl).toMatch(/dashboard|verify|login/);
});