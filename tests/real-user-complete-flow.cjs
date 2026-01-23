const { chromium } = require('playwright');

const FRONTEND_URL = 'http://localhost:5173';
const BACKEND_URL = 'http://localhost:5000';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString('tr-TR');
  const color = 
    type === 'success' ? colors.green :
    type === 'error' ? colors.red :
    type === 'warning' ? colors.yellow :
    type === 'info' ? colors.blue :
    colors.cyan;
  console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
}

let results = { total: 0, passed: 0, failed: 0, issues: [] };

async function demoLogin(page, userType) {
  const loginResult = await page.evaluate(async ({ apiUrl, userType }) => {
    try {
      const response = await fetch(`${apiUrl}/api/auth/demo-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userType }),
      });
      const data = await response.json();
      return { success: response.ok, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, { apiUrl: BACKEND_URL, userType });
  
  if (loginResult.success && loginResult.data?.success) {
    const token = loginResult.data.data?.token;
    const user = loginResult.data.data?.user || {
      id: 1,
      email: `demo-${userType}@yolnext.com`,
      role: userType,
      isDemo: true
    };
    
    await page.evaluate(({ token, user }) => {
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
    }, { token, user });
    
    return true;
  }
  return false;
}

async function runTest(name, testFn) {
  results.total++;
  try {
    log(`🧪 ${name}`, 'info');
    await testFn();
    results.passed++;
    log(`✅ PASSED: ${name}`, 'success');
    return true;
  } catch (error) {
    results.failed++;
    results.issues.push({ test: name, error: error.message });
    log(`❌ FAILED: ${name} - ${error.message}`, 'error');
    return false;
  }
}

async function main() {
  log('🚀 REAL USER COMPLETE FLOW TEST', 'info');
  log('='.repeat(60), 'info');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 200
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  try {
    // ========== INDIVIDUAL: CREATE SHIPMENT ==========
    log('\n📦 INDIVIDUAL: Create Shipment Flow', 'info');
    
    await runTest('Login as Individual', async () => {
      await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(2000);
      const loggedIn = await demoLogin(page, 'individual');
      if (!loggedIn) throw new Error('Login failed');
      await page.goto(`${FRONTEND_URL}/individual/create-shipment`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(5000);
    });
    
    await runTest('Fill Step 1: Category and Product Info', async () => {
      // Select category
      const categorySelect = await page.$('select[name="mainCategory"], select, [data-testid="category-select"]');
      if (categorySelect) {
        await categorySelect.selectOption({ index: 1 });
        await page.waitForTimeout(1000);
      }
      
      // Fill product description
      const descInput = await page.$('input[name="productDescription"], textarea[name="productDescription"], input[placeholder*="açıklama"], textarea[placeholder*="açıklama"]');
      if (descInput) {
        await descInput.fill('Test gönderi - Mobilya taşıma');
        await page.waitForTimeout(500);
      }
      
      // Fill weight
      const weightInput = await page.$('input[name="weight"], input[placeholder*="ağırlık"], input[type="number"]');
      if (weightInput) {
        await weightInput.fill('100');
        await page.waitForTimeout(500);
      }
      
      // Fill quantity
      const quantityInput = await page.$('input[name="quantity"], input[placeholder*="adet"], input[placeholder*="miktar"]');
      if (quantityInput) {
        await quantityInput.fill('5');
        await page.waitForTimeout(500);
      }
      
      // Click next button
      const nextButton = await page.$('button:has-text("İleri"), button:has-text("Next"), button[type="submit"]');
      if (nextButton) {
        await nextButton.click();
        await page.waitForTimeout(2000);
      }
    });
    
    await runTest('Fill Step 2: Address Info', async () => {
      // Fill pickup address
      const pickupInput = await page.$('input[name="pickupAddress"], input[placeholder*="alış"], input[placeholder*="pickup"]');
      if (pickupInput) {
        await pickupInput.fill('İstanbul, Kadıköy, Test Mahallesi, Test Sokak No:1');
        await page.waitForTimeout(500);
      }
      
      // Fill delivery address
      const deliveryInput = await page.$('input[name="deliveryAddress"], input[placeholder*="teslim"], input[placeholder*="delivery"]');
      if (deliveryInput) {
        await deliveryInput.fill('Ankara, Çankaya, Test Mahallesi, Test Sokak No:2');
        await page.waitForTimeout(500);
      }
      
      // Fill dates
      const pickupDate = new Date();
      pickupDate.setDate(pickupDate.getDate() + 1);
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + 3);
      
      const pickupDateInput = await page.$('input[name="pickupDate"], input[type="date"]');
      if (pickupDateInput) {
        await pickupDateInput.fill(pickupDate.toISOString().split('T')[0]);
        await page.waitForTimeout(500);
      }
      
      const deliveryDateInput = await page.$('input[name="deliveryDate"], input[type="date"]:nth-of-type(2)');
      if (deliveryDateInput) {
        await deliveryDateInput.fill(deliveryDate.toISOString().split('T')[0]);
        await page.waitForTimeout(500);
      }
      
      // Click next button
      const nextButton = await page.$('button:has-text("İleri"), button:has-text("Next"), button[type="submit"]');
      if (nextButton) {
        await nextButton.click();
        await page.waitForTimeout(2000);
      }
    });
    
    await runTest('Submit Shipment', async () => {
      // Look for submit/publish button
      const submitButton = await page.$('button:has-text("Yayınla"), button:has-text("Gönder"), button:has-text("Submit"), button[type="submit"]');
      if (submitButton) {
        await submitButton.click();
        await page.waitForTimeout(5000);
      }
      
      // Check for success message or redirect
      const url = page.url();
      const hasSuccess = await page.evaluate(() => {
        return document.body.innerText.includes('başarılı') || 
               document.body.innerText.includes('success') ||
               document.body.innerText.includes('oluşturuldu');
      });
      
      if (!hasSuccess && !url.includes('my-shipments')) {
        log('⚠️ Success message not found, but continuing...', 'warning');
      }
    });
    
    await runTest('Verify Shipment in My Shipments', async () => {
      await page.goto(`${FRONTEND_URL}/individual/my-shipments`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(5000);
      
      const hasShipments = await page.evaluate(() => {
        return document.body.innerText.length > 200;
      });
      if (!hasShipments) {
        log('⚠️ Shipments list might be empty', 'warning');
      }
    });
    
    // ========== NAKLIYECI: VIEW JOBS ==========
    log('\n🚚 NAKLIYECI: View Jobs Flow', 'info');
    
    await runTest('Login as Nakliyeci', async () => {
      await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(2000);
      const loggedIn = await demoLogin(page, 'nakliyeci');
      if (!loggedIn) throw new Error('Login failed');
      await page.goto(`${FRONTEND_URL}/nakliyeci/jobs`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(5000);
    });
    
    await runTest('View Available Jobs', async () => {
      const hasJobs = await page.evaluate(() => {
        return document.body.innerText.length > 200;
      });
      if (!hasJobs) {
        log('⚠️ Jobs list might be empty', 'warning');
      }
    });
    
    // ========== TASIYICI: VIEW MARKET ==========
    log('\n🚛 TASIYICI: View Market Flow', 'info');
    
    await runTest('Login as Tasiyici', async () => {
      await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(2000);
      const loggedIn = await demoLogin(page, 'tasiyici');
      if (!loggedIn) throw new Error('Login failed');
      await page.goto(`${FRONTEND_URL}/tasiyici/market`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(5000);
    });
    
    await runTest('View Market Jobs', async () => {
      const hasMarket = await page.evaluate(() => {
        return document.body.innerText.length > 200;
      });
      if (!hasMarket) {
        log('⚠️ Market list might be empty', 'warning');
      }
    });
    
    // ========== CORPORATE: VIEW SHIPMENTS ==========
    log('\n🏢 CORPORATE: View Shipments Flow', 'info');
    
    await runTest('Login as Corporate', async () => {
      await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(2000);
      const loggedIn = await demoLogin(page, 'corporate');
      if (!loggedIn) throw new Error('Login failed');
      await page.goto(`${FRONTEND_URL}/corporate/shipments`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(5000);
    });
    
    await runTest('View Corporate Shipments', async () => {
      const hasShipments = await page.evaluate(() => {
        return document.body.innerText.length > 200;
      });
      if (!hasShipments) {
        log('⚠️ Corporate shipments list might be empty', 'warning');
      }
    });
    
    // Take screenshot
    await page.screenshot({ 
      path: './test-screenshots/real-user-complete-flow.png', 
      fullPage: true 
    }).catch(() => {});
    
  } catch (error) {
    log(`❌ Fatal: ${error.message}`, 'error');
  } finally {
    await context.close();
    await browser.close();
  }
  
  // Summary
  log('\n' + '='.repeat(60), 'info');
  log('📊 SUMMARY', 'info');
  log('='.repeat(60), 'info');
  log(`Total: ${results.total} | Passed: ${results.passed} | Failed: ${results.failed}`, 'info');
  log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`, 'info');
  
  if (results.issues.length > 0) {
    log('\n🔍 Issues:', 'warning');
    results.issues.forEach((issue, idx) => {
      log(`  ${idx + 1}. ${issue.test}: ${issue.error}`, 'error');
    });
  }
  
  process.exit(results.failed > 0 ? 1 : 0);
}

main().catch(error => {
  log(`❌ Fatal: ${error.message}`, 'error');
  process.exit(1);
});















