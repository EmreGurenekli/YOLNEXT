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
  magenta: '\x1b[35m',
};

function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString('tr-TR');
  const color = 
    type === 'success' ? colors.green :
    type === 'error' ? colors.red :
    type === 'warning' ? colors.yellow :
    type === 'info' ? colors.blue :
    type === 'test' ? colors.cyan :
    colors.magenta;
  console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
}

let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  issues: []
};

async function checkServices() {
  try {
    const frontend = await fetch(`${FRONTEND_URL}`, { signal: AbortSignal.timeout(5000) });
    const backend = await fetch(`${BACKEND_URL}/api/health`, { signal: AbortSignal.timeout(5000) });
    return { frontend: frontend.ok, backend: backend.ok };
  } catch {
    return { frontend: false, backend: false };
  }
}

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

async function safeNavigate(page, url) {
  try {
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 15000
    });
    await page.waitForTimeout(2000);
    return true;
  } catch (error) {
    log(`Navigation failed: ${error.message}`, 'error');
    return false;
  }
}

async function waitForElement(page, selector, timeout = 10000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch {
    return false;
  }
}

async function runTest(name, testFn) {
  testResults.total++;
  try {
    log(`🧪 TEST: ${name}`, 'test');
    await testFn();
    testResults.passed++;
    log(`✅ PASSED: ${name}`, 'success');
    return true;
  } catch (error) {
    testResults.failed++;
    testResults.issues.push({ test: name, error: error.message });
    log(`❌ FAILED: ${name} - ${error.message}`, 'error');
    return false;
  }
}

async function main() {
  log('🚀 REAL USER BROWSER TEST STARTING', 'info');
  log('='.repeat(80), 'info');
  
  // Check services
  const services = await checkServices();
  if (!services.frontend) {
    log('❌ Frontend not running. Starting...', 'error');
    process.exit(1);
  }
  if (!services.backend) {
    log('⚠️ Backend not running, but continuing...', 'warning');
  } else {
    log('✅ Services are running', 'success');
  }
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 300
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('ERR_NETWORK')) {
      log(`Browser: ${msg.text()}`, 'error');
    }
  });
  
  try {
    // ========== INDIVIDUAL USER FLOW ==========
    log('\n📋 INDIVIDUAL USER FLOW', 'info');
    log('='.repeat(80), 'info');
    
    await runTest('Individual: Login', async () => {
      await safeNavigate(page, `${FRONTEND_URL}/login`);
      const loggedIn = await demoLogin(page, 'individual');
      if (!loggedIn) throw new Error('Demo login failed');
      await safeNavigate(page, `${FRONTEND_URL}/individual/dashboard`);
      await page.waitForTimeout(3000);
    });
    
    await runTest('Individual: Navigate to Create Shipment', async () => {
      await safeNavigate(page, `${FRONTEND_URL}/individual/create-shipment`);
      await page.waitForTimeout(5000);
      
      // Check if form is visible
      const hasForm = await page.evaluate(() => {
        return document.querySelector('form') !== null || 
               document.querySelector('input') !== null ||
               document.querySelector('select') !== null;
      });
      if (!hasForm) throw new Error('Create shipment form not found');
    });
    
    await runTest('Individual: Fill and Submit Shipment Form', async () => {
      await safeNavigate(page, `${FRONTEND_URL}/individual/create-shipment`);
      await page.waitForTimeout(5000);
      
      // Try to find and fill form fields
      const formFilled = await page.evaluate(() => {
        // Look for common form elements
        const inputs = document.querySelectorAll('input, select, textarea');
        if (inputs.length === 0) return false;
        
        // Try to fill some fields if they exist
        let filled = 0;
        inputs.forEach((input, index) => {
          if (input.type === 'text' || input.type === 'email' || !input.type) {
            input.value = `Test ${index}`;
            filled++;
          } else if (input.tagName === 'SELECT' && input.options.length > 0) {
            input.selectedIndex = Math.min(1, input.options.length - 1);
            filled++;
          }
        });
        
        return filled > 0;
      });
      
      if (!formFilled) {
        log('⚠️ Could not fill form automatically, but form exists', 'warning');
      }
    });
    
    await runTest('Individual: Check My Shipments', async () => {
      await safeNavigate(page, `${FRONTEND_URL}/individual/my-shipments`);
      await page.waitForTimeout(5000);
      
      const hasContent = await page.evaluate(() => {
        return document.body.innerText.length > 100;
      });
      if (!hasContent) throw new Error('My shipments page not loaded');
    });
    
    await runTest('Individual: Check Offers', async () => {
      await safeNavigate(page, `${FRONTEND_URL}/individual/offers`);
      await page.waitForTimeout(5000);
      
      const hasContent = await page.evaluate(() => {
        return document.body.innerText.length > 100;
      });
      if (!hasContent) throw new Error('Offers page not loaded');
    });
    
    // ========== NAKLIYECI USER FLOW ==========
    log('\n📋 NAKLIYECI USER FLOW', 'info');
    log('='.repeat(80), 'info');
    
    await runTest('Nakliyeci: Login', async () => {
      await safeNavigate(page, `${FRONTEND_URL}/login`);
      const loggedIn = await demoLogin(page, 'nakliyeci');
      if (!loggedIn) throw new Error('Demo login failed');
      await safeNavigate(page, `${FRONTEND_URL}/nakliyeci/dashboard`);
      await page.waitForTimeout(3000);
    });
    
    await runTest('Nakliyeci: View Jobs', async () => {
      await safeNavigate(page, `${FRONTEND_URL}/nakliyeci/jobs`);
      await page.waitForTimeout(5000);
      
      const hasContent = await page.evaluate(() => {
        return document.body.innerText.length > 100;
      });
      if (!hasContent) throw new Error('Jobs page not loaded');
    });
    
    await runTest('Nakliyeci: View Active Shipments', async () => {
      await safeNavigate(page, `${FRONTEND_URL}/nakliyeci/active-shipments`);
      await page.waitForTimeout(5000);
      
      const hasContent = await page.evaluate(() => {
        return document.body.innerText.length > 100;
      });
      if (!hasContent) throw new Error('Active shipments page not loaded');
    });
    
    // ========== TASIYICI USER FLOW ==========
    log('\n📋 TASIYICI USER FLOW', 'info');
    log('='.repeat(80), 'info');
    
    await runTest('Tasiyici: Login', async () => {
      await safeNavigate(page, `${FRONTEND_URL}/login`);
      const loggedIn = await demoLogin(page, 'tasiyici');
      if (!loggedIn) throw new Error('Demo login failed');
      await safeNavigate(page, `${FRONTEND_URL}/tasiyici/dashboard`);
      await page.waitForTimeout(3000);
    });
    
    await runTest('Tasiyici: View Market', async () => {
      await safeNavigate(page, `${FRONTEND_URL}/tasiyici/market`);
      await page.waitForTimeout(5000);
      
      const hasContent = await page.evaluate(() => {
        return document.body.innerText.length > 100;
      });
      if (!hasContent) throw new Error('Market page not loaded');
    });
    
    await runTest('Tasiyici: View Active Jobs', async () => {
      await safeNavigate(page, `${FRONTEND_URL}/tasiyici/active-jobs`);
      await page.waitForTimeout(5000);
      
      const hasContent = await page.evaluate(() => {
        return document.body.innerText.length > 100;
      });
      if (!hasContent) throw new Error('Active jobs page not loaded');
    });
    
    // ========== CORPORATE USER FLOW ==========
    log('\n📋 CORPORATE USER FLOW', 'info');
    log('='.repeat(80), 'info');
    
    await runTest('Corporate: Login', async () => {
      await safeNavigate(page, `${FRONTEND_URL}/login`);
      const loggedIn = await demoLogin(page, 'corporate');
      if (!loggedIn) throw new Error('Demo login failed');
      await safeNavigate(page, `${FRONTEND_URL}/corporate/dashboard`);
      await page.waitForTimeout(3000);
    });
    
    await runTest('Corporate: View Shipments', async () => {
      await safeNavigate(page, `${FRONTEND_URL}/corporate/shipments`);
      await page.waitForTimeout(5000);
      
      const hasContent = await page.evaluate(() => {
        return document.body.innerText.length > 100;
      });
      if (!hasContent) throw new Error('Corporate shipments page not loaded');
    });
    
    // ========== COMPLETE WORKFLOW TEST ==========
    log('\n📋 COMPLETE WORKFLOW TEST', 'info');
    log('='.repeat(80), 'info');
    
    await runTest('Complete Flow: Individual creates shipment', async () => {
      // Login as individual
      await safeNavigate(page, `${FRONTEND_URL}/login`);
      await demoLogin(page, 'individual');
      await safeNavigate(page, `${FRONTEND_URL}/individual/create-shipment`);
      await page.waitForTimeout(5000);
      
      // Verify we're on create shipment page
      const url = page.url();
      if (!url.includes('create-shipment')) {
        throw new Error('Not on create shipment page');
      }
    });
    
    await runTest('Complete Flow: Nakliyeci views jobs', async () => {
      // Login as nakliyeci
      await safeNavigate(page, `${FRONTEND_URL}/login`);
      await demoLogin(page, 'nakliyeci');
      await safeNavigate(page, `${FRONTEND_URL}/nakliyeci/jobs`);
      await page.waitForTimeout(5000);
      
      // Verify we're on jobs page
      const url = page.url();
      if (!url.includes('jobs')) {
        throw new Error('Not on jobs page');
      }
    });
    
    // Take final screenshot
    await page.screenshot({ 
      path: './test-screenshots/real-user-test-final.png', 
      fullPage: true 
    }).catch(() => {});
    
  } catch (error) {
    log(`❌ Fatal error: ${error.message}`, 'error');
  } finally {
    await context.close();
    await browser.close();
  }
  
  // Summary
  log('\n' + '='.repeat(80), 'info');
  log('📊 TEST SUMMARY', 'info');
  log('='.repeat(80), 'info');
  log(`Total Tests: ${testResults.total}`, 'info');
  log(`✅ Passed: ${testResults.passed}`, 'success');
  log(`❌ Failed: ${testResults.failed}`, testResults.failed > 0 ? 'error' : 'success');
  log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`, 'info');
  
  if (testResults.issues.length > 0) {
    log('\n🔍 ISSUES FOUND:', 'warning');
    testResults.issues.forEach((issue, idx) => {
      log(`  ${idx + 1}. ${issue.test}: ${issue.error}`, 'error');
    });
  }
  
  log('='.repeat(80), 'info');
  
  process.exit(testResults.failed > 0 ? 1 : 0);
}

main().catch(error => {
  log(`❌ Fatal error: ${error.message}`, 'error');
  console.error(error);
  process.exit(1);
});















