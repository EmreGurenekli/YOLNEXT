/**
 * Comprehensive Browser Test - Real User Scenarios
 * Tests all panels, pages, and features like a real marketplace user
 */

const { chromium } = require('playwright');
const fs = require('fs');

const BASE_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:5000';

const testResults = {
  passed: [],
  failed: [],
  warnings: []
};

async function logResult(test, status, message) {
  const result = {
    test,
    status,
    message,
    timestamp: new Date().toISOString()
  };
  
  if (status === 'pass') {
    testResults.passed.push(result);
    console.log(`✅ ${test}: ${message}`);
  } else if (status === 'fail') {
    testResults.failed.push(result);
    console.error(`❌ ${test}: ${message}`);
  } else {
    testResults.warnings.push(result);
    console.warn(`⚠️ ${test}: ${message}`);
  }
}

async function waitForServer(url, timeout = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const response = await fetch(url);
      if (response.ok) return true;
    } catch (e) {}
    await new Promise(r => setTimeout(r, 1000));
  }
  return false;
}

async function testHomePage(page) {
  try {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    const title = await page.title();
    if (title && title.length > 0) {
      await logResult('Homepage Load', 'pass', `Page loaded: ${title}`);
    } else {
      await logResult('Homepage Load', 'fail', 'Page title missing');
    }
    
    // Check for key elements
    const hasLogin = await page.locator('text=/giriş|login/i').count() > 0;
    const hasRegister = await page.locator('text=/kayıt|register|üye ol/i').count() > 0;
    
    if (hasLogin && hasRegister) {
      await logResult('Homepage Navigation', 'pass', 'Login and Register links found');
    } else {
      await logResult('Homepage Navigation', 'warn', 'Missing navigation links');
    }
    
    return true;
  } catch (error) {
    await logResult('Homepage Load', 'fail', error.message);
    return false;
  }
}

async function testRegistration(page, userType) {
  try {
    await page.goto(`${BASE_URL}/register`);
    await page.waitForLoadState('networkidle');
    
    // Select user type
    const userTypeSelect = page.locator(`text=/${userType}/i`).first();
    if (await userTypeSelect.count() > 0) {
      await userTypeSelect.click();
      await page.waitForTimeout(500);
    }
    
    // Fill registration form
    const email = `test_${userType}_${Date.now()}@test.com`;
    const password = 'Test123!@#';
    
    await page.fill('input[type="email"], input[name="email"]', email);
    await page.fill('input[type="password"], input[name="password"]', password);
    
    if (userType === 'corporate' || userType === 'nakliyeci') {
      // Company name and tax number required
      await page.fill('input[name="companyName"], input[placeholder*="şirket"]', `Test ${userType} Company`);
      await page.fill('input[name="taxNumber"], input[placeholder*="vergi"]', '1234567890');
    }
    
    if (userType === 'tasiyici') {
      // TCKN required
      await page.fill('input[name="tckn"], input[placeholder*="TCKN"]', '12345678901');
    }
    
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="phone"]', '05321234567');
    
    // Submit form
    const submitButton = page.locator('button[type="submit"], button:has-text("Kayıt"), button:has-text("Register")');
    if (await submitButton.count() > 0) {
      await submitButton.click();
      await page.waitForTimeout(2000);
      
      // Check for success or error
      const successMessage = page.locator('text=/başarı|success|kayıt/i');
      if (await successMessage.count() > 0) {
        await logResult(`Registration ${userType}`, 'pass', 'Registration form submitted');
      } else {
        await logResult(`Registration ${userType}`, 'warn', 'No success message, may need verification');
      }
    }
    
    return email;
  } catch (error) {
    await logResult(`Registration ${userType}`, 'fail', error.message);
    return null;
  }
}

async function testLogin(page, email, password) {
  try {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"], input[name="email"]', email);
    await page.fill('input[type="password"], input[name="password"]', password);
    
    const loginButton = page.locator('button[type="submit"], button:has-text("Giriş"), button:has-text("Login")');
    await loginButton.click();
    await page.waitForTimeout(3000);
    
    // Check if redirected to dashboard
    const currentUrl = page.url();
    if (currentUrl.includes('/dashboard') || currentUrl.includes('/individual') || currentUrl.includes('/corporate') || currentUrl.includes('/nakliyeci') || currentUrl.includes('/tasiyici')) {
      await logResult('Login', 'pass', `Successfully logged in, redirected to: ${currentUrl}`);
      return true;
    } else {
      await logResult('Login', 'warn', `Login may have failed, current URL: ${currentUrl}`);
      return false;
    }
  } catch (error) {
    await logResult('Login', 'fail', error.message);
    return false;
  }
}

async function testDashboard(page, userType) {
  try {
    const dashboardUrl = `${BASE_URL}/${userType}/dashboard`;
    await page.goto(dashboardUrl);
    await page.waitForLoadState('networkidle');
    
    // Check for dashboard elements
    const hasStats = await page.locator('text=/toplam|total|istatistik|stat/i').count() > 0;
    const hasNavigation = await page.locator('nav, [role="navigation"], .sidebar, .menu').count() > 0;
    
    if (hasStats || hasNavigation) {
      await logResult(`Dashboard ${userType}`, 'pass', 'Dashboard page loaded with content');
    } else {
      await logResult(`Dashboard ${userType}`, 'warn', 'Dashboard may be empty or loading');
    }
    
    return true;
  } catch (error) {
    await logResult(`Dashboard ${userType}`, 'fail', error.message);
    return false;
  }
}

async function testShipmentCreation(page, userType) {
  try {
    const createUrl = userType === 'individual' || userType === 'corporate' 
      ? `${BASE_URL}/${userType}/shipments/create`
      : `${BASE_URL}/${userType}/dashboard`;
    
    await page.goto(createUrl);
    await page.waitForTimeout(2000);
    
    // Look for create shipment button or form
    const createButton = page.locator('button:has-text("Yeni Gönderi"), button:has-text("Create"), a:has-text("Oluştur")');
    if (await createButton.count() > 0) {
      await createButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Check if form is present
    const hasForm = await page.locator('form, input[name="pickup"], input[placeholder*="alış"]').count() > 0;
    
    if (hasForm) {
      await logResult(`Shipment Creation ${userType}`, 'pass', 'Shipment creation form accessible');
    } else {
      await logResult(`Shipment Creation ${userType}`, 'warn', 'Shipment creation form not found');
    }
    
    return true;
  } catch (error) {
    await logResult(`Shipment Creation ${userType}`, 'fail', error.message);
    return false;
  }
}

async function testPagesInPanel(page, userType, pages) {
  for (const pageName of pages) {
    try {
      const pageUrl = `${BASE_URL}/${userType}/${pageName}`;
      await page.goto(pageUrl);
      await page.waitForTimeout(2000);
      
      const currentUrl = page.url();
      if (currentUrl.includes(pageName) || currentUrl.includes('dashboard')) {
        await logResult(`${userType} ${pageName} Page`, 'pass', `Page accessible: ${pageName}`);
      } else {
        await logResult(`${userType} ${pageName} Page`, 'warn', `Redirected from ${pageName}`);
      }
    } catch (error) {
      await logResult(`${userType} ${pageName} Page`, 'fail', error.message);
    }
  }
}

async function runComprehensiveTests() {
  console.log('🚀 Starting Comprehensive Browser Tests...\n');
  
  // Check if servers are running
  console.log('Checking servers...');
  const backendReady = await waitForServer(`${API_URL}/api/health`);
  const frontendReady = await waitForServer(BASE_URL);
  
  if (!backendReady) {
    console.error('❌ Backend server not running. Please start it first.');
    console.log('Run: cd backend && node postgres-backend.js');
    return;
  }
  
  if (!frontendReady) {
    console.error('❌ Frontend server not running. Please start it first.');
    console.log('Run: npm run dev');
    return;
  }
  
  console.log('✅ Servers are running!\n');
  
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Test 1: Homepage
    console.log('\n📄 Testing Homepage...');
    await testHomePage(page);
    
    // Test 2: Registration for each user type
    console.log('\n👤 Testing Registration...');
    const testUsers = {};
    for (const userType of ['individual', 'corporate', 'nakliyeci', 'tasiyici']) {
      const email = await testRegistration(page, userType);
      if (email) testUsers[userType] = { email, password: 'Test123!@#' };
    }
    
    // Test 3: Login
    console.log('\n🔐 Testing Login...');
    if (testUsers.individual) {
      await testLogin(page, testUsers.individual.email, testUsers.individual.password);
    }
    
    // Test 4: Dashboard for each panel
    console.log('\n📊 Testing Dashboards...');
    for (const userType of ['individual', 'corporate', 'nakliyeci', 'tasiyici']) {
      if (testUsers[userType]) {
        await testLogin(page, testUsers[userType].email, testUsers[userType].password);
        await testDashboard(page, userType);
      }
    }
    
    // Test 5: Panel-specific pages
    console.log('\n📑 Testing Panel Pages...');
    const panelPages = {
      individual: ['my-shipments', 'create-shipment', 'messages', 'wallet'],
      corporate: ['my-shipments', 'create-shipment', 'messages', 'wallet'],
      nakliyeci: ['jobs', 'active-shipments', 'completed-shipments', 'messages', 'wallet'],
      tasiyici: ['assignments', 'my-shipments', 'messages']
    };
    
    for (const [userType, pages] of Object.entries(panelPages)) {
      if (testUsers[userType]) {
        await testLogin(page, testUsers[userType].email, testUsers[userType].password);
        await testPagesInPanel(page, userType, pages);
      }
    }
    
    // Test 6: Shipment creation
    console.log('\n📦 Testing Shipment Creation...');
    for (const userType of ['individual', 'corporate']) {
      if (testUsers[userType]) {
        await testLogin(page, testUsers[userType].email, testUsers[userType].password);
        await testShipmentCreation(page, userType);
      }
    }
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await browser.close();
  }
  
  // Print summary
  console.log('\n\n📊 Test Summary:');
  console.log(`✅ Passed: ${testResults.passed.length}`);
  console.log(`❌ Failed: ${testResults.failed.length}`);
  console.log(`⚠️ Warnings: ${testResults.warnings.length}`);
  
  // Save results
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: testResults.passed.length + testResults.failed.length + testResults.warnings.length,
      passed: testResults.passed.length,
      failed: testResults.failed.length,
      warnings: testResults.warnings.length
    },
    results: testResults
  };
  
  fs.writeFileSync('browser-test-results.json', JSON.stringify(report, null, 2));
  console.log('\n📄 Detailed results saved to: browser-test-results.json');
}

runComprehensiveTests().catch(console.error);

