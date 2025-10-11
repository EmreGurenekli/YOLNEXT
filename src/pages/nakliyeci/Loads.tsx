import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Package, 
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
  Weight
} from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import Modal from '../../components/common/Modal';
import SuccessMessage from '../../components/common/SuccessMessage';
import Pagination from '../../components/common/Pagination';

export default function NakliyeciLoads() {
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLoad, setSelectedLoad] = useState(null);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loadsPerPage] = useState(10);

  const breadcrumbItems = [
    { label: 'Ana Sayfa', icon: <Package className="w-4 h-4" /> },
    { label: 'Yükler', icon: <Package className="w-4 h-4" /> }
  ];

  const [loads] = useState([
    {
      id: 1,
      loadNumber: 'YUK-2024-001',
      sender: 'TechCorp A.Ş.',
      receiver: 'Ahmet Yılmaz',
      from: 'İstanbul',
      to: 'Ankara',
      status: 'loading',
      date: '2024-01-15',
      price: 2450,
      weight: '2.5 ton',
      volume: '15 m³',
      category: 'Döküman',
      estimatedDelivery: '2024-01-17',
      carrier: 'Mehmet Kaya',
      priority: 'normal',
      description: 'Önemli evraklar',
      vehicleType: 'Kamyon'
    },
    {
      id: 2,
      loadNumber: 'YUK-2024-002',
      sender: 'E-Ticaret Ltd.',
      receiver: 'Fatma Demir',
      from: 'Ankara',
      to: 'İzmir',
      status: 'in_transit',
      date: '2024-01-14',
      price: 3200,
      weight: '5.2 ton',
      volume: '25 m³',
      category: 'E-ticaret',
      estimatedDelivery: '2024-01-16',
      carrier: 'Ali Veli',
      priority: 'high',
      description: 'Elektronik ürünler',
      vehicleType: 'Kamyon'
    },
    {
      id: 3,
      loadNumber: 'YUK-2024-003',
      sender: 'Gıda A.Ş.',
      receiver: 'Mehmet Öz',
      from: 'Bursa',
      to: 'Antalya',
      status: 'delivered',
      date: '2024-01-16',
      price: 1800,
      weight: '8.1 ton',
      volume: '30 m³',
      category: 'Gıda',
      estimatedDelivery: '2024-01-18',
      carrier: 'Hasan Yılmaz',
      priority: 'normal',
      description: 'Taze ürünler',
      vehicleType: 'Kamyon'
    }
  ]);

  useEffect(() => {
    // Simulate loading
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_transit':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'loading':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-4 h-4" />;
      case 'in_transit':
        return <Truck className="w-4 h-4" />;
      case 'loading':
        return <Package className="w-4 h-4" />;
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
      case 'in_transit':
        return 'Yolda';
      case 'loading':
        return 'Yükleniyor';
      case 'cancelled':
        return 'İptal Edildi';
      default:
        return 'Bilinmiyor';
    }
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'normal':
        return 'bg-slate-100 text-slate-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const filteredLoads = loads.filter(load => {
    const matchesSearch = load.loadNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         load.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         load.receiver.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || load.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const sortedLoads = [...filteredLoads].sort((a, b) => {
    if (sortBy === 'date') {
      return sortOrder === 'asc' 
        ? new Date(a.date).getTime() - new Date(b.date).getTime()
        : new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    if (sortBy === 'price') {
      return sortOrder === 'asc' ? a.price - b.price : b.price - a.price;
    }
    return 0;
  });

  const indexOfLastLoad = currentPage * loadsPerPage;
  const indexOfFirstLoad = indexOfLastLoad - loadsPerPage;
  const currentLoads = sortedLoads.slice(indexOfFirstLoad, indexOfLastLoad);

  const handleViewDetails = (load: any) => {
    setSelectedLoad(load);
    setShowLoadModal(true);
  };

  const handleDelete = (id: number) => {
    setSuccessMessage('Yük başarıyla silindi');
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <LoadingState text="Yükler yükleniyor..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-50">
      <Helmet>
        <title>Yükler - Nakliyeci Panel - YolNet</title>
        <meta name="description" content="Nakliyeci yük yönetimi" />
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
              <Package className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Yükler</h1>
              <p className="text-sm text-slate-600">Nakliye yüklerinizi yönetin</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-slate-800 to-blue-900 text-white rounded-lg sm:rounded-xl hover:shadow-lg transition-all duration-200 text-sm font-medium">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Yeni Yük</span>
            </button>
            <button className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-white border border-slate-200 text-slate-700 rounded-lg sm:rounded-xl hover:bg-slate-50 transition-all duration-200 text-sm font-medium">
              <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Dışa Aktar</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Toplam Yük</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900">{loads.length}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Teslim Edilen</p>
                <p className="text-2xl sm:text-3xl font-bold text-green-600">
                  {loads.filter(l => l.status === 'delivered').length}
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
                <p className="text-sm text-slate-600">Yolda</p>
                <p className="text-2xl sm:text-3xl font-bold text-blue-600">
                  {loads.filter(l => l.status === 'in_transit').length}
                </p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Truck className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Yükleniyor</p>
                <p className="text-2xl sm:text-3xl font-bold text-yellow-600">
                  {loads.filter(l => l.status === 'loading').length}
                </p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Yük ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 sm:py-3 border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm"
                />
              </div>
            </div>
            
            <div className="flex gap-2 sm:gap-3">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 sm:px-4 py-2 sm:py-3 border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm"
              >
                <option value="all">Tüm Durumlar</option>
                <option value="loading">Yükleniyor</option>
                <option value="in_transit">Yolda</option>
                <option value="delivered">Teslim Edildi</option>
                <option value="cancelled">İptal Edildi</option>
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 sm:px-4 py-2 sm:py-3 border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm"
              >
                <option value="date">Tarihe Göre</option>
                <option value="price">Fiyata Göre</option>
                <option value="weight">Ağırlığa Göre</option>
              </select>
              
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 sm:px-4 py-2 sm:py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg sm:rounded-xl transition-colors"
              >
                {sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Loads List */}
        {currentLoads.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Yük bulunamadı"
            description="Arama kriterlerinize uygun yük bulunamadı."
          />
        ) : (
          <div className="space-y-4">
            {currentLoads.map((load) => (
              <div key={load.id} className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-medium text-slate-600">#{load.loadNumber}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusStyle(load.status)}`}>
                        {getStatusText(load.status)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityStyle(load.priority)}`}>
                        {load.priority === 'high' ? 'Yüksek' : load.priority === 'normal' ? 'Normal' : 'Düşük'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Gönderen</p>
                        <p className="text-sm font-medium text-slate-900">{load.sender}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Alıcı</p>
                        <p className="text-sm font-medium text-slate-900">{load.receiver}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Güzergah</p>
                        <p className="text-sm font-medium text-slate-900">{load.from} → {load.to}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Fiyat</p>
                        <p className="text-sm font-medium text-slate-900">₺{load.price.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Ağırlık</p>
                        <p className="text-sm font-medium text-slate-900">{load.weight}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Hacim</p>
                        <p className="text-sm font-medium text-slate-900">{load.volume}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Araç Tipi</p>
                        <p className="text-sm font-medium text-slate-900">{load.vehicleType}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(load.date).toLocaleDateString('tr-TR')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Weight className="w-3 h-3" />
                        <span>{load.category}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Truck className="w-3 h-3" />
                        <span>{load.carrier}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewDetails(load)}
                      className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(load.id)}
                      className="p-2 text-red-600 hover:text-red-900 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {filteredLoads.length > loadsPerPage && (
          <div className="mt-6 sm:mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredLoads.length / loadsPerPage)}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Load Detail Modal */}
      {showLoadModal && selectedLoad && (
        <Modal
          isOpen={showLoadModal}
          onClose={() => setShowLoadModal(false)}
          title="Yük Detayları"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Yük Numarası</p>
                <p className="font-medium">{selectedLoad.loadNumber}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Durum</p>
                <p className="font-medium">{getStatusText(selectedLoad.status)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Gönderen</p>
                <p className="font-medium">{selectedLoad.sender}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Alıcı</p>
                <p className="font-medium">{selectedLoad.receiver}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Güzergah</p>
                <p className="font-medium">{selectedLoad.from} → {selectedLoad.to}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Fiyat</p>
                <p className="font-medium">₺{selectedLoad.price.toLocaleString()}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Ağırlık</p>
                <p className="font-medium">{selectedLoad.weight}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Hacim</p>
                <p className="font-medium">{selectedLoad.volume}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-500">Açıklama</p>
              <p className="font-medium">{selectedLoad.description}</p>
            </div>
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