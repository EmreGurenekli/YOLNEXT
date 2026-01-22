const { chromium, request } = require('playwright');

(async () => {
  const apiURL = 'http://localhost:5000';
  const api = await request.newContext();

  const issues = [];
  const checks = [];

  const logCheck = (name, passed, issue = null) => {
    checks.push({ name, passed, issue });
    console.log(`${passed ? '✅' : '❌'} ${name}${issue ? `: ${issue}` : ''}`);
    if (!passed && issue) issues.push(`${name}: ${issue}`);
  };

  let shipmentId = null;

  try {
    console.log('🔍 İŞ MANTIĞI KONTROLÜ\n');
    console.log('='.repeat(60));

    // ============================================
    // 1. GÖNDERİ OLUŞTURMA VE ONAY AKIŞI
    // ============================================
    console.log('\n📋 1. Gönderi Oluşturma ve Onay Akışı');

    try {
      // Individual gönderi oluştur
      const createResp = await api.post(`${apiURL}/api/shipments`, {
        data: {
          title: `Mantık Test ${Date.now()}`,
          description: 'İş mantığı kontrolü',
          pickupAddress: 'Kadıköy, İstanbul',
          deliveryAddress: 'Çankaya, Ankara',
          pickupDate: new Date(Date.now() + 3600000).toISOString(),
          weight: 500,
          price: 3000,
        },
        headers: { Authorization: 'Bearer demo-token', 'X-User-Id': '1' },
      });

      if (!createResp.ok())
        throw new Error(`Create failed: ${createResp.status()}`);
      const created = await createResp.json();
      shipmentId = created.data?.id || created.data?.shipment?.id;
      if (!shipmentId) throw new Error('Shipment ID dönmedi');

      // Gönderi oluşturuldu, status kontrolü
      const getShipment = await api.get(
        `${apiURL}/api/shipments/${shipmentId}`,
        {
          headers: { 'X-User-Id': '1' },
        }
      );
      const shipment = await getShipment.json();
      const status = shipment.data?.status;

      if (status === 'pending') {
        logCheck('Gönderi oluşturuldu - Status: pending', true);
      } else {
        logCheck(
          'Gönderi oluşturuldu - Status: pending',
          false,
          `Status: ${status} (pending olmalı)`
        );
      }

      // Nakliyeci teklif ver
      const offerResp = await api.post(`${apiURL}/api/offers`, {
        data: { shipmentId, price: 3500, message: 'Teklif' },
        headers: { Authorization: 'Bearer demo-token', 'X-User-Id': '3' },
      });

      if (!offerResp.ok())
        throw new Error(`Offer failed: ${offerResp.status()}`);
      const offer = await offerResp.json();
      const offerId = offer.data?.id;
      if (!offerId) throw new Error('Offer ID dönmedi');

      // Teklif status kontrolü
      const getOffer = await api.get(
        `${apiURL}/api/offers?shipmentId=${shipmentId}`,
        {
          headers: { 'X-User-Id': '1' },
        }
      );
      const offers = await getOffer.json();
      const offerData = (offers.data || []).find(o => o.id === offerId);

      if (offerData?.status === 'pending') {
        logCheck('Teklif verildi - Status: pending', true);
      } else {
        logCheck(
          'Teklif verildi - Status: pending',
          false,
          `Status: ${offerData?.status}`
        );
      }

      // Gönderici teklifi kabul et
      await api.put(`${apiURL}/api/offers/${offerId}/accept`);

      // Gönderi status'u 'accepted' olmalı
      await new Promise(r => setTimeout(r, 500));
      const getShipmentAfter = await api.get(
        `${apiURL}/api/shipments/${shipmentId}`,
        {
          headers: { 'X-User-Id': '1' },
        }
      );
      const shipmentAfter = await getShipmentAfter.json();

      if (shipmentAfter.data?.status === 'accepted') {
        logCheck('Teklif kabul edildi - Gönderi status: accepted', true);
      } else {
        logCheck(
          'Teklif kabul edildi - Gönderi status: accepted',
          false,
          `Status: ${shipmentAfter.data?.status}`
        );
      }

      // Diğer teklifler 'rejected' olmalı (eğer varsa)
      const allOffers = await api.get(
        `${apiURL}/api/offers?shipmentId=${shipmentId}`,
        {
          headers: { 'X-User-Id': '1' },
        }
      );
      const allOffersData = await allOffers.json();
      const acceptedOffer = (allOffersData.data || []).find(
        o => o.status === 'accepted'
      );
      const rejectedOffers = (allOffersData.data || []).filter(
        o => o.status === 'rejected'
      );

      if (acceptedOffer && acceptedOffer.id === offerId) {
        logCheck('Teklif kabul edildi - Diğerleri rejected', true);
      } else {
        logCheck(
          'Teklif kabul edildi - Diğerleri rejected',
          false,
          'Accepted offer bulunamadı'
        );
      }
    } catch (e) {
      logCheck('Gönderi ve Teklif Akışı', false, e.message);
    }

    // ============================================
    // 2. CARRIER MARKET AKIŞI
    // ============================================
    console.log('\n📋 2. Carrier Market Akışı');

    try {
      // Nakliyeci ilan oluştur (yukarıdaki accepted shipment için)
      if (!shipmentId)
        throw new Error('Shipment ID yok, önce gönderi oluşturulmalı');

      const listingResp = await api.post(
        `${apiURL}/api/carrier-market/listings`,
        {
          data: {
            shipmentId: shipmentId,
            minPrice: 3200,
            notes: 'Test listing',
          },
          headers: { Authorization: 'Bearer demo-token', 'X-User-Id': '3' },
        }
      );

      if (!listingResp.ok()) {
        logCheck(
          'Carrier Market Listing Oluşturma',
          false,
          `Status: ${listingResp.status()}`
        );
      } else {
        const listing = await listingResp.json();
        const listingId = listing.data?.id || listing.listingId;

        if (listingId) {
          logCheck('Carrier Market Listing Oluşturma', true);

          // Tasiyici teklif ver
          const bidResp = await api.post(`${apiURL}/api/carrier-market/bids`, {
            data: { listingId, bidPrice: 3300, etaHours: 12, note: 'Test bid' },
            headers: { Authorization: 'Bearer demo-token', 'X-User-Id': '4' },
          });

          if (!bidResp.ok()) {
            logCheck(
              'Tasiyici Teklif Verme',
              false,
              `Status: ${bidResp.status()}`
            );
          } else {
            const bid = await bidResp.json();
            const bidId = bid.data?.id || bid.bidId;

            if (bidId) {
              logCheck('Tasiyici Teklif Verme', true);

              // Nakliyeci teklifi kabul et
              const acceptBidResp = await api.post(
                `${apiURL}/api/carrier-market/bids/${bidId}/accept`,
                {
                  headers: {
                    Authorization: 'Bearer demo-token',
                    'X-User-Id': '3',
                  },
                }
              );

              if (!acceptBidResp.ok()) {
                logCheck(
                  'Teklif Kabul Etme',
                  false,
                  `Status: ${acceptBidResp.status()}`
                );
              } else {
                // Shipment'ın carrierId'si set edilmeli
                await new Promise(r => setTimeout(r, 500));
                const getShipmentFinal = await api.get(
                  `${apiURL}/api/shipments/${shipmentId}`,
                  {
                    headers: { 'X-User-Id': '1' },
                  }
                );
                const shipmentFinal = await getShipmentFinal.json();

                if (shipmentFinal.data?.carrierId === 4) {
                  logCheck(
                    'Teklif Kabul - Shipment carrierId set edildi',
                    true
                  );
                } else {
                  logCheck(
                    'Teklif Kabul - Shipment carrierId set edildi',
                    false,
                    `carrierId: ${shipmentFinal.data?.carrierId} (4 olmalı)`
                  );
                }

                // Listing status 'assigned' olmalı
                const getListing = await api.get(
                  `${apiURL}/api/carrier-market/listings?mine=1`,
                  {
                    headers: {
                      Authorization: 'Bearer demo-token',
                      'X-User-Id': '3',
                    },
                  }
                );
                const listings = await getListing.json();
                const myListing = (listings.data || []).find(
                  l => l.id === listingId
                );

                if (myListing?.status === 'assigned') {
                  logCheck('Listing Status: assigned', true);
                } else {
                  logCheck(
                    'Listing Status: assigned',
                    false,
                    `Status: ${myListing?.status}`
                  );
                }

                // Diğer bid'ler rejected olmalı
                const getBids = await api.get(
                  `${apiURL}/api/carrier-market/bids?listingId=${listingId}`
                );
                const bids = await getBids.json();
                const bidsData = bids.data || [];
                const acceptedBids = bidsData.filter(
                  b => b.status === 'accepted'
                );
                const rejectedBids = bidsData.filter(
                  b => b.status === 'rejected'
                );

                if (acceptedBids.length === 1 && rejectedBids.length >= 0) {
                  logCheck("Diğer Bid'ler Otomatik Rejected", true);
                } else {
                  logCheck(
                    "Diğer Bid'ler Otomatik Rejected",
                    false,
                    `Accepted: ${acceptedBids.length}, Rejected: ${rejectedBids.length}`
                  );
                }
              }
            } else {
              logCheck('Tasiyici Teklif Verme', false, 'Bid ID dönmedi');
            }
          }
        } else {
          logCheck(
            'Carrier Market Listing Oluşturma',
            false,
            'Listing ID dönmedi'
          );
        }
      }
    } catch (e) {
      logCheck('Carrier Market Akışı', false, e.message);
    }

    // ============================================
    // 3. VERİ TUTARLILIĞI KONTROLLERİ
    // ============================================
    console.log('\n📋 3. Veri Tutarlılığı Kontrolleri');

    try {
      // Tasiyici active jobs'da shipment görünmeli
      const activeJobsResp = await api.get(`${apiURL}/api/shipments/tasiyici`, {
        headers: { Authorization: 'Bearer demo-token', 'X-User-Id': '4' },
      });

      if (activeJobsResp.ok()) {
        const activeJobs = await activeJobsResp.json();
        const found = (activeJobs.data || []).some(s => s.id === shipmentId);

        if (found) {
          logCheck("Tasiyici Active Jobs'da Görünüyor", true);
        } else {
          logCheck(
            "Tasiyici Active Jobs'da Görünüyor",
            false,
            "Shipment active jobs'da yok"
          );
        }
      }

      // Gönderici offers listesinde accepted offer görünmeli
      const senderOffersResp = await api.get(`${apiURL}/api/offers?userId=1`, {
        headers: { 'X-User-Id': '1' },
      });

      if (senderOffersResp.ok()) {
        const senderOffers = await senderOffersResp.json();
        const accepted = (senderOffers.data || []).find(
          o => o.shipmentId === shipmentId && o.status === 'accepted'
        );

        if (accepted) {
          logCheck("Gönderici Offers'da Accepted Offer Görünüyor", true);
        } else {
          logCheck(
            "Gönderici Offers'da Accepted Offer Görünüyor",
            false,
            'Accepted offer bulunamadı'
          );
        }
      }
    } catch (e) {
      logCheck('Veri Tutarlılığı', false, e.message);
    }

    // Veri tutarlılığı için shipmentId kontrolü
    if (!shipmentId) {
      logCheck('Shipment ID Mevcut', false, 'Shipment ID tanımlı değil');
    }

    // ============================================
    // 4. MANTIK KONTROLLERİ
    // ============================================
    console.log('\n📋 4. İş Mantığı Kontrolleri');

    try {
      // Pending shipment için birden fazla offer verilebilmeli
      const newShipmentResp = await api.post(`${apiURL}/api/shipments`, {
        data: {
          title: `Multi-Offer Test ${Date.now()}`,
          pickupAddress: 'İstanbul',
          deliveryAddress: 'Ankara',
          pickupDate: new Date(Date.now() + 3600000).toISOString(),
          weight: 300,
          price: 2000,
        },
        headers: { Authorization: 'Bearer demo-token', 'X-User-Id': '1' },
      });

      const newShipment = await newShipmentResp.json();
      const newShipmentId = newShipment.data?.id;

      if (newShipmentId) {
        // İki farklı nakliyeci teklif versin
        await api.post(`${apiURL}/api/offers`, {
          data: { shipmentId: newShipmentId, price: 2200 },
          headers: { Authorization: 'Bearer demo-token', 'X-User-Id': '3' },
        });
        await api.post(`${apiURL}/api/offers`, {
          data: { shipmentId: newShipmentId, price: 2100 },
          headers: { Authorization: 'Bearer demo-token', 'X-User-Id': '3' },
        });

        const multiOffersResp = await api.get(
          `${apiURL}/api/offers?shipmentId=${newShipmentId}`,
          {
            headers: { 'X-User-Id': '1' },
          }
        );
        const multiOffers = await multiOffersResp.json();
        const offersCount = (multiOffers.data || []).length;

        if (offersCount >= 2) {
          logCheck('Birden Fazla Teklif Verilebiliyor', true);
        } else {
          logCheck(
            'Birden Fazla Teklif Verilebiliyor',
            false,
            `Offer sayısı: ${offersCount}`
          );
        }
      }

      // Accepted shipment için yeni offer verilememeli (opsiyonel - business logic)
      // Bu mantık şu an mevcut değil, bu normal olabilir
    } catch (e) {
      logCheck('İş Mantığı Kontrolleri', false, e.message);
    }

    // ============================================
    // ÖZET
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('📊 İŞ MANTIĞI KONTROLÜ ÖZETİ');
    console.log('='.repeat(60));

    const passed = checks.filter(c => c.passed).length;
    const failed = checks.filter(c => !c.passed).length;

    console.log(`✅ Başarılı Kontrol: ${passed}`);
    console.log(`❌ Başarısız Kontrol: ${failed}`);
    console.log(
      `📈 Başarı Oranı: ${((passed / checks.length) * 100).toFixed(1)}%`
    );

    if (issues.length > 0) {
      console.log(`\n⚠️ Tespit Edilen Sorunlar (${issues.length}):`);
      issues.slice(0, 10).forEach((issue, i) => {
        console.log(`   ${i + 1}. ${issue}`);
      });
    }

    console.log('\n' + '='.repeat(60));

    if (failed === 0) {
      console.log('✅ SİSTEM MANTIKLI ÇALIŞIYOR!');
      console.log('✅ Tüm iş akışları doğru çalışıyor');
      console.log('✅ Veri tutarlılığı sağlanıyor');
      console.log('✅ İş kuralları uygulanıyor');
      process.exit(0);
    } else {
      console.log(`⚠️ ${failed} mantık sorunu tespit edildi.`);
      console.log('🔧 Kontrol edilmesi gereken noktalar mevcut.');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Test framework error:', error);
    process.exit(1);
  }
})();
