import React, { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { createApiUrl } from '../../config/api';
import LoadingState from '../../components/common/LoadingState';

type TabKey = 'audit' | 'flags' | 'complaints';

const Ops: React.FC = () => {
  const [tab, setTab] = useState<TabKey>('audit');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [audit, setAudit] = useState<any[]>([]);
  const [flags, setFlags] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);

  const loadSeqRef = useRef(0);
  const loadControllerRef = useRef<AbortController | null>(null);

  const getToken = () => localStorage.getItem('authToken') || '';

  const load = async (nextTab: TabKey) => {
    const seq = ++loadSeqRef.current;
    if (loadControllerRef.current) {
      loadControllerRef.current.abort();
    }
    const controller = new AbortController();
    loadControllerRef.current = controller;

    try {
      setLoading(true);
      setError('');

      if (nextTab === 'audit') {
        const res = await fetch(createApiUrl('/api/admin/audit?limit=50'), {
          headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
          signal: controller.signal,
        });
        const payload = await res.json().catch(() => null);
        if (!res.ok) throw new Error(payload?.message || `Audit yüklenemedi (HTTP ${res.status})`);
        if (seq === loadSeqRef.current) setAudit(Array.isArray(payload?.data) ? payload.data : []);
      }

      if (nextTab === 'flags') {
        const res = await fetch(createApiUrl('/api/admin/flags?limit=50'), {
          headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
          signal: controller.signal,
        });
        const payload = await res.json().catch(() => null);
        if (!res.ok) throw new Error(payload?.message || `Flags yüklenemedi (HTTP ${res.status})`);
        if (seq === loadSeqRef.current) setFlags(Array.isArray(payload?.data) ? payload.data : []);
      }

      if (nextTab === 'complaints') {
        const res = await fetch(createApiUrl('/api/admin/complaints?limit=50'), {
          headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
          signal: controller.signal,
        });
        const payload = await res.json().catch(() => null);
        if (!res.ok) throw new Error(payload?.message || `Şikayetler yüklenemedi (HTTP ${res.status})`);
        if (seq === loadSeqRef.current) setComplaints(Array.isArray(payload?.data) ? payload.data : []);
      }
    } catch (e: any) {
      if (e?.name !== 'AbortError' && seq === loadSeqRef.current) {
        setError(e?.message || 'Ops yüklenemedi');
      }
    } finally {
      if (seq === loadSeqRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    load(tab);
  }, [tab]);

  useEffect(() => {
    return () => {
      if (loadControllerRef.current) loadControllerRef.current.abort();
    };
  }, []);

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
        <title>Sistem - Admin</title>
      </Helmet>

      <div className='container-custom py-6 lg:py-10'>
        <div className='mb-6 lg:mb-8 flex items-start justify-between gap-4'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight text-slate-900'>Sistem</h1>
            <p className='text-slate-600 mt-1'>Kayıtlar: audit, flag, şikayet</p>
          </div>
          <button className='btn-secondary' onClick={() => load(tab)} disabled={loading}>
            Yenile
          </button>
        </div>

        <div className='mb-5 flex flex-wrap gap-2'>
          <TabButton k='audit' label='Audit' />
          <TabButton k='flags' label='Flag' />
          <TabButton k='complaints' label='Şikayet' />
        </div>

        {error && (
          <div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-lg'>
            <div className='text-sm text-red-700'>{error}</div>
            <div className='mt-3 flex justify-end'>
              <button className='btn-secondary' onClick={() => load(tab)} disabled={loading}>
                Tekrar dene
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className='flex items-center justify-center py-10'>
            <LoadingState message='Yükleniyor...' />
          </div>
        ) : (
          <div className='card p-0 overflow-hidden'>
            {tab === 'audit' && (
              <div className='overflow-x-auto'>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='bg-gray-50 border-b border-gray-200 text-left'>
                      <th className='p-4 font-semibold text-slate-700'>Zaman</th>
                      <th className='p-4 font-semibold text-slate-700'>Aksiyon</th>
                      <th className='p-4 font-semibold text-slate-700'>Kaynak</th>
                      <th className='p-4 font-semibold text-slate-700'>User</th>
                    </tr>
                  </thead>
                  <tbody>
                    {audit.length === 0 ? (
                      <tr>
                        <td className='p-6 text-slate-600' colSpan={4}>
                          <div className='p-4 bg-gray-50 border border-gray-200 rounded-xl'>
                            <div className='text-sm font-semibold text-slate-900'>Kayıt yok</div>
                            <div className='text-xs text-slate-600 mt-1'>Henüz audit kaydı oluşmamış.</div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      audit.map((a, idx) => (
                        <tr
                          key={a?.id || idx}
                          className={`border-b border-gray-100 hover:bg-gray-50/70 transition-colors ${idx % 2 === 1 ? 'bg-white' : 'bg-gray-50/30'}`}
                        >
                          <td className='p-4 text-slate-700'>
                            {a?.created_at ? new Date(a.created_at).toLocaleString() : '-'}
                          </td>
                          <td className='p-4 text-slate-900 font-semibold'>{a?.action || '-'}</td>
                          <td className='p-4 text-slate-700'>
                            {a?.resource_type ? `${a.resource_type}:${a.resource_id || '-'}` : '-'}
                          </td>
                          <td className='p-4 text-slate-700'>{a?.user_id ?? '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {tab === 'flags' && (
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
                    {flags.length === 0 ? (
                      <tr>
                        <td className='p-6 text-slate-600' colSpan={5}>
                          <div className='p-4 bg-gray-50 border border-gray-200 rounded-xl'>
                            <div className='text-sm font-semibold text-slate-900'>Kayıt yok</div>
                            <div className='text-xs text-slate-600 mt-1'>Henüz flag kaydı yok.</div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      flags.map((f, idx) => (
                        <tr
                          key={f?.id || idx}
                          className={`border-b border-gray-100 hover:bg-gray-50/70 transition-colors ${idx % 2 === 1 ? 'bg-white' : 'bg-gray-50/30'}`}
                        >
                          <td className='p-4 text-slate-700'>
                            {f?.created_at ? new Date(f.created_at).toLocaleString() : '-'}
                          </td>
                          <td className='p-4 text-slate-900 font-semibold'>{f?.type || '-'}</td>
                          <td className='p-4 text-slate-700'>{f?.target_type ? `${f.target_type}:${f.target_id || '-'}` : '-'}</td>
                          <td className='p-4 text-slate-700'>{f?.status || '-'}</td>
                          <td className='p-4 text-slate-700'>{f?.reason || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {tab === 'complaints' && (
              <div className='overflow-x-auto'>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='bg-gray-50 border-b border-gray-200 text-left'>
                      <th className='p-4 font-semibold text-slate-700'>Zaman</th>
                      <th className='p-4 font-semibold text-slate-700'>Başlık</th>
                      <th className='p-4 font-semibold text-slate-700'>Status</th>
                      <th className='p-4 font-semibold text-slate-700'>User</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complaints.length === 0 ? (
                      <tr>
                        <td className='p-6 text-slate-600' colSpan={4}>
                          <div className='p-4 bg-gray-50 border border-gray-200 rounded-xl'>
                            <div className='text-sm font-semibold text-slate-900'>Kayıt yok</div>
                            <div className='text-xs text-slate-600 mt-1'>Henüz şikayet kaydı yok.</div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      complaints.map((c, idx) => (
                        <tr
                          key={c?.id || idx}
                          className={`border-b border-gray-100 hover:bg-gray-50/70 transition-colors ${idx % 2 === 1 ? 'bg-white' : 'bg-gray-50/30'}`}
                        >
                          <td className='p-4 text-slate-700'>
                            {c?.created_at ? new Date(c.created_at).toLocaleString() : '-'}
                          </td>
                          <td className='p-4 text-slate-900 font-semibold'>{c?.title || '-'}</td>
                          <td className='p-4 text-slate-700'>{c?.status || '-'}</td>
                          <td className='p-4 text-slate-700'>{c?.user_id ?? '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Ops;
