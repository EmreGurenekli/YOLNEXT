import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { createApiUrl } from '../../config/api';

const Inbox: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const token = localStorage.getItem('authToken');
        const res = await fetch(createApiUrl('/api/admin/inbox'), {
          headers: {
            Authorization: `Bearer ${token || ''}`,
            'Content-Type': 'application/json',
          },
        });
        const payload = await res.json().catch(() => null);
        if (!res.ok) {
          const msg = payload?.message || `Inbox yüklenemedi (HTTP ${res.status})`;
          throw new Error(msg);
        }
        const data = payload?.data || payload || {};
        const list = data.items || data.data || data;
        setItems(Array.isArray(list) ? list : Array.isArray(data.items) ? data.items : []);
      } catch (e: any) {
        setError(e?.message || 'Inbox yüklenemedi');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className='min-h-[calc(100vh-56px)] bg-gray-50'>
      <Helmet>
        <title>Inbox - Admin</title>
      </Helmet>

      <div className='container-custom py-6 lg:py-8'>
        <div className='mb-6'>
          <h1 className='text-2xl font-bold text-slate-900'>Inbox</h1>
          <p className='text-slate-600'>Şikayet + Flag + Overdue görevler (otomatik öncelik sırası)</p>
        </div>

        <div className='card p-6'>
          {error && (
            <div className='mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700'>
              {error}
            </div>
          )}

          {loading ? (
            <div className='text-sm text-slate-600'>Yükleniyor...</div>
          ) : items.length === 0 ? (
            <div className='text-sm text-slate-600'>Şu an inbox boş.</div>
          ) : (
            <div className='space-y-3'>
              {items.slice(0, 20).map((it, idx) => (
                <div key={it?.id || idx} className='p-4 bg-gray-50 border border-gray-200 rounded-xl'>
                  <div className='text-sm font-semibold text-slate-900'>
                    {it?.title || it?.type || 'Kayıt'}
                  </div>
                  <div className='text-xs text-slate-600 mt-1'>
                    {it?.summary || 'Detay yok'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inbox;
