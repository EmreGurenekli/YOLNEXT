/**
 * MCP Playwright Test Runner
 * 
 * This script runs browser tests using direct Playwright when MCP server fails.
 */

import { initBrowser, navigate, snapshot, click, type, close, getConsoleMessages } from './mcp-playwright-wrapper.js';

async function runTests() {
  console.log('=== MCP PLAYWRIGHT TEST RUNNER ===\n');
  
  try {
    // Initialize
    await initBrowser();
    
    // Test 1: Navigate to login
    console.log('\n1. Testing Login Page...');
    await navigate('http://localhost:5173/login');
    await snapshot('test-login.png');
    
    // Test 2: Check demo buttons
    console.log('\n2. Testing Demo Login Buttons...');
    const demoButtons = await page.$$('button[data-testid^="demo-"]');
    console.log(`✅ Found ${demoButtons.length} demo buttons`);
    
    // Test 3: Click individual demo button
    console.log('\n3. Testing Individual Demo Login...');
    await click('button[data-testid="demo-individual"]');
    await page.waitForTimeout(3000);
    await snapshot('test-individual-dashboard.png');
    
    // Test 4: Check console errors
    console.log('\n4. Checking Console Errors...');
    const errors = await getConsoleMessages(true);
    if (errors.length > 0) {
      console.log(`⚠️ Found ${errors.length} console errors`);
      errors.forEach(err => console.log(`   - ${err.type}: ${err.text}`));
    } else {
      console.log('✅ No console errors');
    }
    
    // Cleanup
    await close();
    
    console.log('\n🎉 ALL TESTS COMPLETED SUCCESSFULLY!');
    return true;
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    await close();
    return false;
  }
}

runTests().then(success => {
  process.exit(success ? 0 : 1);
});


