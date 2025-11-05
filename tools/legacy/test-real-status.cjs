// GERÇEK DURUM TEST - Ne ÇALIŞIYOR, Ne ÇALIŞMIYOR
const { chromium } = require('playwright');

const log = (msg) => console.log(msg);

const results = {
  working: [],
  broken: [],
  warnings: [],
};

async function testBackendHealth(page) {
  log('\n🔍 Backend Health Check...');
  
  try {
    const response = await page.request.get('http://localhost:5000/api/health');
    const data = await response.json();
    
    if (response.status() === 200) {
      results.working.push('Backend is running (port 5000)');
      log('✅ Backend: RUNNING');
    } else {
      results.broken.push(`Backend returned status ${response.status()}`);
      log(`❌ Backend: Status ${response.status()}`);
    }
  } catch (error) {
    results.broken.push('Backend is NOT running or not accessible');
    log(`❌ Backend: ${error.message}`);
  }
}

async function testFrontendLoad(page) {
  log('\n🔍 Frontend Load Check...');
  
  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 10000 });
    const title = await page.title();
    
    if (title && title.length > 0) {
      results.working.push('Frontend is running (port 5173)');
      log(`✅ Frontend: RUNNING (title: ${title.substring(0, 50)})`);
    } else {
      results.broken.push('Frontend page has no title');
      log('❌ Frontend: No title found');
    }
  } catch (error) {
    results.broken.push('Frontend is NOT accessible');
    log(`❌ Frontend: ${error.message}`);
  }
}

async function testLogin(page) {
  log('\n🔍 Login Test...');
  
  try {
    // Check for console errors first
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(8000); // Wait longer for React to render
    
    // Check what's actually on the page
    const pageInfo = await page.evaluate(() => {
      return {
        title: document.title,
        bodyText: document.body.textContent?.substring(0, 200) || '',
        htmlLength: document.body.innerHTML.length,
        totalButtons: document.querySelectorAll('button').length,
        totalDivs: document.querySelectorAll('div').length,
        hasRoot: !!document.getElementById('root'),
        rootContent: document.getElementById('root')?.innerHTML?.substring(0, 200) || '',
        buttonTexts: Array.from(document.querySelectorAll('button')).map(b => b.textContent?.trim()).filter(Boolean),
        hasDemoIndividual: !!document.querySelector('button[data-testid="demo-individual"]'),
        allTestIds: Array.from(document.querySelectorAll('button')).map(b => b.getAttribute('data-testid')).filter(Boolean),
      };
    });
    
    log(`  📊 Page Debug:`);
    log(`     Title: ${pageInfo.title}`);
    log(`     Buttons: ${pageInfo.totalButtons}, Divs: ${pageInfo.totalDivs}`);
    log(`     Has #root: ${pageInfo.hasRoot}`);
    log(`     HTML Length: ${pageInfo.htmlLength}`);
    log(`     Body Text (first 100): ${pageInfo.bodyText.substring(0, 100)}`);
    log(`     Root Content (first 100): ${pageInfo.rootContent.substring(0, 100)}`);
    
    if (consoleErrors.length > 0) {
      log(`  ⚠️  Console Errors: ${consoleErrors.join('; ')}`);
      results.warnings.push(`Console errors: ${consoleErrors.length}`);
    }
    
    if (pageInfo.totalButtons === 0) {
      results.broken.push(`Login page has NO buttons - React may not be rendering`);
      log(`❌ Login: Page loaded but React didn't render (0 buttons found)`);
      return;
    }
    
    // Try multiple selectors
    const selectors = [
      'button[data-testid="demo-individual"]',
      'button:has-text("Bireysel")',
      'button:has-text("Individual")',
      `button:has-text("${pageInfo.buttonTexts.find(t => t.includes('Bireysel') || t.includes('Individual')) || ''}")`,
    ];
    
    let clicked = false;
    for (const selector of selectors) {
      try {
        const button = page.locator(selector).first();
        const isVisible = await button.isVisible({ timeout: 3000 }).catch(() => false);
        
        if (isVisible) {
          log(`  ✅ Found button with: ${selector}`);
          await button.click();
          await page.waitForTimeout(5000);
          clicked = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (clicked) {
      await page.waitForTimeout(3000);
      const currentUrl = page.url();
      
      if (currentUrl.includes('/individual')) {
        results.working.push('Demo login works');
        log('✅ Login: WORKS - Redirected to individual dashboard');
      } else {
        results.broken.push(`Demo login clicked but redirected to: ${currentUrl}`);
        log(`❌ Login: Clicked but redirected to ${currentUrl}`);
      }
    } else {
      results.broken.push('Demo login button not found with any selector');
      log('❌ Login: Button not found - Page may not be fully loaded');
      log(`   Debug: Found ${pageInfo.totalButtons} buttons, testIds: ${pageInfo.allTestIds.join(', ')}`);
    }
  } catch (error) {
    results.broken.push(`Login failed: ${error.message}`);
    log(`❌ Login: ${error.message}`);
  }
}

async function testDashboardAPI(page) {
  log('\n🔍 Dashboard API Test...');
  
  try {
    // Get token from localStorage
    const token = await page.evaluate(() => localStorage.getItem('authToken'));
    
    if (!token) {
      results.broken.push('No auth token found - cannot test dashboard API');
      log('❌ Dashboard API: No token');
      return;
    }
    
    const response = await page.request.get('http://localhost:5000/api/dashboard/stats/individual', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const data = await response.json();
    
    if (response.status() === 200 && data.success) {
      results.working.push('Dashboard API returns data');
      log(`✅ Dashboard API: WORKS (got ${JSON.stringify(data.data?.stats || {})})`);
    } else {
      results.broken.push(`Dashboard API failed: ${response.status()}, ${JSON.stringify(data)}`);
      log(`❌ Dashboard API: Status ${response.status()}, Response: ${JSON.stringify(data).substring(0, 100)}`);
    }
  } catch (error) {
    results.broken.push(`Dashboard API error: ${error.message}`);
    log(`❌ Dashboard API: ${error.message}`);
  }
}

async function testShipmentsAPI(page) {
  log('\n🔍 Shipments API Test...');
  
  try {
    const token = await page.evaluate(() => localStorage.getItem('authToken'));
    
    if (!token) {
      results.warnings.push('No token for shipments API test');
      return;
    }
    
    const response = await page.request.get('http://localhost:5000/api/shipments', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const data = await response.json();
    
    if (response.status() === 200) {
      results.working.push('Shipments API accessible');
      log(`✅ Shipments API: WORKS (got ${data.data?.length || data.shipments?.length || 0} shipments)`);
    } else {
      results.broken.push(`Shipments API failed: ${response.status()}`);
      log(`❌ Shipments API: Status ${response.status()}`);
    }
  } catch (error) {
    results.broken.push(`Shipments API error: ${error.message}`);
    log(`❌ Shipments API: ${error.message}`);
  }
}

async function testDashboardPage(page) {
  log('\n🔍 Dashboard Page Test...');
  
  try {
    await page.goto('http://localhost:5173/individual/dashboard', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(5000);
    
    // Check if redirected to login
    if (page.url().includes('/login')) {
      results.broken.push('Dashboard redirects to login (not authenticated)');
      log('❌ Dashboard Page: Redirected to login');
      return;
    }
    
    // Check for API calls in network tab
    const hasStats = await page.evaluate(() => {
      const text = document.body.textContent || '';
      return text.includes('0') || /\d+/.test(text); // Has numbers = probably loaded stats
    });
    
    if (hasStats) {
      results.working.push('Dashboard page loads');
      log('✅ Dashboard Page: LOADS');
    } else {
      results.warnings.push('Dashboard page loads but no stats visible');
      log('⚠️ Dashboard Page: Loads but no data');
    }
  } catch (error) {
    results.broken.push(`Dashboard page error: ${error.message}`);
    log(`❌ Dashboard Page: ${error.message}`);
  }
}

async function main() {
  log('\n═══════════════════════════════════════════════════════');
  log('🔍 GERÇEK DURUM TESTİ - NE ÇALIŞIYOR?');
  log('═══════════════════════════════════════════════════════\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    await testBackendHealth(page);
    await testFrontendLoad(page);
    await testLogin(page);
    await testDashboardAPI(page);
    await testShipmentsAPI(page);
    await testDashboardPage(page);
    
  } catch (error) {
    log(`\n❌ Test suite error: ${error.message}`);
  } finally {
    await browser.close();
  }
  
  // FINAL REPORT
  log('\n═══════════════════════════════════════════════════════');
  log('📊 GERÇEK DURUM RAPORU');
  log('═══════════════════════════════════════════════════════\n');
  
  log(`✅ ÇALIŞAN (${results.working.length}):`);
  results.working.forEach(item => log(`   ✅ ${item}`));
  
  log(`\n❌ ÇALIŞMAYAN (${results.broken.length}):`);
  results.broken.forEach(item => log(`   ❌ ${item}`));
  
  log(`\n⚠️  UYARILAR (${results.warnings.length}):`);
  results.warnings.forEach(item => log(`   ⚠️  ${item}`));
  
  log('\n═══════════════════════════════════════════════════════');
  log(`📈 ÖZET: ${results.working.length} çalışıyor, ${results.broken.length} çalışmıyor`);
  log('═══════════════════════════════════════════════════════\n');
}

main().catch(console.error);



