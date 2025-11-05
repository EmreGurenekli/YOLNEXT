// Final comprehensive test after Vite restart
const { chromium } = require('playwright');

const log = (msg) => console.log(msg);

async function main() {
  log('\n🔍 FINAL CHECK - Testing After Vite Restart...\n');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newContext().then(ctx => ctx.newPage());
  
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  
  page.on('pageerror', err => errors.push(err.message));
  
  try {
    log('1. Loading http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(5000);
    
    const info = await page.evaluate(() => ({
      title: document.title,
      hasRoot: !!document.getElementById('root'),
      rootContent: document.getElementById('root')?.innerHTML?.length > 0,
      rootPreview: document.getElementById('root')?.innerHTML?.substring(0, 200) || '',
      scripts: document.querySelectorAll('script').length,
      buttons: document.querySelectorAll('button').length,
      divs: document.querySelectorAll('div').length,
    }));
    
    log('\n📊 Page Status:');
    log(`  Title: ${info.title || 'Empty'}`);
    log(`  Has root element: ${info.hasRoot}`);
    log(`  Root has content: ${info.rootContent}`);
    log(`  Scripts: ${info.scripts}`);
    log(`  Buttons: ${info.buttons}`);
    log(`  Divs: ${info.divs}`);
    
    if (errors.length > 0) {
      log(`\n⚠️  Console Errors: ${errors.length}`);
      errors.slice(0, 3).forEach(e => log(`  - ${e.substring(0, 150)}`));
    }
    
    if (info.rootContent) {
      log('\n✅ SUCCESS: React is rendering!');
      log(`   Root preview: ${info.rootPreview.substring(0, 100)}`);
      
      // Test login page
      log('\n2. Testing login page...');
      await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle', timeout: 20000 });
      await page.waitForTimeout(3000);
      
      const loginInfo = await page.evaluate(() => ({
        buttons: document.querySelectorAll('button').length,
        hasDemoButton: !!document.querySelector('button[data-testid="demo-individual"]'),
        pageText: document.body.textContent?.substring(0, 200) || '',
      }));
      
      log(`  Buttons found: ${loginInfo.buttons}`);
      log(`  Demo button exists: ${loginInfo.hasDemoButton}`);
      
      if (loginInfo.hasDemoButton) {
        log('\n✅ SUCCESS: Login page loaded, demo button found!');
      } else {
        log('\n⚠️  Demo button not found, but page loaded');
      }
    } else {
      log('\n❌ FAILED: Root is still empty - React not rendering');
      log(`   Root HTML: ${info.rootPreview}`);
    }
    
  } catch (error) {
    log(`\n❌ Test error: ${error.message}`);
  } finally {
    await browser.close();
  }
  
  log('\n✅ Test complete!\n');
}

main().catch(console.error);

