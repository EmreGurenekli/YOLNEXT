import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Truck,
  Filter,
  Search,
  Download,
  User,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  Info,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createApiUrl } from '../../config/api';
import { formatCurrency, formatDate } from '../../utils/format';
import { useAuth } from '../../contexts/AuthContext';
import MessagingModal from '../../components/MessagingModal';
import RatingModal from '../../components/RatingModal';

interface Shipment {
  id: string;
  title: string;
  from: string;
  to: string;
  status: 'preparing' | 'waiting' | 'waiting_for_offers' | 'offer_accepted' | 'accepted' | 'in_transit' | 'delivered' | 'cancelled';
  createdAt: string;
  estimatedDelivery: string;
  actualDelivery?: string;
  price: number;
  carrierName?: string;
  carrierId?: string;
  carrierPhone?: string;
  carrierEmail?: string;
  carrierCompany?: string;
  driverName?: string;
  driverId?: string;
  driverPhone?: string;
  driverEmail?: string;
  trackingNumber?: string;
  description: string;
  category: string;
  weight: string;
  dimensions: string;
  specialRequirements: string[];
  trackingCode: string;
  subCategory: string;
  rating?: number;
  volume: string;
  pickupDate?: string;
  deliveryDate?: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  pickupCity?: string;
  deliveryCity?: string;
}

const MyShipments: React.FC<{ basePath?: string }> = ({ basePath = '/individual' }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  // Default to 'active' to show only active shipments (offer_accepted, in_transit, etc.)
  // Completed shipments go to History page
  const [statusFilter, setStatusFilter] = useState('active');
  const [sortBy, setSortBy] = useState('date');
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    limit: 20,
  });
  const [showMessagingModal, setShowMessagingModal] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState<{id: string, name: string, email: string, type: string} | null>(null);
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [showProcessAssistantDetails, setShowProcessAssistantDetails] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!showDetailModal) {
      setShowProcessAssistantDetails(false);
      return;
    }
    setShowProcessAssistantDetails(false);
  }, [showDetailModal, selectedShipment?.id]);

  // Yeni kullanıcılar için boş veriler
  const emptyShipments: Shipment[] = [];

  const isMessagingEnabledForShipment = (status: Shipment['status']) => {
    return (
      status === 'offer_accepted' ||
      status === 'accepted' ||
      (status as any) === 'in_progress' ||
      (status as any) === 'assigned' ||
      status === 'in_transit' ||
      status === 'delivered'
    );
  };

  const isProcessAssistantEnabledForShipment = (status: Shipment['status']) => {
    const s = String(status || '').trim();
    return (
      s === 'offer_accepted' ||
      s === 'accepted' ||
      s === 'in_progress' ||
      s === 'assigned' ||
      s === 'in_transit' ||
      s === 'delivered'
    );
  };

  const loadShipments = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('authToken');

        if (!token) {
          setShipments(emptyShipments);
          setLoading(false);
          return;
        }

        // Always include userId parameter to ensure proper filtering
        const userId = user?.id;
        const params = new URLSearchParams({
          page: pagination.page.toString(),
          limit: pagination.limit.toString(),
          userId: userId || '',
        });
        // Don't send 'active' filter to backend - filter on frontend instead
        // Backend doesn't understand 'active' - it needs specific statuses
        // We'll filter on frontend for 'active' status
        if (statusFilter !== 'all' && statusFilter !== 'active') {
          params.append('status', statusFilter);
        }
        if (searchTerm && searchTerm.trim()) {
          params.append('search', searchTerm.trim());
        }
        const response = await fetch(
          `${createApiUrl('/api/shipments')}?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const data = await response.json();

        if (response.ok && data.success) {
          // Backend'den dönen data structure'ı kontrol et
          // Handle different response structures
          const shipments =
            data.data?.shipments || 
            data.shipments || 
            (Array.isArray(data.data) ? data.data : []) ||
            []; 

          // Backend verilerini frontend formatına çevir
          interface BackendShipment {
            id: number | string;
            title?: string;
            pickupCity?: string;
            fromCity?: string;
            pickupDistrict?: string;
            deliveryCity?: string;
            toCity?: string;
            deliveryDistrict?: string;
            status?: string;
            createdAt?: string;
            created_at?: string;
            deliveryDate?: string;
            delivery_date?: string;
            pickupDate?: string;
            price?: number;
            carrierName?: string;
            carrier_name?: string;
            carrierCompany?: string;
            carrier_company?: string;
            carrierId?: string | number;
            carrier_id?: string | number;
            nakliyeci_id?: string | number;
            carrierPhone?: string;
            carrier_phone?: string;
            carrierEmail?: string;
            carrier_email?: string;
            trackingNumber?: string;
            tracking_number?: string;
            description?: string;
            category?: string;
            weight?: number | string;
            dimensions?: string;
            volume?: number | string;
            specialRequirements?: string | string[];
            subCategory?: string;
            rating?: number;
            actualDeliveryDate?: string;
            displayPrice?: number;
            offerPrice?: number;
            value?: number;
          }
          const formattedShipments = shipments.map((shipment: BackendShipment) => ({
            id: shipment.id.toString(),
            title: shipment.title || 'Gönderi',
            from:
              shipment.pickupCity ||
              shipment.fromCity ||
              `${shipment.pickupDistrict || ''} ${shipment.pickupCity || ''}`.trim() ||
              'Bilinmiyor',
            to:
              shipment.deliveryCity ||
              shipment.toCity ||
              `${shipment.deliveryDistrict || ''} ${shipment.deliveryCity || ''}`.trim() ||
              'Bilinmiyor',
            status: (shipment.status === 'open' || shipment.status === 'waiting_for_offers'
              ? 'waiting'
              : shipment.status === 'offer_accepted' || shipment.status === 'accepted'
                ? 'offer_accepted'
                : shipment.status === 'in_transit' || shipment.status === 'in_progress'
                  ? 'in_transit'
                  : shipment.status === 'delivered'
                    ? 'delivered'
                    : shipment.status === 'cancelled'
                      ? 'cancelled'
                      : shipment.status === 'preparing'
                        ? 'preparing'
                        : 'waiting') as
              | 'delivered'
              | 'in_transit'
              | 'preparing'
              | 'waiting'
              | 'cancelled'
              | 'offer_accepted',
            createdAt:
              shipment.createdAt ||
              shipment.created_at ||
              new Date().toISOString(),
            estimatedDelivery:
              shipment.deliveryDate ||
              shipment.delivery_date ||
              shipment.pickupDate ||
              new Date().toISOString(),
            actualDelivery:
              shipment.status === 'delivered'
                ? shipment.actualDeliveryDate || shipment.deliveryDate
                : undefined,
            price: shipment.displayPrice || shipment.price || shipment.offerPrice || shipment.value || 0,
            carrierName:
              shipment.carrierName || shipment.carrier_name || undefined,
            carrierId: shipment.carrierId || shipment.carrier_id || shipment.nakliyeci_id || undefined,
            carrierPhone: undefined,
            carrierEmail: undefined,
            carrierCompany: shipment.carrierCompany || shipment.carrier_company || undefined,
            trackingNumber:
              shipment.trackingNumber || shipment.tracking_number || undefined,
            description: shipment.description || '',
            category: shipment.category || 'Genel',
            weight: shipment.weight ? (typeof shipment.weight === 'number' ? shipment.weight.toString() : shipment.weight) : '0',
            dimensions:
              shipment.dimensions || (shipment.volume ? (typeof shipment.volume === 'number' ? shipment.volume.toString() : shipment.volume) : '0'),
            specialRequirements: shipment.specialRequirements
              ? Array.isArray(shipment.specialRequirements)
                ? shipment.specialRequirements
                : [shipment.specialRequirements]
              : [],
            trackingCode:
              shipment.trackingNumber ||
              `TRK${shipment.id.toString().padStart(6, '0')}`,
            subCategory: shipment.subCategory || shipment.category || 'Genel',
            rating: shipment.rating || undefined,
            volume: shipment.volume ? (typeof shipment.volume === 'number' ? shipment.volume.toString() : shipment.volume) : '0',
          }));

          setShipments(formattedShipments);
          if (data.pagination) {
            setPagination((prev: typeof pagination) => ({
              ...prev,
              page: data.pagination.page,
              pages: data.pagination.pages,
              total: data.pagination.total,
            }));
          }
        } else {
          setShipments(emptyShipments);
        }
      } catch (error) {
        setShipments(emptyShipments);
      } finally {
        setLoading(false);
      }
  };

  useEffect(() => {
    loadShipments();
  }, [pagination.page, statusFilter, searchTerm]);

  // Reload shipments when navigating from offer acceptance
  useEffect(() => {
    if (location.state?.refresh) {
      // Small delay to ensure backend has processed the update
      refreshTimerRef.current = setTimeout(() => {
        loadShipments();
        // Clear the state to prevent reloading on every render
        navigate(location.pathname, { replace: true, state: {} });
      }, 500);
    }
    
    // Cleanup timer on unmount or when location.state changes
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [location.state]);

  // Reload shipments when page becomes visible (e.g., after accepting an offer)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadShipments();
      }
    };
    
    const handleFocus = () => {
      loadShipments();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'preparing':
        return {
          text: 'Hazırlanıyor',
          color: 'bg-yellow-100 text-yellow-800',
          icon: AlertCircle,
        };
      case 'waiting':
      case 'waiting_for_offers':
        return {
          text: 'Teklif Bekliyor',
          color: 'bg-blue-100 text-blue-800',
          icon: Clock,
        };
      case 'offer_accepted':
      case 'accepted':
        return {
          text: 'Teklif Kabul Edildi',
          color: 'bg-green-100 text-green-800',
          icon: CheckCircle,
        };
      case 'in_transit':
        return {
          text: 'Yolda',
          color: 'bg-green-100 text-green-800',
          icon: Truck,
        };
      case 'delivered':
        return {
          text: 'Teslim Edildi',
          color: 'bg-emerald-100 text-emerald-800',
          icon: CheckCircle,
        };
      case 'cancelled':
        return {
          text: 'İptal Edildi',
          color: 'bg-red-100 text-red-800',
          icon: XCircle,
        };
      default:
        return {
          text: 'Bilinmiyor',
          color: 'bg-gray-100 text-gray-800',
          icon: AlertCircle,
        };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_transit':
        return <Truck className='w-4 h-4' />;
      case 'preparing':
        return <Package className='w-4 h-4' />;
      case 'delivered':
        return <CheckCircle className='w-4 h-4' />;
      case 'waiting':
        return <Clock className='w-4 h-4' />;
      default:
        return <AlertCircle className='w-4 h-4' />;
    }
  };

  const handleViewDetails = async (shipmentId: string) => {
    const shipment = shipments.find((s: Shipment) => s.id === shipmentId);
    if (shipment) {
      // Her zaman detay endpoint'inden güncel bilgileri çek (nakliyeci ve taşıyıcı bilgileri için)
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(
          `${createApiUrl(`/api/shipments/${shipmentId}`)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          const shipmentDetail = data.shipment || data.data;
          
          // Tüm bilgileri güncelle
          setSelectedShipment({
            ...shipment,
            carrierName: shipmentDetail.carrierName || shipment.carrierName,
            carrierPhone: undefined,
            carrierEmail: undefined,
            carrierCompany: shipmentDetail.carrierCompany || shipment.carrierCompany,
            carrierId: shipmentDetail.nakliyeci_id || shipmentDetail.carrierId || shipment.carrierId,
            driverName: shipmentDetail.driverName || shipment.driverName,
            driverPhone: undefined,
            driverEmail: undefined,
            driverId: shipmentDetail.driver_id || shipmentDetail.driverId || shipment.driverId,
            pickupDate: shipmentDetail.pickupDate || shipmentDetail.pickup_date || shipment.pickupDate,
            deliveryDate: shipmentDetail.deliveryDate || shipmentDetail.delivery_date || shipment.deliveryDate,
            pickupAddress: shipmentDetail.pickupAddress || shipmentDetail.pickup_address || shipment.pickupAddress,
            deliveryAddress: shipmentDetail.deliveryAddress || shipmentDetail.delivery_address || shipment.deliveryAddress,
            pickupCity: shipmentDetail.pickupCity || shipmentDetail.pickup_city || shipment.pickupCity,
            deliveryCity: shipmentDetail.deliveryCity || shipmentDetail.delivery_city || shipment.deliveryCity,
          });
        } else {
          setSelectedShipment(shipment);
        }
      } catch (error) {
        setSelectedShipment(shipment);
      }
      setShowDetailModal(true);
    }
  };

  const handleRateCarrier = (shipment: Shipment) => {
    if (shipment.carrierName || shipment.carrierId) {
      // Use real carrierId from shipment, fallback to carrierName if ID not available
      const carrierId = shipment.carrierId || shipment.carrierName;
      const carrierEmail = '';
      
      setSelectedCarrier({
        id: carrierId?.toString() || '',
        name: shipment.carrierName || 'Nakliyeci',
        email: carrierEmail,
        type: 'nakliyeci',
      });
      setSelectedShipmentId(shipment.id);
      setShowRatingModal(true);
    }
  };

  const handleTrackShipment = (shipmentId: string) => {
    navigate(`${basePath}/live-tracking?shipmentId=${shipmentId}`);
  };

  const handleMessage = (shipment: Shipment) => {
    if (!shipment.carrierId && !shipment.carrierName) {
      // Eğer nakliyeci yoksa, mesajlaşma sayfasına yönlendir
      navigate(`${basePath}/messages`);
      return;
    }

    // Use real carrierId from shipment, fallback to carrierName if ID not available
    const carrierId = shipment.carrierId || shipment.carrierName;
    
    // Navigate to messages page with userId and shipmentId parameters
    // This will automatically open the conversation with the carrier
    navigate(`${basePath}/messages?userId=${carrierId}&shipmentId=${shipment.id}`);
  };

  const handleCancelClick = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const handleCancelShipment = async () => {
    if (!selectedShipment || !cancelReason.trim()) {
      return;
    }

    try {
      setIsCancelling(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        createApiUrl(`/api/shipments/${selectedShipment.id}/cancel`),
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reason: cancelReason.trim(),
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setShowCancelModal(false);
        setCancelReason('');
        setSelectedShipment(null);
        loadShipments(); // Reload shipments
        
        // Show appropriate message based on refund status
        if (data.data?.refundDenied) {
          setNotification({ 
            type: 'error', 
            message: `Gönderi iptal edildi. ${data.warning || data.data.refundReason || 'İade koşulları sağlanmadığı için komisyon iadesi yapılamadı.'}` 
          });
        } else if (data.data?.commissionRefunded) {
          setNotification({ 
            type: 'success', 
            message: `Gönderi iptal edildi. Komisyon iadesi yapıldı (${data.data.refundAmount?.toFixed(2) || '0'} TL). İşlem ücreti kesildi.` 
          });
        } else {
          setNotification({ type: 'success', message: 'Gönderi başarıyla iptal edildi' });
        }
        setTimeout(() => setNotification(null), 8000);
      } else {
        const errorData = await response.json();
        setNotification({ type: 'error', message: errorData.message || 'Gönderi iptal edilemedi' });
        setTimeout(() => setNotification(null), 5000);
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'Gönderi iptal edilirken bir hata oluştu' });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleConfirmDelivery = async (shipment: Shipment) => {
    if (shipment.status !== 'delivered') {
      return;
    }

    if (!window.confirm('Teslimatı onaylamak istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        createApiUrl(`/api/shipments/${shipment.id}/confirm-delivery`),
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        loadShipments(); // Reload shipments
        setNotification({ type: 'success', message: 'Teslimat başarıyla onaylandı!' });
        setTimeout(() => setNotification(null), 5000);
      } else {
        const errorData = await response.json();
        setNotification({ type: 'error', message: errorData.message || 'Teslimat onaylanamadı' });
        setTimeout(() => setNotification(null), 5000);
      }
    } catch (error) {
      setNotification({ type: 'error', message: 'Teslimat onaylanırken bir hata oluştu' });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const canCancelShipment = (status: string) => {
    const s = (status || '').trim().toLowerCase();
    // Backward-compatible normalization
    const normalized =
      s === 'waiting' ? 'waiting_for_offers' :
      s === 'preparing' ? 'in_progress' :
      s === 'active' ? 'waiting_for_offers' :
      s === 'draft' ? 'pending' :
      s;

    // Cancellable only before transit/delivery starts
    const cancellableStatuses = ['pending', 'waiting_for_offers', 'offer_accepted', 'accepted'];
    return cancellableStatuses.includes(normalized);
  };

  // Arama backend'de yapıldığı için sadece status filtresi uygulanıyor
  const filteredShipments = shipments.filter((shipment: Shipment) => {
    // Default filter is 'active' - show only active shipments
    // Active: offer_accepted, in_transit, accepted, preparing (with carrier assigned)
    // Exclude: delivered (goes to History), waiting_for_offers (no offer yet), cancelled
    const s = (shipment.status || '').trim().toLowerCase();
    const normalized =
      s === 'waiting' ? 'waiting_for_offers' :
      s === 'preparing' ? 'in_progress' :
      s === 'active' ? 'waiting_for_offers' :
      s === 'draft' ? 'pending' :
      s;

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' &&
        ['in_transit', 'in_progress', 'offer_accepted', 'accepted'].includes(normalized) &&
        normalized !== 'delivered' &&
        normalized !== 'cancelled') ||
      (statusFilter === 'completed' && normalized === 'delivered') ||
      (statusFilter === 'pending' && (normalized === 'waiting_for_offers' || normalized === 'pending'));

    return matchesStatus;
  });

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-16 h-16 bg-gradient-to-br from-slate-800 to-blue-900 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse'>
            <Package className='w-8 h-8 text-white' />
          </div>
          <h2 className='text-xl font-semibold text-gray-900'>
            Gönderiler yükleniyor...
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50'>
      <Helmet>
        <title>Gönderilerim - YolNext</title>
        <meta
          name='description'
          content='Gönderilerinizi takip edin ve yönetin'
        />
      </Helmet>

      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 max-w-md ${
          notification.type === 'success' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        } rounded-lg shadow-lg p-4 flex items-start gap-3`}>
          <div className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
            notification.type === 'success' ? 'text-green-600' : 'text-red-600'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle className='w-5 h-5' />
            ) : (
              <AlertCircle className='w-5 h-5' />
            )}
          </div>
          <p className={`text-sm flex-1 ${
            notification.type === 'success' ? 'text-green-800' : 'text-red-800'
          }`}>
            {notification.message}
          </p>
          <button
            onClick={() => setNotification(null)}
            className={`${
              notification.type === 'success' ? 'text-green-600 hover:text-green-800' : 'text-red-600 hover:text-red-800'
            }`}
          >
            <XCircle className='w-4 h-4' />
          </button>
        </div>
      )}

      <div className='max-w-5xl mx-auto px-4 py-6'>
        {/* Header - Match Corporate Design */}
        <div className='text-center mb-12'>
          <div className='flex justify-center mb-6'>
            <div className='w-16 h-16 bg-gradient-to-br from-slate-800 to-blue-900 rounded-2xl flex items-center justify-center shadow-lg'>
              <Package className='w-8 h-8 text-white' />
            </div>
          </div>
          <h1 className='text-4xl md:text-5xl font-bold text-slate-900 mb-3'>
            Gönderilerinizi{' '}
            <span className='text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-blue-900'>
              Takip Edin
            </span>
          </h1>
          <p className='text-lg text-slate-600'>
            Gönderilerinizin durumunu takip edin ve yönetin
          </p>
        </div>

        {/* Filters Card */}
        <div className='bg-white rounded-2xl p-8 shadow-xl border border-slate-200 mb-8'>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-4'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4' />
              <input
                type='text'
                placeholder='Gönderi ara...'
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className='w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
              className='px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            >
              <option value='all'>Tüm Durumlar</option>
              <option value='active'>Aktif Gönderiler</option>
              <option value='completed'>Tamamlanan</option>
              <option value='pending'>Beklemede</option>
            </select>

            <select
              value={sortBy}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value)}
              className='px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            >
              <option value='date'>Tarihe Göre</option>
              <option value='status'>Duruma Göre</option>
              <option value='priority'>Önceliğe Göre</option>
              <option value='value'>Değere Göre</option>
            </select>

            <button className='min-h-[44px] px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2'>
              <Filter className='w-4 h-4' />
              Filtrele
            </button>
          </div>

          {/* Export Buttons kaldırıldı */}
        </div>

        {/* Shipments Table */}
        <div className='bg-white rounded-2xl p-8 shadow-xl border border-slate-200'>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead>
                <tr className='border-b border-slate-200'>
                  <th className='text-left py-3 px-4 font-semibold text-slate-700'>
                    Gönderi No
                  </th>
                  <th className='text-left py-3 px-4 font-semibold text-slate-700'>
                    Rota
                  </th>
                  <th className='text-left py-3 px-4 font-semibold text-slate-700'>
                    Durum
                  </th>
                  <th className='text-left py-3 px-4 font-semibold text-slate-700'>
                    Nakliyeci
                  </th>
                  <th className='text-left py-3 px-4 font-semibold text-slate-700'>
                    Fiyat
                  </th>
                  <th className='text-left py-3 px-4 font-semibold text-slate-700'>
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredShipments.length > 0 ? (
                  filteredShipments.map((shipment, index) => (
                    <tr
                      key={`${shipment.id}-${shipment.trackingCode}-${index}`}
                      className='border-b border-slate-100 hover:bg-slate-50 transition-colors'
                    >
                      <td className='py-4 px-4'>
                        <div className='font-mono text-sm font-semibold text-slate-900'>
                          {shipment.trackingCode}
                        </div>
                        <div className='text-xs text-slate-500'>
                          {formatDate(shipment.createdAt, 'long')}
                        </div>
                        <div className='text-xs text-slate-500'>
                          {shipment.title}
                        </div>
                      </td>
                      <td className='py-4 px-4'>
                        <div className='text-sm font-medium text-slate-900'>
                          {shipment.from} → {shipment.to}
                        </div>
                        <div className='text-xs text-slate-500'>
                          {(() => {
                            const getCategoryName = (cat: string) => {
                              const categoryMap: { [key: string]: string } = {
                                'house_move': 'Ev Taşınması',
                                'furniture_goods': 'Mobilya Taşıma',
                                'special_cargo': 'Özel Yük',
                                'other': 'Diğer'
                              };
                              return categoryMap[cat] || cat;
                            };
                            
                            const category = getCategoryName(shipment.category || '');
                            const subCategory = shipment.subCategory ? getCategoryName(shipment.subCategory) : '';
                            
                            if (!subCategory || subCategory === category) {
                              return category;
                            }
                            return `${category} - ${subCategory}`;
                          })()}
                        </div>
                      </td>
                      <td className='py-4 px-4'>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            shipment.status === 'delivered'
                              ? 'bg-green-100 text-green-800'
                              : shipment.status === 'in_transit'
                                ? 'bg-blue-100 text-blue-800'
                                : shipment.status === 'preparing'
                                  ? 'bg-orange-100 text-orange-800'
                                  : shipment.status === 'offer_accepted' || shipment.status === 'accepted'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {getStatusIcon(shipment.status)}
                          {getStatusInfo(shipment.status).text}
                        </span>
                      </td>
                      <td className='py-4 px-4'>
                        <div className='text-sm font-medium text-slate-900'>
                          {shipment.carrierName || 'Atanmamış'}
                        </div>
                        {shipment.carrierName && shipment.rating && (
                          <div className='text-xs text-slate-500'>
                            {shipment.rating}/5 ⭐
                          </div>
                        )}
                      </td>
                      <td className='py-4 px-4'>
                        <div className='text-sm font-bold text-slate-900'>
                          {formatCurrency(shipment.price)}
                        </div>
                        <div className='text-xs text-slate-500'>
                          {shipment.volume && shipment.volume !== '0' ? `${shipment.volume} m³` : 'Bilinmiyor'}
                        </div>
                        <div className='text-xs text-slate-500'>
                          {formatDate(shipment.estimatedDelivery, 'long')}
                        </div>
                      </td>
                      <td className='py-4 px-4'>
                        <div className='flex items-center gap-2'>
                          <button
                            onClick={() => handleViewDetails(shipment.id)}
                            className='px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-medium rounded-lg transition-colors'
                          >
                            Detay
                          </button>
                          {shipment.status !== 'waiting' && shipment.status !== 'waiting_for_offers' && (
                            <button
                              onClick={() => handleTrackShipment(shipment.id)}
                              className='px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 text-xs font-medium rounded-lg transition-colors'
                            >
                              Takip
                            </button>
                          )}
                          <button
                            onClick={() => handleMessage(shipment)}
                            disabled={!isMessagingEnabledForShipment(shipment.status)}
                            title={!isMessagingEnabledForShipment(shipment.status) ? 'Mesajlaşma teklif kabul edilince açılır' : 'Nakliyeci ile mesajlaş'}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                              isMessagingEnabledForShipment(shipment.status)
                                ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            Mesaj
                          </button>
                          {shipment.status === 'delivered' && (
                            <>
                              <button
                                onClick={() => handleConfirmDelivery(shipment)}
                                className='px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 text-xs font-medium rounded-lg transition-colors'
                              >
                                Onayla
                              </button>
                              {shipment.carrierName && !shipment.rating && (
                                <button
                                  onClick={() => handleRateCarrier(shipment)}
                                  className='px-3 py-1.5 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 text-xs font-medium rounded-lg transition-colors'
                                >
                                  Değerlendir
                                </button>
                              )}
                            </>
                          )}
                          {canCancelShipment(shipment.status) && (
                            <button
                              onClick={() => handleCancelClick(shipment)}
                              className='px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-medium rounded-lg transition-colors'
                            >
                              İptal Et
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className='py-12 text-center'>
                      <Package className='w-16 h-16 text-slate-300 mx-auto mb-4' />
                      <h3 className='text-lg font-medium text-slate-900 mb-2'>
                        Gönderi bulunamadı
                      </h3>
                      <p className='text-slate-500'>
                        Arama kriterlerinize uygun gönderi bulunmuyor.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Messaging Modal */}
      {showMessagingModal && selectedCarrier && user && (
        <MessagingModal
          isOpen={showMessagingModal}
          onClose={() => {
            setShowMessagingModal(false);
            setSelectedCarrier(null);
            setSelectedShipmentId(null);
          }}
          otherUser={selectedCarrier}
          currentUser={{
            id: user.id || '',
            name: user.fullName || 'Kullanıcı',
          }}
          shipmentId={selectedShipmentId || undefined}
        />
      )}

      {/* Rating Modal */}
      {showRatingModal && selectedCarrier && user && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={() => {
            setShowRatingModal(false);
            setSelectedCarrier(null);
            setSelectedShipmentId(null);
            loadShipments(); // Reload to show updated rating
          }}
          ratedUser={selectedCarrier}
          currentUser={{
            id: user.id || '',
            name: user.fullName || 'Kullanıcı',
          }}
          shipmentId={selectedShipmentId || undefined}
        />
      )}

      {/* Cancel Modal */}
      {showCancelModal && selectedShipment && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-xl shadow-2xl w-full max-w-md'>
            <div className='p-6'>
              <div className='flex items-center justify-between mb-4'>
                <h2 className='text-xl font-bold text-gray-900'>Gönderiyi İptal Et</h2>
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancelReason('');
                    setSelectedShipment(null);
                  }}
                  className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
                >
                  <XCircle className='w-5 h-5 text-gray-500' />
                </button>
              </div>
              <p className='text-gray-600 mb-4'>
                Gönderi #{selectedShipment.trackingCode} - {selectedShipment.title}
              </p>
              
              {/* İade Politikası Uyarısı - Sadece offer_accepted durumunda */}
              {(selectedShipment.status === 'offer_accepted' || selectedShipment.status === 'accepted') && (
                <div className='mb-4 p-3 bg-amber-50 border border-amber-300 rounded-lg'>
                  <div className='flex items-start gap-2'>
                    <AlertCircle className='w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5' />
                    <div className='text-xs text-amber-800'>
                      <p className='font-semibold mb-1'>⚠️ İade Politikası:</p>
                      <ul className='list-disc list-inside space-y-1 ml-2'>
                        <li>Komisyon iadesi sadece <strong>taşıyıcı atanmadan önce</strong> ve <strong>ilk 24 saat içinde</strong> yapılır</li>
                        <li>İade yapılırsa <strong>işlem maliyeti (min. 2 TL)</strong> kesilir</li>
                        <li>Taşıyıcı atandıktan sonra veya 24 saat sonra <strong>iade yapılmaz</strong></li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              
              <div className='mb-4'>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  İptal Sebebi <span className='text-red-500'>*</span>
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCancelReason(e.target.value)}
                  className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500'
                  rows={4}
                  placeholder='Lütfen iptal sebebinizi yazın...'
                />
              </div>
              <div className='flex gap-3'>
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancelReason('');
                    setSelectedShipment(null);
                  }}
                  className='flex-1 px-4 py-2 bg-gradient-to-r from-slate-400 to-slate-500 hover:from-slate-500 hover:to-slate-600 text-white rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg'
                >
                  Vazgeç
                </button>
                <button
                  onClick={handleCancelShipment}
                  disabled={!cancelReason.trim() || isCancelling}
                  className='flex-1 px-4 py-2 bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {isCancelling ? 'İptal Ediliyor...' : 'İptal Et'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedShipment && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto'>
            {/* Header */}
            <div className='p-6 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-blue-50'>
              <div className='flex justify-between items-start'>
                <div>
                  <h2 className='text-2xl font-bold text-gray-900 mb-1'>Gönderi Detayları</h2>
                  <p className='text-gray-600 text-sm'>Takip Kodu: <span className='font-mono font-semibold'>{selectedShipment.trackingCode}</span></p>
                </div>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedShipment(null);
                  }}
                  className='text-gray-400 hover:text-gray-600 transition-colors'
                >
                  <XCircle className='w-6 h-6' />
                </button>
              </div>
            </div>

            <div className='p-6 space-y-6'>
              {isProcessAssistantEnabledForShipment(selectedShipment.status) && (
                <div className='bg-white rounded-lg border border-slate-200 p-5 shadow-sm'>
                  <div className='flex items-start justify-between gap-4'>
                    <div>
                      <div className='flex items-center gap-2'>
                        <Info className='w-4 h-4 text-slate-700' />
                        <h3 className='text-sm font-semibold text-slate-900'>Sıradaki Adım</h3>
                      </div>
                      <p className='mt-2 text-sm text-slate-700'>
                        Ödeme (IBAN/açıklama) ve yükleme saatini yazılı olarak teyitleyin.
                      </p>
                    </div>
                    <div className='flex items-center gap-2 flex-shrink-0'>
                      <button
                        onClick={() => {
                          const carrierId = selectedShipment.carrierId ? String(selectedShipment.carrierId) : '';
                          const shipmentId = selectedShipment.id ? String(selectedShipment.id) : '';
                          const prefill = `Merhaba, ödeme (IBAN/alıcı adı/açıklama) ve yükleme saatini netleştirelim. İş No: #${selectedShipment.trackingCode || shipmentId}`;
                          if (!carrierId) return;
                          const params = new URLSearchParams();
                          params.set('userId', carrierId);
                          if (shipmentId) params.set('shipmentId', shipmentId);
                          params.set('prefill', prefill);
                          navigate(`${basePath}/messages?${params.toString()}`);
                          setShowDetailModal(false);
                        }}
                        disabled={!selectedShipment.carrierId || !isMessagingEnabledForShipment(selectedShipment.status)}
                        className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                          selectedShipment.carrierId && isMessagingEnabledForShipment(selectedShipment.status)
                            ? 'bg-slate-900 hover:bg-slate-800 text-white'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        Mesajı Aç
                      </button>
                      <button
                        onClick={() => handleTrackShipment(selectedShipment.id)}
                        className='px-3 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-xs font-medium rounded-lg transition-colors'
                      >
                        Takip
                      </button>
                    </div>
                  </div>

                  <div className='mt-3'>
                    <button
                      type='button'
                      onClick={() => setShowProcessAssistantDetails(v => !v)}
                      className='text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors'
                    >
                      {showProcessAssistantDetails ? 'Detayları gizle' : 'Detayları göster'}
                    </button>
                    {showProcessAssistantDetails && (
                      <div className='mt-3 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-3'>
                        <div className='space-y-2'>
                          <div>1) IBAN / alıcı adını doğrulayın</div>
                          <div>2) Açıklamaya iş numarasını yazın</div>
                          <div>3) Yükleme saatini ve adresi teyit edin</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Gönderi Bilgileri */}
              <div className='bg-gray-50 rounded-lg p-5 border border-gray-200'>
                <div className='flex items-center gap-2 mb-4'>
                  <Package className='w-5 h-5 text-blue-600' />
                  <h3 className='text-lg font-semibold text-gray-900'>Gönderi Bilgileri</h3>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block'>Başlık</label>
                    <p className='text-gray-900 font-medium'>{selectedShipment.title}</p>
                  </div>
                  <div>
                    <label className='text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block'>Durum</label>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      selectedShipment.status === 'delivered'
                        ? 'bg-green-100 text-green-800'
                        : selectedShipment.status === 'in_transit'
                          ? 'bg-blue-100 text-blue-800'
                          : selectedShipment.status === 'offer_accepted' || selectedShipment.status === 'accepted'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {getStatusInfo(selectedShipment.status).text}
                    </span>
                  </div>
                  <div>
                    <label className='text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block flex items-center gap-1'>
                      <MapPin className='w-3 h-3' />
                      Rota
                    </label>
                    <p className='text-gray-900 font-medium'>
                      {selectedShipment.pickupCity || selectedShipment.from} → {selectedShipment.deliveryCity || selectedShipment.to}
                    </p>
                    {selectedShipment.pickupAddress && (
                      <p className='text-gray-600 text-sm mt-1'>{selectedShipment.pickupAddress}</p>
                    )}
                    {selectedShipment.deliveryAddress && (
                      <p className='text-gray-600 text-sm mt-1'>→ {selectedShipment.deliveryAddress}</p>
                    )}
                  </div>
                  <div>
                    <label className='text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block flex items-center gap-1'>
                      <DollarSign className='w-3 h-3' />
                      Fiyat
                    </label>
                    <p className='text-gray-900 font-semibold text-lg'>{formatCurrency(selectedShipment.price)}</p>
                  </div>
                  {selectedShipment.pickupDate && (
                    <div>
                      <label className='text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block flex items-center gap-1'>
                        <Calendar className='w-3 h-3' />
                        Toplama Tarihi
                      </label>
                      <p className='text-gray-900'>{formatDate(selectedShipment.pickupDate)}</p>
                    </div>
                  )}
                  {selectedShipment.deliveryDate && (
                    <div>
                      <label className='text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block flex items-center gap-1'>
                        <Calendar className='w-3 h-3' />
                        Teslimat Tarihi
                      </label>
                      <p className='text-gray-900'>{formatDate(selectedShipment.deliveryDate)}</p>
                    </div>
                  )}
                </div>
                {selectedShipment.description && (
                  <div className='mt-4 pt-4 border-t border-gray-200'>
                    <label className='text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block'>Açıklama</label>
                    <p className='text-gray-700'>{selectedShipment.description}</p>
                  </div>
                )}
              </div>

              {/* Nakliyeci Bilgileri */}
              <div className='bg-blue-50 rounded-lg p-5 border border-blue-200'>
                <div className='flex items-center gap-2 mb-4'>
                  <Building2 className='w-5 h-5 text-blue-600' />
                  <h3 className='text-lg font-semibold text-gray-900'>Nakliyeci Bilgileri</h3>
                </div>
                {selectedShipment.carrierName ? (
                  <div className='space-y-3'>
                    <div>
                      <label className='text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block flex items-center gap-1'>
                        <User className='w-3 h-3' />
                        Ad Soyad
                      </label>
                      <p className='text-gray-900 font-semibold'>{selectedShipment.carrierName}</p>
                    </div>
                    {selectedShipment.carrierCompany && (
                      <div>
                        <label className='text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block flex items-center gap-1'>
                          <Building2 className='w-3 h-3' />
                          Şirket
                        </label>
                        <p className='text-gray-900'>{selectedShipment.carrierCompany}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className='flex items-center gap-2 text-amber-600 bg-amber-50 rounded-lg p-3 border border-amber-200'>
                    <AlertCircle className='w-5 h-5' />
                    <p className='font-medium'>Nakliyeci bekleniyor</p>
                  </div>
                )}
              </div>

              {/* Taşıyıcı Bilgileri */}
              <div className='bg-green-50 rounded-lg p-5 border border-green-200'>
                <div className='flex items-center gap-2 mb-4'>
                  <Truck className='w-5 h-5 text-green-600' />
                  <h3 className='text-lg font-semibold text-gray-900'>Taşıyıcı Bilgileri</h3>
                  {selectedShipment.driverName && (
                    <span className='ml-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                      <CheckCircle className='w-3 h-3 mr-1' />
                      Taşıyıcı Atandı
                    </span>
                  )}
                </div>
                {selectedShipment.driverName ? (
                  <div className='space-y-3'>
                    <div>
                      <label className='text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block flex items-center gap-1'>
                        <User className='w-3 h-3' />
                        Ad Soyad
                      </label>
                      <p className='text-gray-900 font-semibold'>{selectedShipment.driverName}</p>
                    </div>
                  </div>
                ) : (
                  <div className='flex items-center gap-2 text-amber-600 bg-amber-50 rounded-lg p-3 border border-amber-200'>
                    <AlertCircle className='w-5 h-5' />
                    <p className='font-medium'>Taşıyıcı bekleniyor</p>
                    {selectedShipment.carrierName && (
                      <p className='text-sm text-gray-600 ml-2'>Nakliyeci tarafından atanacak</p>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {selectedShipment.status === 'delivered' && (
                <div className='space-y-2 pt-4 border-t border-gray-200'>
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      handleConfirmDelivery(selectedShipment);
                    }}
                    className='w-full px-4 py-3 bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 text-white rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg'
                  >
                    Teslimatı Onayla
                  </button>
                  {selectedShipment.carrierName && !selectedShipment.rating && (
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        handleRateCarrier(selectedShipment);
                      }}
                      className='w-full px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors'
                    >
                      Nakliyeciyi Değerlendir
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyShipments;
