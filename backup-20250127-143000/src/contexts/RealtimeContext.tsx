import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface RealtimeContextType {
  socket: any | null;
  isConnected: boolean;
  notifications: Notification[];
  messages: Message[];
  sendMessage: (message: Message) => void;
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
}

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  actionUrl?: string;
}

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  shipmentId?: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

interface RealtimeProviderProps {
  children: ReactNode;
}

export const RealtimeProvider: React.FC<RealtimeProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<any | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    // WebSocket bağlantısı devre dışı - Backend çalışmıyor
    console.log('WebSocket bağlantısı devre dışı bırakıldı');
    setIsConnected(false);
    
    // Mock data for development
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'info',
        title: 'Yeni Teklif',
        message: 'Gönderiniz için yeni teklif alındı',
        timestamp: new Date(),
        isRead: false
      },
      {
        id: '2',
        type: 'success',
        title: 'Gönderi Teslim Edildi',
        message: 'Gönderiniz başarıyla teslim edildi',
        timestamp: new Date(Date.now() - 3600000),
        isRead: false
      }
    ];
    setNotifications(mockNotifications);

    const mockMessages: Message[] = [
      {
        id: '1',
        senderId: 'carrier1',
        receiverId: 'user1',
        shipmentId: 'shipment1',
        content: 'Gönderiniz yolda, yakında teslim edilecek',
        timestamp: new Date(),
        isRead: false
      }
    ];
    setMessages(mockMessages);
  }, []);

  const sendMessage = (message: Message) => {
    // Mock function - gerçek WebSocket bağlantısı yok
    console.log('Mock message sent:', message);
    setMessages(prev => [message, ...prev]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const value: RealtimeContextType = {
    socket,
    isConnected,
    notifications,
    messages,
    sendMessage,
    markNotificationAsRead,
    clearNotifications
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = (): RealtimeContextType => {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};