const axios = require('axios');
const { JSDOM } = require('jsdom');

// Live User Test Suite - Gerçek kullanıcı benzeri canlı test
const FRONTEND_URL = 'http://localhost:5173';
const BACKEND_URL = 'http://localhost:5000';

const liveTestResults = {
  passed: 0,
  failed: 0,
  errors: [],
  startTime: Date.now(),
  userScenarios: {
    individual: { name: 'Ahmet Yılmaz', email: 'individual@demo.com', actions: [] },
    corporate: { name: 'Migros Ticaret A.Ş.', email: 'corporate@demo.com', actions: [] },
    nakliyeci: { name: 'Kargo Express Lojistik', email: 'nakliyeci@demo.com', actions: [] },
    tasiyici: { name: 'Mehmet Kaya', email: 'tasiyici@demo.com', actions: [] }
  },
  performance: {
    responseTimes: [],
    pageLoadTimes: [],
    apiCalls: []
  }
};

const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m',
    user: '\x1b[35m',
    live: '\x1b[34m'
  };
  console.log(`${colors[type]}[${timestamp}] ${message}\x1b[0m`);
};

const makeRequest = async (method, url, data = null, headers = {}) => {
  const startTime = Date.now();
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
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    liveTestResults.performance.responseTimes.push(responseTime);
    liveTestResults.performance.apiCalls.push({
      method,
      url,
      status: response.status,
      responseTime,
      timestamp: new Date().toISOString()
    });
    
    return {
      status: response.status,
      data: response.data,
      headers: response.headers,
      responseTime
    };
  } catch (error) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    liveTestResults.performance.responseTimes.push(responseTime);
    liveTestResults.performance.apiCalls.push({
      method,
      url,
      status: error.response?.status || 500,
      responseTime,
      error: error.message,
      timestamp: new Date().toISOString()
    });
    
    if (error.response) {
      return {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
        responseTime
      };
    }
    throw error;
  }
};

// Test system health
const testSystemHealth = async () => {
  log('🏥 Sistem Sağlık Kontrolü...', 'live');
  
  try {
    const response = await makeRequest('GET', '/api/health');
    
    if (response.status === 200 && response.data.status === 'OK') {
      log('✅ Backend sağlıklı', 'success');
      liveTestResults.passed++;
      return true;
    } else {
      throw new Error(`Backend health check failed: ${response.status}`);
    }
  } catch (error) {
    log(`❌ Backend sağlık kontrolü başarısız: ${error.message}`, 'error');
    liveTestResults.failed++;
    liveTestResults.errors.push(`System Health: ${error.message}`);
    return false;
  }
};

// Test frontend access
const testFrontendAccess = async () => {
  log('🌐 Frontend Erişim Testi...', 'live');
  
  try {
    const startTime = Date.now();
    const response = await axios.get(FRONTEND_URL);
    const endTime = Date.now();
    const loadTime = endTime - startTime;
    
    liveTestResults.performance.pageLoadTimes.push(loadTime);
    
    if (response.status === 200) {
      log(`✅ Frontend erişilebilir (${loadTime}ms)`, 'success');
      liveTestResults.passed++;
      return true;
    } else {
      throw new Error(`Frontend returned status ${response.status}`);
    }
  } catch (error) {
    log(`❌ Frontend erişim başarısız: ${error.message}`, 'error');
    liveTestResults.failed++;
    liveTestResults.errors.push(`Frontend Access: ${error.message}`);
    return false;
  }
};

// Simulate real user login
const simulateUserLogin = async (userType) => {
  const user = liveTestResults.userScenarios[userType];
  log(`👤 ${user.name} giriş yapıyor...`, 'user');
  
  try {
    const response = await makeRequest('POST', '/api/auth/login', {
      email: user.email,
      password: 'demo123'
    });
    
    if (response.status === 200 && response.data.token) {
      log(`✅ ${user.name} başarıyla giriş yaptı`, 'success');
      liveTestResults.passed++;
      return response.data.token;
    } else {
      throw new Error(`Login failed: ${response.status}`);
    }
  } catch (error) {
    log(`❌ ${user.name} giriş yapamadı: ${error.message}`, 'error');
    liveTestResults.failed++;
    liveTestResults.errors.push(`${user.name} Login: ${error.message}`);
    return null;
  }
};

// Simulate user actions
const simulateUserActions = async (userType, token) => {
  const user = liveTestResults.userScenarios[userType];
  const headers = { Authorization: `Bearer ${token}` };
  
  log(`🎯 ${user.name} kullanıcı aksiyonları gerçekleştiriyor...`, 'user');
  
  const actions = [
    { name: 'Dashboard Görüntüle', endpoint: '/api/shipments', method: 'GET' },
    { name: 'Yeni Gönderi Oluştur', endpoint: '/api/shipments', method: 'POST', data: {
      title: `${user.name} Test Gönderi`,
      description: 'Canlı test gönderisi',
      from_location: 'İstanbul',
      to_location: 'Ankara',
      weight: 50,
      volume: 1,
      price: 500,
      vehicle_type: 'Kamyon'
    }},
    { name: 'Teklifleri Görüntüle', endpoint: '/api/offers/nakliyeci', method: 'GET' },
    { name: 'Anlaşmaları Görüntüle', endpoint: '/api/agreements/sender', method: 'GET' },
    { name: 'Komisyon Hesapla', endpoint: '/api/commission/calculate', method: 'POST', data: {
      agreedPrice: 1000
    }}
  ];
  
  let successCount = 0;
  
  for (const action of actions) {
    try {
      const response = await makeRequest(action.method, action.endpoint, action.data, headers);
      
      if (response.status >= 200 && response.status < 300) {
        log(`✅ ${user.name} - ${action.name} başarılı`, 'success');
        successCount++;
        liveTestResults.passed++;
        user.actions.push({
          action: action.name,
          success: true,
          responseTime: response.responseTime,
          timestamp: new Date().toISOString()
        });
      } else {
        log(`❌ ${user.name} - ${action.name} başarısız (${response.status})`, 'error');
        liveTestResults.failed++;
        liveTestResults.errors.push(`${user.name} - ${action.name}: HTTP ${response.status}`);
        user.actions.push({
          action: action.name,
          success: false,
          error: `HTTP ${response.status}`,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      log(`❌ ${user.name} - ${action.name} hata: ${error.message}`, 'error');
      liveTestResults.failed++;
      liveTestResults.errors.push(`${user.name} - ${action.name}: ${error.message}`);
      user.actions.push({
        action: action.name,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  log(`📊 ${user.name} aksiyon sonucu: ${successCount}/${actions.length} başarılı`, 'info');
  return successCount;
};

// Test concurrent users
const testConcurrentUsers = async () => {
  log('👥 Eşzamanlı Kullanıcı Testi...', 'live');
  
  const userTypes = ['individual', 'corporate', 'nakliyeci', 'tasiyici'];
  const promises = [];
  
  for (const userType of userTypes) {
    promises.push(simulateUserLogin(userType));
  }
  
  try {
    const tokens = await Promise.all(promises);
    const successfulLogins = tokens.filter(token => token !== null).length;
    
    if (successfulLogins >= userTypes.length * 0.75) { // %75 başarı
      log(`✅ Eşzamanlı kullanıcı testi başarılı (${successfulLogins}/${userTypes.length})`, 'success');
      liveTestResults.passed++;
      return tokens;
    } else {
      throw new Error(`Eşzamanlı kullanıcı testi başarısız: ${successfulLogins}/${userTypes.length}`);
    }
  } catch (error) {
    log(`❌ Eşzamanlı kullanıcı testi başarısız: ${error.message}`, 'error');
    liveTestResults.failed++;
    liveTestResults.errors.push(`Concurrent Users: ${error.message}`);
    return [];
  }
};

// Test API endpoints
const testAPIEndpoints = async () => {
  log('🔌 API Endpoint Testi...', 'live');
  
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
        liveTestResults.passed++;
      } else {
        log(`❌ ${endpoint.name} başarısız (${response.status})`, 'error');
        liveTestResults.failed++;
        liveTestResults.errors.push(`${endpoint.name}: HTTP ${response.status}`);
      }
    } catch (error) {
      log(`❌ ${endpoint.name} hata: ${error.message}`, 'error');
      liveTestResults.failed++;
      liveTestResults.errors.push(`${endpoint.name}: ${error.message}`);
    }
  }
  
  log(`📊 API Endpoint sonucu: ${successCount}/${endpoints.length} başarılı`, 'info');
  return successCount;
};

// Test performance under load
const testPerformanceUnderLoad = async () => {
  log('⚡ Yük Altında Performans Testi...', 'live');
  
  const loadTests = [];
  const startTime = Date.now();
  
  // Simulate 20 concurrent requests
  for (let i = 0; i < 20; i++) {
    loadTests.push(makeRequest('GET', '/api/health'));
  }
  
  try {
    await Promise.all(loadTests);
    const endTime = Date.now();
    const totalDuration = endTime - startTime;
    
    if (totalDuration < 10000) { // Less than 10 seconds
      log(`✅ Yük altında performans testi başarılı (${totalDuration}ms)`, 'success');
      liveTestResults.passed++;
      return true;
    } else {
      throw new Error(`Yük altında performans testi yavaş: ${totalDuration}ms`);
    }
  } catch (error) {
    log(`❌ Yük altında performans testi başarısız: ${error.message}`, 'error');
    liveTestResults.failed++;
    liveTestResults.errors.push(`Performance Under Load: ${error.message}`);
    return false;
  }
};

// Test error handling
const testErrorHandling = async () => {
  log('🛡️ Hata Yönetimi Testi...', 'live');
  
  const errorTests = [
    { name: 'Geçersiz Endpoint', method: 'GET', path: '/api/invalid' },
    { name: 'Yetkisiz Erişim', method: 'GET', path: '/api/shipments' }, // No token
    { name: 'Geçersiz Veri', method: 'POST', path: '/api/auth/login', data: { email: 'invalid' } }
  ];
  
  let successCount = 0;
  
  for (const test of errorTests) {
    try {
      const response = await makeRequest(test.method, test.path, test.data);
      
      // These should return error status codes
      if (response.status >= 400) {
        log(`✅ ${test.name} doğru hata döndü (${response.status})`, 'success');
        successCount++;
        liveTestResults.passed++;
      } else {
        log(`❌ ${test.name} beklenen hata döndürmedi (${response.status})`, 'error');
        liveTestResults.failed++;
        liveTestResults.errors.push(`${test.name}: Expected error, got ${response.status}`);
      }
    } catch (error) {
      log(`✅ ${test.name} hata yakalandı: ${error.message}`, 'success');
      successCount++;
      liveTestResults.passed++;
    }
  }
  
  log(`📊 Hata yönetimi sonucu: ${successCount}/${errorTests.length} başarılı`, 'info');
  return successCount;
};

// Generate comprehensive report
const generateLiveReport = () => {
  const endTime = Date.now();
  const totalDuration = endTime - liveTestResults.startTime;
  
  log('==================================================', 'info');
  log('📊 CANLI KULLANICI TEST RAPORU', 'info');
  log('==================================================', 'info');
  
  // Overall statistics
  const totalPassed = liveTestResults.passed;
  const totalFailed = liveTestResults.failed;
  const successRate = totalPassed / (totalPassed + totalFailed) * 100;
  
  log(`✅ Toplam Başarılı: ${totalPassed}`, 'success');
  log(`❌ Toplam Başarısız: ${totalFailed}`, 'error');
  log(`⏱️  Toplam Süre: ${(totalDuration / 1000).toFixed(2)}s`, 'info');
  log(`🎯 Genel Başarı Oranı: ${successRate.toFixed(1)}%`, 'info');
  
  // Performance metrics
  if (liveTestResults.performance.responseTimes.length > 0) {
    const avgResponseTime = liveTestResults.performance.responseTimes.reduce((a, b) => a + b, 0) / liveTestResults.performance.responseTimes.length;
    const maxResponseTime = Math.max(...liveTestResults.performance.responseTimes);
    const minResponseTime = Math.min(...liveTestResults.performance.responseTimes);
    
    log('\n⚡ PERFORMANS METRİKLERİ:', 'info');
    log(`📊 Ortalama API Yanıt Süresi: ${avgResponseTime.toFixed(2)}ms`, 'info');
    log(`📈 En Hızlı Yanıt: ${minResponseTime}ms`, 'info');
    log(`📉 En Yavaş Yanıt: ${maxResponseTime}ms`, 'info');
  }
  
  if (liveTestResults.performance.pageLoadTimes.length > 0) {
    const avgPageLoadTime = liveTestResults.performance.pageLoadTimes.reduce((a, b) => a + b, 0) / liveTestResults.performance.pageLoadTimes.length;
    log(`🌐 Ortalama Sayfa Yükleme Süresi: ${avgPageLoadTime.toFixed(2)}ms`, 'info');
  }
  
  // User scenario results
  log('\n👥 KULLANICI SENARYO SONUÇLARI:', 'info');
  Object.entries(liveTestResults.userScenarios).forEach(([userType, user]) => {
    const successRate = user.actions.filter(a => a.success).length / user.actions.length * 100;
    const status = successRate >= 80 ? '✅' : successRate >= 60 ? '⚠️' : '❌';
    log(`${status} ${user.name} (${userType}): ${successRate.toFixed(1)}% başarı`, 
         successRate >= 80 ? 'success' : successRate >= 60 ? 'warning' : 'error');
  });
  
  // Error analysis
  if (liveTestResults.errors.length > 0) {
    log('\n❌ HATA ANALİZİ:', 'error');
    liveTestResults.errors.forEach((error, index) => {
      log(`${index + 1}. ${error}`, 'error');
    });
  }
  
  // Final assessment
  log('\n🎯 CANLI TEST DEĞERLENDİRMESİ:', 'info');
  if (successRate >= 90) {
    log('🏆 MÜKEMMEL! Sistem canlı kullanıcılar için hazır', 'success');
  } else if (successRate >= 80) {
    log('✅ ÇOK İYİ! Sistem büyük ölçüde hazır', 'success');
  } else if (successRate >= 70) {
    log('⚠️ İYİ! Sistem genel olarak çalışıyor, bazı iyileştirmeler gerekebilir', 'warning');
  } else {
    log('❌ DÜŞÜK! Sistem önemli iyileştirmeler gerektiriyor', 'error');
  }
  
  log('\n🚀 CANLI KULLANICI TEST TAMAMLANDI!', 'success');
  
  process.exit(successRate >= 70 ? 0 : 1);
};

// Main live test runner
const runLiveUserTest = async () => {
  log('🚀 CANLI KULLANICI TEST BAŞLIYOR...', 'live');
  log('==================================================', 'info');
  
  try {
    // System health check
    const systemHealthy = await testSystemHealth();
    if (!systemHealthy) {
      log('❌ Sistem sağlıklı değil, testler durduruluyor', 'error');
      return;
    }
    
    // Frontend access test
    const frontendAccess = await testFrontendAccess();
    if (!frontendAccess) {
      log('❌ Frontend erişilemiyor, testler durduruluyor', 'error');
      return;
    }
    
    // API endpoints test
    await testAPIEndpoints();
    
    // Concurrent users test
    const tokens = await testConcurrentUsers();
    
    // User actions simulation
    if (tokens.length > 0) {
      const userTypes = ['individual', 'corporate', 'nakliyeci', 'tasiyici'];
      for (let i = 0; i < Math.min(tokens.length, userTypes.length); i++) {
        if (tokens[i]) {
          await simulateUserActions(userTypes[i], tokens[i]);
        }
      }
    }
    
    // Performance under load test
    await testPerformanceUnderLoad();
    
    // Error handling test
    await testErrorHandling();
    
    // Generate report
    generateLiveReport();
    
  } catch (error) {
    log(`❌ Canlı Test Error: ${error.message}`, 'error');
    process.exit(1);
  }
};

// Run the live user test
runLiveUserTest();
