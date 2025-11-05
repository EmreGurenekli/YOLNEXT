import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../contexts/AuthContext';
import {
  Package,
  Truck,
  DollarSign,
  Clock,
  MapPin,
  Star,
  TrendingUp,
  Calendar,
  CheckCircle,
  AlertCircle,
  Activity,
  Settings,
  RefreshCw,
  Plus,
  Bell,
  MessageSquare,
  BarChart3,
  ArrowRight,
  Eye,
  Edit,
  Trash2,
  X,
} from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';
import LoadingState from '../../components/common/LoadingState';
import { formatCurrency, formatDate } from '../../utils/format';
import EmptyState from '../../components/common/EmptyState';

const TasiyiciDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalJobs: 0,
    completedJobs: 0,
    activeJobs: 0,
    totalEarnings: 0,
    thisMonthEarnings: 0,
    rating: 0,
    completedDeliveries: 0,
    workHours: 0,
    documentsCount: 0,
  });

  const [recentJobs, setRecentJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const breadcrumbItems = [{ label: 'Ana Sayfa', href: '/tasiyici/dashboard' }];

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get auth token
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No auth token found');
      }

      // Fetch real data from API
      const userId =
        user?.id ||
        (localStorage.getItem('user')
          ? JSON.parse(localStorage.getItem('user') || '{}').id
          : null);
      const [statsResponse, jobsResponse] = await Promise.all([
        fetch('/api/dashboard/stats/tasiyici', {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-User-Id': userId || '',
          },
        }),
        fetch('/api/shipments/tasiyici', {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-User-Id': userId || '',
          },
        }),
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        const statsObj = statsData.data?.stats || statsData.stats || {};
        setStats({
          totalJobs: statsObj.totalShipments || 0,
          completedJobs: statsObj.completedShipments || 0,
          activeJobs: statsObj.acceptedOffers || 0,
          totalEarnings: 0, // Not available from current API
          thisMonthEarnings: 0, // Not available from current API
          rating: 0, // Not available from current API
          completedDeliveries: statsObj.completedShipments || 0,
          workHours: 0, // Not available from current API
          documentsCount: 0, // Not available from current API
        });
      }

      if (jobsResponse.ok) {
        const jobsData = await jobsResponse.json();
        // API'den dönen veri yapısını kontrol et
        const jobs =
          jobsData.data ||
          jobsData.shipments ||
          (Array.isArray(jobsData) ? jobsData : []);
        setRecentJobs(
          jobs.slice(0, 5).map((job: any) => ({
            id: job.id.toString(),
            title: job.title || job.productDescription || 'Gönderi',
            status: job.status,
            pickup: `${job.pickupCity || job.fromCity || ''}, ${job.pickupAddress || job.pickupDistrict || ''}`,
            delivery: `${job.deliveryCity || job.toCity || ''}, ${job.deliveryAddress || job.deliveryDistrict || ''}`,
            price: job.price || 0,
            date: job.createdAt || job.created_at,
          }))
        );
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Dashboard verileri yüklenemedi');
      // Fallback to empty data
      setStats({
        totalJobs: 0,
        completedJobs: 0,
        activeJobs: 0,
        totalEarnings: 0,
        thisMonthEarnings: 0,
        rating: 0,
        completedDeliveries: 0,
        workHours: 0,
        documentsCount: 0,
      });
      setRecentJobs([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Using format helpers from utils/format.ts
  const formatPrice = formatCurrency;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'in_progress':
        return 'text-blue-600 bg-blue-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'cancelled':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Tamamlandı';
      case 'in_progress':
        return 'Devam Ediyor';
      case 'pending':
        return 'Bekliyor';
      case 'cancelled':
        return 'İptal Edildi';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
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
        <title>Ana Sayfa - YolNext Taşıyıcı</title>
        <meta name='description' content='YolNext taşıyıcı panel ana sayfası' />
      </Helmet>

      <div className='max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6'>
        {/* Breadcrumb */}
        <div className='mb-4 sm:mb-6'>
          <Breadcrumb items={breadcrumbItems} />
        </div>

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
                      Nakliyecilerden iş alarak kazanç elde edin.
                      <br />
                      <span className='text-blue-300 font-semibold'>
                        Güvenilir nakliyecilerden
                      </span>{' '}
                      iş fırsatlarıyla yanınızdayız.
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
                      {stats.totalJobs} İş
                    </span>
                  </div>
                </div>
              </div>

              <div className='flex items-center gap-3'>
                <Link to='/tasiyici/messages' className='relative group'>
                  <button className='min-w-[44px] min-h-[44px] w-12 h-12 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center hover:bg-white/20 transition-all duration-300 border border-white/20 group-hover:scale-110'>
                    <MessageSquare size={20} className='text-white' />
                    {unreadCount > 0 && (
                      <span className='absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg'>
                        {unreadCount}
                      </span>
                    )}
                  </button>
                </Link>
                <Link to='/tasiyici/active-jobs'>
                  <button className='bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 text-base shadow-lg hover:shadow-xl'>
                    <Plus size={20} />
                    İş Ara
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
          <div className='bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-300 transition-all duration-300'>
            <div className='flex items-center justify-between mb-4'>
              <div className='w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center'>
                <Package className='w-6 h-6 text-white' />
              </div>
              <div className='text-right'>
                <div className='text-2xl font-bold text-slate-900 mb-1'>
                  {stats.totalJobs}
                </div>
              </div>
            </div>
            <div className='text-slate-700 font-semibold text-sm'>
              Toplam İş
            </div>
            <div className='mt-1 text-xs text-slate-500'>
              Nakliyecilerden aldığınız iş sayısı
            </div>
          </div>

          <div className='bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-300 transition-all duration-300'>
            <div className='flex items-center justify-between mb-4'>
              <div className='w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center'>
                <CheckCircle className='w-6 h-6 text-white' />
              </div>
              <div className='text-right'>
                <div className='text-2xl font-bold text-slate-900 mb-1'>
                  {stats.completedJobs}
                </div>
              </div>
            </div>
            <div className='text-slate-700 font-semibold text-sm'>
              Tamamlanan
            </div>
            <div className='mt-1 text-xs text-slate-500'>
              Nakliyecilerden başarıyla tamamlanan işler
            </div>
          </div>

          <div className='bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-300 transition-all duration-300'>
            <div className='flex items-center justify-between mb-4'>
              <div className='w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center'>
                <Clock className='w-6 h-6 text-white' />
              </div>
              <div className='text-right'>
                <div className='text-2xl font-bold text-slate-900 mb-1'>
                  {stats.activeJobs}
                </div>
              </div>
            </div>
            <div className='text-slate-700 font-semibold text-sm'>Aktif İş</div>
            <div className='mt-1 text-xs text-slate-500'>
              Nakliyecilerden devam eden işler
            </div>
          </div>

          <div className='bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-300 transition-all duration-300'>
            <div className='flex items-center justify-between mb-4'>
              <div className='w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center'>
                <TrendingUp className='w-6 h-6 text-white' />
              </div>
              <div className='text-right'>
                <div className='text-2xl font-bold text-slate-900 mb-1'>
                  {formatPrice(stats.totalEarnings)}
                </div>
              </div>
            </div>
            <div className='text-slate-700 font-semibold text-sm'>
              Toplam Kazanç
            </div>
            <div className='mt-1 text-xs text-slate-500'>
              Nakliyecilerden kazandığınız toplam para
            </div>
          </div>
        </div>

        {/* İş İlanları Kartı */}
        <div className='bg-white rounded-2xl p-6 sm:p-8 shadow-xl border border-gray-100 hover:shadow-2xl hover:border-blue-300 transition-all duration-300 mb-8'>
          <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
            <div className='flex items-start gap-4'>
              <div className='w-14 h-14 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl flex items-center justify-center shadow-lg'>
                <Clock className='w-7 h-7 text-white' />
              </div>
              <div>
                <h2 className='text-2xl font-bold text-slate-900 mb-1'>
                  İş İlanları
                </h2>
                <p className='text-slate-600 text-base'>
                  Açık gönderiler için teklif verin ve iş alın
                </p>
              </div>
            </div>
            <div>
              <Link to='/tasiyici/market'>
                <button className='bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl'>
                  <ArrowRight className='w-4 h-4' />
                  Pazarı Görüntüle
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className='bg-white rounded-2xl p-8 shadow-xl border border-gray-100 mb-8'>
          <div className='flex items-center justify-between mb-8'>
            <div>
              <h2 className='text-2xl font-bold text-slate-900 mb-2'>
                Hızlı İşlemler
              </h2>
              <p className='text-slate-600'>
                İş fırsatlarına hızlı erişim
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
            <Link to='/tasiyici/market'>
              <div className='group bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-300 transition-all duration-300 hover:-translate-y-2'>
                <div className='flex flex-col items-center text-center'>
                  <div className='w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mb-4'>
                    <Package className='w-6 h-6 text-white' />
                  </div>
                  <h3 className='text-lg font-bold text-slate-900 mb-2'>
                    Pazar
                  </h3>
                  <p className='text-sm text-slate-600'>
                    Açık ilanlara teklif verin
                  </p>
                  <div className='mt-3 w-8 h-1 bg-gradient-to-r from-slate-800 to-blue-900 rounded-full group-hover:w-12 transition-all duration-300'></div>
                </div>
              </div>
            </Link>

            <Link to='/tasiyici/active-jobs'>
              <div className='group bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-300 transition-all duration-300 hover:-translate-y-2'>
                <div className='flex flex-col items-center text-center'>
                  <div className='w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mb-4'>
                    <Clock className='w-6 h-6 text-white' />
                  </div>
                  <h3 className='text-lg font-bold text-slate-900 mb-2'>
                    Aktif İşler
                  </h3>
                  <p className='text-sm text-slate-600'>
                    Devam eden işlerinizi görün
                  </p>
                  <div className='mt-3 w-8 h-1 bg-gradient-to-r from-slate-800 to-blue-900 rounded-full group-hover:w-12 transition-all duration-300'></div>
                </div>
              </div>
            </Link>

            <Link to='/tasiyici/completed-jobs'>
              <div className='group bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-300 transition-all duration-300 hover:-translate-y-2'>
                <div className='flex flex-col items-center text-center'>
                  <div className='w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mb-4'>
                    <CheckCircle className='w-6 h-6 text-white' />
                  </div>
                  <h3 className='text-lg font-bold text-slate-900 mb-2'>
                    Tamamlanan
                  </h3>
                  <p className='text-sm text-slate-600'>
                    Bitirdiğiniz işleri görün
                  </p>
                  <div className='mt-3 w-8 h-1 bg-gradient-to-r from-slate-800 to-blue-900 rounded-full group-hover:w-12 transition-all duration-300'></div>
                </div>
              </div>
            </Link>

            <Link to='/tasiyici/my-offers'>
              <div className='group bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-300 transition-all duration-300 hover:-translate-y-2'>
                <div className='flex flex-col items-center text-center'>
                  <div className='w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mb-4'>
                    <DollarSign className='w-6 h-6 text-white' />
                  </div>
                  <h3 className='text-lg font-bold text-slate-900 mb-2'>
                    Tekliflerim
                  </h3>
                  <p className='text-sm text-slate-600'>
                    Verdiğiniz tekliflerin durumunu görün
                  </p>
                  <div className='mt-3 w-8 h-1 bg-gradient-to-r from-slate-800 to-blue-900 rounded-full group-hover:w-12 transition-all duration-300'></div>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Jobs */}
        <div className='bg-white rounded-2xl p-8 shadow-xl border border-gray-100'>
          <div className='flex items-center justify-between mb-8'>
            <div>
              <h2 className='text-2xl font-bold text-slate-900 mb-2'>
                Son İşler
              </h2>
              <p className='text-slate-600'>
                En son aldığınız işler
              </p>
            </div>
            <Link to='/tasiyici/active-jobs'>
              <button className='px-4 py-2 bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 text-white rounded-lg font-medium transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl'>
                Tümünü Gör
                <ArrowRight className='w-4 h-4' />
              </button>
            </Link>
          </div>

          {recentJobs.length === 0 ? (
            <div className='bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center'>
              <Package className='w-16 h-16 text-gray-400 mx-auto mb-4' />
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                Henüz iş yok
              </h3>
              <p className='text-gray-600'>
                Nakliyecilerden atanan işler burada görünecek
              </p>
            </div>
          ) : (
            <div className='space-y-4'>
              {recentJobs.map((job: any) => (
                <div
                  key={job.id}
                  className='group bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-300 transition-all duration-300'
                >
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-4 flex-1'>
                      <div className='w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl flex items-center justify-center shadow-lg'>
                        <Truck className='w-6 h-6 text-white' />
                      </div>
                      <div className='flex-1'>
                        <h3 className='text-lg font-bold text-slate-900 mb-2'>
                          {job.title}
                        </h3>
                        <div className='flex items-center gap-4 text-sm text-slate-600'>
                          <div className='flex items-center gap-1'>
                            <MapPin className='w-4 h-4' />
                            <span>{job.pickup} → {job.delivery}</span>
                          </div>
                          <div className='flex items-center gap-1'>
                            <Clock className='w-4 h-4' />
                            <span>{formatDate(job.date)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className='text-right ml-4'>
                      <p className='text-2xl font-bold text-slate-900 mb-2'>
                        {formatPrice(job.price)}
                      </p>
                      <span
                        className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(job.status)} border`}
                      >
                        {getStatusText(job.status)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TasiyiciDashboard;

