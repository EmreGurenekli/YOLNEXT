import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Input from '../ui/Input';

describe('Input Component', () => {
  test('renders input with label', () => {
    render(<Input label='Test Input' id='test-input' />);
    expect(screen.getByLabelText('Test Input')).toBeInTheDocument();
  });

  test('handles input changes', () => {
    const handleChange = jest.fn();
    render(<Input onChange={handleChange} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test value' } });

    expect(handleChange).toHaveBeenCalled();
    expect(input).toHaveValue('test value');
  });

  test('shows error message when error prop is provided', () => {
    render(<Input error='This field is required' />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  test('applies disabled state correctly', () => {
    render(<Input disabled />);
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  test('renders with placeholder', () => {
    render(<Input placeholder='Enter your name' />);
    expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();
  });
});
