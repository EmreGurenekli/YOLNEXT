const { chromium } = require('playwright');

async function performanceLoadTests() {
  console.log('⚡ PERFORMANS VE YÜK TESTLERİ BAŞLATIYOR...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const results = {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    performanceIssues: [],
    performanceScore: 0,
    loadTestResults: []
  };
  
  try {
    // ========================================
    // TEST 1: SAYFA YÜKLEME PERFORMANSI
    // ========================================
    console.log('🚀 TEST 1: Sayfa Yükleme Performansı');
    console.log('=' .repeat(50));
    
    const pages = [
      { name: 'Ana Sayfa', url: '/' },
      { name: 'Login', url: '/login' },
      { name: 'Register', url: '/register' },
      { name: 'Individual Dashboard', url: '/individual/dashboard' },
      { name: 'Corporate Dashboard', url: '/corporate/dashboard' },
      { name: 'Nakliyeci Dashboard', url: '/nakliyeci/dashboard' },
      { name: 'Tasiyici Dashboard', url: '/tasiyici/dashboard' }
    ];
    
    for (const pageInfo of pages) {
      try {
        results.totalTests++;
        
        const context = await browser.newContext();
        const page = await context.newPage();
        
        // Performance metrics toplama
        await page.goto(`http://localhost:5173${pageInfo.url}`, { 
          waitUntil: 'networkidle' 
        });
        
        // Performance API'den metrikleri al
        const metrics = await page.evaluate(() => {
          const navigation = performance.getEntriesByType('navigation')[0];
          const paint = performance.getEntriesByType('paint');
          
          return {
            loadTime: navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0,
            domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : 0,
            firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
            firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
            memory: performance.memory ? performance.memory.usedJSHeapSize : 0
          };
        });
        
        // Performans değerlendirmesi
        const loadTime = metrics.loadTime;
        const fcp = metrics.firstContentfulPaint;
        
        if (loadTime < 2000 && fcp < 1500) {
          console.log(`✅ ${pageInfo.name}: Hızlı yükleme (${loadTime}ms, FCP: ${fcp}ms)`);
          results.passedTests++;
        } else if (loadTime < 4000 && fcp < 3000) {
          console.log(`⚠️ ${pageInfo.name}: Orta hız (${loadTime}ms, FCP: ${fcp}ms)`);
          results.failedTests++;
          results.performanceIssues.push({
            page: pageInfo.name,
            issue: `Yavaş yükleme: ${loadTime}ms`,
            severity: 'MEDIUM'
          });
        } else {
          console.log(`❌ ${pageInfo.name}: Yavaş yükleme (${loadTime}ms, FCP: ${fcp}ms)`);
          results.failedTests++;
          results.performanceIssues.push({
            page: pageInfo.name,
            issue: `Çok yavaş yükleme: ${loadTime}ms`,
            severity: 'HIGH'
          });
        }
        
        await context.close();
        
      } catch (error) {
        console.log(`⚠️ ${pageInfo.name}: Test hatası - ${error.message}`);
        results.failedTests++;
      }
    }
    
    // ========================================
    // TEST 2: CONCURRENT LOAD TESTİ
    // ========================================
    console.log('\n👥 TEST 2: Concurrent Load Testi');
    console.log('=' .repeat(50));
    
    const concurrentUsers = 10;
    const contexts = [];
    const concurrentPages = [];
    
    // 10 eşzamanlı kullanıcı oluştur
    for (let i = 0; i < concurrentUsers; i++) {
      const context = await browser.newContext();
      const page = await context.newPage();
      contexts.push(context);
      concurrentPages.push(page);
    }
    
    try {
      results.totalTests++;
      
      // Tüm kullanıcılar aynı anda ana sayfaya git
      const startTime = Date.now();
      const loadPromises = concurrentPages.map(async (page, index) => {
        try {
          await page.goto('http://localhost:5173', { 
            waitUntil: 'networkidle' 
          });
          return { success: true, userId: index + 1 };
        } catch (error) {
          return { success: false, userId: index + 1, error: error.message };
        }
      });
      
      const loadResults = await Promise.all(loadPromises);
      const totalTime = Date.now() - startTime;
      const successfulLoads = loadResults.filter(r => r.success).length;
      
      console.log(`📊 Concurrent Load: ${successfulLoads}/${concurrentUsers} başarılı (${totalTime}ms)`);
      
      if (successfulLoads >= concurrentUsers * 0.9) {
        console.log('✅ Concurrent Load: Sistem yük altında stabil');
        results.passedTests++;
      } else if (successfulLoads >= concurrentUsers * 0.7) {
        console.log('⚠️ Concurrent Load: Sistem yük altında orta performans');
        results.failedTests++;
        results.performanceIssues.push({
          page: 'Concurrent Load',
          issue: `${successfulLoads}/${concurrentUsers} başarılı`,
          severity: 'MEDIUM'
        });
      } else {
        console.log('❌ Concurrent Load: Sistem yük altında zayıf performans');
        results.failedTests++;
        results.performanceIssues.push({
          page: 'Concurrent Load',
          issue: `${successfulLoads}/${concurrentUsers} başarılı`,
          severity: 'HIGH'
        });
      }
      
      results.loadTestResults.push({
        concurrentUsers,
        successfulLoads,
        totalTime,
        successRate: (successfulLoads / concurrentUsers) * 100
      });
      
    } catch (error) {
      console.log(`⚠️ Concurrent load test hatası: ${error.message}`);
      results.failedTests++;
    }
    
    // Context'leri kapat
    for (const context of contexts) {
      await context.close();
    }
    
    // ========================================
    // TEST 3: API PERFORMANS TESTİ
    // ========================================
    console.log('\n🔗 TEST 3: API Performans Testi');
    console.log('=' .repeat(50));
    
    const apiEndpoints = [
      '/api/health',
      '/api/shipments',
      '/api/offers',
      '/api/messages',
      '/api/notifications'
    ];
    
    for (const endpoint of apiEndpoints) {
      try {
        results.totalTests++;
        
        const context = await browser.newContext();
        const page = await context.newPage();
        
        const startTime = Date.now();
        const response = await page.request.get(`http://localhost:5000${endpoint}`);
        const responseTime = Date.now() - startTime;
        
        if (response.status() === 200 && responseTime < 1000) {
          console.log(`✅ ${endpoint}: Hızlı yanıt (${responseTime}ms)`);
          results.passedTests++;
        } else if (response.status() === 200 && responseTime < 3000) {
          console.log(`⚠️ ${endpoint}: Orta hız (${responseTime}ms)`);
          results.failedTests++;
          results.performanceIssues.push({
            page: endpoint,
            issue: `Yavaş API yanıtı: ${responseTime}ms`,
            severity: 'MEDIUM'
          });
        } else {
          console.log(`❌ ${endpoint}: Yavaş/hatalı yanıt (${responseTime}ms, ${response.status()})`);
          results.failedTests++;
          results.performanceIssues.push({
            page: endpoint,
            issue: `API hatası: ${response.status()}, ${responseTime}ms`,
            severity: 'HIGH'
          });
        }
        
        await context.close();
        
      } catch (error) {
        console.log(`⚠️ ${endpoint}: Test hatası - ${error.message}`);
        results.failedTests++;
      }
    }
    
    // ========================================
    // TEST 4: MEMORY USAGE TESTİ
    // ========================================
    console.log('\n💾 TEST 4: Memory Usage Testi');
    console.log('=' .repeat(50));
    
    try {
      results.totalTests++;
      
      const context = await browser.newContext();
      const page = await context.newPage();
      
      // Sayfa yükleme öncesi memory
      const initialMemory = await page.evaluate(() => {
        return performance.memory ? performance.memory.usedJSHeapSize : 0;
      });
      
      // Sayfa yükleme sonrası memory
      await page.goto('http://localhost:5173/individual/dashboard');
      await page.waitForLoadState('networkidle');
      
      const finalMemory = await page.evaluate(() => {
        return performance.memory ? performance.memory.usedJSHeapSize : 0;
      });
      
      const memoryUsage = finalMemory - initialMemory;
      const memoryMB = Math.round(memoryUsage / 1024 / 1024);
      
      if (memoryMB < 50) {
        console.log(`✅ Memory Usage: Düşük kullanım (${memoryMB}MB)`);
        results.passedTests++;
      } else if (memoryMB < 100) {
        console.log(`⚠️ Memory Usage: Orta kullanım (${memoryMB}MB)`);
        results.failedTests++;
        results.performanceIssues.push({
          page: 'Memory Usage',
          issue: `Yüksek memory kullanımı: ${memoryMB}MB`,
          severity: 'MEDIUM'
        });
      } else {
        console.log(`❌ Memory Usage: Yüksek kullanım (${memoryMB}MB)`);
        results.failedTests++;
        results.performanceIssues.push({
          page: 'Memory Usage',
          issue: `Çok yüksek memory kullanımı: ${memoryMB}MB`,
          severity: 'HIGH'
        });
      }
      
      await context.close();
      
    } catch (error) {
      console.log(`⚠️ Memory usage test hatası: ${error.message}`);
      results.failedTests++;
    }
    
    // ========================================
    // TEST 5: STRESS TESTİ
    // ========================================
    console.log('\n🔥 TEST 5: Stress Testi');
    console.log('=' .repeat(50));
    
    try {
      results.totalTests++;
      
      const stressUsers = 20;
      const stressContexts = [];
      const stressPages = [];
      
      // 20 eşzamanlı kullanıcı oluştur
      for (let i = 0; i < stressUsers; i++) {
        const context = await browser.newContext();
        const page = await context.newPage();
        stressContexts.push(context);
        stressPages.push(page);
      }
      
      // Stress test - sürekli sayfa yükleme
      const stressStartTime = Date.now();
      const stressPromises = stressPages.map(async (page, index) => {
        try {
          // 5 kez sayfa yükle
          for (let j = 0; j < 5; j++) {
            await page.goto('http://localhost:5173', { 
              waitUntil: 'networkidle',
              timeout: 10000 
            });
            await page.waitForTimeout(1000);
          }
          return { success: true, userId: index + 1 };
        } catch (error) {
          return { success: false, userId: index + 1, error: error.message };
        }
      });
      
      const stressResults = await Promise.all(stressPromises);
      const stressTotalTime = Date.now() - stressStartTime;
      const stressSuccessful = stressResults.filter(r => r.success).length;
      
      console.log(`🔥 Stress Test: ${stressSuccessful}/${stressUsers} başarılı (${stressTotalTime}ms)`);
      
      if (stressSuccessful >= stressUsers * 0.8) {
        console.log('✅ Stress Test: Sistem stress altında stabil');
        results.passedTests++;
      } else if (stressSuccessful >= stressUsers * 0.6) {
        console.log('⚠️ Stress Test: Sistem stress altında orta performans');
        results.failedTests++;
        results.performanceIssues.push({
          page: 'Stress Test',
          issue: `${stressSuccessful}/${stressUsers} başarılı`,
          severity: 'MEDIUM'
        });
      } else {
        console.log('❌ Stress Test: Sistem stress altında zayıf performans');
        results.failedTests++;
        results.performanceIssues.push({
          page: 'Stress Test',
          issue: `${stressSuccessful}/${stressUsers} başarılı`,
          severity: 'HIGH'
        });
      }
      
      // Context'leri kapat
      for (const context of stressContexts) {
        await context.close();
      }
      
    } catch (error) {
      console.log(`⚠️ Stress test hatası: ${error.message}`);
      results.failedTests++;
    }
    
    // ========================================
    // TEST SONUÇLARI
    // ========================================
    console.log('\n📊 PERFORMANS VE YÜK TEST SONUÇLARI');
    console.log('=' .repeat(50));
    
    const successRate = ((results.passedTests / results.totalTests) * 100).toFixed(2);
    results.performanceScore = successRate;
    
    console.log(`📈 Toplam Test: ${results.totalTests}`);
    console.log(`✅ Başarılı: ${results.passedTests}`);
    console.log(`❌ Başarısız: ${results.failedTests}`);
    console.log(`📊 Performans Skoru: ${successRate}%`);
    console.log(`🚨 Tespit Edilen Sorunlar: ${results.performanceIssues.length}`);
    
    // Load test sonuçları
    if (results.loadTestResults.length > 0) {
      console.log('\n📊 LOAD TEST SONUÇLARI:');
      results.loadTestResults.forEach((result, index) => {
        console.log(`  ${index + 1}. ${result.concurrentUsers} kullanıcı: ${result.successfulLoads} başarılı (${result.successRate.toFixed(1)}%)`);
      });
    }
    
    // Performans skoru değerlendirmesi
    console.log('\n🎯 PERFORMANS DEĞERLENDİRMESİ:');
    
    if (successRate >= 95) {
      console.log('🛡️ MÜKEMMEL! Sistem performansı çok iyi!');
      console.log('🌟 Production için hazır!');
    } else if (successRate >= 85) {
      console.log('✅ İYİ! Sistem performansı genel olarak iyi!');
      console.log('🔧 Küçük optimizasyonlar yapılabilir.');
    } else if (successRate >= 70) {
      console.log('⚠️ ORTA! Bazı performans sorunları var.');
      console.log('🚨 Kritik optimizasyonlar yapılmalı.');
    } else {
      console.log('❌ ZAYIF! Sistem performans sorunları var.');
      console.log('🚨 Acil performans optimizasyonları yapılmalı.');
    }
    
    // Tespit edilen sorunlar
    if (results.performanceIssues.length > 0) {
      console.log('\n🚨 TESPİT EDİLEN PERFORMANS SORUNLARI:');
      results.performanceIssues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue.page}: ${issue.issue} (${issue.severity})`);
      });
    }
    
    console.log('\n🎉 PERFORMANS VE YÜK TESTLERİ TAMAMLANDI!');
    
  } catch (error) {
    console.error('❌ Performans ve yük test hatası:', error.message);
  } finally {
    await browser.close();
  }
  
  return results;
}

performanceLoadTests().catch(console.error);
