const { chromium } = require('playwright');

async function quickTest() {
  console.log('🚀 Hızlı test başlatılıyor...');
  
  const browser = await chromium.launch({ 
    headless: false,
    timeout: 30000 
  });
  
  const page = await browser.newPage();
  
  // Ana sayfa testi
  console.log('📄 Ana sayfa test ediliyor...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  const title = await page.title();
  console.log('✅ Ana sayfa yüklendi:', title);
  
  // Login sayfası testi
  console.log('🔐 Login sayfası test ediliyor...');
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  console.log('✅ Login sayfası yüklendi');
  
  // Dashboard testleri
  console.log('📊 Dashboard testleri...');
  await page.goto('http://localhost:5173/individual/dashboard', { waitUntil: 'networkidle' });
  console.log('✅ Individual dashboard yüklendi');
  
  await page.goto('http://localhost:5173/corporate/dashboard', { waitUntil: 'networkidle' });
  console.log('✅ Corporate dashboard yüklendi');
  
  await page.goto('http://localhost:5173/nakliyeci/dashboard', { waitUntil: 'networkidle' });
  console.log('✅ Nakliyeci dashboard yüklendi');
  
  await page.goto('http://localhost:5173/tasiyici/dashboard', { waitUntil: 'networkidle' });
  console.log('✅ Tasiyici dashboard yüklendi');
  
  console.log('🎉 Tüm testler başarılı!');
  
  await browser.close();
}

quickTest().catch(console.error);


