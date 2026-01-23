const { chromium } = require('playwright');

async function realUserComprehensiveTest() {
  console.log('👥 GERÇEK KULLANICI KAPSAMLI TEST BAŞLATIYOR...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const results = {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    realDataIssues: [],
    userFlowIssues: [],
    dataConsistencyIssues: [],
    performanceIssues: []
  };
  
  try {
    // ========================================
    // TEST 1: GERÇEK KULLANICI KAYIT VE GİRİŞ
    // ========================================
    console.log('👤 TEST 1: Gerçek Kullanıcı Kayıt ve Giriş');
    console.log('=' .repeat(60));
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Gerçek kullanıcı kaydı
    try {
      results.totalTests++;
      
      await page.goto('http://localhost:5173/register');
      await page.waitForLoadState('networkidle');
      
      // Gerçek verilerle kayıt formu doldur
      const realUserData = {
        firstName: 'Ahmet',
        lastName: 'Yılmaz',
        email: 'ahmet.yilmaz@example.com',
        phone: '05321234567',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
        userType: 'individual',
        address: 'Kadıköy, İstanbul',
        companyName: '',
        taxNumber: ''
      };
      
      // Form alanlarını doldur - Register form yapısına göre
      const firstNameInput = page.locator('input[placeholder*="Adınız"]');
      if (await firstNameInput.count() > 0) {
        await firstNameInput.fill(realUserData.firstName);
      }
      
      const lastNameInput = page.locator('input[placeholder*="Soyadınız"]');
      if (await lastNameInput.count() > 0) {
        await lastNameInput.fill(realUserData.lastName);
      }
      
      const emailInput = page.locator('input[type="email"]');
      if (await emailInput.count() > 0) {
        await emailInput.fill(realUserData.email);
      }
      
      const phoneInput = page.locator('input[type="tel"]');
      if (await phoneInput.count() > 0) {
        await phoneInput.fill(realUserData.phone);
      }
      
      const passwordInput = page.locator('input[type="password"]').first();
      if (await passwordInput.count() > 0) {
        await passwordInput.fill(realUserData.password);
      }
      
      const confirmPasswordInput = page.locator('input[type="password"]').nth(1);
      if (await confirmPasswordInput.count() > 0) {
        await confirmPasswordInput.fill(realUserData.confirmPassword);
      }
      
      const userTypeSelect = page.locator('select');
      if (await userTypeSelect.count() > 0) {
        await userTypeSelect.selectOption(realUserData.userType);
      }
      
      const addressInput = page.locator('input[placeholder*="Adres"]');
      if (await addressInput.count() > 0) {
        await addressInput.fill(realUserData.address);
      }
      
      // Kayıt butonuna tıkla
      const registerButton = page.locator('button[type="submit"]');
      if (await registerButton.count() > 0) {
        await registerButton.click();
        await page.waitForTimeout(3000);
        
        // Başarılı kayıt kontrolü
        const currentUrl = page.url();
        if (currentUrl.includes('/individual/dashboard') || currentUrl.includes('/login')) {
          console.log('✅ Gerçek kullanıcı kaydı: BAŞARILI');
          results.passedTests++;
        } else {
          console.log('❌ Gerçek kullanıcı kaydı: BAŞARISIZ');
          results.failedTests++;
          results.userFlowIssues.push({
            step: 'User Registration',
            issue: 'Kayıt sonrası yönlendirme başarısız',
            severity: 'HIGH'
          });
        }
      } else {
        console.log('❌ Kayıt butonu bulunamadı');
        results.failedTests++;
      }
      
    } catch (error) {
      console.log(`⚠️ Gerçek kullanıcı kayıt hatası: ${error.message}`);
      results.failedTests++;
    }
    
    // ========================================
    // TEST 2: GERÇEK GÖNDERİ OLUŞTURMA
    // ========================================
    console.log('\n📦 TEST 2: Gerçek Gönderi Oluşturma');
    console.log('=' .repeat(60));
    
    try {
      results.totalTests++;
      
      // Demo login yap
      await page.goto('http://localhost:5173/login');
      await page.waitForLoadState('networkidle');
      
      const demoButton = page.locator('[data-testid="demo-individual"]');
      if (await demoButton.count() > 0) {
        await demoButton.click();
        await page.waitForTimeout(2000);
        
        // Gönderi oluşturma sayfasına git
        await page.goto('http://localhost:5173/individual/create-shipment');
        await page.waitForLoadState('networkidle');
        
        // Gerçek gönderi verileri
        const realShipmentData = {
          from: 'Kadıköy, İstanbul',
          to: 'Çankaya, Ankara',
          weight: '150',
          dimensions: '100x80x60',
          price: '2500',
          description: 'Ev eşyaları taşıma - Yatak odası takımı, mutfak eşyaları',
          pickupDate: '2024-11-01',
          deliveryDate: '2024-11-02',
          contactName: 'Ahmet Yılmaz',
          contactPhone: '05321234567',
          specialInstructions: 'Kırılabilir eşyalar var, dikkatli taşıma gerekli'
        };
        
        // Form alanlarını doldur - CreateShipment form yapısına göre
        // Kategori seçimi
        const categoryButton = page.locator('button').filter({ hasText: 'Ev Taşınması' });
        if (await categoryButton.count() > 0) {
          await categoryButton.click();
          await page.waitForTimeout(1000);
        }
        
        // Şehir seçimi - dropdown'lardan
        const pickupCitySelect = page.locator('select').first();
        if (await pickupCitySelect.count() > 0) {
          await pickupCitySelect.selectOption('istanbul');
          await page.waitForTimeout(500);
        }
        
        const deliveryCitySelect = page.locator('select').nth(1);
        if (await deliveryCitySelect.count() > 0) {
          await deliveryCitySelect.selectOption('ankara');
          await page.waitForTimeout(500);
        }
        
        // Adres alanları
        const pickupAddressInput = page.locator('input[placeholder*="Adres"]').first();
        if (await pickupAddressInput.count() > 0) {
          await pickupAddressInput.fill(realShipmentData.from);
        }
        
        const deliveryAddressInput = page.locator('input[placeholder*="Adres"]').nth(1);
        if (await deliveryAddressInput.count() > 0) {
          await deliveryAddressInput.fill(realShipmentData.to);
        }
        
        // Tarih alanları
        const pickupDateInput = page.locator('input[type="date"]').first();
        if (await pickupDateInput.count() > 0) {
          await pickupDateInput.fill(realShipmentData.pickupDate);
        }
        
        const deliveryDateInput = page.locator('input[type="date"]').nth(1);
        if (await deliveryDateInput.count() > 0) {
          await deliveryDateInput.fill(realShipmentData.deliveryDate);
        }
        
        // Açıklama alanı
        const descriptionTextarea = page.locator('textarea').first();
        if (await descriptionTextarea.count() > 0) {
          await descriptionTextarea.fill(realShipmentData.description);
        }
        
        // Gönderi oluştur butonuna tıkla
        const createButton = page.locator('button[type="submit"]');
        if (await createButton.count() > 0) {
          await createButton.click();
          await page.waitForTimeout(3000);
          
          // Başarılı oluşturma kontrolü
          const successMessage = await page.locator('text=başarıyla oluşturuldu').count();
          if (successMessage > 0) {
            console.log('✅ Gerçek gönderi oluşturma: BAŞARILI');
            results.passedTests++;
          } else {
            console.log('❌ Gerçek gönderi oluşturma: BAŞARISIZ');
            results.failedTests++;
            results.userFlowIssues.push({
              step: 'Shipment Creation',
              issue: 'Gönderi oluşturma başarısız',
              severity: 'HIGH'
            });
          }
        } else {
          console.log('❌ Gönderi oluştur butonu bulunamadı');
          results.failedTests++;
        }
        
      } else {
        console.log('❌ Demo butonu bulunamadı');
        results.failedTests++;
      }
      
    } catch (error) {
      console.log(`⚠️ Gerçek gönderi oluşturma hatası: ${error.message}`);
      results.failedTests++;
    }
    
    // ========================================
    // TEST 3: GERÇEK VERİ GÖRÜNTÜLEME
    // ========================================
    console.log('\n📊 TEST 3: Gerçek Veri Görüntüleme');
    console.log('=' .repeat(60));
    
    try {
      results.totalTests++;
      
      // Gönderilerim sayfasına git
      await page.goto('http://localhost:5173/individual/my-shipments');
      await page.waitForLoadState('networkidle');
      
      // Gerçek veri kontrolü
      const shipmentCards = await page.locator('[data-testid="shipment-card"]').count();
      const shipmentTexts = await page.locator('text=Kadıköy').count();
      
      if (shipmentCards > 0 || shipmentTexts > 0) {
        console.log(`✅ Gerçek veri görüntüleme: ${shipmentCards} gönderi kartı bulundu`);
        results.passedTests++;
        
        // Veri detayları kontrolü
        const hasRealData = await page.evaluate(() => {
          const bodyText = document.body.textContent || '';
          return bodyText.includes('İstanbul') && bodyText.includes('Ankara');
        });
        
        if (hasRealData) {
          console.log('✅ Gerçek veri detayları: Şehir isimleri görünüyor');
          results.passedTests++;
        } else {
          console.log('❌ Gerçek veri detayları: Şehir isimleri görünmüyor');
          results.failedTests++;
          results.realDataIssues.push({
            issue: 'Gerçek şehir isimleri görünmüyor',
            severity: 'MEDIUM'
          });
        }
      } else {
        console.log('❌ Gerçek veri görüntüleme: Gönderi kartları bulunamadı');
        results.failedTests++;
        results.realDataIssues.push({
          issue: 'Gönderi kartları bulunamadı',
          severity: 'HIGH'
        });
      }
      
    } catch (error) {
      console.log(`⚠️ Gerçek veri görüntüleme hatası: ${error.message}`);
      results.failedTests++;
    }
    
    // ========================================
    // TEST 4: ÇOKLU KULLANICI SENARYOSU
    // ========================================
    console.log('\n👥 TEST 4: Çoklu Kullanıcı Senaryosu');
    console.log('=' .repeat(60));
    
    // 5 farklı kullanıcı oluştur
    const users = [
      { type: 'individual', name: 'Bireysel Kullanıcı' },
      { type: 'corporate', name: 'Kurumsal Kullanıcı' },
      { type: 'nakliyeci', name: 'Nakliyeci Kullanıcı' },
      { type: 'tasiyici', name: 'Taşıyıcı Kullanıcı' },
      { type: 'individual', name: 'İkinci Bireysel' }
    ];
    
    const contexts = [];
    const pages = [];
    
    for (let i = 0; i < users.length; i++) {
      const newContext = await browser.newContext();
      const newPage = await newContext.newPage();
      contexts.push(newContext);
      pages.push(newPage);
    }
    
    try {
      results.totalTests++;
      
      // Tüm kullanıcılar aynı anda demo login yap
      const loginPromises = pages.map(async (page, index) => {
        try {
          await page.goto('http://localhost:5173/login');
          await page.waitForLoadState('networkidle');
          
          const demoButton = page.locator(`[data-testid="demo-${users[index].type}"]`);
          if (await demoButton.count() > 0) {
            await demoButton.click();
            await page.waitForTimeout(2000);
            
            const currentUrl = page.url();
            if (currentUrl.includes('/dashboard')) {
              console.log(`✅ ${users[index].name}: Login başarılı`);
              return { success: true, user: users[index].name };
            } else {
              console.log(`❌ ${users[index].name}: Login başarısız`);
              return { success: false, user: users[index].name };
            }
          } else {
            console.log(`❌ ${users[index].name}: Demo butonu bulunamadı`);
            return { success: false, user: users[index].name };
          }
        } catch (error) {
          console.log(`⚠️ ${users[index].name}: Login hatası - ${error.message}`);
          return { success: false, user: users[index].name };
        }
      });
      
      const loginResults = await Promise.all(loginPromises);
      const successfulLogins = loginResults.filter(r => r.success).length;
      
      console.log(`📊 Çoklu kullanıcı login: ${successfulLogins}/${users.length} başarılı`);
      
      if (successfulLogins >= users.length * 0.8) {
        console.log('✅ Çoklu kullanıcı senaryosu: BAŞARILI');
        results.passedTests++;
      } else {
        console.log('❌ Çoklu kullanıcı senaryosu: BAŞARISIZ');
        results.failedTests++;
        results.userFlowIssues.push({
          step: 'Multi-User Login',
          issue: `${successfulLogins}/${users.length} kullanıcı başarılı`,
          severity: 'HIGH'
        });
      }
      
      // Context'leri kapat
      for (const context of contexts) {
        await context.close();
      }
      
    } catch (error) {
      console.log(`⚠️ Çoklu kullanıcı senaryosu hatası: ${error.message}`);
      results.failedTests++;
    }
    
    // ========================================
    // TEST 5: GERÇEK ZAMANLI VERİ SENKRONİZASYONU
    // ========================================
    console.log('\n⚡ TEST 5: Gerçek Zamanlı Veri Senkronizasyonu');
    console.log('=' .repeat(60));
    
    try {
      results.totalTests++;
      
      const context1 = await browser.newContext();
      const context2 = await browser.newContext();
      const page1 = await context1.newPage();
      const page2 = await context2.newPage();
      
      // Page1'de demo login yap
      await page1.goto('http://localhost:5173/login');
      await page1.waitForLoadState('networkidle');
      const demoButton1 = page1.locator('[data-testid="demo-individual"]');
      if (await demoButton1.count() > 0) {
        await demoButton1.click();
        await page1.waitForTimeout(2000);
      }
      
      // Page2'de demo login yap
      await page2.goto('http://localhost:5173/login');
      await page2.waitForLoadState('networkidle');
      const demoButton2 = page2.locator('[data-testid="demo-individual"]');
      if (await demoButton2.count() > 0) {
        await demoButton2.click();
        await page2.waitForTimeout(2000);
      }
      
      // Page1'de gönderi oluştur
      await page1.goto('http://localhost:5173/individual/create-shipment');
      await page1.waitForLoadState('networkidle');
      
      await page1.fill('input[name="from"]', 'Beşiktaş, İstanbul');
      await page1.fill('input[name="to"]', 'Konak, İzmir');
      await page1.fill('input[name="weight"]', '200');
      await page1.fill('input[name="price"]', '1800');
      await page1.fill('textarea[name="description"]', 'Real-time sync test gönderisi');
      
      const createButton = page1.locator('button[type="submit"]');
      if (await createButton.count() > 0) {
        await createButton.click();
        await page1.waitForTimeout(2000);
      }
      
      // Page2'de gönderileri kontrol et
      await page2.goto('http://localhost:5173/individual/my-shipments');
      await page2.waitForLoadState('networkidle');
      
      // Sayfa yenile
      await page2.reload();
      await page2.waitForLoadState('networkidle');
      
      // Yeni gönderi görünüyor mu kontrol et
      const newShipmentText = page2.locator('text=Real-time sync test');
      if (await newShipmentText.count() > 0) {
        console.log('✅ Gerçek zamanlı senkronizasyon: BAŞARILI');
        results.passedTests++;
      } else {
        console.log('❌ Gerçek zamanlı senkronizasyon: BAŞARISIZ');
        results.failedTests++;
        results.dataConsistencyIssues.push({
          issue: 'Gerçek zamanlı veri senkronizasyonu çalışmıyor',
          severity: 'HIGH'
        });
      }
      
      await context1.close();
      await context2.close();
      
    } catch (error) {
      console.log(`⚠️ Gerçek zamanlı senkronizasyon hatası: ${error.message}`);
      results.failedTests++;
    }
    
    // ========================================
    // TEST 6: GERÇEK VERİ TUTARLILIĞI
    // ========================================
    console.log('\n🔄 TEST 6: Gerçek Veri Tutarlılığı');
    console.log('=' .repeat(60));
    
    try {
      results.totalTests++;
      
      const context = await browser.newContext();
      const page = await context.newPage();
      
      // Demo login yap
      await page.goto('http://localhost:5173/login');
      await page.waitForLoadState('networkidle');
      const demoButton = page.locator('[data-testid="demo-individual"]');
      if (await demoButton.count() > 0) {
        await demoButton.click();
        await page.waitForTimeout(2000);
      }
      
      // Dashboard'a git
      await page.goto('http://localhost:5173/individual/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Dashboard verilerini kontrol et
      const dashboardData = await page.evaluate(() => {
        const bodyText = document.body.textContent || '';
        return {
          hasStats: bodyText.includes('Gönderi') || bodyText.includes('Teklif'),
          hasRealNumbers: /\d+/.test(bodyText),
          hasUserInfo: bodyText.includes('Demo') || bodyText.includes('Kullanıcı'),
          contentLength: bodyText.length
        };
      });
      
      if (dashboardData.hasStats && dashboardData.hasRealNumbers) {
        console.log('✅ Dashboard veri tutarlılığı: BAŞARILI');
        results.passedTests++;
      } else {
        console.log('❌ Dashboard veri tutarlılığı: BAŞARISIZ');
        results.failedTests++;
        results.dataConsistencyIssues.push({
          issue: 'Dashboard veri tutarlılığı sorunu',
          severity: 'MEDIUM'
        });
      }
      
      // Gönderilerim sayfasına git
      await page.goto('http://localhost:5173/individual/my-shipments');
      await page.waitForLoadState('networkidle');
      
      // Gönderi listesi kontrolü
      const shipmentListData = await page.evaluate(() => {
        const bodyText = document.body.textContent || '';
        return {
          hasShipments: bodyText.includes('gönderi') || bodyText.includes('shipment'),
          hasRealData: bodyText.includes('İstanbul') || bodyText.includes('Ankara'),
          contentLength: bodyText.length
        };
      });
      
      if (shipmentListData.hasShipments) {
        console.log('✅ Gönderi listesi veri tutarlılığı: BAŞARILI');
        results.passedTests++;
      } else {
        console.log('❌ Gönderi listesi veri tutarlılığı: BAŞARISIZ');
        results.failedTests++;
        results.dataConsistencyIssues.push({
          issue: 'Gönderi listesi veri tutarlılığı sorunu',
          severity: 'HIGH'
        });
      }
      
      await context.close();
      
    } catch (error) {
      console.log(`⚠️ Veri tutarlılığı test hatası: ${error.message}`);
      results.failedTests++;
    }
    
    // ========================================
    // TEST SONUÇLARI
    // ========================================
    console.log('\n📊 GERÇEK KULLANICI TEST SONUÇLARI');
    console.log('=' .repeat(60));
    
    const successRate = ((results.passedTests / results.totalTests) * 100).toFixed(2);
    
    console.log(`📈 Toplam Test: ${results.totalTests}`);
    console.log(`✅ Başarılı: ${results.passedTests}`);
    console.log(`❌ Başarısız: ${results.failedTests}`);
    console.log(`📊 Başarı Oranı: ${successRate}%`);
    console.log(`🚨 Gerçek Veri Sorunları: ${results.realDataIssues.length}`);
    console.log(`👥 Kullanıcı Akış Sorunları: ${results.userFlowIssues.length}`);
    console.log(`🔄 Veri Tutarlılık Sorunları: ${results.dataConsistencyIssues.length}`);
    
    // Başarı oranı değerlendirmesi
    console.log('\n🎯 GERÇEK KULLANICI DEĞERLENDİRMESİ:');
    
    if (successRate >= 95) {
      console.log('🛡️ MÜKEMMEL! Gerçek kullanıcı deneyimi çok iyi!');
      console.log('🌟 Production için tamamen hazır!');
    } else if (successRate >= 85) {
      console.log('✅ İYİ! Gerçek kullanıcı deneyimi genel olarak iyi!');
      console.log('🔧 Küçük iyileştirmeler yapılabilir.');
    } else if (successRate >= 70) {
      console.log('⚠️ ORTA! Bazı gerçek kullanıcı sorunları var.');
      console.log('🚨 Kritik sorunlar düzeltilmeli.');
    } else {
      console.log('❌ ZAYIF! Gerçek kullanıcı sorunları var.');
      console.log('🚨 Acil düzeltmeler yapılmalı.');
    }
    
    // Tespit edilen sorunlar
    if (results.realDataIssues.length > 0) {
      console.log('\n🚨 TESPİT EDİLEN GERÇEK VERİ SORUNLARI:');
      results.realDataIssues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue.issue} (${issue.severity})`);
      });
    }
    
    if (results.userFlowIssues.length > 0) {
      console.log('\n👥 TESPİT EDİLEN KULLANICI AKIŞ SORUNLARI:');
      results.userFlowIssues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue.step}: ${issue.issue} (${issue.severity})`);
      });
    }
    
    if (results.dataConsistencyIssues.length > 0) {
      console.log('\n🔄 TESPİT EDİLEN VERİ TUTARLILIĞI SORUNLARI:');
      results.dataConsistencyIssues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue.issue} (${issue.severity})`);
      });
    }
    
    console.log('\n🎉 GERÇEK KULLANICI KAPSAMLI TEST TAMAMLANDI!');
    
  } catch (error) {
    console.error('❌ Gerçek kullanıcı test hatası:', error.message);
  } finally {
    await browser.close();
  }
  
  return results;
}

realUserComprehensiveTest().catch(console.error);
