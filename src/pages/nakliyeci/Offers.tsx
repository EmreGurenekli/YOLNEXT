import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  DollarSign,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Package,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Download,
  Upload,
  MoreHorizontal,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Hand,
  Star,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import Breadcrumb from '../../components/shared-ui-elements/Breadcrumb';
import EmptyState from '../../components/shared-ui-elements/EmptyState';
import LoadingState from '../../components/shared-ui-elements/LoadingState';
import Modal from '../../components/shared-ui-elements/Modal';
import SuccessMessage from '../../components/shared-ui-elements/SuccessMessage';
import { resolveShipmentRoute } from '../../utils/shipmentRoute';
import Pagination from '../../components/shared-ui-elements/Pagination';
import GuidanceOverlay from '../../components/shared-ui-elements/GuidanceOverlay';
import { createApiUrl } from '../../config/api';
import { safeJsonParse } from '../../utils/safeFetch';
import { useNavigate } from 'react-router-dom';
import { normalizeTrackingCode } from '../../utils/trackingCode';

export default function NakliyeciOffers() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('grid');
  interface OfferDetail {
    shipmentId: string | number;
    status: string;
    sender: string;
    from: string;
    to: string;
    price: number;
    matchScore: number | null;
    description: string;
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      const parsed = raw ? JSON.parse(raw) : null;
      const userId = parsed?.id;
      const role = String(parsed?.role || 'nakliyeci').toLowerCase();
      if (!userId) return;
      localStorage.setItem(`yolnext:lastSeen:offers:${userId}:${role}`, new Date().toISOString());
      window.dispatchEvent(new Event('yolnext:refresh-badges'));
    } catch {
      // ignore
    }
  }, []);
  
  const [selectedOffer, setSelectedOffer] = useState<OfferDetail | null>(null);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [commissionAcked, setCommissionAcked] = useState(false);
  const [navigateAfterAck, setNavigateAfterAck] = useState(false);
  const [editingOffer, setEditingOffer] = useState<any>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editMessage, setEditMessage] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [offersPerPage] = useState(10);

  const breadcrumbItems = [
    { label: 'Ana Sayfa', icon: <DollarSign className='w-4 h-4' /> },
    { label: 'Teklifler', icon: <DollarSign className='w-4 h-4' /> },
  ];

  const [offers, setOffers] = useState<any[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const showApiDebug =
    !!(import.meta as any)?.env?.DEV &&
    (() => {
      try {
        return localStorage.getItem('debug:api') === '1';
      } catch {
        return false;
      }
    })();

  const toNumber = (value: any, fallback = 0) => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
    if (typeof value === 'string') {
      const n = parseFloat(value.replace(/[^0-9.,-]/g, '').replace(',', '.'));
      return Number.isFinite(n) ? n : fallback;
    }
    return fallback;
  };

  const toTrackingCode = (value: any, idFallback?: any) => {
    const v = String(value ?? '').trim();
    const fallback = String(idFallback ?? '').trim();

    if (!v) {
      if (!fallback) return '';
      if (/^TRK/i.test(fallback)) return fallback;
      const n = Number(fallback);
      if (Number.isFinite(n) && n > 0) {
        return `TRK${Math.trunc(n).toString().padStart(6, '0')}`;
      }
      return fallback;
    }

    if (/^TRK/i.test(v)) return v;
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) {
      return `TRK${Math.trunc(n).toString().padStart(6, '0')}`;
    }
    return v;
  };

  const mapOffer = (o: any) => {
    if (showApiDebug) {
      console.log('Offer Debug:', {
        id: o.id,
        pickupCity: o.pickupCity,
        deliveryCity: o.deliveryCity,
        fromCity: o.fromCity,
        toCity: o.toCity,
        pickupAddress: o.pickupAddress,
        deliveryAddress: o.deliveryAddress,
        raw: o
      });
    }
    const { from, to } = resolveShipmentRoute(o);
    const sender =
      o.ownerName ||
      o.owner_name ||
      o.shipmentOwnerName ||
      o.shipmentownername ||
      o.shipmentownername ||
      o.shipmentOwnerName ||
      o.ownerName ||
      o.owner_name ||
      o.senderName ||
      o.sender_name ||
      o.sender ||
      o.shipperName ||
      o.shipper_name ||
      o.userName ||
      o.user_name ||
      o.user?.fullName ||
      o.user?.name ||
      o.shipper?.fullName ||
      o.shipper?.name ||
      'Gönderici';

    const price = toNumber(o.price ?? o.offerPrice ?? o.offer_price ?? o.displayPrice ?? o.display_price ?? o.value, 0);
    return ({
    id: o.id,
    shipmentId: o.shipmentid || o.shipmentId,
    sender,
    from,
    to,
    status: o.status,
    date: o.createdat || o.createdAt,
    price,
    weight: o.weight
      ? `${o.weight} kg`
      : o.shipmentWeight
        ? `${o.shipmentWeight} kg`
        : '—',
    category: o.category || o.shipmentCategory || 'Genel',
    estimatedDelivery: o.estimateddelivery || o.estimatedDelivery,
    description: o.message || o.description || '',
    priority: o.priority || 'normal',
    matchScore: (() => {
      const raw = o.matchScore ?? o.match_score;
      const n = typeof raw === 'number' ? raw : typeof raw === 'string' ? parseFloat(raw) : NaN;
      return Number.isFinite(n) ? n : null;
    })(),
  });
  };

  const loadOffers = async () => {
    setIsLoading(true);
    setLoadError(null);
    
    // Timeout protection - maksimum 10 saniye bekle
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
    }, 10000);
    
    try {
      const userRaw = localStorage.getItem('user');
      const userId = userRaw ? JSON.parse(userRaw || '{}').id : undefined;
      const token = localStorage.getItem('authToken');
      
      const statusParam =
        filterStatus && filterStatus !== 'all'
          ? `?status=${encodeURIComponent(filterStatus)}`
          : '';
      
      // AbortController for timeout
      const controller = new AbortController();
      const fetchTimeoutId = setTimeout(() => controller.abort(), 10000);
      
      const url = createApiUrl(`/api/offers${statusParam}`);
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token || ''}`,
          'X-User-Id': userId || '',
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(fetchTimeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await safeJsonParse(response);
      const list = (
        data?.data && Array.isArray(data.data)
          ? data.data
          : Array.isArray(data)
            ? data
            : data?.offers || []
      ) as any[];
      setOffers(list.map(mapOffer));
    } catch (err: any) {
      console.error('Teklifler yüklenirken hata:', err);
      setLoadError(err?.message || 'Teklifler yüklenemedi');
      setOffers([]);
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const ack = localStorage.getItem('commission_ack_v1');
    if (ack === 'true') {
      setCommissionAcked(true);
    } else {
      // İlk girişte gösterelim (bir kere)
      setShowCommissionModal(true);
    }
    loadOffers();
  }, [filterStatus, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, sortBy, sortOrder]);

  const handleCommissionAcknowledge = () => {
    localStorage.setItem('commission_ack_v1', 'true');
    setCommissionAcked(true);
    setShowCommissionModal(false);
    if (navigateAfterAck) {
      setNavigateAfterAck(false);
      navigate('/nakliyeci/jobs');
    }
  };

  useEffect(() => {
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        loadOffers();
      }
    };

    const handleGlobalRefresh = () => {
      loadOffers();
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('yolnext:refresh-badges', handleGlobalRefresh);

    return () => {
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('yolnext:refresh-badges', handleGlobalRefresh);
    };
  }, [filterStatus]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'expired':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className='w-4 h-4' />;
      case 'pending':
        return <Clock className='w-4 h-4' />;
      case 'rejected':
        return <XCircle className='w-4 h-4' />;
      case 'expired':
        return <AlertCircle className='w-4 h-4' />;
      default:
        return <DollarSign className='w-4 h-4' />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'Kabul Edildi';
      case 'pending':
        return 'Beklemede';
      case 'rejected':
        return 'Reddedildi';
      case 'expired':
        return 'Süresi Doldu';
      default:
        return 'Bilinmiyor';
    }
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'normal':
        return 'bg-slate-100 text-slate-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getMatchScoreColor = (score: number | null) => {
    if (score === null || !Number.isFinite(score)) return 'text-slate-500';
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const normalizeForSearch = (input: any) => {
    const s = String(input ?? '')
      .toLowerCase()
      .trim();
    return s
      .replace(/ı/g, 'i')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c');
  };

  const filteredOffers = offers.filter(offer => {
    const query = normalizeForSearch(searchTerm);
    const tokens = query.split(/\s+/).filter(Boolean);

    const haystack = [
      offer.shipmentId,
      offer.sender,
      offer.from,
      offer.to,
      offer.category,
      offer.description,
      offer.price,
    ]
      .map(normalizeForSearch)
      .join(' ');

    const matchesSearch =
      tokens.length === 0 || tokens.every(t => haystack.includes(t));
    const matchesStatus =
      filterStatus === 'all' || offer.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const sortedOffers = [...filteredOffers].sort((a, b) => {
    if (sortBy === 'date') {
      return sortOrder === 'asc'
        ? new Date(a.date).getTime() - new Date(b.date).getTime()
        : new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    if (sortBy === 'price') {
      return sortOrder === 'asc' ? a.price - b.price : b.price - a.price;
    }
    if (sortBy === 'matchScore') {
      if (a.matchScore === null && b.matchScore === null) return 0;
      if (a.matchScore === null) return 1;
      if (b.matchScore === null) return -1;
      return sortOrder === 'asc'
        ? a.matchScore - b.matchScore
        : b.matchScore - a.matchScore;
    }
    return 0;
  });

  const indexOfLastOffer = currentPage * offersPerPage;
  const indexOfFirstOffer = indexOfLastOffer - offersPerPage;
  const currentOffers = sortedOffers.slice(indexOfFirstOffer, indexOfLastOffer);

  const handleViewDetails = (offer: any) => {
    setSelectedOffer(offer);
    setShowOfferModal(true);
  };

  const safeDateText = (value: any) => {
    const d = value instanceof Date ? value : new Date(value || '');
    return Number.isFinite(d.getTime()) ? d.toLocaleDateString('tr-TR') : '—';
  };

  // After an offer is accepted, the next operational step for a nakliyeci is driver assignment,
  // which lives in the "Aktif Yükler" page. The assign-carrier/open-broadcast endpoints are
  // owner actions and can fail by design for nakliyeci role.
  const handleGoToActiveShipments = (offer: any) => {
    setSuccessMessage('Aktif Yükler sayfasına yönlendiriliyorsunuz...');
    setShowSuccessMessage(true);
    setTimeout(() => {
      setShowSuccessMessage(false);
      navigate(`/nakliyeci/active-shipments?shipmentId=${encodeURIComponent(String(offer.shipmentId || ''))}`);
    }, 2000);
  };

  const handleAccept = async (id: number) => {
    const timeoutId = setTimeout(() => {
      setSuccessMessage('Teklif kabul işlemi zaman aşımına uğradı. Lütfen tekrar deneyin.');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 2000);
    }, 10000); // 10 seconds timeout
    
    try {
      const token = localStorage.getItem('authToken');
      const userRaw = localStorage.getItem('user');
      const userId = userRaw ? JSON.parse(userRaw || '{}').id : undefined;
      
      const response = await fetch(createApiUrl(`/api/offers/${id}/accept`), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token || ''}`,
          'X-User-Id': userId || '',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        clearTimeout(timeoutId);
        throw new Error('Teklif kabul edilemedi');
      }

      clearTimeout(timeoutId);
      setSuccessMessage('Teklif başarıyla kabul edildi. İşlem başlatıldı.');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 2000);
      await loadOffers();
    } catch (e) {
      clearTimeout(timeoutId);
      setSuccessMessage('Teklif kabul edilemedi. Lütfen tekrar deneyin.');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 2000);
    }
  };

  const handleReject = async (id: number) => {
    try {
      const token = localStorage.getItem('authToken');
      const userRaw = localStorage.getItem('user');
      const userId = userRaw ? JSON.parse(userRaw || '{}').id : undefined;
      
      const response = await fetch(createApiUrl(`/api/offers/${id}/reject`), {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token || ''}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Teklif reddedilemedi');
      }

      setSuccessMessage('Teklif başarıyla reddedildi');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 2000);
      await loadOffers();
    } catch (e) {
      setSuccessMessage('Teklif reddedilemedi. Lütfen tekrar deneyin.');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 2000);
    }
  };

  const handleEditClick = (offer: any) => {
    setEditingOffer(offer);
    setEditPrice(offer.price.toString());
    setEditMessage(offer.description || '');
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    if (!editingOffer) return;

    try {
      const token = localStorage.getItem('authToken');
      const userRaw = localStorage.getItem('user');
      const userId = userRaw ? JSON.parse(userRaw || '{}').id : undefined;
      
      const response = await fetch(createApiUrl(`/api/offers/${editingOffer.id}`), {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token || ''}`,
          'X-User-Id': userId || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price: parseFloat(editPrice),
          message: editMessage,
        }),
      });

      if (!response.ok) {
        throw new Error('Teklif güncellenemedi');
      }

      setSuccessMessage('Teklif başarıyla güncellendi');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 2000);
      setShowEditModal(false);
      setEditingOffer(null);
      await loadOffers();
    } catch (e: any) {
      setSuccessMessage(e?.message || 'Teklif güncellenemedi. Lütfen tekrar deneyin.');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 2000);
    }
  };

  const handleCancelClick = (offer: any) => {
    setEditingOffer(offer);
    setShowCancelModal(true);
  };

  const [cancelReason, setCancelReason] = useState('');

  const handleCancelSubmit = async () => {
    if (!editingOffer) return;

    try {
      const token = localStorage.getItem('authToken');
      const userRaw = localStorage.getItem('user');
      const userId = userRaw ? JSON.parse(userRaw || '{}').id : undefined;

      if (editingOffer.status !== 'pending') {
        throw new Error('Bu teklif artık iptal edilemez. Kabul edilen teklifler “Aktif Yükler” üzerinden yönetilir.');
      }

      const response = await fetch(createApiUrl(`/api/offers/${editingOffer.id}`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token || ''}`,
          'X-User-Id': userId || '',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        try {
          const errorData = await safeJsonParse(response);
          throw new Error((errorData as any)?.message || 'Teklif iptal edilemedi');
        } catch (parseError) {
          throw new Error('Teklif iptal edilemedi');
        }
      }

      try {
        await safeJsonParse(response);
      } catch {
        // Ignore parse errors for successful responses
      }
      setSuccessMessage('Teklif başarıyla iptal edildi');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);
      setShowCancelModal(false);
      setEditingOffer(null);
      setCancelReason('');
      await loadOffers();
    } catch (e: any) {
      setSuccessMessage(e?.message || 'Teklif iptal edilemedi. Lütfen tekrar deneyin.');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);
    }
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50'>
        <div className='max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6'>
          <LoadingState message='Teklifler yükleniyor...' />
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50'>
      <Helmet>
        <title>Teklifler - Nakliyeci Panel - YolNext</title>
        <meta name='description' content='Nakliyeci teklif yönetimi' />
      </Helmet>

      <div className='max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6'>
        {loadError && (
          <div className='mb-4 p-3 rounded-lg border border-red-200 bg-red-50 text-red-700'>
            {loadError}
          </div>
        )}
        {/* Breadcrumb */}
        <div className='mb-4 sm:mb-6'>
          <Breadcrumb items={breadcrumbItems} />
        </div>

        <div className='mb-6'>
          <GuidanceOverlay
            storageKey='nakliyeci.offers'
            isEmpty={!isLoading && offers.length === 0}
            icon={DollarSign}
            title='Tekliflerim'
            description='Beklemedeki tekliflerinizi buradan takip edebilir ve yönetebilirsiniz. Kabul edilen teklifler "Aktif Yükler" sayfasına aktarılır. Yeni iş almak için "Yük Pazarı" sayfasına geçebilirsiniz.'
            primaryAction={{
              label: 'Yük Pazarına Git',
              to: '/nakliyeci/jobs',
            }}
            secondaryAction={{
              label: 'Aktif Yükler',
              to: '/nakliyeci/active-shipments',
            }}
          />
        </div>

        {/* Header */}
        <div className='text-center mb-8 sm:mb-12'>
          <div className='flex justify-center mb-4 sm:mb-6'>
            <div className='w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg'>
              <DollarSign className='w-6 h-6 sm:w-8 sm:h-8 text-white' />
            </div>
          </div>
          <h1 className='text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-2 sm:mb-3'>
            Tekliflerim
          </h1>
          <p className='text-sm sm:text-base md:text-lg text-slate-600 px-4'>
            Gönderilen ve alınan tüm tekliflerinizi yönetin
          </p>
          {/* Bilgilendirme */}
          <div className='mt-4 max-w-2xl mx-auto space-y-3'>
            <div className='bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800'>
              <p className='font-semibold mb-1'>💡 Bilgi:</p>
              <p>Beklemede olan tekliflerinizi düzenleyebilir veya iptal edebilirsiniz. Kabul edilen teklifler "Aktif Yükler" sayfasına otomatik olarak aktarılır.</p>
            </div>
            <div className='flex items-start gap-2 text-xs sm:text-sm text-slate-700'>
              <AlertCircle className='w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5' />
              <div className='space-y-1'>
                <p className='font-medium text-slate-900'>
                  1% komisyon bilgisi — detaylar
                  <button
                    className='ml-1 underline font-semibold hover:text-blue-700'
                    type='button'
                    onClick={() => setShowCommissionModal(true)}
                  >
                    burada
                  </button>
                  .
                </p>
                <p className='text-slate-600'>
                  Şeffaflık için kısa özet: Teklif verirken 1% komisyon için cüzdanınızda yeterli bakiye gerekir. Teklif beklemedeyken iptal ederseniz komisyon blokesi kaldırılır. Teklif kabul edildiğinde komisyon kesintisi kesinleşir.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6'>
          <div className='flex items-center gap-3 mb-4 sm:mb-0'>
            <div className='w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl flex items-center justify-center shadow-lg'>
              <DollarSign className='w-5 h-5 sm:w-6 sm:h-6 text-white' />
            </div>
            <div>
              <h1 className='text-xl sm:text-2xl font-bold text-slate-900'>
                Teklifler
              </h1>
              <p className='text-sm text-slate-600'>
                Nakliye tekliflerinizi yönetin
              </p>
            </div>
          </div>

          <div className='flex flex-wrap gap-2 sm:gap-3'>
            <button
              onClick={() => {
                if (!commissionAcked) {
                  setNavigateAfterAck(true);
                  setShowCommissionModal(true);
                  return;
                }
                navigate('/nakliyeci/jobs');
              }}
              className='flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-slate-800 to-blue-900 text-white rounded-lg sm:rounded-xl hover:shadow-lg transition-all duration-200 text-sm font-medium'
            >
              <Plus className='w-4 h-4 sm:w-5 sm:h-5' />
              <span className='hidden sm:inline'>Yeni Teklif</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8'>
          <div className='bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-slate-600'>Toplam Teklif</p>
                <p className='text-2xl sm:text-3xl font-bold text-slate-900'>
                  {offers.length}
                </p>
              </div>
              <div className='w-10 h-10 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center'>
                <DollarSign className='w-5 h-5 text-white' />
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-slate-600'>Kabul Edilen</p>
                <p className='text-2xl sm:text-3xl font-bold text-green-600'>
                  {offers.filter(o => o.status === 'accepted').length}
                </p>
              </div>
              <div className='w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center'>
                <CheckCircle className='w-5 h-5 text-white' />
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-slate-600'>Bekleyen</p>
                <p className='text-2xl sm:text-3xl font-bold text-yellow-600'>
                  {offers.filter(o => o.status === 'pending').length}
                </p>
              </div>
              <div className='w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center'>
                <Clock className='w-5 h-5 text-white' />
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-slate-600'>Reddedilen</p>
                <p className='text-2xl sm:text-3xl font-bold text-red-600'>
                  {offers.filter(o => o.status === 'rejected').length}
                </p>
              </div>
              <div className='w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center'>
                <XCircle className='w-5 h-5 text-white' />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className='bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200 mb-6 sm:mb-8'>
          <div className='flex flex-col sm:flex-row gap-4'>
            <div className='flex-1'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4' />
                <input
                  type='text'
                  placeholder='Teklif ara...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='w-full pl-10 pr-4 py-2 sm:py-3 border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm'
                />
              </div>
            </div>

            <div className='flex gap-2 sm:gap-3'>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className='px-3 sm:px-4 py-2 sm:py-3 border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm'
              >
                <option value='all'>Tüm Durumlar</option>
                <option value='pending'>Beklemede</option>
                <option value='accepted'>Kabul Edilen</option>
                <option value='rejected'>Reddedilen</option>
                <option value='expired'>Süresi Dolan</option>
              </select>

              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className='px-3 sm:px-4 py-2 sm:py-3 border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm'
              >
                <option value='date'>Tarihe Göre</option>
                <option value='price'>Fiyata Göre</option>
                <option value='matchScore'>Eşleşme Skoruna Göre</option>
              </select>

              <button
                onClick={() =>
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                }
                className='px-3 sm:px-4 py-2 sm:py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg sm:rounded-xl transition-colors'
              >
                {sortOrder === 'asc' ? (
                  <ArrowUp className='w-4 h-4' />
                ) : (
                  <ArrowDown className='w-4 h-4' />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Offers List */}
        {currentOffers.length === 0 ? (
          <div className='min-h-[50vh] flex items-center justify-center'>
            <div className='bg-white rounded-2xl shadow-xl border border-slate-200 p-10 text-center w-full max-w-2xl'>
              <EmptyState
                icon={DollarSign}
                title='Henüz Teklif Yok'
                description='Yük Pazarı’ndan uygun ilanlara teklif verin, kabul edilince kazanın!'
                action={{
                  label: 'Yük Pazarına Git',
                  onClick: () => navigate('/nakliyeci/jobs'),
                }}
              />
            </div>
          </div>
        ) : (
          <div className='space-y-4'>
            {currentOffers.map(offer => (
              <div
                key={offer.id}
                className='bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-200'
              >
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                  <div className='flex-1'>
                    <div className='flex items-center gap-3 mb-2'>
                      <span className='text-sm font-medium text-slate-600'>
                        {toTrackingCode(undefined, offer.shipmentId)}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusStyle(offer.status)}`}
                      >
                        {getStatusText(offer.status)}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityStyle(offer.priority)}`}
                      >
                        {offer.priority === 'high'
                          ? 'Yüksek'
                          : offer.priority === 'normal'
                            ? 'Normal'
                            : 'Düşük'}
                      </span>
                      <div className='flex items-center gap-1'>
                        <Star className='w-3 h-3 text-yellow-500' />
                        <span
                          className={`text-xs font-medium ${getMatchScoreColor(offer.matchScore)}`}
                        >
                          {offer.matchScore === null ? '— Eşleşme' : `%${offer.matchScore} Eşleşme`}
                        </span>
                      </div>
                    </div>

                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4'>
                      <div>
                        <p className='text-xs text-slate-500 mb-1'>Gönderen</p>
                        <p className='text-sm font-medium text-slate-900'>
                          {offer.sender}
                        </p>
                      </div>
                      <div>
                        <p className='text-xs text-slate-500 mb-1'>Güzergah</p>
                        <p className='text-sm font-medium text-slate-900'>
                          {offer.from} → {offer.to}
                        </p>
                      </div>
                      <div>
                        <p className='text-xs text-slate-500 mb-1'>Fiyat</p>
                        <p className='text-sm font-medium text-slate-900'>
                          ₺{offer.price.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className='flex items-center gap-4 text-xs text-slate-500'>
                      <div className='flex items-center gap-1'>
                        <Calendar className='w-3 h-3' />
                        <span>
                          {new Date(offer.date).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                      <div className='flex items-center gap-1'>
                        <Clock className='w-3 h-3' />
                        <span>
                          Teslimat:{' '}
                          {offer.estimatedDelivery && new Date(offer.estimatedDelivery).getFullYear() > 1971
                            ? new Date(offer.estimatedDelivery).toLocaleDateString('tr-TR')
                            : 'Belirtilmedi'}
                        </span>
                      </div>
                      <div className='flex items-center gap-1'>
                        <Package className='w-3 h-3' />
                        <span>{offer.category}</span>
                      </div>
                    </div>
                  </div>

                  <div className='flex items-center gap-2'>
                    {offer.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleEditClick(offer)}
                          className='px-3 py-2 bg-gradient-to-r from-slate-800 to-blue-900 hover:from-blue-900 hover:to-slate-800 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-1'
                          title='Teklifi düzenle'
                        >
                          <Edit className='w-4 h-4' />
                          <span className='hidden sm:inline'>Düzenle</span>
                        </button>
                        <button
                          onClick={() => handleCancelClick(offer)}
                          className='px-3 py-2 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-1'
                          title='Teklifi iptal et'
                        >
                          <XCircle className='w-4 h-4' />
                          <span className='hidden sm:inline'>İptal Et</span>
                        </button>
                      </>
                    )}
                    {offer.status === 'accepted' && (
                      <>
                        <button
                          onClick={() => handleGoToActiveShipments(offer)}
                          className='px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-medium transition-colors'
                        >
                          Aktif Yüklere Git
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleViewDetails(offer)}
                      className='p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors'
                      title='Detayları görüntüle'
                    >
                      <Eye className='w-4 h-4' />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {filteredOffers.length > offersPerPage && (
          <div className='mt-6 sm:mt-8'>
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredOffers.length / offersPerPage)}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Offer Detail Modal */}
      {showOfferModal && selectedOffer && (
        <Modal
          isOpen={showOfferModal}
          onClose={() => setShowOfferModal(false)}
          title='Teklif Detayları'
        >
          <div className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <p className='text-sm text-slate-500'>Takip No</p>
                <p className='font-medium'>{toTrackingCode(undefined, selectedOffer.shipmentId)}</p>
              </div>
              <div>
                <p className='text-sm text-slate-500'>Durum</p>
                <p className='font-medium'>
                  {getStatusText(selectedOffer.status)}
                </p>
              </div>
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <p className='text-sm text-slate-500'>Gönderen</p>
                <p className='font-medium'>{selectedOffer.sender}</p>
              </div>
              <div>
                <p className='text-sm text-slate-500'>Güzergah</p>
                <p className='font-medium'>
                  {selectedOffer.from} → {selectedOffer.to}
                </p>
              </div>
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <p className='text-sm text-slate-500'>Fiyat</p>
                <p className='font-medium'>
                  ₺{selectedOffer.price.toLocaleString()}
                </p>
              </div>
              <div>
                <p className='text-sm text-slate-500'>Eşleşme Skoru</p>
                <p
                  className={`font-medium ${getMatchScoreColor(selectedOffer.matchScore)}`}
                >
                  {selectedOffer.matchScore === null ? '—' : `%${selectedOffer.matchScore}`}
                </p>
              </div>
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div>
                <p className='text-sm text-slate-500'>Teklif Tarihi</p>
                <p className='font-medium'>{safeDateText((selectedOffer as any).date)}</p>
              </div>
              <div>
                <p className='text-sm text-slate-500'>Tahmini Teslimat</p>
                <p className='font-medium'>{safeDateText((selectedOffer as any).estimatedDelivery)}</p>
              </div>
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div>
                <p className='text-sm text-slate-500'>Kategori</p>
                <p className='font-medium'>{(selectedOffer as any).category || '—'}</p>
              </div>
              <div>
                <p className='text-sm text-slate-500'>Ağırlık</p>
                <p className='font-medium'>{(selectedOffer as any).weight || '—'}</p>
              </div>
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div>
                <p className='text-sm text-slate-500'>Öncelik</p>
                <p className='font-medium'>
                  {(selectedOffer as any).priority === 'high'
                    ? 'Yüksek'
                    : (selectedOffer as any).priority === 'normal'
                      ? 'Normal'
                      : (selectedOffer as any).priority === 'low'
                        ? 'Düşük'
                        : '—'}
                </p>
              </div>
              <div>
                <p className='text-sm text-slate-500'>Eşleşme</p>
                <p className={`font-medium ${getMatchScoreColor(selectedOffer.matchScore)}`}>
                  {selectedOffer.matchScore === null ? '—' : `%${selectedOffer.matchScore}`}
                </p>
              </div>
            </div>
            <div>
              <p className='text-sm text-slate-500'>Açıklama</p>
              <p className='font-medium'>{selectedOffer.description}</p>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Offer Modal */}
      {showEditModal && editingOffer && (
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingOffer(null);
            setEditPrice('');
            setEditMessage('');
          }}
          title='Teklifi Düzenle'
        >
          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-slate-700 mb-2'>
                Fiyat (₺)
              </label>
              <input
                type='number'
                value={editPrice}
                onChange={e => setEditPrice(e.target.value)}
                className='w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                placeholder='Fiyat girin'
                min='0'
                step='0.01'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-slate-700 mb-2'>
                Mesaj
              </label>
              <textarea
                value={editMessage}
                onChange={e => setEditMessage(e.target.value)}
                className='w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                placeholder='Teklif mesajınızı yazın'
                rows={4}
              />
            </div>
            <div className='flex gap-3 justify-end'>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingOffer(null);
                  setEditPrice('');
                  setEditMessage('');
                }}
                className='px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors'
              >
                İptal
              </button>
              <button
                onClick={handleEditSubmit}
                className='px-4 py-2 bg-gradient-to-r from-slate-800 to-blue-900 text-white rounded-lg hover:from-blue-900 hover:to-slate-800 transition-colors'
              >
                Kaydet
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Cancel Offer Modal */}
      {showCancelModal && editingOffer && (
        <Modal
          isOpen={showCancelModal}
          onClose={() => {
            setShowCancelModal(false);
            setEditingOffer(null);
            setCancelReason('');
          }}
          title='Teklifi İptal Et'
        >
          <div className='p-6'>
            <p className='text-slate-600 mb-4'>
              Bu teklifi iptal etmek istediğinizden emin misiniz?
            </p>
            <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4'>
              <p className='text-sm text-yellow-800'>
                <strong>Gönderi:</strong> {toTrackingCode(undefined, editingOffer.shipmentId)}
              </p>
              <p className='text-sm text-yellow-800'>
                <strong>Fiyat:</strong> ₺{editingOffer.price.toLocaleString()}
              </p>
            </div>
            {editingOffer.status === 'accepted' && (
              <div className='mb-4'>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  İptal Sebebi (Opsiyonel)
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500'
                  rows={3}
                  placeholder='İptal sebebinizi açıklayın...'
                />
              </div>
            )}
            <div className='flex justify-end gap-3'>
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setEditingOffer(null);
                  setCancelReason('');
                }}
                className='px-4 py-2 bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg'
              >
                Vazgeç
              </button>
              <button
                onClick={handleCancelSubmit}
                className='px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg'
              >
                Teklifi İptal Et
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Commission Info Modal */}
      {showCommissionModal && (
        <Modal
          isOpen={showCommissionModal}
          onClose={() => setShowCommissionModal(false)}
          title='Komisyon Bilgisi'
        >
          <div className='space-y-3 text-sm text-slate-700'>
            <p className='font-semibold text-slate-900'>Şeffaf bilgi:</p>
            <ul className='list-disc list-inside space-y-1'>
              <li>Kabul edilen tekliften 1% komisyon cüzdandan düşülür.</li>
              <li>Teklif beklemedeyken iptal ederseniz komisyon blokesi kaldırılır.</li>
              <li>Teklif kabul edildiğinde komisyon kesintisi kesinleşir.</li>
            </ul>
            <p className='text-slate-600'>
              Bu kural sürpriz maliyetleri önlemek ve platform maliyetlerini karşılamak içindir. Teklif vermeden önce lütfen kesinleşmiş işler için ilerleyin.
            </p>
            <div className='flex justify-end'>
              <button
                onClick={handleCommissionAcknowledge}
                className='px-4 py-2 bg-gradient-to-r from-slate-800 to-blue-900 text-white rounded-lg hover:from-blue-900 hover:to-slate-800 transition-colors'
              >
                Anladım
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Success Message */}
      {showSuccessMessage && (
        <SuccessMessage
          message={successMessage}
          onClose={() => setShowSuccessMessage(false)}
          isVisible={showSuccessMessage}
        />
      )}
    </div>
  );
}













