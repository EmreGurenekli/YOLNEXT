import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { createApiUrl } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import { 
  MapPin, 
  Search, 
  Truck, 
  Package, 
  Clock, 
  AlertCircle,
  Navigation,
  Route,
  Calendar,
  MessageSquare,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Star,
  DollarSign,
  Timer,
  Clock3,
  User
} from 'lucide-react';

interface TrackingEvent {
  id: string;
  location: string;
  timestamp: string;
  description: string;
  status: 'completed' | 'in-progress' | 'pending' | 'delayed';
}

interface Shipment {
  id: string;
  trackingNumber: string;
  trackingCode?: string;
  title: string;
  status: 'offer_accepted' | 'in_transit' | 'accepted' | 'in_progress' | 'assigned' | 'picked_up';
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
    id?: string;
  };
  driver?: {
    name: string;
    phone: string;
    email: string;
    id?: string;
  };
  route: {
    origin: string;
    destination: string;
    estimatedTime: string;
  };
  timeline: TrackingEvent[];
  isLive: boolean;
  lastUpdate: string;
  value: number;
  specialRequirements: string[];
  pickupDate?: string;
  deliveryDate?: string;
}

const IndividualLiveTracking: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'status' | 'carrier'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterStatus, setFilterStatus] = useState<'all' | 'offer_accepted' | 'in_transit' | 'in_progress' | 'accepted'>('all');
  const [expandedTimeline, setExpandedTimeline] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadShipments();
    }
  }, [user?.id]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading && !refreshing && user?.id) {
        loadShipments(true);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [loading, refreshing, user?.id]);

  const loadShipments = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);
      
      const token = localStorage.getItem('authToken');
      const userId = user?.id;
      
      if (!userId) {
        setShipments([]);
        setLoading(false);
        return;
      }
      
      const params = new URLSearchParams({
        page: '1',
        limit: '100',
        userId: userId.toString(),
      });
      
      const response = await fetch(createApiUrl(`/api/shipments?${params.toString()}`), {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Gönderiler yüklenemedi');
      }

      const data = await response.json();
      const allShipments = data.data?.shipments || data.shipments || (Array.isArray(data.data) ? data.data : []) || [];
      
      // Filter for active shipments that can be tracked
      const activeShipments = allShipments.filter((s: Record<string, unknown>) => {
        const status = String(s.status || '');
        return ['offer_accepted', 'in_transit', 'accepted', 'in_progress', 'assigned', 'picked_up'].includes(status) && 
               status !== 'delivered' && 
               status !== 'cancelled';
      });

      // Load timeline and map shipments
      const mappedShipments = await Promise.all(activeShipments.map(async (shipment: Record<string, unknown>) => {
        // Load detailed shipment info including driver and timeline
        let shipmentDetails: Record<string, unknown> = shipment;
        let timeline: TrackingEvent[] = [];
        
        try {
          const detailResponse = await fetch(createApiUrl(`/api/shipments/${shipment.id}`), {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          if (detailResponse.ok) {
            const detailData = await detailResponse.json();
            if (detailData.success && detailData.data) {
              shipmentDetails = { ...shipment, ...detailData.data };
              // Create timeline from real shipment data
              timeline = createTimelineFromShipment(shipmentDetails);
            }
          }
        } catch (err) {
          console.error('Error loading shipment details:', err);
        }

        return {
          id: shipmentDetails.id?.toString() || '',
          trackingNumber: String(shipmentDetails.trackingNumber || shipmentDetails.tracking_code || shipmentDetails.trackingCode || shipmentDetails.id || ''),
          trackingCode: String(shipmentDetails.trackingCode || shipmentDetails.tracking_code || shipmentDetails.trackingNumber || ''),
          title: shipmentDetails.title || shipmentDetails.productDescription || 'Gönderi',
          status: shipmentDetails.status as Shipment['status'],
          carrier: {
            name: String(shipmentDetails.carrierName || shipmentDetails.nakliyeciName || 'Nakliyeci'),
            company: String(shipmentDetails.carrierCompany || shipmentDetails.nakliyeciCompany || ''),
            phone: '',
            email: '',
            rating: Number(shipmentDetails.carrierRating || 0),
            totalShipments: Number(shipmentDetails.carrierTotalShipments || 0),
            successRate: Number(shipmentDetails.carrierSuccessRate || 0),
            id: String(shipmentDetails.carrierId || shipmentDetails.nakliyeci_id || ''),
          },
          driver: shipmentDetails.driverName ? {
            name: String(shipmentDetails.driverName || ''),
            phone: '',
            email: '',
            id: String(shipmentDetails.driverId || shipmentDetails.driver_id || ''),
          } : undefined,
          route: {
            origin: String(shipmentDetails.pickupCity || shipmentDetails.fromCity || shipmentDetails.pickup_address || shipmentDetails.pickupCity || ''),
            destination: String(shipmentDetails.deliveryCity || shipmentDetails.toCity || shipmentDetails.delivery_address || shipmentDetails.deliveryCity || ''),
            estimatedTime: String(shipmentDetails.estimatedDelivery || shipmentDetails.deliveryDate || ''),
          },
          lastUpdate: shipmentDetails.updatedAt || shipmentDetails.updated_at || shipmentDetails.createdAt || shipmentDetails.created_at || new Date().toISOString(),
          isLive: shipmentDetails.status === 'in_transit' || shipmentDetails.status === 'picked_up',
          estimatedDelivery: shipmentDetails.deliveryDate || shipmentDetails.estimatedDelivery || '',
          currentLocation: String(shipmentDetails.currentLocation || (shipmentDetails.status === 'in_transit' ? 'Yolda' : '')),
          timeline,
          value: typeof shipmentDetails.price === 'string' ? parseFloat(shipmentDetails.price) || 0 : (shipmentDetails.price || 0),
          specialRequirements: Array.isArray(shipmentDetails.specialRequirements) ? shipmentDetails.specialRequirements : 
            (shipmentDetails.special_requirements ? [shipmentDetails.special_requirements] : []),
          pickupDate: shipmentDetails.pickupDate || shipmentDetails.pickup_date,
          deliveryDate: shipmentDetails.deliveryDate || shipmentDetails.delivery_date,
        };
      }));
      
      setShipments(mappedShipments);
      
      // URL parametresinden shipmentId varsa, gönderiyi seç
      const shipmentId = searchParams.get('shipmentId');
      if (shipmentId && mappedShipments.length > 0) {
        const shipment = mappedShipments.find(s => {
          const sId = s.id?.toString() || '';
          const paramId = shipmentId.toString();
          return sId === paramId || s.id === shipmentId;
        });
        if (shipment) {
          setSelectedShipment(shipment);
        }
      } else if (mappedShipments.length > 0 && !selectedShipment) {
        // İlk gönderiyi otomatik seç
        setSelectedShipment(mappedShipments[0]);
      }
    } catch (error) {
      console.error('Error loading shipments for tracking:', error);
      setError(error instanceof Error ? error.message : 'Gönderiler yüklenirken bir hata oluştu');
      setShipments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const createTimelineFromShipment = (shipment: Record<string, unknown>): TrackingEvent[] => {
    const timeline: TrackingEvent[] = [];
    const now = new Date().toISOString();
    const status = String(shipment.status || '');
    const pickupCity = String(shipment.pickupCity || shipment.fromCity || shipment.pickupCity || '');

    // Gönderi oluşturuldu
    timeline.push({
      id: 'created',
      location: pickupCity,
      timestamp: String(shipment.createdAt || shipment.created_at || now),
      description: 'Gönderi oluşturuldu',
      status: 'completed',
    });

    // Teklif kabul edildi
    if (status === 'offer_accepted' || status === 'accepted') {
      timeline.push({
        id: 'offer_accepted',
        location: pickupCity,
        timestamp: String(shipment.updatedAt || shipment.updated_at || shipment.createdAt || shipment.created_at || now),
        description: 'Teklif kabul edildi - Nakliyeci atandı',
        status: 'completed',
      });
    }

    // Taşıyıcı atandı
    if ((status === 'in_progress' || status === 'assigned' || status === 'picked_up' || status === 'in_transit') && shipment.driverName) {
      timeline.push({
        id: 'driver_assigned',
        location: pickupCity,
        timestamp: String(shipment.updatedAt || shipment.updated_at || now),
        description: `Taşıyıcı atandı: ${String(shipment.driverName)}`,
        status: 'completed',
      });
    }

    // Yük alındı (picked_up durumu)
    if (status === 'picked_up') {
      timeline.push({
        id: 'picked_up',
        location: pickupCity,
        timestamp: String(shipment.updatedAt || shipment.updated_at || now),
        description: 'Yük alındı - Taşıyıcı yükü teslim aldı',
        status: 'completed',
      });
    }

    // Yolda (in_transit durumu)
    if (status === 'in_transit') {
      // Eğer picked_up yoksa, yük alındı olayını ekle
      if (!timeline.find(e => e.id === 'picked_up')) {
        timeline.push({
          id: 'picked_up',
          location: pickupCity,
          timestamp: String(shipment.updatedAt || shipment.updated_at || now),
          description: 'Yük alındı - Taşıyıcı yükü teslim aldı',
          status: 'completed',
        });
      }
      
      timeline.push({
        id: 'in_transit',
        location: String(shipment.currentLocation || 'Yolda'),
        timestamp: String(shipment.updatedAt || shipment.updated_at || now),
        description: 'Yolda - Gönderi teslimat noktasına doğru ilerliyor',
        status: 'in-progress',
      });
    }

    return timeline;
  };

  const filteredAndSortedShipments = shipments
    .filter((shipment: Shipment) => {
      const searchLower = (searchTerm || '').toLowerCase();
      const matchesSearch = (shipment.trackingNumber || '').toLowerCase().includes(searchLower) ||
                           (shipment.trackingCode || '').toLowerCase().includes(searchLower) ||
                           (shipment.title || '').toLowerCase().includes(searchLower) ||
                           (shipment.carrier?.name || '').toLowerCase().includes(searchLower) ||
                           (shipment.carrier?.company || '').toLowerCase().includes(searchLower);
      const matchesStatus = filterStatus === 'all' || shipment.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a: Shipment, b: Shipment) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.lastUpdate).getTime() - new Date(b.lastUpdate).getTime();
          break;
        case 'status': {
          const statusOrder: Record<string, number> = { 'in_transit': 1, 'picked_up': 2, 'in_progress': 3, 'assigned': 3, 'accepted': 4, 'offer_accepted': 5 };
          comparison = (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
          break;
        }
        case 'carrier': {
          const nameA = (a.carrier?.name || '').toLowerCase();
          const nameB = (b.carrier?.name || '').toLowerCase();
          comparison = nameA.localeCompare(nameB);
          break;
        }
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const getStatusIcon = (status: Shipment['status']) => {
    switch (status) {
      case 'offer_accepted':
      case 'accepted':
        return <Clock3 className="w-6 h-6 text-yellow-500" />;
      case 'in_progress':
      case 'assigned':
        return <Truck className="w-6 h-6 text-blue-500" />;
      case 'picked_up':
      case 'in_transit':
        return <Truck className="w-6 h-6 text-blue-500 animate-pulse" />;
      default:
        return <Package className="w-6 h-6 text-slate-500" />;
    }
  };

  const getStatusText = (status: Shipment['status']) => {
    switch (status) {
      case 'offer_accepted':
        return 'Teklif Kabul Edildi';
      case 'accepted':
        return 'Kabul Edildi';
      case 'in_progress':
      case 'assigned':
        return 'Taşıyıcı Atandı';
      case 'picked_up':
        return 'Yük Alındı';
      case 'in_transit':
        return 'Yolda';
      default:
        return 'Bilinmiyor';
    }
  };

  const getStatusColor = (status: Shipment['status']) => {
    switch (status) {
      case 'offer_accepted':
      case 'accepted':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress':
      case 'assigned':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'picked_up':
      case 'in_transit':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleRefresh = () => {
    loadShipments(false);
  };

  const handleMessage = (shipment: Shipment) => {
    if (shipment.carrier.id) {
      // Navigate to messages page with userId parameter to auto-open conversation
      navigate(`/individual/messages?userId=${shipment.carrier.id}&shipmentId=${shipment.id}`);
    }
  };

  const isMessagingEnabledForShipment = (status: any) => {
    const s = String(status || '').trim();
    return s === 'offer_accepted' || s === 'accepted' || s === 'in_transit' || s === 'delivered';
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
                <div className="text-2xl font-bold text-slate-900">{shipments.filter(s => s.status === 'in_transit' || s.status === 'picked_up').length}</div>
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
                <div className="text-2xl font-bold text-slate-900">{shipments.filter(s => s.status === 'offer_accepted' || s.status === 'accepted').length}</div>
                <div className="text-sm text-slate-600">Beklemede</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl flex items-center justify-center">
                <Navigation className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{shipments.filter(s => s.isLive).length}</div>
                <div className="text-sm text-slate-600">Canlı Takip</div>
              </div>
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
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'offer_accepted' | 'in_transit' | 'in_progress' | 'accepted')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
              >
                <option value="all">Tüm Durumlar</option>
                <option value="offer_accepted">Teklif Kabul</option>
                <option value="accepted">Kabul Edildi</option>
                <option value="in_progress">Yükleme</option>
                <option value="in_transit">Yolda</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'status' | 'carrier')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
              >
                <option value="date">Tarihe Göre</option>
                <option value="status">Duruma Göre</option>
                <option value="carrier">Nakliyeciye Göre</option>
              </select>

              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1"
                title={sortOrder === 'asc' ? 'Azalan' : 'Artan'}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>

              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1 disabled:opacity-50"
                title="Yenile"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {shipments.length === 0 && !loading && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
            <Package className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Takip edilecek gönderi yok</h3>
            <p className="text-slate-600">Şu anda aktif gönderiniz bulunmuyor.</p>
          </div>
        )}

        {shipments.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Shipments List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-slate-900">Aktif Gönderiler</h2>
                  <p className="text-sm text-slate-600">{filteredAndSortedShipments.length} gönderi</p>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {filteredAndSortedShipments.length === 0 ? (
                    <div className="p-4 text-center text-slate-500 text-sm">
                      Arama kriterlerinize uygun gönderi bulunamadı
                    </div>
                  ) : (
                    filteredAndSortedShipments.map((shipment) => (
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
                              <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(shipment.status)}`}>
                                {getStatusText(shipment.status)}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 mb-1">{shipment.trackingCode || shipment.trackingNumber}</p>
                            <p className="text-sm text-slate-500 truncate">{shipment.carrier?.name || 'Nakliyeci'} {shipment.carrier?.company ? `- ${shipment.carrier.company}` : ''}</p>
                            <p className="text-xs text-slate-400 mt-1">
                              {shipment.route.origin} → {shipment.route.destination}
                            </p>
                            <p className="text-xs text-slate-400">
                              Son güncelleme: {new Date(shipment.lastUpdate).toLocaleTimeString('tr-TR')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
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
                          <p className="text-slate-600">{selectedShipment.trackingCode || selectedShipment.trackingNumber}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(selectedShipment.status)}`}>
                              {getStatusText(selectedShipment.status)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="flex items-center gap-2 text-slate-900">
                        <MapPin className="w-4 h-4 text-slate-500" />
                        <span className="font-medium">Mevcut Konum:</span>
                        <span className="text-slate-600">{selectedShipment.currentLocation || (selectedShipment.status === 'in_transit' ? 'Yolda' : 'Bilinmiyor')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-900">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <span className="font-medium">Tahmini Teslimat:</span>
                        <span className="text-slate-600">{selectedShipment.estimatedDelivery ? new Date(selectedShipment.estimatedDelivery).toLocaleDateString('tr-TR') : 'Belirtilmemiş'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-900">
                        <Route className="w-4 h-4 text-slate-500" />
                        <span className="font-medium">Rota:</span>
                        <span className="text-slate-600">{selectedShipment.route.origin} → {selectedShipment.route.destination}</span>
                      </div>
                      {selectedShipment.pickupDate && (
                        <div className="flex items-center gap-2 text-slate-900">
                          <Calendar className="w-4 h-4 text-slate-500" />
                          <span className="font-medium">Alış Tarihi:</span>
                          <span className="text-slate-600">{new Date(selectedShipment.pickupDate).toLocaleDateString('tr-TR')}</span>
                        </div>
                      )}
                    </div>

                    {/* Shipment Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <DollarSign className="w-4 h-4 text-slate-500" />
                          <span className="text-sm font-medium text-slate-700">Değer</span>
                        </div>
                        <p className="text-lg font-semibold text-slate-900">₺{(selectedShipment.value || 0).toLocaleString('tr-TR')}</p>
                      </div>
                      {selectedShipment.route.estimatedTime && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Timer className="w-4 h-4 text-slate-500" />
                            <span className="text-sm font-medium text-slate-700">Tahmini Süre</span>
                          </div>
                          <p className="text-lg font-semibold text-slate-900">{selectedShipment.route.estimatedTime}</p>
                        </div>
                      )}
                    </div>

                    {/* Special Requirements */}
                    {selectedShipment.specialRequirements.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-sm font-medium text-slate-900 mb-2">Özel Gereksinimler</h3>
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
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center">
                            <Truck className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900">{selectedShipment.carrier?.name || 'Nakliyeci'}</h3>
                            <p className="text-sm text-slate-600">{selectedShipment.carrier?.company || 'Şirket bilgisi yok'}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {selectedShipment.carrier?.rating && selectedShipment.carrier.rating > 0 && (
                                <>
                                  <div className="flex items-center gap-1">
                                    <Star className="w-3 h-3 text-yellow-500" />
                                    <span className="text-sm text-slate-700">{selectedShipment.carrier.rating}/5</span>
                                  </div>
                                  <span className="text-xs text-slate-500">•</span>
                                </>
                              )}
                              <span className="text-xs text-slate-500">{selectedShipment.carrier?.totalShipments || 0} gönderi</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {selectedShipment.carrier?.id && isMessagingEnabledForShipment(selectedShipment.status) && (
                            <button 
                              onClick={() => handleMessage(selectedShipment)} 
                              className="p-2 hover:bg-gray-200 rounded-lg transition-colors" 
                              title="Mesaj"
                            >
                              <MessageSquare className="w-4 h-4 text-slate-600" />
                            </button>
                          )}
                          {selectedShipment.carrier?.id && isMessagingEnabledForShipment(selectedShipment.status) && (
                            <button 
                              onClick={() => handleMessage(selectedShipment)} 
                              className="p-2 hover:bg-gray-200 rounded-lg transition-colors" 
                              title="Mesaj"
                            >
                              <MessageSquare className="w-4 h-4 text-slate-600" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Driver Info */}
                    {selectedShipment.driver && (
                      <div className="bg-green-50 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-700 rounded-full flex items-center justify-center">
                              <User className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-900">Taşıyıcı: {selectedShipment.driver.name}</h3>
                            </div>
                          </div>
                          {selectedShipment.carrier?.id && isMessagingEnabledForShipment(selectedShipment.status) && (
                            <button 
                              onClick={() => handleMessage(selectedShipment)} 
                              className="p-2 hover:bg-green-200 rounded-lg transition-colors" 
                              title="Mesaj"
                            >
                              <MessageSquare className="w-4 h-4 text-green-700" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Timeline */}
                  {selectedShipment.timeline.length > 0 && (
                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-slate-900">Gönderi Geçmişi</h3>
                        {selectedShipment.timeline.length > 3 && (
                          <button
                            onClick={() => setExpandedTimeline(!expandedTimeline)}
                            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                          >
                            {expandedTimeline ? 'Daha Az Göster' : 'Tümünü Göster'}
                            {expandedTimeline ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        )}
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
                              <p className="font-medium text-slate-900">{event.description}</p>
                              <p className="text-sm text-slate-600">{event.location}</p>
                              <p className="text-xs text-slate-500 mt-1">
                                {new Date(event.timestamp).toLocaleString('tr-TR')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 h-96 flex items-center justify-center">
                  <div className="text-center">
                    <Navigation className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Gönderi Seçin</h3>
                    <p className="text-slate-600">Detayları görüntülemek için sol taraftan bir gönderi seçin</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IndividualLiveTracking;
