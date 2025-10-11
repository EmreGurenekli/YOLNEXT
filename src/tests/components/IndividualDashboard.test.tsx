import React from 'react';
import { screen } from '@testing-library/react';
import { render } from '../utils';
import IndividualDashboard from '../../pages/individual/Dashboard';

import { vi } from 'vitest';

describe('IndividualDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dashboard component', () => {
    render(<IndividualDashboard />);
    
    // Check if component renders without crashing
    expect(screen.getByText('Dashboard yükleniyor...')).toBeInTheDocument();
  });

  it('displays breadcrumb navigation', () => {
    render(<IndividualDashboard />);
    
    expect(screen.getAllByText('Ana Sayfa')).toHaveLength(2);
  });

  it('shows loading state initially', () => {
    render(<IndividualDashboard />);
    
    expect(screen.getByText('Dashboard yükleniyor...')).toBeInTheDocument();
  });
});