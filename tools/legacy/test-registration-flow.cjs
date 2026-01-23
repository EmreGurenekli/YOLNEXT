const { chromium } = require('playwright');

async function testRegistrationFlow() {
  console.log('🔍 Kayıt akışı test ediliyor...\n');
  
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
    
    // Bireysel Hesap Oluştur butonuna tıkla
    console.log('👤 Bireysel Hesap Oluştur butonuna tıklanıyor...');
    await page.click('text=Bireysel Hesap Oluştur');
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
      const id = await inputs[i].getAttribute('id');
      console.log(`  ${i + 1}. name="${name}" id="${id}" placeholder="${placeholder}" type="${type}"`);
    }
    
    // Textarea alanlarını ara
    const textareas = await page.locator('textarea').all();
    console.log(`📝 Textarea alanları: ${textareas.length} adet`);
    
    // Select alanlarını ara
    const selects = await page.locator('select').all();
    console.log(`📝 Select alanları: ${selects.length} adet`);
    
    // Butonları kontrol et
    const buttons = await page.locator('button').all();
    console.log(`🎯 Buton sayısı: ${buttons.length} adet`);
    
    for (let i = 0; i < buttons.length; i++) {
      const text = await buttons[i].textContent();
      const type = await buttons[i].getAttribute('type');
      console.log(`  ${i + 1}. "${text}" type="${type}"`);
    }
    
    // Form doldurma testi
    if (inputs.length > 0) {
      console.log('\n📝 Form doldurma testi...');
      
      // İlk input'a tıkla ve yazı yaz
      await inputs[0].click();
      await inputs[0].fill('Test Kullanıcı');
      console.log('✅ İlk input dolduruldu');
      
      // Diğer input'ları doldur
      for (let i = 1; i < Math.min(inputs.length, 5); i++) {
        const type = await inputs[i].getAttribute('type');
        if (type === 'email') {
          await inputs[i].fill('test@example.com');
          console.log(`✅ Email input dolduruldu`);
        } else if (type === 'password') {
          await inputs[i].fill('Test123!');
          console.log(`✅ Password input dolduruldu`);
        } else if (type === 'tel') {
          await inputs[i].fill('05321234567');
          console.log(`✅ Phone input dolduruldu`);
        } else {
          await inputs[i].fill('Test Veri');
          console.log(`✅ Input ${i + 1} dolduruldu`);
        }
      }
    }
    
    // Kayıt ol butonunu bul ve tıkla
    const registerButton = page.locator('button:has-text("Kayıt Ol"), button:has-text("Hesap Oluştur"), button:has-text("Üye Ol")').first();
    if (await registerButton.count() > 0) {
      console.log('\n🎯 Kayıt ol butonuna tıklanıyor...');
      await registerButton.click();
      await page.waitForTimeout(3000);
      console.log('✅ Kayıt ol butonuna tıklandı');
    } else {
      console.log('❌ Kayıt ol butonu bulunamadı');
    }
    
    // Sayfa değişikliğini kontrol et
    const finalUrl = page.url();
    console.log(`📍 Final URL: ${finalUrl}`);
    
    console.log('\n✅ Kayıt akışı testi tamamlandı!');
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    await browser.close();
  }
}

testRegistrationFlow().catch(console.error);



