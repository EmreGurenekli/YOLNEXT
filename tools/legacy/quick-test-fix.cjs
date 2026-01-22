// Quick test to see what Vite is actually serving
const { chromium } = require('playwright');

async function test() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newContext().then(ctx => ctx.newPage());
  
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  
  page.on('pageerror', err => errors.push(err.message));
  
  try {
    console.log('Loading http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(5000);
    
    const info = await page.evaluate(() => ({
      title: document.title,
      hasRoot: !!document.getElementById('root'),
      rootHasContent: document.getElementById('root')?.innerHTML.length > 0,
      scripts: document.querySelectorAll('script').length,
      rootInnerHTML: document.getElementById('root')?.innerHTML?.substring(0, 200) || '',
    }));
    
    console.log('\n📊 Page Info:');
    console.log(`  Title: ${info.title}`);
    console.log(`  Has root: ${info.hasRoot}`);
    console.log(`  Root has content: ${info.rootHasContent}`);
    console.log(`  Scripts: ${info.scripts}`);
    console.log(`  Console errors: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('\n❌ Errors:');
      errors.slice(0, 5).forEach(e => console.log(`  ${e.substring(0, 100)}`));
    }
    
    console.log(`  Root HTML preview: ${info.rootInnerHTML.substring(0, 100)}`);
    
    if (!info.rootHasContent) {
      console.log('\n⚠️  ROOT IS EMPTY - React not rendering');
    } else {
      console.log('\n✅ ROOT HAS CONTENT - React is rendering!');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await browser.close();
  }
}

test();



