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
  Eye,
  Filter,
  Search,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import LoadingState from '../../components/shared-ui-elements/LoadingState';
import GuidanceOverlay from '../../components/shared-ui-elements/GuidanceOverlay';
import SimpleOnboarding from '../../components/onboarding/SimpleOnboarding';
import QuickStartChecklist from '../../components/onboarding/QuickStartChecklist';
import { formatCurrency, formatDate, sanitizeShipmentTitle } from '../../utils/format';
import { createApiUrl } from '../../config/api';
import { resolveShipmentRoute } from '../../utils/shipmentRoute';
import NotificationCenter from '../../components/NotificationCenter';
import CarrierInfoCard from '../../components/CarrierInfoCard';
import { normalizeTrackingCode } from '../../utils/trackingCode';
import { getStatusInfo } from '../../utils/shipmentStatus';
import Breadcrumbs, { BreadcrumbConfig } from '../../components/shared-ui-elements/Breadcrumbs';
import { LoadingStates, EmptyState, StatusMessage, LoadingSpinner } from '../../components/shared-ui-elements/LoadingStates';

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
    totalOffers: 0,
    averagePrice: 0,
    successRate: 0,
  });
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Onboarding sadece ilk kayıt sonrası 1 kez açılsın
    if (!user?.id) return;
    const role = String((user as any)?.role || 'individual').toLowerCase();
    const perUserKey = `onboardingCompleted:${user.id}:${role}`;
    const perUserSeen = localStorage.getItem(perUserKey) === 'true';
    const pendingKey = `onboardingPending:${user.id}:${role}`;
    const isPending = localStorage.getItem(pendingKey) === 'true';

    if (perUserSeen) {
      try {
        localStorage.removeItem(pendingKey);
      } catch {
        // ignore
      }
      return;
    }

    if (isPending) setShowOnboarding(true);
  }, [user?.id]);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      
      // Timeout protection
      const timeoutId = setTimeout(() => {
        setLoading(false);
        setError('Dashboard yüklenirken zaman aşımı oluştu. Lütfen sayfayı yenileyin.');
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
              totalOffers: toNumber(statsData.totalOffers, 0),
              averagePrice: toNumber(statsData.averagePrice, 0),
              successRate: toNumber(statsData.successRate, 0),
            });
          }
        } catch (statsError) {
          console.error('Stats API error:', statsError);
          // Continue with default values
        }

        // Load shipments (using mock data for now)
        try {
          // Mock data since API method doesn't exist
          const mockShipments: Shipment[] = [];
          setShipments(mockShipments);
        } catch (shipmentsError) {
          console.error('Shipments error:', shipmentsError);
          // Continue with empty array
        }

        // Load unread notifications count
        try {
          const notificationsResponse = await notificationAPI.getUnreadCount();
          if (notificationsResponse?.success && notificationsResponse?.data) {
            setUnreadCount(toNumber(notificationsResponse.data.count, 0));
          }
        } catch (notificationsError) {
          console.error('Notifications API error:', notificationsError);
          // Continue with 0
        }

        clearTimeout(timeoutId);
        setError(null);
      } catch (error) {
        clearTimeout(timeoutId);
        console.error('Dashboard loading error:', error);
        setError('Dashboard yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user?.id]);

  // Filter shipments based on search and status
  const filteredShipments = shipments.filter(shipment => {
    const matchesSearch = !searchTerm || 
      shipment.trackingCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.to.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || shipment.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'text-green-600 bg-green-50';
      case 'active':
        return 'text-blue-600 bg-blue-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'cancelled':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'active':
        return <Truck className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'Teslim Edildi';
      case 'active':
        return 'Aktif';
      case 'pending':
        return 'Beklemede';
      case 'cancelled':
        return 'İptal Edildi';
      default:
        return 'Bilinmiyor';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Helmet>
          <title>Yükleniyor - YolNext Bireysel</title>
        </Helmet>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Helmet>
          <title>Hata - YolNext Bireysel</title>
        </Helmet>
        <div className="flex items-center justify-center min-h-screen p-4">
          <StatusMessage 
            type="error" 
            message={error}
            onDismiss={() => setError(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Ana Sayfa - YolNext Bireysel</title>
        <meta name="description" content="YolNext bireysel gönderici paneli. Gönderilerinizi yönetin, takip edin, tasarruf edin!" />
      </Helmet>

      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-3">
            <Breadcrumbs items={BreadcrumbConfig.individualDashboard} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Merhaba {(user as any)?.name || 'Kullanıcı'}!
              </h1>
              <p className="text-gray-600 mt-2">
                Gönderilerinizi yönetin, takip edin, tasarruf edin! Her gönderide %30-50 daha ucuz fiyatlarla yanınızdayız.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              <Link
                to="/individual/create-shipment"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                Yeni Gönderi
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Package className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Toplam Gönderi</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalShipments}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Truck className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Aktif Gönderi</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.activeShipments}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle2 className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Teslim Edildi ✓</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.deliveredShipments}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Beklemede</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.pendingShipments}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Success Rate */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Başarı Oranı</h3>
              <p className="text-sm text-gray-500">Sorunsuz teslimat oranın - yüksek = güven</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{stats.successRate}%</div>
              <div className="text-sm text-gray-500">Başarı Oranı</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${stats.successRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Gönderi ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                >
                  <option value="all">Tüm Durumlar</option>
                  <option value="pending">Beklemede</option>
                  <option value="active">Aktif</option>
                  <option value="delivered">Teslim Edildi</option>
                  <option value="cancelled">İptal Edildi</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Shipments */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Son Gönderiler</h3>
              <p className="text-sm text-gray-500">En son oluşturduğun gönderiler - hızlı erişim için buradan</p>
              <Link
                to="/individual/my-shipments"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
              >
                Tümünü Gör
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
          
          {filteredShipments.length === 0 ? (
            <div className="p-12">
              <EmptyState
                icon={<Package className="w-12 h-12 text-gray-400" />}
                title="Henüz gönderi bulunmuyor"
                description="Henüz gönderi oluşturmadınız. İlk gönderinizi oluşturarak başlayın."
                action={{
                  label: 'Yeni Gönderi Oluştur',
                  onClick: () => navigate('/individual/create-shipment'),
                }}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gönderi No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rota
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Durum
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nakliyeci
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fiyat
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredShipments.map((shipment) => (
                    <tr key={shipment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{shipment.trackingCode}</div>
                        <div className="text-sm text-gray-500">{safeFormatDate(shipment.createdAt)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{shipment.from} → {shipment.to}</div>
                        <div className="text-sm text-gray-500">{getCategoryLabel(shipment.category)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(shipment.status)}`}>
                          {getStatusIcon(shipment.status)}
                          <span className="ml-1">{getStatusText(shipment.status)}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{shipment.carrierName || 'Atanmamış'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {shipment.price ? formatCurrency(shipment.price) : 'Teklif Bekleniyor'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Link
                            to={`/individual/shipment/${shipment.id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Detay
                          </Link>
                          {shipment.carrierId && (
                            <Link
                              to={`/individual/messages/${shipment.id}`}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Mesaj
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Hızlı İşlemler</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/individual/create-shipment"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all"
            >
              <Package className="w-8 h-8 text-blue-600" />
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-900">Yeni Gönderi</div>
                <div className="text-sm text-gray-500">3 adımda oluştur, dakikalar içinde teklif al</div>
              </div>
            </Link>
            
            <Link
              to="/individual/my-shipments"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all"
            >
              <Package className="w-8 h-8 text-blue-600" />
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-900">Gönderilerim</div>
                <div className="text-sm text-gray-500">Tüm gönderilerini tek yerden yönet</div>
              </div>
            </Link>
            
            <Link
              to="/individual/live-tracking"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all"
            >
              <Eye className="w-8 h-8 text-blue-600" />
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-900">Canlı Takip</div>
                <div className="text-sm text-gray-500">Gönderinin nerede olduğunu anlık gör</div>
              </div>
            </Link>
            
            <Link
              to="/individual/messages"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all"
            >
              <MessageSquare className="w-8 h-8 text-blue-600" />
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-900">Mesajlar</div>
                <div className="text-sm text-gray-500">Nakliyecinle direkt iletişim kur</div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="fixed right-4 top-20 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <NotificationCenter 
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)} 
          />
        </div>
      )}

      {/* Onboarding Overlay */}
      {showOnboarding && (
        <SimpleOnboarding
          userType="individual"
          onComplete={() => {
            setShowOnboarding(false);
            const role = String((user as any)?.role || 'individual').toLowerCase();
            const perUserKey = `onboardingCompleted:${user?.id}:${role}`;
            localStorage.setItem(perUserKey, 'true');
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
