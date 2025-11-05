// Test React after Vite restart
const { chromium } = require('playwright');

async function test() {
  console.log('\n🔍 Testing React after Vite restart...\n');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newContext().then(ctx => ctx.newPage());
  
  const errors = [];
  const consoleMsgs = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
      consoleMsgs.push(`[${msg.type()}] ${msg.text()}`);
    }
  });
  
  page.on('pageerror', err => errors.push(err.message));
  
  try {
    console.log('Loading http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(8000); // Wait for React
    
    const info = await page.evaluate(() => {
      const root = document.getElementById('root');
      return {
        title: document.title,
        hasRoot: !!root,
        rootHasContent: root?.innerHTML?.length > 0 || false,
        rootContentLength: root?.innerHTML?.length || 0,
        rootPreview: root?.innerHTML?.substring(0, 300) || '',
        scripts: document.querySelectorAll('script').length,
        buttons: document.querySelectorAll('button').length,
        divs: document.querySelectorAll('div').length,
      };
    });
    
    console.log('📊 Results:');
    console.log(`  Title: ${info.title}`);
    console.log(`  Has root: ${info.hasRoot}`);
    console.log(`  Root has content: ${info.rootHasContent}`);
    console.log(`  Root content length: ${info.rootContentLength}`);
    console.log(`  Scripts: ${info.scripts}`);
    console.log(`  Buttons: ${info.buttons}`);
    console.log(`  Divs: ${info.divs}`);
    
    if (errors.length > 0) {
      console.log(`\n⚠️  Console errors (${errors.length}):`);
      errors.slice(0, 5).forEach(e => console.log(`  ${e.substring(0, 150)}`));
    }
    
    if (info.rootHasContent && info.buttons > 0) {
      console.log('\n✅ SUCCESS! React is rendering!');
      console.log(`   Found ${info.buttons} buttons - Login page should be working`);
      return true;
    } else {
      console.log('\n❌ FAILED - React not rendering');
      console.log(`   Root preview: ${info.rootPreview.substring(0, 200)}`);
      return false;
    }
    
  } catch (error) {
    console.error(`❌ Test error: ${error.message}`);
    return false;
  } finally {
    await browser.close();
  }
}

test().then(success => {
  process.exit(success ? 0 : 1);
});

