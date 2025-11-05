import { APIRequestContext, Page, expect } from '@playwright/test';

export async function demoLogin(
  request: APIRequestContext,
  page: Page,
  panelType: 'individual' | 'corporate' | 'nakliyeci' | 'tasiyici'
) {
  const resp = await request.post('http://localhost:5000/api/auth/demo-login', {
    data: { panelType },
  });
  expect(resp.ok()).toBeTruthy();
  const json = await resp.json();
  await page.addInitScript(
    ({ token, user }) => {
      localStorage.setItem('authToken', token);
      const mapped = {
        id:
          user.id && user.id.toString
            ? user.id.toString()
            : String(user.id ?? 'demo'),
        fullName:
          user.name ??
          `${user.firstName ?? 'Demo'} ${user.lastName ?? ''}`.trim(),
        email: user.email,
        role: user.panel_type ?? user.userType ?? 'individual',
        isVerified: true,
      };
      localStorage.setItem('user', JSON.stringify(mapped));
    },
    { token: json.token, user: json.user }
  );
}
