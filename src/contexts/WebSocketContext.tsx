import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { createApiUrl } from '../config/api';
import { useAuth } from './AuthContext';

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  sendNotification: (targetUserId: string, notification: any) => void;
  sendRoleNotification: (targetRole: string, notification: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(
  undefined
);

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user, token } = useAuth();

  useEffect(() => {
    // Kullanıcı giriş yapmamışsa WebSocket bağlantısı kurma
    if (!user || !token) {
      return;
    }

    // WebSocket bağlantısını kur
    const base = createApiUrl('/').replace(/\/$/, ''); // Remove trailing slash
    const newSocket = io(base, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: {
        token: token,
      },
    });

    newSocket.on('connect', () => {
      console.log('🔌 WebSocket connected');
      setIsConnected(true);

      // Kullanıcı bilgilerini gönder (hem authenticate hem join)
      const userRole = user.role || 'individual';
      newSocket.emit('authenticate', { token });
      newSocket.emit('join', { 
        userId: user.id, 
        userRole: userRole,
        userType: userRole // Backend compatibility
      });

    });

    newSocket.on('disconnect', () => {
      console.log('🔌 WebSocket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', error => {
      console.warn(
        '🔌 WebSocket connection error (continuing without real-time features):',
        error.message
      );
      // Don't set isConnected to false here to avoid repeated error messages
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
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
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
