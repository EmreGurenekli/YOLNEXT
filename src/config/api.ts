const API_CONFIG = {
  development: {
    timeout: 10000,
    retryAttempts: 3,
  },
  production: {
    timeout: 15000,
    retryAttempts: 5,
  },
  test: {
    timeout: 5000,
    retryAttempts: 1,
  },
};

const getViteEnv = (): any => {
  try {
    // IMPORTANT:
    // Do NOT use eval() here. Production CSP can block 'unsafe-eval',
    // which would make the app think it's in development and break API base URL resolution.
    // `import.meta.env` is safe in Vite runtime.
    return (import.meta as any)?.env ?? null;
  } catch {
    return null;
  }
};

const getEnvironment = (): keyof typeof API_CONFIG => {
  const viteEnv = getViteEnv();
  const nodeEnv = typeof process !== 'undefined' ? process.env.NODE_ENV : undefined;
  const mode = String(viteEnv?.MODE || nodeEnv || 'development');
  if (mode === 'test') return 'test';
  if (mode === 'production') return 'production';
  return 'development';
};

const resolveBaseUrl = (env: keyof typeof API_CONFIG) => {
  const viteEnv = getViteEnv();
  const nodeApiUrl = typeof process !== 'undefined' ? process.env.VITE_API_URL : undefined;
  const fromEnv = viteEnv?.VITE_API_URL || nodeApiUrl;
  if (fromEnv) {
    let baseUrl = String(fromEnv);
    if (baseUrl.endsWith('/api')) {
      baseUrl = baseUrl.substring(0, baseUrl.length - 4);
    }
    return baseUrl;
  }
  if (env === 'production') {
    // Default to same-origin for monolith deployments (e.g. Render single-service)
    if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin;
    return 'https://yolnext-backend.onrender.com';
  }
  if (env === 'development') {
    return 'http://localhost:5000';
  }
  return 'http://localhost:5000';
};

export const getApiConfig = () => {
  const env = getEnvironment();
  return {
    ...API_CONFIG[env],
    baseURL: resolveBaseUrl(env),
  };
};

export const API_ENDPOINTS = {
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  DEMO_LOGIN: '/api/auth/demo-login',
  FORGOT_PASSWORD: '/api/auth/forgot-password',
  RESET_PASSWORD: '/api/auth/reset-password',
  PROFILE: '/api/users/profile',
  DELETE_ACCOUNT: '/api/users/account',
  SHIPMENTS: '/api/shipments',
  SHIPMENTS_OPEN: '/api/shipments/open',
  SHIPMENTS_NAKLIYECI: '/api/shipments/nakliyeci',
  SHIPMENTS_OFFERS: '/api/shipments/offers',
  OFFERS: '/api/offers',
  OFFERS_ACCEPT: '/api/offers/:id/accept',
  KVKK_DATA_ACCESS: '/api/kvkk/data-access',
  KVKK_DELETE_DATA: '/api/kvkk/delete-data',
  CARRIERS_CORPORATE: '/api/carriers/corporate',
  CARRIERS_CORPORATE_LINK: '/api/carriers/corporate/link',
  DRIVERS_LINK: '/api/drivers/link',
  HEALTH: '/health',
};

export const createApiUrl = (endpoint: string): string => {
  const config = getApiConfig();
  let base = config.baseURL.replace(/\/$/, '');
  
  if (base.endsWith('/api')) {
    base = base.substring(0, base.length - 4);
  }
  
  let path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  if (path.startsWith('/api/')) {
    return `${base}${path}`;
  }
  
  if (!path.startsWith('/api')) {
    path = `/api${path}`;
  }
  
  return `${base}${path}`;
};

export default {
  getApiConfig,
  createApiUrl,
  API_ENDPOINTS,
};
