// API Configuration
const API_CONFIG = {
  // Development
  development: {
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
    timeout: 10000,
    retryAttempts: 3,
  },

  // Production
  production: {
    baseURL: import.meta.env.VITE_API_URL || 'https://api.yolnext.com',
    timeout: 15000,
    retryAttempts: 5,
  },

  // Test
  test: {
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
    timeout: 5000,
    retryAttempts: 1,
  },
};

// Get current environment
const getEnvironment = (): keyof typeof API_CONFIG => {
  if (import.meta.env.MODE === 'test') return 'test';
  if (import.meta.env.MODE === 'production') return 'production';
  return 'development';
};

// Get API configuration
export const getApiConfig = () => {
  const env = getEnvironment();
  return API_CONFIG[env];
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
