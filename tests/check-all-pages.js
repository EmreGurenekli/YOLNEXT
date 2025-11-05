/**
 * Comprehensive Page Check - Check all pages for errors
 * Tests all routes and checks for console errors
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5173';
const BACKEND_URL = 'http://localhost:5000';

// All pages to check
const pagesToCheck = [
  // Public pages
  { path: '/', name: 'Landing Page' },
  { path: '/about', name: 'About Page' },
  { path: '/contact', name: 'Contact Page' },
  { path: '/terms', name: 'Terms Page' },
  { path: '/privacy', name: 'Privacy Page' },
  { path: '/cookie-policy', name: 'Cookie Policy Page' },
  { path: '/login', name: 'Login Page' },
  { path: '/register', name: 'Register Page' },
  
  // Individual pages (will need login)
  { path: '/individual/dashboard', name: 'Individual Dashboard', needsAuth: true },
  { path: '/individual/create-shipment', name: 'Individual Create Shipment', needsAuth: true },
  { path: '/individual/my-shipments', name: 'Individual My Shipments', needsAuth: true },
  { path: '/individual/help', name: 'Individual Help', needsAuth: true },
  
  // Corporate pages (will need login)
  { path: '/corporate/dashboard', name: 'Corporate Dashboard', needsAuth: true },
  { path: '/corporate/create-shipment', name: 'Corporate Create Shipment', needsAuth: true },
  { path: '/corporate/shipments', name: 'Corporate Shipments', needsAuth: true },
  
  // Nakliyeci pages (will need login)
  { path: '/nakliyeci/dashboard', name: 'Nakliyeci Dashboard', needsAuth: true },
  { path: '/nakliyeci/jobs', name: 'Nakliyeci Jobs', needsAuth: true },
  { path: '/nakliyeci/active-shipments', name: 'Nakliyeci Active Shipments', needsAuth: true },
  { path: '/nakliyeci/help', name: 'Nakliyeci Help', needsAuth: true },
  
  // Tasiyici pages (will need login)
  { path: '/tasiyici/dashboard', name: 'Tasiyici Dashboard', needsAuth: true },
  { path: '/tasiyici/market', name: 'Tasiyici Market', needsAuth: true },
  { path: '/tasiyici/help', name: 'Tasiyici Help', needsAuth: true },
];

const errors = [];
const warnings = [];

async function loginAsDemoUser(page, userType) {
  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    
    // Find and click demo login button
    const demoButtonSelector = `button:has-text("${userType === 'individual' ? 'Bireysel' : userType === 'corporate' ? 'Kurumsal' : userType === 'nakliyeci' ? 'Nakliyeci' : 'Taşıyıcı'}")`;
    const button = await page.$(demoButtonSelector);
    
    if (button) {
      await button.click();
      await page.waitForTimeout(2000); // Wait for login
      return true;
    }
    
    // Try alternative selector
    const allButtons = await page.$$('button');
    for (const btn of allButtons) {
      const text = await btn.textContent();
      if (text && text.includes(userType === 'individual' ? 'Bireysel' : userType === 'corporate' ? 'Kurumsal' : userType === 'nakliyeci' ? 'Nakliyeci' : 'Taşıyıcı')) {
        await btn.click();
        await page.waitForTimeout(2000);
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error(`Login error for ${userType}:`, error.message);
    return false;
  }
}

async function checkPage(page, pageInfo) {
  const consoleErrors = [];
  const consoleWarnings = [];
  const networkErrors = [];
  
  // Listen to console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    
    if (type === 'error') {
      // Filter out expected errors
      if (!text.includes('favicon') && 
          !text.includes('404') &&
          !text.includes('Failed to fetch') &&
          !text.includes('ERR_CONNECTION_REFUSED') &&
          !text.includes('WebSocket') &&
          !text.includes('Invalid namespace')) {
        consoleErrors.push(text);
      }
    } else if (type === 'warning') {
      if (!text.includes('DevTools') && 
          !text.includes('deprecated') &&
          !text.includes('ReactDOM')) {
        consoleWarnings.push(text);
      }
    }
  });
  
  // Listen to network errors
  page.on('response', response => {
    if (response.status() >= 400) {
      const url = response.url();
      // Filter out expected 404s and auth errors
      if (!url.includes('favicon') && 
          response.status() !== 404 &&
          !url.includes('/api/users/profile') && // Auth errors are expected
          !url.includes('/api/dashboard/stats')) {
        networkErrors.push({
          url,
          status: response.status(),
          statusText: response.statusText()
        });
      }
    }
  });
  
  try {
    console.log(`\n🔍 Checking: ${pageInfo.name} (${pageInfo.path})`);
    
    if (pageInfo.needsAuth) {
      // Determine user type from path
      let userType = 'individual';
      if (pageInfo.path.includes('/corporate')) userType = 'corporate';
      else if (pageInfo.path.includes('/nakliyeci')) userType = 'nakliyeci';
      else if (pageInfo.path.includes('/tasiyici')) userType = 'tasiyici';
      
      const loggedIn = await loginAsDemoUser(page, userType);
      if (!loggedIn) {
        errors.push({
          page: pageInfo.name,
          path: pageInfo.path,
          error: 'Failed to login as demo user'
        });
        return;
      }
    }
    
    await page.goto(`${BASE_URL}${pageInfo.path}`, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    await page.waitForTimeout(2000); // Wait for page to fully load
    
    // Check for React errors
    const reactError = await page.evaluate(() => {
      const errorBoundary = document.querySelector('[data-error-boundary]');
      if (errorBoundary) {
        return errorBoundary.textContent;
      }
      return null;
    });
    
    if (reactError) {
      consoleErrors.push(`React Error: ${reactError}`);
    }
    
    // Check page title
    const title = await page.title();
    if (!title || title === 'YolNext') {
      consoleWarnings.push('Page title might be default');
    }
    
    // Check for loading states that never resolved
    const loadingElements = await page.$$('[class*="loading"], [class*="Loading"]');
    if (loadingElements.length > 0) {
      consoleWarnings.push('Loading elements found - might be stuck');
    }
    
    // Report errors
    if (consoleErrors.length > 0) {
      errors.push({
        page: pageInfo.name,
        path: pageInfo.path,
        consoleErrors,
        networkErrors
      });
      console.log(`  ❌ Found ${consoleErrors.length} console error(s)`);
    }
    
    if (consoleWarnings.length > 0) {
      warnings.push({
        page: pageInfo.name,
        path: pageInfo.path,
        warnings: consoleWarnings
      });
      console.log(`  ⚠️  Found ${consoleWarnings.length} warning(s)`);
    }
    
    if (networkErrors.length > 0) {
      errors.push({
        page: pageInfo.name,
        path: pageInfo.path,
        networkErrors
      });
      console.log(`  ❌ Found ${networkErrors.length} network error(s)`);
    }
    
    if (consoleErrors.length === 0 && consoleWarnings.length === 0 && networkErrors.length === 0) {
      console.log(`  ✅ No errors found`);
    }
    
  } catch (error) {
    errors.push({
      page: pageInfo.name,
      path: pageInfo.path,
      error: error.message
    });
    console.log(`  ❌ Error loading page: ${error.message}`);
  }
}

async function main() {
  console.log('🚀 Starting comprehensive page check...\n');
  console.log(`Frontend: ${BASE_URL}`);
  console.log(`Backend: ${BACKEND_URL}\n`);
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Set longer timeout
  page.setDefaultTimeout(30000);
  
  try {
    // Check backend health
    try {
      const response = await page.goto(`${BACKEND_URL}/api/health`, { timeout: 5000 });
      if (response && response.status() === 200) {
        console.log('✅ Backend is running\n');
      } else {
        console.log('⚠️  Backend health check failed\n');
      }
    } catch (e) {
      console.log('⚠️  Backend might not be running\n');
    }
    
    // Check all pages
    for (const pageInfo of pagesToCheck) {
      await checkPage(page, pageInfo);
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total pages checked: ${pagesToCheck.length}`);
    console.log(`Errors found: ${errors.length}`);
    console.log(`Warnings found: ${warnings.length}`);
    
    if (errors.length > 0) {
      console.log('\n❌ ERRORS:');
      errors.forEach((err, idx) => {
        console.log(`\n${idx + 1}. ${err.page} (${err.path})`);
        if (err.error) console.log(`   Error: ${err.error}`);
        if (err.consoleErrors) {
          err.consoleErrors.forEach(e => console.log(`   Console: ${e}`));
        }
        if (err.networkErrors) {
          err.networkErrors.forEach(e => console.log(`   Network: ${e.url} - ${e.status} ${e.statusText}`));
        }
      });
    }
    
    if (warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      warnings.forEach((warn, idx) => {
        console.log(`\n${idx + 1}. ${warn.page} (${warn.path})`);
        warn.warnings.forEach(w => console.log(`   ${w}`));
      });
    }
    
    // Save report
    const report = {
      timestamp: new Date().toISOString(),
      totalPages: pagesToCheck.length,
      errors,
      warnings
    };
    
    fs.writeFileSync(
      path.join(__dirname, 'page-check-report.json'),
      JSON.stringify(report, null, 2)
    );
    
    console.log('\n📄 Report saved to: tests/page-check-report.json');
    
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { checkPage, pagesToCheck };

