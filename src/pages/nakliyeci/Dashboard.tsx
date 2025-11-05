import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../contexts/AuthContext';
import { dashboardAPI, notificationAPI, shipmentAPI } from '../../services/api';
import NotificationModal from '../../components/modals/NotificationModal';
import {
  Package,
  CheckCircle2,
  Clock,
  DollarSign,
  Plus,
  Bell,
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
  User,
  Eye,
  Edit,
  Trash2,
  Activity,
  X,
  Route,
  Wallet,
  Map,
  Target,
  Zap,
  TrendingDown,
  UserPlus,
  TruckIcon,
} from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';

interface Shipment {
  id: string;
  trackingNumber: string;
  date: string;
  description: string;
  status: string;
  from: string;
  to: string;
  weight: number;
  value: number;
  priority: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalShipments: 0,
    deliveredShipments: 0,
    pendingShipments: 0,
    cancelledShipments: 0,
    successRate: 0,
    totalEarnings: 0,
    thisMonthEarnings: 0,
    walletBalance: 0,
    activeDrivers: 0,
    totalOffers: 0,
    acceptedOffers: 0,
    openListings: 0,
    routeOptimizations: 0,
  });
  const [recentShipments, setRecentShipments] = useState<Shipment[]>([]);
  const [recentOffers, setRecentOffers] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  // Yeni kullanıcılar için boş veriler
  const emptyData = {
    stats: {
      totalShipments: 0,
      deliveredShipments: 0,
      pendingShipments: 0,
      cancelledShipments: 0,
      successRate: 0,
      totalEarnings: 0,
      thisMonthEarnings: 0,
      walletBalance: 0,
      activeDrivers: 0,
      totalOffers: 0,
      acceptedOffers: 0,
      openListings: 0,
      routeOptimizations: 0,
    },
    recentShipments: [],
    recentOffers: [],
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      // Dashboard stats
      try {
        const statsResponse = await dashboardAPI.getStats('nakliyeci');
        if (statsResponse.data?.success) {
          setStats(statsResponse.data.data);
        } else {
          setStats(emptyData.stats);
        }
      } catch (error) {
        console.log('API hatası, demo stats kullanılıyor:', error);
        setStats(emptyData.stats);
      }

      // Recent shipments
      try {
        const shipmentsResponse = await shipmentAPI.getAll();
        if (shipmentsResponse.data?.success) {
          setRecentShipments(shipmentsResponse.data.data);
        } else {
          setRecentShipments(emptyData.recentShipments);
        }
      } catch (error) {
        console.log('API hatası, demo shipments kullanılıyor:', error);
        setRecentShipments(emptyData.recentShipments);
      }

      // Unread notifications count
      try {
        const notificationsResponse = await notificationAPI.getUnreadCount();
        if (notificationsResponse.data?.success) {
          setUnreadCount(notificationsResponse.data.data.count);
        } else {
          setUnreadCount(0);
        }
      } catch (error) {
        console.log('API hatası, demo notifications kullanılıyor:', error);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setStats(emptyData.stats);
      setRecentShipments(emptyData.recentShipments);
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  };

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
        return 'İptal Edildi';
      default:
        return status;
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

  if (isLoading) {
    return (
      <div className='min-h-screen bg-white flex items-center justify-center'>
        <LoadingState
          message='Dashboard yükleniyor...'
          size='lg'
          className='py-12'
        />
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-white'>
      <Helmet>
        <title>Ana Sayfa - YolNext Nakliyeci</title>
        <meta
          name='description'
          content='YolNext nakliyeci panel ana sayfası'
        />
      </Helmet>

      <div className='max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6'>
        {/* Hero Section */}
        <div className='relative overflow-hidden bg-gradient-to-br from-slate-800 via-blue-900 to-indigo-900 rounded-3xl p-6 text-white shadow-2xl mb-8'>
          <div className='absolute inset-0 bg-gradient-to-br from-white/5 to-transparent'></div>
          <div className='absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full -translate-y-40 translate-x-40'></div>
          <div className='absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-slate-400/10 to-blue-400/10 rounded-full translate-y-32 -translate-x-32'></div>

          <div className='relative z-10'>
            <div className='flex items-center justify-between'>
              <div className='flex-1'>
                <div className='flex items-center gap-4 mb-4'>
                  <div className='w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-xl border border-white/20'>
                    <Truck className='w-8 h-8 text-white' />
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
                      Nakliyeci panelinize hoş geldiniz.
                      <br />
                      <span className='text-blue-300 font-semibold'>
                        Akıllı rota optimizasyonu
                      </span>{' '}
                      ve karlı iş fırsatlarıyla yanınızdayız.
                    </p>
                  </div>
                </div>

                <div className='flex items-center gap-4'>
                  <div className='flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2 border border-white/20'>
                    <div className='w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-lg'></div>
                    <span className='text-slate-200 font-medium'>
                      Çevrimiçi
                    </span>
                  </div>
                  <div className='bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2 border border-white/20'>
                    <span className='text-slate-200 font-medium'>
                      {stats.totalShipments} Aktif Yük
                    </span>
                  </div>
                  <div className='bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2 border border-white/20'>
                    <span className='text-slate-200 font-medium'>
                      {stats.openListings} Açık İlan
                    </span>
                  </div>
                </div>
              </div>

              <div className='flex items-center gap-3'>
                <button
                  onClick={() => setShowNotificationModal(true)}
                  className='relative group min-w-[44px] min-h-[44px] w-12 h-12 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center hover:bg-white/20 transition-all duration-300 border border-white/20 group-hover:scale-110'
                >
                  <Bell size={20} className='text-white' />
                  {unreadCount > 0 && (
                    <span className='absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg'>
                      {unreadCount}
                    </span>
                  )}
                </button>
                <Link to='/nakliyeci/jobs'>
                  <button className='bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 text-base shadow-lg hover:shadow-xl'>
                    <Plus size={20} />
                    Yük Pazarı
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid - ANA RENK: from-slate-800 to-blue-900 */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
          <div className='bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-300 transition-all duration-300'>
            <div className='flex items-center justify-between mb-4'>
              <div className='w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center'>
                <Package className='w-6 h-6 text-white' />
              </div>
              <div className='text-right'>
                <div className='text-2xl font-bold text-slate-900 mb-1'>
                  {stats.pendingShipments}
                </div>
                <div className='flex items-center gap-1'>
                  <svg
                    className='w-3 h-3 text-blue-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M7 17l9.2-9.2M17 17V7H7'
                    />
                  </svg>
                  <span className='text-xs text-blue-600 font-semibold'>
                    Aktif
                  </span>
                </div>
              </div>
            </div>
            <div className='text-slate-700 font-semibold text-sm'>
              Aktif Yükler
            </div>
            <div className='mt-1 text-xs text-slate-500'>
              Devam eden taşımalar
            </div>
          </div>

          <div className='bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-300 transition-all duration-300'>
            <div className='flex items-center justify-between mb-4'>
              <div className='w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center'>
                <CheckCircle2 className='w-6 h-6 text-white' />
              </div>
              <div className='text-right'>
                <div className='text-2xl font-bold text-slate-900 mb-1'>
                  {stats.deliveredShipments}
                </div>
                <div className='flex items-center gap-1'>
                  <svg
                    className='w-3 h-3 text-blue-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M7 17l9.2-9.2M17 17V7H7'
                    />
                  </svg>
                  <span className='text-xs text-blue-600 font-semibold'>
                    Tamamlandı
                  </span>
                </div>
              </div>
            </div>
            <div className='text-slate-700 font-semibold text-sm'>
              Tamamlanan Yükler
            </div>
            <div className='mt-1 text-xs text-slate-500'>
              Teslim edilen gönderiler
            </div>
          </div>

          <div className='bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-300 transition-all duration-300'>
            <div className='flex items-center justify-between mb-4'>
              <div className='w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center'>
                <Target className='w-6 h-6 text-white' />
              </div>
              <div className='text-right'>
                <div className='text-2xl font-bold text-slate-900 mb-1'>
                  {stats.openListings}
                </div>
                <div className='flex items-center gap-1'>
                  <svg
                    className='w-3 h-3 text-blue-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M7 17l9.2-9.2M17 17V7H7'
                    />
                  </svg>
                  <span className='text-xs text-blue-600 font-semibold'>
                    Açık
                  </span>
                </div>
              </div>
            </div>
            <div className='text-slate-700 font-semibold text-sm'>
              Yük Pazarı
            </div>
            <div className='mt-1 text-xs text-slate-500'>Açık ilanlar</div>
          </div>

          <div className='bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-300 transition-all duration-300'>
            <div className='flex items-center justify-between mb-4'>
              <div className='w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center'>
                <Wallet className='w-6 h-6 text-white' />
              </div>
              <div className='text-right'>
                <div className='text-2xl font-bold text-slate-900 mb-1'>
                  ₺{stats.walletBalance.toLocaleString()}
                </div>
                <div className='flex items-center gap-1'>
                  <svg
                    className='w-3 h-3 text-blue-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M7 17l9.2-9.2M17 17V7H7'
                    />
                  </svg>
                  <span className='text-xs text-blue-600 font-semibold'>
                    Bakiye
                  </span>
                </div>
              </div>
            </div>
            <div className='text-slate-700 font-semibold text-sm'>
              Cüzdan Bakiyesi
            </div>
            <div className='mt-1 text-xs text-slate-500'>
              Kullanılabilir tutar
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
                Nakliyeci hizmetlerinize hızlı erişim
              </p>
            </div>
            <div className='w-14 h-14 bg-gradient-to-br from-slate-800 to-blue-900 rounded-2xl flex items-center justify-center shadow-lg'>
              <Truck className='w-7 h-7 text-white' />
            </div>
          </div>

          <div className='grid grid-cols-2 md:grid-cols-4 gap-6'>
            <Link to='/nakliyeci/jobs'>
              <div className='group bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl hover:border-blue-300 transition-all duration-300 hover:-translate-y-2'>
                <div className='flex flex-col items-center text-center'>
                  <div className='w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mb-4'>
                    <Target className='w-6 h-6 text-white' />
                  </div>
                  <h3 className='text-lg font-bold text-slate-900 mb-2'>
                    Yük Pazarı
                  </h3>
                  <p className='text-sm text-slate-600'>
                    Açık ilanlar ve teklifler
                  </p>
                  <div className='mt-3 w-8 h-1 bg-blue-600 rounded-full group-hover:w-12 transition-all duration-300'></div>
                </div>
              </div>
            </Link>

            <Link to='/nakliyeci/route-planner'>
              <div className='group bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl hover:border-emerald-300 transition-all duration-300 hover:-translate-y-2'>
                <div className='flex flex-col items-center text-center'>
                  <div className='w-12 h-12 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mb-4'>
                    <Map className='w-6 h-6 text-white' />
                  </div>
                  <h3 className='text-lg font-bold text-slate-900 mb-2'>
                    Akıllı Rota
                  </h3>
                  <p className='text-sm text-slate-600'>Yük optimizasyonu</p>
                  <div className='mt-3 w-8 h-1 bg-emerald-600 rounded-full group-hover:w-12 transition-all duration-300'></div>
                </div>
              </div>
            </Link>

            <Link to='/nakliyeci/shipments'>
              <div className='group bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl hover:border-purple-300 transition-all duration-300 hover:-translate-y-2'>
                <div className='flex flex-col items-center text-center'>
                  <div className='w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mb-4'>
                    <Package className='w-6 h-6 text-white' />
                  </div>
                  <h3 className='text-lg font-bold text-slate-900 mb-2'>
                    Yüklerim
                  </h3>
                  <p className='text-sm text-slate-600'>
                    Aktif ve tamamlanan yükler
                  </p>
                  <div className='mt-3 w-8 h-1 bg-purple-600 rounded-full group-hover:w-12 transition-all duration-300'></div>
                </div>
              </div>
            </Link>

            <Link to='/nakliyeci/drivers'>
              <div className='group bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl hover:border-amber-300 transition-all duration-300 hover:-translate-y-2'>
                <div className='flex flex-col items-center text-center'>
                  <div className='w-12 h-12 bg-gradient-to-br from-amber-600 to-orange-700 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mb-4'>
                    <Users className='w-6 h-6 text-white' />
                  </div>
                  <h3 className='text-lg font-bold text-slate-900 mb-2'>
                    Taşıyıcılarım
                  </h3>
                  <p className='text-sm text-slate-600'>
                    Şoför ve araç yönetimi
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
                Son Yükler
              </h2>
              <p className='text-slate-600'>Aktif yüklerinizi takip edin</p>
            </div>
            <Link
              to='/nakliyeci/shipments'
              className='text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2'
            >
              Tümünü Gör
              <ArrowRight className='w-4 h-4' />
            </Link>
          </div>

          {recentShipments.length > 0 ? (
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead>
                  <tr className='border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50'>
                    <th className='text-left py-3 px-4 font-semibold text-slate-800'>
                      Yük No
                    </th>
                    <th className='text-left py-3 px-4 font-semibold text-slate-800'>
                      Durum
                    </th>
                    <th className='text-left py-3 px-4 font-semibold text-slate-800'>
                      Güzergah
                    </th>
                    <th className='text-left py-3 px-4 font-semibold text-slate-800'>
                      Tutar
                    </th>
                    <th className='text-left py-3 px-4 font-semibold text-slate-800'>
                      Tarih
                    </th>
                    <th className='text-left py-3 px-4 font-semibold text-slate-800'>
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentShipments.map(shipment => (
                    <tr
                      key={shipment.id}
                      className='border-b border-slate-100 hover:bg-slate-50 transition-colors'
                    >
                      <td className='py-4 px-4'>
                        <div className='font-mono text-sm font-semibold text-slate-800'>
                          {shipment.trackingNumber}
                        </div>
                      </td>
                      <td className='py-4 px-4'>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(shipment.status)}`}
                        >
                          {getStatusText(shipment.status)}
                        </span>
                      </td>
                      <td className='py-4 px-4'>
                        <div className='text-sm text-slate-900'>
                          {shipment.from} → {shipment.to}
                        </div>
                      </td>
                      <td className='py-4 px-4'>
                        <div className='text-sm font-semibold text-slate-900'>
                          ₺{shipment.value.toLocaleString()}
                        </div>
                      </td>
                      <td className='py-4 px-4'>
                        <div className='text-sm text-slate-500'>
                          {new Date(shipment.date).toLocaleDateString('tr-TR')}
                        </div>
                      </td>
                      <td className='py-4 px-4'>
                        <div className='flex items-center gap-2'>
                          <button className='text-blue-600 hover:text-blue-700 text-sm font-medium'>
                            <Eye className='w-4 h-4' />
                          </button>
                          <button className='text-slate-600 hover:text-slate-700 text-sm font-medium'>
                            <Edit className='w-4 h-4' />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={Package}
              title='Henüz yük yok'
              description='İlk yükünüzü almak için yük pazarını ziyaret edin.'
              action={{
                label: 'Yük Pazarı',
                onClick: () => (window.location.href = '/nakliyeci/jobs'),
              }}
            />
          )}
        </div>
      </div>

      {/* Notification Modal */}
      <NotificationModal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
      />
    </div>
  );
};

export default Dashboard;
