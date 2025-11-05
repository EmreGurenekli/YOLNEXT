const { chromium } = require('playwright');

async function testPageStructure() {
  console.log('🔍 Sayfa yapısı kontrol ediliyor...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 2000
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Ana sayfa
    console.log('📱 Ana sayfa yükleniyor...');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    // Sayfa başlığı
    const title = await page.title();
    console.log(`✅ Sayfa başlığı: ${title}`);
    
    // Tüm butonları listele
    const buttons = await page.locator('button').all();
    console.log(`🎯 Toplam buton sayısı: ${buttons.length}`);
    
    for (let i = 0; i < Math.min(buttons.length, 10); i++) {
      const text = await buttons[i].textContent();
      console.log(`  ${i + 1}. "${text}"`);
    }
    
    // Bireysel butonuna tıkla
    console.log('\n👤 Bireysel butonuna tıklanıyor...');
    await page.click('text=Bireysel');
    await page.waitForTimeout(3000);
    
    // Sayfa URL'sini kontrol et
    const currentUrl = page.url();
    console.log(`📍 Mevcut URL: ${currentUrl}`);
    
    // Sayfa başlığını kontrol et
    const newTitle = await page.title();
    console.log(`📄 Yeni sayfa başlığı: ${newTitle}`);
    
    // Form alanlarını ara
    const inputs = await page.locator('input').all();
    console.log(`📝 Input alanları: ${inputs.length} adet`);
    
    for (let i = 0; i < inputs.length; i++) {
      const name = await inputs[i].getAttribute('name');
      const placeholder = await inputs[i].getAttribute('placeholder');
      const type = await inputs[i].getAttribute('type');
      console.log(`  ${i + 1}. name="${name}" placeholder="${placeholder}" type="${type}"`);
    }
    
    // Textarea alanlarını ara
    const textareas = await page.locator('textarea').all();
    console.log(`📝 Textarea alanları: ${textareas.length} adet`);
    
    for (let i = 0; i < textareas.length; i++) {
      const name = await textareas[i].getAttribute('name');
      const placeholder = await textareas[i].getAttribute('placeholder');
      console.log(`  ${i + 1}. name="${name}" placeholder="${placeholder}"`);
    }
    
    // Select alanlarını ara
    const selects = await page.locator('select').all();
    console.log(`📝 Select alanları: ${selects.length} adet`);
    
    // Sayfa içeriğini kontrol et
    const bodyText = await page.textContent('body');
    console.log(`📄 Sayfa içeriği uzunluğu: ${bodyText.length} karakter`);
    
    // H1 başlıklarını kontrol et
    const h1s = await page.locator('h1').all();
    console.log(`📝 H1 başlıkları: ${h1s.length} adet`);
    
    for (let i = 0; i < h1s.length; i++) {
      const text = await h1s[i].textContent();
      console.log(`  ${i + 1}. "${text}"`);
    }
    
    // H2 başlıklarını kontrol et
    const h2s = await page.locator('h2').all();
    console.log(`📝 H2 başlıkları: ${h2s.length} adet`);
    
    for (let i = 0; i < Math.min(h2s.length, 5); i++) {
      const text = await h2s[i].textContent();
      console.log(`  ${i + 1}. "${text}"`);
    }
    
    console.log('\n✅ Sayfa yapısı kontrolü tamamlandı!');
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    await browser.close();
  }
}

testPageStructure().catch(console.error);



