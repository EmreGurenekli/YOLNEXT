import { chromium } from 'playwright';

async function debugDemo() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🔍 Sayfaya gidiliyor...');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    console.log('📄 Sayfa başlığı:', await page.title());
    
    // Sayfa içeriğini kontrol et
    const bodyText = await page.textContent('body');
    console.log('📝 Sayfa içeriği (ilk 500 karakter):', bodyText.substring(0, 500));
    
    // Demo butonunu ara
    const demoButtons = await page.$$('button');
    console.log('🔘 Bulunan buton sayısı:', demoButtons.length);
    
    for (let i = 0; i < demoButtons.length; i++) {
      const text = await demoButtons[i].textContent();
      console.log(`Buton ${i}: "${text}"`);
    }
    
    // data-testid ile ara
    const demoButton = await page.$('[data-testid="demo-button"]');
    console.log('🎯 data-testid="demo-button" bulundu mu?', !!demoButton);
    
    // text ile ara
    const demoButtonText = await page.$('button:has-text("Demo")');
    console.log('🎯 "Demo" texti bulundu mu?', !!demoButtonText);
    
    // Screenshot al
    await page.screenshot({ path: 'debug-demo.png' });
    console.log('📸 Screenshot alındı: debug-demo.png');
    
  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await browser.close();
  }
}

debugDemo();
