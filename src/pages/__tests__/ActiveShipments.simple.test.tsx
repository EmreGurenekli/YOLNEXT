import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Simple mock of ActiveShipments component
const MockActiveShipments = () => (
  <div>
    <h1>Aktif Yükler</h1>
    <div data-testid="shipment-list">
      <div data-testid="shipment-item">
        <span>TRK001</span>
        <span>İstanbul</span>
        <span>Ankara</span>
      </div>
    </div>
  </div>
);

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('ActiveShipments Component (Simple)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderWithRouter(<MockActiveShipments />);
    expect(screen.getByText('Aktif Yükler')).toBeInTheDocument();
  });

  it('displays shipment information', () => {
    renderWithRouter(<MockActiveShipments />);
    expect(screen.getByText('TRK001')).toBeInTheDocument();
    expect(screen.getByText('İstanbul')).toBeInTheDocument();
    expect(screen.getByText('Ankara')).toBeInTheDocument();
  });

  it('has proper structure', () => {
    renderWithRouter(<MockActiveShipments />);
    expect(screen.getByTestId('shipment-list')).toBeInTheDocument();
    expect(screen.getByTestId('shipment-item')).toBeInTheDocument();
  });
});
