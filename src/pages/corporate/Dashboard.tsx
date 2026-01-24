import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../contexts/AuthContext';
import { dashboardAPI, shipmentAPI, carriersAPI, notificationAPI } from '../../services/apiClient';
import { formatDate, formatCurrency, sanitizeShipmentTitle } from '../../utils/format';
import { 
  Package, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Plus, 
  MessageSquare,
  TrendingUp,
  Truck,
  FileText,
  Settings,
  Star,
  Award,
  Users,
  MapPin,
  BarChart3,
  ArrowRight,
  Calendar,
  Weight,
  Ruler,
  Building2,
  Target,
  User,
  Eye,
  Edit,
  Trash2,
  TrendingDown,
  Activity,
  X,
  Bell,
  Zap
} from 'lucide-react';
import Breadcrumb from '../../components/shared-ui-elements/Breadcrumb';
import EmptyState from '../../components/shared-ui-elements/EmptyState';
import LoadingState from '../../components/shared-ui-elements/LoadingState';
import Modal from '../../components/shared-ui-elements/Modal';
import SimpleOnboarding from '../../components/onboarding/SimpleOnboarding';
import SuccessMessage from '../../components/shared-ui-elements/SuccessMessage';
import GuidanceOverlay from '../../components/shared-ui-elements/GuidanceOverlay';
import CommissionManager from '../../components/PlatformEarningsManager';
import StatusManager from '../../components/ShipmentStatusManager';
import { resolveShipmentRoute } from '../../utils/shipmentRoute';
import NotificationCenter from '../../components/NotificationCenter';
import { logger } from '../../utils/logger';

interface Shipment {
  id: string;
  trackingCode: string;
  title: string;
  from: string;
  to: string;
  status:
    | 'preparing'
    | 'waiting'
    | 'waiting_for_offers'
    | 'offer_accepted'
    | 'accepted'
    | 'in_transit'
    | 'delivered'
    | 'cancelled'
    | string;
  createdAt: string;
  estimatedDelivery: string;
  price: number;
  carrierName?: string;
  category?: string;
  subCategory?: string;
  volume?: string;
}

interface Offer {
  id: number;
  date: string;
  amount: string;
  carrier: string;
  carrierName?: string;
  status: string;
}

// Kategori çeviri mapping
const categoryLabels: Record<string, string> = {
  // Ana kategoriler
  house_move: 'Ev Taşınması',
  furniture: 'Mobilya Taşıma',
  special: 'Özel Yük',
  other: 'Diğer',
  general: 'Genel Gönderi',
  // Kurumsal kategoriler
  'retail_consumer': 'Perakende & Tüketim Malı',
  'raw_materials': 'Ham Madde & Endüstriyel Mal',
  'electronics': 'Elektronik & Teknoloji',
  'electronics_tech': 'Elektronik & Teknoloji',
  'textile': 'Tekstil & Giyim',
  'textile_apparel': 'Tekstil & Giyim',
  'food_beverage': 'Gıda & İçecek',
  'furniture_home': 'Mobilya & Ev Eşyası',
  'construction': 'İnşaat Malzemeleri',
  'automotive': 'Otomotiv Parçaları',
  'medical': 'Medikal & İlaç',
  'medical_pharma': 'Medikal & İlaç',
  'chemical': 'Kimyasal & Tehlikeli Madde',
  'document': 'Doküman & Önemli Kargo',
  'warehouse': 'Depo Transferi',
  'bulk': 'Dökme Yük',
  'refrigerated': 'Soğutmalı Yük',
  'oversized': 'Büyük Boy Yük',
  'office': 'Ofis Ekipmanı',
  'machinery': 'Makine & Ekipman',
  'exhibition': 'Vitrin & Sergi Malzemesi',
};

const getCategoryLabel = (category: string | undefined | null): string => {
  if (!category) return '';
  return categoryLabels[category] || categoryLabels[category.toLowerCase()] || category;
};

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalShipments: 0,
    deliveredShipments: 0,
    pendingShipments: 0,
    successRate: 0,
    totalSpent: 0,
    thisMonthSpent: 0,
    monthlyGrowth: 0,
    activeCarriers: 0
  });
  const [recentShipments, setRecentShipments] = useState<Shipment[]>([]);
  const [recentOffers, setRecentOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'preparing':
        return {
          text: 'Hazırlanıyor',
          color: 'bg-yellow-100 text-yellow-800',
        };
      case 'waiting':
      case 'waiting_for_offers':
        return {
          text: 'Teklif Bekliyor',
          color: 'bg-blue-100 text-blue-800',
        };
      case 'offer_accepted':
      case 'accepted':
        return {
          text: 'Teklif Kabul Edildi',
          color: 'bg-green-100 text-green-800',
        };
      case 'in_transit':
        return {
          text: 'Yolda',
          color: 'bg-green-100 text-green-800',
        };
      case 'delivered':
        return {
          text: 'Teslim Edildi',
          color: 'bg-emerald-100 text-emerald-800',
        };
      case 'cancelled':
        return {
          text: 'İptal Edildi',
          color: 'bg-red-100 text-red-800',
        };
      default:
        return {
          text: 'Bilinmiyor',
          color: 'bg-gray-100 text-gray-800',
        };
    }
  };

  // Yeni kullanıcılar için boş veriler
  const emptyData = {
    stats: {
      totalShipments: 0,
      deliveredShipments: 0,
      pendingShipments: 0,
      successRate: 0,
      totalSpent: 0,
      thisMonthSpent: 0,
      monthlyGrowth: 0,
      activeCarriers: 0
    },
    recentShipments: [],
    recentOffers: []
  };

  useEffect(() => {
    // İlk giriş kontrolü - onboarding göster
    const hasSeenOnboarding = localStorage.getItem('onboardingCompleted');
    if (!hasSeenOnboarding && user?.id) {
      setShowOnboarding(true);
    }
  }, [user?.id]);

  useEffect(() => {
    const loadData = async () => {
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
        let derivedActiveCarriers: number | null = null;
        try {
          const carriersResponse = await carriersAPI.getCorporate();
          if (carriersResponse?.success) {
            const payload = (carriersResponse as any).data;
            const list = Array.isArray(payload?.carriers)
              ? payload.carriers
              : Array.isArray(payload)
                ? payload
                : [];
            derivedActiveCarriers = list.length;
          }
        } catch (_e) {
          void _e;
        }
        
        // Load stats from real API
        const statsResponse = await dashboardAPI.getStats('corporate');
        if (statsResponse?.success && statsResponse?.data?.stats) {
          const apiActive = (statsResponse.data.stats as any).activeCarriers;
          setStats({
            ...statsResponse.data.stats,
            deliveredShipments: statsResponse.data.stats.completedShipments || 0,
            successRate: statsResponse.data.stats.completedShipments > 0 ? 
              (statsResponse.data.stats.completedShipments / statsResponse.data.stats.totalShipments * 100).toFixed(1) : 0,
            totalSpent: 0,
            thisMonthSpent: 0,
            monthlyGrowth: 0,
            activeCarriers:
              typeof apiActive === 'number'
                ? apiActive
                : typeof apiActive === 'string'
                  ? parseInt(apiActive, 10) || (derivedActiveCarriers ?? 0)
                  : (derivedActiveCarriers ?? 0)
          });
        } else {
          setStats(emptyData.stats);
        }
        
        // Load recent shipments from real API
        const shipmentsResponse = await shipmentAPI.getAll();
        if (shipmentsResponse?.success) {
          let shipments: any[] = [];
          if (Array.isArray(shipmentsResponse.data)) {
            shipments = shipmentsResponse.data;
          } else if (Array.isArray((shipmentsResponse as any).shipments)) {
            shipments = (shipmentsResponse as any).shipments;
          } else if (
            shipmentsResponse.data?.shipments &&
            Array.isArray(shipmentsResponse.data.shipments)
          ) {
            shipments = shipmentsResponse.data.shipments;
          } else if (
            shipmentsResponse.data?.data &&
            Array.isArray(shipmentsResponse.data.data)
          ) {
            shipments = shipmentsResponse.data.data;
          }

          const formattedShipments: Shipment[] = shipments.map(
            (s: any): Shipment => ({
              ...(() => {
                const { from, to } = resolveShipmentRoute(s);
                return { from, to };
              })(),
              id: s.id?.toString() || String(s.id),
              trackingCode:
                s.trackingCode ||
                s.trackingNumber ||
                s.tracking_number ||
                `TRK${(s.id || '').toString().padStart(6, '0')}`,
              title: sanitizeShipmentTitle(s.title || s.productDescription || s.description || 'Gönderi'),
              status:
                s.status === 'open' || s.status === 'waiting_for_offers'
                  ? 'waiting'
                  : s.status === 'offer_accepted' || s.status === 'accepted'
                    ? 'offer_accepted'
                    : s.status === 'in_transit' || s.status === 'in_progress'
                      ? 'in_transit'
                      : s.status === 'delivered'
                        ? 'delivered'
                        : s.status === 'cancelled'
                          ? 'cancelled'
                          : s.status === 'preparing'
                            ? 'preparing'
                            : s.status || 'waiting',
              createdAt: s.createdAt || s.created_at || new Date().toISOString(),
              estimatedDelivery:
                s.deliveryDate ||
                s.delivery_date ||
                s.estimatedDelivery ||
                '',
              price:
                s.displayPrice || s.price || s.offerPrice || s.value || 0,
              carrierName: s.carrierName || s.carrier_name || undefined,
              category: s.category || s.cargoType || '',
              subCategory: s.subCategory || s.cargoSubType || '',
              volume: s.volume
                ? typeof s.volume === 'number'
                  ? s.volume.toString()
                  : s.volume
                : '0',
            })
          );

          setRecentShipments(formattedShipments);

          setStats(prev => {
            if (prev.activeCarriers && prev.activeCarriers > 0) return prev;
            if (derivedActiveCarriers && derivedActiveCarriers > 0) {
              return { ...prev, activeCarriers: derivedActiveCarriers };
            }
            // Count unique carriers from ALL shipments, not just recent ones
            const names = new Set<string>();
            if (names && typeof names.add === 'function') {
              for (const sh of formattedShipments) {
                const name = String(sh.carrierName || '').trim();
                if (name && name !== 'Atanmamış') names.add(name);
              }
              // Also count carriers from offers
              if (recentOffers && recentOffers.length > 0) {
                for (const offer of recentOffers) {
                  const name = String(offer.carrierName || offer.carrier || '').trim();
                  if (name && name !== 'Atanmamış') names.add(name);
                }
              }
            }
            return { ...prev, activeCarriers: names.size };
          });
        } else {
          setRecentShipments(emptyData.recentShipments);
        }

        // Unread notifications count
        try {
          const notificationsResponse = await notificationAPI.getUnreadCount();
          if (notificationsResponse?.success) {
            const d = (notificationsResponse as any).data || {};
            setUnreadCount(d.count || d.unreadCount || d.unread || 0);
          }
        } catch (_e) {
          void _e;
        }
        
      } catch (error) {
        logger.error('Panel verileri yüklenirken hata:', error);
        // Fallback to empty data
        setStats(emptyData.stats);
        setRecentShipments(emptyData.recentShipments);
        setRecentOffers(emptyData.recentOffers);
      } finally {
        clearTimeout(timeoutId);
        setIsLoading(false);
      }
    };

    loadData();
  }, []);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'in_transit':
        return 'text-blue-600 bg-blue-100';
      case 'delivered':
        return 'text-green-600 bg-green-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Bekliyor';
      case 'in_transit':
        return 'Yolda';
      case 'delivered':
        return 'Teslim Edildi';
      case 'cancelled':
        return 'İptal';
      default:
        return 'Bilinmiyor';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'in_transit':
        return <Truck className="w-4 h-4" />;
      case 'delivered':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'cancelled':
        return <X className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'normal':
        return 'text-blue-600 bg-blue-100';
      case 'low':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Yüksek';
      case 'normal':
        return 'Normal';
      case 'low':
        return 'Düşük';
      default:
        return 'Normal';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Helmet>
          <title>Ana Sayfa - YolNext</title>
        </Helmet>
        <div className="p-6">
          <Breadcrumb
            items={[
              { label: 'Ana Sayfa' },
              { label: 'Ana Sayfa' }
            ]}
          />
          <LoadingState message="Ana Sayfa yükleniyor..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Helmet>
        <title>Ana Sayfa - YolNext Kurumsal</title>
      </Helmet>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Professional Header - Mobile Optimized */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-blue-900 to-indigo-900 rounded-3xl p-6 text-white shadow-2xl mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full -translate-y-40 translate-x-40"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-slate-400/10 to-blue-400/10 rounded-full translate-y-32 -translate-x-32"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-slate-800 to-blue-900 rounded-2xl flex items-center justify-center shadow-xl border border-white/20">
                    <Building2 className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                      Merhaba {user?.firstName || user?.fullName?.split(' ')[0] || 'Kullanıcı'}! 👋
                    </h1>
                    <p className="text-slate-200 text-lg leading-relaxed">
                      Kurumsal gönderilerinizi kolayca yönetin. 
                      <br />
                      <span className="text-blue-300 font-semibold">Profesyonel, güvenilir ve ekonomik</span> çözümlerimizle yanınızdayız.
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2 border border-white/20">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-lg"></div>
                    <span className="text-slate-200 font-medium">Çevrimiçi</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2 border border-white/20">
                    <span className="text-slate-200 font-medium">{stats.totalShipments} Gönderi</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-stretch sm:items-center gap-3 w-full sm:w-auto">
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
                <Link to="/corporate/create-shipment" className="w-full sm:w-auto">
                  <button className="bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 text-base shadow-lg hover:shadow-xl w-full sm:w-auto">
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
            storageKey='corporate.dashboard'
            icon={Package}
            title='Kurumsal Panel'
            description='Gönderi oluştur, teklifleri topla ve operasyonu takip et. Düzenli çalıştığın nakliyecileri “Nakliyeciler” bölümünden yönetebilirsin.'
            primaryAction={{
              label: 'Gönderi Oluştur',
              to: '/corporate/create-shipment',
            }}
            secondaryAction={{
              label: 'Nakliyeciler',
              to: '/corporate/carriers',
            }}
          />
        </div>

        {/* Stats Grid - Ana Tasarım */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-300 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900 mb-1">{stats.totalShipments}</div>
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="text-slate-700 font-semibold text-sm">Toplam Gönderi</div>
            <div className="mt-1 text-xs text-slate-500">Kurumsal gönderi sayısı</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-300 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900 mb-1">{stats.deliveredShipments}</div>
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="text-slate-700 font-semibold text-sm">Teslim Edildi</div>
            <div className="mt-1 text-xs text-slate-500">Başarıyla teslim edilen</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-300 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900 mb-1">{stats.activeCarriers}</div>
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                  </svg>
                  <span className="text-xs text-blue-600 font-semibold">Aktif ortaklar</span>
                </div>
              </div>
            </div>
            <div className="text-slate-700 font-semibold text-sm">Aktif Nakliyeci</div>
            <div className="mt-1 text-xs text-slate-500">Çalışan ortaklarınız</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-300 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900 mb-1">{stats.pendingShipments}</div>
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="text-slate-700 font-semibold text-sm">Bekleyen Gönderiler</div>
            <div className="mt-1 text-xs text-slate-500">İşlem bekleyen gönderiler</div>
          </div>
        </div>

        {/* Hızlı İşlemler */}
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
            <Link to='/corporate/create-shipment'>
              <div className='group bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl hover:border-blue-300 transition-all duration-300 hover:-translate-y-2'>
                <div className='flex flex-col items-center text-center'>
                  <div className='w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mb-4'>
                    <Plus className='w-6 h-6 text-white' />
                  </div>
                  <h3 className='text-lg font-bold text-slate-900 mb-2'>
                    Gönderi Oluştur
                  </h3>
                  <p className='text-sm text-slate-600'>
                    Yeni gönderi kaydet
                  </p>
                  <div className='mt-3 w-8 h-1 bg-gradient-to-r from-slate-800 to-blue-900 rounded-full group-hover:w-12 transition-all duration-300'></div>
                </div>
              </div>
            </Link>

            <Link to='/corporate/offers'>
              <div className='group bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl hover:border-emerald-300 transition-all duration-300 hover:-translate-y-2'>
                <div className='flex flex-col items-center text-center'>
                  <div className='w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mb-4'>
                    <DollarSign className='w-6 h-6 text-white' />
                  </div>
                  <h3 className='text-lg font-bold text-slate-900 mb-2'>
                    Teklifler
                  </h3>
                  <p className='text-sm text-slate-600'>
                    Gelen teklifleri incele
                  </p>
                  <div className='mt-3 w-8 h-1 bg-gradient-to-r from-slate-800 to-blue-900 rounded-full group-hover:w-12 transition-all duration-300'></div>
                </div>
              </div>
            </Link>

            <Link to='/corporate/messages'>
              <div className='group bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl hover:border-purple-300 transition-all duration-300 hover:-translate-y-2'>
                <div className='flex flex-col items-center text-center'>
                  <div className='w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mb-4'>
                    <MessageSquare className='w-6 h-6 text-white' />
                  </div>
                  <h3 className='text-lg font-bold text-slate-900 mb-2'>
                    Mesajlaşma
                  </h3>
                  <p className='text-sm text-slate-600'>
                    Nakliyecilerle iletişim
                  </p>
                  <div className='mt-3 w-8 h-1 bg-purple-600 rounded-full group-hover:w-12 transition-all duration-300'></div>
                </div>
              </div>
            </Link>

            <Link to='/corporate/analytics'>
              <div className='group bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl hover:border-amber-300 transition-all duration-300 hover:-translate-y-2'>
                <div className='flex flex-col items-center text-center'>
                  <div className='w-12 h-12 bg-gradient-to-br from-amber-600 to-orange-700 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mb-4'>
                    <BarChart3 className='w-6 h-6 text-white' />
                  </div>
                  <h3 className='text-lg font-bold text-slate-900 mb-2'>
                    Analitik
                  </h3>
                  <p className='text-sm text-slate-600'>
                    Detaylı raporlar
                  </p>
                  <div className='mt-3 w-8 h-1 bg-amber-600 rounded-full group-hover:w-12 transition-all duration-300'></div>
                </div>
              </div>
            </Link>
          </div>
        </div>


        {/* Son Gönderiler - Kurumsal Gönderilerim tablosu ile aynı yapı */}
        <div className="bg-white rounded-2xl p-4 sm:p-8 shadow-xl border border-slate-200 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Son Gönderiler</h2>
              <p className="text-slate-600">Kurumsal gönderilerinizi takip edin</p>
            </div>
            <Link to="/corporate/shipments" className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2">
              Tümünü Gör
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50">
                    <th className="text-left py-3 px-4 font-semibold text-slate-800">Gönderi No</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-800">Rota</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-800">Durum</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-800">Nakliyeci</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-800">Fiyat</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-800">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {recentShipments.slice(0, 5).map((shipment) => (
                    <tr
                      key={shipment.id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      {/* Gönderi No */}
                      <td className="py-4 px-4">
                        <div className="font-mono text-sm font-semibold text-slate-900">
                          {shipment.trackingCode}
                        </div>
                        <div className="text-xs text-slate-500">
                          {formatDate(shipment.createdAt, 'long')}
                        </div>
                        <div className="text-xs text-slate-500">
                          {shipment.title}
                        </div>
                      </td>

                      {/* Rota */}
                      <td className="py-4 px-4">
                        <div className="text-sm font-medium text-slate-900">
                          {shipment.from} → {shipment.to}
                        </div>
                        {shipment.category && (
                          <div className="text-xs text-slate-500">
                            {getCategoryLabel(shipment.category)}
                            {shipment.subCategory
                              ? ` - ${getCategoryLabel(shipment.subCategory)}`
                              : ''}
                          </div>
                        )}
                      </td>

                      {/* Durum */}
                      <td className="py-4 px-4">
                        {(() => {
                          const info = getStatusInfo(shipment.status);
                          return (
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${info.color}`}
                            >
                              {shipment.status === 'in_transit' && (
                                <Truck className="w-3 h-3 mr-1" />
                              )}
                              {shipment.status === 'preparing' && (
                                <Package className="w-3 h-3 mr-1" />
                              )}
                              {shipment.status === 'delivered' && (
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                              )}
                              {(shipment.status === 'waiting' ||
                                shipment.status === 'waiting_for_offers') && (
                                <Clock className="w-3 h-3 mr-1" />
                              )}
                              {info.text}
                            </span>
                          );
                        })()}
                      </td>

                      {/* Nakliyeci */}
                      <td className="py-4 px-4">
                        <div className="text-sm font-medium text-slate-900">
                          {shipment.carrierName || (shipment as any).carrierEmail || (shipment as any).carrier_email || (
                            (shipment.status === 'offer_accepted' || shipment.status === 'accepted' || shipment.status === 'in_transit' || shipment.status === 'delivered')
                              ? 'Nakliyeci Atandı'
                              : 'Atanmamış'
                          )}
                        </div>
                      </td>

                      {/* Fiyat */}
                      <td className="py-4 px-4">
                        <div className="text-sm font-bold text-slate-900">
                          {shipment.price > 0 
                            ? formatCurrency(shipment.price)
                            : (shipment.status === 'waiting_for_offers' || shipment.status === 'waiting' || shipment.status === 'pending' || shipment.status === 'open')
                              ? <span className='text-slate-400 font-normal'>Teklif Bekleniyor</span>
                              : '—'}
                        </div>
                        {shipment.estimatedDelivery && (
                          <div className="text-xs text-slate-500">
                            {formatDate(shipment.estimatedDelivery, 'long')}
                          </div>
                        )}
                      </td>

                      {/* İşlemler */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/corporate/shipments?highlight=${shipment.id}`}
                            className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-medium rounded-lg transition-colors"
                          >
                            Detay
                          </Link>
                          <Link
                            to="/corporate/messages"
                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors"
                          >
                            Mesaj
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {recentShipments.slice(0, 5).map((shipment) => (
              <div
                key={`${shipment.id}-mobile`}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-sm font-semibold text-slate-900 truncate mb-1">
                      {shipment.trackingCode}
                    </div>
                    <div className="text-xs text-slate-500">
                      {shipment.title}
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ml-2 flex-shrink-0 ${
                      (() => {
                        const info = getStatusInfo(shipment.status);
                        return info.color;
                      })()
                    }`}
                  >
                    {(() => {
                      const info = getStatusInfo(shipment.status);
                      return (
                        <>
                          {shipment.status === 'in_transit' && (
                            <Truck className="w-3 h-3 mr-1" />
                          )}
                          {shipment.status === 'preparing' && (
                            <Package className="w-3 h-3 mr-1" />
                          )}
                          {shipment.status === 'delivered' && (
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                          )}
                          {(shipment.status === 'waiting' ||
                            shipment.status === 'waiting_for_offers') && (
                            <Clock className="w-3 h-3 mr-1" />
                          )}
                          <span className="ml-1">{info.text}</span>
                        </>
                      );
                    })()}
                  </span>
                </div>

                {/* Route */}
                <div className="mb-3">
                  <div className="flex items-center gap-1 text-sm font-medium text-slate-900 mb-1">
                    <MapPin className="w-4 h-4" />
                    {shipment.from} → {shipment.to}
                  </div>
                  {shipment.category && (
                    <div className="text-xs text-slate-500">
                      {getCategoryLabel(shipment.category)}
                      {shipment.subCategory
                        ? ` - ${getCategoryLabel(shipment.subCategory)}`
                        : ''}
                    </div>
                  )}
                </div>

                {/* Carrier */}
                <div className="mb-3">
                  <div className="text-sm font-medium text-slate-900">
                    {shipment.carrierName || (shipment as any).carrierEmail || (shipment as any).carrier_email || 'Nakliyeci atanmamış'}
                  </div>
                </div>

                {/* Price and Date */}
                <div className="mb-4">
                  <div className="text-lg font-bold text-slate-900 mb-1">
                    {formatCurrency(shipment.price)}
                  </div>
                  <div className="text-xs text-slate-500 space-y-1">
                    <div>Teslimat: {shipment.estimatedDelivery ? formatDate(shipment.estimatedDelivery, 'long') : 'Bilinmiyor'}</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <Link
                    to={`/corporate/shipments?highlight=${shipment.id}`}
                    className="flex-1 min-w-[80px] min-h-[40px] px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-medium rounded-lg transition-colors flex items-center justify-center"
                  >
                    Detay
                  </Link>
                  <Link
                    to="/corporate/messages"
                    className="flex-1 min-w-[80px] min-h-[40px] px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors flex items-center justify-center"
                  >
                    Mesaj
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Success Message */}
        {showSuccessMessage && (
          <SuccessMessage
            message={successMessage}
            isVisible={showSuccessMessage}
            onClose={() => setShowSuccessMessage(false)}
          />
        )}
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
          userType="corporate"
          onComplete={() => setShowOnboarding(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;










