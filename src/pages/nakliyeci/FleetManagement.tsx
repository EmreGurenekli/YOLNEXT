import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Truck, 
  Plus, 
  Edit, 
  Trash2, 
  MapPin, 
  Fuel, 
  Wrench, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Search,
  Filter,
  MoreVertical,
  BarChart3,
  RefreshCw,
  Eye,
  Calendar,
  Gauge,
  Activity
} from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import Modal from '../../components/common/Modal';
import SuccessMessage from '../../components/common/SuccessMessage';
import Pagination from '../../components/common/Pagination';

interface Vehicle {
  id: string;
  plate: string;
  type: string;
  capacity: number;
  status: 'active' | 'maintenance' | 'inactive';
  location: string;
  driver: string;
  fuelLevel: number;
  lastMaintenance: string;
  nextMaintenance: string;
  mileage: number;
  utilization: number;
  model: string;
  year: number;
  insuranceExpiry: string;
  inspectionDate: string;
}

const generateMockVehicles = (count: number): Vehicle[] => {
  const types = ['Kamyon', 'Kamyonet', 'Minibüs', 'Van'];
  const statuses = ['active', 'maintenance', 'inactive'];
  const locations = ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya'];
  const drivers = ['Ahmet Yılmaz', 'Mehmet Kaya', 'Ali Veli', 'Hasan Demir', 'Fatma Özkan'];
  const models = ['Mercedes Actros', 'Volvo FH', 'Scania R', 'MAN TGX', 'Iveco Stralis'];

  return Array.from({ length: count }, (_, i) => ({
    id: `vehicle-${i + 1}`,
    plate: `${34 + Math.floor(Math.random() * 7)} ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))} ${Math.floor(Math.random() * 900) + 100}`,
    type: types[Math.floor(Math.random() * types.length)],
    capacity: Math.floor(Math.random() * 10000) + 1000,
    status: statuses[Math.floor(Math.random() * statuses.length)] as any,
    location: locations[Math.floor(Math.random() * locations.length)],
    driver: drivers[Math.floor(Math.random() * drivers.length)],
    fuelLevel: Math.floor(Math.random() * 100),
    lastMaintenance: `2024-01-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
    nextMaintenance: `2024-02-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
    mileage: Math.floor(Math.random() * 500000) + 50000,
    utilization: Math.floor(Math.random() * 100),
    model: models[Math.floor(Math.random() * models.length)],
    year: 2015 + Math.floor(Math.random() * 9),
    insuranceExpiry: `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
    inspectionDate: `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`
  }));
};

export default function FleetManagement() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const vehiclesPerPage = 12;

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setVehicles(generateMockVehicles(20));
      setIsLoading(false);
    }, 1000);
  }, []);

  const breadcrumbItems = [
    { label: 'Ana Sayfa', icon: <BarChart3 className="w-4 h-4" />, href: '/nakliyeci/dashboard' },
    { label: 'Filo Yönetimi', icon: <Truck className="w-4 h-4" /> }
  ];

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = searchTerm === '' ||
      vehicle.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.driver.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || vehicle.status === filterStatus;
    const matchesType = filterType === 'all' || vehicle.type === filterType;

    return matchesSearch && matchesStatus && matchesType;
  });

  const indexOfLastVehicle = currentPage * vehiclesPerPage;
  const indexOfFirstVehicle = indexOfLastVehicle - vehiclesPerPage;
  const currentVehicles = filteredVehicles.slice(indexOfFirstVehicle, indexOfLastVehicle);
  const totalPages = Math.ceil(filteredVehicles.length / vehiclesPerPage);

  const getStatusStyle = (status: Vehicle['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'inactive': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusText = (status: Vehicle['status']) => {
    switch (status) {
      case 'active': return 'Aktif';
      case 'maintenance': return 'Bakımda';
      case 'inactive': return 'Pasif';
      default: return 'Bilinmiyor';
    }
  };

  const getStatusIcon = (status: Vehicle['status']) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'maintenance': return <Wrench className="w-4 h-4" />;
      case 'inactive': return <AlertCircle className="w-4 h-4" />;
      default: return <Truck className="w-4 h-4" />;
    }
  };

  const getFuelLevelColor = (level: number) => {
    if (level > 50) return 'text-green-600';
    if (level > 25) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleViewDetails = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setShowDetailModal(true);
  };

  const handleDeleteVehicle = (id: string) => {
    setVehicles(vehicles.filter(vehicle => vehicle.id !== id));
    setSuccessMessage('Araç başarıyla silindi!');
    setShowSuccessMessage(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <LoadingState text="Filo verileri yükleniyor..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-50">
      <Helmet>
        <title>Filo Yönetimi - Nakliyeci Panel - YolNet</title>
        <meta name="description" content="Nakliyeci filo yönetimi" />
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
              <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Filo Yönetimi</h1>
              <p className="text-sm text-slate-600">Araçlarınızı yönetin ve takip edin</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-slate-800 to-blue-900 text-white rounded-lg sm:rounded-xl hover:shadow-lg transition-all duration-200 text-sm font-medium">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Yeni Araç Ekle</span>
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-white border border-slate-200 text-slate-700 rounded-lg sm:rounded-xl hover:bg-slate-50 transition-all duration-200 text-sm font-medium"
            >
              <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Filtreler</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Toplam Araç</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900">{vehicles.length}</p>
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
                <p className="text-2xl sm:text-3xl font-bold text-green-600">
                  {vehicles.filter(v => v.status === 'active').length}
                </p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Bakımda</p>
                <p className="text-2xl sm:text-3xl font-bold text-yellow-600">
                  {vehicles.filter(v => v.status === 'maintenance').length}
                </p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                <Wrench className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Ortalama Kullanım</p>
                <p className="text-2xl sm:text-3xl font-bold text-blue-600">
                  %{Math.round(vehicles.reduce((sum, v) => sum + v.utilization, 0) / vehicles.length)}
                </p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200 mb-6 sm:mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm"
              >
                <option value="all">Tüm Durumlar</option>
                <option value="active">Aktif</option>
                <option value="maintenance">Bakımda</option>
                <option value="inactive">Pasif</option>
              </select>
              
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm"
              >
                <option value="all">Tüm Tipler</option>
                <option value="Kamyon">Kamyon</option>
                <option value="Kamyonet">Kamyonet</option>
                <option value="Minibüs">Minibüs</option>
                <option value="Van">Van</option>
              </select>
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                  setFilterType('all');
                  setShowFilters(false);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all duration-200"
              >
                <RefreshCw className="w-4 h-4" />
                Filtreleri Temizle
              </button>
            </div>
          </div>
        )}

        {/* Vehicles Grid/List */}
        {currentVehicles.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="Araç bulunamadı"
            description="Arama kriterlerinize uygun araç bulunamadı."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {currentVehicles.map((vehicle) => (
              <div key={vehicle.id} className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                      <Truck className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{vehicle.plate}</h3>
                      <p className="text-sm text-slate-600">{vehicle.model} ({vehicle.year})</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleViewDetails(vehicle)}
                      className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Durum</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusStyle(vehicle.status)}`}>
                      {getStatusIcon(vehicle.status)} {getStatusText(vehicle.status)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Tip</span>
                    <span className="text-sm font-medium text-slate-900">{vehicle.type}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Kapasite</span>
                    <span className="text-sm font-medium text-slate-900">{vehicle.capacity.toLocaleString()} kg</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Şoför</span>
                    <span className="text-sm font-medium text-slate-900">{vehicle.driver}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Konum</span>
                    <span className="text-sm font-medium text-slate-900 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {vehicle.location}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Yakıt</span>
                    <span className={`text-sm font-medium flex items-center gap-1 ${getFuelLevelColor(vehicle.fuelLevel)}`}>
                      <Fuel className="w-3 h-3" />
                      %{vehicle.fuelLevel}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Kullanım</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-slate-200 rounded-full">
                        <div 
                          className="h-2 bg-gradient-to-r from-slate-800 to-blue-900 rounded-full transition-all duration-300"
                          style={{ width: `${vehicle.utilization}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-slate-900">%{vehicle.utilization}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewDetails(vehicle)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all text-sm"
                  >
                    <Eye className="w-4 h-4" /> Detaylar
                  </button>
                  <button
                    onClick={() => handleDeleteVehicle(vehicle.id)}
                    className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 sm:mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Vehicle Detail Modal */}
      {showDetailModal && selectedVehicle && (
        <Modal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title={`Araç Detayları: ${selectedVehicle.plate}`}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Plaka</p>
                <p className="font-medium">{selectedVehicle.plate}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Model</p>
                <p className="font-medium">{selectedVehicle.model} ({selectedVehicle.year})</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Tip</p>
                <p className="font-medium">{selectedVehicle.type}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Kapasite</p>
                <p className="font-medium">{selectedVehicle.capacity.toLocaleString()} kg</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Durum</p>
                <p className="font-medium">{getStatusText(selectedVehicle.status)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Şoför</p>
                <p className="font-medium">{selectedVehicle.driver}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Konum</p>
                <p className="font-medium">{selectedVehicle.location}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Kilometre</p>
                <p className="font-medium">{selectedVehicle.mileage.toLocaleString()} km</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Son Bakım</p>
                <p className="font-medium">{new Date(selectedVehicle.lastMaintenance).toLocaleDateString('tr-TR')}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Sonraki Bakım</p>
                <p className="font-medium">{new Date(selectedVehicle.nextMaintenance).toLocaleDateString('tr-TR')}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Yakıt Seviyesi</p>
                <p className="font-medium">%{selectedVehicle.fuelLevel}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Kullanım Oranı</p>
                <p className="font-medium">%{selectedVehicle.utilization}</p>
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setShowDetailModal(false)}
              className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition-colors"
            >
              Kapat
            </button>
            <button className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors">
              Düzenle
            </button>
          </div>
        </Modal>
      )}

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