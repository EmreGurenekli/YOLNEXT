import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: number[];
  sendMessage: (data: any) => void;
  joinShipment: (shipmentId: number) => void;
  leaveShipment: (shipmentId: number) => void;
  startTyping: (shipmentId: number) => void;
  stopTyping: (shipmentId: number) => void;
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
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<number[]>([]);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Initialize socket connection
      const newSocket = io('http://localhost:5000', {
        auth: {
          token: localStorage.getItem('authToken')
        },
        transports: ['websocket', 'polling']
      });

      // Connection event handlers
      newSocket.on('connect', () => {
        console.log('✅ Socket connected:', newSocket.id);
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('❌ Socket disconnected');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
      });

      // Real-time event handlers
      newSocket.on('new_shipment', (data) => {
        console.log('📦 New shipment:', data);
        // Handle new shipment notification
        // You can dispatch to a global state or show a toast
      });

      newSocket.on('new_offer', (data) => {
        console.log('💰 New offer:', data);
        // Handle new offer notification
      });

      newSocket.on('offer_status_changed', (data) => {
        console.log('🔄 Offer status changed:', data);
        // Handle offer status change
      });

      newSocket.on('shipment_status_changed', (data) => {
        console.log('📋 Shipment status changed:', data);
        // Handle shipment status change
      });

      newSocket.on('new_message', (data) => {
        console.log('💬 New message:', data);
        // Handle new message
      });

      newSocket.on('message_received', (data) => {
        console.log('📨 Message received:', data);
        // Handle message received
      });

      newSocket.on('user_typing', (data) => {
        console.log('⌨️ User typing:', data);
        // Handle typing indicator
      });

      newSocket.on('user_online', (data) => {
        console.log('🟢 User online:', data);
        setOnlineUsers(prev => [...prev, data.userId]);
      });

      newSocket.on('user_offline', (data) => {
        console.log('🔴 User offline:', data);
        setOnlineUsers(prev => prev.filter(id => id !== data.userId));
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    } else {
      // Disconnect socket if user is not authenticated
      if (socket) {
        socket.close();
        setSocket(null);
        setIsConnected(false);
      }
    }
  }, [isAuthenticated, user]);

  const sendMessage = (data: any) => {
    if (socket && isConnected) {
      socket.emit('send_message', data);
    }
  };

  const joinShipment = (shipmentId: number) => {
    if (socket && isConnected) {
      socket.emit('join_shipment', shipmentId);
    }
  };

  const leaveShipment = (shipmentId: number) => {
    if (socket && isConnected) {
      socket.emit('leave_shipment', shipmentId);
    }
  };

  const startTyping = (shipmentId: number) => {
    if (socket && isConnected) {
      socket.emit('typing_start', { shipmentId });
    }
  };

  const stopTyping = (shipmentId: number) => {
    if (socket && isConnected) {
      socket.emit('typing_stop', { shipmentId });
    }
  };

  const value: SocketContextType = {
    socket,
    isConnected,
    onlineUsers,
    sendMessage,
    joinShipment,
    leaveShipment,
    startTyping,
    stopTyping,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};





