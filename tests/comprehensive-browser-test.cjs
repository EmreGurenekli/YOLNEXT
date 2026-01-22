const { chromium } = require('playwright');
const fs = require('fs');

const API_URL = 'http://localhost:5000/api';
const FRONTEND_URL = 'http://localhost:5173';

// Test results
const results = {
  pages: [],
  errors: [],
  warnings: [],
  passed: 0,
  failed: 0,
  total: 0,
};

// All pages to test
const allPages = [
  // Public pages
  { path: '/', name: 'Landing Page', requiresAuth: false },
  { path: '/login', name: 'Login Page', requiresAuth: false },
  { path: '/register', name: 'Register Page', requiresAuth: false },
  { path: '/about', name: 'About Page', requiresAuth: false },
  { path: '/contact', name: 'Contact Page', requiresAuth: false },
  { path: '/terms', name: 'Terms Page', requiresAuth: false },
  { path: '/privacy', name: 'Privacy Page', requiresAuth: false },
  { path: '/cookie-policy', name: 'Cookie Policy Page', requiresAuth: false },
  
  // Individual pages
  { path: '/individual/dashboard', name: 'Individual Dashboard', requiresAuth: true, role: 'individual' },
  { path: '/individual/create-shipment', name: 'Individual Create Shipment', requiresAuth: true, role: 'individual' },
  { path: '/individual/my-shipments', name: 'Individual My Shipments', requiresAuth: true, role: 'individual' },
  { path: '/individual/offers', name: 'Individual Offers', requiresAuth: true, role: 'individual' },
  { path: '/individual/messages', name: 'Individual Messages', requiresAuth: true, role: 'individual' },
  { path: '/individual/live-tracking', name: 'Individual Live Tracking', requiresAuth: true, role: 'individual' },
  { path: '/individual/settings', name: 'Individual Settings', requiresAuth: true, role: 'individual' },
  { path: '/individual/help', name: 'Individual Help', requiresAuth: true, role: 'individual' },
  
  // Corporate pages
  { path: '/corporate/dashboard', name: 'Corporate Dashboard', requiresAuth: true, role: 'corporate' },
  { path: '/corporate/create-shipment', name: 'Corporate Create Shipment', requiresAuth: true, role: 'corporate' },
  { path: '/corporate/shipments', name: 'Corporate Shipments', requiresAuth: true, role: 'corporate' },
  { path: '/corporate/offers', name: 'Corporate Offers', requiresAuth: true, role: 'corporate' },
  { path: '/corporate/messages', name: 'Corporate Messages', requiresAuth: true, role: 'corporate' },
  { path: '/corporate/analytics', name: 'Corporate Analytics', requiresAuth: true, role: 'corporate' },
  { path: '/corporate/settings', name: 'Corporate Settings', requiresAuth: true, role: 'corporate' },
  { path: '/corporate/help', name: 'Corporate Help', requiresAuth: true, role: 'corporate' },
  
  // Nakliyeci pages
  { path: '/nakliyeci/dashboard', name: 'Nakliyeci Dashboard', requiresAuth: true, role: 'nakliyeci' },
  { path: '/nakliyeci/jobs', name: 'Nakliyeci Jobs', requiresAuth: true, role: 'nakliyeci' },
  { path: '/nakliyeci/active-shipments', name: 'Nakliyeci Active Shipments', requiresAuth: true, role: 'nakliyeci' },
  { path: '/nakliyeci/shipments', name: 'Nakliyeci Shipments', requiresAuth: true, role: 'nakliyeci' },
  { path: '/nakliyeci/offers', name: 'Nakliyeci Offers', requiresAuth: true, role: 'nakliyeci' },
  { path: '/nakliyeci/messages', name: 'Nakliyeci Messages', requiresAuth: true, role: 'nakliyeci' },
  { path: '/nakliyeci/analytics', name: 'Nakliyeci Analytics', requiresAuth: true, role: 'nakliyeci' },
  { path: '/nakliyeci/settings', name: 'Nakliyeci Settings', requiresAuth: true, role: 'nakliyeci' },
  { path: '/nakliyeci/help', name: 'Nakliyeci Help', requiresAuth: true, role: 'nakliyeci' },
  
  // Tasiyici pages
  { path: '/tasiyici/dashboard', name: 'Tasiyici Dashboard', requiresAuth: true, role: 'tasiyici' },
  { path: '/tasiyici/market', name: 'Tasiyici Market', requiresAuth: true, role: 'tasiyici' },
  { path: '/tasiyici/active-jobs', name: 'Tasiyici Active Jobs', requiresAuth: true, role: 'tasiyici' },
  { path: '/tasiyici/my-offers', name: 'Tasiyici My Offers', requiresAuth: true, role: 'tasiyici' },
  { path: '/tasiyici/messages', name: 'Tasiyici Messages', requiresAuth: true, role: 'tasiyici' },
  { path: '/tasiyici/settings', name: 'Tasiyici Settings', requiresAuth: true, role: 'tasiyici' },
  { path: '/tasiyici/help', name: 'Tasiyici Help', requiresAuth: true, role: 'tasiyici' },
];

// Create demo user and login
async function loginAsDemoUser(page, userType = 'individual') {
  try {
    console.log(`\n🔐 Logging in as ${userType} demo user...`);
    
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    
    // Find and click demo login button
    const demoButton = await page.locator(`button:has-text("${userType === 'individual' ? 'Bireysel' : userType === 'corporate' ? 'Kurumsal' : userType === 'nakliyeci' ? 'Nakliyeci' : 'Taşıyıcı'} Demo Giriş")`).first();
    
    if (await demoButton.count() > 0) {
      await demoButton.click();
      await page.waitForTimeout(2000);
      
      // Check if redirected to dashboard
      const currentUrl = page.url();
      if (currentUrl.includes('/dashboard')) {
        console.log(`✅ Successfully logged in as ${userType}`);
        return true;
      }
    }
    
    // Alternative: Try API login directly
    try {
      const loginResponse = await page.evaluate(async ({ type, apiUrl }) => {
        const response = await fetch(`${apiUrl}/auth/demo-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userType: type }),
        });
        return response.json();
      }, { type: userType, apiUrl: API_URL });
      
      if (loginResponse && loginResponse.success && loginResponse.token) {
        await page.evaluate(({ token, user }) => {
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
        }, { token: loginResponse.token, user: loginResponse.user });
        
        await page.goto(`${FRONTEND_URL}/${userType}/dashboard`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);
        console.log(`✅ Successfully logged in via API as ${userType}`);
        return true;
      }
    } catch (apiError) {
      console.log(`⚠️ API login failed, trying button click...`);
    }
    
    // Try finding any demo button and clicking
    try {
      const allDemoButtons = await page.locator('button').filter({ hasText: /demo|Demo|DEMO/i });
      const count = await allDemoButtons.count();
      if (count > 0) {
        await allDemoButtons.first().click();
        await page.waitForTimeout(3000);
        const currentUrl = page.url();
        if (currentUrl.includes('/dashboard')) {
          console.log(`✅ Successfully logged in via button as ${userType}`);
          return true;
        }
      }
    } catch (buttonError) {
      console.log(`⚠️ Button click failed`);
    }
    
    console.log(`⚠️ Could not login as ${userType} demo user`);
    return false;
  } catch (error) {
    console.error(`❌ Login error for ${userType}:`, error.message);
    return false;
  }
}

// Test a single page
async function testPage(browser, pageInfo) {
  const page = await browser.newPage();
  let result = {
    name: pageInfo.name,
    path: pageInfo.path,
    status: 'pending',
    errors: [],
    warnings: [],
    consoleErrors: [],
    networkErrors: [],
  };
  
  try {
    console.log(`\n📄 Testing: ${pageInfo.name} (${pageInfo.path})`);
    
    // Collect console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('favicon') && !text.includes('sourcemap')) {
          consoleErrors.push(text);
        }
      }
    });
    
    // Collect network errors
    const networkErrors = [];
    page.on('response', response => {
      if (response.status() >= 400 && !response.url().includes('favicon')) {
        networkErrors.push({
          url: response.url(),
          status: response.status(),
        });
      }
    });
    
    // Navigate to page
    if (pageInfo.requiresAuth) {
      // Login first
      const loggedIn = await loginAsDemoUser(page, pageInfo.role);
      if (!loggedIn) {
        result.status = 'failed';
        result.errors.push('Could not login');
        return result;
      }
      await page.waitForTimeout(1000);
    }
    
    await page.goto(`${FRONTEND_URL}${pageInfo.path}`, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    await page.waitForTimeout(2000);
    
    // Check for React errors
    const reactError = await page.evaluate(() => {
      const errorDiv = document.querySelector('[data-react-error]');
      return errorDiv ? errorDiv.textContent : null;
    });
    
    if (reactError) {
      result.errors.push(`React Error: ${reactError}`);
    }
    
    // Check for 404
    const is404 = await page.evaluate(() => {
      return document.body.textContent.includes('404') || 
             document.body.textContent.includes('Not Found') ||
             document.title.includes('404');
    });
    
    if (is404) {
      result.status = 'failed';
      result.errors.push('Page not found (404)');
      return result;
    }
    
    // Check if page loaded (has content)
    const hasContent = await page.evaluate(() => {
      return document.body.textContent.length > 100;
    });
    
    if (!hasContent) {
      result.warnings.push('Page seems empty or has very little content');
    }
    
    // Check for badge elements (if applicable)
    if (pageInfo.requiresAuth) {
      const badges = await page.locator('[class*="badge"], [class*="Badge"]').count();
      if (badges > 0) {
        console.log(`  ℹ️ Found ${badges} badge elements`);
      }
    }
    
    // Store console and network errors
    result.consoleErrors = consoleErrors.filter((err, idx, arr) => 
      arr.indexOf(err) === idx
    ).slice(0, 5); // Limit to 5 unique errors
    
    result.networkErrors = networkErrors.filter((err, idx, arr) => 
      arr.findIndex(e => e.url === err.url) === idx
    ).slice(0, 5); // Limit to 5 unique errors
    
    if (result.errors.length === 0 && result.consoleErrors.length === 0 && result.networkErrors.length === 0) {
      result.status = 'passed';
      results.passed++;
    } else {
      result.status = 'failed';
      results.failed++;
      if (result.consoleErrors.length > 0) {
        result.errors.push(`${result.consoleErrors.length} console error(s)`);
      }
      if (result.networkErrors.length > 0) {
        result.errors.push(`${result.networkErrors.length} network error(s)`);
      }
    }
    
    results.total++;
    
  } catch (error) {
    result.status = 'failed';
    result.errors.push(error.message);
    results.failed++;
    results.total++;
    console.error(`❌ Error testing ${pageInfo.name}:`, error.message);
  } finally {
    await page.close();
  }
  
  return result;
}

// Main test function
async function runComprehensiveTest() {
  console.log('🚀 Starting Comprehensive Browser Test...\n');
  console.log(`Testing ${allPages.length} pages...\n`);
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 100 
  });
  
  try {
    // Test all pages
    for (const pageInfo of allPages) {
      const result = await testPage(browser, pageInfo);
      results.pages.push(result);
      
      if (result.status === 'passed') {
        console.log(`✅ ${pageInfo.name}: PASSED`);
      } else {
        console.log(`❌ ${pageInfo.name}: FAILED`);
        if (result.errors.length > 0) {
          console.log(`   Errors: ${result.errors.join(', ')}`);
        }
      }
    }
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Pages: ${results.total}`);
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
    
    // List failed pages
    if (results.failed > 0) {
      console.log('\n❌ FAILED PAGES:');
      results.pages
        .filter(p => p.status === 'failed')
        .forEach(p => {
          console.log(`\n  - ${p.name} (${p.path})`);
          if (p.errors.length > 0) {
            console.log(`    Errors: ${p.errors.join(', ')}`);
          }
          if (p.consoleErrors.length > 0) {
            console.log(`    Console Errors: ${p.consoleErrors.slice(0, 2).join(', ')}`);
          }
          if (p.networkErrors.length > 0) {
            console.log(`    Network Errors: ${p.networkErrors.slice(0, 2).map(e => `${e.status} - ${e.url.split('/').pop()}`).join(', ')}`);
          }
        });
    }
    
    // Save results
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: results.total,
        passed: results.passed,
        failed: results.failed,
        successRate: ((results.passed / results.total) * 100).toFixed(1) + '%',
      },
      pages: results.pages,
    };
    
    fs.writeFileSync('test-browser-results.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Results saved to test-browser-results.json');
    
  } catch (error) {
    console.error('❌ Test execution error:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
runComprehensiveTest().catch(console.error);

