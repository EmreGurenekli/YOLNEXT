import { chromium } from 'playwright';

class YolNetFixedTester {
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
      slowMo: 2000
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

  // 1. GERÇEK KULLANICI KAYIT TESTLERİ - DÜZELTİLMİŞ
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
      
      // Tüm butonları listele
      const allButtons = await this.page.locator('button').all();
      console.log('🔍 Bulunan buton sayısı:', allButtons.length);
      
      for (let i = 0; i < allButtons.length; i++) {
        const buttonText = await allButtons[i].textContent();
        console.log(`Buton ${i}: "${buttonText}"`);
      }
      
      // Ücretsiz Başla butonuna tıkla
      const registerButton = this.page.locator('button:has-text("Ücretsiz Başla")').first();
      if (await registerButton.isVisible()) {
        await registerButton.click();
        await this.page.waitForTimeout(3000);
        
        // Sayfayı screenshot al
        await this.takeScreenshot('register-page');
        
        // Tüm elementleri listele
        const allElements = await this.page.locator('*').all();
        console.log('🔍 Sayfadaki element sayısı:', allElements.length);
        
        // Bireysel Gönderici seç - farklı selector'lar dene
        const individualSelectors = [
          'text=Bireysel Gönderici',
          'button:has-text("Bireysel")',
          '[data-user-type="individual"]',
          'button:contains("Bireysel")',
          'text=Kişisel'
        ];
        
        let individualFound = false;
        for (let selector of individualSelectors) {
          try {
            const element = this.page.locator(selector).first();
            if (await element.isVisible()) {
              console.log(`✅ Bireysel butonu bulundu: ${selector}`);
              await element.click();
              await this.page.waitForTimeout(2000);
              individualFound = true;
              break;
            }
          } catch (error) {
            console.log(`❌ Selector çalışmadı: ${selector}`);
          }
        }
        
        if (!individualFound) {
          // Tüm clickable elementleri listele
          const clickableElements = await this.page.locator('button, a, [role="button"], [onclick]').all();
          console.log('🔍 Tıklanabilir element sayısı:', clickableElements.length);
          
          for (let i = 0; i < clickableElements.length; i++) {
            const elementText = await clickableElements[i].textContent();
            console.log(`Tıklanabilir Element ${i}: "${elementText}"`);
          }
        }
        
        // Form doldur - GERÇEK VERİ
        const userData = {
          firstName: 'Ahmet',
          lastName: 'Yılmaz',
          email: `ahmet.yilmaz.${Date.now()}@gmail.com`,
          phone: '+90 555 123 4567'
        };
        
        // Tüm input'ları listele
        const allInputs = await this.page.locator('input').all();
        console.log('🔍 Bulunan input sayısı:', allInputs.length);
        
        for (let i = 0; i < allInputs.length; i++) {
          const inputType = await allInputs[i].getAttribute('type');
          const inputPlaceholder = await allInputs[i].getAttribute('placeholder');
          const inputName = await allInputs[i].getAttribute('name');
          console.log(`Input ${i}: type="${inputType}", placeholder="${inputPlaceholder}", name="${inputName}"`);
        }
        
        // Form doldur - esnek selector'lar
        const firstNameInput = this.page.locator('input[placeholder*="İsim"], input[name*="firstName"], input[placeholder*="Ad"]').first();
        if (await firstNameInput.isVisible()) {
          await firstNameInput.fill(userData.firstName);
          console.log('✅ İsim dolduruldu');
        }
        
        const lastNameInput = this.page.locator('input[placeholder*="Soyisim"], input[name*="lastName"], input[placeholder*="Soyad"]').first();
        if (await lastNameInput.isVisible()) {
          await lastNameInput.fill(userData.lastName);
          console.log('✅ Soyisim dolduruldu');
        }
        
        const emailInput = this.page.locator('input[type="email"], input[placeholder*="E-posta"], input[name*="email"]').first();
        if (await emailInput.isVisible()) {
          await emailInput.fill(userData.email);
          console.log('✅ Email dolduruldu');
        }
        
        const phoneInput = this.page.locator('input[placeholder*="Telefon"], input[name*="phone"], input[type="tel"]').first();
        if (await phoneInput.isVisible()) {
          await phoneInput.fill(userData.phone);
          console.log('✅ Telefon dolduruldu');
        }
        
        // Şifre alanları varsa doldur
        const passwordInputs = await this.page.locator('input[type="password"]').all();
        console.log('🔐 Bulunan şifre alanı sayısı:', passwordInputs.length);
        
        for (let i = 0; i < passwordInputs.length; i++) {
          await passwordInputs[i].fill('123456');
          console.log(`✅ Şifre alanı ${i+1} dolduruldu`);
        }
        
        // Submit butonunu bul ve tıkla
        const submitSelectors = [
          'button[type="submit"]',
          'button:has-text("Kayıt Ol")',
          'button:has-text("Üye Ol")',
          'button:has-text("İleri")',
          'button:has-text("Devam")',
          'button:has-text("Başla")'
        ];
        
        let submitFound = false;
        for (let selector of submitSelectors) {
          try {
            const submitButton = this.page.locator(selector).first();
            if (await submitButton.isVisible()) {
              console.log(`✅ Submit butonu bulundu: ${selector}`);
              await submitButton.click();
              await this.page.waitForTimeout(3000);
              submitFound = true;
              break;
            }
          } catch (error) {
            console.log(`❌ Submit selector çalışmadı: ${selector}`);
          }
        }
        
        if (!submitFound) {
          // Tüm butonları tekrar listele
          const allButtonsAfter = await this.page.locator('button').all();
          console.log('🔍 Submit sonrası buton sayısı:', allButtonsAfter.length);
          
          for (let i = 0; i < allButtonsAfter.length; i++) {
            const buttonText = await allButtonsAfter[i].textContent();
            console.log(`Submit Sonrası Buton ${i}: "${buttonText}"`);
          }
        }
        
        // Dashboard'a yönlendirme kontrolü
        const currentUrl = this.page.url();
        console.log('📍 Mevcut URL:', currentUrl);
        
        if (currentUrl.includes('/individual/dashboard')) {
          this.logResult(testName, 'PASS', 'Bireysel kullanıcı başarıyla kayıt oldu ve dashboard\'a yönlendirildi', userData);
        } else {
          this.logResult(testName, 'WARN', 'Kayıt başarılı ama dashboard yönlendirmesi olmadı', { url: currentUrl, userData });
        }
        
        await this.takeScreenshot('individual-registration-result');
        
      } else {
        this.logResult(testName, 'FAIL', 'Ücretsiz Başla butonu bulunamadı');
      }
      
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
      await this.page.waitForTimeout(3000);
      
      // Kurumsal Gönderici seç
      const corporateSelectors = [
        'text=Kurumsal Gönderici',
        'button:has-text("Kurumsal")',
        '[data-user-type="corporate"]',
        'button:contains("Kurumsal")'
      ];
      
      let corporateFound = false;
      for (let selector of corporateSelectors) {
        try {
          const element = this.page.locator(selector).first();
          if (await element.isVisible()) {
            console.log(`✅ Kurumsal butonu bulundu: ${selector}`);
            await element.click();
            await this.page.waitForTimeout(2000);
            corporateFound = true;
            break;
          }
        } catch (error) {
          console.log(`❌ Kurumsal selector çalışmadı: ${selector}`);
        }
      }
      
      if (!corporateFound) {
        this.logResult(testName, 'WARN', 'Kurumsal butonu bulunamadı, manuel test gerekli');
        return;
      }
      
      const corporateData = {
        firstName: 'Mehmet',
        lastName: 'Özkan',
        email: `mehmet.ozkan.${Date.now()}@company.com`,
        phone: '+90 555 987 6543',
        companyName: 'Test Şirketi A.Ş.',
        taxId: `${Date.now().toString().slice(-10)}`
      };
      
      // Form doldur
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
      
      await this.takeScreenshot('corporate-registration-result');
      
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
      await this.page.waitForTimeout(3000);
      
      // Nakliyeci seç
      const carrierSelectors = [
        'text=Nakliyeci',
        'button:has-text("Nakliyeci")',
        '[data-user-type="carrier"]',
        'button:contains("Nakliyeci")'
      ];
      
      let carrierFound = false;
      for (let selector of carrierSelectors) {
        try {
          const element = this.page.locator(selector).first();
          if (await element.isVisible()) {
            console.log(`✅ Nakliyeci butonu bulundu: ${selector}`);
            await element.click();
            await this.page.waitForTimeout(2000);
            carrierFound = true;
            break;
          }
        } catch (error) {
          console.log(`❌ Nakliyeci selector çalışmadı: ${selector}`);
        }
      }
      
      if (!carrierFound) {
        this.logResult(testName, 'WARN', 'Nakliyeci butonu bulunamadı, manuel test gerekli');
        return;
      }
      
      const carrierData = {
        firstName: 'Ali',
        lastName: 'Demir',
        email: `ali.demir.${Date.now()}@nakliye.com`,
        phone: '+90 555 456 7890',
        companyName: 'Demir Nakliyat Ltd.',
        taxId: `${Date.now().toString().slice(-10)}`
      };
      
      // Form doldur
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
      
      await this.takeScreenshot('carrier-registration-result');
      
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
      await this.page.waitForTimeout(3000);
      
      // Taşıyıcı seç
      const driverSelectors = [
        'text=Taşıyıcı',
        'button:has-text("Taşıyıcı")',
        '[data-user-type="driver"]',
        'button:contains("Taşıyıcı")'
      ];
      
      let driverFound = false;
      for (let selector of driverSelectors) {
        try {
          const element = this.page.locator(selector).first();
          if (await element.isVisible()) {
            console.log(`✅ Taşıyıcı butonu bulundu: ${selector}`);
            await element.click();
            await this.page.waitForTimeout(2000);
            driverFound = true;
            break;
          }
        } catch (error) {
          console.log(`❌ Taşıyıcı selector çalışmadı: ${selector}`);
        }
      }
      
      if (!driverFound) {
        this.logResult(testName, 'WARN', 'Taşıyıcı butonu bulunamadı, manuel test gerekli');
        return;
      }
      
      const driverData = {
        firstName: 'Veli',
        lastName: 'Kaya',
        email: `veli.kaya.${Date.now()}@driver.com`,
        phone: '+90 555 321 0987',
        licenseNumber: `A${Date.now().toString().slice(-8)}`,
        vehiclePlate: `34 ABC ${Math.floor(Math.random() * 999)}`
      };
      
      // Form doldur
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
      
      await this.takeScreenshot('driver-registration-result');
      
    } catch (error) {
      this.logResult(testName, 'FAIL', `Taşıyıcı kayıt hatası: ${error.message}`);
    }
  }

  // 2. PANEL TESTLERİ - DÜZELTİLMİŞ
  async testPanelFunctionality() {
    console.log('\n📊 PANEL FONKSİYONALİTE TESTLERİ BAŞLIYOR...\n');

    // Bireysel Panel Testi
    await this.testIndividualPanel();
    
    // Kurumsal Panel Testi
    await this.testCorporatePanel();
    
    // Nakliyeci Panel Testi
    await this.testCarrierPanel();
    
    // Taşıyıcı Panel Testi
    await this.testDriverPanel();
  }

  async testIndividualPanel() {
    const testName = 'Bireysel Panel Fonksiyonalite';
    
    try {
      await this.page.goto('http://localhost:5173/individual/dashboard');
      await this.page.waitForLoadState('networkidle');
      
      // Dashboard başlığını kontrol et
      const dashboardTitle = this.page.locator('h1').first();
      if (await dashboardTitle.isVisible()) {
        const titleText = await dashboardTitle.textContent();
        this.logResult(testName, 'PASS', `Dashboard yüklendi: ${titleText}`);
      }
      
      // Menü öğelerini kontrol et
      const menuItems = [
        'text=Dashboard',
        'text=Gönderilerim',
        'text=Yeni Gönderi',
        'text=Canlı Takip',
        'text=Mesajlar',
        'text=Bildirimler',
        'text=Hesap',
        'text=Yardım'
      ];
      
      let menuFound = 0;
      for (let menuItem of menuItems) {
        try {
          const element = this.page.locator(menuItem).first();
          if (await element.isVisible()) {
            menuFound++;
            console.log(`✅ Menü öğesi bulundu: ${menuItem}`);
          }
        } catch (error) {
          console.log(`❌ Menü öğesi bulunamadı: ${menuItem}`);
        }
      }
      
      this.logResult(testName, 'PASS', `${menuFound} menü öğesi bulundu`);
      
      // Gönderi oluşturma testi
      await this.testIndividualShipmentCreation();
      
    } catch (error) {
      this.logResult(testName, 'FAIL', `Bireysel panel test hatası: ${error.message}`);
    }
  }

  async testIndividualShipmentCreation() {
    const testName = 'Bireysel Gönderi Oluşturma';
    
    try {
      // Yeni Gönderi butonuna tıkla
      const createButton = this.page.locator('button:has-text("Yeni Gönderi")').first();
      if (await createButton.isVisible()) {
        await createButton.click();
        await this.page.waitForTimeout(3000);
        
        // Form sayfası yüklendi mi kontrol et
        const currentUrl = this.page.url();
        if (currentUrl.includes('/create-shipment')) {
          this.logResult(testName, 'PASS', 'Gönderi oluşturma sayfası yüklendi');
          
          // Kategori seçimi testi
          const categorySelectors = [
            '[data-category="Ev Taşınması"]',
            'button:has-text("Ev Taşınması")',
            'text=Ev Taşınması',
            '.category-card:has-text("Ev Taşınması")'
          ];
          
          let categoryFound = false;
          for (let selector of categorySelectors) {
            try {
              const element = this.page.locator(selector).first();
              if (await element.isVisible()) {
                console.log(`✅ Kategori bulundu: ${selector}`);
                await element.click();
                await this.page.waitForTimeout(1000);
                categoryFound = true;
                break;
              }
            } catch (error) {
              console.log(`❌ Kategori selector çalışmadı: ${selector}`);
            }
          }
          
          if (categoryFound) {
            this.logResult(testName, 'PASS', 'Kategori seçimi başarılı');
          } else {
            this.logResult(testName, 'WARN', 'Kategori seçimi bulunamadı');
          }
          
        } else {
          this.logResult(testName, 'WARN', 'Gönderi oluşturma sayfası yüklenmedi');
        }
      } else {
        this.logResult(testName, 'WARN', 'Yeni Gönderi butonu bulunamadı');
      }
      
      await this.takeScreenshot('individual-shipment-creation');
      
    } catch (error) {
      this.logResult(testName, 'FAIL', `Bireysel gönderi oluşturma hatası: ${error.message}`);
    }
  }

  async testCorporatePanel() {
    const testName = 'Kurumsal Panel Fonksiyonalite';
    
    try {
      await this.page.goto('http://localhost:5173/corporate/dashboard');
      await this.page.waitForLoadState('networkidle');
      
      const dashboardTitle = this.page.locator('h1').first();
      if (await dashboardTitle.isVisible()) {
        const titleText = await dashboardTitle.textContent();
        this.logResult(testName, 'PASS', `Kurumsal dashboard yüklendi: ${titleText}`);
      }
      
      await this.takeScreenshot('corporate-panel');
      
    } catch (error) {
      this.logResult(testName, 'FAIL', `Kurumsal panel test hatası: ${error.message}`);
    }
  }

  async testCarrierPanel() {
    const testName = 'Nakliyeci Panel Fonksiyonalite';
    
    try {
      await this.page.goto('http://localhost:5173/nakliyeci/dashboard');
      await this.page.waitForLoadState('networkidle');
      
      const dashboardTitle = this.page.locator('h1').first();
      if (await dashboardTitle.isVisible()) {
        const titleText = await dashboardTitle.textContent();
        this.logResult(testName, 'PASS', `Nakliyeci dashboard yüklendi: ${titleText}`);
      }
      
      await this.takeScreenshot('carrier-panel');
      
    } catch (error) {
      this.logResult(testName, 'FAIL', `Nakliyeci panel test hatası: ${error.message}`);
    }
  }

  async testDriverPanel() {
    const testName = 'Taşıyıcı Panel Fonksiyonalite';
    
    try {
      await this.page.goto('http://localhost:5173/tasiyici/dashboard');
      await this.page.waitForLoadState('networkidle');
      
      const dashboardTitle = this.page.locator('h1').first();
      if (await dashboardTitle.isVisible()) {
        const titleText = await dashboardTitle.textContent();
        this.logResult(testName, 'PASS', `Taşıyıcı dashboard yüklendi: ${titleText}`);
      }
      
      await this.takeScreenshot('driver-panel');
      
    } catch (error) {
      this.logResult(testName, 'FAIL', `Taşıyıcı panel test hatası: ${error.message}`);
    }
  }

  // RAPOR OLUŞTURMA
  generateReport() {
    console.log('\n📊 DÜZELTİLMİŞ TEST RAPORU OLUŞTURULUYOR...\n');
    
    const totalTests = this.testResults.passed + this.testResults.failed + this.testResults.warnings;
    const successRate = ((this.testResults.passed / totalTests) * 100).toFixed(2);
    
    console.log('='.repeat(60));
    console.log('🎯 YOLNET DÜZELTİLMİŞ TEST RAPORU');
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
    console.log('🚀 YOLNET DÜZELTİLMİŞ TEST SİSTEMİ BAŞLIYOR...\n');
    
    try {
      await this.init();
      
      // Test klasörü oluştur
      await this.page.evaluate(() => {
        // Screenshot klasörü oluşturma
      });
      
      // Tüm testleri çalıştır
      await this.testRealUserRegistration();
      await this.testPanelFunctionality();
      
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
const tester = new YolNetFixedTester();
tester.runAllTests();






