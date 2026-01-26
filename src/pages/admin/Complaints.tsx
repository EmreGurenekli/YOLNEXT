import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { createApiUrl } from '../../config/api';
import { getAdminBasePath } from '../../config/admin';
import { useLocation, useNavigate } from 'react-router-dom';

const Complaints: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const base = getAdminBasePath();
  const token = useMemo(() => localStorage.getItem('token') || localStorage.getItem('authToken') || '', []);
  const focusRowRef = useRef<HTMLTableRowElement | null>(null);

  const openComplaintId = useMemo(() => {
    try {
      const sp = new URLSearchParams(location.search || '');
      return String(sp.get('openComplaintId') || '').trim();
    } catch {
      return '';
    }
  }, [location.search]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<string>('');
  const [rows, setRows] = useState<any[]>([]);
  const [selectedComplaintId, setSelectedComplaintId] = useState<string>('');

  const selected = useMemo(() => {
    if (!selectedComplaintId) return null;
    return rows.find((r) => String(r?.id) === String(selectedComplaintId)) || null;
  }, [rows, selectedComplaintId]);

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const qs = new URLSearchParams();
      if (status) qs.set('status', status);
      qs.set('limit', '200');
      const res = await fetch(createApiUrl(`/api/admin/complaints?${qs.toString()}`), {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) throw new Error(payload?.message || `Şikayetler yüklenemedi (HTTP ${res.status})`);
      setRows(Array.isArray(payload?.data) ? payload.data : []);
    } catch (e: any) {
      setRows([]);
      setError(e?.message || 'Şikayetler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [status]);

  useEffect(() => {
    if (!openComplaintId) return;
    setSelectedComplaintId(openComplaintId);
  }, [openComplaintId]);

  useEffect(() => {
    if (loading) return;
    if (!openComplaintId) return;
    if (!focusRowRef.current) return;
    focusRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [loading, openComplaintId, rows.length]);

  const setOpenComplaintIdParam = (id: string) => {
    const sp = new URLSearchParams(location.search || '');
    if (id) sp.set('openComplaintId', id);
    else sp.delete('openComplaintId');
    const qs = sp.toString();
    navigate(`${base}/complaints${qs ? `?${qs}` : ''}`, { replace: true });
  };

  return (
    <div className='min-h-[calc(100vh-56px)] bg-gray-50'>
      <Helmet>
        <title>Şikayetler - Admin</title>
      </Helmet>

      <div className='container-custom py-6 lg:py-8'>
        <div className='mb-6'>
          <h1 className='text-2xl font-bold text-slate-900'>Şikayetler</h1>
          <p className='text-slate-600'>beklemede / inceleniyor / çözüldü</p>
        </div>

        <div className='card p-6'>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
            <div className='flex items-center gap-2'>
              <label className='text-sm font-semibold text-slate-700'>Durum</label>
              <select
                value={status}
                onChange={(e) => setStatus(String(e.target.value || ''))}
                className='px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm'
              >
                <option value=''>Tümü</option>
                <option value='pending'>Beklemede</option>
                <option value='reviewing'>İnceleniyor</option>
                <option value='resolved'>Çözüldü</option>
                <option value='rejected'>Reddedildi</option>
              </select>
            </div>

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
          ) : rows.length === 0 ? (
            <div className='mt-6 text-sm text-slate-600'>Kayıt yok.</div>
          ) : (
            <div className='mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4'>
              <div className='lg:col-span-2 overflow-x-auto'>
                <table className='min-w-full text-sm'>
                  <thead>
                    <tr className='text-left text-xs uppercase tracking-wide text-slate-500 border-b'>
                      <th className='py-2 pr-4'>ID</th>
                      <th className='py-2 pr-4'>Başlık</th>
                      <th className='py-2 pr-4'>Durum</th>
                      <th className='py-2 pr-4'>User</th>
                      <th className='py-2 pr-4'>Related</th>
                      <th className='py-2 pr-4'>Güncellendi</th>
                      <th className='py-2 pr-0'></th>
                    </tr>
                  </thead>
                  <tbody className='divide-y'>
                    {rows.map((r) => {
                      const rid = String(r.id);
                      const isFocused = openComplaintId && rid === openComplaintId;
                      const isSelected = selectedComplaintId && rid === selectedComplaintId;
                      return (
                        <tr
                          key={rid}
                          ref={isFocused ? focusRowRef : undefined}
                          className={
                            'cursor-pointer hover:bg-slate-50 ' +
                            (isFocused ? 'bg-amber-50 ring-1 ring-amber-200 ' : '') +
                            (isSelected ? 'bg-slate-50 ring-1 ring-slate-200 ' : '')
                          }
                          onClick={() => {
                            setSelectedComplaintId(rid);
                            setOpenComplaintIdParam(rid);
                          }}
                        >
                          <td className='py-3 pr-4 font-mono text-xs text-slate-700'>{r.id}</td>
                          <td className='py-3 pr-4 font-semibold text-slate-900'>{r.title || '—'}</td>
                          <td className='py-3 pr-4 text-slate-700'>{r.status || '—'}</td>
                          <td className='py-3 pr-4 text-slate-700'>{r.user_id ?? '—'}</td>
                          <td className='py-3 pr-4 text-slate-700'>{r.related_user_id ?? '—'}</td>
                          <td className='py-3 pr-4 text-slate-700'>
                            {String(r.updated_at || r.created_at || '').replace('T', ' ').slice(0, 16) || '—'}
                          </td>
                          <td className='py-3 pr-0 text-right'>
                            <button
                              type='button'
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedComplaintId(rid);
                                setOpenComplaintIdParam(rid);
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
                      Bir şikayet seç. Sağ panelde hızlı aksiyonlar burada görünecek.
                    </div>
                  ) : (
                    <>
                      <div className='flex items-start justify-between gap-3'>
                        <div className='min-w-0'>
                          <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Şikayet</div>
                          <div className='text-base font-bold text-slate-900 mt-1 truncate'>{selected.title || '—'}</div>
                          <div className='text-xs text-slate-600 mt-1'>ID: <span className='font-mono'>{String(selected.id)}</span></div>
                        </div>
                        <button
                          type='button'
                          className='px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-gray-50'
                          onClick={() => {
                            setSelectedComplaintId('');
                            setOpenComplaintIdParam('');
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
                          <div className='text-slate-600'>Shipment</div>
                          <div className='font-mono text-xs text-slate-900'>{selected.shipment_id ?? selected.shipmentId ?? '—'}</div>
                        </div>
                        <div className='flex items-center justify-between'>
                          <div className='text-slate-600'>User</div>
                          <div className='font-mono text-xs text-slate-900'>{selected.user_id ?? '—'}</div>
                        </div>
                        <div className='flex items-center justify-between'>
                          <div className='text-slate-600'>Related</div>
                          <div className='font-mono text-xs text-slate-900'>{selected.related_user_id ?? '—'}</div>
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
                        {(selected.user_id || selected.related_user_id) ? (
                          <div className='grid grid-cols-1 gap-2'>
                            {selected.user_id && (
                              <button
                                type='button'
                                className='px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-gray-50'
                                onClick={() => navigate(`${base}/users?openUserId=${encodeURIComponent(String(selected.user_id))}`)}
                              >
                                Şikayet eden kullanıcı
                              </button>
                            )}
                            {selected.related_user_id && (
                              <button
                                type='button'
                                className='px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-gray-50'
                                onClick={() => navigate(`${base}/users?openUserId=${encodeURIComponent(String(selected.related_user_id))}`)}
                              >
                                İlgili kullanıcı
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

export default Complaints;











