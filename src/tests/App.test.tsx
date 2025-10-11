import { describe, it, expect, vi } from 'vitest';
import { render, screen } from './utils';
import App from '../App';

// Mock all the context providers
vi.mock('../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    user: null,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    isLoading: false,
    error: null
  }),
}));

vi.mock('../contexts/ThemeContext', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
  useTheme: () => ({ theme: 'light', toggleTheme: vi.fn() }),
}));

vi.mock('../contexts/NotificationContext', () => ({
  NotificationProvider: ({ children }: { children: React.ReactNode }) => children,
  useNotification: () => ({
    notifications: [],
    addNotification: vi.fn(),
    removeNotification: vi.fn(),
    clearNotifications: vi.fn(),
  }),
}));

vi.mock('../contexts/SocketContext', () => ({
  SocketProvider: ({ children }: { children: React.ReactNode }) => children,
  useSocket: () => ({
    socket: null,
    isConnected: false,
    connect: vi.fn(),
    disconnect: vi.fn(),
  }),
}));

vi.mock('../contexts/RealtimeContext', () => ({
  RealtimeProvider: ({ children }: { children: React.ReactNode }) => children,
  useRealtime: () => ({
    isConnected: false,
    connect: vi.fn(),
    disconnect: vi.fn(),
  }),
}));

vi.mock('../contexts/SecurityContext', () => ({
  SecurityProvider: ({ children }: { children: React.ReactNode }) => children,
  useSecurity: () => ({
    isSecure: true,
    checkSecurity: vi.fn(),
  }),
}));

vi.mock('../contexts/ToastContext', () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => children,
  useToast: () => ({
    showToast: vi.fn(),
    hideToast: vi.fn(),
    clearAllToasts: vi.fn(),
  }),
}));

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    
    // Check if the app renders without throwing errors
    expect(document.body).toBeInTheDocument();
  });
});
