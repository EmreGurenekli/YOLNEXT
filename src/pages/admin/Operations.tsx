import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  const [inboxCounts, setInboxCounts] = useState<any>(null);

  // Shipments table data
  const [shipments, setShipments] = useState<any[]>([]);
  const [shipmentsLoading, setShipmentsLoading] = useState(true);
  const [shipmentsError, setShipmentsError] = useState('');

  const [queue, setQueue] = useState<QueueKey>('operasyon');

  const [query, setQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchUsers, setSearchUsers] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState('');
  const [paletteLoading, setPaletteLoading] = useState(false);
  const [paletteUsers, setPaletteUsers] = useState<any[]>([]);

  const [inlineUserLoading, setInlineUserLoading] = useState(false);
  const [inlineUserError, setInlineUserError] = useState('');
  const [inlineUser, setInlineUser] = useState<any>(null);
  const [inlineUserSummary, setInlineUserSummary] = useState<any>(null);

  const token = useMemo(() => localStorage.getItem('token') || localStorage.getItem('authToken') || '', []);
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
      setInboxCounts(inboxPayload?.data?.counts || null);
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
        throw new Error(payload?.message || `Kullanıcı özeti alınamadı (HTTP ${res.status})`);
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
      if (!res.ok) throw new Error(payload?.message || `Arama başarısız (HTTP ${res.status})`);
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

  const statusFilterRef = useRef(statusFilter);
  useEffect(() => {
    statusFilterRef.current = statusFilter;
  }, [statusFilter]);

  const queryRef = useRef(query);
  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  const loadShipments = useCallback(async (opts?: { status?: string; q?: string }) => {
    try {
      setShipmentsLoading(true);
      setShipmentsError('');
      const qs = new URLSearchParams();
      const st = (opts?.status ?? statusFilterRef.current ?? 'all') as string;
      const qv = String(opts?.q ?? queryRef.current ?? '').trim();
      if (st !== 'all') qs.set('status', st);
      if (qv) qs.set('q', qv);
      qs.set('limit', '100');
      const token = localStorage.getItem('token') || localStorage.getItem('authToken') || '';
      const res = await fetch(createApiUrl(`/api/admin/shipments?${qs.toString()}`), {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(payload?.message || `Shipments yüklenemedi (HTTP ${res.status})`);
      }
      setShipments(Array.isArray(payload?.data) ? payload.data : []);
    } catch (e: any) {
      setShipmentsError(e?.message || 'Shipments yüklenemedi');
      setShipments([]);
    } finally {
      setShipmentsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadShipments({ status: statusFilter, q: query });
  }, [statusFilter, loadShipments, query]);

  useEffect(() => {
    const t = setTimeout(() => {
      loadShipments({ status: statusFilterRef.current, q: queryRef.current });
    }, 300);
    return () => clearTimeout(t);
  }, [query, loadShipments]);

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
      if (!res.ok) throw new Error(payload?.message || `Arama başarısız (HTTP ${res.status})`);
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
    const complaint = inboxCounts?.complaintOpen != null ? Number(inboxCounts.complaintOpen) : items.filter(x => x?.type === 'complaint').length;
    const dispute = inboxCounts?.disputeOpen != null ? Number(inboxCounts.disputeOpen) : items.filter(x => x?.type === 'dispute').length;
    const security = inboxCounts?.flagOpen != null ? Number(inboxCounts.flagOpen) : items.filter(x => x?.type === 'flag' || x?.type === 'audit').length;
    return {
      operasyon: inboxCounts?.totalOpen != null ? Number(inboxCounts.totalOpen) : items.length,
      guvenlik: security,
      sikayet: complaint + dispute,
    } as Record<QueueKey, number>;
  }, [items, inboxCounts]);

  const filteredShipments = useMemo(() => {
    if (statusFilter === 'all') return shipments;
    return shipments.filter(it => {
      const st = String(it?.status || it?.state || '').toLowerCase();
      if (statusFilter === 'active') return ['active', 'in_transit', 'ongoing', 'yolda', 'pending', 'waiting', 'open', 'waiting_for_offers', 'dispatched'].includes(st);
      if (statusFilter === 'done') return ['delivered', 'completed', 'teslim'].includes(st);
      if (statusFilter === 'cancelled') return ['cancelled', 'iptal', 'failed'].includes(st);
      if (statusFilter === 'dispute') return ['dispute', 'anlasmazlik', 'flag', 'complaint', 'escalated'].includes(st) || it?.type === 'complaint' || it?.type === 'flag';
      return true;
    });
  }, [shipments, statusFilter]);

  const friendlyStatus = (st: string) => {
    const s = (st || '').toLowerCase();
    if (['pending', 'waiting', 'open'].includes(s)) return { text: 'Teklif Bekliyor', className: 'bg-yellow-100 text-yellow-800' };
    if (['in_transit', 'active', 'ongoing', 'yolda'].includes(s)) return { text: 'Yolda', className: 'bg-blue-100 text-blue-800' };
    if (['delivered', 'completed', 'teslim'].includes(s)) return { text: 'Teslim Edildi', className: 'bg-green-100 text-green-800' };
    if (['cancelled', 'iptal', 'failed'].includes(s)) return { text: 'İptal', className: 'bg-red-100 text-red-800' };
    if (['dispute', 'anlasmazlik'].includes(s)) return { text: 'Sorunlu', className: 'bg-amber-100 text-amber-800' };
    return { text: s || 'Bilinmiyor', className: 'bg-slate-100 text-slate-700' };
  };

  const formatPrice = (v: any) => {
    const num = Number(v || 0);
    if (!Number.isFinite(num) || num === 0) return '—';
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(num);
  };

  const formatDate = (d?: string) => {
    if (!d) return '-';
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return '-';
    return dt.toLocaleDateString('tr-TR');
  };

  const badgeFor = (it: any) => {
    const t = String(it?.type || '').toLowerCase();
    if (t === 'complaint') {
      return {
        label: 'Dikkat',
        className:
          'inline-flex items-center px-2 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold',
      };
    }
    if (t === 'dispute') {
      return {
        label: 'Anlaşmazlık',
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
      return items.filter(x => x?.type === 'complaint' || x?.type === 'dispute');
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
        desc: 'Soldan bir kuyruk kaydı seç. Sonra detay panelinden tek aksiyonla ilerle.',
        primary: null as null | { label: string; onClick: () => void },
      };
    }

    if (t === 'complaint') {
      const hasUser = Boolean(selected?.relatedUserId || selected?.userId);
      return {
        title: 'Şikayet incele',
        desc: hasUser
          ? 'Şikayetler ekranından kaydı açıp detayları incele. Gerekirse kullanıcı panelinden hızlı aksiyon al.'
          : 'Şikayetler ekranından kaydı açıp detayları incele. Kullanıcı bağlantısı yoksa arama ile ilerle.',
        primary: {
          label: 'Şikayetleri aç',
          onClick: () => {
            const raw = String(selected?.id || '');
            const m = raw.match(/^complaint-(.+)$/);
            const openComplaintId = (m?.[1] || '').trim();
            const qs = openComplaintId ? `?openComplaintId=${encodeURIComponent(openComplaintId)}` : '';
            navigate(`${base}/complaints${qs}`);
          },
        },
      };
    }

    if (t === 'dispute') {
      return {
        title: 'Anlaşmazlık incele',
        desc: 'Detay için “Vakalar” ekranını açabilir veya arama ile dispute_ref üzerinden ilerleyebilirsin.',
        primary: {
          label: 'Vakaları aç',
          onClick: () => {
            const ref = String(selected?.disputeRef || '').trim();
            const raw = String(selected?.id || '');
            const m = raw.match(/^dispute-(.+)$/);
            const openDisputeRef = (ref || m?.[1] || '').trim();
            const qs = openDisputeRef ? `?openDisputeRef=${encodeURIComponent(openDisputeRef)}` : '';
            navigate(`${base}/cases${qs}`);
          },
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
      desc: 'Detay panelinden ilgili sayfaya geçip aksiyon al.',
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
              <h1 className='text-2xl font-bold text-slate-900'>Operasyon Masası</h1>
              <div className='text-sm text-slate-600 mt-1'>Sistem yönetimi</div>
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <button className='btn-secondary' onClick={() => setPaletteOpen(true)} title='Komut Paleti (Ctrl+K)'>
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

        {error && (
          <div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700'>
            {error}
          </div>
        )}

        <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
          <div className='lg:col-span-3 space-y-6'>
            <div className='card p-6'>
              <div className='flex items-start justify-between gap-4'>
                <div>
                  <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Komut Araması</div>
                  <div className='text-sm text-slate-700 font-semibold mt-1'>Bir hedef yaz, direkt aksiyona git</div>
                  <div className='text-xs text-slate-600 mt-1'>Örn: e-posta, kullanıcı ID, adminRef</div>
                </div>
                <div className='text-xs font-semibold text-slate-500'>Enter: kullanıcı listesi</div>
              </div>

              <div className='mt-4'>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
                  <input
                    className='input pl-10'
                    value={query}
                    placeholder='AdminRef / e-posta / telefon / kullanıcı ID / gönderi ID'
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
                    <div className='text-xs text-slate-600 mt-1'>İpucu: e-posta veya kullanıcı ID ile dene.</div>
                  </div>
                ) : (
                  <div className='mt-3 grid grid-cols-1 md:grid-cols-2 gap-2'>
                    {searchUsers.slice(0, 6).map((u, idx) => (
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

            <div className='card p-6'>
              <div className='flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4'>
                <div className='flex items-center gap-3 flex-1'>
                  <Search className='w-4 h-4 text-slate-400' />
                  <input
                    className='input flex-1'
                    placeholder='İlan ID / Nakliyeci / Taşıyıcı / rota'
                    value={query}
                    onChange={e => {
                      const v = e.target.value;
                      setQuery(v);
                      runSearch(v);
                    }}
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className='input w-full lg:w-52'
                >
                  <option value='all'>Tüm Durumlar</option>
                  <option value='active'>Aktif</option>
                  <option value='done'>Tamamlandı</option>
                  <option value='cancelled'>İptal</option>
                  <option value='dispute'>Anlaşmazlık</option>
                </select>
              </div>

              <div className='mt-4 overflow-x-auto'>
                <table className='w-full text-sm'>
                  <thead>
                    <tr className='border-b border-slate-200 text-left text-slate-600'>
                      <th className='py-3 font-semibold'>İlan ID</th>
                      <th className='py-3 font-semibold'>Güzergah</th>
                      <th className='py-3 font-semibold'>Nakliyeci</th>
                      <th className='py-3 font-semibold'>Taşıyıcı</th>
                      <th className='py-3 font-semibold'>Tarih</th>
                      <th className='py-3 font-semibold'>Anlaşılan Fiyat</th>
                      <th className='py-3 font-semibold'>Durum</th>
                      <th className='py-3 font-semibold'>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shipmentsLoading ? (
                      <tr>
                        <td colSpan={8} className='py-6 text-center text-slate-500'>Yükleniyor...</td>
                      </tr>
                    ) : shipmentsError ? (
                      <tr>
                        <td colSpan={8} className='py-6 text-center text-red-600'>{shipmentsError}</td>
                      </tr>
                    ) : filteredShipments.length === 0 ? (
                      <tr>
                        <td colSpan={8} className='py-6 text-center text-slate-500'>Kayıt bulunamadı</td>
                      </tr>
                    ) : (
                      filteredShipments.map((it: any) => {
                        const st = friendlyStatus(it.status || it.state || '');
                        const badge = badgeFor(it);
                        return (
                          <tr key={it.id || it.trackingCode || it.shipmentId} className='border-b border-slate-100 hover:bg-slate-50 transition-colors'>
                            <td className='py-3'>
                              <span className='font-mono text-sm font-semibold text-slate-900'>{it.trackingCode || it.id || '-'}</span>
                            </td>
                            <td className='py-3'>
                              <div className='text-sm font-semibold text-slate-900'>{it.route || it.path || `${it.from || '-'} → ${it.to || '-'}`}</div>
                            </td>
                            <td className='py-3 text-slate-700'>{it.shipperName || it.nakliyeci || '-'}</td>
                            <td className='py-3 text-slate-700'>{it.carrierName || it.tasiyici || '-'}</td>
                            <td className='py-3 text-slate-700'>{formatDate(it.date || it.createdAt || it.created_at)}</td>
                            <td className='py-3 text-slate-900 font-semibold'>{formatPrice(it.price || it.agreedPrice || it.offerPrice)}</td>
                            <td className='py-3'>
                              <div className='flex flex-col gap-1'>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${st.className}`}>{st.text}</span>
                                <span className={badge.className}>{badge.label}</span>
                              </div>
                            </td>
                            <td className='py-3'>
                              <button
                                onClick={() => setSelected(it)}
                                className='px-3 py-1.5 text-xs rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold'
                              >
                                Detayları İncele
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className='card p-6'>
              <div className='flex items-start justify-between gap-4'>
                <div>
                  <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Kuyruklar</div>
                  <div className='text-xl font-bold tracking-tight text-slate-900 mt-1'>Bugün neyi çözüyoruz?</div>
                  <div className='text-sm text-slate-600 mt-1'>Kuyruk seç, kayıt seç, detay panelinden ilerle.</div>
                </div>
                <div className='flex flex-wrap gap-2'>
                  <Tab k='operasyon' />
                  <Tab k='guvenlik' />
                  <Tab k='sikayet' />
                </div>
              </div>

              {loading ? (
                <div className='text-sm text-slate-600 mt-4'>Yükleniyor...</div>
              ) : filtered.length === 0 ? (
                <div className='mt-4 p-4 bg-gray-50 border border-gray-200 rounded-xl'>
                  <div className='text-sm font-semibold text-slate-900'>Kuyruk boş</div>
                  <div className='text-xs text-slate-600 mt-1'>Bu alanda bekleyen iş yok.</div>
                </div>
              ) : (
                <div className='mt-4 grid grid-cols-1 md:grid-cols-2 gap-2'>
                  {filtered.slice(0, 8).map((it, idx) => {
                    const badge = badgeFor(it);
                    const active = selected?.id === it?.id;
                    return (
                      <button
                        key={it?.id || idx}
                        className={
                          'p-4 rounded-xl border text-left transition-colors ' +
                          (active ? 'bg-white border-slate-900' : 'bg-gray-50 border-gray-200 hover:bg-white')
                        }
                        onClick={() => setSelected(it)}
                      >
                        <div className='flex items-start justify-between gap-3'>
                          <div>
                            <div className='text-sm font-semibold text-slate-900'>{it?.title || it?.type || 'Kayıt'}</div>
                            <div className='text-xs text-slate-600 mt-1'>{it?.summary || 'Detay yok'}</div>
                          </div>
                          <span className={badge.className}>{badge.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className='space-y-6'>
            <div className='card p-6'>
              <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Sonraki Adım</div>
              <div className='text-xl font-bold tracking-tight text-slate-900 mt-2'>{nextBest.title}</div>
              <div className='text-sm text-slate-600 mt-2'>{nextBest.desc}</div>
              {nextBest.primary && (
                <div className='mt-4'>
                  <button className='btn-primary w-full' onClick={nextBest.primary.onClick}>
                    {nextBest.primary.label}
                  </button>
                </div>
              )}
            </div>

            <div className='card p-6'>
              <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>İlgili Kullanıcı</div>
              {inlineUserError ? (
                <div className='mt-3 text-sm text-red-700'>{inlineUserError}</div>
              ) : inlineUserLoading ? (
                <div className='mt-3 text-sm text-slate-600'>Yükleniyor...</div>
              ) : inlineUser ? (
                <>
                  <div className='mt-2 text-sm font-semibold text-slate-900'>{inlineUser.email || String(inlineUser.id)}</div>
                  <div className='text-xs text-slate-600 mt-1'>Rol: {inlineUser.role || '-'}</div>
                  <div className='mt-4 grid grid-cols-1 gap-2'>
                    <button
                      className='btn-secondary'
                      onClick={() => navigate(`${base}/users?openUserId=${encodeURIComponent(String(inlineUser.id))}`)}
                    >
                      Kullanıcı detayına git
                    </button>
                  </div>
                  {inlineUserSummary && (
                    <div className='mt-4 text-xs text-slate-600'>
                      Son 24s: teklif {inlineUserSummary?.last24h?.offers ?? '-'} • gönderi {inlineUserSummary?.last24h?.shipments ?? '-'}
                    </div>
                  )}
                </>
              ) : (
                <div className='mt-3 text-sm text-slate-600'>Seçili kayıtta kullanıcı yok.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {paletteOpen && (
        <div className='fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4' onClick={() => setPaletteOpen(false)}>
          <div className='bg-white rounded-xl w-full max-w-2xl shadow-xl border border-gray-200' onClick={e => e.stopPropagation()}>
            <div className='p-4 border-b border-gray-200 flex items-center justify-between'>
              <div>
                <div className='text-sm font-bold text-slate-900'>Komut Paleti</div>
                <div className='text-xs text-slate-600 mt-1'>Kullanıcı ara ve hızlı git</div>
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
                  placeholder='kullanıcı e-posta / ID / adminRef (2+ karakter)'
                  onChange={e => {
                    const v = e.target.value;
                    setPaletteQuery(v);
                    runPaletteSearch(v);
                  }}
                />
              </div>
              {paletteLoading ? (
                <div className='text-sm text-slate-600 mt-3'>Aranıyor...</div>
              ) : paletteUsers.length === 0 ? (
                <div className='mt-3 p-4 bg-gray-50 border border-gray-200 rounded-xl'>
                  <div className='text-sm font-semibold text-slate-900'>Sonuç yok</div>
                  <div className='text-xs text-slate-600 mt-1'>İpucu: e-posta veya kullanıcı ID ile dene.</div>
                </div>
              ) : (
                <div className='mt-3 space-y-2'>
                  {paletteUsers.slice(0, 10).map((u, idx) => (
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
              <div className='mt-4 text-[11px] text-slate-500'>Kısayol: Ctrl+K aç/kapat • Esc kapat</div>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
          <div className='absolute inset-0 bg-black/40' onClick={() => setSelected(null)} />
          <div className='relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 max-h-[90vh] overflow-y-auto'>
            <div className='flex items-start justify-between gap-4'>
              <div>
                <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Taşıma Detayı</div>
                <div className='text-2xl font-bold text-slate-900 mt-1'>{selected.trackingCode || selected.id || 'İlan'}</div>
                <div className='text-sm text-slate-600 mt-1'>{selected.route || selected.path || `${selected.from || '-'} → ${selected.to || '-'}`}</div>
              </div>
              <button className='btn-secondary' onClick={() => setSelected(null)}>
                <span className='inline-flex items-center gap-2'>
                  <X className='w-4 h-4' /> Kapat
                </span>
              </button>
            </div>

            <div className='mt-4 grid grid-cols-1 md:grid-cols-2 gap-3'>
              <div className='p-3 bg-gray-50 border border-gray-200 rounded-xl'>
                <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Nakliyeci</div>
                <div className='text-sm font-semibold text-slate-900 mt-1'>{selected.shipperName || selected.nakliyeci || '-'}</div>
              </div>
              <div className='p-3 bg-gray-50 border border-gray-200 rounded-xl'>
                <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Taşıyıcı</div>
                <div className='text-sm font-semibold text-slate-900 mt-1'>{selected.carrierName || selected.tasiyici || '-'}</div>
              </div>
              <div className='p-3 bg-gray-50 border border-gray-200 rounded-xl'>
                <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Tarih</div>
                <div className='text-sm font-semibold text-slate-900 mt-1'>{formatDate(selected.date || selected.createdAt || selected.created_at)}</div>
              </div>
              <div className='p-3 bg-gray-50 border border-gray-200 rounded-xl'>
                <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Anlaşılan Fiyat</div>
                <div className='text-sm font-semibold text-slate-900 mt-1'>{formatPrice(selected.price || selected.agreedPrice || selected.offerPrice)}</div>
              </div>
              <div className='p-3 bg-gray-50 border border-gray-200 rounded-xl'>
                <div className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>Durum</div>
                <div className='mt-1 inline-flex items-center gap-2'>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${friendlyStatus(selected.status || selected.state || '').className}`}>
                    {friendlyStatus(selected.status || selected.state || '').text}
                  </span>
                  <span className={badgeFor(selected).className}>{badgeFor(selected).label}</span>
                </div>
              </div>
            </div>

            <div className='mt-4 p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-slate-600'>
              Detaylı süreç (teklif geçmişi, mesajlar, konum) sonraki iterasyonda bağlanacak.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Operations;











