import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Star, 
  Truck, 
  MapPin, 
  Calendar,
  DollarSign,
  Eye,
  MessageSquare,
  Phone,
  Mail,
  FileText,
  Package,
  User,
  Building2,
  Users,
  Download,
  TrendingUp,
  BarChart3,
  CheckSquare,
  X,
  Plus
} from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import Modal from '../../components/common/Modal';
import SuccessMessage from '../../components/common/SuccessMessage';
import Pagination from '../../components/common/Pagination';

export default function Offers() {
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showComparison, setShowComparison] = useState(false);
  const [showPriceAnalysis, setShowPriceAnalysis] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [offerToReject, setOfferToReject] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Mock data - gerçek uygulamada API'den gelecek
  const offers = [
    {
      id: 'OFF-001',
      shipmentId: 'CORP-2024-001',
      carrier: {
        name: 'Hızlı Lojistik A.Ş.',
        rating: 4.8,
        logo: '/logo.svg',
        phone: '0555 123 45 67',
        email: 'info@hizlilojistik.com',
        isContracted: true // Anlaşmalı nakliyeci
      },
      route: 'İstanbul → Ankara',
      cargo: 'Gıda Ürünleri - Soğuk Zincir',
      weight: '2.5 ton',
      volume: '15 m³',
      price: 45000,
      currency: '₺',
      deliveryTime: '2 gün',
      pickupDate: '2024-01-16',
      deliveryDate: '2024-01-18',
      status: 'pending', // pending, accepted, rejected
      submittedAt: '2024-01-15 14:30',
      specialNotes: 'Soğuk zincir garantili taşıma',
      insurance: 'Tam sigorta dahil',
      vehicleType: 'Soğutmalı Tır',
      driver: {
        name: 'Ahmet Yılmaz',
        experience: '8 yıl',
        rating: 4.9
      }
    },
    {
      id: 'OFF-002',
      shipmentId: 'CORP-2024-001',
      carrier: {
        name: 'Güvenli Taşımacılık Ltd.',
        rating: 4.6,
        logo: '/logo.svg',
        phone: '0555 987 65 43',
        email: 'info@guvenlitasimacilik.com',
        isContracted: false // Genel nakliyeci
      },
      route: 'İstanbul → Ankara',
      cargo: 'Gıda Ürünleri - Soğuk Zincir',
      weight: '2.5 ton',
      volume: '15 m³',
      price: 42000,
      currency: '₺',
      deliveryTime: '3 gün',
      pickupDate: '2024-01-16',
      deliveryDate: '2024-01-19',
      status: 'pending',
      submittedAt: '2024-01-15 16:45',
      specialNotes: '24 saat takip sistemi',
      insurance: 'Temel sigorta',
      vehicleType: 'Soğutmalı Tır',
      driver: {
        name: 'Mehmet Kaya',
        experience: '12 yıl',
        rating: 4.7
      }
    },
    {
      id: 'OFF-003',
      shipmentId: 'CORP-2024-002',
      carrier: {
        name: 'Express Kargo A.Ş.',
        rating: 4.9,
        logo: '/logo.svg',
        phone: '0555 555 55 55',
        email: 'info@expresskargo.com',
        isContracted: true // Anlaşmalı nakliyeci
      },
      route: 'İzmir → Bursa',
      cargo: 'Tekstil Ürünleri',
      weight: '1.8 ton',
      volume: '12 m³',
      price: 28500,
      currency: '₺',
      deliveryTime: '1 gün',
      pickupDate: '2024-01-15',
      deliveryDate: '2024-01-16',
      status: 'accepted',
      submittedAt: '2024-01-15 10:20',
      specialNotes: 'Hızlı teslimat garantisi',
      insurance: 'Premium sigorta',
      vehicleType: 'Kamyon',
      driver: {
        name: 'Ali Demir',
        experience: '6 yıl',
        rating: 4.8
      }
    },
    {
      id: 'OFF-004',
      shipmentId: 'CORP-2024-002',
      carrier: {
        name: 'Mega Lojistik Ltd.',
        rating: 4.4,
        logo: '/logo.svg',
        phone: '0555 444 44 44',
        email: 'info@megalojistik.com',
        isContracted: false // Genel nakliyeci
      },
      route: 'İzmir → Bursa',
      cargo: 'Tekstil Ürünleri',
      weight: '1.8 ton',
      volume: '12 m³',
      price: 32000,
      currency: '₺',
      deliveryTime: '2 gün',
      pickupDate: '2024-01-15',
      deliveryDate: '2024-01-17',
      status: 'pending',
      submittedAt: '2024-01-15 14:30',
      specialNotes: 'Ekonomik fiyat',
      insurance: 'Temel sigorta',
      vehicleType: 'Kamyon',
      driver: {
        name: 'Veli Özkan',
        experience: '5 yıl',
        rating: 4.3
      }
    },
    {
      id: 'OFF-005',
      shipmentId: 'CORP-2024-004',
      carrier: {
        name: 'Kimyasal Lojistik A.Ş.',
        rating: 4.9,
        logo: '/logo.svg',
        phone: '0555 555 55 55',
        email: 'info@kimyasallojistik.com',
        isContracted: true
      },
      route: 'İstanbul → Antalya',
      cargo: 'Kimyasal Ürünler',
      weight: '1.2 ton',
      volume: '10 m³',
      price: 2200,
      currency: '₺',
      deliveryTime: '3 gün',
      pickupDate: '2024-01-15',
      deliveryDate: '2024-01-18',
      status: 'pending',
      submittedAt: '2024-01-15 16:45',
      specialNotes: 'Özel kimyasal taşıma',
      insurance: 'Tam sigorta',
      vehicleType: 'Özel Kimyasal Kamyon',
      driver: {
        name: 'Mehmet Yılmaz',
        experience: '8 yıl',
        rating: 4.9
      }
    }
  ];

  const filteredOffers = offers.filter(offer => {
    if (filterStatus === 'all') {
      return true;
    } else if (filterStatus === 'contracted') {
      return offer.carrier.isContracted;
    } else if (filterStatus === 'general') {
      return !offer.carrier.isContracted;
    } else {
      return offer.status === filterStatus;
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'accepted':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Beklemede';
      case 'accepted':
        return 'Kabul Edildi';
      case 'rejected':
        return 'Reddedildi';
      default:
        return 'Bilinmiyor';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredOffers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOffers = filteredOffers.slice(startIndex, startIndex + itemsPerPage);

  const breadcrumbItems = [
    { label: 'Teklifler', icon: <FileText className="w-4 h-4" /> }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Breadcrumb */}
        <div className="mb-4 sm:mb-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Header - Mobile Optimized */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-2 sm:mb-3">
            Teklifleri{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-blue-900">Yönetin</span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-slate-600 px-4">Nakliyecilerden gelen teklifleri görüntüleyin ve yönetin</p>
        </div>

        {/* Filters Card - Mobile Optimized */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200 mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
            {/* Sol Taraf - Arama ve Filtreler */}
            <div className="flex-1 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Nakliyeci, rota veya yük ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 sm:py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 sm:py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm min-w-[140px]"
              >
                <option value="all">Tüm Durumlar</option>
                <option value="accepted">Kabul Edildi</option>
                <option value="rejected">Reddedildi</option>
                <option value="contracted">Anlaşmalı</option>
                <option value="general">Genel</option>
              </select>
            </div>

            {/* Sağ Taraf - Aksiyon Butonları - Mobile Optimized */}
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setShowComparison(!showComparison)}
                className="px-2 sm:px-3 py-2 sm:py-2.5 bg-slate-50 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium border border-slate-200"
              >
                <FileText className="w-4 h-4" />
                Karşılaştır
              </button>

              <button 
                onClick={() => setShowPriceAnalysis(!showPriceAnalysis)}
                className="px-2 sm:px-3 py-2 sm:py-2.5 bg-slate-50 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium border border-slate-200"
              >
                <TrendingUp className="w-4 h-4" />
                Fiyat Analizi
              </button>

              <button 
                onClick={() => navigate('/corporate/create-shipment')}
                className="px-2 sm:px-3 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Yeni Gönderi
              </button>

              <button 
                onClick={() => navigate('/corporate/carriers')}
                className="px-2 sm:px-3 py-2 sm:py-2.5 bg-slate-50 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium border border-slate-200"
              >
                <Users className="w-4 h-4" />
                Nakliyeciler
              </button>
            </div>
          </div>
        </div>

        {/* Offers List - Mobile Optimized */}
        <div className="space-y-3 sm:space-y-4">
          {isLoading ? (
            <LoadingState text="Teklifler yükleniyor..." />
          ) : paginatedOffers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Teklif bulunamadı"
              description="Arama kriterlerinize uygun teklif bulunamadı"
              action={{
                label: "Yeni Gönderi Oluştur",
                onClick: () => window.location.href = '/corporate/create-shipment',
                icon: Plus
              }}
            />
          ) : (
            paginatedOffers.map((offer) => (
              <div key={offer.id} className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
                  {/* Left Side - Offer Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Users className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
                        </div>
                        <div>
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 mb-1">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900">{offer.carrier.name}</h3>
                            {offer.carrier.isContracted && (
                              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full w-fit">
                                Anlaşmalı
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                            <div className="flex items-center space-x-1 sm:space-x-2">
                              <Star className="w-4 h-4 text-yellow-400 fill-current" />
                              <span className="text-xs sm:text-sm text-gray-600">{offer.carrier.rating}/5</span>
                            </div>
                            <span className="text-xs sm:text-sm text-gray-400 hidden sm:inline">•</span>
                            <span className="text-xs sm:text-sm text-gray-600">{offer.driver.experience} deneyim</span>
                            {!offer.carrier.isContracted && (
                              <span className="text-xs text-gray-500">• Genel Nakliyeci</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium flex items-center space-x-1 sm:space-x-2 ${getStatusColor(offer.status)}`}>
                        {getStatusIcon(offer.status)}
                        <span className="hidden sm:inline">{getStatusText(offer.status)}</span>
                        <span className="sm:hidden">{getStatusText(offer.status).split(' ')[0]}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-3 sm:mb-4">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs sm:text-sm text-gray-600">Rota</p>
                          <p className="font-medium text-gray-900 text-sm sm:text-base">{offer.route}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Package className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs sm:text-sm text-gray-600">Yük</p>
                          <p className="font-medium text-gray-900 text-sm sm:text-base">{offer.cargo}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs sm:text-sm text-gray-600">Teslimat</p>
                          <p className="font-medium text-gray-900 text-sm sm:text-base">{offer.deliveryTime}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs sm:text-sm text-gray-600">Fiyat</p>
                          <p className="font-medium text-gray-900 text-sm sm:text-base">{offer.price.toLocaleString()} {offer.currency}</p>
                        </div>
                      </div>
                    </div>

                    <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                      <p><span className="font-medium">Ağırlık:</span> {offer.weight} • <span className="font-medium">Hacim:</span> {offer.volume}</p>
                      <p><span className="font-medium">Araç:</span> {offer.vehicleType} • <span className="font-medium">Şoför:</span> {offer.driver.name}</p>
                      <p><span className="font-medium">Sigorta:</span> {offer.insurance}</p>
                      {offer.specialNotes && <p><span className="font-medium">Notlar:</span> {offer.specialNotes}</p>}
                    </div>
                  </div>

                  {/* Right Side - Actions - Mobile Optimized */}
                  <div className="flex flex-col space-y-2 lg:min-w-[200px]">
                    <div className="text-xs text-gray-500 text-left sm:text-right">
                      Teklif No: {offer.id}
                    </div>
                    <div className="text-xs text-gray-500 text-left sm:text-right">
                      Gönderi: {offer.shipmentId}
                    </div>
                    <div className="text-xs text-gray-500 text-left sm:text-right">
                      {new Date(offer.submittedAt).toLocaleString('tr-TR')}
                    </div>
                    
                    <div className="flex flex-col space-y-2 pt-3 border-t border-gray-100">
                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                        <button 
                          type="button"
                          onClick={() => {
                            // Teklif kabul edildi - gönderiler sayfasına yönlendir
                            window.location.href = `/corporate/shipments?accepted=${offer.shipmentId}`;
                          }}
                          className="flex-1 px-3 py-2 bg-gradient-to-r from-slate-800 to-blue-900 text-white rounded-md hover:from-slate-900 hover:to-blue-950 transition-all duration-200 text-xs font-medium flex items-center justify-center space-x-1 shadow-sm hover:shadow-md border-0 outline-none focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-opacity-50"
                        >
                          <CheckCircle className="w-3 h-3" />
                          <span>Kabul Et</span>
                        </button>
                        <button 
                          type="button"
                          onClick={() => {
                            // Teklif reddetme modalını aç
                            setOfferToReject(offer.id);
                            setShowRejectModal(true);
                          }}
                          className="flex-1 px-3 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-md hover:from-gray-200 hover:to-gray-300 transition-all duration-200 text-xs font-medium flex items-center justify-center space-x-1 shadow-sm hover:shadow-md border-0 outline-none focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50"
                        >
                          <XCircle className="w-3 h-3" />
                          <span>Reddet</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}

        {/* Teklif Karşılaştırma Modal */}
        <Modal
          isOpen={showComparison}
          onClose={() => setShowComparison(false)}
          title="Teklif Karşılaştırması"
          size="xl"
        >
          <div className="text-center py-8">
            <CheckSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Teklif Karşılaştırması</h3>
            <p className="text-slate-500">Teklif karşılaştırma özelliği geliştiriliyor...</p>
          </div>
        </Modal>

        {/* Fiyat Analizi Modal */}
        {showPriceAnalysis && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Fiyat Analizi</h2>
                <button
                  onClick={() => setShowPriceAnalysis(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-blue-50 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-blue-900">Ortalama Fiyat</h3>
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-3xl font-bold text-blue-900">
                    ₺{Math.round(filteredOffers.reduce((sum, offer) => sum + offer.price, 0) / filteredOffers.length).toLocaleString()}
                  </div>
                  <div className="text-sm text-blue-700">Tüm tekliflerin ortalaması</div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-green-900">En Düşük Fiyat</h3>
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-3xl font-bold text-green-900">
                    ₺{Math.min(...filteredOffers.map(offer => offer.price)).toLocaleString()}
                  </div>
                  <div className="text-sm text-green-700">En uygun teklif</div>
                </div>
                
                <div className="bg-red-50 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-red-900">En Yüksek Fiyat</h3>
                    <TrendingUp className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="text-3xl font-bold text-red-900">
                    ₺{Math.max(...filteredOffers.map(offer => offer.price)).toLocaleString()}
                  </div>
                  <div className="text-sm text-red-700">En pahalı teklif</div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Fiyat Dağılımı</h3>
                <div className="space-y-3">
                  {filteredOffers
                    .sort((a, b) => a.price - b.price)
                    .map((offer, index) => (
                    <div key={offer.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{offer.carrier.name}</div>
                          <div className="text-sm text-gray-500">{offer.vehicleType}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">₺{offer.price.toLocaleString()}</div>
                        <div className="text-sm text-gray-500">{offer.deliveryTime}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Teklif Reddetme Onay Modalı */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                Teklifi Reddet
              </h3>
              
              <p className="text-gray-600 text-center mb-6">
                Bu teklifi reddetmek istediğinizden emin misiniz?<br />
                <span className="text-sm text-gray-500">Teklif No: {offerToReject}</span>
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setOfferToReject(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
                >
                  İptal
                </button>
                <button
                  onClick={() => {
                    // Teklif reddedildi
                    setShowRejectModal(false);
                    setOfferToReject(null);
                    // Burada teklif reddetme işlemi yapılabilir
                    window.location.href = '/corporate/offers';
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium"
                >
                  Evet, Reddet
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        <SuccessMessage
          message={successMessage}
          isVisible={showSuccessMessage}
          onClose={() => setShowSuccessMessage(false)}
        />
      </div>
    </div>
  );
}
