import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { FileText } from 'lucide-react';
import { createApiUrl } from '../../config/api';
import { getAdminBasePath } from '../../config/admin';
import { useLocation, useNavigate } from 'react-router-dom';

const Cases: React.FC = () => {
  const [tab, setTab] = useState<'acik' | 'tum'>('acik');
  const navigate = useNavigate();
  const location = useLocation();
  const base = getAdminBasePath();
  const token = useMemo(() => localStorage.getItem('token') || localStorage.getItem('authToken') || '', []);
  const focusRowRef = useRef<HTMLTableRowElement | null>(null);

  const openDisputeRef = useMemo(() => {
    try {
      const sp = new URLSearchParams(location.search || '');
      return String(sp.get('openDisputeRef') || '').trim();
    } catch {
      return '';
    }
  }, [location.search]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const [selectedDisputeRef, setSelectedDisputeRef] = useState<string>('');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const qs = new URLSearchParams();
      qs.set('limit', '50');
      qs.set('page', '1');
      const res = await fetch(createApiUrl(`/api/disputes?${qs.toString()}`), {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) throw new Error(payload?.message || `Disputes yüklenemedi (HTTP ${res.status})`);
      setRows(Array.isArray(payload?.data) ? payload.data : []);
    } catch (e: any) {
      setRows([]);
      setError(e?.message || 'Disputes yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (tab === 'tum') return rows;
    const openStatuses = new Set(['pending', 'investigating', 'escalated', 'assigned']);
    return rows.filter((r) => openStatuses.has(String(r.status || '').trim()));
  }, [rows, tab]);

  const selected = useMemo(() => {
    if (!selectedDisputeRef) return null;
    return (
      filtered.find((r) => String(r.dispute_ref || r.disputeRef || r.id || '').trim() === selectedDisputeRef) || null
    );
  }, [filtered, selectedDisputeRef]);

  useEffect(() => {
    if (loading) return;
    if (!openDisputeRef) return;
    if (!focusRowRef.current) return;
    focusRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [loading, openDisputeRef, filtered.length]);

  useEffect(() => {
    if (!openDisputeRef) return;
    setSelectedDisputeRef(openDisputeRef);
  }, [openDisputeRef]);

  const setOpenDisputeRefParam = (ref: string) => {
    const sp = new URLSearchParams(location.search || '');
    if (ref) sp.set('openDisputeRef', ref);
    else sp.delete('openDisputeRef');
    const qs = sp.toString();
    navigate(`${base}/cases${qs ? `?${qs}` : ''}`, { replace: true });
  };

  return (
    <div className='min-h-[calc(100vh-56px)] bg-gray-50'>
      <Helmet>
        <title>Vakalar - Admin</title>
      </Helmet>

      <div className='container-custom py-6 lg:py-10'>
        <div className='mb-6 lg:mb-8 flex items-start justify-between gap-4'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center'>
              <FileText className='w-5 h-5' />
            </div>
            <div>
              <h1 className='text-3xl font-bold tracking-tight text-slate-900'>Vakalar</h1>
              <div className='text-sm text-slate-600 mt-1'>Şikayet / itiraz / inceleme dosyaları</div>
            </div>
          </div>
        </div>

        <div className='mb-5 flex flex-wrap gap-2'>
          <button
            className={
              'px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ' +
              (tab === 'acik'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-gray-200 hover:bg-gray-50')
            }
            onClick={() => setTab('acik')}
          >
            Açık Vakalar
          </button>
          <button
            className={
              'px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ' +
              (tab === 'tum'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-gray-200 hover:bg-gray-50')
            }
            onClick={() => setTab('tum')}
          >
            Tümü
          </button>
        </div>

        <div className='card p-6 lg:p-7'>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
            <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Disputes</div>
            <div className='flex gap-2'>
              <button
                type='button'
                onClick={() => navigate(`${base}/ops`, { replace: false })}
                className='px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800'
              >
                Operasyon Masası
              </button>
              <button
                type='button'
                onClick={() => load()}
                className='px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-gray-50'
              >
                Yenile
              </button>
            </div>
          </div>

          {error && (
            <div className='mt-4 p-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700'>
              {error}
            </div>
          )}

          {loading ? (
            <div className='mt-6 text-sm text-slate-600'>Yükleniyor…</div>
          ) : filtered.length === 0 ? (
            <div className='mt-6 text-sm text-slate-600'>Kayıt yok.</div>
          ) : (
            <div className='mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4'>
              <div className='lg:col-span-2 overflow-x-auto'>
                <table className='min-w-full text-sm'>
                  <thead>
                    <tr className='text-left text-xs uppercase tracking-wide text-slate-500 border-b'>
                      <th className='py-2 pr-4'>Ref</th>
                      <th className='py-2 pr-4'>Başlık</th>
                      <th className='py-2 pr-4'>Durum</th>
                      <th className='py-2 pr-4'>Öncelik</th>
                      <th className='py-2 pr-4'>Oluşturma</th>
                      <th className='py-2 pr-0'></th>
                    </tr>
                  </thead>
                  <tbody className='divide-y'>
                    {filtered.map((r) => {
                      const ref = String(r.dispute_ref || r.disputeRef || r.id || '').trim();
                      const isFocused = openDisputeRef && ref === openDisputeRef;
                      const isSelected = selectedDisputeRef && ref === selectedDisputeRef;
                      return (
                        <tr
                          key={String(r.id)}
                          ref={isFocused ? focusRowRef : undefined}
                          className={
                            'cursor-pointer hover:bg-slate-50 ' +
                            (isFocused ? 'bg-amber-50 ring-1 ring-amber-200 ' : '') +
                            (isSelected ? 'bg-slate-50 ring-1 ring-slate-200 ' : '')
                          }
                          onClick={() => {
                            setSelectedDisputeRef(ref);
                            setOpenDisputeRefParam(ref);
                          }}
                        >
                          <td className='py-3 pr-4 font-mono text-xs text-slate-700'>{ref}</td>
                          <td className='py-3 pr-4 font-semibold text-slate-900'>{r.title || '—'}</td>
                          <td className='py-3 pr-4 text-slate-700'>{r.status || '—'}</td>
                          <td className='py-3 pr-4 text-slate-700'>{r.priority || '—'}</td>
                          <td className='py-3 pr-4 text-slate-700'>
                            {String(r.created_at || r.createdAt || '').replace('T', ' ').slice(0, 16) || '—'}
                          </td>
                          <td className='py-3 pr-0 text-right'>
                            <button
                              type='button'
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDisputeRef(ref);
                                setOpenDisputeRefParam(ref);
                              }}
                              className='px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-gray-50'
                            >
                              İncele
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className='lg:col-span-1'>
                <div className='lg:sticky lg:top-24 border border-slate-200 rounded-xl bg-white p-4'>
                  {!selected ? (
                    <div className='text-sm text-slate-600'>
                      Bir vaka seç. Sağ panelde hızlı aksiyonlar burada görünecek.
                    </div>
                  ) : (
                    <>
                      <div className='flex items-start justify-between gap-3'>
                        <div className='min-w-0'>
                          <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Vaka</div>
                          <div className='text-base font-bold text-slate-900 mt-1 truncate'>{selected.title || '—'}</div>
                          <div className='text-xs text-slate-600 mt-1'>Ref: <span className='font-mono'>{selectedDisputeRef}</span></div>
                        </div>
                        <button
                          type='button'
                          className='px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-gray-50'
                          onClick={() => {
                            setSelectedDisputeRef('');
                            setOpenDisputeRefParam('');
                          }}
                        >
                          Kapat
                        </button>
                      </div>

                      <div className='mt-4 grid grid-cols-1 gap-2 text-sm'>
                        <div className='flex items-center justify-between'>
                          <div className='text-slate-600'>Durum</div>
                          <div className='font-semibold text-slate-900'>{selected.status || '—'}</div>
                        </div>
                        <div className='flex items-center justify-between'>
                          <div className='text-slate-600'>Öncelik</div>
                          <div className='font-semibold text-slate-900'>{selected.priority || '—'}</div>
                        </div>
                        <div className='flex items-center justify-between'>
                          <div className='text-slate-600'>Respondent</div>
                          <div className='font-mono text-xs text-slate-900'>{selected.respondent_id ?? selected.respondentId ?? '—'}</div>
                        </div>
                        <div className='flex items-center justify-between'>
                          <div className='text-slate-600'>Complainant</div>
                          <div className='font-mono text-xs text-slate-900'>{selected.complainant_id ?? selected.complainantId ?? '—'}</div>
                        </div>
                      </div>

                      <div className='mt-4 grid grid-cols-1 gap-2'>
                        <button
                          type='button'
                          className='px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800'
                          onClick={() => navigate(`${base}/ops`, { replace: false })}
                        >
                          Operasyon Masası
                        </button>
                        {(selected.respondent_id || selected.complainant_id) ? (
                          <div className='grid grid-cols-1 gap-2'>
                            {selected.respondent_id && (
                              <button
                                type='button'
                                className='px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-gray-50'
                                onClick={() => navigate(`${base}/users?openUserId=${encodeURIComponent(String(selected.respondent_id))}`)}
                              >
                                Respondent kullanıcı
                              </button>
                            )}
                            {selected.complainant_id && (
                              <button
                                type='button'
                                className='px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-gray-50'
                                onClick={() => navigate(`${base}/users?openUserId=${encodeURIComponent(String(selected.complainant_id))}`)}
                              >
                                Complainant kullanıcı
                              </button>
                            )}
                          </div>
                        ) : null}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cases;











