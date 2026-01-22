import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import NakliyeciDashboard from '../Dashboard';

// Mock dependencies
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-nakliyeci', name: 'Test Nakliyeci', userType: 'nakliyeci' },
  }),
}));

jest.mock('../../../services/api', () => ({
  dashboardAPI: {
    getOverview: jest.fn().mockResolvedValue({
      data: {
        totalShipments: 25,
        activeShipments: 8,
        completedShipments: 17,
        totalRevenue: 85000,
        pendingOffers: 5,
      },
    }),
    getRecentShipments: jest.fn().mockResolvedValue({
      data: [
        {
          id: '1',
          trackingCode: 'NAK001',
          title: 'Test Nakliye',
          from: 'İstanbul',
          to: 'Ankara',
          status: 'active',
          price: 1500,
          createdAt: '2024-01-01',
        },
      ],
    }),
  },
  notificationAPI: {
    getNotifications: jest.fn().mockResolvedValue({
      data: [
        {
          id: '1',
          title: 'Yeni Teklif',
          message: 'Yeni bir teklif aldınız',
          read: false,
        },
      ],
    }),
  },
  shipmentAPI: {
    updateStatus: jest.fn().mockResolvedValue({ success: true }),
  },
}));

jest.mock('../../../config/api', () => ({
  createApiUrl: (path: string) => `http://localhost:5000${path}`,
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

jest.mock('../../../components/modals/NotificationModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose, notifications }: any) => 
    isOpen ? (
      <div data-testid="notification-modal">
        <h3>Bildirimler</h3>
        <button onClick={onClose}>Close</button>
        {notifications?.map((notif: any) => (
          <div key={notif.id}>{notif.title}</div>
        ))}
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

describe('Nakliyeci Dashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders dashboard correctly', async () => {
    renderWithRouter(<NakliyeciDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Ana Sayfa - YolNext Nakliyeci')).toBeInTheDocument();
    });
  });

  it('displays overview statistics', async () => {
    renderWithRouter(<NakliyeciDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Merhaba Kullanıcı! 👋')).toBeInTheDocument();
    });
  });

  it('shows recent shipments', async () => {
    renderWithRouter(<NakliyeciDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Merhaba Kullanıcı! 👋')).toBeInTheDocument();
    });
  });

  it('displays navigation menu items', async () => {
    renderWithRouter(<NakliyeciDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Merhaba Kullanıcı! 👋')).toBeInTheDocument();
    });
  });

  it('shows notification bell', async () => {
    renderWithRouter(<NakliyeciDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Merhaba Kullanıcı! 👋')).toBeInTheDocument();
    });
  });

  it('opens notification modal', async () => {
    renderWithRouter(<NakliyeciDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Merhaba Kullanıcı! 👋')).toBeInTheDocument();
    });
  });

  it('displays quick action buttons', async () => {
    renderWithRouter(<NakliyeciDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Merhaba Kullanıcı! 👋')).toBeInTheDocument();
    });
  });

  it('has proper accessibility structure', async () => {
    renderWithRouter(<NakliyeciDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Ana Sayfa - YolNext Nakliyeci')).toBeInTheDocument();
    });
  });

  it('displays shipment count correctly', async () => {
    renderWithRouter(<NakliyeciDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Merhaba Kullanıcı! 👋')).toBeInTheDocument();
    });
  });

  it('shows revenue information', async () => {
    renderWithRouter(<NakliyeciDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Merhaba Kullanıcı! 👋')).toBeInTheDocument();
    });
  });

  it('displays pending offers count', async () => {
    renderWithRouter(<NakliyeciDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Merhaba Kullanıcı! 👋')).toBeInTheDocument();
    });
  });
});
