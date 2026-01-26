/**
 * Live Tracking Page - Individual User
 * 
 * Displays real-time tracking information for user's shipments
 * Features: Shipment list, search, filters, detailed view, timeline
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { 
  MapPin, 
  Search, 
  Truck, 
  Package, 
  Clock, 
  XCircle, 
  Navigation,
  Route,
  Calendar,
  Phone,
  MessageSquare,
  Download,
  Share2,
  Star,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  DollarSign,
  Timer
} from 'lucide-react';
import { createApiUrl } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import { safeJsonParse } from '../../utils/safeFetch';
import { getStatusText as getShipmentStatusText } from '../../utils/shipmentStatus';

// ============================================================================
// Types & Interfaces
// ============================================================================

interface TrackingEvent {
  id: string;
  location: string;
  timestamp: string;
  description: string;
  status: 'completed' | 'in-progress' | 'pending' | 'delayed';
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
}

// ============================================================================
// Component
// ============================================================================

const IndividualLiveTracking: React.FC = () => {
  const { token } = useAuth();
  const location = useLocation();
  
  // State
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [deepLinkShipment, setDeepLinkShipment] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'status' | 'priority' | 'carrier'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'in-transit' | 'delivered' | 'exception'>('all');
  const [expandedTimeline, setExpandedTimeline] = useState(false);

  // ============================================================================
  // API Functions
  // ============================================================================

  const fetchTrackingEvents = useCallback(async (shipmentId: string): Promise<TrackingEvent[]> => {
    if (!token || !shipmentId) return [];

    try {
      const response = await fetch(createApiUrl(`/api/shipments/${shipmentId}/tracking`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) return [];

      const data = await safeJsonParse<any[]>(response);
      const rows = Array.isArray(data) ? data : [];

      return rows.map((r: any, idx: number) => {
        const status = String(r.status || '');
        const timestamp = String(r.created_at || r.createdAt || r.createdat || new Date().toISOString());
        const isDelivered = status === 'delivered' || status === 'completed';
        
        return {
          id: String(r.id || `${shipmentId}-${idx}`),
          location: String(r.location || ''),
          timestamp,
          description: String(r.notes || r.note || r.description || status || 'Güncelleme'),
          status: isDelivered ? 'completed' : (status === 'in_transit' || status === 'picked_up' ? 'in-progress' : 'pending'),
          notes: r.notes || r.note || undefined,
        } as TrackingEvent;
      });
    } catch (error) {
      console.error('Error fetching tracking events:', error);
      return [];
    }
  }, [token]);

  const loadShipments = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(createApiUrl('/api/shipments'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load shipments');
      }

      const data = await safeJsonParse<{ shipments?: any[]; data?: any[] }>(response);
      const shipmentsData = data?.shipments || data?.data || [];
      
      const transformedShipments: Shipment[] = shipmentsData.map((shipment: any) => ({
        id: String(shipment.id || shipment.shipment_id || ''),
        trackingNumber: shipment.tracking_code || shipment.tracking_number || shipment.trackingCode || '',
        title: shipment.title || shipment.description || 'Gönderi',
        status: mapStatus(shipment.status),
        currentLocation: shipment.current_location || shipment.currentLocation || shipment.origin_city || shipment.from || 'Bilinmiyor',
        estimatedDelivery: shipment.estimated_delivery_date || shipment.delivery_date || shipment.deliveryDate || shipment.pickup_date || '',
        carrier: {
          name: shipment.carrier_name || shipment.carrier?.name || shipment.carrierName || 'Nakliyeci',
          company: shipment.carrier_company || shipment.carrier?.company || shipment.carrierCompany || '',
          phone: shipment.carrier_phone || shipment.carrier?.phone || shipment.carrierPhone || '',
          email: shipment.carrier_email || shipment.carrier?.email || shipment.carrierEmail || '',
          rating: shipment.carrier_rating || shipment.carrier?.rating || shipment.carrierRating || 0,
          totalShipments: shipment.carrier_total_shipments || shipment.carrier?.total_shipments || shipment.completed_jobs || 0,
          successRate: shipment.carrier_success_rate || shipment.carrier?.success_rate || shipment.success_rate || 0,
        },
        route: {
          origin: shipment.origin_city || shipment.origin || shipment.from || '',
          destination: shipment.destination_city || shipment.destination || shipment.to || '',
          distance: shipment.distance || 0,
          estimatedTime: shipment.estimated_time || shipment.estimatedTime || '',
        },
        timeline: [],
        isLive: shipment.status === 'in_transit' || shipment.status === 'picked_up' || shipment.status === 'in_progress',
        lastUpdate: shipment.updated_at || shipment.updatedAt || shipment.last_update || new Date().toISOString(),
        priority: mapPriority(shipment.priority),
        value: shipment.cargo_value || shipment.value || shipment.total_value || shipment.price || 0,
        weight: shipment.weight || 0,
        dimensions: {
          length: shipment.length || shipment.dimensions?.length || 0,
          width: shipment.width || shipment.dimensions?.width || 0,
          height: shipment.height || shipment.dimensions?.height || 0,
        },
        specialRequirements: shipment.special_requests 
          ? (Array.isArray(shipment.special_requests) ? shipment.special_requests : [shipment.special_requests]) 
          : [],
      }));

      setShipments(transformedShipments);
      setLoading(false);
    } catch (error) {
      console.error('Error loading shipments:', error);
      setLoading(false);
    }
  }, [token]);

  // ============================================================================
  // Helper Functions
  // ============================================================================

  const mapStatus = (status: string): Shipment['status'] => {
    const statusMap: Record<string, Shipment['status']> = {
      'pending': 'pending',
      'waiting': 'pending',
      'waiting_for_offers': 'pending',
      'preparing': 'pending',
      'offer_accepted': 'pending',
      'in_transit': 'in-transit',
      'in_progress': 'in-transit',
      'assigned': 'in-transit',
      'picked_up': 'in-transit',
      'delivered': 'delivered',
      'completed': 'delivered',
      'accepted': 'delivered',
      'exception': 'exception',
      'cancelled': 'cancelled',
    };
    return statusMap[status] || 'pending';
  };

  const mapPriority = (priority: string): Shipment['priority'] => {
    const priorityMap: Record<string, Shipment['priority']> = {
      'urgent': 'urgent',
      'high': 'high',
      'normal': 'normal',
      'low': 'low',
    };
    return priorityMap[priority] || 'normal';
  };

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
        return getShipmentStatusText('pending');
      case 'in-transit':
        return getShipmentStatusText('in_transit');
      case 'delivered':
        return getShipmentStatusText('delivered');
      case 'exception':
        return 'Problem Oluştu';
      case 'cancelled':
        return getShipmentStatusText('cancelled');
      default:
        return getShipmentStatusText(String(status || ''));
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

  // ============================================================================
  // Data Processing
  // ============================================================================

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

  // ============================================================================
  // Effects
  // ============================================================================

  useEffect(() => {
    loadShipments();
  }, [loadShipments]);

  // Deep link support: /individual/live-tracking?shipment={id|trackingNumber}
  useEffect(() => {
    try {
      const sp = new URLSearchParams(location.search || '');
      const v = sp.get('shipment');
      setDeepLinkShipment(v ? String(v) : null);
    } catch {
      setDeepLinkShipment(null);
    }
  }, [location.search]);

  useEffect(() => {
    if (!deepLinkShipment) return;
    if (!Array.isArray(shipments) || shipments.length === 0) return;

    const match =
      shipments.find((s) => String(s.id) === String(deepLinkShipment)) ||
      shipments.find((s) => String(s.trackingNumber) === String(deepLinkShipment)) ||
      null;

    if (!match) return;
    if (selectedShipment?.id === match.id) return;
    setSelectedShipment(match);
  }, [deepLinkShipment, shipments, selectedShipment?.id]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadShipments();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadShipments]);

  useEffect(() => {
    if (selectedShipment && selectedShipment.timeline.length === 0) {
      setLoadingTimeline(true);
      fetchTrackingEvents(selectedShipment.id).then((events) => {
        setSelectedShipment(prev => prev ? { ...prev, timeline: events } : null);
        setLoadingTimeline(false);
      });
    }
  }, [selectedShipment, fetchTrackingEvents]);

  // ============================================================================
  // Render
  // ============================================================================

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

        {/* Statistics */}
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
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{shipments.filter(s => s.status === 'delivered').length}</div>
                <div className="text-sm text-slate-600">Teslim Edildi</div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex flex-col lg:flex-row gap-4">
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
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
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
                  <div className="p-8 text-center text-slate-500">
                    <Package className="w-12 h-12 mx-auto mb-2 text-slate-400" />
                    <p>Gönderi bulunamadı</p>
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
                            <div className="flex items-center gap-1">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(shipment.status)}`}>
                                {getStatusText(shipment.status)}
                              </span>
                              <div className={`w-2 h-2 rounded-full ${getPriorityColor(shipment.priority)}`} title={getPriorityText(shipment.priority)}></div>
                            </div>
                          </div>
                          <p className="text-sm text-slate-600 mb-1">{shipment.trackingNumber || 'Takip kodu yok'}</p>
                          <p className="text-sm text-slate-500 truncate">{shipment.carrier.name} {shipment.carrier.company ? `- ${shipment.carrier.company}` : ''}</p>
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

          {/* Shipment Details */}
          <div className="lg:col-span-2">
            {selectedShipment ? (
              <div className="space-y-6">
                {/* Header */}
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
                        <p className="text-slate-600">{selectedShipment.trackingNumber || 'Takip kodu yok'}</p>
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

                  {/* Route Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-500" />
                      <span className="font-medium text-slate-700">Mevcut Konum:</span>
                      <span className="text-slate-600">{selectedShipment.currentLocation}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <span className="font-medium text-slate-700">Tahmini Teslimat:</span>
                      <span className="text-slate-600">{selectedShipment.estimatedDelivery || 'Belirtilmemiş'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Route className="w-4 h-4 text-slate-500" />
                      <span className="font-medium text-slate-700">Rota:</span>
                      <span className="text-slate-600">{selectedShipment.route.origin} → {selectedShipment.route.destination}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-slate-500" />
                      <span className="font-medium text-slate-700">Mesafe:</span>
                      <span className="text-slate-600">{selectedShipment.route.distance || 0} km</span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="w-4 h-4 text-slate-500" />
                        <span className="text-sm font-medium text-slate-700">Değer</span>
                      </div>
                      <p className="text-lg font-semibold text-slate-900">₺{selectedShipment.value.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Package className="w-4 h-4 text-slate-500" />
                        <span className="text-sm font-medium text-slate-700">Ağırlık</span>
                      </div>
                      <p className="text-lg font-semibold text-slate-900">{selectedShipment.weight || 0} kg</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Timer className="w-4 h-4 text-slate-500" />
                        <span className="text-sm font-medium text-slate-700">Süre</span>
                      </div>
                      <p className="text-lg font-semibold text-slate-900">{selectedShipment.route.estimatedTime || 'Belirtilmemiş'}</p>
                    </div>
                  </div>

                  {/* Special Requirements */}
                  {selectedShipment.specialRequirements.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-slate-700 mb-2">Özel Gereksinimler</h3>
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
                  {selectedShipment.carrier.name !== 'Nakliyeci' && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center">
                            <Truck className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900">{selectedShipment.carrier.name}</h3>
                            <p className="text-sm text-slate-600">{selectedShipment.carrier.company}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {selectedShipment.carrier.rating > 0 && (
                                <>
                                  <div className="flex items-center gap-1">
                                    <Star className="w-3 h-3 text-yellow-500" />
                                    <span className="text-sm text-slate-700">{selectedShipment.carrier.rating}/5</span>
                                  </div>
                                  <span className="text-xs text-slate-500">•</span>
                                </>
                              )}
                              {selectedShipment.carrier.totalShipments > 0 && (
                                <>
                                  <span className="text-xs text-slate-500">{selectedShipment.carrier.totalShipments} gönderi</span>
                                  <span className="text-xs text-slate-500">•</span>
                                </>
                              )}
                              {selectedShipment.carrier.successRate > 0 && (
                                <span className="text-xs text-slate-500">%{selectedShipment.carrier.successRate} başarı</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {selectedShipment.carrier.phone && (
                            <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors" title={selectedShipment.carrier.phone}>
                              <Phone className="w-4 h-4 text-slate-500" />
                            </button>
                          )}
                          {selectedShipment.carrier.email && (
                            <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors" title={selectedShipment.carrier.email}>
                              <MessageSquare className="w-4 h-4 text-slate-500" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Timeline */}
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
                  {loadingTimeline ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-slate-600 mt-2">Geçmiş yükleniyor...</p>
                    </div>
                  ) : selectedShipment.timeline.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <Clock className="w-12 h-12 mx-auto mb-2 text-slate-400" />
                      <p>Henüz güncelleme yok</p>
                    </div>
                  ) : (
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
                            {event.notes && (
                              <p className="text-xs text-slate-500 mt-1 italic">{event.notes}</p>
                            )}
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
                  )}
                </div>
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
      </div>
    </div>
  );
};

export default IndividualLiveTracking;
