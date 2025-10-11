import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  User, 
  Package, 
  MapPin, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  Star,
  Calendar,
  CheckCircle,
  AlertCircle,
  Activity,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Eye,
  Truck,
  Route,
  Fuel,
  Award
} from 'lucide-react';

interface DriverStats {
  totalJobs: number;
  activeJobs: number;
  completedJobs: number;
  totalEarnings: number;
  weeklyEarnings: number;
  averageRating: number;
  totalDistance: number;
  fuelEfficiency: number;
  workingHours: number;
  pendingOffers: number;
  successRate: number;
}

interface RecentJob {
  id: string;
  title: string;
  from: string;
  to: string;
  status: 'pending' | 'accepted' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  value: number;
  distance: number;
  estimatedTime: string;
  customer: string;
  vehicleType: string;
  startTime: string;
}

interface WeeklyEarnings {
  day: string;
  earnings: number;
  jobs: number;
  distance: number;
}

const TasiyiciDashboard: React.FC = () => {
  const [stats, setStats] = useState<DriverStats>({
    totalJobs: 0,
    activeJobs: 0,
    completedJobs: 0,
    totalEarnings: 0,
    weeklyEarnings: 0,
    averageRating: 0,
    totalDistance: 0,
    fuelEfficiency: 0,
    workingHours: 0,
    pendingOffers: 0,
    successRate: 0
  });
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
  const [weeklyEarnings, setWeeklyEarnings] = useState<WeeklyEarnings[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data
  const mockStats: DriverStats = {
    totalJobs: 234,
    activeJobs: 3,
    completedJobs: 228,
    totalEarnings: 125000,
    weeklyEarnings: 8500,
    averageRating: 4.8,
    totalDistance: 8500,
    fuelEfficiency: 7.2,
    workingHours: 45,
    pendingOffers: 8,
    successRate: 97.4
  };

  const mockRecentJobs: RecentJob[] = [
    {
      id: '1',
      title: 'Ev Eşyası Taşıma',
      from: 'İstanbul, Kadıköy',
      to: 'Ankara, Çankaya',
      status: 'in-progress',
      priority: 'high',
      value: 1200,
      distance: 350,
      estimatedTime: '2 gün',
      customer: 'Ahmet Yılmaz',
      vehicleType: 'Kamyon',
      startTime: '2024-03-15T08:00:00Z'
    },
    {
      id: '2',
      title: 'Ofis Mobilyası',
      from: 'İzmir, Konak',
      to: 'Bursa, Osmangazi',
      status: 'completed',
      priority: 'normal',
      value: 900,
      distance: 280,
      estimatedTime: '1.5 gün',
      customer: 'Fatma Demir',
      vehicleType: 'Van',
      startTime: '2024-03-13T09:00:00Z'
    },
    {
      id: '3',
      title: 'Elektronik Cihazlar',
      from: 'Antalya, Muratpaşa',
      to: 'İstanbul, Beşiktaş',
      status: 'pending',
      priority: 'urgent',
      value: 1500,
      distance: 480,
      estimatedTime: '2.5 gün',
      customer: 'Mehmet Kaya',
      vehicleType: 'Kamyon',
      startTime: '2024-03-16T10:00:00Z'
    }
  ];

  const mockWeeklyEarnings: WeeklyEarnings[] = [
    { day: 'Pazartesi', earnings: 1200, jobs: 2, distance: 450 },
    { day: 'Salı', earnings: 1800, jobs: 3, distance: 680 },
    { day: 'Çarşamba', earnings: 1500, jobs: 2, distance: 520 },
    { day: 'Perşembe', earnings: 2200, jobs: 4, distance: 750 },
    { day: 'Cuma', earnings: 1900, jobs: 3, distance: 620 },
    { day: 'Cumartesi', earnings: 800, jobs: 1, distance: 300 },
    { day: 'Pazar', earnings: 0, jobs: 0, distance: 0 }
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setStats(mockStats);
      setRecentJobs(mockRecentJobs);
      setWeeklyEarnings(mockWeeklyEarnings);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const getStatusColor = (status: RecentJob['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-emerald-100 text-emerald-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: RecentJob['status']) => {
    switch (status) {
      case 'pending':
        return 'Beklemede';
      case 'accepted':
        return 'Kabul Edildi';
      case 'in-progress':
        return 'Yolda';
      case 'completed':
        return 'Tamamlandı';
      case 'cancelled':
        return 'İptal Edildi';
      default:
        return 'Bilinmiyor';
    }
  };

  const getPriorityColor = (priority: RecentJob['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'normal':
        return 'bg-blue-500';
      case 'low':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <User className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Taşıyıcı paneli yükleniyor...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Helmet>
        <title>Taşıyıcı Panel - YolNet</title>
        <meta name="description" content="Bireysel taşıyıcı iş takip paneli" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg">
              <User className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Taşıyıcı{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-indigo-700">
              İş Takibi
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Bireysel taşıyıcı olarak işlerinizi yönetin ve kazancınızı takip edin
          </p>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{stats.totalJobs}</div>
                <div className="text-sm text-gray-600">Toplam İş</div>
              </div>
            </div>
            <div className="text-gray-700 font-semibold text-sm">Aktif: {stats.activeJobs}</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">₺{stats.weeklyEarnings.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Haftalık Kazanç</div>
              </div>
            </div>
            <div className="text-gray-700 font-semibold text-sm">Toplam: ₺{stats.totalEarnings.toLocaleString()}</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{stats.averageRating}</div>
                <div className="text-sm text-gray-600">Ortalama Puan</div>
              </div>
            </div>
            <div className="text-gray-700 font-semibold text-sm">%{stats.successRate} başarı</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{stats.workingHours}h</div>
                <div className="text-sm text-gray-600">Çalışma Saati</div>
              </div>
            </div>
            <div className="text-gray-700 font-semibold text-sm">{stats.fuelEfficiency}L/100km</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Jobs */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Son İşler</h2>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
                  Tümünü Gör <Eye className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4">
                {recentJobs.map((job) => (
                  <div key={job.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{job.title}</h3>
                          <div className={`w-2 h-2 rounded-full ${getPriorityColor(job.priority)}`}></div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(job.status)}`}>
                            {getStatusText(job.status)}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{job.from}</span>
                          </div>
                          <span>→</span>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{job.to}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>Müşteri: {job.customer}</span>
                          <span>Araç: {job.vehicleType}</span>
                          <span>Mesafe: {job.distance} km</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">₺{job.value.toLocaleString()}</div>
                        <div className="text-sm text-gray-600">{job.estimatedTime}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Weekly Earnings */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Haftalık Kazanç</h2>
                <BarChart3 className="w-5 h-5 text-gray-500" />
              </div>
              <div className="space-y-4">
                {weeklyEarnings.map((day, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{day.day}</h3>
                      <span className="text-lg font-bold text-gray-900">₺{day.earnings.toLocaleString()}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">İş:</span>
                        <span className="font-medium text-gray-900 ml-1">{day.jobs}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Mesafe:</span>
                        <span className="font-medium text-gray-900 ml-1">{day.distance} km</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${Math.min((day.earnings / 2500) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Hızlı İşlemler</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Mevcut İşler</h3>
              <p className="text-sm text-gray-600">Aktif işleri görüntüle</p>
            </button>

            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Kazançlarım</h3>
              <p className="text-sm text-gray-600">Gelir takibi</p>
            </button>

            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Performans</h3>
              <p className="text-sm text-gray-600">İstatistikler</p>
            </button>

            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
                <Award className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Başarılarım</h3>
              <p className="text-sm text-gray-600">Rozetler ve ödüller</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TasiyiciDashboard;