import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  MapPin, 
  Search, 
  Truck, 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Navigation,
  Route,
  Calendar,
  Phone,
  MessageSquare,
  RefreshCw,
  Play,
  Pause,
  RotateCcw,
  Filter,
  SortAsc,
  SortDesc,
  Eye,
  EyeOff,
  Download,
  Share2,
  Bell,
  BellOff,
  Star,
  Map,
  Globe,
  Zap,
  Shield,
  DollarSign,
  Timer,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  ExternalLink,
  Info,
  AlertTriangle,
  CheckCircle2,
  Clock3
} from 'lucide-react';

interface TrackingEvent {
  id: string;
  location: string;
  timestamp: string;
  description: string;
  status: 'completed' | 'in-progress' | 'pending' | 'delayed';
  coordinates: {
    lat: number;
    lng: number;
  };
  estimatedTime?: string;
  actualTime?: string;
  notes?: string;
}

interface Shipment {
  id: string;
  trackingNumber: string;
  title: string;
  status: 'pending' | 'in-transit' | 'delivered' | 'exception' | 'cancelled';
  currentLocation: string;
  estimatedDelivery: string;
  carrier: {
    name: string;
    company: string;
    phone: string;
    email: string;
    rating: number;
    totalShipments: number;
    successRate: number;
    avatar?: string;
  };
  route: {
    origin: string;
    destination: string;
    distance: number;
    estimatedTime: string;
  };
  timeline: TrackingEvent[];
  isLive: boolean;
  lastUpdate: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  value: number;
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  specialRequirements: string[];
  insurance: boolean;
  signatureRequired: boolean;
  fragile: boolean;
  temperatureControlled: boolean;
}

const IndividualLiveTracking: React.FC = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [sortBy, setSortBy] = useState<'date' | 'status' | 'priority' | 'carrier'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'in-transit' | 'delivered' | 'exception'>('all');
  const [showMap, setShowMap] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [expandedTimeline, setExpandedTimeline] = useState(false);

  // Mock data with more realistic and detailed information
  const mockShipments: Shipment[] = [
    {
      id: '1',
      trackingNumber: 'YN123456789',
      title: 'Ev Eşyası Taşıma - 3+1 Daire',
      status: 'in-transit',
      currentLocation: 'Eskişehir, Türkiye',
      estimatedDelivery: '15 Mart 2024',
      carrier: {
        name: 'Ahmet Kaya',
        company: 'Hızlı Nakliyat',
        phone: '+90 555 123 45 67',
        email: 'ahmet@hizlinakliyat.com',
        rating: 4.8,
        totalShipments: 1250,
        successRate: 98.5,
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'
      },
      route: {
        origin: 'İstanbul',
        destination: 'Ankara',
        distance: 350,
        estimatedTime: '2 gün'
      },
      timeline: [
        {
          id: '1',
          location: 'İstanbul, Türkiye',
          timestamp: '2024-03-12T10:00:00',
          description: 'Gönderi alındı ve paketlendi',
          status: 'completed',
          coordinates: { lat: 41.0082, lng: 28.9784 },
          actualTime: '10:15',
          notes: 'Mobilyalar özel ambalajlama ile paketlendi'
        },
        {
          id: '2',
          location: 'İstanbul, Türkiye',
          timestamp: '2024-03-12T16:00:00',
          description: 'Transfer merkezine ulaştı',
          status: 'completed',
          coordinates: { lat: 41.0082, lng: 28.9784 },
          actualTime: '16:30',
          notes: 'Güvenlik kontrolü tamamlandı'
        },
        {
          id: '3',
          location: 'Eskişehir, Türkiye',
          timestamp: '2024-03-13T08:00:00',
          description: 'Transfer merkezinden çıktı',
          status: 'completed',
          coordinates: { lat: 39.7767, lng: 30.5206 },
          actualTime: '08:15',
          notes: 'Ankara yönüne doğru yola çıktı'
        },
        {
          id: '4',
          location: 'Eskişehir, Türkiye',
          timestamp: '2024-03-13T14:30:00',
          description: 'Dağıtım merkezine ulaştı',
          status: 'in-progress',
          coordinates: { lat: 39.7767, lng: 30.5206 },
          estimatedTime: '15:00',
          notes: 'Son kontroller yapılıyor'
        },
        {
          id: '5',
          location: 'Ankara, Türkiye',
          timestamp: '2024-03-15T10:00:00',
          description: 'Teslim edilecek',
          status: 'pending',
          coordinates: { lat: 39.9334, lng: 32.8597 },
          estimatedTime: '10:00-14:00',
          notes: 'Teslimat için randevu alındı'
        }
      ],
      isLive: true,
      lastUpdate: '2024-03-13T14:30:00',
      priority: 'high',
      value: 25000,
      weight: 1200,
      dimensions: { length: 200, width: 150, height: 100 },
      specialRequirements: ['Özel Ambalajlama', 'Sigorta', 'Hassas Taşıma'],
      insurance: true,
      signatureRequired: true,
      fragile: true,
      temperatureControlled: false
    },
    {
      id: '2',
      trackingNumber: 'YN987654321',
      title: 'Ofis Mobilyası Taşıma',
      status: 'delivered',
      currentLocation: 'Bursa, Türkiye',
      estimatedDelivery: '20 Mart 2024',
      carrier: {
        name: 'Mehmet Yılmaz',
        company: 'Güvenli Taşıma',
        phone: '+90 555 987 65 43',
        email: 'mehmet@guvenlitasima.com',
        rating: 4.9,
        totalShipments: 2100,
        successRate: 99.2,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face'
      },
      route: {
        origin: 'İzmir',
        destination: 'Bursa',
        distance: 280,
        estimatedTime: '1.5 gün'
      },
      timeline: [
        {
          id: '1',
          location: 'İzmir, Türkiye',
          timestamp: '2024-03-16T09:00:00',
          description: 'Gönderi alındı',
          status: 'completed',
          coordinates: { lat: 38.4192, lng: 27.1287 },
          actualTime: '09:15'
        },
        {
          id: '2',
          location: 'Bursa, Türkiye',
          timestamp: '2024-03-17T18:00:00',
          description: 'Başarıyla teslim edildi',
          status: 'completed',
          coordinates: { lat: 40.1826, lng: 29.0665 },
          actualTime: '18:30',
          notes: 'Müşteri memnuniyeti ile teslim edildi'
        }
      ],
      isLive: false,
      lastUpdate: '2024-03-17T18:00:00',
      priority: 'normal',
      value: 8500,
      weight: 450,
      dimensions: { length: 120, width: 80, height: 60 },
      specialRequirements: ['Sigorta'],
      insurance: true,
      signatureRequired: true,
      fragile: false,
      temperatureControlled: false
    },
    {
      id: '3',
      trackingNumber: 'YN112233445',
      title: 'Kişisel Eşya Gönderimi',
      status: 'exception',
      currentLocation: 'Antalya, Türkiye',
      estimatedDelivery: '05 Mart 2024',
      carrier: {
        name: 'Fatma Demir',
        company: 'Express Kargo',
        phone: '+90 555 112 23 34',
        email: 'fatma@expresskargo.com',
        rating: 4.6,
        totalShipments: 890,
        successRate: 96.8,
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face'
      },
      route: {
        origin: 'Antalya',
        destination: 'İstanbul',
        distance: 480,
        estimatedTime: '2.5 gün'
      },
      timeline: [
        {
          id: '1',
          location: 'Antalya, Türkiye',
          timestamp: '2024-03-03T14:00:00',
          description: 'Gönderi alındı',
          status: 'completed',
          coordinates: { lat: 36.8969, lng: 30.7133 },
          actualTime: '14:20'
        },
        {
          id: '2',
          location: 'Antalya, Türkiye',
          timestamp: '2024-03-04T10:00:00',
          description: 'Adres yetersizliği nedeniyle teslimat yapılamadı',
          status: 'delayed',
          coordinates: { lat: 36.8969, lng: 30.7133 },
          notes: 'Müşteri ile iletişime geçiliyor'
        }
      ],
      isLive: true,
      lastUpdate: '2024-03-04T10:00:00',
      priority: 'normal',
      value: 3200,
      weight: 25,
      dimensions: { length: 40, width: 30, height: 20 },
      specialRequirements: [],
      insurance: false,
      signatureRequired: false,
      fragile: false,
      temperatureControlled: false
    },
    {
      id: '4',
      trackingNumber: 'YN556677889',
      title: 'Elektronik Cihaz Taşıma',
      status: 'pending',
      currentLocation: 'İstanbul, Türkiye',
      estimatedDelivery: '18 Mart 2024',
      carrier: {
        name: 'Ali Özkan',
        company: 'Premium Lojistik',
        phone: '+90 555 556 67 78',
        email: 'ali@premiumlojistik.com',
        rating: 4.7,
        totalShipments: 1560,
        successRate: 97.8,
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face'
      },
      route: {
        origin: 'İstanbul',
        destination: 'İzmir',
        distance: 340,
        estimatedTime: '1 gün'
      },
      timeline: [
        {
          id: '1',
          location: 'İstanbul, Türkiye',
          timestamp: '2024-03-17T11:00:00',
          description: 'Gönderi alındı',
          status: 'completed',
          coordinates: { lat: 41.0082, lng: 28.9784 },
          actualTime: '11:30',
          notes: 'Elektronik cihazlar özel koruma ile paketlendi'
        }
      ],
      isLive: true,
      lastUpdate: '2024-03-17T11:00:00',
      priority: 'urgent',
      value: 15000,
      weight: 8,
      dimensions: { length: 50, width: 40, height: 15 },
      specialRequirements: ['Hassas Taşıma', 'Sigorta', 'Sıcaklık Kontrolü'],
      insurance: true,
      signatureRequired: true,
      fragile: true,
      temperatureControlled: true
    }
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setShipments(mockShipments);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Simulate live updates
  useEffect(() => {
    if (!isLiveMode) return;

    const interval = setInterval(() => {
      setLastUpdate(new Date());
      // Simulate live updates
      setShipments(prev => prev.map(shipment => {
        if (shipment.isLive && shipment.status === 'in-transit') {
          // Simulate location updates
          return {
            ...shipment,
            lastUpdate: new Date().toISOString()
          };
        }
        return shipment;
      }));
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [isLiveMode]);

  const filteredAndSortedShipments = shipments
    .filter(shipment => {
      const matchesSearch = shipment.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           shipment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           shipment.carrier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           shipment.carrier.company.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || shipment.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.lastUpdate).getTime() - new Date(b.lastUpdate).getTime();
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'carrier':
          comparison = a.carrier.name.localeCompare(b.carrier.name);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const getStatusIcon = (status: Shipment['status']) => {
    switch (status) {
      case 'pending':
        return <Clock3 className="w-6 h-6 text-yellow-500" />;
      case 'in-transit':
        return <Truck className="w-6 h-6 text-blue-500" />;
      case 'delivered':
        return <CheckCircle2 className="w-6 h-6 text-green-500" />;
      case 'exception':
        return <AlertTriangle className="w-6 h-6 text-red-500" />;
          case 'cancelled':
            return <XCircle className="w-6 h-6 text-slate-500" />;
      default:
        return <MapPin className="w-6 h-6 text-slate-500" />;
    }
  };

  const getStatusText = (status: Shipment['status']) => {
    switch (status) {
      case 'pending':
        return 'Beklemede';
      case 'in-transit':
        return 'Yolda';
      case 'delivered':
        return 'Teslim Edildi';
      case 'exception':
        return 'Problem Oluştu';
      case 'cancelled':
        return 'İptal Edildi';
      default:
        return 'Bilinmiyor';
    }
  };

  const getStatusColor = (status: Shipment['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in-transit':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'exception':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: Shipment['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'normal':
        return 'bg-blue-500';
      case 'low':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPriorityText = (priority: Shipment['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'Acil';
      case 'high':
        return 'Yüksek';
      case 'normal':
        return 'Normal';
      case 'low':
        return 'Düşük';
      default:
        return 'Normal';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-slate-800 to-blue-900 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Navigation className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900">Canlı takip yükleniyor...</h2>
          <p className="text-slate-600 mt-2">Gönderileriniz hazırlanıyor</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Canlı Takip - YolNet</title>
        <meta name="description" content="Gönderilerinizi gerçek zamanlı olarak takip edin" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-slate-800 to-blue-900 rounded-2xl flex items-center justify-center shadow-lg">
              <Navigation className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Canlı{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-blue-900">
              Takip
            </span>
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Gönderilerinizi gerçek zamanlı olarak takip edin ve anlık güncellemeler alın
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{shipments.length}</div>
                <div className="text-sm text-slate-600">Toplam Gönderi</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl flex items-center justify-center">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{shipments.filter(s => s.status === 'in-transit').length}</div>
                <div className="text-sm text-slate-600">Yolda</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{shipments.filter(s => s.status === 'pending').length}</div>
                <div className="text-sm text-slate-600">Beklemede</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{shipments.filter(s => s.isLive).length}</div>
                <div className="text-sm text-slate-600">Canlı Takip</div>
              </div>
            </div>
          </div>
        </div>

        {/* Control Panel */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Live Mode Toggle */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isLiveMode ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                <span className="font-semibold text-slate-900">
                  {isLiveMode ? 'Canlı Mod Aktif' : 'Canlı Mod Kapalı'}
                </span>
              </div>
              <span className="text-sm text-slate-600">
                Son güncelleme: {lastUpdate.toLocaleTimeString('tr-TR')}
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setIsLiveMode(!isLiveMode)}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  isLiveMode 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isLiveMode ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isLiveMode ? 'Durdur' : 'Başlat'}
              </button>
              
              <button className="px-4 py-2 border border-gray-300 text-slate-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Yenile
              </button>

              <button
                onClick={() => setShowMap(!showMap)}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  showMap ? 'bg-slate-800 text-white hover:bg-slate-700' : 'border border-gray-300 text-slate-700 hover:bg-gray-50'
                }`}
              >
                <Map className="w-4 h-4" />
                Harita
              </button>

              <button
                onClick={() => setNotifications(!notifications)}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  notifications ? 'bg-green-600 text-white' : 'border border-gray-300 text-slate-700 hover:bg-gray-50'
                }`}
              >
                {notifications ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                Bildirimler
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Takip numarası, gönderi başlığı veya nakliyeci ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
              >
                <option value="all">Tüm Durumlar</option>
                <option value="pending">Beklemede</option>
                <option value="in-transit">Yolda</option>
                <option value="delivered">Teslim Edildi</option>
                <option value="exception">Problem</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
              >
                <option value="date">Tarihe Göre</option>
                <option value="status">Duruma Göre</option>
                <option value="priority">Önceliğe Göre</option>
                <option value="carrier">Nakliyeciye Göre</option>
              </select>

              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1"
              >
                {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Shipments List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-slate-900">Aktif Gönderiler</h2>
                <p className="text-sm text-slate-600">{filteredAndSortedShipments.length} gönderi</p>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {filteredAndSortedShipments.map((shipment) => (
                  <div
                    key={shipment.id}
                    onClick={() => setSelectedShipment(shipment)}
                    className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedShipment?.id === shipment.id ? 'bg-slate-50 border-l-4 border-l-slate-800' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        {getStatusIcon(shipment.status)}
                        {shipment.isLive && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-slate-900 truncate">{shipment.title}</h3>
                          <div className="flex items-center gap-1">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(shipment.status)}`}>
                              {getStatusText(shipment.status)}
                            </span>
                            <div className={`w-2 h-2 rounded-full ${getPriorityColor(shipment.priority)}`} title={getPriorityText(shipment.priority)}></div>
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 mb-1">{shipment.trackingNumber}</p>
                        <p className="text-sm text-slate-500 truncate">{shipment.carrier.name} - {shipment.carrier.company}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {shipment.route.origin} → {shipment.route.destination}
                        </p>
                        <p className="text-xs text-slate-400">
                          Son güncelleme: {new Date(shipment.lastUpdate).toLocaleTimeString('tr-TR')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tracking Details */}
          <div className="lg:col-span-2">
            {selectedShipment ? (
              <div className="space-y-6">
                {/* Shipment Header */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        {getStatusIcon(selectedShipment.status)}
                        {selectedShipment.isLive && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        )}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-slate-900">{selectedShipment.title}</h2>
                        <p className="text-slate-600">{selectedShipment.trackingNumber}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(selectedShipment.status)}`}>
                            {getStatusText(selectedShipment.status)}
                          </span>
                          <div className={`w-2 h-2 rounded-full ${getPriorityColor(selectedShipment.priority)}`} title={getPriorityText(selectedShipment.priority)}></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <Download className="w-4 h-4 text-slate-500" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <Share2 className="w-4 h-4 text-slate-500" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <MoreVertical className="w-4 h-4 text-slate-500" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-2 text-white">
                      <MapPin className="w-4 h-4 text-slate-500" />
                      <span className="font-medium">Mevcut Konum:</span>
                      <span>{selectedShipment.currentLocation}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <span className="font-medium">Tahmini Teslimat:</span>
                      <span>{selectedShipment.estimatedDelivery}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white">
                      <Route className="w-4 h-4 text-slate-500" />
                      <span className="font-medium">Rota:</span>
                      <span>{selectedShipment.route.origin} → {selectedShipment.route.destination}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white">
                      <Package className="w-4 h-4 text-slate-500" />
                      <span className="font-medium">Mesafe:</span>
                      <span>{selectedShipment.route.distance} km</span>
                    </div>
                  </div>

                  {/* Shipment Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="w-4 h-4 text-slate-500" />
                        <span className="text-sm font-medium text-white">Değer</span>
                      </div>
                      <p className="text-lg font-semibold text-white">₺{selectedShipment.value.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Package className="w-4 h-4 text-slate-500" />
                        <span className="text-sm font-medium text-white">Ağırlık</span>
                      </div>
                      <p className="text-lg font-semibold text-white">{selectedShipment.weight} kg</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Timer className="w-4 h-4 text-slate-500" />
                        <span className="text-sm font-medium text-white">Süre</span>
                      </div>
                      <p className="text-lg font-semibold text-white">{selectedShipment.route.estimatedTime}</p>
                    </div>
                  </div>

                  {/* Special Requirements */}
                  {selectedShipment.specialRequirements.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-white mb-2">Özel Gereksinimler</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedShipment.specialRequirements.map((req, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-medium">
                            {req}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Carrier Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center">
                          <Truck className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{selectedShipment.carrier.name}</h3>
                          <p className="text-sm text-gray-300">{selectedShipment.carrier.company}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-500" />
                              <span className="text-sm text-white">{selectedShipment.carrier.rating}/5</span>
                            </div>
                            <span className="text-xs text-slate-500">•</span>
                            <span className="text-xs text-slate-500">{selectedShipment.carrier.totalShipments} gönderi</span>
                            <span className="text-xs text-slate-500">•</span>
                            <span className="text-xs text-slate-500">%{selectedShipment.carrier.successRate} başarı</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                          <Phone className="w-4 h-4 text-gray-300" />
                        </button>
                        <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                          <MessageSquare className="w-4 h-4 text-gray-300" />
                        </button>
                        <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                          <ExternalLink className="w-4 h-4 text-gray-300" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-white">Gönderi Geçmişi</h3>
                    <button
                      onClick={() => setExpandedTimeline(!expandedTimeline)}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      {expandedTimeline ? 'Daha Az Göster' : 'Tümünü Göster'}
                      {expandedTimeline ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="space-y-4">
                    {(expandedTimeline ? selectedShipment.timeline : selectedShipment.timeline.slice(0, 3)).map((event, index) => (
                      <div key={event.id} className="flex items-start gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-4 h-4 rounded-full ${
                            event.status === 'completed' ? 'bg-green-500' :
                            event.status === 'in-progress' ? 'bg-blue-500 animate-pulse' :
                            event.status === 'delayed' ? 'bg-red-500' :
                            'bg-gray-300'
                          }`}></div>
                          {index < (expandedTimeline ? selectedShipment.timeline.length - 1 : Math.min(2, selectedShipment.timeline.length - 1)) && (
                            <div className="w-px h-8 bg-gray-300 mt-2"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-white">{event.description}</p>
                              <p className="text-sm text-gray-300">{event.location}</p>
                              <p className="text-xs text-slate-500 mt-1">
                                {new Date(event.timestamp).toLocaleString('tr-TR')}
                                {event.actualTime && (
                                  <span className="ml-2 text-green-600">(Gerçek: {event.actualTime})</span>
                                )}
                              </p>
                              {event.notes && (
                                <p className="text-xs text-slate-500 mt-1 italic">{event.notes}</p>
                              )}
                            </div>
                            {event.estimatedTime && (
                              <div className="text-right">
                                <p className="text-xs text-slate-500">Tahmini</p>
                                <p className="text-sm font-medium text-white">{event.estimatedTime}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {!expandedTimeline && selectedShipment.timeline.length > 3 && (
                      <div className="text-center pt-2">
                        <button
                          onClick={() => setExpandedTimeline(true)}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          +{selectedShipment.timeline.length - 3} daha fazla göster
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 h-96 flex items-center justify-center">
                <div className="text-center">
                  <Navigation className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Gönderi Seçin</h3>
                  <p className="text-gray-300">Detayları görüntülemek için sol taraftan bir gönderi seçin</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndividualLiveTracking;