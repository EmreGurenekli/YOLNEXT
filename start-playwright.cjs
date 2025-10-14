const { chromium } = require('playwright');

async function startPlaywright() {
  console.log('🚀 Playwright başlatılıyor...');
  
  try {
    const browser = await chromium.launch({ 
      headless: false,
      timeout: 30000,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
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
    console.log('✅ Sayfa başlığı:', title);
    
    // Sayfanın yüklenip yüklenmediğini kontrol et
    const body = await page.$('body');
    if (body) {
      console.log('✅ Sayfa başarıyla yüklendi!');
    } else {
      console.log('❌ Sayfa yüklenemedi');
    }
    
    // Tarayıcıyı açık bırak
    console.log('🔍 Tarayıcı açık bırakılıyor...');
    console.log('📝 Tarayıcıyı manuel olarak kapatabilirsiniz');
    
    // 30 saniye bekle
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    await browser.close();
    console.log('🔚 Tarayıcı kapatıldı');
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
  }
}

startPlaywright();


