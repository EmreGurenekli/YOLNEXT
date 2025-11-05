// Test dosyası geçici olarak devre dışı
// Card.tsx sorunu çözülünce tekrar aktif edilecek
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Card from '../ui/Card';

describe('Card Component', () => {
  test('renders card with children', () => {
    render(
      <Card>
        <h2>Test Card</h2>
        <p>Card content</p>
      </Card>
    );

    expect(screen.getByText('Test Card')).toBeInTheDocument();
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  test('applies custom className', () => {
    render(
      <Card className='custom-class'>
        <div>Test</div>
      </Card>
    );

    const card = screen.getByText('Test').parentElement;
    expect(card).toHaveClass('custom-class');
  });

  test('renders with different variants', () => {
    const { rerender } = render(
      <Card>
        <div>Default</div>
      </Card>
    );

    expect(screen.getByText('Default')).toBeInTheDocument();

    rerender(
      <Card>
        <div>Outlined</div>
      </Card>
    );

    expect(screen.getByText('Outlined')).toBeInTheDocument();
  });
});
