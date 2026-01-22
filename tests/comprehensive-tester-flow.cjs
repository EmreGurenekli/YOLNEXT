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

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const issues = [];

async function checkBackend() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/health`, { signal: AbortSignal.timeout(5000) });
    return response.ok;
  } catch {
    return false;
  }
}

async function checkFrontend() {
  try {
    const response = await fetch(`${FRONTEND_URL}`, { signal: AbortSignal.timeout(5000) });
    return response.ok;
  } catch {
    return false;
  }
}

async function safeNavigate(page, url, options = {}) {
  const maxRetries = 3;
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
        ...options
      });
      return true;
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        await page.waitForTimeout(2000);
        log(`⚠️ Navigation retry ${i + 1}/${maxRetries} for ${url}`, 'warning');
      }
    }
  }
  
  throw lastError;
}

async function runTest(name, testFn, fixFn = null) {
  totalTests++;
  const testStartTime = Date.now();
  try {
    log(`🧪 TEST ${totalTests}: ${name}`, 'test');
    
    // Check services before test
    const backendOk = await checkBackend();
    const frontendOk = await checkFrontend();
    if (!frontendOk) {
      throw new Error('Frontend not responding');
    }
    
    // Run test with timeout
    await Promise.race([
      testFn(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Test timeout (30s)')), 30000)
      )
    ]);
    
    const duration = ((Date.now() - testStartTime) / 1000).toFixed(1);
    passedTests++;
    log(`✅ PASSED: ${name} (${duration}s)`, 'success');
    return true;
  } catch (error) {
    const duration = ((Date.now() - testStartTime) / 1000).toFixed(1);
    failedTests++;
    log(`❌ FAILED: ${name} - ${error.message} (${duration}s)`, 'error');
    issues.push({ test: name, error: error.message });
    
    // Try to fix if fix function provided
    if (fixFn) {
      try {
        log(`🔧 Attempting to fix: ${name}...`, 'warning');
        await fixFn(error);
        log(`✅ Fix applied for: ${name}`, 'success');
        // Retry test
        try {
          await Promise.race([
            testFn(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Retry timeout (30s)')), 30000)
            )
          ]);
          passedTests++;
          failedTests--;
          log(`✅ RETRY PASSED: ${name}`, 'success');
          return true;
        } catch (retryError) {
          log(`❌ RETRY FAILED: ${name}`, 'error');
        }
      } catch (fixError) {
        log(`❌ Fix failed: ${fixError.message}`, 'error');
      }
    }
    
    return false;
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

async function waitForReact(page, timeout = 30000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const hasContent = await page.evaluate(() => {
      const root = document.getElementById('root');
      return root && root.children.length > 0;
    });
    if (hasContent) return true;
    await page.waitForTimeout(1000);
  }
  return false;
}

async function main() {
  log('🚀 COMPREHENSIVE TESTER FLOW STARTING', 'info');
  log('='.repeat(80), 'info');
  
  // Check services
  const backendOk = await checkBackend();
  const frontendOk = await checkFrontend();
  
  if (!frontendOk) {
    log('❌ Frontend not responding at http://localhost:5173', 'error');
    log('⚠️ Please start the frontend: npm run dev', 'warning');
    process.exit(1);
  } else {
    log('✅ Frontend is running', 'success');
  }
  
  if (!backendOk) {
    log('⚠️ Backend not responding, but continuing tests...', 'warning');
  } else {
    log('✅ Backend is running', 'success');
  }
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 100
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true
  });
  
  const page = await context.newPage();
  
  // Suppress non-critical console errors
  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error' && !text.includes('ERR_NETWORK_IO_SUSPENDED') && !text.includes('WebSocket')) {
      log(`Browser Error: ${text}`, 'error');
    }
  });
  
  page.on('pageerror', error => {
    if (!error.message.includes('ERR_NETWORK')) {
      log(`Page Error: ${error.message}`, 'error');
    }
  });
  
  // Handle page crashes
  page.on('crash', () => {
    log('⚠️ Page crashed, attempting recovery...', 'warning');
  });
  
  try {
    // ========== INDIVIDUAL PANEL TESTS ==========
    log('\n📋 INDIVIDUAL PANEL TESTS', 'info');
    log('='.repeat(80), 'info');
    
    await runTest('Individual: Login as demo user', async () => {
      await safeNavigate(page, `${FRONTEND_URL}/login`);
      await page.waitForTimeout(2000);
      
      const loggedIn = await demoLogin(page, 'individual');
      if (!loggedIn) throw new Error('Demo login failed');
      
      await safeNavigate(page, `${FRONTEND_URL}/individual/dashboard`);
      await page.waitForTimeout(3000);
      
      const url = page.url();
      if (!url.includes('/individual')) throw new Error('Not on individual panel');
    });
    
    await runTest('Individual: Navigate to Dashboard', async () => {
      await safeNavigate(page, `${FRONTEND_URL}/individual/dashboard`);
      await page.waitForTimeout(3000);
      await waitForReact(page, 10000);
      
      const hasContent = await page.evaluate(() => {
        return document.body.innerText.length > 100;
      });
      if (!hasContent) throw new Error('Dashboard not loaded');
    });
    
    await runTest('Individual: Navigate to Create Shipment', async () => {
      await safeNavigate(page, `${FRONTEND_URL}/individual/create-shipment`);
      await page.waitForTimeout(5000);
      await waitForReact(page, 10000);
      
      const url = page.url();
      if (url.includes('/login')) throw new Error('Redirected to login');
    });
    
    await runTest('Individual: Navigate to My Shipments', async () => {
      await safeNavigate(page, `${FRONTEND_URL}/individual/my-shipments`);
      await page.waitForTimeout(3000);
      await waitForReact(page, 10000);
      
      const url = page.url();
      if (url.includes('/login')) throw new Error('Redirected to login');
    });
    
    await runTest('Individual: Navigate to Offers', async () => {
      await safeNavigate(page, `${FRONTEND_URL}/individual/offers`);
      await page.waitForTimeout(3000);
      await waitForReact(page, 10000);
    });
    
    await runTest('Individual: Navigate to Messages', async () => {
      await safeNavigate(page, `${FRONTEND_URL}/individual/messages`);
      await page.waitForTimeout(3000);
      await waitForReact(page, 10000);
    });
    
    // Wait between panel tests to avoid rate limiting
    await page.waitForTimeout(2000);
    
    // ========== CORPORATE PANEL TESTS ==========
    log('\n📋 CORPORATE PANEL TESTS', 'info');
    log('='.repeat(80), 'info');
    
    await runTest('Corporate: Login as demo user', async () => {
      await safeNavigate(page, `${FRONTEND_URL}/login`);
      await page.waitForTimeout(2000);
      
      const loggedIn = await demoLogin(page, 'corporate');
      if (!loggedIn) throw new Error('Demo login failed');
      
      await safeNavigate(page, `${FRONTEND_URL}/corporate/dashboard`);
      await page.waitForTimeout(3000);
    });
    
    await runTest('Corporate: Navigate to Dashboard', async () => {
      await safeNavigate(page, `${FRONTEND_URL}/corporate/dashboard`);
      await page.waitForTimeout(3000);
      await waitForReact(page, 10000);
    });
    
    await runTest('Corporate: Navigate to Create Shipment', async () => {
      await safeNavigate(page, `${FRONTEND_URL}/corporate/create-shipment`);
      await page.waitForTimeout(5000);
      await waitForReact(page, 10000);
    });
    
    await runTest('Corporate: Navigate to Shipments', async () => {
      await safeNavigate(page, `${FRONTEND_URL}/corporate/shipments`);
      await page.waitForTimeout(3000);
      await waitForReact(page, 10000);
    });
    
    // Wait between panel tests to avoid rate limiting
    await page.waitForTimeout(2000);
    
    // ========== NAKLIYECI PANEL TESTS ==========
    log('\n📋 NAKLIYECI PANEL TESTS', 'info');
    log('='.repeat(80), 'info');
    
    await runTest('Nakliyeci: Login as demo user', async () => {
      await safeNavigate(page, `${FRONTEND_URL}/login`);
      await page.waitForTimeout(2000);
      
      const loggedIn = await demoLogin(page, 'nakliyeci');
      if (!loggedIn) throw new Error('Demo login failed');
      
      await safeNavigate(page, `${FRONTEND_URL}/nakliyeci/dashboard`);
      await page.waitForTimeout(3000);
    });
    
    await runTest('Nakliyeci: Navigate to Dashboard', async () => {
      await safeNavigate(page, `${FRONTEND_URL}/nakliyeci/dashboard`);
      await page.waitForTimeout(3000);
      await waitForReact(page, 10000);
    });
    
    await runTest('Nakliyeci: Navigate to Jobs', async () => {
      await safeNavigate(page, `${FRONTEND_URL}/nakliyeci/jobs`);
      await page.waitForTimeout(3000);
      await waitForReact(page, 10000);
    });
    
    await runTest('Nakliyeci: Navigate to Active Shipments', async () => {
      await safeNavigate(page, `${FRONTEND_URL}/nakliyeci/active-shipments`);
      await page.waitForTimeout(3000);
      await waitForReact(page, 10000);
    });
    
    // Wait between panel tests to avoid rate limiting
    await page.waitForTimeout(2000);
    
    // ========== TASIYICI PANEL TESTS ==========
    log('\n📋 TASIYICI PANEL TESTS', 'info');
    log('='.repeat(80), 'info');
    
    await runTest('Tasiyici: Login as demo user', async () => {
      await safeNavigate(page, `${FRONTEND_URL}/login`);
      await page.waitForTimeout(2000);
      
      const loggedIn = await demoLogin(page, 'tasiyici');
      if (!loggedIn) throw new Error('Demo login failed');
      
      await safeNavigate(page, `${FRONTEND_URL}/tasiyici/dashboard`);
      await page.waitForTimeout(3000);
    });
    
    await runTest('Tasiyici: Navigate to Dashboard', async () => {
      await safeNavigate(page, `${FRONTEND_URL}/tasiyici/dashboard`);
      await page.waitForTimeout(3000);
      await waitForReact(page, 10000);
    });
    
    await runTest('Tasiyici: Navigate to Market', async () => {
      await safeNavigate(page, `${FRONTEND_URL}/tasiyici/market`);
      await page.waitForTimeout(3000);
      await waitForReact(page, 10000);
    });
    
    await runTest('Tasiyici: Navigate to Active Jobs', async () => {
      await safeNavigate(page, `${FRONTEND_URL}/tasiyici/active-jobs`);
      await page.waitForTimeout(3000);
      await waitForReact(page, 10000);
    });
    
    // ========== PUBLIC PAGES TESTS ==========
    log('\n📋 PUBLIC PAGES TESTS', 'info');
    log('='.repeat(80), 'info');
    
    await runTest('Public: Landing Page', async () => {
      await safeNavigate(page, `${FRONTEND_URL}/`);
      await page.waitForTimeout(2000);
      await waitForReact(page, 10000);
    });
    
    await runTest('Public: Login Page', async () => {
      await safeNavigate(page, `${FRONTEND_URL}/login`);
      await page.waitForTimeout(2000);
      await waitForReact(page, 10000);
    });
    
    await runTest('Public: Register Page', async () => {
      await safeNavigate(page, `${FRONTEND_URL}/register`);
      await page.waitForTimeout(2000);
      await waitForReact(page, 10000);
    });
    
    await runTest('Public: Terms Page', async () => {
      await safeNavigate(page, `${FRONTEND_URL}/terms`);
      await page.waitForTimeout(2000);
      await waitForReact(page, 10000);
    });
    
    await runTest('Public: Privacy Page', async () => {
      await safeNavigate(page, `${FRONTEND_URL}/privacy`);
      await page.waitForTimeout(2000);
      await waitForReact(page, 10000);
    });
    
  } catch (error) {
    log(`❌ Fatal error: ${error.message}`, 'error');
  } finally {
    try {
      if (!page.isClosed()) {
        await page.screenshot({ path: './test-screenshots/final-comprehensive-test.png', fullPage: true }).catch(() => {});
      }
    } catch (e) {
      // Ignore screenshot errors
    }
    try {
      await context.close();
    } catch (e) {
      // Ignore close errors
    }
    try {
      await browser.close();
    } catch (e) {
      // Ignore close errors
    }
  }
  
  // Summary
  log('\n' + '='.repeat(80), 'info');
  log('📊 TEST SUMMARY', 'info');
  log('='.repeat(80), 'info');
  log(`Total Tests: ${totalTests}`, 'info');
  log(`✅ Passed: ${passedTests}`, 'success');
  log(`❌ Failed: ${failedTests}`, failedTests > 0 ? 'error' : 'success');
  log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(2)}%`, 'info');
  
  if (issues.length > 0) {
    log('\n🔍 ISSUES FOUND:', 'warning');
    issues.forEach((issue, idx) => {
      log(`  ${idx + 1}. ${issue.test}: ${issue.error}`, 'error');
    });
  }
  
  log('='.repeat(80), 'info');
  
  process.exit(failedTests > 0 ? 1 : 0);
}

main().catch(error => {
  log(`❌ Fatal error: ${error.message}`, 'error');
  console.error(error);
  process.exit(1);
});




