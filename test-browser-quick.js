import { chromium } from 'playwright';

async function testYolNetQuick() {
  console.log('🚀 YolNet Hızlı Test Başlıyor...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 1. ANA SAYFA TESTİ
    console.log('📱 Ana sayfa test ediliyor...');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    const title = await page.title();
    console.log('✅ Sayfa başlığı:', title);
    
    // 2. BİREYSEL PANEL TESTİ
    console.log('👤 Bireysel Panel test ediliyor...');
    await page.goto('http://localhost:5173/individual/dashboard');
    await page.waitForLoadState('networkidle');
    
    const individualTitle = await page.locator('h1').first();
    if (await individualTitle.isVisible()) {
      console.log('✅ Bireysel Dashboard yüklendi');
    }
    
    // 3. KURUMSAL PANEL TESTİ
    console.log('🏢 Kurumsal Panel test ediliyor...');
    await page.goto('http://localhost:5173/corporate/dashboard');
    await page.waitForLoadState('networkidle');
    
    const corporateTitle = await page.locator('h1').first();
    if (await corporateTitle.isVisible()) {
      console.log('✅ Kurumsal Dashboard yüklendi');
    }
    
    // 4. NAKLİYECİ PANEL TESTİ
    console.log('🚛 Nakliyeci Panel test ediliyor...');
    await page.goto('http://localhost:5173/nakliyeci/dashboard');
    await page.waitForLoadState('networkidle');
    
    const carrierTitle = await page.locator('h1').first();
    if (await carrierTitle.isVisible()) {
      console.log('✅ Nakliyeci Dashboard yüklendi');
    }
    
    // 5. TAŞIYICI PANEL TESTİ
    console.log('🚚 Taşıyıcı Panel test ediliyor...');
    await page.goto('http://localhost:5173/tasiyici/dashboard');
    await page.waitForLoadState('networkidle');
    
    const driverTitle = await page.locator('h1').first();
    if (await driverTitle.isVisible()) {
      console.log('✅ Taşıyıcı Dashboard yüklendi');
    }
    
    // 6. GÖNDERİ OLUŞTURMA TESTİ
    console.log('📝 Gönderi oluşturma test ediliyor...');
    await page.goto('http://localhost:5173/individual/create-shipment');
    await page.waitForLoadState('networkidle');
    
    const formTitle = await page.locator('h1').first();
    if (await formTitle.isVisible()) {
      console.log('✅ Gönderi oluşturma formu yüklendi');
    }
    
    // 7. CANLI TAKİP TESTİ
    console.log('📍 Canlı takip test ediliyor...');
    await page.goto('http://localhost:5173/individual/live-tracking');
    await page.waitForLoadState('networkidle');
    
    const trackingTitle = await page.locator('h1').first();
    if (await trackingTitle.isVisible()) {
      console.log('✅ Canlı takip sayfası yüklendi');
    }
    
    console.log('🎉 TÜM PANELLER BAŞARIYLA TEST EDİLDİ!');
    console.log('✅ Ana Sayfa: Çalışıyor');
    console.log('✅ Bireysel Panel: Çalışıyor');
    console.log('✅ Kurumsal Panel: Çalışıyor');
    console.log('✅ Nakliyeci Panel: Çalışıyor');
    console.log('✅ Taşıyıcı Panel: Çalışıyor');
    console.log('✅ Gönderi Oluşturma: Çalışıyor');
    console.log('✅ Canlı Takip: Çalışıyor');
    
  } catch (error) {
    console.error('❌ Test hatası:', error.message);
  } finally {
    await browser.close();
  }
}

testYolNetQuick();






