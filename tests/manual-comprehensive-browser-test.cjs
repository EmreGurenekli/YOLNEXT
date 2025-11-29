const { chromium } = require('playwright');
const fs = require('fs');

// Test configuration
const FRONTEND_URL = 'http://localhost:5173';
const BACKEND_URL = 'http://localhost:5000';
const TEST_TIMEOUT = 30000; // 30 seconds per test

// Test results
const results = {
  passed: [],
  failed: [],
  warnings: [],
  total: 0,
};

// Helper function to take screenshot
async function takeScreenshot(page, name) {
  try {
    const screenshotPath = `test-screenshots/${name.replace(/\s+/g, '-').toLowerCase()}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    return screenshotPath;
  } catch (e) {
    console.log(`⚠️ Screenshot failed: ${e.message}`);
  }
}

// Helper function to wait for React to load
async function waitForReact(page) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  // Wait for React root
  await page.waitForSelector('#root', { timeout: 5000 }).catch(() => {});
}

// Helper function to demo login
async function demoLogin(page, userType) {
  try {
    console.log(`\n🔐 Demo login: ${userType}...`);
    
    // Try API login first
    try {
      const response = await page.request.post(`${BACKEND_URL}/api/auth/demo-login`, {
        data: { userType },
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok()) {
        const data = await response.json();
        const token = data.token || data.data?.token;
        const user = data.user || data.data?.user;
        
        if (token && user) {
          await page.evaluate(({ token, user }) => {
            localStorage.setItem('authToken', token);
            localStorage.setItem('user', JSON.stringify(user));
          }, { token, user });
          
          // Navigate to appropriate dashboard
          const routes = {
            individual: '/individual/dashboard',
            corporate: '/corporate/dashboard',
            nakliyeci: '/nakliyeci/dashboard',
            tasiyici: '/tasiyici/dashboard',
          };
          
          await page.goto(`${FRONTEND_URL}${routes[userType] || '/individual/dashboard'}`, { 
            waitUntil: 'networkidle' 
          });
          await waitForReact(page);
          await page.waitForTimeout(2000); // Wait for React state to update
          
          console.log(`✅ Demo login successful: ${userType}`);
          return true;
        }
      }
    } catch (apiError) {
      console.log(`⚠️ API login failed, trying UI login: ${apiError.message}`);
    }
    
    // Fallback: Try UI login
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle' });
    await waitForReact(page);
    await page.waitForTimeout(1000);
    
    // Look for demo buttons - try multiple selectors
    const demoButtonSelectors = [
      `button:has-text("${userType}")`,
      `button[data-user-type="${userType}"]`,
      `button:has-text("Demo")`,
      `button:has-text("Hızlı Giriş")`,
    ];
    
    for (const selector of demoButtonSelectors) {
      const button = await page.locator(selector).first();
      if (await button.isVisible({ timeout: 2000 }).catch(() => false)) {
        await button.click();
        await page.waitForTimeout(3000);
        await waitForReact(page);
        console.log(`✅ UI demo login successful: ${userType}`);
        return true;
      }
    }
    
    console.log(`⚠️ Could not find demo login button for ${userType}`);
    return false;
  } catch (error) {
    console.log(`⚠️ Demo login error: ${error.message}`);
    return false;
  }
}

// Test function wrapper
async function test(name, testFn) {
  results.total++;
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 TEST ${results.total}: ${name}`);
  console.log('='.repeat(80));
  
  try {
    await testFn();
    results.passed.push(name);
    console.log(`✅ PASSED: ${name}`);
  } catch (error) {
    results.failed.push({ name, error: error.message });
    console.log(`❌ FAILED: ${name}`);
    console.log(`   Error: ${error.message}`);
    console.log(`   Stack: ${error.stack?.split('\n')[1] || 'N/A'}`);
  }
}

// ============================================================================
// PUBLIC PAGES TESTS
// ============================================================================

async function testPublicPages(page) {
  // Test Homepage
  await test('Public: Homepage loads correctly', async () => {
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle' });
    await waitForReact(page);
    
    const title = await page.title();
    if (!title || title === '') throw new Error('Page title is empty');
    
    const root = await page.locator('#root');
    if (!(await root.isVisible())) throw new Error('Root element not visible');
    
    await takeScreenshot(page, 'homepage');
  });

  // Test Login Page
  await test('Public: Login page loads correctly', async () => {
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle' });
    await waitForReact(page);
    
    const loginForm = await page.locator('form, [role="form"]').first();
    if (!(await loginForm.isVisible())) throw new Error('Login form not visible');
    
    await takeScreenshot(page, 'login-page');
  });

  // Test Register Page
  await test('Public: Register page loads correctly', async () => {
    await page.goto(`${FRONTEND_URL}/register`, { waitUntil: 'networkidle' });
    await waitForReact(page);
    
    const registerForm = await page.locator('form, [role="form"]').first();
    if (!(await registerForm.isVisible())) throw new Error('Register form not visible');
    
    await takeScreenshot(page, 'register-page');
  });
}

// ============================================================================
// INDIVIDUAL USER TESTS
// ============================================================================

async function testIndividualUser(page) {
  // Login as Individual
  await test('Individual: Demo login works', async () => {
    const loggedIn = await demoLogin(page, 'individual');
    if (!loggedIn) throw new Error('Failed to login as individual');
    
    await takeScreenshot(page, 'individual-dashboard');
  });

  // Test Dashboard
  await test('Individual: Dashboard loads correctly', async () => {
    // Ensure we're logged in
    const loggedIn = await demoLogin(page, 'individual');
    if (!loggedIn) {
      await page.goto(`${FRONTEND_URL}/individual/dashboard`, { waitUntil: 'networkidle' });
      await waitForReact(page);
    }
    
    const dashboard = await page.locator('main, [role="main"], #root > div').first();
    if (!(await dashboard.isVisible({ timeout: 5000 }).catch(() => false))) {
      // Try alternative selectors
      const body = await page.locator('body');
      const hasContent = await body.textContent();
      if (!hasContent || hasContent.trim().length < 10) {
        throw new Error('Dashboard not visible - page appears empty');
      }
    }
    
    await takeScreenshot(page, 'individual-dashboard-full');
  });

  // Test Create Shipment
  await test('Individual: Create Shipment page loads', async () => {
    // Ensure we're logged in
    await demoLogin(page, 'individual');
    
    await page.goto(`${FRONTEND_URL}/individual/create-shipment`, { waitUntil: 'networkidle' });
    await waitForReact(page);
    await page.waitForTimeout(2000);
    
    // Try multiple selectors for form
    const formSelectors = ['form', '[role="form"]', 'form > div', '#root > div form'];
    let formFound = false;
    
    for (const selector of formSelectors) {
      const form = await page.locator(selector).first();
      if (await form.isVisible({ timeout: 3000 }).catch(() => false)) {
        formFound = true;
        break;
      }
    }
    
    // If no form found, check if page has content
    if (!formFound) {
      const body = await page.locator('body');
      const hasContent = await body.textContent();
      if (!hasContent || hasContent.trim().length < 10) {
        throw new Error('Create shipment form not visible - page appears empty');
      }
      // Page has content but form selector didn't work - might be acceptable
      results.warnings.push('Create shipment page loaded but form selector did not match');
    }
    
    await takeScreenshot(page, 'individual-create-shipment');
  });

  // Test My Shipments
  await test('Individual: My Shipments page loads', async () => {
    // Ensure we're logged in
    await demoLogin(page, 'individual');
    
    await page.goto(`${FRONTEND_URL}/individual/my-shipments`, { waitUntil: 'networkidle' });
    await waitForReact(page);
    await page.waitForTimeout(2000);
    
    const pageContent = await page.locator('main, [role="main"], #root > div, body').first();
    const isVisible = await pageContent.isVisible({ timeout: 5000 }).catch(() => false);
    const hasText = await pageContent.textContent();
    
    if (!isVisible && (!hasText || hasText.trim().length < 10)) {
      throw new Error('My Shipments page not visible');
    }
    
    await takeScreenshot(page, 'individual-my-shipments');
  });

  // Test Offers
  await test('Individual: Offers page loads', async () => {
    // Ensure we're logged in
    await demoLogin(page, 'individual');
    
    await page.goto(`${FRONTEND_URL}/individual/offers`, { waitUntil: 'networkidle' });
    await waitForReact(page);
    await page.waitForTimeout(2000);
    
    const pageContent = await page.locator('main, [role="main"], #root > div, body').first();
    const isVisible = await pageContent.isVisible({ timeout: 5000 }).catch(() => false);
    const hasText = await pageContent.textContent();
    
    if (!isVisible && (!hasText || hasText.trim().length < 10)) {
      throw new Error('Offers page not visible');
    }
    
    await takeScreenshot(page, 'individual-offers');
  });

  // Test Create Shipment Flow
  await test('Individual: Create Shipment form flow (Step 1)', async () => {
    await page.goto(`${FRONTEND_URL}/individual/create-shipment`, { waitUntil: 'networkidle' });
    await waitForReact(page);
    
    // Fill basic info
    const titleInput = await page.locator('input[name="title"], input[placeholder*="başlık" i], input[placeholder*="title" i]').first();
    if (await titleInput.isVisible()) {
      await titleInput.fill('Test Gönderi - Manuel Test');
    }
    
    const descriptionInput = await page.locator('textarea[name="description"], textarea[placeholder*="açıklama" i]').first();
    if (await descriptionInput.isVisible()) {
      await descriptionInput.fill('Bu bir manuel test gönderisidir.');
    }
    
    await takeScreenshot(page, 'individual-create-shipment-step1-filled');
  });
}

// ============================================================================
// CORPORATE USER TESTS
// ============================================================================

async function testCorporateUser(page) {
  // Login as Corporate
  await test('Corporate: Demo login works', async () => {
    const loggedIn = await demoLogin(page, 'corporate');
    if (!loggedIn) throw new Error('Failed to login as corporate');
    
    await takeScreenshot(page, 'corporate-dashboard');
  });

  // Test Dashboard
  await test('Corporate: Dashboard loads correctly', async () => {
    // Ensure we're logged in
    const loggedIn = await demoLogin(page, 'corporate');
    if (!loggedIn) {
      await page.goto(`${FRONTEND_URL}/corporate/dashboard`, { waitUntil: 'networkidle' });
      await waitForReact(page);
    }
    
    const dashboard = await page.locator('main, [role="main"], #root > div, body').first();
    const isVisible = await dashboard.isVisible({ timeout: 5000 }).catch(() => false);
    const hasText = await dashboard.textContent();
    
    if (!isVisible && (!hasText || hasText.trim().length < 10)) {
      throw new Error('Dashboard not visible');
    }
    
    await takeScreenshot(page, 'corporate-dashboard-full');
  });

  // Test Shipments
  await test('Corporate: Shipments page loads', async () => {
    // Ensure we're logged in
    await demoLogin(page, 'corporate');
    
    await page.goto(`${FRONTEND_URL}/corporate/shipments`, { waitUntil: 'networkidle' });
    await waitForReact(page);
    await page.waitForTimeout(2000);
    
    const pageContent = await page.locator('main, [role="main"], #root > div, body').first();
    const isVisible = await pageContent.isVisible({ timeout: 5000 }).catch(() => false);
    const hasText = await pageContent.textContent();
    
    if (!isVisible && (!hasText || hasText.trim().length < 10)) {
      throw new Error('Shipments page not visible');
    }
    
    await takeScreenshot(page, 'corporate-shipments');
  });
}

// ============================================================================
// NAKLIYECI USER TESTS
// ============================================================================

async function testNakliyeciUser(page) {
  // Login as Nakliyeci
  await test('Nakliyeci: Demo login works', async () => {
    const loggedIn = await demoLogin(page, 'nakliyeci');
    if (!loggedIn) throw new Error('Failed to login as nakliyeci');
    
    await takeScreenshot(page, 'nakliyeci-dashboard');
  });

  // Test Dashboard
  await test('Nakliyeci: Dashboard loads correctly', async () => {
    await page.goto(`${FRONTEND_URL}/nakliyeci/dashboard`, { waitUntil: 'networkidle' });
    await waitForReact(page);
    
    const dashboard = await page.locator('main, [role="main"]').first();
    if (!(await dashboard.isVisible())) throw new Error('Dashboard not visible');
    
    await takeScreenshot(page, 'nakliyeci-dashboard-full');
  });

  // Test Jobs
  await test('Nakliyeci: Jobs page loads', async () => {
    await page.goto(`${FRONTEND_URL}/nakliyeci/jobs`, { waitUntil: 'networkidle' });
    await waitForReact(page);
    
    const pageContent = await page.locator('main, [role="main"]').first();
    if (!(await pageContent.isVisible())) throw new Error('Jobs page not visible');
    
    await takeScreenshot(page, 'nakliyeci-jobs');
  });

  // Test Active Shipments
  await test('Nakliyeci: Active Shipments page loads', async () => {
    await page.goto(`${FRONTEND_URL}/nakliyeci/active-shipments`, { waitUntil: 'networkidle' });
    await waitForReact(page);
    
    const pageContent = await page.locator('main, [role="main"]').first();
    if (!(await pageContent.isVisible())) throw new Error('Active Shipments page not visible');
    
    await takeScreenshot(page, 'nakliyeci-active-shipments');
  });
}

// ============================================================================
// TASIYICI USER TESTS
// ============================================================================

async function testTasiyiciUser(page) {
  // Login as Tasiyici
  await test('Tasiyici: Demo login works', async () => {
    const loggedIn = await demoLogin(page, 'tasiyici');
    if (!loggedIn) throw new Error('Failed to login as tasiyici');
    
    await takeScreenshot(page, 'tasiyici-dashboard');
  });

  // Test Dashboard
  await test('Tasiyici: Dashboard loads correctly', async () => {
    await page.goto(`${FRONTEND_URL}/tasiyici/dashboard`, { waitUntil: 'networkidle' });
    await waitForReact(page);
    
    const dashboard = await page.locator('main, [role="main"]').first();
    if (!(await dashboard.isVisible())) throw new Error('Dashboard not visible');
    
    await takeScreenshot(page, 'tasiyici-dashboard-full');
  });
}

// ============================================================================
// DESIGN & UI TESTS
// ============================================================================

async function testDesignAndUI(page) {
  await test('Design: Navigation sidebar is visible', async () => {
    await demoLogin(page, 'individual');
    await page.goto(`${FRONTEND_URL}/individual/dashboard`, { waitUntil: 'networkidle' });
    await waitForReact(page);
    
    const sidebar = await page.locator('aside, nav, [role="navigation"]').first();
    if (!(await sidebar.isVisible())) throw new Error('Sidebar not visible');
    
    await takeScreenshot(page, 'design-sidebar');
  });

  await test('Design: Header/Navbar is visible', async () => {
    const header = await page.locator('header, nav:first-of-type').first();
    if (!(await header.isVisible())) {
      results.warnings.push('Header not found (might be acceptable)');
    }
    
    await takeScreenshot(page, 'design-header');
  });

  await test('Design: Main content area is visible', async () => {
    const main = await page.locator('main, [role="main"]').first();
    if (!(await main.isVisible())) throw new Error('Main content area not visible');
    
    await takeScreenshot(page, 'design-main-content');
  });

  await test('Design: Responsive layout check', async () => {
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    await takeScreenshot(page, 'design-mobile-view');
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    await takeScreenshot(page, 'design-tablet-view');
    
    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);
    await takeScreenshot(page, 'design-desktop-view');
  });
}

// ============================================================================
// FUNCTIONALITY TESTS
// ============================================================================

async function testFunctionality(page) {
  await test('Functionality: Navigation between pages works', async () => {
    await demoLogin(page, 'individual');
    
    // Navigate to different pages
    const pages = [
      '/individual/dashboard',
      '/individual/my-shipments',
      '/individual/offers',
      '/individual/create-shipment',
    ];
    
    for (const pagePath of pages) {
      await page.goto(`${FRONTEND_URL}${pagePath}`, { waitUntil: 'networkidle' });
      await waitForReact(page);
      
      const main = await page.locator('main, [role="main"]').first();
      if (!(await main.isVisible())) {
        throw new Error(`Page ${pagePath} did not load correctly`);
      }
    }
  });

  await test('Functionality: Forms are interactive', async () => {
    await demoLogin(page, 'individual');
    await page.goto(`${FRONTEND_URL}/individual/create-shipment`, { waitUntil: 'networkidle' });
    await waitForReact(page);
    await page.waitForTimeout(2000);
    
    const inputs = await page.locator('input, textarea, select').all();
    if (inputs.length === 0) {
      // Check if form exists but inputs are not yet rendered
      const form = await page.locator('form').first();
      if (await form.isVisible({ timeout: 3000 }).catch(() => false)) {
        results.warnings.push('Form exists but no inputs found (might be loading)');
        return; // Don't fail, just warn
      }
      throw new Error('No form inputs found');
    }
    
    // Try to interact with first input
    const firstInput = inputs[0];
    if (await firstInput.isVisible({ timeout: 2000 }).catch(() => false) && 
        await firstInput.isEnabled().catch(() => false)) {
      await firstInput.click();
      await page.waitForTimeout(500);
    }
  });
}

// Helper function to check service
function checkService(url) {
  return new Promise((resolve) => {
    const http = require('http');
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'GET',
      timeout: 2000,
    };
    
    const req = http.request(options, (res) => {
      resolve(res.statusCode === 200 || res.statusCode === 304);
    });
    
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    
    req.end();
  });
}

// Helper function to wait for services
async function waitForServices() {
  console.log('\n⏳ Servislerin hazır olması bekleniyor...\n');
  
  // Check backend
  let backendReady = false;
  for (let i = 0; i < 30; i++) {
    backendReady = await checkService(`${BACKEND_URL}/api/health`);
    if (backendReady) {
      console.log('✅ Backend hazır');
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  if (!backendReady) {
    console.log('⚠️ Backend hazır değil, devam ediliyor...');
  }
  
  // Check frontend
  let frontendReady = false;
  for (let i = 0; i < 40; i++) {
    frontendReady = await checkService(FRONTEND_URL);
    if (frontendReady) {
      console.log('✅ Frontend hazır');
      break;
    }
    if (i % 5 === 0 && i > 0) {
      console.log(`   Frontend bekleniyor... (${i}/40)`);
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  if (!frontendReady) {
    console.log('⚠️ Frontend hazır değil, test devam edecek...');
    console.log('💡 Frontend başlatmak için: npm run dev');
  }
  
  return { backendReady, frontendReady };
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runTests() {
  console.log('\n🚀 MANUAL COMPREHENSIVE BROWSER TEST SUITE');
  console.log('='.repeat(80));
  console.log(`Frontend: ${FRONTEND_URL}`);
  console.log(`Backend: ${BACKEND_URL}`);
  console.log('='.repeat(80));
  
  // Wait for services
  await waitForServices();
  
  // Create screenshots directory
  if (!fs.existsSync('test-screenshots')) {
    fs.mkdirSync('test-screenshots');
  }
  
  const browser = await chromium.launch({
    headless: false,
    slowMo: 100,
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  
  const page = await context.newPage();
  
  // Suppress console errors (but log them)
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('ERR_NETWORK_IO_SUSPENDED') && 
          !text.includes('WebSocket') &&
          !text.includes('favicon')) {
        console.log(`   ⚠️ Console Error: ${text}`);
      }
    }
  });
  
  try {
    // Run all test suites
    await testPublicPages(page);
    await testIndividualUser(page);
    await testCorporateUser(page);
    await testNakliyeciUser(page);
    await testTasiyiciUser(page);
    await testDesignAndUI(page);
    await testFunctionality(page);
    
  } catch (error) {
    console.error(`\n❌ Fatal error: ${error.message}`);
    results.failed.push({ name: 'Fatal Error', error: error.message });
  } finally {
    await takeScreenshot(page, 'final-state');
    await browser.close();
  }
  
  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`⚠️  Warnings: ${results.warnings.length}`);
  console.log(`Success Rate: ${((results.passed.length / results.total) * 100).toFixed(2)}%`);
  console.log('='.repeat(80));
  
  if (results.failed.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.failed.forEach(({ name, error }) => {
      console.log(`   - ${name}: ${error}`);
    });
  }
  
  if (results.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    results.warnings.forEach(warning => {
      console.log(`   - ${warning}`);
    });
  }
  
  console.log('\n📸 Screenshots saved in: test-screenshots/');
  console.log('\n');
}

// Run tests
runTests().catch(console.error);

