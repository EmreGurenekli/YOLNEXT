import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Package, 
  Search, 
  Filter, 
  SortAsc, 
  Eye, 
  MapPin, 
  Clock, 
  Star, 
  Truck, 
  CheckCircle, 
  CheckCircle2,
  AlertCircle, 
  XCircle,
  ArrowRight,
  Calendar,
  Weight,
  Ruler,
  Building2,
  Target,
  TrendingUp,
  BarChart3,
  Download,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Share2,
  ChevronDown,
  ChevronUp,
  X,
  Navigation,
  FileText,
  Plus
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Breadcrumb from '../../components/common/Breadcrumb';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import Modal from '../../components/common/Modal';
import SuccessMessage from '../../components/common/SuccessMessage';
import Pagination from '../../components/common/Pagination';

export default function CorporateShipments() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [expandedItems, setExpandedItems] = useState<number[]>([]);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [selectedShipmentForTracking, setSelectedShipmentForTracking] = useState<number | null>(null);
  const [acceptedShipmentId, setAcceptedShipmentId] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedShipmentForDetails, setSelectedShipmentForDetails] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // URL parametresini oku ve kabul edilen gönderiyi işaretle
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const accepted = urlParams.get('accepted');
    if (accepted) {
      setAcceptedShipmentId(accepted);
      // URL'den parametreyi temizle
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  const handleViewDetails = (shipmentId: number) => {
    // Gönderi detay modalını aç
    setSelectedShipmentForDetails(shipmentId);
    setShowDetailsModal(true);
  };

  const handleTrackShipment = (shipmentId: number) => {
    setSelectedShipmentForTracking(shipmentId);
    setShowTrackingModal(true);
  };

  const handleMessage = (shipmentId: number) => {
    // Mesajlaşma sayfasına yönlendir
    navigate('/corporate/messages');
  };

  const toggleExpanded = (id: number) => {
    setExpandedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const shipments = [
    {
      id: 1,
      title: "Gıda Ürünleri - Soğuk Zincir",
      trackingCode: "CORP-2024-001",
      from: "Migros Depo - İstanbul",
      to: "Migros Mağaza - Ankara",
      status: "Yolda",
      statusColor: "bg-orange-500",
      statusText: "Yolda",
      carrier: "Kargo Express A.Ş.",
      rating: 4.9,
      offers: 5,
      createdAt: "2024-01-15",
      estimatedDelivery: "2024-01-16 09:00",
      progress: 75,
      priority: "Yüksek",
      category: "Gıda",
      subCategory: "Soğuk Zincir",
      weight: "2.5 ton",
      volume: "15 m³",
      value: "₺45,000",
      specialRequirements: ["Soğuk Taşıma", "Acil"],
      dimensions: "300x200x150 cm",
      insurance: "Tam Sigorta",
      paymentMethod: "Fatura",
      notes: "Özel soğuk zincir gereksinimleri var"
    },
    {
      id: 2,
      title: "Tekstil Ürünleri",
      trackingCode: "CORP-2024-002",
      from: "Migros Depo - İzmir",
      to: "Migros Mağaza - Bursa",
      status: "Yükleme",
      statusColor: "bg-blue-500",
      statusText: "Yükleme",
      carrier: "Hızlı Lojistik",
      rating: 4.7,
      offers: 3,
      createdAt: "2024-01-15",
      estimatedDelivery: "2024-01-15 18:00",
      progress: 25,
      priority: "Normal",
      category: "Tekstil",
      subCategory: "Giyim",
      weight: "1.8 ton",
      volume: "12 m³",
      value: "₺28,500",
      specialRequirements: ["Güvenli"],
      dimensions: "250x180x120 cm",
      insurance: "Kısmi Sigorta",
      paymentMethod: "Nakit",
      notes: "Kırılabilir ürünler mevcut"
    },
    {
      id: 3,
      title: "Elektronik Ürünler",
      trackingCode: "CORP-2024-003",
      from: "Migros Depo - Ankara",
      to: "Migros Mağaza - İzmir",
      status: "Teslim Edildi",
      statusColor: "bg-green-500",
      statusText: "Teslim Edildi",
      carrier: "Güvenli Taşımacılık",
      rating: 4.8,
      offers: 7,
      createdAt: "2024-01-14",
      estimatedDelivery: "2024-01-15 14:00",
      progress: 100,
      priority: "Düşük",
      category: "Elektronik",
      subCategory: "Bilgisayar",
      weight: "0.8 ton",
      volume: "8 m³",
      value: "₺67,200",
      specialRequirements: ["Kırılabilir", "Güvenli"],
      dimensions: "200x150x100 cm",
      insurance: "Tam Sigorta",
      paymentMethod: "Fatura",
      notes: "Elektronik cihazlar için özel ambalaj"
    },
    {
      id: 4,
      title: "Kimyasal Ürünler",
      trackingCode: "CORP-2024-004",
      from: "Migros Depo - İstanbul",
      to: "Migros Mağaza - Antalya",
      status: "Beklemede",
      statusColor: "bg-yellow-500",
      statusText: "Teklif Bekliyor",
      carrier: null,
      rating: null,
      offers: 0,
      createdAt: "2024-01-15",
      estimatedDelivery: "2024-01-17 10:00",
      progress: 0,
      priority: "Yüksek",
      category: "Kimyasal",
      subCategory: "Temizlik",
      weight: "1.2 ton",
      volume: "10 m³",
      value: "₺15,600",
      specialRequirements: ["Tehlikeli Madde", "Güvenli"],
      dimensions: "180x120x90 cm",
      insurance: "Tam Sigorta",
      paymentMethod: "Fatura",
      notes: "Tehlikeli madde sınıfı: Sınıf 3"
    }
  ];

  const filteredShipments = shipments.filter(shipment => {
    const matchesSearch = shipment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shipment.trackingCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shipment.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shipment.to.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && ['Yolda', 'Yükleme', 'Beklemede'].includes(shipment.status)) ||
                         (filterStatus === 'completed' && shipment.status === 'Teslim Edildi') ||
                         (filterStatus === 'pending' && shipment.status === 'Beklemede');
    
    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredShipments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedShipments = filteredShipments.slice(startIndex, startIndex + itemsPerPage);

  const breadcrumbItems = [
    { label: 'Gönderilerim', icon: <Package className="w-4 h-4" /> }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Yolda':
        return <Truck className="w-4 h-4" />;
      case 'Yükleme':
        return <Package className="w-4 h-4" />;
      case 'Teslim Edildi':
        return <CheckCircle className="w-4 h-4" />;
      case 'Beklemede':
        return <Clock className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Yüksek':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Normal':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Düşük':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Teslim Edildi':
        return 'bg-green-100 text-green-800';
      case 'Yolda':
        return 'bg-blue-100 text-blue-800';
      case 'Yükleme':
        return 'bg-orange-100 text-orange-800';
      case 'Beklemede':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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
              <Package className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-2 sm:mb-3">
            Gönderilerinizi{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-blue-900">Takip Edin</span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-slate-600 px-4">Gönderilerinizin durumunu takip edin ve yönetin</p>
        </div>

        {/* Filters Card - Mobile Optimized */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 shadow-xl border border-slate-200 mb-6 sm:mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Gönderi ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 sm:py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
              />
            </div>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="active">Aktif Gönderiler</option>
              <option value="completed">Tamamlanan</option>
              <option value="pending">Beklemede</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
            >
              <option value="date">Tarihe Göre</option>
              <option value="status">Duruma Göre</option>
              <option value="priority">Önceliğe Göre</option>
              <option value="value">Değere Göre</option>
            </select>

            <button className="px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base">
              <Filter className="w-4 h-4" />
              Filtrele
            </button>
          </div>
        </div>

        {/* Shipments Table - Mobile Optimized */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 shadow-xl border border-slate-200">
          
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Gönderi No</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Rota</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Durum</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Nakliyeci</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Fiyat</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-8">
                      <LoadingState text="Gönderiler yükleniyor..." />
                    </td>
                  </tr>
                ) : paginatedShipments.length > 0 ? (
                  paginatedShipments.map((shipment) => (
                    <tr key={shipment.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-mono text-sm font-semibold text-slate-900">{shipment.trackingCode}</div>
                        <div className="text-xs text-slate-500">{shipment.createdAt}</div>
                        <div className="text-xs text-slate-500">{shipment.title}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm font-medium text-slate-900">{shipment.from} → {shipment.to}</div>
                        <div className="text-xs text-slate-500">{shipment.category} - {shipment.subCategory}</div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          shipment.status === 'Teslim Edildi' ? 'bg-green-100 text-green-800' :
                          shipment.status === 'Yolda' ? 'bg-blue-100 text-blue-800' :
                          shipment.status === 'Yükleme' ? 'bg-orange-100 text-orange-800' :
                          acceptedShipmentId === shipment.trackingCode ? 'bg-emerald-100 text-emerald-800 animate-pulse' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {getStatusIcon(shipment.status)}
                          {acceptedShipmentId === shipment.trackingCode ? 'Kabul Edildi' : shipment.statusText}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm font-medium text-slate-900">{shipment.carrier || 'Atanmamış'}</div>
                        {shipment.carrier && (
                          <div className="text-xs text-slate-500">{shipment.rating}/5 ⭐</div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm font-bold text-slate-900">{shipment.value}</div>
                        <div className="text-xs text-slate-500">{shipment.weight} • {shipment.volume}</div>
                        <div className="text-xs text-slate-500">{shipment.estimatedDelivery}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleViewDetails(shipment.id)}
                            className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-medium rounded-lg transition-colors"
                          >
                            Detay
                          </button>
                          {shipment.status !== 'Beklemede' && (
                            <button 
                              onClick={() => handleTrackShipment(shipment.id)}
                              className="px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 text-xs font-medium rounded-lg transition-colors"
                            >
                              Takip
                            </button>
                          )}
                          <button 
                            onClick={() => handleMessage(shipment.id)}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors"
                          >
                            Mesaj
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <EmptyState
                        icon={<Package className="w-8 h-8 text-slate-400" />}
                        title="Gönderi bulunamadı"
                        description="Arama kriterlerinize uygun gönderi bulunamadı"
                        action={{
                          label: "Yeni Gönderi Oluştur",
                          onClick: () => window.location.href = '/corporate/create-shipment'
                        }}
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-4">
            {filteredShipments.map((shipment) => (
              <div key={shipment.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-mono text-sm font-semibold text-slate-900">#{shipment.trackingCode}</div>
                    <div className="text-xs text-slate-500">{shipment.createdAt}</div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(shipment.status)}`}>
                    {shipment.statusText}
                  </span>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-slate-900">{shipment.from} → {shipment.to}</span>
                  </div>
                  <div className="text-xs text-slate-500">{shipment.title}</div>
                  
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                      <Truck className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-900">{shipment.carrier}</div>
                      <div className="text-xs text-slate-500">{shipment.rating}/5 ⭐</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-slate-900">{shipment.value}</div>
                      <div className="text-xs text-slate-500">{shipment.estimatedDelivery}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500">%{shipment.progress} tamamlandı</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => setSelectedShipmentForTracking(shipment.id)}
                    className="flex-1 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-medium rounded-lg transition-colors"
                  >
                    Takip Et
                  </button>
                  <button 
                    onClick={() => setSelectedShipmentForDetails(shipment.id)}
                    className="flex-1 px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 text-xs font-medium rounded-lg transition-colors"
                  >
                    Detay
                  </button>
                  <button className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors">
                    Mesaj
                  </button>
                </div>
              </div>
            ))}
          </div>
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

        {/* Takip Modal */}
        {showTrackingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Gönderi Takibi</h2>
                <button
                  onClick={() => setShowTrackingModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {selectedShipmentForTracking && (
                <>
                  {/* Gönderi Bilgileri */}
                  <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {shipments.find(s => s.id === selectedShipmentForTracking)?.title}
                        </h3>
                        <p className="text-gray-600">
                          Takip Kodu: {shipments.find(s => s.id === selectedShipmentForTracking)?.trackingCode}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4 text-blue-500" />
                            <span className="text-sm text-gray-600">
                              {shipments.find(s => s.id === selectedShipmentForTracking)?.from} → {shipments.find(s => s.id === selectedShipmentForTracking)?.to}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-orange-500" />
                            <span className="text-sm text-gray-600">
                              {shipments.find(s => s.id === selectedShipmentForTracking)?.estimatedDelivery}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          shipments.find(s => s.id === selectedShipmentForTracking)?.statusColor === 'bg-green-500' ? 'bg-green-100 text-green-800' :
                          shipments.find(s => s.id === selectedShipmentForTracking)?.statusColor === 'bg-orange-500' ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {shipments.find(s => s.id === selectedShipmentForTracking)?.statusText}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          %{shipments.find(s => s.id === selectedShipmentForTracking)?.progress} tamamlandı
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Takip Geçmişi */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Takip Geçmişi</h3>
                    
                    {/* Mock Takip Geçmişi */}
                    {[
                      {
                        id: 1,
                        status: 'completed',
                        title: 'Gönderi Teslim Edildi',
                        description: 'Gönderi başarıyla teslim edildi. Müşteri imzası alındı.',
                        timestamp: '2024-01-16 09:30',
                        location: 'Ankara, Türkiye',
                        icon: CheckCircle
                      },
                      {
                        id: 2,
                        status: 'in-progress',
                        title: 'Teslimat Merkezinde',
                        description: 'Gönderi teslimat merkezine ulaştı. Dağıtım için hazırlanıyor.',
                        timestamp: '2024-01-16 08:15',
                        location: 'Ankara Teslimat Merkezi',
                        icon: Truck
                      },
                      {
                        id: 3,
                        status: 'in-progress',
                        title: 'Yolda',
                        description: 'Gönderi nakliye aracında. Hedef şehre doğru ilerliyor.',
                        timestamp: '2024-01-15 16:45',
                        location: 'İstanbul - Ankara Yolu',
                        icon: Navigation
                      },
                      {
                        id: 4,
                        status: 'completed',
                        title: 'Yükleme Tamamlandı',
                        description: 'Gönderi başarıyla yüklendi. Yola çıktı.',
                        timestamp: '2024-01-15 14:20',
                        location: 'İstanbul Depo',
                        icon: Package
                      },
                      {
                        id: 5,
                        status: 'completed',
                        title: 'Gönderi Alındı',
                        description: 'Gönderi nakliyeci tarafından alındı.',
                        timestamp: '2024-01-15 10:30',
                        location: 'İstanbul, Türkiye',
                        icon: CheckCircle2
                      }
                    ].map((tracking, index) => (
                      <div key={tracking.id} className="flex items-start space-x-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          tracking.status === 'completed' ? 'bg-green-100' : 'bg-blue-100'
                        }`}>
                          <tracking.icon className={`w-5 h-5 ${
                            tracking.status === 'completed' ? 'text-green-600' : 'text-blue-600'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold text-gray-900">{tracking.title}</h4>
                            <span className="text-sm text-gray-500">{tracking.timestamp}</span>
                          </div>
                          <p className="text-gray-700 mb-1">{tracking.description}</p>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <MapPin className="w-4 h-4" />
                            <span>{tracking.location}</span>
                          </div>
                        </div>
                        {index < 4 && (
                          <div className="w-px h-16 bg-gray-200 ml-5"></div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Canlı Takip */}
                  <div className="mt-8 bg-blue-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Canlı Takip</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white rounded-lg p-4 border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Navigation className="w-5 h-5 text-blue-600" />
                          <span className="font-semibold text-gray-900">Mevcut Konum</span>
                        </div>
                        <p className="text-sm text-gray-600">Ankara Çevre Yolu</p>
                        <p className="text-xs text-gray-500">Son güncelleme: 2 dakika önce</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-5 h-5 text-orange-600" />
                          <span className="font-semibold text-gray-900">Tahmini Varış</span>
                        </div>
                        <p className="text-sm text-gray-600">09:30 - 10:00</p>
                        <p className="text-xs text-gray-500">Bugün</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Truck className="w-5 h-5 text-green-600" />
                          <span className="font-semibold text-gray-900">Araç Bilgisi</span>
                        </div>
                        <p className="text-sm text-gray-600">34 ABC 123</p>
                        <p className="text-xs text-gray-500">Soğutmalı Tır</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Gönderi Detay Modalı */}
        {showDetailsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between mb-6 border-b border-gray-200 pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Gönderi Detayları</h2>
                  <p className="text-gray-600 mt-1">Kurumsal gönderi bilgileri ve takip detayları</p>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              {(() => {
                const shipment = shipments.find(s => s.id === selectedShipmentForDetails);
                if (!shipment) return null;

                return (
                  <div className="space-y-6">
                    {/* Gönderi Özeti */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-2">{shipment.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Package className="w-4 h-4" />
                              Takip No: {shipment.trackingCode}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              Oluşturulma: {shipment.createdAt}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                            shipment.status === 'Teslim Edildi' ? 'bg-green-100 text-green-800' :
                            shipment.status === 'Yolda' ? 'bg-blue-100 text-blue-800' :
                            shipment.status === 'Yükleme' ? 'bg-orange-100 text-orange-800' :
                            acceptedShipmentId === shipment.trackingCode ? 'bg-emerald-100 text-emerald-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {acceptedShipmentId === shipment.trackingCode ? 'Kabul Edildi' : shipment.statusText}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Ana Bilgiler */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Rota Bilgileri */}
                      <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <MapPin className="w-5 h-5 text-blue-600" />
                          <h4 className="text-lg font-semibold text-gray-900">Rota Bilgileri</h4>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                            <div>
                              <p className="font-medium text-gray-900">Yükleme Noktası</p>
                              <p className="text-gray-600">{shipment.from}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                            <div>
                              <p className="font-medium text-gray-900">Teslimat Noktası</p>
                              <p className="text-gray-600">{shipment.to}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">Tahmini Teslimat: {shipment.estimatedDelivery}</span>
                          </div>
                        </div>
                      </div>

                      {/* Kargo Bilgileri */}
                      <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <Package className="w-5 h-5 text-purple-600" />
                          <h4 className="text-lg font-semibold text-gray-900">Kargo Bilgileri</h4>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Kategori:</span>
                            <span className="font-medium text-gray-900">{shipment.category}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Alt Kategori:</span>
                            <span className="font-medium text-gray-900">{shipment.subCategory}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Ağırlık:</span>
                            <span className="font-medium text-gray-900">{shipment.weight}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Hacim:</span>
                            <span className="font-medium text-gray-900">{shipment.volume}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Değer:</span>
                            <span className="font-medium text-gray-900">{shipment.value}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Nakliyeci Bilgileri */}
                    {shipment.carrier && (
                      <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <Truck className="w-5 h-5 text-blue-600" />
                          <h4 className="text-lg font-semibold text-gray-900">Nakliyeci Bilgileri</h4>
                        </div>
                        <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h5 className="font-semibold text-gray-900 text-lg">{shipment.carrier}</h5>
                            <div className="flex items-center gap-4 mt-2">
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-500" />
                                <span className="text-sm font-medium text-gray-700">{shipment.rating}/5 Puan</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span className="text-sm text-gray-600">Güvenilir Nakliyeci</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Özel Gereksinimler ve Notlar */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Özel Gereksinimler */}
                      {shipment.specialRequirements && shipment.specialRequirements.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-xl p-6">
                          <div className="flex items-center gap-2 mb-4">
                            <AlertCircle className="w-5 h-5 text-orange-600" />
                            <h4 className="text-lg font-semibold text-gray-900">Özel Gereksinimler</h4>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {shipment.specialRequirements.map((req, index) => (
                              <span key={index} className="px-3 py-2 bg-orange-100 text-orange-800 rounded-lg text-sm font-medium border border-orange-200">
                                {req}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Notlar */}
                      {shipment.notes && (
                        <div className="bg-white border border-gray-200 rounded-xl p-6">
                          <div className="flex items-center gap-2 mb-4">
                            <FileText className="w-5 h-5 text-gray-600" />
                            <h4 className="text-lg font-semibold text-gray-900">Özel Notlar</h4>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-gray-700 leading-relaxed">{shipment.notes}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
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