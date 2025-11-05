// Find which resource is returning 500
const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newContext().then(ctx => ctx.newPage());
  
  const failedRequests = [];
  
  page.on('response', response => {
    if (response.status() >= 400) {
      failedRequests.push({
        url: response.url(),
        status: response.status(),
        headers: response.headers(),
      });
    }
  });
  
  page.on('requestfailed', request => {
    failedRequests.push({
      url: request.url(),
      status: 'FAILED',
      failure: request.failure()?.errorText,
    });
  });
  
  try {
    console.log('Loading http://localhost:5173...\n');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(5000);
    
    console.log(`📊 Found ${failedRequests.length} failed requests:\n`);
    
    failedRequests.forEach((req, i) => {
      console.log(`${i + 1}. ${req.url}`);
      console.log(`   Status: ${req.status}`);
      if (req.failure) console.log(`   Error: ${req.failure}`);
      console.log('');
    });
    
    // Check what's in the page
    const pageInfo = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script'));
      return {
        scripts: scripts.map(s => ({
          src: s.src || 'inline',
          type: s.type,
        })),
        rootContent: document.getElementById('root')?.innerHTML?.substring(0, 200) || '',
      };
    });
    
    console.log('📄 Scripts on page:');
    pageInfo.scripts.forEach((s, i) => {
      console.log(`  ${i + 1}. ${s.src} (${s.type})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

main();




