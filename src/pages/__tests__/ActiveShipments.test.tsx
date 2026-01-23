import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, jest, beforeEach } from '@jest/globals';
import ActiveShipments from '../nakliyeci/ActiveShipments';

// Mock dependencies
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user', name: 'Test User', userType: 'nakliyeci' },
  }),
}));

jest.mock('../../config/api', () => ({
  createApiUrl: (path: string) => `http://localhost:5000${path}`,
}));

jest.mock('../../utils/format', () => ({
  formatCurrency: (value: number) => `₺${value.toFixed(2)}`,
  formatDate: (date: string) => new Date(date).toLocaleDateString('tr-TR'),
}));

jest.mock('../../utils/shipmentStatus', () => ({
  getStatusInfo: (status: string) => ({
    text: status,
    color: 'bg-blue-100 text-blue-600',
  }),
  getStatusDescription: (status: string) => status,
}));

jest.mock('../../components/common/Breadcrumb', () => ({
  __esModule: true,
  default: ({ items }: any) => <div data-testid="breadcrumb">{items[0]?.label}</div>,
}));

jest.mock('../../components/common/EmptyState', () => ({
  __esModule: true,
  default: ({ title, description }: any) => (
    <div data-testid="empty-state">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  ),
}));

jest.mock('../../components/common/LoadingState', () => ({
  __esModule: true,
  default: () => <div data-testid="loading-state">Loading...</div>,
}));

jest.mock('../../components/common/Modal', () => ({
  __esModule: true,
  default: ({ children, isOpen, onClose }: any) => 
    isOpen ? (
      <div data-testid="modal">
        <button onClick={onClose}>Close</button>
        {children}
      </div>
    ) : null,
}));

jest.mock('react-helmet-async', () => ({
  Helmet: ({ children }: any) => <div data-testid="helmet">{children}</div>,
  HelmetProvider: ({ children }: any) => <div>{children}</div>,
}));

// Mock fetch
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

const mockShipmentData = {
  data: [
    {
      id: '1',
      trackingNumber: 'TRK001',
      from: 'İstanbul',
      to: 'Ankara',
      status: 'pending',
      priority: 'normal',
      weight: 100,
      volume: 2.5,
      displayPrice: 1500,
      pickupDate: '2024-01-01',
      deliveryDate: '2024-01-02',
      driver: null,
      shipper: {
        id: 'shipper1',
        name: 'Test Shipper',
        company: 'Test Company',
        email: 'test@example.com',
      },
      createdAt: '2024-01-01T00:00:00Z',
    },
  ],
  pagination: {
    page: 1,
    pages: 1,
    total: 1,
  },
};

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('ActiveShipments Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockShipmentData,
    });
  });

  it('renders shipments list correctly', async () => {
    renderWithRouter(<ActiveShipments />);
    
    await waitFor(() => {
      expect(
        screen.getByText((content: string) => content.includes('TRK001'))
      ).toBeInTheDocument();
    });
  });

  it('shows loading state', async () => {
    (fetch as any).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => mockShipmentData,
      }), 1000))
    );

    renderWithRouter(<ActiveShipments />);
    expect(screen.getByTestId('loading-state')).toBeInTheDocument();
  });

  it('shows empty state when no shipments', async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ data: [], pagination: { page: 1, pages: 0, total: 0 } }),
    });

    renderWithRouter(<ActiveShipments />);
    
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
  });
});
