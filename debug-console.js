import { chromium } from 'playwright';

async function debugConsole() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Console mesajlarını yakala
  page.on('console', msg => {
    console.log('CONSOLE:', msg.type(), msg.text());
  });
  
  // Network hatalarını yakala
  page.on('response', response => {
    if (!response.ok()) {
      console.log('NETWORK ERROR:', response.status(), response.url());
    }
  });
  
  try {
    console.log('🔍 Sayfaya gidiliyor...');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(10000);
    
    console.log('📄 Sayfa başlığı:', await page.title());
    
    // React root elementini kontrol et
    const root = await page.$('#root');
    console.log('⚛️ React root bulundu mu?', !!root);
    
    if (root) {
      const rootHTML = await root.innerHTML();
      console.log('📝 Root içeriği:', rootHTML.substring(0, 200));
    }
    
  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await browser.close();
  }
}

debugConsole();





