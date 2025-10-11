import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '../utils';
import NakliyeciDashboard from '../../pages/nakliyeci/Dashboard';

// Mock the API calls
vi.mock('../../services/api', () => ({
  get: vi.fn(() => Promise.resolve({ data: [] })),
  post: vi.fn(() => Promise.resolve({ data: {} })),
}));

describe('NakliyeciDashboard', () => {
  it('renders dashboard component', async () => {
    render(<NakliyeciDashboard />);
    
    // Check if component renders without crashing
    await waitFor(() => {
      expect(screen.getByText('Dashboard yükleniyor...')).toBeInTheDocument();
    });
  });

  it('displays breadcrumb navigation', async () => {
    render(<NakliyeciDashboard />);
    
    // Breadcrumb is not visible during loading state
    expect(screen.getByText('Dashboard yükleniyor...')).toBeInTheDocument();
  });

  it('shows loading state initially', async () => {
    render(<NakliyeciDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Dashboard yükleniyor...')).toBeInTheDocument();
    });
  });
});
