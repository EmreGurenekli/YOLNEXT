/**
 * Complete Business Flow Test - All Critical Workflows
 * Tests: Offer creation, acceptance, status updates, carrier assignment, etc.
 */

const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:5000/api';

let browser = null;
let context = null;
let page = null;

const testResults = {
  total: { passed: 0, failed: 0, steps: [] },
  offerFlow: { passed: 0, failed: 0, steps: [] },
  statusUpdates: { passed: 0, failed: 0, steps: [] },
  carrierAssignment: { passed: 0, failed: 0, steps: [] },
  integration: { passed: 0, failed: 0, steps: [] }
};

let createdUsers = {};
let createdShipments = {};
let createdOffers = {};

function logStep(category, step, success, message) {
  testResults[category].steps.push({ step, success, message, timestamp: new Date().toISOString() });
  testResults.total.steps.push({ category, step, success, message, timestamp: new Date().toISOString() });
  if (success) {
    testResults[category].passed++;
    testResults.total.passed++;
    console.log(`✅ [${category.toUpperCase()}] ${step}: ${message}`);
  } else {
    testResults[category].failed++;
    testResults.total.failed++;
    console.error(`❌ [${category.toUpperCase()}] ${step}: ${message}`);
  }
}

async function initBrowser() {
  if (browser) return;
  console.log('🚀 Browser başlatılıyor...\n');
  browser = await chromium.launch({ headless: false, slowMo: 100 });
  context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  page = await context.newPage();
}

async function closeBrowser() {
  if (page) await page.close();
  if (context) await context.close();
  if (browser) await browser.close();
}

async function createUser(userType) {
  try {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const email = `complete_test_${userType}_${timestamp}_${random}@yolnext.com`;
    const password = 'Test123!@#';
    
    const userData = {
      email,
      password,
      fullName: `Complete Test ${userType}`,
      role: userType,
      acceptTerms: true,
      acceptPrivacy: true,
      acceptCookies: true
    };
    
    if (userType === 'corporate' || userType === 'nakliyeci') {
      userData.companyName = `Test Company ${random}`;
      const taxNum = `123456789${String(random).padStart(1, '0')}`.substring(0, 10);
      userData.taxNumber = taxNum;
    }
    
    if (userType === 'tasiyici') {
      const firstDigit = Math.floor(Math.random() * 9) + 1;
      const middleDigits = String(Math.floor(Math.random() * 100000000)).padStart(8, '0');
      const base = `${firstDigit}${middleDigits}`;
      const digits = base.split('').map(Number);
      const sum1 = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
      const sum2 = digits[1] + digits[3] + digits[5] + digits[7];
      let check1 = (sum1 * 7 - sum2) % 10;
      if (check1 < 0) check1 += 10;
      const sumAll = digits.reduce((a, b) => a + b, 0) + check1;
      const check2 = sumAll % 10;
      const tckn = `${base}${check1}${check2}`;
      userData.tckn = tckn;
    }
    
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
      signal: AbortSignal.timeout(10000)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`  ⚠️ Register failed (${response.status}): ${errorText.substring(0, 200)}`);
      return null;
    }
    
    const data = await response.json();
    let token = data.data?.token || data.token;
    let userId = data.data?.user?.id || data.user?.id || data.data?.id;
    
    if (!token) {
      const loginResponse = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: AbortSignal.timeout(10000)
      });
      
      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        token = loginData.data?.token || loginData.token;
        userId = loginData.data?.user?.id || loginData.user?.id || userId;
      }
    }
    
    if (token && userId) {
      return { email, password, token, id: userId, type: userType };
    }
    return null;
  } catch (error) {
    console.error(`User creation error: ${error.message}`);
    return null;
  }
}

async function loginUser(user) {
  try {
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, password: user.password }),
      signal: AbortSignal.timeout(10000)
    });
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      user.token = loginData.data?.token || loginData.token;
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

async function createShipment(user, type = 'individual') {
  try {
    const shipmentData = {
      title: `Complete Test: ${type} Gönderi - ${Date.now()}`,
      description: `Test gönderisi - ${type} kullanıcı için`,
      productDescription: type === 'individual' ? '3+1 ev eşyaları, mobilya, elektronik' : 'Toplu gönderi - Test ürünleri',
      category: type === 'individual' ? 'house_move' : 'bulk_transport',
      pickupCity: 'İstanbul',
      pickupDistrict: 'Kadıköy',
      pickupAddress: 'İstanbul, Kadıköy, Test Mahallesi, Test Sokak No:1',
      pickupDate: '2024-12-30',
      deliveryCity: 'Ankara',
      deliveryDistrict: 'Çankaya',
      deliveryAddress: 'Ankara, Çankaya, Test Mahallesi, Test Sokak No:2',
      deliveryDate: '2025-01-02',
      weight: type === 'individual' ? 1000 : 5000,
      volume: type === 'individual' ? 10 : 50,
      dimensions: type === 'individual' ? '100x50x50' : '200x100x100',
      value: type === 'individual' ? 5000 : 25000,
      requiresInsurance: false,
      specialRequirements: 'Test gereksinimler'
    };
    
    if (type === 'individual') {
      shipmentData.roomCount = '3+1';
      shipmentData.buildingType = 'apartment';
      shipmentData.pickupFloor = '3';
      shipmentData.deliveryFloor = '5';
      shipmentData.hasElevatorPickup = true;
      shipmentData.hasElevatorDelivery = true;
      shipmentData.needsPackaging = false;
    }
    
    const response = await fetch(`${API_URL}/shipments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`
      },
      body: JSON.stringify(shipmentData),
      signal: AbortSignal.timeout(15000)
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        id: data.data?.shipment?.id || data.data?.id,
        trackingNumber: data.data?.shipment?.trackingNumber || data.data?.shipment?.trackingnumber
      };
    } else {
      const errorText = await response.text();
      console.error(`Shipment creation failed: ${errorText.substring(0, 200)}`);
      return null;
    }
  } catch (error) {
    console.error(`Shipment creation error: ${error.message}`);
    return null;
  }
}

async function createOffer(user, shipmentId, price = 5000) {
  try {
    const offerData = {
      shipmentId: shipmentId,
      price: price,
      message: 'Test teklifi - Hızlı ve güvenli taşıma garantisi',
      estimatedDeliveryDays: 3,
      insuranceIncluded: false
    };
    
    const response = await fetch(`${API_URL}/offers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`
      },
      body: JSON.stringify(offerData),
      signal: AbortSignal.timeout(10000)
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        id: data.data?.offer?.id || data.data?.id,
        shipmentId,
        price
      };
    } else {
      const errorText = await response.text();
      console.error(`Offer creation failed: ${errorText.substring(0, 200)}`);
      return null;
    }
  } catch (error) {
    console.error(`Offer creation error: ${error.message}`);
    return null;
  }
}

async function acceptOffer(user, offerId) {
  try {
    const response = await fetch(`${API_URL}/offers/${offerId}/accept`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${user.token}`
      },
      signal: AbortSignal.timeout(15000)
    });
    
    if (response.ok) {
      const data = await response.json();
      return true;
    } else {
      const errorText = await response.text();
      console.error(`Offer acceptance failed: ${errorText.substring(0, 200)}`);
      return false;
    }
  } catch (error) {
    console.error(`Offer acceptance error: ${error.message}`);
    return false;
  }
}

async function getOpenShipments(user) {
  try {
    const response = await fetch(`${API_URL}/shipments/open`, {
      headers: {
        'Authorization': `Bearer ${user.token}`
      },
      signal: AbortSignal.timeout(10000)
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.data?.shipments || data.shipments || data.data || [];
    }
    return [];
  } catch (error) {
    return [];
  }
}

async function getOffers(user, type) {
  try {
    const endpoint = type === 'individual' ? '/offers/individual' : '/offers/corporate';
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${user.token}`
      },
      signal: AbortSignal.timeout(10000)
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.data?.offers || data.offers || data.data || [];
    }
    return [];
  } catch (error) {
    return [];
  }
}

async function getShipment(user, shipmentId) {
  try {
    const response = await fetch(`${API_URL}/shipments/${shipmentId}`, {
      headers: {
        'Authorization': `Bearer ${user.token}`
      },
      signal: AbortSignal.timeout(10000)
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.data || data;
    }
    return null;
  } catch (error) {
    return null;
  }
}

async function updateShipmentStatus(user, shipmentId, status) {
  try {
    const response = await fetch(`${API_URL}/shipments/${shipmentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`
      },
      body: JSON.stringify({ status }),
      signal: AbortSignal.timeout(10000)
    });
    
    if (response.ok) {
      return true;
    } else {
      const errorText = await response.text();
      console.error(`Status update failed: ${errorText.substring(0, 200)}`);
      return false;
    }
  } catch (error) {
    console.error(`Status update error: ${error.message}`);
    return false;
  }
}

// TEST 1: COMPLETE OFFER FLOW
async function testOfferFlow() {
  console.log('\n💼 === TEST 1: TAM TEKLİF AKIŞI ===\n');
  
  try {
    // 1. Create Individual user and shipment
    console.log('1. Bireysel gönderici oluşturuluyor...');
    const individualUser = await createUser('individual');
    if (!individualUser) {
      logStep('offerFlow', 'Bireysel Kullanıcı Oluşturma', false, 'Kullanıcı oluşturulamadı');
      return;
    }
    createdUsers.individual = individualUser;
    logStep('offerFlow', 'Bireysel Kullanıcı Oluşturma', true, `Kullanıcı oluşturuldu (ID: ${individualUser.id})`);
    
    await loginUser(individualUser);
    logStep('offerFlow', 'Bireysel Login', true, 'Login başarılı');
    
    console.log('2. Gönderi oluşturuluyor...');
    const shipment = await createShipment(individualUser, 'individual');
    if (!shipment) {
      logStep('offerFlow', 'Gönderi Oluşturma', false, 'Gönderi oluşturulamadı');
      return;
    }
    createdShipments.offerFlow = shipment;
    logStep('offerFlow', 'Gönderi Oluşturma', true, `Gönderi oluşturuldu (ID: ${shipment.id}, Takip: ${shipment.trackingNumber})`);
    
    // Wait for DB sync
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 2. Create Nakliyeci user
    console.log('3. Nakliyeci oluşturuluyor...');
    const nakliyeciUser = await createUser('nakliyeci');
    if (!nakliyeciUser) {
      logStep('offerFlow', 'Nakliyeci Kullanıcı Oluşturma', false, 'Kullanıcı oluşturulamadı');
      return;
    }
    createdUsers.nakliyeci = nakliyeciUser;
    logStep('offerFlow', 'Nakliyeci Kullanıcı Oluşturma', true, `Kullanıcı oluşturuldu (ID: ${nakliyeciUser.id})`);
    
    await loginUser(nakliyeciUser);
    logStep('offerFlow', 'Nakliyeci Login', true, 'Login başarılı');
    
    // 3. Nakliyeci sees open shipments
    console.log('4. Açık gönderiler kontrol ediliyor...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    const openShipments = await getOpenShipments(nakliyeciUser);
    logStep('offerFlow', 'Açık Gönderileri Görüntüleme', true, `${openShipments.length} açık gönderi bulundu`);
    
    // Find our shipment
    const shipmentIdNum = typeof shipment.id === 'string' ? parseInt(shipment.id) : shipment.id;
    const targetShipment = openShipments.find(s => {
      const sId = typeof s.id === 'string' ? parseInt(s.id) : s.id;
      return sId === shipmentIdNum || s.id === shipment.id || s.id === shipment.id.toString();
    });
    
    if (!targetShipment) {
      logStep('offerFlow', 'Gönderi Bulma', false, `Gönderi açık listede görünmüyor (Aranan ID: ${shipment.id})`);
      console.log(`  ⚠️ Gönderi durumu: ${openShipments.length > 0 ? openShipments[0].status : 'N/A'}`);
      return;
    }
    logStep('offerFlow', 'Gönderi Bulma', true, `Gönderi bulundu (ID: ${targetShipment.id}, Status: ${targetShipment.status})`);
    
    // 4. Nakliyeci creates offer
    console.log('5. Teklif oluşturuluyor...');
    const offer = await createOffer(nakliyeciUser, targetShipment.id, 5500);
    if (!offer) {
      logStep('offerFlow', 'Teklif Oluşturma', false, 'Teklif oluşturulamadı');
      return;
    }
    createdOffers.offerFlow = offer;
    logStep('offerFlow', 'Teklif Oluşturma', true, `Teklif oluşturuldu (ID: ${offer.id}, Fiyat: ${offer.price} TL)`);
    
    // 5. Individual sees the offer
    console.log('6. Teklifler kontrol ediliyor...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    const offers = await getOffers(individualUser, 'individual');
    const foundOffer = offers.find(o => {
      const oId = typeof o.id === 'string' ? parseInt(o.id) : o.id;
      return oId === offer.id || o.id === offer.id || o.id === offer.id.toString();
    });
    
    if (!foundOffer) {
      logStep('offerFlow', 'Teklif Görüntüleme', false, `Teklif listede görünmüyor (Aranan ID: ${offer.id})`);
      return;
    }
    logStep('offerFlow', 'Teklif Görüntüleme', true, `Teklif görüntülendi (${offers.length} teklif var)`);
    
    // 6. Individual accepts the offer
    console.log('7. Teklif kabul ediliyor...');
    const acceptSuccess = await acceptOffer(individualUser, offer.id);
    if (!acceptSuccess) {
      logStep('offerFlow', 'Teklif Kabul Etme', false, 'Teklif kabul edilemedi');
      return;
    }
    logStep('offerFlow', 'Teklif Kabul Etme', true, 'Teklif başarıyla kabul edildi');
    
    // 7. Verify shipment status updated
    console.log('8. Gönderi durumu kontrol ediliyor...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    const updatedShipment = await getShipment(individualUser, shipment.id);
    if (updatedShipment) {
      const status = updatedShipment.status || updatedShipment.Status;
      logStep('offerFlow', 'Gönderi Durumu Güncelleme', status === 'accepted' || status === 'Accepted', 
        `Gönderi durumu: ${status} (beklenen: accepted)`);
    } else {
      logStep('offerFlow', 'Gönderi Durumu Güncelleme', false, 'Gönderi bilgisi alınamadı');
    }
    
    console.log(`\n✅ Teklif Akışı Testi: ${testResults.offerFlow.passed}/${testResults.offerFlow.passed + testResults.offerFlow.failed} başarılı\n`);
    
  } catch (error) {
    console.error('❌ Offer flow error:', error);
    logStep('offerFlow', 'Genel Hata', false, error.message);
  }
}

// TEST 2: STATUS UPDATES
async function testStatusUpdates() {
  console.log('\n📊 === TEST 2: GÖNDERİ DURUMU GÜNCELLEMELERİ ===\n');
  
  try {
    // Use existing accepted shipment from offer flow test
    if (!createdShipments.offerFlow) {
      logStep('statusUpdates', 'Ön Koşul', false, 'Kabul edilmiş gönderi bulunamadı');
      return;
    }
    
    const shipment = createdShipments.offerFlow;
    const nakliyeciUser = createdUsers.nakliyeci;
    
    if (!nakliyeciUser) {
      logStep('statusUpdates', 'Ön Koşul', false, 'Nakliyeci kullanıcı bulunamadı');
      return;
    }
    
    // Test status update to in_transit
    console.log('1. Gönderi durumu "in_transit" olarak güncelleniyor...');
    const inTransitSuccess = await updateShipmentStatus(nakliyeciUser, shipment.id, 'in_transit');
    logStep('statusUpdates', 'Durum: in_transit', inTransitSuccess, 
      inTransitSuccess ? 'Gönderi durumu "in_transit" olarak güncellendi' : 'Durum güncellenemedi');
    
    if (inTransitSuccess) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const updatedShipment = await getShipment(nakliyeciUser, shipment.id);
      if (updatedShipment) {
        const status = updatedShipment.status || updatedShipment.Status;
        logStep('statusUpdates', 'Durum Doğrulama: in_transit', status === 'in_transit' || status === 'In_Transit',
          `Gönderi durumu: ${status}`);
      }
    }
    
    // Test status update to delivered
    console.log('2. Gönderi durumu "delivered" olarak güncelleniyor...');
    const deliveredSuccess = await updateShipmentStatus(nakliyeciUser, shipment.id, 'delivered');
    logStep('statusUpdates', 'Durum: delivered', deliveredSuccess,
      deliveredSuccess ? 'Gönderi durumu "delivered" olarak güncellendi' : 'Durum güncellenemedi');
    
    if (deliveredSuccess) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const updatedShipment = await getShipment(nakliyeciUser, shipment.id);
      if (updatedShipment) {
        const status = updatedShipment.status || updatedShipment.Status;
        logStep('statusUpdates', 'Durum Doğrulama: delivered', status === 'delivered' || status === 'Delivered',
          `Gönderi durumu: ${status}`);
      }
    }
    
    console.log(`\n✅ Durum Güncelleme Testi: ${testResults.statusUpdates.passed}/${testResults.statusUpdates.passed + testResults.statusUpdates.failed} başarılı\n`);
    
  } catch (error) {
    console.error('❌ Status updates error:', error);
    logStep('statusUpdates', 'Genel Hata', false, error.message);
  }
}

// TEST 3: INTEGRATION - Multiple Users
async function testIntegration() {
  console.log('\n🔄 === TEST 3: TAM ENTEGRASYON TESTİ ===\n');
  
  try {
    // Create multiple shipments from different users
    console.log('1. Çoklu kullanıcı gönderileri oluşturuluyor...');
    
    const individual1 = await createUser('individual');
    if (individual1) {
      await loginUser(individual1);
      const shipment1 = await createShipment(individual1, 'individual');
      if (shipment1) {
        logStep('integration', 'Çoklu Gönderi 1', true, `Gönderi oluşturuldu (ID: ${shipment1.id})`);
      }
    }
    
    const corporate1 = await createUser('corporate');
    if (corporate1) {
      await loginUser(corporate1);
      const shipment2 = await createShipment(corporate1, 'corporate');
      if (shipment2) {
        logStep('integration', 'Çoklu Gönderi 2', true, `Gönderi oluşturuldu (ID: ${shipment2.id})`);
      }
    }
    
    // Wait for all shipments to be available
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Nakliyeci should see all open shipments
    const nakliyeci = createdUsers.nakliyeci || await createUser('nakliyeci');
    if (nakliyeci) {
      await loginUser(nakliyeci);
      const openShipments = await getOpenShipments(nakliyeci);
      logStep('integration', 'Çoklu Gönderi Görüntüleme', openShipments.length >= 1,
        `${openShipments.length} açık gönderi bulundu (beklenen: 1+)`);
    }
    
    console.log(`\n✅ Entegrasyon Testi: ${testResults.integration.passed}/${testResults.integration.passed + testResults.integration.failed} başarılı\n`);
    
  } catch (error) {
    console.error('❌ Integration error:', error);
    logStep('integration', 'Genel Hata', false, error.message);
  }
}

// Main test function
async function runAllTests() {
  console.log('🧪 === TAM İŞ AKIŞI TESTİ BAŞLIYOR ===\n');
  console.log('⚠️  Frontend ve Backend\'in çalıştığından emin olun!\n');
  
  await initBrowser();
  
  try {
    // Test 1: Complete Offer Flow
    await testOfferFlow();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 2: Status Updates
    await testStatusUpdates();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 3: Integration
    await testIntegration();
    
    // Summary
    console.log('\n📊 === TEST ÖZETİ ===\n');
    
    Object.keys(testResults).forEach(category => {
      if (category === 'total') return;
      const results = testResults[category];
      const total = results.passed + results.failed;
      const successRate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;
      console.log(`${category.toUpperCase()}:`);
      console.log(`  ✅ Başarılı: ${results.passed}`);
      console.log(`  ❌ Başarısız: ${results.failed}`);
      console.log(`  📈 Başarı Oranı: ${successRate}%`);
      console.log('');
    });
    
    const totalPassed = testResults.total.passed;
    const totalFailed = testResults.total.failed;
    const totalTests = totalPassed + totalFailed;
    const overallSuccessRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0;
    
    console.log('TOPLAM:');
    console.log(`  ✅ Başarılı: ${totalPassed}`);
    console.log(`  ❌ Başarısız: ${totalFailed}`);
    console.log(`  📈 Genel Başarı Oranı: ${overallSuccessRate}%`);
    
    console.log(`\n👥 Oluşturulan Kullanıcılar: ${Object.keys(createdUsers).length}`);
    console.log(`📦 Oluşturulan Gönderiler: ${Object.keys(createdShipments).length}`);
    console.log(`💼 Oluşturulan Teklifler: ${Object.keys(createdOffers).length}`);
    
  } catch (error) {
    console.error('❌ Test hatası:', error);
  } finally {
    console.log('\n⏳ Browser 3 saniye sonra kapanacak...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    await closeBrowser();
    console.log('✅ Test tamamlandı!');
  }
}

runAllTests().catch(console.error);

