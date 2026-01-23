// Fetch polyfill for Node.js
const fetch = globalThis.fetch || require('node-fetch');

async function testShipmentFlow() {
  console.log('🧪 GÖNDERİ AKIŞI TEST\n');

  // 1. Kayıt ol
  console.log('1️⃣ Yeni kullanıcı kayıt oluyor...');
  const timestamp = Date.now();
  const testEmail = `testuser${timestamp}@test.com`;
  const testPassword = 'Test123!';

  try {
    const registerResponse = await fetch(
      'http://localhost:5000/api/auth/register',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
          fullName: 'Test User',
          role: 'individual',
        }),
      }
    );

    const registerData = await registerResponse.json();
    console.log('   📧 Email:', testEmail);

    if (!registerData.success) {
      console.log('   ❌ Kayıt başarısız:', registerData.message);
      return;
    }

    const token = registerData.token;
    const userId = registerData.user.id;
    console.log('   ✅ Kayıt başarılı, User ID:', userId);

    // 2. Gönderi oluştur
    console.log('\n2️⃣ Gönderi oluşturuluyor...');
    const shipmentResponse = await fetch(
      'http://localhost:5000/api/shipments',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `Test Gönderi ${timestamp}`,
          description: 'Test açıklama',
          pickupAddress: 'İstanbul, Türkiye',
          deliveryAddress: 'Ankara, Türkiye',
          price: 500,
          userId: userId,
        }),
      }
    );

    const shipmentData = await shipmentResponse.json();

    if (shipmentData.success) {
      console.log('   ✅ Gönderi oluşturuldu, ID:', shipmentData.shipment?.id);
    } else {
      console.log('   ❌ Gönderi oluşturma başarısız:', shipmentData.message);
      return;
    }

    // 3. Gönderileri listele
    console.log('\n3️⃣ Gönderiler listeleniyor...');
    const listResponse = await fetch('http://localhost:5000/api/shipments', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const listData = await listResponse.json();

    if (listData.success && listData.shipments) {
      const userShipments = listData.shipments.filter(s => s.userid == userId);
      console.log('   📦 Toplam gönderi:', listData.shipments.length);
      console.log('   👤 Kullanıcının gönderileri:', userShipments.length);

      const found = userShipments.find(s =>
        s.title?.includes(`Test Gönderi ${timestamp}`)
      );
      if (found) {
        console.log('   ✅ Gönderi listede görünüyor!');
      } else {
        console.log('   ❌ Gönderi listede görünmüyor!');
      }
    } else {
      console.log('   ❌ Liste alınamadı:', listData.message);
    }

    console.log('\n🎉 TEST TAMAMLANDI!');
  } catch (error) {
    console.error('❌ Test hatası:', error.message);
  }
}

testShipmentFlow();
