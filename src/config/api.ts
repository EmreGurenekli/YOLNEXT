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
  PROFILE: '/api/users/profile',

  // Shipments
  SHIPMENTS: '/api/shipments',
  SHIPMENTS_OPEN: '/api/shipments/open',
  SHIPMENTS_NAKLIYECI: '/api/shipments/nakliyeci',
  SHIPMENTS_OFFERS: '/api/shipments/offers',

  // Offers
  OFFERS: '/api/offers',
  OFFERS_ACCEPT: '/api/offers/:id/accept',

  // Health
  HEALTH: '/health',
};

// Create full URL
export const createApiUrl = (endpoint: string): string => {
  const config = getApiConfig();
  return `${config.baseURL}${endpoint}`;
};

// Default export
export default {
  getApiConfig,
  createApiUrl,
  API_ENDPOINTS,
};
