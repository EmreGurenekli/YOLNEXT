import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { createApiUrl } from '../../config/api';
import { AlertTriangle, Inbox, Search, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAdminBasePath } from '../../config/admin';

const CommandCenter: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [briefing, setBriefing] = useState<any>(null);
  const [inboxItems, setInboxItems] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);

  const [quickSearch, setQuickSearch] = useState('');
  const [quickSearchLoading, setQuickSearchLoading] = useState(false);
  const [quickUsers, setQuickUsers] = useState<any[]>([]);

  const token = useMemo(() => localStorage.getItem('token') || localStorage.getItem('authToken') || '', []);
  const navigate = useNavigate();
  const base = getAdminBasePath();

  const load = async () => {
    try {
      setLoading(true);
      setError('');

      const [briefingRes, inboxRes] = await Promise.all([
        fetch(createApiUrl('/api/admin/planner/briefing'), {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        }),
        fetch(createApiUrl('/api/admin/inbox'), {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        }),
      ]);

      const briefingPayload = await briefingRes.json().catch(() => null);
      const inboxPayload = await inboxRes.json().catch(() => null);

      if (!briefingRes.ok) {
        throw new Error(briefingPayload?.message || `Briefing yüklenemedi (HTTP ${briefingRes.status})`);
      }
      if (!inboxRes.ok) {
        throw new Error(inboxPayload?.message || `Gelen kutusu yüklenemedi (HTTP ${inboxRes.status})`);
      }

      const b = briefingPayload?.data?.briefing || briefingPayload?.briefing || briefingPayload?.data || null;
      setBriefing(b);

      const list = inboxPayload?.data?.items || [];
      setInboxItems(Array.isArray(list) ? list : []);
      setSelected((prev: any) => prev || (Array.isArray(list) && list.length ? list[0] : null));
    } catch (e: any) {
      setError(e?.message || 'Kontrol merkezi yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const runQuickSearch = async (q: string) => {
    const value = q.trim();
    if (value.length < 2) {
      setQuickUsers([]);
      return;
    }
    try {
      setQuickSearchLoading(true);
      const res = await fetch(createApiUrl(`/api/admin/search?q=${encodeURIComponent(value)}`), {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) throw new Error(payload?.message || `Arama başarısız (HTTP ${res.status})`);
      setQuickUsers(Array.isArray(payload?.data?.users) ? payload.data.users : []);
    } catch {
      setQuickUsers([]);
    } finally {
      setQuickSearchLoading(false);
    }
  };

  return (
    <div className='min-h-[calc(100vh-56px)] bg-gray-50'>
      <Helmet>
        <title>Kontrol Merkezi - Admin</title>
      </Helmet>

      <div className='container-custom py-6 lg:py-8'>
        <div className='mb-6 flex items-start justify-between gap-4'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center'>
              <Shield className='w-5 h-5' />
            </div>
            <div>
              <h1 className='text-2xl font-bold text-slate-900'>Kontrol Merkezi</h1>
              <div className='text-sm text-slate-600'>Tek ekrandan triage + hızlı aksiyonlar</div>
            </div>
          </div>

          <button className='btn-secondary' onClick={load} disabled={loading}>
            Yenile
          </button>
        </div>

        {error && (
          <div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700'>
            {error}
          </div>
        )}

        {loading ? (
          <div className='text-sm text-slate-600'>Yükleniyor...</div>
        ) : (
          <>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
              <div className='card p-6'>
                <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Kullanıcı</div>
                <div className='text-3xl font-bold text-slate-900 mt-2'>{briefing?.totals?.usersTotal ?? 0}</div>
                <div className='text-xs text-slate-600 mt-2'>24s: +{briefing?.last24h?.users ?? 0}</div>
              </div>
              <div className='card p-6'>
                <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Gönderi</div>
                <div className='text-3xl font-bold text-slate-900 mt-2'>{briefing?.totals?.shipmentsTotal ?? 0}</div>
                <div className='text-xs text-slate-600 mt-2'>24s: +{briefing?.last24h?.shipments ?? 0}</div>
              </div>
              <div className='card p-6'>
                <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Teklif</div>
                <div className='text-3xl font-bold text-slate-900 mt-2'>{briefing?.totals?.offersTotal ?? 0}</div>
                <div className='text-xs text-slate-600 mt-2'>Toplam</div>
              </div>
              <div className='card p-6'>
                <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Açık Şikayet</div>
                <div className='text-3xl font-bold text-slate-900 mt-2'>{briefing?.openComplaints ?? 0}</div>
                <div className='text-xs text-slate-600 mt-2'>beklemede/inceleniyor</div>
              </div>
            </div>

            <div className='mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6'>
              <div className='lg:col-span-2 space-y-6'>
                <div className='card p-6'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <Inbox className='w-5 h-5 text-slate-900' />
                      <div className='text-sm font-bold text-slate-900'>Triage / Gelen Kutusu</div>
                    </div>
                    <div className='text-xs font-semibold text-slate-600'>
                      {inboxItems.length} kayıt
                    </div>
                  </div>

                  <div className='mt-4 space-y-2'>
                    {inboxItems.length === 0 ? (
                      <div className='text-sm text-slate-600'>Gelen kutusu boş.</div>
                    ) : (
                      inboxItems.map((it, idx) => {
                        const active = selected?.id === it?.id;
                        return (
                          <button
                            key={it?.id || idx}
                            className={
                              'w-full text-left p-4 rounded-xl border transition-colors ' +
                              (active
                                ? 'bg-white border-slate-900'
                                : 'bg-gray-50 border-gray-200 hover:bg-white')
                            }
                            onClick={() => setSelected(it)}
                          >
                            <div className='flex items-start justify-between gap-4'>
                              <div>
                                <div className='text-sm font-semibold text-slate-900'>
                                  {it?.title || it?.type || 'Kayıt'}
                                </div>
                                <div className='text-xs text-slate-600 mt-1'>
                                  {it?.summary || 'Detay yok'}
                                </div>
                              </div>
                              {it?.type === 'complaint' && (
                                <div className='inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md'>
                                  <AlertTriangle className='w-4 h-4' />
                                  İncele
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className='card p-6'>
                  <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Hızlı Arama</div>
                  <div className='mt-3'>
                    <div className='relative'>
                      <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
                      <input
                        className='input pl-10'
                        value={quickSearch}
                        placeholder='E-posta / telefon / kullanıcı ID'
                        onChange={e => {
                          const v = e.target.value;
                          setQuickSearch(v);
                          runQuickSearch(v);
                        }}
                      />
                    </div>
                    {quickSearchLoading ? (
                      <div className='text-sm text-slate-600 mt-3'>Aranıyor...</div>
                    ) : quickUsers.length === 0 ? (
                      <div className='text-sm text-slate-600 mt-3'>Sonuç yok.</div>
                    ) : (
                      <div className='mt-3 space-y-2'>
                        {quickUsers.slice(0, 5).map((u, idx) => (
                          <div key={u?.id || idx} className='p-3 bg-gray-50 border border-gray-200 rounded-xl'>
                            <div className='text-sm font-semibold text-slate-900'>{u.email || u.id}</div>
                            <div className='text-xs text-slate-600 mt-1'>{u.role || '-'}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className='space-y-6'>
                <div className='card p-6'>
                  <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Seçili Kayıt</div>
                  {!selected ? (
                    <div className='text-sm text-slate-600 mt-2'>Seçim yok</div>
                  ) : (
                    <>
                      <div className='text-lg font-bold text-slate-900 mt-2'>
                        {selected?.title || selected?.type || 'Kayıt'}
                      </div>
                      <div className='text-sm text-slate-600 mt-2'>{selected?.summary || '-'}</div>

                      {selected?.type === 'complaint' && (selected?.userId || selected?.relatedUserId) && (
                        <div className='mt-4'>
                          <button
                            className='btn-primary w-full'
                            onClick={() => {
                              const openId = selected?.relatedUserId || selected?.userId;
                              if (!openId) return;
                              navigate(`${base}/users?openUserId=${encodeURIComponent(String(openId))}`);
                            }}
                          >
                            Kullanıcı detayına git
                          </button>
                        </div>
                      )}

                      <div className='mt-5 grid grid-cols-1 gap-2'>
                        <button className='btn-secondary' disabled>
                          Görev oluştur (yakında)
                        </button>
                        <button className='btn-secondary' disabled>
                          Flag aç (yakında)
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <div className='card p-6'>
                  <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Rol Dağılımı</div>
                  <div className='mt-3 space-y-2'>
                    {briefing?.roleDistribution
                      ? Object.entries(briefing.roleDistribution).map(([k, v]) => (
                          <div key={k} className='flex items-center justify-between text-sm'>
                            <div className='text-slate-700'>{k}</div>
                            <div className='font-semibold text-slate-900'>{String(v)}</div>
                          </div>
                        ))
                      : <div className='text-sm text-slate-600'>-</div>}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CommandCenter;











