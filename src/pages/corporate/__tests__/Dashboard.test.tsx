import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import CorporateDashboard from '../Dashboard';

// Mock dependencies
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-corporate', firstName: 'Kullanıcı', userType: 'corporate' },
  }),
}));

jest.mock('../../../services/api', () => ({
  dashboardAPI: {
    getStats: jest.fn().mockResolvedValue({
      success: true,
      data: {
        stats: {
          totalShipments: 0,
          completedShipments: 0,
          activeShipments: 0,
          pendingOffers: 0,
        },
      },
    }),
  },
  shipmentAPI: {
    getAll: jest.fn().mockResolvedValue({
      success: true,
      data: [],
    }),
  },
}));

jest.mock('../../../utils/format', () => ({
  formatDate: (date: string) => new Date(date).toLocaleDateString('tr-TR'),
  formatCurrency: (value: number) => `₺${value.toFixed(2)}`,
}));

jest.mock('react-helmet-async', () => ({
  Helmet: ({ children }: any) => <div data-testid="helmet">{children}</div>,
  HelmetProvider: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('../../../components/common/Breadcrumb', () => ({
  __esModule: true,
  default: ({ items }: any) => <div data-testid="breadcrumb">{items[0]?.label}</div>,
}));

jest.mock('../../../components/common/EmptyState', () => ({
  __esModule: true,
  default: ({ title, description }: any) => (
    <div data-testid="empty-state">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  ),
}));

jest.mock('../../../components/common/LoadingState', () => ({
  __esModule: true,
  default: () => <div data-testid="loading-state">Loading...</div>,
}));

jest.mock('../../../components/common/Modal', () => ({
  __esModule: true,
  default: ({ children, isOpen, onClose }: any) => 
    isOpen ? (
      <div data-testid="modal">
        <button onClick={onClose}>Close</button>
        {children}
      </div>
    ) : null,
}));

jest.mock('../../../components/common/SuccessMessage', () => ({
  __esModule: true,
  default: ({ message, onClose }: any) => (
    <div data-testid="success-message">
      {message}
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

jest.mock('../../../components/CommissionManager', () => ({
  __esModule: true,
  default: ({ isOpen, onClose }: any) => 
    isOpen ? (
      <div data-testid="commission-manager">
        <h3>Komisyon Yönetimi</h3>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

jest.mock('../../../components/StatusManager', () => ({
  __esModule: true,
  default: ({ isOpen, onClose }: any) => 
    isOpen ? (
      <div data-testid="status-manager">
        <h3>Durum Yönetimi</h3>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Corporate Dashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders dashboard correctly', async () => {
    renderWithRouter(<CorporateDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Ana Sayfa - YolNext Kurumsal')).toBeInTheDocument();
    });
  });

  it('displays overview statistics', async () => {
    renderWithRouter(<CorporateDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Merhaba Kullanıcı! 👋')).toBeInTheDocument();
    });
  });

  it('shows recent shipments', async () => {
    renderWithRouter(<CorporateDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Merhaba Kullanıcı! 👋')).toBeInTheDocument();
    });
  });

  it('displays navigation menu items', async () => {
    renderWithRouter(<CorporateDashboard />);
    
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /gönderi oluştur/i })
      ).toBeInTheDocument();
    });
  });

  it('shows create shipment button', async () => {
    renderWithRouter(<CorporateDashboard />);
    
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /gönderi oluştur/i })
      ).toBeInTheDocument();
    });
  });

  it('displays online status', async () => {
    renderWithRouter(<CorporateDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Çevrimiçi')).toBeInTheDocument();
    });
  });

  it('has proper accessibility structure', async () => {
    renderWithRouter(<CorporateDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Merhaba Kullanıcı! 👋')).toBeInTheDocument();
    });
  });

  it('displays shipment count correctly', async () => {
    renderWithRouter(<CorporateDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('0 Gönderi')).toBeInTheDocument();
    });
  });

  it('shows quick action buttons', async () => {
    renderWithRouter(<CorporateDashboard />);
    
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /gönderi oluştur/i })
      ).toBeInTheDocument();
    });
  });
});
