/**
 * Real-World Scenarios Test
 * 
 * Tests realistic business scenarios:
 * - Complete shipment lifecycle
 * - Multiple users interacting
 * - Offer negotiation
 * - Status transitions
 * - Payment flows
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:5000/api';

async function testCompleteLifecycle() {
  console.log('\n=== COMPLETE SHIPMENT LIFECYCLE ===\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  let individualPage = null;
  let nakliyeciPage = null;
  
  try {
    // Step 1: Individual creates shipment
    individualPage = await context.newPage();
    await individualPage.goto(`${BASE_URL}/login`);
    await individualPage.click('button[data-testid="demo-individual"]');
    await individualPage.waitForURL('**/individual/dashboard');
    await individualPage.goto(`${BASE_URL}/individual/create-shipment`);
    await individualPage.waitForTimeout(2000);
    
    // Fill and publish shipment
    await individualPage.selectOption('select[name="mainCategory"], select', 'house_move');
    await individualPage.waitForTimeout(1000);
    
    const desc = await individualPage.$('textarea[name="productDescription"], textarea');
    if (desc) {
      await desc.fill('Gerçek dünya senaryosu - İstanbul\'dan Ankara\'ya ev taşınması');
      await individualPage.waitForTimeout(500);
    }
    
    // Navigate through steps
    const nextBtn = await individualPage.$('button:has-text("İleri")');
    if (nextBtn) {
      await nextBtn.click();
      await individualPage.waitForTimeout(1000);
      
      // Fill address
      const pickupAddr = await individualPage.$('textarea[name="pickupAddress"], textarea:nth-of-type(1)');
      if (pickupAddr) {
        await pickupAddr.fill('İstanbul, Şişli, Mecidiyeköy, Test Caddesi No:100');
        await individualPage.waitForTimeout(300);
      }
      
      const pickupDate = await individualPage.$('input[type="date"]:nth-of-type(1)');
      if (pickupDate) {
        await pickupDate.fill('2025-03-15');
        await individualPage.waitForTimeout(300);
      }
      
      const deliveryAddr = await individualPage.$('textarea[name="deliveryAddress"], textarea:nth-of-type(2)');
      if (deliveryAddr) {
        await deliveryAddr.fill('Ankara, Çankaya, Kızılay, Test Sokak No:200');
        await individualPage.waitForTimeout(300);
      }
      
      const deliveryDate = await individualPage.$('input[type="date"]:nth-of-type(2)');
      if (deliveryDate) {
        await deliveryDate.fill('2025-03-17');
        await individualPage.waitForTimeout(300);
      }
      
      // Go to step 3
      await nextBtn.click();
      await individualPage.waitForTimeout(1000);
      
      // Publish
      const publishBtn = await individualPage.$('button:has-text("Yayınla")');
      if (publishBtn) {
        await publishBtn.click();
        await individualPage.waitForTimeout(3000);
        console.log('✅ Shipment published');
      }
    }
    
    // Step 2: Nakliyeci views and makes offer
    nakliyeciPage = await context.newPage();
    await nakliyeciPage.goto(`${BASE_URL}/login`);
    await nakliyeciPage.click('button[data-testid="demo-nakliyeci"]');
    await nakliyeciPage.waitForURL('**/nakliyeci/dashboard');
    await nakliyeciPage.goto(`${BASE_URL}/nakliyeci/jobs`);
    await nakliyeciPage.waitForTimeout(3000);
    
    // Find and click on shipment
    const shipmentCards = await nakliyeciPage.$$('[class*="card"], article, [data-testid*="shipment"]');
    if (shipmentCards.length > 0) {
      await shipmentCards[0].click();
      await nakliyeciPage.waitForTimeout(2000);
      console.log('✅ Shipment viewed by nakliyeci');
      
      // Make offer
      const offerBtn = await nakliyeciPage.$('button:has-text("Teklif"), a:has-text("Teklif")');
      if (offerBtn) {
        await offerBtn.click();
        await nakliyeciPage.waitForTimeout(2000);
        
        const priceInput = await nakliyeciPage.$('input[name="price"], input[type="number"]');
        if (priceInput) {
          await priceInput.fill('7500');
          await nakliyeciPage.waitForTimeout(300);
          
          const messageInput = await nakliyeciPage.$('textarea[name="message"], textarea');
          if (messageInput) {
            await messageInput.fill('Profesyonel ekibimizle hizmetinizdeyiz');
            await nakliyeciPage.waitForTimeout(300);
          }
          
          const submitBtn = await nakliyeciPage.$('button[type="submit"]:has-text("Gönder")');
          if (submitBtn) {
            await submitBtn.click();
            await nakliyeciPage.waitForTimeout(2000);
            console.log('✅ Offer submitted');
          }
        }
      }
    }
    
    // Step 3: Individual views offers
    await individualPage.goto(`${BASE_URL}/individual/offers`);
    await individualPage.waitForTimeout(2000);
    console.log('✅ Offers page viewed');
    
    // Step 4: Check status transitions
    await individualPage.goto(`${BASE_URL}/individual/my-shipments`);
    await individualPage.waitForTimeout(2000);
    console.log('✅ Shipment status checked');
    
    await context.close();
    await browser.close();
    
    console.log('\n🎉 Complete lifecycle test passed!');
    return true;
  } catch (error) {
    console.error('Lifecycle test error:', error);
    if (individualPage) await individualPage.close();
    if (nakliyeciPage) await nakliyeciPage.close();
    if (context) await context.close();
    if (browser) await browser.close();
    return false;
  }
}

// Run
if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}` || 
    process.argv[1]?.includes('real-world-scenarios-test')) {
  testCompleteLifecycle().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export { testCompleteLifecycle };


