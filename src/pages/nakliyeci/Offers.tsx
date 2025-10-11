import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  DollarSign, 
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
  Package,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Download,
  Upload,
  MoreHorizontal,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Hand,
  Star,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import Modal from '../../components/common/Modal';
import SuccessMessage from '../../components/common/SuccessMessage';
import Pagination from '../../components/common/Pagination';

export default function NakliyeciOffers() {
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [offersPerPage] = useState(10);

  const breadcrumbItems = [
    { label: 'Ana Sayfa', icon: <DollarSign className="w-4 h-4" /> },
    { label: 'Teklifler', icon: <DollarSign className="w-4 h-4" /> }
  ];

  const [offers] = useState([
    {
      id: 1,
      shipmentId: 'NK-2024-001',
      sender: 'TechCorp A.Ş.',
      from: 'İstanbul',
      to: 'Ankara',
      status: 'pending',
      date: '2024-01-15',
      price: 2450,
      weight: '2.5 kg',
      category: 'Döküman',
      estimatedDelivery: '2024-01-17',
      description: 'Önemli evraklar',
      priority: 'normal',
      matchScore: 85
    },
    {
      id: 2,
      shipmentId: 'NK-2024-002',
      sender: 'E-Ticaret Ltd.',
      from: 'Ankara',
      to: 'İzmir',
      status: 'accepted',
      date: '2024-01-14',
      price: 3200,
      weight: '5.2 kg',
      category: 'E-ticaret',
      estimatedDelivery: '2024-01-16',
      description: 'Elektronik ürünler',
      priority: 'high',
      matchScore: 92
    },
    {
      id: 3,
      shipmentId: 'NK-2024-003',
      sender: 'Gıda A.Ş.',
      from: 'Bursa',
      to: 'Antalya',
      status: 'rejected',
      date: '2024-01-16',
      price: 1800,
      weight: '8.1 kg',
      category: 'Gıda',
      estimatedDelivery: '2024-01-18',
      description: 'Taze ürünler',
      priority: 'normal',
      matchScore: 78
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
      case 'accepted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'expired':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'expired':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'Kabul Edildi';
      case 'pending':
        return 'Beklemede';
      case 'rejected':
        return 'Reddedildi';
      case 'expired':
        return 'Süresi Doldu';
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

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredOffers = offers.filter(offer => {
    const matchesSearch = offer.shipmentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         offer.sender.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || offer.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const sortedOffers = [...filteredOffers].sort((a, b) => {
    if (sortBy === 'date') {
      return sortOrder === 'asc' 
        ? new Date(a.date).getTime() - new Date(b.date).getTime()
        : new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    if (sortBy === 'price') {
      return sortOrder === 'asc' ? a.price - b.price : b.price - a.price;
    }
    if (sortBy === 'matchScore') {
      return sortOrder === 'asc' ? a.matchScore - b.matchScore : b.matchScore - a.matchScore;
    }
    return 0;
  });

  const indexOfLastOffer = currentPage * offersPerPage;
  const indexOfFirstOffer = indexOfLastOffer - offersPerPage;
  const currentOffers = sortedOffers.slice(indexOfFirstOffer, indexOfLastOffer);

  const handleViewDetails = (offer: any) => {
    setSelectedOffer(offer);
    setShowOfferModal(true);
  };

  const handleAccept = (id: number) => {
    setSuccessMessage('Teklif başarıyla kabul edildi');
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  const handleReject = (id: number) => {
    setSuccessMessage('Teklif reddedildi');
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  if (isLoading) {
  return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <LoadingState text="Teklifler yükleniyor..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-50">
      <Helmet>
        <title>Teklifler - Nakliyeci Panel - YolNet</title>
        <meta name="description" content="Nakliyeci teklif yönetimi" />
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
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Teklifler</h1>
              <p className="text-sm text-slate-600">Nakliye tekliflerinizi yönetin</p>
            </div>
      </div>

          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-slate-800 to-blue-900 text-white rounded-lg sm:rounded-xl hover:shadow-lg transition-all duration-200 text-sm font-medium">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Yeni Teklif</span>
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
                <p className="text-sm text-slate-600">Toplam Teklif</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900">{offers.length}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Kabul Edilen</p>
                <p className="text-2xl sm:text-3xl font-bold text-green-600">
            {offers.filter(o => o.status === 'accepted').length}
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
                <p className="text-sm text-slate-600">Bekleyen</p>
                <p className="text-2xl sm:text-3xl font-bold text-yellow-600">
                  {offers.filter(o => o.status === 'pending').length}
                </p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
        </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Reddedilen</p>
                <p className="text-2xl sm:text-3xl font-bold text-red-600">
                  {offers.filter(o => o.status === 'rejected').length}
                </p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5 text-white" />
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
                  placeholder="Teklif ara..."
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
            <option value="pending">Beklemede</option>
                <option value="accepted">Kabul Edilen</option>
                <option value="rejected">Reddedilen</option>
                <option value="expired">Süresi Dolan</option>
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 sm:px-4 py-2 sm:py-3 border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm"
              >
                <option value="date">Tarihe Göre</option>
                <option value="price">Fiyata Göre</option>
                <option value="matchScore">Eşleşme Skoruna Göre</option>
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

        {/* Offers List */}
        {currentOffers.length === 0 ? (
          <EmptyState
            icon={DollarSign}
            title="Teklif bulunamadı"
            description="Arama kriterlerinize uygun teklif bulunamadı."
          />
        ) : (
          <div className="space-y-4">
            {currentOffers.map((offer) => (
              <div key={offer.id} className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-medium text-slate-600">#{offer.shipmentId}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusStyle(offer.status)}`}>
                        {getStatusText(offer.status)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityStyle(offer.priority)}`}>
                        {offer.priority === 'high' ? 'Yüksek' : offer.priority === 'normal' ? 'Normal' : 'Düşük'}
                      </span>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500" />
                        <span className={`text-xs font-medium ${getMatchScoreColor(offer.matchScore)}`}>
                          %{offer.matchScore} Eşleşme
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Gönderen</p>
                        <p className="text-sm font-medium text-slate-900">{offer.sender}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Güzergah</p>
                        <p className="text-sm font-medium text-slate-900">{offer.from} → {offer.to}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Fiyat</p>
                        <p className="text-sm font-medium text-slate-900">₺{offer.price.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Ağırlık</p>
                        <p className="text-sm font-medium text-slate-900">{offer.weight}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(offer.date).toLocaleDateString('tr-TR')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Teslimat: {new Date(offer.estimatedDelivery).toLocaleDateString('tr-TR')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        <span>{offer.category}</span>
                      </div>
                    </div>
          </div>
                  
                  <div className="flex items-center gap-2">
                    {offer.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleAccept(offer.id)}
                          className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          Kabul Et
                        </button>
                        <button
                          onClick={() => handleReject(offer.id)}
                          className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          Reddet
                        </button>
                      </>
                    )}
          <button
                      onClick={() => handleViewDetails(offer)}
                      className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
                      <Eye className="w-4 h-4" />
          </button>
        </div>
                </div>
              </div>
          ))}
        </div>
      )}

        {/* Pagination */}
        {filteredOffers.length > offersPerPage && (
          <div className="mt-6 sm:mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredOffers.length / offersPerPage)}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Offer Detail Modal */}
      {showOfferModal && selectedOffer && (
        <Modal
          isOpen={showOfferModal}
          onClose={() => setShowOfferModal(false)}
          title="Teklif Detayları"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Gönderi ID</p>
                <p className="font-medium">{selectedOffer.shipmentId}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Durum</p>
                <p className="font-medium">{getStatusText(selectedOffer.status)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Gönderen</p>
                <p className="font-medium">{selectedOffer.sender}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Güzergah</p>
                <p className="font-medium">{selectedOffer.from} → {selectedOffer.to}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Fiyat</p>
                <p className="font-medium">₺{selectedOffer.price.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Eşleşme Skoru</p>
                <p className={`font-medium ${getMatchScoreColor(selectedOffer.matchScore)}`}>
                  %{selectedOffer.matchScore}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-500">Açıklama</p>
              <p className="font-medium">{selectedOffer.description}</p>
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