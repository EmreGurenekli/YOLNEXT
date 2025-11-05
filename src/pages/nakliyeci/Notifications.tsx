import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Bell, CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react';

const NakliyeciNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('authToken');
        const userRaw = localStorage.getItem('user');
        const userId = userRaw ? JSON.parse(userRaw || '{}').id : '';
        const res = await fetch('/api/notifications', {
          headers: {
            Authorization: `Bearer ${token || ''}`,
            'X-User-Id': userId,
            'Content-Type': 'application/json',
          },
        });
        const data = await res.json().catch(() => ([]));
        const list = Array.isArray(data) ? data : (data.data || data.notifications || []);
        setNotifications(list);
      } catch (e) {
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className='min-h-screen bg-gray-50'>
      <Helmet>
        <title>Bildirimler - Nakliyeci Panel - YolNext</title>
      </Helmet>

      <div className='max-w-7xl mx-auto px-4 py-8'>
        <div className='bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6'>
          <div className='flex items-center justify-between mb-6'>
            <div>
              <h1 className='text-2xl font-bold text-gray-900 mb-2'>
                Bildirimler
              </h1>
              <p className='text-gray-600'>
                Sistem bildirimleri ve güncellemeler
              </p>
            </div>
            <div className='px-4 py-2 bg-red-100 text-red-800 rounded-lg'>
              {notifications.filter(n => !n.read).length} okunmamış
            </div>
          </div>

          <div className='space-y-3'>
            {loading ? (
              <div className='text-gray-600'>Yükleniyor...</div>
            ) : notifications.length === 0 ? (
              <div className='text-gray-600'>Bildirim yok</div>
            ) : notifications.map((notification: any) => (
              <div
                key={notification.id}
                className={`flex items-start gap-4 p-4 rounded-lg border ${
                  notification.read
                    ? 'bg-white border-gray-200'
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div
                  className={`p-2 rounded-lg ${
                    notification.type === 'success'
                      ? 'bg-green-100'
                      : notification.type === 'warning'
                        ? 'bg-yellow-100'
                        : notification.type === 'info'
                          ? 'bg-blue-100'
                          : 'bg-red-100'
                  }`}
                >
                  {notification.type === 'success' && (
                    <CheckCircle className='w-5 h-5 text-green-600' />
                  )}
                  {notification.type === 'warning' && (
                    <AlertCircle className='w-5 h-5 text-yellow-600' />
                  )}
                  {notification.type === 'info' && (
                    <Bell className='w-5 h-5 text-blue-600' />
                  )}
                </div>
                <div className='flex-1'>
                  <h3 className='font-semibold text-gray-900'>
                    {notification.title}
                  </h3>
                  <p className='text-sm text-gray-600 mt-1'>
                    {notification.message}
                  </p>
                  {notification.timestamp && (
                    <p className='text-xs text-gray-500 mt-2'>
                      {new Date(notification.timestamp).toLocaleString('tr-TR')}
                    </p>
                  )}
                </div>
                {!notification.read && (
                  <div className='w-2 h-2 bg-blue-600 rounded-full mt-2'></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NakliyeciNotifications;
