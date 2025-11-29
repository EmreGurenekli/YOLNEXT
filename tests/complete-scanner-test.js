/**
 * Complete Scanner Test - Comprehensive page and error checking
 * Tests all routes, checks for console errors, network errors, and React errors
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5173';
const BACKEND_URL = 'http://localhost:5000';

// Comprehensive list of all pages
const pagesToCheck = [
  // Public pages
  { path: '/', name: 'Landing Page', needsAuth: false },
  { path: '/about', name: 'About Page', needsAuth: false },
  { path: '/contact', name: 'Contact Page', needsAuth: false },
  { path: '/terms', name: 'Terms Page', needsAuth: false },
  { path: '/privacy', name: 'Privacy Page', needsAuth: false },
  { path: '/cookie-policy', name: 'Cookie Policy Page', needsAuth: false },
  { path: '/login', name: 'Login Page', needsAuth: false },
  { path: '/register', name: 'Register Page', needsAuth: false },
  
  // Individual pages
  { path: '/individual/dashboard', name: 'Individual Dashboard', needsAuth: true, userType: 'individual' },
  { path: '/individual/create-shipment', name: 'Individual Create Shipment', needsAuth: true, userType: 'individual' },
  { path: '/individual/my-shipments', name: 'Individual My Shipments', needsAuth: true, userType: 'individual' },
  { path: '/individual/offers', name: 'Individual Offers', needsAuth: true, userType: 'individual' },
  { path: '/individual/live-tracking', name: 'Individual Live Tracking', needsAuth: true, userType: 'individual' },
  { path: '/individual/help', name: 'Individual Help', needsAuth: true, userType: 'individual' },
  
  // Corporate pages
  { path: '/corporate/dashboard', name: 'Corporate Dashboard', needsAuth: true, userType: 'corporate' },
  { path: '/corporate/create-shipment', name: 'Corporate Create Shipment', needsAuth: true, userType: 'corporate' },
  { path: '/corporate/shipments', name: 'Corporate Shipments', needsAuth: true, userType: 'corporate' },
  { path: '/corporate/offers', name: 'Corporate Offers', needsAuth: true, userType: 'corporate' },
  { path: '/corporate/analytics', name: 'Corporate Analytics', needsAuth: true, userType: 'corporate' },
  { path: '/corporate/help', name: 'Corporate Help', needsAuth: true, userType: 'corporate' },
  
  // Nakliyeci pages
  { path: '/nakliyeci/dashboard', name: 'Nakliyeci Dashboard', needsAuth: true, userType: 'nakliyeci' },
  { path: '/nakliyeci/jobs', name: 'Nakliyeci Jobs', needsAuth: true, userType: 'nakliyeci' },
  { path: '/nakliyeci/active-shipments', name: 'Nakliyeci Active Shipments', needsAuth: true, userType: 'nakliyeci' },
  { path: '/nakliyeci/drivers', name: 'Nakliyeci Drivers', needsAuth: true, userType: 'nakliyeci' },
  { path: '/nakliyeci/analytics', name: 'Nakliyeci Analytics', needsAuth: true, userType: 'nakliyeci' },
  { path: '/nakliyeci/help', name: 'Nakliyeci Help', needsAuth: true, userType: 'nakliyeci' },
  
  // Tasiyici pages
  { path: '/tasiyici/dashboard', name: 'Tasiyici Dashboard', needsAuth: true, userType: 'tasiyici' },
  { path: '/tasiyici/market', name: 'Tasiyici Market', needsAuth: true, userType: 'tasiyici' },
  { path: '/tasiyici/active-jobs', name: 'Tasiyici Active Jobs', needsAuth: true, userType: 'tasiyici' },
  { path: '/tasiyici/help', name: 'Tasiyici Help', needsAuth: true, userType: 'tasiyici' },
];

const results = {
  passed: [],
  failed: [],
  warnings: [],
  errors: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0,
    errors: 0
  }
};

async function checkServerRunning() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/health`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function loginAsDemoUser(page, userType) {
  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    // Try different selectors for demo login button
    const buttonSelectors = [
      `button[data-testid="demo-${userType}"]`,
      `button:has-text("${userType === 'individual' ? 'Bireysel' : userType === 'corporate' ? 'Kurumsal' : userType === 'nakliyeci' ? 'Nakliyeci' : 'Taşıyıcı'} Demo Giriş")`,
      `button:has-text("Demo")`,
    ];
    
    let clicked = false;
    for (const selector of buttonSelectors) {
      try {
        const button = await page.$(selector);
        if (button) {
          await button.click();
          await page.waitForTimeout(3000);
          
          // Check if we're redirected to dashboard
          const currentUrl = page.url();
          if (currentUrl.includes('/dashboard')) {
            clicked = true;
            break;
          }
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!clicked) {
      // Try to find any demo button
      const allButtons = await page.$$('button');
      for (const btn of allButtons) {
        const text = await btn.textContent();
        if (text && (text.includes('Demo') || text.includes('demo'))) {
          await btn.click();
          await page.waitForTimeout(3000);
          break;
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error(`Login error for ${userType}:`, error.message);
    return false;
  }
}

async function checkPage(page, pageInfo) {
  const consoleErrors = [];
  const consoleWarnings = [];
  const networkErrors = [];
  const reactErrors = [];
  
  // Listen to console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    
    if (type === 'error') {
      // Filter out expected/benign errors
      if (!text.includes('favicon') && 
          !text.includes('404') &&
          !text.includes('Failed to fetch') &&
          !text.includes('ERR_CONNECTION_REFUSED') &&
          !text.includes('WebSocket') &&
          !text.includes('Invalid namespace') &&
          !text.includes('Authentication') &&
          !text.includes('ResizeObserver') &&
          !text.includes('ChunkLoadError')) {
        consoleErrors.push(text);
      }
    } else if (type === 'warning') {
      if (!text.includes('favicon') && !text.includes('DevTools')) {
        consoleWarnings.push(text);
      }
    }
  });
  
  // Listen to network failures
  page.on('response', response => {
    if (response.status() >= 400 && response.status() < 500) {
      const url = response.url();
      if (!url.includes('favicon') && !url.includes('analytics')) {
        networkErrors.push({
          url: url,
          status: response.status(),
          statusText: response.statusText()
        });
      }
    }
  });
  
  try {
    console.log(`\n🔍 Checking: ${pageInfo.name} (${pageInfo.path})`);
    
    // Login if needed
    if (pageInfo.needsAuth) {
      const userType = pageInfo.userType || 'individual';
      const loggedIn = await loginAsDemoUser(page, userType);
      if (!loggedIn) {
        results.failed.push({
          page: pageInfo.name,
          path: pageInfo.path,
          error: 'Failed to login as demo user'
        });
        results.summary.failed++;
        console.log(`  ❌ Failed to login`);
        return;
      }
      await page.waitForTimeout(2000);
    }
    
    // Navigate to page
    await page.goto(`${BASE_URL}${pageInfo.path}`, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    await page.waitForTimeout(3000); // Wait for page to fully load
    
    // Check for React errors
    const reactError = await page.evaluate(() => {
      const errorBoundary = document.querySelector('[data-error-boundary]');
      if (errorBoundary) {
        return errorBoundary.textContent;
      }
      
      // Check for error messages in the page
      const errorElements = document.querySelectorAll('[role="alert"], .error, [class*="error"]');
      for (const el of errorElements) {
        const text = el.textContent;
        if (text && (text.includes('Error') || text.includes('Hata') || text.includes('Failed'))) {
          return text;
        }
      }
      
      return null;
    });
    
    if (reactError) {
      reactErrors.push(reactError);
    }
    
    // Check page title
    const title = await page.title();
    if (!title || title === 'YolNext' || title.length < 10) {
      consoleWarnings.push('Page title might be default or too short');
    }
    
    // Check for loading states that never resolved
    const loadingElements = await page.$$('[class*="loading"], [class*="Loading"], [class*="spinner"]');
    if (loadingElements.length > 5) {
      consoleWarnings.push('Multiple loading elements found - might be stuck');
    }
    
    // Check for empty content
    const bodyText = await page.evaluate(() => document.body.textContent);
    if (!bodyText || bodyText.trim().length < 50) {
      consoleWarnings.push('Page content seems empty or minimal');
    }
    
    // Report results
    const hasErrors = consoleErrors.length > 0 || networkErrors.length > 0 || reactErrors.length > 0;
    const hasWarnings = consoleWarnings.length > 0;
    
    if (hasErrors) {
      results.failed.push({
        page: pageInfo.name,
        path: pageInfo.path,
        consoleErrors,
        networkErrors,
        reactErrors
      });
      results.summary.failed++;
      console.log(`  ❌ Found ${consoleErrors.length} console error(s), ${networkErrors.length} network error(s), ${reactErrors.length} React error(s)`);
    } else if (hasWarnings) {
      results.warnings.push({
        page: pageInfo.name,
        path: pageInfo.path,
        warnings: consoleWarnings
      });
      results.summary.warnings++;
      console.log(`  ⚠️ Found ${consoleWarnings.length} warning(s)`);
    } else {
      results.passed.push({
        page: pageInfo.name,
        path: pageInfo.path
      });
      results.summary.passed++;
      console.log(`  ✅ No errors found`);
    }
    
    results.summary.total++;
    
  } catch (error) {
    results.failed.push({
      page: pageInfo.name,
      path: pageInfo.path,
      error: error.message
    });
    results.summary.failed++;
    console.log(`  ❌ Error: ${error.message}`);
  }
}

async function runCompleteScanner() {
  console.log('='.repeat(70));
  console.log('🔍 COMPLETE SCANNER TEST - ALL PAGES');
  console.log('='.repeat(70));
  console.log(`\nTesting ${pagesToCheck.length} pages...\n`);
  
  // Check if servers are running
  const serverRunning = await checkServerRunning();
  if (!serverRunning) {
    console.log('⚠️ Warning: Backend server might not be running');
    console.log('   Some tests may fail. Continue anyway...\n');
  } else {
    console.log('✅ Backend server is running\n');
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
  
  try {
    // Test all pages
    for (const pageInfo of pagesToCheck) {
      await checkPage(page, pageInfo);
      await page.waitForTimeout(1000); // Brief pause between pages
    }
    
  } catch (error) {
    console.error('\n❌ Scanner error:', error);
    results.errors.push(error.message);
  } finally {
    await browser.close();
  }
  
  // Print comprehensive summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 SCAN RESULTS SUMMARY');
  console.log('='.repeat(70));
  console.log(`\nTotal Pages: ${results.summary.total}`);
  console.log(`✅ Passed: ${results.summary.passed}`);
  console.log(`❌ Failed: ${results.summary.failed}`);
  console.log(`⚠️ Warnings: ${results.summary.warnings}`);
  
  if (results.failed.length > 0) {
    console.log('\n❌ FAILED PAGES:');
    results.failed.forEach(item => {
      console.log(`\n  ${item.page} (${item.path})`);
      if (item.error) {
        console.log(`    Error: ${item.error}`);
      }
      if (item.consoleErrors && item.consoleErrors.length > 0) {
        console.log(`    Console Errors: ${item.consoleErrors.length}`);
        item.consoleErrors.slice(0, 3).forEach(err => {
          console.log(`      - ${err.substring(0, 100)}`);
        });
      }
      if (item.networkErrors && item.networkErrors.length > 0) {
        console.log(`    Network Errors: ${item.networkErrors.length}`);
        item.networkErrors.slice(0, 3).forEach(err => {
          console.log(`      - ${err.url} (${err.status})`);
        });
      }
      if (item.reactErrors && item.reactErrors.length > 0) {
        console.log(`    React Errors: ${item.reactErrors.length}`);
        item.reactErrors.forEach(err => {
          console.log(`      - ${err.substring(0, 100)}`);
        });
      }
    });
  }
  
  if (results.warnings.length > 0) {
    console.log('\n⚠️ WARNINGS:');
    results.warnings.forEach(item => {
      console.log(`  ${item.page} (${item.path})`);
      item.warnings.slice(0, 2).forEach(warn => {
        console.log(`    - ${warn}`);
      });
    });
  }
  
  const passRate = results.summary.total > 0 
    ? ((results.summary.passed / results.summary.total) * 100).toFixed(1) 
    : 0;
  
  console.log(`\n📈 Pass Rate: ${passRate}%`);
  
  if (results.summary.failed === 0) {
    console.log('\n🎉 ALL PAGES PASSED!');
  } else {
    console.log(`\n⚠️ ${results.summary.failed} page(s) have issues. Review the details above.`);
  }
  
  console.log('\n' + '='.repeat(70));
  
  // Save results to file
  const reportPath = path.join(__dirname, 'scanner-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  
  return results.summary.failed === 0;
}

// Run the scanner
if (require.main === module) {
  runCompleteScanner()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { runCompleteScanner, checkPage, loginAsDemoUser };


