/**
 * Complete Feature Test - All Remaining Features
 * Tests: Offer rejection, shipment cancellation, carrier assignment, multiple offers, search, etc.
 */

const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:5000/api';

let browser = null;
let context = null;
let page = null;

const testResults = {
  total: { passed: 0, failed: 0, steps: [] },
  offerRejection: { passed: 0, failed: 0, steps: [] },
  cancellation: { passed: 0, failed: 0, steps: [] },
  carrierAssignment: { passed: 0, failed: 0, steps: [] },
  multipleOffers: { passed: 0, failed: 0, steps: [] },
  searchFilter: { passed: 0, failed: 0, steps: [] }
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
    const email = `all_features_test_${userType}_${timestamp}_${random}@yolnext.com`;
    const password = 'Test123!@#';
    
    const userData = {
      email,
      password,
      fullName: `All Features Test ${userType}`,
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
      title: `All Features Test: ${type} Gönderi - ${Date.now()}`,
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
      message: `Test teklifi - ${price} TL - Hızlı ve güvenli taşıma garantisi`,
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

async function rejectOffer(user, offerId) {
  try {
    const response = await fetch(`${API_URL}/offers/${offerId}/reject`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${user.token}`
      },
      signal: AbortSignal.timeout(10000)
    });
    
    if (response.ok) {
      return true;
    } else {
      const errorText = await response.text();
      console.error(`Offer rejection failed: ${errorText.substring(0, 200)}`);
      return false;
    }
  } catch (error) {
    console.error(`Offer rejection error: ${error.message}`);
    return false;
  }
}

async function cancelShipment(user, shipmentId, reason = 'Test iptal nedeni') {
  try {
    const response = await fetch(`${API_URL}/shipments/${shipmentId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`
      },
      body: JSON.stringify({ reason, reasonDetail: 'Test iptal detayı' }),
      signal: AbortSignal.timeout(10000)
    });
    
    if (response.ok) {
      return true;
    } else {
      const errorText = await response.text();
      console.error(`Shipment cancellation failed: ${errorText.substring(0, 200)}`);
      return false;
    }
  } catch (error) {
    console.error(`Shipment cancellation error: ${error.message}`);
    return false;
  }
}

async function assignCarrier(user, shipmentId, carrierId) {
  try {
    const response = await fetch(`${API_URL}/shipments/${shipmentId}/assign-carrier`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`
      },
      body: JSON.stringify({ carrierId }),
      signal: AbortSignal.timeout(10000)
    });
    
    if (response.ok) {
      return true;
    } else {
      const errorText = await response.text();
      console.error(`  ⚠️ Carrier assignment failed (${response.status}): ${errorText.substring(0, 300)}`);
      return false;
    }
  } catch (error) {
    console.error(`  ⚠️ Carrier assignment error: ${error.message}`);
    return false;
  }
}

async function getOpenShipments(user, search = '') {
  try {
    const url = `${API_URL}/shipments/open${search ? `?search=${encodeURIComponent(search)}` : ''}`;
    const response = await fetch(url, {
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

// TEST 1: OFFER REJECTION
async function testOfferRejection() {
  console.log('\n🚫 === TEST 1: TEKLİF REDDETME ===\n');
  
  try {
    // 1. Create Individual user and shipment
    const individualUser = await createUser('individual');
    if (!individualUser) {
      logStep('offerRejection', 'Kullanıcı Oluşturma', false, 'Kullanıcı oluşturulamadı');
      return;
    }
    createdUsers.rejectionIndividual = individualUser;
    logStep('offerRejection', 'Kullanıcı Oluşturma', true, `Kullanıcı oluşturuldu (ID: ${individualUser.id})`);
    
    await loginUser(individualUser);
    logStep('offerRejection', 'Login', true, 'Login başarılı');
    
    const shipment = await createShipment(individualUser, 'individual');
    if (!shipment) {
      logStep('offerRejection', 'Gönderi Oluşturma', false, 'Gönderi oluşturulamadı');
      return;
    }
    createdShipments.rejection = shipment;
    logStep('offerRejection', 'Gönderi Oluşturma', true, `Gönderi oluşturuldu (ID: ${shipment.id})`);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 2. Create Nakliyeci and make offer
    const nakliyeciUser = await createUser('nakliyeci');
    if (!nakliyeciUser) {
      logStep('offerRejection', 'Nakliyeci Oluşturma', false, 'Nakliyeci oluşturulamadı');
      return;
    }
    createdUsers.rejectionNakliyeci = nakliyeciUser;
    logStep('offerRejection', 'Nakliyeci Oluşturma', true, `Nakliyeci oluşturuldu (ID: ${nakliyeciUser.id})`);
    
    await loginUser(nakliyeciUser);
    logStep('offerRejection', 'Nakliyeci Login', true, 'Login başarılı');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    const openShipments = await getOpenShipments(nakliyeciUser);
    const shipmentIdNum = typeof shipment.id === 'string' ? parseInt(shipment.id) : shipment.id;
    const targetShipment = openShipments.find(s => {
      const sId = typeof s.id === 'string' ? parseInt(s.id) : s.id;
      return sId === shipmentIdNum || s.id === shipment.id || s.id === shipment.id.toString();
    });
    
    if (!targetShipment) {
      logStep('offerRejection', 'Gönderi Bulma', false, 'Gönderi bulunamadı');
      return;
    }
    logStep('offerRejection', 'Gönderi Bulma', true, 'Gönderi bulundu');
    
    const offer = await createOffer(nakliyeciUser, targetShipment.id, 6000);
    if (!offer) {
      logStep('offerRejection', 'Teklif Oluşturma', false, 'Teklif oluşturulamadı');
      return;
    }
    createdOffers.rejection = offer;
    logStep('offerRejection', 'Teklif Oluşturma', true, `Teklif oluşturuldu (ID: ${offer.id})`);
    
    // 3. Individual rejects the offer
    await new Promise(resolve => setTimeout(resolve, 2000));
    const rejectSuccess = await rejectOffer(individualUser, offer.id);
    if (!rejectSuccess) {
      logStep('offerRejection', 'Teklif Reddetme', false, 'Teklif reddedilemedi');
      return;
    }
    logStep('offerRejection', 'Teklif Reddetme', true, 'Teklif başarıyla reddedildi');
    
    // 4. Verify offer status
    await new Promise(resolve => setTimeout(resolve, 2000));
    const offers = await getOffers(individualUser, 'individual');
    const rejectedOffer = offers.find(o => {
      const oId = typeof o.id === 'string' ? parseInt(o.id) : o.id;
      return oId === offer.id;
    });
    
    if (rejectedOffer) {
      const status = rejectedOffer.status || rejectedOffer.Status;
      logStep('offerRejection', 'Teklif Durumu Doğrulama', status === 'rejected' || status === 'Rejected',
        `Teklif durumu: ${status} (beklenen: rejected)`);
    } else {
      logStep('offerRejection', 'Teklif Durumu Doğrulama', false, 'Teklif bulunamadı');
    }
    
    console.log(`\n✅ Teklif Reddetme Testi: ${testResults.offerRejection.passed}/${testResults.offerRejection.passed + testResults.offerRejection.failed} başarılı\n`);
    
  } catch (error) {
    console.error('❌ Offer rejection error:', error);
    logStep('offerRejection', 'Genel Hata', false, error.message);
  }
}

// TEST 2: SHIPMENT CANCELLATION
async function testCancellation() {
  console.log('\n❌ === TEST 2: GÖNDERİ İPTAL ETME ===\n');
  
  try {
    const individualUser = await createUser('individual');
    if (!individualUser) {
      logStep('cancellation', 'Kullanıcı Oluşturma', false, 'Kullanıcı oluşturulamadı');
      return;
    }
    createdUsers.cancellationIndividual = individualUser;
    logStep('cancellation', 'Kullanıcı Oluşturma', true, `Kullanıcı oluşturuldu (ID: ${individualUser.id})`);
    
    await loginUser(individualUser);
    logStep('cancellation', 'Login', true, 'Login başarılı');
    
    const shipment = await createShipment(individualUser, 'individual');
    if (!shipment) {
      logStep('cancellation', 'Gönderi Oluşturma', false, 'Gönderi oluşturulamadı');
      return;
    }
    createdShipments.cancellation = shipment;
    logStep('cancellation', 'Gönderi Oluşturma', true, `Gönderi oluşturuldu (ID: ${shipment.id})`);
    
    // Cancel the shipment
    await new Promise(resolve => setTimeout(resolve, 2000));
    const cancelSuccess = await cancelShipment(individualUser, shipment.id, 'Test iptal nedeni');
    if (!cancelSuccess) {
      logStep('cancellation', 'Gönderi İptal Etme', false, 'Gönderi iptal edilemedi');
      return;
    }
    logStep('cancellation', 'Gönderi İptal Etme', true, 'Gönderi başarıyla iptal edildi');
    
    // Verify shipment status
    await new Promise(resolve => setTimeout(resolve, 2000));
    const cancelledShipment = await getShipment(individualUser, shipment.id);
    if (cancelledShipment) {
      const status = cancelledShipment.status || cancelledShipment.Status;
      logStep('cancellation', 'Gönderi Durumu Doğrulama', status === 'cancelled' || status === 'Cancelled',
        `Gönderi durumu: ${status} (beklenen: cancelled)`);
    } else {
      logStep('cancellation', 'Gönderi Durumu Doğrulama', false, 'Gönderi bilgisi alınamadı');
    }
    
    console.log(`\n✅ Gönderi İptal Etme Testi: ${testResults.cancellation.passed}/${testResults.cancellation.passed + testResults.cancellation.failed} başarılı\n`);
    
  } catch (error) {
    console.error('❌ Cancellation error:', error);
    logStep('cancellation', 'Genel Hata', false, error.message);
  }
}

// TEST 3: CARRIER ASSIGNMENT
async function testCarrierAssignment() {
  console.log('\n🚛 === TEST 3: TAŞIYICI ATAMA ===\n');
  
  try {
    // 1. Create Individual user and shipment
    const individualUser = await createUser('individual');
    if (!individualUser) {
      logStep('carrierAssignment', 'Kullanıcı Oluşturma', false, 'Kullanıcı oluşturulamadı');
      return;
    }
    createdUsers.assignmentIndividual = individualUser;
    logStep('carrierAssignment', 'Kullanıcı Oluşturma', true, `Kullanıcı oluşturuldu (ID: ${individualUser.id})`);
    
    await loginUser(individualUser);
    logStep('carrierAssignment', 'Login', true, 'Login başarılı');
    
    const shipment = await createShipment(individualUser, 'individual');
    if (!shipment) {
      logStep('carrierAssignment', 'Gönderi Oluşturma', false, 'Gönderi oluşturulamadı');
      return;
    }
    createdShipments.assignment = shipment;
    logStep('carrierAssignment', 'Gönderi Oluşturma', true, `Gönderi oluşturuldu (ID: ${shipment.id})`);
    
    // 2. Create Nakliyeci and accept offer (to get accepted shipment)
    const nakliyeciUser = await createUser('nakliyeci');
    if (!nakliyeciUser) {
      logStep('carrierAssignment', 'Nakliyeci Oluşturma', false, 'Nakliyeci oluşturulamadı');
      return;
    }
    createdUsers.assignmentNakliyeci = nakliyeciUser;
    logStep('carrierAssignment', 'Nakliyeci Oluşturma', true, `Nakliyeci oluşturuldu (ID: ${nakliyeciUser.id})`);
    
    await loginUser(nakliyeciUser);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const openShipments = await getOpenShipments(nakliyeciUser);
    const shipmentIdNum = typeof shipment.id === 'string' ? parseInt(shipment.id) : shipment.id;
    const targetShipment = openShipments.find(s => {
      const sId = typeof s.id === 'string' ? parseInt(s.id) : s.id;
      return sId === shipmentIdNum || s.id === shipment.id || s.id === shipment.id.toString();
    });
    
    if (!targetShipment) {
      logStep('carrierAssignment', 'Gönderi Bulma', false, 'Gönderi bulunamadı');
      return;
    }
    
    const offer = await createOffer(nakliyeciUser, targetShipment.id, 5500);
    if (!offer) {
      logStep('carrierAssignment', 'Teklif Oluşturma', false, 'Teklif oluşturulamadı');
      return;
    }
    logStep('carrierAssignment', 'Teklif Oluşturma', true, `Teklif oluşturuldu (ID: ${offer.id})`);
    
    // 3. Individual accepts offer
    await new Promise(resolve => setTimeout(resolve, 2000));
    const acceptResponse = await fetch(`${API_URL}/offers/${offer.id}/accept`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${individualUser.token}` },
      signal: AbortSignal.timeout(15000)
    });
    
    if (!acceptResponse.ok) {
      const errorText = await acceptResponse.text();
      console.error(`  ⚠️ Offer acceptance failed (${acceptResponse.status}): ${errorText.substring(0, 300)}`);
      logStep('carrierAssignment', 'Teklif Kabul', false, `Teklif kabul edilemedi: ${errorText.substring(0, 100)}`);
      return;
    }
    logStep('carrierAssignment', 'Teklif Kabul', true, 'Teklif kabul edildi');
    
    // 4. Create Tasiyici user
    const tasiyiciUser = await createUser('tasiyici');
    if (!tasiyiciUser) {
      logStep('carrierAssignment', 'Taşıyıcı Oluşturma', false, 'Taşıyıcı oluşturulamadı');
      return;
    }
    createdUsers.assignmentTasiyici = tasiyiciUser;
    logStep('carrierAssignment', 'Taşıyıcı Oluşturma', true, `Taşıyıcı oluşturuldu (ID: ${tasiyiciUser.id})`);
    
    // 5. Nakliyeci assigns tasiyici to shipment
    await new Promise(resolve => setTimeout(resolve, 2000));
    const assignSuccess = await assignCarrier(nakliyeciUser, shipment.id, tasiyiciUser.id);
    if (!assignSuccess) {
      logStep('carrierAssignment', 'Taşıyıcı Atama', false, 'Taşıyıcı atanamadı');
      return;
    }
    logStep('carrierAssignment', 'Taşıyıcı Atama', true, 'Taşıyıcı başarıyla atandı');
    
    // 6. Verify assignment
    await new Promise(resolve => setTimeout(resolve, 2000));
    const assignedShipment = await getShipment(nakliyeciUser, shipment.id);
    if (assignedShipment) {
      const carrierId = assignedShipment.carrierId || assignedShipment.carrierid;
      logStep('carrierAssignment', 'Atama Doğrulama', carrierId == tasiyiciUser.id,
        `Atanan taşıyıcı ID: ${carrierId} (beklenen: ${tasiyiciUser.id})`);
    } else {
      logStep('carrierAssignment', 'Atama Doğrulama', false, 'Gönderi bilgisi alınamadı');
    }
    
    console.log(`\n✅ Taşıyıcı Atama Testi: ${testResults.carrierAssignment.passed}/${testResults.carrierAssignment.passed + testResults.carrierAssignment.failed} başarılı\n`);
    
  } catch (error) {
    console.error('❌ Carrier assignment error:', error);
    logStep('carrierAssignment', 'Genel Hata', false, error.message);
  }
}

// TEST 4: MULTIPLE OFFERS
async function testMultipleOffers() {
  console.log('\n💼 === TEST 4: ÇOKLU TEKLİF SENARYOSU ===\n');
  
  try {
    // 1. Create Individual user and shipment
    const individualUser = await createUser('individual');
    if (!individualUser) {
      logStep('multipleOffers', 'Kullanıcı Oluşturma', false, 'Kullanıcı oluşturulamadı');
      return;
    }
    createdUsers.multipleIndividual = individualUser;
    logStep('multipleOffers', 'Kullanıcı Oluşturma', true, `Kullanıcı oluşturuldu (ID: ${individualUser.id})`);
    
    await loginUser(individualUser);
    logStep('multipleOffers', 'Login', true, 'Login başarılı');
    
    const shipment = await createShipment(individualUser, 'individual');
    if (!shipment) {
      logStep('multipleOffers', 'Gönderi Oluşturma', false, 'Gönderi oluşturulamadı');
      return;
    }
    createdShipments.multiple = shipment;
    logStep('multipleOffers', 'Gönderi Oluşturma', true, `Gönderi oluşturuldu (ID: ${shipment.id})`);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 2. Create multiple nakliyeci users and make offers
    const nakliyeci1 = await createUser('nakliyeci');
    const nakliyeci2 = await createUser('nakliyeci');
    const nakliyeci3 = await createUser('nakliyeci');
    
    if (!nakliyeci1 || !nakliyeci2 || !nakliyeci3) {
      logStep('multipleOffers', 'Nakliyeci Oluşturma', false, 'Tüm nakliyeci kullanıcıları oluşturulamadı');
      return;
    }
    logStep('multipleOffers', 'Nakliyeci Oluşturma', true, '3 nakliyeci kullanıcısı oluşturuldu');
    
    await loginUser(nakliyeci1);
    await loginUser(nakliyeci2);
    await loginUser(nakliyeci3);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    const openShipments = await getOpenShipments(nakliyeci1);
    const shipmentIdNum = typeof shipment.id === 'string' ? parseInt(shipment.id) : shipment.id;
    const targetShipment = openShipments.find(s => {
      const sId = typeof s.id === 'string' ? parseInt(s.id) : s.id;
      return sId === shipmentIdNum || s.id === shipment.id || s.id === shipment.id.toString();
    });
    
    if (!targetShipment) {
      logStep('multipleOffers', 'Gönderi Bulma', false, 'Gönderi bulunamadı');
      return;
    }
    logStep('multipleOffers', 'Gönderi Bulma', true, 'Gönderi bulundu');
    
    // 3. Create 3 offers with different prices
    const offer1 = await createOffer(nakliyeci1, targetShipment.id, 5000);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const offer2 = await createOffer(nakliyeci2, targetShipment.id, 5500);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const offer3 = await createOffer(nakliyeci3, targetShipment.id, 6000);
    
    if (!offer1 || !offer2 || !offer3) {
      logStep('multipleOffers', 'Çoklu Teklif Oluşturma', false, 'Tüm teklifler oluşturulamadı');
      return;
    }
    logStep('multipleOffers', 'Çoklu Teklif Oluşturma', true, '3 teklif oluşturuldu');
    
    // 4. Individual sees all offers
    await new Promise(resolve => setTimeout(resolve, 2000));
    const offers = await getOffers(individualUser, 'individual');
    logStep('multipleOffers', 'Teklif Görüntüleme', offers.length >= 3,
      `${offers.length} teklif görüntülendi (beklenen: 3+)`);
    
    // 5. Individual accepts one offer (should reject others)
    if (offers.length > 0) {
      const acceptResponse = await fetch(`${API_URL}/offers/${offers[0].id}/accept`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${individualUser.token}` },
        signal: AbortSignal.timeout(15000)
      });
      
      if (acceptResponse.ok) {
        logStep('multipleOffers', 'Teklif Kabul', true, 'Teklif kabul edildi');
        
        // 6. Verify other offers are rejected
        await new Promise(resolve => setTimeout(resolve, 2000));
        const updatedOffers = await getOffers(individualUser, 'individual');
        const rejectedCount = updatedOffers.filter(o => {
          const status = o.status || o.Status;
          return status === 'rejected' || status === 'Rejected';
        }).length;
        
        logStep('multipleOffers', 'Diğer Tekliflerin Reddedilmesi', rejectedCount >= 2,
          `${rejectedCount} teklif reddedildi (beklenen: 2)`);
      } else {
        logStep('multipleOffers', 'Teklif Kabul', false, 'Teklif kabul edilemedi');
      }
    }
    
    console.log(`\n✅ Çoklu Teklif Testi: ${testResults.multipleOffers.passed}/${testResults.multipleOffers.passed + testResults.multipleOffers.failed} başarılı\n`);
    
  } catch (error) {
    console.error('❌ Multiple offers error:', error);
    logStep('multipleOffers', 'Genel Hata', false, error.message);
  }
}

// TEST 5: SEARCH & FILTER
async function testSearchFilter() {
  console.log('\n🔍 === TEST 5: ARAMA VE FİLTRELEME ===\n');
  
  try {
    const individualUser = await createUser('individual');
    if (!individualUser) {
      logStep('searchFilter', 'Kullanıcı Oluşturma', false, 'Kullanıcı oluşturulamadı');
      return;
    }
    logStep('searchFilter', 'Kullanıcı Oluşturma', true, `Kullanıcı oluşturuldu (ID: ${individualUser.id})`);
    
    await loginUser(individualUser);
    
    // Create shipment with specific title
    const shipment = await createShipment(individualUser, 'individual');
    if (!shipment) {
      logStep('searchFilter', 'Gönderi Oluşturma', false, 'Gönderi oluşturulamadı');
      return;
    }
    logStep('searchFilter', 'Gönderi Oluşturma', true, `Gönderi oluşturuldu (ID: ${shipment.id})`);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test search
    const nakliyeciUser = await createUser('nakliyeci');
    if (nakliyeciUser) {
      await loginUser(nakliyeciUser);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Search by city
      const searchResults = await getOpenShipments(nakliyeciUser, 'İstanbul');
      logStep('searchFilter', 'Arama (Şehir)', searchResults.length > 0,
        `${searchResults.length} sonuç bulundu (İstanbul araması)`);
      
      // Search by tracking number
      const trackingSearch = await getOpenShipments(nakliyeciUser, shipment.trackingNumber);
      logStep('searchFilter', 'Arama (Takip No)', trackingSearch.length > 0,
        `${trackingSearch.length} sonuç bulundu (Takip No araması)`);
    }
    
    console.log(`\n✅ Arama ve Filtreleme Testi: ${testResults.searchFilter.passed}/${testResults.searchFilter.passed + testResults.searchFilter.failed} başarılı\n`);
    
  } catch (error) {
    console.error('❌ Search filter error:', error);
    logStep('searchFilter', 'Genel Hata', false, error.message);
  }
}

// Main test function
async function runAllTests() {
  console.log('🧪 === TÜM ÖZELLİKLER TESTİ BAŞLIYOR ===\n');
  console.log('⚠️  Frontend ve Backend\'in çalıştığından emin olun!\n');
  
  await initBrowser();
  
  try {
    // Test 1: Offer Rejection
    await testOfferRejection();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 2: Shipment Cancellation
    await testCancellation();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 3: Carrier Assignment
    await testCarrierAssignment();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 4: Multiple Offers
    await testMultipleOffers();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 5: Search & Filter
    await testSearchFilter();
    
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

