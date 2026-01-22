const { chromium } = require('playwright');

async function simpleSecurityTest() {
  console.log('🔐 BASİT GÜVENLİK TESTİ BAŞLATIYOR...\n');
  
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
    vulnerabilities: []
  };
  
  try {
    // ========================================
    // TEST 1: AUTHENTICATION BYPASS TESTİ
    // ========================================
    console.log('🔑 TEST 1: Authentication Bypass Testi');
    console.log('=' .repeat(50));
    
    const protectedUrls = [
      '/individual/dashboard',
      '/corporate/dashboard',
      '/nakliyeci/dashboard',
      '/tasiyici/dashboard'
    ];
    
    for (const url of protectedUrls) {
      try {
        results.totalTests++;
        
        // Önce logout yap
        await page.goto('http://localhost:5173/logout');
        await page.waitForTimeout(1000);
        
        // Direkt URL'e git
        await page.goto(`http://localhost:5173${url}`);
        await page.waitForLoadState('networkidle');
        
        // Login sayfasına yönlendirildi mi kontrol et
        const currentUrl = page.url();
        const isLoginPage = currentUrl.includes('/login');
        
        if (isLoginPage) {
          console.log(`✅ ${url}: PROTECTED (Login sayfasına yönlendirildi)`);
          results.passedTests++;
        } else {
          console.log(`❌ ${url}: VULNERABLE (Korumasız erişilebilir)`);
          results.failedTests++;
          results.vulnerabilities.push({
            type: 'AUTH_BYPASS',
            url: url,
            severity: 'HIGH'
          });
        }
        
      } catch (error) {
        console.log(`⚠️ ${url}: Test hatası - ${error.message}`);
        results.failedTests++;
      }
    }
    
    // ========================================
    // TEST 2: API AUTHENTICATION TESTİ
    // ========================================
    console.log('\n🔗 TEST 2: API Authentication Testi');
    console.log('=' .repeat(50));
    
    const apiUrls = [
      '/api/shipments',
      '/api/offers',
      '/api/messages',
      '/api/notifications',
      '/api/users/profile'
    ];
    
    for (const url of apiUrls) {
      try {
        results.totalTests++;
        
        // Token olmadan API'ye istek gönder
        const response = await page.request.get(`http://localhost:5000${url}`);
        
        if (response.status() === 401 || response.status() === 403) {
          console.log(`✅ ${url}: PROTECTED (${response.status()})`);
          results.passedTests++;
        } else if (response.status() === 200) {
          console.log(`❌ ${url}: VULNERABLE (200 OK)`);
          results.failedTests++;
          results.vulnerabilities.push({
            type: 'API_AUTH_BYPASS',
            url: url,
            severity: 'HIGH'
          });
        } else {
          console.log(`⚠️ ${url}: ${response.status()} (Belirsiz)`);
          results.failedTests++;
        }
        
      } catch (error) {
        console.log(`⚠️ ${url}: Test hatası - ${error.message}`);
        results.failedTests++;
      }
    }
    
    // ========================================
    // TEST 3: DEMO LOGIN TESTİ
    // ========================================
    console.log('\n🎭 TEST 3: Demo Login Testi');
    console.log('=' .repeat(50));
    
    try {
      results.totalTests++;
      
      await page.goto('http://localhost:5173/login');
      await page.waitForLoadState('networkidle');
      
      // Demo individual butonuna tıkla
      const demoButton = page.locator('[data-testid="demo-individual"]');
      if (await demoButton.count() > 0) {
        await demoButton.click();
        await page.waitForTimeout(3000);
        
        // Dashboard'a yönlendirildi mi kontrol et
        const currentUrl = page.url();
        if (currentUrl.includes('/individual/dashboard')) {
          console.log('✅ Demo login: BAŞARILI (Dashboard\'a yönlendirildi)');
          results.passedTests++;
        } else {
          console.log('❌ Demo login: BAŞARISIZ');
          results.failedTests++;
        }
      } else {
        console.log('❌ Demo butonu bulunamadı');
        results.failedTests++;
      }
      
    } catch (error) {
      console.log(`⚠️ Demo login test hatası: ${error.message}`);
      results.failedTests++;
    }
    
    // ========================================
    // TEST 4: LOGOUT TESTİ
    // ========================================
    console.log('\n🚪 TEST 4: Logout Testi');
    console.log('=' .repeat(50));
    
    try {
      results.totalTests++;
      
      // Dashboard'dayken logout yap
      await page.goto('http://localhost:5173/individual/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Logout butonunu bul ve tıkla
      const logoutButton = page.locator('text=Çıkış').first();
      if (await logoutButton.count() > 0) {
        await logoutButton.click();
        await page.waitForTimeout(2000);
        
        // Login sayfasına yönlendirildi mi kontrol et
        const currentUrl = page.url();
        if (currentUrl.includes('/login')) {
          console.log('✅ Logout: BAŞARILI (Login sayfasına yönlendirildi)');
          results.passedTests++;
        } else {
          console.log('❌ Logout: BAŞARISIZ');
          results.failedTests++;
        }
      } else {
        console.log('⚠️ Logout butonu bulunamadı');
        results.failedTests++;
      }
      
    } catch (error) {
      console.log(`⚠️ Logout test hatası: ${error.message}`);
      results.failedTests++;
    }
    
    // ========================================
    // TEST SONUÇLARI
    // ========================================
    console.log('\n📊 GÜVENLİK TEST SONUÇLARI');
    console.log('=' .repeat(50));
    
    const successRate = ((results.passedTests / results.totalTests) * 100).toFixed(2);
    
    console.log(`📈 Toplam Test: ${results.totalTests}`);
    console.log(`✅ Başarılı: ${results.passedTests}`);
    console.log(`❌ Başarısız: ${results.failedTests}`);
    console.log(`📊 Güvenlik Skoru: ${successRate}%`);
    console.log(`🚨 Tespit Edilen Açıklar: ${results.vulnerabilities.length}`);
    
    // Güvenlik skoru değerlendirmesi
    console.log('\n🎯 GÜVENLİK DEĞERLENDİRMESİ:');
    
    if (successRate >= 95) {
      console.log('🛡️ MÜKEMMEL! Sistem çok güvenli!');
      console.log('🌟 Production için hazır!');
    } else if (successRate >= 85) {
      console.log('✅ İYİ! Sistem genel olarak güvenli!');
      console.log('🔧 Küçük iyileştirmeler yapılabilir.');
    } else if (successRate >= 70) {
      console.log('⚠️ ORTA! Bazı güvenlik açıkları var.');
      console.log('🚨 Kritik açıklar düzeltilmeli.');
    } else {
      console.log('❌ ZAYIF! Sistem güvenlik açıkları var.');
      console.log('🚨 Acil güvenlik önlemleri alınmalı.');
    }
    
    // Tespit edilen açıklar
    if (results.vulnerabilities.length > 0) {
      console.log('\n🚨 TESPİT EDİLEN GÜVENLİK AÇIKLARI:');
      results.vulnerabilities.forEach((vuln, index) => {
        console.log(`  ${index + 1}. ${vuln.type} (${vuln.severity})`);
        console.log(`     URL: ${vuln.url}`);
      });
    }
    
    console.log('\n🎉 BASİT GÜVENLİK TESTİ TAMAMLANDI!');
    
  } catch (error) {
    console.error('❌ Güvenlik test hatası:', error.message);
  } finally {
    await browser.close();
  }
  
  return results;
}

simpleSecurityTest().catch(console.error);



