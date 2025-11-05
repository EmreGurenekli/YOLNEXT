// Detailed error check - finds exact errors
const { chromium } = require('playwright');

async function checkErrors() {
  const browser = await chromium.launch({ headless: false }); // Show browser to see errors
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const errors = [];
  const warnings = [];
  const networkErrors = [];
  
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    if (type === 'error') {
      errors.push(text);
      console.log(`🔴 Console Error: ${text}`);
    } else if (type === 'warning') {
      warnings.push(text);
      console.log(`⚠️ Console Warning: ${text}`);
    }
  });
  
  page.on('response', response => {
    if (response.status() >= 400) {
      const url = response.url();
      const status = response.status();
      networkErrors.push({ url, status });
      console.log(`❌ Network Error: ${status} - ${url}`);
    }
  });
  
  page.on('requestfailed', request => {
    console.log(`❌ Request Failed: ${request.url()} - ${request.failure()?.errorText}`);
  });
  
  try {
    console.log('\n🌐 Loading http://localhost:5173/...\n');
    await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    console.log('\n⏳ Waiting 15 seconds for React to mount...\n');
    await page.waitForTimeout(15000);
    
    // Check page state
    const pageState = await page.evaluate(() => {
      const root = document.getElementById('root');
      return {
        rootExists: !!root,
        rootContent: root?.innerHTML || '',
        rootLength: root?.innerHTML.length || 0,
        buttons: document.querySelectorAll('button').length,
        scripts: Array.from(document.querySelectorAll('script')).map(s => s.src),
        errors: Array.from(document.querySelectorAll('.error, [role="alert"]')).map(e => e.textContent),
        title: document.title,
      };
    });
    
    console.log('\n📊 Page State:');
    console.log(`  Root exists: ${pageState.rootExists}`);
    console.log(`  Root length: ${pageState.rootLength}`);
    console.log(`  Buttons: ${pageState.buttons}`);
    console.log(`  Title: ${pageState.title}`);
    console.log(`  Scripts: ${pageState.scripts.length}`);
    
    if (pageState.rootLength < 100) {
      console.log(`\n⚠️ Root content is too small (${pageState.rootLength} bytes)`);
      console.log(`Root content preview: ${pageState.rootContent.substring(0, 200)}`);
    }
    
    // Take screenshot
    await page.screenshot({ path: 'error-check-screenshot.png', fullPage: true });
    console.log('\n📸 Screenshot saved: error-check-screenshot.png');
    
  } catch (error) {
    console.log(`\n❌ Error: ${error.message}`);
  } finally {
    console.log('\n⏳ Keeping browser open for 10 seconds to inspect...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
  
  console.log('\n📋 Summary:');
  console.log(`  Console Errors: ${errors.length}`);
  console.log(`  Console Warnings: ${warnings.length}`);
  console.log(`  Network Errors: ${networkErrors.length}`);
  
  if (errors.length > 0) {
    console.log('\n🔴 All Console Errors:');
    errors.forEach((err, i) => {
      console.log(`  ${i + 1}. ${err}`);
    });
  }
  
  if (networkErrors.length > 0) {
    console.log('\n🔴 All Network Errors:');
    networkErrors.forEach((err, i) => {
      console.log(`  ${i + 1}. ${err.status} - ${err.url}`);
    });
  }
}

checkErrors();



