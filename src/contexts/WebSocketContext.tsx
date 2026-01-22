import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { createApiUrl, getApiConfig } from '../config/api';
import { AuthContext } from './AuthContext';

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  sendNotification: (targetUserId: string, notification: any) => void;
  sendRoleNotification: (targetRole: string, notification: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(
  undefined
);

const defaultContextValue: WebSocketContextType = {
  socket: null,
  isConnected: false,
  sendNotification: () => {},
  sendRoleNotification: () => {},
};

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [hasLoggedError, setHasLoggedError] = useState(false);
  const auth = useContext(AuthContext);
  const user = auth?.user;
  const token = auth?.token;

  useEffect(() => {
    // Kullanıcı giriş yapmamışsa WebSocket bağlantısı kurma
    if (!user || !token) {
      return;
    }

    // WebSocket bağlantısını kur - use base URL without /api
    const config = getApiConfig();
    const base = config.baseURL.replace(/\/$/, ''); // Remove trailing slash and /api
    const newSocket = io(base, {
      transports: ['websocket', 'polling'], // Fallback to polling if websocket fails
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 3, // Reduced attempts
      reconnectionDelay: 2000, // Increased delay
      reconnectionDelayMax: 10000, // Max delay
      timeout: 20000, // Increased timeout
      auth: {
        token: token,
      },
    });

    let connectionTimeout: ReturnType<typeof setTimeout>;

    newSocket.on('connect', () => {
      console.log('🔌 WebSocket connected');
      setIsConnected(true);
      setConnectionAttempts(0);
      setHasLoggedError(false);
      clearTimeout(connectionTimeout);

      // Kullanıcı bilgilerini gönder (hem authenticate hem join)
      const userRole = user.role || 'individual';
      newSocket.emit('authenticate', { token });
      newSocket.emit('join', { 
        userId: user.id, 
        userRole: userRole,
        userType: userRole // Backend compatibility
      });
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket disconnected:', reason);
      setIsConnected(false);
      
      // Only attempt reconnection if it's not a manual disconnect
      if (reason === 'io server disconnect') {
        // Server disconnected, don't reconnect
        newSocket.connect();
      }
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      setConnectionAttempts(attemptNumber);
      if (attemptNumber >= 3 && !hasLoggedError) {
        console.warn('🔌 WebSocket reconnection attempts exceeded, disabling real-time features');
        setHasLoggedError(true);
        newSocket.disconnect(); // Stop reconnection attempts
      }
    });

    newSocket.on('connect_error', error => {
      // Only log first error to avoid spam
      if (!hasLoggedError && connectionAttempts === 0) {
        // Check if it's a timeout or connection refused
        if (error.message?.includes('timeout') || error.message?.includes('ECONNREFUSED')) {
          console.warn(
            '🔌 WebSocket connection unavailable (real-time features disabled)'
          );
          setHasLoggedError(true);
          // Disable reconnection after first timeout
          newSocket.io.reconnection(false);
        } else if (!error.message?.includes('Invalid namespace') && !error.message?.includes('Authentication')) {
      console.warn(
            '🔌 WebSocket connection error:',
        error.message
      );
      }
      }
    });

    // Set a timeout to disable reconnection if initial connection fails
    connectionTimeout = setTimeout(() => {
      if (!isConnected && connectionAttempts === 0) {
        console.warn('🔌 WebSocket initial connection timeout, disabling real-time features');
        newSocket.io.reconnection(false);
        setHasLoggedError(true);
      }
    }, 10000); // 10 seconds timeout

    setSocket(newSocket);

    return () => {
      clearTimeout(connectionTimeout);
      newSocket.close();
      setConnectionAttempts(0);
      setHasLoggedError(false);
    };
  }, [user, token]);

  const sendNotification = (targetUserId: string, notification: any) => {
    if (socket && isConnected) {
      socket.emit('send-notification', { targetUserId, notification });
    } else {
      // Silently fail - WebSocket is optional for now
      // console.warn('⚠️ WebSocket not connected, notification not sent:', notification);
    }
  };

  const sendRoleNotification = (targetRole: string, notification: any) => {
    if (socket && isConnected) {
      socket.emit('send-role-notification', { targetRole, notification });
    } else {
      // Silently fail - WebSocket is optional for now
      // console.warn('⚠️ WebSocket not connected, role notification not sent:', notification);
    }
  };

  const value: WebSocketContextType = {
    socket,
    isConnected,
    sendNotification,
    sendRoleNotification,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    return defaultContextValue;
  }
  return context;
};
