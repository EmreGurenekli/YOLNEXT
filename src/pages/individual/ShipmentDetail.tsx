import React, { useState, useEffect } from 'react';
import { Package, MapPin, Calendar, Clock, Weight, DollarSign, Truck, User, Phone, MessageSquare, Star, CheckCircle, AlertCircle, XCircle, RefreshCw, Download, Share2, Edit, Trash2, ArrowLeft, ArrowRight, Eye, EyeOff, Info, ExternalLink } from 'lucide-react';
import { realApiService } from '../../services/realApi';
import { useNavigate, useParams } from 'react-router-dom';

interface ShipmentDetail {
  id: string;
  title: string;
  description: string;
  trackingCode: string;
  status: 'pending' | 'bidding' | 'accepted' | 'in_progress' | 'delivered' | 'cancelled';
  priority: 'urgent' | 'high' | 'normal' | 'low';
  fromAddress: {
    name: string;
    address: string;
    city: string;
    district: string;
    postalCode: string;
    phone: string;
  };
  toAddress: {
    name: string;
    address: string;
    city: string;
    district: string;
    postalCode: string;
    phone: string;
  };
  cargoDetails: {
    type: 'ev_esyasi' | 'kisisel' | 'ciftci' | 'is_yeri' | 'ozel';
    weight: number;
    volume: number;
    value: number;
    description: string;
  };
  schedule: {
    preferredDate: string;
    timePreference: 'herhangi' | 'sabah' | 'ogleden_sonra' | 'aksam';
    estimatedDelivery: string;
    actualDelivery?: string;
  };
  carrier?: {
    id: string;
    name: string;
    company: string;
    phone: string;
    email: string;
    rating: number;
    avatar?: string;
  };
  offers: Offer[];
  tracking: TrackingUpdate[];
  documents: Document[];
  createdAt: string;
  updatedAt: string;
}

interface Offer {
  id: string;
  carrierId: string;
  carrierName: string;
  carrierCompany: string;
  price: number;
  message: string;
  estimatedDelivery: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  createdAt: string;
}

interface TrackingUpdate {
  id: string;
  status: string;
  location: string;
  description: string;
  timestamp: string;
  isDelivered: boolean;
}

interface Document {
  id: string;
  name: string;
  type: 'contract' | 'invoice' | 'receipt' | 'other';
  url: string;
  uploadedAt: string;
}

const mockShipmentDetail: ShipmentDetail = {
  id: 'SHP001',
  title: 'Ev Eşyası Taşıma',
  description: 'İstanbul\'dan Ankara\'ya ev eşyası taşımacılığı. Mobilyalar, elektronik eşyalar ve kişisel eşyalar.',
  trackingCode: 'TRK789012',
  status: 'in_progress',
  priority: 'high',
  fromAddress: {
    name: 'Ahmet Yılmaz',
    address: 'Kadıköy Mahallesi, Moda Caddesi No:123 Daire:5',
    city: 'İstanbul',
    district: 'Kadıköy',
    postalCode: '34710',
    phone: '+90 555 123 4567'
  },
  toAddress: {
    name: 'Fatma Demir',
    address: 'Çankaya Mahallesi, Atatürk Bulvarı No:456 Daire:12',
    city: 'Ankara',
    district: 'Çankaya',
    postalCode: '06680',
    phone: '+90 555 987 6543'
  },
  cargoDetails: {
    type: 'ev_esyasi',
    weight: 500,
    volume: 10,
    value: 50000,
    description: '3+1 ev eşyası, mobilyalar, elektronik eşyalar'
  },
  schedule: {
    preferredDate: '2024-07-20T10:00:00Z',
    timePreference: 'sabah',
    estimatedDelivery: '2024-07-22T18:00:00Z',
    actualDelivery: undefined
  },
  carrier: {
    id: 'CAR001',
    name: 'Hızlı Kargo A.Ş.',
    company: 'Hızlı Kargo',
    phone: '+90 212 555 0123',
    email: 'info@hizlikargo.com',
    rating: 4.8,
    avatar: '/avatars/carrier1.jpg'
  },
  offers: [
    {
      id: 'OFF001',
      carrierId: 'CAR001',
      carrierName: 'Hızlı Kargo A.Ş.',
      carrierCompany: 'Hızlı Kargo',
      price: 1200,
      message: 'En uygun fiyat garantisi ile hizmetinizdeyiz.',
      estimatedDelivery: '2024-07-22T18:00:00Z',
      status: 'accepted',
      createdAt: '2024-07-17T10:30:00Z'
    },
    {
      id: 'OFF002',
      carrierId: 'CAR002',
      carrierName: 'Güven Lojistik',
      carrierCompany: 'Güven Taşımacılık',
      price: 1350,
      message: 'Güvenli ve hızlı taşıma hizmeti.',
      estimatedDelivery: '2024-07-23T12:00:00Z',
      status: 'rejected',
      createdAt: '2024-07-17T11:15:00Z'
    }
  ],
  tracking: [
    {
      id: 'TRK001',
      status: 'Gönderi Oluşturuldu',
      location: 'İstanbul',
      description: 'Gönderiniz oluşturuldu ve taşıyıcıya atandı.',
      timestamp: '2024-07-17T10:30:00Z',
      isDelivered: false
    },
    {
      id: 'TRK002',
      status: 'Teklif Kabul Edildi',
      location: 'İstanbul',
      description: 'Hızlı Kargo A.Ş. teklifi kabul edildi.',
      timestamp: '2024-07-17T14:20:00Z',
      isDelivered: false
    },
    {
      id: 'TRK003',
      status: 'Toplama Merkezinde',
      location: 'İstanbul',
      description: 'Gönderiniz toplama merkezine ulaştı.',
      timestamp: '2024-07-18T09:00:00Z',
      isDelivered: false
    },
    {
      id: 'TRK004',
      status: 'Yolda',
      location: 'Eskişehir',
      description: 'Gönderiniz Eskişehir\'e ulaştı.',
      timestamp: '2024-07-20T10:30:00Z',
      isDelivered: false
    }
  ],
  documents: [
    {
      id: 'DOC001',
      name: 'Taşıma Sözleşmesi',
      type: 'contract',
      url: '/documents/contract-shp001.pdf',
      uploadedAt: '2024-07-17T14:20:00Z'
    },
    {
      id: 'DOC002',
      name: 'Fatura',
      type: 'invoice',
      url: '/documents/invoice-shp001.pdf',
      uploadedAt: '2024-07-17T15:00:00Z'
    }
  ],
  createdAt: '2024-07-17T10:00:00Z',
  updatedAt: '2024-07-20T10:30:00Z'
};

const getStatusInfo = (status: ShipmentDetail['status']) => {
  switch (status) {
    case 'pending': return { text: 'Beklemede', color: 'orange', icon: <Clock className="w-5 h-5" /> };
    case 'bidding': return { text: 'Teklifler Alındı', color: 'blue', icon: <DollarSign className="w-5 h-5" /> };
    case 'accepted': return { text: 'Kabul Edildi', color: 'purple', icon: <CheckCircle className="w-5 h-5" /> };
    case 'in_progress': return { text: 'Yolda', color: 'green', icon: <Truck className="w-5 h-5" /> };
    case 'delivered': return { text: 'Teslim Edildi', color: 'gray', icon: <Package className="w-5 h-5" /> };
    case 'cancelled': return { text: 'İptal Edildi', color: 'red', icon: <XCircle className="w-5 h-5" /> };
    default: return { text: 'Bilinmiyor', color: 'gray', icon: <AlertCircle className="w-5 h-5" /> };
  }
};

const getPriorityInfo = (priority: ShipmentDetail['priority']) => {
  switch (priority) {
    case 'urgent': return { text: 'Acil', color: 'red' };
    case 'high': return { text: 'Yüksek', color: 'orange' };
    case 'normal': return { text: 'Normal', color: 'blue' };
    case 'low': return { text: 'Düşük', color: 'gray' };
    default: return { text: 'Bilinmiyor', color: 'gray' };
  }
};

const getCargoTypeInfo = (type: ShipmentDetail['cargoDetails']['type']) => {
  switch (type) {
    case 'ev_esyasi': return { text: 'Ev Eşyası', icon: '🏠' };
    case 'kisisel': return { text: 'Kişisel', icon: '📦' };
    case 'ciftci': return { text: 'Çiftçi', icon: '🚜' };
    case 'is_yeri': return { text: 'İş Yeri', icon: '🏢' };
    case 'ozel': return { text: 'Özel', icon: '✨' };
    default: return { text: 'Diğer', icon: '❓' };
  }
};

const IndividualShipmentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [shipment, setShipment] = useState<ShipmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showOffers, setShowOffers] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);

  useEffect(() => {
    const fetchShipmentDetail = async () => {
      setLoading(true);
      try {
        // const response = await realApiService.getShipmentDetail(id);
        // if (response.success) {
        //   setShipment(response.data.shipment);
        // } else {
        //   console.error('Failed to fetch shipment detail:', response.message);
        //   setShipment(mockShipmentDetail);
        // }
        setShipment(mockShipmentDetail);
      } catch (error) {
        console.error('Error fetching shipment detail:', error);
        setShipment(mockShipmentDetail);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchShipmentDetail();
    }
  }, [id]);

  const handleAcceptOffer = (offerId: string) => {
    console.log('Accept offer:', offerId);
    // Implement offer acceptance logic
  };

  const handleRejectOffer = (offerId: string) => {
    console.log('Reject offer:', offerId);
    // Implement offer rejection logic
  };

  const handleContactCarrier = () => {
    if (shipment?.carrier) {
      console.log('Contact carrier:', shipment.carrier.phone);
      // Implement contact logic
    }
  };

  const handleDownloadDocument = (document: Document) => {
    console.log('Download document:', document.url);
    // Implement document download logic
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-lg text-gray-600">Gönderi detayları yükleniyor...</div>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Gönderi Bulunamadı</h2>
          <p className="text-gray-600 mb-4">Aradığınız gönderi bulunamadı.</p>
          <button
            onClick={() => navigate('/individual/my-shipments')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
          >
            Gönderilerime Dön
          </button>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(shipment.status);
  const priorityInfo = getPriorityInfo(shipment.priority);
  const cargoInfo = getCargoTypeInfo(shipment.cargoDetails.type);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 py-4 px-8">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/individual/my-shipments')}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{shipment.title}</h1>
              <p className="text-sm text-gray-600">#{shipment.trackingCode}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md text-sm font-medium hover:bg-gray-700 transition-colors duration-200 shadow-md">
              <Download className="w-4 h-4 mr-2" /> İndir
            </button>
            <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors duration-200 shadow-md">
              <Share2 className="w-4 h-4 mr-2" /> Paylaş
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-10">
        {/* Status Banner */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                statusInfo.color === 'orange' ? 'bg-orange-100' :
                statusInfo.color === 'blue' ? 'bg-blue-100' :
                statusInfo.color === 'green' ? 'bg-green-100' :
                statusInfo.color === 'purple' ? 'bg-purple-100' :
                statusInfo.color === 'red' ? 'bg-red-100' :
                'bg-gray-100'
              }`}>
                <div className={`${
                  statusInfo.color === 'orange' ? 'text-orange-600' :
                  statusInfo.color === 'blue' ? 'text-blue-600' :
                  statusInfo.color === 'green' ? 'text-green-600' :
                  statusInfo.color === 'purple' ? 'text-purple-600' :
                  statusInfo.color === 'red' ? 'text-red-600' :
                  'text-gray-600'
                }`}>
                  {statusInfo.icon}
                </div>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{statusInfo.text}</h2>
                <p className="text-sm text-gray-600">
                  {shipment.status === 'in_progress' && 'Gönderiniz yolda'}
                  {shipment.status === 'delivered' && 'Gönderiniz teslim edildi'}
                  {shipment.status === 'pending' && 'Gönderiniz beklemede'}
                  {shipment.status === 'bidding' && 'Teklifler alınıyor'}
                  {shipment.status === 'accepted' && 'Teklif kabul edildi'}
                  {shipment.status === 'cancelled' && 'Gönderi iptal edildi'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                priorityInfo.color === 'red' ? 'bg-red-100 text-red-800' :
                priorityInfo.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                priorityInfo.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {priorityInfo.text}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                {cargoInfo.icon} {cargoInfo.text}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sol Kolon - Ana Bilgiler */}
          <div className="lg:col-span-2">
            {/* Tab Navigation */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-6">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  {[
                    { id: 'overview', label: 'Genel Bakış', icon: <Eye className="w-4 h-4" /> },
                    { id: 'tracking', label: 'Takip', icon: <Truck className="w-4 h-4" /> },
                    { id: 'offers', label: 'Teklifler', icon: <DollarSign className="w-4 h-4" /> },
                    { id: 'documents', label: 'Belgeler', icon: <FileText className="w-4 h-4" /> }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-6">
                {/* Genel Bakış */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Gönderi Bilgileri</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Açıklama</label>
                          <p className="text-gray-900">{shipment.description}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Takip Kodu</label>
                          <p className="text-gray-900 font-mono">{shipment.trackingCode}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Ağırlık</label>
                          <p className="text-gray-900">{shipment.cargoDetails.weight} kg</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Hacim</label>
                          <p className="text-gray-900">{shipment.cargoDetails.volume} m³</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Değer</label>
                          <p className="text-gray-900">₺{shipment.cargoDetails.value.toLocaleString()}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Oluşturulma Tarihi</label>
                          <p className="text-gray-900">{new Date(shipment.createdAt).toLocaleDateString('tr-TR')}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Adres Bilgileri</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-md font-medium text-gray-900 mb-2">Gönderici</h4>
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="font-medium text-gray-900">{shipment.fromAddress.name}</p>
                            <p className="text-gray-600">{shipment.fromAddress.address}</p>
                            <p className="text-gray-600">{shipment.fromAddress.district}, {shipment.fromAddress.city} {shipment.fromAddress.postalCode}</p>
                            <p className="text-gray-600">{shipment.fromAddress.phone}</p>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-md font-medium text-gray-900 mb-2">Alıcı</h4>
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="font-medium text-gray-900">{shipment.toAddress.name}</p>
                            <p className="text-gray-600">{shipment.toAddress.address}</p>
                            <p className="text-gray-600">{shipment.toAddress.district}, {shipment.toAddress.city} {shipment.toAddress.postalCode}</p>
                            <p className="text-gray-600">{shipment.toAddress.phone}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Teslimat Bilgileri</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Tercih Edilen Tarih</label>
                          <p className="text-gray-900">{new Date(shipment.schedule.preferredDate).toLocaleDateString('tr-TR')}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Saat Tercihi</label>
                          <p className="text-gray-900">
                            {shipment.schedule.timePreference === 'sabah' ? 'Sabah' :
                             shipment.schedule.timePreference === 'ogleden_sonra' ? 'Öğleden Sonra' :
                             shipment.schedule.timePreference === 'aksam' ? 'Akşam' : 'Herhangi'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Tahmini Teslimat</label>
                          <p className="text-gray-900">{new Date(shipment.schedule.estimatedDelivery).toLocaleDateString('tr-TR')}</p>
                        </div>
                        {shipment.schedule.actualDelivery && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Gerçek Teslimat</label>
                            <p className="text-gray-900">{new Date(shipment.schedule.actualDelivery).toLocaleDateString('tr-TR')}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Takip */}
                {activeTab === 'tracking' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Takip Geçmişi</h3>
                    <div className="space-y-4">
                      {shipment.tracking.map((update, index) => (
                        <div key={update.id} className="flex items-start space-x-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            update.isDelivered ? 'bg-green-100' : 'bg-blue-100'
                          }`}>
                            <div className={`${
                              update.isDelivered ? 'text-green-600' : 'text-blue-600'
                            }`}>
                              {update.isDelivered ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-medium text-gray-900">{update.status}</h4>
                              <span className="text-xs text-gray-500">
                                {new Date(update.timestamp).toLocaleDateString('tr-TR')}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">{update.description}</p>
                            <p className="text-xs text-gray-500">{update.location}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Teklifler */}
                {activeTab === 'offers' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Teklifler</h3>
                      <span className="text-sm text-gray-500">{shipment.offers.length} teklif</span>
                    </div>
                    <div className="space-y-4">
                      {shipment.offers.map((offer) => (
                        <div key={offer.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-gray-600" />
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-900">{offer.carrierName}</h4>
                                <p className="text-xs text-gray-500">{offer.carrierCompany}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-semibold text-gray-900">₺{offer.price.toLocaleString()}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(offer.estimatedDelivery).toLocaleDateString('tr-TR')}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{offer.message}</p>
                          <div className="flex items-center justify-between">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              offer.status === 'accepted' ? 'bg-green-100 text-green-800' :
                              offer.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              offer.status === 'withdrawn' ? 'bg-gray-100 text-gray-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {offer.status === 'accepted' ? 'Kabul Edildi' :
                               offer.status === 'rejected' ? 'Reddedildi' :
                               offer.status === 'withdrawn' ? 'Geri Çekildi' : 'Beklemede'}
                            </span>
                            {offer.status === 'pending' && (
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleAcceptOffer(offer.id)}
                                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                                >
                                  Kabul Et
                                </button>
                                <button
                                  onClick={() => handleRejectOffer(offer.id)}
                                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                                >
                                  Reddet
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Belgeler */}
                {activeTab === 'documents' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Belgeler</h3>
                      <span className="text-sm text-gray-500">{shipment.documents.length} belge</span>
                    </div>
                    <div className="space-y-4">
                      {shipment.documents.map((document) => (
                        <div key={document.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                <FileText className="w-5 h-5 text-gray-600" />
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-900">{document.name}</h4>
                                <p className="text-xs text-gray-500">
                                  {document.type === 'contract' ? 'Sözleşme' :
                                   document.type === 'invoice' ? 'Fatura' :
                                   document.type === 'receipt' ? 'Makbuz' : 'Diğer'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500">
                                {new Date(document.uploadedAt).toLocaleDateString('tr-TR')}
                              </span>
                              <button
                                onClick={() => handleDownloadDocument(document)}
                                className="p-2 text-gray-400 hover:text-gray-600"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sağ Kolon - Taşıyıcı ve İletişim */}
          <div className="space-y-6">
            {/* Taşıyıcı Bilgileri */}
            {shipment.carrier && (
              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Taşıyıcı Bilgileri</h3>
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    {shipment.carrier.avatar ? (
                      <img
                        src={shipment.carrier.avatar}
                        alt={shipment.carrier.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-md font-medium text-gray-900">{shipment.carrier.name}</h4>
                    <p className="text-sm text-gray-600">{shipment.carrier.company}</p>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600">{shipment.carrier.rating}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-900">{shipment.carrier.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-900">{shipment.carrier.email}</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleContactCarrier}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors duration-200"
                  >
                    <Phone className="w-4 h-4 inline mr-2" />
                    Ara
                  </button>
                  <button className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md text-sm font-medium hover:bg-gray-700 transition-colors duration-200">
                    <MessageSquare className="w-4 h-4 inline mr-2" />
                    Mesaj
                  </button>
                </div>
              </div>
            )}

            {/* Hızlı İşlemler */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Hızlı İşlemler</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors duration-200">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Teslimatı Onayla
                </button>
                <button className="w-full flex items-center justify-center px-4 py-2 bg-yellow-600 text-white rounded-md text-sm font-medium hover:bg-yellow-700 transition-colors duration-200">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Durumu Güncelle
                </button>
                <button className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors duration-200">
                  <XCircle className="w-4 h-4 mr-2" />
                  İptal Et
                </button>
              </div>
            </div>

            {/* İstatistikler */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">İstatistikler</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Toplam Teklif</span>
                  <span className="text-sm font-medium text-gray-900">{shipment.offers.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Kabul Edilen Teklif</span>
                  <span className="text-sm font-medium text-gray-900">
                    {shipment.offers.filter(o => o.status === 'accepted').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Toplam Belge</span>
                  <span className="text-sm font-medium text-gray-900">{shipment.documents.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Takip Güncellemesi</span>
                  <span className="text-sm font-medium text-gray-900">{shipment.tracking.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default IndividualShipmentDetail;