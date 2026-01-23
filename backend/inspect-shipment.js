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
  if (!token) throw new Error(`demo-login failed: ${JSON.stringify(j)}`);
  return token;
}

(async () => {
  const shipmentId = process.argv[2] ? Number(process.argv[2]) : 86;
  const role = process.argv[3] || 'individual';

  const token = await demoLogin(role);

  const r = await fetch(`${base}/api/shipments/${shipmentId}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  const j = await jsonOrNull(r);

  console.log(JSON.stringify({ httpStatus: r.status, keys: Object.keys(j || {}), body: j }, null, 2));
  process.exit(0);
})().catch((e) => {
  console.error('inspect-shipment failed:', e);
  process.exit(1);
});
