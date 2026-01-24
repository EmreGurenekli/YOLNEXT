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
  MessageSquare,
  Package,
  User,
  Building2,
  Users,
  TrendingUp,
  BarChart3,
  CheckSquare,
  X,
  Plus,
  ArrowRight,
  Bell,
  AlertCircle,
  AlertTriangle,
  FileText,
  Zap,
  Shield,
  Award,
  Timer,
  Target,
  Sparkles,
  ThumbsUp,
  MessageCircle,
  Heart,
  Flag,
  CheckCircle2,
} from 'lucide-react';
import Breadcrumb from '../../components/shared-ui-elements/Breadcrumb';
import EmptyState from '../../components/shared-ui-elements/EmptyState';
import ErrorDisplay from '../../components/shared-ui-elements/ErrorDisplay';
import LoadingState from '../../components/shared-ui-elements/LoadingState';
import Modal from '../../components/shared-ui-elements/Modal';
import SuccessMessage from '../../components/shared-ui-elements/SuccessMessage';
import RatingModal from '../../components/RatingModal';
import GuidanceOverlay from '../../components/shared-ui-elements/GuidanceOverlay';
import CarrierInfoCard from '../../components/CarrierInfoCard';
import { normalizeTrackingCode } from '../../utils/trackingCode';

// Tarih formatlama fonksiyonu - ISO tarihini Türkçe formatına çevirir
const formatDeliveryDate = (dateStr: string): string => {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    if (!Number.isFinite(date.getTime())) return dateStr;
    return new Intl.DateTimeFormat('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
};

interface Offer {
  id: string;
  shipmentTitle: string;
  carrierName: string;
  carrierCompany?: string;
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
  completedJobs?: number;
  isFromRoutePlanner?: boolean; // Rota planlayıcıdan gelen teklif mi?
  sourceCity?: string; // Nakliyeci'nin geldiği şehir
}

export default function Offers() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentCarrierId, setPaymentCarrierId] = useState<string | null>(null);
  const [paymentShipmentId, setPaymentShipmentId] = useState<string | null>(null);
  const [paymentPrefill, setPaymentPrefill] = useState('');
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [offerToReject, setOfferToReject] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [rejectCustomReason, setRejectCustomReason] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [offers, setOffers] = useState<Offer[]>([]);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [selectedCarrierForReviews, setSelectedCarrierForReviews] = useState<{ id: string; name: string; email: string; type: string } | null>(null);
  const [stats, setStats] = useState({
    totalOffers: 0,
    pendingOffers: 0,
    acceptedOffers: 0,
    rejectedOffers: 0,
    averagePrice: 0,
    topCarrier: '',
    responseTime: 0,
  });
  const navigateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const paymentModalOpenRef = useRef(false);

  useEffect(() => {
    const userId = (user as any)?.id;
    const role = String((user as any)?.role || 'individual').toLowerCase();
    if (!userId) return;
    localStorage.setItem(`yolnext:lastSeen:offers:${userId}:${role}`, new Date().toISOString());
    window.dispatchEvent(new Event('yolnext:refresh-badges'));
  }, [user]);

  useEffect(() => {
    paymentModalOpenRef.current = showPaymentModal;
  }, [showPaymentModal]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (navigateTimerRef.current) {
        clearTimeout(navigateTimerRef.current);
      }
    };
  }, []);

  const normalizeOfferStatus = (raw: any): 'pending' | 'accepted' | 'rejected' => {
    const s = String(raw || '').toLowerCase();
    if (s === 'accepted' || s === 'offer_accepted') return 'accepted';
    if (s === 'rejected' || s === 'cancelled' || s === 'canceled') return 'rejected';
    return 'pending';
  };

  const loadOffers = useCallback(async () => {
    setIsLoading(true);
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
      
      // Timeout protection - maksimum 10 saniye bekle
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(
        createApiUrl('/api/offers/individual'),
        {
          headers: {
            Authorization: `Bearer ${token || ''}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Teklifler yüklenemedi');
      }

      const data = await response.json();
      const rawOffers = data.data || data.offers || (Array.isArray(data) ? data : []);

      const rawOffersArray = Array.isArray(rawOffers) ? rawOffers : [];
      const totalOffers = rawOffersArray.length;
      const pendingOffersCount = rawOffersArray.filter(
        (o: any) => normalizeOfferStatus(o?.status) === 'pending'
      ).length;
      const acceptedOffersCount = rawOffersArray.filter(
        (o: any) => normalizeOfferStatus(o?.status) === 'accepted'
      ).length;
      const rejectedOffersCount = rawOffersArray.filter(
        (o: any) => normalizeOfferStatus(o?.status) === 'rejected'
      ).length;
      const averagePrice =
        totalOffers > 0
          ? rawOffersArray.reduce((sum: number, o: any) => {
              const price = Number(o?.price || o?.offerPrice || 0);
              return sum + (Number.isFinite(price) ? price : 0);
            }, 0) / totalOffers
          : 0;
      
      // Map backend data to frontend format
      // IMPORTANT: Only show pending offers - accepted/rejected offers should not appear here
      const mappedOffers = rawOffersArray
        .filter((offer: any) => normalizeOfferStatus(offer?.status) === 'pending') // Only pending offers
        .map((offer: any) => {
          // Rota planlayıcı bilgisini message'dan parse et
          let message = offer.message || '';
          let isFromRoutePlanner = false;
          let sourceCity = '';
          
          if (message && message.startsWith('[ROUTE_PLANNER:')) {
            isFromRoutePlanner = true;
            const match = message.match(/^\[ROUTE_PLANNER:([^\]]+)\]/);
            if (match) {
              sourceCity = match[1];
              message = message.replace(/^\[ROUTE_PLANNER:[^\]]+\]/, ''); // Prefix'i kaldır
            }
          }

          return {
            id: offer.id?.toString() || '',
            shipmentId: offer.shipmentId ? String(offer.shipmentId) : (offer.shipment_id ? String(offer.shipment_id) : undefined),
            shipmentTitle: offer.shipmentTitle || offer.title || '',
            carrierName: offer.carrierName || offer.fullName || 'Nakliyeci',
            carrierCompany: offer.carrierCompany || offer.companyName || undefined,
            carrierId: offer.carrierId != null ? String(offer.carrierId) : undefined,
            carrierRating: Number(offer.carrierRating || 0) || 0,
            carrierVerified: offer.carrierVerified || false,
            carrierReviews: Number(offer.carrierReviews || 0) || 0,
            carrierExperience: String(offer.carrierExperience || '').trim(),
            completedJobs: Number(offer.completedJobs || 0) || 0,
            successRate: Number(offer.successRate || 0) || 0,
            price: typeof offer.price === 'string' ? parseFloat(offer.price) || 0 : (offer.price || 0),
            estimatedDelivery: offer.estimatedDeliveryDate || offer.estimatedDelivery || '',
            message: message,
            isFromRoutePlanner: isFromRoutePlanner,
            sourceCity: sourceCity,
            status: normalizeOfferStatus(offer.status),
            createdAt: offer.createdAt || offer.created_at || new Date().toISOString(),
            pickupAddress: offer.pickupAddress || 
              (offer.pickupAddressLine ? 
                `${offer.pickupAddressLine}${offer.pickupStreet ? `, ${offer.pickupStreet}` : ''}${offer.pickupBuildingNumber ? ` No:${offer.pickupBuildingNumber}` : ''}${offer.pickupDistrict ? `, ${offer.pickupDistrict}` : ''}${offer.pickupCity ? `, ${offer.pickupCity}` : ''}`.trim() :
                `${offer.pickupCity || ''} ${offer.pickupDistrict || ''}`.trim()) || '',
            deliveryAddress: offer.deliveryAddress || 
              (offer.deliveryAddressLine ? 
                `${offer.deliveryAddressLine}${offer.deliveryStreet ? `, ${offer.deliveryStreet}` : ''}${offer.deliveryBuildingNumber ? ` No:${offer.deliveryBuildingNumber}` : ''}${offer.deliveryDistrict ? `, ${offer.deliveryDistrict}` : ''}${offer.deliveryCity ? `, ${offer.deliveryCity}` : ''}`.trim() :
                `${offer.deliveryCity || ''} ${offer.deliveryDistrict || ''}`.trim()) || '',
            weight: offer.weight?.toString() || '',
            dimensions: offer.dimensions || '',
            specialFeatures: offer.specialFeatures || [],
            tracking: offer.tracking || false,
            priority: (offer.priority || 'medium') as 'low' | 'medium' | 'high',
            trackingCode: normalizeTrackingCode(offer.trackingCode || offer.tracking_code, offer.shipmentId || offer.shipment_id),
            carrierLogo: offer.carrierLogo || '',
            recentComments: Array.isArray(offer.recentComments) ? offer.recentComments : [],
            responseTime: String(offer.responseTime || '').trim(),
          };
        });
      
      // Only pending offers are shown - accepted/rejected are handled elsewhere
      setOffers(mappedOffers);
      
      setStats({
        totalOffers,
        pendingOffers: pendingOffersCount,
        acceptedOffers: acceptedOffersCount,
        rejectedOffers: rejectedOffersCount,
        averagePrice,
        topCarrier: '',
        responseTime: 0,
      });
    } catch (error: any) {
      // Error loading offers - show error with retry option
      setOffers([]);
      setStats({
        totalOffers: 0,
        pendingOffers: 0,
        acceptedOffers: 0,
        rejectedOffers: 0,
        averagePrice: 0,
        topCarrier: '',
        responseTime: 0,
      });
      
      // Determine error message based on error type
      let errorMsg = 'Teklifler şu anda yüklenemiyor. Lütfen birkaç dakika sonra tekrar deneyin.';
      
      if (error?.name === 'AbortError' || error?.message?.includes('timeout') || error?.message?.includes('Timeout')) {
        errorMsg = 'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.';
      } else if (error?.message?.includes('fetch') || error?.message?.includes('Failed to fetch')) {
        errorMsg = 'İnternet bağlantınızı kontrol edin. Bağlantı sorunu giderildikten sonra tekrar deneyin.';
      } else if (error?.response?.status === 500 || error?.status === 500) {
        errorMsg = 'Teklifler şu anda yüklenemiyor. Lütfen birkaç dakika sonra tekrar deneyin.';
      }
      
      setErrorMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOffers();
    
    // Auto-refresh offers every 30 seconds when page is visible
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible' && !isLoading) {
        loadOffers();
      }
    }, 30000);
    
    // Listen for real-time updates via custom events
    const handleRefresh = () => {
      if (!isLoading) {
        loadOffers();
      }
    };
    
    window.addEventListener('yolnext:refresh-badges', handleRefresh);
    window.addEventListener('focus', handleRefresh);
    
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('yolnext:refresh-badges', handleRefresh);
      window.removeEventListener('focus', handleRefresh);
    };
  }, [loadOffers, isLoading]);

  // Only show pending offers - accepted/rejected should not appear
  const filteredOffers = offers.filter((offer: Offer) => {
    // All offers here are already pending (filtered in loadOffers)
    // But we still respect the filterStatus for UI consistency
    const matchesStatus =
      filterStatus === 'all' || filterStatus === 'pending' || offer.status === filterStatus;
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
    if (sortBy === 'delivery') {
      const aTime = new Date(a.estimatedDelivery || '').getTime();
      const bTime = new Date(b.estimatedDelivery || '').getTime();
      if (Number.isFinite(aTime) && Number.isFinite(bTime)) return aTime - bTime;
      return String(a.estimatedDelivery || '').localeCompare(String(b.estimatedDelivery || ''), 'tr');
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

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

  const [showAcceptConfirmModal, setShowAcceptConfirmModal] = useState(false);
  const [offerToAccept, setOfferToAccept] = useState<string | null>(null);

  const handleAcceptOffer = async (offerId: string) => {
    // Nakliyeci-style streamlined acceptance - direct action without modal barriers
    setOfferToAccept(offerId);
    await confirmAcceptOffer(offerId);
  };

  const confirmAcceptOffer = async (offerId?: string) => {
    const targetOfferId = offerId || offerToAccept;
    if (!targetOfferId) return;
    
    setIsLoading(true);
    setShowAcceptConfirmModal(false);
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
      setErrorMessage('Teklif kabul işlemi zaman aşımına uğradı. Lütfen tekrar deneyin.');
    }, 10000); // 10 seconds timeout
    
    try {
      const localOffer = offers.find((o: Offer) => String(o.id) === String(targetOfferId)) || null;
      const response = await fetch(createApiUrl(`/api/offers/${targetOfferId}/accept`), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        clearTimeout(timeoutId);
        throw new Error(payload?.message || 'Teklif kabul edilemedi');
      }
      
      clearTimeout(timeoutId);

      const carrierId = payload?.data?.carrierId
        ? String(payload.data.carrierId)
        : (localOffer?.carrierId ? String(localOffer.carrierId) : null);
      const shipmentId = payload?.data?.shipmentId
        ? String(payload.data.shipmentId)
        : (localOffer?.shipmentId ? String(localOffer.shipmentId) : null);
      const prefill = `Merhaba, ödeme detaylarını netleştirelim. İş No: #${shipmentId || ''}`.trim();

      // Professional but warm success feedback with payment guarantee info
      setSuccessMessage('Teklif başarıyla kabul edildi. Ödeme güvence altına alındı. Gönderileriniz sayfasına yönlendiriliyorsunuz...');
      setShowSuccessMessage(true);
      
      // Remove accepted offer from list immediately (goes to MyShipments)
      setOffers((prev: Offer[]) =>
        prev.filter((offer: Offer) => offer.id !== targetOfferId)
      );
      setStats((prev: typeof stats) => ({
        ...prev,
        pendingOffers: Math.max(0, prev.pendingOffers - 1),
        acceptedOffers: prev.acceptedOffers + 1,
      }));

      // Standardized transition - 2 seconds for user to read success message
      setTimeout(() => {
        setShowSuccessMessage(false);
        navigate('/individual/my-shipments', {
          state: {
            refresh: true,
            acceptedOffer: {
              carrierId,
              carrierName: localOffer?.carrierName || payload?.data?.carrierName || 'Nakliyeci',
              shipmentId,
              prefill,
            },
          },
        });
      }, 2000);
    } catch (error) {
      // Error accepting offer - show error with retry option
      clearTimeout(timeoutId);
      setErrorMessage('Teklif kabul edilirken bir hata oluştu. Lütfen tekrar deneyin.');
      setIsLoading(false);
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
      setOfferToAccept(null);
    }
  };

  const handleRejectOffer = async (offerId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(createApiUrl(`/api/offers/${offerId}/reject`), {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Teklif reddedilemedi');
      }

      setSuccessMessage('Teklif başarıyla reddedildi. İlgili taraf bilgilendirilmiştir.');
      setShowSuccessMessage(true);
      // Remove rejected offer from list immediately (it should disappear)
      setOffers((prev: Offer[]) =>
        prev.filter((offer: Offer) => offer.id !== offerId)
      );
      setStats((prev: typeof stats) => ({
        ...prev,
        pendingOffers: Math.max(0, prev.pendingOffers - 1),
        rejectedOffers: prev.rejectedOffers + 1,
      }));
      // Reload offers to ensure sync with backend (will only show pending)
      await loadOffers();
      setTimeout(() => setShowSuccessMessage(false), 2000);
      
      // Reset reject reason
      setRejectReason('');
      setRejectCustomReason('');
    } catch (error) {
      // Error rejecting offer - show error with retry option
      setErrorMessage('Teklif reddedilirken bir hata oluştu. Lütfen tekrar deneyin.');
      setIsLoading(false);
    } finally {
      setIsLoading(false);
      setOfferToReject(null);
      setShowRejectModal(false);
    }
  };

  const handleViewDetails = (offerId: string) => {
    const offer = offers.find((o: Offer) => o.id === offerId);
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

  const handleViewCarrierReviews = (offer: Offer) => {
    if (!offer?.carrierId) return;
    setSelectedCarrierForReviews({
      id: String(offer.carrierId),
      name: offer.carrierName || 'Nakliyeci',
      email: '',
      type: 'nakliyeci',
    });
    setShowReviewsModal(true);
  };

  if (isLoading && offers.length === 0) {
    return (
      <div className='min-h-screen bg-white flex items-center justify-center'>
        <LoadingState message='Teklifler yükleniyor...' size='lg' />
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-white'>
      <SuccessMessage
        isVisible={showSuccessMessage}
        message={successMessage}
        duration={2000}
        onClose={() => setShowSuccessMessage(false)}
      />
      
      {/* Global Error Message with Retry */}
      {errorMessage && offers.length === 0 && !isLoading && (
        <div className='max-w-5xl mx-auto px-4 py-6'>
          <ErrorDisplay
            title='Teklifler Yüklenemedi'
            message={errorMessage}
            onRetry={() => {
              setErrorMessage('');
              loadOffers();
            }}
            showSupport={true}
          />
        </div>
      )}
      <Helmet>
        <title>Tekliflerim - YolNext Bireysel</title>
        <meta
          name='description'
          content='Gönderileriniz için gelen teklifleri yönetin'
        />
      </Helmet>

      <div className='max-w-5xl mx-auto px-4 py-6'>
        {/* Header - Match MyShipments Design */}
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
            Gönderileriniz için gelen teklifleri karşılaştırın ve en uygun
            olanını seçin
          </p>
        </div>

        <div className='mb-6'>
          <GuidanceOverlay
            storageKey='individual.offers'
            isEmpty={!isLoading && offers.length === 0}
            icon={FileText}
            title='Teklif Yönetimi'
            description='Gelen teklifleri inceleyin, nakliyeci profillerini değerlendirin ve en uygun teklifi seçin. Teklif kabul edildikten sonra taşıma süreci başlar ve ödeme güvence altına alınır.'
            primaryAction={{
              label: 'Gönderi Oluştur',
              to: '/individual/create-shipment',
            }}
            secondaryAction={{
              label: 'Gönderilerim',
              to: '/individual/my-shipments',
            }}
          />
        </div>

        {/* Stats Cards */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
          <div className='bg-white rounded-2xl p-6 shadow-xl border border-slate-200'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-slate-600'>
                  Toplam Teklif
                </p>
                <p className='text-2xl font-bold text-slate-900'>
                  {stats.totalOffers}
                </p>
              </div>
              <div className='w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl flex items-center justify-center'>
                <FileText className='w-6 h-6 text-white' />
              </div>
            </div>
          </div>

          <div className='bg-white rounded-2xl p-6 shadow-xl border border-slate-200'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-slate-600'>Bekleyen</p>
                <p className='text-2xl font-bold text-slate-900'>
                  {stats.pendingOffers}
                </p>
              </div>
              <div className='w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center'>
                <Clock className='w-6 h-6 text-white' />
              </div>
            </div>
          </div>

          <div className='bg-white rounded-2xl p-6 shadow-xl border border-slate-200'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-slate-600'>
                  Kabul Edilen
                </p>
                <p className='text-2xl font-bold text-slate-900'>
                  {stats.acceptedOffers}
                </p>
              </div>
              <div className='w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center'>
                <CheckCircle className='w-6 h-6 text-white' />
              </div>
            </div>
          </div>

          <div className='bg-white rounded-2xl p-6 shadow-xl border border-slate-200'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-slate-600'>
                  Ortalama Fiyat
                </p>
                <p className='text-2xl font-bold text-slate-900'>
                  ₺{isNaN(stats.averagePrice) ? '0' : stats.averagePrice.toFixed(0)}
                </p>
              </div>
              <div className='w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl flex items-center justify-center'>
                <DollarSign className='w-6 h-6 text-white' />
              </div>
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className='w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                aria-label='Teklif ara'
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterStatus(e.target.value)}
              className='px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              aria-label='Durum filtresi'
            >
              <option value='all'>Tüm Durumlar</option>
              <option value='pending'>Bekleyen</option>
            </select>

            <select
              value={sortBy}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value)}
              className='px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              aria-label='Sıralama seçeneği'
            >
              <option value='date'>Tarihe Göre</option>
              <option value='price'>Fiyata Göre</option>
              <option value='rating'>Puana Göre</option>
              <option value='delivery'>Teslimat Süresine Göre</option>
            </select>

            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
                setSortBy('date');
              }}
              className='px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2'
            >
              <X className='w-4 h-4' />
              Sıfırla
            </button>
          </div>
        </div>

        {/* Offers Cards */}
        <div className='space-y-4'>
          {sortedOffers.length > 0 ? (
            sortedOffers.map(offer => (
              <div
                key={offer.id}
                className={`bg-white rounded-xl shadow-lg border hover:shadow-xl transition-all duration-300 group relative ${
                  offer.isFromRoutePlanner 
                    ? 'border-l-4 border-l-amber-500 border-t border-r border-b border-slate-200' 
                    : 'border border-slate-200'
                }`}
              >
                {/* Dışarıdan gelen teklif için özel işaret */}
                {offer.isFromRoutePlanner && (
                  <div className='absolute top-4 right-4 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 z-10'>
                    <Sparkles className='w-4 h-4 text-amber-600' />
                    <span className='text-xs font-semibold text-amber-800'>Dışarıdan Gelen</span>
                  </div>
                )}
                <div className='p-6'>
                  {/* Dışarıdan gelen teklif için dipnot */}
                  {offer.isFromRoutePlanner && offer.sourceCity && (
                    <div className='mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg'>
                      <p className='text-sm text-amber-800'>
                        <span className='font-semibold'>Bilgi:</span> Bu araç <span className='font-bold'>{offer.sourceCity}</span>'dan geliyor.
                      </p>
                    </div>
                  )}
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
                        Teslimat: {formatDeliveryDate(offer.estimatedDelivery)}
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
                          {offer.weight ? `${offer.weight} kg` : ''}{offer.weight && offer.dimensions ? ' • ' : ''}{offer.dimensions ? `${offer.dimensions} m³` : ''}
                          {!offer.weight && !offer.dimensions && '—'}
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
                  <div className='mb-4'>
                    <CarrierInfoCard
                      carrierId={offer.carrierId}
                      carrierName={offer.carrierName}
                      companyName={offer.carrierCompany}
                      carrierRating={offer.carrierRating}
                      carrierReviews={offer.carrierReviews}
                      carrierVerified={offer.carrierVerified}
                      successRate={offer.successRate}
                      completedJobs={offer.completedJobs}
                      variant="compact"
                      showMessaging={false}
                      className="mb-3"
                    />
                    <div className='flex items-center gap-2'>
                      {offer.carrierId && offer.carrierReviews > 0 && (
                        <button
                          onClick={() => handleViewCarrierReviews(offer)}
                          className='px-3 py-1.5 bg-yellow-50 hover:bg-yellow-100 text-yellow-800 text-xs rounded-lg border border-yellow-200 transition-colors'
                        >
                          Yorumları Gör
                        </button>
                      )}
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
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className='bg-white rounded-2xl p-8 shadow-xl border border-slate-200'>
              <div className='text-center'>
                <div className='w-16 h-16 bg-gradient-to-br from-slate-700 to-blue-800 rounded-full mx-auto mb-4 flex items-center justify-center'>
                  <FileText className='w-8 h-8 text-white' />
                </div>
                <h3 className='text-xl font-bold text-slate-900 mb-2'>
                  Henüz Teklif Yok
                </h3>
                <p className='text-slate-600 mb-4'>
                  Gönderi oluşturduktan sonra nakliyecilerden teklifler gelmeye başlayacak. Ortalama bekleme süresi 5-15 dakikadır.
                </p>
                {stats.pendingOffers === 0 && offers.length === 0 && (
                  <>
                    <p className='text-sm text-slate-500 mb-2'>
                      Teklifler geldiğinde burada görünecek ve bildirim alacaksınız.
                    </p>
                    <p className='text-sm text-slate-600 mb-6'>
                      <span className='font-semibold'>Teklif gelmezse ne yapmalıyım?</span> 24 saat içinde teklif gelmezse otomatik bildirim alırsınız. 
                      Gönderi bilgilerinizi kontrol edip güncelleyebilir veya fiyat teklifinizi gözden geçirebilirsiniz.
                    </p>
                  </>
                )}
                <Link
                  to='/individual/create-shipment'
                  className='inline-flex items-center gap-2 bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl'
                >
                  <Plus className='w-5 h-5' />
                  Gönderi Oluştur
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className='mt-8 text-center'>
          <Link
            to='/individual/create-shipment'
            className='inline-flex items-center gap-2 bg-gradient-to-r from-slate-800 to-blue-900 text-white px-6 py-3 rounded-xl font-semibold hover:from-slate-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl'
          >
            <Plus className='w-5 h-5' />
            Yeni Gönderi Oluştur
          </Link>
        </div>
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
              <CarrierInfoCard
                carrierId={selectedOffer.carrierId}
                carrierName={selectedOffer.carrierName}
                companyName={selectedOffer.carrierCompany}
                carrierRating={selectedOffer.carrierRating}
                carrierReviews={selectedOffer.carrierReviews}
                carrierVerified={selectedOffer.carrierVerified}
                successRate={selectedOffer.successRate}
                completedJobs={selectedOffer.completedJobs}
                variant="detailed"
                showMessaging={false}
                className="mb-8"
              />

              {/* Reviews Section */}
              <div className='mb-8'>
                <h5 className='text-xl font-bold text-slate-900 mb-6 flex items-center gap-2'>
                  <Star className='w-6 h-6 text-yellow-500' />
                  Müşteri Değerlendirmeleri
                </h5>
                <div className='bg-white border border-slate-200 rounded-xl p-6 shadow-sm'>
                  <div className='flex items-center justify-between gap-4'>
                    <div className='text-sm text-slate-600'>
                      {selectedOffer.carrierReviews > 0
                        ? `${selectedOffer.carrierReviews} değerlendirme` 
                        : 'Değerlendirme bekleniyor'}
                    </div>
                    <button
                      onClick={() => {
                        if (!selectedOffer.carrierId) return;
                        setShowDetailModal(false);
                        handleViewCarrierReviews(selectedOffer);
                      }}
                      disabled={!selectedOffer.carrierId}
                      className='px-4 py-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-800 text-sm rounded-lg border border-yellow-200 transition-colors disabled:opacity-60 disabled:cursor-not-allowed'
                    >
                      Değerlendirmeleri Gör
                    </button>
                  </div>
                </div>
              </div>

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

      {/* Reject Confirmation Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setRejectReason('');
          setRejectCustomReason('');
        }}
        title='Teklifi Reddet'
      >
        <div className='p-6 space-y-4'>
          <p className='text-slate-600 mb-4'>
            Bu teklifi reddetmek istediğinizden emin misiniz? Lütfen reddetme sebebinizi seçin.
          </p>
          
          {/* Reddetme Sebepleri */}
          <div className='space-y-2'>
            <label className='block text-sm font-medium text-slate-700 mb-2'>
              Reddetme Sebebi <span className='text-red-500'>*</span>
            </label>
            <select
              value={rejectReason}
              onChange={(e) => {
                setRejectReason(e.target.value);
                if (e.target.value !== 'other') {
                  setRejectCustomReason('');
                }
              }}
              className='w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500'
            >
              <option value=''>Sebep seçin...</option>
              <option value='price_not_suitable'>Fiyat uygun değil</option>
              <option value='time_not_suitable'>Zaman uygun değil</option>
              <option value='no_external_vehicle'>Dışarıdan araç kabul etmiyorum</option>
              <option value='found_better_offer'>Daha iyi bir teklif buldum</option>
              <option value='shipment_cancelled'>Gönderiyi iptal ettim</option>
              <option value='other'>Diğer</option>
            </select>
          </div>

          {/* Özel Sebep (Diğer seçilirse) */}
          {rejectReason === 'other' && (
            <div>
              <label className='block text-sm font-medium text-slate-700 mb-2'>
                Açıklama <span className='text-red-500'>*</span>
              </label>
              <textarea
                value={rejectCustomReason}
                onChange={(e) => setRejectCustomReason(e.target.value)}
                placeholder='Lütfen reddetme sebebinizi açıklayın...'
                className='w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500'
                rows={3}
              />
            </div>
          )}

          {/* Özel Bilgilendirme - Dışarıdan araç seçilirse */}
          {rejectReason === 'no_external_vehicle' && (
            <div className='bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800'>
              <p className='font-semibold mb-1'>Bilgi:</p>
              <p>Bu seçenek, rota planlayıcı üzerinden eklenen gönderiler için özellikle önemlidir. Nakliyeci bilgilendirilecek ve bu tercihiniz kaydedilecektir.</p>
            </div>
          )}

          {errorMessage && (
            <div className='bg-red-50 border border-red-200 rounded-lg p-4' role='alert' aria-live='polite'>
              <div className='flex items-start justify-between'>
                <div className='flex-1'>
                  <p className='text-sm font-medium text-red-800 mb-2'>{errorMessage}</p>
                  <p className='text-xs text-red-600'>Sorun devam ederse gönderi bilgilerinizi kontrol edip tekrar deneyin.</p>
                </div>
                <button
                  onClick={() => {
                    setErrorMessage('');
                    if (offerToReject) {
                      handleRejectOffer(offerToReject);
                    }
                  }}
                  aria-label='Hata mesajını kapat'
                  className='ml-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors'
                >
                  Tekrar Dene
                </button>
              </div>
            </div>
          )}

          <div className='flex justify-end gap-3 pt-4'>
            <button
              onClick={() => {
                setShowRejectModal(false);
                setRejectReason('');
                setRejectCustomReason('');
                setErrorMessage('');
              }}
              className='px-4 py-2 bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg'
            >
              İptal
            </button>
            <button
              onClick={() => {
                if (offerToReject) {
                  handleRejectOffer(offerToReject);
                }
              }}
              disabled={!rejectReason || (rejectReason === 'other' && !rejectCustomReason.trim())}
              className='px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed'
            >
              Reddet
            </button>
          </div>
        </div>
      </Modal>

      {/* Contact Carrier Modal */}
      <Modal
        isOpen={showContactModal}
        onClose={() => {
          setShowContactModal(false);
        }}
        title='Nakliyeci ile İletişim'
        size='md'
      >
        <div className='p-6 space-y-4'>
          <p className='text-slate-600 mb-4'>
            Nakliyeci ile iletişim kurmak için bir yöntem seçin:
          </p>
          <div className='space-y-3'>
            <button
              onClick={() => {
                if (!isMessagingEnabledForOffer(selectedOffer?.status)) return;
                setShowContactModal(false);
                navigate('/individual/messages');
              }}
              disabled={!isMessagingEnabledForOffer(selectedOffer?.status)}
              title={!isMessagingEnabledForOffer(selectedOffer?.status) ? 'Mesajlaşma teklif kabul edilince açılır' : 'Nakliyeci ile mesajlaş'}
              className='w-full flex items-center gap-3 p-4 bg-gradient-to-r from-slate-50 to-blue-50 hover:from-slate-100 hover:to-blue-100 border border-slate-200 rounded-xl transition-all duration-300 group'
            >
              <div className='w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform'>
                <MessageCircle className='w-6 h-6 text-white' />
              </div>
              <div className='flex-1 text-left'>
                <div className='font-semibold text-slate-900'>Mesajlar</div>
                <div className='text-sm text-slate-600'>Platform üzerinden iletişim kurun</div>
              </div>
              <ArrowRight className='w-5 h-5 text-slate-600 group-hover:translate-x-1 transition-transform' />
            </button>
          </div>
          <div className='pt-4 border-t border-slate-200'>
            <button
              onClick={() => {
                setShowContactModal(false);
              }}
              className='w-full px-4 py-2 bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg font-medium'
            >
              İptal
            </button>
          </div>
        </div>
      </Modal>

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
                if (paymentShipmentId) params.set('shipmentId', String(paymentShipmentId));
                if (paymentPrefill) params.set('prefill', paymentPrefill);
                navigate(`/individual/messages?${params.toString()}`);
              }}
            >
              Mesaj Gönder
            </button>
          </div>
        </div>
      </Modal>

      {/* Reviews Modal */}
      {showReviewsModal && selectedCarrierForReviews && user && (
        <RatingModal
          isOpen={showReviewsModal}
          onClose={() => {
            setShowReviewsModal(false);
            setSelectedCarrierForReviews(null);
          }}
          mode='view'
          ratedUser={selectedCarrierForReviews}
          currentUser={{
            id: user.id || '',
            name: user.fullName || 'Kullanıcı',
          }}
        />
      )}
    </div>
  );
}











