import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, Package, Truck, Eye, MapPin, DollarSign, XCircle } from 'lucide-react';
import Breadcrumb from '../../components/shared-ui-elements/Breadcrumb';
import LoadingState from '../../components/shared-ui-elements/LoadingState';
import GuidanceOverlay from '../../components/shared-ui-elements/GuidanceOverlay';
import { createApiUrl } from '../../config/api';
import { useToast } from '../../contexts/ToastContext';
import { analytics } from '../../services/businessAnalytics';
import { getStatusText as getShipmentStatusText } from '../../utils/shipmentStatus';

type TabKey = 'assignments' | 'pending' | 'accepted' | 'active' | 'completed';

type BidRow = {
  kind: 'bid';
  bidId: number;
  shipmentId: number;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | string;
  title: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  price: number;
  createdAt?: string;
};

type JobRow = {
  kind: 'job';
  shipmentId: number;
  status: string;
  title: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  price: number;
  createdAt?: string;
};

type AssignmentOfferRow = {
  kind: 'assignment_offer';
  shipmentId: number;
  status: 'pending' | string;
  title: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  price: number;
  createdAt?: string;
  expiresAt?: string;
};

type Row = BidRow | JobRow | AssignmentOfferRow;

function normalizeCityKey(input?: string | null): string {
  const s = String(input || '').trim();
  if (!s) return '';
  // Normalize Turkish casing and diacritics for robust comparisons
  return s
    .replace(/İ/g, 'I')
    .replace(/ı/g, 'i')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractCityGuess(value?: string | null): string {
  const raw = String(value || '').trim();
  if (!raw) return '';
  // Prefer first segment; many rows pass "İstanbul" or "İstanbul, ..." formats
  const first = raw.split(',')[0]?.trim() || raw;
  return first;
}

function getDriverProfileCity(): string {
  try {
    const userRaw = localStorage.getItem('user');
    const u: any = userRaw ? JSON.parse(userRaw) : null;
    return String(u?.city || u?.City || u?.il || u?.province || '').trim();
  } catch {
    return '';
  }
}

// Türk kamyoncular için status çevirileri
const getStatusText = (status: string): string => {
  const base = getShipmentStatusText(status);
  if (base !== 'Bilinmiyor') return base;
  if (status === 'offer_accepted') return 'Teklif Kabul';
  return status ? String(status) : 'Aktif';
};

const pill = (type: TabKey, status?: string) => {
  switch (type) {
    case 'pending':
    case 'assignments':
      return (
        <span className='px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 inline-flex items-center gap-1'>
          <Clock className='w-3 h-3' />
          Beklemede
        </span>
      );
    case 'accepted':
      return (
        <span className='px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 inline-flex items-center gap-1'>
          <CheckCircle className='w-3 h-3' />
          Kabul
        </span>
      );
    case 'completed':
      return (
        <span className='px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-800 inline-flex items-center gap-1'>
          <CheckCircle className='w-3 h-3' />
          Tamamlandı
        </span>
      );
    default:
      return (
        <span className='px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 inline-flex items-center gap-1'>
          <Truck className='w-3 h-3' />
          {status ? getStatusText(status) : 'Aktif'}
        </span>
      );
  }
};

const TasiyiciIslerim: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const driverCity = useMemo(() => getDriverProfileCity(), []);
  const driverCityKey = useMemo(() => normalizeCityKey(driverCity), [driverCity]);
  const [tab, setTab] = useState<TabKey>('active');
  const [loading, setLoading] = useState(true);
  const [bids, setBids] = useState<BidRow[]>([]);
  const [assignmentOffers, setAssignmentOffers] = useState<AssignmentOfferRow[]>([]);
  const [activeJobs, setActiveJobs] = useState<JobRow[]>([]);
  const [completedJobs, setCompletedJobs] = useState<JobRow[]>([]);

  const acceptAssignmentOffer = async (shipmentId: number, pickupCityGuess?: string) => {
    try {
      const pickupKey = normalizeCityKey(extractCityGuess(pickupCityGuess));
      if (driverCityKey && pickupKey && driverCityKey !== pickupKey) {
        showToast({
          type: 'error',
          title: 'İş kabul edilemedi',
          message: `Yükleme şehri profil şehrinle aynı olmalı. Profil: ${driverCity || '—'}, Yükleme: ${extractCityGuess(pickupCityGuess) || '—'}`,
          duration: 5000,
        });
        return;
      }

      const token = localStorage.getItem('authToken');
      const userRaw = localStorage.getItem('user');
      const userId = userRaw ? JSON.parse(userRaw || '{}').id : undefined;

      const res = await fetch(createApiUrl(`/api/shipments/${shipmentId}/assignment/accept`), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token || ''}`,
          'X-User-Id': userId || '',
          'Content-Type': 'application/json',
        },
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        const msg = json?.message || 'İş kabul edilemedi';
        showToast({ type: 'error', title: 'İş kabul edilemedi', message: msg, duration: 4500 });
        return;
      }
      analytics.track('driver_assignment_offer_accepted', { shipmentId });
      showToast({ type: 'success', title: 'İş kabul edildi', message: 'İş başlatıldı.', duration: 3000 });
      setTab('active');
      await loadAll();
    } catch {
      showToast({ type: 'error', title: 'İş kabul edilemedi', message: 'Lütfen tekrar deneyin.', duration: 4500 });
    }
  };

  const rejectAssignmentOffer = async (shipmentId: number) => {
    try {
      const reason = window.prompt('Reddetme sebebi (opsiyonel):') || '';
      const token = localStorage.getItem('authToken');
      const userRaw = localStorage.getItem('user');
      const userId = userRaw ? JSON.parse(userRaw || '{}').id : undefined;

      const res = await fetch(createApiUrl(`/api/shipments/${shipmentId}/assignment/reject`), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token || ''}`,
          'X-User-Id': userId || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        const msg = json?.message || 'İş reddedilemedi';
        showToast({ type: 'error', title: 'İş reddedilemedi', message: msg, duration: 4500 });
        return;
      }
      analytics.track('driver_assignment_offer_rejected', { shipmentId, reason: reason || undefined });
      showToast({ type: 'success', title: 'Teklif reddedildi', message: 'Nakliyeci bilgilendirildi.', duration: 3000 });
      await loadAll();
    } catch {
      showToast({ type: 'error', title: 'İş reddedilemedi', message: 'Lütfen tekrar deneyin.', duration: 4500 });
    }
  };

  const loadAll = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const userRaw = localStorage.getItem('user');
      const userId = userRaw ? JSON.parse(userRaw || '{}').id : undefined;

      const headers: Record<string, string> = {
        Authorization: `Bearer ${token || ''}`,
        'X-User-Id': userId || '',
        'Content-Type': 'application/json',
      };

      const [assignRes, bidsRes, activeRes, completedRes] = await Promise.all([
        fetch(createApiUrl('/api/shipments/tasiyici/assignment-offers'), { headers }),
        fetch(createApiUrl('/api/carrier-market/bids?mine=1'), { headers }),
        fetch(createApiUrl('/api/shipments/tasiyici'), { headers }),
        fetch(createApiUrl('/api/shipments/tasiyici/completed'), { headers }),
      ]);

      const assignJson = assignRes.ok ? await assignRes.json().catch(() => null) : null;
      const bidsJson = bidsRes.ok ? await bidsRes.json().catch(() => null) : null;
      const activeJson = activeRes.ok ? await activeRes.json().catch(() => null) : null;
      const completedJson = completedRes.ok ? await completedRes.json().catch(() => null) : null;

      const assignRows = (Array.isArray(assignJson) ? assignJson : assignJson?.data || assignJson?.shipments || []) as any[];
      const mappedAssign: AssignmentOfferRow[] = (Array.isArray(assignRows) ? assignRows : []).map((r: any) => {
        const metaRaw = r.metadata;
        let meta: any = null;
        if (metaRaw && typeof metaRaw === 'object') meta = metaRaw;
        else if (typeof metaRaw === 'string') {
          try {
            meta = JSON.parse(metaRaw);
          } catch {
            meta = null;
          }
        }
        const offer = meta?.driverOffer;
        return {
          kind: 'assignment_offer' as const,
          shipmentId: Number(r.id || r.shipmentId || r.shipment_id || 0),
          status: 'pending',
          title: String(r.title || `${r.pickupcity || r.pickupCity || r.pickup_city || ''} → ${r.deliverycity || r.deliveryCity || r.delivery_city || ''}`.trim() || 'İş'),
          pickupAddress: r.pickupAddress || r.pickup_address || r.pickupaddress || r.pickupcity || r.pickupCity || r.pickup_city,
          deliveryAddress: r.deliveryAddress || r.delivery_address || r.deliveryaddress || r.deliverycity || r.deliveryCity || r.delivery_city,
          price: Number(r.displayPrice || r.price || r.offerPrice || r.offer_price || 0),
          createdAt: r.createdAt || r.created_at,
          expiresAt: offer?.expiresAt,
        };
      }).filter((x) => x.shipmentId);

      const bidsRows = (Array.isArray(bidsJson)
        ? bidsJson
        : (bidsJson?.data?.bids || bidsJson?.data || bidsJson?.bids || [])) as any[];

      const mappedBids: BidRow[] = (Array.isArray(bidsRows) ? bidsRows : []).map((r: any) => ({
        kind: 'bid',
        bidId: Number(r.id || 0),
        shipmentId: Number(r.shipmentId || r.shipment_id || 0),
        status: (r.status || 'pending') as any,
        title: String(r.shipmentTitle || r.title || (r.shipmentId ? `Gönderi #${r.shipmentId}` : 'Gönderi')).replace(/Advanced Regression Shipment/gi, 'Kargo Nakliyesi').replace(/MCP E2E Test/gi, 'Test Gönderisi').replace(/Regression/gi, 'Nakliye'),
        pickupAddress: r.pickupAddress || r.pickup_address || r.pickupaddress || r.pickupcity || r.pickup_city,
        deliveryAddress: r.deliveryAddress || r.delivery_address || r.deliveryaddress || r.deliverycity || r.delivery_city,
        price: Number(r.bidPrice || r.price || 0),
        createdAt: r.createdAt || r.created_at,
      }));

      const activeRows = (Array.isArray(activeJson) ? activeJson : activeJson?.data || []) as any[];
      const mappedActive: JobRow[] = (Array.isArray(activeRows) ? activeRows : []).map((r: any) => ({
        kind: 'job',
        shipmentId: Number(r.id || r.shipmentId || r.shipment_id || 0),
        status: String(r.status || 'active'),
        title: String(r.title || `${r.pickupcity || r.pickupCity || r.pickup_city || ''} → ${r.deliverycity || r.deliveryCity || r.delivery_city || ''}`.trim() || 'İş').replace(/Advanced Regression Shipment/gi, 'Kargo Nakliyesi').replace(/MCP E2E Test/gi, 'Test Gönderisi').replace(/Regression/gi, 'Nakliye'),
        pickupAddress: r.pickupAddress || r.pickup_address || r.pickupaddress || r.pickupcity || r.pickupCity || r.pickup_city,
        deliveryAddress: r.deliveryAddress || r.delivery_address || r.deliveryaddress || r.deliverycity || r.deliveryCity || r.delivery_city,
        price: Number(r.displayPrice || r.price || r.offerPrice || r.offer_price || 0),
        createdAt: r.createdAt || r.created_at,
      }));

      const activeStatuses = new Set([
        'offer_accepted',
        'accepted',
        'assigned',
        'in_progress',
        'picked_up',
        'in_transit',
        'delivered',
      ]);
      const filteredActive = mappedActive.filter(
        (j) => j.shipmentId && activeStatuses.has(String(j.status || '').trim())
      );

      const completedRows = (Array.isArray(completedJson)
        ? completedJson
        : (completedJson?.shipments || completedJson?.data || [])) as any[];
      const mappedCompleted: JobRow[] = (Array.isArray(completedRows) ? completedRows : []).map((r: any) => ({
        kind: 'job',
        shipmentId: Number(r.id || r.shipmentId || r.shipment_id || 0),
        status: String(r.status || 'completed'),
        title: String(r.title || r.shipmentTitle || `${r.pickupcity || r.pickupCity || r.pickup_city || ''} → ${r.deliverycity || r.deliveryCity || r.delivery_city || ''}`.trim() || 'İş').replace(/Advanced Regression Shipment/gi, 'Kargo Nakliyesi').replace(/MCP E2E Test/gi, 'Test Gönderisi').replace(/Regression/gi, 'Nakliye'),
        pickupAddress: r.pickupAddress || r.pickup_address || r.pickupaddress || r.pickupcity || r.pickupCity || r.pickup_city,
        deliveryAddress: r.deliveryAddress || r.delivery_address || r.deliveryaddress || r.deliverycity || r.deliveryCity || r.delivery_city,
        price: Number(r.displayPrice || r.price || r.offerPrice || r.offer_price || 0),
        createdAt: r.updatedAt || r.updated_at || r.createdAt || r.created_at,
      }));

      setBids(mappedBids);
      setAssignmentOffers(mappedAssign);
      setActiveJobs(filteredActive);
      setCompletedJobs(mappedCompleted.filter(j => j.shipmentId));

      // If user has no active jobs but has pending/accepted, default to accepted.
      const hasActive = filteredActive.some(j => j.shipmentId);
      const hasAccepted = mappedBids.some(b => b.status === 'accepted' && b.shipmentId);
      const hasPending = mappedBids.some(b => b.status === 'pending');
      const hasAssignments = mappedAssign.some(a => a.shipmentId);
      if (!hasActive && hasAssignments) setTab('assignments');
      else if (!hasActive && hasAccepted) setTab('accepted');
      else if (!hasActive && !hasAccepted && hasPending) setTab('pending');
    } catch (e) {
      if (import.meta.env.DEV) console.error(e);
      setBids([]);
      setAssignmentOffers([]);
      setActiveJobs([]);
      setCompletedJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const pendingBids = useMemo(() => bids.filter(b => b.status === 'pending'), [bids]);
  const acceptedBids = useMemo(() => bids.filter(b => b.status === 'accepted'), [bids]);

  const rows: Row[] = useMemo(() => {
    switch (tab) {
      case 'assignments':
        return assignmentOffers;
      case 'pending':
        return pendingBids;
      case 'accepted':
        return acceptedBids;
      case 'completed':
        return completedJobs;
      default:
        return activeJobs;
    }
  }, [tab, assignmentOffers, pendingBids, acceptedBids, activeJobs, completedJobs]);

  const tabButton = (key: TabKey, label: string, count: number) => (
    <button
      type='button'
      onClick={() => setTab(key)}
      className={`px-3 py-2 rounded-xl text-sm font-semibold border transition-colors ${
        tab === key
          ? 'bg-slate-900 text-white border-slate-900'
          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
      }`}
    >
      <span>{label}</span>
      <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${tab === key ? 'bg-white/20' : 'bg-slate-100'}`}>
        {count}
      </span>
    </button>
  );

  if (loading) return <LoadingState />;

  return (
    <div className='min-h-screen bg-white'>
      <Helmet>
        <title>İşlerim - Taşıyıcı - YolNext</title>
      </Helmet>

      <div className='max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6'>
        <div className='mb-4 sm:mb-6'>
          <Breadcrumb items={[{ label: 'İşlerim', href: '/tasiyici/islerim' }]} />
        </div>

        <div className='relative overflow-hidden bg-gradient-to-br from-slate-800 via-blue-900 to-indigo-900 rounded-3xl p-6 text-white shadow-2xl mb-6'>
          <div className='absolute inset-0 bg-gradient-to-br from-white/5 to-transparent'></div>
          <div className='relative z-10'>
            <div className='flex items-center gap-4'>
              <div className='w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-xl border border-white/20'>
                <Package className='w-8 h-8 text-white' />
              </div>
              <div>
                <h1 className='text-3xl font-bold mb-2 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent'>
                  İşlerim
                </h1>
                <p className='text-slate-200 text-base sm:text-lg leading-relaxed'>
                  Tekliflerini ve işlerini tek yerden yönet
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className='mb-6'>
          <GuidanceOverlay
            storageKey='tasiyici.islerim'
            isEmpty={!loading && bids.length === 0 && activeJobs.length === 0 && completedJobs.length === 0}
            icon={Truck}
            title='İşlerim'
            description='Yoldayken hızlı işlem için burası tek merkez: tekliflerini kontrol et, kabul edilen işi aç, aktif işi güncelle.'
            primaryAction={{
              label: 'Pazar',
              to: '/tasiyici/market',
            }}
            secondaryAction={{
              label: 'Yenile',
              onClick: () => loadAll(),
            }}
          />
        </div>

        <div className='flex flex-wrap gap-2 mb-4'>
          {tabButton('assignments', 'Atama Teklifleri', assignmentOffers.length)}
          {tabButton('pending', 'Beklemede', pendingBids.length)}
          {tabButton('accepted', 'Kabul', acceptedBids.length)}
          {tabButton('active', 'Aktif', activeJobs.length)}
          {tabButton('completed', 'Tamamlanan', completedJobs.length)}
        </div>

        {rows.length === 0 ? (
          <div className='min-h-[45vh] flex items-center justify-center'>
            <div className='bg-white rounded-2xl shadow-xl border border-gray-100 p-10 text-center w-full max-w-2xl'>
              <Package className='w-16 h-16 text-gray-400 mx-auto mb-4' />
              <h3 className='text-xl font-bold text-gray-900 mb-2'>Burada bir kayıt yok</h3>
              <p className='text-gray-600 mb-6'>Pazardan ilana teklif vererek başlayabilirsin.</p>
              <Link to='/tasiyici/market'>
                <button className='px-6 py-3 bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl'>
                  Pazara Git
                </button>
              </Link>
            </div>
          </div>
        ) : (
          <div className='space-y-4'>
            {rows.map((r) => {
              const idText =
                r.kind === 'bid'
                  ? `#${r.bidId} • İş #${r.shipmentId}`
                  : r.kind === 'assignment_offer'
                    ? `Atama Teklifi • İş #${r.shipmentId}`
                    : `İş #${r.shipmentId}`;
              const canOpen = Boolean(r.shipmentId);
              const href = canOpen ? `/tasiyici/jobs/${r.shipmentId}` : undefined;
              const isAssignment = r.kind === 'assignment_offer';
              const expiresAtMs = isAssignment && (r as any).expiresAt ? Date.parse(String((r as any).expiresAt)) : NaN;
              const minutesLeft =
                isAssignment && Number.isFinite(expiresAtMs)
                  ? Math.max(0, Math.ceil((expiresAtMs - Date.now()) / 60000))
                  : null;
              const pickupCityGuess = extractCityGuess((r as any).pickupCity || r.pickupAddress);
              const pickupKey = normalizeCityKey(pickupCityGuess);
              const cityMismatch =
                Boolean(isAssignment) && Boolean(driverCityKey) && Boolean(pickupKey) && driverCityKey !== pickupKey;
              const isExpired = Boolean(isAssignment) && minutesLeft === 0;

              return (
                <div
                  key={`${r.kind}-${r.kind === 'bid' ? r.bidId : r.shipmentId}`}
                  className='bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-300 transition-all duration-300'
                >
                  <div className='flex items-start justify-between gap-3 mb-4'>
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-start justify-between mb-3'>
                        <h3 className='text-lg font-semibold text-slate-900 line-clamp-2 flex-1 leading-tight'>{r.title}</h3>
                      </div>

                      {/* Taşıyıcı için önemli bilgiler - öncelikli sıralama */}
                      <div className='space-y-3 mb-4'>
                        {/* Durum ve İş Numarası */}
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center gap-2'>
                            <span className='text-xs text-slate-500 font-medium'>İş Durumu:</span>
                            {pill(tab, (r as any).status)}
                          </div>
                          <span className='text-sm text-slate-600 font-medium bg-slate-50 px-2 py-1 rounded'>
                            {idText}
                          </span>
                        </div>

                        {isAssignment && (
                          <div className='bg-amber-50 p-3 rounded-lg border border-amber-200'>
                            <div className='flex items-center justify-between gap-2'>
                              <div className='text-sm font-semibold text-amber-900'>
                                30dk kabul süresi
                              </div>
                              <div className='text-sm font-bold text-amber-700'>
                                {minutesLeft != null ? `${minutesLeft} dk` : '—'}
                              </div>
                            </div>
                            <div className='text-xs text-amber-700 mt-1'>
                              Bu işi kabul edersen iş başlatılır. Reddedersen nakliyeci başka taşıyıcı seçebilir.
                            </div>
                            {cityMismatch && (
                              <div className='mt-2 text-xs text-rose-700 font-semibold'>
                                Şehir kuralı: Yükleme şehri profil şehrinle aynı olmalı. Profil: {driverCity || '—'} • Yükleme: {pickupCityGuess || '—'}
                              </div>
                            )}
                            {isExpired && (
                              <div className='mt-2 text-xs text-rose-700 font-semibold'>
                                Bu teklifin süresi doldu.
                              </div>
                            )}
                          </div>
                        )}

                        {/* Güzergah - daha iyi görünürlük */}
                        <div className='bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-200'>
                          <div className='flex items-center gap-2 mb-1'>
                            <MapPin className='w-4 h-4 text-blue-600' />
                            <span className='text-xs font-medium text-blue-800'>Güzergah</span>
                          </div>
                          <div className='text-sm font-semibold text-blue-900'>
                            {r.pickupAddress && r.deliveryAddress 
                              ? `${r.pickupAddress.split(',')[0].trim()} → ${r.deliveryAddress.split(',')[0].trim()}` 
                              : r.pickupAddress || r.deliveryAddress 
                              ? r.pickupAddress || r.deliveryAddress 
                              : 'Adres bilgisi yok'
                            }
                          </div>
                          {(r.pickupAddress && r.pickupAddress.length > 40) || (r.deliveryAddress && r.deliveryAddress.length > 40) ? (
                            <div className='text-xs text-blue-600 mt-1 truncate'>
                              {r.pickupAddress?.substring(0, 40) || ''} → {r.deliveryAddress?.substring(0, 40) || ''}
                            </div>
                          ) : null}
                        </div>

                        {/* Ücret - öne çıkarılmış */}
                        <div className='bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border border-green-200'>
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-2'>
                              <DollarSign className='w-4 h-4 text-green-600' />
                              <span className='text-xs font-medium text-green-800'>Kazanılacak Tutar</span>
                            </div>
                            <div className='font-bold text-green-700 text-xl'>
                              ₺{Number(r.price || 0).toLocaleString('tr-TR')}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className='flex items-center justify-end pt-4 border-t border-gray-200'>
                    {isAssignment ? (
                      <div className='flex flex-col sm:flex-row gap-2 w-full sm:w-auto'>
                        <button
                          type='button'
                          onClick={() => acceptAssignmentOffer(r.shipmentId, pickupCityGuess)}
                          disabled={cityMismatch || isExpired}
                          className='px-5 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2'
                        >
                          <CheckCircle className='w-5 h-5' />
                          Kabul Et
                        </button>
                        <button
                          type='button'
                          onClick={() => rejectAssignmentOffer(r.shipmentId)}
                          className='px-5 py-3 bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2'
                        >
                          <XCircle className='w-5 h-5' />
                          Reddet
                        </button>
                        {href ? (
                          <Link
                            to={href}
                            className='px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2'
                          >
                            <Eye className='w-5 h-5' />
                            Detay
                          </Link>
                        ) : null}
                      </div>
                    ) : href ? (
                      <Link
                        to={href}
                        className='px-6 py-4 bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 text-white rounded-xl font-bold text-lg transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-xl min-h-[48px]'
                      >
                        <Eye className='w-6 h-6' />
                        İşi Detayları
                      </Link>
                    ) : (
                      <span className='px-6 py-4 bg-slate-100 text-slate-600 rounded-xl font-bold text-lg border-2 border-slate-300 min-h-[48px] flex items-center justify-center'>
                        Hazırlanıyor
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className='mt-8 flex justify-end'>
          <button
            type='button'
            onClick={() => navigate('/tasiyici/market')}
            className='px-8 py-4 bg-gradient-to-r from-slate-800 to-blue-900 hover:from-blue-900 hover:to-slate-800 text-white border-2 border-blue-700 rounded-xl font-bold text-xl shadow-lg hover:shadow-xl min-h-[56px] transition-all duration-200'
          >
            Pazara Git
          </button>
        </div>
      </div>
    </div>
  );
};

export default TasiyiciIslerim;











