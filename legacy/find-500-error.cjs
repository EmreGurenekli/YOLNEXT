// Find which resource is returning 500
const { chromium } = require('playwright');

async function main() {
  console.log('\n🔍 Finding 500 Error Source...\n');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newContext().then(ctx => ctx.newPage());
  
  const failedRequests = [];
  
  page.on('response', response => {
    if (response.status() === 500) {
      failedRequests.push({
        url: response.url(),
        status: response.status(),
      });
    }
  });
  
  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(5000);
    
    console.log(`\n📊 Found ${failedRequests.length} requests with 500 status:\n`);
    failedRequests.forEach((req, i) => {
      console.log(`${i + 1}. ${req.url}`);
    });
    
    if (failedRequests.length === 0) {
      console.log('✅ No 500 errors found!');
    }
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  } finally {
    await browser.close();
  }
}

main();
