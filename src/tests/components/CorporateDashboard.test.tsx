import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '../utils';
import CorporateDashboard from '../../pages/corporate/Dashboard';

// Mock the API calls
vi.mock('../../services/api', () => ({
  get: vi.fn(() => Promise.resolve({ data: [] })),
  post: vi.fn(() => Promise.resolve({ data: {} })),
}));

describe('CorporateDashboard', () => {
  it('renders dashboard component', async () => {
    render(<CorporateDashboard />);
    
    // Check if component renders without crashing
    await waitFor(() => {
      expect(screen.getByText('Dashboard yükleniyor...')).toBeInTheDocument();
    });
  });

  it('displays breadcrumb navigation', async () => {
    render(<CorporateDashboard />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Ana Sayfa')).toHaveLength(2);
    });
  });

  it('shows loading state initially', async () => {
    render(<CorporateDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Dashboard yükleniyor...')).toBeInTheDocument();
    });
  });
});

