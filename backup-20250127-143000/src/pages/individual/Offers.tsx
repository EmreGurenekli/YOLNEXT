import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  DollarSign, 
  Star, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  MessageCircle,
  Eye,
  User,
  MapPin,
  Package,
  Calendar,
  Users,
  Award,
  X,
  Phone,
  Mail,
  MapPin as Location
} from 'lucide-react';

interface Offer {
  id: string;
  carrierName: string;
  companyName: string;
  rating: number;
  totalShipments: number;
  responseTime: string;
  successRate: number;
  status: 'pending' | 'accepted' | 'rejected';
  price: number;
  originalPrice: number;
  discount: number;
  estimatedDelivery: string;
  message: string;
  vehicleType: string;
  vehicleCapacity: string;
  distance: number;
  availableDate: string;
  contact: {
    phone: string;
    email: string;
    location: string;
  };
  specialServices: string[];
  notes: string;
  isRecommended?: boolean;
}

const IndividualOffers: React.FC = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Mock data - Bireysel gönderici için gerçekçi veriler
  const mockOffers: Offer[] = [
    {
      id: '1',
      carrierName: 'Ahmet Kaya',
      companyName: 'Hızlı Nakliyat',
      rating: 4.8,
      totalShipments: 1247,
      responseTime: '2 saat',
      successRate: 98.5,
      status: 'pending',
      price: 1250,
      originalPrice: 1500,
      discount: 16.7,
      estimatedDelivery: '2 gün içinde',
      message: 'Güvenilir ve hızlı taşımacılık hizmeti sunuyorum.',
      vehicleType: 'Van',
      vehicleCapacity: '15 m³',
      distance: 12.8,
      availableDate: 'Bugün',
      contact: {
        phone: '+90 532 123 45 67',
        email: 'ahmet@hizlinakliyat.com',
        location: 'İstanbul, Türkiye'
      },
      specialServices: ['Sigorta', 'Takip'],
      notes: '7/24 müşteri hizmetleri',
      isRecommended: true
    },
    {
      id: '2',
      carrierName: 'Mehmet Yılmaz',
      companyName: 'Güvenli Taşıma',
      rating: 4.9,
      totalShipments: 2156,
      responseTime: '1 saat',
      successRate: 99.1,
      status: 'pending',
      price: 1450,
      originalPrice: 1800,
      discount: 19.4,
      estimatedDelivery: '3 gün içinde',
      message: 'Profesyonel ekibimizle güvenli taşımacılık.',
      vehicleType: 'Kamyon',
      vehicleCapacity: '25 m³',
      distance: 8.5,
      availableDate: 'Yarın',
      contact: {
        phone: '+90 534 456 78 90',
        email: 'mehmet@guvenlitasi.com',
        location: 'Ankara, Türkiye'
      },
      specialServices: ['Sigorta', 'Takip', 'Ambalaj'],
      notes: 'Özel koruma sağlanır',
      isRecommended: true
    },
    {
      id: '3',
      carrierName: 'Fatma Demir',
      companyName: 'Express Kargo',
      rating: 4.6,
      totalShipments: 892,
      responseTime: '4 saat',
      successRate: 96.2,
      status: 'accepted',
      price: 2100,
      originalPrice: 2500,
      discount: 16,
      estimatedDelivery: '4 gün içinde',
      message: 'Hızlı ve güvenli teslimat garantisi.',
      vehicleType: 'Kamyon',
      vehicleCapacity: '30 m³',
      distance: 15.2,
      availableDate: '2 gün sonra',
      contact: {
        phone: '+90 533 987 65 43',
        email: 'fatma@expresskargo.com',
        location: 'İzmir, Türkiye'
      },
      specialServices: ['Sigorta', 'Takip'],
      notes: 'Anlık takip sistemi'
    },
    {
      id: '4',
      carrierName: 'Ali Çelik',
      companyName: 'Ekonomik Taşıma',
      rating: 4.4,
      totalShipments: 634,
      responseTime: '6 saat',
      successRate: 94.8,
      status: 'rejected',
      price: 890,
      originalPrice: 1200,
      discount: 25.8,
      estimatedDelivery: '1 gün içinde',
      message: 'En uygun fiyat garantisi ile hizmet.',
      vehicleType: 'Van',
      vehicleCapacity: '12 m³',
      distance: 5.3,
      availableDate: 'Bugün',
      contact: {
        phone: '+90 536 345 67 89',
        email: 'ali@ekonomiktasi.com',
        location: 'Bursa, Türkiye'
      },
      specialServices: ['Takip'],
      notes: 'Ekonomik fiyatlar'
    }
  ];

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setOffers(mockOffers);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleAcceptOffer = (offerId: string) => {
    setOffers(prev => prev.map(offer => 
      offer.id === offerId ? { ...offer, status: 'accepted' as const } : offer
    ));
  };

  const handleRejectOffer = (offerId: string) => {
    setOffers(prev => prev.map(offer => 
      offer.id === offerId ? { ...offer, status: 'rejected' as const } : offer
    ));
  };

  const handleViewDetails = (offer: Offer) => {
    setSelectedOffer(offer);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedOffer(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'Onaylandı';
      case 'rejected':
        return 'Reddedildi';
      case 'pending':
        return 'Beklemede';
      default:
        return 'İnceleniyor';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <DollarSign className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Teklifler yükleniyor...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Helmet>
        <title>Tekliflerim - YolNet</title>
        <meta name="description" content="Gönderileriniz için gelen teklifleri değerlendirin" />
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Gönderileriniz için{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-indigo-700">
              Gelen Teklifler
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Nakliyecilerden gelen teklifleri değerlendirin ve en uygun seçimi yapın
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{offers.length}</div>
                <div className="text-sm text-gray-600">Toplam Teklif</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{offers.filter(o => o.status === 'pending').length}</div>
                <div className="text-sm text-gray-600">Beklemede</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{offers.filter(o => o.status === 'accepted').length}</div>
                <div className="text-sm text-gray-600">Kabul Edilen</div>
              </div>
            </div>
          </div>
        </div>

        {/* Offers List */}
        <div className="space-y-6">
          {offers.map((offer) => (
            <div key={offer.id} className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-center gap-6 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{offer.carrierName}</h3>
                          <p className="text-sm text-gray-600">{offer.companyName}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm font-medium text-gray-900">{offer.rating}/5</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{offer.responseTime}</span>
                      </div>
                      
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(offer.status)}`}>
                        {getStatusText(offer.status)}
                      </span>
                      
                      {offer.isRecommended && (
                        <span className="px-2 py-1 text-xs font-medium bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 rounded-full">
                          Önerilen
                        </span>
                      )}
                    </div>

                    {/* Route and Package Info */}
                    <div className="flex items-center gap-8 mb-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-700">İstanbul → Ankara</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-700">{offer.vehicleType} - {offer.vehicleCapacity}</span>
                      </div>
                    </div>

                    {/* Delivery and Validity */}
                    <div className="flex items-center gap-8 mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Teslimat:</span>
                        <span className="text-sm font-medium text-gray-900">{offer.estimatedDelivery}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Müsait:</span>
                        <span className="text-sm font-medium text-green-600">{offer.availableDate}</span>
                      </div>
                    </div>

                    {/* Carrier Info */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Toplam Gönderi:</span>
                          <span className="ml-2 font-medium text-gray-900">{offer.totalShipments}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Başarı Oranı:</span>
                          <span className="ml-2 font-medium text-gray-900">%{offer.successRate}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Yanıt Süresi:</span>
                          <span className="ml-2 font-medium text-gray-900">{offer.responseTime}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Mesafe:</span>
                          <span className="ml-2 font-medium text-gray-900">{offer.distance} km</span>
                        </div>
                      </div>
                    </div>

                    {/* Special Services */}
                    {offer.specialServices.length > 0 && (
                      <div className="flex items-center gap-2 mb-4">
                        <Package className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Özel Hizmetler:</span>
                        <div className="flex gap-2">
                          {offer.specialServices.map((service, index) => (
                            <span key={index} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                              {service}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Message */}
                    <div className="bg-blue-50 rounded-lg p-3 mb-4">
                      <p className="text-sm text-gray-700 italic">"{offer.message}"</p>
                    </div>

                    {/* Status specific info */}
                    {offer.status === 'accepted' && (
                      <div className="flex items-center gap-2 mb-4">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-700 font-medium">Onaylandı - {offer.estimatedDelivery} içinde teslimat</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Price and Actions */}
                  <div className="text-right ml-8">
                    <div className="mb-2">
                      <div className="text-3xl font-bold text-gray-900">₺{offer.price.toLocaleString()}</div>
                      {offer.discount > 0 && (
                        <div className="text-sm text-gray-500 line-through">₺{offer.originalPrice.toLocaleString()}</div>
                      )}
                      {offer.discount > 0 && (
                        <div className="text-sm text-green-600 font-medium">%{offer.discount} indirim</div>
                      )}
                    </div>
                    
                    {offer.status === 'pending' ? (
                      <div className="space-y-2">
                        <button
                          onClick={() => handleAcceptOffer(offer.id)}
                          className="w-full px-6 py-3 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Kabul Et
                        </button>
                        <button
                          onClick={() => handleRejectOffer(offer.id)}
                          className="w-full px-6 py-3 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Reddet
                        </button>
                      </div>
                    ) : offer.status === 'accepted' ? (
                      <div className="space-y-2">
                        <button 
                          onClick={() => handleViewDetails(offer)}
                          className="w-full px-6 py-3 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          Detayları Gör
                        </button>
                        <button className="w-full px-6 py-3 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
                          Soru Sor
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <button 
                          onClick={() => handleViewDetails(offer)}
                          className="w-full px-6 py-3 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          Detayları Gör
                        </button>
                        <button className="w-full px-6 py-3 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
                          Soru Sor
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {offers.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <DollarSign className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">Teklif bulunamadı</h3>
            <p className="text-gray-600 mb-8">Henüz gönderiniz için teklif gelmemiş.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && selectedOffer && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black bg-opacity-40 transition-opacity" onClick={closeModal}></div>
          
          {/* Modal Content */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-gray-100">
              {/* Modal Header */}
              <div className="px-8 py-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center">
                      <User className="w-10 h-10 text-slate-600" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-slate-900 mb-1">{selectedOffer.carrierName}</h2>
                      <p className="text-xl text-slate-600 mb-2">{selectedOffer.companyName}</p>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Star className="w-5 h-5 text-amber-500" />
                          <span className="text-lg font-semibold text-slate-900">{selectedOffer.rating}/5</span>
                        </div>
                        <div className="w-px h-4 bg-slate-300"></div>
                        <span className="text-slate-600">{selectedOffer.totalShipments} gönderi</span>
                        <div className="w-px h-4 bg-slate-300"></div>
                        <span className="text-slate-600">%{selectedOffer.successRate} başarı</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={closeModal}
                    className="p-3 hover:bg-slate-100 rounded-2xl transition-colors"
                  >
                    <X className="w-6 h-6 text-slate-500" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Sol Kolon - Performans */}
                  <div className="space-y-6">
                    <div className="bg-slate-50 rounded-2xl p-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-6">Performans</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center py-3 border-b border-slate-200">
                          <span className="text-slate-600">Müşteri Puanı</span>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-amber-500" />
                            <span className="font-semibold text-slate-900">{selectedOffer.rating}/5</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-slate-200">
                          <span className="text-slate-600">Toplam Gönderi</span>
                          <span className="font-semibold text-slate-900">{selectedOffer.totalShipments}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-slate-200">
                          <span className="text-slate-600">Başarı Oranı</span>
                          <span className="font-semibold text-green-600">%{selectedOffer.successRate}</span>
                        </div>
                        <div className="flex justify-between items-center py-3">
                          <span className="text-slate-600">Yanıt Süresi</span>
                          <span className="font-semibold text-slate-900">{selectedOffer.responseTime}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-6">İletişim</h3>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <Phone className="w-5 h-5 text-slate-500" />
                          <span className="text-slate-900">{selectedOffer.contact.phone}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Mail className="w-5 h-5 text-slate-500" />
                          <span className="text-slate-900">{selectedOffer.contact.email}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Location className="w-5 h-5 text-slate-500" />
                          <span className="text-slate-900">{selectedOffer.contact.location}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Orta Kolon - Gönderi Detayları */}
                  <div className="space-y-6">
                    <div className="bg-slate-50 rounded-2xl p-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-6">Gönderi Detayları</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center py-3 border-b border-slate-200">
                          <span className="text-slate-600">Rota</span>
                          <span className="font-semibold text-slate-900">İstanbul → Ankara</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-slate-200">
                          <span className="text-slate-600">Araç Türü</span>
                          <span className="font-semibold text-slate-900">{selectedOffer.vehicleType}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-slate-200">
                          <span className="text-slate-600">Kapasite</span>
                          <span className="font-semibold text-slate-900">{selectedOffer.vehicleCapacity}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-slate-200">
                          <span className="text-slate-600">Mesafe</span>
                          <span className="font-semibold text-slate-900">{selectedOffer.distance} km</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-slate-200">
                          <span className="text-slate-600">Teslimat</span>
                          <span className="font-semibold text-green-600">{selectedOffer.estimatedDelivery}</span>
                        </div>
                        <div className="flex justify-between items-center py-3">
                          <span className="text-slate-600">Müsait</span>
                          <span className="font-semibold text-blue-600">{selectedOffer.availableDate}</span>
                        </div>
                      </div>
                    </div>

                    {selectedOffer.specialServices.length > 0 && (
                      <div className="bg-slate-50 rounded-2xl p-6">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Özel Hizmetler</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedOffer.specialServices.map((service, index) => (
                            <span key={index} className="px-3 py-1 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium">
                              {service}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sağ Kolon - Fiyat ve Mesaj */}
                  <div className="space-y-6">
                    <div className="bg-slate-900 rounded-2xl p-6 text-white">
                      <h3 className="text-lg font-semibold mb-6">Fiyat</h3>
                      <div className="text-center">
                        <div className="text-4xl font-bold mb-2">₺{selectedOffer.price.toLocaleString()}</div>
                        {selectedOffer.discount > 0 && (
                          <div className="text-slate-400 line-through text-lg mb-2">₺{selectedOffer.originalPrice.toLocaleString()}</div>
                        )}
                        {selectedOffer.discount > 0 && (
                          <div className="text-amber-400 font-semibold text-lg">%{selectedOffer.discount} indirim</div>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">Mesaj</h3>
                      <p className="text-slate-700 italic leading-relaxed">"{selectedOffer.message}"</p>
                      {selectedOffer.notes && (
                        <p className="text-slate-600 mt-3 text-sm">{selectedOffer.notes}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-8 py-6 border-t border-gray-100 bg-slate-50 rounded-b-3xl">
                <div className="flex items-center justify-end gap-4">
                  <button
                    onClick={closeModal}
                    className="px-8 py-3 border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-white transition-colors"
                  >
                    Kapat
                  </button>
                  <button className="px-8 py-3 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-colors">
                    Mesaj Gönder
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IndividualOffers;