import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Truck, 
  Package, 
  MapPin, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Fuel,
  Route,
  CheckCircle,
  AlertCircle,
  Star,
  Calendar,
  Activity,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Eye
} from 'lucide-react';

interface CarrierStats {
  totalJobs: number;
  activeJobs: number;
  completedJobs: number;
  totalEarnings: number;
  monthlyEarnings: number;
  averageRating: number;
  totalDistance: number;
  fuelEfficiency: number;
  activeVehicles: number;
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
}

interface VehiclePerformance {
  id: string;
  name: string;
  type: string;
  jobs: number;
  earnings: number;
  fuelEfficiency: number;
  status: 'active' | 'maintenance' | 'idle';
  utilization: number;
}

const NakliyeciDashboard: React.FC = () => {
  const [stats, setStats] = useState<CarrierStats>({
    totalJobs: 0,
    activeJobs: 0,
    completedJobs: 0,
    totalEarnings: 0,
    monthlyEarnings: 0,
    averageRating: 0,
    totalDistance: 0,
    fuelEfficiency: 0,
    activeVehicles: 0,
    pendingOffers: 0,
    successRate: 0
  });
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
  const [vehiclePerformance, setVehiclePerformance] = useState<VehiclePerformance[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data
  const mockStats: CarrierStats = {
    totalJobs: 456,
    activeJobs: 12,
    completedJobs: 432,
    totalEarnings: 1250000,
    monthlyEarnings: 85000,
    averageRating: 4.7,
    totalDistance: 12500,
    fuelEfficiency: 8.5,
    activeVehicles: 8,
    pendingOffers: 15,
    successRate: 94.7
  };

  const mockRecentJobs: RecentJob[] = [
    {
      id: '1',
      title: 'Ev Eşyası Taşıma',
      from: 'İstanbul, Kadıköy',
      to: 'Ankara, Çankaya',
      status: 'in-progress',
      priority: 'high',
      value: 2500,
      distance: 350,
      estimatedTime: '2 gün',
      customer: 'Ahmet Yılmaz',
      vehicleType: 'Kamyon'
    },
    {
      id: '2',
      title: 'Ofis Mobilyası',
      from: 'İzmir, Konak',
      to: 'Bursa, Osmangazi',
      status: 'completed',
      priority: 'normal',
      value: 1800,
      distance: 280,
      estimatedTime: '1.5 gün',
      customer: 'Fatma Demir',
      vehicleType: 'Van'
    },
    {
      id: '3',
      title: 'Elektronik Cihazlar',
      from: 'Antalya, Muratpaşa',
      to: 'İstanbul, Beşiktaş',
      status: 'pending',
      priority: 'urgent',
      value: 3200,
      distance: 480,
      estimatedTime: '2.5 gün',
      customer: 'Mehmet Kaya',
      vehicleType: 'Kamyon'
    }
  ];

  const mockVehiclePerformance: VehiclePerformance[] = [
    { id: '1', name: '34 ABC 123', type: 'Kamyon', jobs: 45, earnings: 125000, fuelEfficiency: 8.2, status: 'active', utilization: 85 },
    { id: '2', name: '06 DEF 456', type: 'Van', jobs: 38, earnings: 89000, fuelEfficiency: 9.1, status: 'active', utilization: 72 },
    { id: '3', name: '35 GHI 789', type: 'Kamyon', jobs: 42, earnings: 156000, fuelEfficiency: 7.8, status: 'maintenance', utilization: 0 },
    { id: '4', name: '07 JKL 012', type: 'Van', jobs: 28, earnings: 67000, fuelEfficiency: 8.9, status: 'idle', utilization: 45 }
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setStats(mockStats);
      setRecentJobs(mockRecentJobs);
      setVehiclePerformance(mockVehiclePerformance);
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

  const getVehicleStatusColor = (status: VehiclePerformance['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'idle':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getVehicleStatusText = (status: VehiclePerformance['status']) => {
    switch (status) {
      case 'active':
        return 'Aktif';
      case 'maintenance':
        return 'Bakımda';
      case 'idle':
        return 'Beklemede';
      default:
        return 'Bilinmiyor';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Truck className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Nakliyeci paneli yükleniyor...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Helmet>
        <title>Nakliyeci Panel - YolNet</title>
        <meta name="description" content="Nakliyeci iş yönetim paneli" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg">
              <Truck className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Nakliyeci{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-indigo-700">
              İş Yönetimi
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Nakliye işlerinizi profesyonel olarak yönetin ve gelirinizi artırın
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
                <div className="text-2xl font-bold text-gray-900">₺{(stats.monthlyEarnings / 1000).toFixed(0)}K</div>
                <div className="text-sm text-gray-600">Aylık Kazanç</div>
              </div>
            </div>
            <div className="text-gray-700 font-semibold text-sm">Toplam: ₺{(stats.totalEarnings / 1000).toFixed(0)}K</div>
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
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{stats.activeVehicles}</div>
                <div className="text-sm text-gray-600">Aktif Araç</div>
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

          {/* Vehicle Performance */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Araç Performansı</h2>
                <BarChart3 className="w-5 h-5 text-gray-500" />
              </div>
              <div className="space-y-4">
                {vehiclePerformance.map((vehicle) => (
                  <div key={vehicle.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{vehicle.name}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getVehicleStatusColor(vehicle.status)}`}>
                        {getVehicleStatusText(vehicle.status)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">{vehicle.type}</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">İş:</span>
                        <span className="font-medium text-gray-900 ml-1">{vehicle.jobs}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Kazanç:</span>
                        <span className="font-medium text-gray-900 ml-1">₺{(vehicle.earnings / 1000).toFixed(0)}K</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Yakıt:</span>
                        <span className="font-medium text-gray-900 ml-1">{vehicle.fuelEfficiency}L/100km</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Kullanım:</span>
                        <span className="font-medium text-gray-900 ml-1">%{vehicle.utilization}</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${vehicle.utilization}%` }}
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
              <h3 className="font-semibold text-gray-900 mb-1">Yeni İşler</h3>
              <p className="text-sm text-gray-600">Mevcut işleri görüntüle</p>
            </button>

            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                <Truck className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Araç Yönetimi</h3>
              <p className="text-sm text-gray-600">Filo yönetimi</p>
            </button>

            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Analizler</h3>
              <p className="text-sm text-gray-600">Performans raporları</p>
            </button>

            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
                <Route className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Rota Optimizasyonu</h3>
              <p className="text-sm text-gray-600">Yakıt tasarrufu</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NakliyeciDashboard;