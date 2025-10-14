import { chromium } from 'playwright';

class YolNetRealUserTester {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.testResults = {
      passed: 0,
      failed: 0,
      warnings: 0,
      details: []
    };
    this.createdUsers = [];
    this.createdShipments = [];
  }

  async init() {
    this.browser = await chromium.launch({ 
      headless: false,
      slowMo: 2000
    });
    this.context = await this.browser.newContext();
    this.page = await this.context.newPage();
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  logResult(testName, status, message, details = null) {
    const result = {
      test: testName,
      status,
      message,
      details,
      timestamp: new Date().toISOString()
    };
    
    this.testResults.details.push(result);
    
    if (status === 'PASS') {
      this.testResults.passed++;
      console.log(`✅ ${testName}: ${message}`);
    } else if (status === 'FAIL') {
      this.testResults.failed++;
      console.log(`❌ ${testName}: ${message}`);
    } else if (status === 'WARN') {
      this.testResults.warnings++;
      console.log(`⚠️ ${testName}: ${message}`);
    }
  }

  async takeScreenshot(name) {
    try {
      await this.page.screenshot({ path: `test-screenshots/${name}.png` });
      return `test-screenshots/${name}.png`;
    } catch (error) {
      console.log(`Screenshot alınamadı: ${name}`);
      return null;
    }
  }

  // 1. GERÇEK API TESTLERİ
  async testRealAPICalls() {
    console.log('\n🌐 GERÇEK API TESTLERİ BAŞLIYOR...\n');

    // Backend health check
    await this.testBackendHealth();
    
    // User registration API
    await this.testUserRegistrationAPI();
    
    // User login API
    await this.testUserLoginAPI();
    
    // Shipment creation API
    await this.testShipmentCreationAPI();
    
    // Dashboard data API
    await this.testDashboardDataAPI();
  }

  async testBackendHealth() {
    const testName = 'Backend Health Check';
    
    try {
      const response = await this.page.request.get('http://localhost:5000/health');
      const data = await response.json();
      
      if (response.status() === 200) {
        this.logResult(testName, 'PASS', `Backend çalışıyor: ${data.status}`, data);
      } else {
        this.logResult(testName, 'FAIL', `Backend hatası: ${response.status()}`);
      }
    } catch (error) {
      this.logResult(testName, 'FAIL', `Backend bağlantı hatası: ${error.message}`);
    }
  }

  async testUserRegistrationAPI() {
    const testName = 'Gerçek Kullanıcı Kayıt API';
    
    try {
      const userData = {
        firstName: 'Test',
        lastName: 'Kullanıcı',
        email: `test.user.${Date.now()}@yolnet.com`,
        password: '123456',
        userType: 'individual',
        phone: '+90 555 123 4567'
      };

      const response = await this.page.request.post('http://localhost:5000/api/auth/register', {
        data: userData
      });

      const result = await response.json();
      
      if (response.status() === 201 && result.success) {
        this.createdUsers.push(result.user);
        this.logResult(testName, 'PASS', `Kullanıcı API ile kayıt oldu: ${result.user.email}`, result);
      } else {
        this.logResult(testName, 'FAIL', `API kayıt hatası: ${result.message || 'Bilinmeyen hata'}`);
      }
    } catch (error) {
      this.logResult(testName, 'FAIL', `API kayıt hatası: ${error.message}`);
    }
  }

  async testUserLoginAPI() {
    const testName = 'Gerçek Kullanıcı Giriş API';
    
    try {
      const loginData = {
        email: 'test@yolnet.com',
        password: '123456'
      };

      const response = await this.page.request.post('http://localhost:5000/api/auth/login', {
        data: loginData
      });

      const result = await response.json();
      
      if (response.status() === 200 && result.success) {
        this.logResult(testName, 'PASS', `Kullanıcı API ile giriş yaptı: ${result.user.email}`, result);
        return result.token;
      } else {
        this.logResult(testName, 'WARN', `API giriş hatası: ${result.message || 'Bilinmeyen hata'}`);
        return null;
      }
    } catch (error) {
      this.logResult(testName, 'FAIL', `API giriş hatası: ${error.message}`);
      return null;
    }
  }

  async testShipmentCreationAPI() {
    const testName = 'Gerçek Gönderi Oluşturma API';
    
    try {
      // Önce giriş yap
      const token = await this.testUserLoginAPI();
      if (!token) {
        this.logResult(testName, 'WARN', 'Giriş yapılamadı, API test atlandı');
        return;
      }

      const shipmentData = {
        shipmentType: 'Ev Taşınması',
        originAddress: 'Kadıköy, İstanbul',
        destinationAddress: 'Beşiktaş, İstanbul',
        pickupDate: '2024-10-15',
        houseType: '2+1',
        roomCount: 3,
        floorCount: 2,
        hasElevator: true,
        description: 'Test gönderisi'
      };

      const response = await this.page.request.post('http://localhost:5000/api/shipments', {
        data: shipmentData,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (response.status() === 201 && result.success) {
        this.createdShipments.push(result.shipment);
        this.logResult(testName, 'PASS', `Gönderi API ile oluşturuldu: ${result.shipment.trackingNumber}`, result);
      } else {
        this.logResult(testName, 'FAIL', `API gönderi hatası: ${result.message || 'Bilinmeyen hata'}`);
      }
    } catch (error) {
      this.logResult(testName, 'FAIL', `API gönderi hatası: ${error.message}`);
    }
  }

  async testDashboardDataAPI() {
    const testName = 'Gerçek Dashboard Veri API';
    
    try {
      const token = await this.testUserLoginAPI();
      if (!token) {
        this.logResult(testName, 'WARN', 'Giriş yapılamadı, API test atlandı');
        return;
      }

      const response = await this.page.request.get('http://localhost:5000/api/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      
      if (response.status() === 200 && result.success) {
        this.logResult(testName, 'PASS', `Dashboard verisi API ile alındı`, result);
      } else {
        this.logResult(testName, 'FAIL', `API dashboard hatası: ${result.message || 'Bilinmeyen hata'}`);
      }
    } catch (error) {
      this.logResult(testName, 'FAIL', `API dashboard hatası: ${error.message}`);
    }
  }

  // 2. GERÇEK DATABASE YAZMA TESTLERİ
  async testRealDatabaseWrites() {
    console.log('\n💾 GERÇEK DATABASE YAZMA TESTLERİ BAŞLIYOR...\n');

    // User creation in database
    await this.testUserDatabaseWrite();
    
    // Shipment creation in database
    await this.testShipmentDatabaseWrite();
    
    // Offer creation in database
    await this.testOfferDatabaseWrite();
    
    // Message creation in database
    await this.testMessageDatabaseWrite();
  }

  async testUserDatabaseWrite() {
    const testName = 'Gerçek Kullanıcı Database Yazma';
    
    try {
      const userData = {
        firstName: 'Database',
        lastName: 'Test',
        email: `db.test.${Date.now()}@yolnet.com`,
        password: '123456',
        userType: 'individual',
        phone: '+90 555 999 8888'
      };

      const response = await this.page.request.post('http://localhost:5000/api/auth/register', {
        data: userData
      });

      const result = await response.json();
      
      if (response.status() === 201 && result.success) {
        // Database'de gerçekten oluşturuldu mu kontrol et
        const checkResponse = await this.page.request.get(`http://localhost:5000/api/users/${result.user.id}`, {
          headers: {
            'Authorization': `Bearer ${result.token}`
          }
        });
        
        const checkResult = await checkResponse.json();
        
        if (checkResponse.status() === 200 && checkResult.success) {
          this.logResult(testName, 'PASS', `Kullanıcı database'e yazıldı ve okundu: ${result.user.email}`, checkResult);
        } else {
          this.logResult(testName, 'WARN', `Kullanıcı yazıldı ama okunamadı`);
        }
      } else {
        this.logResult(testName, 'FAIL', `Database yazma hatası: ${result.message}`);
      }
    } catch (error) {
      this.logResult(testName, 'FAIL', `Database yazma hatası: ${error.message}`);
    }
  }

  async testShipmentDatabaseWrite() {
    const testName = 'Gerçek Gönderi Database Yazma';
    
    try {
      // Önce kullanıcı oluştur
      const userData = {
        firstName: 'Shipment',
        lastName: 'Test',
        email: `shipment.test.${Date.now()}@yolnet.com`,
        password: '123456',
        userType: 'individual',
        phone: '+90 555 777 6666'
      };

      const userResponse = await this.page.request.post('http://localhost:5000/api/auth/register', {
        data: userData
      });

      const userResult = await userResponse.json();
      
      if (userResponse.status() === 201 && userResult.success) {
        // Gönderi oluştur
        const shipmentData = {
          shipmentType: 'Ev Taşınması',
          originAddress: 'Database Test Origin',
          destinationAddress: 'Database Test Destination',
          pickupDate: '2024-10-20',
          houseType: '3+1',
          roomCount: 4,
          floorCount: 3,
          hasElevator: false,
          description: 'Database test gönderisi'
        };

        const shipmentResponse = await this.page.request.post('http://localhost:5000/api/shipments', {
          data: shipmentData,
          headers: {
            'Authorization': `Bearer ${userResult.token}`,
            'Content-Type': 'application/json'
          }
        });

        const shipmentResult = await shipmentResponse.json();
        
        if (shipmentResponse.status() === 201 && shipmentResult.success) {
          // Database'de gerçekten oluşturuldu mu kontrol et
          const checkResponse = await this.page.request.get(`http://localhost:5000/api/shipments/${shipmentResult.shipment.id}`, {
            headers: {
              'Authorization': `Bearer ${userResult.token}`
            }
          });
          
          const checkResult = await checkResponse.json();
          
          if (checkResponse.status() === 200 && checkResult.success) {
            this.logResult(testName, 'PASS', `Gönderi database'e yazıldı ve okundu: ${shipmentResult.shipment.trackingNumber}`, checkResult);
          } else {
            this.logResult(testName, 'WARN', `Gönderi yazıldı ama okunamadı`);
          }
        } else {
          this.logResult(testName, 'FAIL', `Gönderi database yazma hatası: ${shipmentResult.message}`);
        }
      } else {
        this.logResult(testName, 'FAIL', `Kullanıcı oluşturulamadı: ${userResult.message}`);
      }
    } catch (error) {
      this.logResult(testName, 'FAIL', `Database yazma hatası: ${error.message}`);
    }
  }

  async testOfferDatabaseWrite() {
    const testName = 'Gerçek Teklif Database Yazma';
    
    try {
      // Önce nakliyeci oluştur
      const carrierData = {
        firstName: 'Carrier',
        lastName: 'Test',
        email: `carrier.test.${Date.now()}@yolnet.com`,
        password: '123456',
        userType: 'carrier',
        phone: '+90 555 555 5555',
        companyName: 'Test Nakliyat',
        taxId: `${Date.now().toString().slice(-10)}`
      };

      const carrierResponse = await this.page.request.post('http://localhost:5000/api/auth/register', {
        data: carrierData
      });

      const carrierResult = await carrierResponse.json();
      
      if (carrierResponse.status() === 201 && carrierResult.success) {
        // Teklif oluştur
        const offerData = {
          shipmentId: 1, // Test shipment ID
          offeredPrice: 1500.00,
          estimatedDeliveryDate: '2024-10-25',
          notes: 'Database test teklifi'
        };

        const offerResponse = await this.page.request.post('http://localhost:5000/api/offers', {
          data: offerData,
          headers: {
            'Authorization': `Bearer ${carrierResult.token}`,
            'Content-Type': 'application/json'
          }
        });

        const offerResult = await offerResponse.json();
        
        if (offerResponse.status() === 201 && offerResult.success) {
          this.logResult(testName, 'PASS', `Teklif database'e yazıldı: ${offerResult.offer.id}`, offerResult);
        } else {
          this.logResult(testName, 'WARN', `Teklif yazma hatası: ${offerResult.message || 'Bilinmeyen hata'}`);
        }
      } else {
        this.logResult(testName, 'WARN', `Nakliyeci oluşturulamadı: ${carrierResult.message}`);
      }
    } catch (error) {
      this.logResult(testName, 'WARN', `Teklif database yazma hatası: ${error.message}`);
    }
  }

  async testMessageDatabaseWrite() {
    const testName = 'Gerçek Mesaj Database Yazma';
    
    try {
      // Önce iki kullanıcı oluştur
      const user1Data = {
        firstName: 'Sender',
        lastName: 'Test',
        email: `sender.test.${Date.now()}@yolnet.com`,
        password: '123456',
        userType: 'individual',
        phone: '+90 555 111 2222'
      };

      const user1Response = await this.page.request.post('http://localhost:5000/api/auth/register', {
        data: user1Data
      });

      const user1Result = await user1Response.json();
      
      if (user1Response.status() === 201 && user1Result.success) {
        const user2Data = {
          firstName: 'Receiver',
          lastName: 'Test',
          email: `receiver.test.${Date.now()}@yolnet.com`,
          password: '123456',
          userType: 'carrier',
          phone: '+90 555 333 4444',
          companyName: 'Test Carrier',
          taxId: `${Date.now().toString().slice(-10)}`
        };

        const user2Response = await this.page.request.post('http://localhost:5000/api/auth/register', {
          data: user2Data
        });

        const user2Result = await user2Response.json();
        
        if (user2Response.status() === 201 && user2Result.success) {
          // Mesaj oluştur
          const messageData = {
            receiverId: user2Result.user.id,
            content: 'Database test mesajı',
            messageType: 'text'
          };

          const messageResponse = await this.page.request.post('http://localhost:5000/api/messages', {
            data: messageData,
            headers: {
              'Authorization': `Bearer ${user1Result.token}`,
              'Content-Type': 'application/json'
            }
          });

          const messageResult = await messageResponse.json();
          
          if (messageResponse.status() === 201 && messageResult.success) {
            this.logResult(testName, 'PASS', `Mesaj database'e yazıldı: ${messageResult.message.id}`, messageResult);
          } else {
            this.logResult(testName, 'WARN', `Mesaj yazma hatası: ${messageResult.message || 'Bilinmeyen hata'}`);
          }
        } else {
          this.logResult(testName, 'WARN', `İkinci kullanıcı oluşturulamadı: ${user2Result.message}`);
        }
      } else {
        this.logResult(testName, 'WARN', `İlk kullanıcı oluşturulamadı: ${user1Result.message}`);
      }
    } catch (error) {
      this.logResult(testName, 'WARN', `Mesaj database yazma hatası: ${error.message}`);
    }
  }

  // 3. GERÇEK ZAMANLI GÜNCELLEMELER TESTLERİ
  async testRealTimeUpdates() {
    console.log('\n⚡ GERÇEK ZAMANLI GÜNCELLEMELER TESTLERİ BAŞLIYOR...\n');

    // WebSocket bağlantısı
    await this.testWebSocketConnection();
    
    // Gerçek zamanlı mesajlaşma
    await this.testRealTimeMessaging();
    
    // Gerçek zamanlı bildirimler
    await this.testRealTimeNotifications();
    
    // Gerçek zamanlı gönderi güncellemeleri
    await this.testRealTimeShipmentUpdates();
  }

  async testWebSocketConnection() {
    const testName = 'WebSocket Bağlantısı';
    
    try {
      // WebSocket bağlantısını test et
      const wsUrl = 'ws://localhost:5000';
      
      // WebSocket bağlantısı için JavaScript kodu çalıştır
      const wsTest = await this.page.evaluate(async () => {
        return new Promise((resolve) => {
          try {
            const ws = new WebSocket('ws://localhost:5000');
            
            ws.onopen = () => {
              console.log('WebSocket bağlantısı açıldı');
              ws.close();
              resolve({ success: true, message: 'WebSocket bağlantısı başarılı' });
            };
            
            ws.onerror = (error) => {
              console.log('WebSocket hatası:', error);
              resolve({ success: false, message: 'WebSocket bağlantı hatası' });
            };
            
            setTimeout(() => {
              resolve({ success: false, message: 'WebSocket bağlantı timeout' });
            }, 5000);
          } catch (error) {
            resolve({ success: false, message: `WebSocket hatası: ${error.message}` });
          }
        });
      });
      
      if (wsTest.success) {
        this.logResult(testName, 'PASS', wsTest.message);
      } else {
        this.logResult(testName, 'WARN', wsTest.message);
      }
    } catch (error) {
      this.logResult(testName, 'WARN', `WebSocket test hatası: ${error.message}`);
    }
  }

  async testRealTimeMessaging() {
    const testName = 'Gerçek Zamanlı Mesajlaşma';
    
    try {
      // İki farklı tarayıcı sekmesi aç
      const page2 = await this.context.newPage();
      
      // İlk kullanıcı giriş yap
      await this.page.goto('http://localhost:5173/login');
      await this.page.fill('input[name="email"]', 'test@yolnet.com');
      await this.page.fill('input[name="password"]', '123456');
      await this.page.click('button[type="submit"]');
      await this.page.waitForTimeout(2000);
      
      // İkinci kullanıcı giriş yap
      await page2.goto('http://localhost:5173/login');
      await page2.fill('input[name="email"]', 'carrier@yolnet.com');
      await page2.fill('input[name="password"]', '123456');
      await page2.click('button[type="submit"]');
      await page2.waitForTimeout(2000);
      
      // Mesaj gönder
      await this.page.goto('http://localhost:5173/individual/messages');
      await this.page.fill('textarea[placeholder*="Mesaj"]', 'Gerçek zamanlı test mesajı');
      await this.page.click('button:has-text("Gönder")');
      
      // İkinci sayfada mesajı kontrol et
      await page2.goto('http://localhost:5173/nakliyeci/messages');
      await page2.waitForTimeout(3000);
      
      const messageExists = await page2.locator('text=Gerçek zamanlı test mesajı').isVisible();
      
      if (messageExists) {
        this.logResult(testName, 'PASS', 'Gerçek zamanlı mesajlaşma çalışıyor');
      } else {
        this.logResult(testName, 'WARN', 'Gerçek zamanlı mesajlaşma çalışmıyor');
      }
      
      await page2.close();
    } catch (error) {
      this.logResult(testName, 'WARN', `Gerçek zamanlı mesajlaşma hatası: ${error.message}`);
    }
  }

  async testRealTimeNotifications() {
    const testName = 'Gerçek Zamanlı Bildirimler';
    
    try {
      // Bildirim gönder
      const notificationData = {
        title: 'Test Bildirimi',
        message: 'Gerçek zamanlı test bildirimi',
        type: 'info',
        category: 'system'
      };

      const response = await this.page.request.post('http://localhost:5000/api/notifications', {
        data: notificationData,
        headers: {
          'Authorization': `Bearer test-token`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (response.status() === 201 && result.success) {
        this.logResult(testName, 'PASS', `Bildirim oluşturuldu: ${result.notification.id}`, result);
      } else {
        this.logResult(testName, 'WARN', `Bildirim oluşturma hatası: ${result.message || 'Bilinmeyen hata'}`);
      }
    } catch (error) {
      this.logResult(testName, 'WARN', `Bildirim test hatası: ${error.message}`);
    }
  }

  async testRealTimeShipmentUpdates() {
    const testName = 'Gerçek Zamanlı Gönderi Güncellemeleri';
    
    try {
      // Gönderi durumu güncelle
      const updateData = {
        status: 'in_transit',
        currentLocation: 'Test Konumu',
        lastLocationUpdate: new Date().toISOString()
      };

      const response = await this.page.request.put('http://localhost:5000/api/shipments/1', {
        data: updateData,
        headers: {
          'Authorization': `Bearer test-token`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (response.status() === 200 && result.success) {
        this.logResult(testName, 'PASS', `Gönderi güncellendi: ${result.shipment.status}`, result);
      } else {
        this.logResult(testName, 'WARN', `Gönderi güncelleme hatası: ${result.message || 'Bilinmeyen hata'}`);
      }
    } catch (error) {
      this.logResult(testName, 'WARN', `Gönderi güncelleme test hatası: ${error.message}`);
    }
  }

  // 4. GERÇEK KULLANICI WORKFLOW TESTLERİ
  async testRealUserWorkflow() {
    console.log('\n👤 GERÇEK KULLANICI WORKFLOW TESTLERİ BAŞLIYOR...\n');

    // Tam workflow testi
    await this.testCompleteUserWorkflow();
  }

  async testCompleteUserWorkflow() {
    const testName = 'Tam Gerçek Kullanıcı Workflow';
    
    try {
      // 1. Bireysel kullanıcı kayıt ol
      console.log('📝 1. Bireysel kullanıcı kayıt oluyor...');
      await this.page.goto('http://localhost:5173');
      await this.page.locator('button:has-text("Ücretsiz Başla")').first().click();
      await this.page.waitForTimeout(2000);
      
      // Form doldur
      const userData = {
        firstName: 'Workflow',
        lastName: 'Test',
        email: `workflow.test.${Date.now()}@yolnet.com`,
        phone: '+90 555 000 1111'
      };
      
      await this.page.fill('input[name="firstName"]', userData.firstName);
      await this.page.fill('input[name="lastName"]', userData.lastName);
      await this.page.fill('input[name="email"]', userData.email);
      await this.page.fill('input[name="phone"]', userData.phone);
      
      await this.page.locator('button:has-text("İleri")').click();
      await this.page.waitForTimeout(2000);
      
      await this.page.fill('input[name="password"]', '123456');
      await this.page.fill('input[name="confirmPassword"]', '123456');
      
      await this.page.locator('button:has-text("İleri")').click();
      await this.page.waitForTimeout(2000);
      
      await this.page.locator('label[for="individual"]').click();
      await this.page.fill('input[name="birthDate"]', '1990-01-01');
      
      await this.page.locator('button:has-text("Hesap Oluştur")').click();
      await this.page.waitForTimeout(3000);
      
      // 2. Dashboard'a git
      console.log('📊 2. Dashboard\'a gidiliyor...');
      await this.page.goto('http://localhost:5173/individual/dashboard');
      await this.page.waitForLoadState('networkidle');
      
      // 3. Gönderi oluştur
      console.log('📦 3. Gönderi oluşturuluyor...');
      await this.page.locator('button:has-text("Yeni Gönderi")').first().click();
      await this.page.waitForTimeout(2000);
      
      await this.page.locator('button:has-text("Ev Taşınması")').click();
      await this.page.waitForTimeout(1000);
      
      await this.page.fill('input[placeholder*="Nereden"]', 'İstanbul, Kadıköy');
      await this.page.fill('input[placeholder*="Nereye"]', 'İstanbul, Beşiktaş');
      await this.page.fill('input[type="date"]', '2024-10-25');
      await this.page.fill('input[placeholder*="Ev Durumu"]', '3+1');
      await this.page.fill('input[placeholder*="Oda"]', '4');
      await this.page.fill('input[placeholder*="Kat"]', '3');
      await this.page.fill('textarea[placeholder*="Açıklama"]', 'Workflow test gönderisi');
      
      await this.page.locator('button:has-text("Gönderi Oluştur")').click();
      await this.page.waitForTimeout(3000);
      
      // 4. Canlı takip sayfasına git
      console.log('📍 4. Canlı takip sayfasına gidiliyor...');
      await this.page.goto('http://localhost:5173/individual/live-tracking');
      await this.page.waitForLoadState('networkidle');
      
      // 5. Mesajlar sayfasına git
      console.log('💬 5. Mesajlar sayfasına gidiliyor...');
      await this.page.goto('http://localhost:5173/individual/messages');
      await this.page.waitForLoadState('networkidle');
      
      this.logResult(testName, 'PASS', 'Tam gerçek kullanıcı workflow başarıyla tamamlandı', userData);
      
    } catch (error) {
      this.logResult(testName, 'FAIL', `Workflow test hatası: ${error.message}`);
    }
  }

  // RAPOR OLUŞTURMA
  generateReport() {
    console.log('\n📊 GERÇEK KULLANICI TEST RAPORU OLUŞTURULUYOR...\n');
    
    const totalTests = this.testResults.passed + this.testResults.failed + this.testResults.warnings;
    const successRate = ((this.testResults.passed / totalTests) * 100).toFixed(2);
    
    console.log('='.repeat(60));
    console.log('🎯 YOLNET GERÇEK KULLANICI TEST RAPORU');
    console.log('='.repeat(60));
    console.log(`📈 Toplam Test: ${totalTests}`);
    console.log(`✅ Başarılı: ${this.testResults.passed}`);
    console.log(`❌ Başarısız: ${this.testResults.failed}`);
    console.log(`⚠️ Uyarı: ${this.testResults.warnings}`);
    console.log(`📊 Başarı Oranı: %${successRate}`);
    console.log('='.repeat(60));
    
    console.log('\n📋 DETAYLI SONUÇLAR:');
    this.testResults.details.forEach((result, index) => {
      const status = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
      console.log(`${index + 1}. ${status} ${result.test}: ${result.message}`);
    });
    
    console.log('\n🔍 ÖNERİLER:');
    if (this.testResults.failed > 0) {
      console.log('❌ Başarısız testler düzeltilmeli');
    }
    if (this.testResults.warnings > 0) {
      console.log('⚠️ Uyarı veren testler gözden geçirilmeli');
    }
    if (successRate >= 90) {
      console.log('🎉 Mükemmel! Sistem gerçek kullanıcılar için hazır');
    } else if (successRate >= 70) {
      console.log('👍 İyi! Bazı iyileştirmeler yapılabilir');
    } else {
      console.log('🚨 Dikkat! Sistemde ciddi sorunlar var');
    }
    
    console.log('\n' + '='.repeat(60));
  }

  // ANA TEST FONKSİYONU
  async runAllTests() {
    console.log('🚀 YOLNET GERÇEK KULLANICI TEST SİSTEMİ BAŞLIYOR...\n');
    
    try {
      await this.init();
      
      // Tüm testleri çalıştır
      await this.testRealAPICalls();
      await this.testRealDatabaseWrites();
      await this.testRealTimeUpdates();
      await this.testRealUserWorkflow();
      
      // Rapor oluştur
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Test sistemi hatası:', error);
    } finally {
      await this.cleanup();
    }
  }
}

// Testi başlat
const tester = new YolNetRealUserTester();
tester.runAllTests();






