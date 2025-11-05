import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import socketService from '../services/socket';
import { useAuth } from './AuthContext';

interface SocketContextType {
  isConnected: boolean;
  onlineUsers: number[];
  sendMessage: (data: any) => void;
  joinShipment: (shipmentId: number) => void;
  leaveShipment: (shipmentId: number) => void;
  startTyping: (shipmentId: number) => void;
  stopTyping: (shipmentId: number) => void;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<number[]>([]);

  useEffect(() => {
    // Feature flag: disable sockets unless explicitly enabled
    const socketsEnabled = import.meta.env.VITE_ENABLE_SOCKET === 'true';
    if (!socketsEnabled) {
      disconnect();
      return;
    }
    const token = localStorage.getItem('authToken');
    if (token) {
      connect();
    } else {
      disconnect();
    }
  }, []);

  const connect = async () => {
    const socketsEnabled = import.meta.env.VITE_ENABLE_SOCKET === 'true';
    if (!socketsEnabled) {
      setIsConnected(false);
      return;
    }
    try {
      // Connect to Socket.IO server (başarısız olsa bile devam et)
      await socketService
        .connect(localStorage.getItem('authToken') || '')
        .catch(() => {
          if (import.meta.env.DEV) {
            console.log('Socket bağlantısı atlandı (demo mod)');
          }
        });
      setIsConnected(true);

      // Set up event listeners
      socketService.onNewMessage(data => {
        if (import.meta.env.DEV) {
          console.log('📨 New message received:', data);
        }
        // You can dispatch this to a notification context or show a toast
      });

      socketService.onNewOffer(data => {
        if (import.meta.env.DEV) {
          console.log('💰 New offer received:', data);
        }
        // Handle new offer notification
      });

      socketService.onShipmentUpdate(data => {
        if (import.meta.env.DEV) {
          console.log('📦 Shipment update received:', data);
        }
        // Handle shipment status change
      });

      socketService.onNotification(data => {
        if (import.meta.env.DEV) {
          console.log('🔔 Notification received:', data);
        }
        // Handle notification
      });

      socketService.onError(error => {
        if (import.meta.env.DEV) {
          console.error('Socket error:', error);
        }
        setIsConnected(false);
      });

      if (import.meta.env.DEV) {
        console.log('✅ Socket connected successfully');
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Socket connection failed:', error);
      }
      setIsConnected(false);
    }
  };

  const disconnect = () => {
    socketService.disconnect();
    setIsConnected(false);
  };

  // Socket.IO temporarily disabled
  // useEffect(() => {
  //   if (isAuthenticated && user) {
  //     // Initialize socket connection
  //     const newSocket = io('http://localhost:5000', {
  //       auth: {
  //         token: localStorage.getItem('authToken')
  //       },
  //       transports: ['websocket', 'polling']
  //     });

  //     // Connection event handlers
  //     newSocket.on('connect', () => {
  //       console.log('✅ Socket connected:', newSocket.id);
  //       setIsConnected(true);
  //     });

  //     newSocket.on('disconnect', () => {
  //       console.log('❌ Socket disconnected');
  //       setIsConnected(false);
  //     });

  //     newSocket.on('connect_error', (error) => {
  //       console.error('Socket connection error:', error);
  //       setIsConnected(false);
  //     });

  //     // Real-time event handlers
  //     newSocket.on('new_shipment', (data) => {
  //       console.log('📦 New shipment:', data);
  //       // Handle new shipment notification
  //       // You can dispatch to a global state or show a toast
  //     });

  //     newSocket.on('new_offer', (data) => {
  //       console.log('💰 New offer:', data);
  //       // Handle new offer notification
  //     });

  //     newSocket.on('offer_status_changed', (data) => {
  //       console.log('🔄 Offer status changed:', data);
  //       // Handle offer status change
  //     });

  //     newSocket.on('shipment_status_changed', (data) => {
  //       console.log('📋 Shipment status changed:', data);
  //       // Handle shipment status change
  //     });

  //     newSocket.on('new_message', (data) => {
  //       console.log('💬 New message:', data);
  //       // Handle new message
  //     });

  //     newSocket.on('message_received', (data) => {
  //       console.log('📨 Message received:', data);
  //       // Handle message received
  //     });

  //     newSocket.on('user_typing', (data) => {
  //       console.log('⌨️ User typing:', data);
  //       // Handle typing indicator
  //     });

  //     newSocket.on('user_online', (data) => {
  //       console.log('🟢 User online:', data);
  //       setOnlineUsers(prev => [...prev, data.userId]);
  //     });

  //     newSocket.on('user_offline', (data) => {
  //       console.log('🔴 User offline:', data);
  //       setOnlineUsers(prev => prev.filter(id => id !== data.userId));
  //     });

  //     setSocket(newSocket);

  //     return () => {
  //       newSocket.close();
  //     };
  //   } else {
  //     // Disconnect socket if user is not authenticated
  //     if (socket) {
  //       socket.close();
  //       setSocket(null);
  //       setIsConnected(false);
  //     }
  //   }
  // }, [isAuthenticated, user]);

  const sendMessage = (data: any) => {
    if (isConnected) {
      socketService.sendMessage(data.roomId, data.message, data.type);
    }
  };

  const joinShipment = (shipmentId: number) => {
    if (isConnected) {
      socketService.joinShipmentRoom(shipmentId.toString());
    }
  };

  const leaveShipment = (shipmentId: number) => {
    if (isConnected) {
      socketService.leaveShipmentRoom(shipmentId.toString());
    }
  };

  const startTyping = (shipmentId: number) => {
    if (isConnected) {
      socketService.emit('typing_start', { shipmentId });
    }
  };

  const stopTyping = (shipmentId: number) => {
    if (isConnected) {
      socketService.emit('typing_stop', { shipmentId });
    }
  };

  const value: SocketContextType = {
    isConnected,
    onlineUsers,
    sendMessage,
    joinShipment,
    leaveShipment,
    startTyping,
    stopTyping,
    connect,
    disconnect,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
