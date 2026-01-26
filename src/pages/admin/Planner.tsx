import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { createApiUrl } from '../../config/api';

const Planner: React.FC = () => {
  const token = useMemo(() => localStorage.getItem('token') || localStorage.getItem('authToken') || '', []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rows, setRows] = useState<any[]>([]);

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const qs = new URLSearchParams();
      qs.set('limit', '200');
      const res = await fetch(createApiUrl(`/api/admin/tasks?${qs.toString()}`), {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) throw new Error(payload?.message || `Görevler yüklenemedi (HTTP ${res.status})`);
      setRows(Array.isArray(payload?.data) ? payload.data : []);
    } catch (e: any) {
      setRows([]);
      setError(e?.message || 'Görevler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className='min-h-[calc(100vh-56px)] bg-gray-50'>
      <Helmet>
        <title>Görevler - Admin</title>
      </Helmet>

      <div className='container-custom py-6 lg:py-8'>
        <div className='mb-6'>
          <h1 className='text-2xl font-bold text-slate-900'>Görevler</h1>
          <p className='text-slate-600'>Atama + öncelik + SLA</p>
        </div>

        <div className='card p-6'>
          {error && (
            <div className='mb-4 p-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700'>
              {error}
            </div>
          )}

          {loading ? (
            <div className='text-sm text-slate-600'>Yükleniyor…</div>
          ) : rows.length === 0 ? (
            <div className='text-sm text-slate-600'>Kayıt yok.</div>
          ) : (
            <div className='overflow-x-auto'>
              <table className='min-w-full text-sm'>
                <thead>
                  <tr className='text-left text-xs uppercase tracking-wide text-slate-500 border-b'>
                    <th className='py-2 pr-4'>ID</th>
                    <th className='py-2 pr-4'>Başlık</th>
                    <th className='py-2 pr-4'>Durum</th>
                    <th className='py-2 pr-0'>Tarih</th>
                  </tr>
                </thead>
                <tbody className='divide-y'>
                  {rows.map((r: any, idx: number) => (
                    <tr key={String(r.id || idx)} className='hover:bg-slate-50'>
                      <td className='py-3 pr-4 font-mono text-xs text-slate-700'>{r.id ?? '—'}</td>
                      <td className='py-3 pr-4 text-slate-900 font-semibold'>{r.title || r.name || '—'}</td>
                      <td className='py-3 pr-4 text-slate-700'>{r.status || '—'}</td>
                      <td className='py-3 pr-0 text-slate-700'>
                        {String(r.created_at || r.createdAt || '').replace('T', ' ').slice(0, 16) || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Planner;











