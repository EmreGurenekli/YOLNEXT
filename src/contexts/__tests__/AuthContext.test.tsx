import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, jest, beforeEach } from '@jest/globals';
import { AuthProvider, useAuth } from '../AuthContext';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock fetch
global.fetch = jest.fn() as any;

const TestComponent = () => {
  const { user, login, logout, updateUser } = useAuth();
  return (
    <div>
      <div data-testid="user-info">{user?.fullName || 'No user'}</div>
      <button onClick={() => login('test@example.com', 'password')}>
        Login
      </button>
      <button onClick={logout}>Logout</button>
      <button onClick={() => updateUser({ fullName: 'Updated User' })}>
        Update User
      </button>
    </div>
  );
};

const renderWithProvider = () => {
  return render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (localStorageMock.getItem as unknown as jest.Mock).mockImplementation((key: any) => {
      if (key === 'user') return null;
      if (key === 'authToken') return null;
      return null;
    });
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  it('provides default user state', () => {
    renderWithProvider();
    expect(screen.getByTestId('user-info')).toHaveTextContent('No user');
  });

  it('loads user from localStorage on mount', () => {
    const mockUser = { id: '1', fullName: 'Test User', email: 'test@example.com', role: 'individual' };
    (localStorageMock.getItem as unknown as jest.Mock).mockImplementation((key: any) => {
      if (key === 'user') return JSON.stringify(mockUser);
      if (key === 'authToken') return null;
      return null;
    });

    renderWithProvider();
    expect(screen.getByTestId('user-info')).toHaveTextContent('Test User');
  });

  it('handles login successfully', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        success: true,
        token: 'mock-token',
        user: { id: '1', fullName: 'Test User', email: 'test@example.com', role: 'individual' },
      }),
    };
    (fetch as any).mockResolvedValue(mockResponse);

    renderWithProvider();

    fireEvent.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(screen.getByTestId('user-info')).toHaveTextContent('Test User');
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'authToken',
      'mock-token'
    );
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'user',
      expect.any(String)
    );
  });

  it('handles login failure', async () => {
    const mockResponse = {
      ok: false,
      json: async () => ({
        success: false,
        message: 'Invalid credentials',
      }),
    };
    (fetch as any).mockResolvedValue(mockResponse);

    renderWithProvider();

    fireEvent.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(screen.getByTestId('user-info')).toHaveTextContent('No user');
    });
  });

  it('handles logout', () => {
    (localStorageMock.getItem as unknown as jest.Mock).mockImplementation((key: any) => {
      if (key === 'user') return JSON.stringify({ id: '1', fullName: 'Test User', role: 'individual' });
      if (key === 'authToken') return 'mock-token';
      return null;
    });

    renderWithProvider();

    fireEvent.click(screen.getByText('Logout'));

    expect(screen.getByTestId('user-info')).toHaveTextContent('No user');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
  });

  it('updates user information', () => {
    (localStorageMock.getItem as unknown as jest.Mock).mockImplementation((key: any) => {
      if (key === 'user') return JSON.stringify({ id: '1', fullName: 'Test User', role: 'individual' });
      if (key === 'authToken') return 'mock-token';
      return null;
    });

    renderWithProvider();

    fireEvent.click(screen.getByText('Update User'));

    expect(screen.getByTestId('user-info')).toHaveTextContent('Updated User');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('user', expect.any(String));
  });

  it('handles network errors during login', async () => {
    (fetch as any).mockRejectedValue(new Error('Network error'));

    renderWithProvider();

    fireEvent.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(screen.getByTestId('user-info')).toHaveTextContent('No user');
    });
  });

  it('maintains user state across re-renders', () => {
    const mockUser = { id: '1', fullName: 'Test User', email: 'test@example.com', role: 'individual' };
    (localStorageMock.getItem as unknown as jest.Mock).mockImplementation((key: any) => {
      if (key === 'user') return JSON.stringify(mockUser);
      if (key === 'authToken') return null;
      return null;
    });

    const { rerender } = renderWithProvider();

    expect(screen.getByTestId('user-info')).toHaveTextContent('Test User');

    rerender(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('user-info')).toHaveTextContent('Test User');
  });

  it('handles malformed localStorage data', () => {
    (localStorageMock.getItem as unknown as jest.Mock).mockImplementation((key: any) => {
      if (key === 'user') return 'invalid-json';
      if (key === 'authToken') return null;
      return null;
    });

    renderWithProvider();

    expect(screen.getByTestId('user-info')).toHaveTextContent('No user');
  });

  it('provides context to nested components', () => {
    const NestedComponent = () => {
      const { user } = useAuth();
      return <div data-testid="nested-user">{user?.fullName || 'No user'}</div>;
    };

    const NestedTestComponent = () => (
      <AuthProvider>
        <TestComponent />
        <NestedComponent />
      </AuthProvider>
    );

    render(<NestedTestComponent />);

    expect(screen.getByTestId('nested-user')).toHaveTextContent('No user');
  });

  it('handles concurrent login attempts', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        success: true,
        token: 'mock-token',
        user: { id: '1', fullName: 'Test User', email: 'test@example.com', role: 'individual' },
      }),
    };

    (fetch as any).mockResolvedValue(mockResponse);

    renderWithProvider();

    const loginButton = screen.getByText('Login');
    fireEvent.click(loginButton);
    fireEvent.click(loginButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('user-info')).toHaveTextContent('Test User');
    });
    
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});