import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createApiUrl } from '../../config/api';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../contexts/AuthContext';
import {
  Search,
  Clock,
  CheckCircle,
  XCircle,
  Star,
  Truck,
  MapPin,
  Calendar,
  DollarSign,
  Eye,
  MessageCircle,
  FileText,
  Package,
  User,
  Building2,
  Users,
  Download,
  TrendingUp,
  BarChart3,
  CheckSquare,
  X,
  Plus,
  ArrowRight,
  Bell,
  AlertCircle,
  AlertTriangle,
  Shield,
  Target,
  Timer,
  Award,
  MessageSquare,
} from 'lucide-react';
import EmptyState from '../../components/shared-ui-elements/EmptyState';
import LoadingState from '../../components/shared-ui-elements/LoadingState';
import Modal from '../../components/shared-ui-elements/Modal';
import SuccessMessage from '../../components/shared-ui-elements/SuccessMessage';
import GuidanceOverlay from '../../components/shared-ui-elements/GuidanceOverlay';
import { sanitizeShipmentTitle, sanitizeAddressLabel, sanitizeMessageText } from '../../utils/format';

// Offer interface
interface Offer {
  id: string;
  shipmentTitle: string;
  carrierName: string;
  carrierId?: string;
  shipmentId?: string;
  carrierRating: number;
  carrierVerified: boolean;
  carrierReviews: number;
  carrierExperience: string;
  price: number;
  estimatedDelivery: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  pickupAddress: string;
  deliveryAddress: string;
  weight: string;
  dimensions: string;
  specialFeatures: string[];
  tracking: boolean;
  priority: 'low' | 'medium' | 'high';
  trackingCode: string;
  carrierLogo: string;
  recentComments: string[];
  responseTime: string;
  successRate: number;
}

export default function Offers() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filterStatus, setFilterStatus] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAcceptConfirmModal, setShowAcceptConfirmModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentCarrierId, setPaymentCarrierId] = useState<string | null>(null);
  const [paymentShipmentId, setPaymentShipmentId] = useState<string | null>(null);
  const [paymentPrefill, setPaymentPrefill] = useState('');
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [offerToReject, setOfferToReject] = useState<string | null>(null);
  const [offerToAccept, setOfferToAccept] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [offers, setOffers] = useState<Offer[]>([]);
  const [stats, setStats] = useState({
    totalOffers: 0,
    pendingOffers: 0,
    acceptedOffers: 0,
    rejectedOffers: 0,
    averagePrice: 0,
    unreadCount: 0,
  });
  const navigateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const paymentModalOpenRef = useRef(false);
  const loadingRef = useRef(false);

  // Define loadOffers BEFORE useEffect to prevent hoisting issues
  const loadOffers = useCallback(async () => {
    // Prevent multiple simultaneous calls using ref
    if (loadingRef.current) return;
    loadingRef.current = true;
    setIsLoading(true);
    
    // Timeout protection - maksimum 10 saniye bekle
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
      loadingRef.current = false;
    }, 10000);
    
    try {
      const user = localStorage.getItem('user')
        ? (() => {
            try {
              return JSON.parse(localStorage.getItem('user') || '{}');
            } catch {
              return {};
            }
          })()
        : null;
      const userId = user?.id;
      const token = localStorage.getItem('authToken');
      
      // AbortController for timeout
      const controller = new AbortController();
      const fetchTimeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(
        createApiUrl('/api/offers/corporate'),
        {
          headers: {
            Authorization: `Bearer ${token || ''}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        }
      );
      
      clearTimeout(fetchTimeoutId);

      if (!response.ok) {
        throw new Error('Teklifler yüklenemedi');
      }

      const data = await response.json();
      const rawOffers =
        data.data || data.offers || (Array.isArray(data) ? data : []);

      const normalizeOfferStatus = (raw: any): 'pending' | 'accepted' | 'rejected' => {
        const s = String(raw || '').toLowerCase();
        if (s === 'accepted' || s === 'offer_accepted') return 'accepted';
        if (s === 'rejected' || s === 'cancelled' || s === 'canceled') return 'rejected';
        return 'pending';
      };

      const toNumber = (value: any, fallback = 0) => {
        if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
        if (typeof value === 'string') {
          const n = parseFloat(value.replace(/[^0-9.,-]/g, '').replace(',', '.'));
          return Number.isFinite(n) ? n : fallback;
        }
        return fallback;
      };
      const normalizeDate = (v: any) => {
        if (!v) return '';
        const d = v instanceof Date ? v : new Date(v);
        return Number.isFinite(d.getTime()) ? d.toISOString() : '';
      };

      const mappedOffers: Offer[] = rawOffers.map((row: any) => ({
        id: String(row.id),
        shipmentId: row.shipmentId ? String(row.shipmentId) : (row.shipment_id ? String(row.shipment_id) : undefined),
        shipmentTitle: sanitizeShipmentTitle(row.shipmentTitle || row.title || 'Gönderi'),
        carrierName: row.carrierName || row.carrier?.name || 'Nakliyeci',
        carrierId: row.carrierId ? String(row.carrierId) : (row.carrier?.id ? String(row.carrier.id) : undefined),
        carrierRating: Number(row.carrierRating || row.carrier?.rating || 0) || 0,
        carrierVerified: row.carrierVerified || row.carrier?.verified || false,
        carrierReviews: Number(row.carrierReviews || row.carrier?.reviews || 0) || 0,
        carrierExperience: String(row.carrierExperience || '').trim(),
        price: toNumber(row.price ?? row.offerPrice ?? row.offer_price, 0),
        estimatedDelivery: normalizeDate(row.estimatedDelivery || row.estimated_delivery || row.deliveryDate || row.delivery_date),
        message: sanitizeMessageText(row.message || row.notes || ''),
        status: normalizeOfferStatus(row.status),
        createdAt: normalizeDate(row.createdAt || row.created_at || row.date),
        pickupAddress: sanitizeAddressLabel(row.pickupAddress || row.pickup_address || ''),
        deliveryAddress: sanitizeAddressLabel(row.deliveryAddress || row.delivery_address || ''),
        weight: row.weight || '',
        dimensions: row.dimensions || row.size || '',
        specialFeatures: row.specialFeatures || row.special_features || [],
        tracking: row.tracking || false,
        priority: row.priority || 'medium',
        trackingCode: row.trackingCode || `SHP-${row.id}`,
        carrierLogo:
          row.carrierLogo ||
          (row.carrierName ? row.carrierName.charAt(0).toUpperCase() : 'N'),
        recentComments: row.recentComments || [],
        responseTime: String(row.responseTime || '').trim(),
        successRate: Number(row.successRate || 0) || 0,
      }));

      setOffers(mappedOffers);

      const totalOffers = mappedOffers.length;
      const pendingOffers = mappedOffers.filter(o => o.status === 'pending').length;
      const acceptedOffers = mappedOffers.filter(o => o.status === 'accepted').length;
      const rejectedOffers = mappedOffers.filter(o => o.status === 'rejected').length;
      const averagePrice =
        totalOffers > 0
          ? mappedOffers.reduce((sum: number, o) => sum + (Number.isFinite(o.price) ? o.price : 0), 0) / totalOffers
          : 0;

      setStats(
        data.stats || {
          totalOffers,
          pendingOffers,
          acceptedOffers,
          rejectedOffers,
          averagePrice,
          unreadCount: 0,
        }
      );
    } catch (error) {
      if (import.meta.env.DEV) {
        // Error loading offers
      }
      // Set empty arrays and zero stats when there's an error
      setOffers([]);
      setStats({
        totalOffers: 0,
        pendingOffers: 0,
        acceptedOffers: 0,
        rejectedOffers: 0,
        averagePrice: 0,
        unreadCount: 0,
      });
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
      clearTimeout(timeoutId);
    }
  }, []); // EMPTY ARRAY - No dependencies to prevent circular dependency

  // useEffect hooks - AFTER loadOffers definition
  useEffect(() => {
    const userId = (user as any)?.id;
    const role = String((user as any)?.role || 'corporate').toLowerCase();
    if (!userId) return;
    localStorage.setItem(`yolnext:lastSeen:offers:${userId}:${role}`, new Date().toISOString());
    window.dispatchEvent(new Event('yolnext:refresh-badges'));
  }, [user]);

  useEffect(() => {
    paymentModalOpenRef.current = showPaymentModal;
  }, [showPaymentModal]);

  // Load offers only once on mount - prevent circular dependency
  useEffect(() => {
    loadOffers();
  }, []); // EMPTY ARRAY - Only run once on mount

  useEffect(() => {
    return () => {
      if (navigateTimerRef.current) {
        clearTimeout(navigateTimerRef.current);
      }
    };
  }, []);

  const filteredOffers = offers.filter(offer => {
    const matchesStatus =
      filterStatus === 'all' ? true : offer.status === filterStatus;
    const matchesSearch = !searchTerm || searchTerm.trim() === '' || (
      (offer.shipmentTitle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (offer.carrierName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (offer.trackingCode || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    return matchesStatus && matchesSearch;
  });

  const sortedOffers = [...filteredOffers].sort((a, b) => {
    if (sortBy === 'price') return Number(a.price || 0) - Number(b.price || 0);
    if (sortBy === 'rating') return Number(b.carrierRating || 0) - Number(a.carrierRating || 0);
    // default: date desc (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'accepted':
        return { text: 'Kabul Edildi', color: 'bg-green-100 text-green-800' };
      case 'rejected':
        return { text: 'Reddedildi', color: 'bg-red-100 text-red-800' };
      case 'pending':
        return { text: 'Beklemede', color: 'bg-yellow-100 text-yellow-800' };
      default:
        return { text: 'Bilinmiyor', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className='w-3 h-3 mr-1' />;
      case 'rejected':
        return <XCircle className='w-3 h-3 mr-1' />;
      case 'pending':
        return <Clock className='w-3 h-3 mr-1' />;
      default:
        return <Clock className='w-3 h-3 mr-1' />;
    }
  };

  const handleAcceptOffer = async (offerId: string) => {
    // Individual panel pattern transfer - direct action without modal barriers
    setOfferToAccept(offerId);
    await confirmAcceptOffer();
  };

  const confirmAcceptOffer = async () => {
    if (!offerToAccept) return;
    
    setIsLoading(true);
    setShowAcceptConfirmModal(false);
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
      setSuccessMessage('Teklif kabul işlemi zaman aşımına uğradı. Lütfen tekrar deneyin.');
      setShowSuccessMessage(true);
    }, 10000); // 10 seconds timeout
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(createApiUrl(`/api/offers/${offerToAccept}/accept`), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token || ''}`,
          'Content-Type': 'application/json',
        },
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        clearTimeout(timeoutId);
        throw new Error(payload?.message || 'Teklif kabul edilemedi');
      }
      
      clearTimeout(timeoutId);

      const localOffer = offers.find(o => String(o.id) === String(offerToAccept)) || null;
      const carrierId = payload?.data?.carrierId
        ? String(payload.data.carrierId)
        : (localOffer?.carrierId ? String(localOffer.carrierId) : null);
      const shipmentId = payload?.data?.shipmentId
        ? String(payload.data.shipmentId)
        : (localOffer?.shipmentId ? String(localOffer.shipmentId) : null);
      setPaymentCarrierId(carrierId);
      setPaymentShipmentId(shipmentId);
      setPaymentPrefill(`Merhaba, ödeme detaylarını netleştirelim. İş No: #${shipmentId || ''}`.trim());
      setShowPaymentModal(true);

      // Individual panel success pattern - immediate feedback, quick navigation
      setSuccessMessage('Teklif başarıyla kabul edildi. Ödeme güvence altına alındı. Gönderilerinize yönlendiriliyorsunuz.');
      setShowSuccessMessage(true);
      
      setOffers(prev => prev.filter(offer => offer.id !== offerToAccept));
      setStats(prev => ({
        ...prev,
        pendingOffers: Math.max(0, prev.pendingOffers - 1),
        acceptedOffers: prev.acceptedOffers + 1,
      }));

      // Standardized transition - 2 seconds for user to read success message
      setTimeout(() => {
        setShowSuccessMessage(false);
        navigate('/corporate/shipments', { state: { refresh: true } });
      }, 2000);
    } catch (error) {
      // Error accepting offer
      clearTimeout(timeoutId);
      setSuccessMessage('Teklif kabul edilemedi. Lütfen tekrar deneyin.');
      setShowSuccessMessage(true);
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
      setOfferToAccept(null);
    }
  };

  const handleRejectOffer = async (offerId: string) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(createApiUrl(`/api/offers/${offerId}/reject`), {
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
      setOffers(prev => prev.filter(offer => offer.id !== offerId));
      setStats(prev => ({
        ...prev,
        pendingOffers: Math.max(0, prev.pendingOffers - 1),
        rejectedOffers: prev.rejectedOffers + 1,
      }));
      // Reload offers to ensure sync with backend
      await loadOffers();
      setTimeout(() => setShowSuccessMessage(false), 2000);
    } catch (error) {
      // Error rejecting offer
      setSuccessMessage('Teklif reddedilemedi. Lütfen tekrar deneyin.');
      setShowSuccessMessage(true);
    } finally {
      setIsLoading(false);
      setOfferToReject(null);
      setShowRejectModal(false);
    }
  };

  const handleViewDetails = (offerId: string) => {
    const offer = offers.find(o => o.id === offerId);
    if (offer) {
      setSelectedOffer(offer);
      setShowDetailModal(true);
    }
  };

  const isMessagingEnabledForOffer = (status?: any) => {
    const s = String(status || '').trim();
    return s === 'accepted';
  };

  const handleContactCarrier = (status?: any) => {
    if (!isMessagingEnabledForOffer(status)) return;
    setShowContactModal(true);
  };

  if (isLoading) {
    return <LoadingState message='Teklifler yükleniyor...' />;
  }

  if (showSuccessMessage) {
    return (
      <SuccessMessage
        isVisible={showSuccessMessage}
        message={successMessage}
        onClose={() => setShowSuccessMessage(false)}
      />
    );
  }

  return (
    <div className='min-h-screen bg-white'>
      <Helmet>
        <title>Tekliflerim - YolNext Kurumsal</title>
        <meta
          name='description'
          content='YolNext kurumsal panel teklifler sayfası'
        />
      </Helmet>

      <div className='max-w-6xl mx-auto px-4 py-6'>
        {/* Header - MyShipments Style */}
        <div className='text-center mb-12'>
          <div className='flex justify-center mb-6'>
            <div className='w-16 h-16 bg-gradient-to-br from-slate-800 to-blue-900 rounded-2xl flex items-center justify-center shadow-lg'>
              <FileText className='w-8 h-8 text-white' />
            </div>
          </div>
          <h1 className='text-4xl md:text-5xl font-bold text-slate-900 mb-3'>
            Tekliflerinizi{' '}
            <span className='text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-blue-900'>
              Yönetin
            </span>
          </h1>
          <p className='text-lg text-slate-600'>
            Gönderileriniz için gelen teklifleri değerlendirin ve yönetin
          </p>
        </div>

        <div className='mb-6'>
          <GuidanceOverlay
            storageKey='corporate.offers'
            isEmpty={!isLoading && offers.length === 0}
            icon={FileText}
            title='Teklif Yönetimi'
            description='Gelen teklifleri inceleyin, nakliyeci profillerini değerlendirin ve en uygun teklifi seçin. Teklif kabul edildikten sonra taşıma süreci başlar ve ödeme güvence altına alınır.'
            primaryAction={{
              label: 'Gönderi Oluştur',
              to: '/corporate/create-shipment',
            }}
            secondaryAction={{
              label: 'Gönderiler',
              to: '/corporate/shipments',
            }}
          />
        </div>

        {/* Stats Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8'>
          {/* Total Offers */}
          <div className='bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-300 transition-all duration-300'>
            <div className='flex items-center justify-between mb-4'>
              <div className='w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center'>
                <FileText className='w-6 h-6 text-white' />
              </div>
              <div className='text-right'>
                <div className='text-2xl font-bold text-slate-900 mb-1'>
                  {stats.totalOffers}
                </div>
                <div className='flex items-center gap-1'>
                  <ArrowRight className='w-3 h-3 text-blue-600' />
                  <span className='text-xs text-blue-600 font-semibold'>
                    Toplam Teklif
                  </span>
                </div>
              </div>
            </div>
            <div className='text-slate-700 font-semibold text-sm'>
              Toplam Teklif Sayısı
            </div>
            <div className='mt-1 text-xs text-slate-500'>
              Gelen tüm teklifler
            </div>
          </div>

          {/* Pending Offers */}
          <div className='bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-orange-300 transition-all duration-300'>
            <div className='flex items-center justify-between mb-4'>
              <div className='w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center'>
                <Clock className='w-6 h-6 text-white' />
              </div>
              <div className='text-right'>
                <div className='text-2xl font-bold text-slate-900 mb-1'>
                  {stats.pendingOffers}
                </div>
                <div className='flex items-center gap-1'>
                  <ArrowRight className='w-3 h-3 text-orange-600' />
                  <span className='text-xs text-orange-600 font-semibold'>
                    Bekleyen Teklif
                  </span>
                </div>
              </div>
            </div>
            <div className='text-slate-700 font-semibold text-sm'>
              Bekleyen Teklif Sayısı
            </div>
            <div className='mt-1 text-xs text-slate-500'>
              Karar bekleyen teklifler
            </div>
          </div>

          {/* Accepted Offers */}
          <div className='bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-green-300 transition-all duration-300'>
            <div className='flex items-center justify-between mb-4'>
              <div className='w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center'>
                <CheckCircle className='w-6 h-6 text-white' />
              </div>
              <div className='text-right'>
                <div className='text-2xl font-bold text-slate-900 mb-1'>
                  {stats.acceptedOffers}
                </div>
                <div className='flex items-center gap-1'>
                  <ArrowRight className='w-3 h-3 text-green-600' />
                  <span className='text-xs text-green-600 font-semibold'>
                    Kabul Edilen Teklif
                  </span>
                </div>
              </div>
            </div>
            <div className='text-slate-700 font-semibold text-sm'>
              Kabul Edilen Teklif Sayısı
            </div>
            <div className='mt-1 text-xs text-slate-500'>
              Onaylanan teklifler
            </div>
          </div>

          {/* Average Price */}
          <div className='bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-purple-300 transition-all duration-300'>
            <div className='flex items-center justify-between mb-4'>
              <div className='w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center'>
                <DollarSign className='w-6 h-6 text-white' />
              </div>
              <div className='text-right'>
                <div className='text-2xl font-bold text-slate-900 mb-1'>
                  ₺{stats.averagePrice.toLocaleString()}
                </div>
                <div className='flex items-center gap-1'>
                  <ArrowRight className='w-3 h-3 text-purple-600' />
                  <span className='text-xs text-purple-600 font-semibold'>
                    Ortalama Teklif Fiyatı
                  </span>
                </div>
              </div>
            </div>
            <div className='text-slate-700 font-semibold text-sm'>
              Tüm tekliflerin ortalaması
            </div>
            <div className='mt-1 text-xs text-slate-500'>
              En uygun fiyatları yakalayın
            </div>
          </div>
        </div>

        {/* Filters Card */}
        <div className='bg-white rounded-2xl p-8 shadow-xl border border-slate-200 mb-8'>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4' />
              <input
                type='text'
                placeholder='Teklif ara...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              />
            </div>

            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className='px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            >
              <option value='all'>Tüm Durumlar</option>
              <option value='pending'>Beklemede</option>
              <option value='accepted'>Kabul Edilen</option>
              <option value='rejected'>Reddedilen</option>
            </select>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className='px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            >
              <option value='date'>Tarihe Göre</option>
              <option value='price'>Fiyata Göre</option>
              <option value='rating'>Nakliyeci Puanına Göre</option>
            </select>
          </div>
        </div>

        {/* Offers Cards */}
        <div className='space-y-4'>
          {sortedOffers.length > 0 ? (
            sortedOffers.map(offer => (
              <div
                key={offer.id}
                className='bg-white rounded-xl shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 group'
              >
                <div className='p-6'>
                  {/* Compact Header */}
                  <div className='flex items-center justify-between mb-4'>
                    <div className='flex items-center gap-3'>
                      <div className='w-10 h-10 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl flex items-center justify-center'>
                        <FileText className='w-5 h-5 text-white' />
                      </div>
                      <div>
                        <h3 className='text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors'>
                          {offer.shipmentTitle}
                        </h3>
                        <div className='flex items-center gap-3 text-sm text-slate-500'>
                          <span className='font-mono bg-slate-100 text-slate-800 px-2 py-1 rounded'>
                            {offer.trackingCode}
                          </span>
                          <span>
                            {new Date(offer.createdAt).toLocaleDateString(
                              'tr-TR'
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className='text-right'>
                      <div className='text-2xl font-bold text-blue-600'>
                        ₺{offer.price.toLocaleString()}
                      </div>
                      <div className='text-sm text-slate-500'>
                        Teslimat: {offer.estimatedDelivery}
                      </div>
                    </div>
                  </div>

                  {/* Compact Info */}
                  <div className='flex items-center justify-between mb-4'>
                    <div className='flex items-center gap-4 text-sm text-slate-600'>
                      <div className='flex items-center gap-1'>
                        <MapPin className='w-4 h-4' />
                        <span>
                          {offer.pickupAddress} → {offer.deliveryAddress}
                        </span>
                      </div>
                      <div className='flex items-center gap-1'>
                        <Package className='w-4 h-4' />
                        <span>
                          {offer.weight} • {offer.dimensions}
                        </span>
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold ${getStatusInfo(offer.status).color}`}
                      >
                        {getStatusIcon(offer.status)}
                        {getStatusInfo(offer.status).text}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                          offer.priority === 'high'
                            ? 'bg-red-100 text-red-800'
                            : offer.priority === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {offer.priority === 'high'
                          ? 'Yüksek'
                          : offer.priority === 'medium'
                            ? 'Orta'
                            : 'Düşük'}{' '}
                        Öncelik
                      </span>
                    </div>
                  </div>

                  {/* Carrier Preview */}
                  <div className='flex items-center justify-between mb-4'>
                    <div className='flex items-center gap-3'>
                      <div className='w-8 h-8 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center text-white font-bold text-sm'>
                        {offer.carrierLogo}
                      </div>
                      <div>
                        <div className='flex items-center gap-2'>
                          <span className='font-semibold text-slate-900'>
                            {offer.carrierName}
                          </span>
                          {offer.carrierVerified && (
                            <Shield className='w-4 h-4 text-green-600' />
                          )}
                        </div>
                        <div className='flex items-center gap-2 text-sm text-slate-500'>
                          {Number(offer.carrierRating || 0) > 0 ? (
                            <div className='flex items-center gap-1'>
                              <Star className='w-3 h-3 text-yellow-500 fill-current' />
                              <span>{offer.carrierRating}</span>
                            </div>
                          ) : (
                            <span className='text-slate-400'>Değerlendirme bekleniyor</span>
                          )}
                          <span>•</span>
                          {Number(offer.carrierReviews || 0) > 0 ? (
                            <span>{offer.carrierReviews} değerlendirme</span>
                          ) : (
                            <span className='text-slate-400'>Değerlendirme bekleniyor</span>
                          )}
                          {offer.carrierExperience && (
                            <>
                              <span>•</span>
                              <span>{offer.carrierExperience} deneyim</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      {offer.tracking && (
                        <span className='px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-lg'>
                          Takip ✓
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className='flex items-center justify-between'>
                    <div className='text-sm text-slate-500'>
                      {offer.message.length > 60
                        ? offer.message.substring(0, 60) + '...'
                        : offer.message}
                    </div>
                    <div className='flex items-center gap-2'>
                      {offer.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleAcceptOffer(offer.id)}
                            className='px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-1'
                          >
                            <CheckCircle className='w-4 h-4' />
                            Kabul Et
                          </button>
                          <button
                            onClick={() => {
                              setOfferToReject(offer.id);
                              setShowRejectModal(true);
                            }}
                            className='px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-1'
                          >
                            <XCircle className='w-4 h-4' />
                            Reddet
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleViewDetails(offer.id)}
                        className='px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm font-medium rounded-lg transition-colors flex items-center gap-1'
                      >
                        <Eye className='w-4 h-4' />
                        Detay
                      </button>
                      {/* Gizlilik Kuralı: Sadece mesajlaşma butonu göster, telefon/email gizli */}
                      <button
                        onClick={() => handleContactCarrier(offer.status)}
                        disabled={!isMessagingEnabledForOffer(offer.status)}
                        title={!isMessagingEnabledForOffer(offer.status) ? 'Mesajlaşma teklif kabul edilince açılır' : 'Nakliyeci ile mesajlaş'}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1 ${
                          isMessagingEnabledForOffer(offer.status)
                            ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <MessageCircle className='w-4 h-4' />
                        Mesajlaş
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className='bg-white rounded-2xl shadow-xl border border-slate-200 p-6 text-center col-span-full'>
              <EmptyState
                icon={FileText}
                title='Henüz Teklif Yok'
                description='Gönderi oluşturun, nakliyeciler size teklif sunacak. Ortalama bekleme süresi 5-15 dakikadır. 24 saat içinde teklif gelmezse otomatik bildirim alırsınız.'
                action={{
                  label: 'Yeni Gönderi Oluştur',
                  onClick: () => navigate('/corporate/create-shipment'),
                }}
              />
            </div>
          )}
        </div>

        {/* Detail Modal */}
        <Modal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title=''
          size='xl'
        >
          {selectedOffer && (
            <div className='p-0'>
              {/* Modern Header */}
              <div className='relative bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 p-8 text-white rounded-t-2xl'>
                <div className='absolute inset-0 bg-gradient-to-r from-white/5 to-transparent rounded-t-2xl'></div>
                <div className='relative z-10'>
                  <div className='flex items-start justify-between mb-6'>
                    <div className='flex-1'>
                      <div className='flex items-center gap-3 mb-4'>
                        <div className='w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center'>
                          <FileText className='w-6 h-6 text-white' />
                        </div>
                        <div>
                          <h3 className='text-2xl font-bold mb-2'>
                            {selectedOffer.shipmentTitle}
                          </h3>
                          <div className='flex items-center gap-4 text-blue-200'>
                            <span className='font-mono bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-sm'>
                              {selectedOffer.trackingCode}
                            </span>
                            <span className='text-sm'>
                              {new Date(
                                selectedOffer.createdAt
                              ).toLocaleDateString('tr-TR')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className='flex items-center gap-6 text-blue-200'>
                        <div className='flex items-center gap-2'>
                          <MapPin className='w-5 h-5' />
                          <span className='font-medium'>
                            {selectedOffer.pickupAddress} →{' '}
                            {selectedOffer.deliveryAddress}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className='text-right'>
                      <div className='text-4xl font-bold mb-2'>
                        ₺{selectedOffer.price.toLocaleString()}
                      </div>
                      <div className='text-blue-200'>
                        Teslimat: {selectedOffer.estimatedDelivery}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className='p-8'>
                {/* Carrier Profile */}
                <div className='bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl p-8 mb-8 border border-slate-200'>
                  <div className='flex items-center gap-6 mb-6'>
                    <div className='w-20 h-20 bg-gradient-to-br from-slate-800 to-blue-900 rounded-3xl flex items-center justify-center text-white font-bold text-2xl shadow-xl'>
                      {selectedOffer.carrierLogo}
                    </div>
                    <div className='flex-1'>
                      <div className='flex items-center gap-3 mb-3'>
                        <h4 className='text-2xl font-bold text-slate-900'>
                          {selectedOffer.carrierName}
                        </h4>
                        {selectedOffer.carrierVerified && (
                          <div className='flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold'>
                            <Shield className='w-4 h-4' />
                            Doğrulanmış
                          </div>
                        )}
                      </div>
                      <div className='grid grid-cols-2 lg:grid-cols-4 gap-6'>
                        {Number(selectedOffer.carrierRating || 0) > 0 || Number(selectedOffer.carrierReviews || 0) > 0 ? (
                          <div className='bg-white rounded-xl p-4 shadow-sm'>
                            <div className='flex items-center gap-2 mb-1'>
                              {Number(selectedOffer.carrierRating || 0) > 0 && (
                                <>
                                  <Star className='w-5 h-5 text-yellow-500 fill-current' />
                                  <span className='text-lg font-bold text-slate-900'>
                                    {selectedOffer.carrierRating}
                                  </span>
                                </>
                              )}
                              {Number(selectedOffer.carrierRating || 0) <= 0 && (
                                <span className='text-lg font-bold text-slate-900'>-</span>
                              )}
                            </div>
                            <div className='text-sm text-slate-500'>
                                {Number(selectedOffer.carrierReviews || 0) > 0
                                ? `${selectedOffer.carrierReviews} değerlendirme`
                                : 'Değerlendirme bekleniyor'}
                            </div>
                          </div>
                        ) : (
                          <div className='bg-white rounded-xl p-4 shadow-sm'>
                            <div className='text-sm text-slate-500'>Henüz puan yok</div>
                          </div>
                        )}
                        {selectedOffer.carrierExperience && (
                          <div className='bg-white rounded-xl p-4 shadow-sm'>
                            <div className='text-lg font-bold text-slate-900 mb-1'>
                              {selectedOffer.carrierExperience}
                            </div>
                            <div className='text-sm text-slate-500'>Deneyim</div>
                          </div>
                        )}
                        {Number(selectedOffer.successRate || 0) > 0 && (
                          <div className='bg-white rounded-xl p-4 shadow-sm'>
                            <div className='text-lg font-bold text-slate-900 mb-1'>
                              %{selectedOffer.successRate}
                            </div>
                            <div className='text-sm text-slate-500'>
                              Başarı Oranı
                            </div>
                          </div>
                        )}
                        {selectedOffer.responseTime && (
                          <div className='bg-white rounded-xl p-4 shadow-sm'>
                            <div className='text-lg font-bold text-slate-900 mb-1'>
                              {selectedOffer.responseTime}
                            </div>
                            <div className='text-sm text-slate-500'>
                              Yanıt Süresi
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                </div>

                {/* Reviews Section */}
                <div className='mb-8'>
                  <h5 className='text-xl font-bold text-slate-900 mb-6 flex items-center gap-2'>
                    <Star className='w-6 h-6 text-yellow-500' />
                    Müşteri Değerlendirmeleri
                  </h5>
                  {Array.isArray(selectedOffer.recentComments) && selectedOffer.recentComments.length > 0 ? (
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                      {selectedOffer.recentComments.map((comment, index) => (
                        <div
                          key={index}
                          className='bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow'
                        >
                          <div className='flex items-center gap-3 mb-3'>
                            <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold'>
                              {index + 1}
                            </div>
                            <div>
                              <div className='font-semibold text-slate-900'>
                                Müşteri {index + 1}
                              </div>
                            </div>
                          </div>
                          <p className='text-slate-600 italic'>"{comment}"</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className='bg-white border border-slate-200 rounded-xl p-6 shadow-sm'>
                      <div className='text-sm text-slate-600'>Değerlendirme bekleniyor</div>
                    </div>
                  )}
                </div>

                {/* Ödeme Güvencesi Bilgisi - Gönderici için */}
                {selectedOffer.status === 'pending' && (
                  <div className='mb-8 p-5 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl'>
                    <div className='flex items-start gap-3'>
                      <Shield className='w-6 h-6 text-green-700 flex-shrink-0 mt-0.5' />
                      <div className='flex-1'>
                        <h5 className='text-base font-semibold text-green-900 mb-2'>Ödeme Güvencesi</h5>
                        <p className='text-sm text-green-800 leading-relaxed'>
                          Bu teklifi kabul ettiğinizde, ödeme tutarı güvence altına alınır. 
                          Teslimat tamamlandığında ve siz onayladığınızda ödeme nakliyeciye aktarılır. 
                          Bu sistem sayesinde hem siz hem de nakliyeci güvende olursunuz.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Message */}
                <div className='mb-8'>
                  <h5 className='text-lg font-bold text-slate-900 mb-4 flex items-center gap-2'>
                    <MessageSquare className='w-5 h-5 text-blue-600' />
                    Nakliyeci Mesajı
                  </h5>
                  <div className='bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6'>
                    <div className='flex items-start gap-3'>
                      <div className='w-8 h-8 bg-gradient-to-r from-slate-800 to-blue-900 rounded-full flex items-center justify-center flex-shrink-0'>
                        <MessageSquare className='w-4 h-4 text-white' />
                      </div>
                      <p className='text-slate-700 leading-relaxed'>
                        {selectedOffer.message}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className='flex justify-end gap-4'>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className='px-6 py-3 text-slate-600 hover:text-slate-800 transition-colors font-medium'
                  >
                    Kapat
                  </button>
                  {selectedOffer.status === 'pending' && (
                    <>
                      <button
                        onClick={() => {
                          setShowDetailModal(false);
                          handleAcceptOffer(selectedOffer.id);
                        }}
                        className='px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-800 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl'
                      >
                        <CheckCircle className='w-5 h-5' />
                        Kabul Et
                      </button>
                      <button
                        onClick={() => {
                          setShowDetailModal(false);
                          setOfferToReject(selectedOffer.id);
                          setShowRejectModal(true);
                        }}
                        className='px-8 py-3 bg-gradient-to-r from-red-600 to-rose-700 text-white rounded-xl font-semibold hover:from-red-700 hover:to-rose-800 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl'
                      >
                        <XCircle className='w-5 h-5' />
                        Reddet
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* Streamlined acceptance - no confirmation modal needed */}

        <Modal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setPaymentCarrierId(null);
            setPaymentShipmentId(null);
            setPaymentPrefill('');
          }}
          title='Ödeme ve Süreç'
        >
          <div className='space-y-4'>
            <div className='text-sm text-slate-700'>
              Ödemenizi anlaştığınız nakliyeci ile mesajlaşma üzerinden konuşabilirsiniz. Tutar, yöntem ve açıklama bilgisini netleştirmeniz önerilir.
            </div>
            <div className='p-3 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-700'>
              Hazır mesaj: <span className='font-semibold'>{paymentPrefill || 'Merhaba, ödeme detaylarını netleştirelim.'}</span>
            </div>
            <div className='flex gap-2 justify-end'>
              <button
                className='btn-primary'
                disabled={!paymentCarrierId}
                onClick={() => {
                  const params = new URLSearchParams();
                  if (paymentCarrierId) params.set('userId', String(paymentCarrierId));
                  if (paymentPrefill) params.set('prefill', paymentPrefill);
                  navigate(`/corporate/messages?${params.toString()}`);
                }}
              >
                Mesaj Gönder
              </button>
            </div>
          </div>
        </Modal>

      </div>
    </div>
  );
}











