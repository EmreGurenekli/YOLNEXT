import { chromium } from 'playwright';

async function simpleTest() {
  console.log('🧪 BASIT TEST BAŞLIYOR...\n');
  
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
      await page.waitForTimeout(2000);
      logTest('Demo Login Click', 'PASS');
    } catch (error) {
      logTest('Demo Login Click', 'FAIL', error.message);
    }

    // 3. INDIVIDUAL DASHBOARD TEST
    console.log('\n3️⃣ INDIVIDUAL DASHBOARD TEST...');
    try {
      await page.goto('http://localhost:5173/individual/dashboard', { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
      
      const h1 = await page.locator('h1').first().textContent({ timeout: 5000 });
      logTest('Individual Dashboard', 'PASS', h1);
    } catch (error) {
      logTest('Individual Dashboard', 'FAIL', error.message);
    }

    // 4. CORPORATE DASHBOARD TEST
    console.log('\n4️⃣ CORPORATE DASHBOARD TEST...');
    try {
      await page.goto('http://localhost:5173/corporate/dashboard', { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
      
      const h1 = await page.locator('h1').first().textContent({ timeout: 5000 });
      logTest('Corporate Dashboard', 'PASS', h1);
    } catch (error) {
      logTest('Corporate Dashboard', 'FAIL', error.message);
    }

    // 5. CARRIER DASHBOARD TEST
    console.log('\n5️⃣ CARRIER DASHBOARD TEST...');
    try {
      await page.goto('http://localhost:5173/nakliyeci/dashboard', { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
      
      const h1 = await page.locator('h1').first().textContent({ timeout: 5000 });
      logTest('Carrier Dashboard', 'PASS', h1);
    } catch (error) {
      logTest('Carrier Dashboard', 'FAIL', error.message);
    }

    // 6. DRIVER DASHBOARD TEST
    console.log('\n6️⃣ DRIVER DASHBOARD TEST...');
    try {
      await page.goto('http://localhost:5173/tasiyici/dashboard', { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
      
      const h1 = await page.locator('h1').first().textContent({ timeout: 5000 });
      logTest('Driver Dashboard', 'PASS', h1);
    } catch (error) {
      logTest('Driver Dashboard', 'FAIL', error.message);
    }

    // 7. 404 TEST
    console.log('\n7️⃣ 404 TEST...');
    try {
      await page.goto('http://localhost:5173/nonexistent-page', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      
      const h1 = await page.locator('h1').first().textContent({ timeout: 5000 });
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

    console.log('\n🎉 BASIT TEST TAMAMLANDI!');
    
    if (testResults.failed === 0) {
      console.log('🚀 TÜM TESTLER BAŞARILI! SİSTEM ÇALIŞIYOR!');
    } else {
      console.log(`⚠️ ${testResults.failed} test başarısız.`);
    }

  } catch (error) {
    console.error('❌ Test hatası:', error);
  } finally {
    await browser.close();
  }
}

simpleTest();

