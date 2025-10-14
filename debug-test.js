import { chromium } from 'playwright';

async function debugTest() {
  console.log('🔍 DEBUG TEST BAŞLIYOR...\n');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // 1. LANDING PAGE DEBUG
    console.log('\n1️⃣ LANDING PAGE DEBUG...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);
    
    // Sayfa başlığını kontrol et
    const title = await page.title();
    console.log('📄 Page Title:', title);
    
    // Tüm button'ları listele
    const buttons = await page.locator('button').all();
    console.log(`🔘 Total buttons found: ${buttons.length}`);
    
    for (let i = 0; i < buttons.length; i++) {
      const text = await buttons[i].textContent();
      console.log(`Button ${i + 1}: "${text}"`);
    }
    
    // Demo button'u farklı selector'larla ara
    const demoButton1 = await page.locator('button:has-text("Demo\'yu Başlat")').count();
    const demoButton2 = await page.locator('button:has-text("Demo")').count();
    const demoButton3 = await page.locator('button:has-text("Başlat")').count();
    
    console.log(`🔍 Demo button (exact): ${demoButton1}`);
    console.log(`🔍 Demo button (contains "Demo"): ${demoButton2}`);
    console.log(`🔍 Demo button (contains "Başlat"): ${demoButton3}`);
    
    // Tüm text içeriğini kontrol et
    const bodyText = await page.locator('body').textContent();
    if (bodyText.includes("Demo'yu Başlat")) {
      console.log('✅ "Demo\'yu Başlat" text found in body');
    } else {
      console.log('❌ "Demo\'yu Başlat" text NOT found in body');
    }
    
    // 2. DASHBOARD DEBUG
    console.log('\n2️⃣ DASHBOARD DEBUG...');
    await page.goto('http://localhost:5173/individual/dashboard', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);
    
    // Sayfa başlığını kontrol et
    const dashboardTitle = await page.title();
    console.log('📄 Dashboard Title:', dashboardTitle);
    
    // Tüm h1 elementlerini listele
    const h1Elements = await page.locator('h1').all();
    console.log(`📝 Total h1 elements found: ${h1Elements.length}`);
    
    for (let i = 0; i < h1Elements.length; i++) {
      const text = await h1Elements[i].textContent();
      console.log(`H1 ${i + 1}: "${text}"`);
    }
    
    // Sayfa içeriğini kontrol et
    const pageContent = await page.locator('body').textContent();
    if (pageContent.includes('Dashboard') || pageContent.includes('Ana Sayfa')) {
      console.log('✅ Dashboard content found');
    } else {
      console.log('❌ Dashboard content NOT found');
    }
    
    // 3. CONSOLE ERRORS
    console.log('\n3️⃣ CONSOLE ERRORS...');
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('🚨 Console Error:', msg.text());
      }
    });
    
    // 4. NETWORK ERRORS
    console.log('\n4️⃣ NETWORK ERRORS...');
    page.on('response', response => {
      if (response.status() >= 400) {
        console.log('🚨 Network Error:', response.status(), response.url());
      }
    });
    
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.error('❌ Debug test hatası:', error);
  } finally {
    await browser.close();
  }
}

debugTest();





