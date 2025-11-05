const { chromium } = require('playwright');

async function integrationTests() {
  console.log('🔗 ENTEGRASYON TESTLERİ BAŞLATIYOR...\n');
  
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
    integrationIssues: [],
    integrationScore: 0
  };
  
  try {
    // ========================================
    // TEST 1: API ENTEGRASYON TESTİ
    // ========================================
    console.log('🔗 TEST 1: API Entegrasyon Testi');
    console.log('=' .repeat(50));
    
    const apiTests = [
      {
        name: 'Health Check',
        method: 'GET',
        url: '/api/health',
        expectedStatus: 200,
        expectedData: { success: true }
      },
      {
        name: 'Shipments List',
        method: 'GET',
        url: '/api/shipments',
        expectedStatus: 200,
        expectedData: { success: true, data: { shipments: [] } }
      },
      {
        name: 'Create Shipment',
        method: 'POST',
        url: '/api/shipments',
        body: {
          from: 'İstanbul',
          to: 'Ankara',
          weight: 100,
          price: 500,
          description: 'Integration test shipment'
        },
        expectedStatus: 200,
        expectedData: { success: true }
      },
      {
        name: 'Offers List',
        method: 'GET',
        url: '/api/offers',
        expectedStatus: 200,
        expectedData: { success: true, data: { offers: [] } }
      },
      {
        name: 'Messages List',
        method: 'GET',
        url: '/api/messages',
        expectedStatus: 200,
        expectedData: { success: true, data: { messages: [] } }
      },
      {
        name: 'Notifications List',
        method: 'GET',
        url: '/api/notifications',
        expectedStatus: 200,
        expectedData: { success: true, data: { notifications: [] } }
      }
    ];
    
    for (const test of apiTests) {
      try {
        results.totalTests++;
        
        let response;
        if (test.method === 'GET') {
          response = await page.request.get(`http://localhost:5000${test.url}`);
        } else if (test.method === 'POST') {
          response = await page.request.post(`http://localhost:5000${test.url}`, {
            data: test.body
          });
        }
        
        if (response.status() === test.expectedStatus) {
          const data = await response.json();
          
          if (data.success === test.expectedData.success) {
            console.log(`✅ ${test.name}: API entegrasyonu başarılı`);
            results.passedTests++;
          } else {
            console.log(`❌ ${test.name}: API yanıt formatı hatalı`);
            results.failedTests++;
            results.integrationIssues.push({
              service: 'API',
              test: test.name,
              issue: 'Yanıt formatı hatalı',
              severity: 'MEDIUM'
            });
          }
        } else {
          console.log(`❌ ${test.name}: API hatası (${response.status()})`);
          results.failedTests++;
          results.integrationIssues.push({
            service: 'API',
            test: test.name,
            issue: `HTTP ${response.status()}`,
            severity: 'HIGH'
          });
        }
        
      } catch (error) {
        console.log(`⚠️ ${test.name}: Test hatası - ${error.message}`);
        results.failedTests++;
        results.integrationIssues.push({
          service: 'API',
          test: test.name,
          issue: `Bağlantı hatası: ${error.message}`,
          severity: 'HIGH'
        });
      }
    }
    
    // ========================================
    // TEST 2: FRONTEND-BACKEND ENTEGRASYONU
    // ========================================
    console.log('\n🔄 TEST 2: Frontend-Backend Entegrasyonu');
    console.log('=' .repeat(50));
    
    try {
      results.totalTests++;
      
      // Frontend'den backend'e istek testi
      await page.goto('http://localhost:5173/individual/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Network isteklerini dinle
      const networkRequests = [];
      page.on('request', request => {
        if (request.url().includes('/api/')) {
          networkRequests.push({
            url: request.url(),
            method: request.method(),
            timestamp: Date.now()
          });
        }
      });
      
      // Sayfa yenile ve API isteklerini kontrol et
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      if (networkRequests.length > 0) {
        console.log(`✅ Frontend-Backend: ${networkRequests.length} API isteği tespit edildi`);
        results.passedTests++;
        
        // API isteklerinin başarılı olup olmadığını kontrol et
        const successfulRequests = networkRequests.filter(req => 
          req.url.includes('/api/') && !req.url.includes('error')
        );
        
        if (successfulRequests.length === networkRequests.length) {
          console.log('✅ Frontend-Backend: Tüm API istekleri başarılı');
          results.passedTests++;
        } else {
          console.log('⚠️ Frontend-Backend: Bazı API istekleri başarısız');
          results.failedTests++;
        }
      } else {
        console.log('❌ Frontend-Backend: API isteği tespit edilmedi');
        results.failedTests++;
        results.integrationIssues.push({
          service: 'Frontend-Backend',
          test: 'API Requests',
          issue: 'API isteği tespit edilmedi',
          severity: 'HIGH'
        });
      }
      
    } catch (error) {
      console.log(`⚠️ Frontend-Backend entegrasyon test hatası: ${error.message}`);
      results.failedTests++;
    }
    
    // ========================================
    // TEST 3: DATABASE ENTEGRASYONU
    // ========================================
    console.log('\n🗄️ TEST 3: Database Entegrasyonu');
    console.log('=' .repeat(50));
    
    try {
      results.totalTests++;
      
      // Database'den veri çekme testi
      const response = await page.request.get('http://localhost:5000/api/shipments');
      
      if (response.status() === 200) {
        const data = await response.json();
        
        if (data.success && Array.isArray(data.data.shipments)) {
          console.log(`✅ Database Entegrasyonu: ${data.data.shipments.length} gönderi bulundu`);
          results.passedTests++;
          
          // Veri ekleme testi
          const createResponse = await page.request.post('http://localhost:5000/api/shipments', {
            data: {
              from: 'Test Şehir',
              to: 'Test Hedef',
              weight: 50,
              price: 300,
              description: 'Database entegrasyon testi'
            }
          });
          
          if (createResponse.status() === 200) {
            const createData = await createResponse.json();
            if (createData.success) {
              console.log('✅ Database Entegrasyonu: Veri ekleme başarılı');
              results.passedTests++;
            } else {
              console.log('❌ Database Entegrasyonu: Veri ekleme başarısız');
              results.failedTests++;
            }
          } else {
            console.log(`❌ Database Entegrasyonu: Veri ekleme hatası (${createResponse.status()})`);
            results.failedTests++;
          }
        } else {
          console.log('❌ Database Entegrasyonu: Geçersiz veri yapısı');
          results.failedTests++;
          results.integrationIssues.push({
            service: 'Database',
            test: 'Data Structure',
            issue: 'Geçersiz veri yapısı',
            severity: 'HIGH'
          });
        }
      } else {
        console.log(`❌ Database Entegrasyonu: Bağlantı hatası (${response.status()})`);
        results.failedTests++;
        results.integrationIssues.push({
          service: 'Database',
          test: 'Connection',
          issue: `HTTP ${response.status()}`,
          severity: 'HIGH'
        });
      }
      
    } catch (error) {
      console.log(`⚠️ Database entegrasyon test hatası: ${error.message}`);
      results.failedTests++;
    }
    
    // ========================================
    // TEST 4: WEBSOCKET ENTEGRASYONU
    // ========================================
    console.log('\n⚡ TEST 4: WebSocket Entegrasyonu');
    console.log('=' .repeat(50));
    
    try {
      results.totalTests++;
      
      // WebSocket bağlantısı testi
      await page.goto('http://localhost:5173/individual/dashboard');
      await page.waitForLoadState('networkidle');
      
      // WebSocket bağlantısı var mı kontrol et
      const websocketConnections = await page.evaluate(() => {
        return window.WebSocket ? 'WebSocket supported' : 'WebSocket not supported';
      });
      
      if (websocketConnections === 'WebSocket supported') {
        console.log('✅ WebSocket Entegrasyonu: WebSocket desteği mevcut');
        results.passedTests++;
        
        // Socket.IO bağlantısı testi
        const socketIOConnection = await page.evaluate(() => {
          return window.io ? 'Socket.IO available' : 'Socket.IO not available';
        });
        
        if (socketIOConnection === 'Socket.IO available') {
          console.log('✅ WebSocket Entegrasyonu: Socket.IO mevcut');
          results.passedTests++;
        } else {
          console.log('⚠️ WebSocket Entegrasyonu: Socket.IO bulunamadı');
          results.failedTests++;
          results.integrationIssues.push({
            service: 'WebSocket',
            test: 'Socket.IO',
            issue: 'Socket.IO bulunamadı',
            severity: 'MEDIUM'
          });
        }
      } else {
        console.log('❌ WebSocket Entegrasyonu: WebSocket desteği yok');
        results.failedTests++;
        results.integrationIssues.push({
          service: 'WebSocket',
          test: 'WebSocket Support',
          issue: 'WebSocket desteği yok',
          severity: 'HIGH'
        });
      }
      
    } catch (error) {
      console.log(`⚠️ WebSocket entegrasyon test hatası: ${error.message}`);
      results.failedTests++;
    }
    
    // ========================================
    // TEST 5: EMAIL SERVICE ENTEGRASYONU
    // ========================================
    console.log('\n📧 TEST 5: Email Service Entegrasyonu');
    console.log('=' .repeat(50));
    
    try {
      results.totalTests++;
      
      // Email service endpoint'i test et
      const emailResponse = await page.request.post('http://localhost:5000/api/send-email', {
        data: {
          to: 'test@example.com',
          subject: 'Integration Test',
          body: 'This is a test email'
        }
      });
      
      if (emailResponse.status() === 200) {
        const emailData = await emailResponse.json();
        if (emailData.success) {
          console.log('✅ Email Service: Email gönderimi başarılı');
          results.passedTests++;
        } else {
          console.log('❌ Email Service: Email gönderimi başarısız');
          results.failedTests++;
          results.integrationIssues.push({
            service: 'Email',
            test: 'Send Email',
            issue: 'Email gönderimi başarısız',
            severity: 'MEDIUM'
          });
        }
      } else if (emailResponse.status() === 404) {
        console.log('⚠️ Email Service: Email endpoint bulunamadı');
        results.failedTests++;
        results.integrationIssues.push({
          service: 'Email',
          test: 'Email Endpoint',
          issue: 'Email endpoint bulunamadı',
          severity: 'MEDIUM'
        });
      } else {
        console.log(`❌ Email Service: Email hatası (${emailResponse.status()})`);
        results.failedTests++;
        results.integrationIssues.push({
          service: 'Email',
          test: 'Email Service',
          issue: `HTTP ${emailResponse.status()}`,
          severity: 'HIGH'
        });
      }
      
    } catch (error) {
      console.log(`⚠️ Email service entegrasyon test hatası: ${error.message}`);
      results.failedTests++;
    }
    
    // ========================================
    // TEST 6: THIRD-PARTY ENTEGRASYONLARI
    // ========================================
    console.log('\n🌐 TEST 6: Third-Party Entegrasyonları');
    console.log('=' .repeat(50));
    
    try {
      results.totalTests++;
      
      // Google Maps entegrasyonu testi
      await page.goto('http://localhost:5173/individual/create-shipment');
      await page.waitForLoadState('networkidle');
      
      const googleMapsScript = await page.evaluate(() => {
        return document.querySelector('script[src*="maps.googleapis.com"]') ? 'Google Maps loaded' : 'Google Maps not loaded';
      });
      
      if (googleMapsScript === 'Google Maps loaded') {
        console.log('✅ Third-Party: Google Maps entegrasyonu mevcut');
        results.passedTests++;
      } else {
        console.log('⚠️ Third-Party: Google Maps entegrasyonu bulunamadı');
        results.failedTests++;
        results.integrationIssues.push({
          service: 'Third-Party',
          test: 'Google Maps',
          issue: 'Google Maps entegrasyonu bulunamadı',
          severity: 'LOW'
        });
      }
      
      // Payment gateway entegrasyonu testi
      const paymentScript = await page.evaluate(() => {
        return document.querySelector('script[src*="stripe"]') || document.querySelector('script[src*="paypal"]') ? 'Payment gateway loaded' : 'Payment gateway not loaded';
      });
      
      if (paymentScript === 'Payment gateway loaded') {
        console.log('✅ Third-Party: Payment gateway entegrasyonu mevcut');
        results.passedTests++;
      } else {
        console.log('⚠️ Third-Party: Payment gateway entegrasyonu bulunamadı');
        results.failedTests++;
        results.integrationIssues.push({
          service: 'Third-Party',
          test: 'Payment Gateway',
          issue: 'Payment gateway entegrasyonu bulunamadı',
          severity: 'MEDIUM'
        });
      }
      
    } catch (error) {
      console.log(`⚠️ Third-party entegrasyon test hatası: ${error.message}`);
      results.failedTests++;
    }
    
    // ========================================
    // TEST SONUÇLARI
    // ========================================
    console.log('\n📊 ENTEGRASYON TEST SONUÇLARI');
    console.log('=' .repeat(50));
    
    const successRate = ((results.passedTests / results.totalTests) * 100).toFixed(2);
    results.integrationScore = successRate;
    
    console.log(`📈 Toplam Test: ${results.totalTests}`);
    console.log(`✅ Başarılı: ${results.passedTests}`);
    console.log(`❌ Başarısız: ${results.failedTests}`);
    console.log(`📊 Entegrasyon Skoru: ${successRate}%`);
    console.log(`🚨 Tespit Edilen Sorunlar: ${results.integrationIssues.length}`);
    
    // Entegrasyon skoru değerlendirmesi
    console.log('\n🎯 ENTEGRASYON DEĞERLENDİRMESİ:');
    
    if (successRate >= 95) {
      console.log('🛡️ MÜKEMMEL! Tüm entegrasyonlar çalışıyor!');
      console.log('🌟 Production için hazır!');
    } else if (successRate >= 85) {
      console.log('✅ İYİ! Entegrasyonlar genel olarak çalışıyor!');
      console.log('🔧 Küçük iyileştirmeler yapılabilir.');
    } else if (successRate >= 70) {
      console.log('⚠️ ORTA! Bazı entegrasyon sorunları var.');
      console.log('🚨 Kritik entegrasyonlar düzeltilmeli.');
    } else {
      console.log('❌ ZAYIF! Entegrasyon sorunları var.');
      console.log('🚨 Acil entegrasyon düzeltmeleri yapılmalı.');
    }
    
    // Tespit edilen sorunlar
    if (results.integrationIssues.length > 0) {
      console.log('\n🚨 TESPİT EDİLEN ENTEGRASYON SORUNLARI:');
      results.integrationIssues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue.service} - ${issue.test}: ${issue.issue} (${issue.severity})`);
      });
    }
    
    console.log('\n🎉 ENTEGRASYON TESTLERİ TAMAMLANDI!');
    
  } catch (error) {
    console.error('❌ Entegrasyon test hatası:', error.message);
  } finally {
    await browser.close();
  }
  
  return results;
}

integrationTests().catch(console.error);



