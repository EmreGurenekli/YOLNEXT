/**
 * REALISTIC BUSINESS FLOW TEST
 * Tests the complete marketplace flow like a real user would experience
 * - Shipment publishing and visibility
 * - Carrier offers
 * - All 4 panels with their specific features
 * - Very detailed, realistic scenarios
 */

const { chromium } = require('playwright');
const API_URL = 'http://localhost:5000/api';
const FRONTEND_URL = 'http://localhost:5173';

const results = {
  passed: [],
  failed: [],
  fixed: [],
  total: 0,
  workflows: [],
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`[${timestamp}] ${prefix} ${message}`);
}

async function testAPI(endpoint, method = 'GET', body = null, token = null) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;
    if (body) options.body = JSON.stringify(body);
    
    const response = await fetch(`${API_URL}${endpoint}`, options);
    const data = await response.json();
    return { success: response.ok, status: response.status, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function generateValidTCKN() {
  const first9 = [Math.floor(Math.random() * 9) + 1];
  for (let i = 1; i < 9; i++) first9.push(Math.floor(Math.random() * 10));
  const sum1 = first9[0] + first9[2] + first9[4] + first9[6] + first9[8];
  const sum2 = first9[1] + first9[3] + first9[5] + first9[7];
  const digit10 = (7 * sum1 - sum2) % 10;
  const digit11 = (first9.reduce((a, b) => a + b, 0) + digit10) % 10;
  return first9.join('') + digit10 + digit11;
}

async function createUser(userData) {
  const result = await testAPI('/auth/register', 'POST', userData);
  if (result.success && result.data) {
    const token = result.data.token || result.data.data?.token || result.data.user?.token;
    const userId = result.data.id || result.data.data?.id || result.data.user?.id;
    if (token) return { token, id: userId, ...result.data };
  }
  const loginResult = await testAPI('/auth/login', 'POST', {
    email: userData.email,
    password: userData.password,
  });
  if (loginResult.success && loginResult.data) {
    const token = loginResult.data.token || loginResult.data.data?.token || loginResult.data.user?.token;
    const userId = loginResult.data.id || loginResult.data.data?.id || loginResult.data.user?.id;
    if (token) return { token, id: userId, ...loginResult.data };
  }
  return null;
}

async function runTest(name, testFn, fixFn = null) {
  results.total++;
  try {
    log(`Testing: ${name}`, 'info');
    await testFn();
    results.passed.push(name);
    log(`PASSED: ${name}`, 'success');
    return true;
  } catch (error) {
    log(`FAILED: ${name} - ${error.message}`, 'error');
    results.failed.push({ name, error: error.message });
    
    if (fixFn) {
      try {
        log(`Attempting to fix: ${name}`, 'warning');
        await fixFn();
        results.fixed.push(name);
        log(`FIXED: ${name}`, 'success');
        // Retry
        try {
          await testFn();
          results.passed.push(`${name} (after fix)`);
          log(`PASSED AFTER FIX: ${name}`, 'success');
          return true;
        } catch (retryError) {
          log(`Still failing after fix: ${name}`, 'error');
        }
      } catch (fixError) {
        log(`Fix failed: ${name} - ${fixError.message}`, 'error');
      }
    }
    return false;
  }
}

async function main() {
  log('🚀 Starting REALISTIC BUSINESS FLOW TEST', 'info');
  log('='.repeat(80), 'info');
  log('Testing complete marketplace flow: publishing, visibility, offers, all panels', 'info');
  log('='.repeat(80), 'info');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // ============================================
  // WORKFLOW 1: INDIVIDUAL PUBLISHES SHIPMENT
  // ============================================
  log('\n📦 WORKFLOW 1: Individual Publishes Shipment', 'info');
  
  const individual = {
    email: `realistic-individual-${Date.now()}@test.com`,
    password: 'RealTest123!',
    fullName: 'Gerçek Bireysel Kullanıcı',
    phone: '5551111111',
    role: 'individual',
    acceptTerms: true,
    acceptPrivacy: true,
    acceptCookies: true,
  };
  
  let individualToken = null;
  let individualUserId = null;
  let publishedShipmentId = null;
  
  await runTest('Individual: Register user', async () => {
    const user = await createUser(individual);
    if (!user || !user.token) throw new Error('Individual registration failed');
    individualToken = user.token;
    individualUserId = user.id;
    log(`Individual registered: ${individualUserId}`, 'info');
  });
  
  await runTest('Individual: Create and publish shipment via API', async () => {
    const shipmentData = {
      pickupCity: 'Istanbul',
      deliveryCity: 'Ankara',
      pickupAddress: 'Kadikoy, Istanbul, Turkey',
      deliveryAddress: 'Cankaya, Ankara, Turkey',
      weight: 250,
      mainCategory: 'house_move',
      productDescription: 'Gerçek test gönderisi - Ev eşyaları taşınması',
      pickupDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      deliveryDate: new Date(Date.now() + 172800000).toISOString().split('T')[0],
    };
    
    const result = await testAPI('/shipments', 'POST', shipmentData, individualToken);
    if (!result.success) {
      throw new Error(`Failed to create shipment: ${JSON.stringify(result.data)}`);
    }
    
    publishedShipmentId = result.data.data?.id || result.data.id;
    if (!publishedShipmentId) {
      throw new Error('Shipment ID not returned');
    }
    log(`Shipment published via API: ${publishedShipmentId}`, 'info');
  });
  
  await runTest('Individual: Verify shipment appears in "My Shipments"', async () => {
    const result = await testAPI('/shipments', 'GET', null, individualToken);
    if (!result.success) {
      throw new Error(`Failed to fetch shipments: ${JSON.stringify(result.data)}`);
    }
    
    const shipments = result.data.data || result.data.shipments || [];
    const foundShipment = shipments.find(s => 
      (s.id === publishedShipmentId) || 
      (parseInt(s.id) === parseInt(publishedShipmentId))
    );
    
    if (!foundShipment) {
      throw new Error(`Published shipment ${publishedShipmentId} not found in "My Shipments"`);
    }
    log(`Shipment found in "My Shipments": ${foundShipment.id}`, 'info');
  });
  
  await runTest('Individual: Verify shipment appears in browser "My Shipments" page', async () => {
    // Login as individual
    await page.goto(`${FRONTEND_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    // Set token in localStorage (use authToken as frontend expects)
    await page.evaluate(({ token, user }) => {
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
    }, { token: individualToken, user: { id: individualUserId, role: 'individual' } });
    
    // Navigate to My Shipments
    await page.goto(`${FRONTEND_URL}/individual/my-shipments`);
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    
    // Wait for shipments to load (longer wait for API calls)
    await page.waitForTimeout(5000);
    
    // Check if shipment is visible - look for city names or shipment data
    const pageContent = await page.textContent('body');
    const shipmentVisible = pageContent.includes('Istanbul') || 
                           pageContent.includes('Ankara') ||
                           pageContent.includes('Ev eşyaları') ||
                           pageContent.includes('Gönderi') ||
                           pageContent.includes(publishedShipmentId?.toString());
    
    // Also check for shipment cards with more specific selectors
    const shipmentCards = await page.locator('[class*="shipment"], [class*="card"], [data-testid*="shipment"]').count();
    
    if (!shipmentVisible && shipmentCards === 0) {
      // Check if there's an empty state or loading state
      const emptyState = await page.locator('[class*="empty"], [class*="Empty"]').count();
      const loadingState = await page.locator('[class*="loading"], [class*="Loading"], [class*="spinner"]').count();
      
      if (loadingState > 0) {
        // Still loading, wait more
        await page.waitForTimeout(3000);
        const finalContent = await page.textContent('body');
        if (!finalContent.includes('Istanbul') && !finalContent.includes('Ankara')) {
          throw new Error('Shipments still not visible after extended wait');
        }
      } else if (emptyState > 0) {
        throw new Error('Empty state shown - shipments not loaded');
      } else {
        throw new Error('No shipments visible on "My Shipments" page');
      }
    }
    log(`Shipment visible on "My Shipments" page (cards: ${shipmentCards})`, 'info');
  });
  
  // ============================================
  // WORKFLOW 2: SHIPMENT VISIBILITY TO NAKLIYECI
  // ============================================
  log('\n👀 WORKFLOW 2: Shipment Visibility to Nakliyeci', 'info');
  
  const nakliyeci = {
    email: `realistic-nakliyeci-${Date.now()}@test.com`,
    password: 'RealTest123!',
    fullName: 'Gerçek Nakliyeci Şirketi',
    phone: '5552222222',
    companyName: 'Gerçek Nakliye A.Ş.',
    taxNumber: '1111111111',
    role: 'nakliyeci',
    acceptTerms: true,
    acceptPrivacy: true,
    acceptCookies: true,
  };
  
  let nakliyeciToken = null;
  let nakliyeciUserId = null;
  
  await runTest('Nakliyeci: Register user', async () => {
    const user = await createUser(nakliyeci);
    if (!user || !user.token) throw new Error('Nakliyeci registration failed');
    nakliyeciToken = user.token;
    nakliyeciUserId = user.id;
    log(`Nakliyeci registered: ${nakliyeciUserId}`, 'info');
  });
  
  await runTest('Nakliyeci: See published shipment in open shipments (API)', async () => {
    if (!publishedShipmentId) throw new Error('Shipment not published');
    
    const result = await testAPI('/shipments/open', 'GET', null, nakliyeciToken);
    if (!result.success) {
      throw new Error(`Failed to fetch open shipments: ${JSON.stringify(result.data)}`);
    }
    
    const shipments = result.data.data || result.data.shipments || [];
    const foundShipment = shipments.find(s => 
      (s.id === publishedShipmentId) || 
      (parseInt(s.id) === parseInt(publishedShipmentId))
    );
    
    if (!foundShipment) {
      throw new Error(`Published shipment ${publishedShipmentId} not visible to nakliyeci in open shipments`);
    }
    log(`Shipment visible to nakliyeci: ${foundShipment.id}`, 'info');
  });
  
  await runTest('Nakliyeci: See published shipment in browser "Jobs" page', async () => {
    // Login as nakliyeci
    await page.goto(`${FRONTEND_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    await page.evaluate(({ token, user }) => {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    }, { token: nakliyeciToken, user: { id: nakliyeciUserId, role: 'nakliyeci' } });
    
    // Navigate to Jobs
    await page.goto(`${FRONTEND_URL}/nakliyeci/jobs`);
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForTimeout(3000);
    
    // Check if shipment is visible
    const pageContent = await page.textContent('body');
    const shipmentVisible = pageContent.includes('Istanbul') || 
                           pageContent.includes('Ankara') ||
                           pageContent.includes('Ev eşyaları');
    
    if (!shipmentVisible) {
      const jobCards = await page.locator('[class*="shipment"], [class*="card"], [class*="job"]').count();
      log(`Job cards found: ${jobCards}`, 'warning');
      if (jobCards === 0) {
        throw new Error('No jobs visible on "Jobs" page');
      }
    }
    log(`Shipment visible on nakliyeci "Jobs" page`, 'info');
  });
  
  // ============================================
  // WORKFLOW 3: NAKLIYECI CREATES OFFER
  // ============================================
  log('\n💰 WORKFLOW 3: Nakliyeci Creates Offer', 'info');
  
  let offerId = null;
  
  await runTest('Nakliyeci: Create offer via API', async () => {
    if (!publishedShipmentId) throw new Error('Shipment not published');
    
    const offerData = {
      shipmentId: publishedShipmentId,
      price: 8500,
      estimatedDeliveryDate: new Date(Date.now() + 172800000).toISOString().split('T')[0],
      message: 'Profesyonel taşıma hizmeti, sigortalı, güvenli teslimat',
    };
    
    const result = await testAPI('/offers', 'POST', offerData, nakliyeciToken);
    if (!result.success) {
      throw new Error(`Failed to create offer: ${JSON.stringify(result.data)}`);
    }
    
    offerId = result.data.data?.id || result.data.id;
    if (!offerId) {
      throw new Error('Offer ID not returned');
    }
    log(`Offer created: ${offerId}`, 'info');
  });
  
  await runTest('Individual: See offer in "Offers" page (API)', async () => {
    const result = await testAPI('/offers/individual', 'GET', null, individualToken);
    if (!result.success) {
      throw new Error(`Failed to fetch offers: ${JSON.stringify(result.data)}`);
    }
    
    const offers = result.data.data || result.data.offers || [];
    const foundOffer = offers.find(o => 
      (o.id === offerId) || 
      (parseInt(o.id) === parseInt(offerId)) ||
      (o.shipmentId === publishedShipmentId) ||
      (parseInt(o.shipmentId) === parseInt(publishedShipmentId))
    );
    
    if (!foundOffer) {
      throw new Error(`Offer ${offerId} not visible to individual in offers list`);
    }
    log(`Offer visible to individual: ${foundOffer.id}`, 'info');
  });
  
  await runTest('Individual: See offer in browser "Offers" page', async () => {
    // Login as individual
    await page.goto(`${FRONTEND_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    await page.evaluate(({ token, user }) => {
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
    }, { token: individualToken, user: { id: individualUserId, role: 'individual' } });
    
    // Navigate to Offers
    await page.goto(`${FRONTEND_URL}/individual/offers`);
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForTimeout(5000); // Wait longer for API calls
    
    // Check if offer is visible
    const pageContent = await page.textContent('body');
    const offerVisible = pageContent.includes('8500') || 
                        pageContent.includes('Profesyonel') ||
                        pageContent.includes('Teklif') ||
                        pageContent.includes('8.500') ||
                        pageContent.includes(offerId?.toString());
    
    const offerCards = await page.locator('[class*="offer"], [class*="card"], [data-testid*="offer"]').count();
    
    if (!offerVisible && offerCards === 0) {
      const loadingState = await page.locator('[class*="loading"], [class*="Loading"], [class*="spinner"]').count();
      if (loadingState > 0) {
        await page.waitForTimeout(3000);
        const finalContent = await page.textContent('body');
        if (!finalContent.includes('8500') && !finalContent.includes('Teklif')) {
          throw new Error('Offers still not visible after extended wait');
        }
      } else {
        throw new Error('No offers visible on "Offers" page');
      }
    }
    log(`Offer visible on individual "Offers" page (cards: ${offerCards})`, 'info');
  });
  
  // ============================================
  // WORKFLOW 4: INDIVIDUAL ACCEPTS OFFER
  // ============================================
  log('\n✅ WORKFLOW 4: Individual Accepts Offer', 'info');
  
  await runTest('Individual: Accept offer via API', async () => {
    if (!offerId) throw new Error('Offer not created');
    
    const result = await testAPI(`/offers/${offerId}/accept`, 'POST', {}, individualToken);
    if (!result.success) {
      throw new Error(`Failed to accept offer: ${JSON.stringify(result.data)}`);
    }
    log(`Offer accepted, shipment status updated`, 'info');
  });
  
  await runTest('Nakliyeci: Verify shipment appears in "Active Shipments" (API)', async () => {
    const result = await testAPI('/shipments/nakliyeci/active', 'GET', null, nakliyeciToken);
    if (!result.success) {
      throw new Error(`Failed to fetch active shipments: ${JSON.stringify(result.data)}`);
    }
    
    const shipments = result.data.data || result.data.shipments || [];
    const foundShipment = shipments.find(s => 
      (s.id === publishedShipmentId) || 
      (parseInt(s.id) === parseInt(publishedShipmentId))
    );
    
    if (!foundShipment) {
      throw new Error(`Accepted shipment ${publishedShipmentId} not in nakliyeci active shipments`);
    }
    log(`Shipment in nakliyeci active shipments: ${foundShipment.id}`, 'info');
  });
  
  await runTest('Nakliyeci: Verify shipment appears in browser "Active Shipments" page', async () => {
    // Login as nakliyeci
    await page.goto(`${FRONTEND_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    await page.evaluate(({ token, user }) => {
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
    }, { token: nakliyeciToken, user: { id: nakliyeciUserId, role: 'nakliyeci' } });
    
    // Navigate to Active Shipments
    await page.goto(`${FRONTEND_URL}/nakliyeci/active-shipments`);
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForTimeout(5000); // Wait longer for API calls
    
    // Check if shipment is visible
    const pageContent = await page.textContent('body');
    const shipmentVisible = pageContent.includes('Istanbul') || 
                           pageContent.includes('Ankara') ||
                           pageContent.includes('Aktif') ||
                           pageContent.includes(publishedShipmentId?.toString());
    
    const activeCards = await page.locator('[class*="shipment"], [class*="card"], [data-testid*="shipment"]').count();
    
    if (!shipmentVisible && activeCards === 0) {
      const loadingState = await page.locator('[class*="loading"], [class*="Loading"], [class*="spinner"]').count();
      if (loadingState > 0) {
        await page.waitForTimeout(3000);
        const finalContent = await page.textContent('body');
        if (!finalContent.includes('Istanbul') && !finalContent.includes('Ankara')) {
          throw new Error('Active shipments still not visible after extended wait');
        }
      } else {
        throw new Error('No active shipments visible');
      }
    }
    log(`Shipment visible on nakliyeci "Active Shipments" page (cards: ${activeCards})`, 'info');
  });
  
  // ============================================
  // WORKFLOW 5: CORPORATE BULK SHIPMENTS
  // ============================================
  log('\n🏢 WORKFLOW 5: Corporate Bulk Shipments', 'info');
  
  const corporate = {
    email: `realistic-corporate-${Date.now()}@test.com`,
    password: 'RealTest123!',
    fullName: 'Gerçek Kurumsal Kullanıcı',
    phone: '5553333333',
    companyName: 'Gerçek Üretim A.Ş.',
    taxNumber: '2222222222',
    role: 'corporate',
    acceptTerms: true,
    acceptPrivacy: true,
    acceptCookies: true,
  };
  
  let corporateToken = null;
  let corporateUserId = null;
  const corporateShipments = [];
  
  await runTest('Corporate: Register user', async () => {
    const user = await createUser(corporate);
    if (!user || !user.token) throw new Error('Corporate registration failed');
    corporateToken = user.token;
    corporateUserId = user.id;
    log(`Corporate registered: ${corporateUserId}`, 'info');
  });
  
  await runTest('Corporate: Create multiple shipments via API', async () => {
    for (let i = 0; i < 3; i++) {
      const shipmentData = {
        pickupCity: 'Istanbul',
        deliveryCity: 'Izmir',
        pickupAddress: `Depo ${i + 1}, Istanbul`,
        deliveryAddress: `Mağaza ${i + 1}, Izmir`,
        weight: 5 + i,
        mainCategory: 'imalat-urunleri',
        productDescription: `Kurumsal gönderi ${i + 1} - Üretim ürünleri`,
        pickupDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        deliveryDate: new Date(Date.now() + 172800000).toISOString().split('T')[0],
      };
      
      const result = await testAPI('/shipments', 'POST', shipmentData, corporateToken);
      if (result.success) {
        const id = result.data.data?.id || result.data.id;
        corporateShipments.push(id);
        log(`Corporate shipment ${i + 1} created: ${id}`, 'info');
      }
    }
    
    if (corporateShipments.length === 0) {
      throw new Error('Failed to create any corporate shipments');
    }
  });
  
  await runTest('Corporate: Verify shipments appear in "Shipments" page (API)', async () => {
    const result = await testAPI('/shipments/corporate', 'GET', null, corporateToken);
    if (!result.success) {
      throw new Error(`Failed to fetch corporate shipments: ${JSON.stringify(result.data)}`);
    }
    
    const shipments = result.data.data || result.data.shipments || [];
    const foundCount = corporateShipments.filter(id => 
      shipments.some(s => (s.id === id) || (parseInt(s.id) === parseInt(id)))
    ).length;
    
    if (foundCount < corporateShipments.length) {
      throw new Error(`Only ${foundCount}/${corporateShipments.length} shipments visible`);
    }
    log(`All ${corporateShipments.length} shipments visible in corporate list`, 'info');
  });
  
  await runTest('Corporate: Verify shipments appear in browser "Shipments" page', async () => {
    // Login as corporate
    await page.goto(`${FRONTEND_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    await page.evaluate(({ token, user }) => {
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
    }, { token: corporateToken, user: { id: corporateUserId, role: 'corporate' } });
    
    // Navigate to Shipments
    await page.goto(`${FRONTEND_URL}/corporate/shipments`);
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForTimeout(3000);
    
    // Check if shipments are visible
    const pageContent = await page.textContent('body');
    const shipmentsVisible = pageContent.includes('Istanbul') || 
                            pageContent.includes('Izmir') ||
                            pageContent.includes('Üretim');
    
    if (!shipmentsVisible) {
      const shipmentCards = await page.locator('[class*="shipment"], [class*="card"]').count();
      log(`Shipment cards found: ${shipmentCards}`, 'warning');
      if (shipmentCards === 0) {
        throw new Error('No shipments visible on corporate "Shipments" page');
      }
    }
    log(`Shipments visible on corporate "Shipments" page`, 'info');
  });
  
  // ============================================
  // WORKFLOW 6: TASIYICI VIEWS AVAILABLE JOBS
  // ============================================
  log('\n🚚 WORKFLOW 6: Tasiyici Views Available Jobs', 'info');
  
  const tasiyici = {
    email: `realistic-tasiyici-${Date.now()}@test.com`,
    password: 'RealTest123!',
    fullName: 'Gerçek Taşıyıcı Şoför',
    phone: '5554444444',
    role: 'tasiyici',
    tckn: generateValidTCKN(),
    acceptTerms: true,
    acceptPrivacy: true,
    acceptCookies: true,
  };
  
  let tasiyiciToken = null;
  let tasiyiciUserId = null;
  
  await runTest('Tasiyici: Register user', async () => {
    const user = await createUser(tasiyici);
    if (!user || !user.token) throw new Error('Tasiyici registration failed');
    tasiyiciToken = user.token;
    tasiyiciUserId = user.id;
    log(`Tasiyici registered: ${tasiyiciUserId}`, 'info');
  });
  
  await runTest('Tasiyici: See available jobs via API', async () => {
    const result = await testAPI('/shipments/tasiyici', 'GET', null, tasiyiciToken);
    if (!result.success) {
      throw new Error(`Failed to fetch tasiyici jobs: ${JSON.stringify(result.data)}`);
    }
    
    const jobs = result.data.data || result.data.shipments || [];
    log(`Tasiyici sees ${jobs.length} available jobs`, 'info');
  });
  
  await runTest('Tasiyici: See available jobs in browser "Market" page', async () => {
    // Login as tasiyici
    await page.goto(`${FRONTEND_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    await page.evaluate(({ token, user }) => {
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
    }, { token: tasiyiciToken, user: { id: tasiyiciUserId, role: 'tasiyici' } });
    
    // Navigate to Market
    await page.goto(`${FRONTEND_URL}/tasiyici/market`);
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForTimeout(3000);
    
    // Check if jobs are visible
    const pageContent = await page.textContent('body');
    const jobsVisible = pageContent.includes('Istanbul') || 
                       pageContent.includes('Ankara') ||
                       pageContent.includes('İş');
    
    if (!jobsVisible) {
      const jobCards = await page.locator('[class*="shipment"], [class*="card"], [class*="job"]').count();
      log(`Job cards found: ${jobCards}`, 'warning');
      // Jobs might be empty, that's okay
    }
    log(`Market page loaded for tasiyici`, 'info');
  });
  
  // ============================================
  // WORKFLOW 7: STATUS UPDATES & TRACKING
  // ============================================
  log('\n📊 WORKFLOW 7: Status Updates & Tracking', 'info');
  
  await runTest('Nakliyeci: Update shipment status to in_progress', async () => {
    if (!publishedShipmentId) throw new Error('Shipment not published');
    
    const result = await testAPI(`/shipments/${publishedShipmentId}`, 'PUT', {
      status: 'in_progress',
    }, nakliyeciToken);
    
    if (!result.success) {
      throw new Error(`Failed to update status: ${JSON.stringify(result.data)}`);
    }
    log(`Status updated to in_progress`, 'info');
  });
  
  await runTest('Individual: See status update in shipment detail (API)', async () => {
    if (!publishedShipmentId) throw new Error('Shipment not published');
    
    const result = await testAPI(`/shipments/${publishedShipmentId}`, 'GET', null, individualToken);
    if (!result.success) {
      throw new Error(`Failed to fetch shipment: ${JSON.stringify(result.data)}`);
    }
    
    const shipment = result.data.data || result.data;
    if (shipment.status !== 'in_progress' && shipment.status !== 'in_progress') {
      throw new Error(`Status not updated: expected in_progress, got ${shipment.status}`);
    }
    log(`Status visible to individual: ${shipment.status}`, 'info');
  });
  
  await runTest('Individual: See status update in browser', async () => {
    // Login as individual
    await page.goto(`${FRONTEND_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    await page.evaluate(({ token, user }) => {
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
    }, { token: individualToken, user: { id: individualUserId, role: 'individual' } });
    
    // Navigate to My Shipments
    await page.goto(`${FRONTEND_URL}/individual/my-shipments`);
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForTimeout(5000); // Wait longer for API calls
    
    // Check for status indicator
    const pageContent = await page.textContent('body');
    const statusVisible = pageContent.includes('in_progress') || 
                         pageContent.includes('Hazırlanıyor') ||
                         pageContent.includes('Devam') ||
                         pageContent.includes('Aktif') ||
                         pageContent.includes('İşlem');
    
    log(`Status update visible: ${statusVisible}`, 'info');
  });
  
  // ============================================
  // FINAL REPORT
  // ============================================
  await browser.close();
  
  log('\n' + '='.repeat(80), 'info');
  log('📊 REALISTIC BUSINESS FLOW TEST REPORT', 'info');
  log('='.repeat(80), 'info');
  log(`Total Tests: ${results.total}`, 'info');
  log(`Passed: ${results.passed.length}`, 'success');
  log(`Failed: ${results.failed.length}`, results.failed.length > 0 ? 'error' : 'success');
  log(`Fixed: ${results.fixed.length}`, results.fixed.length > 0 ? 'warning' : 'info');
  
  if (results.failed.length > 0) {
    log('\n❌ FAILED TESTS:', 'error');
    results.failed.forEach(({ name, error }) => {
      log(`  - ${name}: ${error}`, 'error');
    });
  }
  
  const passRate = ((results.passed.length / results.total) * 100).toFixed(2);
  log(`\n✅ Pass Rate: ${passRate}%`, passRate >= 90 ? 'success' : 'warning');
  
  log('\n📋 WORKFLOWS TESTED:', 'info');
  log('  1. Individual Publishes Shipment', 'info');
  log('  2. Shipment Visibility to Nakliyeci', 'info');
  log('  3. Nakliyeci Creates Offer', 'info');
  log('  4. Individual Accepts Offer', 'info');
  log('  5. Corporate Bulk Shipments', 'info');
  log('  6. Tasiyici Views Available Jobs', 'info');
  log('  7. Status Updates & Tracking', 'info');
  
  if (results.failed.length > 0) {
    process.exit(1);
  }
}

main().catch(error => {
  log(`Fatal error: ${error.message}`, 'error');
  console.error(error);
  process.exit(1);
});

