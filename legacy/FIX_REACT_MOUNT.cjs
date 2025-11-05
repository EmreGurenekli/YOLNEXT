// Fix React Mount Issue - Diagnostic Script
const { chromium } = require('playwright');

async function diagnose() {
  console.log('\n🔍 DIAGNOSING REACT MOUNT ISSUE\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Go to page
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(5000);
    
    // Check console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Get page info
    const info = await page.evaluate(() => {
      const root = document.getElementById('root');
      const scripts = Array.from(document.querySelectorAll('script')).map(s => s.src || s.innerHTML.substring(0, 100));
      const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]')).map(s => s.href || 'inline');
      
      return {
        rootExists: !!root,
        rootContent: root?.innerHTML.length || 0,
        rootChildren: root?.children.length || 0,
        scripts: scripts.length,
        scriptSources: scripts,
        styles: styles.length,
        title: document.title,
        bodyContent: document.body.innerHTML.length,
        hasReact: !!window.React || !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__,
        errors: Array.from(document.querySelectorAll('.error, [role="alert"]')).map(e => e.textContent),
      };
    });
    
    console.log('📊 PAGE ANALYSIS:');
    console.log(`  Root exists: ${info.rootExists}`);
    console.log(`  Root content length: ${info.rootContent}`);
    console.log(`  Root children: ${info.rootChildren}`);
    console.log(`  Scripts: ${info.scripts}`);
    console.log(`  Styles: ${info.styles}`);
    console.log(`  Title: ${info.title}`);
    console.log(`  React detected: ${info.hasReact}`);
    console.log(`  Console errors: ${consoleErrors.length}`);
    
    if (consoleErrors.length > 0) {
      console.log('\n🔴 CONSOLE ERRORS:');
      consoleErrors.slice(0, 10).forEach((err, i) => {
        console.log(`  ${i + 1}. ${err.substring(0, 150)}`);
      });
    }
    
    if (info.rootContent === 0) {
      console.log('\n❌ ISSUE: Root is empty - React not mounting');
      console.log('   Possible causes:');
      console.log('   1. Vite not serving React bundle');
      console.log('   2. React script errors');
      console.log('   3. Main.tsx not executing');
    } else if (info.rootContent < 100) {
      console.log('\n⚠️ WARNING: Root has minimal content');
    } else {
      console.log('\n✅ Root has content - React might be mounting');
    }
    
    // Take screenshot
    await page.screenshot({ path: 'react-mount-diagnostic.png', fullPage: true });
    console.log('\n📸 Screenshot saved: react-mount-diagnostic.png');
    
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

diagnose();

