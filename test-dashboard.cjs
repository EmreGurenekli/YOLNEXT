const { chromium } = require('playwright');

async function testDashboard() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🔍 Individual Dashboard\'a gidiliyor...');
    await page.goto('http://localhost:5173/individual/dashboard');
    await page.waitForTimeout(3000);
    
    const title = await page.title();
    console.log('📄 Dashboard başlığı:', title);
    
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
    
    // Sidebar kontrol et
    const sidebar = await page.$('[data-testid="sidebar"]');
    if (sidebar) {
      console.log('✅ Sidebar bulundu');
    } else {
      console.log('❌ Sidebar bulunamadı');
    }
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    await browser.close();
  }
}

testDashboard();





