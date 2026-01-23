/* eslint-disable no-console */

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
  return token;
}

async function getShipment(token, id) {
  const r = await fetch(`${base}/api/shipments/${id}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  return { status: r.status, body: await jsonOrNull(r) };
}

async function getMessagesByShipment(token, id) {
  const r = await fetch(`${base}/api/messages/shipment/${id}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  return { status: r.status, body: await jsonOrNull(r) };
}

async function getTrackingByShipment(token, id) {
  const r = await fetch(`${base}/api/shipments/${id}/tracking`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  return { status: r.status, body: await jsonOrNull(r) };
}

(async () => {
  const shipmentId = Number(process.argv[2] || 86);

  const corpToken = await demoLogin('corporate');
  const indToken = await demoLogin('individual');
  const nakToken = await demoLogin('nakliyeci');
  const drvToken = await demoLogin('tasiyici');

  const corpShip = await getShipment(corpToken, shipmentId);
  const indShip = await getShipment(indToken, shipmentId);
  const nakShip = await getShipment(nakToken, shipmentId);
  const drvShip = await getShipment(drvToken, shipmentId);

  console.log(JSON.stringify({ step: 'shipments_idor', shipmentId, corpShipStatus: corpShip.status, indShipStatus: indShip.status, nakShipStatus: nakShip.status, drvShipStatus: drvShip.status }, null, 2));

  const corpMsg = await getMessagesByShipment(corpToken, shipmentId);
  const indMsg = await getMessagesByShipment(indToken, shipmentId);
  const nakMsg = await getMessagesByShipment(nakToken, shipmentId);
  const drvMsg = await getMessagesByShipment(drvToken, shipmentId);

  console.log(JSON.stringify({ step: 'messages_idor', shipmentId, corpMsgStatus: corpMsg.status, indMsgStatus: indMsg.status, nakMsgStatus: nakMsg.status, drvMsgStatus: drvMsg.status }, null, 2));

  const corpTrack = await getTrackingByShipment(corpToken, shipmentId);
  const indTrack = await getTrackingByShipment(indToken, shipmentId);
  const nakTrack = await getTrackingByShipment(nakToken, shipmentId);
  const drvTrack = await getTrackingByShipment(drvToken, shipmentId);

  console.log(
    JSON.stringify(
      {
        step: 'tracking_idor',
        shipmentId,
        corpTrackStatus: corpTrack.status,
        indTrackStatus: indTrack.status,
        nakTrackStatus: nakTrack.status,
        drvTrackStatus: drvTrack.status,
      },
      null,
      2
    )
  );

  process.exit(0);
})().catch((e) => {
  console.error('security-smoke failed:', e);
  process.exit(1);
});
