import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { vi } from 'vitest';

// Mock user data
export const mockUser = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  panel_type: 'individual' as const,
  company_name: 'Test Company',
  location: 'Istanbul',
  avatar: 'https://example.com/avatar.jpg'
};

// Mock auth context value
export const mockAuthContextValue = {
  user: mockUser,
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  isLoading: false,
  error: null
};

// Custom render function with all providers
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    return (
      <HelmetProvider>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </HelmetProvider>
    );
  };

  return render(ui, { wrapper: AllTheProviders, ...options });
};

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

// Mock functions
export const mockNavigate = vi.fn();
export const mockLocation = {
  pathname: '/test',
  search: '',
  hash: '',
  state: null,
  key: 'test'
};

// Mock router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
    useParams: () => ({}),
  };
});

// Context mocks are now handled in setup.ts

// Mock API functions
export const mockApi = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
};

// Mock toast functions
export const mockToast = {
  showToast: vi.fn(),
  hideToast: vi.fn(),
  clearAllToasts: vi.fn(),
};

// Test data generators
export const generateMockShipment = (overrides = {}) => ({
  id: Math.random().toString(36).substr(2, 9),
  trackingNumber: 'TRK' + Math.random().toString(36).substr(2, 8).toUpperCase(),
  status: 'pending',
  origin: 'Istanbul',
  destination: 'Ankara',
  weight: 10,
  dimensions: '50x30x20',
  value: 1000,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
});

export const generateMockCarrier = (overrides = {}) => ({
  id: Math.floor(Math.random() * 1000),
  name: 'Test Carrier',
  email: 'test@carrier.com',
  phone: '+905551234567',
  rating: 4.5,
  totalShipments: 100,
  successRate: 95,
  location: 'Istanbul',
  ...overrides
});

export const generateMockOffer = (overrides = {}) => ({
  id: Math.random().toString(36).substr(2, 9),
  carrierId: Math.floor(Math.random() * 1000),
  carrierName: 'Test Carrier',
  price: 500,
  estimatedDelivery: '2-3 gün',
  status: 'pending',
  createdAt: new Date().toISOString(),
  ...overrides
});
