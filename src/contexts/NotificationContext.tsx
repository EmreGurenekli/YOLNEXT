import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
} from 'react';
import notificationService from '../services/notificationService';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  persistent?: boolean;
}

interface NotificationState {
  notifications: Notification[];
}

type NotificationAction =
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'CLEAR_ALL_NOTIFICATIONS' };

interface NotificationContextType extends NotificationState {
  addNotification: (notification: Omit<Notification, 'id'>) => string;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  success: (
    title: string,
    message?: string,
    options?: Partial<Notification>
  ) => string;
  error: (
    title: string,
    message?: string,
    options?: Partial<Notification>
  ) => string;
  warning: (
    title: string,
    message?: string,
    options?: Partial<Notification>
  ) => string;
  info: (
    title: string,
    message?: string,
    options?: Partial<Notification>
  ) => string;
  // Push notification methods
  requestPermission: () => Promise<boolean>;
  isEnabled: () => boolean;
  getPermissionStatus: () => NotificationPermission;
  sendPushNotification: (
    userId: string,
    notification: {
      title: string;
      message: string;
      type?: string;
      actionUrl?: string;
    }
  ) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

const notificationReducer = (
  state: NotificationState,
  action: NotificationAction
): NotificationState => {
  switch (action.type) {
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [...state.notifications, action.payload],
      };
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
      };
    case 'CLEAR_ALL_NOTIFICATIONS':
      return {
        ...state,
        notifications: [],
      };
    default:
      return state;
  }
};

const initialState: NotificationState = {
  notifications: [],
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  // Initialize push notifications
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      notificationService.initialize();
    }

    return () => {
      notificationService.disconnect();
    };
  }, []);

  const addNotification = useCallback(
    (notification: Omit<Notification, 'id'>): string => {
      const id = Math.random().toString(36).substr(2, 9);
      const newNotification: Notification = {
        id,
        duration: 5000,
        ...notification,
      };

      dispatch({ type: 'ADD_NOTIFICATION', payload: newNotification });

      // Auto remove after duration (unless persistent)
      if (!newNotification.persistent && newNotification.duration) {
        setTimeout(() => {
          dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
        }, newNotification.duration);
      }

      return id;
    },
    []
  );

  const removeNotification = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  }, []);

  const clearAllNotifications = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL_NOTIFICATIONS' });
  }, []);

  const success = useCallback(
    (title: string, message?: string, options?: Partial<Notification>) => {
      return addNotification({
        type: 'success',
        title,
        message,
        ...options,
      });
    },
    [addNotification]
  );

  const error = useCallback(
    (title: string, message?: string, options?: Partial<Notification>) => {
      return addNotification({
        type: 'error',
        title,
        message,
        duration: 7000, // Longer duration for errors
        ...options,
      });
    },
    [addNotification]
  );

  const warning = useCallback(
    (title: string, message?: string, options?: Partial<Notification>) => {
      return addNotification({
        type: 'warning',
        title,
        message,
        ...options,
      });
    },
    [addNotification]
  );

  const info = useCallback(
    (title: string, message?: string, options?: Partial<Notification>) => {
      return addNotification({
        type: 'info',
        title,
        message,
        ...options,
      });
    },
    [addNotification]
  );

  // Push notification methods
  const requestPermission = useCallback(async () => {
    return await notificationService.requestPermission();
  }, []);

  const isEnabled = useCallback(() => {
    return notificationService.isEnabled;
  }, []);

  const getPermissionStatus = useCallback(() => {
    return notificationService.getPermissionStatus();
  }, []);

  const sendPushNotification = useCallback(
    (
      userId: string,
      notification: {
        title: string;
        message: string;
        type?: string;
        actionUrl?: string;
      }
    ) => {
      notificationService.sendNotification();
    },
    []
  );

  const value: NotificationContextType = {
    ...state,
    addNotification,
    removeNotification,
    clearAllNotifications,
    success,
    error,
    warning,
    info,
    requestPermission,
    isEnabled,
    getPermissionStatus,
    sendPushNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      'useNotification must be used within a NotificationProvider'
    );
  }
  return context;
};
