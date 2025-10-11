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
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Dashboard - YolNet</title>
      </Helmet>
      
      <div className="p-6">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: 'Ana Sayfa', icon: <Package className="w-4 h-4" /> },
            { label: 'Dashboard', icon: <BarChart3 className="w-4 h-4" /> }
          ]}
        />

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Merhaba {user?.firstName}! 👋
          </h1>
          <p className="text-gray-600">
            Taşıyıcı işlerinizi takip edin ve yeni işler bulun
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Toplam İş</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalJobs}</p>
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  +{stats.monthlyGrowth}% bu ay
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tamamlanan</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedJobs}</p>
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  %{stats.successRate} başarı
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Aktif İşler</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeJobs}</p>
                <p className="text-sm text-blue-600 flex items-center gap-1">
                  <Navigation className="w-4 h-4" />
                  Şu anda yolda
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Navigation className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Toplam Kazanç</p>
                <p className="text-2xl font-bold text-gray-900">₺{stats.totalEarnings.toFixed(2)}</p>
                <p className="text-sm text-blue-600 flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  ₺{stats.thisMonthEarnings.toFixed(2)} bu ay
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Değerlendirme</p>
                <p className="text-2xl font-bold text-gray-900">{stats.rating}</p>
                <p className="text-sm text-yellow-600 flex items-center gap-1">
                  <Star className="w-4 h-4" />
                  Ortalama puan
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Toplam Yolculuk</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalTrips}</p>
                <p className="text-sm text-blue-600 flex items-center gap-1">
                  <Truck className="w-4 h-4" />
                  Tamamlanan yolculuk
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Truck className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Müsait İşler</p>
                <p className="text-2xl font-bold text-gray-900">{stats.availableJobs}</p>
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <Plus className="w-4 h-4" />
                  Başvurabilir
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Plus className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Hızlı İşlemler</h3>
            <div className="space-y-3">
              <Link
                to="/tasiyici/jobs"
                className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Plus className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-900">Yeni İş Ara</span>
              </Link>
              <Link
                to="/tasiyici/active-jobs"
                className="flex items-center gap-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
              >
                <Navigation className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-900">Aktif İşlerim</span>
              </Link>
              <Link
                to="/tasiyici/completed-jobs"
                className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <CheckCircle2 className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-purple-900">Tamamlanan İşler</span>
              </Link>
              <Link
                to="/tasiyici/earnings"
                className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
              >
                <DollarSign className="w-5 h-5 text-orange-600" />
                <span className="font-medium text-orange-900">Kazanç Raporu</span>
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Son İşlerim</h3>
            <div className="space-y-3">
              {recentJobs.slice(0, 3).map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getStatusColor(job.status)}`}>
                      {getStatusIcon(job.status)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{job.jobId}</p>
                      <p className="text-sm text-gray-600">{job.from} → {job.to}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{job.value}</p>
                    <p className="text-xs text-gray-500">{job.vehicle}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link
              to="/tasiyici/active-jobs"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mt-3"
            >
              <span className="text-sm font-medium">Tümünü Gör</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Müsait İşler</h3>
            <div className="space-y-3">
              {availableJobs.slice(0, 3).map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Package className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{job.jobId}</p>
                      <p className="text-sm text-gray-600">{job.from} → {job.to}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{job.value}</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(job.priority)}`}>
                      {getPriorityText(job.priority)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <Link
              to="/tasiyici/jobs"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mt-3"
            >
              <span className="text-sm font-medium">Tümünü Gör</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Recent Jobs Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Son İşlerim</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İş No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Güzergah
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Araç
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mesafe
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tutar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tarih
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      {job.jobId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(job.status)}`}>
                        {getStatusText(job.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {job.from} → {job.to}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {job.vehicle}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {job.distance}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {job.value}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {job.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <button className="text-blue-600 hover:text-blue-800">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-yellow-600 hover:text-yellow-800">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-800">
                          <Trash2 className="w-4 h-4" />
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