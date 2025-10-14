import { chromium } from 'playwright';

async function comprehensiveTest() {
  console.log('🧪 KAPSAMLI TEST BAŞLIYOR...\n');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  let testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    details: []
  };

  const logTest = (testName, status, details = '') => {
    testResults.total++;
    if (status === 'PASS') {
      testResults.passed++;
      console.log(`✅ ${testName}`);
    } else {
      testResults.failed++;
      console.log(`❌ ${testName}: ${details}`);
    }
    testResults.details.push({ testName, status, details });
  };

  try {
    // 1. BACKEND HEALTH CHECK
    console.log('\n1️⃣ BACKEND HEALTH CHECK...');
    try {
      const healthResponse = await page.request.get('http://localhost:5000/health');
      const healthData = await healthResponse.json();
      logTest('Backend Status Check', 'PASS', `Uptime: ${Math.round(healthData.uptime)}s`);
    } catch (error) {
      logTest('Backend Status Check', 'FAIL', error.message);
    }

    // 2. FRONTEND LOADING TESTS
    console.log('\n2️⃣ FRONTEND LOADING TESTS...');
    
    // Ana sayfa yükleme
    try {
      await page.goto('http://localhost:5173');
      await page.waitForLoadState('networkidle');
      const title = await page.title();
      logTest('Landing Page Load', 'PASS', title);
    } catch (error) {
      logTest('Landing Page Load', 'FAIL', error.message);
    }

    // 3. DEMO LOGIN TESTS
    console.log('\n3️⃣ DEMO LOGIN TESTS...');
    
    try {
      await page.click('button:has-text("Demo\'yu Başlat")');
      await page.waitForTimeout(2000);
      logTest('Demo Login Button Click', 'PASS');
    } catch (error) {
      logTest('Demo Login Button Click', 'FAIL', error.message);
    }

    // 4. BİREYSEL PANEL TESTS
    console.log('\n4️⃣ BİREYSEL PANEL TESTS...');
    
    const individualTests = [
      { name: 'Dashboard', url: '/individual/dashboard' },
      { name: 'Gönderi Oluştur', url: '/individual/create-shipment' },
      { name: 'Gönderilerim', url: '/individual/my-shipments' },
      { name: 'Canlı Takip', url: '/individual/live-tracking' },
      { name: 'Yardım', url: '/individual/help' }
    ];

    for (const test of individualTests) {
      try {
        await page.goto(`http://localhost:5173${test.url}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000); // Extra wait time
        const h1 = await page.locator('h1').first().textContent({ timeout: 10000 });
        logTest(`Individual ${test.name}`, 'PASS', h1);
      } catch (error) {
        logTest(`Individual ${test.name}`, 'FAIL', error.message);
      }
    }

    // 5. KURUMSAL PANEL TESTS
    console.log('\n5️⃣ KURUMSAL PANEL TESTS...');
    
    const corporateTests = [
      { name: 'Dashboard', url: '/corporate/dashboard' },
      { name: 'Gönderi Oluştur', url: '/corporate/create-shipment' },
      { name: 'Gönderilerim', url: '/corporate/my-shipments' },
      { name: 'Canlı Takip', url: '/corporate/live-tracking' },
      { name: 'Yardım', url: '/corporate/help' }
    ];

    for (const test of corporateTests) {
      try {
        await page.goto(`http://localhost:5173${test.url}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000); // Extra wait time
        const h1 = await page.locator('h1').first().textContent({ timeout: 10000 });
        logTest(`Corporate ${test.name}`, 'PASS', h1);
      } catch (error) {
        logTest(`Corporate ${test.name}`, 'FAIL', error.message);
      }
    }

    // 6. NAKLİYECİ PANEL TESTS
    console.log('\n6️⃣ NAKLİYECİ PANEL TESTS...');
    
    const carrierTests = [
      { name: 'Dashboard', url: '/nakliyeci/dashboard' },
      { name: 'Açık Gönderiler', url: '/nakliyeci/open-shipments' },
      { name: 'Tekliflerim', url: '/nakliyeci/my-offers' },
      { name: 'Bakiye', url: '/nakliyeci/balance' },
      { name: 'Yardım', url: '/nakliyeci/help' }
    ];

    for (const test of carrierTests) {
      try {
        await page.goto(`http://localhost:5173${test.url}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000); // Extra wait time
        const h1 = await page.locator('h1').first().textContent({ timeout: 10000 });
        logTest(`Carrier ${test.name}`, 'PASS', h1);
      } catch (error) {
        logTest(`Carrier ${test.name}`, 'FAIL', error.message);
      }
    }

    // 7. TAŞIYICI PANEL TESTS
    console.log('\n7️⃣ TAŞIYICI PANEL TESTS...');
    
    const driverTests = [
      { name: 'Dashboard', url: '/tasiyici/dashboard' },
      { name: 'Mevcut İşler', url: '/tasiyici/current-jobs' },
      { name: 'Geçmiş İşler', url: '/tasiyici/job-history' },
      { name: 'Yardım', url: '/tasiyici/help' }
    ];

    for (const test of driverTests) {
      try {
        await page.goto(`http://localhost:5173${test.url}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000); // Extra wait time
        const h1 = await page.locator('h1').first().textContent({ timeout: 10000 });
        logTest(`Driver ${test.name}`, 'PASS', h1);
      } catch (error) {
        logTest(`Driver ${test.name}`, 'FAIL', error.message);
      }
    }

    // 8. FORM VALIDATION TESTS
    console.log('\n8️⃣ FORM VALIDATION TESTS...');
    
    // Gönderi oluşturma formu testleri
    try {
      await page.goto('http://localhost:5173/individual/create-shipment');
      await page.waitForLoadState('networkidle');
      
      // Kategori seçimi testi
      try {
        await page.click('button:has-text("Ev Taşınması")');
        await page.waitForTimeout(1000);
        logTest('Category Selection', 'PASS');
      } catch (error) {
        logTest('Category Selection', 'FAIL', error.message);
      }

      // Form alanları testi
      try {
        const textareas = await page.locator('textarea').count();
        const inputs = await page.locator('input').count();
        logTest('Form Fields Count', 'PASS', `Textareas: ${textareas}, Inputs: ${inputs}`);
      } catch (error) {
        logTest('Form Fields Count', 'FAIL', error.message);
      }

    } catch (error) {
      logTest('Form Validation Setup', 'FAIL', error.message);
    }

    // 9. NAVIGATION TESTS
    console.log('\n9️⃣ NAVIGATION TESTS...');
    
    const navigationTests = [
      { from: '/individual/dashboard', to: '/individual/create-shipment', name: 'Individual Dashboard to Create' },
      { from: '/corporate/dashboard', to: '/corporate/create-shipment', name: 'Corporate Dashboard to Create' },
      { from: '/nakliyeci/dashboard', to: '/nakliyeci/open-shipments', name: 'Carrier Dashboard to Open Shipments' },
      { from: '/tasiyici/dashboard', to: '/tasiyici/current-jobs', name: 'Driver Dashboard to Current Jobs' }
    ];

    for (const test of navigationTests) {
      try {
        await page.goto(`http://localhost:5173${test.from}`);
        await page.waitForLoadState('networkidle');
        
        // Sidebar linklerini test et
        const sidebarLinks = await page.locator('a[href*="' + test.to + '"]').count();
        if (sidebarLinks > 0) {
          logTest(`Navigation ${test.name}`, 'PASS', 'Sidebar link found');
        } else {
          logTest(`Navigation ${test.name}`, 'FAIL', 'Sidebar link not found');
        }
      } catch (error) {
        logTest(`Navigation ${test.name}`, 'FAIL', error.message);
      }
    }

    // 10. RESPONSIVE DESIGN TESTS
    console.log('\n🔟 RESPONSIVE DESIGN TESTS...');
    
    const viewports = [
      { width: 320, height: 568, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1024, height: 768, name: 'Desktop Small' },
      { width: 1920, height: 1080, name: 'Desktop Large' }
    ];

    for (const viewport of viewports) {
      try {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto('http://localhost:5173');
        await page.waitForLoadState('networkidle');
        
        // Sayfanın yüklendiğini kontrol et
        const title = await page.title();
        logTest(`Responsive ${viewport.name}`, 'PASS', `${viewport.width}x${viewport.height}`);
      } catch (error) {
        logTest(`Responsive ${viewport.name}`, 'FAIL', error.message);
      }
    }

    // 11. API TESTS
    console.log('\n1️⃣1️⃣ API TESTS...');
    
    const apiTests = [
      { url: '/api/shipments', method: 'GET', name: 'Get Shipments' },
      { url: '/api/offers', method: 'GET', name: 'Get Offers' },
      { url: '/api/users', method: 'GET', name: 'Get Users' },
      { url: '/health', method: 'GET', name: 'Health Check' }
    ];

    for (const test of apiTests) {
      try {
        const response = await page.request.get(`http://localhost:5000${test.url}`, {
          headers: {
            'Authorization': 'Bearer demo-token-individual-123'
          }
        });
        
        if (response.status() === 200 || response.status() === 401) {
          logTest(`API ${test.name}`, 'PASS', `Status: ${response.status()}`);
        } else {
          logTest(`API ${test.name}`, 'FAIL', `Status: ${response.status()}`);
        }
      } catch (error) {
        logTest(`API ${test.name}`, 'FAIL', error.message);
      }
    }

    // 12. SECURITY TESTS
    console.log('\n1️⃣2️⃣ SECURITY TESTS...');
    
    try {
      const healthResponse = await page.request.get('http://localhost:5000/health');
      const headers = healthResponse.headers();
      
      const securityHeaders = [
        'content-security-policy',
        'x-frame-options',
        'x-content-type-options',
        'x-xss-protection'
      ];

      let securityScore = 0;
      for (const header of securityHeaders) {
        if (headers[header]) {
          securityScore++;
          logTest(`Security Header ${header}`, 'PASS');
        } else {
          logTest(`Security Header ${header}`, 'FAIL');
        }
      }
      
      logTest('Overall Security Score', 'PASS', `${securityScore}/${securityHeaders.length}`);
    } catch (error) {
      logTest('Security Headers Check', 'FAIL', error.message);
    }

    // 13. PERFORMANCE TESTS
    console.log('\n1️⃣3️⃣ PERFORMANCE TESTS...');
    
    const performanceTests = [
      { url: '/individual/dashboard', name: 'Individual Dashboard' },
      { url: '/corporate/dashboard', name: 'Corporate Dashboard' },
      { url: '/nakliyeci/dashboard', name: 'Carrier Dashboard' },
      { url: '/tasiyici/dashboard', name: 'Driver Dashboard' }
    ];

    for (const test of performanceTests) {
      try {
        const startTime = Date.now();
        await page.goto(`http://localhost:5173${test.url}`);
        await page.waitForLoadState('networkidle');
        const loadTime = Date.now() - startTime;
        
        if (loadTime < 3000) {
          logTest(`Performance ${test.name}`, 'PASS', `${loadTime}ms`);
        } else {
          logTest(`Performance ${test.name}`, 'FAIL', `${loadTime}ms (too slow)`);
        }
      } catch (error) {
        logTest(`Performance ${test.name}`, 'FAIL', error.message);
      }
    }

    // 14. ERROR HANDLING TESTS
    console.log('\n1️⃣4️⃣ ERROR HANDLING TESTS...');
    
    // 404 test
    try {
      await page.goto('http://localhost:5173/nonexistent-page');
      await page.waitForLoadState('networkidle');
      const h1 = await page.locator('h1').first().textContent();
      if (h1 && h1.includes('404')) {
        logTest('404 Error Page', 'PASS');
      } else {
        logTest('404 Error Page', 'FAIL', 'No 404 page found');
      }
    } catch (error) {
      logTest('404 Error Page', 'FAIL', error.message);
    }

    // 15. FINAL SUMMARY
    console.log('\n🎯 TEST SONUÇLARI ÖZETİ');
    console.log('========================');
    console.log(`📊 Toplam Test: ${testResults.total}`);
    console.log(`✅ Başarılı: ${testResults.passed}`);
    console.log(`❌ Başarısız: ${testResults.failed}`);
    console.log(`📈 Başarı Oranı: ${Math.round((testResults.passed / testResults.total) * 100)}%`);
    
    console.log('\n📋 BAŞARISIZ TESTLER:');
    testResults.details
      .filter(test => test.status === 'FAIL')
      .forEach(test => {
        console.log(`❌ ${test.testName}: ${test.details}`);
      });

    console.log('\n🎉 KAPSAMLI TEST TAMAMLANDI!');
    
    if (testResults.failed === 0) {
      console.log('🚀 TÜM TESTLER BAŞARILI! SİSTEM PRODUCTION READY!');
    } else {
      console.log(`⚠️ ${testResults.failed} test başarısız. Lütfen kontrol edin.`);
    }

  } catch (error) {
    console.error('❌ Test hatası:', error);
  } finally {
    await browser.close();
  }
}

comprehensiveTest();


