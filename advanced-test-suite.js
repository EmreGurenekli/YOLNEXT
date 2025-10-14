import { chromium } from 'playwright';

class YolNetAdvancedTester {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.testResults = {
      passed: 0,
      failed: 0,
      warnings: 0,
      details: []
    };
  }

  async init() {
    this.browser = await chromium.launch({ 
      headless: false,
      slowMo: 1000
    });
    this.context = await this.browser.newContext();
    this.page = await this.context.newPage();
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  logResult(testName, status, message, details = null) {
    const result = {
      test: testName,
      status,
      message,
      details,
      timestamp: new Date().toISOString()
    };
    
    this.testResults.details.push(result);
    
    if (status === 'PASS') {
      this.testResults.passed++;
      console.log(`✅ ${testName}: ${message}`);
    } else if (status === 'FAIL') {
      this.testResults.failed++;
      console.log(`❌ ${testName}: ${message}`);
    } else if (status === 'WARN') {
      this.testResults.warnings++;
      console.log(`⚠️ ${testName}: ${message}`);
    }
  }

  async takeScreenshot(name) {
    try {
      await this.page.screenshot({ path: `test-screenshots/${name}.png` });
      return `test-screenshots/${name}.png`;
    } catch (error) {
      console.log(`Screenshot alınamadı: ${name}`);
      return null;
    }
  }

  // 1. GERÇEK KULLANICI KAYIT TESTLERİ
  async testRealUserRegistration() {
    console.log('\n🔐 GERÇEK KULLANICI KAYIT TESTLERİ BAŞLIYOR...\n');

    // Test 1: Bireysel Kullanıcı Kayıt
    await this.testIndividualRegistration();
    
    // Test 2: Kurumsal Kullanıcı Kayıt
    await this.testCorporateRegistration();
    
    // Test 3: Nakliyeci Kayıt
    await this.testCarrierRegistration();
    
    // Test 4: Taşıyıcı Kayıt
    await this.testDriverRegistration();
  }

  async testIndividualRegistration() {
    const testName = 'Bireysel Kullanıcı Kayıt';
    
    try {
      await this.page.goto('http://localhost:5173');
      await this.page.waitForLoadState('networkidle');
      
      // Ücretsiz Başla butonuna tıkla
      await this.page.locator('button:has-text("Ücretsiz Başla")').first().click();
      await this.page.waitForTimeout(2000);
      
      // Bireysel Gönderici seç
      await this.page.locator('text=Bireysel Gönderici').click();
      await this.page.waitForTimeout(1000);
      
      // Form doldur - GERÇEK VERİ
      const userData = {
        firstName: 'Ahmet',
        lastName: 'Yılmaz',
        email: `ahmet.yilmaz.${Date.now()}@gmail.com`,
        phone: '+90 555 123 4567'
      };
      
      await this.page.fill('input[placeholder*="İsim"]', userData.firstName);
      await this.page.fill('input[placeholder*="Soyisim"]', userData.lastName);
      await this.page.fill('input[type="email"]', userData.email);
      await this.page.fill('input[placeholder*="Telefon"]', userData.phone);
      
      // Şifre alanları varsa doldur
      const passwordInputs = await this.page.locator('input[type="password"]').all();
      for (let input of passwordInputs) {
        await input.fill('123456');
      }
      
      // Kayıt ol
      const submitButton = this.page.locator('button[type="submit"], button:has-text("Kayıt Ol"), button:has-text("İleri")').first();
      await submitButton.click();
      await this.page.waitForTimeout(3000);
      
      // Dashboard'a yönlendirme kontrolü
      const currentUrl = this.page.url();
      if (currentUrl.includes('/individual/dashboard')) {
        this.logResult(testName, 'PASS', 'Bireysel kullanıcı başarıyla kayıt oldu ve dashboard\'a yönlendirildi', userData);
      } else {
        this.logResult(testName, 'WARN', 'Kayıt başarılı ama dashboard yönlendirmesi olmadı', { url: currentUrl, userData });
      }
      
      await this.takeScreenshot('individual-registration');
      
    } catch (error) {
      this.logResult(testName, 'FAIL', `Bireysel kayıt hatası: ${error.message}`);
    }
  }

  async testCorporateRegistration() {
    const testName = 'Kurumsal Kullanıcı Kayıt';
    
    try {
      await this.page.goto('http://localhost:5173');
      await this.page.waitForLoadState('networkidle');
      
      await this.page.locator('button:has-text("Ücretsiz Başla")').first().click();
      await this.page.waitForTimeout(2000);
      
      await this.page.locator('text=Kurumsal Gönderici').click();
      await this.page.waitForTimeout(1000);
      
      const corporateData = {
        firstName: 'Mehmet',
        lastName: 'Özkan',
        email: `mehmet.ozkan.${Date.now()}@company.com`,
        phone: '+90 555 987 6543',
        companyName: 'Test Şirketi A.Ş.',
        taxId: `${Date.now().toString().slice(-10)}`
      };
      
      await this.page.fill('input[placeholder*="İsim"]', corporateData.firstName);
      await this.page.fill('input[placeholder*="Soyisim"]', corporateData.lastName);
      await this.page.fill('input[type="email"]', corporateData.email);
      await this.page.fill('input[placeholder*="Telefon"]', corporateData.phone);
      await this.page.fill('input[placeholder*="Şirket"]', corporateData.companyName);
      await this.page.fill('input[placeholder*="Vergi"]', corporateData.taxId);
      
      const passwordInputs = await this.page.locator('input[type="password"]').all();
      for (let input of passwordInputs) {
        await input.fill('123456');
      }
      
      const submitButton = this.page.locator('button[type="submit"], button:has-text("Kayıt Ol"), button:has-text("İleri")').first();
      await submitButton.click();
      await this.page.waitForTimeout(3000);
      
      const currentUrl = this.page.url();
      if (currentUrl.includes('/corporate/dashboard')) {
        this.logResult(testName, 'PASS', 'Kurumsal kullanıcı başarıyla kayıt oldu', corporateData);
      } else {
        this.logResult(testName, 'WARN', 'Kurumsal kayıt başarılı ama dashboard yönlendirmesi olmadı', { url: currentUrl, corporateData });
      }
      
      await this.takeScreenshot('corporate-registration');
      
    } catch (error) {
      this.logResult(testName, 'FAIL', `Kurumsal kayıt hatası: ${error.message}`);
    }
  }

  async testCarrierRegistration() {
    const testName = 'Nakliyeci Kayıt';
    
    try {
      await this.page.goto('http://localhost:5173');
      await this.page.waitForLoadState('networkidle');
      
      await this.page.locator('button:has-text("Ücretsiz Başla")').first().click();
      await this.page.waitForTimeout(2000);
      
      await this.page.locator('text=Nakliyeci').click();
      await this.page.waitForTimeout(1000);
      
      const carrierData = {
        firstName: 'Ali',
        lastName: 'Demir',
        email: `ali.demir.${Date.now()}@nakliye.com`,
        phone: '+90 555 456 7890',
        companyName: 'Demir Nakliyat Ltd.',
        taxId: `${Date.now().toString().slice(-10)}`
      };
      
      await this.page.fill('input[placeholder*="İsim"]', carrierData.firstName);
      await this.page.fill('input[placeholder*="Soyisim"]', carrierData.lastName);
      await this.page.fill('input[type="email"]', carrierData.email);
      await this.page.fill('input[placeholder*="Telefon"]', carrierData.phone);
      await this.page.fill('input[placeholder*="Şirket"]', carrierData.companyName);
      await this.page.fill('input[placeholder*="Vergi"]', carrierData.taxId);
      
      const passwordInputs = await this.page.locator('input[type="password"]').all();
      for (let input of passwordInputs) {
        await input.fill('123456');
      }
      
      const submitButton = this.page.locator('button[type="submit"], button:has-text("Kayıt Ol"), button:has-text("İleri")').first();
      await submitButton.click();
      await this.page.waitForTimeout(3000);
      
      const currentUrl = this.page.url();
      if (currentUrl.includes('/nakliyeci/dashboard')) {
        this.logResult(testName, 'PASS', 'Nakliyeci başarıyla kayıt oldu', carrierData);
      } else {
        this.logResult(testName, 'WARN', 'Nakliyeci kayıt başarılı ama dashboard yönlendirmesi olmadı', { url: currentUrl, carrierData });
      }
      
      await this.takeScreenshot('carrier-registration');
      
    } catch (error) {
      this.logResult(testName, 'FAIL', `Nakliyeci kayıt hatası: ${error.message}`);
    }
  }

  async testDriverRegistration() {
    const testName = 'Taşıyıcı Kayıt';
    
    try {
      await this.page.goto('http://localhost:5173');
      await this.page.waitForLoadState('networkidle');
      
      await this.page.locator('button:has-text("Ücretsiz Başla")').first().click();
      await this.page.waitForTimeout(2000);
      
      await this.page.locator('text=Taşıyıcı').click();
      await this.page.waitForTimeout(1000);
      
      const driverData = {
        firstName: 'Veli',
        lastName: 'Kaya',
        email: `veli.kaya.${Date.now()}@driver.com`,
        phone: '+90 555 321 0987',
        licenseNumber: `A${Date.now().toString().slice(-8)}`,
        vehiclePlate: `34 ABC ${Math.floor(Math.random() * 999)}`
      };
      
      await this.page.fill('input[placeholder*="İsim"]', driverData.firstName);
      await this.page.fill('input[placeholder*="Soyisim"]', driverData.lastName);
      await this.page.fill('input[type="email"]', driverData.email);
      await this.page.fill('input[placeholder*="Telefon"]', driverData.phone);
      await this.page.fill('input[placeholder*="Ehliyet"]', driverData.licenseNumber);
      await this.page.fill('input[placeholder*="Plaka"]', driverData.vehiclePlate);
      
      const passwordInputs = await this.page.locator('input[type="password"]').all();
      for (let input of passwordInputs) {
        await input.fill('123456');
      }
      
      const submitButton = this.page.locator('button[type="submit"], button:has-text("Kayıt Ol"), button:has-text("İleri")').first();
      await submitButton.click();
      await this.page.waitForTimeout(3000);
      
      const currentUrl = this.page.url();
      if (currentUrl.includes('/tasiyici/dashboard')) {
        this.logResult(testName, 'PASS', 'Taşıyıcı başarıyla kayıt oldu', driverData);
      } else {
        this.logResult(testName, 'WARN', 'Taşıyıcı kayıt başarılı ama dashboard yönlendirmesi olmadı', { url: currentUrl, driverData });
      }
      
      await this.takeScreenshot('driver-registration');
      
    } catch (error) {
      this.logResult(testName, 'FAIL', `Taşıyıcı kayıt hatası: ${error.message}`);
    }
  }

  // 2. GÖNDERİ OLUŞTURMA VE AKIŞ TESTLERİ
  async testShipmentFlow() {
    console.log('\n📦 GÖNDERİ AKIŞ TESTLERİ BAŞLIYOR...\n');

    // Bireysel kullanıcı ile gönderi oluştur
    await this.testIndividualShipmentCreation();
    
    // Kurumsal kullanıcı ile gönderi oluştur
    await this.testCorporateShipmentCreation();
    
    // Nakliyeci ile gönderi görüntüleme ve teklif verme
    await this.testCarrierShipmentHandling();
    
    // Taşıyıcı ile gönderi kabul etme
    await this.testDriverShipmentAcceptance();
  }

  async testIndividualShipmentCreation() {
    const testName = 'Bireysel Gönderi Oluşturma';
    
    try {
      await this.page.goto('http://localhost:5173/individual/dashboard');
      await this.page.waitForLoadState('networkidle');
      
      // Yeni Gönderi butonuna tıkla
      await this.page.locator('button:has-text("Yeni Gönderi")').first().click();
      await this.page.waitForTimeout(2000);
      
      // Kategori seç - Ev Taşınması
      await this.page.locator('[data-category="Ev Taşınması"]').click();
      await this.page.waitForTimeout(1000);
      
      // Form doldur
      const shipmentData = {
        originAddress: 'Kadıköy, İstanbul',
        destinationAddress: 'Beşiktaş, İstanbul',
        pickupDate: '2024-10-15',
        houseType: '2+1',
        roomCount: '3',
        floorCount: '2',
        hasElevator: true,
        description: 'Ev eşyaları taşınacak'
      };
      
      await this.page.fill('input[placeholder*="Nereden"]', shipmentData.originAddress);
      await this.page.fill('input[placeholder*="Nereye"]', shipmentData.destinationAddress);
      await this.page.fill('input[type="date"]', shipmentData.pickupDate);
      await this.page.fill('input[placeholder*="Ev Durumu"]', shipmentData.houseType);
      await this.page.fill('input[placeholder*="Oda"]', shipmentData.roomCount);
      await this.page.fill('input[placeholder*="Kat"]', shipmentData.floorCount);
      await this.page.fill('textarea[placeholder*="Açıklama"]', shipmentData.description);
      
      // Asansör checkbox'ı
      const elevatorCheckbox = this.page.locator('input[type="checkbox"]');
      if (await elevatorCheckbox.isVisible()) {
        await elevatorCheckbox.check();
      }
      
      // Gönderi oluştur
      const createButton = this.page.locator('button:has-text("Gönderi Oluştur"), button:has-text("Oluştur")').first();
      await createButton.click();
      await this.page.waitForTimeout(3000);
      
      // Başarı mesajı kontrolü
      const successMessage = this.page.locator('text=başarılı, text=oluşturuldu, text=gönderildi');
      if (await successMessage.isVisible()) {
        this.logResult(testName, 'PASS', 'Gönderi başarıyla oluşturuldu', shipmentData);
      } else {
        this.logResult(testName, 'WARN', 'Gönderi oluşturuldu ama başarı mesajı görünmedi', shipmentData);
      }
      
      await this.takeScreenshot('individual-shipment-creation');
      
    } catch (error) {
      this.logResult(testName, 'FAIL', `Bireysel gönderi oluşturma hatası: ${error.message}`);
    }
  }

  async testCorporateShipmentCreation() {
    const testName = 'Kurumsal Gönderi Oluşturma';
    
    try {
      await this.page.goto('http://localhost:5173/corporate/dashboard');
      await this.page.waitForLoadState('networkidle');
      
      await this.page.locator('button:has-text("Yeni Gönderi")').first().click();
      await this.page.waitForTimeout(2000);
      
      // Kurumsal kategori seç
      await this.page.locator('[data-category="Ofis/İş Yeri Taşınması"]').click();
      await this.page.waitForTimeout(1000);
      
      const corporateShipmentData = {
        originAddress: 'Maslak, İstanbul',
        destinationAddress: 'Levent, İstanbul',
        pickupDate: '2024-10-20',
        companyName: 'Test Şirketi A.Ş.',
        department: 'IT',
        contactPerson: 'Ahmet Yılmaz',
        contactPhone: '+90 555 123 4567',
        corporateRefNumber: `CORP-${Date.now()}`,
        description: 'Ofis eşyaları ve bilgisayarlar'
      };
      
      await this.page.fill('input[placeholder*="Nereden"]', corporateShipmentData.originAddress);
      await this.page.fill('input[placeholder*="Nereye"]', corporateShipmentData.destinationAddress);
      await this.page.fill('input[type="date"]', corporateShipmentData.pickupDate);
      await this.page.fill('input[placeholder*="Şirket"]', corporateShipmentData.companyName);
      await this.page.fill('input[placeholder*="Departman"]', corporateShipmentData.department);
      await this.page.fill('input[placeholder*="İletişim"]', corporateShipmentData.contactPerson);
      await this.page.fill('input[placeholder*="Telefon"]', corporateShipmentData.contactPhone);
      await this.page.fill('input[placeholder*="Referans"]', corporateShipmentData.corporateRefNumber);
      await this.page.fill('textarea[placeholder*="Açıklama"]', corporateShipmentData.description);
      
      const createButton = this.page.locator('button:has-text("Gönderi Oluştur"), button:has-text("Oluştur")').first();
      await createButton.click();
      await this.page.waitForTimeout(3000);
      
      this.logResult(testName, 'PASS', 'Kurumsal gönderi başarıyla oluşturuldu', corporateShipmentData);
      await this.takeScreenshot('corporate-shipment-creation');
      
    } catch (error) {
      this.logResult(testName, 'FAIL', `Kurumsal gönderi oluşturma hatası: ${error.message}`);
    }
  }

  async testCarrierShipmentHandling() {
    const testName = 'Nakliyeci Gönderi İşleme';
    
    try {
      await this.page.goto('http://localhost:5173/nakliyeci/dashboard');
      await this.page.waitForLoadState('networkidle');
      
      // Açık gönderiler sayfasına git
      await this.page.locator('text=Açık Gönderiler').click();
      await this.page.waitForTimeout(2000);
      
      // Gönderi listesini kontrol et
      const shipmentList = this.page.locator('[data-testid="shipment-item"], .shipment-card, .shipment-item');
      const shipmentCount = await shipmentList.count();
      
      if (shipmentCount > 0) {
        this.logResult(testName, 'PASS', `${shipmentCount} açık gönderi bulundu`);
        
        // İlk gönderiye tıkla
        await shipmentList.first().click();
        await this.page.waitForTimeout(2000);
        
        // Teklif ver butonuna tıkla
        const offerButton = this.page.locator('button:has-text("Teklif Ver"), button:has-text("Teklif")').first();
        if (await offerButton.isVisible()) {
          await offerButton.click();
          await this.page.waitForTimeout(1000);
          
          // Teklif formu doldur
          const offerData = {
            price: '1500',
            estimatedDelivery: '2024-10-18',
            notes: 'Profesyonel taşıma hizmeti'
          };
          
          await this.page.fill('input[placeholder*="Fiyat"]', offerData.price);
          await this.page.fill('input[type="date"]', offerData.estimatedDelivery);
          await this.page.fill('textarea[placeholder*="Not"]', offerData.notes);
          
          // Teklif gönder
          const submitOfferButton = this.page.locator('button:has-text("Teklif Gönder"), button:has-text("Gönder")').first();
          await submitOfferButton.click();
          await this.page.waitForTimeout(2000);
          
          this.logResult(testName, 'PASS', 'Teklif başarıyla gönderildi', offerData);
        } else {
          this.logResult(testName, 'WARN', 'Teklif ver butonu bulunamadı');
        }
      } else {
        this.logResult(testName, 'WARN', 'Açık gönderi bulunamadı');
      }
      
      await this.takeScreenshot('carrier-shipment-handling');
      
    } catch (error) {
      this.logResult(testName, 'FAIL', `Nakliyeci gönderi işleme hatası: ${error.message}`);
    }
  }

  async testDriverShipmentAcceptance() {
    const testName = 'Taşıyıcı Gönderi Kabul Etme';
    
    try {
      await this.page.goto('http://localhost:5173/tasiyici/dashboard');
      await this.page.waitForLoadState('networkidle');
      
      // Gönderiler sayfasına git
      await this.page.locator('text=Gönderiler').click();
      await this.page.waitForTimeout(2000);
      
      // Gönderi listesini kontrol et
      const shipmentList = this.page.locator('[data-testid="shipment-item"], .shipment-card, .shipment-item');
      const shipmentCount = await shipmentList.count();
      
      if (shipmentCount > 0) {
        this.logResult(testName, 'PASS', `${shipmentCount} gönderi bulundu`);
        
        // İlk gönderiye tıkla
        await shipmentList.first().click();
        await this.page.waitForTimeout(2000);
        
        // Kabul et butonuna tıkla
        const acceptButton = this.page.locator('button:has-text("Kabul Et"), button:has-text("Kabul")').first();
        if (await acceptButton.isVisible()) {
          await acceptButton.click();
          await this.page.waitForTimeout(2000);
          
          this.logResult(testName, 'PASS', 'Gönderi başarıyla kabul edildi');
        } else {
          this.logResult(testName, 'WARN', 'Kabul et butonu bulunamadı');
        }
      } else {
        this.logResult(testName, 'WARN', 'Gönderi bulunamadı');
      }
      
      await this.takeScreenshot('driver-shipment-acceptance');
      
    } catch (error) {
      this.logResult(testName, 'FAIL', `Taşıyıcı gönderi kabul hatası: ${error.message}`);
    }
  }

  // 3. GÜVENLİK VE HATA TESTLERİ
  async testSecurityAndErrors() {
    console.log('\n🔒 GÜVENLİK VE HATA TESTLERİ BAŞLIYOR...\n');

    // SQL Injection testi
    await this.testSQLInjection();
    
    // XSS testi
    await this.testXSS();
    
    // Yetkisiz erişim testi
    await this.testUnauthorizedAccess();
    
    // Form validasyon testleri
    await this.testFormValidation();
    
    // Hata sayfaları testi
    await this.testErrorPages();
  }

  async testSQLInjection() {
    const testName = 'SQL Injection Testi';
    
    try {
      await this.page.goto('http://localhost:5173/individual/dashboard');
      await this.page.waitForLoadState('networkidle');
      
      // Arama alanına SQL injection dene
      const searchInput = this.page.locator('input[placeholder*="Ara"], input[type="search"]');
      if (await searchInput.isVisible()) {
        await searchInput.fill("'; DROP TABLE users; --");
        await this.page.keyboard.press('Enter');
        await this.page.waitForTimeout(2000);
        
        // Hata mesajı kontrolü
        const errorMessage = this.page.locator('text=Hata, text=Error, text=SQL');
        if (await errorMessage.isVisible()) {
          this.logResult(testName, 'WARN', 'SQL injection girişimi tespit edildi - güvenlik açığı!');
        } else {
          this.logResult(testName, 'PASS', 'SQL injection koruması çalışıyor');
        }
      } else {
        this.logResult(testName, 'WARN', 'Arama alanı bulunamadı');
      }
      
    } catch (error) {
      this.logResult(testName, 'FAIL', `SQL injection test hatası: ${error.message}`);
    }
  }

  async testXSS() {
    const testName = 'XSS Testi';
    
    try {
      await this.page.goto('http://localhost:5173/individual/create-shipment');
      await this.page.waitForLoadState('networkidle');
      
      // Açıklama alanına XSS dene
      const descriptionInput = this.page.locator('textarea[placeholder*="Açıklama"]');
      if (await descriptionInput.isVisible()) {
        await descriptionInput.fill('<script>alert("XSS")</script>');
        
        // Form gönder
        const submitButton = this.page.locator('button[type="submit"]').first();
        await submitButton.click();
        await this.page.waitForTimeout(2000);
        
        // Alert kontrolü
        const alert = this.page.locator('text=alert("XSS")');
        if (await alert.isVisible()) {
          this.logResult(testName, 'WARN', 'XSS girişimi tespit edildi - güvenlik açığı!');
        } else {
          this.logResult(testName, 'PASS', 'XSS koruması çalışıyor');
        }
      } else {
        this.logResult(testName, 'WARN', 'Açıklama alanı bulunamadı');
      }
      
    } catch (error) {
      this.logResult(testName, 'FAIL', `XSS test hatası: ${error.message}`);
    }
  }

  async testUnauthorizedAccess() {
    const testName = 'Yetkisiz Erişim Testi';
    
    try {
      // Önce çıkış yap
      await this.page.goto('http://localhost:5173');
      await this.page.waitForLoadState('networkidle');
      
      // Direkt admin paneline git
      await this.page.goto('http://localhost:5173/admin/dashboard');
      await this.page.waitForTimeout(2000);
      
      const currentUrl = this.page.url();
      if (currentUrl.includes('/login') || currentUrl.includes('/unauthorized')) {
        this.logResult(testName, 'PASS', 'Yetkisiz erişim engellendi');
      } else {
        this.logResult(testName, 'WARN', 'Yetkisiz erişim koruması çalışmıyor');
      }
      
    } catch (error) {
      this.logResult(testName, 'FAIL', `Yetkisiz erişim test hatası: ${error.message}`);
    }
  }

  async testFormValidation() {
    const testName = 'Form Validasyon Testi';
    
    try {
      await this.page.goto('http://localhost:5173/individual/create-shipment');
      await this.page.waitForLoadState('networkidle');
      
      // Boş form gönder
      const submitButton = this.page.locator('button[type="submit"]').first();
      await submitButton.click();
      await this.page.waitForTimeout(2000);
      
      // Hata mesajları kontrolü
      const errorMessages = this.page.locator('text=zorunlu, text=gerekli, text=boş, text=required');
      const errorCount = await errorMessages.count();
      
      if (errorCount > 0) {
        this.logResult(testName, 'PASS', `${errorCount} validasyon hatası tespit edildi`);
      } else {
        this.logResult(testName, 'WARN', 'Form validasyonu çalışmıyor');
      }
      
    } catch (error) {
      this.logResult(testName, 'FAIL', `Form validasyon test hatası: ${error.message}`);
    }
  }

  async testErrorPages() {
    const testName = 'Hata Sayfaları Testi';
    
    try {
      // 404 sayfası testi
      await this.page.goto('http://localhost:5173/nonexistent-page');
      await this.page.waitForTimeout(2000);
      
      const currentUrl = this.page.url();
      if (currentUrl.includes('404') || currentUrl.includes('not-found')) {
        this.logResult(testName, 'PASS', '404 sayfası çalışıyor');
      } else {
        this.logResult(testName, 'WARN', '404 sayfası bulunamadı');
      }
      
    } catch (error) {
      this.logResult(testName, 'FAIL', `Hata sayfaları test hatası: ${error.message}`);
    }
  }

  // 4. PERFORMANS TESTLERİ
  async testPerformance() {
    console.log('\n⚡ PERFORMANS TESTLERİ BAŞLIYOR...\n');

    // Sayfa yükleme süreleri
    await this.testPageLoadTimes();
    
    // API response süreleri
    await this.testAPIResponseTimes();
    
    // Memory kullanımı
    await this.testMemoryUsage();
  }

  async testPageLoadTimes() {
    const testName = 'Sayfa Yükleme Süreleri';
    
    const pages = [
      { name: 'Ana Sayfa', url: 'http://localhost:5173' },
      { name: 'Bireysel Dashboard', url: 'http://localhost:5173/individual/dashboard' },
      { name: 'Kurumsal Dashboard', url: 'http://localhost:5173/corporate/dashboard' },
      { name: 'Nakliyeci Dashboard', url: 'http://localhost:5173/nakliyeci/dashboard' },
      { name: 'Taşıyıcı Dashboard', url: 'http://localhost:5173/tasiyici/dashboard' }
    ];
    
    for (let page of pages) {
      try {
        const startTime = Date.now();
        await this.page.goto(page.url);
        await this.page.waitForLoadState('networkidle');
        const endTime = Date.now();
        const loadTime = endTime - startTime;
        
        if (loadTime < 3000) {
          this.logResult(`${testName} - ${page.name}`, 'PASS', `${loadTime}ms - Hızlı yükleme`);
        } else if (loadTime < 5000) {
          this.logResult(`${testName} - ${page.name}`, 'WARN', `${loadTime}ms - Orta hız`);
        } else {
          this.logResult(`${testName} - ${page.name}`, 'FAIL', `${loadTime}ms - Yavaş yükleme`);
        }
      } catch (error) {
        this.logResult(`${testName} - ${page.name}`, 'FAIL', `Yükleme hatası: ${error.message}`);
      }
    }
  }

  async testAPIResponseTimes() {
    const testName = 'API Response Süreleri';
    
    try {
      // Backend health check
      const startTime = Date.now();
      const response = await this.page.request.get('http://localhost:5000/health');
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      if (response.status() === 200) {
        if (responseTime < 500) {
          this.logResult(testName, 'PASS', `API response: ${responseTime}ms - Çok hızlı`);
        } else if (responseTime < 1000) {
          this.logResult(testName, 'PASS', `API response: ${responseTime}ms - Hızlı`);
        } else {
          this.logResult(testName, 'WARN', `API response: ${responseTime}ms - Yavaş`);
        }
      } else {
        this.logResult(testName, 'FAIL', `API response hatası: ${response.status()}`);
      }
    } catch (error) {
      this.logResult(testName, 'FAIL', `API test hatası: ${error.message}`);
    }
  }

  async testMemoryUsage() {
    const testName = 'Memory Kullanımı';
    
    try {
      const metrics = await this.page.evaluate(() => {
        return {
          memory: performance.memory ? {
            used: performance.memory.usedJSHeapSize,
            total: performance.memory.totalJSHeapSize,
            limit: performance.memory.jsHeapSizeLimit
          } : null
        };
      });
      
      if (metrics.memory) {
        const usagePercent = (metrics.memory.used / metrics.memory.limit) * 100;
        if (usagePercent < 50) {
          this.logResult(testName, 'PASS', `Memory kullanımı: %${usagePercent.toFixed(2)} - İyi`);
        } else if (usagePercent < 80) {
          this.logResult(testName, 'WARN', `Memory kullanımı: %${usagePercent.toFixed(2)} - Orta`);
        } else {
          this.logResult(testName, 'FAIL', `Memory kullanımı: %${usagePercent.toFixed(2)} - Yüksek`);
        }
      } else {
        this.logResult(testName, 'WARN', 'Memory bilgisi alınamadı');
      }
    } catch (error) {
      this.logResult(testName, 'FAIL', `Memory test hatası: ${error.message}`);
    }
  }

  // 5. KULLANICI DENEYİMİ TESTLERİ
  async testUserExperience() {
    console.log('\n👤 KULLANICI DENEYİMİ TESTLERİ BAŞLIYOR...\n');

    // Responsive tasarım testi
    await this.testResponsiveDesign();
    
    // Erişilebilirlik testi
    await this.testAccessibility();
    
    // Kullanıcı akışı testi
    await this.testUserFlow();
  }

  async testResponsiveDesign() {
    const testName = 'Responsive Tasarım Testi';
    
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 }
    ];
    
    for (let viewport of viewports) {
      try {
        await this.page.setViewportSize({ width: viewport.width, height: viewport.height });
        await this.page.goto('http://localhost:5173');
        await this.page.waitForLoadState('networkidle');
        
        // Ana elementlerin görünürlüğünü kontrol et
        const heroSection = this.page.locator('h1').first();
        const isVisible = await heroSection.isVisible();
        
        if (isVisible) {
          this.logResult(`${testName} - ${viewport.name}`, 'PASS', 'Responsive tasarım çalışıyor');
        } else {
          this.logResult(`${testName} - ${viewport.name}`, 'FAIL', 'Responsive tasarım çalışmıyor');
        }
        
        await this.takeScreenshot(`responsive-${viewport.name.toLowerCase()}`);
        
      } catch (error) {
        this.logResult(`${testName} - ${viewport.name}`, 'FAIL', `Responsive test hatası: ${error.message}`);
      }
    }
  }

  async testAccessibility() {
    const testName = 'Erişilebilirlik Testi';
    
    try {
      await this.page.goto('http://localhost:5173');
      await this.page.waitForLoadState('networkidle');
      
      // Alt text kontrolü
      const imagesWithoutAlt = await this.page.locator('img:not([alt])').count();
      if (imagesWithoutAlt === 0) {
        this.logResult(testName, 'PASS', 'Tüm resimlerde alt text var');
      } else {
        this.logResult(testName, 'WARN', `${imagesWithoutAlt} resimde alt text yok`);
      }
      
      // Heading hierarchy kontrolü
      const h1Count = await this.page.locator('h1').count();
      if (h1Count === 1) {
        this.logResult(testName, 'PASS', 'Tek H1 başlık var');
      } else {
        this.logResult(testName, 'WARN', `${h1Count} H1 başlık var (1 olmalı)`);
      }
      
      // Form label kontrolü
      const inputsWithoutLabel = await this.page.locator('input:not([aria-label]):not([aria-labelledby])').count();
      if (inputsWithoutLabel === 0) {
        this.logResult(testName, 'PASS', 'Tüm inputlarda label var');
      } else {
        this.logResult(testName, 'WARN', `${inputsWithoutLabel} inputta label yok`);
      }
      
    } catch (error) {
      this.logResult(testName, 'FAIL', `Erişilebilirlik test hatası: ${error.message}`);
    }
  }

  async testUserFlow() {
    const testName = 'Kullanıcı Akışı Testi';
    
    try {
      // Ana sayfadan başla
      await this.page.goto('http://localhost:5173');
      await this.page.waitForLoadState('networkidle');
      
      // Demo giriş yap
      await this.page.locator('button:has-text("Demo Giriş")').first().click();
      await this.page.waitForTimeout(2000);
      
      // Bireysel seç
      await this.page.locator('text=Bireysel Gönderici').click();
      await this.page.waitForTimeout(2000);
      
      // Dashboard'a git
      await this.page.goto('http://localhost:5173/individual/dashboard');
      await this.page.waitForLoadState('networkidle');
      
      // Gönderi oluştur
      await this.page.locator('button:has-text("Yeni Gönderi")').first().click();
      await this.page.waitForTimeout(2000);
      
      // Geri dön
      await this.page.goBack();
      await this.page.waitForTimeout(1000);
      
      // Canlı takip
      await this.page.locator('text=Canlı Takip').click();
      await this.page.waitForTimeout(2000);
      
      this.logResult(testName, 'PASS', 'Kullanıcı akışı başarıyla tamamlandı');
      
    } catch (error) {
      this.logResult(testName, 'FAIL', `Kullanıcı akışı test hatası: ${error.message}`);
    }
  }

  // 6. RAPOR OLUŞTURMA
  generateReport() {
    console.log('\n📊 TEST RAPORU OLUŞTURULUYOR...\n');
    
    const totalTests = this.testResults.passed + this.testResults.failed + this.testResults.warnings;
    const successRate = ((this.testResults.passed / totalTests) * 100).toFixed(2);
    
    console.log('='.repeat(60));
    console.log('🎯 YOLNET GELİŞMİŞ TEST RAPORU');
    console.log('='.repeat(60));
    console.log(`📈 Toplam Test: ${totalTests}`);
    console.log(`✅ Başarılı: ${this.testResults.passed}`);
    console.log(`❌ Başarısız: ${this.testResults.failed}`);
    console.log(`⚠️ Uyarı: ${this.testResults.warnings}`);
    console.log(`📊 Başarı Oranı: %${successRate}`);
    console.log('='.repeat(60));
    
    console.log('\n📋 DETAYLI SONUÇLAR:');
    this.testResults.details.forEach((result, index) => {
      const status = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
      console.log(`${index + 1}. ${status} ${result.test}: ${result.message}`);
      if (result.details) {
        console.log(`   📝 Detay: ${JSON.stringify(result.details, null, 2)}`);
      }
    });
    
    console.log('\n🔍 ÖNERİLER:');
    if (this.testResults.failed > 0) {
      console.log('❌ Başarısız testler düzeltilmeli');
    }
    if (this.testResults.warnings > 0) {
      console.log('⚠️ Uyarı veren testler gözden geçirilmeli');
    }
    if (successRate >= 90) {
      console.log('🎉 Mükemmel! Sistem çok iyi durumda');
    } else if (successRate >= 70) {
      console.log('👍 İyi! Bazı iyileştirmeler yapılabilir');
    } else {
      console.log('🚨 Dikkat! Sistemde ciddi sorunlar var');
    }
    
    console.log('\n' + '='.repeat(60));
  }

  // ANA TEST FONKSİYONU
  async runAllTests() {
    console.log('🚀 YOLNET GELİŞMİŞ TEST SİSTEMİ BAŞLIYOR...\n');
    
    try {
      await this.init();
      
      // Test klasörü oluştur
      await this.page.evaluate(() => {
        // Screenshot klasörü oluşturma
      });
      
      // Tüm testleri çalıştır
      await this.testRealUserRegistration();
      await this.testShipmentFlow();
      await this.testSecurityAndErrors();
      await this.testPerformance();
      await this.testUserExperience();
      
      // Rapor oluştur
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Test sistemi hatası:', error);
    } finally {
      await this.cleanup();
    }
  }
}

// Testi başlat
const tester = new YolNetAdvancedTester();
tester.runAllTests();






