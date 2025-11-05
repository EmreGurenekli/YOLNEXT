// @ts-ignore - zustand type definitions may not be available
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { create } from 'zustand';
import { logger } from '../services/logger';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  actionUrl?: string;
  actionText?: string;
  createdAt: string;
  expiresAt?: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}

interface NotificationActions {
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

type NotificationStore = NotificationState & NotificationActions;

export const useNotificationStore = create<NotificationStore>((set: any, get: any) => ({
  // State
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  // Actions
  setNotifications: (notifications: Notification[]) => {
    const unreadCount = notifications.filter(n => !n.isRead).length;
    logger.info('Notifications updated', {
      count: notifications.length,
      unreadCount,
    });
    set({ notifications, unreadCount });
  },

  addNotification: (notification: Notification) => {
    const { notifications } = get();
    const newNotifications = [notification, ...notifications];
    const unreadCount = newNotifications.filter(n => !n.isRead).length;
    logger.info('Notification added', {
      notificationId: notification.id,
      type: notification.type,
    });
    set({ notifications: newNotifications, unreadCount });
  },

  markAsRead: (id: string) => {
    const { notifications } = get();
    const updatedNotifications = notifications.map((notification: any) =>
      notification.id === id ? { ...notification, isRead: true } : notification
    );
    const unreadCount = updatedNotifications.filter((n: any) => !n.isRead).length;
    logger.info('Notification marked as read', { notificationId: id });
    set({ notifications: updatedNotifications, unreadCount });
  },

  markAllAsRead: () => {
    const { notifications } = get();
    const updatedNotifications = notifications.map((notification: any) => ({
      ...notification,
      isRead: true,
    }));
    logger.info('All notifications marked as read');
    set({ notifications: updatedNotifications, unreadCount: 0 });
  },

  removeNotification: (id: string) => {
    const { notifications } = get();
    const filteredNotifications = notifications.filter(
      (notification: any) => notification.id !== id
    );
    const unreadCount = filteredNotifications.filter((n: any) => !n.isRead).length;
    logger.info('Notification removed', { notificationId: id });
    set({ notifications: filteredNotifications, unreadCount });
  },

  clearAll: () => {
    logger.info('All notifications cleared');
    set({ notifications: [], unreadCount: 0 });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setError: (error: string | null) => {
    if (error) {
      logger.error('Notification store error', { error });
    }
    set({ error });
  },

  clearError: () => {
    set({ error: null });
  },
}));

// Selectors
interface NotificationStoreType {
  notifications: any[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}
export const useNotifications = () =>
  useNotificationStore((state: NotificationStoreType) => state.notifications);
export const useUnreadCount = () =>
  useNotificationStore((state: NotificationStoreType) => state.unreadCount);
export const useNotificationLoading = () =>
  useNotificationStore((state: NotificationStoreType) => state.isLoading);
export const useNotificationError = () =>
  useNotificationStore((state: NotificationStoreType) => state.error);
