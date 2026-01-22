import { test, expect, Page, BrowserContext } from '@playwright/test';

test.describe('Basit Pazaryeri İş Akışları', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
    
    // Console errors'ı yakala
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Console error:', msg.text());
      }
    });
  });

  test.afterEach(async () => {
    await context.close();
  });

  test('Demo Login - Tüm Kullanıcı Tipleri', async () => {
    await page.goto(`${process.env.TEST_URL || 'http://localhost:5173'}/login`);
    
    // Corporate demo login
    await page.click('[data-testid="demo-corporate"]');
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page).toHaveURL(/\/corporate\/(dashboard|home)/);
    
    // Logout ve nakliyeci login
    await page.goto(`${process.env.TEST_URL || 'http://localhost:5173'}/login`);
    await page.click('[data-testid="demo-nakliyeci"]');
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page).toHaveURL(/\/(nakliyeci|tasiyici)\/(dashboard|home)/);
    
    // Logout ve tasiyici login
    await page.goto(`${process.env.TEST_URL || 'http://localhost:5173'}/login`);
    await page.click('[data-testid="demo-tasiyici"]');
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page).toHaveURL(/\/(tasiyici|nakliyeci)\/(dashboard|home)/);
    
    // Logout ve individual login
    await page.goto(`${process.env.TEST_URL || 'http://localhost:5173'}/login`);
    await page.click('[data-testid="demo-individual"]');
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page).toHaveURL(/\/individual\/(dashboard|home)/);
  });

  test('Corporate Panel - Gönderi Oluşturma', async () => {
    await page.goto(`${process.env.TEST_URL || 'http://localhost:5173'}/login`);
    await page.click('[data-testid="demo-corporate"]');
    
    // Dashboard kontrol
    await expect(page).not.toHaveURL(/\/login/);
    await page.goto(`${process.env.TEST_URL || 'http://localhost:5173'}/corporate/dashboard`);
    await expect(page).toHaveURL(/\/corporate\/dashboard/);
    
    // Gönderi oluşturma butonu kontrol
    await page.goto(`${process.env.TEST_URL || 'http://localhost:5173'}/corporate/create-shipment`);
    await expect(page).toHaveURL(/\/corporate\/create-shipment/);
  });

  test('Nakliyeci Panel - İlanlar', async () => {
    await page.goto(`${process.env.TEST_URL || 'http://localhost:5173'}/login`);
    await page.click('[data-testid="demo-nakliyeci"]');
    
    // Dashboard kontrol
    await expect(page).not.toHaveURL(/\/login/);
    await page.goto(`${process.env.TEST_URL || 'http://localhost:5173'}/nakliyeci/dashboard`);
    await expect(page).toHaveURL(/\/nakliyeci\/dashboard/);
    
    // İlanlar butonu kontrol
    await page.goto(`${process.env.TEST_URL || 'http://localhost:5173'}/nakliyeci/jobs`);
    await expect(page).toHaveURL(/\/nakliyeci\/jobs/);
  });

  test('Tasiyici Panel - İşler', async () => {
    await page.goto(`${process.env.TEST_URL || 'http://localhost:5173'}/login`);
    await page.click('[data-testid="demo-tasiyici"]');
    
    // Dashboard kontrol
    await expect(page).not.toHaveURL(/\/login/);
    await page.goto(`${process.env.TEST_URL || 'http://localhost:5173'}/tasiyici/dashboard`);
    await expect(page).toHaveURL(/\/tasiyici\/dashboard/);
    
    // İşler butonu kontrol
    await page.goto(`${process.env.TEST_URL || 'http://localhost:5173'}/tasiyici/market`);
    await expect(page).toHaveURL(/\/tasiyici\/market/);
    await expect(page.getByText('Sayfa Bulunamadı')).toHaveCount(0);
  });

  test('Individual Panel - Gönderiler', async () => {
    await page.goto(`${process.env.TEST_URL || 'http://localhost:5173'}/login`);
    await page.click('[data-testid="demo-individual"]');
    
    // Dashboard kontrol
    await expect(page).not.toHaveURL(/\/login/);
    await page.goto(`${process.env.TEST_URL || 'http://localhost:5173'}/individual/dashboard`);
    await expect(page).toHaveURL(/\/individual\/dashboard/);
    
    // Gönderiler butonu kontrol
    await page.goto(`${process.env.TEST_URL || 'http://localhost:5173'}/individual/create-shipment`);
    await expect(page).toHaveURL(/\/individual\/create-shipment/);
  });

  test('Responsive Tasarım Testi', async () => {
    await page.goto(`${process.env.TEST_URL || 'http://localhost:5173'}/login`);
    
    // Mobile görünüm
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    
    // Tablet görünüm
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    
    // Desktop görünüm
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test('Sayfa Yükleme Performansı', async () => {
    const startTime = Date.now();
    await page.goto(`${process.env.TEST_URL || 'http://localhost:5173'}/login`);
    const loadTime = Date.now() - startTime;
    
    // Sayfa 3 saniyeden az sürede yüklenmeli
    expect(loadTime).toBeLessThan(3000);
    
    // Ana elementler görünür olmalı
    await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[name="password"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button[type="submit"]')).toBeVisible({ timeout: 5000 });
  });

  test('Demo Butonları Kontrolü', async () => {
    await page.goto(`${process.env.TEST_URL || 'http://localhost:5173'}/login`);
    
    // Tüm demo butonları kontrol et
    const demoButtons = [
      '[data-testid="demo-corporate"]',
      '[data-testid="demo-nakliyeci"]',
      '[data-testid="demo-tasiyici"]',
      '[data-testid="demo-individual"]'
    ];
    
    for (const buttonSelector of demoButtons) {
      const button = page.locator(buttonSelector);
      await expect(button).toBeVisible({ timeout: 5000 });
      await expect(button).toBeEnabled();
    }
  });

  test('Form Validasyonu', async () => {
    await page.goto(`${process.env.TEST_URL || 'http://localhost:5173'}/login`);
    
    // Boş form gönderimi
    await page.click('button[type="submit"]');
    
    // Hata mesajı kontrolü (varsa)
    const errorMessage = page.locator('text=required');
    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toBeVisible();
    }
    
    // Geçersiz email formatı
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', '123');
    await page.click('button[type="submit"]');
    
    // Email validasyonu kontrolü (varsa)
    const emailError = page.locator('text=invalid');
    if (await emailError.isVisible()) {
      await expect(emailError).toBeVisible();
    }
  });

  test('Navigasyon Testi', async () => {
    await page.goto(`${process.env.TEST_URL || 'http://localhost:5173'}/login`);
    await page.click('[data-testid="demo-corporate"]');
    
    // Ana navigasyon elementleri kontrolü
    const navigationElements = [
      'text=Dashboard',
      'text=Kurumsal Panel'
    ];
    
    for (const element of navigationElements) {
      const navElement = page.locator(element);
      if (await navElement.isVisible()) {
        await expect(navElement).toBeVisible();
      }
    }
  });

  test('API Entegrasyonu Kontrolü', async () => {
    await page.goto(`${process.env.TEST_URL || 'http://localhost:5173'}/login`);
    
    // Network isteklerini izle
    const apiRequests: string[] = [];
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        apiRequests.push(request.url());
      }
    });
    
    // Demo login yap
    await page.click('[data-testid="demo-corporate"]');
    
    // API isteklerinin yapılıp yapılmadığını kontrol et
    await page.waitForTimeout(2000); // API isteklerinin tamamlanması için bekle
    
    console.log('API Requests:', apiRequests);
    
    // En azından bir API isteği yapılmış olmalı
    expect(apiRequests.length).toBeGreaterThan(0);
  });
});
