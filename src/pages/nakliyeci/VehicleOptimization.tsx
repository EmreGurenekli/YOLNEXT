import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Navigation, 
  Search, 
  Filter, 
  Plus,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Download,
  Upload,
  MoreHorizontal,
  AlertCircle,
  CheckCircle2,
  XCircle2,
  Loader2,
  Star,
  DollarSign,
  Fuel,
  Route,
  Target,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import Modal from '../../components/common/Modal';
import SuccessMessage from '../../components/common/SuccessMessage';

export default function NakliyeciVehicleOptimization() {
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const breadcrumbItems = [
    { label: 'Ana Sayfa', icon: <Navigation className="w-4 h-4" /> },
    { label: 'Araç Optimizasyonu', icon: <Navigation className="w-4 h-4" /> }
  ];

  const [vehicles] = useState([
    {
      id: 1,
      plateNumber: '34 ABC 123',
      type: 'Kamyon',
      capacity: '10 ton',
      volume: '50 m³',
      status: 'active',
      driver: 'Mehmet Kaya',
      currentLocation: 'İstanbul',
      nextDestination: 'Ankara',
      fuelEfficiency: 8.5,
      utilizationRate: 85,
      totalDistance: 1250,
      lastMaintenance: '2024-01-10',
      nextMaintenance: '2024-02-10',
      earnings: 25000
    },
    {
      id: 2,
      plateNumber: '06 DEF 456',
      type: 'Kamyonet',
      capacity: '3 ton',
      volume: '15 m³',
      status: 'in_transit',
      driver: 'Ali Veli',
      currentLocation: 'Ankara',
      nextDestination: 'İzmir',
      fuelEfficiency: 12.5,
      utilizationRate: 92,
      totalDistance: 890,
      lastMaintenance: '2024-01-05',
      nextMaintenance: '2024-02-05',
      earnings: 18000
    },
    {
      id: 3,
      plateNumber: '35 GHI 789',
      type: 'Kamyon',
      capacity: '15 ton',
      volume: '75 m³',
      status: 'maintenance',
      driver: 'Hasan Yılmaz',
      currentLocation: 'İzmir',
      nextDestination: 'Bursa',
      fuelEfficiency: 7.2,
      utilizationRate: 78,
      totalDistance: 2100,
      lastMaintenance: '2024-01-15',
      nextMaintenance: '2024-01-25',
      earnings: 32000
    }
  ]);

  const [optimizationData] = useState({
    totalVehicles: 12,
    activeVehicles: 9,
    maintenanceVehicles: 2,
    idleVehicles: 1,
    averageUtilization: 82.5,
    totalEarnings: 125000,
    fuelSavings: 15.2,
    routeOptimization: 8.7
  });

  useEffect(() => {
    // Simulate loading
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_transit':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'idle':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'in_transit':
        return <Truck className="w-4 h-4" />;
      case 'maintenance':
        return <AlertCircle className="w-4 h-4" />;
      case 'idle':
        return <Clock className="w-4 h-4" />;
      default:
        return <Truck className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Aktif';
      case 'in_transit':
        return 'Yolda';
      case 'maintenance':
        return 'Bakımda';
      case 'idle':
        return 'Boşta';
      default:
        return 'Bilinmiyor';
    }
  };

  const getUtilizationColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getFuelEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 10) return 'text-green-600';
    if (efficiency >= 8) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <LoadingState text="Araç optimizasyon verileri yükleniyor..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-50">
      <Helmet>
        <title>Araç Optimizasyonu - Nakliyeci Panel - YolNet</title>
        <meta name="description" content="Nakliyeci araç optimizasyon yönetimi" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Breadcrumb */}
        <div className="mb-4 sm:mb-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-3 mb-4 sm:mb-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl flex items-center justify-center shadow-lg">
              <Navigation className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Araç Optimizasyonu</h1>
              <p className="text-sm text-slate-600">Filo verimliliğinizi artırın</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-slate-800 to-blue-900 text-white rounded-lg sm:rounded-xl hover:shadow-lg transition-all duration-200 text-sm font-medium">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Yeni Araç</span>
            </button>
            <button className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-white border border-slate-200 text-slate-700 rounded-lg sm:rounded-xl hover:bg-slate-50 transition-all duration-200 text-sm font-medium">
              <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Rapor İndir</span>
            </button>
          </div>
        </div>

        {/* Optimization Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Toplam Araç</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900">{optimizationData.totalVehicles}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center">
                <Truck className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Aktif Araç</p>
                <p className="text-2xl sm:text-3xl font-bold text-green-600">{optimizationData.activeVehicles}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Ortalama Verimlilik</p>
                <p className="text-2xl sm:text-3xl font-bold text-blue-600">%{optimizationData.averageUtilization}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Yakıt Tasarrufu</p>
                <p className="text-2xl sm:text-3xl font-bold text-yellow-600">%{optimizationData.fuelSavings}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                <Fuel className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Optimization Recommendations */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200 mb-6 sm:mb-8">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Optimizasyon Önerileri</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <h4 className="text-sm font-medium text-green-900">Rota Optimizasyonu</h4>
              </div>
              <p className="text-xs text-green-700">%{optimizationData.routeOptimization} daha verimli rotalar öneriliyor</p>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Fuel className="w-5 h-5 text-blue-600" />
                <h4 className="text-sm font-medium text-blue-900">Yakıt Tasarrufu</h4>
              </div>
              <p className="text-xs text-blue-700">Yakıt tüketimini %{optimizationData.fuelSavings} azaltabilirsiniz</p>
            </div>
            
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-5 h-5 text-yellow-600" />
                <h4 className="text-sm font-medium text-yellow-900">Kapasite Artırımı</h4>
              </div>
              <p className="text-xs text-yellow-700">Araçlarınızın %15 daha verimli kullanımı mümkün</p>
            </div>
          </div>
        </div>

        {/* Vehicles List */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-slate-200">
          <div className="p-4 sm:p-6 border-b border-slate-200">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Araç ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm"
                >
                  <option value="all">Tüm Durumlar</option>
                  <option value="active">Aktif</option>
                  <option value="in_transit">Yolda</option>
                  <option value="maintenance">Bakımda</option>
                  <option value="idle">Boşta</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {vehicles.length === 0 ? (
              <EmptyState
                icon={Truck}
                title="Araç bulunamadı"
                description="Arama kriterlerinize uygun araç bulunamadı."
              />
            ) : (
              <div className="space-y-4">
                {vehicles.map((vehicle) => (
                  <div key={vehicle.id} className="p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-900">{vehicle.plateNumber}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusStyle(vehicle.status)}`}>
                            {getStatusText(vehicle.status)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Araç Tipi</p>
                            <p className="text-sm font-medium text-slate-900">{vehicle.type}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Kapasite</p>
                            <p className="text-sm font-medium text-slate-900">{vehicle.capacity}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Şoför</p>
                            <p className="text-sm font-medium text-slate-900">{vehicle.driver}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Konum</p>
                            <p className="text-sm font-medium text-slate-900">{vehicle.currentLocation}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Verimlilik</p>
                            <p className={`text-sm font-medium ${getUtilizationColor(vehicle.utilizationRate)}`}>
                              %{vehicle.utilizationRate}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Yakıt Verimliliği</p>
                            <p className={`text-sm font-medium ${getFuelEfficiencyColor(vehicle.fuelEfficiency)}`}>
                              {vehicle.fuelEfficiency} L/100km
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Toplam Mesafe</p>
                            <p className="text-sm font-medium text-slate-900">{vehicle.totalDistance} km</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>Son bakım: {new Date(vehicle.lastMaintenance).toLocaleDateString('tr-TR')}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            <span>Kazanç: ₺{vehicle.earnings.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                          <Route className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success Message */}
      {showSuccessMessage && (
        <SuccessMessage
          message={successMessage}
          onClose={() => setShowSuccessMessage(false)}
          isVisible={showSuccessMessage}
        />
      )}
    </div>
  );
}