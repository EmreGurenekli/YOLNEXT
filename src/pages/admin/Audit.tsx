import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { createApiUrl } from '../../config/api';

const Audit: React.FC = () => {
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
      const res = await fetch(createApiUrl(`/api/admin/audit?${qs.toString()}`), {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) throw new Error(payload?.message || `Audit yüklenemedi (HTTP ${res.status})`);
      setRows(Array.isArray(payload?.data) ? payload.data : []);
    } catch (e: any) {
      setRows([]);
      setError(e?.message || 'Audit yüklenemedi');
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
        <title>Audit - Admin</title>
      </Helmet>

      <div className='container-custom py-6 lg:py-8'>
        <div className='mb-6'>
          <h1 className='text-2xl font-bold text-slate-900'>Audit</h1>
          <p className='text-slate-600'>Kim ne yaptı (okuma ekranı)</p>
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
                    <th className='py-2 pr-4'>Tarih</th>
                    <th className='py-2 pr-4'>Action</th>
                    <th className='py-2 pr-4'>Kullanıcı</th>
                    <th className='py-2 pr-4'>Kaynak</th>
                    <th className='py-2 pr-0'>Detay</th>
                  </tr>
                </thead>
                <tbody className='divide-y'>
                  {rows.map((r: any, idx: number) => (
                    <tr key={String(r.id || idx)} className='hover:bg-slate-50'>
                      <td className='py-3 pr-4 text-slate-700 font-mono text-xs'>
                        {String(r.created_at || r.createdAt || '').replace('T', ' ').slice(0, 16) || '—'}
                      </td>
                      <td className='py-3 pr-4 text-slate-900 font-semibold'>{r.action || '—'}</td>
                      <td className='py-3 pr-4 text-slate-700'>{r.user_id ?? r.userId ?? '—'}</td>
                      <td className='py-3 pr-4 text-slate-700'>
                        {(r.resource_type || r.resourceType || '—') + (r.resource_id ? `:${r.resource_id}` : '')}
                      </td>
                      <td className='py-3 pr-0 text-slate-700'>
                        <span className='text-xs text-slate-500'>
                          {r.details ? String(r.details).slice(0, 80) : '—'}
                        </span>
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

export default Audit;











