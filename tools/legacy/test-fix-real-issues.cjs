// GERÇEK SORUNLARI BUL VE DÜZELT
const { chromium } = require('playwright');

const log = (msg) => console.log(msg);

async function main() {
  log('\n🔍 GERÇEK SORUNLARI TESPİT EDİYORUM...\n');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Console hatalarını yakala
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
      log(`❌ Console Error: ${msg.text()}`);
    }
  });
  
  // Network hatalarını yakala
  page.on('response', response => {
    if (!response.ok() && response.url().includes('localhost')) {
      log(`⚠️  HTTP ${response.status()}: ${response.url()}`);
    }
  });
  
  try {
    log('1️⃣ Login sayfasına gidiliyor...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(10000); // React render için uzun bekle
    
    // Sayfa yüklendi mi?
    const title = await page.title();
    log(`   Title: ${title}`);
    
    // Body'de ne var?
    const bodyHTML = await page.evaluate(() => {
      return {
        text: document.body.textContent.substring(0, 200),
        hasReact: window.React !== undefined,
        hasButtons: document.querySelectorAll('button').length,
        hasDivs: document.querySelectorAll('div').length,
      };
    });
    
    log(`   Body text: ${bodyHTML.text}`);
    log(`   Buttons: ${bodyHTML.hasButtons}, Divs: ${bodyHTML.hasDivs}`);
    log(`   React: ${bodyHTML.hasReact ? 'Yüklü' : 'YÜKLENMEMİŞ!'}`);
    
    if (bodyHTML.hasButtons === 0) {
      log('\n🔴 SORUN: Sayfa hiç render olmamış!');
      log('   Olası nedenler:');
      log('   1. JavaScript hatası var');
      log('   2. React yüklenmemiş');
      log('   3. Route çalışmıyor');
      
      if (errors.length > 0) {
        log('\n📋 JavaScript Hataları:');
        errors.forEach((err, i) => log(`   ${i+1}. ${err}`));
      }
      
      // Screenshot al
      await page.screenshot({ path: 'page-not-rendered.png', fullPage: true });
      log('   📸 Screenshot: page-not-rendered.png');
    } else {
      log(`\n✅ Sayfa render olmuş! ${bodyHTML.hasButtons} button bulundu`);
      
      // Demo button'ları ara
      const demoBtns = await page.locator('button[data-testid^="demo-"]').count();
      log(`   Demo buttons: ${demoBtns}`);
      
      if (demoBtns > 0) {
        log('   ✅ Demo button\'lar mevcut!');
      } else {
        log('   ⚠️  Demo button\'lar bulunamadı, text ile arama yapılıyor...');
        const btnText = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          return buttons.map(b => b.textContent?.trim()).filter(Boolean).slice(0, 5);
        });
        log(`   Buton metinleri: ${btnText.join(', ')}`);
      }
    }
    
  } catch (error) {
    log(`\n❌ HATA: ${error.message}`);
    await page.screenshot({ path: 'test-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
  
  log('\n✅ Analiz tamamlandı!');
}

main().catch(console.error);

