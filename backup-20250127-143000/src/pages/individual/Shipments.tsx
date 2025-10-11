import React, { useState, useEffect } from 'react';
import { Package, Search, Plus, Download, RefreshCw, MapPin, Calendar, Weight, DollarSign, Truck, CheckCircle, Clock, AlertCircle, List, Grid, Eye, Edit, Trash2, MoreVertical } from 'lucide-react';
import { realApiService } from '../../services/realApi';
import { useNavigate } from 'react-router-dom';

interface Shipment {
  id: string;
  title: string;
  description: string;
  trackingCode: string;
  status: 'pending' | 'bidding' | 'accepted' | 'in_progress' | 'delivered' | 'cancelled';
  priority: 'urgent' | 'high' | 'normal' | 'low';
  fromCity: string;
  toCity: string;
  date: string;
  weight: number;
  volume: number;
  price: number;
  offerCount: number;
  carrierName?: string;
  carrierCompany?: string;
  cargoType: 'ev_esyasi' | 'kisisel' | 'ciftci' | 'is_yeri' | 'ozel';
  createdAt: string;
  updatedAt: string;
}

    const mockShipments: Shipment[] = [
      {
    id: 'SHP001',
    title: 'Ev Eşyası Taşıma',
    description: 'İstanbul\'dan Ankara\'ya ev eşyası taşımacılığı.',
    trackingCode: 'TRK789012',
    status: 'in_progress',
    priority: 'high',
    fromCity: 'İstanbul',
    toCity: 'Ankara',
    date: '2024-07-20T10:00:00Z',
    weight: 500,
    volume: 10,
    price: 1200,
    offerCount: 3,
    carrierName: 'Hızlı Kargo A.Ş.',
    carrierCompany: 'Hızlı Kargo',
    cargoType: 'ev_esyasi',
    createdAt: '2024-07-15T09:00:00Z',
    updatedAt: '2024-07-19T14:30:00Z'
  },
  {
    id: 'SHP002',
    title: 'Kişisel Eşya Gönderimi',
    description: 'İzmir\'den Bursa\'ya kişisel eşya paketi.',
    trackingCode: 'TRK123456',
    status: 'pending',
        priority: 'normal',
    fromCity: 'İzmir',
    toCity: 'Bursa',
    date: '2024-07-22T14:30:00Z',
    weight: 10,
    volume: 0.5,
    price: 150,
    offerCount: 5,
    cargoType: 'kisisel',
    createdAt: '2024-07-18T11:00:00Z',
    updatedAt: '2024-07-18T11:00:00Z'
  },
  {
    id: 'SHP003',
    title: 'Tarım Ürünleri Sevkiyatı',
    description: 'Adana\'dan Mersin\'e taze sebze ve meyve.',
    trackingCode: 'TRK987654',
    status: 'bidding',
    priority: 'urgent',
    fromCity: 'Adana',
    toCity: 'Mersin',
    date: '2024-07-18T08:00:00Z',
    weight: 1200,
    volume: 25,
    price: 800,
    offerCount: 7,
    cargoType: 'ciftci',
    createdAt: '2024-07-16T07:00:00Z',
    updatedAt: '2024-07-17T16:45:00Z'
  },
  {
    id: 'SHP004',
    title: 'Ofis Malzemeleri',
    description: 'Ankara\'dan Eskişehir\'e ofis mobilyaları ve ekipmanları.',
    trackingCode: 'TRK456789',
        status: 'delivered',
        priority: 'low',
    fromCity: 'Ankara',
    toCity: 'Eskişehir',
    date: '2024-07-15T11:00:00Z',
    weight: 300,
        volume: 5,
    price: 600,
    offerCount: 2,
    carrierName: 'Güven Lojistik',
    carrierCompany: 'Güven Taşımacılık',
    cargoType: 'is_yeri',
    createdAt: '2024-07-10T10:00:00Z',
    updatedAt: '2024-07-16T18:00:00Z'
  },
  {
    id: 'SHP005',
    title: 'Özel Kargo',
    description: 'İstanbul\'dan Antalya\'ya hassas sanat eseri taşıması.',
    trackingCode: 'TRK654321',
    status: 'accepted',
        priority: 'urgent',
    fromCity: 'İstanbul',
    toCity: 'Antalya',
    date: '2024-07-25T09:00:00Z',
    weight: 50,
    volume: 1,
    price: 2500,
    offerCount: 1,
    carrierName: 'Sanat Nakliyat',
    carrierCompany: 'Sanat Eseri Taşımacılığı',
    cargoType: 'ozel',
    createdAt: '2024-07-20T08:00:00Z',
    updatedAt: '2024-07-21T12:00:00Z'
  },
];

const getStatusInfo = (status: Shipment['status']) => {
  switch (status) {
    case 'pending': return { text: 'Beklemede', color: 'orange', icon: <Clock className="w-4 h-4" /> };
    case 'bidding': return { text: 'Teklifler Alındı', color: 'blue', icon: <DollarSign className="w-4 h-4" /> };
    case 'accepted': return { text: 'Kabul Edildi', color: 'purple', icon: <CheckCircle className="w-4 h-4" /> };
    case 'in_progress': return { text: 'Yolda', color: 'green', icon: <Truck className="w-4 h-4" /> };
    case 'delivered': return { text: 'Teslim Edildi', color: 'gray', icon: <Package className="w-4 h-4" /> };
    case 'cancelled': return { text: 'İptal Edildi', color: 'red', icon: <AlertCircle className="w-4 h-4" /> };
    default: return { text: 'Bilinmiyor', color: 'gray', icon: <AlertCircle className="w-4 h-4" /> };
  }
};

const getPriorityInfo = (priority: Shipment['priority']) => {
  switch (priority) {
    case 'urgent': return { text: 'Acil', color: 'red' };
    case 'high': return { text: 'Yüksek', color: 'orange' };
    case 'normal': return { text: 'Normal', color: 'blue' };
    case 'low': return { text: 'Düşük', color: 'gray' };
    default: return { text: 'Bilinmiyor', color: 'gray' };
  }
};

const getCargoTypeInfo = (cargoType: Shipment['cargoType']) => {
  switch (cargoType) {
    case 'ev_esyasi': return { text: 'Ev Eşyası', icon: '🏠' };
    case 'kisisel': return { text: 'Kişisel', icon: '📦' };
    case 'ciftci': return { text: 'Çiftçi', icon: '🚜' };
    case 'is_yeri': return { text: 'İş Yeri', icon: '🏢' };
    case 'ozel': return { text: 'Özel', icon: '✨' };
    default: return { text: 'Diğer', icon: '❓' };
  }
};

const IndividualShipments: React.FC = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedShipments, setSelectedShipments] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchShipments = async () => {
      setLoading(true);
      try {
        // const response = await realApiService.getActiveShipments();
        // if (response.success) {
        //   setShipments(response.data.shipments);
        // } else {
        //   console.error('Failed to fetch shipments:', response.message);
        //   setShipments(mockShipments);
        // }
        setShipments(mockShipments);
      } catch (error) {
        console.error('Error fetching shipments:', error);
        setShipments(mockShipments);
      } finally {
        setLoading(false);
      }
    };

    fetchShipments();
  }, []);

  const filteredShipments = shipments.filter(shipment => {
    const matchesSearch = searchTerm === '' ||
      shipment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.trackingCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.fromCity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.toCity.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || shipment.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || shipment.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const sortedShipments = [...filteredShipments].sort((a, b) => {
    let compare = 0;
    if (sortBy === 'date') {
      compare = new Date(a.date).getTime() - new Date(b.date).getTime();
    } else if (sortBy === 'price') {
      compare = a.price - b.price;
    } else if (sortBy === 'priority') {
      const priorityOrder = { 'low': 1, 'normal': 2, 'high': 3, 'urgent': 4 };
      compare = priorityOrder[a.priority] - priorityOrder[b.priority];
    }

    return sortOrder === 'asc' ? compare : -compare;
  });

  const stats = {
    total: shipments.length,
    delivered: shipments.filter(s => s.status === 'delivered').length,
    inProgress: shipments.filter(s => s.status === 'in_progress').length,
    pending: shipments.filter(s => s.status === 'pending').length,
    bidding: shipments.filter(s => s.status === 'bidding').length,
    accepted: shipments.filter(s => s.status === 'accepted').length,
    cancelled: shipments.filter(s => s.status === 'cancelled').length
  };

  const handleSelectShipment = (shipmentId: string) => {
    setSelectedShipments(prev => 
      prev.includes(shipmentId) 
        ? prev.filter(id => id !== shipmentId)
        : [...prev, shipmentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedShipments.length === sortedShipments.length) {
      setSelectedShipments([]);
    } else {
      setSelectedShipments(sortedShipments.map(s => s.id));
    }
  };

  const handleBulkAction = (action: string) => {
    console.log(`Bulk action: ${action} on shipments:`, selectedShipments);
    // Implement bulk actions
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-lg text-gray-600">Gönderiler yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 font-sans">
        {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 py-4 px-8">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
                <div>
            <h1 className="text-3xl font-bold text-gray-900">Gönderiler</h1>
            <p className="text-sm text-gray-600 mt-1">Tüm gönderilerinizi yönetin ve takip edin</p>
                </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/individual/create-shipment')}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors duration-200 shadow-md"
            >
              <Plus className="w-4 h-4 mr-2" /> Yeni Gönderi
            </button>
            <button className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md text-sm font-medium hover:bg-gray-700 transition-colors duration-200 shadow-md">
              <Download className="w-4 h-4 mr-2" /> Dışa Aktar
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-10">
        {/* İstatistikler */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white rounded-lg shadow-md p-6 flex items-center justify-between border border-blue-200">
            <div>
              <div className="text-sm font-medium text-gray-500">Toplam Gönderi</div>
              <div className="text-4xl font-bold text-gray-900 mt-1">{stats.total}</div>
            </div>
            <Package className="w-10 h-10 text-blue-400 opacity-75" />
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 flex items-center justify-between border border-green-200">
            <div>
              <div className="text-sm font-medium text-gray-500">Teslim Edilen</div>
              <div className="text-4xl font-bold text-gray-900 mt-1">{stats.delivered}</div>
            </div>
            <CheckCircle className="w-10 h-10 text-green-400 opacity-75" />
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 flex items-center justify-between border border-yellow-200">
            <div>
              <div className="text-sm font-medium text-gray-500">Yolda</div>
              <div className="text-4xl font-bold text-gray-900 mt-1">{stats.inProgress}</div>
            </div>
            <Truck className="w-10 h-10 text-yellow-400 opacity-75" />
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 flex items-center justify-between border border-orange-200">
            <div>
              <div className="text-sm font-medium text-gray-500">Beklemede</div>
              <div className="text-4xl font-bold text-gray-900 mt-1">{stats.pending}</div>
            </div>
            <Clock className="w-10 h-10 text-orange-400 opacity-75" />
          </div>
        </section>

        {/* Filtreler ve Arama */}
        <section className="bg-white rounded-lg shadow-md p-6 mb-10 border border-gray-200">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Gönderi ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">Tüm Durumlar</option>
                <option value="pending">Beklemede</option>
              <option value="bidding">Teklifler Alındı</option>
                <option value="accepted">Kabul Edildi</option>
              <option value="in_progress">Yolda</option>
                <option value="delivered">Teslim Edildi</option>
                <option value="cancelled">İptal Edildi</option>
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">Tüm Öncelikler</option>
              <option value="urgent">Acil</option>
              <option value="high">Yüksek</option>
              <option value="normal">Normal</option>
                <option value="low">Düşük</option>
            </select>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order as 'asc' | 'desc');
              }}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="date-desc">Tarih (Yeni)</option>
              <option value="date-asc">Tarih (Eski)</option>
              <option value="price-desc">Fiyat (Yüksek)</option>
              <option value="price-asc">Fiyat (Düşük)</option>
              <option value="priority-desc">Öncelik (Yüksek)</option>
              <option value="priority-asc">Öncelik (Düşük)</option>
              </select>
            <button className="p-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200">
              <RefreshCw className="w-5 h-5" />
            </button>
            <div className="flex space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors duration-200 ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors duration-200 ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </section>

        {/* Toplu İşlemler */}
        {selectedShipments.length > 0 && (
          <section className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-blue-900">
                  {selectedShipments.length} gönderi seçildi
                </span>
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Tümünü Seç/Kaldır
                </button>
        </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleBulkAction('export')}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Dışa Aktar
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                >
                  Sil
                </button>
          </div>
                    </div>
          </section>
        )}

        {/* Gönderi Listesi / Grid */}
        <section>
          {sortedShipments.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <Package className="w-16 h-16 mx-auto mb-6 text-gray-400" />
              <p className="text-xl font-medium">Gönderi bulunamadı.</p>
              <p className="text-sm mt-2">Filtreleri ayarlayarak veya yeni bir gönderi oluşturarak başlayın.</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedShipments.map((shipment) => {
                const statusInfo = getStatusInfo(shipment.status);
                const priorityInfo = getPriorityInfo(shipment.priority);
                const cargoInfo = getCargoTypeInfo(shipment.cargoType);

                return (
                  <div
                    key={shipment.id}
                    className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                    onClick={() => navigate(`/individual/shipments/${shipment.id}`)}
                  >
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">{cargoInfo.icon}</div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{shipment.title}</h3>
                            <p className="text-xs text-gray-500">#{shipment.trackingCode}</p>
                      </div>
                      </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedShipments.includes(shipment.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleSelectShipment(shipment.id);
                            }}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Handle more actions
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                      </div>
                      </div>

                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{shipment.description}</p>

                      <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 mb-4">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                          <span>{shipment.fromCity} → {shipment.toCity}</span>
                    </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                          <span>{new Date(shipment.date).toLocaleDateString('tr-TR')}</span>
                        </div>
                        <div className="flex items-center">
                          <Weight className="w-4 h-4 text-gray-400 mr-2" />
                          <span>{shipment.weight} kg / {shipment.volume} m³</span>
                        </div>
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 text-gray-400 mr-2" />
                          <span>₺{shipment.price.toLocaleString()}</span>
                          </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                      <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            statusInfo.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                            statusInfo.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                            statusInfo.color === 'green' ? 'bg-green-100 text-green-800' :
                            statusInfo.color === 'purple' ? 'bg-purple-100 text-purple-800' :
                            statusInfo.color === 'red' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {statusInfo.icon} <span className="ml-1">{statusInfo.text}</span>
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            priorityInfo.color === 'red' ? 'bg-red-100 text-red-800' :
                            priorityInfo.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                            priorityInfo.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {priorityInfo.text}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {shipment.carrierName ? (
                            <span>Taşıyıcı: <span className="font-medium text-blue-600">{shipment.carrierName}</span></span>
                          ) : (
                            <span className="text-yellow-600">Teklif Bekleniyor ({shipment.offerCount})</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedShipments.length === sortedShipments.length && sortedShipments.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gönderi
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rota
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tarih
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ağırlık/Hacim
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fiyat
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Durum
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Taşıyıcı
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Aksiyonlar</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedShipments.map((shipment) => {
                    const statusInfo = getStatusInfo(shipment.status);
                    const priorityInfo = getPriorityInfo(shipment.priority);
                    const cargoInfo = getCargoTypeInfo(shipment.cargoType);

                    return (
                      <tr key={shipment.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedShipments.includes(shipment.id)}
                            onChange={() => handleSelectShipment(shipment.id)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center text-xl">
                              {cargoInfo.icon}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{shipment.title}</div>
                              <div className="text-xs text-gray-500">#{shipment.trackingCode}</div>
                </div>
              </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {shipment.fromCity} → {shipment.toCity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(shipment.date).toLocaleDateString('tr-TR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {shipment.weight} kg / {shipment.volume} m³
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ₺{shipment.price.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              statusInfo.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                              statusInfo.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                              statusInfo.color === 'green' ? 'bg-green-100 text-green-800' :
                              statusInfo.color === 'purple' ? 'bg-purple-100 text-purple-800' :
                              statusInfo.color === 'red' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {statusInfo.text}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              priorityInfo.color === 'red' ? 'bg-red-100 text-red-800' :
                              priorityInfo.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                              priorityInfo.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {priorityInfo.text}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {shipment.carrierName ? `${shipment.carrierName} (${shipment.carrierCompany})` : 'Atanmadı'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => navigate(`/individual/shipments/${shipment.id}`)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="text-indigo-600 hover:text-indigo-900">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="text-red-600 hover:text-red-900">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
          </div>
        )}
        </section>
      </main>
    </div>
  );
};

export default IndividualShipments;