import React, { useState, useEffect } from 'react';
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
  Weight,
  Box,
  DollarSign,
  Users,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowUpDown,
  Download,
  RefreshCw
} from 'lucide-react';

interface Shipment {
  id: string;
  trackingCode: string;
  title: string;
  description: string;
  cargoType: string;
  status: 'pending' | 'bidding' | 'accepted' | 'in_progress' | 'delivered' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  fromCity: string;
  toCity: string;
  date: string;
  weight: number;
  volume: number;
  price: number;
  offerCount: number;
  carrierName?: string;
  carrierCompany?: string;
  createdAt: string;
  updatedAt: string;
}

const MyShipmentsNew: React.FC = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      setLoading(true);
      // API çağrısı burada yapılacak
      // const response = await realApiService.getMyShipments();
      
      // Mock data
      const mockShipments: Shipment[] = [
        {
          id: '1',
          trackingCode: 'YN12345678',
          title: 'Ev Eşyaları Taşıma',
          description: 'İstanbul\'dan Ankara\'ya ev eşyaları taşıma',
          cargoType: 'ev_esyasi',
          status: 'accepted',
          priority: 'normal',
          fromCity: 'İstanbul',
          toCity: 'Ankara',
          date: '2024-01-20',
          weight: 150,
          volume: 25,
          price: 2500,
          offerCount: 5,
          carrierName: 'Ahmet Kaya',
          carrierCompany: 'Ahmet Kaya Nakliyat',
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-20T14:30:00Z'
        },
        {
          id: '2',
          trackingCode: 'YN87654321',
          title: 'Ofis Malzemeleri',
          description: 'Büro eşyaları ve bilgisayar taşıma',
          cargoType: 'is_yeri',
          status: 'in_progress',
          priority: 'high',
          fromCity: 'İzmir',
          toCity: 'Bursa',
          date: '2024-01-18',
          weight: 80,
          volume: 15,
          price: 1800,
          offerCount: 3,
          carrierName: 'Fatma Demir',
          carrierCompany: 'Fatma Demir Lojistik',
          createdAt: '2024-01-16T09:15:00Z',
          updatedAt: '2024-01-18T11:20:00Z'
        },
        {
          id: '3',
          trackingCode: 'YN11223344',
          title: 'Kişisel Eşyalar',
          description: 'Kıyafet ve kişisel eşya taşıma',
          cargoType: 'kisisel',
          status: 'delivered',
          priority: 'low',
          fromCity: 'Antalya',
          toCity: 'İstanbul',
          date: '2024-01-16',
          weight: 30,
          volume: 8,
          price: 800,
          offerCount: 7,
          carrierName: 'Mehmet Yılmaz',
          carrierCompany: 'Mehmet Yılmaz Taşımacılık',
          createdAt: '2024-01-14T16:45:00Z',
          updatedAt: '2024-01-16T18:30:00Z'
        },
        {
          id: '4',
          trackingCode: 'YN55667788',
          title: 'Elektronik Cihazlar',
          description: 'Bilgisayar ve elektronik eşya taşıma',
          cargoType: 'ozel',
          status: 'bidding',
          priority: 'normal',
          fromCity: 'Ankara',
          toCity: 'İzmir',
          date: '2024-01-22',
          weight: 25,
          volume: 5,
          price: 1200,
          offerCount: 4,
          createdAt: '2024-01-17T13:20:00Z',
          updatedAt: '2024-01-19T10:15:00Z'
        },
        {
          id: '5',
          trackingCode: 'YN99887766',
          title: 'Kırılabilir Eşyalar',
          description: 'Porselen ve cam eşya taşıma',
          cargoType: 'ozel',
          status: 'pending',
          priority: 'urgent',
          fromCity: 'Bursa',
          toCity: 'İstanbul',
          date: '2024-01-19',
          weight: 45,
          volume: 12,
          price: 1500,
          offerCount: 0,
          createdAt: '2024-01-18T08:30:00Z',
          updatedAt: '2024-01-18T08:30:00Z'
        }
      ];

      setShipments(mockShipments);
    } catch (error) {
      console.error('Gönderiler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    const statusMap = {
      pending: { text: 'Beklemede', color: 'yellow', icon: Clock },
      bidding: { text: 'Teklifler Alındı', color: 'blue', icon: Users },
      accepted: { text: 'Kabul Edildi', color: 'green', icon: CheckCircle },
      in_progress: { text: 'Yolda', color: 'purple', icon: Truck },
      delivered: { text: 'Teslim Edildi', color: 'green', icon: CheckCircle },
      cancelled: { text: 'İptal Edildi', color: 'red', icon: AlertCircle }
    };
    return statusMap[status as keyof typeof statusMap] || statusMap.pending;
  };

  const getPriorityInfo = (priority: string) => {
    const priorityMap = {
      low: { text: 'Düşük', color: 'gray' },
      normal: { text: 'Normal', color: 'blue' },
      high: { text: 'Yüksek', color: 'orange' },
      urgent: { text: 'Acil', color: 'red' }
    };
    return priorityMap[priority as keyof typeof priorityMap] || priorityMap.normal;
  };

  const getCargoTypeInfo = (cargoType: string) => {
    const cargoMap = {
      ev_esyasi: { text: 'Ev Eşyaları', icon: '🏠' },
      kisisel: { text: 'Kişisel Eşyalar', icon: '👕' },
      ciftci: { text: 'Çiftçi Ürünleri', icon: '🌾' },
      is_yeri: { text: 'İş Yeri Eşyası', icon: '🏢' },
      ozel: { text: 'Özel Gönderi', icon: '🎁' }
    };
    return cargoMap[cargoType as keyof typeof cargoMap] || cargoMap.ozel;
  };

  const filteredShipments = shipments.filter(shipment => {
    const matchesSearch = searchTerm === '' || 
      shipment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.trackingCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || shipment.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || shipment.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const sortedShipments = [...filteredShipments].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'date':
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        break;
      case 'price':
        comparison = a.price - b.price;
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'priority':
        const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
        comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
        break;
      default:
        comparison = 0;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const stats = {
    total: shipments.length,
    delivered: shipments.filter(s => s.status === 'delivered').length,
    inProgress: shipments.filter(s => s.status === 'in_progress').length,
    pending: shipments.filter(s => s.status === 'pending').length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Gönderiler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gönderilerim - YENİ SAYFA</h1>
              <p className="text-gray-600 mt-1">Tüm gönderilerinizi yönetin ve takip edin</p>
            </div>
            <div className="flex items-center space-x-3">
              <button className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors">
                <Download className="w-4 h-4 mr-2" />
                Dışa Aktar
              </button>
              <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="w-4 h-4 mr-2" />
                Yeni Gönderi
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* İstatistikler */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Toplam Gönderi</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Teslim Edilen</p>
                <p className="text-2xl font-bold text-gray-900">{stats.delivered}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Truck className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Yolda</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Beklemede</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtreler ve Arama */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Gönderi ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="date-desc">Tarih (Yeni)</option>
                <option value="date-asc">Tarih (Eski)</option>
                <option value="price-desc">Fiyat (Yüksek)</option>
                <option value="price-asc">Fiyat (Düşük)</option>
                <option value="priority-desc">Öncelik (Yüksek)</option>
                <option value="priority-asc">Öncelik (Düşük)</option>
              </select>

              <button className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors">
                <RefreshCw className="w-4 h-4 mr-2" />
                Yenile
              </button>
            </div>
          </div>
        </div>

        {/* Gönderi Listesi */}
        <div className="space-y-4">
          {sortedShipments.map((shipment) => {
            const statusInfo = getStatusInfo(shipment.status);
            const priorityInfo = getPriorityInfo(shipment.priority);
            const cargoInfo = getCargoTypeInfo(shipment.cargoType);
            const StatusIcon = statusInfo.icon;

            return (
              <div key={shipment.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-gray-100 rounded-lg">
                        <span className="text-2xl">{cargoInfo.icon}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{shipment.title}</h3>
                          <span className="text-sm font-medium text-gray-500">#{shipment.trackingCode}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${statusInfo.color}-100 text-${statusInfo.color}-800`}>
                            {statusInfo.text}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            priorityInfo.color === 'red' ? 'bg-red-100 text-red-800' :
                            priorityInfo.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                            priorityInfo.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {priorityInfo.text}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-3">{shipment.description}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center text-gray-600">
                            <MapPin className="w-4 h-4 mr-2 text-blue-500" />
                            <span>{shipment.fromCity} → {shipment.toCity}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Calendar className="w-4 h-4 mr-2 text-green-500" />
                            <span>{new Date(shipment.date).toLocaleDateString('tr-TR')}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Weight className="w-4 h-4 mr-2 text-purple-500" />
                            <span>{shipment.weight} kg</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Box className="w-4 h-4 mr-2 text-orange-500" />
                            <span>{shipment.volume} m³</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">₺{shipment.price.toLocaleString()}</div>
                        <div className="text-sm text-gray-500">{shipment.offerCount} teklif</div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {shipment.carrierName && (
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Truck className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{shipment.carrierName}</p>
                            <p className="text-sm text-gray-600">{shipment.carrierCompany}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm">
                            İletişim
                          </button>
                          <button className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm">
                            Takip Et
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {sortedShipments.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Gönderi bulunamadı</h3>
            <p className="text-gray-600">Arama kriterlerinizi değiştirerek tekrar deneyin.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyShipmentsNew;





