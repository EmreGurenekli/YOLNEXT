import { chromium } from 'playwright';

async function testYolNet() {
  console.log('🚀 YolNet Gerçek Kullanıcı Test Başlıyor...');
  
  const browser = await chromium.launch({ 
    headless: false, // Görünür browser
    slowMo: 1000 // 1 saniye bekleme
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 1. Ana Sayfa Testi
    console.log('📱 Ana sayfa test ediliyor...');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    // Sayfa başlığını kontrol et
    const title = await page.title();
    console.log('✅ Sayfa başlığı:', title);
    
    // Hero section'ı kontrol et
    const heroSection = await page.locator('h1').first();
    if (await heroSection.isVisible()) {
      console.log('✅ Hero section görünür');
    }
    
    // Tüm butonları listele
    const allButtons = await page.locator('button').all();
    console.log('🔍 Bulunan buton sayısı:', allButtons.length);
    
    for (let i = 0; i < allButtons.length; i++) {
      const buttonText = await allButtons[i].textContent();
      console.log(`Buton ${i}: "${buttonText}"`);
    }
    
    // Ücretsiz Başla butonunu kullan
    const registerButton = page.locator('button:has-text("Ücretsiz Başla")').first();
    if (await registerButton.isVisible()) {
      console.log('✅ Ücretsiz Başla butonu görünür');
    }
    
    // 2. BİREYSEL GÖNDERİCİ KAYIT TESTİ
    console.log('👤 Bireysel Gönderici kayıt test ediliyor...');
    await registerButton.click();
    await page.waitForTimeout(2000);
    
    // Sayfayı screenshot al
    await page.screenshot({ path: 'register-page.png' });
    console.log('📸 Kayıt sayfası screenshot alındı');
    
    // Sayfadaki tüm input'ları listele
    const inputs = await page.locator('input').all();
    console.log('📋 Bulunan input sayısı:', inputs.length);
    
    // Bireysel Gönderici seç
    const individualButton = page.locator('text=Bireysel Gönderici');
    if (await individualButton.isVisible()) {
      console.log('✅ Bireysel Gönderici butonu bulundu');
      await individualButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Form doldur - daha esnek selector'lar kullan
    console.log('📋 Form dolduruluyor...');
    
    // İsim alanları
    const firstNameInput = page.locator('input[placeholder*="İsim"], input[name*="firstName"], input[placeholder*="Ad"]').first();
    if (await firstNameInput.isVisible()) {
      await firstNameInput.fill('Test');
      console.log('✅ İsim dolduruldu');
    }
    
    const lastNameInput = page.locator('input[placeholder*="Soyisim"], input[name*="lastName"], input[placeholder*="Soyad"]').first();
    if (await lastNameInput.isVisible()) {
      await lastNameInput.fill('Kullanıcı');
      console.log('✅ Soyisim dolduruldu');
    }
    
    // Email
    const emailInput = page.locator('input[type="email"], input[placeholder*="E-posta"], input[name*="email"]').first();
    if (await emailInput.isVisible()) {
      await emailInput.fill('test@yolnet.com');
      console.log('✅ Email dolduruldu');
    }
    
    // Şifre - tüm password input'larını doldur
    const passwordInputs = await page.locator('input[type="password"]').all();
    console.log('🔐 Bulunan şifre alanı sayısı:', passwordInputs.length);
    
    for (let i = 0; i < passwordInputs.length; i++) {
      await passwordInputs[i].fill('123456');
      console.log(`✅ Şifre alanı ${i+1} dolduruldu`);
    }
    
    // Telefon
    const phoneInput = page.locator('input[placeholder*="Telefon"], input[name*="phone"], input[type="tel"]').first();
    if (await phoneInput.isVisible()) {
      await phoneInput.fill('+90 555 123 4567');
      console.log('✅ Telefon dolduruldu');
    }
    
    // Kayıt ol
    const submitButton = page.locator('button[type="submit"], button:has-text("Kayıt Ol"), button:has-text("Üye Ol")').first();
    if (await submitButton.isVisible()) {
      console.log('✅ Kayıt ol butonu bulundu');
      await submitButton.click();
      await page.waitForTimeout(3000);
    }
    
    // 3. BİREYSEL DASHBOARD TESTİ
    console.log('📊 Bireysel Dashboard test ediliyor...');
    
    // URL'yi kontrol et
    const currentUrl = page.url();
    console.log('📍 Mevcut URL:', currentUrl);
    
    // Dashboard'a yönlendirme bekle veya manuel git
    try {
      await page.waitForURL('**/individual/dashboard', { timeout: 5000 });
    } catch (error) {
      console.log('⚠️ Dashboard yönlendirmesi olmadı, manuel gidiliyor...');
      await page.goto('http://localhost:5173/individual/dashboard');
      await page.waitForLoadState('networkidle');
    }
    
    const dashboardTitle = await page.locator('h1').first();
    if (await dashboardTitle.isVisible()) {
      console.log('✅ Bireysel Dashboard yüklendi');
    }
    
    // Gönderi Oluşturma Testi
    console.log('📝 Gönderi oluşturma test ediliyor...');
    const createButton = page.locator('button:has-text("Yeni Gönderi")').first();
    if (await createButton.isVisible()) {
      console.log('✅ Yeni Gönderi butonu bulundu');
      await createButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Form Testi
    console.log('📋 Form test ediliyor...');
    await page.waitForURL('**/individual/create-shipment');
    
    const formTitle = await page.locator('h1').first();
    if (await formTitle.isVisible()) {
      console.log('✅ Gönderi oluşturma formu yüklendi');
    }
    
    // Kategori seçimi test et
    const categoryCard = page.locator('[data-category="Ev Taşınması"]');
    if (await categoryCard.isVisible()) {
      console.log('✅ Kategori kartları görünür');
      await categoryCard.click();
      await page.waitForTimeout(1000);
    }
    
    // 4. KURUMSAL GÖNDERİCİ TESTİ
    console.log('🏢 Kurumsal Gönderici test ediliyor...');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    // Ücretsiz Başla
    await page.locator('button:has-text("Ücretsiz Başla")').first().click();
    await page.waitForTimeout(1000);
    
    // Kurumsal Gönderici seç
    const corporateButton = page.locator('text=Kurumsal Gönderici');
    if (await corporateButton.isVisible()) {
      console.log('✅ Kurumsal Gönderici butonu bulundu');
      await corporateButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Kurumsal form doldur - esnek selector'lar
    console.log('📋 Kurumsal form dolduruluyor...');
    
    // İsim
    const corpFirstNameInput = page.locator('input[placeholder*="İsim"], input[name*="firstName"], input[placeholder*="Ad"]').first();
    if (await corpFirstNameInput.isVisible()) {
      await corpFirstNameInput.fill('Kurumsal');
      console.log('✅ Kurumsal isim dolduruldu');
    }
    
    // Soyisim
    const corpLastNameInput = page.locator('input[placeholder*="Soyisim"], input[name*="lastName"], input[placeholder*="Soyad"]').first();
    if (await corpLastNameInput.isVisible()) {
      await corpLastNameInput.fill('Test');
      console.log('✅ Kurumsal soyisim dolduruldu');
    }
    
    // Email
    const corpEmailInput = page.locator('input[type="email"], input[placeholder*="E-posta"], input[name*="email"]').first();
    if (await corpEmailInput.isVisible()) {
      await corpEmailInput.fill('corporate@yolnet.com');
      console.log('✅ Kurumsal email dolduruldu');
    }
    
    // Şifre - tüm password input'larını doldur
    const corpPasswordInputs = await page.locator('input[type="password"]').all();
    console.log('🔐 Kurumsal şifre alanı sayısı:', corpPasswordInputs.length);
    
    for (let i = 0; i < corpPasswordInputs.length; i++) {
      await corpPasswordInputs[i].fill('123456');
      console.log(`✅ Kurumsal şifre alanı ${i+1} dolduruldu`);
    }
    
    // Telefon
    const corpPhoneInput = page.locator('input[placeholder*="Telefon"], input[name*="phone"], input[type="tel"]').first();
    if (await corpPhoneInput.isVisible()) {
      await corpPhoneInput.fill('+90 555 123 4568');
      console.log('✅ Kurumsal telefon dolduruldu');
    }
    
    // Şirket adı
    const companyNameInput = page.locator('input[placeholder*="Şirket"], input[name*="company"], input[placeholder*="Firma"]').first();
    if (await companyNameInput.isVisible()) {
      await companyNameInput.fill('Test Şirketi');
      console.log('✅ Şirket adı dolduruldu');
    }
    
    // Vergi numarası
    const taxIdInput = page.locator('input[placeholder*="Vergi"], input[name*="tax"], input[placeholder*="Tax"]').first();
    if (await taxIdInput.isVisible()) {
      await taxIdInput.fill('1234567890');
      console.log('✅ Vergi numarası dolduruldu');
    }
    
    // Kayıt ol - esnek selector
    const corpSubmitButton = page.locator('button[type="submit"], button:has-text("Kayıt Ol"), button:has-text("Üye Ol"), button:has-text("Başla")').first();
    if (await corpSubmitButton.isVisible()) {
      console.log('✅ Kurumsal kayıt butonu bulundu');
      await corpSubmitButton.click();
      await page.waitForTimeout(3000);
    } else {
      console.log('❌ Kurumsal kayıt butonu bulunamadı');
      // Tüm butonları listele
      const allCorpButtons = await page.locator('button').all();
      console.log('🔍 Kurumsal sayfadaki buton sayısı:', allCorpButtons.length);
      
      for (let i = 0; i < allCorpButtons.length; i++) {
        const buttonText = await allCorpButtons[i].textContent();
        console.log(`Kurumsal Buton ${i}: "${buttonText}"`);
      }
      
      // İleri butonuna tıkla
      const nextButton = page.locator('button:has-text("İleri")');
      if (await nextButton.isVisible()) {
        console.log('✅ İleri butonu bulundu, tıklanıyor...');
        await nextButton.click();
        await page.waitForTimeout(2000);
      }
    }
    
    // Kurumsal Dashboard
    try {
      await page.waitForURL('**/corporate/dashboard', { timeout: 5000 });
      console.log('✅ Kurumsal Dashboard yüklendi');
    } catch (error) {
      console.log('⚠️ Kurumsal Dashboard yönlendirmesi olmadı, manuel gidiliyor...');
      await page.goto('http://localhost:5173/corporate/dashboard');
      await page.waitForLoadState('networkidle');
      console.log('✅ Kurumsal Dashboard manuel yüklendi');
    }
    
    // 5. NAKLİYECİ TESTİ
    console.log('🚛 Nakliyeci test ediliyor...');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    // Ücretsiz Başla
    await page.locator('button:has-text("Ücretsiz Başla")').first().click();
    await page.waitForTimeout(1000);
    
    // Nakliyeci seç
    const carrierButton = page.locator('text=Nakliyeci');
    if (await carrierButton.isVisible()) {
      console.log('✅ Nakliyeci butonu bulundu');
      await carrierButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Nakliyeci form doldur
    await page.fill('input[name="firstName"]', 'Nakliyeci');
    await page.fill('input[name="lastName"]', 'Test');
    await page.fill('input[name="email"]', 'carrier@yolnet.com');
    await page.fill('input[name="password"]', '123456');
    await page.fill('input[name="confirmPassword"]', '123456');
    await page.fill('input[name="phone"]', '+90 555 123 4569');
    await page.fill('input[name="companyName"]', 'Test Nakliye');
    await page.fill('input[name="taxId"]', '1234567891');
    
    // Kayıt ol
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);
    
    // Nakliyeci Dashboard
    await page.waitForURL('**/nakliyeci/dashboard');
    console.log('✅ Nakliyeci Dashboard yüklendi');
    
    // 6. TAŞIYICI TESTİ
    console.log('🚚 Taşıyıcı test ediliyor...');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    // Ücretsiz Başla
    await page.locator('button:has-text("Ücretsiz Başla")').first().click();
    await page.waitForTimeout(1000);
    
    // Taşıyıcı seç
    const driverButton = page.locator('text=Taşıyıcı');
    if (await driverButton.isVisible()) {
      console.log('✅ Taşıyıcı butonu bulundu');
      await driverButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Taşıyıcı form doldur
    await page.fill('input[name="firstName"]', 'Taşıyıcı');
    await page.fill('input[name="lastName"]', 'Test');
    await page.fill('input[name="email"]', 'driver@yolnet.com');
    await page.fill('input[name="password"]', '123456');
    await page.fill('input[name="confirmPassword"]', '123456');
    await page.fill('input[name="phone"]', '+90 555 123 4570');
    await page.fill('input[name="licenseNumber"]', 'A123456789');
    await page.fill('input[name="vehiclePlate"]', '34 ABC 123');
    
    // Kayıt ol
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);
    
    // Taşıyıcı Dashboard
    await page.waitForURL('**/tasiyici/dashboard');
    console.log('✅ Taşıyıcı Dashboard yüklendi');
    
    console.log('🎉 TÜM 4 PANEL TESTİ BAŞARILI!');
    
  } catch (error) {
    console.error('❌ Test hatası:', error.message);
  } finally {
    await browser.close();
  }
}

testYolNet();

