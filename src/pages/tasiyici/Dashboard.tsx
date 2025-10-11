import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../contexts/AuthContext';
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
  Target,
  User,
  Eye,
  Edit,
  Trash2,
  TrendingDown,
  Activity,
  X,
  Navigation
} from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import Modal from '../../components/common/Modal';
import SuccessMessage from '../../components/common/SuccessMessage';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalJobs: 0,
    completedJobs: 0,
    activeJobs: 0,
    successRate: 0,
    totalEarnings: 0,
    thisMonthEarnings: 0,
    monthlyGrowth: 0,
    rating: 0,
    totalTrips: 0,
    availableJobs: 0
  });
  const [recentJobs, setRecentJobs] = useState([]);
  const [availableJobs, setAvailableJobs] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Mock data - Gerçek API'den gelecek
  const mockData = {
    stats: {
      totalJobs: 35,
      completedJobs: 32,
      activeJobs: 2,
      successRate: 94,
      totalEarnings: 8750.50,
      thisMonthEarnings: 2100.25,
      monthlyGrowth: 18.5,
      rating: 4.8,
      totalTrips: 35,
      availableJobs: 12
    },
    recentJobs: [
    {
      id: '1',
        jobId: 'JOB001234567',
        status: 'in_progress',
        from: 'İstanbul, Şişli',
      to: 'Ankara, Çankaya',
        distance: '450 km',
        value: '₺450',
        date: '2024-01-15',
        description: 'Elektronik eşya - Laptop',
        vehicle: 'Kamyon',
        estimatedTime: '6 saat'
    },
    {
      id: '2',
        jobId: 'JOB001234568',
      status: 'completed',
        from: 'İstanbul, Beşiktaş',
        to: 'İzmir, Bornova',
        distance: '350 km',
        value: '₺650',
        date: '2024-01-14',
        description: 'Endüstriyel parça',
        vehicle: 'Tır',
        estimatedTime: '5 saat'
    },
    {
      id: '3',
        jobId: 'JOB001234569',
      status: 'pending',
        from: 'İstanbul, Şişli',
        to: 'İzmir, Konak',
        distance: '350 km',
        value: '₺320',
        date: '2024-01-16',
        description: 'Kişisel eşya',
        vehicle: 'Kamyonet',
        estimatedTime: '5 saat'
      }
    ],
    availableJobs: [
      {
        id: '1',
        jobId: 'JOB001234570',
        from: 'İstanbul, Kadıköy',
        to: 'Bursa, Nilüfer',
        distance: '150 km',
        value: '₺280',
        date: '2024-01-17',
        description: 'Doküman ve belgeler',
        vehicle: 'Kamyonet',
        estimatedTime: '2 saat',
        priority: 'normal'
      },
      {
        id: '2',
        jobId: 'JOB001234571',
        from: 'İstanbul, Beşiktaş',
        to: 'Antalya, Muratpaşa',
        distance: '500 km',
        value: '₺750',
        date: '2024-01-18',
        description: 'Elektronik ekipman',
        vehicle: 'Kamyon',
        estimatedTime: '8 saat',
        priority: 'high'
      },
      {
        id: '3',
        jobId: 'JOB001234572',
        from: 'İstanbul, Şişli',
        to: 'Eskişehir, Odunpazarı',
        distance: '300 km',
        value: '₺420',
        date: '2024-01-19',
        description: 'Makine parçaları',
        vehicle: 'Tır',
        estimatedTime: '4 saat',
        priority: 'normal'
      }
    ]
  };

  useEffect(() => {
    // Simulate API call
    const loadData = async () => {
      setIsLoading(true);
      
      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStats(mockData.stats);
      setRecentJobs(mockData.recentJobs);
      setAvailableJobs(mockData.availableJobs);
      setUnreadCount(4);
      
      setIsLoading(false);
    };

    loadData();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'in_progress':
        return 'text-blue-600 bg-blue-100';
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Bekliyor';
      case 'in_progress':
        return 'Yolda';
      case 'completed':
        return 'Tamamlandı';
      case 'cancelled':
        return 'İptal';
      default:
        return 'Bilinmiyor';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'in_progress':
        return <Navigation className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'cancelled':
        return <X className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority) => {
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

  const getPriorityText = (priority) => {
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
          <title>Dashboard - YolNet</title>
        </Helmet>
        <div className="p-6">
          <Breadcrumb
            items={[
              { label: 'Ana Sayfa', icon: <Package className="w-4 h-4" /> },
              { label: 'Dashboard', icon: <BarChart3 className="w-4 h-4" /> }
            ]}
          />
          <LoadingState text="Taşıyıcı paneli yükleniyor..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Helmet>
        <title>Dashboard - YolNet Taşıyıcı</title>
      </Helmet>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Professional Header - Mobile Optimized */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-blue-900 to-indigo-900 rounded-3xl p-6 text-white shadow-2xl mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full -translate-y-40 translate-x-40"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-slate-400/10 to-blue-400/10 rounded-full translate-y-32 -translate-x-32"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-slate-800 to-blue-900 rounded-2xl flex items-center justify-center shadow-xl border border-white/20">
              <User className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                      Merhaba {user?.firstName}! 👋
                    </h1>
                    <p className="text-slate-200 text-lg leading-relaxed">
                      Taşıyıcı hizmetlerinize hoş geldiniz. 
                      <br />
                      <span className="text-blue-300 font-semibold">Esnek, karlı ve güvenli</span> işlerle kazanın.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2 border border-white/20">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-lg"></div>
                    <span className="text-slate-200 font-medium">Çevrimiçi</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2 border border-white/20">
                    <span className="text-slate-200 font-medium">{stats.totalJobs} İş</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Link to="/tasiyici/messages" className="relative group">
                  <button className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center hover:bg-white/20 transition-all duration-300 border border-white/20 group-hover:scale-110">
                    <Bell size={20} className="text-white" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                </Link>
                <Link to="/tasiyici/jobs">
                  <button className="bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 text-base shadow-lg hover:shadow-xl">
                    <Plus size={20} />
                    İş Ara
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid - Ana Tasarım */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-300 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900 mb-1">{stats.totalJobs}</div>
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                  </svg>
                  <span className="text-xs text-blue-600 font-semibold">+{stats.monthlyGrowth}% bu ay</span>
                </div>
              </div>
            </div>
            <div className="text-slate-700 font-semibold text-sm">Toplam İş</div>
            <div className="mt-1 text-xs text-slate-500">Taşıyıcı iş sayısı</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-300 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900 mb-1">{stats.completedJobs}</div>
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                  </svg>
                  <span className="text-xs text-blue-600 font-semibold">%{stats.successRate} başarı</span>
                </div>
              </div>
            </div>
            <div className="text-slate-700 font-semibold text-sm">Tamamlanan</div>
            <div className="mt-1 text-xs text-slate-500">Başarıyla tamamlanan işler</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-300 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center">
                <Navigation className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900 mb-1">{stats.activeJobs}</div>
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                  </svg>
                  <span className="text-xs text-blue-600 font-semibold">Şu anda yolda</span>
                </div>
              </div>
            </div>
            <div className="text-slate-700 font-semibold text-sm">Aktif İşler</div>
            <div className="mt-1 text-xs text-slate-500">Devam eden işler</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-300 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900 mb-1">₺{stats.totalEarnings.toLocaleString()}</div>
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                  </svg>
                  <span className="text-xs text-blue-600 font-semibold">₺{stats.thisMonthEarnings.toLocaleString()} bu ay</span>
                </div>
              </div>
            </div>
            <div className="text-slate-700 font-semibold text-sm">Toplam Kazanç</div>
            <div className="mt-1 text-xs text-slate-500">Taşıyıcı kazançları</div>
          </div>
          </div>

        {/* Additional Stats - Ana Tasarım */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-300 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900 mb-1">{stats.rating}</div>
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                  </svg>
                  <span className="text-xs text-blue-600 font-semibold">Ortalama puan</span>
                </div>
              </div>
            </div>
            <div className="text-slate-700 font-semibold text-sm">Değerlendirme</div>
            <div className="mt-1 text-xs text-slate-500">Müşteri puanlaması</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-300 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900 mb-1">{stats.totalTrips}</div>
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                  </svg>
                  <span className="text-xs text-blue-600 font-semibold">Tamamlanan yolculuk</span>
                </div>
              </div>
            </div>
            <div className="text-slate-700 font-semibold text-sm">Toplam Yolculuk</div>
            <div className="mt-1 text-xs text-slate-500">Başarıyla tamamlanan</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-300 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900 mb-1">{stats.availableJobs}</div>
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                  </svg>
                  <span className="text-xs text-blue-600 font-semibold">Başvurabilir</span>
                </div>
              </div>
            </div>
            <div className="text-slate-700 font-semibold text-sm">Müsait İşler</div>
            <div className="mt-1 text-xs text-slate-500">Yeni iş fırsatları</div>
          </div>
        </div>

        {/* Quick Actions - Ana Tasarım */}
        <div className="bg-white rounded-2xl p-8 shadow-xl border border-slate-200 mb-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Hızlı İşlemler</h2>
              <p className="text-slate-600">Taşıyıcı hizmetlerimize hızlı erişim</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-slate-800 to-blue-900 rounded-2xl flex items-center justify-center shadow-lg">
              <User className="w-7 h-7 text-white" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Link to="/tasiyici/jobs">
              <div className="group bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl hover:border-blue-300 transition-all duration-300 hover:-translate-y-2">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mb-4">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Yeni İş Ara</h3>
                  <p className="text-sm text-slate-600">Müsait işleri keşfet</p>
                  <div className="mt-3 w-8 h-1 bg-blue-600 rounded-full group-hover:w-12 transition-all duration-300"></div>
                </div>
              </div>
            </Link>

            <Link to="/tasiyici/active-jobs">
              <div className="group bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl hover:border-green-300 transition-all duration-300 hover:-translate-y-2">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-800 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mb-4">
                    <Navigation className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Aktif İşlerim</h3>
                  <p className="text-sm text-slate-600">Devam eden işler</p>
                  <div className="mt-3 w-8 h-1 bg-green-600 rounded-full group-hover:w-12 transition-all duration-300"></div>
                </div>
              </div>
            </Link>

            <Link to="/tasiyici/completed-jobs">
              <div className="group bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl hover:border-purple-300 transition-all duration-300 hover:-translate-y-2">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mb-4">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Tamamlanan İşler</h3>
                  <p className="text-sm text-slate-600">Geçmiş işleriniz</p>
                  <div className="mt-3 w-8 h-1 bg-purple-600 rounded-full group-hover:w-12 transition-all duration-300"></div>
                </div>
                        </div>
            </Link>

            <Link to="/tasiyici/earnings">
              <div className="group bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl hover:border-orange-300 transition-all duration-300 hover:-translate-y-2">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-orange-800 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mb-4">
                    <DollarSign className="w-6 h-6 text-white" />
                          </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Kazanç Raporu</h3>
                  <p className="text-sm text-slate-600">Gelir analizi</p>
                  <div className="mt-3 w-8 h-1 bg-orange-600 rounded-full group-hover:w-12 transition-all duration-300"></div>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Jobs & Available Jobs - Ana Tasarım */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Son İşlerim */}
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Son İşlerim</h2>
                <p className="text-slate-600">Son tamamladığınız işler</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl flex items-center justify-center shadow-lg">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="space-y-4">
              {recentJobs.slice(0, 3).map((job) => (
                <div key={job.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-blue-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getStatusColor(job.status)}`}>
                      {getStatusIcon(job.status)}
                      </div>
                    <div>
                      <p className="font-semibold text-slate-900">{job.jobId}</p>
                      <p className="text-sm text-slate-600">{job.from} → {job.to}</p>
                      <p className="text-xs text-slate-500">{job.vehicle}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-700">{job.value}</p>
                    <p className="text-xs text-slate-500">{job.distance}</p>
                    </div>
                  </div>
                ))}
              </div>
            <Link
              to="/tasiyici/active-jobs"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mt-4"
            >
              Tümünü Gör
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Müsait İşler */}
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-slate-200">
              <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Müsait İşler</h2>
                <p className="text-slate-600">Yeni iş fırsatları</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl flex items-center justify-center shadow-lg">
                <Plus className="w-6 h-6 text-white" />
              </div>
              </div>
              <div className="space-y-4">
              {availableJobs.slice(0, 3).map((job) => (
                <div key={job.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-green-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center">
                      <Package className="w-5 h-5 text-white" />
                    </div>
                      <div>
                      <p className="font-semibold text-slate-900">{job.jobId}</p>
                      <p className="text-sm text-slate-600">{job.from} → {job.to}</p>
                      <p className="text-xs text-slate-500">{job.vehicle} • {job.estimatedTime}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-700">{job.value}</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(job.priority)}`}>
                      {getPriorityText(job.priority)}
                    </span>
                    </div>
                  </div>
                ))}
              </div>
            <Link
              to="/tasiyici/jobs"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mt-4"
            >
              Tümünü Gör
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Recent Jobs Table - Ana Tasarım */}
        <div className="bg-white rounded-2xl p-8 shadow-xl border border-slate-200 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Son İşlerim</h2>
              <p className="text-slate-600">Tüm işlerinizi detaylı görüntüleyin</p>
            </div>
            <Link to="/tasiyici/active-jobs" className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2">
              Tümünü Gör
              <ArrowRight className="w-4 h-4" />
            </Link>
              </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50">
                  <th className="text-left py-3 px-4 font-semibold text-slate-800">İş No</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-800">Durum</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-800">Güzergah</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-800">Araç</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-800">Mesafe</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-800">Tutar</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-800">Tarih</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-800">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {recentJobs.map((job) => (
                  <tr key={job.id} className="border-b border-slate-100 hover:bg-blue-50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-mono text-sm font-semibold text-slate-800">{job.jobId}</div>
                      <div className="text-xs text-slate-500">{job.date}</div>
                      <div className="text-xs text-slate-500">{job.description}</div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        job.status === 'completed' ? 'bg-green-100 text-green-800' :
                        job.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        job.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {job.status === 'in_progress' ? <Navigation className="w-3 h-3 mr-1" /> :
                         job.status === 'pending' ? <Clock className="w-3 h-3 mr-1" /> :
                         job.status === 'completed' ? <CheckCircle2 className="w-3 h-3 mr-1" /> :
                         <X className="w-3 h-3 mr-1" />}
                        {getStatusText(job.status)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm font-medium text-slate-900">{job.from} → {job.to}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm font-medium text-slate-900">{job.vehicle}</div>
                      <div className="text-xs text-slate-500">{job.estimatedTime}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm font-medium text-slate-900">{job.distance}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm font-bold text-blue-700">{job.value}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-slate-500">{job.date}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <button className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-medium rounded-lg transition-colors">
                          Detay
            </button>
                        <button className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors">
                          Mesaj
            </button>
              </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
    </div>
  );
};

export default Dashboard;