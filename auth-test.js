import { chromium } from 'playwright';

async function authTest() {
  console.log('🧪 AUTHENTICATION TEST BAŞLIYOR...\n');
  
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
    // 1. LANDING PAGE TEST
    console.log('\n1️⃣ LANDING PAGE TEST...');
    try {
      await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
      
      const title = await page.title();
      logTest('Landing Page Load', 'PASS', title);
      
      // Demo button'u kontrol et
      const demoButton = await page.locator('button:has-text("Demo\'yu Başlat")').count();
      if (demoButton > 0) {
        logTest('Demo Button Found', 'PASS');
      } else {
        logTest('Demo Button Found', 'FAIL', 'Button not found');
      }
    } catch (error) {
      logTest('Landing Page Load', 'FAIL', error.message);
    }

    // 2. DEMO LOGIN TEST
    console.log('\n2️⃣ DEMO LOGIN TEST...');
    try {
      await page.click('button:has-text("Demo\'yu Başlat")');
      await page.waitForTimeout(3000);
      
      // Login sonrası yönlendirme kontrolü
      const currentUrl = page.url();
      if (currentUrl.includes('/individual/dashboard')) {
        logTest('Demo Login Success', 'PASS', 'Redirected to individual dashboard');
      } else {
        logTest('Demo Login Success', 'FAIL', `Unexpected redirect: ${currentUrl}`);
      }
    } catch (error) {
      logTest('Demo Login Success', 'FAIL', error.message);
    }

    // 3. INDIVIDUAL DASHBOARD TEST
    console.log('\n3️⃣ INDIVIDUAL DASHBOARD TEST...');
    try {
      const h1 = await page.locator('h1').first().textContent({ timeout: 10000 });
      logTest('Individual Dashboard H1', 'PASS', h1);
    } catch (error) {
      logTest('Individual Dashboard H1', 'FAIL', error.message);
    }

    // 4. NAVIGATION TEST
    console.log('\n4️⃣ NAVIGATION TEST...');
    try {
      // Corporate dashboard'a git
      await page.goto('http://localhost:5173/corporate/dashboard', { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
      
      const h1 = await page.locator('h1').first().textContent({ timeout: 10000 });
      logTest('Corporate Dashboard H1', 'PASS', h1);
    } catch (error) {
      logTest('Corporate Dashboard H1', 'FAIL', error.message);
    }

    // 5. CARRIER DASHBOARD TEST
    console.log('\n5️⃣ CARRIER DASHBOARD TEST...');
    try {
      await page.goto('http://localhost:5173/nakliyeci/dashboard', { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
      
      const h1 = await page.locator('h1').first().textContent({ timeout: 10000 });
      logTest('Carrier Dashboard H1', 'PASS', h1);
    } catch (error) {
      logTest('Carrier Dashboard H1', 'FAIL', error.message);
    }

    // 6. DRIVER DASHBOARD TEST
    console.log('\n6️⃣ DRIVER DASHBOARD TEST...');
    try {
      await page.goto('http://localhost:5173/tasiyici/dashboard', { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
      
      const h1 = await page.locator('h1').first().textContent({ timeout: 10000 });
      logTest('Driver Dashboard H1', 'PASS', h1);
    } catch (error) {
      logTest('Driver Dashboard H1', 'FAIL', error.message);
    }

    // 7. 404 TEST
    console.log('\n7️⃣ 404 TEST...');
    try {
      await page.goto('http://localhost:5173/nonexistent-page', { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
      
      const h1 = await page.locator('h1').first().textContent({ timeout: 10000 });
      if (h1 && h1.includes('404')) {
        logTest('404 Page', 'PASS', h1);
      } else {
        logTest('404 Page', 'FAIL', 'No 404 page found');
      }
    } catch (error) {
      logTest('404 Page', 'FAIL', error.message);
    }

    // 8. API TEST
    console.log('\n8️⃣ API TEST...');
    try {
      const response = await page.request.get('http://localhost:5000/health');
      const data = await response.json();
      logTest('API Health Check', 'PASS', `Uptime: ${Math.round(data.uptime)}s`);
    } catch (error) {
      logTest('API Health Check', 'FAIL', error.message);
    }

    // 9. FORM TEST
    console.log('\n9️⃣ FORM TEST...');
    try {
      await page.goto('http://localhost:5173/individual/create-shipment', { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
      
      const h1 = await page.locator('h1').first().textContent({ timeout: 10000 });
      logTest('Create Shipment Form', 'PASS', h1);
    } catch (error) {
      logTest('Create Shipment Form', 'FAIL', error.message);
    }

    // FINAL SUMMARY
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

    console.log('\n🎉 AUTHENTICATION TEST TAMAMLANDI!');
    
    if (testResults.failed === 0) {
      console.log('🚀 TÜM TESTLER BAŞARILI! SİSTEM MÜKEMMEL!');
    } else if (testResults.passed >= testResults.total * 0.8) {
      console.log('🎯 TESTLER BAŞARILI! SİSTEM ÇALIŞIYOR!');
    } else {
      console.log(`⚠️ ${testResults.failed} test başarısız.`);
    }

  } catch (error) {
    console.error('❌ Test hatası:', error);
  } finally {
    await browser.close();
  }
}

authTest();





