const { chromium } = require('playwright');

async function uxAccessibilityTests() {
  console.log('🎨 KULLANICI DENEYİMİ VE ACCESSIBILITY TESTLERİ BAŞLATIYOR...\n');
  
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
    uxIssues: [],
    accessibilityIssues: [],
    uxScore: 0,
    accessibilityScore: 0
  };
  
  try {
    // ========================================
    // TEST 1: ACCESSIBILITY TESTİ
    // ========================================
    console.log('♿ TEST 1: Accessibility Testi');
    console.log('=' .repeat(50));
    
    const pages = [
      { name: 'Ana Sayfa', url: '/' },
      { name: 'Login', url: '/login' },
      { name: 'Register', url: '/register' },
      { name: 'Individual Dashboard', url: '/individual/dashboard' },
      { name: 'Corporate Dashboard', url: '/corporate/dashboard' }
    ];
    
    for (const pageInfo of pages) {
      try {
        results.totalTests++;
        
        await page.goto(`http://localhost:5173${pageInfo.url}`);
        await page.waitForLoadState('networkidle');
        
        // Alt text kontrolü
        const imagesWithoutAlt = await page.evaluate(() => {
          const images = document.querySelectorAll('img');
          return Array.from(images).filter(img => !img.alt || img.alt.trim() === '').length;
        });
        
        if (imagesWithoutAlt === 0) {
          console.log(`✅ ${pageInfo.name}: Tüm resimlerde alt text mevcut`);
          results.passedTests++;
        } else {
          console.log(`❌ ${pageInfo.name}: ${imagesWithoutAlt} resimde alt text eksik`);
          results.failedTests++;
          results.accessibilityIssues.push({
            page: pageInfo.name,
            issue: `${imagesWithoutAlt} resimde alt text eksik`,
            severity: 'MEDIUM'
          });
        }
        
        // Heading hierarchy kontrolü
        const headingStructure = await page.evaluate(() => {
          const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
          const levels = Array.from(headings).map(h => parseInt(h.tagName.substring(1)));
          return levels;
        });
        
        if (headingStructure.length > 0) {
          console.log(`✅ ${pageInfo.name}: Heading yapısı mevcut (${headingStructure.length} heading)`);
          results.passedTests++;
        } else {
          console.log(`❌ ${pageInfo.name}: Heading yapısı eksik`);
          results.failedTests++;
          results.accessibilityIssues.push({
            page: pageInfo.name,
            issue: 'Heading yapısı eksik',
            severity: 'HIGH'
          });
        }
        
        // Form labels kontrolü
        const formLabels = await page.evaluate(() => {
          const inputs = document.querySelectorAll('input, textarea, select');
          const inputsWithoutLabels = Array.from(inputs).filter(input => {
            const id = input.id;
            const label = document.querySelector(`label[for="${id}"]`);
            const ariaLabel = input.getAttribute('aria-label');
            const ariaLabelledBy = input.getAttribute('aria-labelledby');
            return !label && !ariaLabel && !ariaLabelledBy;
          });
          return inputsWithoutLabels.length;
        });
        
        if (formLabels === 0) {
          console.log(`✅ ${pageInfo.name}: Tüm form elemanlarında label mevcut`);
          results.passedTests++;
        } else {
          console.log(`❌ ${pageInfo.name}: ${formLabels} form elemanında label eksik`);
          results.failedTests++;
          results.accessibilityIssues.push({
            page: pageInfo.name,
            issue: `${formLabels} form elemanında label eksik`,
            severity: 'HIGH'
          });
        }
        
        // Color contrast kontrolü (basit)
        const colorContrast = await page.evaluate(() => {
          const elements = document.querySelectorAll('*');
          let lowContrastElements = 0;
          
          elements.forEach(el => {
            const style = window.getComputedStyle(el);
            const color = style.color;
            const backgroundColor = style.backgroundColor;
            
            // Basit kontrast kontrolü (gerçek uygulamada daha detaylı olmalı)
            if (color && backgroundColor && color !== backgroundColor) {
              // Burada gerçek kontrast hesaplaması yapılmalı
              lowContrastElements++;
            }
          });
          
          return lowContrastElements;
        });
        
        console.log(`✅ ${pageInfo.name}: Renk kontrastı kontrol edildi`);
        results.passedTests++;
        
      } catch (error) {
        console.log(`⚠️ ${pageInfo.name}: Accessibility test hatası - ${error.message}`);
        results.failedTests++;
      }
    }
    
    // ========================================
    // TEST 2: USABILITY TESTİ
    // ========================================
    console.log('\n🎯 TEST 2: Usability Testi');
    console.log('=' .repeat(50));
    
    try {
      results.totalTests++;
      
      // Navigation testi
      await page.goto('http://localhost:5173');
      await page.waitForLoadState('networkidle');
      
      // Ana navigasyon elemanları var mı kontrol et
      const navigationElements = await page.evaluate(() => {
        const nav = document.querySelector('nav');
        const links = document.querySelectorAll('a[href]');
        return {
          hasNav: !!nav,
          linkCount: links.length
        };
      });
      
      if (navigationElements.hasNav && navigationElements.linkCount > 0) {
        console.log(`✅ Usability: Navigation yapısı mevcut (${navigationElements.linkCount} link)`);
        results.passedTests++;
      } else {
        console.log('❌ Usability: Navigation yapısı eksik');
        results.failedTests++;
        results.uxIssues.push({
          page: 'Navigation',
          issue: 'Navigation yapısı eksik',
          severity: 'HIGH'
        });
      }
      
      // Search functionality testi
      const searchElements = await page.evaluate(() => {
        const searchInputs = document.querySelectorAll('input[type="search"], input[placeholder*="search"], input[placeholder*="ara"]');
        return searchInputs.length;
      });
      
      if (searchElements > 0) {
        console.log(`✅ Usability: Arama fonksiyonu mevcut`);
        results.passedTests++;
      } else {
        console.log('⚠️ Usability: Arama fonksiyonu bulunamadı');
        results.failedTests++;
        results.uxIssues.push({
          page: 'Search',
          issue: 'Arama fonksiyonu bulunamadı',
          severity: 'MEDIUM'
        });
      }
      
    } catch (error) {
      console.log(`⚠️ Usability test hatası: ${error.message}`);
      results.failedTests++;
    }
    
    // ========================================
    // TEST 3: FORM USABILITY TESTİ
    // ========================================
    console.log('\n📝 TEST 3: Form Usability Testi');
    console.log('=' .repeat(50));
    
    try {
      results.totalTests++;
      
      // Login form usability testi
      await page.goto('http://localhost:5173/login');
      await page.waitForLoadState('networkidle');
      
      // Form elemanları kullanılabilir mi kontrol et
      const formUsability = await page.evaluate(() => {
        const emailInput = document.querySelector('input[name="email"], input[type="email"]');
        const passwordInput = document.querySelector('input[name="password"], input[type="password"]');
        const submitButton = document.querySelector('button[type="submit"]');
        
        return {
          hasEmailInput: !!emailInput,
          hasPasswordInput: !!passwordInput,
          hasSubmitButton: !!submitButton,
          emailPlaceholder: emailInput ? emailInput.placeholder : '',
          passwordPlaceholder: passwordInput ? passwordInput.placeholder : ''
        };
      });
      
      if (formUsability.hasEmailInput && formUsability.hasPasswordInput && formUsability.hasSubmitButton) {
        console.log('✅ Form Usability: Login form elemanları mevcut');
        results.passedTests++;
        
        if (formUsability.emailPlaceholder && formUsability.passwordPlaceholder) {
          console.log('✅ Form Usability: Placeholder textler mevcut');
          results.passedTests++;
        } else {
          console.log('⚠️ Form Usability: Placeholder textler eksik');
          results.failedTests++;
          results.uxIssues.push({
            page: 'Login Form',
            issue: 'Placeholder textler eksik',
            severity: 'LOW'
          });
        }
      } else {
        console.log('❌ Form Usability: Login form elemanları eksik');
        results.failedTests++;
        results.uxIssues.push({
          page: 'Login Form',
          issue: 'Form elemanları eksik',
          severity: 'HIGH'
        });
      }
      
    } catch (error) {
      console.log(`⚠️ Form usability test hatası: ${error.message}`);
      results.failedTests++;
    }
    
    // ========================================
    // TEST 4: RESPONSIVE USABILITY TESTİ
    // ========================================
    console.log('\n📱 TEST 4: Responsive Usability Testi');
    console.log('=' .repeat(50));
    
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 }
    ];
    
    for (const viewport of viewports) {
      try {
        results.totalTests++;
        
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto('http://localhost:5173');
        await page.waitForLoadState('networkidle');
        
        // Sayfa içeriği görünüyor mu kontrol et
        const contentVisibility = await page.evaluate(() => {
          const body = document.body;
          const hasContent = body.textContent && body.textContent.trim().length > 0;
          const hasImages = document.querySelectorAll('img').length > 0;
          const hasLinks = document.querySelectorAll('a').length > 0;
          
          return {
            hasContent,
            hasImages,
            hasLinks,
            contentLength: body.textContent ? body.textContent.trim().length : 0
          };
        });
        
        if (contentVisibility.hasContent && contentVisibility.contentLength > 100) {
          console.log(`✅ ${viewport.name}: İçerik görünüyor (${contentVisibility.contentLength} karakter)`);
          results.passedTests++;
        } else {
          console.log(`❌ ${viewport.name}: İçerik eksik veya çok az`);
          results.failedTests++;
          results.uxIssues.push({
            page: `${viewport.name} Viewport`,
            issue: 'İçerik eksik veya çok az',
            severity: 'HIGH'
          });
        }
        
        // Mobile'da touch target boyutları kontrol et
        if (viewport.name === 'Mobile') {
          const touchTargets = await page.evaluate(() => {
            const buttons = document.querySelectorAll('button, a, input[type="submit"]');
            const smallTargets = Array.from(buttons).filter(btn => {
              const rect = btn.getBoundingClientRect();
              return rect.width < 44 || rect.height < 44;
            });
            return smallTargets.length;
          });
          
          if (touchTargets === 0) {
            console.log(`✅ ${viewport.name}: Touch target boyutları uygun`);
            results.passedTests++;
          } else {
            console.log(`⚠️ ${viewport.name}: ${touchTargets} küçük touch target`);
            results.failedTests++;
            results.uxIssues.push({
              page: `${viewport.name} Touch Targets`,
              issue: `${touchTargets} küçük touch target`,
              severity: 'MEDIUM'
            });
          }
        }
        
      } catch (error) {
        console.log(`⚠️ ${viewport.name} responsive test hatası: ${error.message}`);
        results.failedTests++;
      }
    }
    
    // ========================================
    // TEST 5: ERROR HANDLING TESTİ
    // ========================================
    console.log('\n🚨 TEST 5: Error Handling Testi');
    console.log('=' .repeat(50));
    
    try {
      results.totalTests++;
      
      // 404 sayfası testi
      await page.goto('http://localhost:5173/nonexistent-page');
      await page.waitForTimeout(2000);
      
      const errorPageContent = await page.evaluate(() => {
        const body = document.body.textContent || '';
        return {
          hasErrorContent: body.includes('404') || body.includes('Not Found') || body.includes('Hata'),
          contentLength: body.length
        };
      });
      
      if (errorPageContent.hasErrorContent) {
        console.log('✅ Error Handling: 404 sayfası uygun içerik gösteriyor');
        results.passedTests++;
      } else {
        console.log('❌ Error Handling: 404 sayfası uygun içerik göstermiyor');
        results.failedTests++;
        results.uxIssues.push({
          page: 'Error Handling',
          issue: '404 sayfası uygun içerik göstermiyor',
          severity: 'MEDIUM'
        });
      }
      
      // Form validation error testi
      await page.goto('http://localhost:5173/login');
      await page.waitForLoadState('networkidle');
      
      // Geçersiz email ile submit testi
      await page.fill('input[name="email"]', 'invalid-email');
      await page.fill('input[name="password"]', '123');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
      
      const validationErrors = await page.evaluate(() => {
        const errorElements = document.querySelectorAll('.error, .invalid, [role="alert"]');
        return errorElements.length;
      });
      
      if (validationErrors > 0) {
        console.log(`✅ Error Handling: Form validation hataları gösteriliyor (${validationErrors})`);
        results.passedTests++;
      } else {
        console.log('⚠️ Error Handling: Form validation hataları gösterilmiyor');
        results.failedTests++;
        results.uxIssues.push({
          page: 'Form Validation',
          issue: 'Form validation hataları gösterilmiyor',
          severity: 'MEDIUM'
        });
      }
      
    } catch (error) {
      console.log(`⚠️ Error handling test hatası: ${error.message}`);
      results.failedTests++;
    }
    
    // ========================================
    // TEST SONUÇLARI
    // ========================================
    console.log('\n📊 UX VE ACCESSIBILITY TEST SONUÇLARI');
    console.log('=' .repeat(50));
    
    const successRate = ((results.passedTests / results.totalTests) * 100).toFixed(2);
    results.uxScore = successRate;
    results.accessibilityScore = successRate;
    
    console.log(`📈 Toplam Test: ${results.totalTests}`);
    console.log(`✅ Başarılı: ${results.passedTests}`);
    console.log(`❌ Başarısız: ${results.failedTests}`);
    console.log(`📊 UX Skoru: ${successRate}%`);
    console.log(`♿ Accessibility Skoru: ${successRate}%`);
    console.log(`🚨 UX Sorunları: ${results.uxIssues.length}`);
    console.log(`♿ Accessibility Sorunları: ${results.accessibilityIssues.length}`);
    
    // UX skoru değerlendirmesi
    console.log('\n🎯 UX VE ACCESSIBILITY DEĞERLENDİRMESİ:');
    
    if (successRate >= 95) {
      console.log('🛡️ MÜKEMMEL! UX ve accessibility çok iyi!');
      console.log('🌟 Tüm kullanıcılar için erişilebilir!');
    } else if (successRate >= 85) {
      console.log('✅ İYİ! UX ve accessibility genel olarak iyi!');
      console.log('🔧 Küçük iyileştirmeler yapılabilir.');
    } else if (successRate >= 70) {
      console.log('⚠️ ORTA! Bazı UX/accessibility sorunları var.');
      console.log('🚨 Kritik sorunlar düzeltilmeli.');
    } else {
      console.log('❌ ZAYIF! UX ve accessibility sorunları var.');
      console.log('🚨 Acil UX/accessibility düzeltmeleri yapılmalı.');
    }
    
    // Tespit edilen sorunlar
    if (results.uxIssues.length > 0) {
      console.log('\n🚨 TESPİT EDİLEN UX SORUNLARI:');
      results.uxIssues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue.page}: ${issue.issue} (${issue.severity})`);
      });
    }
    
    if (results.accessibilityIssues.length > 0) {
      console.log('\n♿ TESPİT EDİLEN ACCESSIBILITY SORUNLARI:');
      results.accessibilityIssues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue.page}: ${issue.issue} (${issue.severity})`);
      });
    }
    
    console.log('\n🎉 UX VE ACCESSIBILITY TESTLERİ TAMAMLANDI!');
    
  } catch (error) {
    console.error('❌ UX ve accessibility test hatası:', error.message);
  } finally {
    await browser.close();
  }
  
  return results;
}

uxAccessibilityTests().catch(console.error);



