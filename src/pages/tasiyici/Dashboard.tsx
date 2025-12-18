import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../contexts/AuthContext';
import { createApiUrl } from '../../config/api';
import {
  Package,
  Truck,
  Clock,
  MapPin,
  Star,
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
  Briefcase,
  Copy,
} from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';
import LoadingState from '../../components/common/LoadingState';
import { formatDate } from '../../utils/format';
import EmptyState from '../../components/common/EmptyState';

type RecentJob = {
  id: string;
  title: string;
  status?: string;
  pickup: string;
  delivery: string;
  price: number;
  date?: string;
};

const TasiyiciDashboard: React.FC = () => {
  const { user, updateUser } = useAuth();

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
    totalJobs: 0,
    completedJobs: 0,
    activeJobs: 0,
    rating: 0,
    completedDeliveries: 0,
    workHours: 0,
    documentsCount: 0,
  });

  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);

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
      
      // Fetch user profile to get driverCode
      const profileResponse = await fetch(createApiUrl('/api/users/profile'), {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        const profile = profileData.data?.user || profileData.user || profileData.data || profileData;
        if (profile && updateUser) {
          updateUser({
            ...profile,
            driverCode: profile.driverCode || profile.drivercode || undefined
          });
        }
      }
      
      const [statsResponse, jobsResponse] = await Promise.all([
        fetch(createApiUrl('/api/dashboard/stats/tasiyici'), {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-User-Id': userId || '',
          },
        }),
        fetch(createApiUrl('/api/shipments/tasiyici'), {
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
          totalJobs: statsObj.totalJobs || statsObj.totalShipments || 0,
          completedJobs: statsObj.completedJobs || statsObj.completedShipments || 0,
          activeJobs: statsObj.activeJobs || statsObj.acceptedOffers || 0,
          rating: 0, // Not available from current API
          completedDeliveries: statsObj.completedShipments || 0,
          workHours: 0, // Not available from current API
          documentsCount: 0, // Not available from current API
        });
      }

      if (jobsResponse.ok) {
        const jobsData = await jobsResponse.json();
        // API'den dönen veri yapısını kontrol et
        const jobsRaw =
          jobsData.data ||
          jobsData.shipments ||
          (Array.isArray(jobsData) ? jobsData : []);
        const jobs = Array.isArray(jobsRaw) ? jobsRaw : [];
        setRecentJobs(
          jobs.slice(0, 5).map((job: any) => ({
            id: String(job?.id ?? ''),
            title: job?.title || job?.productDescription || 'Gönderi',
            status: job?.status,
            pickup: `${job?.pickupCity || job?.fromCity || ''}, ${job?.pickupAddress || job?.pickupDistrict || ''}`,
            delivery: `${job?.deliveryCity || job?.toCity || ''}, ${job?.deliveryAddress || job?.deliveryDistrict || ''}`,
            price: toNumber(job?.price ?? job?.displayPrice ?? job?.value, 0),
            date: job?.createdAt || job?.created_at || job?.updatedAt || job?.updated_at,
          }))
        );
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Ana Sayfa verileri yüklenemedi');
      // Fallback to empty data
      setStats({
        totalJobs: 0,
        completedJobs: 0,
        activeJobs: 0,
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
                  {(user?.driverCode || (user as any)?.drivercode) && (
                    <div className='bg-gradient-to-r from-slate-800/30 to-blue-900/30 backdrop-blur-sm rounded-2xl px-4 py-2 border border-slate-400/30 flex items-center gap-2'>
                      <span className='text-slate-200 font-medium text-sm'>Kodum:</span>
                      <span className='text-white font-mono font-bold text-base'>{user?.driverCode || (user as any)?.drivercode}</span>
                      <button
                        onClick={() => {
                          const code = user?.driverCode || (user as any)?.drivercode;
                          if (code) {
                            navigator.clipboard.writeText(code);
                            setCopiedCode(true);
                            setTimeout(() => setCopiedCode(false), 2000);
                          }
                        }}
                        className='ml-1 p-1.5 hover:bg-white/10 rounded-lg transition-colors'
                        title='Kodu Kopyala'
                      >
                        {copiedCode ? (
                          <CheckCircle className='w-4 h-4 text-emerald-300' />
                        ) : (
                          <Copy className='w-4 h-4 text-slate-300' />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className='flex items-center gap-3'>
                <Link to='/tasiyici/market'>
                  <button className='bg-white text-slate-800 px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center gap-2 text-base shadow-lg hover:shadow-xl hover:bg-green-50'>
                    <Plus size={20} />
                    Yeni İş Ara
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6'>
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
        </div>

        {/* Yeni İş Var - Büyük Buton */}
        {stats.activeJobs === 0 && (
          <div className='bg-gradient-to-br from-slate-50 to-gray-100 border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-xl mb-8 text-center'>
            <div className='mb-4'>
              <div className='w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-slate-800 to-blue-900 rounded-2xl flex items-center justify-center shadow-lg'>
                <Briefcase className='w-10 h-10 text-white' />
              </div>
              <h2 className='text-3xl font-bold mb-2 text-slate-900'>Yeni İş Fırsatları</h2>
              <p className='text-slate-600 text-lg'>Nakliyecilerden iş al, yeni fırsatlar yakala!</p>
            </div>
            <Link to='/tasiyici/market'>
              <button className='bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105'>
                🚚 İş Pazarına Git
              </button>
            </Link>
          </div>
        )}


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

