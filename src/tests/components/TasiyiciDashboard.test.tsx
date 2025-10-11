import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '../utils';
import TasiyiciDashboard from '../../pages/tasiyici/Dashboard';

// Mock the API calls
vi.mock('../../services/api', () => ({
  get: vi.fn(() => Promise.resolve({ data: [] })),
  post: vi.fn(() => Promise.resolve({ data: {} })),
}));

describe('TasiyiciDashboard', () => {
  it('renders dashboard component', async () => {
    render(<TasiyiciDashboard />);
    
    // Check if component renders without crashing
    await waitFor(() => {
      expect(screen.getByText('Taşıyıcı paneli yükleniyor...')).toBeInTheDocument();
    });
  });

  it('displays loading state', async () => {
    render(<TasiyiciDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Taşıyıcı paneli yükleniyor...')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', async () => {
    render(<TasiyiciDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Taşıyıcı paneli yükleniyor...')).toBeInTheDocument();
    });
  });
});
