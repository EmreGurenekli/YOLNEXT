// Detaylı Test Scripti - Kayıt, Çıkış, Giriş ve Veri Doğrulama
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';
let testEmail = '';
let testFirstName = 'Test';
let testLastName = 'User';

async function test() {
  console.log('='.repeat(60));
  console.log('DETAYLI TEST BAŞLIYOR');
  console.log('='.repeat(60));
  
  try {
    // TEST 1: Backend Bağlantısı
    console.log('\n[TEST 1] Backend bağlantısı kontrol ediliyor...');
    try {
      const healthCheck = await axios.get(`${API_BASE}/health`);
      console.log('✅ Backend çalışıyor:', healthCheck.data);
    } catch (e) {
      console.log('⚠️  Health endpoint yok, direkt register test ediliyor...');
    }
    
    // TEST 2: Kayıt Olma
    console.log('\n[TEST 2] Yeni kullanıcı kaydı yapılıyor...');
    testEmail = `test.detayli.${Date.now()}@test.com`;
    
    const registerResponse = await axios.post(`${API_BASE}/auth/register`, {
      firstName: testFirstName,
      lastName: testLastName,
      email: testEmail,
      password: 'Test123!@#',
      phone: '5321234567',
      address: 'Test Adresi',
      city: 'İstanbul',
      district: 'Kadıköy',
      userType: 'individual'
    });
    
    console.log('Kayıt Response:', JSON.stringify(registerResponse.data, null, 2));
    
    const registerUser = registerResponse.data.data?.user || registerResponse.data.user;
    console.log('\n✅ Kayıt başarılı!');
    console.log('   - ID:', registerUser.id);
    console.log('   - fullName:', registerUser.fullName);
    console.log('   - firstName:', registerUser.firstName);
    console.log('   - lastName:', registerUser.lastName);
    console.log('   - email:', registerUser.email);
    
    // Doğrulama
    const registerValidations = {
      hasFullName: !!registerUser.fullName && registerUser.fullName !== 'Kullanıcı',
      hasFirstName: !!registerUser.firstName && registerUser.firstName === testFirstName,
      hasLastName: !!registerUser.lastName && registerUser.lastName === testLastName,
      fullNameMatches: registerUser.fullName === `${testFirstName} ${testLastName}`,
      hasEmail: !!registerUser.email && registerUser.email === testEmail
    };
    
    console.log('\n📊 Kayıt Doğrulamaları:');
    Object.entries(registerValidations).forEach(([key, value]) => {
      console.log(`   ${value ? '✅' : '❌'} ${key}: ${value}`);
    });
    
    if (!Object.values(registerValidations).every(v => v)) {
      console.log('\n❌ Kayıt doğrulamaları başarısız!');
      return;
    }
    
    // TEST 3: Giriş Yapma
    console.log('\n[TEST 3] Aynı kullanıcı ile giriş yapılıyor...');
    
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: testEmail,
      password: 'Test123!@#'
    });
    
    console.log('Login Response:', JSON.stringify(loginResponse.data, null, 2));
    
    const loginUser = loginResponse.data.data?.user || loginResponse.data.user;
    console.log('\n✅ Giriş başarılı!');
    console.log('   - ID:', loginUser.id);
    console.log('   - fullName:', loginUser.fullName);
    console.log('   - firstName:', loginUser.firstName);
    console.log('   - lastName:', loginUser.lastName);
    console.log('   - email:', loginUser.email);
    
    // Doğrulama
    const loginValidations = {
      hasFullName: !!loginUser.fullName && loginUser.fullName !== 'Kullanıcı',
      hasFirstName: !!loginUser.firstName && loginUser.firstName === testFirstName,
      hasLastName: !!loginUser.lastName && loginUser.lastName === testLastName,
      fullNameMatches: loginUser.fullName === `${testFirstName} ${testLastName}`,
      hasEmail: !!loginUser.email && loginUser.email === testEmail,
      dataMatchesRegister: loginUser.fullName === registerUser.fullName &&
                          loginUser.firstName === registerUser.firstName &&
                          loginUser.lastName === registerUser.lastName
    };
    
    console.log('\n📊 Giriş Doğrulamaları:');
    Object.entries(loginValidations).forEach(([key, value]) => {
      console.log(`   ${value ? '✅' : '❌'} ${key}: ${value}`);
    });
    
    if (!Object.values(loginValidations).every(v => v)) {
      console.log('\n❌ Giriş doğrulamaları başarısız!');
      return;
    }
    
    // TEST 4: Veri Tutarlılığı
    console.log('\n[TEST 4] Veri tutarlılığı kontrol ediliyor...');
    const consistencyChecks = {
      registerLoginIdMatch: registerUser.id === loginUser.id,
      registerLoginFullNameMatch: registerUser.fullName === loginUser.fullName,
      registerLoginFirstNameMatch: registerUser.firstName === loginUser.firstName,
      registerLoginLastNameMatch: registerUser.lastName === loginUser.lastName,
      registerLoginEmailMatch: registerUser.email === loginUser.email
    };
    
    console.log('\n📊 Veri Tutarlılığı:');
    Object.entries(consistencyChecks).forEach(([key, value]) => {
      console.log(`   ${value ? '✅' : '❌'} ${key}: ${value}`);
    });
    
    // FINAL RAPOR
    console.log('\n' + '='.repeat(60));
    console.log('FINAL RAPOR');
    console.log('='.repeat(60));
    
    const allTests = {
      backendConnection: true,
      registration: Object.values(registerValidations).every(v => v),
      login: Object.values(loginValidations).every(v => v),
      dataConsistency: Object.values(consistencyChecks).every(v => v)
    };
    
    const allPassed = Object.values(allTests).every(v => v);
    
    console.log('\n📋 Test Sonuçları:');
    Object.entries(allTests).forEach(([key, value]) => {
      console.log(`   ${value ? '✅' : '❌'} ${key}`);
    });
    
    console.log('\n' + '='.repeat(60));
    if (allPassed) {
      console.log('🎉 TÜM TESTLER BAŞARILI!');
      console.log('='.repeat(60));
      console.log('\n✅ Kayıt ve giriş akışı doğru çalışıyor');
      console.log('✅ fullName, firstName, lastName doğru kaydediliyor');
      console.log('✅ Login sonrası veriler doğru geliyor');
      console.log('✅ Veri tutarlılığı sağlanıyor');
    } else {
      console.log('❌ BAZI TESTLER BAŞARISIZ!');
      console.log('='.repeat(60));
    }
    
  } catch (error) {
    console.error('\n❌ HATA:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    }
    if (error.code === 'ECONNREFUSED') {
      console.error('\n⚠️  Backend çalışmıyor! Lütfen şu komutu çalıştırın:');
      console.error('   cd backend && node server-modular.js');
    }
    console.error('Full error:', error);
  }
}

test();

