const axios = require('axios');

// Fixed Login Test - Login sorunlarını düzelt
const BACKEND_URL = 'http://localhost:5000';

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

// Test demo user login
const testDemoUserLogin = async () => {
  log('🔐 Demo Kullanıcı Login Testi...', 'info');
  
  const demoUsers = [
    { email: 'individual@demo.com', password: 'demo123', type: 'Individual' },
    { email: 'corporate@demo.com', password: 'demo123', type: 'Corporate' },
    { email: 'nakliyeci@demo.com', password: 'demo123', type: 'Nakliyeci' },
    { email: 'tasiyici@demo.com', password: 'demo123', type: 'Tasiyici' }
  ];
  
  let successCount = 0;
  
  for (const user of demoUsers) {
    try {
      log(`👤 ${user.type} kullanıcısı giriş yapıyor...`, 'user');
      
      const response = await makeRequest('POST', '/api/auth/login', {
        email: user.email,
        password: user.password
      });
      
      if (response.status === 200 && response.data.token) {
        log(`✅ ${user.type} başarıyla giriş yaptı`, 'success');
        successCount++;
      } else {
        log(`❌ ${user.type} giriş yapamadı: ${response.status} - ${response.data.error || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      log(`❌ ${user.type} giriş hatası: ${error.message}`, 'error');
    }
  }
  
  log(`📊 Login sonucu: ${successCount}/${demoUsers.length} başarılı`, 'info');
  return successCount;
};

// Test user registration
const testUserRegistration = async () => {
  log('📝 Kullanıcı Kayıt Testi...', 'info');
  
  const testUsers = [
    { name: 'Test Individual', email: 'test.individual@email.com', password: 'test123', panel_type: 'individual' },
    { name: 'Test Corporate', email: 'test.corporate@email.com', password: 'test123', panel_type: 'corporate' },
    { name: 'Test Nakliyeci', email: 'test.nakliyeci@email.com', password: 'test123', panel_type: 'nakliyeci' },
    { name: 'Test Tasiyici', email: 'test.tasiyici@email.com', password: 'test123', panel_type: 'tasiyici' }
  ];
  
  let successCount = 0;
  
  for (const user of testUsers) {
    try {
      log(`📝 ${user.name} kayıt oluyor...`, 'user');
      
      const response = await makeRequest('POST', '/api/auth/register', {
        name: user.name,
        email: user.email,
        password: user.password,
        panel_type: user.panel_type,
        company_name: user.panel_type === 'corporate' ? 'Test Company' : null,
        location: 'İstanbul'
      });
      
      if (response.status === 201 && response.data.token) {
        log(`✅ ${user.name} başarıyla kayıt oldu`, 'success');
        successCount++;
      } else {
        log(`❌ ${user.name} kayıt olamadı: ${response.status} - ${response.data.error || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      log(`❌ ${user.name} kayıt hatası: ${error.message}`, 'error');
    }
  }
  
  log(`📊 Kayıt sonucu: ${successCount}/${testUsers.length} başarılı`, 'info');
  return successCount;
};

// Test API endpoints with authentication
const testAuthenticatedEndpoints = async () => {
  log('🔌 Kimlik Doğrulamalı Endpoint Testi...', 'info');
  
  // First login to get token
  const loginResponse = await makeRequest('POST', '/api/auth/login', {
    email: 'individual@demo.com',
    password: 'demo123'
  });
  
  if (loginResponse.status !== 200 || !loginResponse.data.token) {
    log('❌ Login başarısız, endpoint testleri atlanıyor', 'error');
    return 0;
  }
  
  const token = loginResponse.data.token;
  const headers = { Authorization: `Bearer ${token}` };
  
  const endpoints = [
    { name: 'Get Shipments', method: 'GET', path: '/api/shipments' },
    { name: 'Create Shipment', method: 'POST', path: '/api/shipments', data: {
      title: 'Test Shipment',
      description: 'Test description',
      from_location: 'Istanbul',
      to_location: 'Ankara',
      weight: 10,
      volume: 1,
      price: 500,
      vehicle_type: 'Truck'
    }},
    { name: 'Get Offers', method: 'GET', path: '/api/offers/nakliyeci' },
    { name: 'Get Agreements', method: 'GET', path: '/api/agreements/sender' }
  ];
  
  let successCount = 0;
  
  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(endpoint.method, endpoint.path, endpoint.data, headers);
      
      if (response.status >= 200 && response.status < 300) {
        log(`✅ ${endpoint.name} başarılı`, 'success');
        successCount++;
      } else {
        log(`❌ ${endpoint.name} başarısız: ${response.status}`, 'error');
      }
    } catch (error) {
      log(`❌ ${endpoint.name} hata: ${error.message}`, 'error');
    }
  }
  
  log(`📊 Endpoint sonucu: ${successCount}/${endpoints.length} başarılı`, 'info');
  return successCount;
};

// Main test runner
const runFixedLoginTest = async () => {
  log('🚀 DÜZELTİLMİŞ LOGIN TEST BAŞLIYOR...', 'info');
  log('==================================================', 'info');
  
  try {
    // Test demo user login
    const loginSuccess = await testDemoUserLogin();
    
    // Test user registration
    const registrationSuccess = await testUserRegistration();
    
    // Test authenticated endpoints
    const endpointSuccess = await testAuthenticatedEndpoints();
    
    // Generate report
    const totalTests = 4 + 4 + 4; // login + registration + endpoints
    const totalSuccess = loginSuccess + registrationSuccess + endpointSuccess;
    const successRate = (totalSuccess / totalTests * 100).toFixed(1);
    
    log('==================================================', 'info');
    log('📊 DÜZELTİLMİŞ LOGIN TEST RAPORU', 'info');
    log('==================================================', 'info');
    log(`✅ Toplam Başarılı: ${totalSuccess}`, 'success');
    log(`❌ Toplam Başarısız: ${totalTests - totalSuccess}`, 'error');
    log(`🎯 Genel Başarı Oranı: ${successRate}%`, 'info');
    
    if (parseFloat(successRate) >= 80) {
      log('🏆 MÜKEMMEL! Login sistemi çalışıyor', 'success');
    } else if (parseFloat(successRate) >= 60) {
      log('✅ İYİ! Login sistemi büyük ölçüde çalışıyor', 'success');
    } else {
      log('❌ DÜŞÜK! Login sistemi iyileştirmeler gerektiriyor', 'error');
    }
    
    process.exit(parseFloat(successRate) >= 60 ? 0 : 1);
    
  } catch (error) {
    log(`❌ Test Error: ${error.message}`, 'error');
    process.exit(1);
  }
};

// Run the fixed login test
runFixedLoginTest();


