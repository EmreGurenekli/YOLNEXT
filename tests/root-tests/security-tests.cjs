const { chromium } = require('playwright');

async function comprehensiveSecurityTests() {
  console.log('🔐 KAPSAMLI GÜVENLİK TESTLERİ BAŞLATIYOR...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Test sonuçları
  const securityResults = {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    vulnerabilities: [],
    securityScore: 0
  };
  
  // Console hatalarını yakala
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push({
        message: msg.text(),
        timestamp: new Date().toISOString(),
        type: 'console_error'
      });
    }
  });
  
  // Network hatalarını yakala
  const networkErrors = [];
  page.on('response', response => {
    if (response.status() >= 400) {
      networkErrors.push({
        url: response.url(),
        status: response.status(),
        timestamp: new Date().toISOString(),
        type: 'network_error'
      });
    }
  });
  
  try {
    // ========================================
    // TEST 1: SQL INJECTION TESTLERİ
    // ========================================
    console.log('💉 TEST 1: SQL Injection Testleri');
    console.log('=' .repeat(60));
    
    const sqlInjectionPayloads = [
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "admin'--",
      "admin'/*",
      "' UNION SELECT * FROM users--",
      "'; INSERT INTO users VALUES ('hacker', 'password'); --",
      "' OR 1=1 LIMIT 1 OFFSET 0--",
      "'; UPDATE users SET password='hacked' WHERE id=1; --"
    ];
    
    // Login sayfasında SQL injection testi
    await page.goto('http://localhost:5173/login');
    await page.waitForLoadState('networkidle');
    
    for (const payload of sqlInjectionPayloads) {
      try {
        securityResults.totalTests++;
        
        // Email alanına SQL injection payload'u gönder
        await page.fill('input[name="email"]', payload);
        await page.fill('input[name="password"]', 'test123');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(2000);
        
        // Hata mesajı kontrolü
        const errorMessage = await page.locator('text=Hata').count();
        const successMessage = await page.locator('text=Başarılı').count();
        
        if (errorMessage > 0 || successMessage === 0) {
          console.log(`✅ SQL Injection koruması: "${payload}" - BLOKED`);
          securityResults.passedTests++;
        } else {
          console.log(`❌ SQL Injection açığı: "${payload}" - VULNERABLE`);
          securityResults.failedTests++;
          securityResults.vulnerabilities.push({
            type: 'SQL_INJECTION',
            payload: payload,
            severity: 'HIGH',
            description: 'SQL injection payload başarılı oldu'
          });
        }
        
      } catch (error) {
        console.log(`⚠️ SQL Injection test hatası: ${error.message}`);
        securityResults.failedTests++;
      }
    }
    
    // ========================================
    // TEST 2: XSS (CROSS-SITE SCRIPTING) TESTLERİ
    // ========================================
    console.log('\n🌐 TEST 2: XSS (Cross-Site Scripting) Testleri');
    console.log('=' .repeat(60));
    
    const xssPayloads = [
      "<script>alert('XSS')</script>",
      "<img src=x onerror=alert('XSS')>",
      "javascript:alert('XSS')",
      "<svg onload=alert('XSS')>",
      "<iframe src=javascript:alert('XSS')></iframe>",
      "<body onload=alert('XSS')>",
      "<input onfocus=alert('XSS') autofocus>",
      "<select onfocus=alert('XSS') autofocus>"
    ];
    
    // Gönderi oluşturma sayfasında XSS testi
    await page.goto('http://localhost:5173/login');
    await page.click('[data-testid="demo-individual"]');
    await page.waitForTimeout(2000);
    
    await page.goto('http://localhost:5173/individual/create-shipment');
    await page.waitForLoadState('networkidle');
    
    for (const payload of xssPayloads) {
      try {
        securityResults.totalTests++;
        
        // Yük açıklaması alanına XSS payload'u gönder
        const descriptionTextarea = page.locator('textarea').first();
        if (await descriptionTextarea.count() > 0) {
          await descriptionTextarea.fill(payload);
          await page.waitForTimeout(1000);
          
          // Sayfada script çalıştı mı kontrol et
          const alertCount = await page.locator('text=alert').count();
          const scriptCount = await page.locator('script').count();
          
          if (alertCount === 0 && scriptCount <= 1) { // Sadece React script'i olmalı
            console.log(`✅ XSS koruması: "${payload}" - BLOKED`);
            securityResults.passedTests++;
          } else {
            console.log(`❌ XSS açığı: "${payload}" - VULNERABLE`);
            securityResults.failedTests++;
            securityResults.vulnerabilities.push({
              type: 'XSS',
              payload: payload,
              severity: 'HIGH',
              description: 'XSS payload başarılı oldu'
            });
          }
        }
        
      } catch (error) {
        console.log(`⚠️ XSS test hatası: ${error.message}`);
        securityResults.failedTests++;
      }
    }
    
    // ========================================
    // TEST 3: CSRF (CROSS-SITE REQUEST FORGERY) TESTLERİ
    // ========================================
    console.log('\n🔄 TEST 3: CSRF (Cross-Site Request Forgery) Testleri');
    console.log('=' .repeat(60));
    
    try {
      securityResults.totalTests++;
      
      // CSRF token kontrolü
      const csrfToken = await page.locator('input[name="_token"]').count();
      const csrfMeta = await page.locator('meta[name="csrf-token"]').count();
      
      if (csrfToken > 0 || csrfMeta > 0) {
        console.log('✅ CSRF koruması: Token bulundu');
        securityResults.passedTests++;
      } else {
        console.log('⚠️ CSRF koruması: Token bulunamadı');
        securityResults.failedTests++;
        securityResults.vulnerabilities.push({
          type: 'CSRF',
          severity: 'MEDIUM',
          description: 'CSRF token bulunamadı'
        });
      }
      
    } catch (error) {
      console.log(`⚠️ CSRF test hatası: ${error.message}`);
      securityResults.failedTests++;
    }
    
    // ========================================
    // TEST 4: AUTHENTICATION BYPASS TESTLERİ
    // ========================================
    console.log('\n🔑 TEST 4: Authentication Bypass Testleri');
    console.log('=' .repeat(60));
    
    const authBypassTests = [
      { name: 'Direct URL Access', url: '/individual/dashboard' },
      { name: 'API Direct Access', url: '/api/shipments' },
      { name: 'Admin Panel Access', url: '/admin' },
      { name: 'User Profile Access', url: '/api/users/profile' }
    ];
    
    for (const test of authBypassTests) {
      try {
        securityResults.totalTests++;
        
        // Önce logout yap
        await page.goto('http://localhost:5173/logout');
        await page.waitForTimeout(1000);
        
        // Direkt URL'e git
        await page.goto(`http://localhost:5173${test.url}`);
        await page.waitForLoadState('networkidle');
        
        // Login sayfasına yönlendirildi mi kontrol et
        const currentUrl = page.url();
        const isLoginPage = currentUrl.includes('/login');
        const isRedirected = currentUrl !== `http://localhost:5173${test.url}`;
        
        if (isLoginPage || isRedirected) {
          console.log(`✅ Auth bypass koruması: ${test.name} - PROTECTED`);
          securityResults.passedTests++;
        } else {
          console.log(`❌ Auth bypass açığı: ${test.name} - VULNERABLE`);
          securityResults.failedTests++;
          securityResults.vulnerabilities.push({
            type: 'AUTH_BYPASS',
            url: test.url,
            severity: 'HIGH',
            description: `${test.name} korumasız erişilebilir`
          });
        }
        
      } catch (error) {
        console.log(`⚠️ Auth bypass test hatası: ${error.message}`);
        securityResults.failedTests++;
      }
    }
    
    // ========================================
    // TEST 5: INPUT VALIDATION TESTLERİ
    // ========================================
    console.log('\n📝 TEST 5: Input Validation Testleri');
    console.log('=' .repeat(60));
    
    const inputValidationTests = [
      { field: 'email', payload: 'invalid-email', expected: 'error' },
      { field: 'phone', payload: '123', expected: 'error' },
      { field: 'price', payload: '-100', expected: 'error' },
      { field: 'price', payload: 'abc', expected: 'error' },
      { field: 'date', payload: 'invalid-date', expected: 'error' }
    ];
    
    await page.goto('http://localhost:5173/login');
    await page.click('[data-testid="demo-individual"]');
    await page.waitForTimeout(2000);
    
    await page.goto('http://localhost:5173/individual/create-shipment');
    await page.waitForLoadState('networkidle');
    
    for (const test of inputValidationTests) {
      try {
        securityResults.totalTests++;
        
        // Form alanını bul ve geçersiz değer gir
        const field = page.locator(`input[name="${test.field}"], textarea[name="${test.field}"]`).first();
        if (await field.count() > 0) {
          await field.fill(test.payload);
          await field.blur();
          await page.waitForTimeout(1000);
          
          // Validation hatası var mı kontrol et
          const errorMessage = await page.locator('text=Hata').count();
          const validationError = await page.locator('text=geçerli').count();
          
          if (errorMessage > 0 || validationError > 0) {
            console.log(`✅ Input validation: ${test.field} - VALIDATED`);
            securityResults.passedTests++;
          } else {
            console.log(`❌ Input validation açığı: ${test.field} - NOT VALIDATED`);
            securityResults.failedTests++;
            securityResults.vulnerabilities.push({
              type: 'INPUT_VALIDATION',
              field: test.field,
              payload: test.payload,
              severity: 'MEDIUM',
              description: `${test.field} alanı geçersiz değer kabul ediyor`
            });
          }
        }
        
      } catch (error) {
        console.log(`⚠️ Input validation test hatası: ${error.message}`);
        securityResults.failedTests++;
      }
    }
    
    // ========================================
    // TEST 6: SESSION SECURITY TESTLERİ
    // ========================================
    console.log('\n🔒 TEST 6: Session Security Testleri');
    console.log('=' .repeat(60));
    
    try {
      securityResults.totalTests++;
      
      // Session token kontrolü
      const cookies = await context.cookies();
      const sessionCookie = cookies.find(cookie => 
        cookie.name.includes('session') || 
        cookie.name.includes('token') || 
        cookie.name.includes('auth')
      );
      
      if (sessionCookie) {
        console.log(`✅ Session cookie bulundu: ${sessionCookie.name}`);
        
        // HttpOnly kontrolü
        if (sessionCookie.httpOnly) {
          console.log('✅ Session cookie HttpOnly: SECURE');
          securityResults.passedTests++;
        } else {
          console.log('⚠️ Session cookie HttpOnly: NOT SECURE');
          securityResults.failedTests++;
          securityResults.vulnerabilities.push({
            type: 'SESSION_SECURITY',
            severity: 'MEDIUM',
            description: 'Session cookie HttpOnly değil'
          });
        }
        
        // Secure kontrolü
        if (sessionCookie.secure) {
          console.log('✅ Session cookie Secure: SECURE');
        } else {
          console.log('⚠️ Session cookie Secure: NOT SECURE');
          securityResults.vulnerabilities.push({
            type: 'SESSION_SECURITY',
            severity: 'LOW',
            description: 'Session cookie Secure değil'
          });
        }
        
      } else {
        console.log('⚠️ Session cookie bulunamadı');
        securityResults.failedTests++;
      }
      
    } catch (error) {
      console.log(`⚠️ Session security test hatası: ${error.message}`);
      securityResults.failedTests++;
    }
    
    // ========================================
    // TEST SONUÇLARI VE RAPOR
    // ========================================
    console.log('\n📊 GÜVENLİK TEST SONUÇLARI');
    console.log('=' .repeat(60));
    
    const successRate = ((securityResults.passedTests / securityResults.totalTests) * 100).toFixed(2);
    securityResults.securityScore = successRate;
    
    console.log(`📈 Toplam Test: ${securityResults.totalTests}`);
    console.log(`✅ Başarılı: ${securityResults.passedTests}`);
    console.log(`❌ Başarısız: ${securityResults.failedTests}`);
    console.log(`📊 Güvenlik Skoru: ${successRate}%`);
    console.log(`🚨 Tespit Edilen Açıklar: ${securityResults.vulnerabilities.length}`);
    
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
    if (securityResults.vulnerabilities.length > 0) {
      console.log('\n🚨 TESPİT EDİLEN GÜVENLİK AÇIKLARI:');
      securityResults.vulnerabilities.forEach((vuln, index) => {
        console.log(`  ${index + 1}. ${vuln.type} (${vuln.severity})`);
        console.log(`     ${vuln.description}`);
        if (vuln.payload) {
          console.log(`     Payload: ${vuln.payload}`);
        }
        if (vuln.url) {
          console.log(`     URL: ${vuln.url}`);
        }
      });
    }
    
    // Console ve network hataları
    console.log(`\n🔍 Console Hataları: ${consoleErrors.length}`);
    console.log(`🌐 Network Hataları: ${networkErrors.length}`);
    
    console.log('\n🎉 GÜVENLİK TESTLERİ TAMAMLANDI!');
    
  } catch (error) {
    console.error('❌ Güvenlik test hatası:', error.message);
    securityResults.errors.push(error.message);
  } finally {
    await browser.close();
  }
  
  return securityResults;
}

comprehensiveSecurityTests().catch(console.error);



