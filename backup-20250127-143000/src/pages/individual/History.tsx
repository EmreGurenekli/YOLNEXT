import React, { useState, useEffect } from 'react';
import { History as HistoryIcon, Search, Filter, Calendar, Download, RefreshCw, Eye, Star, CheckCircle, XCircle, Clock, AlertCircle, Package, Truck, DollarSign, MapPin, Weight, User, Phone, MessageSquare, FileText, Share2, Trash2, Archive, BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import { realApiService } from '../../services/realApi';
import { useNavigate } from 'react-router-dom';

interface HistoryItem {
  id: string;
  type: 'shipment' | 'payment' | 'offer' | 'message' | 'system';
  title: string;
  description: string;
  status: 'success' | 'warning' | 'error' | 'info';
  timestamp: string;
  amount?: number;
  shipmentId?: string;
  carrierName?: string;
  location?: string;
  metadata?: {
    [key: string]: any;
  };
}

interface ShipmentHistory {
  id: string;
  title: string;
  description: string;
  status: 'delivered' | 'cancelled' | 'failed' | 'in_progress';
  fromCity: string;
  toCity: string;
  date: string;
  price: number;
  carrierName: string;
  rating: number;
  trackingCode: string;
  cargoType: 'ev_esyasi' | 'kisisel' | 'ciftci' | 'is_yeri' | 'ozel';
  weight: number;
  volume: number;
  deliveryDate?: string;
  createdAt: string;
}

interface Statistics {
  totalShipments: number;
  deliveredShipments: number;
  cancelledShipments: number;
  totalSpent: number;
  averageRating: number;
  totalSavings: number;
  favoriteCarrier: string;
  mostUsedRoute: string;
  monthlyStats: {
    month: string;
    shipments: number;
    spent: number;
  }[];
}

const mockHistoryItems: HistoryItem[] = [
  {
    id: 'HIST001',
    type: 'shipment',
    title: 'Gönderi Teslim Edildi',
    description: 'Gönderiniz #SHP001 başarıyla teslim edildi.',
    status: 'success',
    timestamp: '2024-07-20T15:30:00Z',
    shipmentId: 'SHP001',
    carrierName: 'Hızlı Kargo A.Ş.',
    location: 'Ankara',
    metadata: {
      deliveryTime: '2 gün',
      rating: 5
    }
  },
  {
    id: 'HIST002',
    type: 'payment',
    title: 'Ödeme Yapıldı',
    description: 'Gönderi #SHP001 için ödeme işlemi tamamlandı.',
    status: 'success',
    timestamp: '2024-07-18T10:15:00Z',
    amount: 1200,
    shipmentId: 'SHP001',
    metadata: {
      paymentMethod: 'Kredi Kartı',
      transactionId: 'TXN123456789'
    }
  },
  {
    id: 'HIST003',
    type: 'offer',
    title: 'Teklif Kabul Edildi',
    description: 'Hızlı Kargo A.Ş. teklifi kabul edildi.',
    status: 'success',
    timestamp: '2024-07-17T14:20:00Z',
    shipmentId: 'SHP001',
    carrierName: 'Hızlı Kargo A.Ş.',
    amount: 1200,
    metadata: {
      offerCount: 3,
      selectedOffer: 1
    }
  },
  {
    id: 'HIST004',
    type: 'shipment',
    title: 'Gönderi Oluşturuldu',
    description: 'Yeni gönderi oluşturuldu ve yayınlandı.',
    status: 'info',
    timestamp: '2024-07-17T10:00:00Z',
    shipmentId: 'SHP001',
    metadata: {
      cargoType: 'ev_esyasi',
      weight: 500,
      volume: 10
    }
  },
  {
    id: 'HIST005',
    type: 'shipment',
    title: 'Gönderi İptal Edildi',
    description: 'Gönderiniz #SHP002 iptal edildi.',
    status: 'error',
    timestamp: '2024-07-15T16:45:00Z',
    shipmentId: 'SHP002',
    carrierName: 'Güven Lojistik',
    metadata: {
      reason: 'Müşteri talebi',
      refundAmount: 150
    }
  },
  {
    id: 'HIST006',
    type: 'message',
    title: 'Yeni Mesaj',
    description: 'Hızlı Kargo A.Ş. size mesaj gönderdi.',
    status: 'info',
    timestamp: '2024-07-14T09:30:00Z',
    shipmentId: 'SHP001',
    carrierName: 'Hızlı Kargo A.Ş.',
    metadata: {
      messageType: 'update',
      isRead: true
    }
  },
  {
    id: 'HIST007',
    type: 'system',
    title: 'Sistem Güncellemesi',
    description: 'Platform güncellemesi yapıldı.',
    status: 'info',
    timestamp: '2024-07-13T08:00:00Z',
    metadata: {
      version: '2.1.0',
      features: ['Yeni takip sistemi', 'Gelişmiş filtreleme']
    }
  }
];

const mockShipmentHistory: ShipmentHistory[] = [
  {
    id: 'SHP001',
    title: 'Ev Eşyası Taşıma',
    description: 'İstanbul\'dan Ankara\'ya ev eşyası taşımacılığı.',
    status: 'delivered',
    fromCity: 'İstanbul',
    toCity: 'Ankara',
    date: '2024-07-17T10:00:00Z',
    price: 1200,
    carrierName: 'Hızlı Kargo A.Ş.',
    rating: 5,
    trackingCode: 'TRK789012',
    cargoType: 'ev_esyasi',
    weight: 500,
    volume: 10,
    deliveryDate: '2024-07-20T15:30:00Z',
    createdAt: '2024-07-17T10:00:00Z'
  },
  {
    id: 'SHP002',
    title: 'Kişisel Eşya Gönderimi',
    description: 'İzmir\'den Bursa\'ya kişisel eşya paketi.',
    status: 'cancelled',
    fromCity: 'İzmir',
    toCity: 'Bursa',
    date: '2024-07-15T14:30:00Z',
    price: 150,
    carrierName: 'Güven Lojistik',
    rating: 0,
    trackingCode: 'TRK123456',
    cargoType: 'kisisel',
    weight: 10,
    volume: 0.5,
    createdAt: '2024-07-15T14:30:00Z'
  },
  {
    id: 'SHP003',
    title: 'Tarım Ürünleri Sevkiyatı',
    description: 'Adana\'dan Mersin\'e taze sebze ve meyve.',
    status: 'delivered',
    fromCity: 'Adana',
    toCity: 'Mersin',
    date: '2024-07-10T08:00:00Z',
    price: 800,
    carrierName: 'Bereket Nakliyat',
    rating: 4,
    trackingCode: 'TRK987654',
    cargoType: 'ciftci',
    weight: 1200,
    volume: 25,
    deliveryDate: '2024-07-12T16:00:00Z',
    createdAt: '2024-07-10T08:00:00Z'
  },
  {
    id: 'SHP004',
    title: 'Ofis Malzemeleri',
    description: 'Ankara\'dan Eskişehir\'e ofis mobilyaları ve ekipmanları.',
    status: 'delivered',
    fromCity: 'Ankara',
    toCity: 'Eskişehir',
    date: '2024-07-05T11:00:00Z',
    price: 600,
    carrierName: 'Güven Lojistik',
    rating: 4,
    trackingCode: 'TRK456789',
    cargoType: 'is_yeri',
    weight: 300,
    volume: 5,
    deliveryDate: '2024-07-07T17:00:00Z',
    createdAt: '2024-07-05T11:00:00Z'
  },
  {
    id: 'SHP005',
    title: 'Özel Kargo',
    description: 'İstanbul\'dan Antalya\'ya hassas sanat eseri taşıması.',
    status: 'delivered',
    fromCity: 'İstanbul',
    toCity: 'Antalya',
    date: '2024-06-28T09:00:00Z',
    price: 2500,
    carrierName: 'Sanat Nakliyat',
    rating: 5,
    trackingCode: 'TRK654321',
    cargoType: 'ozel',
    weight: 50,
    volume: 1,
    deliveryDate: '2024-07-01T10:00:00Z',
    createdAt: '2024-06-28T09:00:00Z'
  }
];

const mockStatistics: Statistics = {
  totalShipments: 47,
  deliveredShipments: 42,
  cancelledShipments: 5,
  totalSpent: 12500,
  averageRating: 4.6,
  totalSavings: 2500,
  favoriteCarrier: 'Hızlı Kargo A.Ş.',
  mostUsedRoute: 'İstanbul - Ankara',
  monthlyStats: [
    { month: 'Ocak', shipments: 8, spent: 2100 },
    { month: 'Şubat', shipments: 12, spent: 3200 },
    { month: 'Mart', shipments: 15, spent: 3800 },
    { month: 'Nisan', shipments: 10, spent: 2500 },
    { month: 'Mayıs', shipments: 18, spent: 4500 },
    { month: 'Haziran', shipments: 22, spent: 5200 },
    { month: 'Temmuz', shipments: 25, spent: 5800 }
  ]
};

const getTypeInfo = (type: HistoryItem['type']) => {
  switch (type) {
    case 'shipment': return { icon: <Package className="w-5 h-5" />, color: 'blue', text: 'Gönderi' };
    case 'payment': return { icon: <DollarSign className="w-5 h-5" />, color: 'green', text: 'Ödeme' };
    case 'offer': return { icon: <DollarSign className="w-5 h-5" />, color: 'purple', text: 'Teklif' };
    case 'message': return { icon: <MessageSquare className="w-5 h-5" />, color: 'orange', text: 'Mesaj' };
    case 'system': return { icon: <HistoryIcon className="w-5 h-5" />, color: 'gray', text: 'Sistem' };
    default: return { icon: <HistoryIcon className="w-5 h-5" />, color: 'gray', text: 'Diğer' };
  }
};

const getStatusInfo = (status: HistoryItem['status']) => {
  switch (status) {
    case 'success': return { color: 'green', icon: <CheckCircle className="w-4 h-4" /> };
    case 'warning': return { color: 'yellow', icon: <AlertCircle className="w-4 h-4" /> };
    case 'error': return { color: 'red', icon: <XCircle className="w-4 h-4" /> };
    case 'info': return { color: 'blue', icon: <Info className="w-4 h-4" /> };
    default: return { color: 'gray', icon: <Info className="w-4 h-4" /> };
  }
};

const getShipmentStatusInfo = (status: ShipmentHistory['status']) => {
  switch (status) {
    case 'delivered': return { text: 'Teslim Edildi', color: 'green', icon: <CheckCircle className="w-4 h-4" /> };
    case 'cancelled': return { text: 'İptal Edildi', color: 'red', icon: <XCircle className="w-4 h-4" /> };
    case 'failed': return { text: 'Başarısız', color: 'red', icon: <XCircle className="w-4 h-4" /> };
    case 'in_progress': return { text: 'Devam Ediyor', color: 'blue', icon: <Clock className="w-4 h-4" /> };
    default: return { text: 'Bilinmiyor', color: 'gray', icon: <Info className="w-4 h-4" /> };
  }
};

const getCargoTypeInfo = (type: ShipmentHistory['cargoType']) => {
  switch (type) {
    case 'ev_esyasi': return { text: 'Ev Eşyası', icon: '🏠' };
    case 'kisisel': return { text: 'Kişisel', icon: '📦' };
    case 'ciftci': return { text: 'Çiftçi', icon: '🚜' };
    case 'is_yeri': return { text: 'İş Yeri', icon: '🏢' };
    case 'ozel': return { text: 'Özel', icon: '✨' };
    default: return { text: 'Diğer', icon: '❓' };
  }
};

const IndividualHistory: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('timeline');
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [shipmentHistory, setShipmentHistory] = useState<ShipmentHistory[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const fetchHistoryData = async () => {
      setLoading(true);
      try {
        // const response = await realApiService.getHistoryData();
        // if (response.success) {
        //   setHistoryItems(response.data.historyItems);
        //   setShipmentHistory(response.data.shipmentHistory);
        //   setStatistics(response.data.statistics);
        // } else {
        //   console.error('Failed to fetch history data:', response.message);
        //   setHistoryItems(mockHistoryItems);
        //   setShipmentHistory(mockShipmentHistory);
        //   setStatistics(mockStatistics);
        // }
        setHistoryItems(mockHistoryItems);
        setShipmentHistory(mockShipmentHistory);
        setStatistics(mockStatistics);
      } catch (error) {
        console.error('Error fetching history data:', error);
        setHistoryItems(mockHistoryItems);
        setShipmentHistory(mockShipmentHistory);
        setStatistics(mockStatistics);
      } finally {
        setLoading(false);
      }
    };

    fetchHistoryData();
  }, []);

  const filteredHistoryItems = historyItems.filter(item => {
    const matchesSearch = searchTerm === '' ||
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.carrierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.shipmentId?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

    let matchesDate = true;
    if (dateFilter !== 'all') {
      const itemDate = new Date(item.timestamp);
      const now = new Date();
      const daysDiff = Math.ceil((now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (dateFilter === 'today' && daysDiff > 1) matchesDate = false;
      if (dateFilter === 'week' && daysDiff > 7) matchesDate = false;
      if (dateFilter === 'month' && daysDiff > 30) matchesDate = false;
      if (dateFilter === 'year' && daysDiff > 365) matchesDate = false;
    }

    return matchesSearch && matchesType && matchesStatus && matchesDate;
  });

  const filteredShipmentHistory = shipmentHistory.filter(shipment => {
    const matchesSearch = searchTerm === '' ||
      shipment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.carrierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.trackingCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.fromCity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.toCity.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || shipment.status === statusFilter;

    let matchesDate = true;
    if (dateFilter !== 'all') {
      const itemDate = new Date(shipment.date);
      const now = new Date();
      const daysDiff = Math.ceil((now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (dateFilter === 'today' && daysDiff > 1) matchesDate = false;
      if (dateFilter === 'week' && daysDiff > 7) matchesDate = false;
      if (dateFilter === 'month' && daysDiff > 30) matchesDate = false;
      if (dateFilter === 'year' && daysDiff > 365) matchesDate = false;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const sortedHistoryItems = [...filteredHistoryItems].sort((a, b) => {
    let compare = 0;
    if (sortBy === 'timestamp') {
      compare = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    } else if (sortBy === 'amount' && a.amount && b.amount) {
      compare = a.amount - b.amount;
    }

    return sortOrder === 'asc' ? compare : -compare;
  });

  const sortedShipmentHistory = [...filteredShipmentHistory].sort((a, b) => {
    let compare = 0;
    if (sortBy === 'timestamp') {
      compare = new Date(a.date).getTime() - new Date(b.date).getTime();
    } else if (sortBy === 'price') {
      compare = a.price - b.price;
    } else if (sortBy === 'rating') {
      compare = a.rating - b.rating;
    }

    return sortOrder === 'asc' ? compare : -compare;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-lg text-gray-600">Geçmiş verileri yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 py-4 px-8">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Geçmiş</h1>
            <p className="text-sm text-gray-600 mt-1">Tüm aktivitelerinizi ve gönderi geçmişinizi görüntüleyin</p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md text-sm font-medium hover:bg-gray-700 transition-colors duration-200 shadow-md">
              <Download className="w-4 h-4 mr-2" /> Dışa Aktar
            </button>
            <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors duration-200 shadow-md">
              <RefreshCw className="w-4 h-4 mr-2" /> Yenile
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-10">
        {/* Statistics */}
        {statistics && (
          <section className="mb-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-500">Toplam Gönderi</div>
                    <div className="text-3xl font-bold text-gray-900 mt-1">{statistics.totalShipments}</div>
                  </div>
                  <Package className="w-10 h-10 text-blue-400 opacity-75" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-500">Teslim Edilen</div>
                    <div className="text-3xl font-bold text-gray-900 mt-1">{statistics.deliveredShipments}</div>
                  </div>
                  <CheckCircle className="w-10 h-10 text-green-400 opacity-75" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-500">Toplam Harcama</div>
                    <div className="text-3xl font-bold text-gray-900 mt-1">₺{statistics.totalSpent.toLocaleString()}</div>
                  </div>
                  <DollarSign className="w-10 h-10 text-purple-400 opacity-75" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-500">Ortalama Değerlendirme</div>
                    <div className="text-3xl font-bold text-gray-900 mt-1">{statistics.averageRating}</div>
                  </div>
                  <Star className="w-10 h-10 text-yellow-400 opacity-75" />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'timeline', label: 'Zaman Çizelgesi', icon: <HistoryIcon className="w-4 h-4" /> },
                { id: 'shipments', label: 'Gönderiler', icon: <Package className="w-4 h-4" /> },
                { id: 'analytics', label: 'Analitik', icon: <BarChart3 className="w-4 h-4" /> }
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
            {/* Filtreler */}
            <div className="mb-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Geçmiş ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">Tüm Tipler</option>
                  <option value="shipment">Gönderiler</option>
                  <option value="payment">Ödemeler</option>
                  <option value="offer">Teklifler</option>
                  <option value="message">Mesajlar</option>
                  <option value="system">Sistem</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">Tüm Durumlar</option>
                  <option value="success">Başarılı</option>
                  <option value="warning">Uyarı</option>
                  <option value="error">Hata</option>
                  <option value="info">Bilgi</option>
                </select>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">Tüm Zamanlar</option>
                  <option value="today">Bugün</option>
                  <option value="week">Bu Hafta</option>
                  <option value="month">Bu Ay</option>
                  <option value="year">Bu Yıl</option>
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
                  <option value="timestamp-desc">Tarih (Yeni)</option>
                  <option value="timestamp-asc">Tarih (Eski)</option>
                  <option value="amount-desc">Tutar (Yüksek)</option>
                  <option value="amount-asc">Tutar (Düşük)</option>
                </select>
              </div>
            </div>

            {/* Zaman Çizelgesi */}
            {activeTab === 'timeline' && (
              <div className="space-y-4">
                {sortedHistoryItems.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <HistoryIcon className="w-16 h-16 mx-auto mb-6 text-gray-400" />
                    <p className="text-xl font-medium">Geçmiş bulunamadı.</p>
                    <p className="text-sm mt-2">Filtreleri ayarlayarak arama yapabilirsiniz.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sortedHistoryItems.map((item) => {
                      const typeInfo = getTypeInfo(item.type);
                      const statusInfo = getStatusInfo(item.status);

                      return (
                        <div key={item.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            typeInfo.color === 'blue' ? 'bg-blue-100' :
                            typeInfo.color === 'green' ? 'bg-green-100' :
                            typeInfo.color === 'purple' ? 'bg-purple-100' :
                            typeInfo.color === 'orange' ? 'bg-orange-100' :
                            'bg-gray-100'
                          }`}>
                            <div className={`${
                              typeInfo.color === 'blue' ? 'text-blue-600' :
                              typeInfo.color === 'green' ? 'text-green-600' :
                              typeInfo.color === 'purple' ? 'text-purple-600' :
                              typeInfo.color === 'orange' ? 'text-orange-600' :
                              'text-gray-600'
                            }`}>
                              {typeInfo.icon}
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-lg font-medium text-gray-900">{item.title}</h3>
                              <div className="flex items-center space-x-2">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  statusInfo.color === 'green' ? 'bg-green-100 text-green-800' :
                                  statusInfo.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                                  statusInfo.color === 'red' ? 'bg-red-100 text-red-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {statusInfo.icon} <span className="ml-1">{typeInfo.text}</span>
                                </span>
                                <span className="text-sm text-gray-500">
                                  {new Date(item.timestamp).toLocaleDateString('tr-TR')}
                                </span>
                              </div>
                            </div>
                            <p className="text-gray-600 mb-2">{item.description}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              {item.amount && (
                                <span className="font-medium text-gray-900">₺{item.amount.toLocaleString()}</span>
                              )}
                              {item.carrierName && (
                                <span>Taşıyıcı: {item.carrierName}</span>
                              )}
                              {item.location && (
                                <span>Konum: {item.location}</span>
                              )}
                              {item.shipmentId && (
                                <button
                                  onClick={() => navigate(`/individual/shipments/${item.shipmentId}`)}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  #{item.shipmentId}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Gönderiler */}
            {activeTab === 'shipments' && (
              <div className="space-y-4">
                {sortedShipmentHistory.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Package className="w-16 h-16 mx-auto mb-6 text-gray-400" />
                    <p className="text-xl font-medium">Gönderi bulunamadı.</p>
                    <p className="text-sm mt-2">Filtreleri ayarlayarak arama yapabilirsiniz.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sortedShipmentHistory.map((shipment) => {
                      const statusInfo = getShipmentStatusInfo(shipment.status);
                      const cargoInfo = getCargoTypeInfo(shipment.cargoType);

                      return (
                        <div key={shipment.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-4">
                              <div className="text-2xl">{cargoInfo.icon}</div>
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">{shipment.title}</h3>
                                <p className="text-sm text-gray-600">{shipment.description}</p>
                                <p className="text-xs text-gray-500 mt-1">#{shipment.trackingCode}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                statusInfo.color === 'green' ? 'bg-green-100 text-green-800' :
                                statusInfo.color === 'red' ? 'bg-red-100 text-red-800' :
                                statusInfo.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {statusInfo.icon} <span className="ml-1">{statusInfo.text}</span>
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-600">{shipment.fromCity} → {shipment.toCity}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-600">{new Date(shipment.date).toLocaleDateString('tr-TR')}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Weight className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-600">{shipment.weight} kg / {shipment.volume} m³</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <DollarSign className="w-4 h-4 text-gray-500" />
                              <span className="text-sm font-medium text-gray-900">₺{shipment.price.toLocaleString()}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <Truck className="w-4 h-4 text-gray-500" />
                                <span className="text-sm text-gray-600">{shipment.carrierName}</span>
                              </div>
                              {shipment.rating > 0 && (
                                <div className="flex items-center space-x-1">
                                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                  <span className="text-sm text-gray-600">{shipment.rating}</span>
                                </div>
                              )}
                              {shipment.deliveryDate && (
                                <div className="flex items-center space-x-2">
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                  <span className="text-sm text-gray-600">
                                    Teslim: {new Date(shipment.deliveryDate).toLocaleDateString('tr-TR')}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => navigate(`/individual/shipments/${shipment.id}`)}
                                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                              >
                                Detaylar
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Analitik */}
            {activeTab === 'analytics' && statistics && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Aylık İstatistikler</h3>
                    <div className="space-y-3">
                      {statistics.monthlyStats.map((stat, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{stat.month}</span>
                          <div className="flex items-center space-x-4">
                            <span className="text-sm font-medium text-gray-900">{stat.shipments} gönderi</span>
                            <span className="text-sm text-gray-500">₺{stat.spent.toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">En Çok Kullanılan</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Favori Taşıyıcı</span>
                        <span className="text-sm font-medium text-gray-900">{statistics.favoriteCarrier}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">En Çok Kullanılan Rota</span>
                        <span className="text-sm font-medium text-gray-900">{statistics.mostUsedRoute}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Tasarruf</h3>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-2">₺{statistics.totalSavings.toLocaleString()}</div>
                      <p className="text-sm text-gray-600">Toplam Tasarruf</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default IndividualHistory;