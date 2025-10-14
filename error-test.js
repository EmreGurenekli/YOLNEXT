import { chromium } from 'playwright';

async function errorTest() {
  console.log('🚨 ERROR TEST BAŞLIYOR...\n');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Console mesajlarını yakala
  page.on('console', msg => {
    console.log(`📝 Console [${msg.type()}]:`, msg.text());
  });
  
  // Network hatalarını yakala
  page.on('response', response => {
    if (response.status() >= 400) {
      console.log(`🚨 Network Error [${response.status()}]:`, response.url());
    }
  });
  
  // JavaScript hatalarını yakala
  page.on('pageerror', error => {
    console.log('💥 JavaScript Error:', error.message);
  });
  
  try {
    console.log('\n1️⃣ LANDING PAGE ERROR CHECK...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);
    
    console.log('\n2️⃣ DASHBOARD ERROR CHECK...');
    await page.goto('http://localhost:5173/individual/dashboard', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);
    
    console.log('\n3️⃣ SOURCE CODE CHECK...');
    const html = await page.content();
    console.log('📄 HTML Length:', html.length);
    console.log('📄 HTML Preview:', html.substring(0, 500));
    
    console.log('\n4️⃣ REACT CHECK...');
    const reactRoot = await page.locator('#root').count();
    console.log('⚛️ React Root found:', reactRoot > 0);
    
    if (reactRoot > 0) {
      const rootContent = await page.locator('#root').textContent();
      console.log('📄 Root Content Length:', rootContent.length);
      console.log('📄 Root Content Preview:', rootContent.substring(0, 200));
    }
    
  } catch (error) {
    console.error('❌ Error test hatası:', error);
  } finally {
    await browser.close();
  }
}

errorTest();





