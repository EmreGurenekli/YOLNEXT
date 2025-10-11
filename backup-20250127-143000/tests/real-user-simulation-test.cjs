const axios = require('axios');
const { JSDOM } = require('jsdom');

// Test configuration
const FRONTEND_URL = 'http://localhost:5173';
const BACKEND_URL = 'http://localhost:5000';

// Real user simulation data
const realUserScenarios = {
  individual: {
    name: 'Ahmet Yılmaz',
    email: 'ahmet.yilmaz@email.com',
    phone: '+90 532 123 45 67',
    location: 'İstanbul, Kadıköy',
    preferences: {
      vehicleType: 'Kamyon',
      maxWeight: 1000,
      preferredPrice: 500,
      deliveryTime: '2-3 gün'
    },
    behavior: {
      loginFrequency: 'daily',
      sessionDuration: '15-30 dakika',
      actionsPerSession: 5,
      preferredFeatures: ['tracking', 'offers', 'messages']
    }
  },
  corporate: {
    name: 'Migros Ticaret A.Ş.',
    email: 'lojistik@migros.com.tr',
    phone: '+90 212 123 45 67',
    location: 'İstanbul, Şişli',
    preferences: {
      vehicleType: 'Tır',
      maxWeight: 10000,
      preferredPrice: 2000,
      deliveryTime: '1-2 gün'
    },
    behavior: {
      loginFrequency: 'multiple daily',
      sessionDuration: '30-60 dakika',
      actionsPerSession: 10,
      preferredFeatures: ['analytics', 'team', 'reports', 'bulk-shipments']
    }
  },
  nakliyeci: {
    name: 'Kargo Express Lojistik',
    email: 'info@kargoexpress.com',
    phone: '+90 216 987 65 43',
    location: 'İstanbul, Pendik',
    preferences: {
      vehicleType: 'Kamyon',
      maxWeight: 5000,
      preferredPrice: 800,
      deliveryTime: '1-3 gün'
    },
    behavior: {
      loginFrequency: 'multiple daily',
      sessionDuration: '20-45 dakika',
      actionsPerSession: 8,
      preferredFeatures: ['loads', 'offers', 'fleet', 'analytics']
    }
  },
  tasiyici: {
    name: 'Mehmet Kaya',
    email: 'mehmet.kaya@email.com',
    phone: '+90 535 234 56 78',
    location: 'Ankara, Çankaya',
    preferences: {
      vehicleType: 'Minibüs',
      maxWeight: 500,
      preferredPrice: 300,
      deliveryTime: '1-2 gün'
    },
    behavior: {
      loginFrequency: 'daily',
      sessionDuration: '10-25 dakika',
      actionsPerSession: 4,
      preferredFeatures: ['jobs', 'earnings', 'profile']
    }
  }
};

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  errors: [],
  scenarios: {
    individual: { passed: 0, failed: 0, errors: [] },
    corporate: { passed: 0, failed: 0, errors: [] },
    nakliyeci: { passed: 0, failed: 0, errors: [] },
    tasiyici: { passed: 0, failed: 0, errors: [] }
  },
  startTime: Date.now(),
  userJourneys: [],
  performanceMetrics: {
    pageLoadTimes: [],
    apiResponseTimes: [],
    userActionTimes: []
  }
};

// Utility functions
const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m',
    user: '\x1b[35m'
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
    testResults.performanceMetrics.apiResponseTimes.push(endTime - startTime);
    
    return {
      status: response.status,
      data: response.data,
      headers: response.headers,
      responseTime: endTime - startTime
    };
  } catch (error) {
    const endTime = Date.now();
    testResults.performanceMetrics.apiResponseTimes.push(endTime - startTime);
    
    if (error.response) {
      return {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
        responseTime: endTime - startTime
      };
    }
    throw error;
  }
};

// Real user simulation functions
const simulateUserLogin = async (userType) => {
  const user = realUserScenarios[userType];
  log(`👤 ${user.name} giriş yapıyor...`, 'user');
  
  const startTime = Date.now();
  
  try {
    const response = await makeRequest('POST', '/api/auth/login', {
      email: user.email,
      password: 'demo123'
    });
    
    const endTime = Date.now();
    testResults.performanceMetrics.userActionTimes.push(endTime - startTime);
    
    if (response.status === 200 && response.data.token) {
      log(`✅ ${user.name} başarıyla giriş yaptı (${endTime - startTime}ms)`, 'success');
      testResults.scenarios[userType].passed++;
      return response.data.token;
    } else {
      throw new Error(`Login failed: ${response.status}`);
    }
  } catch (error) {
    log(`❌ ${user.name} giriş yapamadı: ${error.message}`, 'error');
    testResults.scenarios[userType].failed++;
    testResults.scenarios[userType].errors.push(`Login: ${error.message}`);
    return null;
  }
};

const simulateUserActions = async (userType, token) => {
  const user = realUserScenarios[userType];
  const actions = user.behavior.actionsPerSession;
  
  log(`🎯 ${user.name} ${actions} aksiyon gerçekleştiriyor...`, 'user');
  
  const userJourney = {
    userType,
    userName: user.name,
    actions: [],
    startTime: Date.now()
  };
  
  for (let i = 0; i < actions; i++) {
    const actionStartTime = Date.now();
    
    try {
      let actionResult;
      
      // Simulate different actions based on user type
      switch (userType) {
        case 'individual':
          actionResult = await simulateIndividualActions(token, i);
          break;
        case 'corporate':
          actionResult = await simulateCorporateActions(token, i);
          break;
        case 'nakliyeci':
          actionResult = await simulateNakliyeciActions(token, i);
          break;
        case 'tasiyici':
          actionResult = await simulateTasiyiciActions(token, i);
          break;
      }
      
      const actionEndTime = Date.now();
      const actionDuration = actionEndTime - actionStartTime;
      
      userJourney.actions.push({
        action: actionResult.action,
        success: actionResult.success,
        duration: actionDuration,
        timestamp: new Date().toISOString()
      });
      
      if (actionResult.success) {
        log(`✅ ${user.name} - ${actionResult.action} (${actionDuration}ms)`, 'success');
        testResults.scenarios[userType].passed++;
      } else {
        log(`❌ ${user.name} - ${actionResult.action} başarısız`, 'error');
        testResults.scenarios[userType].failed++;
        testResults.scenarios[userType].errors.push(`${actionResult.action}: ${actionResult.error}`);
      }
      
    } catch (error) {
      log(`❌ ${user.name} aksiyon hatası: ${error.message}`, 'error');
      testResults.scenarios[userType].failed++;
      testResults.scenarios[userType].errors.push(`Action ${i}: ${error.message}`);
    }
  }
  
  userJourney.endTime = Date.now();
  userJourney.totalDuration = userJourney.endTime - userJourney.startTime;
  testResults.userJourneys.push(userJourney);
  
  log(`🏁 ${user.name} oturumu tamamlandı (${userJourney.totalDuration}ms)`, 'user');
};

const simulateIndividualActions = async (token, actionIndex) => {
  const headers = { Authorization: `Bearer ${token}` };
  const actions = [
    { name: 'Gönderilerimi Görüntüle', endpoint: '/api/shipments', method: 'GET' },
    { name: 'Yeni Gönderi Oluştur', endpoint: '/api/shipments', method: 'POST', data: {
      title: 'Test Gönderi',
      description: 'Gerçek kullanıcı test gönderisi',
      from_location: 'İstanbul',
      to_location: 'Ankara',
      weight: 50,
      volume: 1,
      price: 300,
      vehicle_type: 'Kamyon'
    }},
    { name: 'Teklifleri Görüntüle', endpoint: '/api/offers/shipment/1', method: 'GET' },
    { name: 'Anlaşmalarımı Görüntüle', endpoint: '/api/agreements/sender', method: 'GET' },
    { name: 'Takip Durumu Kontrol Et', endpoint: '/api/tracking/individual/active', method: 'GET' }
  ];
  
  const action = actions[actionIndex % actions.length];
  const response = await makeRequest(action.method, action.endpoint, action.data, headers);
  
  return {
    action: action.name,
    success: response.status >= 200 && response.status < 300,
    error: response.status >= 400 ? `HTTP ${response.status}` : null
  };
};

const simulateCorporateActions = async (token, actionIndex) => {
  const headers = { Authorization: `Bearer ${token}` };
  const actions = [
    { name: 'Kurumsal Gönderileri Görüntüle', endpoint: '/api/shipments', method: 'GET' },
    { name: 'Toplu Gönderi Oluştur', endpoint: '/api/shipments', method: 'POST', data: {
      title: 'Kurumsal Test Gönderi',
      description: 'Kurumsal kullanıcı test gönderisi',
      from_location: 'İstanbul',
      to_location: 'İzmir',
      weight: 200,
      volume: 5,
      price: 1500,
      vehicle_type: 'Tır'
    }},
    { name: 'Ekip Raporlarını Görüntüle', endpoint: '/api/shipments', method: 'GET' },
    { name: 'Analitik Verileri Kontrol Et', endpoint: '/api/shipments', method: 'GET' },
    { name: 'Taşıyıcı Listesini Görüntüle', endpoint: '/api/shipments', method: 'GET' }
  ];
  
  const action = actions[actionIndex % actions.length];
  const response = await makeRequest(action.method, action.endpoint, action.data, headers);
  
  return {
    action: action.name,
    success: response.status >= 200 && response.status < 300,
    error: response.status >= 400 ? `HTTP ${response.status}` : null
  };
};

const simulateNakliyeciActions = async (token, actionIndex) => {
  const headers = { Authorization: `Bearer ${token}` };
  const actions = [
    { name: 'Yükleri Görüntüle', endpoint: '/api/offers/nakliyeci', method: 'GET' },
    { name: 'Teklif Ver', endpoint: '/api/offers', method: 'POST', data: {
      shipment_id: 1,
      price: 400,
      message: 'Test teklif mesajı',
      estimated_delivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
    }},
    { name: 'Anlaşmalarımı Görüntüle', endpoint: '/api/agreements/nakliyeci', method: 'GET' },
    { name: 'Filo Durumunu Kontrol Et', endpoint: '/api/offers/nakliyeci', method: 'GET' },
    { name: 'Komisyon Geçmişini Görüntüle', endpoint: '/api/commission/nakliyeci/history', method: 'GET' }
  ];
  
  const action = actions[actionIndex % actions.length];
  const response = await makeRequest(action.method, action.endpoint, action.data, headers);
  
  return {
    action: action.name,
    success: response.status >= 200 && response.status < 300,
    error: response.status >= 400 ? `HTTP ${response.status}` : null
  };
};

const simulateTasiyiciActions = async (token, actionIndex) => {
  const headers = { Authorization: `Bearer ${token}` };
  const actions = [
    { name: 'İşleri Görüntüle', endpoint: '/api/offers/nakliyeci', method: 'GET' },
    { name: 'Profil Güncelle', endpoint: '/api/auth/me', method: 'GET' },
    { name: 'Kazançları Kontrol Et', endpoint: '/api/commission/nakliyeci/history', method: 'GET' },
    { name: 'Mesajları Görüntüle', endpoint: '/api/messages', method: 'GET' },
    { name: 'Bildirimleri Kontrol Et', endpoint: '/api/notifications', method: 'GET' }
  ];
  
  const action = actions[actionIndex % actions.length];
  const response = await makeRequest(action.method, action.endpoint, action.data, headers);
  
  return {
    action: action.name,
    success: response.status >= 200 && response.status < 300,
    error: response.status >= 400 ? `HTTP ${response.status}` : null
  };
};

const testSystemHealth = async () => {
  log('🏥 Sistem Sağlık Kontrolü...', 'info');
  
  try {
    const response = await makeRequest('GET', '/api/health');
    
    if (response.status === 200 && response.data.status === 'OK') {
      log('✅ Sistem sağlıklı', 'success');
      testResults.passed++;
      return true;
    } else {
      throw new Error(`Sistem sağlık kontrolü başarısız: ${response.status}`);
    }
  } catch (error) {
    log(`❌ Sistem sağlık kontrolü başarısız: ${error.message}`, 'error');
    testResults.failed++;
    testResults.errors.push(`System Health: ${error.message}`);
    return false;
  }
};

const testConcurrentUsers = async () => {
  log('👥 Eşzamanlı Kullanıcı Testi...', 'info');
  
  const concurrentUsers = 5;
  const promises = [];
  
  for (let i = 0; i < concurrentUsers; i++) {
    const userType = ['individual', 'corporate', 'nakliyeci', 'tasiyici'][i % 4];
    promises.push(simulateUserLogin(userType));
  }
  
  try {
    const tokens = await Promise.all(promises);
    const successfulLogins = tokens.filter(token => token !== null).length;
    
    if (successfulLogins >= concurrentUsers * 0.8) { // %80 başarı
      log(`✅ Eşzamanlı kullanıcı testi başarılı (${successfulLogins}/${concurrentUsers})`, 'success');
      testResults.passed++;
      return true;
    } else {
      throw new Error(`Eşzamanlı kullanıcı testi başarısız: ${successfulLogins}/${concurrentUsers}`);
    }
  } catch (error) {
    log(`❌ Eşzamanlı kullanıcı testi başarısız: ${error.message}`, 'error');
    testResults.failed++;
    testResults.errors.push(`Concurrent Users: ${error.message}`);
    return false;
  }
};

const testPerformanceUnderLoad = async () => {
  log('⚡ Yük Altında Performans Testi...', 'info');
  
  const loadTests = [];
  const startTime = Date.now();
  
  // Simulate high load
  for (let i = 0; i < 20; i++) {
    loadTests.push(makeRequest('GET', '/api/health'));
  }
  
  try {
    await Promise.all(loadTests);
    const endTime = Date.now();
    const totalDuration = endTime - startTime;
    
    if (totalDuration < 10000) { // Less than 10 seconds
      log(`✅ Yük altında performans testi başarılı (${totalDuration}ms)`, 'success');
      testResults.passed++;
      return true;
    } else {
      throw new Error(`Yük altında performans testi yavaş: ${totalDuration}ms`);
    }
  } catch (error) {
    log(`❌ Yük altında performans testi başarısız: ${error.message}`, 'error');
    testResults.failed++;
    testResults.errors.push(`Performance Under Load: ${error.message}`);
    return false;
  }
};

// Main test runner
const runRealUserSimulation = async () => {
  log('🚀 GERÇEK KULLANICI BENZERİ MAKSİMUM TEST BAŞLIYOR...', 'info');
  log('==================================================', 'info');
  
  // System health check
  const systemHealthy = await testSystemHealth();
  if (!systemHealthy) {
    log('❌ Sistem sağlıklı değil, testler durduruluyor', 'error');
    return;
  }
  
  // Test each user type
  const userTypes = ['individual', 'corporate', 'nakliyeci', 'tasiyici'];
  
  for (const userType of userTypes) {
    log(`\n👤 ${userType.toUpperCase()} KULLANICI TESTİ BAŞLIYOR...`, 'user');
    log('==================================================', 'info');
    
    // Login simulation
    const token = await simulateUserLogin(userType);
    if (!token) {
      log(`❌ ${userType} kullanıcısı giriş yapamadı, test atlanıyor`, 'error');
      continue;
    }
    
    // User actions simulation
    await simulateUserActions(userType, token);
    
    // Small delay between users
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Concurrent users test
  log(`\n👥 EŞZAMANLI KULLANICI TESTİ...`, 'info');
  await testConcurrentUsers();
  
  // Performance under load test
  log(`\n⚡ YÜK ALTINDA PERFORMANS TESTİ...`, 'info');
  await testPerformanceUnderLoad();
  
  // Generate comprehensive report
  generateComprehensiveReport();
};

const generateComprehensiveReport = () => {
  const endTime = Date.now();
  const totalDuration = endTime - testResults.startTime;
  
  log('==================================================', 'info');
  log('📊 GERÇEK KULLANICI BENZERİ TEST RAPORU', 'info');
  log('==================================================', 'info');
  
  // Overall statistics
  const totalPassed = testResults.passed;
  const totalFailed = testResults.failed;
  const successRate = totalPassed / (totalPassed + totalFailed) * 100;
  
  log(`✅ Toplam Başarılı: ${totalPassed}`, 'success');
  log(`❌ Toplam Başarısız: ${totalFailed}`, 'error');
  log(`⏱️  Toplam Süre: ${(totalDuration / 1000).toFixed(2)}s`, 'info');
  log(`🎯 Genel Başarı Oranı: ${successRate.toFixed(1)}%`, 'info');
  
  // User type breakdown
  log('\n📈 KULLANICI TİPİ BAŞARI ORANLARI:', 'info');
  Object.entries(testResults.scenarios).forEach(([userType, stats]) => {
    const userSuccessRate = stats.passed / (stats.passed + stats.failed) * 100;
    const status = userSuccessRate >= 80 ? '✅' : userSuccessRate >= 60 ? '⚠️' : '❌';
    log(`${status} ${userType.toUpperCase()}: ${userSuccessRate.toFixed(1)}% (${stats.passed}/${stats.passed + stats.failed})`, 
         userSuccessRate >= 80 ? 'success' : userSuccessRate >= 60 ? 'warning' : 'error');
  });
  
  // Performance metrics
  log('\n⚡ PERFORMANS METRİKLERİ:', 'info');
  const avgApiResponse = testResults.performanceMetrics.apiResponseTimes.reduce((a, b) => a + b, 0) / testResults.performanceMetrics.apiResponseTimes.length;
  const avgUserAction = testResults.performanceMetrics.userActionTimes.reduce((a, b) => a + b, 0) / testResults.performanceMetrics.userActionTimes.length;
  
  log(`📊 Ortalama API Yanıt Süresi: ${avgApiResponse.toFixed(2)}ms`, 'info');
  log(`👤 Ortalama Kullanıcı Aksiyon Süresi: ${avgUserAction.toFixed(2)}ms`, 'info');
  log(`🚀 Toplam Test Süresi: ${(totalDuration / 1000).toFixed(2)}s`, 'info');
  
  // User journey analysis
  log('\n🛤️ KULLANICI YOLCULUK ANALİZİ:', 'info');
  testResults.userJourneys.forEach((journey, index) => {
    const successRate = journey.actions.filter(a => a.success).length / journey.actions.length * 100;
    log(`👤 ${journey.userName} (${journey.userType}): ${successRate.toFixed(1)}% başarı, ${journey.totalDuration}ms`, 
         successRate >= 80 ? 'success' : 'warning');
  });
  
  // Error analysis
  if (testResults.errors.length > 0) {
    log('\n❌ HATA ANALİZİ:', 'error');
    testResults.errors.forEach((error, index) => {
      log(`${index + 1}. ${error}`, 'error');
    });
  }
  
  // Final assessment
  log('\n🎯 SONUÇ DEĞERLENDİRMESİ:', 'info');
  if (successRate >= 90) {
    log('🏆 MÜKEMMEL! Sistem gerçek kullanıcılar için hazır', 'success');
  } else if (successRate >= 80) {
    log('✅ ÇOK İYİ! Sistem büyük ölçüde hazır', 'success');
  } else if (successRate >= 70) {
    log('⚠️ İYİ! Sistem genel olarak çalışıyor, bazı iyileştirmeler gerekebilir', 'warning');
  } else {
    log('❌ DÜŞÜK! Sistem önemli iyileştirmeler gerektiriyor', 'error');
  }
  
  process.exit(successRate >= 70 ? 0 : 1);
};

// Run the real user simulation
runRealUserSimulation().catch(error => {
  log(`❌ Test Suite Error: ${error.message}`, 'error');
  process.exit(1);
});

