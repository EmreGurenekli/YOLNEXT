const { chromium } = require('playwright');

async function testMCP() {
  console.log('🔍 MCP Playwright test başlatılıyor...');
  
  try {
    const browser = await chromium.launch({ 
      headless: false,
      timeout: 30000 
    });
    
    console.log('✅ Tarayıcı başlatıldı');
    
    const page = await browser.newPage();
    console.log('✅ Yeni sayfa oluşturuldu');
    
    await page.goto('http://localhost:5173', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('✅ Sayfa yüklendi:', page.url());
    
    const title = await page.title();
    console.log('📄 Sayfa başlığı:', title);
    
    // Sayfanın yüklenip yüklenmediğini kontrol et
    const body = await page.$('body');
    if (body) {
      console.log('🎉 MCP Playwright test başarılı!');
      console.log('✅ Uygulama çalışıyor');
    } else {
      console.log('❌ Sayfa yüklenemedi');
    }
    
    // 5 saniye bekle
    await page.waitForTimeout(5000);
    
    await browser.close();
    console.log('🔒 Tarayıcı kapatıldı');
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
  }
}

testMCP();


