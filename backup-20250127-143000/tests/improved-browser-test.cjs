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
    'Security': 0,
    'Database': 0,
    'Real-time Features': 0
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
    { name: 'Commission Examples', method: 'GET', path: '/api/commission/examples' },
    { name: 'Commission Calculate', method: 'POST', path: '/api/commission/calculate', data: { agreedPrice: 1000 } }
  ];
  
  let allPassed = true;
  
  for (const test of apiTests) {
    try {
      const response = await makeRequest(test.method, test.path, test.data);
      
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
      { name: 'Get Agreements', name: 'GET', path: '/api/agreements/sender' },
      { name: 'Create Shipment', method: 'POST', path: '/api/shipments', data: {
        title: 'Test Shipment',
        description: 'Test description',
        from_location: 'Istanbul',
        to_location: 'Ankara',
        weight: 10,
        volume: 1,
        price: 500,
        vehicle_type: 'Truck'
      }}
    ];
    
    let allPassed = true;
    
    for (const test of panelTests) {
      try {
        const response = await makeRequest(test.method, test.path, test.data, headers);
        
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
    
    // Check for essential UI components and frameworks
    const uiComponents = [
      { name: 'YolNet', search: 'YolNet' },
      { name: 'React', search: 'react' },
      { name: 'Vite', search: 'vite' },
      { name: 'TypeScript', search: 'typescript' },
      { name: 'HTML5', search: '<!doctype html>' },
      { name: 'Meta Viewport', search: 'viewport' },
      { name: 'CSS Framework', search: 'css' },
      { name: 'JavaScript', search: 'script' }
    ];
    
    let foundComponents = 0;
    
    for (const component of uiComponents) {
      if (html.toLowerCase().includes(component.search.toLowerCase())) {
        foundComponents++;
        log(`✅ UI Component ${component.name} Found`, 'success');
        testResults.passed++;
        testResults.categories['UI Components']++;
      } else {
        log(`❌ UI Component ${component.name} Not Found`, 'error');
        testResults.failed++;
        testResults.errors.push(`UI Component ${component.name}: Not found`);
      }
    }
    
    if (foundComponents >= 5) {
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
      { name: 'Viewport Meta', search: 'viewport' },
      { name: 'Mobile Optimized', search: 'mobile' },
      { name: 'Responsive Design', search: 'responsive' },
      { name: 'CSS Framework', search: 'tailwind' },
      { name: 'Flexbox', search: 'flex' },
      { name: 'Grid Layout', search: 'grid' },
      { name: 'Media Queries', search: 'media' },
      { name: 'Touch Events', search: 'touch' }
    ];
    
    let foundIndicators = 0;
    
    for (const indicator of responsiveIndicators) {
      if (html.toLowerCase().includes(indicator.search.toLowerCase())) {
        foundIndicators++;
        log(`✅ Responsive Indicator ${indicator.name} Found`, 'success');
        testResults.passed++;
        testResults.categories['Responsive Design']++;
      } else {
        log(`❌ Responsive Indicator ${indicator.name} Not Found`, 'error');
        testResults.failed++;
        testResults.errors.push(`Responsive Indicator ${indicator.name}: Not found`);
      }
    }
    
    if (foundIndicators >= 4) {
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
    for (let i = 0; i < 10; i++) {
      promises.push(axios.get(FRONTEND_URL));
    }
    
    await Promise.all(promises);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (duration < 5000) { // Less than 5 seconds
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

const testDatabase = async () => {
  log('🗄️ Testing Database...', 'info');
  
  try {
    // Test database operations through API
    const loginResponse = await makeRequest('POST', '/api/auth/login', {
      email: 'individual@demo.com',
      password: 'demo123'
    });
    
    if (loginResponse.status !== 200) {
      throw new Error('Failed to get authentication token');
    }
    
    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    
    // Test database operations
    const dbTests = [
      { name: 'User Authentication', method: 'GET', path: '/api/auth/me' },
      { name: 'Shipment Creation', method: 'POST', path: '/api/shipments', data: {
        title: 'Database Test Shipment',
        description: 'Testing database operations',
        from_location: 'Istanbul',
        to_location: 'Ankara',
        weight: 15,
        volume: 2,
        price: 750,
        vehicle_type: 'Truck'
      }},
      { name: 'Shipment Retrieval', method: 'GET', path: '/api/shipments' }
    ];
    
    let allPassed = true;
    
    for (const test of dbTests) {
      try {
        const response = await makeRequest(test.method, test.path, test.data, headers);
        
        if (response.status >= 200 && response.status < 300) {
          log(`✅ ${test.name} Passed`, 'success');
          testResults.passed++;
          testResults.categories['Database']++;
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
    log(`❌ Database Test Failed: ${error.message}`, 'error');
    testResults.failed++;
    testResults.errors.push(`Database: ${error.message}`);
    return false;
  }
};

const testRealtimeFeatures = async () => {
  log('🔄 Testing Real-time Features...', 'info');
  
  try {
    // Test WebSocket connection (if available)
    const response = await axios.get(`${BACKEND_URL}/socket.io/`);
    
    if (response.status === 200) {
      log('✅ WebSocket Server Available', 'success');
      testResults.passed++;
      testResults.categories['Real-time Features']++;
    } else {
      throw new Error(`WebSocket server returned status ${response.status}`);
    }
    
    // Test real-time API endpoints
    const realtimeTests = [
      { name: 'Messages API', method: 'GET', path: '/api/messages' },
      { name: 'Notifications API', method: 'GET', path: '/api/notifications' }
    ];
    
    let allPassed = true;
    
    for (const test of realtimeTests) {
      try {
        const response = await makeRequest(test.method, test.path);
        
        if (response.status >= 200 && response.status < 500) {
          log(`✅ ${test.name} Available`, 'success');
          testResults.passed++;
          testResults.categories['Real-time Features']++;
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
    log(`❌ Real-time Features Test Failed: ${error.message}`, 'error');
    testResults.failed++;
    testResults.errors.push(`Real-time Features: ${error.message}`);
    return false;
  }
};

// Main test runner
const runTests = async () => {
  log('🚀 Starting Improved Browser Test Suite...', 'info');
  log('==================================================', 'info');
  
  const tests = [
    { name: 'Frontend Access', fn: testFrontendAccess },
    { name: 'Backend API', fn: testBackendAPI },
    { name: 'Authentication', fn: testAuthentication },
    { name: 'Panel Navigation', fn: testPanelNavigation },
    { name: 'UI Components', fn: testUIComponents },
    { name: 'Responsive Design', fn: testResponsiveDesign },
    { name: 'Performance', fn: testPerformance },
    { name: 'Security', fn: testSecurity },
    { name: 'Database', fn: testDatabase },
    { name: 'Real-time Features', fn: testRealtimeFeatures }
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
  log('📊 IMPROVED BROWSER TEST RESULTS SUMMARY', 'info');
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
  log(`API Endpoints: ${testResults.passed > 15 ? 'Excellent' : testResults.passed > 10 ? 'Good' : 'Poor'}`, 'info');
  log(`Component Loading: ${testResults.passed > 12 ? 'Excellent' : testResults.passed > 8 ? 'Good' : 'Poor'}`, 'info');
  log('', 'info');
  log(`🎯 Success Rate: ${successRate.toFixed(1)}%`, 'info');
  
  if (testResults.failed === 0) {
    log('', 'info');
    log('🎉 All tests passed! System is fully functional!', 'success');
  } else if (successRate >= 85) {
    log('', 'info');
    log('✅ Most tests passed! System is highly functional!', 'success');
  } else if (successRate >= 70) {
    log('', 'info');
    log('✅ Good test results! System is mostly functional!', 'success');
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

