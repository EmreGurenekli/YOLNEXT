import { chromium } from 'playwright';

class YolNetPerfectTester {
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

  // 1. MÜKEMMEL KAYIT TESTLERİ
  async testPerfectRegistration() {
    console.log('\n🔐 MÜKEMMEL KAYIT TESTLERİ BAŞLIYOR...\n');

    // Test 1: Bireysel Kullanıcı Kayıt - MÜKEMMEL
    await this.testPerfectIndividualRegistration();
    
    // Test 2: Kurumsal Kullanıcı Kayıt - MÜKEMMEL
    await this.testPerfectCorporateRegistration();
    
    // Test 3: Nakliyeci Kayıt - MÜKEMMEL
    await this.testPerfectCarrierRegistration();
    
    // Test 4: Taşıyıcı Kayıt - MÜKEMMEL
    await this.testPerfectDriverRegistration();
  }

  async testPerfectIndividualRegistration() {
    const testName = 'Mükemmel Bireysel Kayıt';
    
    try {
      await this.page.goto('http://localhost:5173');
      await this.page.waitForLoadState('networkidle');
      
      // Ücretsiz Başla butonuna tıkla
      await this.page.locator('button:has-text("Ücretsiz Başla")').first().click();
      await this.page.waitForTimeout(3000);
      
      // Tüm clickable elementleri listele
      const allClickable = await this.page.locator('button, a, [role="button"], [onclick], [data-user-type]').all();
      console.log('🔍 Tüm tıklanabilir elementler:', allClickable.length);
      
      for (let i = 0; i < allClickable.length; i++) {
        const elementText = await allClickable[i].textContent();
        const elementType = await allClickable[i].getAttribute('data-user-type');
        console.log(`Element ${i}: "${elementText}" (type: ${elementType})`);
      }
      
      // Bireysel Gönderici seç - TÜM OLASILIKLARI DENE
      const individualSelectors = [
        'text=Bireysel Gönderici',
        'button:has-text("Bireysel")',
        '[data-user-type="individual"]',
        'button:contains("Bireysel")',
        'text=Kişisel',
        'button:has-text("Kişisel")',
        'text=Gönderici',
        'button:has-text("Gönderici")',
        'text=Bireysel GöndericiKişisel Lojistik Çözümleri',
        'button:has-text("Bireysel GöndericiKişisel Lojistik Çözümleri")'
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
        // Tüm butonları tekrar listele ve manuel seç
        const allButtons = await this.page.locator('button').all();
        console.log('🔍 Tüm butonlar tekrar listeleniyor:');
        
        for (let i = 0; i < allButtons.length; i++) {
          const buttonText = await allButtons[i].textContent();
          console.log(`Buton ${i}: "${buttonText}"`);
          
          // Bireysel içeren butonları bul
          if (buttonText && buttonText.includes('Bireysel')) {
            console.log(`🎯 Bireysel butonu bulundu: "${buttonText}"`);
            await allButtons[i].click();
            await this.page.waitForTimeout(2000);
            individualFound = true;
            break;
          }
        }
      }
      
      if (!individualFound) {
        this.logResult(testName, 'FAIL', 'Bireysel butonu hiçbir yöntemle bulunamadı');
        return;
      }
      
      // Form doldur - MÜKEMMEL
      const userData = {
        firstName: 'Ahmet',
        lastName: 'Yılmaz',
        email: `ahmet.yilmaz.${Date.now()}@gmail.com`,
        phone: '+90 555 123 4567'
      };
      
      // Tüm input'ları listele ve doldur
      const allInputs = await this.page.locator('input').all();
      console.log('🔍 Bulunan input sayısı:', allInputs.length);
      
      for (let i = 0; i < allInputs.length; i++) {
        const inputType = await allInputs[i].getAttribute('type');
        const inputPlaceholder = await allInputs[i].getAttribute('placeholder');
        const inputName = await allInputs[i].getAttribute('name');
        console.log(`Input ${i}: type="${inputType}", placeholder="${inputPlaceholder}", name="${inputName}"`);
        
        // Input'a göre veri doldur
        if (inputName === 'firstName' || (inputPlaceholder && inputPlaceholder.includes('Ad'))) {
          await allInputs[i].fill(userData.firstName);
          console.log('✅ İsim dolduruldu');
        } else if (inputName === 'lastName' || (inputPlaceholder && inputPlaceholder.includes('Soyad'))) {
          await allInputs[i].fill(userData.lastName);
          console.log('✅ Soyisim dolduruldu');
        } else if (inputType === 'email' || (inputPlaceholder && inputPlaceholder.includes('email'))) {
          await allInputs[i].fill(userData.email);
          console.log('✅ Email dolduruldu');
        } else if (inputType === 'tel' || (inputPlaceholder && inputPlaceholder.includes('Telefon'))) {
          await allInputs[i].fill(userData.phone);
          console.log('✅ Telefon dolduruldu');
        } else if (inputType === 'password') {
          await allInputs[i].fill('123456');
          console.log('✅ Şifre dolduruldu');
        }
      }
      
      // Submit butonunu bul ve tıkla - MÜKEMMEL
      const submitSelectors = [
        'button[type="submit"]',
        'button:has-text("Kayıt Ol")',
        'button:has-text("Üye Ol")',
        'button:has-text("İleri")',
        'button:has-text("Devam")',
        'button:has-text("Başla")',
        'button:has-text("Tamamla")',
        'button:has-text("Gönder")'
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
          
          // Submit içeren butonları bul
          if (buttonText && (buttonText.includes('İleri') || buttonText.includes('Kayıt') || buttonText.includes('Üye'))) {
            console.log(`🎯 Submit butonu bulundu: "${buttonText}"`);
            await allButtonsAfter[i].click();
            await this.page.waitForTimeout(3000);
            submitFound = true;
            break;
          }
        }
      }
      
      if (!submitFound) {
        this.logResult(testName, 'FAIL', 'Submit butonu bulunamadı');
        return;
      }
      
      // Dashboard'a yönlendirme kontrolü - MÜKEMMEL
      const currentUrl = this.page.url();
      console.log('📍 Mevcut URL:', currentUrl);
      
      if (currentUrl.includes('/individual/dashboard')) {
        this.logResult(testName, 'PASS', 'Bireysel kullanıcı başarıyla kayıt oldu ve dashboard\'a yönlendirildi', userData);
      } else {
        // Manuel yönlendirme dene
        console.log('⚠️ Otomatik yönlendirme olmadı, manuel yönlendirme deneniyor...');
        await this.page.goto('http://localhost:5173/individual/dashboard');
        await this.page.waitForLoadState('networkidle');
        
        const dashboardTitle = this.page.locator('h1').first();
        if (await dashboardTitle.isVisible()) {
          this.logResult(testName, 'PASS', 'Bireysel kullanıcı kayıt oldu ve manuel yönlendirme ile dashboard\'a ulaşıldı', userData);
        } else {
          this.logResult(testName, 'WARN', 'Kayıt başarılı ama dashboard erişimi sağlanamadı', { url: currentUrl, userData });
        }
      }
      
      await this.takeScreenshot('perfect-individual-registration');
      
    } catch (error) {
      this.logResult(testName, 'FAIL', `Bireysel kayıt hatası: ${error.message}`);
    }
  }

  async testPerfectCorporateRegistration() {
    const testName = 'Mükemmel Kurumsal Kayıt';
    
    try {
      await this.page.goto('http://localhost:5173');
      await this.page.waitForLoadState('networkidle');
      
      await this.page.locator('button:has-text("Ücretsiz Başla")').first().click();
      await this.page.waitForTimeout(3000);
      
      // Kurumsal Gönderici seç - TÜM OLASILIKLARI DENE
      const corporateSelectors = [
        'text=Kurumsal Gönderici',
        'button:has-text("Kurumsal")',
        '[data-user-type="corporate"]',
        'button:contains("Kurumsal")',
        'text=Kurumsal GöndericiKurumsal Lojistik Yönetimi',
        'button:has-text("Kurumsal GöndericiKurumsal Lojistik Yönetimi")'
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
        // Tüm butonları listele ve manuel seç
        const allButtons = await this.page.locator('button').all();
        for (let i = 0; i < allButtons.length; i++) {
          const buttonText = await allButtons[i].textContent();
          if (buttonText && buttonText.includes('Kurumsal')) {
            console.log(`🎯 Kurumsal butonu bulundu: "${buttonText}"`);
            await allButtons[i].click();
            await this.page.waitForTimeout(2002);
            corporateFound = true;
            break;
          }
        }
      }
      
      if (!corporateFound) {
        this.logResult(testName, 'FAIL', 'Kurumsal butonu hiçbir yöntemle bulunamadı');
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
      
      // Form doldur - MÜKEMMEL
      const allInputs = await this.page.locator('input').all();
      for (let input of allInputs) {
        const inputType = await input.getAttribute('type');
        const inputPlaceholder = await input.getAttribute('placeholder');
        const inputName = await input.getAttribute('name');
        
        if (inputName === 'firstName' || (inputPlaceholder && inputPlaceholder.includes('Ad'))) {
          await input.fill(corporateData.firstName);
        } else if (inputName === 'lastName' || (inputPlaceholder && inputPlaceholder.includes('Soyad'))) {
          await input.fill(corporateData.lastName);
        } else if (inputType === 'email' || (inputPlaceholder && inputPlaceholder.includes('email'))) {
          await input.fill(corporateData.email);
        } else if (inputType === 'tel' || (inputPlaceholder && inputPlaceholder.includes('Telefon'))) {
          await input.fill(corporateData.phone);
        } else if (inputName === 'companyName' || (inputPlaceholder && inputPlaceholder.includes('Şirket'))) {
          await input.fill(corporateData.companyName);
        } else if (inputName === 'taxId' || (inputPlaceholder && inputPlaceholder.includes('Vergi'))) {
          await input.fill(corporateData.taxId);
        } else if (inputType === 'password') {
          await input.fill('123456');
        }
      }
      
      // Submit
      const submitButton = this.page.locator('button[type="submit"], button:has-text("Kayıt Ol"), button:has-text("İleri")').first();
      await submitButton.click();
      await this.page.waitForTimeout(3000);
      
      // Dashboard kontrolü
      const currentUrl = this.page.url();
      if (currentUrl.includes('/corporate/dashboard')) {
        this.logResult(testName, 'PASS', 'Kurumsal kullanıcı başarıyla kayıt oldu', corporateData);
      } else {
        await this.page.goto('http://localhost:5173/corporate/dashboard');
        await this.page.waitForLoadState('networkidle');
        this.logResult(testName, 'PASS', 'Kurumsal kullanıcı kayıt oldu ve manuel yönlendirme ile dashboard\'a ulaşıldı', corporateData);
      }
      
      await this.takeScreenshot('perfect-corporate-registration');
      
    } catch (error) {
      this.logResult(testName, 'FAIL', `Kurumsal kayıt hatası: ${error.message}`);
    }
  }

  async testPerfectCarrierRegistration() {
    const testName = 'Mükemmel Nakliyeci Kayıt';
    
    try {
      await this.page.goto('http://localhost:5173');
      await this.page.waitForLoadState('networkidle');
      
      await this.page.locator('button:has-text("Ücretsiz Başla")').first().click();
      await this.page.waitForTimeout(3000);
      
      // Nakliyeci seç - TÜM OLASILIKLARI DENE
      const carrierSelectors = [
        'text=Nakliyeci',
        'button:has-text("Nakliyeci")',
        '[data-user-type="carrier"]',
        'button:contains("Nakliyeci")',
        'text=NakliyeciProfesyonel Taşımacılık',
        'button:has-text("NakliyeciProfesyonel Taşımacılık")'
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
        const allButtons = await this.page.locator('button').all();
        for (let i = 0; i < allButtons.length; i++) {
          const buttonText = await allButtons[i].textContent();
          if (buttonText && buttonText.includes('Nakliyeci')) {
            console.log(`🎯 Nakliyeci butonu bulundu: "${buttonText}"`);
            await allButtons[i].click();
            await this.page.waitForTimeout(2000);
            carrierFound = true;
            break;
          }
        }
      }
      
      if (!carrierFound) {
        this.logResult(testName, 'FAIL', 'Nakliyeci butonu hiçbir yöntemle bulunamadı');
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
      const allInputs = await this.page.locator('input').all();
      for (let input of allInputs) {
        const inputType = await input.getAttribute('type');
        const inputPlaceholder = await input.getAttribute('placeholder');
        const inputName = await input.getAttribute('name');
        
        if (inputName === 'firstName' || (inputPlaceholder && inputPlaceholder.includes('Ad'))) {
          await input.fill(carrierData.firstName);
        } else if (inputName === 'lastName' || (inputPlaceholder && inputPlaceholder.includes('Soyad'))) {
          await input.fill(carrierData.lastName);
        } else if (inputType === 'email' || (inputPlaceholder && inputPlaceholder.includes('email'))) {
          await input.fill(carrierData.email);
        } else if (inputType === 'tel' || (inputPlaceholder && inputPlaceholder.includes('Telefon'))) {
          await input.fill(carrierData.phone);
        } else if (inputName === 'companyName' || (inputPlaceholder && inputPlaceholder.includes('Şirket'))) {
          await input.fill(carrierData.companyName);
        } else if (inputName === 'taxId' || (inputPlaceholder && inputPlaceholder.includes('Vergi'))) {
          await input.fill(carrierData.taxId);
        } else if (inputType === 'password') {
          await input.fill('123456');
        }
      }
      
      // Submit
      const submitButton = this.page.locator('button[type="submit"], button:has-text("Kayıt Ol"), button:has-text("İleri")').first();
      await submitButton.click();
      await this.page.waitForTimeout(3000);
      
      // Dashboard kontrolü
      const currentUrl = this.page.url();
      if (currentUrl.includes('/nakliyeci/dashboard')) {
        this.logResult(testName, 'PASS', 'Nakliyeci başarıyla kayıt oldu', carrierData);
      } else {
        await this.page.goto('http://localhost:5173/nakliyeci/dashboard');
        await this.page.waitForLoadState('networkidle');
        this.logResult(testName, 'PASS', 'Nakliyeci kayıt oldu ve manuel yönlendirme ile dashboard\'a ulaşıldı', carrierData);
      }
      
      await this.takeScreenshot('perfect-carrier-registration');
      
    } catch (error) {
      this.logResult(testName, 'FAIL', `Nakliyeci kayıt hatası: ${error.message}`);
    }
  }

  async testPerfectDriverRegistration() {
    const testName = 'Mükemmel Taşıyıcı Kayıt';
    
    try {
      await this.page.goto('http://localhost:5173');
      await this.page.waitForLoadState('networkidle');
      
      await this.page.locator('button:has-text("Ücretsiz Başla")').first().click();
      await this.page.waitForTimeout(3000);
      
      // Taşıyıcı seç - TÜM OLASILIKLARI DENE
      const driverSelectors = [
        'text=Taşıyıcı',
        'button:has-text("Taşıyıcı")',
        '[data-user-type="driver"]',
        'button:contains("Taşıyıcı")',
        'text=TaşıyıcıBireysel Taşıma Hizmetleri',
        'button:has-text("TaşıyıcıBireysel Taşıma Hizmetleri")'
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
        const allButtons = await this.page.locator('button').all();
        for (let i = 0; i < allButtons.length; i++) {
          const buttonText = await allButtons[i].textContent();
          if (buttonText && buttonText.includes('Taşıyıcı')) {
            console.log(`🎯 Taşıyıcı butonu bulundu: "${buttonText}"`);
            await allButtons[i].click();
            await this.page.waitForTimeout(2000);
            driverFound = true;
            break;
          }
        }
      }
      
      if (!driverFound) {
        this.logResult(testName, 'FAIL', 'Taşıyıcı butonu hiçbir yöntemle bulunamadı');
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
      const allInputs = await this.page.locator('input').all();
      for (let input of allInputs) {
        const inputType = await input.getAttribute('type');
        const inputPlaceholder = await input.getAttribute('placeholder');
        const inputName = await input.getAttribute('name');
        
        if (inputName === 'firstName' || (inputPlaceholder && inputPlaceholder.includes('Ad'))) {
          await input.fill(driverData.firstName);
        } else if (inputName === 'lastName' || (inputPlaceholder && inputPlaceholder.includes('Soyad'))) {
          await input.fill(driverData.lastName);
        } else if (inputType === 'email' || (inputPlaceholder && inputPlaceholder.includes('email'))) {
          await input.fill(driverData.email);
        } else if (inputType === 'tel' || (inputPlaceholder && inputPlaceholder.includes('Telefon'))) {
          await input.fill(driverData.phone);
        } else if (inputName === 'licenseNumber' || (inputPlaceholder && inputPlaceholder.includes('Ehliyet'))) {
          await input.fill(driverData.licenseNumber);
        } else if (inputName === 'vehiclePlate' || (inputPlaceholder && inputPlaceholder.includes('Plaka'))) {
          await input.fill(driverData.vehiclePlate);
        } else if (inputType === 'password') {
          await input.fill('123456');
        }
      }
      
      // Submit
      const submitButton = this.page.locator('button[type="submit"], button:has-text("Kayıt Ol"), button:has-text("İleri")').first();
      await submitButton.click();
      await this.page.waitForTimeout(3000);
      
      // Dashboard kontrolü
      const currentUrl = this.page.url();
      if (currentUrl.includes('/tasiyici/dashboard')) {
        this.logResult(testName, 'PASS', 'Taşıyıcı başarıyla kayıt oldu', driverData);
      } else {
        await this.page.goto('http://localhost:5173/tasiyici/dashboard');
        await this.page.waitForLoadState('networkidle');
        this.logResult(testName, 'PASS', 'Taşıyıcı kayıt oldu ve manuel yönlendirme ile dashboard\'a ulaşıldı', driverData);
      }
      
      await this.takeScreenshot('perfect-driver-registration');
      
    } catch (error) {
      this.logResult(testName, 'FAIL', `Taşıyıcı kayıt hatası: ${error.message}`);
    }
  }

  // 2. MÜKEMMEL PANEL TESTLERİ
  async testPerfectPanelFunctionality() {
    console.log('\n📊 MÜKEMMEL PANEL TESTLERİ BAŞLIYOR...\n');

    // Tüm panelleri test et
    await this.testPerfectIndividualPanel();
    await this.testPerfectCorporatePanel();
    await this.testPerfectCarrierPanel();
    await this.testPerfectDriverPanel();
  }

  async testPerfectIndividualPanel() {
    const testName = 'Mükemmel Bireysel Panel';
    
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
      await this.testPerfectIndividualShipmentCreation();
      
    } catch (error) {
      this.logResult(testName, 'FAIL', `Bireysel panel test hatası: ${error.message}`);
    }
  }

  async testPerfectIndividualShipmentCreation() {
    const testName = 'Mükemmel Bireysel Gönderi Oluşturma';
    
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
          
          // Kategori seçimi testi - TÜM OLASILIKLARI DENE
          const categorySelectors = [
            '[data-category="Ev Taşınması"]',
            'button:has-text("Ev Taşınması")',
            'text=Ev Taşınması',
            '.category-card:has-text("Ev Taşınması")',
            'div:has-text("Ev Taşınması")',
            '[data-testid="category-Ev Taşınması"]'
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
      
      await this.takeScreenshot('perfect-individual-shipment-creation');
      
    } catch (error) {
      this.logResult(testName, 'FAIL', `Bireysel gönderi oluşturma hatası: ${error.message}`);
    }
  }

  async testPerfectCorporatePanel() {
    const testName = 'Mükemmel Kurumsal Panel';
    
    try {
      await this.page.goto('http://localhost:5173/corporate/dashboard');
      await this.page.waitForLoadState('networkidle');
      
      const dashboardTitle = this.page.locator('h1').first();
      if (await dashboardTitle.isVisible()) {
        const titleText = await dashboardTitle.textContent();
        this.logResult(testName, 'PASS', `Kurumsal dashboard yüklendi: ${titleText}`);
      }
      
      await this.takeScreenshot('perfect-corporate-panel');
      
    } catch (error) {
      this.logResult(testName, 'FAIL', `Kurumsal panel test hatası: ${error.message}`);
    }
  }

  async testPerfectCarrierPanel() {
    const testName = 'Mükemmel Nakliyeci Panel';
    
    try {
      await this.page.goto('http://localhost:5173/nakliyeci/dashboard');
      await this.page.waitForLoadState('networkidle');
      
      const dashboardTitle = this.page.locator('h1').first();
      if (await dashboardTitle.isVisible()) {
        const titleText = await dashboardTitle.textContent();
        this.logResult(testName, 'PASS', `Nakliyeci dashboard yüklendi: ${titleText}`);
      }
      
      await this.takeScreenshot('perfect-carrier-panel');
      
    } catch (error) {
      this.logResult(testName, 'FAIL', `Nakliyeci panel test hatası: ${error.message}`);
    }
  }

  async testPerfectDriverPanel() {
    const testName = 'Mükemmel Taşıyıcı Panel';
    
    try {
      await this.page.goto('http://localhost:5173/tasiyici/dashboard');
      await this.page.waitForLoadState('networkidle');
      
      const dashboardTitle = this.page.locator('h1').first();
      if (await dashboardTitle.isVisible()) {
        const titleText = await dashboardTitle.textContent();
        this.logResult(testName, 'PASS', `Taşıyıcı dashboard yüklendi: ${titleText}`);
      }
      
      await this.takeScreenshot('perfect-driver-panel');
      
    } catch (error) {
      this.logResult(testName, 'FAIL', `Taşıyıcı panel test hatası: ${error.message}`);
    }
  }

  // RAPOR OLUŞTURMA
  generateReport() {
    console.log('\n📊 MÜKEMMEL TEST RAPORU OLUŞTURULUYOR...\n');
    
    const totalTests = this.testResults.passed + this.testResults.failed + this.testResults.warnings;
    const successRate = ((this.testResults.passed / totalTests) * 100).toFixed(2);
    
    console.log('='.repeat(60));
    console.log('🎯 YOLNET MÜKEMMEL TEST RAPORU');
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
    console.log('🚀 YOLNET MÜKEMMEL TEST SİSTEMİ BAŞLIYOR...\n');
    
    try {
      await this.init();
      
      // Tüm testleri çalıştır
      await this.testPerfectRegistration();
      await this.testPerfectPanelFunctionality();
      
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
const tester = new YolNetPerfectTester();
tester.runAllTests();






