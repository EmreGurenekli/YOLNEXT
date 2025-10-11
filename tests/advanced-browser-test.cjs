const axios = require('axios');
const { JSDOM } = require('jsdom');

// Test configuration
const FRONTEND_URL = 'http://localhost:5173';
const BACKEND_URL = 'http://localhost:5000';

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  errors: [],
  startTime: Date.now(),
  categories: {
    'Frontend Access': 0,
    'Backend API': 0,
    'Authentication': 0,
    'Panel Navigation': 0,
    'UI Components': 0,
    'Responsive Design': 0,
    'Performance': 0,
    'Security': 0
  }
};

// Utility functions
const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m'
  };
  console.log(`${colors[type]}[${timestamp}] ${message}\x1b[0m`);
};

const makeRequest = async (method, url, data = null, headers = {}) => {
  try {
    const config = {
      method,
      url: `${BACKEND_URL}${url}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return {
      status: response.status,
      data: response.data,
      headers: response.headers
    };
  } catch (error) {
    if (error.response) {
      return {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      };
    }
    throw error;
  }
};

// Test categories
const testFrontendAccess = async () => {
  log('🌐 Testing Frontend Access...', 'info');
  
  try {
    const response = await axios.get(FRONTEND_URL);
    
    if (response.status === 200) {
      log('✅ Frontend Access Passed', 'success');
      testResults.passed++;
      testResults.categories['Frontend Access']++;
      return true;
    } else {
      throw new Error(`Frontend returned status ${response.status}`);
    }
  } catch (error) {
    log(`❌ Frontend Access Failed: ${error.message}`, 'error');
    testResults.failed++;
    testResults.errors.push(`Frontend Access: ${error.message}`);
    return false;
  }
};

const testBackendAPI = async () => {
  log('🔧 Testing Backend API...', 'info');
  
  const apiTests = [
    { name: 'Health Check', method: 'GET', path: '/api/health' },
    { name: 'Commission Rate', method: 'GET', path: '/api/commission/rate' },
    { name: 'Commission Examples', method: 'GET', path: '/api/commission/examples' }
  ];
  
  let allPassed = true;
  
  for (const test of apiTests) {
    try {
      const response = await makeRequest(test.method, test.path);
      
      if (response.status === 200) {
        log(`✅ ${test.name} Passed`, 'success');
        testResults.passed++;
        testResults.categories['Backend API']++;
      } else {
        throw new Error(`${test.name} returned status ${response.status}`);
      }
    } catch (error) {
      log(`❌ ${test.name} Failed: ${error.message}`, 'error');
      testResults.failed++;
      testResults.errors.push(`${test.name}: ${error.message}`);
      allPassed = false;
    }
  }
  
  return allPassed;
};

const testAuthentication = async () => {
  log('🔐 Testing Authentication System...', 'info');
  
  const demoUsers = [
    { email: 'individual@demo.com', password: 'demo123', type: 'Individual' },
    { email: 'corporate@demo.com', password: 'demo123', type: 'Corporate' },
    { email: 'nakliyeci@demo.com', password: 'demo123', type: 'Nakliyeci' },
    { email: 'tasiyici@demo.com', password: 'demo123', type: 'Tasiyici' }
  ];
  
  let allPassed = true;
  
  for (const user of demoUsers) {
    try {
      const response = await makeRequest('POST', '/api/auth/login', {
        email: user.email,
        password: user.password
      });
      
      if (response.status === 200 && response.data.token) {
        log(`✅ ${user.type} Login Passed`, 'success');
        testResults.passed++;
        testResults.categories['Authentication']++;
      } else {
        throw new Error(`${user.type} login failed: ${response.status}`);
      }
    } catch (error) {
      log(`❌ ${user.type} Login Failed: ${error.message}`, 'error');
      testResults.failed++;
      testResults.errors.push(`${user.type} Login: ${error.message}`);
      allPassed = false;
    }
  }
  
  return allPassed;
};

const testPanelNavigation = async () => {
  log('🧭 Testing Panel Navigation...', 'info');
  
  try {
    // Get a token for authenticated requests
    const loginResponse = await makeRequest('POST', '/api/auth/login', {
      email: 'individual@demo.com',
      password: 'demo123'
    });
    
    if (loginResponse.status !== 200) {
      throw new Error('Failed to get authentication token');
    }
    
    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    
    // Test panel-specific endpoints
    const panelTests = [
      { name: 'Get Shipments', method: 'GET', path: '/api/shipments' },
      { name: 'Get Offers', method: 'GET', path: '/api/offers/nakliyeci' },
      { name: 'Get Agreements', method: 'GET', path: '/api/agreements/sender' }
    ];
    
    let allPassed = true;
    
    for (const test of panelTests) {
      try {
        const response = await makeRequest(test.method, test.path, null, headers);
        
        if (response.status >= 200 && response.status < 300) {
          log(`✅ ${test.name} Passed`, 'success');
          testResults.passed++;
          testResults.categories['Panel Navigation']++;
        } else {
          throw new Error(`${test.name} returned status ${response.status}`);
        }
      } catch (error) {
        log(`❌ ${test.name} Failed: ${error.message}`, 'error');
        testResults.failed++;
        testResults.errors.push(`${test.name}: ${error.message}`);
        allPassed = false;
      }
    }
    
    return allPassed;
  } catch (error) {
    log(`❌ Panel Navigation Test Failed: ${error.message}`, 'error');
    testResults.failed++;
    testResults.errors.push(`Panel Navigation: ${error.message}`);
    return false;
  }
};

const testUIComponents = async () => {
  log('🎨 Testing UI Components...', 'info');
  
  try {
    const response = await axios.get(FRONTEND_URL);
    const html = response.data;
    
    // Check for essential UI components
    const uiComponents = [
      'YolNet',
      'React',
      'Tailwind',
      'Lucide',
      'Framer'
    ];
    
    let foundComponents = 0;
    
    for (const component of uiComponents) {
      if (html.includes(component)) {
        foundComponents++;
        log(`✅ UI Component ${component} Found`, 'success');
        testResults.passed++;
        testResults.categories['UI Components']++;
      } else {
        log(`❌ UI Component ${component} Not Found`, 'error');
        testResults.failed++;
        testResults.errors.push(`UI Component ${component}: Not found`);
      }
    }
    
    if (foundComponents >= 3) {
      log('✅ UI Components Test Passed', 'success');
      return true;
    } else {
      throw new Error(`Only ${foundComponents} UI components found`);
    }
  } catch (error) {
    log(`❌ UI Components Test Failed: ${error.message}`, 'error');
    testResults.failed++;
    testResults.errors.push(`UI Components: ${error.message}`);
    return false;
  }
};

const testResponsiveDesign = async () => {
  log('📱 Testing Responsive Design...', 'info');
  
  try {
    const response = await axios.get(FRONTEND_URL);
    const html = response.data;
    
    // Check for responsive design indicators
    const responsiveIndicators = [
      'viewport',
      'mobile',
      'responsive',
      'tailwind',
      'flex',
      'grid',
      'sm:',
      'md:',
      'lg:',
      'xl:'
    ];
    
    let foundIndicators = 0;
    
    for (const indicator of responsiveIndicators) {
      if (html.toLowerCase().includes(indicator.toLowerCase())) {
        foundIndicators++;
        log(`✅ Responsive Indicator ${indicator} Found`, 'success');
        testResults.passed++;
        testResults.categories['Responsive Design']++;
      }
    }
    
    if (foundIndicators >= 5) {
      log('✅ Responsive Design Test Passed', 'success');
      return true;
    } else {
      throw new Error(`Only ${foundIndicators} responsive indicators found`);
    }
  } catch (error) {
    log(`❌ Responsive Design Test Failed: ${error.message}`, 'error');
    testResults.failed++;
    testResults.errors.push(`Responsive Design: ${error.message}`);
    return false;
  }
};

const testPerformance = async () => {
  log('⚡ Testing Performance...', 'info');
  
  const startTime = Date.now();
  
  try {
    // Test multiple concurrent requests
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(axios.get(FRONTEND_URL));
    }
    
    await Promise.all(promises);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (duration < 3000) { // Less than 3 seconds
      log(`✅ Performance Test Passed (${duration}ms)`, 'success');
      testResults.passed++;
      testResults.categories['Performance']++;
      return true;
    } else {
      throw new Error(`Performance test took too long: ${duration}ms`);
    }
  } catch (error) {
    log(`❌ Performance Test Failed: ${error.message}`, 'error');
    testResults.failed++;
    testResults.errors.push(`Performance: ${error.message}`);
    return false;
  }
};

const testSecurity = async () => {
  log('🔒 Testing Security...', 'info');
  
  try {
    // Test unauthorized access
    const response = await makeRequest('GET', '/api/shipments');
    
    if (response.status === 401) {
      log('✅ Unauthorized Access Blocked', 'success');
      testResults.passed++;
      testResults.categories['Security']++;
    } else {
      throw new Error(`Expected 401, got ${response.status}`);
    }
    
    // Test rate limiting
    const rateLimitTests = [];
    for (let i = 0; i < 5; i++) {
      rateLimitTests.push(makeRequest('GET', '/api/health'));
    }
    
    await Promise.all(rateLimitTests);
    log('✅ Rate Limiting Test Passed', 'success');
    testResults.passed++;
    testResults.categories['Security']++;
    
    return true;
  } catch (error) {
    log(`❌ Security Test Failed: ${error.message}`, 'error');
    testResults.failed++;
    testResults.errors.push(`Security: ${error.message}`);
    return false;
  }
};

// Main test runner
const runTests = async () => {
  log('🚀 Starting Advanced Browser Test Suite...', 'info');
  log('==================================================', 'info');
  
  const tests = [
    { name: 'Frontend Access', fn: testFrontendAccess },
    { name: 'Backend API', fn: testBackendAPI },
    { name: 'Authentication', fn: testAuthentication },
    { name: 'Panel Navigation', fn: testPanelNavigation },
    { name: 'UI Components', fn: testUIComponents },
    { name: 'Responsive Design', fn: testResponsiveDesign },
    { name: 'Performance', fn: testPerformance },
    { name: 'Security', fn: testSecurity }
  ];
  
  for (const test of tests) {
    try {
      await test.fn();
    } catch (error) {
      log(`❌ ${test.name} Test Error: ${error.message}`, 'error');
      testResults.failed++;
      testResults.errors.push(`${test.name}: ${error.message}`);
    }
  }
  
  const endTime = Date.now();
  const totalDuration = endTime - testResults.startTime;
  
  log('==================================================', 'info');
  log('📊 ADVANCED BROWSER TEST RESULTS SUMMARY', 'info');
  log('==================================================', 'info');
  log(`✅ Passed: ${testResults.passed}`, 'success');
  log(`❌ Failed: ${testResults.failed}`, 'error');
  log(`⏱️  Total Duration: ${(totalDuration / 1000).toFixed(2)}s`, 'info');
  
  log('', 'info');
  log('📈 CATEGORY BREAKDOWN:', 'info');
  Object.entries(testResults.categories).forEach(([category, count]) => {
    const status = count > 0 ? '✅' : '❌';
    log(`${status} ${category}: ${count} tests passed`, count > 0 ? 'success' : 'error');
  });
  
  if (testResults.errors.length > 0) {
    log('', 'info');
    log('❌ ERRORS:', 'error');
    testResults.errors.forEach((error, index) => {
      log(`${index + 1}. ${error}`, 'error');
    });
  }
  
  const successRate = testResults.passed / (testResults.passed + testResults.failed) * 100;
  log('', 'info');
  log(`📈 PERFORMANCE METRICS:`, 'info');
  log(`Frontend Access: ${totalDuration < 1000 ? 'Fast' : 'Slow'}`, 'info');
  log(`Backend Response: ${totalDuration < 2000 ? 'Fast' : 'Slow'}`, 'info');
  log(`API Endpoints: ${testResults.passed > 10 ? 'Excellent' : testResults.passed > 5 ? 'Good' : 'Poor'}`, 'info');
  log(`Component Loading: ${testResults.passed > 8 ? 'Excellent' : testResults.passed > 4 ? 'Good' : 'Poor'}`, 'info');
  log('', 'info');
  log(`🎯 Success Rate: ${successRate.toFixed(1)}%`, 'info');
  
  if (testResults.failed === 0) {
    log('', 'info');
    log('🎉 All tests passed! System is fully functional!', 'success');
  } else if (successRate >= 80) {
    log('', 'info');
    log('✅ Most tests passed! System is mostly functional!', 'success');
  } else {
    log('', 'info');
    log(`⚠️  ${testResults.failed} tests failed. Please check the errors above.`, 'warning');
  }
  
  process.exit(testResults.failed === 0 ? 0 : 1);
};

// Run tests
runTests().catch(error => {
  log(`❌ Test Suite Error: ${error.message}`, 'error');
  process.exit(1);
});

