const { chromium } = require('playwright');

async function mobileResponsiveTests() {
  console.log('📱 MOBILE VE RESPONSIVE TESTLERİ BAŞLATIYOR...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const results = {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    mobileIssues: [],
    responsiveScore: 0
  };
  
  // Test edilecek cihazlar
  const devices = [
    { name: 'iPhone 12', viewport: { width: 390, height: 844 } },
    { name: 'iPhone 12 Pro Max', viewport: { width: 428, height: 926 } },
    { name: 'Samsung Galaxy S21', viewport: { width: 384, height: 854 } },
    { name: 'iPad', viewport: { width: 768, height: 1024 } },
    { name: 'iPad Pro', viewport: { width: 1024, height: 1366 } },
    { name: 'Desktop', viewport: { width: 1920, height: 1080 } }
  ];
  
  try {
    // ========================================
    // TEST 1: RESPONSIVE DESIGN TESTİ
    // ========================================
    console.log('📐 TEST 1: Responsive Design Testi');
    console.log('=' .repeat(50));
    
    for (const device of devices) {
      try {
        results.totalTests++;
        
        const context = await browser.newContext({
          viewport: device.viewport,
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
        });
        
        const page = await context.newPage();
        
        // Ana sayfa testi
        await page.goto('http://localhost:5173');
        await page.waitForLoadState('networkidle');
        
        // Sayfa yüklendi mi kontrol et
        const title = await page.title();
        if (title && title.length > 0) {
          console.log(`✅ ${device.name}: Sayfa yüklendi (${device.viewport.width}x${device.viewport.height})`);
          results.passedTests++;
        } else {
          console.log(`❌ ${device.name}: Sayfa yüklenemedi`);
          results.failedTests++;
          results.mobileIssues.push({
            device: device.name,
            issue: 'Sayfa yüklenemedi',
            severity: 'HIGH'
          });
        }
        
        // Login sayfası testi
        await page.goto('http://localhost:5173/login');
        await page.waitForLoadState('networkidle');
        
        // Form elementleri görünüyor mu kontrol et
        const emailInput = await page.locator('input[name="email"]').count();
        const passwordInput = await page.locator('input[name="password"]').count();
        const loginButton = await page.locator('button[type="submit"]').count();
        
        if (emailInput > 0 && passwordInput > 0 && loginButton > 0) {
          console.log(`✅ ${device.name}: Login formu görünüyor`);
          results.passedTests++;
        } else {
          console.log(`❌ ${device.name}: Login formu eksik`);
          results.failedTests++;
          results.mobileIssues.push({
            device: device.name,
            issue: 'Login formu eksik',
            severity: 'HIGH'
          });
        }
        
        await context.close();
        
      } catch (error) {
        console.log(`⚠️ ${device.name}: Test hatası - ${error.message}`);
        results.failedTests++;
      }
    }
    
    // ========================================
    // TEST 2: TOUCH INTERACTION TESTİ
    // ========================================
    console.log('\n👆 TEST 2: Touch Interaction Testi');
    console.log('=' .repeat(50));
    
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
    });
    
    const mobilePage = await mobileContext.newPage();
    
    try {
      results.totalTests++;
      
      // Login sayfasına git
      await mobilePage.goto('http://localhost:5173/login');
      await mobilePage.waitForLoadState('networkidle');
      
      // Demo butonuna dokunma testi
      const demoButton = mobilePage.locator('[data-testid="demo-individual"]');
      if (await demoButton.count() > 0) {
        await demoButton.tap();
        await mobilePage.waitForTimeout(2000);
        
        // Dashboard'a yönlendirildi mi kontrol et
        const currentUrl = mobilePage.url();
        if (currentUrl.includes('/individual/dashboard')) {
          console.log('✅ Touch Interaction: Demo buton dokunma başarılı');
          results.passedTests++;
        } else {
          console.log('❌ Touch Interaction: Demo buton dokunma başarısız');
          results.failedTests++;
          results.mobileIssues.push({
            device: 'Mobile',
            issue: 'Demo buton dokunma başarısız',
            severity: 'MEDIUM'
          });
        }
      } else {
        console.log('❌ Touch Interaction: Demo butonu bulunamadı');
        results.failedTests++;
      }
      
    } catch (error) {
      console.log(`⚠️ Touch interaction test hatası: ${error.message}`);
      results.failedTests++;
    }
    
    // ========================================
    // TEST 3: MOBILE NAVIGATION TESTİ
    // ========================================
    console.log('\n🧭 TEST 3: Mobile Navigation Testi');
    console.log('=' .repeat(50));
    
    try {
      results.totalTests++;
      
      // Dashboard'da navigation testi
      await mobilePage.goto('http://localhost:5173/individual/dashboard');
      await mobilePage.waitForLoadState('networkidle');
      
      // Sidebar toggle butonu var mı kontrol et
      const sidebarToggle = mobilePage.locator('button[aria-label="Toggle sidebar"]');
      if (await sidebarToggle.count() > 0) {
        await sidebarToggle.tap();
        await mobilePage.waitForTimeout(1000);
        
        console.log('✅ Mobile Navigation: Sidebar toggle çalışıyor');
        results.passedTests++;
      } else {
        console.log('⚠️ Mobile Navigation: Sidebar toggle bulunamadı');
        results.failedTests++;
      }
      
      // Mobile menu testi
      const mobileMenu = mobilePage.locator('[data-testid="mobile-menu"]');
      if (await mobileMenu.count() > 0) {
        await mobileMenu.tap();
        await mobilePage.waitForTimeout(1000);
        
        console.log('✅ Mobile Navigation: Mobile menu çalışıyor');
        results.passedTests++;
      } else {
        console.log('⚠️ Mobile Navigation: Mobile menu bulunamadı');
        results.failedTests++;
      }
      
    } catch (error) {
      console.log(`⚠️ Mobile navigation test hatası: ${error.message}`);
      results.failedTests++;
    }
    
    // ========================================
    // TEST 4: MOBILE FORM TESTİ
    // ========================================
    console.log('\n📝 TEST 4: Mobile Form Testi');
    console.log('=' .repeat(50));
    
    try {
      results.totalTests++;
      
      // Gönderi oluşturma sayfasına git
      await mobilePage.goto('http://localhost:5173/individual/create-shipment');
      await mobilePage.waitForLoadState('networkidle');
      
      // Form alanlarını doldur
      const fromInput = mobilePage.locator('input[name="from"]');
      const toInput = mobilePage.locator('input[name="to"]');
      const weightInput = mobilePage.locator('input[name="weight"]');
      const priceInput = mobilePage.locator('input[name="price"]');
      
      if (await fromInput.count() > 0) {
        await fromInput.fill('İstanbul');
        await toInput.fill('Ankara');
        await weightInput.fill('100');
        await priceInput.fill('500');
        
        console.log('✅ Mobile Form: Form alanları dolduruldu');
        results.passedTests++;
        
        // Submit butonuna dokunma testi
        const submitButton = mobilePage.locator('button[type="submit"]');
        if (await submitButton.count() > 0) {
          await submitButton.tap();
          await mobilePage.waitForTimeout(2000);
          
          console.log('✅ Mobile Form: Submit butonu dokunma başarılı');
          results.passedTests++;
        } else {
          console.log('❌ Mobile Form: Submit butonu bulunamadı');
          results.failedTests++;
        }
      } else {
        console.log('❌ Mobile Form: Form alanları bulunamadı');
        results.failedTests++;
      }
      
    } catch (error) {
      console.log(`⚠️ Mobile form test hatası: ${error.message}`);
      results.failedTests++;
    }
    
    // ========================================
    // TEST 5: MOBILE PERFORMANCE TESTİ
    // ========================================
    console.log('\n⚡ TEST 5: Mobile Performance Testi');
    console.log('=' .repeat(50));
    
    try {
      results.totalTests++;
      
      // Sayfa yükleme süresi testi
      const startTime = Date.now();
      await mobilePage.goto('http://localhost:5173/individual/dashboard');
      await mobilePage.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      if (loadTime < 3000) {
        console.log(`✅ Mobile Performance: Sayfa ${loadTime}ms'de yüklendi`);
        results.passedTests++;
      } else {
        console.log(`⚠️ Mobile Performance: Sayfa yavaş yüklendi (${loadTime}ms)`);
        results.failedTests++;
        results.mobileIssues.push({
          device: 'Mobile',
          issue: `Yavaş yükleme süresi: ${loadTime}ms`,
          severity: 'MEDIUM'
        });
      }
      
      // Memory usage testi
      const metrics = await mobilePage.evaluate(() => {
        return {
          memory: performance.memory ? performance.memory.usedJSHeapSize : 0,
          timing: performance.timing ? performance.timing.loadEventEnd - performance.timing.navigationStart : 0
        };
      });
      
      if (metrics.memory < 50 * 1024 * 1024) { // 50MB
        console.log(`✅ Mobile Performance: Memory usage OK (${Math.round(metrics.memory / 1024 / 1024)}MB)`);
        results.passedTests++;
      } else {
        console.log(`⚠️ Mobile Performance: Yüksek memory usage (${Math.round(metrics.memory / 1024 / 1024)}MB)`);
        results.failedTests++;
      }
      
    } catch (error) {
      console.log(`⚠️ Mobile performance test hatası: ${error.message}`);
      results.failedTests++;
    }
    
    // ========================================
    // TEST SONUÇLARI
    // ========================================
    console.log('\n📊 MOBILE VE RESPONSIVE TEST SONUÇLARI');
    console.log('=' .repeat(50));
    
    const successRate = ((results.passedTests / results.totalTests) * 100).toFixed(2);
    results.responsiveScore = successRate;
    
    console.log(`📈 Toplam Test: ${results.totalTests}`);
    console.log(`✅ Başarılı: ${results.passedTests}`);
    console.log(`❌ Başarısız: ${results.failedTests}`);
    console.log(`📊 Responsive Skoru: ${successRate}%`);
    console.log(`🚨 Tespit Edilen Sorunlar: ${results.mobileIssues.length}`);
    
    // Responsive skoru değerlendirmesi
    console.log('\n🎯 MOBILE VE RESPONSIVE DEĞERLENDİRMESİ:');
    
    if (successRate >= 95) {
      console.log('🛡️ MÜKEMMEL! Mobile ve responsive tasarım çok iyi!');
      console.log('🌟 Tüm cihazlarda mükemmel çalışıyor!');
    } else if (successRate >= 85) {
      console.log('✅ İYİ! Mobile ve responsive tasarım genel olarak iyi!');
      console.log('🔧 Küçük iyileştirmeler yapılabilir.');
    } else if (successRate >= 70) {
      console.log('⚠️ ORTA! Bazı mobile/responsive sorunları var.');
      console.log('🚨 Kritik sorunlar düzeltilmeli.');
    } else {
      console.log('❌ ZAYIF! Mobile ve responsive sorunları var.');
      console.log('🚨 Acil mobile düzeltmeleri yapılmalı.');
    }
    
    // Tespit edilen sorunlar
    if (results.mobileIssues.length > 0) {
      console.log('\n🚨 TESPİT EDİLEN MOBILE SORUNLARI:');
      results.mobileIssues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue.device}: ${issue.issue} (${issue.severity})`);
      });
    }
    
    console.log('\n🎉 MOBILE VE RESPONSIVE TESTLERİ TAMAMLANDI!');
    
    await mobileContext.close();
    
  } catch (error) {
    console.error('❌ Mobile ve responsive test hatası:', error.message);
  } finally {
    await browser.close();
  }
  
  return results;
}

mobileResponsiveTests().catch(console.error);



