/**
 * MCP Playwright Test Runner
 * 
 * This script runs browser tests using direct Playwright when MCP server fails.
 */

import { 
  initBrowser, 
  navigate, 
  snapshot, 
  click, 
  type, 
  close, 
  getConsoleMessages,
  getPage,
  waitForSelector,
  waitForNavigation,
  waitFor
} from './mcp-playwright-wrapper.js';

const BASE_URL = process.env.TEST_URL || 'http://localhost:5173';

function addDaysLocalISO(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function assertNoConsoleErrors() {
  const errors = await getConsoleMessages(true);
  if (errors.length > 0) {
    const msg = errors.map(e => `${e.type}: ${e.text}`).join('\n');
    throw new Error(`Console errors detected:\n${msg}`);
  }
}

async function loginDemo(userType) {
  await navigate(`${BASE_URL}/login`);
  await waitForSelector(`button[data-testid="demo-${userType}"]`, { timeout: 10000 });
  await click(`button[data-testid="demo-${userType}"]`, { waitAfter: 1500 });
  await waitForNavigation({ timeout: 15000 });
  await waitFor(1000);
}

async function runTests() {
  console.log('=== MCP PLAYWRIGHT TEST RUNNER ===\n');
  
  try {
    // Initialize
    await initBrowser({ headless: false });
    
    // Test 1: Navigate to login
    console.log('\n1. Testing Login Page...');
    await navigate(`${BASE_URL}/login`);
    await snapshot('test-login.png');
    
    // Test 2: Check demo buttons
    console.log('\n2. Testing Demo Login Buttons...');
    const page0 = getPage();
    await waitForSelector('button[data-testid^="demo-"]', { timeout: 10000 });
    const demoButtons = await page0.$$('button[data-testid^="demo-"]');
    console.log(`✅ Found ${demoButtons.length} demo buttons`);
    
    // Test 3: Click individual demo button
    console.log('\n3. Testing Individual Demo Login...');
    await loginDemo('individual');
    await snapshot('test-individual-dashboard.png');

    console.log('\n3.1 Creating Shipment (Individual) ...');
    const uniqueTitle = `E2E-${Date.now()}`;
    await navigate(`${BASE_URL}/individual/create-shipment`);
    await waitFor(1500);
    await snapshot('test-individual-create-shipment-step1.png');

    const page1 = getPage();
    await page1.selectOption('select[aria-label="Yük kategorisi seçin"]', 'other');
    await waitFor(300);
    await page1.fill('textarea[aria-label="Yük açıklaması"]', uniqueTitle);
    await waitFor(300);
    await click('text=İleri', { waitAfter: 800 });

    await waitFor(800);
    await snapshot('test-individual-create-shipment-step2.png');
    await page1.selectOption('select[aria-label="Toplama ili"]', { index: 1 });
    await waitFor(300);
    await page1.selectOption('select[aria-label="Toplama ilçesi"]', { index: 1 });
    await waitFor(300);
    await page1.fill('textarea[aria-label="Toplama adresi"]', 'E2E Toplama Adresi');
    await waitFor(200);

    await page1.selectOption('select[aria-label="Teslimat ili"]', { index: 2 });
    await waitFor(300);
    await page1.selectOption('select[aria-label="Teslimat ilçesi"]', { index: 1 });
    await waitFor(300);
    await page1.fill(
      'textarea[placeholder*="detaylı adres bilgilerini girin"]',
      'E2E Teslimat Adresi'
    );
    await waitFor(200);

    // Date inputs don't have stable aria-labels in all cases; fill by position
    const dateInputs = page1.locator('input[type="date"]');
    await dateInputs.nth(0).fill(addDaysLocalISO(1));
    await dateInputs.nth(1).fill(addDaysLocalISO(2));
    await waitFor(300);
    await click('text=İleri', { waitAfter: 800 });

    await waitFor(800);
    await snapshot('test-individual-create-shipment-step3.png');
    // Publish button can be below the fold; scroll + force click
    const publishCandidates = ['text=Gönderiyi Yayınla', 'text=Yayınla', 'text=Gönderiyi Yayınla '];
    let published = false;
    for (const sel of publishCandidates) {
      try {
        const btn = page1.locator(sel).first();
        await btn.scrollIntoViewIfNeeded().catch(() => {});
        await btn.click({ timeout: 20000, force: true });
        published = true;
        break;
      } catch (e) {
        // try next
      }
    }
    if (!published) {
      throw new Error('Publish button not clickable (Gönderiyi Yayınla)');
    }
    await waitFor(1500);
    await waitFor(1200);
    await snapshot('test-individual-create-shipment-success.png');
    const bodyTextAfterCreate = (await page1.textContent('body')) || '';
    const trackingMatch = bodyTextAfterCreate.match(/TRK\d{6,}/);
    const createdTrackingCode = trackingMatch ? trackingMatch[0] : '';
    if (!createdTrackingCode) {
      console.log('⚠️ Tracking code not detected from UI text (continuing)');
    } else {
      console.log(`✅ Created shipment trackingCode: ${createdTrackingCode}`);
    }

    await assertNoConsoleErrors();

    console.log('\n3.2 Verifying Shipments Page (Individual) ...');
    await navigate(`${BASE_URL}/individual/my-shipments`);
    await waitFor(2000);
    await snapshot('test-individual-my-shipments-after-create.png');
    await assertNoConsoleErrors();

    // Test 4: Nakliyeci demo login and settings code
    console.log('\n4. Testing Nakliyeci Settings Code...');
    await loginDemo('nakliyeci');
    await navigate(`${BASE_URL}/nakliyeci/settings`);
    await waitFor(1500);
    await snapshot('test-nakliyeci-settings.png');

    const page2 = getPage();
    const pageText = await page2.textContent('body');
    if (!pageText) {
      throw new Error('Nakliyeci settings page did not render body text');
    }

    if (pageText.includes('Kod yükleniyor')) {
      throw new Error('Nakliyeci code still shows "Kod yükleniyor..."');
    }

    // Best-effort check for code format
    if (!/YN-\w{3,}/.test(pageText)) {
      console.log('⚠️ Nakliyeci code format (YN-XXXXX) not detected in page text (continuing)');
    } else {
      console.log('✅ Nakliyeci code detected on settings page');
    }

    // Test 5: Nakliyeci analytics page
    console.log('\n5. Testing Nakliyeci Analytics Page...');
    await navigate(`${BASE_URL}/nakliyeci/analytics`);
    await waitFor(2000);
    await snapshot('test-nakliyeci-analytics.png');
    const analyticsText = await page2.textContent('body');
    if (!analyticsText) {
      throw new Error('Nakliyeci analytics page did not render body text');
    }
    if (analyticsText.includes('Analitik veriler yüklenemedi')) {
      throw new Error('Nakliyeci analytics shows load error');
    }

    // Test 6: Nakliyeci drivers page + link by code
    console.log('\n6. Testing Nakliyeci Drivers Link Flow...');
    await navigate(`${BASE_URL}/nakliyeci/drivers`);
    await waitFor(2000);
    await snapshot('test-nakliyeci-drivers.png');

    // Type carrier driverCode and attempt link
    await waitForSelector('input[placeholder*="YD-12345"]', { timeout: 10000 });
    await click('input[placeholder*="YD-12345"]');
    await type('input[placeholder*="YD-12345"]', 'YD-01004');
    await waitFor(1000);

    // There are multiple 'Ekle' buttons; click the first visible one
    await click('text=Ekle', { waitAfter: 1500 });
    await waitFor(1500);
    await snapshot('test-nakliyeci-drivers-after-link.png');

    const driversText = await page2.textContent('body');
    if (!driversText) {
      throw new Error('Nakliyeci drivers page did not render body text');
    }
    if (driversText.includes('ownerCarrierId missing')) {
      throw new Error('Driver link failed due to missing ownerCarrierId');
    }
    if (driversText.includes('Kod bulunamadı')) {
      throw new Error('Driver code lookup/link failed: code not found');
    }

    console.log('\n6.1 Creating Offer for Shipment (Nakliyeci) ...');
    await navigate(`${BASE_URL}/nakliyeci/jobs`);
    await waitFor(2000);
    await snapshot('test-nakliyeci-jobs.png');
    const pageJobs = getPage();
    await waitForSelector('input[placeholder*="adres ara"]', { timeout: 20000 });
    await pageJobs.fill('input[placeholder*="adres ara"]', uniqueTitle);
    await waitFor(1200);
    await snapshot('test-nakliyeci-jobs-filtered.png');
    await click('text=Teklif Ver', { waitAfter: 800 });
    await waitFor(500);
    await snapshot('test-nakliyeci-offer-modal.png');
    await pageJobs.fill('input[placeholder*="Teklif fiyat"]', '3500');
    await pageJobs.fill('textarea[placeholder*="mesajınızı"]', 'E2E teklif mesajı');
    await click('text=Teklif Gönder', { waitAfter: 1500 });
    await waitFor(1200);
    await snapshot('test-nakliyeci-offer-submitted.png');
    await assertNoConsoleErrors();

    console.log('\n6.2 Accept Offer (Individual) ...');
    await loginDemo('individual');
    await navigate(`${BASE_URL}/individual/offers`);
    await waitFor(2500);
    await snapshot('test-individual-offers.png');
    await page2.fill('input[placeholder="Teklif ara..."]', createdTrackingCode || uniqueTitle);
    await waitFor(1200);
    await snapshot('test-individual-offers-filtered.png');
    await click('text=Kabul Et', { waitAfter: 500 });
    await waitFor(500);
    await snapshot('test-individual-offers-accept-confirm.png');
    await click('text=Kabul Et ve Onayla', { waitAfter: 2000 });
    await waitFor(2500);
    await snapshot('test-individual-after-accept-redirect.png');

    await navigate(`${BASE_URL}/individual/my-shipments`);
    await waitFor(2500);
    await snapshot('test-individual-my-shipments-after-accept.png');
    await assertNoConsoleErrors();

    console.log('\n6.3 Corporate Panel Smoke (Shipments/Offers) ...');
    await loginDemo('corporate');
    await navigate(`${BASE_URL}/corporate/shipments`);
    await waitFor(2500);
    await snapshot('test-corporate-shipments.png');
    await navigate(`${BASE_URL}/corporate/offers`);
    await waitFor(2500);
    await snapshot('test-corporate-offers.png');
    await assertNoConsoleErrors();
    
    // Test 7: Check console errors
    console.log('\n7. Checking Console Errors...');
    const errors = await getConsoleMessages(true);
    if (errors.length > 0) {
      console.log(`⚠️ Found ${errors.length} console errors`);
      errors.forEach(err => console.log(`   - ${err.type}: ${err.text}`));
    } else {
      console.log('✅ No console errors');
    }
    
    // Cleanup
    await close();
    
    console.log('\n🎉 ALL TESTS COMPLETED SUCCESSFULLY!');
    return true;
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    await close();
    return false;
  }
}

runTests().then(success => {
  process.exit(success ? 0 : 1);
});


