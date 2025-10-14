import { chromium } from 'playwright';

async function testHomepage() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🔍 Ana sayfaya gidiliyor...');
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(3000);
    
    const title = await page.title();
    console.log('📄 Sayfa başlığı:', title);
    
    const h1 = await page.$('h1');
    console.log('🎯 Ana sayfa h1 var mı?', h1 ? 'Evet' : 'Hayır');
    
    if (h1) {
      const h1Text = await h1.textContent();
      console.log('📝 H1 içeriği:', h1Text);
    }
    
    // Demo butonunu kontrol et
    const demoButton = await page.$('button:has-text("Demo")');
    console.log('🔘 Demo butonu var mı?', demoButton ? 'Evet' : 'Hayır');
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    await browser.close();
  }
}

testHomepage();
