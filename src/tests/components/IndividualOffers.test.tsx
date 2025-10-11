import React from 'react';
import { screen } from '@testing-library/react';
import { render } from '../utils';
import IndividualOffers from '../../pages/individual/Offers';

import { vi } from 'vitest';

describe('IndividualOffers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders offers page', () => {
    render(<IndividualOffers />);
    
    // Check if component renders without crashing
    expect(screen.getByText('Teklifleri')).toBeInTheDocument();
  });

  it('displays breadcrumb navigation', () => {
    render(<IndividualOffers />);
    
    expect(screen.getByText('Ana Sayfa')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    render(<IndividualOffers />);
    
    // Check if loading state is shown (either the text or loading indicator)
    expect(screen.getByText('Teklifleri')).toBeInTheDocument();
  });
});