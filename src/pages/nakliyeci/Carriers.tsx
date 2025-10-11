import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Users, 
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
  Phone,
  Mail,
  MessageSquare,
  Award,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import Modal from '../../components/common/Modal';
import SuccessMessage from '../../components/common/SuccessMessage';
import Pagination from '../../components/common/Pagination';

export default function NakliyeciCarriers() {
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState(null);
  const [showCarrierModal, setShowCarrierModal] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [carriersPerPage] = useState(10);

  const breadcrumbItems = [
    { label: 'Ana Sayfa', icon: <Users className="w-4 h-4" /> },
    { label: 'Taşıyıcılar', icon: <Users className="w-4 h-4" /> }
  ];

  const [carriers] = useState([
    {
      id: 1,
      name: 'Mehmet Kaya',
      phone: '+90 532 123 45 67',
      email: 'mehmet.kaya@email.com',
      status: 'active',
      rating: 4.8,
      totalJobs: 156,
      completedJobs: 142,
      successRate: 91.0,
      joinDate: '2023-06-15',
      vehicleType: 'Kamyon',
      licensePlate: '34 ABC 123',
      location: 'İstanbul',
      specialties: ['Kurumsal', 'E-ticaret', 'Gıda'],
      lastActive: '2 saat önce'
    },
    {
      id: 2,
      name: 'Ali Veli',
      phone: '+90 533 234 56 78',
      email: 'ali.veli@email.com',
      status: 'active',
      rating: 4.6,
      totalJobs: 89,
      completedJobs: 82,
      successRate: 92.1,
      joinDate: '2023-08-20',
      vehicleType: 'Kamyonet',
      licensePlate: '06 DEF 456',
      location: 'Ankara',
      specialties: ['Bireysel', 'Ev Eşyası'],
      lastActive: '5 saat önce'
    },
    {
      id: 3,
      name: 'Hasan Yılmaz',
      phone: '+90 534 345 67 89',
      email: 'hasan.yilmaz@email.com',
      status: 'inactive',
      rating: 4.4,
      totalJobs: 67,
      completedJobs: 61,
      successRate: 91.0,
      joinDate: '2023-09-10',
      vehicleType: 'Kamyon',
      licensePlate: '35 GHI 789',
      location: 'İzmir',
      specialties: ['Gıda', 'Soğuk Zincir'],
      lastActive: '2 gün önce'
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
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'suspended':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'inactive':
        return <XCircle className="w-4 h-4" />;
      case 'suspended':
        return <AlertCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Aktif';
      case 'inactive':
        return 'Pasif';
      case 'suspended':
        return 'Askıya Alındı';
      case 'pending':
        return 'Beklemede';
      default:
        return 'Bilinmiyor';
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 4.0) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredCarriers = carriers.filter(carrier => {
    const matchesSearch = carrier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         carrier.phone.includes(searchTerm) ||
                         carrier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         carrier.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || carrier.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const sortedCarriers = [...filteredCarriers].sort((a, b) => {
    if (sortBy === 'name') {
      return sortOrder === 'asc' 
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    }
    if (sortBy === 'rating') {
      return sortOrder === 'asc' ? a.rating - b.rating : b.rating - a.rating;
    }
    if (sortBy === 'successRate') {
      return sortOrder === 'asc' ? a.successRate - b.successRate : b.successRate - a.successRate;
    }
    return 0;
  });

  const indexOfLastCarrier = currentPage * carriersPerPage;
  const indexOfFirstCarrier = indexOfLastCarrier - carriersPerPage;
  const currentCarriers = sortedCarriers.slice(indexOfFirstCarrier, indexOfLastCarrier);

  const handleViewDetails = (carrier: any) => {
    setSelectedCarrier(carrier);
    setShowCarrierModal(true);
  };

  const handleDelete = (id: number) => {
    setSuccessMessage('Taşıyıcı başarıyla silindi');
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  const handleToggleStatus = (id: number) => {
    setSuccessMessage('Taşıyıcı durumu güncellendi');
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <LoadingState text="Taşıyıcılar yükleniyor..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-50">
      <Helmet>
        <title>Taşıyıcılar - Nakliyeci Panel - YolNet</title>
        <meta name="description" content="Nakliyeci taşıyıcı yönetimi" />
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
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Taşıyıcılar</h1>
              <p className="text-sm text-slate-600">Taşıyıcı ekibinizi yönetin</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-slate-800 to-blue-900 text-white rounded-lg sm:rounded-xl hover:shadow-lg transition-all duration-200 text-sm font-medium">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Yeni Taşıyıcı</span>
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
                <p className="text-sm text-slate-600">Toplam Taşıyıcı</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900">{carriers.length}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Aktif Taşıyıcı</p>
                <p className="text-2xl sm:text-3xl font-bold text-green-600">
                  {carriers.filter(c => c.status === 'active').length}
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
                <p className="text-sm text-slate-600">Ortalama Puan</p>
                <p className="text-2xl sm:text-3xl font-bold text-yellow-600">
                  {(carriers.reduce((acc, c) => acc + c.rating, 0) / carriers.length).toFixed(1)}
                </p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Başarı Oranı</p>
                <p className="text-2xl sm:text-3xl font-bold text-blue-600">
                  %{(carriers.reduce((acc, c) => acc + c.successRate, 0) / carriers.length).toFixed(1)}
                </p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-white" />
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
                  placeholder="Taşıyıcı ara..."
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
                <option value="active">Aktif</option>
                <option value="inactive">Pasif</option>
                <option value="suspended">Askıya Alındı</option>
                <option value="pending">Beklemede</option>
              </select>
              
                <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 sm:px-4 py-2 sm:py-3 border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm"
              >
                <option value="name">İsme Göre</option>
                <option value="rating">Puana Göre</option>
                <option value="successRate">Başarı Oranına Göre</option>
                <option value="joinDate">Katılım Tarihine Göre</option>
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

        {/* Carriers List */}
        {currentCarriers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Taşıyıcı bulunamadı"
            description="Arama kriterlerinize uygun taşıyıcı bulunamadı."
          />
        ) : (
          <div className="space-y-4">
            {currentCarriers.map((carrier) => (
              <div key={carrier.id} className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900">{carrier.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusStyle(carrier.status)}`}>
                      {getStatusText(carrier.status)}
                      </span>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className={`text-sm font-medium ${getRatingColor(carrier.rating)}`}>
                          {carrier.rating}
                    </span>
                  </div>
                </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Telefon</p>
                        <p className="text-sm font-medium text-slate-900">{carrier.phone}</p>
                  </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">E-posta</p>
                        <p className="text-sm font-medium text-slate-900">{carrier.email}</p>
                  </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Konum</p>
                        <p className="text-sm font-medium text-slate-900">{carrier.location}</p>
                  </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Araç</p>
                        <p className="text-sm font-medium text-slate-900">{carrier.vehicleType}</p>
                  </div>
                </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Toplam İş</p>
                        <p className="text-sm font-medium text-slate-900">{carrier.totalJobs}</p>
                    </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Tamamlanan</p>
                        <p className="text-sm font-medium text-slate-900">{carrier.completedJobs}</p>
                  </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Başarı Oranı</p>
                        <p className="text-sm font-medium text-slate-900">%{carrier.successRate}</p>
                  </div>
                </div>

                    <div className="flex flex-wrap gap-2 mb-2">
                    {carrier.specialties.map((specialty, index) => (
                        <span key={index} className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-xs">
                        {specialty}
                      </span>
                    ))}
                  </div>
                    
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Katılım: {new Date(carrier.joinDate).toLocaleDateString('tr-TR')}</span>
                </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Son aktif: {carrier.lastActive}</span>
                  </div>
                  </div>
                </div>

                  <div className="flex items-center gap-2">
                    <button className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-100 rounded-lg transition-colors">
                      <Phone className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-green-600 hover:text-green-900 hover:bg-green-100 rounded-lg transition-colors">
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleViewDetails(carrier)}
                      className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(carrier.id)}
                      className="p-2 text-yellow-600 hover:text-yellow-900 hover:bg-yellow-100 rounded-lg transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
          ))}
        </div>
        )}

        {/* Pagination */}
        {filteredCarriers.length > carriersPerPage && (
          <div className="mt-6 sm:mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredCarriers.length / carriersPerPage)}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Carrier Detail Modal */}
      {showCarrierModal && selectedCarrier && (
        <Modal
          isOpen={showCarrierModal}
          onClose={() => setShowCarrierModal(false)}
          title="Taşıyıcı Detayları"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Ad Soyad</p>
                <p className="font-medium">{selectedCarrier.name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Durum</p>
                <p className="font-medium">{getStatusText(selectedCarrier.status)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Telefon</p>
                <p className="font-medium">{selectedCarrier.phone}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">E-posta</p>
                <p className="font-medium">{selectedCarrier.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Konum</p>
                <p className="font-medium">{selectedCarrier.location}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Araç Tipi</p>
                <p className="font-medium">{selectedCarrier.vehicleType}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Puan</p>
                <p className={`font-medium ${getRatingColor(selectedCarrier.rating)}`}>
                  {selectedCarrier.rating}/5
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Başarı Oranı</p>
                <p className="font-medium">%{selectedCarrier.successRate}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-500">Uzmanlık Alanları</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {selectedCarrier.specialties.map((specialty, index) => (
                  <span key={index} className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-xs">
                    {specialty}
                  </span>
                ))}
              </div>
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