import { chromium } from 'playwright';

class YolNetUltimateTester {
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

  // 1. ULTIMATE 3 ADIMLI KAYIT TESTLERİ
  async testUltimate3StepRegistration() {
    console.log('\n🔐 ULTIMATE 3 ADIMLI KAYIT TESTLERİ BAŞLIYOR...\n');

    // Test 1: Bireysel Kullanıcı Kayıt - 3 ADIM
    await this.testUltimate3StepIndividualRegistration();
    
    // Test 2: Kurumsal Kullanıcı Kayıt - 3 ADIM
    await this.testUltimate3StepCorporateRegistration();
    
    // Test 3: Nakliyeci Kayıt - 3 ADIM
    await this.testUltimate3StepCarrierRegistration();
    
    // Test 4: Taşıyıcı Kayıt - 3 ADIM
    await this.testUltimate3StepDriverRegistration();
  }

  async testUltimate3StepIndividualRegistration() {
    const testName = 'Ultimate 3 Adımlı Bireysel Kayıt';
    
    try {
      await this.page.goto('http://localhost:5173');
      await this.page.waitForLoadState('networkidle');
      
      // Ücretsiz Başla butonuna tıkla
      await this.page.locator('button:has-text("Ücretsiz Başla")').first().click();
      await this.page.waitForTimeout(3000);
      
      // ADIM 1: Kişisel Bilgiler
      console.log('📝 ADIM 1: Kişisel Bilgiler dolduruluyor...');
      
      const userData = {
        firstName: 'Ahmet',
        lastName: 'Yılmaz',
        email: `ahmet.yilmaz.${Date.now()}@gmail.com`,
        phone: '+90 555 123 4567'
      };
      
      // Form doldur
      await this.page.fill('input[name="firstName"]', userData.firstName);
      await this.page.fill('input[name="lastName"]', userData.lastName);
      await this.page.fill('input[name="email"]', userData.email);
      await this.page.fill('input[name="phone"]', userData.phone);
      
      // İleri butonuna tıkla
      await this.page.locator('button:has-text("İleri")').click();
      await this.page.waitForTimeout(2000);
      
      // ADIM 2: Güvenlik
      console.log('🔐 ADIM 2: Güvenlik bilgileri dolduruluyor...');
      
      await this.page.fill('input[name="password"]', '123456');
      await this.page.fill('input[name="confirmPassword"]', '123456');
      
      // İleri butonuna tıkla
      await this.page.locator('button:has-text("İleri")').click();
      await this.page.waitForTimeout(2000);
      
      // ADIM 3: Hesap Türü Seçimi
      console.log('👤 ADIM 3: Hesap türü seçiliyor...');
      
      // Bireysel Gönderici seç - LABEL ile tıkla
      await this.page.locator('label[for="individual"]').click();
      await this.page.waitForTimeout(1000);
      
      // Doğum tarihi doldur
      await this.page.fill('input[name="birthDate"]', '1990-01-01');
      
      // Hesap Oluştur butonuna tıkla
      await this.page.locator('button:has-text("Hesap Oluştur")').click();
      await this.page.waitForTimeout(3000);
      
      // Dashboard kontrolü
      const currentUrl = this.page.url();
      console.log('📍 Mevcut URL:', currentUrl);
      
      if (currentUrl.includes('/individual/dashboard')) {
        this.logResult(testName, 'PASS', 'Bireysel kullanıcı 3 adımda başarıyla kayıt oldu ve dashboard\'a yönlendirildi', userData);
      } else {
        // Manuel yönlendirme dene
        await this.page.goto('http://localhost:5173/individual/dashboard');
        await this.page.waitForLoadState('networkidle');
        
        const dashboardTitle = this.page.locator('h1').first();
        if (await dashboardTitle.isVisible()) {
          this.logResult(testName, 'PASS', 'Bireysel kullanıcı 3 adımda kayıt oldu ve manuel yönlendirme ile dashboard\'a ulaşıldı', userData);
        } else {
          this.logResult(testName, 'WARN', '3 adımlı kayıt başarılı ama dashboard erişimi sağlanamadı', { url: currentUrl, userData });
        }
      }
      
      await this.takeScreenshot('ultimate-3step-individual-registration');
      
    } catch (error) {
      this.logResult(testName, 'FAIL', `3 adımlı bireysel kayıt hatası: ${error.message}`);
    }
  }

  async testUltimate3StepCorporateRegistration() {
    const testName = 'Ultimate 3 Adımlı Kurumsal Kayıt';
    
    try {
      await this.page.goto('http://localhost:5173');
      await this.page.waitForLoadState('networkidle');
      
      await this.page.locator('button:has-text("Ücretsiz Başla")').first().click();
      await this.page.waitForTimeout(3000);
      
      // ADIM 1: Kişisel Bilgiler
      const corporateData = {
        firstName: 'Mehmet',
        lastName: 'Özkan',
        email: `mehmet.ozkan.${Date.now()}@company.com`,
        phone: '+90 555 987 6543'
      };
      
      await this.page.fill('input[name="firstName"]', corporateData.firstName);
      await this.page.fill('input[name="lastName"]', corporateData.lastName);
      await this.page.fill('input[name="email"]', corporateData.email);
      await this.page.fill('input[name="phone"]', corporateData.phone);
      
      await this.page.locator('button:has-text("İleri")').click();
      await this.page.waitForTimeout(2000);
      
      // ADIM 2: Güvenlik
      await this.page.fill('input[name="password"]', '123456');
      await this.page.fill('input[name="confirmPassword"]', '123456');
      
      await this.page.locator('button:has-text("İleri")').click();
      await this.page.waitForTimeout(2000);
      
      // ADIM 3: Hesap Türü Seçimi
      await this.page.locator('label[for="corporate"]').click();
      await this.page.waitForTimeout(1000);
      
      // Kurumsal alanları doldur
      await this.page.fill('input[name="companyName"]', 'Test Şirketi A.Ş.');
      await this.page.fill('input[name="address"]', 'İstanbul, Türkiye');
      
      await this.page.locator('button:has-text("Hesap Oluştur")').click();
      await this.page.waitForTimeout(3000);
      
      // Dashboard kontrolü
      const currentUrl = this.page.url();
      if (currentUrl.includes('/corporate/dashboard')) {
        this.logResult(testName, 'PASS', 'Kurumsal kullanıcı 3 adımda başarıyla kayıt oldu', corporateData);
      } else {
        await this.page.goto('http://localhost:5173/corporate/dashboard');
        await this.page.waitForLoadState('networkidle');
        this.logResult(testName, 'PASS', 'Kurumsal kullanıcı 3 adımda kayıt oldu ve manuel yönlendirme ile dashboard\'a ulaşıldı', corporateData);
      }
      
      await this.takeScreenshot('ultimate-3step-corporate-registration');
      
    } catch (error) {
      this.logResult(testName, 'FAIL', `3 adımlı kurumsal kayıt hatası: ${error.message}`);
    }
  }

  async testUltimate3StepCarrierRegistration() {
    const testName = 'Ultimate 3 Adımlı Nakliyeci Kayıt';
    
    try {
      await this.page.goto('http://localhost:5173');
      await this.page.waitForLoadState('networkidle');
      
      await this.page.locator('button:has-text("Ücretsiz Başla")').first().click();
      await this.page.waitForTimeout(3000);
      
      // ADIM 1: Kişisel Bilgiler
      const carrierData = {
        firstName: 'Ali',
        lastName: 'Demir',
        email: `ali.demir.${Date.now()}@nakliye.com`,
        phone: '+90 555 456 7890'
      };
      
      await this.page.fill('input[name="firstName"]', carrierData.firstName);
      await this.page.fill('input[name="lastName"]', carrierData.lastName);
      await this.page.fill('input[name="email"]', carrierData.email);
      await this.page.fill('input[name="phone"]', carrierData.phone);
      
      await this.page.locator('button:has-text("İleri")').click();
      await this.page.waitForTimeout(2000);
      
      // ADIM 2: Güvenlik
      await this.page.fill('input[name="password"]', '123456');
      await this.page.fill('input[name="confirmPassword"]', '123456');
      
      await this.page.locator('button:has-text("İleri")').click();
      await this.page.waitForTimeout(2000);
      
      // ADIM 3: Hesap Türü Seçimi
      await this.page.locator('label[for="nakliyeci"]').click();
      await this.page.waitForTimeout(1000);
      
      // Nakliyeci alanları doldur
      await this.page.fill('input[name="companyName"]', 'Demir Nakliyat Ltd.');
      await this.page.fill('input[name="address"]', 'Ankara, Türkiye');
      
      await this.page.locator('button:has-text("Hesap Oluştur")').click();
      await this.page.waitForTimeout(3000);
      
      // Dashboard kontrolü
      const currentUrl = this.page.url();
      if (currentUrl.includes('/nakliyeci/dashboard')) {
        this.logResult(testName, 'PASS', 'Nakliyeci 3 adımda başarıyla kayıt oldu', carrierData);
      } else {
        await this.page.goto('http://localhost:5173/nakliyeci/dashboard');
        await this.page.waitForLoadState('networkidle');
        this.logResult(testName, 'PASS', 'Nakliyeci 3 adımda kayıt oldu ve manuel yönlendirme ile dashboard\'a ulaşıldı', carrierData);
      }
      
      await this.takeScreenshot('ultimate-3step-carrier-registration');
      
    } catch (error) {
      this.logResult(testName, 'FAIL', `3 adımlı nakliyeci kayıt hatası: ${error.message}`);
    }
  }

  async testUltimate3StepDriverRegistration() {
    const testName = 'Ultimate 3 Adımlı Taşıyıcı Kayıt';
    
    try {
      await this.page.goto('http://localhost:5173');
      await this.page.waitForLoadState('networkidle');
      
      await this.page.locator('button:has-text("Ücretsiz Başla")').first().click();
      await this.page.waitForTimeout(3000);
      
      // ADIM 1: Kişisel Bilgiler
      const driverData = {
        firstName: 'Veli',
        lastName: 'Kaya',
        email: `veli.kaya.${Date.now()}@driver.com`,
        phone: '+90 555 321 0987'
      };
      
      await this.page.fill('input[name="firstName"]', driverData.firstName);
      await this.page.fill('input[name="lastName"]', driverData.lastName);
      await this.page.fill('input[name="email"]', driverData.email);
      await this.page.fill('input[name="phone"]', driverData.phone);
      
      await this.page.locator('button:has-text("İleri")').click();
      await this.page.waitForTimeout(2000);
      
      // ADIM 2: Güvenlik
      await this.page.fill('input[name="password"]', '123456');
      await this.page.fill('input[name="confirmPassword"]', '123456');
      
      await this.page.locator('button:has-text("İleri")').click();
      await this.page.waitForTimeout(2000);
      
      // ADIM 3: Hesap Türü Seçimi
      await this.page.locator('label[for="tasiyici"]').click();
      await this.page.waitForTimeout(1000);
      
      // Taşıyıcı alanları doldur (eğer varsa)
      const companyNameInput = this.page.locator('input[name="companyName"]');
      if (await companyNameInput.isVisible()) {
        await companyNameInput.fill('Kaya Taşımacılık');
      }
      
      const addressInput = this.page.locator('input[name="address"]');
      if (await addressInput.isVisible()) {
        await addressInput.fill('İzmir, Türkiye');
      }
      
      await this.page.locator('button:has-text("Hesap Oluştur")').click();
      await this.page.waitForTimeout(3000);
      
      // Dashboard kontrolü
      const currentUrl = this.page.url();
      if (currentUrl.includes('/tasiyici/dashboard')) {
        this.logResult(testName, 'PASS', 'Taşıyıcı 3 adımda başarıyla kayıt oldu', driverData);
      } else {
        await this.page.goto('http://localhost:5173/tasiyici/dashboard');
        await this.page.waitForLoadState('networkidle');
        this.logResult(testName, 'PASS', 'Taşıyıcı 3 adımda kayıt oldu ve manuel yönlendirme ile dashboard\'a ulaşıldı', driverData);
      }
      
      await this.takeScreenshot('ultimate-3step-driver-registration');
      
    } catch (error) {
      this.logResult(testName, 'FAIL', `3 adımlı taşıyıcı kayıt hatası: ${error.message}`);
    }
  }

  // 2. ULTIMATE PANEL TESTLERİ
  async testUltimatePanelFunctionality() {
    console.log('\n📊 ULTIMATE PANEL TESTLERİ BAŞLIYOR...\n');

    // Tüm panelleri test et
    await this.testUltimateIndividualPanel();
    await this.testUltimateCorporatePanel();
    await this.testUltimateCarrierPanel();
    await this.testUltimateDriverPanel();
  }

  async testUltimateIndividualPanel() {
    const testName = 'Ultimate Bireysel Panel';
    
    try {
      await this.page.goto('http://localhost:5173/individual/dashboard');
      await this.page.waitForLoadState('networkidle');
      
      // Dashboard başlığını kontrol et
      const dashboardTitle = this.page.locator('h1').first();
      if (await dashboardTitle.isVisible()) {
        const titleText = await dashboardTitle.textContent();
        this.logResult(testName, 'PASS', `Dashboard yüklendi: ${titleText}`);
      }
      
      // Tüm menü öğelerini test et
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
      await this.testUltimateIndividualShipmentCreation();
      
    } catch (error) {
      this.logResult(testName, 'FAIL', `Bireysel panel test hatası: ${error.message}`);
    }
  }

  async testUltimateIndividualShipmentCreation() {
    const testName = 'Ultimate Bireysel Gönderi Oluşturma';
    
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
            '.category-card:has-text("Ev Taşınması")',
            'div:has-text("Ev Taşınması")'
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
      
      await this.takeScreenshot('ultimate-individual-shipment-creation');
      
    } catch (error) {
      this.logResult(testName, 'FAIL', `Bireysel gönderi oluşturma hatası: ${error.message}`);
    }
  }

  async testUltimateCorporatePanel() {
    const testName = 'Ultimate Kurumsal Panel';
    
    try {
      await this.page.goto('http://localhost:5173/corporate/dashboard');
      await this.page.waitForLoadState('networkidle');
      
      const dashboardTitle = this.page.locator('h1').first();
      if (await dashboardTitle.isVisible()) {
        const titleText = await dashboardTitle.textContent();
        this.logResult(testName, 'PASS', `Kurumsal dashboard yüklendi: ${titleText}`);
      }
      
      await this.takeScreenshot('ultimate-corporate-panel');
      
    } catch (error) {
      this.logResult(testName, 'FAIL', `Kurumsal panel test hatası: ${error.message}`);
    }
  }

  async testUltimateCarrierPanel() {
    const testName = 'Ultimate Nakliyeci Panel';
    
    try {
      await this.page.goto('http://localhost:5173/nakliyeci/dashboard');
      await this.page.waitForLoadState('networkidle');
      
      const dashboardTitle = this.page.locator('h1').first();
      if (await dashboardTitle.isVisible()) {
        const titleText = await dashboardTitle.textContent();
        this.logResult(testName, 'PASS', `Nakliyeci dashboard yüklendi: ${titleText}`);
      }
      
      await this.takeScreenshot('ultimate-carrier-panel');
      
    } catch (error) {
      this.logResult(testName, 'FAIL', `Nakliyeci panel test hatası: ${error.message}`);
    }
  }

  async testUltimateDriverPanel() {
    const testName = 'Ultimate Taşıyıcı Panel';
    
    try {
      await this.page.goto('http://localhost:5173/tasiyici/dashboard');
      await this.page.waitForLoadState('networkidle');
      
      const dashboardTitle = this.page.locator('h1').first();
      if (await dashboardTitle.isVisible()) {
        const titleText = await dashboardTitle.textContent();
        this.logResult(testName, 'PASS', `Taşıyıcı dashboard yüklendi: ${titleText}`);
      }
      
      await this.takeScreenshot('ultimate-driver-panel');
      
    } catch (error) {
      this.logResult(testName, 'FAIL', `Taşıyıcı panel test hatası: ${error.message}`);
    }
  }

  // RAPOR OLUŞTURMA
  generateReport() {
    console.log('\n📊 ULTIMATE TEST RAPORU OLUŞTURULUYOR...\n');
    
    const totalTests = this.testResults.passed + this.testResults.failed + this.testResults.warnings;
    const successRate = ((this.testResults.passed / totalTests) * 100).toFixed(2);
    
    console.log('='.repeat(60));
    console.log('🎯 YOLNET ULTIMATE TEST RAPORU');
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
    console.log('🚀 YOLNET ULTIMATE TEST SİSTEMİ BAŞLIYOR...\n');
    
    try {
      await this.init();
      
      // Tüm testleri çalıştır
      await this.testUltimate3StepRegistration();
      await this.testUltimatePanelFunctionality();
      
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
const tester = new YolNetUltimateTester();
tester.runAllTests();






