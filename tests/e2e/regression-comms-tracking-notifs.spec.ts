import { test, expect } from '@playwright/test';
import { demoLogin, getApiOrigin } from './_helpers';

test.describe('Regression: messages + notifications + tracking', () => {
  test('Offer accept -> send message -> tracking update -> notifications', async ({ request }) => {
    const apiOrigin = getApiOrigin();

    const corporate = await demoLogin(request, apiOrigin, 'corporate');
    const nakliyeci = await demoLogin(request, apiOrigin, 'nakliyeci');

    // Create shipment (corporate)
    const shipRes = await request.post(`${apiOrigin}/api/shipments`, {
      headers: { Authorization: `Bearer ${corporate.token}` },
      data: {
        title: 'Comms/Tracking Regression Shipment',
        pickupCity: 'Istanbul',
        pickupAddress: 'Kadikoy',
        deliveryCity: 'Ankara',
        deliveryAddress: 'Cankaya',
        weight: 1,
        volume: 1,
        specialRequirements: '',
      },
    });
    expect(shipRes.ok()).toBeTruthy();
    const shipJson: any = await shipRes.json();
    const shipmentId = shipJson?.data?.shipment?.id || shipJson?.data?.id || shipJson?.id;
    expect(shipmentId).toBeTruthy();

    // Create offer (nakliyeci)
    const offerRes = await request.post(`${apiOrigin}/api/offers`, {
      headers: { Authorization: `Bearer ${nakliyeci.token}` },
      data: { shipmentId, price: 150, message: 'Offer for comms/tracking', estimatedDelivery: 2 },
    });
    expect(offerRes.ok()).toBeTruthy();
    const offerJson: any = await offerRes.json();
    const offerId = offerJson?.data?.offer?.id || offerJson?.data?.id || offerJson?.offer?.id || offerJson?.id;
    expect(offerId).toBeTruthy();

    // Accept offer (corporate)
    const acceptRes = await request.post(`${apiOrigin}/api/offers/${offerId}/accept`, {
      headers: { Authorization: `Bearer ${corporate.token}` },
    });
    expect(acceptRes.ok()).toBeTruthy();

    // Send a message (corporate -> nakliyeci)
    const msgRes = await request.post(`${apiOrigin}/api/messages`, {
      headers: { Authorization: `Bearer ${corporate.token}` },
      data: {
        receiverId: nakliyeci.user?.id,
        message: 'Merhaba, gönderi ile ilgili bilgi alabilir miyim?',
        shipmentId,
      },
    });
    expect(msgRes.ok()).toBeTruthy();

    // Fetch messages for shipment (both sides)
    const threadCorp = await request.get(`${apiOrigin}/api/messages/shipment/${shipmentId}`, {
      headers: { Authorization: `Bearer ${corporate.token}` },
    });
    expect(threadCorp.ok()).toBeTruthy();

    const threadNak = await request.get(`${apiOrigin}/api/messages/shipment/${shipmentId}`, {
      headers: { Authorization: `Bearer ${nakliyeci.token}` },
    });
    expect(threadNak.ok()).toBeTruthy();

    // Tracking update (nakliyeci)
    const trackingRes = await request.post(`${apiOrigin}/api/shipments/${shipmentId}/tracking`, {
      headers: { Authorization: `Bearer ${nakliyeci.token}` },
      data: { status: 'in_transit', location: 'Istanbul', notes: 'Picked up' },
    });
    expect(trackingRes.ok()).toBeTruthy();

    // Tracking list (corporate)
    const trackingList = await request.get(`${apiOrigin}/api/shipments/${shipmentId}/tracking`, {
      headers: { Authorization: `Bearer ${corporate.token}` },
    });
    expect(trackingList.ok()).toBeTruthy();
    const trackingJson: any = await trackingList.json();
    const items = trackingJson?.data || trackingJson?.updates || trackingJson?.tracking || [];
    expect(Array.isArray(items)).toBeTruthy();

    // Notifications should be readable (unread-count at least)
    const unreadCorp = await request.get(`${apiOrigin}/api/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${corporate.token}` },
    });
    expect(unreadCorp.ok()).toBeTruthy();

    const unreadNak = await request.get(`${apiOrigin}/api/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${nakliyeci.token}` },
    });
    expect(unreadNak.ok()).toBeTruthy();
  });
});
