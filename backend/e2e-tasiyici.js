/* eslint-disable no-console */
// End-to-end flow (API level): corporate -> nakliyeci -> tasiyici (driver)
// 1) tasiyici demo-login, get driverCode
// 2) nakliyeci demo-login, link driver via /api/drivers/link
// 3) corporate creates shipment publishType=specific targetNakliyeciId
// 4) nakliyeci makes offer, corporate accepts (shipment becomes offer_accepted)
// 5) nakliyeci opens carrier-market listing for shipment
// 6) tasiyici lists available listings, bids
// 7) nakliyeci accepts bid (assigns driver)
// 8) tasiyici sees shipment in /api/shipments/tasiyici
// 9) tasiyici messages nakliyeci about shipment (receiverId required)

const base = process.env.API_BASE_URL || 'http://localhost:5000';

async function jsonOrNull(r) {
  try {
    return await r.json();
  } catch {
    return null;
  }
}

async function demoLogin(panelType) {
  const r = await fetch(`${base}/api/auth/demo-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ panelType }),
  });
  const j = await jsonOrNull(r);
  const token = j?.token || j?.data?.token;
  if (!token) throw new Error(`demo-login failed for ${panelType}: ${JSON.stringify(j)}`);
  const user = j?.user || j?.data?.user || j?.data || null;
  return { token, user };
}

async function getProfile(token) {
  const r = await fetch(`${base}/api/users/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const j = await jsonOrNull(r);
  const u = j?.data?.user || j?.user || j?.data || j || null;
  return { httpStatus: r.status, user: u };
}

function pickId(u) {
  const id = u?.id ?? u?.userId ?? u?.userid;
  return id == null ? null : Number(id);
}

(async () => {
  // tasiyici
  const tas = await demoLogin('tasiyici');
  const tasProfile = await getProfile(tas.token);
  const driverId = pickId(tasProfile.user);
  const driverCode = tasProfile.user?.driverCode || tasProfile.user?.drivercode || null;
  console.log(JSON.stringify({ step: 'tasiyici_profile', httpStatus: tasProfile.httpStatus, driverId, driverCode }, null, 2));
  if (!driverId || !driverCode) process.exit(1);

  // nakliyeci
  const nak = await demoLogin('nakliyeci');
  const nakProfile = await getProfile(nak.token);
  const nakliyeciId = pickId(nakProfile.user);
  console.log(JSON.stringify({ step: 'nakliyeci_profile', httpStatus: nakProfile.httpStatus, nakliyeciId }, null, 2));
  if (!nakliyeciId) process.exit(1);

  // link driver
  const linkRes = await fetch(`${base}/api/drivers/link`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${nak.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ driverCode }),
  });
  const linkJson = await jsonOrNull(linkRes);
  console.log(
    JSON.stringify(
      { step: 'nakliyeci_link_driver', httpStatus: linkRes.status, success: linkJson?.success ?? null, message: linkJson?.message || linkJson?.error || null },
      null,
      2
    )
  );

  // corporate creates shipment to specific nakliyeci
  const corp = await demoLogin('corporate');
  const createBody = {
    title: 'Taşıyıcı E2E Test Yük',
    description: 'Taşıyıcı E2E test gönderisi',
    category: 'general',
    pickupCity: 'Istanbul',
    pickupDistrict: 'Kadikoy',
    pickupAddress: 'Taşıyıcı Test Pickup Address 123',
    deliveryCity: 'Ankara',
    deliveryDistrict: 'Cankaya',
    deliveryAddress: 'Taşıyıcı Test Delivery Address 456',
    pickupDate: new Date().toISOString(),
    deliveryDate: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
    weight: 100,
    value: 1000,
    publishType: 'specific',
    targetNakliyeciId: nakliyeciId,
  };
  const createRes = await fetch(`${base}/api/shipments`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${corp.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(createBody),
  });
  const createJson = await jsonOrNull(createRes);
  const shipmentId = createJson?.data?.id || createJson?.data?.shipment?.id || null;
  console.log(JSON.stringify({ step: 'corp_create_shipment', httpStatus: createRes.status, shipmentId }, null, 2));
  if (!shipmentId) process.exit(1);

  // nakliyeci offer
  const offerRes = await fetch(`${base}/api/offers`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${nak.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ shipmentId, price: 1500, message: 'Taşıyıcı E2E teklif' }),
  });
  const offerJson = await jsonOrNull(offerRes);
  const offerId = offerJson?.data?.id || null;
  console.log(JSON.stringify({ step: 'nak_create_offer', httpStatus: offerRes.status, offerId }, null, 2));
  if (!offerId) process.exit(1);

  // corporate accept offer
  const acceptRes = await fetch(`${base}/api/offers/${offerId}/accept`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${corp.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  const acceptJson = await jsonOrNull(acceptRes);
  console.log(
    JSON.stringify(
      { step: 'corp_accept_offer', httpStatus: acceptRes.status, success: acceptJson?.success ?? null, message: acceptJson?.message || acceptJson?.error || null },
      null,
      2
    )
  );

  // open driver listing (nakliyeci)
  const listingRes = await fetch(`${base}/api/carrier-market/listings`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${nak.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ shipmentId, minPrice: 1600 }),
  });
  const listingJson = await jsonOrNull(listingRes);
  const listingId = listingJson?.data?.listing?.id || null;
  console.log(JSON.stringify({ step: 'nak_open_listing', httpStatus: listingRes.status, listingId }, null, 2));
  if (!listingId) process.exit(1);

  // tasiyici sees available listings and bids
  const availRes = await fetch(`${base}/api/carrier-market/available`, {
    headers: { Authorization: `Bearer ${tas.token}` },
  });
  const availJson = await jsonOrNull(availRes);
  const availList = Array.isArray(availJson) ? availJson : Array.isArray(availJson?.data) ? availJson.data : [];
  const found = availList.find((l) => String(l?.id) === String(listingId));
  console.log(JSON.stringify({ step: 'tasiyici_available', httpStatus: availRes.status, total: availList.length, listingFound: !!found }, null, 2));

  const bidRes = await fetch(`${base}/api/carrier-market/bids`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tas.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ listingId, bidPrice: 1500, etaHours: 72 }),
  });
  const bidJson = await jsonOrNull(bidRes);
  const bidId = bidJson?.data?.bid?.id || null;
  console.log(JSON.stringify({ step: 'tasiyici_bid', httpStatus: bidRes.status, bidId }, null, 2));
  if (!bidId) process.exit(1);

  // nakliyeci accept bid -> assigns driver
  const bidAcceptRes = await fetch(`${base}/api/carrier-market/bids/${bidId}/accept`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${nak.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  const bidAcceptJson = await jsonOrNull(bidAcceptRes);
  console.log(
    JSON.stringify(
      { step: 'nak_accept_bid', httpStatus: bidAcceptRes.status, success: bidAcceptJson?.success ?? null, message: bidAcceptJson?.message || bidAcceptJson?.error || null },
      null,
      2
    )
  );

  // driver active shipments
  const drvShipRes = await fetch(`${base}/api/shipments/tasiyici?limit=200&page=1`, {
    headers: { Authorization: `Bearer ${tas.token}` },
  });
  const drvShipJson = await jsonOrNull(drvShipRes);
  const drvList = Array.isArray(drvShipJson?.data)
    ? drvShipJson.data
    : Array.isArray(drvShipJson?.shipments)
      ? drvShipJson.shipments
      : [];
  const drvRow = drvList.find((s) => String(s?.id) === String(shipmentId));
  console.log(JSON.stringify({ step: 'tasiyici_shipments', httpStatus: drvShipRes.status, found: !!drvRow, status: drvRow?.status ?? null }, null, 2));

  // driver messaging to nakliyeci (receiverId must be explicit for driver)
  const msgRes = await fetch(`${base}/api/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tas.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ shipmentId, receiverId: nakliyeciId, message: 'Taşıyıcıdan mesaj (E2E)' }),
  });
  const msgJson = await jsonOrNull(msgRes);
  console.log(JSON.stringify({ step: 'tasiyici_send_message', httpStatus: msgRes.status, success: msgJson?.success ?? null }, null, 2));

  process.exit(0);
})().catch((e) => {
  console.error('E2E tasiyici failed:', e);
  process.exit(1);
});
