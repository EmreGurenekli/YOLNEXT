import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { notificationAPI } from '../../services/apiClient';
import {
  Bell,
  Search,
  CheckCircle,
  AlertTriangle,
  Package,
  Truck,
  DollarSign,
  Settings,
  Trash2,
  CheckCheck,
  Clock,
  Eye,
  EyeOff,
  X,
} from 'lucide-react';

interface Notification {
  id: number;
  userId: string;
  userRole: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'job' | 'payment' | 'system' | 'message' | 'alert';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  isRead: boolean;
  actionUrl?: string;
  actionText?: string;
  createdAt: string;
}

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationModal({
  isOpen,
  onClose,
}: NotificationModalProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const safeDateText = (value: any) => {
    const d = value instanceof Date ? value : new Date(value || '');
    return Number.isFinite(d.getTime()) ? d.toLocaleDateString('tr-TR') : '—';
  };

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const getFn =
        (notificationAPI as any).getNotifications || (notificationAPI as any).getAll;
      const response = getFn ? await getFn() : null;
      const raw =
        (response as any)?.data?.notifications ||
        (response as any)?.data ||
        (response as any)?.notifications ||
        response ||
        [];
      setNotifications(Array.isArray(raw) ? raw : []);
    } catch (error) {
      console.error('Bildirimler yüklenemedi:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error('Bildirim okundu işaretlenemedi:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const markAllFn =
        (notificationAPI as any).markAllAsRead ||
        (notificationAPI as any).markAllAsRead ||
        (notificationAPI as any).markAllAsRead;
      const legacyMarkAllFn = (notificationAPI as any).markAllAsRead;
      const fn = markAllFn || legacyMarkAllFn;
      if (fn) await fn();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Tüm bildirimler okundu işaretlenemedi:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: number) => {
    try {
      const deleteFn =
        (notificationAPI as any).deleteNotification || (notificationAPI as any).delete;
      if (deleteFn) await deleteFn(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Bildirim silinemedi:', error);
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch =
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      filterType === 'all' || notification.category === filterType;
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'unread' && !notification.isRead) ||
      (filterStatus === 'read' && notification.isRead);

    return matchesSearch && matchesType && matchesStatus;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'normal':
        return 'text-blue-600 bg-blue-100';
      case 'low':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type: string, category: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className='w-4 h-4' />;
      case 'info':
        return <Bell className='w-4 h-4' />;
      case 'warning':
        return <AlertTriangle className='w-4 h-4' />;
      case 'error':
        return <AlertTriangle className='w-4 h-4' />;
      default:
        return <Bell className='w-4 h-4' />;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center'>
      {/* Backdrop */}
      <div
        className='absolute inset-0 bg-black/50 backdrop-blur-sm'
        onClick={onClose}
      />

      {/* Modal */}
      <div className='relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] mx-4 flex flex-col'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-200'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center'>
              <Bell className='w-5 h-5 text-blue-600' />
            </div>
            <div>
              <h2 className='text-xl font-bold text-gray-900'>Bildirimler</h2>
              <p className='text-sm text-gray-500'>
                {unreadCount} okunmamış bildirim
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className='w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors'
          >
            <X className='w-5 h-5 text-gray-500' />
          </button>
        </div>

        {/* Filters */}
        <div className='p-6 border-b border-gray-200'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
              <input
                type='text'
                placeholder='Bildirim ara...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              />
            </div>

            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            >
              <option value='all'>Tüm Kategoriler</option>
              <option value='job'>İş</option>
              <option value='payment'>Ödeme</option>
              <option value='system'>Sistem</option>
              <option value='message'>Mesaj</option>
              <option value='alert'>Uyarı</option>
            </select>

            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            >
              <option value='all'>Tüm Durumlar</option>
              <option value='unread'>Okunmamış</option>
              <option value='read'>Okunmuş</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className='p-6 border-b border-gray-200'>
          <div className='flex items-center justify-between'>
            <button
              onClick={handleMarkAllAsRead}
              className='px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2'
            >
              <CheckCheck className='w-4 h-4' />
              Tümünü Okundu İşaretle
            </button>
            <div className='text-sm text-gray-500'>
              {filteredNotifications.length} bildirim gösteriliyor
            </div>
          </div>
        </div>

        {/* Content */}
        <div className='flex-1 overflow-y-auto p-6'>
          {loading ? (
            <div className='flex items-center justify-center h-32'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
            </div>
          ) : filteredNotifications.length > 0 ? (
            <div className='space-y-3'>
              {filteredNotifications.map(notification => (
                <div
                  key={notification.id}
                  className={`bg-white rounded-xl border transition-all hover:shadow-md ${
                    notification.isRead
                      ? 'border-gray-200'
                      : 'border-blue-200 bg-blue-50/30'
                  }`}
                >
                  <div className='p-4'>
                    <div className='flex items-start gap-3'>
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          notification.isRead ? 'bg-gray-100' : 'bg-blue-100'
                        }`}
                      >
                        <div
                          className={
                            notification.isRead
                              ? 'text-gray-600'
                              : 'text-blue-600'
                          }
                        >
                          {getTypeIcon(
                            notification.type,
                            notification.category
                          )}
                        </div>
                      </div>

                      <div className='flex-1 min-w-0'>
                        <div className='flex items-start justify-between mb-2'>
                          <div className='flex items-center gap-2'>
                            <h3
                              className={`text-sm font-semibold ${
                                notification.isRead
                                  ? 'text-gray-900'
                                  : 'text-gray-900'
                              }`}
                            >
                              {notification.title}
                            </h3>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(notification.priority)}`}
                            >
                              {notification.priority === 'urgent'
                                ? 'Acil'
                                : notification.priority === 'high'
                                  ? 'Yüksek'
                                  : notification.priority === 'normal'
                                    ? 'Normal'
                                    : 'Düşük'}
                            </span>
                            {!notification.isRead && (
                              <div className='w-2 h-2 bg-gradient-to-r from-slate-800 to-blue-900 rounded-full'></div>
                            )}
                          </div>
                          <span className='text-xs text-gray-500 flex items-center gap-1'>
                            <Clock className='w-3 h-3' />
                            {safeDateText(
                              (notification as any).createdAt ||
                                (notification as any).created_at ||
                                (notification as any).createdat
                            )}
                          </span>
                        </div>

                        <p className='text-sm text-gray-600 mb-3 line-clamp-2'>
                          {notification.message}
                        </p>

                        {/* Actions */}
                        <div className='flex items-center gap-2'>
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className='px-2 py-1 border border-gray-300 text-gray-700 text-xs rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1'
                          >
                            {notification.isRead ? (
                              <EyeOff className='w-3 h-3' />
                            ) : (
                              <Eye className='w-3 h-3' />
                            )}
                            {notification.isRead ? 'Okundu' : 'Okundu İşaretle'}
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteNotification(notification.id)
                            }
                            className='px-2 py-1 border border-red-300 text-red-700 text-xs rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1'
                          >
                            <Trash2 className='w-3 h-3' />
                            Sil
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='text-center py-12'>
              <Bell className='w-12 h-12 text-gray-300 mx-auto mb-4' />
              <h3 className='text-lg font-medium text-gray-900 mb-2'>
                Bildirim bulunamadı
              </h3>
              <p className='text-gray-500'>
                Arama kriterlerinize uygun bildirim bulunamadı
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}











