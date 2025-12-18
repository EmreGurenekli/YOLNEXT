import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { createApiUrl } from '../../config/api';
import { AlertTriangle, Layers, Search, Shield, Command, Zap, Users, FileText, Activity, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAdminBasePath } from '../../config/admin';

type QueueKey = 'operasyon' | 'guvenlik' | 'sikayet';

const Operations: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [briefing, setBriefing] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);

  const [queue, setQueue] = useState<QueueKey>('operasyon');

  const [query, setQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchUsers, setSearchUsers] = useState<any[]>([]);

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState('');
  const [paletteLoading, setPaletteLoading] = useState(false);
  const [paletteUsers, setPaletteUsers] = useState<any[]>([]);

  const [inlineUserLoading, setInlineUserLoading] = useState(false);
  const [inlineUserError, setInlineUserError] = useState('');
  const [inlineUser, setInlineUser] = useState<any>(null);
  const [inlineUserSummary, setInlineUserSummary] = useState<any>(null);

  const token = useMemo(() => localStorage.getItem('authToken') || '', []);
  const location = useLocation();
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
        throw new Error(inboxPayload?.message || `Triage yüklenemedi (HTTP ${inboxRes.status})`);
      }

      const b = briefingPayload?.data?.briefing || briefingPayload?.briefing || briefingPayload?.data || null;
      setBriefing(b);

      const list = inboxPayload?.data?.items || [];
      setItems(Array.isArray(list) ? list : []);
      setSelected((prev: any) => prev || (Array.isArray(list) && list.length ? list[0] : null));
    } catch (e: any) {
      setError(e?.message || 'Operasyon masası yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const loadInlineUser = async (userId: string) => {
    try {
      setInlineUserLoading(true);
      setInlineUserError('');
      setInlineUser(null);
      setInlineUserSummary(null);

      const res = await fetch(createApiUrl(`/api/admin/users/${encodeURIComponent(userId)}/summary`), {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(payload?.message || `User summary failed (HTTP ${res.status})`);
      }
      setInlineUser(payload?.data?.user || null);
      setInlineUserSummary(payload?.data?.summary || null);
    } catch (e: any) {
      setInlineUserError(e?.message || 'Kullanıcı detayı yüklenemedi');
    } finally {
      setInlineUserLoading(false);
    }
  };

  const runPaletteSearch = async (q: string) => {
    const value = q.trim();
    if (value.length < 2) {
      setPaletteUsers([]);
      return;
    }
    try {
      setPaletteLoading(true);
      const res = await fetch(createApiUrl(`/api/admin/search?q=${encodeURIComponent(value)}`), {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) throw new Error(payload?.message || `Search failed (HTTP ${res.status})`);
      setPaletteUsers(Array.isArray(payload?.data?.users) ? payload.data.users : []);
    } catch {
      setPaletteUsers([]);
    } finally {
      setPaletteLoading(false);
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toLowerCase().includes('mac');
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (mod && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setPaletteOpen(true);
      }
      if (e.key === 'Escape') {
        setPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const userId = selected?.relatedUserId || selected?.userId || null;
    if (!userId) {
      setInlineUser(null);
      setInlineUserSummary(null);
      setInlineUserError('');
      setInlineUserLoading(false);
      return;
    }
    loadInlineUser(String(userId));
  }, [selected?.userId, selected?.relatedUserId]);

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const focus = (params.get('focus') || '').trim();
    if (!focus) return;
    setQuery(focus);
    runSearch(focus);
  }, [location.search]);

  const runSearch = async (q: string) => {
    const value = q.trim();
    if (value.length < 2) {
      setSearchUsers([]);
      return;
    }
    try {
      setSearchLoading(true);
      const res = await fetch(createApiUrl(`/api/admin/search?q=${encodeURIComponent(value)}`), {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) throw new Error(payload?.message || `Search failed (HTTP ${res.status})`);
      setSearchUsers(Array.isArray(payload?.data?.users) ? payload.data.users : []);
    } catch {
      setSearchUsers([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const queueTitle = (k: QueueKey) => {
    if (k === 'operasyon') return 'Operasyon';
    if (k === 'guvenlik') return 'Güvenlik';
    return 'Şikayet';
  };

  const queueCounts = useMemo(() => {
    const complaint = items.filter(x => x?.type === 'complaint').length;
    const security = items.filter(x => x?.type === 'flag' || x?.type === 'audit').length;
    return {
      operasyon: items.length,
      guvenlik: security,
      sikayet: complaint,
    } as Record<QueueKey, number>;
  }, [items]);

  const badgeFor = (it: any) => {
    const t = String(it?.type || '').toLowerCase();
    if (t === 'complaint') {
      return {
        label: 'Dikkat',
        className:
          'inline-flex items-center px-2 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold',
      };
    }
    if (t === 'flag') {
      return {
        label: 'Kritik',
        className:
          'inline-flex items-center px-2 py-1 rounded-md bg-red-50 text-red-700 border border-red-200 text-[11px] font-semibold',
      };
    }
    if (t === 'audit') {
      return {
        label: 'Normal',
        className:
          'inline-flex items-center px-2 py-1 rounded-md bg-slate-50 text-slate-700 border border-slate-200 text-[11px] font-semibold',
      };
    }
    if (t === 'info') {
      return {
        label: 'Temiz',
        className:
          'inline-flex items-center px-2 py-1 rounded-md bg-gray-50 text-gray-700 border border-gray-200 text-[11px] font-semibold',
      };
    }
    return {
      label: 'Normal',
      className:
        'inline-flex items-center px-2 py-1 rounded-md bg-slate-50 text-slate-700 border border-slate-200 text-[11px] font-semibold',
    };
  };

  const filtered = useMemo(() => {
    if (queue === 'sikayet') {
      return items.filter(x => x?.type === 'complaint');
    }
    if (queue === 'guvenlik') {
      return items.filter(x => x?.type === 'flag' || x?.type === 'audit');
    }
    return items;
  }, [items, queue]);

  const liveActivity = useMemo(() => {
    const list = Array.isArray(items) ? items.slice() : [];
    const getTs = (x: any) => {
      const v = x?.createdAt || x?.created_at || null;
      const d = v ? new Date(v) : null;
      return d && !Number.isNaN(d.valueOf()) ? d.valueOf() : 0;
    };
    list.sort((a, b) => getTs(b) - getTs(a));
    return list.slice(0, 6);
  }, [items]);

  const nextBest = useMemo(() => {
    const t = String(selected?.type || '').toLowerCase();
    if (!selected) {
      return {
        title: 'Başla',
        desc: 'Soldan bir kuyruk kaydı seç. Sonra inspector’dan tek aksiyonla ilerle.',
        primary: null as null | { label: string; onClick: () => void },
      };
    }

    if (t === 'complaint') {
      const hasUser = Boolean(selected?.relatedUserId || selected?.userId);
      return {
        title: 'Şikayet incele',
        desc: hasUser
          ? 'Önce ilgili kullanıcı(ları) aç, hızlı aksiyonları değerlendir. Gerekirse vaka oluştur.'
          : 'Şikayet kaydında kullanıcı bağlantısı yok. Kullanıcı araması ile ilerle.',
        primary: hasUser
          ? {
              label: 'İlgili kullanıcıyı aç',
              onClick: () => {
                const openId = selected?.relatedUserId || selected?.userId;
                if (!openId) return;
                navigate(`${base}/users?openUserId=${encodeURIComponent(String(openId))}`);
              },
            }
          : {
              label: 'Komut aramasına dön',
              onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
            },
      };
    }

    if (t === 'flag') {
      const hasUser = Boolean(selected?.userId);
      return {
        title: 'Risk/Flag incele',
        desc: hasUser
          ? 'Kullanıcı profilinde risk sinyallerini ve audit geçmişini kontrol et. Gerekirse ban/flag aksiyonu al.'
          : 'Hedef bilgisi sınırlı. Sistem ekranında kayıtları inceleyebilirsin.',
        primary: hasUser
          ? {
              label: 'Kullanıcıyı aç',
              onClick: () => navigate(`${base}/users?openUserId=${encodeURIComponent(String(selected.userId))}`),
            }
          : {
              label: 'Sistem kayıtlarını aç',
              onClick: () => navigate(`${base}/system`),
            },
      };
    }

    if (t === 'audit') {
      const hasUser = Boolean(selected?.userId);
      return {
        title: 'Audit kontrolü',
        desc: hasUser
          ? 'Bu aksiyonun hangi kullanıcıyla ilişkili olduğunu kontrol et. Gerekirse kullanıcı profilinden devam et.'
          : 'Detaylı inceleme için sistem kayıtlarına geçebilirsin.',
        primary: hasUser
          ? {
              label: 'Kullanıcıyı aç',
              onClick: () => navigate(`${base}/users?openUserId=${encodeURIComponent(String(selected.userId))}`),
            }
          : {
              label: 'Sistem kayıtlarını aç',
              onClick: () => navigate(`${base}/system`),
            },
      };
    }

    return {
      title: 'İlerle',
      desc: 'Inspector’dan ilgili sayfaya geçip aksiyon al.',
      primary: {
        label: 'Kullanıcılara git',
        onClick: () => navigate(`${base}/users`),
      },
    };
  }, [base, navigate, selected]);

  const Tab = ({ k }: { k: QueueKey }) => (
    <button
      className={
        'px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ' +
        (queue === k
          ? 'bg-slate-900 text-white border-slate-900'
          : 'bg-white text-slate-700 border-gray-200 hover:bg-gray-50')
      }
      onClick={() => setQueue(k)}
    >
      <span className='inline-flex items-center gap-2'>
        <span>{queueTitle(k)}</span>
        <span
          className={
            'inline-flex items-center justify-center min-w-6 px-2 h-5 rounded-full text-[11px] font-bold ' +
            (queue === k ? 'bg-white/15 text-white' : 'bg-gray-100 text-slate-700')
          }
        >
          {queueCounts[k] ?? 0}
        </span>
      </span>
    </button>
  );

  return (
    <div className='min-h-[calc(100vh-56px)] bg-gray-50'>
      <Helmet>
        <title>Operasyon Masası - Admin</title>
      </Helmet>

      <div className='container-custom py-6 lg:py-10'>
        <div className='mb-6 lg:mb-8 flex items-start justify-between gap-4'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center'>
              <Shield className='w-5 h-5' />
            </div>
            <div>
              <h1 className='text-3xl font-bold tracking-tight text-slate-900'>Operasyon Masası</h1>
              <div className='text-sm text-slate-600 mt-1'>Kuyruklar, tek inspector ve hızlı aksiyon</div>
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <button
              className='btn-secondary'
              onClick={() => setPaletteOpen(true)}
              title='Komut Paleti (Ctrl+K)'
            >
              <span className='inline-flex items-center gap-2'>
                <Command className='w-4 h-4' />
                Ctrl+K
              </span>
            </button>
            <button className='btn-secondary' onClick={load} disabled={loading}>
              Yenile
            </button>
          </div>
        </div>

        <div className='mb-6 grid grid-cols-1 lg:grid-cols-4 gap-4'>
          <div className='lg:col-span-3 card p-5 border border-blue-100 bg-gradient-to-r from-blue-50/70 to-white hover:from-blue-50 hover:to-blue-50/20 transition-colors'>
            <div className='flex items-start justify-between gap-4'>
              <div>
                <div className='text-xs font-semibold text-blue-700 uppercase tracking-wider'>Quick Actions</div>
                <div className='text-sm font-semibold text-slate-900 mt-1'>Tek tıkla ilerle</div>
                <div className='text-xs text-slate-600 mt-1'>Sayfa açmadan, doğru yere yönlendirir.</div>
              </div>
              <div className='inline-flex items-center gap-2 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-1 rounded-md'>
                <Zap className='w-4 h-4' />
                kontrol sende
              </div>
            </div>

            <div className='mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2'>
              <button className='btn-secondary' onClick={() => setPaletteOpen(true)}>
                <span className='inline-flex items-center gap-2'>
                  <Command className='w-4 h-4' /> Komut
                </span>
              </button>
              <button className='btn-secondary' onClick={() => navigate(`${base}/users`)}>
                <span className='inline-flex items-center gap-2'>
                  <Users className='w-4 h-4' /> Kullanıcılar
                </span>
              </button>
              <button className='btn-secondary' onClick={() => navigate(`${base}/cases`)}>
                <span className='inline-flex items-center gap-2'>
                  <FileText className='w-4 h-4' /> Vakalar
                </span>
              </button>
              <button className='btn-secondary' onClick={() => navigate(`${base}/system`)}>
                <span className='inline-flex items-center gap-2'>
                  <Activity className='w-4 h-4' /> Sistem
                </span>
              </button>
            </div>
          </div>

          <div className='card p-5'>
            <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Canlı Durum</div>
            <div className='mt-2 text-sm font-semibold text-slate-900'>
              {queueCounts.guvenlik > 0 ? 'Dikkat' : queueCounts.sikayet > 0 ? 'Takip' : 'Normal'}
            </div>
            <div className='mt-3 flex items-center gap-2 text-xs'>
              <span className='inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-800 border border-blue-200 font-semibold'>
                Ops {queueCounts.operasyon}
              </span>
              <span className='inline-flex items-center px-2 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-semibold'>
                Şikayet {queueCounts.sikayet}
              </span>
              <span className='inline-flex items-center px-2 py-1 rounded-md bg-red-50 text-red-700 border border-red-200 font-semibold'>
                Güvenlik {queueCounts.guvenlik}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700'>
            {error}
          </div>
        )}

        <div className='card p-6 lg:p-7'>
          <div className='flex items-start justify-between gap-4'>
            <div>
              <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Komut Araması</div>
              <div className='text-sm text-slate-700 font-semibold mt-1'>Bir hedef yaz, direkt aksiyona git</div>
              <div className='text-xs text-slate-600 mt-1'>Örn: email, userId, adminRef</div>
            </div>
            <div className='text-xs font-semibold text-slate-500'>Enter: kullanıcı listesi</div>
          </div>

          <div className='mt-4'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
              <input
                className='input pl-10'
                value={query}
                placeholder='AdminRef / email / telefon / userId / shipmentId'
                onChange={e => {
                  const v = e.target.value;
                  setQuery(v);
                  runSearch(v);
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const q = (e.currentTarget.value || '').trim();
                    if (!q) return;
                    navigate(`${base}/users?search=${encodeURIComponent(q)}`);
                  }
                }}
              />
            </div>

            {searchLoading ? (
              <div className='text-sm text-slate-600 mt-3'>Aranıyor...</div>
            ) : searchUsers.length === 0 ? (
              <div className='mt-3 p-4 bg-gray-50 border border-gray-200 rounded-xl'>
                <div className='text-sm font-semibold text-slate-900'>Sonuç yok</div>
                <div className='text-xs text-slate-600 mt-1'>İpucu: email veya userId ile dene.</div>
              </div>
            ) : (
              <div className='mt-3 grid grid-cols-1 md:grid-cols-2 gap-2'>
                {searchUsers.slice(0, 4).map((u, idx) => (
                  <button
                    key={u?.id || idx}
                    className='p-3 bg-gray-50 border border-gray-200 rounded-xl text-left hover:bg-white transition-colors'
                    onClick={() => navigate(`${base}/users?openUserId=${encodeURIComponent(String(u.id))}`)}
                  >
                    <div className='text-sm font-semibold text-slate-900'>{u.email || u.id}</div>
                    <div className='text-xs text-slate-600 mt-1'>Rol: {u.role || '-'}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className='mt-6 lg:mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
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
            <div className='text-xs text-slate-600 mt-2'>pending/reviewing</div>
          </div>
        </div>

        <div className='mt-6 lg:mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6'>
          <div className='lg:col-span-2 space-y-6'>
            <div className='card p-6'>
              <div className='flex items-start justify-between gap-4'>
                <div>
                  <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Kuyruklar</div>
                  <div className='text-xl font-bold tracking-tight text-slate-900 mt-1'>Bugün neyi çözüyoruz?</div>
                  <div className='text-sm text-slate-600 mt-1'>Kuyruk seç, kayıt seç, inspector’dan aksiyon al.</div>
                </div>
                <div className='flex flex-wrap gap-2'>
                  <Tab k='operasyon' />
                  <Tab k='guvenlik' />
                  <Tab k='sikayet' />
                </div>
              </div>

              {loading ? (
                <div className='text-sm text-slate-600 mt-4'>Yükleniyor...</div>
              ) : (
                <div className='mt-4 space-y-2'>
                  {filtered.length === 0 ? (
                    <div className='p-4 bg-gray-50 border border-gray-200 rounded-xl'>
                      <div className='text-sm font-semibold text-slate-900'>Kuyruk boş</div>
                      <div className='text-xs text-slate-600 mt-1'>Bu alanda bekleyen iş yok. Komut araması ile kullanıcı bulabilir veya sistem kayıtlarına bakabilirsin.</div>
                      <div className='mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2'>
                        <button className='btn-secondary' onClick={() => navigate(`${base}/users`)}>
                          Kullanıcılara git
                        </button>
                        <button className='btn-secondary' onClick={() => navigate(`${base}/system`)}>
                          Sistem kayıtları
                        </button>
                      </div>
                    </div>
                  ) : (
                    filtered.slice(0, 10).map((it, idx) => {
                      const active = selected?.id === it?.id;
                      const badge = badgeFor(it);
                      const createdAt = it?.createdAt ? new Date(it.createdAt) : null;
                      return (
                        <button
                          key={it?.id || idx}
                          className={
                            'w-full text-left p-4 rounded-xl border transition-colors relative overflow-hidden ' +
                            (active
                              ? 'bg-white border-slate-900'
                              : 'bg-gray-50 border-gray-200 hover:bg-white')
                          }
                          onClick={() => setSelected(it)}
                        >
                          {active && <div className='absolute left-0 top-0 h-full w-1 bg-slate-900' />}
                          <div className='flex items-start justify-between gap-4'>
                            <div>
                              <div className='flex items-center gap-2'>
                                <div className='text-sm font-semibold text-slate-900'>
                                  {it?.title || it?.type || 'Kayıt'}
                                </div>
                                <span className={badge.className}>{badge.label}</span>
                              </div>
                              <div className='text-xs text-slate-600 mt-1'>
                                {it?.summary || 'Detay yok'}
                              </div>
                              {(it?.type === 'complaint' || it?.type === 'flag' || it?.type === 'audit') && (
                                <div className='text-[11px] text-slate-500 mt-2'>
                                  {it?.type === 'complaint' ? 'Kuyruk: Şikayet' : it?.type === 'flag' ? 'Kuyruk: Güvenlik' : 'Kuyruk: Sistem'}
                                  {createdAt ? ` • ${createdAt.toLocaleString()}` : ''}
                                </div>
                              )}
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
              )}
            </div>
          </div>

          <div className='space-y-6'>
            <div className='card p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Inspector</div>
                  <div className='inline-flex items-center gap-2 text-xs font-semibold text-slate-600'>
                    <Layers className='w-4 h-4' />
                    Tek panel
                  </div>
                </div>
              </div>

              {!selected ? (
                <div className='mt-3 p-4 bg-gray-50 border border-gray-200 rounded-xl'>
                  <div className='text-sm font-semibold text-slate-900'>Seçim yok</div>
                  <div className='text-xs text-slate-600 mt-1'>Soldan bir kayıt seçince burada detay ve aksiyonlar açılır.</div>
                </div>
              ) : (
                <>
                  <div className='mt-3 inline-flex items-center gap-2 text-[11px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-2 py-1 rounded-md'>
                    <span>type: {String(selected?.type || '-')}</span>
                    <span className='text-slate-300'>|</span>
                    <span>id: {String(selected?.id || '-')}</span>
                  </div>
                  <div className='text-lg font-bold tracking-tight text-slate-900 mt-3'>
                    {selected?.title || selected?.type || 'Kayıt'}
                  </div>
                  <div className='text-sm text-slate-600 mt-2'>{selected?.summary || '-'}</div>

                  <div className='mt-4 p-4 bg-gray-50 border border-gray-200 rounded-xl'>
                    <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Önerilen Aksiyon</div>
                    <div className='text-sm font-semibold text-slate-900 mt-2'>{nextBest.title}</div>
                    <div className='text-xs text-slate-600 mt-1'>{nextBest.desc}</div>
                    {nextBest.primary && (
                      <button className='btn-primary w-full mt-3' onClick={nextBest.primary.onClick}>
                        {nextBest.primary.label}
                      </button>
                    )}
                  </div>

                  {(selected?.userId || selected?.relatedUserId) && (
                    <div className='mt-4 p-4 bg-white border border-gray-200 rounded-xl'>
                      <div className='flex items-start justify-between gap-3'>
                        <div>
                          <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Kullanıcı Özeti</div>
                          <div className='text-sm font-semibold text-slate-900 mt-1'>
                            {inlineUserLoading
                              ? 'Yükleniyor...'
                              : inlineUser?.email || String(selected?.relatedUserId || selected?.userId)}
                          </div>
                          <div className='text-xs text-slate-600 mt-1'>Rol: {inlineUser?.role || '-'}</div>
                        </div>
                        <button
                          className='btn-secondary'
                          onClick={() => {
                            const openId = selected?.relatedUserId || selected?.userId;
                            if (!openId) return;
                            navigate(`${base}/users?openUserId=${encodeURIComponent(String(openId))}`);
                          }}
                        >
                          Aç
                        </button>
                      </div>

                      {inlineUserError && (
                        <div className='mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700'>
                          {inlineUserError}
                        </div>
                      )}

                      {!inlineUserLoading && !inlineUserError && (
                        <div className='mt-4 grid grid-cols-2 gap-3'>
                          <div className='p-3 bg-gray-50 border border-gray-200 rounded-xl'>
                            <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Durum</div>
                            <div className='text-sm font-semibold text-slate-900 mt-1'>
                              {inlineUser?.isActive === false ? 'Pasif (Ban)' : 'Aktif'}
                            </div>
                          </div>
                          <div className='p-3 bg-gray-50 border border-gray-200 rounded-xl'>
                            <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Risk</div>
                            <div className='text-sm font-semibold text-slate-900 mt-1'>
                              {(inlineUserSummary?.flagsOpen ?? 0) > 0 || (inlineUserSummary?.complaintsOpen ?? 0) > 0
                                ? 'İzleme'
                                : 'Normal'}
                            </div>
                          </div>
                          <div className='p-3 bg-gray-50 border border-gray-200 rounded-xl'>
                            <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Açık Flag</div>
                            <div className='text-2xl font-bold text-slate-900 mt-1'>{inlineUserSummary?.flagsOpen ?? 0}</div>
                          </div>
                          <div className='p-3 bg-gray-50 border border-gray-200 rounded-xl'>
                            <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Açık Şikayet</div>
                            <div className='text-2xl font-bold text-slate-900 mt-1'>{inlineUserSummary?.complaintsOpen ?? 0}</div>
                          </div>
                        </div>
                      )}

                      {!inlineUserLoading && !inlineUserError && (
                        <div className='mt-4 grid grid-cols-1 gap-2'>
                          <button
                            className='btn-secondary'
                            onClick={() => {
                              const openId = selected?.relatedUserId || selected?.userId;
                              if (!openId) return;
                              navigate(`${base}/users?openUserId=${encodeURIComponent(String(openId))}`);
                            }}
                          >
                            Kullanıcı detayına git (drawer)
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className='mt-5'>
                    <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Kısayollar</div>
                  </div>
                  <div className='mt-3 space-y-2'>
                    {selected?.userId && (
                      <button
                        className='btn-primary w-full'
                        onClick={() => navigate(`${base}/users?openUserId=${encodeURIComponent(String(selected.userId))}`)}
                      >
                        Kullanıcıyı aç
                      </button>
                    )}
                    {selected?.relatedUserId && (
                      <button
                        className='btn-secondary w-full'
                        onClick={() => navigate(`${base}/users?openUserId=${encodeURIComponent(String(selected.relatedUserId))}`)}
                      >
                        Diğer kullanıcıyı aç
                      </button>
                    )}
                    {!selected?.userId && !selected?.relatedUserId && (
                      <button className='btn-secondary w-full' onClick={() => navigate(`${base}/users`)}>
                        Kullanıcılara git
                      </button>
                    )}
                    <button className='btn-secondary w-full' onClick={() => navigate(`${base}/cases`)}>
                      Vaka yönetimine git
                    </button>
                    <button className='btn-secondary w-full' onClick={() => navigate(`${base}/system`)}>
                      Sistem kayıtlarını aç
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
      </div>

      {paletteOpen && (
        <div className='fixed inset-0 z-50'>
          <div className='absolute inset-0 bg-black/40' onClick={() => setPaletteOpen(false)} />
          <div className='absolute left-1/2 top-24 -translate-x-1/2 w-[min(760px,calc(100%-24px))]'>
            <div className='bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden'>
              <div className='p-4 border-b border-gray-200 flex items-center justify-between gap-3'>
                <div>
                  <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Komut Paleti</div>
                  <div className='text-sm font-semibold text-slate-900 mt-1'>Ara ve yönlendir</div>
                </div>
                <button className='btn-secondary' onClick={() => setPaletteOpen(false)}>
                  <span className='inline-flex items-center gap-2'>
                    <X className='w-4 h-4' /> Kapat
                  </span>
                </button>
              </div>

              <div className='p-4'>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
                  <input
                    autoFocus
                    className='input pl-10'
                    value={paletteQuery}
                    placeholder='user email / id / adminRef (2+ karakter)'
                    onChange={e => {
                      const v = e.target.value;
                      setPaletteQuery(v);
                      runPaletteSearch(v);
                    }}
                  />
                </div>

                <div className='mt-3 grid grid-cols-1 md:grid-cols-2 gap-2'>
                  <button className='btn-secondary' onClick={() => { setPaletteOpen(false); navigate(`${base}/users`); }}>
                    Kullanıcılar
                  </button>
                  <button className='btn-secondary' onClick={() => { setPaletteOpen(false); navigate(`${base}/system`); }}>
                    Sistem
                  </button>
                  <button className='btn-secondary' onClick={() => { setPaletteOpen(false); navigate(`${base}/cases`); }}>
                    Vakalar
                  </button>
                  <button className='btn-secondary' onClick={() => { setPaletteOpen(false); load(); }}>
                    Yenile
                  </button>
                </div>

                <div className='mt-4'>
                  <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Arama Sonuçları</div>
                  {paletteLoading ? (
                    <div className='text-sm text-slate-600 mt-3'>Aranıyor...</div>
                  ) : paletteUsers.length === 0 ? (
                    <div className='mt-3 p-4 bg-gray-50 border border-gray-200 rounded-xl'>
                      <div className='text-sm font-semibold text-slate-900'>Sonuç yok</div>
                      <div className='text-xs text-slate-600 mt-1'>İpucu: email veya userId ile dene.</div>
                    </div>
                  ) : (
                    <div className='mt-3 space-y-2'>
                      {paletteUsers.slice(0, 8).map((u, idx) => (
                        <button
                          key={u?.id || idx}
                          className='w-full text-left p-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-white transition-colors'
                          onClick={() => {
                            setPaletteOpen(false);
                            navigate(`${base}/users?openUserId=${encodeURIComponent(String(u.id))}`);
                          }}
                        >
                          <div className='flex items-start justify-between gap-3'>
                            <div>
                              <div className='text-sm font-semibold text-slate-900'>{u.email || u.id}</div>
                              <div className='text-xs text-slate-600 mt-1'>Rol: {u.role || '-'}</div>
                            </div>
                            <div className='text-[11px] font-semibold text-slate-500'>ID: {String(u.id)}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className='mt-4 text-[11px] text-slate-500'>Kısayol: Ctrl+K aç/kapat • Esc kapat</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Operations;
