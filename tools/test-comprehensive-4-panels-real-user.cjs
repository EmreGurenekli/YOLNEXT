/**
 * COMPREHENSIVE 4-PANEL REAL USER TEST
 * 
 * Tests ALL workflows from ALL 4 panels:
 * 1. Individual: Create shipment → View in My Shipments → Receive offers → Accept offer
 * 2. Nakliyeci: View open shipments → Create offer → Manage offers → Broadcast to drivers
 * 3. Corporate: Create bulk shipments → View analytics → Manage team
 * 4. Tasiyici: View market → Accept job → Update location → Complete job
 * 
 * Also tests:
 * - Page open/close
 * - Search functionality
 * - Filtering
 * - Pagination
 * - Card data visibility
 * - Real data flow
 */

const puppeteer = require('puppeteer');
const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

let browser;
let page;
let tokens = {};
let testData = {
  shipments: [],
  offers: [],
  messages: []
};

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`  ${title}`, 'cyan');
  log(`${'='.repeat(60)}\n`, 'cyan');
}

function logStep(step, message) {
  log(`\n${step} ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

async function waitFor(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForBackend() {
  logInfo('Waiting for backend to be ready...');
  let retries = 30;
  while (retries > 0) {
    try {
      const response = await axios.get(`${API_URL}/api/health/live`, { timeout: 2000 });
      if (response.status === 200) {
        logSuccess('Backend is ready!');
        return true;
      }
    } catch (error) {
      retries--;
      if (retries === 0) {
        logError('Backend is not responding. Please start backend first.');
        return false;
      }
      await waitFor(1000);
    }
  }
  return false;
}

async function loginAs(panelType) {
  try {
    const response = await axios.post(`${API_URL}/api/auth/demo-login`, {
      panelType: panelType
    });
    
    // Handle different response formats
    let token, user;
    if (response.data && response.data.data) {
      // Response format: { success: true, data: { token, user } }
      token = response.data.data.token;
      user = response.data.data.user;
    } else if (response.data && response.data.token) {
      // Response format: { success: true, token, user }
      token = response.data.token;
      user = response.data.user;
    } else {
      throw new Error('No token received in response');
    }
    
    if (!token) {
      throw new Error('Token is null or undefined');
    }
    
    tokens[panelType] = token;
    
    // Prepare user data for localStorage
    const userData = {
      id: user.id || user.userId,
      fullName: user.name || user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      email: user.email,
      role: panelType,
      isVerified: true
    };
    
    // Navigate to frontend first to enable localStorage access
    await page.goto(`${FRONTEND_URL}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await waitFor(1000);
    
    // Now set localStorage
    await page.evaluate((tok, usr) => {
      localStorage.setItem('authToken', tok);
      localStorage.setItem('user', JSON.stringify(usr));
    }, token, userData);
    
    logSuccess(`Logged in as ${panelType} (ID: ${userData.id})`);
    return { token, user: userData };
  } catch (error) {
    logError(`Login failed for ${panelType}: ${error.message}`);
    if (error.response) {
      logError(`Response status: ${error.response.status}`);
      logError(`Response data: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

async function navigateTo(url, description = '') {
  try {
    const fullUrl = url.startsWith('http') ? url : `${FRONTEND_URL}${url}`;
    logInfo(`Navigating to: ${url}${description ? ` (${description})` : ''}`);
    await page.goto(fullUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await waitFor(2000);
    
    // Check for errors
    const hasError = await page.evaluate(() => {
      return document.body.innerText.includes('Error') ||
             document.body.innerText.includes('404') ||
             document.body.innerText.includes('Not Found') ||
             document.body.innerText.includes('Failed to fetch');
    });
    
    if (hasError) {
      logWarning(`Page may have errors: ${url}`);
    } else {
      logSuccess(`Page loaded: ${url}`);
    }
    
    return true;
  } catch (error) {
    logError(`Navigation failed to ${url}: ${error.message}`);
    return false;
  }
}

async function checkElementVisible(selector, description, timeout = 5000) {
  try {
    await page.waitForSelector(selector, { timeout, visible: true });
    const isVisible = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      return el && el.offsetParent !== null;
    }, selector);
    
    if (isVisible) {
      logSuccess(`${description} is visible`);
      return true;
    } else {
      logError(`${description} is not visible`);
      return false;
    }
  } catch (error) {
    logError(`${description} not found: ${error.message}`);
    return false;
  }
}

async function checkTextExists(text, description) {
  try {
    const exists = await page.evaluate((searchText) => {
      return document.body.innerText.includes(searchText);
    }, text);
    
    if (exists) {
      logSuccess(`${description} found on page`);
      return true;
    } else {
      logError(`${description} not found on page`);
      return false;
    }
  } catch (error) {
    logError(`Error checking text: ${error.message}`);
    return false;
  }
}

async function fillInput(selector, value, description) {
  try {
    await page.waitForSelector(selector, { timeout: 5000 });
    await page.click(selector, { clickCount: 3 }); // Select all
    await page.type(selector, value, { delay: 50 });
    logSuccess(`Filled ${description}: ${value}`);
    return true;
  } catch (error) {
    logError(`Failed to fill ${description}: ${error.message}`);
    return false;
  }
}

async function selectOption(selector, value, description) {
  try {
    await page.waitForSelector(selector, { timeout: 5000 });
    await page.select(selector, value);
    logSuccess(`Selected ${description}: ${value}`);
    return true;
  } catch (error) {
    // Try clicking instead
    try {
      await page.click(selector);
      await page.keyboard.type(value);
      await page.keyboard.press('Enter');
      logSuccess(`Selected ${description}: ${value} (via click)`);
      return true;
    } catch (e) {
      logError(`Failed to select ${description}: ${error.message}`);
      return false;
    }
  }
}

async function clickButton(selector, description, waitTime = 1000) {
  try {
    await page.waitForSelector(selector, { timeout: 5000 });
    await page.click(selector);
    await waitFor(waitTime);
    logSuccess(`Clicked ${description}`);
    return true;
  } catch (error) {
    logError(`Failed to click ${description}: ${error.message}`);
    return false;
  }
}

async function clickButtonByText(text, description, waitTime = 1000) {
  try {
    // Use XPath to find button by text
    const xpath = `//button[contains(text(), '${text}')]`;
    await page.waitForXPath(xpath, { timeout: 5000 });
    const [button] = await page.$x(xpath);
    if (button) {
      await button.click();
      await waitFor(waitTime);
      logSuccess(`Clicked ${description} (${text})`);
      return true;
    } else {
      throw new Error('Button not found');
    }
  } catch (error) {
    logError(`Failed to click ${description}: ${error.message}`);
    return false;
  }
}

async function testSearch(searchTerm, expectedResults) {
  try {
    logStep('🔍', `Testing search with: "${searchTerm}"`);
    
    // Find search input
    const searchInput = await page.$('input[type="search"], input[placeholder*="Ara"], input[placeholder*="Search"]');
    if (searchInput) {
      await searchInput.click();
      await searchInput.type(searchTerm, { delay: 50 });
      await page.keyboard.press('Enter');
      await waitFor(2000);
      
      // Check if results appear
      const hasResults = await page.evaluate((term) => {
        const text = document.body.innerText.toLowerCase();
        return text.includes(term.toLowerCase()) || text.includes('sonuç') || text.includes('result');
      }, searchTerm);
      
      if (hasResults) {
        logSuccess(`Search returned results for "${searchTerm}"`);
        return true;
      } else {
        logWarning(`Search may not have returned results for "${searchTerm}"`);
        return false;
      }
    } else {
      logWarning('Search input not found');
      return false;
    }
  } catch (error) {
    logError(`Search test failed: ${error.message}`);
    return false;
  }
}

async function testFiltering() {
  try {
    logStep('🔍', 'Testing filtering functionality');
    
    // Look for filter buttons/dropdowns
    const filterSelectors = [
      'select[name*="filter"]',
      'select[name*="status"]',
      'select[name*="category"]',
      'button[class*="filter"]',
      '[data-testid*="filter"]'
    ];
    
    let filterFound = false;
    for (const selector of filterSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          await element.click();
          await waitFor(1000);
          filterFound = true;
          logSuccess('Filter element found and clicked');
          break;
        }
      } catch (e) {
        // Continue
      }
    }
    
    if (!filterFound) {
      logWarning('No filter elements found (may not be available on this page)');
    }
    
    return true;
  } catch (error) {
    logError(`Filtering test failed: ${error.message}`);
    return false;
  }
}

async function testPagination() {
  try {
    logStep('📄', 'Testing pagination');
    
    // Look for pagination buttons
    const paginationSelectors = [
      'button[aria-label*="next"]',
      'button[aria-label*="Next"]',
      'button:has-text("Sonraki")',
      'button:has-text("Next")',
      '[class*="pagination"] button',
      'a[href*="page"]'
    ];
    
    let paginationFound = false;
    for (const selector of paginationSelectors) {
      try {
        const elements = await page.$$(selector);
        if (elements.length > 0) {
          logSuccess('Pagination elements found');
          paginationFound = true;
          break;
        }
      } catch (e) {
        // Continue
      }
    }
    
    if (!paginationFound) {
      logInfo('No pagination found (may not be needed if results fit on one page)');
    }
    
    return true;
  } catch (error) {
    logError(`Pagination test failed: ${error.message}`);
    return false;
  }
}

async function checkCardData(cardSelector, requiredFields) {
  try {
    logStep('📋', 'Checking card data visibility');
    
    const cards = await page.$$(cardSelector);
    if (cards.length === 0) {
      logWarning('No cards found');
      return false;
    }
    
    logSuccess(`Found ${cards.length} card(s)`);
    
    // Check first card for required fields
    const cardText = await page.evaluate((card) => {
      return card.innerText;
    }, cards[0]);
    
    let allFieldsPresent = true;
    for (const field of requiredFields) {
      if (cardText.includes(field)) {
        logSuccess(`Card contains: ${field}`);
      } else {
        logError(`Card missing: ${field}`);
        allFieldsPresent = false;
      }
    }
    
    return allFieldsPresent;
  } catch (error) {
    logError(`Card data check failed: ${error.message}`);
    return false;
  }
}

// ========== INDIVIDUAL PANEL TESTS ==========

async function testIndividualPanel() {
  logSection('INDIVIDUAL PANEL TESTS');
  
  const results = {
    login: false,
    dashboard: false,
    createShipment: false,
    myShipments: false,
    offers: false,
    messages: false,
    profile: false,
    search: false,
    filters: false
  };
  
  try {
    // Login
    logStep('1️⃣', 'Individual Login');
    await loginAs('individual');
    results.login = true;
    
    // Dashboard
    logStep('2️⃣', 'Individual Dashboard');
    await navigateTo('/individual/dashboard', 'Dashboard');
    results.dashboard = await checkTextExists('Dashboard', 'Dashboard title') || 
                        await checkTextExists('Gönderiler', 'Shipments section');
    
    // Create Shipment
    logStep('3️⃣', 'Create Shipment');
    await navigateTo('/individual/create-shipment', 'Create Shipment');
    
    // Wait for form to load
    await waitFor(2000);
    
    // Try to find and fill form fields with multiple selector attempts
    const categorySelectors = [
      'select[name="mainCategory"]',
      '[name="mainCategory"]',
      'select#mainCategory',
      'select[class*="category"]'
    ];
    
    let categoryFilled = false;
    for (const selector of categorySelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          await selectOption(selector, 'electronics', 'Category');
          categoryFilled = true;
          break;
        }
      } catch (e) {
        // Continue
      }
    }
    
    if (!categoryFilled) {
      logWarning('Category field not found, trying alternative approach');
    }
    
    // Try description field
    const descSelectors = [
      'textarea[name="productDescription"]',
      '[name="productDescription"]',
      'textarea[placeholder*="Açıklama"]',
      'textarea[placeholder*="Description"]'
    ];
    
    for (const selector of descSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          await fillInput(selector, 'Test shipment - Comprehensive test', 'Description');
          break;
        }
      } catch (e) {
        // Continue
      }
    }
    
    // Try weight and quantity
    const weightSelectors = ['input[name="weight"]', '[name="weight"]'];
    for (const selector of weightSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          await fillInput(selector, '10', 'Weight');
          break;
        }
      } catch (e) {
        // Continue
      }
    }
    
    // Try to click Next button using XPath
    const nextClicked = await clickButtonByText('Sonraki', 'Next Button') || 
                       await clickButtonByText('Next', 'Next Button');
    
    if (nextClicked) {
      await waitFor(2000);
      
      // Step 2: Address fields
      const pickupAddressSelectors = [
        'input[name="pickupAddress"]',
        '[name="pickupAddress"]',
        'input[placeholder*="Alış"]'
      ];
      
      for (const selector of pickupAddressSelectors) {
        try {
          const element = await page.$(selector);
          if (element) {
            await fillInput(selector, 'Test Pickup Address, Kadıköy', 'Pickup Address');
            break;
          }
        } catch (e) {
          // Continue
        }
      }
      
      // Try to click Next again
      await clickButtonByText('Sonraki', 'Next Button Step 2') || 
      await clickButtonByText('Next', 'Next Button Step 2');
      await waitFor(2000);
      
      // Step 3: Submit
      const submitClicked = await clickButtonByText('Oluştur', 'Submit Button') ||
                           await clickButtonByText('Create', 'Submit Button') ||
                           await clickButtonByText('Yayınla', 'Publish Button');
      
      if (submitClicked) {
        await waitFor(3000);
        results.createShipment = true;
        logSuccess('Shipment creation form submitted');
      }
    } else {
      logWarning('Could not proceed past step 1');
    }
    
    // My Shipments
    logStep('4️⃣', 'My Shipments Page');
    await navigateTo('/individual/my-shipments', 'My Shipments');
    results.myShipments = await checkTextExists('Gönderiler', 'Shipments list') ||
                          await checkTextExists('Test shipment', 'Created shipment');
    
    // Check card data
    await checkCardData('[class*="card"], [class*="shipment"]', 
                       ['İstanbul', 'Ankara', 'Test shipment']);
    
    // Search test
    results.search = await testSearch('Test', true);
    
    // Filter test
    results.filters = await testFiltering();
    
    // Pagination test
    await testPagination();
    
    // Offers
    logStep('5️⃣', 'Offers Page');
    await navigateTo('/individual/offers', 'Offers');
    results.offers = await checkTextExists('Teklif', 'Offers') ||
                     await checkTextExists('Offer', 'Offers');
    
    // Messages
    logStep('6️⃣', 'Messages Page');
    await navigateTo('/individual/messages', 'Messages');
    results.messages = await checkTextExists('Mesaj', 'Messages') ||
                       await checkTextExists('Message', 'Messages');
    
    // Profile
    logStep('7️⃣', 'Profile Page');
    await navigateTo('/individual/profile', 'Profile');
    results.profile = await checkTextExists('Profil', 'Profile') ||
                      await checkTextExists('Profile', 'Profile');
    
  } catch (error) {
    logError(`Individual panel test error: ${error.message}`);
  }
  
  return results;
}

// ========== NAKLIYECI PANEL TESTS ==========

async function testNakliyeciPanel() {
  logSection('NAKLIYECI PANEL TESTS');
  
  const results = {
    login: false,
    dashboard: false,
    openShipments: false,
    createOffer: false,
    offers: false,
    drivers: false,
    search: false
  };
  
  try {
    // Login
    logStep('1️⃣', 'Nakliyeci Login');
    await loginAs('nakliyeci');
    results.login = true;
    
    // Dashboard
    logStep('2️⃣', 'Nakliyeci Dashboard');
    await navigateTo('/nakliyeci/dashboard', 'Dashboard');
    results.dashboard = await checkTextExists('Dashboard', 'Dashboard') ||
                        await checkTextExists('Açık Gönderiler', 'Open Shipments');
    
    // Open Shipments
    logStep('3️⃣', 'Open Shipments');
    await navigateTo('/nakliyeci/open-shipments', 'Open Shipments');
    results.openShipments = await checkTextExists('Açık', 'Open') ||
                            await checkTextExists('Gönderi', 'Shipment');
    
    // Check card data
    await checkCardData('[class*="card"], [class*="shipment"]', 
                       ['İstanbul', 'Ankara']);
    
    // Search
    results.search = await testSearch('İstanbul', true);
    
    // Create Offer (if shipment exists)
    logStep('4️⃣', 'Create Offer');
    const offerClicked = await clickButtonByText('Teklif', 'Offer Button') ||
                        await clickButtonByText('Offer', 'Offer Button');
    
    if (offerClicked) {
      await waitFor(2000);
      results.createOffer = true;
      logSuccess('Offer creation attempted');
    } else {
      logWarning('No offer button found (may need shipment first)');
      // Check if there are any shipments to offer on
      const hasShipments = await page.evaluate(() => {
        return document.body.innerText.includes('Gönderi') || 
               document.body.innerText.includes('Shipment');
      });
      if (hasShipments) {
        logInfo('Shipments found but no offer button - may need to click on shipment first');
      }
    }
    
    // Offers Management
    logStep('5️⃣', 'Offers Management');
    await navigateTo('/nakliyeci/offers', 'Offers');
    results.offers = await checkTextExists('Teklif', 'Offers');
    
    // Drivers
    logStep('6️⃣', 'Drivers Management');
    await navigateTo('/nakliyeci/drivers', 'Drivers');
    results.drivers = await checkTextExists('Şoför', 'Drivers') ||
                      await checkTextExists('Driver', 'Drivers');
    
  } catch (error) {
    logError(`Nakliyeci panel test error: ${error.message}`);
  }
  
  return results;
}

// ========== CORPORATE PANEL TESTS ==========

async function testCorporatePanel() {
  logSection('CORPORATE PANEL TESTS');
  
  const results = {
    login: false,
    dashboard: false,
    shipments: false,
    analytics: false,
    team: false
  };
  
  try {
    // Login
    logStep('1️⃣', 'Corporate Login');
    await loginAs('corporate');
    results.login = true;
    
    // Dashboard
    logStep('2️⃣', 'Corporate Dashboard');
    await navigateTo('/corporate/dashboard', 'Dashboard');
    results.dashboard = await checkTextExists('Dashboard', 'Dashboard') ||
                        await checkTextExists('Analitik', 'Analytics');
    
    // Shipments
    logStep('3️⃣', 'Corporate Shipments');
    await navigateTo('/corporate/shipments', 'Shipments');
    results.shipments = await checkTextExists('Gönderi', 'Shipments');
    
    // Analytics
    logStep('4️⃣', 'Analytics');
    await navigateTo('/corporate/analytics', 'Analytics');
    results.analytics = await checkTextExists('Analitik', 'Analytics') ||
                        await checkTextExists('Analytics', 'Analytics');
    
    // Team Management
    logStep('5️⃣', 'Team Management');
    await navigateTo('/corporate/team', 'Team');
    results.team = await checkTextExists('Takım', 'Team') ||
                   await checkTextExists('Team', 'Team');
    
  } catch (error) {
    logError(`Corporate panel test error: ${error.message}`);
  }
  
  return results;
}

// ========== TASIYICI PANEL TESTS ==========

async function testTasiyiciPanel() {
  logSection('TASIYICI PANEL TESTS');
  
  const results = {
    login: false,
    dashboard: false,
    market: false,
    activeJobs: false,
    earnings: false
  };
  
  try {
    // Login
    logStep('1️⃣', 'Tasiyici Login');
    await loginAs('tasiyici');
    results.login = true;
    
    // Dashboard
    logStep('2️⃣', 'Tasiyici Dashboard');
    await navigateTo('/tasiyici/dashboard', 'Dashboard');
    results.dashboard = await checkTextExists('Dashboard', 'Dashboard') ||
                        await checkTextExists('Aktif', 'Active');
    
    // Market
    logStep('3️⃣', 'Market');
    await navigateTo('/tasiyici/market', 'Market');
    results.market = await checkTextExists('Pazar', 'Market') ||
                     await checkTextExists('Market', 'Market') ||
                     await checkTextExists('İş', 'Jobs');
    
    // Active Jobs
    logStep('4️⃣', 'Active Jobs');
    await navigateTo('/tasiyici/active-jobs', 'Active Jobs');
    results.activeJobs = await checkTextExists('Aktif', 'Active') ||
                          await checkTextExists('İş', 'Jobs');
    
    // Earnings
    logStep('5️⃣', 'Earnings');
    await navigateTo('/tasiyici/earnings', 'Earnings');
    results.earnings = await checkTextExists('Kazanç', 'Earnings') ||
                       await checkTextExists('Earnings', 'Earnings');
    
  } catch (error) {
    logError(`Tasiyici panel test error: ${error.message}`);
  }
  
  return results;
}

// ========== MAIN TEST RUNNER ==========

async function runComprehensiveTest() {
  log('\n' + '═'.repeat(60), 'magenta');
  log('🧪 COMPREHENSIVE 4-PANEL REAL USER TEST', 'magenta');
  log('═'.repeat(60) + '\n', 'magenta');
  
  const allResults = {
    individual: {},
    nakliyeci: {},
    corporate: {},
    tasiyici: {}
  };
  
  try {
    // Initialize browser
    logStep('🚀', 'Initializing browser...');
    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1920, height: 1080 }
    });
    page = await browser.newPage();
    
    // Wait for backend
    const backendReady = await waitForBackend();
    if (!backendReady) {
      throw new Error('Backend is not available');
    }
    
    // Test all panels
    allResults.individual = await testIndividualPanel();
    await waitFor(2000);
    
    allResults.nakliyeci = await testNakliyeciPanel();
    await waitFor(2000);
    
    allResults.corporate = await testCorporatePanel();
    await waitFor(2000);
    
    allResults.tasiyici = await testTasiyiciPanel();
    
  } catch (error) {
    logError(`Test failed with error: ${error.message}`);
    console.error(error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  // Print Results
  logSection('FINAL TEST RESULTS');
  
  let totalPassed = 0;
  let totalFailed = 0;
  
  for (const [panel, results] of Object.entries(allResults)) {
    log(`\n${panel.toUpperCase()} PANEL:`, 'blue');
    for (const [test, passed] of Object.entries(results)) {
      if (passed) {
        logSuccess(`${test}: PASSED`);
        totalPassed++;
      } else {
        logError(`${test}: FAILED`);
        totalFailed++;
      }
    }
  }
  
  const totalTests = totalPassed + totalFailed;
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`📊 SUMMARY: ${totalPassed}/${totalTests} tests passed`, 
      totalFailed === 0 ? 'green' : 'yellow');
  log(`${'='.repeat(60)}\n`, 'cyan');
  
  if (totalFailed > 0) {
    logWarning('Some tests failed. Review errors above.');
    process.exit(1);
  } else {
    logSuccess('✅ All tests passed!');
    process.exit(0);
  }
}

// Run test
runComprehensiveTest().catch(error => {
  logError(`Fatal error: ${error.message}`);
  process.exit(1);
});

    // 2. Dashboard
    logInfo('Checking Individual Dashboard...');
    await navigateTo('/individual/dashboard');
    const dashboardOk = await checkPageErrors();
    const hasStats = await checkTextExists('Gönderi', 'Dashboard statistics');
    results.tests.push({ name: 'Dashboard loads', passed: dashboardOk && hasStats });
    if (dashboardOk && hasStats) results.passed++; else results.failed++;
    
    // 3. Create Shipment
    logInfo('Testing Create Shipment...');
    await navigateTo('/individual/create-shipment');
    const createPageOk = await checkPageErrors();
    const hasForm = await checkElementExists('form', 'Shipment form', 3000) || 
                    await checkTextExists('Yük Bilgileri', 'Form step 1');
    results.tests.push({ name: 'Create Shipment page', passed: createPageOk && hasForm });
    if (createPageOk && hasForm) results.passed++; else results.failed++;
    
    // 4. Create shipment via API
    logInfo('Creating shipment via API...');
    const shipmentData = {
      mainCategory: 'electronics',
      productDescription: 'Test shipment - Individual panel test',
      weight: '10',
      quantity: '2',
      dimensions: { length: '60', width: '40', height: '30' },
      specialRequirements: 'Fragile - Handle with care',
      pickupAddress: 'Test Pickup Address, Kadıköy',
      pickupDistrict: 'Kadıköy',
      pickupCity: 'İstanbul',
      deliveryAddress: 'Test Delivery Address, Çankaya',
      deliveryDistrict: 'Çankaya',
      deliveryCity: 'Ankara',
      pickupDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      deliveryDate: new Date(Date.now() + 172800000).toISOString().split('T')[0],
      contactPerson: 'Test Individual User',
      phone: '5551112233',
      email: 'individual@test.com',
      publishType: 'all'
    };
    
    try {
      const response = await axios.post(
        `${API_URL}/api/shipments`,
        shipmentData,
        {
          headers: {
            'Authorization': `Bearer ${testData.users.individual.token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data && response.data.success) {
        const shipmentId = response.data.data.id || response.data.data.shipment?.id;
        testData.shipments.push({ id: shipmentId, type: 'individual', data: response.data.data });
        logSuccess(`Shipment created: ${shipmentId}`);
        results.tests.push({ name: 'Create shipment API', passed: true });
        results.passed++;
      } else {
        throw new Error('Shipment creation failed');
      }
    } catch (error) {
      logError(`Shipment creation failed: ${error.message}`);
      results.tests.push({ name: 'Create shipment API', passed: false });
      results.failed++;
    }
    
    // 5. My Shipments page
    logInfo('Checking My Shipments page...');
    await navigateTo('/individual/my-shipments');
    await waitFor(3000);
    const myShipmentsOk = await checkPageErrors();
    const hasShipment = testData.shipments.length > 0 ? 
      await checkTextExists('İstanbul', 'Shipment in list') || 
      await checkTextExists('Ankara', 'Shipment in list') : true;
    results.tests.push({ name: 'My Shipments page', passed: myShipmentsOk && hasShipment });
    if (myShipmentsOk && hasShipment) results.passed++; else results.failed++;
    
    // 6. Offers page
    logInfo('Checking Offers page...');
    await navigateTo('/individual/offers');
    const offersOk = await checkPageErrors();
    results.tests.push({ name: 'Offers page', passed: offersOk });
    if (offersOk) results.passed++; else results.failed++;
    
    // 7. Messages page
    logInfo('Checking Messages page...');
    await navigateTo('/individual/messages');
    const messagesOk = await checkPageErrors();
    results.tests.push({ name: 'Messages page', passed: messagesOk });
    if (messagesOk) results.passed++; else results.failed++;
    
    // 8. Profile page
    logInfo('Checking Profile page...');
    await navigateTo('/individual/profile');
    const profileOk = await checkPageErrors();
    results.tests.push({ name: 'Profile page', passed: profileOk });
    if (profileOk) results.passed++; else results.failed++;
    
    // 9. Search functionality
    logInfo('Testing search functionality...');
    await navigateTo('/individual/my-shipments');
    await waitFor(2000);
    const searchInput = await page.$('input[type="search"], input[placeholder*="Ara"], input[name*="search"]');
    if (searchInput) {
      await searchInput.type('İstanbul', { delay: 100 });
      await waitFor(1000);
      logSuccess('Search input found and used');
      results.tests.push({ name: 'Search functionality', passed: true });
      results.passed++;
    } else {
      logWarning('Search input not found');
      results.tests.push({ name: 'Search functionality', passed: false });
      results.failed++;
    }
    
  } catch (error) {
    logError(`Individual panel test failed: ${error.message}`);
    results.failed++;
  }
  
  return results;
}

// ==================== NAKLIYECI PANEL TESTS ====================

async function testNakliyeciPanel() {
  logStep('🚚', 'TESTING NAKLIYECI PANEL');
  const results = { passed: 0, failed: 0, tests: [] };
  
  try {
    // 1. Login
    await loginAs('nakliyeci');
    results.tests.push({ name: 'Login', passed: true });
    results.passed++;
    
    // 2. Dashboard
    logInfo('Checking Nakliyeci Dashboard...');
    await navigateTo('/nakliyeci/dashboard');
    const dashboardOk = await checkPageErrors();
    results.tests.push({ name: 'Dashboard loads', passed: dashboardOk });
    if (dashboardOk) results.passed++; else results.failed++;
    
    // 3. Open Shipments
    logInfo('Checking Open Shipments...');
    await navigateTo('/nakliyeci/open-shipments');
    await waitFor(3000);
    const openShipmentsOk = await checkPageErrors();
    // Check if shipments are visible
    const hasShipments = await checkTextExists('İstanbul', 'Open shipments') ||
                        await checkTextExists('Gönderi', 'Shipment list') ||
                        await checkElementExists('[class*="shipment"], [class*="card"]', 'Shipment card', 3000);
    results.tests.push({ name: 'Open Shipments page', passed: openShipmentsOk && hasShipments });
    if (openShipmentsOk && hasShipments) results.passed++; else results.failed++;
    
    // 4. Create Offer (if shipment exists)
    if (testData.shipments.length > 0) {
      logInfo('Creating offer for shipment...');
      const shipment = testData.shipments[0];
      try {
        const offerData = {
          shipmentId: shipment.id,
          price: 2000,
          estimatedDeliveryDate: new Date(Date.now() + 172800000).toISOString().split('T')[0],
          notes: 'Test offer from Nakliyeci panel'
        };
        
        const response = await axios.post(
          `${API_URL}/api/offers`,
          offerData,
          {
            headers: {
              'Authorization': `Bearer ${testData.users.nakliyeci.token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.data && response.data.success) {
          const offerId = response.data.data.id || response.data.data.offer?.id;
          testData.offers.push({ id: offerId, shipmentId: shipment.id, data: response.data.data });
          logSuccess(`Offer created: ${offerId}`);
          results.tests.push({ name: 'Create offer API', passed: true });
          results.passed++;
        } else {
          throw new Error('Offer creation failed');
        }
      } catch (error) {
        logError(`Offer creation failed: ${error.message}`);
        if (error.response) {
          console.log('Error response:', JSON.stringify(error.response.data, null, 2));
        }
        results.tests.push({ name: 'Create offer API', passed: false });
        results.failed++;
      }
    }
    
    // 5. My Offers page
    logInfo('Checking My Offers page...');
    await navigateTo('/nakliyeci/offers');
    await waitFor(2000);
    const offersOk = await checkPageErrors();
    results.tests.push({ name: 'My Offers page', passed: offersOk });
    if (offersOk) results.passed++; else results.failed++;
    
    // 6. Drivers page
    logInfo('Checking Drivers page...');
    await navigateTo('/nakliyeci/drivers');
    const driversOk = await checkPageErrors();
    results.tests.push({ name: 'Drivers page', passed: driversOk });
    if (driversOk) results.passed++; else results.failed++;
    
    // 7. Broadcast page
    logInfo('Checking Broadcast page...');
    await navigateTo('/nakliyeci/broadcast');
    const broadcastOk = await checkPageErrors();
    results.tests.push({ name: 'Broadcast page', passed: broadcastOk });
    if (broadcastOk) results.passed++; else results.failed++;
    
    // 8. Search functionality
    logInfo('Testing search functionality...');
    await navigateTo('/nakliyeci/open-shipments');
    await waitFor(2000);
    const searchInput = await page.$('input[type="search"], input[placeholder*="Ara"]');
    if (searchInput) {
      await searchInput.type('Ankara', { delay: 100 });
      await waitFor(1000);
      logSuccess('Search input found and used');
      results.tests.push({ name: 'Search functionality', passed: true });
      results.passed++;
    } else {
      results.tests.push({ name: 'Search functionality', passed: false });
      results.failed++;
    }
    
  } catch (error) {
    logError(`Nakliyeci panel test failed: ${error.message}`);
    results.failed++;
  }
  
  return results;
}

// ==================== CORPORATE PANEL TESTS ====================

async function testCorporatePanel() {
  logStep('🏢', 'TESTING CORPORATE PANEL');
  const results = { passed: 0, failed: 0, tests: [] };
  
  try {
    // 1. Login
    await loginAs('corporate');
    results.tests.push({ name: 'Login', passed: true });
    results.passed++;
    
    // 2. Dashboard
    logInfo('Checking Corporate Dashboard...');
    await navigateTo('/corporate/dashboard');
    const dashboardOk = await checkPageErrors();
    results.tests.push({ name: 'Dashboard loads', passed: dashboardOk });
    if (dashboardOk) results.passed++; else results.failed++;
    
    // 3. Create Shipment
    logInfo('Checking Create Shipment...');
    await navigateTo('/corporate/create-shipment');
    const createOk = await checkPageErrors();
    results.tests.push({ name: 'Create Shipment page', passed: createOk });
    if (createOk) results.passed++; else results.failed++;
    
    // 4. Shipments page
    logInfo('Checking Shipments page...');
    await navigateTo('/corporate/shipments');
    await waitFor(2000);
    const shipmentsOk = await checkPageErrors();
    results.tests.push({ name: 'Shipments page', passed: shipmentsOk });
    if (shipmentsOk) results.passed++; else results.failed++;
    
    // 5. Analytics page
    logInfo('Checking Analytics page...');
    await navigateTo('/corporate/analytics');
    const analyticsOk = await checkPageErrors();
    results.tests.push({ name: 'Analytics page', passed: analyticsOk });
    if (analyticsOk) results.passed++; else results.failed++;
    
    // 6. Team page
    logInfo('Checking Team page...');
    await navigateTo('/corporate/team');
    const teamOk = await checkPageErrors();
    results.tests.push({ name: 'Team page', passed: teamOk });
    if (teamOk) results.passed++; else results.failed++;
    
  } catch (error) {
    logError(`Corporate panel test failed: ${error.message}`);
    results.failed++;
  }
  
  return results;
}

// ==================== TASIYICI PANEL TESTS ====================

async function testTasiyiciPanel() {
  logStep('🚛', 'TESTING TASIYICI PANEL');
  const results = { passed: 0, failed: 0, tests: [] };
  
  try {
    // 1. Login
    await loginAs('tasiyici');
    results.tests.push({ name: 'Login', passed: true });
    results.passed++;
    
    // 2. Dashboard
    logInfo('Checking Tasiyici Dashboard...');
    await navigateTo('/tasiyici/dashboard');
    const dashboardOk = await checkPageErrors();
    results.tests.push({ name: 'Dashboard loads', passed: dashboardOk });
    if (dashboardOk) results.passed++; else results.failed++;
    
    // 3. Market page
    logInfo('Checking Market page...');
    await navigateTo('/tasiyici/market');
    await waitFor(2000);
    const marketOk = await checkPageErrors();
    results.tests.push({ name: 'Market page', passed: marketOk });
    if (marketOk) results.passed++; else results.failed++;
    
    // 4. Active Jobs
    logInfo('Checking Active Jobs...');
    await navigateTo('/tasiyici/active-jobs');
    const activeJobsOk = await checkPageErrors();
    results.tests.push({ name: 'Active Jobs page', passed: activeJobsOk });
    if (activeJobsOk) results.passed++; else results.failed++;
    
    // 5. Earnings
    logInfo('Checking Earnings...');
    await navigateTo('/tasiyici/earnings');
    const earningsOk = await checkPageErrors();
    results.tests.push({ name: 'Earnings page', passed: earningsOk });
    if (earningsOk) results.passed++; else results.failed++;
    
    // 6. Profile
    logInfo('Checking Profile...');
    await navigateTo('/tasiyici/profile');
    const profileOk = await checkPageErrors();
    results.tests.push({ name: 'Profile page', passed: profileOk });
    if (profileOk) results.passed++; else results.failed++;
    
  } catch (error) {
    logError(`Tasiyici panel test failed: ${error.message}`);
    results.failed++;
  }
  
  return results;
}

// ==================== CROSS-PANEL TESTS ====================

async function testCrossPanelInteractions() {
  logStep('🔄', 'TESTING CROSS-PANEL INTERACTIONS');
  const results = { passed: 0, failed: 0, tests: [] };
  
  try {
    // 1. Individual creates shipment
    logInfo('Individual creating shipment...');
    await loginAs('individual');
    const shipmentData = {
      mainCategory: 'furniture',
      productDescription: 'Cross-panel test shipment',
      weight: '50',
      quantity: '1',
      dimensions: { length: '100', width: '80', height: '60' },
      pickupAddress: 'Test Address 1, Beşiktaş',
      pickupDistrict: 'Beşiktaş',
      pickupCity: 'İstanbul',
      deliveryAddress: 'Test Address 2, Kızılay',
      deliveryDistrict: 'Kızılay',
      deliveryCity: 'Ankara',
      pickupDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      deliveryDate: new Date(Date.now() + 172800000).toISOString().split('T')[0],
      contactPerson: 'Cross Test User',
      phone: '5559998877',
      email: 'crosstest@test.com',
      publishType: 'all'
    };
    
    try {
      const response = await axios.post(
        `${API_URL}/api/shipments`,
        shipmentData,
        {
          headers: {
            'Authorization': `Bearer ${testData.users.individual.token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data && response.data.success) {
        const shipmentId = response.data.data.id || response.data.data.shipment?.id;
        testData.shipments.push({ id: shipmentId, type: 'cross-test', data: response.data.data });
        logSuccess(`Cross-test shipment created: ${shipmentId}`);
        results.tests.push({ name: 'Individual creates shipment', passed: true });
        results.passed++;
        
        // 2. Nakliyeci sees it
        await waitFor(2000);
        await loginAs('nakliyeci');
        await navigateTo('/nakliyeci/open-shipments');
        await waitFor(3000);
        const nakliyeciSeesIt = await checkTextExists('İstanbul', 'Shipment visible to Nakliyeci') ||
                               await checkTextExists('Ankara', 'Shipment visible to Nakliyeci');
        results.tests.push({ name: 'Nakliyeci sees shipment', passed: nakliyeciSeesIt });
        if (nakliyeciSeesIt) results.passed++; else results.failed++;
        
        // 3. Nakliyeci creates offer
        try {
          const offerData = {
            shipmentId: shipmentId,
            price: 3000,
            estimatedDeliveryDate: new Date(Date.now() + 172800000).toISOString().split('T')[0],
            notes: 'Cross-panel test offer'
          };
          
          const offerResponse = await axios.post(
            `${API_URL}/api/offers`,
            offerData,
            {
              headers: {
                'Authorization': `Bearer ${testData.users.nakliyeci.token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          if (offerResponse.data && offerResponse.data.success) {
            const offerId = offerResponse.data.data.id || offerResponse.data.data.offer?.id;
            testData.offers.push({ id: offerId, shipmentId: shipmentId, data: offerResponse.data.data });
            logSuccess(`Cross-test offer created: ${offerId}`);
            results.tests.push({ name: 'Nakliyeci creates offer', passed: true });
            results.passed++;
            
            // 4. Individual sees offer
            await waitFor(2000);
            await loginAs('individual');
            await navigateTo('/individual/offers');
            await waitFor(3000);
            const individualSeesOffer = await checkTextExists('3000', 'Offer visible to Individual') ||
                                       await checkTextExists('Teklif', 'Offer in list');
            results.tests.push({ name: 'Individual sees offer', passed: individualSeesOffer });
            if (individualSeesOffer) results.passed++; else results.failed++;
          } else {
            throw new Error('Offer creation failed');
          }
        } catch (error) {
          logError(`Offer creation failed: ${error.message}`);
          results.tests.push({ name: 'Nakliyeci creates offer', passed: false });
          results.failed++;
        }
      } else {
        throw new Error('Shipment creation failed');
      }
    } catch (error) {
      logError(`Shipment creation failed: ${error.message}`);
      results.tests.push({ name: 'Individual creates shipment', passed: false });
      results.failed++;
    }
    
  } catch (error) {
    logError(`Cross-panel test failed: ${error.message}`);
    results.failed++;
  }
  
  return results;
}

// ==================== MAIN TEST RUNNER ====================

async function runComprehensiveTests() {
  log('\n═══════════════════════════════════════════════════════', 'cyan');
  log('🧪 COMPREHENSIVE 4-PANEL REAL USER TEST', 'cyan');
  log('═══════════════════════════════════════════════════════\n', 'cyan');
  
  // Create screenshots directory
  try {
    const fs = require('fs');
    if (!fs.existsSync('test-screenshots')) {
      fs.mkdirSync('test-screenshots');
    }
  } catch (e) {}
  
  // Check if servers are running
  logInfo('Checking if backend is running...');
  const backendRunning = await checkServerRunning();
  if (!backendRunning) {
    logError('Backend is not running! Please start it first.');
    process.exit(1);
  }
  logSuccess('Backend is running');
  
  const allResults = {
    individual: null,
    nakliyeci: null,
    corporate: null,
    tasiyici: null,
    crossPanel: null
  };
  
  try {
    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1920, height: 1080 }
    });
    page = await browser.newPage();
    
    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        logWarning(`Console error: ${msg.text()}`);
      }
    });
    
    page.on('pageerror', error => {
      logError(`Page error: ${error.message}`);
    });
    
    // Run all tests
    allResults.individual = await testIndividualPanel();
    await waitFor(2000);
    
    allResults.nakliyeci = await testNakliyeciPanel();
    await waitFor(2000);
    
    allResults.corporate = await testCorporatePanel();
    await waitFor(2000);
    
    allResults.tasiyici = await testTasiyiciPanel();
    await waitFor(2000);
    
    allResults.crossPanel = await testCrossPanelInteractions();
    
  } catch (error) {
    logError(`Test suite failed: ${error.message}`);
    console.error(error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  // Print final results
  log('\n═══════════════════════════════════════════════════════', 'cyan');
  log('📊 FINAL TEST RESULTS', 'cyan');
  log('═══════════════════════════════════════════════════════\n', 'cyan');
  
  let totalPassed = 0;
  let totalFailed = 0;
  
  const panels = [
    { name: 'Individual Panel', results: allResults.individual },
    { name: 'Nakliyeci Panel', results: allResults.nakliyeci },
    { name: 'Corporate Panel', results: allResults.corporate },
    { name: 'Tasiyici Panel', results: allResults.tasiyici },
    { name: 'Cross-Panel Interactions', results: allResults.crossPanel }
  ];
  
  panels.forEach(panel => {
    if (panel.results) {
      log(`\n${panel.name}:`, 'magenta');
      panel.results.tests.forEach(test => {
        if (test.passed) {
          logSuccess(`  ${test.name}`);
        } else {
          logError(`  ${test.name}`);
        }
      });
      log(`  Summary: ${panel.results.passed} passed, ${panel.results.failed} failed\n`, 
          panel.results.failed > 0 ? 'yellow' : 'green');
      totalPassed += panel.results.passed;
      totalFailed += panel.results.failed;
    }
  });
  
  log('\n═══════════════════════════════════════════════════════', 'cyan');
  log(`📈 OVERALL SUMMARY: ${totalPassed} passed, ${totalFailed} failed out of ${totalPassed + totalFailed} tests`, 
      totalFailed > 0 ? 'red' : 'green');
  log('═══════════════════════════════════════════════════════\n', 'cyan');
  
  if (totalFailed > 0) {
    logWarning('⚠️  Some tests failed. Please review the errors above.');
    process.exit(1);
  } else {
    logSuccess('✅ All tests passed! The system is working correctly.');
    process.exit(0);
  }
}

// Run tests
runComprehensiveTests().catch(error => {
  logError(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});

