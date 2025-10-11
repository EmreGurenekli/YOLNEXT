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
  startTime: Date.now()
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

// Test functions
const testFrontendAccess = async () => {
  log('Testing Frontend Access...', 'info');
  
  try {
    const response = await axios.get(FRONTEND_URL);
    
    if (response.status === 200) {
      log('✅ Frontend Access Passed', 'success');
      testResults.passed++;
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

const testBackendHealth = async () => {
  log('Testing Backend Health...', 'info');
  
  try {
    const response = await makeRequest('GET', '/api/health');
    
    if (response.status === 200 && response.data.status === 'OK') {
      log('✅ Backend Health Passed', 'success');
      testResults.passed++;
      return true;
    } else {
      throw new Error(`Backend health check failed: ${response.status}`);
    }
  } catch (error) {
    log(`❌ Backend Health Failed: ${error.message}`, 'error');
    testResults.failed++;
    testResults.errors.push(`Backend Health: ${error.message}`);
    return false;
  }
};

const testAuthentication = async () => {
  log('Testing Authentication System...', 'info');
  
  const demoUsers = [
    { email: 'individual@demo.com', password: 'demo123', type: 'individual' },
    { email: 'corporate@demo.com', password: 'demo123', type: 'corporate' },
    { email: 'nakliyeci@demo.com', password: 'demo123', type: 'nakliyeci' },
    { email: 'tasiyici@demo.com', password: 'demo123', type: 'tasiyici' }
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

const testAPIEndpoints = async () => {
  log('Testing API Endpoints...', 'info');
  
  // Get a token first
  let token = null;
  try {
    const loginResponse = await makeRequest('POST', '/api/auth/login', {
      email: 'individual@demo.com',
      password: 'demo123'
    });
    
    if (loginResponse.status === 200) {
      token = loginResponse.data.token;
    } else {
      throw new Error('Failed to get authentication token');
    }
  } catch (error) {
    log(`❌ Token Retrieval Failed: ${error.message}`, 'error');
    testResults.failed++;
    testResults.errors.push(`Token Retrieval: ${error.message}`);
    return false;
  }
  
  const endpoints = [
    { method: 'GET', path: '/api/shipments', name: 'Get Shipments' },
    { method: 'POST', path: '/api/shipments', name: 'Create Shipment', data: {
      title: 'Test Shipment',
      description: 'Test description',
      from_location: 'Istanbul',
      to_location: 'Ankara',
      weight: 10,
      volume: 1,
      price: 500,
      vehicle_type: 'Truck'
    }},
    { method: 'GET', path: '/api/offers/nakliyeci', name: 'Get Nakliyeci Offers' },
    { method: 'GET', path: '/api/agreements/sender', name: 'Get Sender Agreements' },
    { method: 'GET', path: '/api/commission/rate', name: 'Get Commission Rate' }
  ];
  
  let allPassed = true;
  
  for (const endpoint of endpoints) {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await makeRequest(endpoint.method, endpoint.path, endpoint.data, headers);
      
      if (response.status >= 200 && response.status < 300) {
        log(`✅ ${endpoint.name} Passed`, 'success');
        testResults.passed++;
      } else {
        throw new Error(`${endpoint.name} returned status ${response.status}`);
      }
    } catch (error) {
      log(`❌ ${endpoint.name} Failed: ${error.message}`, 'error');
      testResults.failed++;
      testResults.errors.push(`${endpoint.name}: ${error.message}`);
      allPassed = false;
    }
  }
  
  return allPassed;
};

const testFrontendComponents = async () => {
  log('Testing Frontend Components...', 'info');
  
  try {
    const response = await axios.get(FRONTEND_URL);
    const html = response.data;
    
    // Check for essential components
    const components = [
      'YolNet',
      'Login',
      'Register',
      'Dashboard',
      'Individual',
      'Corporate',
      'Nakliyeci',
      'Tasiyici'
    ];
    
    let allFound = true;
    
    for (const component of components) {
      if (html.includes(component)) {
        log(`✅ Component ${component} Found`, 'success');
        testResults.passed++;
      } else {
        log(`❌ Component ${component} Not Found`, 'error');
        testResults.failed++;
        testResults.errors.push(`Component ${component}: Not found in HTML`);
        allFound = false;
      }
    }
    
    return allFound;
  } catch (error) {
    log(`❌ Frontend Components Test Failed: ${error.message}`, 'error');
    testResults.failed++;
    testResults.errors.push(`Frontend Components: ${error.message}`);
    return false;
  }
};

const testResponsiveDesign = async () => {
  log('Testing Responsive Design...', 'info');
  
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
      'grid'
    ];
    
    let foundIndicators = 0;
    
    for (const indicator of responsiveIndicators) {
      if (html.toLowerCase().includes(indicator.toLowerCase())) {
        foundIndicators++;
        log(`✅ Responsive Indicator ${indicator} Found`, 'success');
        testResults.passed++;
      }
    }
    
    if (foundIndicators >= 3) {
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
  log('Testing Performance...', 'info');
  
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

// Main test runner
const runTests = async () => {
  log('🚀 Starting Frontend Test Suite...', 'info');
  log('==================================================', 'info');
  
  const tests = [
    { name: 'Frontend Access', fn: testFrontendAccess },
    { name: 'Backend Health', fn: testBackendHealth },
    { name: 'Authentication', fn: testAuthentication },
    { name: 'API Endpoints', fn: testAPIEndpoints },
    { name: 'Frontend Components', fn: testFrontendComponents },
    { name: 'Responsive Design', fn: testResponsiveDesign },
    { name: 'Performance', fn: testPerformance }
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
  log('📊 FRONTEND TEST RESULTS SUMMARY', 'info');
  log('==================================================', 'info');
  log(`✅ Passed: ${testResults.passed}`, 'success');
  log(`❌ Failed: ${testResults.failed}`, 'error');
  log(`⏱️  Total Duration: ${(totalDuration / 1000).toFixed(2)}s`, 'info');
  
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
  log(`API Endpoints: ${testResults.passed > 5 ? 'Good' : 'Poor'}`, 'info');
  log(`Component Loading: ${testResults.passed > 3 ? 'Good' : 'Poor'}`, 'info');
  log('', 'info');
  log(`🎯 Success Rate: ${successRate.toFixed(1)}%`, 'info');
  
  if (testResults.failed === 0) {
    log('', 'info');
    log('🎉 All tests passed! Frontend is fully functional!', 'success');
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

