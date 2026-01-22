/* eslint-disable no-console */
// End-to-end flow (API level): corporate creates shipment -> nakliyeci offers -> corporate accepts -> verify status + messaging.

const base = process.env.API_BASE_URL || 'http://localhost:5000';

async function demoLogin(panelType) {
  const r = await fetch(`${base}/api/auth/demo-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ panelType }),
  });
  const j = await r.json().catch(() => null);
  const token = j?.token || j?.data?.token;
  if (!token) {
    throw new Error(`demo-login failed for ${panelType}: ${JSON.stringify(j)}`);
  }
  return token;
}

async function jsonOrNull(r) {
  try {
    return await r.json();
  } catch {
    return null;
  }
}

function pickShipmentId(createJson) {
  return createJson?.data?.id || createJson?.data?.shipment?.id || createJson?.shipment?.id || null;
}

function pickOfferId(offerJson) {
  return offerJson?.data?.id || offerJson?.offer?.id || null;
}

(async () => {
  const tokenCorp = await demoLogin('corporate');

  // 1) Create shipment as corporate
  const createBody = {
    title: 'Kurumsal Test Yük',
    description: 'Kurumsal E2E test gönderisi',
    category: 'general',
    pickupCity: 'Istanbul',
    pickupDistrict: 'Kadikoy',
    pickupAddress: 'Kurumsal Test Pickup Address 123',
    deliveryCity: 'Ankara',
    deliveryDistrict: 'Cankaya',
    deliveryAddress: 'Kurumsal Test Delivery Address 456',
    pickupDate: new Date().toISOString(),
    deliveryDate: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
    weight: 100,
    value: 1000,
    publishType: 'all',
  };

  const createRes = await fetch(`${base}/api/shipments`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenCorp}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(createBody),
  });
  const createJson = await jsonOrNull(createRes);
  const shipmentId = pickShipmentId(createJson);
  console.log(JSON.stringify({ step: 'corp_create_shipment', httpStatus: createRes.status, shipmentId }, null, 2));
  if (!shipmentId) process.exit(1);

  // 2) Nakliyeci makes offer
  const tokenNak = await demoLogin('nakliyeci');
  const offerRes = await fetch(`${base}/api/offers`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenNak}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ shipmentId, price: 1500, message: 'Kurumsal E2E teklif' }),
  });
  const offerJson = await jsonOrNull(offerRes);
  const offerId = pickOfferId(offerJson);
  console.log(JSON.stringify({ step: 'nak_create_offer', httpStatus: offerRes.status, offerId }, null, 2));
  if (!offerId) process.exit(1);

  // 3) Corporate accepts offer
  const acceptRes = await fetch(`${base}/api/offers/${offerId}/accept`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenCorp}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  const acceptJson = await jsonOrNull(acceptRes);
  console.log(
    JSON.stringify(
      {
        step: 'corp_accept_offer',
        httpStatus: acceptRes.status,
        success: acceptJson?.success ?? null,
        message: acceptJson?.message || acceptJson?.error || null,
      },
      null,
      2
    )
  );

  // 4) Verify shipment status
  const shipRes = await fetch(`${base}/api/shipments/${shipmentId}`, {
    headers: { Authorization: `Bearer ${tokenCorp}` },
  });
  const shipJson = await jsonOrNull(shipRes);
  const shipStatus =
    shipJson?.data?.shipment?.status || shipJson?.data?.status || shipJson?.shipment?.status || shipJson?.status || null;
  console.log(JSON.stringify({ step: 'corp_shipment_detail', httpStatus: shipRes.status, status: shipStatus }, null, 2));

  const nakListRes = await fetch(`${base}/api/shipments/nakliyeci?limit=200&page=1`, {
    headers: { Authorization: `Bearer ${tokenNak}` },
  });
  const nakListJson = await jsonOrNull(nakListRes);
  const nakList = Array.isArray(nakListJson?.data)
    ? nakListJson.data
    : Array.isArray(nakListJson?.shipments)
      ? nakListJson.shipments
      : [];
  const nakRow = nakList.find((s) => String(s?.id) === String(shipmentId));
  console.log(
    JSON.stringify(
      {
        step: 'nak_shipments_list',
        httpStatus: nakListRes.status,
        found: !!nakRow,
        status: nakRow?.status ?? null,
      },
      null,
      2
    )
  );

  // 5) Messaging without receiverId (auto)
  const msgRes = await fetch(`${base}/api/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenCorp}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ shipmentId, message: 'Kurumsal test mesajı (auto receiver)' }),
  });
  const msgJson = await jsonOrNull(msgRes);
  console.log(
    JSON.stringify(
      {
        step: 'corp_send_message',
        httpStatus: msgRes.status,
        success: msgJson?.success ?? null,
        receiverId: msgJson?.data?.receiverId || msgJson?.data?.receiver_id || null,
      },
      null,
      2
    )
  );

  const msgGetRes = await fetch(`${base}/api/messages/shipment/${shipmentId}`, {
    headers: { Authorization: `Bearer ${tokenCorp}` },
  });
  const msgGetJson = await jsonOrNull(msgGetRes);
  const msgCount = Array.isArray(msgGetJson?.data)
    ? msgGetJson.data.length
    : Array.isArray(msgGetJson?.messages)
      ? msgGetJson.messages.length
      : null;
  console.log(JSON.stringify({ step: 'corp_get_messages', httpStatus: msgGetRes.status, count: msgCount }, null, 2));

  process.exit(0);
})().catch((e) => {
  console.error('E2E corporate failed:', e);
  process.exit(1);
});
