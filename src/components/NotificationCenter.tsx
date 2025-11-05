import React, { useState, useEffect } from 'react';
import {
  Bell,
  X,
  Check,
  CheckCheck,
  AlertCircle,
  Info,
  CheckCircle,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { useWebSocket } from '../contexts/WebSocketContext';
import { createApiUrl } from '../config/api';

interface Notification {
  id: number;
  title: string;
  message: string;
  type:
    | 'info'
    | 'success'
    | 'warning'
    | 'error'
    | 'status_update'
    | 'offer_accepted'
    | 'offer_rejected'
    | 'shipment_delivered'
    | 'shipment_cancelled';
  is_read: boolean;
  created_at: string;
  sender_name?: string;
  data?: any;
  priority?: 'low' | 'medium' | 'high';
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationCenter({
  isOpen,
  onClose,
}: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { socket, isConnected } = useWebSocket();

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  // WebSocket bildirimlerini dinle
  useEffect(() => {
    if (socket && isConnected) {
      socket.on('notification', notification => {
        console.log('🔔 Yeni bildirim alındı:', notification);

        // Bildirimi listeye ekle
        const newNotification: Notification = {
          id: Date.now(), // Geçici ID
          title: notification.title,
          message: notification.message,
          type: notification.type || 'info',
          is_read: false,
          created_at: new Date().toISOString(),
          priority: notification.priority || 'medium',
        };

        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);

        // Browser bildirimi göster
        if (Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico',
          });
        }
      });

      return () => {
        socket.off('notification');
      };
    }
  }, [socket, isConnected]);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(createApiUrl('/api/notifications'), {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        const data = result.data || result;
        setNotifications(data);
        setUnreadCount(data.filter((n: Notification) => !n.is_read).length);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        createApiUrl(`/api/notifications/${id}/read`),
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        createApiUrl('/api/notifications/mark-all-read'),
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
      case 'offer_accepted':
      case 'shipment_delivered':
        return <CheckCircle className='w-5 h-5 text-green-500' />;
      case 'warning':
        return <AlertTriangle className='w-5 h-5 text-yellow-500' />;
      case 'error':
      case 'offer_rejected':
      case 'shipment_cancelled':
        return <AlertCircle className='w-5 h-5 text-red-500' />;
      case 'status_update':
        return <Clock className='w-5 h-5 text-blue-500' />;
      default:
        return <Info className='w-5 h-5 text-blue-500' />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return 'Az önce';
    if (diffInMinutes < 60) return `${diffInMinutes} dakika önce`;
    if (diffInMinutes < 1440)
      return `${Math.floor(diffInMinutes / 60)} saat önce`;
    return date.toLocaleDateString('tr-TR');
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 overflow-hidden'>
      {/* Backdrop */}
      <div
        className='absolute inset-0 bg-black bg-opacity-50'
        onClick={onClose}
      />

      {/* Panel */}
      <div className='absolute right-0 top-0 h-full w-96 bg-white shadow-xl'>
        {/* Header */}
        <div className='flex items-center justify-between p-4 border-b border-gray-200'>
          <div className='flex items-center gap-2'>
            <Bell className='w-5 h-5 text-gray-600' />
            <h2 className='text-lg font-semibold text-gray-900'>Bildirimler</h2>
            {unreadCount > 0 && (
              <span className='bg-red-500 text-white text-xs rounded-full px-2 py-1'>
                {unreadCount}
              </span>
            )}
          </div>
          <div className='flex items-center gap-2'>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className='text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1'
              >
                <CheckCheck className='w-4 h-4' />
                Tümünü okundu işaretle
              </button>
            )}
            <button onClick={onClose} className='min-w-[44px] min-h-[44px] p-1 hover:bg-gray-100 rounded flex items-center justify-center' aria-label='Kapat'>
              <X className='w-5 h-5 text-gray-600' />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className='flex-1 overflow-y-auto'>
          {isLoading ? (
            <div className='flex items-center justify-center p-8'>
              <div className='w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin' />
            </div>
          ) : notifications.length === 0 ? (
            <div className='flex flex-col items-center justify-center p-8 text-center'>
              <Bell className='w-12 h-12 text-gray-300 mb-4' />
              <p className='text-gray-500'>Henüz bildirim yok</p>
            </div>
          ) : (
            <div className='divide-y divide-gray-200'>
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer ${
                    !notification.is_read
                      ? 'bg-blue-50 border-l-4 border-l-blue-500'
                      : ''
                  } ${
                    notification.priority === 'high'
                      ? 'bg-red-50 border-l-red-500'
                      : notification.priority === 'medium'
                        ? 'bg-yellow-50 border-l-yellow-500'
                        : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className='flex items-start gap-3'>
                    <div className='flex-shrink-0 mt-1'>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center justify-between'>
                        <h3 className='text-sm font-medium text-gray-900'>
                          {notification.title}
                        </h3>
                        {!notification.is_read && (
                          <div className='w-2 h-2 bg-blue-500 rounded-full' />
                        )}
                      </div>
                      <p className='text-sm text-gray-600 mt-1'>
                        {notification.message}
                      </p>
                      <div className='flex items-center justify-between mt-2'>
                        <div className='flex items-center gap-1 text-xs text-gray-500'>
                          <Clock className='w-3 h-3' />
                          {formatTime(notification.created_at)}
                        </div>
                        {notification.sender_name && (
                          <span className='text-xs text-gray-500'>
                            {notification.sender_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
