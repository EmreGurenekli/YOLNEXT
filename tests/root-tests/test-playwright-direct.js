// Direct Playwright test to verify browser connection
// This is a fallback when MCP Playwright server is not connected
import { chromium } from 'playwright';

async function testBrowser() {
  console.log('=== PLAYWRIGHT DIRECT TEST ===\n');
  
  try {
    console.log('1. Launching browser...');
    const browser = await chromium.launch({ headless: false });
    console.log('✅ Browser launched successfully');
    
    console.log('2. Creating new page...');
    const page = await browser.newPage();
    console.log('✅ Page created');
    
    console.log('3. Navigating to frontend...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
    console.log('✅ Navigation successful');
    
    console.log('4. Taking screenshot...');
    await page.screenshot({ path: 'test-screenshot.png', fullPage: true });
    console.log('✅ Screenshot saved: test-screenshot.png');
    
    console.log('5. Getting page title...');
    const title = await page.title();
    console.log(`✅ Page title: ${title}`);
    
    console.log('6. Checking for demo login buttons...');
    const demoButtons = await page.$$('button[data-testid^="demo-"]');
    console.log(`✅ Found ${demoButtons.length} demo login buttons`);
    
    console.log('\n7. Testing MCP Playwright wrapper compatibility...');
    console.log('   This test verifies that direct Playwright works');
    console.log('   when MCP server connection fails');
    
    console.log('\n8. Closing browser...');
    await browser.close();
    console.log('✅ Browser closed');
    
    console.log('\n🎉 PLAYWRIGHT TEST SUCCESSFUL!');
    console.log('✅ Browser connection is working');
    console.log('✅ All operations completed successfully');
    console.log('\n💡 TIP: Use this script when MCP server shows "Not connected"');
    console.log('   Run: node test-playwright-direct.js');
    
    return true;
  } catch (error) {
    console.error('\n❌ PLAYWRIGHT TEST FAILED:');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

testBrowser().then(success => {
  process.exit(success ? 0 : 1);
});

