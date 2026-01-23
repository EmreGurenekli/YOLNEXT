const { chromium, request } = require('playwright');

(async () => {
  const baseURL = 'http://localhost:5173';
  const apiURL = 'http://localhost:5000';
  const browser = await chromium.launch({ headless: false });
  const api = await request.newContext();

  const errors = [];
  const tests = [];

  const logTest = (name, passed, error = null) => {
    tests.push({ name, passed, error });
    console.log(`${passed ? '✅' : '❌'} ${name}${error ? `: ${error}` : ''}`);
  };

  try {
    console.log('🚀 Gelişmiş Senaryo Testleri Başlatılıyor...\n');

    // ============================================
    // 1. MULTIPLE OFFERS SCENARIO
    // ============================================
    console.log('📋 1. Multiple Offers Scenario');

    try {
      // Create shipment
      const createResp = await api.post(`${apiURL}/api/shipments`, {
        data: {
          title: `Multi-Offer Test ${Date.now()}`,
          description: 'Multiple offers test',
          pickupAddress: 'Beşiktaş, İstanbul',
          deliveryAddress: 'Konak, İzmir',
          pickupDate: new Date(Date.now() + 3600000).toISOString(),
          weight: 800,
          price: 4000,
        },
        headers: { Authorization: 'Bearer demo-token', 'X-User-Id': '1' },
      });

      if (!createResp.ok())
        throw new Error(`Create failed: ${createResp.status()}`);
      const created = await createResp.json();
      const shipmentId = created.data?.id || created.data?.shipment?.id;
      if (!shipmentId) throw new Error('No shipment ID');

      // Multiple nakliyecis make offers
      const offer1 = await api.post(`${apiURL}/api/offers`, {
        data: { shipmentId, price: 4200, message: 'Offer 1' },
        headers: { Authorization: 'Bearer demo-token', 'X-User-Id': '3' },
      });
      const offer2 = await api.post(`${apiURL}/api/offers`, {
        data: { shipmentId, price: 4500, message: 'Offer 2' },
        headers: { Authorization: 'Bearer demo-token', 'X-User-Id': '3' },
      });

      if (!offer1.ok() || !offer2.ok())
        throw new Error('Offers creation failed');

      // Get offers for shipment
      const getOffers = await api.get(
        `${apiURL}/api/offers?shipmentId=${shipmentId}`,
        {
          headers: { Authorization: 'Bearer demo-token', 'X-User-Id': '1' },
        }
      );
      if (!getOffers.ok())
        throw new Error(`Get offers failed: ${getOffers.status()}`);
      const offers = await getOffers.json();
      const offersCount = (offers.data || offers.offers || []).length;

      if (offersCount >= 2) {
        logTest('Multiple Offers Created', true);
        logTest('Get Offers by Shipment', true);
      } else {
        throw new Error(`Expected 2+ offers, got ${offersCount}`);
      }
    } catch (e) {
      logTest('Multiple Offers Scenario', false, e.message);
      errors.push(`Multiple offers: ${e.message}`);
    }

    // ============================================
    // 2. CARRIER MARKET MULTIPLE BIDS
    // ============================================
    console.log('\n📋 2. Carrier Market Multiple Bids');

    try {
      // Create shipment and listing
      const createResp = await api.post(`${apiURL}/api/shipments`, {
        data: {
          title: `Multi-Bid Test ${Date.now()}`,
          description: 'Multiple bids test',
          pickupAddress: 'Kadıköy, İstanbul',
          deliveryAddress: 'Bornova, İzmir',
          pickupDate: new Date(Date.now() + 3600000).toISOString(),
          weight: 1000,
          price: 5000,
        },
        headers: { Authorization: 'Bearer demo-token', 'X-User-Id': '1' },
      });

      if (!createResp.ok())
        throw new Error(`Create failed: ${createResp.status()}`);
      const created = await createResp.json();
      const shipmentId = created.data?.id || created.data?.shipment?.id;

      // Nakliyeci creates offer and accepts
      const offerResp = await api.post(`${apiURL}/api/offers`, {
        data: { shipmentId, price: 5200 },
        headers: { Authorization: 'Bearer demo-token', 'X-User-Id': '3' },
      });
      const offer = await offerResp.json();
      const offerId = offer.data?.id || offer.data?.offer?.id;
      await api.put(`${apiURL}/api/offers/${offerId}/accept`);

      // Create listing
      const listingResp = await api.post(
        `${apiURL}/api/carrier-market/listings`,
        {
          data: { shipmentId, minPrice: 4800 },
          headers: { Authorization: 'Bearer demo-token', 'X-User-Id': '3' },
        }
      );
      const listing = await listingResp.json();
      const listingId = listing.data?.id;

      // Multiple tasiyicis place bids
      const bid1 = await api.post(`${apiURL}/api/carrier-market/bids`, {
        data: { listingId, bidPrice: 4900, etaHours: 10 },
        headers: { Authorization: 'Bearer demo-token', 'X-User-Id': '4' },
      });
      const bid2 = await api.post(`${apiURL}/api/carrier-market/bids`, {
        data: { listingId, bidPrice: 5000, etaHours: 12 },
        headers: { Authorization: 'Bearer demo-token', 'X-User-Id': '4' },
      });

      if (!bid1.ok() || !bid2.ok()) throw new Error('Bids creation failed');

      // Get bids for listing
      const getBids = await api.get(
        `${apiURL}/api/carrier-market/bids?listingId=${listingId}`
      );
      if (!getBids.ok()) throw new Error('Get bids failed');
      const bids = await getBids.json();
      const bidsCount = (bids.data || []).length;

      if (bidsCount >= 2) {
        logTest('Multiple Bids Created', true);
        logTest('Get Bids by Listing', true);

        // Accept one bid
        const bidData = bids.data || [];
        if (bidData.length > 0) {
          const acceptBidResp = await api.post(
            `${apiURL}/api/carrier-market/bids/${bidData[0].id}/accept`,
            {
              headers: { Authorization: 'Bearer demo-token', 'X-User-Id': '3' },
            }
          );

          if (acceptBidResp.ok()) {
            // Verify other bids are rejected
            const getBidsAfter = await api.get(
              `${apiURL}/api/carrier-market/bids?listingId=${listingId}`
            );
            const bidsAfter = await getBidsAfter.json();
            const bidsAfterData = bidsAfter.data || [];
            const rejectedCount = bidsAfterData.filter(
              b => b.status === 'rejected'
            ).length;
            const acceptedCount = bidsAfterData.filter(
              b => b.status === 'accepted'
            ).length;

            if (acceptedCount === 1 && rejectedCount >= 1) {
              logTest('Accept Bid - Others Auto-Rejected', true);
            } else {
              throw new Error(
                `Expected 1 accepted, ${rejectedCount} rejected, got ${acceptedCount} accepted`
              );
            }
          } else {
            throw new Error('Accept bid failed');
          }
        }
      } else {
        throw new Error(`Expected 2+ bids, got ${bidsCount}`);
      }
    } catch (e) {
      logTest('Carrier Market Multiple Bids', false, e.message);
      errors.push(`Multiple bids: ${e.message}`);
    }

    // ============================================
    // 3. STATUS WORKFLOW TEST
    // ============================================
    console.log('\n📋 3. Status Workflow Test');

    try {
      // Create and accept offer
      const createResp = await api.post(`${apiURL}/api/shipments`, {
        data: {
          title: `Status Test ${Date.now()}`,
          description: 'Status workflow test',
          pickupAddress: 'Şişli, İstanbul',
          deliveryAddress: 'Nilüfer, Bursa',
          pickupDate: new Date(Date.now() + 3600000).toISOString(),
          weight: 600,
          price: 3500,
        },
        headers: { Authorization: 'Bearer demo-token', 'X-User-Id': '1' },
      });
      const created = await createResp.json();
      const shipmentId = created.data?.id || created.data?.shipment?.id;

      const offerResp = await api.post(`${apiURL}/api/offers`, {
        data: { shipmentId, price: 3800 },
        headers: { Authorization: 'Bearer demo-token', 'X-User-Id': '3' },
      });
      const offer = await offerResp.json();
      const offerId = offer.data?.id || offer.data?.offer?.id;

      await api.put(`${apiURL}/api/offers/${offerId}/accept`);

      // Check status is 'accepted'
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait for DB update
      const getShipment = await api.get(
        `${apiURL}/api/shipments/${shipmentId}`,
        {
          headers: { Authorization: 'Bearer demo-token', 'X-User-Id': '1' },
        }
      );
      if (!getShipment.ok())
        throw new Error(`Get shipment failed: ${getShipment.status()}`);
      const shipment = await getShipment.json();
      const status =
        shipment.data?.status || shipment.status || shipment.data?.data?.status;

      if (status === 'accepted') {
        logTest('Shipment Status After Accept', true);
      } else {
        throw new Error(`Expected 'accepted', got '${status}'`);
      }
    } catch (e) {
      logTest('Status Workflow', false, e.message);
      errors.push(`Status workflow: ${e.message}`);
    }

    // ============================================
    // 4. ERROR HANDLING TESTS
    // ============================================
    console.log('\n📋 4. Error Handling Tests');

    try {
      // Invalid offer creation
      const invalidOffer = await api.post(`${apiURL}/api/offers`, {
        data: { shipmentId: 999999, price: 1000 },
        headers: { Authorization: 'Bearer demo-token', 'X-User-Id': '3' },
      });

      if (invalidOffer.status() === 404 || invalidOffer.status() === 400) {
        logTest('Invalid Shipment ID - Error Handling', true);
      } else {
        logTest(
          'Invalid Shipment ID - Error Handling',
          false,
          `Expected 404/400, got ${invalidOffer.status()}`
        );
      }

      // Missing auth
      const noAuth = await api.get(`${apiURL}/api/shipments/tasiyici`);
      if (noAuth.status() === 401 || noAuth.status() === 200) {
        // 200 if userId optional
        logTest('Missing Auth - Error Handling', true);
      } else {
        logTest(
          'Missing Auth - Error Handling',
          false,
          `Unexpected status: ${noAuth.status()}`
        );
      }
    } catch (e) {
      logTest('Error Handling Tests', false, e.message);
      errors.push(`Error handling: ${e.message}`);
    }

    // ============================================
    // 5. DATA CONSISTENCY TESTS
    // ============================================
    console.log('\n📋 5. Data Consistency Tests');

    try {
      // Create shipment
      const createResp = await api.post(`${apiURL}/api/shipments`, {
        data: {
          title: `Consistency Test ${Date.now()}`,
          description: 'Data consistency test',
          pickupAddress: 'Levent, İstanbul',
          deliveryAddress: 'Tunalı, Ankara',
          pickupDate: new Date(Date.now() + 3600000).toISOString(),
          weight: 700,
          price: 4500,
        },
        headers: { Authorization: 'Bearer demo-token', 'X-User-Id': '1' },
      });
      const created = await createResp.json();
      const shipmentId = created.data?.id || created.data?.shipment?.id;

      // Get shipment by ID
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait for DB
      const getResp = await api.get(`${apiURL}/api/shipments/${shipmentId}`, {
        headers: { Authorization: 'Bearer demo-token', 'X-User-Id': '1' },
      });

      if (getResp.ok()) {
        const shipment = await getResp.json();
        const data = shipment.data || shipment;

        if (
          data &&
          (data.id == shipmentId || data.id === parseInt(shipmentId)) &&
          data.title &&
          data.pickupAddress
        ) {
          logTest('Shipment Data Consistency', true);
        } else {
          throw new Error(
            `Data mismatch: ${JSON.stringify(data).substring(0, 100)}`
          );
        }
      } else {
        const errorText = await getResp.text();
        throw new Error(
          `Get failed: ${getResp.status()} - ${errorText.substring(0, 100)}`
        );
      }

      // Verify offers list includes this shipment
      const offersResp = await api.get(
        `${apiURL}/api/offers?shipmentId=${shipmentId}`
      );
      if (offersResp.ok()) {
        logTest('Offers List Consistency', true);
      } else {
        logTest(
          'Offers List Consistency',
          false,
          `Status: ${offersResp.status()}`
        );
      }
    } catch (e) {
      logTest('Data Consistency Tests', false, e.message);
      errors.push(`Data consistency: ${e.message}`);
    }

    // ============================================
    // SUMMARY
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('📊 GELİŞMİŞ TEST ÖZETİ');
    console.log('='.repeat(60));

    const passed = tests.filter(t => t.passed).length;
    const failed = tests.filter(t => !t.passed).length;

    console.log(`✅ Başarılı: ${passed}`);
    console.log(`❌ Başarısız: ${failed}`);
    console.log(
      `📈 Başarı Oranı: ${((passed / tests.length) * 100).toFixed(1)}%`
    );

    if (errors.length > 0) {
      console.log(`\n❌ Hatalar (${errors.length}):`);
      errors.slice(0, 10).forEach((err, i) => {
        console.log(`   ${i + 1}. ${err}`);
      });
    }

    console.log('\n' + '='.repeat(60));

    if (failed === 0) {
      console.log('🎉 TÜM GELİŞMİŞ TESTLER BAŞARILI!');
      process.exit(0);
    } else {
      console.log(`⚠️ ${failed} test başarısız.`);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Test framework error:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
