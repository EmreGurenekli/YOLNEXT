import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../contexts/AuthContext';
import { dashboardAPI, notificationAPI } from '../../services/apiClient';
import {
  Package,
  CheckCircle2,
  Clock,
  XCircle,
  Plus,
  Bell,
  MessageSquare,
  TrendingUp,
  Truck,
  ArrowRight,
  Users,
} from 'lucide-react';
import LoadingState from '../../components/shared-ui-elements/LoadingState';
import GuidanceOverlay from '../../components/shared-ui-elements/GuidanceOverlay';
import SimpleOnboarding from '../../components/onboarding/SimpleOnboarding';
import { formatCurrency, formatDate, sanitizeShipmentTitle } from '../../utils/format';
import { createApiUrl } from '../../config/api';
import { resolveShipmentRoute } from '../../utils/shipmentRoute';
import NotificationCenter from '../../components/NotificationCenter';
import CarrierInfoCard from '../../components/CarrierInfoCard';
import { normalizeTrackingCode } from '../../utils/trackingCode';
import { getStatusInfo } from '../../utils/shipmentStatus';

interface Shipment {
  id: string;
  trackingCode: string;
  createdAt: string;
  title: string;
  from: string;
  to: string;
  category: string;
  subCategory: string;
  status: string;
  carrierName: string;
  rating: number;
  carrierId?: string | number;
  carrierEmail?: string;
  carrierCompany?: string;
  carrierRating?: number;
  carrierReviews?: number;
  carrierVerified?: boolean;
  completedJobs?: number;
  successRate?: number;
  price: number;
  weight: number;
  volume: number;
  estimatedDelivery: string;
}


// Kategori çeviri mapping
const categoryLabels: Record<string, string> = {
  house_move: 'Ev Taşınması',
  furniture: 'Mobilya Taşıma',
  special: 'Özel Yük',
  other: 'Diğer',
  general: 'Genel Gönderi',
  // Alt kategoriler
  'Ev Taşınması': 'Ev Taşınması',
  'Mobilya Taşıma': 'Mobilya Taşıma',
  'Özel Yük': 'Özel Yük',
  'Diğer': 'Diğer',
};

const getCategoryLabel = (category: string | undefined | null): string => {
  if (!category) return '-';
  return categoryLabels[category] || category;
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const toNumber = (value: any, fallback = 0) => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
    if (typeof value === 'string') {
      const n = parseFloat(value.replace(/[^0-9.,-]/g, '').replace(',', '.'));
      return Number.isFinite(n) ? n : fallback;
    }
    return fallback;
  };

  const safeFormatDate = (value: any, mode: 'short' | 'long' | 'time' = 'short') => {
    if (!value) return '';
    const d = value instanceof Date ? value : new Date(value);
    if (!Number.isFinite(d.getTime())) return '';
    return formatDate(d, mode);
  };

  const [stats, setStats] = useState({
    totalShipments: 0,
    activeShipments: 0,
    deliveredShipments: 0,
    pendingShipments: 0,
    cancelledShipments: 0,
    successRate: 0,
    totalSpent: 0,
    thisMonthSpent: 0,
    favoriteCarriers: 0,
  });
  const [recentShipments, setRecentShipments] = useState<Shipment[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // İlk giriş kontrolü - onboarding göster
    const hasSeenOnboarding = localStorage.getItem('onboardingCompleted');
    if (!hasSeenOnboarding && user?.id) {
      setShowOnboarding(true);
    }
  }, [user?.id]);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      
      
      // Timeout protection - maksimum 10 saniye bekle
      const timeoutId = setTimeout(() => {
        setIsLoading(false);
      }, 10000);
      
      try {
        // Load stats from real API
        try {
          const statsResponse = await dashboardAPI.getStats('individual');
          if (statsResponse?.success && statsResponse?.data) {
            const statsData = (statsResponse.data.stats || statsResponse.data) as any;
            setStats({
              totalShipments: toNumber(statsData.totalShipments, 0),
              activeShipments: toNumber(statsData.activeShipments, 0),
              deliveredShipments: toNumber(statsData.completedShipments ?? statsData.deliveredShipments, 0),
              pendingShipments: toNumber(statsData.pendingShipments, 0),
              cancelledShipments: toNumber(statsData.cancelledShipments ?? statsData.canceledShipments, 0),
              successRate: toNumber(statsData.successRate, 0),
              totalSpent: toNumber(statsData.totalSpent, 0),
              thisMonthSpent: 0,
              favoriteCarriers: 0,
            });
          }
        } catch (e) {
          // keep previous stats on partial failure
        }

        // Load recent shipments using same endpoint as MyShipments for consistency
        try {
          const token = localStorage.getItem('authToken') || localStorage.getItem('token');
          if (!token) {
            setRecentShipments([]);
          } else {
            const params = new URLSearchParams({
              page: '1',
              limit: '5',
              userId: String(user.id),
            });
            const response = await fetch(createApiUrl(`/api/shipments?${params.toString()}`), {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });
            const data = await response.json();
            if (response.ok && data?.success) {
              const shipments =
                data.data?.shipments ||
                data.shipments ||
                (Array.isArray(data.data) ? data.data : []) ||
                [];

              const formattedShipments = (Array.isArray(shipments) ? shipments : []).map((shipment: any) => {
              const { from, to } = resolveShipmentRoute(shipment);
              const rawStatus = String(shipment?.status || '').trim().toLowerCase();
              const normalizedStatus =
                rawStatus === 'open' || rawStatus === 'waiting_for_offers'
                  ? 'waiting'
                  : rawStatus === 'offer_accepted' || rawStatus === 'accepted'
                    ? 'offer_accepted'
                    : rawStatus === 'in_transit' || rawStatus === 'in_progress'
                      ? 'in_transit'
                      : rawStatus === 'delivered' || rawStatus === 'completed'
                        ? 'delivered'
                        : rawStatus === 'cancelled' || rawStatus === 'canceled'
                          ? 'cancelled'
                          : rawStatus === 'preparing'
                            ? 'preparing'
                            : rawStatus || 'waiting';

              const priceNumber = toNumber(
                shipment?.displayPrice ?? shipment?.price ?? shipment?.offerPrice ?? shipment?.value,
                0
              );
              const volumeNumber = toNumber(shipment?.volume ?? shipment?.volume_m3 ?? shipment?.volumeM3, 0);
              const createdAt = shipment?.createdAt || shipment?.created_at || shipment?.createdAt;
              const estimatedDelivery =
                shipment?.estimatedDelivery ||
                shipment?.estimated_delivery ||
                shipment?.deliveryDate ||
                shipment?.delivery_date;

              return {
                ...shipment,
                id: shipment?.id?.toString?.() || String(shipment?.id || ''),
                title: sanitizeShipmentTitle(shipment?.title || shipment?.productDescription || shipment?.description || 'Gönderi'),
                status: normalizedStatus,
                price: priceNumber,
                volume: volumeNumber,
                createdAt,
                estimatedDelivery,
                trackingCode: normalizeTrackingCode(
                  shipment?.trackingCode ||
                  shipment?.trackingNumber ||
                  shipment?.tracking_number,
                  shipment?.id
                ),
                from,
                to,
                carrierName:
                  shipment?.carrierName ||
                  shipment?.carrier_name ||
                  shipment?.nakliyeciName ||
                  shipment?.nakliyeci_name ||
                  shipment?.assignedCarrierName ||
                  undefined,
                carrierEmail: shipment?.carrierEmail || shipment?.carrier_email || undefined,
                carrierCompany: shipment?.carrierCompany || shipment?.carrier_company || undefined,
                carrierId: shipment?.carrierId || shipment?.carrier_id || shipment?.nakliyeciId || shipment?.nakliyeci_id || undefined,
                carrierRating: shipment?.carrierRating || 0,
                carrierReviews: shipment?.carrierReviews || 0,
                carrierVerified: shipment?.carrierVerified || false,
                completedJobs: shipment?.completedJobs || 0,
                successRate: shipment?.successRate || 0,
                rating: toNumber(shipment?.rating, 0),
              };
            });

              const sorted = formattedShipments
                .slice()
                .sort((a, b) => {
                  const ta = new Date(a.createdAt || (a as any).updatedAt || 0).getTime();
                  const tb = new Date(b.createdAt || (b as any).updatedAt || 0).getTime();
                  return tb - ta;
                })
                .slice(0, 5);
              setRecentShipments(sorted);
            }
          }
        } catch (e) {
          // keep previous recent shipments on partial failure
        }

        // Load unread notifications count from real API
        try {
          const notificationsResponse = await notificationAPI.getUnreadCount();
          if (notificationsResponse?.success) {
            const d = (notificationsResponse as any).data || {};
            setUnreadCount(d.count || d.unreadCount || d.unread || 0);
          }
        } catch (e) {
          // keep previous unread count on partial failure
        }
      } catch (error) {
        // Global error handling - ensure loading state is cleared
        console.error('Dashboard data loading error:', error);
      } finally {
        clearTimeout(timeoutId);
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [user?.id]);

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <LoadingState
          message='Ana Sayfa yükleniyor...'
          size='lg'
          className='py-12'
        />
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-white'>
      <Helmet>
        <title>Ana Sayfa - YolNext Bireysel</title>
        <meta name='description' content='YolNext bireysel panel ana sayfası' />
      </Helmet>

      <div className='max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6'>
        {/* Hero Section */}
        <div className='relative overflow-hidden bg-gradient-to-br from-slate-800 via-blue-900 to-indigo-900 rounded-3xl p-6 text-white shadow-2xl mb-8'>
          <div className='absolute inset-0 bg-gradient-to-br from-white/5 to-transparent'></div>
          <div className='absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full -translate-y-40 translate-x-40'></div>
          <div className='absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-slate-400/10 to-blue-400/10 rounded-full translate-y-32 -translate-x-32'></div>

          <div className='relative z-10'>
            <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
              <div className='flex-1 min-w-0'>
                <div className='flex items-center gap-4 mb-4'>
                  <div className='w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-xl border border-white/20'>
                    <span className='text-white font-bold text-xl'>YN</span>
                  </div>
                  <div>
                    <h1 className='text-3xl font-bold mb-2 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent'>
                      Merhaba{' '}
                      {user?.firstName ||
                        user?.fullName?.split(' ')[0] ||
                        'Kullanıcı'}
                      ! 👋
                    </h1>
                    <p className='text-slate-200 text-lg leading-relaxed'>
                      Gönderilerinizi yönetin, takip edin, <span className='text-blue-300 font-semibold'>tasarruf edin!</span>
                      <br />
                      <span className='text-emerald-300 font-semibold'>
                        Her gönderide %30-50 daha ucuz
                      </span>{' '}
                      fiyatlarla yanınızdayız.
                    </p>
                  </div>
                </div>

                <div className='flex flex-wrap items-center gap-4'>
                  <div className='flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2 border border-white/20'>
                    <div className='w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-lg'></div>
                    <span className='text-slate-200 font-medium'>
                      Çevrimiçi
                    </span>
                  </div>
                  <div className='bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2 border border-white/20'>
                    <span className='text-slate-200 font-medium'>
                      {stats.totalShipments} Gönderi
                    </span>
                  </div>
                </div>
              </div>

              <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto'>
                <button
                  type='button'
                  onClick={() => setIsNotificationOpen(true)}
                  className='relative min-w-[44px] min-h-[44px] w-12 h-12 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center hover:bg-white/20 transition-all duration-300 border border-white/20'
                  aria-label='Bildirimleri aç'
                >
                  <Bell size={20} className='text-white' />
                  {unreadCount > 0 && (
                    <span className='absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg'>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                <Link to='/individual/create-shipment'>
                  <button
                    className='bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 text-base shadow-lg hover:shadow-xl w-full sm:w-auto'
                    aria-label='Yeni gönderi oluştur'
                  >
                    <Plus size={20} />
                    Gönderi Oluştur
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className='mb-6'>
          <GuidanceOverlay
            storageKey='individual.dashboard'
            icon={Package}
            title='Nasıl Başlayalım?'
            description='🚀 1) Gönderi oluştur 2) Dakikalar içinde teklifler gelecek 3) En uygununu seç - bu kadar basit!'
            primaryAction={{
              label: 'Gönderi Oluştur',
              to: '/individual/create-shipment',
            }}
            secondaryAction={{
              label: 'Tekliflere Git',
              to: '/individual/offers',
            }}
          />
        </div>

        {/* Stats Grid - ANA RENK: from-slate-800 to-blue-900 */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6'>
          <div
            className='bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-300 transition-all duration-300'
            role='region'
            aria-label='Toplam gönderi istatistiği'
          >
            <div className='flex items-center justify-between mb-4'>
              <div
                className='w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center'
                aria-hidden='true'
              >
                <Package className='w-6 h-6 text-white' />
              </div>
              <div className='text-right'>
                <div
                  className='text-2xl font-bold text-slate-900 mb-1'
                  aria-live='polite'
                >
                  {stats.totalShipments}
                </div>
                <div className='flex items-center gap-1'>
                  <svg
                    className='w-3 h-3 text-blue-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                    aria-hidden='true'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M7 17l9.2-9.2M17 17V7H7'
                    />
                  </svg>
                </div>
              </div>
            </div>
            <div className='text-slate-700 font-semibold text-sm'>
              Toplam Gönderi
            </div>
            <div className='mt-1 text-xs text-slate-500'>
              Şimdiye kadar yaptığın tüm gönderiler
            </div>
          </div>

          <div
            className='bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-300 transition-all duration-300'
            role='region'
            aria-label='Aktif gönderi istatistiği'
          >
            <div className='flex items-center justify-between mb-4'>
              <div
                className='w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center'
                aria-hidden='true'
              >
                <Truck className='w-6 h-6 text-white' />
              </div>
              <div className='text-right'>
                <div className='text-2xl font-bold text-slate-900 mb-1' aria-live='polite'>
                  {stats.activeShipments}
                </div>
              </div>
            </div>
            <div className='text-slate-700 font-semibold text-sm'>
              Aktif Gönderi
            </div>
            <div className='mt-1 text-xs text-slate-500'>
              Şu anda yoldaki gönderiler
            </div>
          </div>

          <div
            className='bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-300 transition-all duration-300'
            role='region'
            aria-label='Teslim edilen gönderi istatistiği'
          >
            <div className='flex items-center justify-between mb-4'>
              <div
                className='w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center'
                aria-hidden='true'
              >
                <CheckCircle2 className='w-6 h-6 text-white' />
              </div>
              <div className='text-right'>
                <div className='text-2xl font-bold text-slate-900 mb-1'>
                  {stats.deliveredShipments}
                </div>
                <div className='flex items-center gap-1'>
                </div>
              </div>
            </div>
            <div className='text-slate-700 font-semibold text-sm'>
              Teslim Edildi ✓
            </div>
            <div className='mt-1 text-xs text-slate-500'>
              Sorunsuz tamamlanan gönderiler
            </div>
          </div>

          <div
            className='bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-300 transition-all duration-300'
            role='region'
            aria-label='Bekleyen gönderi istatistiği'
          >
            <div className='flex items-center justify-between mb-4'>
              <div
                className='w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center'
                aria-hidden='true'
              >
                <Clock className='w-6 h-6 text-white' />
              </div>
              <div className='text-right'>
                <div className='text-2xl font-bold text-slate-900 mb-1'>
                  {stats.pendingShipments}
                </div>
                <div className='flex items-center gap-1'>
                </div>
              </div>
            </div>
            <div className='text-slate-700 font-semibold text-sm'>
              Beklemede
            </div>
            <div className='mt-1 text-xs text-slate-500'>
              Teklif bekleyen veya onay bekleyen
            </div>
          </div>

          <div
            className='bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-300 transition-all duration-300'
            role='region'
            aria-label='Başarı oranı istatistiği'
          >
            <div className='flex items-center justify-between mb-4'>
              <div
                className='w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center'
                aria-hidden='true'
              >
                <TrendingUp className='w-6 h-6 text-white' />
              </div>
              <div className='text-right'>
                <div className='text-2xl font-bold text-slate-900 mb-1'>
                  {stats.successRate}%
                </div>
                <div className='flex items-center gap-1'>
                </div>
              </div>
            </div>
            <div className='text-slate-700 font-semibold text-sm'>
              Başarı Oranı
            </div>
            <div className='mt-1 text-xs text-slate-500'>
              Sorunsuz teslimat oranın - yüksek = güven
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className='bg-white rounded-2xl p-8 shadow-xl border border-slate-200 mb-8'>
          <div className='flex items-center justify-between mb-8'>
            <div>
              <h2 className='text-2xl font-bold text-slate-900 mb-2'>
                Hızlı İşlemler
              </h2>
              <p className='text-slate-600'>
                En çok kullandığın özellikler - tek tıkla erişim
              </p>
            </div>
            <div className='w-14 h-14 bg-gradient-to-br from-slate-800 to-blue-900 rounded-2xl flex items-center justify-center shadow-lg'>
              <svg
                className='w-7 h-7 text-white'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M13 10V3L4 14h7v7l9-11h-7z'
                />
              </svg>
            </div>
          </div>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-6'>
            <Link to='/individual/create-shipment'>
              <div className='group bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl hover:border-blue-300 transition-all duration-300 hover:-translate-y-2'>
                <div className='flex flex-col items-center text-center'>
                  <div className='w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mb-4'>
                    <Plus className='w-6 h-6 text-white' />
                  </div>
                  <h3 className='text-lg font-bold text-slate-900 mb-2'>
                    Yeni Gönderi
                  </h3>
                  <p className='text-sm text-slate-600'>
                    3 adımda oluştur, dakikalar içinde teklif al
                  </p>
                  <div className='mt-3 w-8 h-1 bg-gradient-to-r from-slate-800 to-blue-900 rounded-full group-hover:w-12 transition-all duration-300'></div>
                </div>
              </div>
            </Link>

            <Link to='/individual/my-shipments'>
              <div className='group bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl hover:border-emerald-300 transition-all duration-300 hover:-translate-y-2'>
                <div className='flex flex-col items-center text-center'>
                  <div className='w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mb-4'>
                    <Package className='w-6 h-6 text-white' />
                  </div>
                  <h3 className='text-lg font-bold text-slate-900 mb-2'>
                    Gönderilerim
                  </h3>
                  <p className='text-sm text-slate-600'>
                    Tüm gönderilerini tek yerden yönet
                  </p>
                  <div className='mt-3 w-8 h-1 bg-gradient-to-r from-slate-800 to-blue-900 rounded-full group-hover:w-12 transition-all duration-300'></div>
                </div>
              </div>
            </Link>

            <Link to='/individual/live-tracking'>
              <div className='group bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl hover:border-purple-300 transition-all duration-300 hover:-translate-y-2'>
                <div className='flex flex-col items-center text-center'>
                  <div className='w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mb-4'>
                    <Truck className='w-6 h-6 text-white' />
                  </div>
                  <h3 className='text-lg font-bold text-slate-900 mb-2'>
                    Canlı Takip
                  </h3>
                  <p className='text-sm text-slate-600'>
                    Gönderinin nerede olduğunu anlık gör
                  </p>
                  <div className='mt-3 w-8 h-1 bg-purple-600 rounded-full group-hover:w-12 transition-all duration-300'></div>
                </div>
              </div>
            </Link>

            <Link to='/individual/messages'>
              <div className='group bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl hover:border-amber-300 transition-all duration-300 hover:-translate-y-2'>
                <div className='flex flex-col items-center text-center'>
                  <div className='w-12 h-12 bg-gradient-to-br from-amber-600 to-orange-700 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mb-4'>
                    <MessageSquare className='w-6 h-6 text-white' />
                  </div>
                  <h3 className='text-lg font-bold text-slate-900 mb-2'>
                    Mesajlar
                  </h3>
                  <p className='text-sm text-slate-600'>
                    Nakliyecinle direkt iletişim kur
                  </p>
                  <div className='mt-3 w-8 h-1 bg-amber-600 rounded-full group-hover:w-12 transition-all duration-300'></div>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Son Gönderiler - Tablo Tasarımı */}
        <div className='bg-white rounded-2xl p-8 shadow-xl border border-slate-200 mb-8'>
          <div className='flex items-center justify-between mb-6'>
            <div>
              <h2 className='text-2xl font-bold text-slate-900 mb-2'>
                📦 Son Gönderiler
              </h2>
              <p className='text-slate-600'>En son oluşturduğun gönderiler - hızlı erişim için buradan</p>
            </div>
            <Link
              to='/individual/my-shipments'
              className='text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2'
            >
              Tümünü Gör
              <ArrowRight className='w-4 h-4' />
            </Link>
          </div>

          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead>
                <tr className='border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50'>
                  <th className='text-left py-3 px-4 font-semibold text-slate-800'>
                    Gönderi No
                  </th>
                  <th className='text-left py-3 px-4 font-semibold text-slate-800'>
                    Rota
                  </th>
                  <th className='text-left py-3 px-4 font-semibold text-slate-800'>
                    Durum
                  </th>
                  <th className='text-left py-3 px-4 font-semibold text-slate-800'>
                    Nakliyeci
                  </th>
                  <th className='text-left py-3 px-4 font-semibold text-slate-800'>
                    Fiyat
                  </th>
                  <th className='text-left py-3 px-4 font-semibold text-slate-800'>
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentShipments.length > 0 ? (
                  recentShipments.map(shipment => (
                    <tr
                      key={shipment.id}
                      className='border-b border-slate-100 hover:bg-blue-50 transition-colors'
                    >
                      <td className='py-4 px-4'>
                        <div className='font-mono text-sm font-semibold text-slate-800'>
                          {shipment.trackingCode}
                        </div>
                        <div className='text-xs text-slate-500'>
                          {safeFormatDate((shipment as any).createdAt, 'short')}
                        </div>
                        <div className='text-xs text-slate-500'>
                          {shipment.title}
                        </div>
                      </td>
                      <td className='py-4 px-4'>
                        <div className='text-sm font-medium text-slate-900'>
                          {shipment.from} → {shipment.to}
                        </div>
                        <div className='text-xs text-slate-500'>
                          {getCategoryLabel(shipment.subCategory || shipment.category)}
                        </div>
                      </td>
                      <td className='py-4 px-4'>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            shipment.status === 'delivered'
                              ? 'bg-green-100 text-green-800'
                              : shipment.status === 'in_transit'
                                ? 'bg-blue-100 text-blue-800'
                                : shipment.status === 'cancelled'
                                  ? 'bg-red-100 text-red-800'
                                : shipment.status === 'preparing'
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {shipment.status === 'in_transit' ? (
                            <Truck className='w-3 h-3 mr-1' />
                          ) : shipment.status === 'cancelled' ? (
                            <XCircle className='w-3 h-3 mr-1' />
                          ) : shipment.status === 'preparing' ? (
                            <Package className='w-3 h-3 mr-1' />
                          ) : shipment.status === 'delivered' ? (
                            <CheckCircle2 className='w-3 h-3 mr-1' />
                          ) : shipment.status === 'offer_accepted' || shipment.status === 'accepted' ? (
                            <CheckCircle2 className='w-3 h-3 mr-1' />
                          ) : (
                            <Clock className='w-3 h-3 mr-1' />
                          )}
                          {getStatusInfo(shipment.status).text}
                        </span>
                      </td>
                      <td className='py-4 px-4'>
                        {shipment.carrierId && shipment.carrierName ? (
                          <CarrierInfoCard
                            carrierId={String(shipment.carrierId)}
                            carrierName={shipment.carrierName}
                            companyName={shipment.carrierCompany}
                            carrierRating={shipment.carrierRating || 0}
                            carrierReviews={shipment.carrierReviews || 0}
                            carrierVerified={shipment.carrierVerified || false}
                            successRate={shipment.successRate || 0}
                            completedJobs={shipment.completedJobs || 0}
                            variant="compact"
                            showMessaging={false}
                            className="max-w-xs"
                          />
                        ) : (
                          <div className='text-sm font-medium text-slate-500'>
                            {(shipment.status === 'offer_accepted' || shipment.status === 'accepted' || shipment.status === 'in_transit' || shipment.status === 'delivered')
                              ? 'Nakliyeci Atandı'
                              : 'Atanmamış'}
                          </div>
                        )}
                      </td>
                      <td className='py-4 px-4'>
                        <div className='text-sm font-bold text-blue-700'>
                          {toNumber((shipment as any).price, 0) > 0 
                            ? formatCurrency(toNumber((shipment as any).price, 0)) 
                            : (shipment.status === 'waiting_for_offers' || shipment.status === 'waiting' || shipment.status === 'pending' || shipment.status === 'open')
                              ? <span className='text-slate-400 font-normal'>Teklif Bekleniyor</span>
                              : '—'}
                        </div>
                        <div className='text-xs text-slate-500'>
                          {toNumber((shipment as any).volume, 0) > 0 ? `${toNumber((shipment as any).volume, 0).toFixed(2)} m³` : ''}
                        </div>
                        <div className='text-xs text-slate-500'>
                          {safeFormatDate((shipment as any).estimatedDelivery, 'short')}
                        </div>
                      </td>
                      <td className='py-4 px-4'>
                        <div className='flex items-center gap-2'>
                          <button
                            onClick={() => navigate(`/individual/shipments/${shipment.id}`)}
                            className='px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-medium rounded-lg transition-colors'
                          >
                            Detay
                          </button>
                          {shipment.status !== 'waiting' && shipment.status !== 'cancelled' && (
                            <button
                              onClick={() => navigate(`/individual/live-tracking?shipmentId=${encodeURIComponent(shipment.id)}`)}
                              className='px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-medium rounded-lg transition-colors'
                            >
                              Takip
                            </button>
                          )}
                          {(() => {
                              const carrierId =
                                (shipment as any).carrierId ||
                                (shipment as any).carrier_id ||
                                (shipment as any).nakliyeciId ||
                                (shipment as any).nakliyeci_id ||
                                (shipment as any).carrier?.id ||
                                (shipment as any).nakliyeci?.id ||
                                null;
                              const hasCarrier = carrierId !== null && carrierId !== undefined && String(carrierId) !== '';
                              const canMessage = hasCarrier && shipment.status !== 'cancelled';
                              return (
                                <button
                                  onClick={() => {
                                    if (!canMessage) return;
                                    navigate(
                                      `/individual/messages?userId=${encodeURIComponent(String(carrierId))}&shipmentId=${encodeURIComponent(String(shipment.id))}`
                                    );
                                  }}
                                  disabled={!canMessage}
                                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                    canMessage 
                                      ? 'bg-green-100 hover:bg-green-200 text-green-700' 
                                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  }`}
                                >
                                  Mesaj
                                </button>
                              );
                            })()}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className='py-12 text-center'>
                      <div className='bg-white rounded-2xl p-8 shadow-xl border border-slate-200'>
                        <div className='text-center'>
                          <div className='w-16 h-16 bg-gradient-to-br from-slate-700 to-blue-800 rounded-full mx-auto mb-4 flex items-center justify-center'>
                            <Package className='w-8 h-8 text-white' />
                          </div>
                          <h3 className='text-xl font-bold text-slate-900 mb-2'>
                            Henüz Gönderiniz Yok
                          </h3>
                          <p className='text-slate-600 mb-6'>
                            İlk gönderinizi oluşturun, dakikalar içinde nakliyecilerden teklifler gelmeye başlayacak. Ortalama bekleme süresi 5-15 dakikadır.
                          </p>
                          <Link
                            to='/individual/create-shipment'
                            className='inline-flex items-center gap-2 bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl'
                          >
                            <Plus className='w-5 h-5' />
                            Gönderi Oluştur
                          </Link>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <NotificationCenter
        isOpen={isNotificationOpen}
        onClose={() => {
          setIsNotificationOpen(false);
          window.dispatchEvent(new Event('yolnext:refresh-notifications'));
          window.dispatchEvent(new Event('yolnext:refresh-badges'));
        }}
      />
      {/* Onboarding Modal - İlk Giriş Rehberi */}
      {showOnboarding && (
        <SimpleOnboarding
          userType="individual"
          onComplete={() => setShowOnboarding(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;










