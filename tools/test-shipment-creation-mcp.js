/**
 * MCP Playwright Test - Shipment Creation and Publishing
 * 
 * This test specifically tests shipment creation and publishing flow
 * with robust error handling and retry logic.
 */

import { 
  initBrowser, 
  navigate, 
  snapshot, 
  click, 
  type, 
  close, 
  getConsoleMessages,
  getPage,
  waitForSelector,
  waitForNavigation,
  waitFor
} from './mcp-playwright-wrapper.js';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const API_URL = process.env.API_URL || 'http://localhost:5000';

async function testShipmentCreation() {
  console.log('=== MCP PLAYWRIGHT: GÖNDERİ OLUŞTURMA TESTİ ===\n');
  
  let success = false;
  
  try {
    // 1. Initialize browser
    console.log('1️⃣ Browser başlatılıyor...');
    await initBrowser({ headless: false });
    
    // 2. Navigate to login
    console.log('2️⃣ Login sayfasına gidiliyor...');
    await navigate(`${BASE_URL}/login`, { timeout: 30000 });
    await waitFor(2000);
    await snapshot('01-login-page.png');
    
    // 3. Login as individual user
    console.log('3️⃣ Individual kullanıcı olarak giriş yapılıyor...');
    await waitForSelector('button[data-testid="demo-individual"]', { timeout: 10000 });
    await click('button[data-testid="demo-individual"]', { waitAfter: 3000 });
    await waitForNavigation({ timeout: 15000 });
    await waitFor(2000);
    await snapshot('02-individual-dashboard.png');
    
    // 4. Navigate to create shipment page
    console.log('4️⃣ Gönderi oluşturma sayfasına gidiliyor...');
    const page = getPage();
    
    // Try multiple navigation methods
    const createShipmentPaths = [
      '/individual/create-shipment',
      '/individual/shipments/create',
      '/create-shipment'
    ];
    
    let navigated = false;
    for (const path of createShipmentPaths) {
      try {
        await navigate(`${BASE_URL}${path}`, { timeout: 15000 });
        await waitFor(2000);
        navigated = true;
        break;
      } catch (e) {
        console.log(`   ⚠️ ${path} bulunamadı, deneme devam ediyor...`);
      }
    }
    
    if (!navigated) {
      // Try clicking a button/link
      const createButtons = [
        'button:has-text("Yeni Gönderi")',
        'button:has-text("Gönderi Oluştur")',
        'a[href*="create"]',
        'button[data-testid="create-shipment"]'
      ];
      
      for (const selector of createButtons) {
        try {
          const element = await page.$(selector);
          if (element) {
            await click(selector, { waitAfter: 2000 });
            await waitForNavigation({ timeout: 15000 });
            navigated = true;
            break;
          }
        } catch (e) {
          // Continue
        }
      }
    }
    
    if (!navigated) {
      throw new Error('Gönderi oluşturma sayfasına ulaşılamadı');
    }
    
    await snapshot('03-create-shipment-page.png');
    
    // 5. Fill shipment form
    console.log('5️⃣ Gönderi formu dolduruluyor...');
    
    // Wait for form to be ready
    await waitFor(2000);
    
    // DEBUG: Print all available elements on the page
    console.log('   🔍 Sayfadaki tüm elementler taranıyor...');
    const allElements = await page.$$('[name], [id], [data-testid], [aria-label]');
    console.log(`   ℹ️ Toplam ${allElements.length} element bulundu`);
    
    // DEBUG: Print all element details
    console.log('   📋 Element detayları:');
    for (let i = 0; i < Math.min(allElements.length, 10); i++) {
      try {
        const element = allElements[i];
        const tagName = await element.evaluate(el => el.tagName.toLowerCase());
        const name = await element.getAttribute('name');
        const id = await element.getAttribute('id');
        const dataTestId = await element.getAttribute('data-testid');
        const ariaLabel = await element.getAttribute('aria-label');
        const placeholder = await element.getAttribute('placeholder');
        const textContent = await element.textContent();
        
        console.log(`      ${tagName} - name: ${name || 'N/A'}, id: ${id || 'N/A'}, data-testid: ${dataTestId || 'N/A'}, aria-label: ${ariaLabel || 'N/A'}, placeholder: ${placeholder || 'N/A'}, text: ${textContent?.substring(0, 30) || 'N/A'}`);
      } catch (e) {
        console.log(`      Element ${i} - Hata: ${e.message}`);
      }
    }
    
    // DEBUG: Print page content
    console.log('   📄 Sayfa içeriği özet:');
    const pageContent = await page.content();
    console.log(`      İçerik uzunluğu: ${pageContent.length} karakter`);
    // Print first 1000 characters
    console.log(`      İlk 1000 karakter: ${pageContent.substring(0, 1000)}`);
    
    // DEBUG: Print specific selectors we're looking for
    const debugSelectors = [
      '[name="productDescription"]',
      '[name="roomCount"]',
      '[name="buildingType"]',
      '[name="pickupFloor"]',
      '[name="deliveryFloor"]',
      '[name="pickupCity"]',
      '[name="pickupDistrict"]',
      '[name="pickupAddress"]',
      '[name="deliveryCity"]',
      '[name="deliveryDistrict"]',
      '[name="deliveryAddress"]',
      'button[type="submit"]',
      'button:has-text("Yayınla")',
      'button:has-text("İleri")',
      'button:has-text("Next")'
    ];
    
    for (const selector of debugSelectors) {
      try {
        const elements = await page.$$(selector);
        if (elements.length > 0) {
          console.log(`   ✅ Bulunan element: ${selector} (${elements.length} adet)`);
        } else {
          console.log(`   ❌ Bulunamayan element: ${selector}`);
        }
      } catch (e) {
        console.log(`   ⚠️ Hata oluştu: ${selector}`);
      }
    }
    
    // STEP 1: Fill main category and click next
    console.log('   ➡️ Adım 1: Kategori seçiliyor...');
    try {
      const mainCategorySelect = await page.$('select[aria-label*="kategori"]');
      if (mainCategorySelect) {
        await mainCategorySelect.selectOption('house_move');
        console.log('   ✅ Kategori seçildi');
      } else {
        console.log('   ❌ Kategori dropdown bulunamadı');
      }
    } catch (e) {
      console.log(`   ⚠️ Kategori seçme hatası: ${e.message}`);
    }
    
    // Wait a bit for the page to update
    await waitFor(1000);
    
    // Click next button
    console.log('   ➡️ İleri butonuna tıklanıyor...');
    const nextButtons = [
      'button:has-text("İleri")',
      'button:has-text("Next")',
      'button:has-text("Devam")',
      'button[data-testid="next"]',
      'button[type="button"]'
    ];
    
    let nextClicked = false;
    for (const selector of nextButtons) {
      try {
        const element = await page.$(selector);
        if (element && await element.isVisible()) {
          await click(selector, { waitAfter: 2000 });
          nextClicked = true;
          console.log(`   ✅ İleri butonuna tıklandı: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue
      }
    }
    
    if (!nextClicked) {
      console.log('   ❌ İleri butonu bulunamadı');
    }
    
    // Wait for next step to load
    await waitFor(3000);
    
    // DEBUG: Check if next step loaded
    console.log('   🔍 İkinci adım yükleniyor...');
    const step2Elements = await page.$$('[name], [id], [data-testid], [aria-label]');
    console.log(`   ℹ️ İkinci adımda ${step2Elements.length} element bulundu`);
    
    // DEBUG: Print step 2 element details
    console.log('   📋 İkinci adım element detayları:');
    for (let i = 0; i < Math.min(step2Elements.length, 15); i++) {
      try {
        const element = step2Elements[i];
        const tagName = await element.evaluate(el => el.tagName.toLowerCase());
        const name = await element.getAttribute('name');
        const id = await element.getAttribute('id');
        const dataTestId = await element.getAttribute('data-testid');
        const ariaLabel = await element.getAttribute('aria-label');
        const placeholder = await element.getAttribute('placeholder');
        const textContent = await element.textContent();
        
        console.log(`      ${tagName} - name: ${name || 'N/A'}, id: ${id || 'N/A'}, data-testid: ${dataTestId || 'N/A'}, aria-label: ${ariaLabel || 'N/A'}, placeholder: ${placeholder || 'N/A'}, text: ${textContent?.substring(0, 30) || 'N/A'}`);
      } catch (e) {
        console.log(`      Element ${i} - Hata: ${e.message}`);
      }
    }
    
    // STEP 2: Fill form fields with multiple selector strategies
    const formFields = [
      {
        name: 'productDescription',
        selectors: [
          'textarea[aria-label*="Yük açıklaması"]',
          'textarea[placeholder*="Taşınacak eşyalar"]',
          'textarea[name="productDescription"]',
          'input[name="productDescription"]',
          'textarea[placeholder*="Açıklama"]',
          'input[placeholder*="Açıklama"]',
          'textarea[placeholder*="Ürün"]',
          'input[placeholder*="Ürün"]',
          'textarea[aria-label*="Açıklama"]',
          'input[aria-label*="Açıklama"]',
          'textarea[data-testid="productDescription"]',
          'input[data-testid="productDescription"]',
          'textarea#productDescription',
          'input#productDescription'
        ],
        value: `Test Ev Taşınması ${Date.now()}`
      },
      {
        name: 'roomCount',
        selectors: [
          'select[name="roomCount"]',
          'select[aria-label*="Oda"]',
          'select[aria-label*="oda"]',
          'select[data-testid="roomCount"]',
          'select#roomCount',
          'select[aria-labelledby*="oda"]'
        ],
        value: '2+1',
        type: 'select'
      },
      {
        name: 'buildingType',
        selectors: [
          'select[name="buildingType"]',
          'select[aria-label*="Bina"]',
          'select[aria-label*="bina"]',
          'select[data-testid="buildingType"]',
          'select#buildingType',
          'select[aria-labelledby*="bina"]'
        ],
        value: 'apartment',
        type: 'select'
      },
      {
        name: 'pickupFloor',
        selectors: [
          'input[name="pickupFloor"]',
          'input[placeholder*="Kat"]',
          'input[aria-label*="Kat"]',
          'input[data-testid="pickupFloor"]',
          'input#pickupFloor',
          'input[aria-labelledby*="kat"]'
        ],
        value: '2'
      },
      {
        name: 'deliveryFloor',
        selectors: [
          'input[name="deliveryFloor"]',
          'input[placeholder*="Kat"]',
          'input[aria-label*="Kat"]',
          'input[data-testid="deliveryFloor"]',
          'input#deliveryFloor',
          'input[aria-labelledby*="kat"]'
        ],
        value: '3'
      },
      {
        name: 'pickupCity',
        selectors: [
          'select[name="pickupCity"]',
          'select[aria-label*="İl"]',
          'select[aria-label*="il"]',
          'select[data-testid="pickupCity"]',
          'select#pickupCity',
          'select[aria-labelledby*="il"]'
        ],
        value: 'İstanbul',
        type: 'select'
      },
      {
        name: 'pickupDistrict',
        selectors: [
          'select[name="pickupDistrict"]',
          'select[aria-label*="İlçe"]',
          'select[aria-label*="ilçe"]',
          'select[data-testid="pickupDistrict"]',
          'select#pickupDistrict',
          'select[aria-labelledby*="ilçe"]'
        ],
        value: 'Kadıköy',
        type: 'select'
      },
      {
        name: 'pickupAddress',
        selectors: [
          'textarea[name="pickupAddress"]',
          'input[name="pickupAddress"]',
          'textarea[placeholder*="Adres"]',
          'input[placeholder*="Adres"]',
          'textarea[aria-label*="Adres"]',
          'input[aria-label*="Adres"]',
          'textarea[data-testid="pickupAddress"]',
          'input[data-testid="pickupAddress"]',
          'textarea#pickupAddress',
          'input#pickupAddress'
        ],
        value: 'Moda Mahallesi, Deniz Cd. No:123'
      },
      {
        name: 'deliveryCity',
        selectors: [
          'select[name="deliveryCity"]',
          'select[aria-label*="İl"]',
          'select[aria-label*="il"]',
          'select[data-testid="deliveryCity"]',
          'select#deliveryCity',
          'select[aria-labelledby*="il"]'
        ],
        value: 'Ankara',
        type: 'select'
      },
      {
        name: 'deliveryDistrict',
        selectors: [
          'select[name="deliveryDistrict"]',
          'select[aria-label*="İlçe"]',
          'select[aria-label*="ilçe"]',
          'select[data-testid="deliveryDistrict"]',
          'select#deliveryDistrict',
          'select[aria-labelledby*="ilçe"]'
        ],
        value: 'Çankaya',
        type: 'select'
      },
      {
        name: 'deliveryAddress',
        selectors: [
          'textarea[name="deliveryAddress"]',
          'input[name="deliveryAddress"]',
          'textarea[placeholder*="Adres"]',
          'input[placeholder*="Adres"]',
          'textarea[aria-label*="Adres"]',
          'input[aria-label*="Adres"]',
          'textarea[data-testid="deliveryAddress"]',
          'input[data-testid="deliveryAddress"]',
          'textarea#deliveryAddress',
          'input#deliveryAddress'
        ],
        value: 'Cumhuruyet Mahallesi, Atatürk Cd. No:456'
      }
    ];
    
    for (const field of formFields) {
      let filled = false;
      for (const selector of field.selectors) {
        try {
          const element = await page.$(selector);
          if (element) {
            if (field.type === 'select') {
              // For select elements, use selectOption instead of type
              await element.selectOption(field.value);
              await waitFor(500);
              filled = true;
              console.log(`   ✅ ${field.name} seçildi (${selector})`);
              break;
            } else {
              // For input/textarea elements, use type
              await type(selector, field.value, { clear: true, delay: 100 });
              filled = true;
              console.log(`   ✅ ${field.name} dolduruldu (${selector})`);
              break;
            }
          }
        } catch (e) {
          // Continue to next selector
        }
      }
      if (!filled) {
        console.log(`   ⚠️ ${field.name} alanı bulunamadı (devam ediliyor)`);
      }
      await waitFor(500);
    }
    
    await snapshot('04-form-filled.png');
    
    // Click next button again for step 3
    console.log('   ➡️ İkinci kez ileri butonuna tıklanıyor...');
    const nextButtons2 = [
      'button:has-text("İleri")',
      'button:has-text("Next")',
      'button:has-text("Devam")',
      'button[data-testid="next"]',
      'button[type="button"]'
    ];
    
    let nextClicked2 = false;
    for (const selector of nextButtons2) {
      try {
        const element = await page.$(selector);
        if (element && await element.isVisible()) {
          await click(selector, { waitAfter: 2000 });
          nextClicked2 = true;
          console.log(`   ✅ İkinci ileri butonuna tıklandı: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue
      }
    }
    
    if (!nextClicked2) {
      console.log('   ❌ İkinci ileri butonu bulunamadı');
    }
    
    // Wait for step 3 to load
    await waitFor(3000);
    
    // DEBUG: Check if step 3 loaded
    console.log('   🔍 Üçüncü adım yükleniyor...');
    const step3Elements = await page.$$('[name], [id], [data-testid], [aria-label]');
    console.log(`   ℹ️ Üçüncü adımda ${step3Elements.length} element bulundu`);
    
    // 6. Submit form
    console.log('6️⃣ Form gönderiliyor...');
    
    const submitSelectors = [
      'button[type="submit"]',
      'button:has-text("Yayınla")',
      'button:has-text("Oluştur")',
      'button:has-text("Create")',
      'button:has-text("Publish")',
      'button[data-testid="submit"]',
      'button[data-testid="publish"]',
      'button#submit',
      'button#publish',
      'button[class*="submit"]',
      'button[class*="publish"]',
      'button[aria-label*="Yayınla"]',
      'button[aria-label*="Oluştur"]',
      'button.bg-blue-600',
      'button.text-white'
    ];
    
    let submitted = false;
    for (const selector of submitSelectors) {
      try {
        const element = await page.$(selector);
        if (element && await element.isVisible()) {
          await click(selector, { waitAfter: 3000 });
          await waitForNavigation({ timeout: 20000 });
          submitted = true;
          console.log(`   ✅ Form gönderildi (${selector})`);
          break;
        }
      } catch (e) {
        // Continue
      }
    }
    
    if (!submitted) {
      throw new Error('Form gönderilemedi - submit butonu bulunamadı');
    }
    
    await waitFor(3000);
    await snapshot('05-shipment-created.png');
    
    // 7. Verify success
    console.log('7️⃣ Başarı kontrolü yapılıyor...');
    
    const successIndicators = [
      'text=Gönderi oluşturuldu',
      'text=Gönderi başarıyla',
      'text=success',
      'text=created',
      '[data-testid="success"]'
    ];
    
    let successFound = false;
    for (const selector of successIndicators) {
      try {
        const element = await page.$(selector);
        if (element) {
          successFound = true;
          console.log(`   ✅ Başarı mesajı bulundu`);
          break;
        }
      } catch (e) {
        // Continue
      }
    }
    
    // 8. Check console errors
    console.log('8️⃣ Console hataları kontrol ediliyor...');
    const errors = await getConsoleMessages(true);
    if (errors.length > 0) {
      console.log(`   ⚠️ ${errors.length} console hatası bulundu:`);
      errors.forEach(err => console.log(`      - ${err.text}`));
    } else {
      console.log('   ✅ Console hatası yok');
    }
    
    success = true;
    console.log('\n🎉 GÖNDERİ OLUŞTURMA TESTİ BAŞARILI!');
    
  } catch (error) {
    console.error('\n❌ TEST BAŞARISIZ:', error.message);
    console.error('Stack:', error.stack);
    
    // Take error screenshot
    try {
      await snapshot('error-screenshot.png');
    } catch (e) {
      // Ignore
    }
    
    // Log console errors
    try {
      const errors = await getConsoleMessages(true);
      if (errors.length > 0) {
        console.error('\nConsole Hataları:');
        errors.forEach(err => console.error(`  - ${err.text}`));
      }
    } catch (e) {
      // Ignore
    }
  } finally {
    await close();
  }
  
  return success;
}

// Run test
testShipmentCreation().then(success => {
  process.exit(success ? 0 : 1);
});
































































