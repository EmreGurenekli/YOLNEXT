const { chromium } = require('playwright');

async function testLanding() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🔍 LandingPage\'e gidiliyor...');
    await page.goto('http://localhost:5173/');
    await page.waitForTimeout(3000);
    
    const title = await page.title();
    console.log('📄 Sayfa başlığı:', title);
    
    // URL kontrol et
    const url = page.url();
    console.log('🌐 URL:', url);
    
    // H1 kontrol et
    const h1 = await page.$('h1');
    if (h1) {
      const h1Text = await h1.textContent();
      console.log('📝 H1 içeriği:', h1Text);
    }
    
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
    
    // Eğer login sayfasındaysak, ana sayfaya git
    if (title.includes('Giriş') || url.includes('login')) {
      console.log('⚠️ Login sayfasındayız, ana sayfaya yönlendiriliyor...');
      await page.goto('http://localhost:5173/');
      await page.waitForTimeout(2000);
      
      const newTitle = await page.title();
      console.log('📄 Yeni sayfa başlığı:', newTitle);
    }
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    await browser.close();
  }
}

testLanding();





