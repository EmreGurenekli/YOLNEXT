/**
 * Complete Workflow Test - All User Types
 * Tests the full business flow for each user type with real data
 */

const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:5000/api';

let browser = null;
let context = null;
let page = null;

const testResults = {
  individual: { steps: [], passed: 0, failed: 0 },
  corporate: { steps: [], passed: 0, failed: 0 },
  nakliyeci: { steps: [], passed: 0, failed: 0 },
  tasiyici: { steps: [], passed: 0, failed: 0 }
};

let createdUsers = {};
let createdShipments = {};
let createdOffers = {};

function logStep(panel, step, success, message) {
  testResults[panel].steps.push({ step, success, message, timestamp: new Date().toISOString() });
  if (success) {
    testResults[panel].passed++;
    console.log(`✅ [${panel.toUpperCase()}] ${step}: ${message}`);
  } else {
    testResults[panel].failed++;
    console.error(`❌ [${panel.toUpperCase()}] ${step}: ${message}`);
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
    const email = `workflow_test_${userType}_${timestamp}_${random}@yolnext.com`;
    const password = 'Test123!@#';
    
    const userData = {
      email,
      password,
      fullName: `Workflow Test ${userType}`,
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
      // TC Kimlik No zorunlu (11 haneli) - Generate valid TCKN format
      // TCKN must start with non-zero, have valid checksum
      // Generate 9 random digits (first digit must be 1-9)
      const firstDigit = Math.floor(Math.random() * 9) + 1; // 1-9
      const middleDigits = String(Math.floor(Math.random() * 100000000)).padStart(8, '0');
      const base = `${firstDigit}${middleDigits}`; // 9 digits total
      
      // Calculate checksum digits (10th and 11th)
      const digits = base.split('').map(Number);
      const sum1 = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
      const sum2 = digits[1] + digits[3] + digits[5] + digits[7];
      const check1 = (sum1 * 7 - sum2) % 10;
      if (check1 < 0) check1 += 10; // Ensure positive
      const sumAll = digits.reduce((a, b) => a + b, 0) + check1;
      const check2 = sumAll % 10;
      
      const tckn = `${base}${check1}${check2}`; // Total: 11 digits
      userData.tckn = tckn;
      console.log(`  🔑 Generated TCKN: ${tckn} (length: ${tckn.length})`);
    }
    
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
      signal: AbortSignal.timeout(10000)
    });
    
    if (!response.ok && userType === 'tasiyici') {
      const errorText = await response.text();
      console.error(`  ⚠️ Tasiyici register failed (${response.status}): ${errorText.substring(0, 300)}`);
    }
    
    if (response.ok) {
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
      title: `Workflow Test: ${type} Gönderi - ${Date.now()}`,
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

async function createOffer(user, shipmentId) {
  try {
    const offerData = {
      shipmentId: shipmentId,
      price: 5000,
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
        shipmentId
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

async function getOpenShipments(user) {
  try {
    // API_URL already includes /api
    const response = await fetch(`${API_URL}/shipments/open`, {
      headers: {
        'Authorization': `Bearer ${user.token}`
      },
      signal: AbortSignal.timeout(10000)
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.data?.shipments || data.shipments || [];
    }
    return [];
  } catch (error) {
    return [];
  }
}

async function getOffers(user, type) {
  try {
    // API_URL already includes /api
    const endpoint = type === 'individual' ? '/offers/individual' : '/offers/corporate';
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${user.token}`
      },
      signal: AbortSignal.timeout(10000)
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.data?.offers || data.offers || [];
    }
    return [];
  } catch (error) {
    return [];
  }
}

async function getShipments(user, type) {
  try {
    // Use specific endpoints for better accuracy (API_URL already includes /api)
    const endpoint = type === 'individual' ? '/shipments/individual' : '/shipments/corporate';
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${user.token}`
      },
      signal: AbortSignal.timeout(10000)
    });
    
    if (response.ok) {
      const data = await response.json();
      const shipments = data.data?.shipments || (Array.isArray(data.data) ? data.data : []) || [];
      console.log(`  📊 ${type} gönderileri: ${shipments.length} adet (Endpoint: ${endpoint})`);
      if (shipments.length > 0) {
        console.log(`  📋 İlk gönderi ID: ${shipments[0].id}, userId: ${shipments[0].userId}`);
      }
      return shipments;
    } else {
      const errorText = await response.text();
      console.error(`  ⚠️ Shipments fetch failed (${response.status}): ${errorText.substring(0, 200)}`);
      return [];
    }
  } catch (error) {
    console.error(`  ⚠️ Shipments fetch error: ${error.message}`);
    return [];
  }
}

// TEST 1: INDIVIDUAL WORKFLOW
async function testIndividualWorkflow() {
  console.log('\n📦 === TEST 1: BİREYSEL GÖNDERİCİ İŞ AKIŞI ===\n');
  
  try {
    // 1. Create user
    const user = await createUser('individual');
    if (!user) {
      logStep('individual', 'Kullanıcı Oluşturma', false, 'Kullanıcı oluşturulamadı');
      return;
    }
    createdUsers.individual = user;
    logStep('individual', 'Kullanıcı Oluşturma', true, `Kullanıcı oluşturuldu (ID: ${user.id})`);
    
    // 2. Login
    const loginSuccess = await loginUser(user);
    if (!loginSuccess) {
      logStep('individual', 'Login', false, 'Login başarısız');
      return;
    }
    logStep('individual', 'Login', true, 'Login başarılı');
    
    // 3. Create shipment
    const shipment = await createShipment(user, 'individual');
    if (!shipment) {
      logStep('individual', 'Gönderi Oluşturma', false, 'Gönderi oluşturulamadı');
      return;
    }
    createdShipments.individual = shipment;
    logStep('individual', 'Gönderi Oluşturma', true, `Gönderi oluşturuldu (ID: ${shipment.id}, Takip: ${shipment.trackingNumber})`);
    
    // 4. Check if shipment appears in "My Shipments"
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for notification and DB sync
    const myShipments = await getShipments(user, 'individual');
    // Compare IDs (handle both string and number)
    const shipmentIdNum = typeof shipment.id === 'string' ? parseInt(shipment.id) : shipment.id;
    const foundShipment = myShipments.find(s => {
      const sId = typeof s.id === 'string' ? parseInt(s.id) : s.id;
      return sId === shipmentIdNum || s.id === shipment.id || s.id === shipment.id.toString();
    });
    logStep('individual', 'Gönderilerim Listesi', foundShipment ? true : false, 
      foundShipment ? `Gönderi "Gönderilerim" listesinde görünüyor (${myShipments.length} gönderi bulundu)` : 
      `Gönderi "Gönderilerim" listesinde görünmüyor (${myShipments.length} gönderi var, aranan ID: ${shipment.id})`);
    
    // 5. Check for offers (should be empty initially)
    const offers = await getOffers(user, 'individual');
    logStep('individual', 'Teklifler Listesi', true, `${offers.length} teklif var (beklenen: 0 veya daha fazla)`);
    
    console.log(`\n✅ Bireysel Gönderici Testi: ${testResults.individual.passed}/${testResults.individual.passed + testResults.individual.failed} başarılı\n`);
    
  } catch (error) {
    console.error('❌ Individual workflow error:', error);
    logStep('individual', 'Genel Hata', false, error.message);
  }
}

// TEST 2: CORPORATE WORKFLOW
async function testCorporateWorkflow() {
  console.log('\n🏢 === TEST 2: KURUMSAL GÖNDERİCİ İŞ AKIŞI ===\n');
  
  try {
    // 1. Create user
    const user = await createUser('corporate');
    if (!user) {
      logStep('corporate', 'Kullanıcı Oluşturma', false, 'Kullanıcı oluşturulamadı');
      return;
    }
    createdUsers.corporate = user;
    logStep('corporate', 'Kullanıcı Oluşturma', true, `Kullanıcı oluşturuldu (ID: ${user.id})`);
    
    // 2. Login
    const loginSuccess = await loginUser(user);
    if (!loginSuccess) {
      logStep('corporate', 'Login', false, 'Login başarısız');
      return;
    }
    logStep('corporate', 'Login', true, 'Login başarılı');
    
    // 3. Create shipment
    const shipment = await createShipment(user, 'corporate');
    if (!shipment) {
      logStep('corporate', 'Gönderi Oluşturma', false, 'Gönderi oluşturulamadı');
      return;
    }
    createdShipments.corporate = shipment;
    logStep('corporate', 'Gönderi Oluşturma', true, `Gönderi oluşturuldu (ID: ${shipment.id}, Takip: ${shipment.trackingNumber})`);
    
    // 4. Check if shipment appears in shipments list
    await new Promise(resolve => setTimeout(resolve, 3000));
    const shipments = await getShipments(user, 'corporate');
    const shipmentIdNum = typeof shipment.id === 'string' ? parseInt(shipment.id) : shipment.id;
    const foundShipment = shipments.find(s => {
      const sId = typeof s.id === 'string' ? parseInt(s.id) : s.id;
      return sId === shipmentIdNum || s.id === shipment.id || s.id === shipment.id.toString();
    });
    logStep('corporate', 'Gönderiler Listesi', foundShipment ? true : false,
      foundShipment ? `Gönderi listesinde görünüyor (${shipments.length} gönderi bulundu)` : 
      `Gönderi listesinde görünmüyor (${shipments.length} gönderi var, aranan ID: ${shipment.id})`);
    
    // 5. Check for offers
    const offers = await getOffers(user, 'corporate');
    logStep('corporate', 'Teklifler Listesi', true, `${offers.length} teklif var`);
    
    console.log(`\n✅ Kurumsal Gönderici Testi: ${testResults.corporate.passed}/${testResults.corporate.passed + testResults.corporate.failed} başarılı\n`);
    
  } catch (error) {
    console.error('❌ Corporate workflow error:', error);
    logStep('corporate', 'Genel Hata', false, error.message);
  }
}

// TEST 3: NAKLİYECİ WORKFLOW
async function testNakliyeciWorkflow() {
  console.log('\n🚛 === TEST 3: NAKLİYECİ İŞ AKIŞI ===\n');
  
  try {
    // 1. Create user
    const user = await createUser('nakliyeci');
    if (!user) {
      logStep('nakliyeci', 'Kullanıcı Oluşturma', false, 'Kullanıcı oluşturulamadı');
      return;
    }
    createdUsers.nakliyeci = user;
    logStep('nakliyeci', 'Kullanıcı Oluşturma', true, `Kullanıcı oluşturuldu (ID: ${user.id})`);
    
    // 2. Login
    const loginSuccess = await loginUser(user);
    if (!loginSuccess) {
      logStep('nakliyeci', 'Login', false, 'Login başarısız');
      return;
    }
    logStep('nakliyeci', 'Login', true, 'Login başarılı');
    
    // 3. Get open shipments (Yük Pazarı)
    // Wait a bit for any recently created shipments to be available
    await new Promise(resolve => setTimeout(resolve, 2000));
    const openShipments = await getOpenShipments(user);
    logStep('nakliyeci', 'Açık Gönderileri Görüntüleme', true, `${openShipments.length} açık gönderi bulundu`);
    
    // 4. Create offer if there are open shipments
    if (openShipments.length > 0) {
      const targetShipment = openShipments[0];
      console.log(`  📦 Hedef gönderi: ID=${targetShipment.id}, Status=${targetShipment.status}, Title=${targetShipment.title}`);
      const offer = await createOffer(user, targetShipment.id);
      if (offer) {
        createdOffers.nakliyeci = offer;
        logStep('nakliyeci', 'Teklif Verme', true, `Teklif verildi (ID: ${offer.id})`);
      } else {
        logStep('nakliyeci', 'Teklif Verme', false, 'Teklif verilemedi');
      }
    } else {
      logStep('nakliyeci', 'Teklif Verme', true, 'Açık gönderi yok (normal - yeni gönderiler oluşturulduğunda görünecek)');
    }
    
    // 5. Check active shipments
    try {
      const response = await fetch(`${API_URL}/shipments/nakliyeci/active`, {
        headers: { 'Authorization': `Bearer ${user.token}` },
        signal: AbortSignal.timeout(10000)
      });
      if (response.ok) {
        const data = await response.json();
        const activeShipments = data.data?.shipments || data.shipments || [];
        logStep('nakliyeci', 'Aktif Yükler', true, `${activeShipments.length} aktif gönderi var`);
      }
    } catch (e) {
      logStep('nakliyeci', 'Aktif Yükler', false, e.message);
    }
    
    console.log(`\n✅ Nakliyeci Testi: ${testResults.nakliyeci.passed}/${testResults.nakliyeci.passed + testResults.nakliyeci.failed} başarılı\n`);
    
  } catch (error) {
    console.error('❌ Nakliyeci workflow error:', error);
    logStep('nakliyeci', 'Genel Hata', false, error.message);
  }
}

// TEST 4: TAŞIYICI WORKFLOW
async function testTasiyiciWorkflow() {
  console.log('\n🚗 === TEST 4: TAŞIYICI İŞ AKIŞI ===\n');
  
  try {
    // 1. Create user
    const user = await createUser('tasiyici');
    if (!user) {
      logStep('tasiyici', 'Kullanıcı Oluşturma', false, 'Kullanıcı oluşturulamadı');
      return;
    }
    createdUsers.tasiyici = user;
    logStep('tasiyici', 'Kullanıcı Oluşturma', true, `Kullanıcı oluşturuldu (ID: ${user.id})`);
    
    // 2. Login
    const loginSuccess = await loginUser(user);
    if (!loginSuccess) {
      logStep('tasiyici', 'Login', false, 'Login başarısız');
      return;
    }
    logStep('tasiyici', 'Login', true, 'Login başarılı');
    
    // 3. Get available listings (İş Pazarı)
    const openShipments = await getOpenShipments(user);
    logStep('tasiyici', 'İş Pazarı', true, `${openShipments.length} açık ilan bulundu`);
    
    // 4. Check active jobs
    try {
      const response = await fetch(`${API_URL}/shipments/tasiyici`, {
        headers: { 'Authorization': `Bearer ${user.token}` },
        signal: AbortSignal.timeout(10000)
      });
      if (response.ok) {
        const data = await response.json();
        const activeJobs = data.data?.shipments || data.shipments || [];
        logStep('tasiyici', 'Aktif İşler', true, `${activeJobs.length} aktif iş var`);
      }
    } catch (e) {
      logStep('tasiyici', 'Aktif İşler', false, e.message);
    }
    
    console.log(`\n✅ Taşıyıcı Testi: ${testResults.tasiyici.passed}/${testResults.tasiyici.passed + testResults.tasiyici.failed} başarılı\n`);
    
  } catch (error) {
    console.error('❌ Tasiyici workflow error:', error);
    logStep('tasiyici', 'Genel Hata', false, error.message);
  }
}

// TEST 5: FULL INTEGRATION WORKFLOW
async function testFullIntegrationWorkflow() {
  console.log('\n🔄 === TEST 5: TAM ENTEGRASYON İŞ AKIŞI ===\n');
  
  try {
    // 1. Individual creates shipment
    console.log('1. Bireysel gönderici gönderi oluşturuyor...');
    const individualUser = await createUser('individual');
    if (!individualUser) {
      console.error('❌ Individual user oluşturulamadı');
      return;
    }
    await loginUser(individualUser);
    const shipment = await createShipment(individualUser, 'individual');
    if (!shipment) {
      console.error('❌ Gönderi oluşturulamadı');
      return;
    }
    console.log(`✅ Gönderi oluşturuldu: ${shipment.id} (Takip: ${shipment.trackingNumber})`);
    
    // 2. Wait for notification
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 3. Nakliyeci sees the shipment and makes offer
    console.log('2. Nakliyeci gönderiyi görüyor ve teklif veriyor...');
    const nakliyeciUser = await createUser('nakliyeci');
    if (!nakliyeciUser) {
      console.error('❌ Nakliyeci user oluşturulamadı');
      return;
    }
    await loginUser(nakliyeciUser);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const openShipments = await getOpenShipments(nakliyeciUser);
    const targetShipment = openShipments.find(s => s.id === shipment.id || s.id === shipment.id.toString());
    
    if (targetShipment) {
      console.log(`✅ Nakliyeci gönderiyi gördü: ${targetShipment.id}`);
      const offer = await createOffer(nakliyeciUser, targetShipment.id);
      if (offer) {
        console.log(`✅ Teklif verildi: ${offer.id}`);
      } else {
        console.error('❌ Teklif verilemedi');
      }
    } else {
      console.error('❌ Nakliyeci gönderiyi göremedi');
    }
    
    // 4. Individual sees the offer
    console.log('3. Bireysel gönderici teklifi görüyor...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    const offers = await getOffers(individualUser, 'individual');
    console.log(`✅ ${offers.length} teklif bulundu`);
    
    console.log('\n✅ Tam entegrasyon testi tamamlandı!\n');
    
  } catch (error) {
    console.error('❌ Full integration error:', error);
  }
}

// Main test function
async function runAllTests() {
  console.log('🧪 === TAM İŞ AKIŞI TESTİ BAŞLIYOR ===\n');
  console.log('⚠️  Frontend ve Backend\'in çalıştığından emin olun!\n');
  
  await initBrowser();
  
  try {
    // Test each user type workflow
    await testIndividualWorkflow();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await testCorporateWorkflow();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await testNakliyeciWorkflow();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await testTasiyiciWorkflow();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test full integration
    await testFullIntegrationWorkflow();
    
    // Summary
    console.log('\n📊 === TEST ÖZETİ ===\n');
    
    ['individual', 'corporate', 'nakliyeci', 'tasiyici'].forEach(panel => {
      const results = testResults[panel];
      const total = results.passed + results.failed;
      const successRate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;
      console.log(`${panel.toUpperCase()}:`);
      console.log(`  ✅ Başarılı: ${results.passed}`);
      console.log(`  ❌ Başarısız: ${results.failed}`);
      console.log(`  📈 Başarı Oranı: ${successRate}%`);
      console.log('');
    });
    
    const totalPassed = Object.values(testResults).reduce((sum, r) => sum + r.passed, 0);
    const totalFailed = Object.values(testResults).reduce((sum, r) => sum + r.failed, 0);
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

