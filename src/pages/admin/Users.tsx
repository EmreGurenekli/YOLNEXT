import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Search, ShieldOff, ShieldCheck, X, Flag } from 'lucide-react';
import { createApiUrl } from '../../config/api';
import { useLocation } from 'react-router-dom';

const Users: React.FC = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const [actionOpen, setActionOpen] = useState(false);
  const [actionUser, setActionUser] = useState<any>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [actionMode, setActionMode] = useState<'active' | 'flag'>('active');
  const [toast, setToast] = useState('');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerUser, setDrawerUser] = useState<any>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerError, setDrawerError] = useState('');
  const [drawerSummary, setDrawerSummary] = useState<any>(null);
  const [drawerAudit, setDrawerAudit] = useState<any[]>([]);
  const [drawerTab, setDrawerTab] = useState<'summary' | 'activity' | 'related'>('summary');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    if (debouncedSearch) p.set('search', debouncedSearch);
    p.set('page', String(page));
    p.set('limit', String(limit));
    return p.toString();
  }, [debouncedSearch, page, limit]);

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('authToken');
      const res = await fetch(createApiUrl(`/api/admin/users?${queryString}`), {
        headers: {
          Authorization: `Bearer ${token || ''}`,
          'Content-Type': 'application/json',
        },
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = payload?.message || `Users yüklenemedi (HTTP ${res.status})`;
        throw new Error(msg);
      }
      setItems(Array.isArray(payload?.data) ? payload.data : []);
    } catch (e: any) {
      setError(e?.message || 'Users yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [queryString]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const openUserId = params.get('openUserId');
    if (!openUserId) return;
    const match = items.find(x => String(x.id) === String(openUserId));
    if (match) {
      openDrawer(match);
    } else {
      openDrawer({ id: openUserId, email: openUserId, role: '-', isActive: true });
    }
  }, [location.search, items]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const openAction = (u: any) => {
    if (actionSubmitting) return;
    setActionMode('active');
    setActionUser(u);
    setActionReason('');
    setActionOpen(true);
  };

  const openFlagAction = (u: any) => {
    if (actionSubmitting) return;
    setActionMode('flag');
    setActionUser(u);
    setActionReason('');
    setActionOpen(true);
  };

  const openDrawer = async (u: any) => {
    setDrawerOpen(true);
    setDrawerUser(u);
    setDrawerError('');
    setDrawerSummary(null);
    setDrawerAudit([]);
    setDrawerTab('summary');

    try {
      setDrawerLoading(true);
      const token = localStorage.getItem('authToken');
      const res = await fetch(createApiUrl(`/api/admin/users/${encodeURIComponent(String(u.id))}/summary`), {
        headers: {
          Authorization: `Bearer ${token || ''}`,
          'Content-Type': 'application/json',
        },
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(payload?.message || `User detail yüklenemedi (HTTP ${res.status})`);
      }
      setDrawerSummary(payload?.data?.summary || null);
      setDrawerAudit(Array.isArray(payload?.data?.lastAudit) ? payload.data.lastAudit : []);
      if (payload?.data?.user) {
        setDrawerUser((prev: any) => ({ ...prev, ...payload.data.user }));
      }
    } catch (e: any) {
      setDrawerError(e?.message || 'User detail yüklenemedi');
    } finally {
      setDrawerLoading(false);
    }
  };

  const closeDrawer = () => {
    if (actionSubmitting) return;
    setDrawerOpen(false);
    setDrawerUser(null);
    setDrawerSummary(null);
    setDrawerAudit([]);
    setDrawerError('');
    setDrawerTab('summary');
  };

  const closeAction = () => {
    if (actionSubmitting) return;
    setActionOpen(false);
    setActionUser(null);
    setActionReason('');
    setActionMode('active');
  };

  const submitAction = async () => {
    const u = actionUser;
    if (!u) return;
    const reason = actionReason.trim();
    if (reason.length < 3) {
      setError('Sebep en az 3 karakter olmalı');
      return;
    }

    try {
      setActionSubmitting(true);
      setError('');
      const token = localStorage.getItem('authToken');
      const nextActive = !(u.isActive === false);
      const desiredActive = !nextActive;

      const res = await fetch(createApiUrl(`/api/admin/users/${encodeURIComponent(String(u.id))}/active`), {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token || ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: desiredActive, reason }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = payload?.message || `İşlem başarısız (HTTP ${res.status})`;
        throw new Error(msg);
      }
      if (!desiredActive && payload?.data?.createdFlag === false) {
        const detail = payload?.data?.flagError ? ` (flag: ${String(payload.data.flagError)})` : '';
        setToast(`Kullanıcı banlandı${detail}`);
      } else {
        setToast(desiredActive ? 'Kullanıcı açıldı' : 'Kullanıcı banlandı');
      }
      closeAction();
      await load();

      if (drawerOpen && drawerUser?.id === u.id) {
        await openDrawer({ ...drawerUser, isActive: desiredActive });
      }
    } catch (e: any) {
      setError(e?.message || 'İşlem başarısız');
    } finally {
      setActionSubmitting(false);
    }
  };

  const createFlag = async () => {
    const u = drawerUser;
    if (!u) return;
    const reason = actionReason.trim();
    if (reason.length < 3) {
      setError('Sebep en az 3 karakter olmalı');
      return;
    }
    try {
      setActionSubmitting(true);
      setError('');
      const token = localStorage.getItem('authToken');
      const res = await fetch(createApiUrl('/api/admin/flags'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token || ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'spam', targetType: 'user', targetId: String(u.id), reason }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(payload?.message || `Flag oluşturulamadı (HTTP ${res.status})`);
      }
      setToast('Flag oluşturuldu');
      closeAction();
      await openDrawer(u);
    } catch (e: any) {
      setError(e?.message || 'Flag oluşturulamadı');
    } finally {
      setActionSubmitting(false);
    }
  };

  return (
    <div className='min-h-[calc(100vh-56px)] bg-gray-50'>
      <Helmet>
        <title>Kullanıcılar - Admin</title>
      </Helmet>

      <div className='container-custom py-6 lg:py-10'>
        <div className='mb-6'>
          <h1 className='text-3xl font-bold tracking-tight text-slate-900'>Kullanıcılar</h1>
          <p className='text-slate-600 mt-1'>Arama, durum ve hızlı aksiyonlar</p>
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

        <div className='card p-6 lg:p-7'>
          <div className='flex flex-col lg:flex-row lg:items-center gap-3'>
            <div className='flex-1'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
                <input
                  className='input pl-10'
                  value={search}
                  placeholder='email / telefon / userId / adminRef'
                  onChange={e => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>
          </div>

          <div className='mt-6 overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='text-left bg-gray-50 border-b border-gray-200'>
                  <th className='py-3 pr-4 font-semibold text-slate-700'>ID</th>
                  <th className='py-3 pr-4 font-semibold text-slate-700'>Email</th>
                  <th className='py-3 pr-4 font-semibold text-slate-700'>Rol</th>
                  <th className='py-3 pr-4 font-semibold text-slate-700'>Durum</th>
                  <th className='py-3 pr-4 font-semibold text-slate-700'>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className='py-4 text-slate-600' colSpan={5}>
                      Yükleniyor...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td className='py-4 text-slate-600' colSpan={5}>
                      Kayıt yok
                    </td>
                  </tr>
                ) : (
                  items.map(u => {
                    const active = !(u.isActive === false);
                    return (
                      <tr key={String(u.id)} className='border-b border-gray-100 hover:bg-gray-50/60'>
                        <td className='py-3 pr-4 text-slate-700'>{String(u.id)}</td>
                        <td className='py-3 pr-4 text-slate-900 font-medium'>
                          <button className='text-left hover:underline' onClick={() => openDrawer(u)}>
                            {u.email || '-'}
                          </button>
                        </td>
                        <td className='py-3 pr-4 text-slate-700'>{u.role || '-'}</td>
                        <td className='py-3 pr-4'>
                          <span
                            className={
                              active
                                ? 'inline-flex items-center px-2 py-1 rounded-md bg-green-50 text-green-700 border border-green-200 text-xs font-semibold'
                                : 'inline-flex items-center px-2 py-1 rounded-md bg-red-50 text-red-700 border border-red-200 text-xs font-semibold'
                            }
                          >
                            {active ? 'Aktif' : 'Pasif'}
                          </span>
                        </td>
                        <td className='py-3 pr-4'>
                          <button className='btn-secondary' onClick={() => openAction(u)} disabled={actionSubmitting}>
                            <span className='inline-flex items-center gap-2'>
                              {active ? (
                                <>
                                  <ShieldOff className='w-4 h-4' /> Ban
                                </>
                              ) : (
                                <>
                                  <ShieldCheck className='w-4 h-4' /> Aç
                                </>
                              )}
                            </span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className='mt-5 flex items-center justify-between'>
            <button
              className='btn-secondary'
              onClick={() => setPage((p: number) => Math.max(1, p - 1))}
              disabled={loading || page <= 1}
            >
              Önceki
            </button>
            <div className='text-xs font-semibold text-slate-600'>Sayfa: {page}</div>
            <button
              className='btn-secondary'
              onClick={() => setPage((p: number) => p + 1)}
              disabled={loading || items.length < limit}
            >
              Sonraki
            </button>
          </div>
        </div>

        {actionOpen && actionUser && (
          <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
            <div className='absolute inset-0 bg-black/40' onClick={closeAction} />
            <div className='relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-200 p-6'>
              <div className='text-lg font-bold text-slate-900'>
                {actionUser.isActive === false ? 'Kullanıcıyı aç' : 'Kullanıcıyı banla'}
              </div>
              <div className='text-sm text-slate-600 mt-1'>
                {actionUser.email || actionUser.id}
              </div>

              <div className='mt-4'>
                <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Sebep</div>
                <textarea
                  className='input mt-2 min-h-[90px]'
                  value={actionReason}
                  onChange={e => setActionReason(e.target.value)}
                  placeholder='Sebep yaz (zorunlu)'
                />
              </div>

              <div className='mt-5 flex items-center justify-end gap-2'>
                <button className='btn-secondary' onClick={closeAction} disabled={actionSubmitting}>
                  Vazgeç
                </button>
                <button
                  className='btn-primary'
                  onClick={actionMode === 'flag' ? createFlag : submitAction}
                  disabled={actionSubmitting}
                >
                  {actionSubmitting ? 'İşleniyor...' : 'Onayla'}
                </button>
              </div>
            </div>
          </div>
        )}

        {drawerOpen && drawerUser && (
          <div className='fixed inset-0 z-40'>
            <div className='absolute inset-0 bg-black/30' onClick={closeDrawer} />
            <div className='absolute right-0 top-0 h-full w-full max-w-xl bg-white border-l border-gray-200 shadow-2xl'>
              <div className='h-full flex flex-col'>
                <div className='p-5 border-b border-gray-200 flex items-start justify-between gap-4 sticky top-0 bg-white z-10'>
                  <div>
                    <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Kullanıcı Detayı</div>
                    <div className='text-xl font-bold tracking-tight text-slate-900 mt-1'>{drawerUser.email || drawerUser.id}</div>
                    <div className='text-sm text-slate-600 mt-1'>Rol: {drawerUser.role || '-'}</div>
                  </div>
                  <button className='btn-secondary' onClick={closeDrawer}>
                    <span className='inline-flex items-center gap-2'>
                      <X className='w-4 h-4' /> Kapat
                    </span>
                  </button>
                </div>

                <div className='px-5 pt-4 pb-4 border-b border-gray-200 bg-white sticky top-[92px] z-10'>
                  <div className='flex flex-col gap-3'>
                    <div className='grid grid-cols-2 gap-2'>
                      <button
                        className={drawerUser.isActive === false ? 'btn-primary' : 'btn-secondary'}
                        onClick={() => openAction(drawerUser)}
                        disabled={actionSubmitting || drawerLoading}
                      >
                        <span className='inline-flex items-center gap-2'>
                          {drawerUser.isActive === false ? (
                            <>
                              <ShieldCheck className='w-4 h-4' /> Aç
                            </>
                          ) : (
                            <>
                              <ShieldOff className='w-4 h-4' /> Ban
                            </>
                          )}
                        </span>
                      </button>

                      <button
                        className='btn-secondary'
                        onClick={() => openFlagAction(drawerUser)}
                        disabled={actionSubmitting || drawerLoading}
                      >
                        <span className='inline-flex items-center gap-2'>
                          <Flag className='w-4 h-4' /> Flag
                        </span>
                      </button>
                    </div>

                    <div className='flex flex-wrap gap-2'>
                      <button
                        className={
                          'px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ' +
                          (drawerTab === 'summary'
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-gray-200 hover:bg-gray-50')
                        }
                        onClick={() => setDrawerTab('summary')}
                      >
                        Özet
                      </button>
                      <button
                        className={
                          'px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ' +
                          (drawerTab === 'activity'
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-gray-200 hover:bg-gray-50')
                        }
                        onClick={() => setDrawerTab('activity')}
                      >
                        Aktivite
                      </button>
                      <button
                        className={
                          'px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ' +
                          (drawerTab === 'related'
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-gray-200 hover:bg-gray-50')
                        }
                        onClick={() => setDrawerTab('related')}
                      >
                        İlişkili
                      </button>
                    </div>

                    <div className='text-xs text-slate-600'>Kritik aksiyonlarda sebep zorunlu ve audit kaydı tutulur.</div>
                  </div>
                </div>

                <div className='flex-1 overflow-y-auto p-5 space-y-6'>
                  {drawerError && (
                    <div className='p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700'>
                      {drawerError}
                    </div>
                  )}

                  {drawerTab === 'summary' && (
                    <div className='card p-5'>
                      <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Özet</div>
                      <div className='mt-3 grid grid-cols-2 gap-3'>
                        <div className='p-3 bg-gray-50 border border-gray-200 rounded-xl'>
                          <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Durum</div>
                          <div className='text-sm font-semibold text-slate-900 mt-1'>
                            {drawerUser.isActive === false ? 'Pasif (Ban)' : 'Aktif'}
                          </div>
                        </div>
                        <div className='p-3 bg-gray-50 border border-gray-200 rounded-xl'>
                          <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Risk</div>
                          <div className='text-sm font-semibold text-slate-900 mt-1'>
                            {(drawerSummary?.flagsOpen ?? 0) > 0 || (drawerSummary?.complaintsOpen ?? 0) > 0
                              ? 'İzleme'
                              : 'Normal'}
                          </div>
                        </div>
                        <div className='p-3 bg-gray-50 border border-gray-200 rounded-xl'>
                          <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Açık Flag</div>
                          <div className='text-2xl font-bold text-slate-900 mt-1'>{drawerSummary?.flagsOpen ?? 0}</div>
                        </div>
                        <div className='p-3 bg-gray-50 border border-gray-200 rounded-xl'>
                          <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Açık Şikayet</div>
                          <div className='text-2xl font-bold text-slate-900 mt-1'>{drawerSummary?.complaintsOpen ?? 0}</div>
                        </div>
                      </div>
                      <div className='mt-4 p-3 bg-gray-50 border border-gray-200 rounded-xl'>
                        <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Not</div>
                        <div className='text-xs text-slate-600 mt-1'>
                          Bu bölümde ileride doğrulama bilgileri ve kullanıcı sinyalleri toplanacak.
                        </div>
                      </div>
                    </div>
                  )}

                  {drawerTab === 'activity' && (
                    <div className='card p-5'>
                      <div className='flex items-center justify-between'>
                        <div>
                          <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Aktivite</div>
                          <div className='text-xs text-slate-600 mt-1'>Son 25 aksiyon</div>
                        </div>
                      </div>

                      {drawerLoading ? (
                        <div className='text-sm text-slate-600 mt-3'>Yükleniyor...</div>
                      ) : drawerAudit.length === 0 ? (
                        <div className='mt-3 p-4 bg-gray-50 border border-gray-200 rounded-xl'>
                          <div className='text-sm font-semibold text-slate-900'>Kayıt yok</div>
                          <div className='text-xs text-slate-600 mt-1'>Bu kullanıcı için henüz audit kaydı oluşmamış.</div>
                        </div>
                      ) : (
                        <div className='mt-4 space-y-3'>
                          {drawerAudit.map((a, idx) => (
                            <div key={a?.id || idx} className='flex gap-3'>
                              <div className='flex flex-col items-center pt-1'>
                                <div className='w-2.5 h-2.5 rounded-full bg-slate-900' />
                                <div className='w-px flex-1 bg-gray-200 mt-2' />
                              </div>
                              <div className='flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl'>
                                <div className='flex items-start justify-between gap-3'>
                                  <div className='text-sm font-semibold text-slate-900'>{a.action}</div>
                                  <div className='text-[11px] font-semibold text-slate-500 whitespace-nowrap'>
                                    {a.createdAt ? new Date(a.createdAt).toLocaleString() : '-'}
                                  </div>
                                </div>
                                {a.resourceType && (
                                  <div className='text-xs text-slate-600 mt-1'>
                                    {a.resourceType}{a.resourceId ? `:${a.resourceId}` : ''}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {drawerTab === 'related' && (
                    <div className='card p-5'>
                      <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>İlişkili</div>
                      <div className='mt-3 p-4 bg-gray-50 border border-gray-200 rounded-xl'>
                        <div className='text-sm font-semibold text-slate-900'>Hazırlanıyor</div>
                        <div className='text-xs text-slate-600 mt-1'>
                          İlişkili gönderiler/teklifler/mesajlar backend onayı sonrası burada görünecek.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;
