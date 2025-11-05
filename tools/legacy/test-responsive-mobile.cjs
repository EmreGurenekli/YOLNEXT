// Comprehensive Mobile & Responsive Testing for YOLNEXT
const { chromium } = require('playwright');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

const DEVICES = {
  mobile: { width: 375, height: 667, name: 'iPhone SE' },
  mobileLarge: { width: 414, height: 896, name: 'iPhone 11 Pro Max' },
  tablet: { width: 768, height: 1024, name: 'iPad' },
  tabletLandscape: { width: 1024, height: 768, name: 'iPad Landscape' },
  desktop: { width: 1920, height: 1080, name: 'Desktop Full HD' },
};

async function testDevice(device, page, results) {
  log(`\n📱 Testing on ${device.name} (${device.width}x${device.height})`, 'cyan');
  
  await page.setViewportSize({ width: device.width, height: device.height });
  await page.waitForTimeout(1000);
  
  function recordTest(name, passed, details = '') {
    const testName = `${device.name}: ${name}`;
    results.tests.push({ name: testName, passed, details, device: device.name });
    if (passed) {
      results.passed++;
      log(`  ✅ ${name}`, 'green');
    } else {
      results.failed++;
      log(`  ❌ ${name}: ${details}`, 'red');
    }
  }

  try {
    // 1. Homepage Responsive
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    const bodyVisible = await page.locator('body').isVisible();
    const noHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= window.innerWidth;
    });
    recordTest('Homepage Loads', bodyVisible);
    recordTest('No Horizontal Scroll', noHorizontalScroll);

    // 2. Login Page Responsive
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    const loginFormVisible = await page.locator('form, [role="form"]').first().isVisible().catch(() => false);
    const demoButtonsVisible = await page.locator('button[data-testid^="demo-"]').first().isVisible().catch(() => false);
    recordTest('Login Form Visible', loginFormVisible);
    recordTest('Demo Buttons Visible', demoButtonsVisible);
    
    // On mobile, check if buttons stack vertically
    if (device.width < 768) {
      const buttonsStacked = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button[data-testid^="demo-"]'));
        if (buttons.length < 2) return false;
        const rect1 = buttons[0].getBoundingClientRect();
        const rect2 = buttons[1].getBoundingClientRect();
        return rect2.top > rect1.bottom; // Second button is below first
      });
      recordTest('Buttons Stack on Mobile', buttonsStacked);
    }

    // 3. Individual Dashboard with Real Data
    const demoButton = page.locator('button[data-testid="demo-individual"]');
    if (await demoButton.isVisible()) {
      await demoButton.click();
      await page.waitForTimeout(3000);
      await page.goto('http://localhost:5173/individual/dashboard', { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
      
      // Check dashboard cards/stats
      const statsCards = await page.locator('[class*="card"], [class*="stat"], [class*="metric"]').count();
      const hasNumbers = await page.locator('text=/\\d+/').count() > 0;
      const dashboardTitle = await page.locator('text=/Dashboard|Ana Sayfa|Gönderi/i').first().isVisible().catch(() => false);
      
      recordTest('Dashboard Loads', dashboardTitle);
      recordTest('Stats Cards Visible', statsCards > 0);
      recordTest('Real Numbers Displayed', hasNumbers);
      
      // Check responsive grid
      const gridResponsive = await page.evaluate(() => {
        const gridElements = document.querySelectorAll('[class*="grid"]');
        if (gridElements.length === 0) return true;
        const firstGrid = gridElements[0];
        const styles = window.getComputedStyle(firstGrid);
        return styles.display === 'grid' || styles.display === 'flex';
      });
      recordTest('Grid Layout Responsive', gridResponsive);
    }

    // 4. Shipment Creation Form Responsive
    await page.goto('http://localhost:5173/individual/create-shipment', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    const formVisible = await page.locator('form, [class*="form"]').first().isVisible().catch(() => false);
    const stepIndicatorVisible = await page.locator('text=/Adım|Step/i').first().isVisible().catch(() => false);
    recordTest('Shipment Form Visible', formVisible);
    recordTest('Step Indicator Visible', stepIndicatorVisible);
    
    // Check form inputs are usable on mobile
    if (device.width < 768) {
      const inputsVisible = await page.locator('input, select, textarea').first().isVisible();
      const inputsReadable = await page.evaluate(() => {
        const input = document.querySelector('input, select, textarea');
        if (!input) return false;
        const rect = input.getBoundingClientRect();
        return rect.width >= 200 && rect.height >= 40; // Minimum touch target
      });
      recordTest('Form Inputs Visible on Mobile', inputsVisible);
      recordTest('Form Inputs Touch-Friendly', inputsReadable);
    }

    // 5. My Shipments Page - Check Cards and Data
    await page.goto('http://localhost:5173/individual/my-shipments', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    const shipmentsListVisible = await page.locator('[class*="shipment"], [class*="card"], [class*="list"]').first().isVisible().catch(() => false);
    const hasShipmentData = await page.evaluate(() => {
      const text = document.body.textContent || '';
      return text.includes('İstanbul') || text.includes('Ankara') || text.includes('Gönderi') || text.includes('TL');
    });
    recordTest('Shipments List Visible', shipmentsListVisible);
    recordTest('Shipment Data Displayed', hasShipmentData);
    
    // Check card layout on different screen sizes
    const cardsStackOnMobile = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('[class*="card"], [class*="shipment"]'));
      if (cards.length === 0) return true;
      if (window.innerWidth >= 768) return true; // Desktop - can be side by side
      // Mobile - should stack
      if (cards.length < 2) return true;
      const rect1 = cards[0].getBoundingClientRect();
      const rect2 = cards[1].getBoundingClientRect();
      return rect2.top > rect1.bottom || rect1.top > rect2.bottom;
    });
    recordTest('Cards Stack on Mobile', cardsStackOnMobile);

    // 6. Offers Page - Real Data Check
    await page.goto('http://localhost:5173/individual/offers', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    const offersPageVisible = await page.locator('text=/Teklif|Offer/i').first().isVisible().catch(() => false);
    const hasOfferData = await page.evaluate(() => {
      const text = document.body.textContent || '';
      return text.includes('TL') || text.includes('₺') || text.includes('Teklif') || text.includes('Nakliyeci');
    });
    recordTest('Offers Page Visible', offersPageVisible);
    recordTest('Offer Data Displayed', hasOfferData);

    // 7. Navigation Menu Responsive (Mobile Menu)
    if (device.width < 768) {
      const menuButtonSelectors = [
        'button[data-testid="mobile-menu-button"]',
        'button[aria-label*="menu" i]',
        'button[aria-label*="Menü" i]',
        'button[class*="Menu"]',
        '.lg\\:hidden button:has(svg)',
      ];
      
      let menuButtonFound = false;
      for (const selector of menuButtonSelectors) {
        try {
          const button = await page.locator(selector).first();
          if (await button.isVisible({ timeout: 2000 }).catch(() => false)) {
            menuButtonFound = true;
            // Test if menu works
            await button.click();
            await page.waitForTimeout(500);
            const menuVisible = await page.evaluate(() => {
              const sidebar = document.querySelector('[class*="sidebar"], nav, [class*="menu"]');
              if (!sidebar) return false;
              const styles = window.getComputedStyle(sidebar);
              return styles.display !== 'none' && (styles.transform.includes('translate-x-0') || !styles.transform.includes('translate-x-full'));
            }).catch(() => false);
            recordTest('Mobile Menu Works', menuVisible);
            break;
          }
        } catch (e) {
          // Try next selector
        }
      }
      recordTest('Mobile Menu Button Visible', menuButtonFound);
    }

    // 8. Text Readability
    const textReadable = await page.evaluate(() => {
      const body = document.body;
      const styles = window.getComputedStyle(body);
      const fontSize = parseFloat(styles.fontSize);
      return fontSize >= 14; // Minimum readable font size
    });
    recordTest('Text Readable (Font Size)', textReadable);

    // 9. No Content Overflow
    const noOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= window.innerWidth + 5; // Allow 5px tolerance
    });
    recordTest('No Content Overflow', noOverflow);

    // 10. Images Load and Are Responsive
    const imagesResponsive = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      if (images.length === 0) return true;
      return images.every(img => {
        const styles = window.getComputedStyle(img);
        return styles.maxWidth === '100%' || img.width <= window.innerWidth;
      });
    });
    recordTest('Images Responsive', imagesResponsive);

    // 11. Buttons Touch-Friendly (Mobile)
    if (device.width < 768) {
      const buttonsTouchFriendly = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, a[role="button"]'));
        if (buttons.length === 0) return true;
        return buttons.every(btn => {
          const rect = btn.getBoundingClientRect();
          return rect.width >= 44 && rect.height >= 44; // iOS/Android minimum touch target
        });
      });
      recordTest('Buttons Touch-Friendly', buttonsTouchFriendly);
    }

    // 12. SEO/Meta Tags Check
    const hasTitle = await page.evaluate(() => {
      return document.title && document.title.length > 0;
    });
    const hasMetaDescription = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="description"]');
      return meta && meta.content && meta.content.length > 0;
    });
    recordTest('SEO: Page Title Exists', hasTitle);
    recordTest('SEO: Meta Description Exists', hasMetaDescription);

    // Screenshot for this device
    await page.screenshot({ 
      path: `test-responsive-${device.name.replace(/\s+/g, '-')}.png`,
      fullPage: true
    });

  } catch (error) {
    recordTest('Device Test Error', false, error.message);
  }
}

async function testRealDataDisplay(page, results) {
  log('\n📊 Testing Real Data Display...', 'magenta');
  
  function recordTest(name, passed, details = '') {
    results.tests.push({ name: `Data: ${name}`, passed, details });
    if (passed) {
      results.passed++;
      log(`  ✅ ${name}`, 'green');
    } else {
      results.failed++;
      log(`  ❌ ${name}: ${details}`, 'red');
    }
  }

  try {
    // Login as individual
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    const demoButton = page.locator('button[data-testid="demo-individual"]');
    if (await demoButton.isVisible()) {
      await demoButton.click();
      await page.waitForTimeout(3000);
    }

    // 1. Dashboard Stats - Check for Real Numbers
    await page.goto('http://localhost:5173/individual/dashboard', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    const dashboardStats = await page.evaluate(() => {
      const text = document.body.textContent || '';
      const numbers = text.match(/\d+/g) || [];
      return {
        hasNumbers: numbers.length > 0,
        numbers: numbers.slice(0, 10),
        hasCurrency: text.includes('TL') || text.includes('₺') || text.includes('$'),
        hasDates: text.match(/\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}/) !== null,
      };
    });
    
    recordTest('Dashboard Shows Numbers', dashboardStats.hasNumbers);
    recordTest('Dashboard Shows Currency', dashboardStats.hasCurrency);
    recordTest('Dashboard Shows Dates', dashboardStats.hasDates);

    // 2. Create a shipment and verify it shows real data
    await page.goto('http://localhost:5173/individual/create-shipment', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Fill form quickly
    try {
      await page.selectOption('select[name="mainCategory"]', 'house_move');
      await page.waitForTimeout(500);
      await page.click('button:has-text("İleri")');
      await page.waitForTimeout(2000);
      
      await page.selectOption('select[name="pickupCity"]', 'İstanbul');
      await page.waitForTimeout(1500);
      await page.selectOption('select[name="pickupDistrict"]', 'Kadıköy');
      await page.fill('textarea[name="pickupAddress"]', 'Test Address');
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      await page.fill('input[name="pickupDate"]', tomorrow.toISOString().split('T')[0]);
      
      await page.selectOption('select[name="deliveryCity"]', 'Ankara');
      await page.waitForTimeout(1500);
      await page.selectOption('select[name="deliveryDistrict"]', 'Çankaya');
      await page.fill('textarea[name="deliveryAddress"]', 'Test Delivery Address');
      
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);
      await page.fill('input[name="deliveryDate"]', dayAfter.toISOString().split('T')[0]);
      
      await page.click('button:has-text("İleri")');
      await page.waitForTimeout(2000);
      
      // Verify preview shows real data
      const previewHasRealData = await page.evaluate(() => {
        const text = document.body.textContent || '';
        return text.includes('İstanbul') && text.includes('Ankara') && text.includes('Kadıköy');
      });
      recordTest('Shipment Preview Shows Real Data', previewHasRealData);
      
      await page.click('button:has-text("Gönderiyi Yayınla")');
      await page.waitForTimeout(5000);
      
      // Check if shipment appears in list
      await page.goto('http://localhost:5173/individual/my-shipments', { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
      
      const shipmentInList = await page.evaluate(() => {
        const text = document.body.textContent || '';
        return text.includes('İstanbul') || text.includes('Ankara') || text.includes('TRK');
      });
      recordTest('Created Shipment Appears in List', shipmentInList);
      
    } catch (error) {
      recordTest('Shipment Creation Test', false, error.message);
    }

    // 3. Check Cards Display Real Data
    const cardsHaveData = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('[class*="card"], [class*="shipment"]'));
      if (cards.length === 0) return true; // No cards = pass (empty state)
      return cards.some(card => {
        const text = card.textContent || '';
        return text.match(/\d+/) || text.includes('TL') || text.includes('₺') || text.length > 20;
      });
    });
    recordTest('Cards Display Real Data', cardsHaveData);

  } catch (error) {
    recordTest('Real Data Test Error', false, error.message);
  }
}

async function main() {
  log('\n🚀 Starting Comprehensive Mobile & Responsive Test Suite\n', 'cyan');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = {
    passed: 0,
    failed: 0,
    tests: [],
  };

  try {
    // Test all devices
    for (const [key, device] of Object.entries(DEVICES)) {
      await testDevice(device, page, results);
    }

    // Test real data display on default device
    await page.setViewportSize({ width: 1920, height: 1080 });
    await testRealDataDisplay(page, results);

    // Final screenshot
    await page.screenshot({ path: 'test-responsive-final.png', fullPage: true });
    log('\n📸 Final screenshot saved: test-responsive-final.png', 'cyan');

  } catch (error) {
    log(`\n❌ Test suite error: ${error.message}`, 'red');
    await page.screenshot({ path: 'test-responsive-error.png', fullPage: true });
  } finally {
    await browser.close();
  }

  // Print Summary
  log('\n' + '='.repeat(60), 'cyan');
  log('📊 RESPONSIVE & MOBILE TEST SUMMARY', 'cyan');
  log('='.repeat(60), 'cyan');
  log(`\n✅ Passed: ${results.passed}`, 'green');
  log(`❌ Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  log(`📈 Total:  ${results.tests.length}`, 'blue');
  log(`📊 Success Rate: ${((results.passed / results.tests.length) * 100).toFixed(1)}%\n`, 'blue');

  if (results.failed > 0) {
    log('Failed Tests by Device:', 'red');
    const failuresByDevice = {};
    results.tests.filter(t => !t.passed).forEach(test => {
      const device = test.device || 'Unknown';
      if (!failuresByDevice[device]) failuresByDevice[device] = [];
      failuresByDevice[device].push(test.name);
    });
    Object.entries(failuresByDevice).forEach(([device, tests]) => {
      log(`\n${device}:`, 'yellow');
      tests.forEach(test => log(`  - ${test}`, 'red'));
    });
  }

  log('\n✅ Responsive & Mobile testing completed!\n', 'green');
}

main().catch(console.error);

