import { chromium } from 'playwright';

async function testHomepage() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🔍 Ana sayfaya gidiliyor...');
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(3000);
    
    console.log('📄 Sayfa başlığı:', await page.title());
    
    const h1 = await page.$('h1');
    console.log('📝 H1 bulundu mu?', h1 ? 'Evet' : 'Hayır');
    
    if (h1) {
      const h1Text = await h1.textContent();
      console.log('📝 H1 içeriği:', h1Text);
    }
    
    const body = await page.$('body');
    const bodyClass = await body.getAttribute('class');
    console.log('🎨 Body class:', bodyClass);
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    await browser.close();
  }
}

testHomepage();





