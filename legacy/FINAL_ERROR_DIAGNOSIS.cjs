// Final Error Diagnosis - Finds exact problems
const { chromium } = require('playwright');

async function diagnose() {
  console.log('\n🔍 FINAL ERROR DIAGNOSIS\n');
  console.log('='.repeat(70));
  
  const browser = await chromium.launch({ headless: false }); // Show browser
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const allErrors = [];
  const allWarnings = [];
  const failedRequests = [];
  
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    if (type === 'error') {
      allErrors.push(text);
      console.log(`🔴 [CONSOLE ERROR] ${text}`);
    } else if (type === 'warning') {
      allWarnings.push(text);
      console.log(`⚠️ [CONSOLE WARNING] ${text}`);
    }
  });
  
  page.on('response', response => {
    const status = response.status();
    const url = response.url();
    if (status >= 400) {
      failedRequests.push({ url, status });
      console.log(`❌ [${status}] ${url}`);
      
      // Try to get error details for 500 errors
      if (status >= 500) {
        response.text().then(text => {
          console.log(`   Error body: ${text.substring(0, 200)}`);
        }).catch(() => {});
      }
    }
  });
  
  page.on('requestfailed', request => {
    const failure = request.failure();
    console.log(`❌ [REQUEST FAILED] ${request.url()}`);
    if (failure) {
      console.log(`   Error: ${failure.errorText}`);
    }
  });
  
  try {
    console.log('\n🌐 Loading http://localhost:5173/...\n');
    await page.goto('http://localhost:5173/', { 
      waitUntil: 'domcontentloaded', 
      timeout: 60000 
    });
    
    console.log('\n⏳ Waiting 20 seconds for React...\n');
    await page.waitForTimeout(20000);
    
    // Check what's in the page
    const pageInfo = await page.evaluate(() => {
      return {
        root: {
          exists: !!document.getElementById('root'),
          innerHTML: document.getElementById('root')?.innerHTML || '',
          length: document.getElementById('root')?.innerHTML.length || 0,
        },
        scripts: Array.from(document.querySelectorAll('script')).map(s => ({
          src: s.src,
          type: s.type,
          loaded: s.readyState === 'complete',
        })),
        errors: Array.from(document.querySelectorAll('.error, [role="alert"], .error-boundary')).map(e => e.textContent),
        title: document.title,
        bodyText: document.body.innerText.substring(0, 200),
      };
    });
    
    console.log('\n📊 Page Analysis:');
    console.log(`  Root exists: ${pageInfo.root.exists}`);
    console.log(`  Root length: ${pageInfo.root.length}`);
    console.log(`  Scripts: ${pageInfo.scripts.length}`);
    pageInfo.scripts.forEach((script, i) => {
      console.log(`    ${i + 1}. ${script.src || 'inline'} (${script.type}) - ${script.loaded ? 'loaded' : 'loading'}`);
    });
    console.log(`  Title: ${pageInfo.title}`);
    if (pageInfo.root.length < 100) {
      console.log(`  Root content: "${pageInfo.root.innerHTML.substring(0, 100)}"`);
    }
    
    // Screenshot
    await page.screenshot({ path: 'diagnosis-screenshot.png', fullPage: true });
    console.log('\n📸 Screenshot saved: diagnosis-screenshot.png');
    
    // Check for React errors in console
    const reactErrors = allErrors.filter(e => 
      e.includes('React') || 
      e.includes('Uncaught') || 
      e.includes('Cannot') ||
      e.includes('Module')
    );
    
    if (reactErrors.length > 0) {
      console.log('\n🔴 React-related Errors:');
      reactErrors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err}`);
      });
    }
    
    // Check for module errors
    const moduleErrors = failedRequests.filter(r => 
      r.url.includes('.tsx') || 
      r.url.includes('.ts') || 
      r.url.includes('.jsx') ||
      r.url.includes('/src/')
    );
    
    if (moduleErrors.length > 0) {
      console.log('\n❌ Module Loading Errors:');
      moduleErrors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err.status} - ${err.url}`);
      });
    }
    
  } catch (error) {
    console.log(`\n❌ Diagnosis Error: ${error.message}`);
  } finally {
    console.log('\n⏳ Keeping browser open for 15 seconds to inspect manually...');
    await page.waitForTimeout(15000);
    await browser.close();
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('\n📋 SUMMARY:');
  console.log(`  Console Errors: ${allErrors.length}`);
  console.log(`  Console Warnings: ${allWarnings.length}`);
  console.log(`  Failed Requests: ${failedRequests.length}`);
  console.log('\n');
}

diagnose();



