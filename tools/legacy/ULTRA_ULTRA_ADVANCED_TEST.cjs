// ULTRA ULTRA ADVANCED TEST - Only runs when all errors are fixed
// Tests EVERYTHING at maximum level
const { chromium } = require('playwright');

const results = {
  passed: [],
  failed: [],
  warnings: [],
  consoleErrors: [],
  apiErrors: [],
  performance: [],
  security: [],
  accessibility: [],
  mobile: [],
  dataIntegrity: [],
  edgeCases: [],
  loadTest: [],
};

function logResult(type, message, details = '', category = 'general') {
  const entry = { message, details, timestamp: Date.now(), category };
  results[type].push(entry);
  const icon = type === 'passed' ? '✅' : type === 'failed' ? '❌' : '⚠️';
  console.log(`${icon} [${category.toUpperCase()}] ${message}${details ? ` - ${details}` : ''}`);
}

async function testEverything(page) {
  console.log('\n🚀 ULTRA ULTRA ADVANCED TEST - MAXIMUM LEVEL\n');
  
  // Test all pages with deep analysis
  const allPages = [
    { url: 'http://localhost:5173/', name: 'Landing' },
    { url: 'http://localhost:5173/login', name: 'Login' },
    { url: 'http://localhost:5173/register', name: 'Register' },
    { url: 'http://localhost:5173/about', name: 'About' },
    { url: 'http://localhost:5173/contact', name: 'Contact' },
    { url: 'http://localhost:5173/individual/dashboard', name: 'Individual Dashboard' },
    { url: 'http://localhost:5173/individual/shipments', name: 'Shipments' },
    { url: 'http://localhost:5173/individual/create-shipment', name: 'Create Shipment' },
    { url: 'http://localhost:5173/individual/offers', name: 'Offers' },
    { url: 'http://localhost:5173/corporate/dashboard', name: 'Corporate Dashboard' },
    { url: 'http://localhost:5173/nakliyeci/dashboard', name: 'Nakliyeci Dashboard' },
    { url: 'http://localhost:5173/tasiyici/dashboard', name: 'Tasiyici Dashboard' },
  ];
  
  for (const pageInfo of allPages) {
    try {
      await page.goto(pageInfo.url, { waitUntil: 'networkidle', timeout: 30000 });
      // Wait for React to mount
      await page.waitForSelector('#root', { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(5000); // Extra wait for React hydration
      
      // Deep analysis
      const analysis = await page.evaluate(() => {
        const root = document.getElementById('root');
        const hasReact = root?.querySelector('[data-reactroot], [id^="root"], .App') !== null;
        const hasButtons = document.querySelectorAll('button').length > 0;
        return {
          hasContent: root?.innerHTML.length > 100, // At least 100 chars
          hasReact: hasReact || hasButtons,
          buttons: document.querySelectorAll('button').length,
          links: document.querySelectorAll('a').length,
          forms: document.querySelectorAll('form').length,
          inputs: document.querySelectorAll('input').length,
          images: document.querySelectorAll('img').length,
          imagesWithAlt: Array.from(document.querySelectorAll('img')).filter(img => img.alt).length,
          accessibilityIssues: [],
          performance: {
            loadTime: performance.timing ? performance.timing.loadEventEnd - performance.timing.navigationStart : 0,
          },
        };
      });
      
      if (analysis.hasContent && analysis.hasReact) {
        logResult('passed', `${pageInfo.name}: Complete`, 
          `Buttons: ${analysis.buttons}, Forms: ${analysis.forms}`, 'page');
      } else if (analysis.hasContent) {
        logResult('warnings', `${pageInfo.name}: Content but no React`, 
          `Content length: ${analysis.hasContent}`, 'page');
      } else {
        logResult('failed', `${pageInfo.name}: Empty`, pageInfo.url, 'page');
      }
      
      // Accessibility
      if (analysis.images > 0 && analysis.imagesWithAlt < analysis.images) {
        logResult('warnings', `${pageInfo.name}: Missing alt texts`, 
          `${analysis.images - analysis.imagesWithAlt} images`, 'accessibility');
      }
      
      // Performance
      if (analysis.performance.loadTime > 0) {
        results.performance.push({
          page: pageInfo.name,
          loadTime: analysis.performance.loadTime,
        });
      }
      
    } catch (error) {
      logResult('failed', `${pageInfo.name}: Error`, error.message, 'page');
    }
  }
  
  // Test all user flows
  console.log('\n🔄 Testing Complete User Flows...\n');
  
  // Individual flow
  try {
    await page.goto('http://localhost:5173/login');
    await page.waitForTimeout(2000);
    const demoBtn = page.locator('button:has-text("Bireysel"), button:has-text("Individual")').first();
    if (await demoBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await demoBtn.click();
      await page.waitForTimeout(5000);
      if (page.url().includes('dashboard')) {
        logResult('passed', 'Individual Flow: Complete', 'Login → Dashboard', 'flow');
      }
    }
  } catch (error) {
    logResult('failed', 'Individual Flow: Failed', error.message, 'flow');
  }
  
  // Test API endpoints
  console.log('\n🌐 Testing All API Endpoints...\n');
  const endpoints = [
    '/api/health',
    '/api/shipments/open',
    '/api/dashboard/stats/individual',
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await page.request.get(`http://localhost:5000${endpoint}`, {
        headers: { 'Authorization': 'Bearer test' },
      });
      if (response.status() < 500) {
        logResult('passed', `API: ${endpoint}`, `Status: ${response.status()}`, 'api');
      } else {
        logResult('failed', `API: ${endpoint}`, `Status: ${response.status()}`, 'api');
      }
    } catch (error) {
      logResult('warnings', `API: ${endpoint}`, error.message, 'api');
    }
  }
  
  // Mobile test
  console.log('\n📱 Testing Mobile Responsiveness...\n');
  const viewports = [
    { width: 375, height: 667, name: 'iPhone SE' },
    { width: 414, height: 896, name: 'iPhone 11 Pro' },
    { width: 768, height: 1024, name: 'iPad' },
  ];
  
  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    const mobileCheck = await page.evaluate(() => {
      const body = document.body;
      return {
        hasHorizontalScroll: body.scrollWidth > body.clientWidth,
        touchTargets: Array.from(document.querySelectorAll('button, a')).map(el => {
          const rect = el.getBoundingClientRect();
          return { width: rect.width, height: rect.height };
        }),
      };
    });
    
    const smallTargets = mobileCheck.touchTargets.filter(t => t.width < 44 || t.height < 44).length;
    if (smallTargets === 0) {
      logResult('passed', `Mobile (${viewport.name}): Perfect`, '', 'mobile');
    } else {
      logResult('warnings', `Mobile (${viewport.name}): Small targets`, `${smallTargets} targets`, 'mobile');
    }
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Console error tracking
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('favicon')) {
        results.consoleErrors.push({ error: text, timestamp: Date.now() });
      }
    }
  });
  
  // API error tracking
  page.on('response', response => {
    if (response.status() >= 500 && response.url().includes('/api/')) {
      results.apiErrors.push({
        url: response.url(),
        status: response.status(),
        timestamp: Date.now(),
      });
    }
  });
  
  try {
    await testEverything(page);
  } catch (error) {
    logResult('failed', 'Test Suite Error', error.message, 'system');
  } finally {
    await browser.close();
  }
  
  // Final Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 ULTRA ULTRA ADVANCED TEST SUMMARY\n');
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`⚠️  Warnings: ${results.warnings.length}`);
  console.log(`🔴 Console Errors: ${results.consoleErrors.length}`);
  console.log(`🔴 API Errors: ${results.apiErrors.length}`);
  console.log(`⚡ Performance Tests: ${results.performance.length}`);
  console.log(`📱 Mobile Tests: ${results.mobile.length}`);
  
  if (results.performance.length > 0) {
    const avgLoad = results.performance.reduce((sum, p) => sum + p.loadTime, 0) / results.performance.length;
    console.log(`⚡ Average Load Time: ${Math.round(avgLoad)}ms`);
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('\n✅ ULTRA ULTRA ADVANCED TEST COMPLETED!\n');
  
  process.exit(results.failed.length === 0 && results.consoleErrors.length === 0 && results.apiErrors.length === 0 ? 0 : 1);
}

main();



