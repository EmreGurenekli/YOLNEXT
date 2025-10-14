const { chromium } = require('playwright');

async function testCreateShipmentHard() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🔍 Create Shipment sayfasına gidiliyor (hard refresh)...');
    await page.goto('http://localhost:5173/individual/create-shipment', { waitUntil: 'networkidle' });
    
    // Hard refresh
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    const title = await page.title();
    console.log('📄 Sayfa başlığı:', title);
    
    // Arka plan kontrol et
    const bodyBg = await page.$eval('body', el => {
      const style = getComputedStyle(el);
      return style.background;
    });
    console.log('🎨 Body arka plan:', bodyBg);
    
    // Ana div kontrol et
    const mainDiv = await page.$('div[class*="min-h-screen"]');
    if (mainDiv) {
      const mainBg = await mainDiv.evaluate(el => {
        const style = getComputedStyle(el);
        return style.background;
      });
      console.log('🎨 Ana div arka plan:', mainBg);
    }
    
    // H1 kontrol et
    const h1 = await page.$('h1');
    if (h1) {
      const h1Text = await h1.textContent();
      console.log('📝 H1 içeriği:', h1Text);
    }
    
    // Progress steps kontrol et
    const steps = await page.$$('[class*="w-10 h-10 rounded-full"]');
    console.log('🔢 Progress steps sayısı:', steps.length);
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    await browser.close();
  }
}

testCreateShipmentHard();





