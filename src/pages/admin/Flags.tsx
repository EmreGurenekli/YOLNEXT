import React, { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, X } from 'lucide-react';
import { createApiUrl } from '../../config/api';

type TabKey = 'open' | 'all';

const Flags: React.FC = () => {
  const [tab, setTab] = useState<TabKey>('open');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [items, setItems] = useState<any[]>([]);

  const loadSeqRef = useRef(0);
  const loadControllerRef = useRef<AbortController | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [type, setType] = useState('spam');
  const [targetType, setTargetType] = useState('user');
  const [targetId, setTargetId] = useState('');
  const [reason, setReason] = useState('');

  const getToken = () => localStorage.getItem('token') || localStorage.getItem('authToken') || '';

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const load = async () => {
    const seq = ++loadSeqRef.current;
    if (loadControllerRef.current) loadControllerRef.current.abort();
    const controller = new AbortController();
    loadControllerRef.current = controller;

    try {
      setLoading(true);
      setError('');

      const status = tab === 'open' ? 'open' : '';
      const qs = status ? `?status=${encodeURIComponent(status)}&limit=200` : '?limit=200';
      const res = await fetch(createApiUrl(`/api/admin/flags${qs}`), {
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        signal: controller.signal,
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) throw new Error(payload?.message || `Flag kayıtları yüklenemedi (HTTP ${res.status})`);

      if (seq === loadSeqRef.current) {
        setItems(Array.isArray(payload?.data) ? payload.data : []);
      }
    } catch (e: any) {
      if (e?.name !== 'AbortError' && seq === loadSeqRef.current) {
        setError(e?.message || 'Flag kayıtları yüklenemedi');
      }
    } finally {
      if (seq === loadSeqRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [tab]);

  useEffect(() => {
    return () => {
      if (loadControllerRef.current) loadControllerRef.current.abort();
    };
  }, []);

  const closeCreate = () => {
    if (createSubmitting) return;
    setCreateOpen(false);
    setType('spam');
    setTargetType('user');
    setTargetId('');
    setReason('');
  };

  const submitCreate = async () => {
    const trimmedTarget = targetId.trim();
    const trimmedReason = reason.trim();
    if (!trimmedTarget) {
      setError('Hedef ID zorunlu');
      return;
    }
    if (trimmedReason.length < 3) {
      setError('Sebep en az 3 karakter olmalı');
      return;
    }

    try {
      setCreateSubmitting(true);
      setError('');
      const res = await fetch(createApiUrl('/api/admin/flags'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, targetType, targetId: trimmedTarget, reason: trimmedReason }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) throw new Error(payload?.message || `Flag oluşturulamadı (HTTP ${res.status})`);
      setToast('Flag oluşturuldu');
      closeCreate();
      await load();
    } catch (e: any) {
      setError(e?.message || 'Flag oluşturulamadı');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const TabButton = ({ k, label }: { k: TabKey; label: string }) => (
    <button
      className={
        'px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ' +
        (tab === k
          ? 'bg-slate-900 text-white border-slate-900'
          : 'bg-white text-slate-700 border-gray-200 hover:bg-gray-50')
      }
      onClick={() => setTab(k)}
      disabled={loading}
    >
      {label}
    </button>
  );

  return (
    <div className='min-h-[calc(100vh-56px)] bg-gray-50'>
      <Helmet>
        <title>Flag - Admin</title>
      </Helmet>

      <div className='container-custom py-6 lg:py-10'>
        <div className='mb-6 lg:mb-8 flex items-start justify-between gap-4'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight text-slate-900'>Flag</h1>
            <p className='text-slate-600 mt-1'>spam/dispute flag yönetimi</p>
          </div>
          <div className='flex items-center gap-2'>
            <button className='btn-secondary' onClick={() => load()} disabled={loading}>
              Yenile
            </button>
            <button className='btn-primary' onClick={() => setCreateOpen(true)} disabled={loading}>
              <span className='inline-flex items-center gap-2'>
                <Plus className='w-4 h-4' /> Yeni Flag
              </span>
            </button>
          </div>
        </div>

        {toast && (
          <div className='mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700'>
            {toast}
          </div>
        )}

        {error && (
          <div className='mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700'>
            {error}
          </div>
        )}

        <div className='mb-5 flex flex-wrap gap-2'>
          <TabButton k='open' label='Açık' />
          <TabButton k='all' label='Tümü' />
        </div>

        {loading ? (
          <div className='text-sm text-slate-600'>Yükleniyor...</div>
        ) : (
          <div className='card p-0 overflow-hidden'>
            {/* Desktop Table View */}
            <div className='hidden md:block'>
              <div className='overflow-x-auto'>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='bg-gray-50 border-b border-gray-200 text-left'>
                      <th className='p-4 font-semibold text-slate-700'>Zaman</th>
                      <th className='p-4 font-semibold text-slate-700'>Type</th>
                      <th className='p-4 font-semibold text-slate-700'>Target</th>
                      <th className='p-4 font-semibold text-slate-700'>Status</th>
                      <th className='p-4 font-semibold text-slate-700'>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td className='p-6 text-slate-600' colSpan={5}>
                          <div className='p-4 bg-gray-50 border border-gray-200 rounded-xl'>
                            <div className='text-sm font-semibold text-slate-900'>Kayıt yok</div>
                            <div className='text-xs text-slate-600 mt-1'>Henüz flag kaydı yok.</div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      items.map((f, idx) => (
                        <tr
                          key={f?.id || idx}
                          className={`border-b border-gray-100 hover:bg-gray-50/70 transition-colors ${idx % 2 === 1 ? 'bg-white' : 'bg-gray-50/30'}`}
                        >
                          <td className='p-4 text-slate-700'>
                            {f?.created_at ? new Date(f.created_at).toLocaleString() : '-'}
                          </td>
                          <td className='p-4 text-slate-900 font-semibold'>{f?.type || '-'}</td>
                          <td className='p-4 text-slate-700'>
                            {f?.target_type ? `${f.target_type}:${f.target_id || '-'}` : '-'}
                          </td>
                          <td className='p-4 text-slate-700'>{f?.status || '-'}</td>
                          <td className='p-4 text-slate-700'>{f?.reason || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className='md:hidden'>
              {items.length === 0 ? (
                <div className='p-6 text-center'>
                  <div className='p-4 bg-gray-50 border border-gray-200 rounded-xl'>
                    <div className='text-sm font-semibold text-slate-900'>Kayıt yok</div>
                    <div className='text-xs text-slate-600 mt-1'>Henüz flag kaydı yok.</div>
                  </div>
                </div>
              ) : (
                <div className='space-y-4 p-4'>
                  {items.map((f, idx) => (
                    <div
                      key={f?.id || idx}
                      className='bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow'
                    >
                      {/* Header */}
                      <div className='flex items-start justify-between mb-3'>
                        <div className='flex-1 min-w-0'>
                          <div className='font-mono text-sm font-semibold text-slate-900 mb-1'>
                            {f?.created_at ? new Date(f.created_at).toLocaleString() : '-'}
                          </div>
                          <div className='text-sm font-medium text-slate-900'>
                            {f?.type || '-'}
                          </div>
                        </div>
                        <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex-shrink-0'>
                          {f?.status || '-'}
                        </span>
                      </div>

                      {/* Target Info */}
                      <div className='mb-3'>
                        <div className='text-sm text-slate-600 mb-1'>Target</div>
                        <div className='text-sm font-medium text-slate-900'>
                          {f?.target_type ? `${f.target_type}:${f.target_id || '-'}` : '-'}
                        </div>
                      </div>

                      {/* Reason */}
                      <div className='mb-3'>
                        <div className='text-sm text-slate-600 mb-1'>Sebep</div>
                        <div className='text-sm text-slate-900 bg-gray-50 p-2 rounded-lg'>
                          {f?.reason || '-'}
                        </div>
                      </div>

                      {/* Footer */}
                      <div className='text-xs text-slate-500 pt-2 border-t border-gray-100'>
                        ID: {f?.id || '-'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {createOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
          <div className='absolute inset-0 bg-black/40' onClick={closeCreate} />
          <div className='relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-200 p-6'>
            <div className='flex items-start justify-between gap-4'>
              <div>
                <div className='text-lg font-bold text-slate-900'>Yeni Flag</div>
                <div className='text-sm text-slate-600 mt-1'>Sebep zorunlu; audit kaydı tutulur.</div>
              </div>
              <button className='btn-secondary' onClick={closeCreate} disabled={createSubmitting}>
                <span className='inline-flex items-center gap-2'>
                  <X className='w-4 h-4' /> Kapat
                </span>
              </button>
            </div>

            <div className='mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3'>
              <div>
                <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Type</div>
                <input className='input mt-2' value={type} onChange={e => setType(e.target.value)} />
              </div>
              <div>
                <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Target Type</div>
                <input className='input mt-2' value={targetType} onChange={e => setTargetType(e.target.value)} />
              </div>
            </div>

            <div className='mt-4'>
              <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Hedef ID</div>
              <input
                className='input mt-2'
                value={targetId}
                onChange={e => setTargetId(e.target.value)}
                placeholder='Örn: kullanıcı ID'
              />
            </div>

            <div className='mt-4'>
              <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Sebep</div>
              <textarea
                className='input mt-2 min-h-[110px]'
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder='Sebep yaz (zorunlu)'
              />
            </div>

            <div className='mt-5 flex items-center justify-end gap-2'>
              <button className='btn-secondary' onClick={closeCreate} disabled={createSubmitting}>
                Vazgeç
              </button>
              <button className='btn-primary' onClick={submitCreate} disabled={createSubmitting}>
                {createSubmitting ? 'İşleniyor...' : 'Oluştur'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Flags;
