const { request } = require('playwright');

(async () => {
  const apiURL = process.env.API_URL || 'http://localhost:5000';
  const api = await request.newContext();
  const title = `CarrierMarketFlow ${Date.now()}`;

  try {
    // 1) Individual creates shipment
    const create = await api.post(`${apiURL}/api/shipments`, {
      data: {
        title,
        description: 'market flow shipment',
        pickupAddress: 'Beşiktaş, İstanbul',
        deliveryAddress: 'Bornova, İzmir',
        pickupDate: new Date(Date.now() + 2 * 3600_000).toISOString(),
        weight: 1200,
        price: 5000,
      },
      headers: {
        Authorization: 'Bearer demo-jwt-token-e2e',
        'X-User-Id': '1',
      },
    });
    if (!create.ok())
      throw new Error(
        `create shipment: ${create.status()} ${await create.text()}`
      );
    const created = await create.json();
    const shipmentId = created.data?.id || created.data?.shipment?.id;
    if (!shipmentId) throw new Error('no shipment id');

    // 2) Nakliyeci creates offer
    const offerResp = await api.post(`${apiURL}/api/offers`, {
      data: { shipmentId, price: 5200, message: 'Nakliyeci teklif' },
      headers: { Authorization: 'Bearer demo-jwt-token-e2e', 'X-User-Id': '3' },
    });
    if (!offerResp.ok())
      throw new Error(
        `offer create: ${offerResp.status()} ${await offerResp.text()}`
      );
    const offer = await offerResp.json();
    const offerId = offer.data?.id || offer.data?.offer?.id;
    if (!offerId) throw new Error('no offer id');

    // 3) Sender accepts offer
    const accept = await api.put(`${apiURL}/api/offers/${offerId}/accept`);
    if (!accept.ok())
      throw new Error(`accept: ${accept.status()} ${await accept.text()}`);

    // 4) Nakliyeci opens carrier-market listing
    const listingResp = await api.post(
      `${apiURL}/api/carrier-market/listings`,
      {
        data: { shipmentId, minPrice: 4800 },
        headers: {
          Authorization: 'Bearer demo-jwt-token-e2e',
          'X-User-Id': '3',
        },
      }
    );
    if (!listingResp.ok())
      throw new Error(
        `listing: ${listingResp.status()} ${await listingResp.text()}`
      );
    const listing = await listingResp.json();
    const listingId = listing.data?.id;
    if (!listingId) throw new Error('no listing id');

    // 5) Tasiyici places a bid
    const bidResp = await api.post(`${apiURL}/api/carrier-market/bids`, {
      data: { listingId, bidPrice: 5100, etaHours: 20 },
      headers: { Authorization: 'Bearer demo-jwt-token-e2e', 'X-User-Id': '4' },
    });
    if (!bidResp.ok())
      throw new Error(`bid: ${bidResp.status()} ${await bidResp.text()}`);
    const bid = await bidResp.json();
    const bidId = bid.data?.id;
    if (!bidId) throw new Error('no bid id');

    // 6) Nakliyeci accepts the bid
    const acceptBid = await api.post(
      `${apiURL}/api/carrier-market/bids/${bidId}/accept`,
      {
        headers: {
          Authorization: 'Bearer demo-jwt-token-e2e',
          'X-User-Id': '3',
        },
      }
    );
    if (!acceptBid.ok())
      throw new Error(
        `accept bid: ${acceptBid.status()} ${await acceptBid.text()}`
      );

    // 7) Tasiyici sees shipment under active
    const active = await api.get(`${apiURL}/api/shipments/tasiyici`, {
      headers: { Authorization: 'Bearer demo-jwt-token-e2e', 'X-User-Id': '4' },
    });
    if (!active.ok())
      throw new Error(
        `tasiyici active: ${active.status()} ${await active.text()}`
      );
    const activeList = await active.json();
    const found = (activeList.data || []).some(s => s.id === shipmentId);
    if (!found) throw new Error('assigned shipment not visible to tasiyici');

    console.log('✅ Carrier market flow completed');
    process.exit(0);
  } catch (e) {
    console.error('❌ Carrier market flow error:', e.message);
    process.exit(1);
  }
})();
