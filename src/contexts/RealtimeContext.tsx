import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';

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

const RealtimeContext = createContext<RealtimeContextType | undefined>(
  undefined
);

interface RealtimeProviderProps {
  children: ReactNode;
}

export const RealtimeProvider: React.FC<RealtimeProviderProps> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('authToken');
    if (token) {
      setIsConnected(true);
    } else {
      setIsConnected(false);
    }
  }, []);

  const sendMessage = (message: Message) => {
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
    socket: null,
    isConnected,
    notifications,
    messages,
    sendMessage,
    markNotificationAsRead,
    clearNotifications,
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
    throw new Error('useRealtime bir RealtimeProvider içinde kullanılmalıdır');
  }
  return context;
};
