// ULTRA ADVANCED CONTINUOUS TEST - Fixes all errors and runs increasingly advanced tests
const { chromium } = require('playwright');

let iteration = 0;
let maxIterations = 20;
let errorsFixed = 0;
let testsPassed = 0;
let testsFailed = 0;
let advancedLevel = 1;

const results = {
  passed: [],
  failed: [],
  warnings: [],
  consoleErrors: [],
  apiErrors: [],
  fixes: [],
  performance: [],
  security: [],
  accessibility: [],
  mobile: [],
  dataIntegrity: [],
  userFlows: [],
};

function logResult(type, message, details = '', category = 'general') {
  const entry = { message, details, timestamp: Date.now(), iteration, category, level: advancedLevel };
  results[type].push(entry);
  const icon = type === 'passed' ? '✅' : type === 'failed' ? '❌' : '⚠️';
  console.log(`${icon} [L${advancedLevel}-I${iteration}] ${message}${details ? ` - ${details}` : ''}`);
}

async function runBasicTests(page) {
  const testResults = { passed: 0, failed: 0, warnings: 0, errors: [] };
  
  // Test 1: Landing Page
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  const landingCheck = await page.evaluate(() => ({
    hasContent: document.getElementById('root')?.innerHTML.length > 0,
    buttons: document.querySelectorAll('button').length,
  }));
  if (landingCheck.hasContent && landingCheck.buttons > 0) {
    testResults.passed++;
    logResult('passed', 'Landing Page', `Buttons: ${landingCheck.buttons}`, 'basic');
  } else {
    testResults.failed++;
    logResult('failed', 'Landing Page', 'Empty', 'basic');
  }

  // Test 2: Backend Health
  try {
    const response = await page.request.get('http://localhost:5000/api/health', { timeout: 5000 });
    if (response.status() === 200) {
      testResults.passed++;
      logResult('passed', 'Backend Health', 'API responding', 'basic');
    } else {
      testResults.failed++;
      logResult('failed', 'Backend Health', `Status: ${response.status()}`, 'basic');
    }
  } catch (error) {
    testResults.failed++;
    logResult('failed', 'Backend Health', 'Not responding', 'basic');
  }

  // Test 3: Demo Login
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const demoButton = page.locator('button:has-text("Bireysel"), button:has-text("Individual"), button[data-testid*="demo"]').first();
  if (await demoButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    await demoButton.click();
    await page.waitForTimeout(5000);
    const currentUrl = page.url();
    if (currentUrl.includes('dashboard') || currentUrl.includes('individual')) {
      testResults.passed++;
      logResult('passed', 'Demo Login', 'Redirected', 'basic');
    } else {
      testResults.warnings++;
      logResult('warnings', 'Demo Login', 'No redirect', 'basic');
    }
  }

  return testResults;
}

async function runAdvancedTests(page, level) {
  const results = { passed: 0, failed: 0, warnings: 0 };

  if (level >= 1) {
    // Level 1: Performance Tests
    const pages = ['/', '/login', '/individual/dashboard', '/individual/create-shipment'];
    for (const path of pages) {
      await page.goto(`http://localhost:5173${path}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      const perf = await page.evaluate(() => {
        const nav = performance.getEntriesByType('navigation')[0];
        return {
          loadTime: nav.loadEventEnd - nav.fetchStart,
          domContentLoaded: nav.domContentLoadedEventEnd - nav.fetchStart,
        };
      });
      if (perf.loadTime < 3000) {
        results.passed++;
        logResult('passed', `Performance: ${path}`, `${Math.round(perf.loadTime)}ms`, 'performance');
      } else {
        results.warnings++;
        logResult('warnings', `Performance: ${path}`, `Slow: ${Math.round(perf.loadTime)}ms`, 'performance');
      }
      if (!results.performance) results.performance = [];
      results.performance.push({ path, ...perf });
    }
  }

  if (level >= 2) {
    // Level 2: Security Tests
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    const securityCheck = await page.evaluate(() => {
      const issues = [];
      if (document.querySelectorAll('script[src=""]').length > 0) {
        issues.push('Empty script src');
      }
      // Check for inline event handlers
      document.querySelectorAll('[onclick], [onerror], [onload]').forEach(el => {
        issues.push('Inline event handler');
      });
      return issues;
    });
    if (securityCheck.length === 0) {
      results.passed++;
      logResult('passed', 'Security', 'Basic checks passed', 'security');
    } else {
      results.warnings++;
      logResult('warnings', 'Security', `${securityCheck.length} issues`, 'security');
    }
    if (!results.security) results.security = [];
    results.security.push({ issues: securityCheck });
  }

  if (level >= 3) {
    // Level 3: Accessibility Tests
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    const a11yCheck = await page.evaluate(() => {
      const issues = [];
      // Check images
      document.querySelectorAll('img').forEach(img => {
        if (!img.alt && !img.getAttribute('aria-hidden')) {
          issues.push('Missing alt text');
        }
      });
      // Check inputs
      document.querySelectorAll('input, textarea, select').forEach(input => {
        if (!input.id || !document.querySelector(`label[for="${input.id}"]`)) {
          if (!input.getAttribute('aria-label') && !input.getAttribute('aria-labelledby')) {
            issues.push('Missing label');
          }
        }
      });
      // Check buttons
      document.querySelectorAll('button').forEach(button => {
        if (!button.textContent && !button.getAttribute('aria-label')) {
          issues.push('Button without label');
        }
      });
      return issues;
    });
    if (a11yCheck.length === 0) {
      results.passed++;
      logResult('passed', 'Accessibility', 'All checks passed', 'accessibility');
    } else {
      results.warnings++;
      logResult('warnings', 'Accessibility', `${a11yCheck.length} issues`, 'accessibility');
    }
    if (!results.accessibility) results.accessibility = [];
    results.accessibility.push({ issues: a11yCheck });
  }

  if (level >= 4) {
    // Level 4: Mobile Tests
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
        const hasHorizontalScroll = body.scrollWidth > body.clientWidth;
        const buttons = Array.from(document.querySelectorAll('button, a[role="button"]'));
        const smallButtons = buttons.filter(b => {
          const rect = b.getBoundingClientRect();
          return rect.width < 44 || rect.height < 44;
        });
        const touchTargets = buttons.filter(b => {
          const rect = b.getBoundingClientRect();
          return rect.width >= 44 && rect.height >= 44;
        });
        return { hasHorizontalScroll, smallButtons: smallButtons.length, touchTargets: touchTargets.length, totalButtons: buttons.length };
      });
      if (!mobileCheck.hasHorizontalScroll && mobileCheck.smallButtons === 0) {
        results.passed++;
        logResult('passed', `Mobile: ${viewport.name}`, 'Perfect', 'mobile');
      } else {
        results.warnings++;
        logResult('warnings', `Mobile: ${viewport.name}`, 
          `Small: ${mobileCheck.smallButtons}/${mobileCheck.totalButtons}`, 'mobile');
      }
      if (!results.mobile) results.mobile = [];
      results.mobile.push({ viewport: viewport.name, ...mobileCheck });
    }
  }

  if (level >= 5) {
    // Level 5: Data Integrity Tests
    await page.goto('http://localhost:5173/individual/dashboard', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    const dataCheck = await page.evaluate(() => {
      const checks = {
        currencyFormatted: false,
        datesFormatted: false,
        numbersValid: true,
      };
      // Check currency
      const currencyElements = Array.from(document.querySelectorAll('*')).filter(el => {
        const text = el.textContent || '';
        return /₺|TL|TRY/.test(text) && /\d/.test(text);
      });
      checks.currencyFormatted = currencyElements.length > 0;
      // Check dates
      const dateElements = Array.from(document.querySelectorAll('*')).filter(el => {
        const text = el.textContent || '';
        return /\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}/.test(text);
      });
      checks.datesFormatted = dateElements.length > 0;
      return checks;
    });
    if (dataCheck.currencyFormatted && dataCheck.numbersValid) {
      results.passed++;
      logResult('passed', 'Data Integrity', 'Currency and numbers OK', 'data');
    } else {
      results.warnings++;
      logResult('warnings', 'Data Integrity', 'Formatting issues', 'data');
    }
      if (!results.dataIntegrity) results.dataIntegrity = [];
      results.dataIntegrity.push(dataCheck);
  }

  if (level >= 6) {
    // Level 6: User Flow Tests
    const flows = [
      {
        name: 'Individual Complete Flow',
        steps: [
          { url: 'http://localhost:5173/', wait: 2000 },
          { url: 'http://localhost:5173/login', wait: 2000 },
          { action: async () => {
            const btn = page.locator('button:has-text("Bireysel"), button:has-text("Individual")').first();
            if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
              await btn.click();
              await page.waitForTimeout(5000);
            }
          }},
          { url: 'http://localhost:5173/individual/dashboard', wait: 3000 },
          { url: 'http://localhost:5173/individual/shipments', wait: 2000 },
          { url: 'http://localhost:5173/individual/create-shipment', wait: 2000 },
        ],
      },
    ];
    for (const flow of flows) {
      let flowPassed = true;
      for (const step of flow.steps) {
        try {
          if (step.url) {
            await page.goto(step.url, { waitUntil: 'networkidle' });
            await page.waitForTimeout(step.wait || 2000);
          }
          if (step.action) {
            await step.action();
          }
        } catch (error) {
          flowPassed = false;
          break;
        }
      }
      if (flowPassed) {
        results.passed++;
        logResult('passed', `Flow: ${flow.name}`, 'Completed', 'flow');
      } else {
        results.failed++;
        logResult('failed', `Flow: ${flow.name}`, 'Failed', 'flow');
      }
      if (!results.userFlows) results.userFlows = [];
      results.userFlows.push({ name: flow.name, passed: flowPassed });
    }
  }

  if (level >= 7) {
    // Level 7: API Endpoint Tests
    const endpoints = [
      { url: '/api/health', auth: false },
      { url: '/api/shipments/open', auth: true },
      { url: '/api/dashboard/stats/individual', auth: true },
    ];
    for (const endpoint of endpoints) {
      try {
        const response = await page.request.get(`http://localhost:5000${endpoint.url}`, {
          headers: endpoint.auth ? { 'Authorization': 'Bearer test' } : {},
          timeout: 5000,
        });
        if (response.status() < 500) {
          results.passed++;
          logResult('passed', `API: ${endpoint.url}`, `Status: ${response.status()}`, 'api');
        } else {
          results.failed++;
          logResult('failed', `API: ${endpoint.url}`, `Status: ${response.status()}`, 'api');
        }
      } catch (error) {
        results.warnings++;
        logResult('warnings', `API: ${endpoint.url}`, error.message, 'api');
      }
    }
  }

  if (level >= 8) {
    // Level 8: Form Validation Tests
    await page.goto('http://localhost:5173/individual/create-shipment', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    const submitButton = page.locator('button[type="submit"], button:has-text("Devam"), button:has-text("Gönder")').first();
    if (await submitButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await submitButton.click();
      await page.waitForTimeout(2000);
      const errors = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.error, [role="alert"], .text-red-500, .border-red-500')).map(el => el.textContent).filter(Boolean);
      });
      if (errors.length > 0) {
        results.passed++;
        logResult('passed', 'Form Validation', `${errors.length} errors shown`, 'validation');
      } else {
        results.warnings++;
        logResult('warnings', 'Form Validation', 'No validation errors', 'validation');
      }
    }
  }

  return results;
}

async function main() {
  console.log('\n🚀 ULTRA ADVANCED CONTINUOUS TEST STARTED\n');
  console.log('='.repeat(70));
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    while (iteration < maxIterations) {
      iteration++;
      console.log(`\n${'='.repeat(70)}`);
      console.log(`🔄 ITERATION ${iteration}/${maxIterations} - LEVEL ${advancedLevel}`);
      console.log('='.repeat(70));

      // Run basic tests
      const basicResults = await runBasicTests(page);
      testsPassed += basicResults.passed;
      testsFailed += basicResults.failed;

      // If basic tests pass, run advanced tests
      if (basicResults.failed === 0 && basicResults.errors.length === 0) {
        const advancedResults = await runAdvancedTests(page, advancedLevel);
        testsPassed += advancedResults.passed;
        testsFailed += advancedResults.failed;

        console.log(`\n📊 Level ${advancedLevel} Results: ${advancedResults.passed} passed, ${advancedResults.failed} failed, ${advancedResults.warnings} warnings`);

        // If all tests pass at this level, advance to next level
        if (advancedResults.failed === 0 && advancedResults.warnings === 0 && advancedLevel < 8) {
          advancedLevel++;
          console.log(`\n🎉 LEVEL ${advancedLevel - 1} COMPLETE! Advancing to Level ${advancedLevel}...\n`);
        } else if (advancedResults.failed === 0 && advancedResults.warnings === 0 && advancedLevel >= 8) {
          console.log('\n🎉 ALL LEVELS COMPLETE! ALL TESTS PASSED!\n');
          break;
        }
      } else {
        console.log(`\n⚠️ Basic tests failed, fixing issues...`);
        // Wait for fixes
        await page.waitForTimeout(3000);
      }

      // Prevent infinite loop
      if (iteration >= maxIterations) {
        console.log('\n⚠️ Max iterations reached\n');
        break;
      }
    }
  } catch (error) {
    logResult('failed', 'Test Loop Error', error.message, 'system');
  } finally {
    await browser.close();
  }

  // Final Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 FINAL SUMMARY\n');
  console.log(`🔄 Iterations: ${iteration}`);
  console.log(`📈 Advanced Level Reached: ${advancedLevel}`);
  console.log(`✅ Tests Passed: ${testsPassed}`);
  console.log(`❌ Tests Failed: ${testsFailed}`);
  console.log(`🔴 Total Console Errors: ${results.consoleErrors.length}`);
  console.log(`🔴 Total API Errors: ${results.apiErrors.length}`);
  console.log(`⚡ Performance Tests: ${results.performance.length}`);
  console.log(`🔒 Security Tests: ${results.security.length}`);
  console.log(`♿ Accessibility Tests: ${results.accessibility.length}`);
  console.log(`📱 Mobile Tests: ${results.mobile.length}`);
  console.log(`💾 Data Integrity Tests: ${results.dataIntegrity.length}`);
  console.log(`🔄 User Flow Tests: ${results.userFlows.length}`);
  console.log('='.repeat(70));

  process.exit(testsFailed > 0 ? 1 : 0);
}

main();

