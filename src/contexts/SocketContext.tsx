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
    // WebSocket bağlantısını devre dışı bırak
    console.log('WebSocket bağlantısı devre dışı bırakıldı');
    setIsConnected(false);


  }, []);

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





