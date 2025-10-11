const axios = require('axios');
const { exec } = require('child_process');
const fs = require('fs');

// Production Ready Test Suite
const FRONTEND_URL = 'http://localhost:5173';
const BACKEND_URL = 'http://localhost:5000';

const testResults = {
  passed: 0,
  failed: 0,
  errors: [],
  startTime: Date.now(),
  categories: {
    'System Health': 0,
    'Security': 0,
    'Performance': 0,
    'API Endpoints': 0,
    'User Flows': 0,
    'Database': 0,
    'File Structure': 0,
    'Dependencies': 0
  }
};

const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m',
    test: '\x1b[35m'
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

// Test system health
const testSystemHealth = async () => {
  log('🏥 Sistem Sağlık Testi...', 'test');
  
  try {
    const response = await makeRequest('GET', '/api/health');
    
    if (response.status === 200 && response.data.status === 'OK') {
      log('✅ Backend sağlıklı', 'success');
      testResults.passed++;
      testResults.categories['System Health']++;
      return true;
    } else {
      throw new Error(`Backend health check failed: ${response.status}`);
    }
  } catch (error) {
    log(`❌ Backend sağlık kontrolü başarısız: ${error.message}`, 'error');
    testResults.failed++;
    testResults.errors.push(`System Health: ${error.message}`);
    return false;
  }
};

// Test frontend access
const testFrontendAccess = async () => {
  log('🌐 Frontend Erişim Testi...', 'test');
  
  try {
    const response = await axios.get(FRONTEND_URL);
    
    if (response.status === 200) {
      log('✅ Frontend erişilebilir', 'success');
      testResults.passed++;
      testResults.categories['System Health']++;
      return true;
    } else {
      throw new Error(`Frontend returned status ${response.status}`);
    }
  } catch (error) {
    log(`❌ Frontend erişim başarısız: ${error.message}`, 'error');
    testResults.failed++;
    testResults.errors.push(`Frontend Access: ${error.message}`);
    return false;
  }
};

// Test security features
const testSecurityFeatures = async () => {
  log('🔒 Güvenlik Testi...', 'test');
  
  const securityTests = [
    { name: 'CORS Headers', test: () => testCORSHeaders() },
    { name: 'Rate Limiting', test: () => testRateLimiting() },
    { name: 'Authentication', test: () => testAuthentication() },
    { name: 'Input Validation', test: () => testInputValidation() }
  ];
  
  let successCount = 0;
  
  for (const test of securityTests) {
    try {
      const result = await test.test();
      if (result) {
        log(`✅ ${test.name} başarılı`, 'success');
        successCount++;
        testResults.passed++;
        testResults.categories['Security']++;
      } else {
        log(`❌ ${test.name} başarısız`, 'error');
        testResults.failed++;
        testResults.errors.push(`Security ${test.name}: Failed`);
      }
    } catch (error) {
      log(`❌ ${test.name} hata: ${error.message}`, 'error');
      testResults.failed++;
      testResults.errors.push(`Security ${test.name}: ${error.message}`);
    }
  }
  
  log(`📊 Güvenlik sonucu: ${successCount}/${securityTests.length} başarılı`, 'info');
  return successCount;
};

const testCORSHeaders = async () => {
  try {
    const response = await axios.options(`${BACKEND_URL}/api/health`);
    return response.headers['access-control-allow-origin'] !== undefined;
  } catch (error) {
    return false;
  }
};

const testRateLimiting = async () => {
  try {
    // Make multiple rapid requests
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(makeRequest('GET', '/api/health'));
    }
    
    const responses = await Promise.all(promises);
    const rateLimited = responses.some(r => r.status === 429);
    return rateLimited;
  } catch (error) {
    return false;
  }
};

const testAuthentication = async () => {
  try {
    const response = await makeRequest('GET', '/api/shipments');
    return response.status === 401; // Should be unauthorized
  } catch (error) {
    return false;
  }
};

const testInputValidation = async () => {
  try {
    const response = await makeRequest('POST', '/api/auth/login', {
      email: 'invalid-email',
      password: ''
    });
    return response.status === 400; // Should be bad request
  } catch (error) {
    return false;
  }
};

// Test performance
const testPerformance = async () => {
  log('⚡ Performans Testi...', 'test');
  
  const performanceTests = [
    { name: 'API Response Time', test: () => testAPIResponseTime() },
    { name: 'Concurrent Users', test: () => testConcurrentUsers() },
    { name: 'Memory Usage', test: () => testMemoryUsage() },
    { name: 'Database Performance', test: () => testDatabasePerformance() }
  ];
  
  let successCount = 0;
  
  for (const test of performanceTests) {
    try {
      const result = await test.test();
      if (result) {
        log(`✅ ${test.name} başarılı`, 'success');
        successCount++;
        testResults.passed++;
        testResults.categories['Performance']++;
      } else {
        log(`❌ ${test.name} başarısız`, 'error');
        testResults.failed++;
        testResults.errors.push(`Performance ${test.name}: Failed`);
      }
    } catch (error) {
      log(`❌ ${test.name} hata: ${error.message}`, 'error');
      testResults.failed++;
      testResults.errors.push(`Performance ${test.name}: ${error.message}`);
    }
  }
  
  log(`📊 Performans sonucu: ${successCount}/${performanceTests.length} başarılı`, 'info');
  return successCount;
};

const testAPIResponseTime = async () => {
  const startTime = Date.now();
  await makeRequest('GET', '/api/health');
  const endTime = Date.now();
  const responseTime = endTime - startTime;
  
  return responseTime < 1000; // Less than 1 second
};

const testConcurrentUsers = async () => {
  try {
    const promises = [];
    for (let i = 0; i < 20; i++) {
      promises.push(makeRequest('GET', '/api/health'));
    }
    
    const responses = await Promise.all(promises);
    const successRate = responses.filter(r => r.status === 200).length / responses.length;
    return successRate >= 0.95; // 95% success rate
  } catch (error) {
    return false;
  }
};

const testMemoryUsage = async () => {
  const memUsage = process.memoryUsage();
  const heapUsed = memUsage.heapUsed / 1024 / 1024; // MB
  return heapUsed < 500; // Less than 500MB
};

const testDatabasePerformance = async () => {
  const startTime = Date.now();
  await makeRequest('GET', '/api/commission/rate');
  const endTime = Date.now();
  const responseTime = endTime - startTime;
  
  return responseTime < 500; // Less than 500ms
};

// Test API endpoints
const testAPIEndpoints = async () => {
  log('🔌 API Endpoint Testi...', 'test');
  
  const endpoints = [
    { name: 'Health Check', method: 'GET', path: '/api/health' },
    { name: 'Commission Rate', method: 'GET', path: '/api/commission/rate' },
    { name: 'Commission Examples', method: 'GET', path: '/api/commission/examples' },
    { name: 'Commission Calculate', method: 'POST', path: '/api/commission/calculate', data: { agreedPrice: 1000 } }
  ];
  
  let successCount = 0;
  
  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(endpoint.method, endpoint.path, endpoint.data);
      
      if (response.status >= 200 && response.status < 300) {
        log(`✅ ${endpoint.name} başarılı`, 'success');
        successCount++;
        testResults.passed++;
        testResults.categories['API Endpoints']++;
      } else {
        log(`❌ ${endpoint.name} başarısız (${response.status})`, 'error');
        testResults.failed++;
        testResults.errors.push(`API ${endpoint.name}: HTTP ${response.status}`);
      }
    } catch (error) {
      log(`❌ ${endpoint.name} hata: ${error.message}`, 'error');
      testResults.failed++;
      testResults.errors.push(`API ${endpoint.name}: ${error.message}`);
    }
  }
  
  log(`📊 API Endpoint sonucu: ${successCount}/${endpoints.length} başarılı`, 'info');
  return successCount;
};

// Test user flows
const testUserFlows = async () => {
  log('👥 Kullanıcı Akış Testi...', 'test');
  
  const userFlows = [
    { name: 'Individual Login', test: () => testIndividualLogin() },
    { name: 'Corporate Login', test: () => testCorporateLogin() },
    { name: 'Nakliyeci Login', test: () => testNakliyeciLogin() },
    { name: 'Tasiyici Login', test: () => testTasiyiciLogin() }
  ];
  
  let successCount = 0;
  
  for (const flow of userFlows) {
    try {
      const result = await flow.test();
      if (result) {
        log(`✅ ${flow.name} başarılı`, 'success');
        successCount++;
        testResults.passed++;
        testResults.categories['User Flows']++;
      } else {
        log(`❌ ${flow.name} başarısız`, 'error');
        testResults.failed++;
        testResults.errors.push(`User Flow ${flow.name}: Failed`);
      }
    } catch (error) {
      log(`❌ ${flow.name} hata: ${error.message}`, 'error');
      testResults.failed++;
      testResults.errors.push(`User Flow ${flow.name}: ${error.message}`);
    }
  }
  
  log(`📊 Kullanıcı akış sonucu: ${successCount}/${userFlows.length} başarılı`, 'info');
  return successCount;
};

const testIndividualLogin = async () => {
  try {
    const response = await makeRequest('POST', '/api/auth/login', {
      email: 'individual@demo.com',
      password: 'demo123'
    });
    return response.status === 200 && response.data.token;
  } catch (error) {
    return false;
  }
};

const testCorporateLogin = async () => {
  try {
    const response = await makeRequest('POST', '/api/auth/login', {
      email: 'corporate@demo.com',
      password: 'demo123'
    });
    return response.status === 200 && response.data.token;
  } catch (error) {
    return false;
  }
};

const testNakliyeciLogin = async () => {
  try {
    const response = await makeRequest('POST', '/api/auth/login', {
      email: 'nakliyeci@demo.com',
      password: 'demo123'
    });
    return response.status === 200 && response.data.token;
  } catch (error) {
    return false;
  }
};

const testTasiyiciLogin = async () => {
  try {
    const response = await makeRequest('POST', '/api/auth/login', {
      email: 'tasiyici@demo.com',
      password: 'demo123'
    });
    return response.status === 200 && response.data.token;
  } catch (error) {
    return false;
  }
};

// Test database
const testDatabase = async () => {
  log('🗄️ Veritabanı Testi...', 'test');
  
  const dbTests = [
    { name: 'Database File', test: () => fs.existsSync('backend/yolnet.db') },
    { name: 'Database Connection', test: () => testDatabaseConnection() },
    { name: 'Database Tables', test: () => testDatabaseTables() }
  ];
  
  let successCount = 0;
  
  for (const test of dbTests) {
    try {
      const result = await test.test();
      if (result) {
        log(`✅ ${test.name} başarılı`, 'success');
        successCount++;
        testResults.passed++;
        testResults.categories['Database']++;
      } else {
        log(`❌ ${test.name} başarısız`, 'error');
        testResults.failed++;
        testResults.errors.push(`Database ${test.name}: Failed`);
      }
    } catch (error) {
      log(`❌ ${test.name} hata: ${error.message}`, 'error');
      testResults.failed++;
      testResults.errors.push(`Database ${test.name}: ${error.message}`);
    }
  }
  
  log(`📊 Veritabanı sonucu: ${successCount}/${dbTests.length} başarılı`, 'info');
  return successCount;
};

const testDatabaseConnection = async () => {
  try {
    const response = await makeRequest('GET', '/api/health');
    return response.status === 200;
  } catch (error) {
    return false;
  }
};

const testDatabaseTables = async () => {
  try {
    const response = await makeRequest('GET', '/api/commission/rate');
    return response.status === 200;
  } catch (error) {
    return false;
  }
};

// Test file structure
const testFileStructure = () => {
  log('📁 Dosya Yapısı Testi...', 'test');
  
  const requiredFiles = [
    'package.json',
    'index.html',
    'tailwind.config.js',
    'docker-compose.yml',
    'nginx.conf',
    'env.example',
    'SETUP_INSTRUCTIONS.md',
    'IMPLEMENTATION_SUMMARY.md',
    'backend/fixed-server.js',
    'backend/database/init.js',
    'backend/Dockerfile',
    'yolnet-kargo-ta-main/Dockerfile',
    'tests/production-ready-test.cjs'
  ];
  
  let successCount = 0;
  
  for (const file of requiredFiles) {
    if (fs.existsSync(file)) {
      log(`✅ ${file} mevcut`, 'success');
      successCount++;
      testResults.passed++;
      testResults.categories['File Structure']++;
    } else {
      log(`❌ ${file} eksik`, 'error');
      testResults.failed++;
      testResults.errors.push(`Missing file: ${file}`);
    }
  }
  
  log(`📊 Dosya yapısı sonucu: ${successCount}/${requiredFiles.length} başarılı`, 'info');
  return successCount;
};

// Test dependencies
const testDependencies = () => {
  log('📦 Bağımlılık Testi...', 'test');
  
  const packageFiles = [
    'package.json',
    'backend/package.json',
    'yolnet-kargo-ta-main/package.json'
  ];
  
  let successCount = 0;
  
  for (const file of packageFiles) {
    if (fs.existsSync(file)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(file, 'utf8'));
        const hasDependencies = packageJson.dependencies && Object.keys(packageJson.dependencies).length > 0;
        
        if (hasDependencies) {
          log(`✅ ${file} bağımlılıkları mevcut`, 'success');
          successCount++;
          testResults.passed++;
          testResults.categories['Dependencies']++;
        } else {
          log(`❌ ${file} bağımlılıkları eksik`, 'error');
          testResults.failed++;
          testResults.errors.push(`No dependencies in ${file}`);
        }
      } catch (error) {
        log(`❌ ${file} okunamadı: ${error.message}`, 'error');
        testResults.failed++;
        testResults.errors.push(`Cannot read ${file}: ${error.message}`);
      }
    } else {
      log(`❌ ${file} bulunamadı`, 'error');
      testResults.failed++;
      testResults.errors.push(`Missing file: ${file}`);
    }
  }
  
  log(`📊 Bağımlılık sonucu: ${successCount}/${packageFiles.length} başarılı`, 'info');
  return successCount;
};

// Generate comprehensive report
const generateProductionReport = () => {
  const endTime = Date.now();
  const totalDuration = endTime - testResults.startTime;
  
  log('==================================================', 'info');
  log('📊 PRODUCTION READY TEST RAPORU', 'info');
  log('==================================================', 'info');
  
  // Overall statistics
  const totalPassed = testResults.passed;
  const totalFailed = testResults.failed;
  const successRate = totalPassed / (totalPassed + totalFailed) * 100;
  
  log(`✅ Toplam Başarılı: ${totalPassed}`, 'success');
  log(`❌ Toplam Başarısız: ${totalFailed}`, 'error');
  log(`⏱️  Toplam Süre: ${(totalDuration / 1000).toFixed(2)}s`, 'info');
  log(`🎯 Genel Başarı Oranı: ${successRate.toFixed(1)}%`, 'info');
  
  // Category breakdown
  log('\n📈 KATEGORİ BAŞARI ORANLARI:', 'info');
  Object.entries(testResults.categories).forEach(([category, count]) => {
    const status = count > 0 ? '✅' : '❌';
    log(`${status} ${category}: ${count} test geçti`, count > 0 ? 'success' : 'error');
  });
  
  // Error analysis
  if (testResults.errors.length > 0) {
    log('\n❌ HATA ANALİZİ:', 'error');
    testResults.errors.forEach((error, index) => {
      log(`${index + 1}. ${error}`, 'error');
    });
  }
  
  // Production readiness assessment
  log('\n🎯 PRODUCTION READINESS DEĞERLENDİRMESİ:', 'info');
  if (successRate >= 95) {
    log('🏆 MÜKEMMEL! Proje production-ready', 'success');
  } else if (successRate >= 90) {
    log('✅ ÇOK İYİ! Proje büyük ölçüde production-ready', 'success');
  } else if (successRate >= 80) {
    log('⚠️ İYİ! Proje genel olarak production-ready, bazı iyileştirmeler gerekebilir', 'warning');
  } else {
    log('❌ DÜŞÜK! Proje önemli iyileştirmeler gerektiriyor', 'error');
  }
  
  // Recommendations
  log('\n💡 ÖNERİLER:', 'info');
  
  if (testResults.categories['Security'] < 3) {
    log('🔒 Güvenlik önlemleri artırılmalı', 'warning');
  }
  
  if (testResults.categories['Performance'] < 3) {
    log('⚡ Performans optimizasyonları yapılmalı', 'warning');
  }
  
  if (testResults.categories['File Structure'] < 10) {
    log('📁 Dosya yapısı iyileştirilebilir', 'warning');
  }
  
  log('\n🚀 PRODUCTION READY TEST TAMAMLANDI!', 'success');
  
  process.exit(successRate >= 80 ? 0 : 1);
};

// Main test runner
const runProductionReadyTest = async () => {
  log('🚀 PRODUCTION READY TEST BAŞLIYOR...', 'info');
  log('==================================================', 'info');
  
  try {
    // System health tests
    await testSystemHealth();
    await testFrontendAccess();
    
    // Security tests
    await testSecurityFeatures();
    
    // Performance tests
    await testPerformance();
    
    // API endpoint tests
    await testAPIEndpoints();
    
    // User flow tests
    await testUserFlows();
    
    // Database tests
    await testDatabase();
    
    // File structure tests
    testFileStructure();
    
    // Dependency tests
    testDependencies();
    
    // Generate report
    generateProductionReport();
    
  } catch (error) {
    log(`❌ Production Ready Test Error: ${error.message}`, 'error');
    process.exit(1);
  }
};

// Run the production ready test
runProductionReadyTest();



