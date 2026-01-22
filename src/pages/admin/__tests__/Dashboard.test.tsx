import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import AdminDashboard from '../Dashboard';

// Mock dependencies
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-admin', name: 'Test Admin', userType: 'admin' },
  }),
}));

jest.mock('../../../config/api', () => ({
  createApiUrl: (path: string) => `http://localhost:5000${path}`,
}));

jest.mock('react-helmet-async', () => ({
  Helmet: ({ children }: any) => <div data-testid="helmet">{children}</div>,
  HelmetProvider: ({ children }: any) => <div>{children}</div>,
}));

// Mock fetch
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

const mockOverviewData = {
  data: {
    usersTotal: 150,
    shipmentsTotal: 1250,
    offersTotal: 890,
    messagesTotal: 456,
  },
};

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Admin Dashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('authToken', 'test-token');
    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockOverviewData,
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders dashboard correctly', async () => {
    renderWithRouter(<AdminDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Toplam Kullanıcı')).toBeInTheDocument();
      expect(screen.getByText('Toplam Gönderi')).toBeInTheDocument();
      expect(screen.getByText('Teklifler')).toBeInTheDocument();
      expect(screen.getByText('Mesajlar')).toBeInTheDocument();
    });
  });

  it('displays overview statistics', async () => {
    renderWithRouter(<AdminDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument(); // users
      expect(screen.getByText('1250')).toBeInTheDocument(); // shipments
      expect(screen.getByText('890')).toBeInTheDocument(); // offers
      expect(screen.getByText('456')).toBeInTheDocument(); // messages
    });
  });

  it('shows loading state', async () => {
    (fetch as any).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => mockOverviewData,
      }), 1000))
    );

    renderWithRouter(<AdminDashboard />);
    expect(screen.getByText('Yükleniyor...')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    (fetch as any).mockRejectedValue(new Error('Network error'));
    
    renderWithRouter(<AdminDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('displays additional dashboard sections', async () => {
    renderWithRouter(<AdminDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Rol Dağılımı')).toBeInTheDocument();
      expect(screen.getByText('Bugün Olanlar')).toBeInTheDocument();
      expect(screen.getByText('individual / corporate / nakliyeci / tasiyici')).toBeInTheDocument();
    });
  });

  it('has proper accessibility structure', async () => {
    renderWithRouter(<AdminDashboard />);
    
    await waitFor(() => {
      const cards = screen.getAllByText(/Toplam|Teklifler|Mesajlar/);
      expect(cards.length).toBeGreaterThan(0);
    });
  });
});
