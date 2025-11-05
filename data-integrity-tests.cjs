const { chromium } = require('playwright');

async function dataIntegrityTests() {
  console.log('📊 VERİ TUTARLILIĞI TESTLERİ BAŞLATIYOR...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const results = {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    dataIssues: [],
    consistencyScore: 0
  };
  
  try {
    // ========================================
    // TEST 1: CONCURRENT USER TESTİ
    // ========================================
    console.log('👥 TEST 1: Concurrent User Testi');
    console.log('=' .repeat(50));
    
    // 5 farklı browser context'i oluştur
    const contexts = [];
    const pages = [];
    
    for (let i = 0; i < 5; i++) {
      const newContext = await browser.newContext();
      const newPage = await newContext.newPage();
      contexts.push(newContext);
      pages.push(newPage);
    }
    
    // Tüm sayfalarda aynı anda demo login yap
    const loginPromises = pages.map(async (page, index) => {
      try {
        results.totalTests++;
        
        await page.goto('http://localhost:5173/login');
        await page.waitForLoadState('networkidle');
        
        // Demo individual butonuna tıkla
        const demoButton = page.locator('[data-testid="demo-individual"]');
        if (await demoButton.count() > 0) {
          await demoButton.click();
          await page.waitForTimeout(2000);
          
          // Dashboard'a yönlendirildi mi kontrol et
          const currentUrl = page.url();
          if (currentUrl.includes('/individual/dashboard')) {
            console.log(`✅ User ${index + 1}: Login başarılı`);
            results.passedTests++;
            return { success: true, userId: index + 1 };
          } else {
            console.log(`❌ User ${index + 1}: Login başarısız`);
            results.failedTests++;
            return { success: false, userId: index + 1 };
          }
        } else {
          console.log(`❌ User ${index + 1}: Demo butonu bulunamadı`);
          results.failedTests++;
          return { success: false, userId: index + 1 };
        }
      } catch (error) {
        console.log(`⚠️ User ${index + 1}: Test hatası - ${error.message}`);
        results.failedTests++;
        return { success: false, userId: index + 1 };
      }
    });
    
    const loginResults = await Promise.all(loginPromises);
    const successfulLogins = loginResults.filter(r => r.success).length;
    
    console.log(`📊 Concurrent Login Sonucu: ${successfulLogins}/5 başarılı`);
    
    // ========================================
    // TEST 2: DATA CONSISTENCY TESTİ
    // ========================================
    console.log('\n🔄 TEST 2: Data Consistency Testi');
    console.log('=' .repeat(50));
    
    if (successfulLogins > 0) {
      const testPage = pages[0];
      
      try {
        results.totalTests++;
        
        // Gönderi oluştur
        await testPage.goto('http://localhost:5173/individual/create-shipment');
        await testPage.waitForLoadState('networkidle');
        
        // Form doldur
        await testPage.fill('input[name="from"]', 'İstanbul');
        await testPage.fill('input[name="to"]', 'Ankara');
        await testPage.fill('input[name="weight"]', '100');
        await testPage.fill('input[name="price"]', '500');
        await testPage.fill('textarea[name="description"]', 'Test gönderi - Data consistency test');
        
        // Gönderi oluştur butonuna tıkla
        const createButton = testPage.locator('button[type="submit"]');
        if (await createButton.count() > 0) {
          await createButton.click();
          await testPage.waitForTimeout(3000);
          
          // Gönderilerim sayfasına git
          await testPage.goto('http://localhost:5173/individual/my-shipments');
          await testPage.waitForLoadState('networkidle');
          
          // Gönderi listesinde test gönderisi var mı kontrol et
          const shipmentText = testPage.locator('text=Test gönderi - Data consistency test');
          if (await shipmentText.count() > 0) {
            console.log('✅ Data Consistency: Gönderi oluşturuldu ve listede görünüyor');
            results.passedTests++;
          } else {
            console.log('❌ Data Consistency: Gönderi oluşturuldu ama listede görünmüyor');
            results.failedTests++;
            results.dataIssues.push({
              type: 'DATA_CONSISTENCY',
              description: 'Gönderi oluşturuldu ama listede görünmüyor',
              severity: 'HIGH'
            });
          }
        } else {
          console.log('❌ Gönderi oluştur butonu bulunamadı');
          results.failedTests++;
        }
        
      } catch (error) {
        console.log(`⚠️ Data consistency test hatası: ${error.message}`);
        results.failedTests++;
      }
    }
    
    // ========================================
    // TEST 3: DATABASE INTEGRITY TESTİ
    // ========================================
    console.log('\n🗄️ TEST 3: Database Integrity Testi');
    console.log('=' .repeat(50));
    
    try {
      results.totalTests++;
      
      // API'den veri çek
      const response = await page.request.get('http://localhost:5000/api/shipments');
      
      if (response.status() === 200) {
        const data = await response.json();
        
        if (data.success && Array.isArray(data.data.shipments)) {
          console.log(`✅ Database Integrity: ${data.data.shipments.length} gönderi bulundu`);
          results.passedTests++;
          
          // Veri yapısı kontrolü
          if (data.data.shipments.length > 0) {
            const firstShipment = data.data.shipments[0];
            const requiredFields = ['id', 'from', 'to', 'weight', 'price'];
            const missingFields = requiredFields.filter(field => !firstShipment[field]);
            
            if (missingFields.length === 0) {
              console.log('✅ Database Integrity: Veri yapısı doğru');
              results.passedTests++;
            } else {
              console.log(`❌ Database Integrity: Eksik alanlar - ${missingFields.join(', ')}`);
              results.failedTests++;
              results.dataIssues.push({
                type: 'DATABASE_INTEGRITY',
                description: `Eksik alanlar: ${missingFields.join(', ')}`,
                severity: 'MEDIUM'
              });
            }
          }
        } else {
          console.log('❌ Database Integrity: Geçersiz veri yapısı');
          results.failedTests++;
          results.dataIssues.push({
            type: 'DATABASE_INTEGRITY',
            description: 'Geçersiz veri yapısı',
            severity: 'HIGH'
          });
        }
      } else {
        console.log(`❌ Database Integrity: API hatası - ${response.status()}`);
        results.failedTests++;
      }
      
    } catch (error) {
      console.log(`⚠️ Database integrity test hatası: ${error.message}`);
      results.failedTests++;
    }
    
    // ========================================
    // TEST 4: SESSION PERSISTENCE TESTİ
    // ========================================
    console.log('\n🔒 TEST 4: Session Persistence Testi');
    console.log('=' .repeat(50));
    
    if (successfulLogins > 0) {
      const testPage = pages[0];
      
      try {
        results.totalTests++;
        
        // Sayfa yenile
        await testPage.reload();
        await testPage.waitForLoadState('networkidle');
        
        // Hala dashboard'da mı kontrol et
        const currentUrl = testPage.url();
        if (currentUrl.includes('/individual/dashboard')) {
          console.log('✅ Session Persistence: Session korundu');
          results.passedTests++;
        } else if (currentUrl.includes('/login')) {
          console.log('❌ Session Persistence: Session kayboldu');
          results.failedTests++;
          results.dataIssues.push({
            type: 'SESSION_PERSISTENCE',
            description: 'Session kayboldu',
            severity: 'MEDIUM'
          });
        } else {
          console.log(`⚠️ Session Persistence: Beklenmeyen URL - ${currentUrl}`);
          results.failedTests++;
        }
        
      } catch (error) {
        console.log(`⚠️ Session persistence test hatası: ${error.message}`);
        results.failedTests++;
      }
    }
    
    // ========================================
    // TEST 5: REAL-TIME DATA SYNC TESTİ
    // ========================================
    console.log('\n⚡ TEST 5: Real-time Data Sync Testi');
    console.log('=' .repeat(50));
    
    if (successfulLogins >= 2) {
      try {
        results.totalTests++;
        
        const page1 = pages[0];
        const page2 = pages[1];
        
        // Page1'de gönderi oluştur
        await page1.goto('http://localhost:5173/individual/create-shipment');
        await page1.waitForLoadState('networkidle');
        
        await page1.fill('input[name="from"]', 'İzmir');
        await page1.fill('input[name="to"]', 'Bursa');
        await page1.fill('input[name="weight"]', '200');
        await page1.fill('input[name="price"]', '800');
        await page1.fill('textarea[name="description"]', 'Real-time sync test');
        
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
          console.log('✅ Real-time Sync: Veri senkronizasyonu çalışıyor');
          results.passedTests++;
        } else {
          console.log('❌ Real-time Sync: Veri senkronizasyonu çalışmıyor');
          results.failedTests++;
          results.dataIssues.push({
            type: 'REAL_TIME_SYNC',
            description: 'Veri senkronizasyonu çalışmıyor',
            severity: 'MEDIUM'
          });
        }
        
      } catch (error) {
        console.log(`⚠️ Real-time sync test hatası: ${error.message}`);
        results.failedTests++;
      }
    }
    
    // ========================================
    // TEST SONUÇLARI
    // ========================================
    console.log('\n📊 VERİ TUTARLILIĞI TEST SONUÇLARI');
    console.log('=' .repeat(50));
    
    const successRate = ((results.passedTests / results.totalTests) * 100).toFixed(2);
    results.consistencyScore = successRate;
    
    console.log(`📈 Toplam Test: ${results.totalTests}`);
    console.log(`✅ Başarılı: ${results.passedTests}`);
    console.log(`❌ Başarısız: ${results.failedTests}`);
    console.log(`📊 Tutarlılık Skoru: ${successRate}%`);
    console.log(`🚨 Tespit Edilen Sorunlar: ${results.dataIssues.length}`);
    
    // Tutarlılık skoru değerlendirmesi
    console.log('\n🎯 VERİ TUTARLILIĞI DEĞERLENDİRMESİ:');
    
    if (successRate >= 95) {
      console.log('🛡️ MÜKEMMEL! Veri tutarlılığı çok iyi!');
      console.log('🌟 Production için hazır!');
    } else if (successRate >= 85) {
      console.log('✅ İYİ! Veri tutarlılığı genel olarak iyi!');
      console.log('🔧 Küçük iyileştirmeler yapılabilir.');
    } else if (successRate >= 70) {
      console.log('⚠️ ORTA! Bazı veri tutarlılığı sorunları var.');
      console.log('🚨 Kritik sorunlar düzeltilmeli.');
    } else {
      console.log('❌ ZAYIF! Veri tutarlılığı sorunları var.');
      console.log('🚨 Acil veri düzeltmeleri yapılmalı.');
    }
    
    // Tespit edilen sorunlar
    if (results.dataIssues.length > 0) {
      console.log('\n🚨 TESPİT EDİLEN VERİ SORUNLARI:');
      results.dataIssues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue.type} (${issue.severity})`);
        console.log(`     ${issue.description}`);
      });
    }
    
    console.log('\n🎉 VERİ TUTARLILIĞI TESTLERİ TAMAMLANDI!');
    
    // Context'leri kapat
    for (const context of contexts) {
      await context.close();
    }
    
  } catch (error) {
    console.error('❌ Veri tutarlılığı test hatası:', error.message);
  } finally {
    await browser.close();
  }
  
  return results;
}

dataIntegrityTests().catch(console.error);



