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
import { useNavigate } from 'react-router-dom';
// WebSocket removed - using REST API polling
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
  metadata?: any;
  linkUrl?: string;
  linkurl?: string;
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
  // WebSocket removed - using REST API polling
  const navigate = useNavigate();

  const fallbackText = (type: string, meta: any) => {
    const t = String(type || '').toLowerCase();
    const shipmentId = meta?.shipmentId ?? meta?.shipment_id ?? meta?.shipment ?? meta?.id;
    if (t.includes('route_plan_updated')) {
      return {
        title: 'Rota güncellendi',
        message: shipmentId ? 'İşi açıp yeni rotayı kontrol et.' : 'Yeni rotayı kontrol et.',
      };
    }
    if (t.includes('new_message') || t.includes('message')) {
      return { title: 'Yeni mesaj', message: 'Mesajlara girip kontrol et.' };
    }
    if (t.includes('offer') || t.includes('bid')) {
      return { title: 'Teklif güncellendi', message: 'Teklif durumunu kontrol et.' };
    }
    if (t.includes('shipment') || t.includes('status')) {
      return {
        title: 'İş durumu güncellendi',
        message: shipmentId ? 'İşi açıp güncel durumu kontrol et.' : 'Güncel durumu kontrol et.',
      };
    }
    return { title: 'Bildirim', message: 'Detay için aç.' };
  };

  const getRoleBase = () => {
    const p = window.location?.pathname || '';
    if (p.startsWith('/tasiyici')) return '/tasiyici';
    if (p.startsWith('/nakliyeci')) return '/nakliyeci';
    if (p.startsWith('/corporate')) return '/corporate';
    if (p.startsWith('/individual')) return '/individual';
    return '';
  };

  const parseMeta = (value: any) => {
    if (!value) return null;
    if (typeof value === 'object') return value;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    }
    return null;
  };

  const resolveAction = (n: Notification) => {
    const base = getRoleBase();
    const meta = parseMeta(n.data) || parseMeta(n.metadata) || null;

    const explicitUrl =
      (meta && (meta.actionUrl || meta.action_url || meta.linkUrl || meta.link_url || meta.url)) ||
      n.linkUrl ||
      (n as any).link_url ||
      (n as any).linkurl;

    if (explicitUrl && typeof explicitUrl === 'string') {
      return { label: 'Aç', to: explicitUrl };
    }

    if (base !== '/tasiyici') {
      return null;
    }

    const shipmentId = meta?.shipmentId ?? meta?.shipment_id ?? meta?.shipment ?? meta?.id;
    const offerId = meta?.offerId ?? meta?.offer_id;
    const t = String(n.type || '').toLowerCase();
    const title = String(n.title || '').toLowerCase();

    if (shipmentId != null && String(shipmentId).length > 0) {
      return { label: 'İşi Aç', to: `/tasiyici/jobs/${encodeURIComponent(String(shipmentId))}` };
    }

    if (offerId != null || t.includes('offer') || title.includes('teklif')) {
      return { label: 'Tekliflerim', to: '/tasiyici/my-offers' };
    }

    if (t.includes('message') || title.includes('mesaj')) {
      return { label: 'Mesajlar', to: '/tasiyici/messages' };
    }

    return null;
  };

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  // WebSocket removed - using REST API polling instead
  // Notifications are refreshed via loadNotifications() which is called periodically

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
        const data = Array.isArray(result?.data)
          ? result.data
          : (Array.isArray(result) ? result : []);
        const normalized = data.map((n: any) => {
          const createdAt = n.created_at ?? n.createdAt ?? n.createdat ?? null;
          const isRead = n.is_read ?? n.isRead ?? n.isread ?? false;

          const meta = n.data ?? n.metadata;
          const parsedMeta = parseMeta(meta);
          const fb = fallbackText(n.type || 'info', parsedMeta);
          const title = String(n.title || '').trim() || fb.title;
          const message = String(n.message || '').trim() || fb.message;

          return {
            ...n,
            title,
            message,
            created_at: createdAt,
            is_read: isRead,
            data: n.data ?? n.metadata,
            metadata: n.metadata,
            linkUrl: n.linkUrl ?? n.link_url ?? n.linkurl,
          } as Notification;
        });
        setNotifications(normalized);
        setUnreadCount(normalized.filter((n: Notification) => !n.is_read).length);
      }
    } catch (error) {
      console.error('Bildirimler yüklenirken hata:', error);
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
          method: 'PUT',
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
        
        // Trigger refresh for sidebar badges and other components
        window.dispatchEvent(new Event('yolnext:refresh-notifications'));
        window.dispatchEvent(new Event('yolnext:refresh-badges'));
      }
    } catch (error) {
      console.error('Bildirim okundu olarak işaretlenirken hata:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        createApiUrl('/api/notifications/mark-all-read'),
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
        
        // Trigger refresh for sidebar badges and other components
        window.dispatchEvent(new Event('yolnext:refresh-notifications'));
        window.dispatchEvent(new Event('yolnext:refresh-badges'));
      }
    } catch (error) {
      console.error('Tüm bildirimler okundu olarak işaretlenirken hata:', error);
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
    if (!dateString) return '—';
    
    const date = new Date(dateString);
    if (!Number.isFinite(date.getTime())) return '—';
    
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return 'Az önce';
    if (diffInMinutes < 60) return `${diffInMinutes} dakika önce`;
    if (diffInMinutes < 1440)
      return `${Math.floor(diffInMinutes / 60)} saat önce`;
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
      <div className='absolute right-0 top-0 h-full w-full sm:w-96 bg-white shadow-xl overflow-hidden flex flex-col'>
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
                      {(() => {
                        const action = resolveAction(notification);
                        if (!action) return null;
                        return (
                          <div className='mt-3 flex justify-end'>
                            <button
                              type='button'
                              onClick={async (e) => {
                                e.stopPropagation();
                                await markAsRead(notification.id);
                                if (action.to) {
                                  navigate(action.to);
                                  onClose();
                                }
                              }}
                              className='px-4 py-2 bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 text-white rounded-lg text-sm font-semibold transition-all duration-200 min-h-[44px]'
                            >
                              {action.label}
                            </button>
                          </div>
                        );
                      })()}
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
