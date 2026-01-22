import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe } from '@jest/globals';
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
      <Card className="custom-class">
        <p>Custom card</p>
      </Card>
    );
    const card = screen.getByText('Custom card').parentElement;
    expect(card).toHaveClass('custom-class');
  });

  test('renders with title', () => {
    render(<Card title="Test Title">Card content</Card>);
    const root = screen.getByText('Card content');
    expect(root).toHaveAttribute('title', 'Test Title');
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });
});
