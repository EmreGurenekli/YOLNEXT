import { APIRequestContext, Page, expect } from '@playwright/test';

function getApiBaseUrl(): string {
  const raw =
    (process.env.TEST_API_URL && String(process.env.TEST_API_URL)) ||
    (process.env.VITE_API_URL && String(process.env.VITE_API_URL)) ||
    'http://localhost:5000';

  const base = raw.replace(/\/$/, '');
  // If provided base already ends with /api, keep it; otherwise append /api
  return base.endsWith('/api') ? base : `${base}/api`;
}

export async function demoLogin(
  request: APIRequestContext,
  page: Page,
  panelType: 'individual' | 'corporate' | 'nakliyeci' | 'tasiyici'
) {
  const apiBase = getApiBaseUrl();
  const maxAttempts = 4;
  let lastResp = null as null | Awaited<ReturnType<APIRequestContext['post']>>;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const resp = await request.post(`${apiBase}/auth/demo-login`, {
      data: { panelType },
    });
    lastResp = resp;

    if (resp.ok()) {
      const json = await resp.json();
      await page.addInitScript(
        ({ token, user, panelType }) => {
          localStorage.setItem('authToken', token);
          localStorage.setItem('token', token);
          const mapped = {
            id:
              user.id && user.id.toString
                ? user.id.toString()
                : String(user.id ?? 'demo'),
            fullName:
              user.name ??
              `${user.firstName ?? 'Demo'} ${user.lastName ?? ''}`.trim(),
            email: user.email,
            role: user.panel_type ?? user.userType ?? panelType,
            isVerified: true,
          };
          localStorage.setItem('user', JSON.stringify(mapped));
        },
        { token: json.token, user: json.user, panelType }
      );
      return;
    }

    if (resp.status() === 429 && attempt < maxAttempts) {
      const delayMs = 600 * attempt;
      await new Promise(resolve => setTimeout(resolve, delayMs));
      continue;
    }
    break;
  }

  const resp = lastResp;
  let bodyText = '';
  try {
    bodyText = resp ? await resp.text() : '';
  } catch (_) {
    bodyText = '';
  }
  const snippet = bodyText && bodyText.trim() ? bodyText.trim().slice(0, 500) : '';
  const status = resp ? resp.status() : 'unknown';
  throw new Error(
    `demo-login failed (panelType=${panelType}) status=${status} url=${apiBase}/auth/demo-login${snippet ? ` body=${snippet}` : ''}`
  );
}
