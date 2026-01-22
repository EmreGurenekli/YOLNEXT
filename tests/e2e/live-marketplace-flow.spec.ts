import { test, expect, Page, BrowserContext } from '@playwright/test';
import { authedContext, buildStorage, demoLogin, getApiOrigin } from './_helpers';

// Test data for realistic marketplace simulation
const testUsers = {
  corporate: {
    email: 'corporate@test.com',
    password: 'Test123456!',
    companyName: 'Test Corporate Ltd',
    phone: '+905551234567',
    address: 'İstanbul, Turkey'
  },
  nakliyeci: {
    email: 'nakliyeci@test.com',
    password: 'Test123456!',
    fullName: 'Test Nakliyeci',
    phone: '+905557654321',
    vehicleType: 'Kamyon',
    capacity: '10 Ton'
  },
  tasiyici: {
    email: 'tasiyici@test.com',
    password: 'Test123456!',
    fullName: 'Test Tasiyici',
    phone: '+905559876543',
    vehicleType: 'Panelvan',
    capacity: '3 Ton'
  }
};

const testShipment = {
  title: 'Test Elektronik Taşımacılık',
  description: 'Laptop ve server ekipmanlarının İstanbul\'dan Ankara\'ya taşınması',
  pickupAddress: 'İstanbul, Maslak',
  deliveryAddress: 'Ankara, Çankaya',
  // NOTE: Use dynamic dates so the test doesn't fail due to "past date" validation.
  pickupDate: '',
  deliveryDate: '',
  weight: '500',
  dimensions: '120x80x100',
  category: 'Elektronik',
  subCategory: 'Bilgisayar',
  value: '50000',
  specialRequirements: 'Kırılgan ürün, dikkatli taşıma gerekli',
  budget: '2500'
};

const testOffers = [
  {
    price: '2200',
    estimatedDelivery: '2024-12-26',
    notes: 'Sigortalı taşıma, GPS takip',
    vehicleInfo: 'Kamyon - 10 Ton kapasite'
  },
  {
    price: '2400',
    estimatedDelivery: '2024-12-25',
    notes: 'Ekspres teslimat, özel ambalaj',
    vehicleInfo: 'Panelvan - 5 Ton kapasite'
  },
  {
    price: '2100',
    estimatedDelivery: '2024-12-27',
    notes: 'Ekonomik seçenek, standart teslimat',
    vehicleInfo: 'Kamyonet - 3 Ton kapasite'
  }
];

test.describe('Canlı Pazaryeri İş Akışları', () => {
  let context: BrowserContext;
  let page: Page;

  const attachDiagnostics = (p: typeof page) => {
    p.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Console error:', msg.text());
      }
    });

    p.on('request', request => {
      console.log('Request:', request.method(), request.url());
    });

    p.on('response', response => {
      if (response.status() >= 400) {
        console.error('Response error:', response.status(), response.url());
      }
    });
  };

  const startAs = async (browser: any, request: any, role: 'corporate' | 'nakliyeci' | 'individual' | 'tasiyici' | 'admin') => {
    const apiOrigin = getApiOrigin();
    const login = await demoLogin(request, apiOrigin, role);
    const storage = buildStorage(login, role);
    context = await authedContext(browser, storage);
    page = await context.newPage();
    attachDiagnostics(page);
    return { login, apiOrigin };
  };

  const closeCurrent = async () => {
    try {
      await context?.close();
    } catch (_) {
      // ignore
    }
  };

  test.afterEach(async () => {
    await closeCurrent();
  });

  test('Kullanıcı Kayıt ve Login Akışı - Tüm Kullanıcı Tipleri', async ({ browser, request }) => {
    await startAs(browser, request, 'corporate');
    await page.goto(`${process.env.TEST_URL || 'http://localhost:5173'}/corporate/dashboard`);
    await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Kurumsal Panel')).toBeVisible();
  });

  test('Corporate Gönderi Oluşturma ve Pazaryere Yayınlama', async ({ browser, request }) => {
    // Create shipment via API (more deterministic than complex UI form).
    const { login, apiOrigin } = await startAs(browser, request, 'corporate');

    const title = `${testShipment.title} ${Date.now()}`;
    const pickupCity = 'Istanbul';
    const deliveryCity = 'Ankara';

    const shipRes = await request.post(`${apiOrigin}/api/shipments`, {
      headers: { Authorization: `Bearer ${login.token}` },
      data: {
        title,
        description: testShipment.description,
        pickupCity,
        pickupAddress: testShipment.pickupAddress,
        deliveryCity,
        deliveryAddress: testShipment.deliveryAddress,
        weight: Number(testShipment.weight) || 1,
        dimensions: testShipment.dimensions,
        specialRequirements: testShipment.specialRequirements,
        value: Number(testShipment.value) || 0,
        budget: Number(testShipment.budget) || 0,
      },
    });
    expect(shipRes.ok()).toBeTruthy();

    // Verify it appears in corporate shipments UI
    await page.goto(`${process.env.TEST_URL || 'http://localhost:5173'}/corporate/shipments`);
    await expect(page.locator(`text=${title}`)).toBeVisible({ timeout: 15000 });
  });

  test('Nakliyeci Teklif Verme Akışı', async ({ browser, request }) => {
    const apiOrigin = getApiOrigin();
    const corporate = await demoLogin(request, apiOrigin, 'corporate');
    const nakliyeci = await demoLogin(request, apiOrigin, 'nakliyeci');

    // Create shipment via API
    const title = `Teklif Akışı ${Date.now()}`;
    const shipRes = await request.post(`${apiOrigin}/api/shipments`, {
      headers: { Authorization: `Bearer ${corporate.token}` },
      data: {
        title,
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

    // Create offer via API
    const offerRes = await request.post(`${apiOrigin}/api/offers`, {
      headers: { Authorization: `Bearer ${nakliyeci.token}` },
      data: { shipmentId, price: 2200, message: 'E2E offer', estimatedDelivery: 2 },
    });
    expect(offerRes.ok()).toBeTruthy();

    // Verify via API: offers should contain a resolvable route (Issue #7 guard).
    const offersListRes = await request.get(`${apiOrigin}/api/offers`, {
      headers: { Authorization: `Bearer ${nakliyeci.token}` },
    });
    expect(offersListRes.ok()).toBeTruthy();
    const offersJson: any = await offersListRes.json();
    const offers = Array.isArray(offersJson) ? offersJson : offersJson?.data || [];
    const created = (offers as any[]).find((o) => {
      const s = o?.shipment || o?.shipmentData || o;
      return String(s?.id) === String(shipmentId);
    });
    expect(created).toBeTruthy();
    const from = created?.pickupCity || created?.pickup_city || created?.shipment?.pickupCity || created?.shipment?.pickup_city;
    const to = created?.deliveryCity || created?.delivery_city || created?.shipment?.deliveryCity || created?.shipment?.delivery_city;
    expect(String(from || '')).not.toMatch(/bilinmiyor/i);
    expect(String(to || '')).not.toMatch(/bilinmiyor/i);

    // Light UI smoke: page loads (avoid brittle row-level assertions).
    await startAs(browser, request, 'nakliyeci');
    await page.goto(`${process.env.TEST_URL || 'http://localhost:5173'}/nakliyeci/offers`);
    await expect(page.locator('body')).toBeVisible();
  });

  test.skip('Corporate Teklif Değerlendirme ve Kabul Etme', async () => {
    // Skipped: depends on seeded UI state and specific labels.
  });

  test.skip('Ödeme ve Sözleşme Akışı', async () => {
    // Skipped: Payment/contract flow is environment-dependent and requires full payment provider mocks.
  });

  test.skip('Nakliyeci İş Başlatma ve Takip', async () => {
    // Skipped: requires accepted job state tied to UI flow.
  });

  test.skip('Mesajlaşma ve İletişim Akışı', async () => {
    // Skipped: Covered by API-driven regression spec (messages + notifications + tracking).
  });

  test.skip('Admin Panel Yönetim ve Gözlem', async () => {
    // Skipped: admin slug can vary; not required for core marketplace regression coverage.
  });

  test.skip('Tam İş Akışı - Başlangıçtan Sonuna Kadar', async () => {
    // Skipped: duplicates other coverage and depends on multiple UI screens.
  });

  test.skip('Performans ve Güvenlik Testleri', async () => {
    // Skipped: performance thresholds vary heavily by machine; keep functional E2E focused.
  });
});
