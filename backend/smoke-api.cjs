const axios = require('axios');

const BASE_URL = (process.env.TEST_API_URL || process.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
const API = BASE_URL.endsWith('/api') ? BASE_URL : `${BASE_URL}/api`;

async function main() {
  const results = [];
  const push = (name, ok, details) => {
    results.push({ name, ok: !!ok, details: details || '' });
  };

  let token = null;
  try {
    const demo = await axios.post(
      `${API}/auth/demo-login`,
      { panelType: 'individual' },
      { timeout: 15000, validateStatus: () => true }
    );

    const body = demo.data || {};
    token = body?.data?.token || body?.token || null;
    push('demo-login', demo.status >= 200 && demo.status < 300 && !!token, `status=${demo.status} token=${token ? 'present' : 'missing'}`);

    if (!token) {
      throw new Error(`demo-login did not return token (status=${demo.status})`);
    }
  } catch (e) {
    push('demo-login', false, e?.message || String(e));
  }

  // /api/health (inline enhanced)
  try {
    const health = await axios.get(`${API}/health`, { timeout: 15000, validateStatus: () => true });
    const ok = health.status >= 200 && health.status < 300;
    push('health', ok, `status=${health.status} statusField=${health.data?.status || 'n/a'}`);
  } catch (e) {
    push('health', false, e?.message || String(e));
  }

  // /api/healthz (modular router)
  try {
    const healthz = await axios.get(`${API}/healthz`, { timeout: 15000, validateStatus: () => true });
    const ok = healthz.status >= 200 && healthz.status < 300;
    push('healthz', ok, `status=${healthz.status} statusField=${healthz.data?.status || 'n/a'}`);
  } catch (e) {
    push('healthz', false, e?.message || String(e));
  }

  // Shipment detail requires auth
  try {
    const shipmentId = process.env.SMOKE_SHIPMENT_ID ? Number(process.env.SMOKE_SHIPMENT_ID) : 86;
    const sh = await axios.get(`${API}/shipments/${shipmentId}`, {
      timeout: 20000,
      validateStatus: () => true,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    const ok = sh.status >= 200 && sh.status < 300 && (sh.data?.success === true);
    push('shipments/:id', ok, `status=${sh.status} id=${shipmentId}`);
  } catch (e) {
    push('shipments/:id', false, e?.message || String(e));
  }

  const failed = results.filter(r => !r.ok);
  for (const r of results) {
    const status = r.ok ? 'OK' : 'FAIL';
    // Keep output stable for CI parsing
    process.stdout.write(`${status} ${r.name}${r.details ? ` - ${r.details}` : ''}\n`);
  }

  if (failed.length > 0) {
    process.stderr.write(`\nSmoke failed: ${failed.map(f => f.name).join(', ')}\n`);
    process.exit(1);
  }

  process.stdout.write(`\nSmoke passed (base=${BASE_URL})\n`);
}

main().catch((e) => {
  process.stderr.write(`smoke-api fatal: ${e?.stack || e?.message || String(e)}\n`);
  process.exit(2);
});
