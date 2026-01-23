
// API Configuration
const API_CONFIG = {
  // Development
  development: {
    timeout: 10000,
    retryAttempts: 3,
  },

  // Production
  production: {
    timeout: 15000,
    retryAttempts: 5,
  },

  // Test
  test: {
    timeout: 5000,
    retryAttempts: 1,
  },
};

const getViteEnv = (): any => {
  try {
    const isJest =
      typeof process !== 'undefined' &&
      !!(process as any)?.env &&
      ((process as any).env.JEST_WORKER_ID != null || (process as any).env.NODE_ENV === 'test');
    if (isJest) return null;
    // Evaluate only in Vite/browser ESM context. In Jest/CJS this would throw.
    return (0, eval)('import.meta.env');
  } catch {
    return null;
  }
};

// Get current environment
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
  if (fromEnv) return String(fromEnv);
  // In production, use environment variable or default to Render.com URL pattern
  // Render.com URL format: https://yolnext-backend.onrender.com
  if (env === 'production') {
    // Production URL should be set via VITE_API_URL environment variable
    // Default fallback for Render.com deployment
    return 'https://yolnext-backend.onrender.com';
  }
  // In development, use relative path so Vite proxy can forward to backend
  // Vite proxy is configured to forward /api requests to http://localhost:5000
  if (env === 'development') {
    return '';
  }
  return 'http://localhost:5000';
};

// Get API configuration
export const getApiConfig = () => {
  const env = getEnvironment();
  return {
    ...API_CONFIG[env],
    baseURL: resolveBaseUrl(env),
  };
};

// API endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  DEMO_LOGIN: '/api/auth/demo-login',
  FORGOT_PASSWORD: '/api/auth/forgot-password',
  RESET_PASSWORD: '/api/auth/reset-password',
  PROFILE: '/api/users/profile',
  DELETE_ACCOUNT: '/api/users/account',

  // Shipments
  SHIPMENTS: '/api/shipments',
  SHIPMENTS_OPEN: '/api/shipments/open',
  SHIPMENTS_NAKLIYECI: '/api/shipments/nakliyeci',
  SHIPMENTS_OFFERS: '/api/shipments/offers',

  // Offers
  OFFERS: '/api/offers',
  OFFERS_ACCEPT: '/api/offers/:id/accept',

  // KVKK (GDPR)
  KVKK_DATA_ACCESS: '/api/kvkk/data-access',
  KVKK_DELETE_DATA: '/api/kvkk/delete-data',

  // Carriers
  CARRIERS_CORPORATE: '/api/carriers/corporate',
  CARRIERS_CORPORATE_LINK: '/api/carriers/corporate/link',

  // Drivers
  DRIVERS_LINK: '/api/drivers/link',

  // Health
  HEALTH: '/health',
};

// Create full URL
export const createApiUrl = (endpoint: string): string => {
  const config = getApiConfig();
  // Remove trailing slash from baseURL
  let base = config.baseURL.replace(/\/$/, '');
  
  // If baseURL already ends with /api, remove it to avoid double /api/api/
  if (base.endsWith('/api')) {
    base = base.substring(0, base.length - 4);
  }
  
  // Ensure endpoint starts with /
  let path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // If endpoint already starts with /api/, use it directly with baseURL
  if (path.startsWith('/api/')) {
    return `${base}${path}`;
  }
  
  // If endpoint doesn't start with /api, add it
  if (!path.startsWith('/api')) {
    path = `/api${path}`;
  }
  
  return `${base}${path}`;
};

// Default export
export default {
  getApiConfig,
  createApiUrl,
  API_ENDPOINTS,
};
