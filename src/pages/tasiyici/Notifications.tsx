import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle,
  Clock,
  AlertCircle,
  Info,
  Package,
  Truck,
  DollarSign,
  MessageSquare,
  Star,
  Trash2,
  Eye,
  Filter,
  Search,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Breadcrumb from '../../components/common/Breadcrumb';
import LoadingState from '../../components/common/LoadingState';

interface Notification {
  id: string;
  type: 'shipment' | 'payment' | 'offer' | 'message' | 'system' | 'review';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionText?: string;
  metadata?: any;
}

const TasiyiciNotifications: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const userRaw = localStorage.getItem('user');
      const userId = userRaw ? JSON.parse(userRaw || '{}').id : undefined;
      
      const response = await fetch('/api/notifications', {
        headers: {
          Authorization: `Bearer ${token || ''}`,
          'X-User-Id': userId || '',
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const notifs = Array.isArray(data) ? data : (data.data || data.notifications || []);
        setNotifications(notifs);
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error loading notifications:', error);
      toast.error('Bildirimler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token || ''}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => (n.id === id ? { ...n, read: true } : n))
        );
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/notifications/read-all', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token || ''}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        toast.success('Tüm bildirimler okundu olarak işaretlendi');
      }
    } catch (error) {
      toast.error('Bildirimler güncellenemedi');
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token || ''}`,
        },
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id));
        toast.success('Bildirim silindi');
      }
    } catch (error) {
      toast.error('Bildirim silinemedi');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'shipment':
        return <Package className='w-5 h-5' />;
      case 'offer':
        return <DollarSign className='w-5 h-5' />;
      case 'payment':
        return <DollarSign className='w-5 h-5' />;
      case 'message':
        return <MessageSquare className='w-5 h-5' />;
      case 'review':
        return <Star className='w-5 h-5' />;
      default:
        return <Bell className='w-5 h-5' />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'shipment':
        return 'bg-blue-100 text-blue-800';
      case 'offer':
        return 'bg-green-100 text-green-800';
      case 'payment':
        return 'bg-emerald-100 text-emerald-800';
      case 'message':
        return 'bg-purple-100 text-purple-800';
      case 'review':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    const matchesFilter = filter === 'all' || !notif.read;
    const matchesSearch =
      !searchTerm ||
      notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notif.message.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className='min-h-screen bg-white'>
      <Helmet>
        <title>Bildirimler - Taşıyıcı Panel - YolNext</title>
      </Helmet>

      <div className='max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6'>
        {/* Breadcrumb */}
        <div className='mb-4 sm:mb-6'>
          <Breadcrumb items={[{ label: 'Bildirimler', href: '/tasiyici/notifications' }]} />
        </div>

        {/* Hero Section */}
        <div className='relative overflow-hidden bg-gradient-to-br from-slate-800 via-blue-900 to-indigo-900 rounded-3xl p-6 text-white shadow-2xl mb-8'>
          <div className='absolute inset-0 bg-gradient-to-br from-white/5 to-transparent'></div>
          <div className='absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full -translate-y-40 translate-x-40'></div>
          <div className='absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-slate-400/10 to-blue-400/10 rounded-full translate-y-32 -translate-x-32'></div>

          <div className='relative z-10'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-4'>
                <div className='w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-xl border border-white/20'>
                  <Bell className='w-8 h-8 text-white' />
                </div>
                <div>
                  <h1 className='text-3xl font-bold mb-2 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent'>
                    Bildirimler
                  </h1>
                  <p className='text-slate-200 text-lg'>
                    {unreadCount > 0 ? `${unreadCount} okunmamış bildirim` : 'Tüm bildirimler okundu'}
                  </p>
                </div>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className='px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-all duration-300 border border-white/20'
                >
                  Tümünü Okundu İşaretle
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className='bg-white rounded-xl p-4 shadow-lg border border-gray-100 mb-6'>
          <div className='flex flex-col md:flex-row gap-4 items-center justify-between'>
            <div className='flex-1 w-full md:w-auto'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
                <input
                  type='text'
                  placeholder='Bildirim ara...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                />
              </div>
            </div>
            <div className='flex gap-2'>
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  filter === 'all'
                    ? 'bg-gradient-to-r from-slate-800 to-blue-900 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tümü
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${
                  filter === 'unread'
                    ? 'bg-gradient-to-r from-slate-800 to-blue-900 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Eye className='w-4 h-4' />
                Okunmamış ({unreadCount})
              </button>
              <button
                onClick={loadNotifications}
                className='px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-300'
              >
                <RefreshCw className='w-4 h-4' />
              </button>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <div className='bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center'>
            <Bell className='w-16 h-16 text-gray-400 mx-auto mb-4' />
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>
              {filter === 'unread' ? 'Okunmamış bildirim yok' : 'Bildirim bulunmuyor'}
            </h3>
            <p className='text-gray-600'>
              {filter === 'unread'
                ? 'Tüm bildirimleriniz okunmuş durumda.'
                : 'Henüz bildiriminiz bulunmamaktadır.'}
            </p>
          </div>
        ) : (
          <div className='space-y-4'>
            {filteredNotifications.map(notif => (
              <div
                key={notif.id}
                className={`bg-white rounded-xl p-6 shadow-lg border transition-all duration-300 ${
                  notif.read
                    ? 'border-gray-100'
                    : 'border-blue-300 bg-blue-50/50'
                }`}
              >
                <div className='flex items-start gap-4'>
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center ${getNotificationColor(
                      notif.type
                    )}`}
                  >
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className='flex-1'>
                    <div className='flex items-start justify-between mb-2'>
                      <div>
                        <h3 className={`font-bold text-slate-900 ${notif.read ? '' : 'text-lg'}`}>
                          {notif.title}
                        </h3>
                        <p className='text-slate-600 mt-1'>{notif.message}</p>
                        <p className='text-xs text-slate-500 mt-2'>
                          {new Date(notif.timestamp).toLocaleString('tr-TR')}
                        </p>
                      </div>
                      {!notif.read && (
                        <span className='w-2 h-2 bg-blue-600 rounded-full mt-2'></span>
                      )}
                    </div>
                    <div className='flex items-center gap-2 mt-4'>
                      {notif.actionUrl && (
                        <button
                          onClick={() => {
                            markAsRead(notif.id);
                            navigate(notif.actionUrl!);
                          }}
                          className='px-4 py-2 bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 text-white rounded-lg font-medium transition-all duration-300 text-sm shadow-lg hover:shadow-xl'
                        >
                          {notif.actionText || 'Detayları Gör'}
                        </button>
                      )}
                      {!notif.read && (
                        <button
                          onClick={() => markAsRead(notif.id)}
                          className='px-3 py-2 text-sm text-gray-600 hover:text-gray-900'
                        >
                          Okundu İşaretle
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notif.id)}
                        className='ml-auto px-3 py-2 text-sm text-red-600 hover:text-red-700'
                      >
                        <Trash2 className='w-4 h-4' />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TasiyiciNotifications;

