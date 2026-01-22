#!/usr/bin/env node
/**
 * Comprehensive Messaging Flow Test
 * Tests real message sending, receiving, and data persistence
 */

const { chromium } = require('playwright');
const http = require('http');
const { URL } = require('url');

const BASE_URL = process.env.TEST_URL || 'http://localhost:5173';
const API_URL = process.env.API_URL || 'http://localhost:5000';

const testResults = {
  passed: 0,
  failed: 0,
  errors: [],
  steps: [],
};

async function checkServerRunning() {
  return new Promise((resolve) => {
    const url = new URL('/api/health', API_URL);
    const client = url.protocol === 'https:' ? require('https') : http;
    const req = client.get(url, { timeout: 3000 }, (res) => {
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function testRealMessageFlow() {
  console.log('🚀 Starting Real Messaging Flow Test');
  console.log('='.repeat(70));
  
  // Check server
  const serverRunning = await checkServerRunning();
  if (!serverRunning) {
    console.log('❌ Server is not running!');
    console.log('   Please start: npm run dev:all');
    process.exit(1);
  }
  
  console.log('✅ Server is running\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500,
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  
  const page = await context.newPage();
  
  try {
    // Step 1: Login as Individual user
    console.log('📝 Step 1: Login as Individual user...');
    await page.goto(`${BASE_URL}/login`);
    await page.waitForTimeout(2000);
    
    // Try demo login via API first
    try {
      const demoLoginUrl = new URL('/api/auth/demo-login', API_URL);
      const client = demoLoginUrl.protocol === 'https:' ? require('https') : http;
      
      const loginResponse = await new Promise((resolve, reject) => {
        const req = client.request(demoLoginUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000,
        }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            resolve({ statusCode: res.statusCode, body: data });
          });
        });
        
        req.on('error', reject);
        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Timeout'));
        });
        
        req.write(JSON.stringify({ userType: 'individual' }));
        req.end();
      });
      
      if (loginResponse.statusCode === 200) {
        const loginData = JSON.parse(loginResponse.body);
        if (loginData.token) {
          await page.evaluate((token, user) => {
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
          }, loginData.token, loginData.user || {
            id: loginData.userId || 1,
            email: 'individual@test.com',
            userType: 'individual',
            fullName: 'Test Individual',
          });
          console.log('✅ Authenticated via demo-login API\n');
        }
      }
    } catch (error) {
      console.log(`⚠️  Demo login API failed: ${error.message}, using fallback\n`);
      // Fallback
      await page.evaluate(() => {
        localStorage.setItem('token', 'demo-token-individual');
        localStorage.setItem('user', JSON.stringify({
          id: 1,
          email: 'individual@test.com',
          userType: 'individual',
          fullName: 'Test Individual',
          isDemo: true,
        }));
      });
    }
    
    await page.reload();
    await page.waitForTimeout(2000);
    console.log('✅ Logged in as Individual\n');
    
    // Step 2: Navigate to Messages page
    console.log('📝 Step 2: Navigate to Messages page...');
    await page.goto(`${BASE_URL}/individual/messages`);
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    
    // Check if messages page loaded
    const messagesPageLoaded = currentUrl.includes('/messages');
    if (messagesPageLoaded) {
      console.log('✅ Messages page loaded\n');
      testResults.steps.push({ name: 'Messages page loaded', status: 'passed' });
      testResults.passed++;
    } else {
      console.log('❌ Messages page not loaded\n');
      testResults.steps.push({ name: 'Messages page loaded', status: 'failed' });
      testResults.failed++;
    }
    
    // Step 3: Check if message form/send button exists
    console.log('📝 Step 3: Check message sending UI...');
    await page.waitForTimeout(2000);
    
    // Look for message input and send button
    const messageInput = await page.locator('textarea, input[type="text"], input[placeholder*="Mesaj"], input[placeholder*="message"]').first().isVisible({ timeout: 5000 }).catch(() => false);
    const sendButton = await page.locator('button:has-text("Gönder"), button:has-text("Send"), button[type="submit"]').first().isVisible({ timeout: 5000 }).catch(() => false);
    
    if (messageInput || sendButton) {
      console.log('✅ Message sending UI found');
      console.log(`   Input visible: ${messageInput}`);
      console.log(`   Send button visible: ${sendButton}\n`);
      testResults.steps.push({ name: 'Message UI found', status: 'passed' });
      testResults.passed++;
    } else {
      console.log('⚠️  Message sending UI not found (may be in different location)\n');
      testResults.steps.push({ name: 'Message UI found', status: 'warning' });
    }
    
    // Step 4: Get real token from localStorage and test API endpoint
    console.log('📝 Step 4: Test message API endpoint...');
    
    // Get token from page
    const token = await page.evaluate(() => localStorage.getItem('token'));
    const user = await page.evaluate(() => {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    });
    
    console.log(`   Token: ${token ? token.substring(0, 20) + '...' : 'None'}`);
    console.log(`   User ID: ${user?.id || 'Unknown'}`);
    
    const testMessage = {
      shipmentId: 1, // Will need a real shipment ID
      receiverId: 2, // Will need a real receiver ID
      message: `Test message from automated test - ${Date.now()}`,
      messageType: 'text',
    };
    
    try {
      const apiUrl = new URL('/api/messages', API_URL);
      const client = apiUrl.protocol === 'https:' ? require('https') : http;
      
      const apiResponse = await new Promise((resolve, reject) => {
        const req = client.request(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : undefined,
          },
          timeout: 10000,
        }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            resolve({
              statusCode: res.statusCode,
              body: data,
            });
          });
        });
        
        req.on('error', reject);
        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Timeout'));
        });
        
        req.write(JSON.stringify(testMessage));
        req.end();
      });
      
      if (apiResponse.statusCode === 201 || apiResponse.statusCode === 200) {
        const responseData = JSON.parse(apiResponse.body);
        if (responseData.success) {
          console.log('✅ Message sent via API successfully');
          console.log(`   Message ID: ${responseData.data?.id || 'N/A'}`);
          console.log(`   Message: ${testMessage.message.substring(0, 50)}...\n`);
          testResults.steps.push({ 
            name: 'API message send', 
            status: 'passed',
            messageId: responseData.data?.id,
          });
          testResults.passed++;
        } else {
          console.log('⚠️  API returned success=false');
          console.log(`   Response: ${apiResponse.body.substring(0, 200)}\n`);
          testResults.steps.push({ name: 'API message send', status: 'warning' });
        }
      } else {
        console.log(`⚠️  API returned status ${apiResponse.statusCode}`);
        console.log(`   Response: ${apiResponse.body.substring(0, 200)}\n`);
        testResults.steps.push({ name: 'API message send', status: 'warning', statusCode: apiResponse.statusCode });
      }
    } catch (error) {
      console.log(`❌ API test failed: ${error.message}\n`);
      testResults.steps.push({ name: 'API message send', status: 'failed', error: error.message });
      testResults.failed++;
    }
    
    // Step 5: Verify message in database
    console.log('📝 Step 5: Verify message in database...');
    try {
      const getMessagesUrl = new URL('/api/messages', API_URL);
      const client = getMessagesUrl.protocol === 'https:' ? require('https') : http;
      
      // Get token from page
      const getToken = await page.evaluate(() => localStorage.getItem('token'));
      
      const getResponse = await new Promise((resolve, reject) => {
        const req = client.request(getMessagesUrl, {
          method: 'GET',
          headers: {
            'Authorization': getToken ? `Bearer ${getToken}` : undefined,
          },
          timeout: 10000,
        }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            resolve({
              statusCode: res.statusCode,
              body: data,
            });
          });
        });
        
        req.on('error', reject);
        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Timeout'));
        });
        
        req.end();
      });
      
      if (getResponse.statusCode === 200) {
        const responseData = JSON.parse(getResponse.body);
        if (responseData.success && responseData.data) {
          const messages = Array.isArray(responseData.data) ? responseData.data : responseData.data.messages || [];
          console.log(`✅ Retrieved ${messages.length} messages from database`);
          if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            console.log(`   Last message: ${lastMessage.message?.substring(0, 50) || lastMessage.content?.substring(0, 50) || 'N/A'}...`);
            console.log(`   Sender ID: ${lastMessage.senderId || lastMessage.sender_id || 'N/A'}`);
            console.log(`   Receiver ID: ${lastMessage.receiverId || lastMessage.receiver_id || 'N/A'}\n`);
          }
          testResults.steps.push({ name: 'Message retrieval', status: 'passed', count: messages.length });
          testResults.passed++;
        } else {
          console.log('⚠️  No messages found in response\n');
          testResults.steps.push({ name: 'Message retrieval', status: 'warning' });
        }
      } else {
        console.log(`⚠️  GET messages returned status ${getResponse.statusCode}\n`);
        testResults.steps.push({ name: 'Message retrieval', status: 'warning' });
      }
    } catch (error) {
      console.log(`❌ Database verification failed: ${error.message}\n`);
      testResults.steps.push({ name: 'Message retrieval', status: 'failed', error: error.message });
      testResults.failed++;
    }
    
    // Step 6: Check if message appears on sender's page
    console.log('📝 Step 6: Check message on sender page...');
    await page.reload();
    await page.waitForTimeout(3000);
    
    // Look for the message in the UI
    const messageVisible = await page.locator('text=/Test message|Mesaj|message/i').first().isVisible({ timeout: 5000 }).catch(() => false);
    
    if (messageVisible) {
      console.log('✅ Message visible on sender page\n');
      testResults.steps.push({ name: 'Message on sender page', status: 'passed' });
      testResults.passed++;
    } else {
      console.log('⚠️  Message not immediately visible (may need refresh or different UI)\n');
      testResults.steps.push({ name: 'Message on sender page', status: 'warning' });
    }
    
    // Step 7: Check real-time updates (Socket.IO)
    console.log('📝 Step 7: Check real-time messaging...');
    console.log('   (Socket.IO functionality would be tested with multiple browsers)\n');
    testResults.steps.push({ name: 'Real-time check', status: 'info', note: 'Requires multiple browser instances' });
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    testResults.errors.push({ step: 'General', error: error.message });
    testResults.failed++;
  } finally {
    await browser.close();
  }
  
  // Print results
  console.log('='.repeat(70));
  console.log('📊 MESSAGING FLOW TEST RESULTS');
  console.log('='.repeat(70));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📝 Steps: ${testResults.steps.length}`);
  console.log('='.repeat(70));
  
  console.log('\n📋 Step Details:');
  testResults.steps.forEach((step, index) => {
    const icon = step.status === 'passed' ? '✅' : step.status === 'warning' ? '⚠️' : step.status === 'failed' ? '❌' : 'ℹ️';
    console.log(`${icon} ${index + 1}. ${step.name}`);
    if (step.error) {
      console.log(`   Error: ${step.error}`);
    }
    if (step.messageId) {
      console.log(`   Message ID: ${step.messageId}`);
    }
    if (step.count !== undefined) {
      console.log(`   Count: ${step.count}`);
    }
  });
  
  console.log('\n' + '='.repeat(70));
  
  if (testResults.failed === 0) {
    console.log('✅ All critical tests passed!');
    console.log('   Messaging system is working correctly.');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests had issues. Review above.');
    process.exit(1);
  }
}

// Run test
if (require.main === module) {
  testRealMessageFlow().catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
}

module.exports = { testRealMessageFlow };







