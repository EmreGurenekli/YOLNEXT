import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Truck,
  Edit,
  Trash2,
  Plus,
  Search,
  Download,
  User,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  Info,
  X,
  Phone,
} from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { createApiUrl } from '../../config/api';
import { formatCurrency, formatDate, sanitizeShipmentTitle } from '../../utils/format';
import { resolveShipmentRoute } from '../../utils/shipmentRoute';
import { useAuth } from '../../contexts/AuthContext';
import MessagingModal from '../../components/MessagingModal';
import RatingModal from '../../components/RatingModal';
import GuidanceOverlay from '../../components/common/GuidanceOverlay';
import CarrierInfoCard from '../../components/CarrierInfoCard';
import { normalizeTrackingCode } from '../../utils/trackingCode';
import { getStatusInfo as getStatusInfoBase } from '../../utils/shipmentStatus';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import Breadcrumb from '../../components/common/Breadcrumb';
import { logger } from '../../utils/logger';

interface Shipment {
  id: string;
  title: string;
  from: string;
  to: string;
  status: 'preparing' | 'waiting' | 'waiting_for_offers' | 'offer_accepted' | 'accepted' | 'in_transit' | 'delivered' | 'completed' | 'cancelled';
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
  vehiclePlate?: string;
  vehicleType?: string;
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
  carrierRating?: number;
  carrierReviews?: number;
  carrierVerified?: boolean;
  completedJobs?: number;
  successRate?: number;
}

const MyShipments: React.FC<{ basePath?: string }> = ({ basePath = '/individual' }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  const isCorporateView = basePath === '/corporate';

  const toTrackingCode = normalizeTrackingCode;
  const [searchTerm, setSearchTerm] = useState('');
  // Default to 'active' to show only active shipments (offer_accepted, in_transit, etc.)
  // Completed shipments go to History page
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    limit: 10,
  });
  const [showMessagingModal, setShowMessagingModal] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState<{id: string, name: string, email: string, type: string} | null>(null);
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);
  const [locallyRatedShipmentIds, setLocallyRatedShipmentIds] = useState<string[]>([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [showProcessAssistantDetails, setShowProcessAssistantDetails] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [acceptedOfferAssist, setAcceptedOfferAssist] = useState<{
    carrierId?: string | null;
    carrierName?: string;
    shipmentId?: string | null;
    prefill?: string;
  } | null>(null);
  const [showAcceptedOfferModal, setShowAcceptedOfferModal] = useState(false);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openedFromQueryRef = useRef<string | null>(null);

  useEffect(() => {
    const state: any = location?.state;
    const accepted = state?.acceptedOffer;
    if (!accepted) return;

    setAcceptedOfferAssist({
      carrierId: accepted?.carrierId,
      carrierName: accepted?.carrierName,
      shipmentId: accepted?.shipmentId,
      prefill: accepted?.prefill,
    });
    setShowAcceptedOfferModal(true);
    setNotification({
      type: 'success',
      message: 'Teklifiniz kabul edildi. Gönderileriniz güncellendi.',
    });

    const t = setTimeout(() => setNotification(null), 1800);
    // Keep refresh flag (if any), only clear acceptedOffer to avoid re-opening modal repeatedly
    navigate(location.pathname, { replace: true, state: { ...state, acceptedOffer: undefined } });

    // Guarantee list refresh and also upsert accepted shipment if shipmentId is available
    const upsertAcceptedShipment = async () => {
      const shipmentId = accepted?.shipmentId ? String(accepted.shipmentId) : null;
      if (!shipmentId) {
        loadShipments();
        return;
      }
      try {
        const token = localStorage.getItem('authToken');
        const resp = await fetch(createApiUrl(`/api/shipments/${shipmentId}`), {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const payload = await resp.json().catch(() => null);
        const row = payload?.shipment || payload?.data || null;
        if (resp.ok && row) {
          const { from, to } = resolveShipmentRoute(row);
          const normalizedStatus =
            row.status === 'open' || row.status === 'waiting_for_offers'
              ? 'waiting'
              : row.status === 'offer_accepted' || row.status === 'accepted'
                ? 'offer_accepted'
                : row.status === 'in_transit' || row.status === 'in_progress'
                  ? 'in_transit'
                  : row.status === 'delivered'
                    ? 'delivered'
                    : row.status === 'completed'
                      ? 'completed'
                    : row.status === 'cancelled'
                      ? 'cancelled'
                      : row.status === 'preparing'
                        ? 'preparing'
                        : 'waiting';

          const formatted: Shipment = {
            id: String(row.id ?? shipmentId),
            title: sanitizeShipmentTitle(row.title || row.productDescription || row.description || 'Gönderi'),
            from,
            to,
            status: normalizedStatus as Shipment['status'],
            createdAt: row.createdAt || row.created_at || new Date().toISOString(),
            estimatedDelivery: row.deliveryDate || row.delivery_date || row.pickupDate || new Date().toISOString(),
            price: row.displayPrice || row.price || row.offerPrice || row.value || 0,
            carrierName: row.carrierName || row.carrier_name || accepted?.carrierName || undefined,
            carrierCompany: row.carrierCompany || row.carrier_company || undefined,
            carrierId: row.carrierId || row.carrier_id || row.nakliyeci_id || accepted?.carrierId || undefined,
            trackingNumber:
              row.trackingNumber ||
              row.tracking_number ||
              (row as any).trackingnumber ||
              (row as any).trackingCode ||
              (row as any).tracking_code ||
              (row as any).trackingcode ||
              (row as any).shipmentCode ||
              (row as any).shipment_code ||
              (row as any).shipmentcode ||
              undefined,
            description: row.description || '',
            category: row.category || 'Genel',
            weight: row.weight ? (typeof row.weight === 'number' ? String(row.weight) : String(row.weight)) : '0',
            dimensions: row.dimensions || (row.volume ? String(row.volume) : '0'),
            specialRequirements: row.specialRequirements ? (Array.isArray(row.specialRequirements) ? row.specialRequirements : [row.specialRequirements]) : [],
            trackingCode: toTrackingCode(
              (row as any).trackingNumber ||
                (row as any).tracking_number ||
                (row as any).trackingnumber ||
                (row as any).trackingCode ||
                (row as any).tracking_code ||
                (row as any).trackingcode ||
                (row as any).shipmentCode ||
                (row as any).shipment_code ||
                (row as any).shipmentcode,
              row.id ?? shipmentId
            ),
            subCategory: row.subCategory || row.category || 'Genel',
            rating: row.rating || undefined,
            volume: row.volume ? (typeof row.volume === 'number' ? String(row.volume) : String(row.volume)) : '0',
            pickupDate: row.pickupDate || row.pickup_date || undefined,
            deliveryDate: row.deliveryDate || row.delivery_date || undefined,
            pickupAddress: row.pickupAddress || row.pickup_address || undefined,
            deliveryAddress: row.deliveryAddress || row.delivery_address || undefined,
            pickupCity: row.pickupCity || row.pickup_city || undefined,
            deliveryCity: row.deliveryCity || row.delivery_city || undefined,
          };

          setShipments((prev) => {
            const rest = prev.filter((s) => String(s.id) !== String(formatted.id));
            return [formatted, ...rest];
          });
        }
      } catch (_e) {
        // ignore, we'll still refresh list
      } finally {
        loadShipments();
      }
    };
    upsertAcceptedShipment();

    return () => clearTimeout(t);
  }, [location.pathname, location.state, navigate]);

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
    const normalizedStatus = String(status || '').trim().toLowerCase();
    return (
      normalizedStatus === 'offer_accepted' ||
      normalizedStatus === 'accepted' ||
      normalizedStatus === 'in_progress' ||
      normalizedStatus === 'assigned' ||
      normalizedStatus === 'in_transit' ||
      normalizedStatus === 'delivered' ||
      normalizedStatus === 'completed' ||
      normalizedStatus === 'teklif kabul edildi' // Turkish status support
      || normalizedStatus === 'tamamlandı' // Turkish status support
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
    if (!user?.id) {
      setLoading(false);
      return;
    }

    type BackendShipment = {
      id: number | string;
      title?: string;
      pickupCity?: string;
      pickup_city?: string;
      pickupDistrict?: string;
      deliveryCity?: string;
      delivery_city?: string;
      deliveryDistrict?: string;
      fromCity?: string;
      toCity?: string;
      status?: string;
      createdAt?: string;
      created_at?: string;
      pickupDate?: string;
      pickup_date?: string;
      deliveryDate?: string;
      delivery_date?: string;
      actualDeliveryDate?: string;
      price?: number | string;
      displayPrice?: number | string;
      offerPrice?: number | string;
      value?: number | string;
      carrierName?: string;
      carrier_name?: string;
      carrierEmail?: string;
      carrier_email?: string;
      carrierCompany?: string;
      carrier_company?: string;
      carrierId?: number | string;
      carrier_id?: number | string;
      nakliyeci_id?: number | string;
      trackingNumber?: string;
      tracking_number?: string;
      description?: string;
      category?: string;
      subCategory?: string;
      subcategory?: string;
      weight?: number | string;
      dimensions?: string;
      volume?: number | string;
      specialRequirements?: string | string[];
      carrierRating?: number;
      carrierReviews?: number;
      carrierVerified?: boolean;
      completedJobs?: number;
      successRate?: number;
    };

    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      if (!token) {
        setShipments(emptyShipments);
        setLoading(false);
        return;
      }

      // Timeout protection - maksimum 10 saniye bekle
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const params = new URLSearchParams();
      params.set('page', String(pagination.page));
      params.set('limit', String(pagination.limit));
      const response = await fetch(`${createApiUrl('/api/shipments')}?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json().catch(() => null);
      const rows = (data?.data?.shipments || data?.shipments || data?.data || []) as BackendShipment[];
      const shipmentsArr = (Array.isArray(rows) ? rows : []).filter(Boolean) as BackendShipment[];

      const formattedShipments = shipmentsArr.map((shipment: BackendShipment) => {
        const idStr = String(shipment.id ?? '');
        const rawTracking =
          shipment.trackingNumber ||
          shipment.tracking_number ||
          (shipment as any).trackingnumber ||
          (shipment as any).trackingCode ||
          (shipment as any).tracking_code ||
          (shipment as any).trackingcode ||
          (shipment as any).shipmentCode ||
          (shipment as any).shipment_code ||
          (shipment as any).shipmentcode ||
          undefined;
        const rawStatus = shipment.status;
        const normalizedStatus =
          rawStatus === 'open' || rawStatus === 'waiting_for_offers'
            ? 'waiting'
            : rawStatus === 'offer_accepted' || rawStatus === 'accepted'
              ? 'offer_accepted'
              : rawStatus === 'in_transit' || rawStatus === 'in_progress'
                ? 'in_transit'
                : rawStatus === 'delivered'
                  ? 'delivered'
                  : rawStatus === 'completed'
                    ? 'completed'
                  : rawStatus === 'cancelled'
                    ? 'cancelled'
                    : rawStatus === 'preparing'
                      ? 'preparing'
                      : 'waiting';

        const pickupCity = shipment.pickupCity || shipment.pickup_city;
        const deliveryCity = shipment.deliveryCity || shipment.delivery_city;

        const formatted: Shipment = {
          id: idStr,
          title: sanitizeShipmentTitle(shipment.title || (shipment as any).productDescription || (shipment as any).description || 'Gönderi'),
          ...resolveShipmentRoute({
            ...shipment,
            pickupCity,
            deliveryCity,
          }),
          status: normalizedStatus as Shipment['status'],
          createdAt: shipment.createdAt || shipment.created_at || new Date().toISOString(),
          estimatedDelivery:
            shipment.deliveryDate ||
            shipment.delivery_date ||
            shipment.pickupDate ||
            shipment.pickup_date ||
            new Date().toISOString(),
          actualDelivery:
            normalizedStatus === 'delivered'
              ? shipment.actualDeliveryDate || shipment.deliveryDate || shipment.delivery_date
              : undefined,
          price: Number(shipment.displayPrice ?? shipment.price ?? shipment.offerPrice ?? shipment.value ?? 0),
          carrierName: shipment.carrierName || shipment.carrier_name || shipment.carrierEmail || shipment.carrier_email || undefined,
          carrierId: shipment.carrierId ? String(shipment.carrierId) : shipment.carrier_id ? String(shipment.carrier_id) : shipment.nakliyeci_id ? String(shipment.nakliyeci_id) : undefined,
          carrierPhone: undefined,
          carrierEmail: undefined,
          carrierCompany: shipment.carrierCompany || shipment.carrier_company || undefined,
          trackingNumber: rawTracking || undefined,
          description: shipment.description || '',
          category: shipment.category || 'Genel',
          weight: shipment.weight ? String(shipment.weight) : '0',
          dimensions: shipment.dimensions || (shipment.volume ? String(shipment.volume) : '0'),
          specialRequirements: shipment.specialRequirements
            ? Array.isArray(shipment.specialRequirements)
              ? shipment.specialRequirements
              : String(shipment.specialRequirements)
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean)
            : [],
          trackingCode: toTrackingCode(rawTracking, idStr),
          subCategory: shipment.subCategory || shipment.subcategory || shipment.category || 'Genel',
          rating: undefined,
          volume: shipment.volume ? String(shipment.volume) : '0',
          pickupDate: shipment.pickupDate || shipment.pickup_date || undefined,
          deliveryDate: shipment.deliveryDate || shipment.delivery_date || undefined,
          carrierRating: shipment.carrierRating || 0,
          carrierReviews: shipment.carrierReviews || 0,
          carrierVerified: shipment.carrierVerified || false,
          completedJobs: shipment.completedJobs || 0,
          successRate: shipment.successRate || 0,
        };
        return formatted;
      });

      setShipments(formattedShipments.filter(Boolean) as Shipment[]);
      if (data?.pagination) {
        setPagination((prev: typeof pagination) => ({
          ...prev,
          page: data.pagination.page,
          pages: data.pagination.pages,
          total: data.pagination.total,
        }));
      }
    } catch (error: any) {
      logger.error('Gönderiler yüklenirken hata:', error);
      setShipments(emptyShipments);
      // Timeout veya network hatası kontrolü
      if (error?.name === 'AbortError' || error?.message?.includes('fetch')) {
        logger.warn('API çağrısı zaman aşımına uğradı veya bağlantı hatası');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShipments();
  }, [pagination.page, statusFilter, searchTerm]);

  // If navigated with ?shipmentId=..., open detail modal inside this page and then clean the query.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const shipmentId = params.get('shipmentId');
    if (!shipmentId) return;
    if (loading) return;
    if (openedFromQueryRef.current === shipmentId) return;
    openedFromQueryRef.current = shipmentId;

    const open = async () => {
      await openDetailFromShipmentId(shipmentId);
      // Clean query to avoid reopening on refresh/back
      navigate(location.pathname, { replace: true, state: location.state });
    };
    open();
  }, [location.search, location.pathname, loading, shipments]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('yolnext:ratedShipmentIds');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setLocallyRatedShipmentIds(parsed.map((x) => String(x)).filter(Boolean));
      }
    } catch (_) {
      // ignore
    }
  }, []);

  // Reset to first page when filters/sort/search change
  useEffect(() => {
    setPagination((prev: typeof pagination) => ({
      ...prev,
      page: 1,
    }));
  }, [statusFilter, sortBy, searchTerm]);

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
    window.addEventListener('yolnext:refresh-badges', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('yolnext:refresh-badges', handleFocus);
    };
  }, []);

  // Use centralized status utility - getStatusInfoBase returns {text, color, description}
  // For backward compatibility, we map it to include icon
  const getStatusInfo = (status: string) => {
    const baseInfo = getStatusInfoBase(status);
    // Map icon based on status for backward compatibility
    let icon = AlertCircle;
    if (status === 'in_transit') icon = Truck;
    else if (status === 'preparing') icon = Package;
    else if (status === 'delivered' || status === 'completed' || status === 'offer_accepted' || status === 'accepted') icon = CheckCircle;
    else if (status === 'waiting' || status === 'waiting_for_offers') icon = Clock;
    else if (status === 'cancelled') icon = XCircle;
    
    return {
      ...baseInfo,
      icon,
    };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_transit':
        return <Truck className='w-4 h-4' />;
      case 'preparing':
        return <Package className='w-4 h-4' />;
      case 'delivered':
        return <CheckCircle className='w-4 h-4' />;
      case 'completed':
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
        
        if (response.status === 403) {
          setNotification({
            type: 'error',
            message: 'Bu gönderiyi görüntüleme yetkiniz yok.',
          });
          setTimeout(() => setNotification(null), 5000);
          return;
        }
        
        if (response.ok) {
          const data = await response.json();
          const shipmentDetail = data.shipment || data.data;

          const resolvedCarrierName =
            shipmentDetail?.carrierName ||
            shipmentDetail?.carrier_name ||
            shipmentDetail?.carrierEmail ||
            shipmentDetail?.carrier_email ||
            shipmentDetail?.carrier?.name ||
            shipmentDetail?.nakliyeci_name ||
            shipmentDetail?.nakliyeci?.name ||
            shipment.carrierName;

          const resolvedCarrierCompany =
            shipmentDetail?.carrierCompany ||
            shipmentDetail?.carrier_company ||
            shipmentDetail?.carrier?.company ||
            shipmentDetail?.nakliyeci_company ||
            shipmentDetail?.nakliyeci?.company ||
            shipment.carrierCompany;

          const resolvedCarrierId =
            shipmentDetail?.carrierId ||
            shipmentDetail?.carrier_id ||
            shipmentDetail?.nakliyeci_id ||
            shipmentDetail?.carrier?.id ||
            shipmentDetail?.nakliyeci?.id ||
            shipment.carrierId;

          // Tüm bilgileri güncelle
          setSelectedShipment({
            ...shipment,
            carrierName: resolvedCarrierName,
            carrierCompany: resolvedCarrierCompany,
            carrierId: resolvedCarrierId,
            driverName: shipmentDetail.driverName || shipment.driverName,
            driverId: shipmentDetail.driver_id || shipmentDetail.driverId || shipment.driverId,
            driverPhone: shipmentDetail.driverPhone || shipmentDetail.driver_phone || shipmentDetail.driver?.phone || shipment.driverPhone,
            vehiclePlate: shipmentDetail.vehiclePlate || shipmentDetail.vehicle_plate || shipmentDetail.vehiclePlate || shipmentDetail.driver?.vehicle?.split(' ')[0] || shipment.vehiclePlate,
            vehicleType: shipmentDetail.vehicleType || shipmentDetail.vehicle_type || shipmentDetail.vehicleType || shipmentDetail.driver?.vehicle?.split(' ').slice(1).join(' ') || shipment.vehicleType,
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

  const openDetailFromShipmentId = async (shipmentIdRaw: string) => {
    const shipmentId = String(shipmentIdRaw || '').trim();
    if (!shipmentId) return;

    const existing = shipments.find((s: Shipment) => String(s.id) === shipmentId);
    if (existing) {
      await handleViewDetails(existing.id);
      return;
    }

    // Fallback: if list doesn't include it (pagination/filter), fetch minimal detail and open modal
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${createApiUrl(`/api/shipments/${shipmentId}`)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        if (response.status === 403) {
          setNotification({
            type: 'error',
            message: 'Bu gönderiyi görüntüleme yetkiniz yok.',
          });
          setTimeout(() => setNotification(null), 5000);
        }
        return;
      }
      const data = await response.json();
      const raw = data?.shipment || data?.data?.shipment || data?.data || data;
      if (!raw) return;

      const pickStr = (...keys: string[]) => {
        for (const k of keys) {
          const v = raw?.[k];
          if (v != null && String(v).trim() !== '') return String(v);
          const lk = String(k).toLowerCase();
          const lv = raw?.[lk];
          if (lv != null && String(lv).trim() !== '') return String(lv);
        }
        return '';
      };

      const statusRaw = String(raw?.status || '').toLowerCase();
      const status: Shipment['status'] =
        statusRaw === 'completed'
          ? 'completed'
          : statusRaw === 'delivered'
            ? 'delivered'
            : statusRaw === 'in_transit'
              ? 'in_transit'
              : statusRaw === 'accepted'
                ? 'accepted'
                : statusRaw === 'offer_accepted'
                  ? 'offer_accepted'
                  : statusRaw === 'waiting_for_offers'
                    ? 'waiting_for_offers'
                    : statusRaw === 'waiting'
                      ? 'waiting'
                      : statusRaw === 'preparing'
                        ? 'preparing'
                        : statusRaw === 'cancelled'
                          ? 'cancelled'
                          : 'waiting';

      const from =
        pickStr('pickupCity', 'pickup_city', 'fromCity', 'from_city') ||
        pickStr('from') ||
        '';
      const to =
        pickStr('deliveryCity', 'delivery_city', 'toCity', 'to_city') ||
        pickStr('to') ||
        '';

      const createdAt = pickStr('createdAt', 'created_at', 'createdat') || new Date().toISOString();
      const estimatedDelivery =
        pickStr('estimatedDelivery', 'estimated_delivery', 'deliveryDate', 'delivery_date') || createdAt;

      const trackingNumber = pickStr('trackingNumber', 'tracking_number', 'trackingCode', 'tracking_code');
      const trackingCode = trackingNumber || `TRK${String(raw?.id ?? shipmentId).padStart(6, '0')}`;

      const priceNum = Number(raw?.price ?? raw?.offerPrice ?? raw?.displayPrice ?? raw?.value ?? 0) || 0;

      const minimal: Shipment = {
        id: String(raw?.id ?? shipmentId),
        title: sanitizeShipmentTitle(String(raw?.title || raw?.productDescription || raw?.description || 'Gönderi')),
        description: String(raw?.description || ''),
        from,
        to,
        status,
        createdAt,
        estimatedDelivery,
        price: priceNum,
        carrierName: raw?.carrierName || raw?.carrier?.name || raw?.carrierEmail || raw?.carrier_email,
        carrierId: raw?.carrierId || raw?.carrier_id || raw?.carrier?.id,
        carrierPhone: raw?.carrierPhone || raw?.carrier_phone || raw?.carrier?.phone,
        carrierEmail: raw?.carrierEmail || raw?.carrier_email || raw?.carrier?.email,
        driverName: raw?.driverName,
        driverId: raw?.driver_id || raw?.driverId,
        driverPhone: raw?.driverPhone || raw?.driver_phone || raw?.driver?.phone,
        driverEmail: raw?.driverEmail,
        vehiclePlate: raw?.vehiclePlate || raw?.vehicle_plate || raw?.driver?.vehicle?.split(' ')[0],
        vehicleType: raw?.vehicleType || raw?.vehicle_type || raw?.driver?.vehicle?.split(' ').slice(1).join(' '),
        trackingNumber,
        trackingCode,
        category: String(raw?.category || raw?.subCategory || ''),
        weight: String(raw?.weight || '0'),
        dimensions: String(raw?.dimensions || (raw?.volume ? String(raw?.volume) : '0')),
        specialRequirements: [],
        subCategory: String(raw?.subCategory || raw?.category || ''),
        volume: String(raw?.volume || '0'),
        pickupDate: raw?.pickupDate || raw?.pickup_date,
        deliveryDate: raw?.deliveryDate || raw?.delivery_date,
        pickupAddress: raw?.pickupAddress || raw?.pickup_address,
        deliveryAddress: raw?.deliveryAddress || raw?.delivery_address,
        pickupCity: raw?.pickupCity || raw?.pickup_city,
        deliveryCity: raw?.deliveryCity || raw?.delivery_city,
      };

      setSelectedShipment(minimal);
      setShowDetailModal(true);
    } catch (_) {
      // ignore
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

  const isShipmentLocallyRated = (shipmentId: string) => {
    const sid = String(shipmentId || '').trim();
    if (!sid) return false;
    return locallyRatedShipmentIds.includes(sid);
  };

  const handleTrackShipment = (shipmentId: string) => {
    navigate(`${basePath}/live-tracking?shipmentId=${shipmentId}`);
  };

  const isTrackEnabledForShipment = (status: Shipment['status']) => {
    const normalizedStatus = String(status || '').trim().toLowerCase();
    return (
      normalizedStatus !== 'waiting' &&
      normalizedStatus !== 'waiting_for_offers' &&
      normalizedStatus !== 'cancelled' &&
      normalizedStatus !== 'canceled'
    );
  };

  const handleMessage = (shipment: Shipment) => {
    const resolvedCarrierId =
      (shipment as any).carrierId ??
      (shipment as any).carrier_id ??
      (shipment as any).nakliyeciId ??
      (shipment as any).nakliyeci_id ??
      (shipment as any).carrier?.id ??
      (shipment as any).nakliyeci?.id ??
      null;

    if (resolvedCarrierId === null || resolvedCarrierId === undefined || String(resolvedCarrierId) === '') {
      // Eğer nakliyeci yoksa, mesajlaşma sayfasına yönlendir
      navigate(`${basePath}/messages`);
      return;
    }

    // Navigate to messages page with userId and shipmentId parameters
    // This will automatically open the conversation with the carrier
    navigate(
      `${basePath}/messages?userId=${encodeURIComponent(String(resolvedCarrierId))}&shipmentId=${encodeURIComponent(String(shipment.id))}`
    );
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
        const data = await response.json().catch(() => null);
        setShowCancelModal(false);
        setCancelReason('');
        setSelectedShipment(null);
        loadShipments(); // Reload shipments

        const successMessage =
          (data && typeof data.message === 'string' && data.message.trim())
            ? data.message
            : 'Gönderi başarıyla iptal edildi';
        setNotification({ type: 'success', message: successMessage });
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
    if (!shipment) return false;
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
        normalized !== 'completed' &&
        normalized !== 'cancelled') ||
      (statusFilter === 'completed' && (normalized === 'delivered' || normalized === 'completed')) ||
      (statusFilter === 'pending' && (normalized === 'waiting_for_offers' || normalized === 'pending'));

    return matchesStatus;
  });

  const sortedShipments = filteredShipments
    .slice()
    .sort((a: Shipment, b: Shipment) => {
      const getTime = (v: any) => {
        const t = new Date(v || 0).getTime();
        return Number.isFinite(t) ? t : 0;
      };

      const statusRank = (s: string) => {
        const v = (s || '').toLowerCase();
        if (v === 'waiting' || v === 'waiting_for_offers' || v === 'pending') return 1;
        if (v === 'offer_accepted' || v === 'accepted') return 2;
        if (v === 'in_transit' || v === 'in_progress') return 3;
        if (v === 'delivered' || v === 'completed') return 4;
        if (v === 'cancelled') return 5;
        return 9;
      };

      const priorityRank = (s: Shipment) => {
        const v = (s.status || '').toLowerCase();
        // No explicit priority field yet; use operational urgency heuristic
        if (v === 'waiting' || v === 'waiting_for_offers' || v === 'pending') return 1;
        if (v === 'offer_accepted' || v === 'accepted') return 2;
        if (v === 'in_transit' || v === 'in_progress') return 3;
        if (v === 'delivered' || v === 'completed') return 4;
        return 9;
      };

      if (sortBy === 'status') {
        const d = statusRank(a.status) - statusRank(b.status);
        if (d !== 0) return d;
        return getTime(b.createdAt) - getTime(a.createdAt);
      }

      if (sortBy === 'value') {
        const pa = Number(a.price || 0);
        const pb = Number(b.price || 0);
        if (pb !== pa) return pb - pa;
        return getTime(b.createdAt) - getTime(a.createdAt);
      }

      if (sortBy === 'priority') {
        const d = priorityRank(a) - priorityRank(b);
        if (d !== 0) return d;
        return getTime(b.createdAt) - getTime(a.createdAt);
      }

      // date (default)
      return getTime(b.createdAt) - getTime(a.createdAt);
    });

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center'>
        <LoadingState message='Gönderiler yükleniyor...' size='lg' />
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

      {showAcceptedOfferModal && acceptedOfferAssist && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
          <div
            className='absolute inset-0 bg-black/20 backdrop-blur-sm'
            onClick={() => setShowAcceptedOfferModal(false)}
          />
          <div className='relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200'>
            <button
              type='button'
              onClick={() => setShowAcceptedOfferModal(false)}
              className='absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors'
              aria-label='Kapat'
            >
              <XCircle className='w-5 h-5' />
            </button>
            <div className='p-6'>
              <div className='flex items-start gap-4'>
                <div className='w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl flex items-center justify-center flex-shrink-0'>
                  <Info className='w-6 h-6 text-white' />
                </div>
                <div className='flex-1'>
                  <div className='text-lg font-semibold text-slate-900'>Teklif kabul edildi</div>
                  <div className='mt-1 text-sm text-slate-600'>
                    {acceptedOfferAssist?.carrierName
                      ? `${acceptedOfferAssist.carrierName} ile ödeme ve süreç detaylarını mesajlaşma üzerinden netleştirin. Ödeme tutarı güvence altına alınmıştır.`
                      : 'Ödeme ve süreç detaylarını mesajlaşma üzerinden netleştirin. Ödeme tutarı güvence altına alınmıştır.'}
                  </div>
                </div>
              </div>

              <div className='mt-5'>
                <div className='text-xs font-medium text-slate-600 mb-2'>Hazır mesaj</div>
                <div className='bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800'>
                  {acceptedOfferAssist.prefill || 'Merhaba, ödeme detaylarını netleştirelim.'}
                </div>
              </div>

              <div className='mt-6 flex items-center justify-end gap-2'>
                <button
                  type='button'
                  className='px-5 py-2.5 bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-900 hover:to-blue-950 text-white rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed'
                  disabled={!acceptedOfferAssist?.carrierId}
                  onClick={() => {
                    const carrierId = acceptedOfferAssist?.carrierId;
                    if (!carrierId) return;
                    const params = new URLSearchParams();
                    params.set('userId', String(carrierId));
                    if (acceptedOfferAssist?.shipmentId) params.set('shipmentId', String(acceptedOfferAssist.shipmentId));
                    if (acceptedOfferAssist?.prefill) params.set('prefill', String(acceptedOfferAssist.prefill));
                    setShowAcceptedOfferModal(false);
                    navigate(`${basePath}/messages?${params.toString()}`);
                  }}
                >
                  Mesaj Gönder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className='max-w-5xl mx-auto px-4 py-6'>
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: 'Ana Sayfa', href: `${basePath}/dashboard` },
            { label: 'Gönderilerim' },
          ]}
          className='mb-6'
        />

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

        <div className='mb-6'>
          <GuidanceOverlay
            storageKey='individual.my-shipments'
            isEmpty={!loading && shipments.length === 0}
            icon={Package}
            title='Gönderilerim'
            description='Yeni gönderi oluşturup teklif toplayabilir veya mevcut gönderilerinizin durumunu buradan takip edebilirsiniz. Teklif kabul edildikten sonra ödeme ve süreç detayları için "Mesajlar" sayfasına geçebilirsiniz.'
            primaryAction={{
              label: 'Gönderi Oluştur',
              to: '/individual/create-shipment',
            }}
            secondaryAction={{
              label: 'Tekliflere Git',
              to: '/individual/offers',
            }}
          />
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
                aria-label='Gönderi ara'
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
              className='px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              aria-label='Durum filtresi'
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
              aria-label='Sıralama seçeneği'
            >
              <option value='date'>Tarihe Göre</option>
              <option value='status'>Duruma Göre</option>
              <option value='priority'>Önceliğe Göre</option>
              <option value='value'>Değere Göre</option>
            </select>

            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setSortBy('date');
                setPagination((prev: typeof pagination) => ({
                  ...prev,
                  page: 1,
                }));
              }}
              className='min-h-[44px] px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2'
              aria-label='Filtreleri sıfırla'
            >
              <X className='w-4 h-4' />
              Sıfırla
            </button>
          </div>

          {/* Export Buttons kaldırıldı */}
        </div>

        {/* Shipments Table */}
        <div className='bg-white rounded-2xl p-4 sm:p-8 shadow-xl border border-slate-200'>
          {/* Desktop Table View */}
          <div className='hidden md:block'>
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
                  {sortedShipments.length > 0 ? (
                    sortedShipments.map((shipment, index) => (
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
                                  'other': 'Diğer',
                                  'general': 'Genel Gönderi'
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
                                : shipment.status === 'completed'
                                  ? 'bg-gray-100 text-gray-800'
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
                          {shipment.carrierId && shipment.carrierName ? (
                            <CarrierInfoCard
                              carrierId={String(shipment.carrierId)}
                              carrierName={shipment.carrierName}
                              companyName={shipment.carrierCompany}
                              carrierRating={shipment.carrierRating || 0}
                              carrierReviews={shipment.carrierReviews || 0}
                              carrierVerified={shipment.carrierVerified || false}
                              successRate={shipment.successRate || 0}
                              completedJobs={shipment.completedJobs || 0}
                              variant="compact"
                              showMessaging={false}
                              className="max-w-xs"
                            />
                          ) : (
                            <div className='text-sm font-medium text-slate-500'>
                              Atanmamış
                            </div>
                          )}
                        </td>
                        <td className='py-4 px-4'>
                          <div className='text-sm font-bold text-slate-900'>
                            {shipment.price && Number(shipment.price) > 0 
                              ? formatCurrency(shipment.price) 
                              : <span className='text-slate-400 font-normal'>Teklif Bekleniyor</span>}
                          </div>
                          <div className='text-xs text-slate-500'>
                            {shipment.volume && shipment.volume !== '0' && Number(shipment.volume) > 0 ? `${shipment.volume} m³` : ''}
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
                              aria-label={`${shipment.trackingCode} gönderisinin detaylarını görüntüle`}
                            >
                              Detay
                            </button>
                            {isTrackEnabledForShipment(shipment.status) && (
                              <button
                                onClick={() => handleTrackShipment(shipment.id)}
                                className='px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 text-xs font-medium rounded-lg transition-colors'
                                aria-label={`${shipment.trackingCode} gönderisini takip et`}
                              >
                                Takip
                              </button>
                            )}
                            <button
                              onClick={() => handleMessage(shipment)}
                              disabled={!isMessagingEnabledForShipment(shipment.status)}
                              title={!isMessagingEnabledForShipment(shipment.status) ? 'Mesajlaşma teklif kabul edilince açılır' : 'Nakliyeci ile mesajlaş'}
                              aria-label={!isMessagingEnabledForShipment(shipment.status) ? 'Mesajlaşma teklif kabul edilince açılır' : 'Nakliyeci ile mesajlaş'}
                              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                isMessagingEnabledForShipment(shipment.status)
                                  ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                  : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                              }`}
                            >
                              Mesaj
                            </button>
                            {shipment.status === 'delivered' && (
                              <button
                                onClick={() => handleConfirmDelivery(shipment)}
                                className='px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 text-xs font-medium rounded-lg transition-colors'
                              >
                                Onayla
                              </button>
                            )}
                            {(shipment.status === 'completed') && shipment.carrierName && !shipment.rating && !isShipmentLocallyRated(shipment.id) && (
                              <button
                                onClick={() => handleRateCarrier(shipment)}
                                className='px-3 py-1.5 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 text-xs font-medium rounded-lg transition-colors'
                              >
                                Değerlendir
                              </button>
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
                      <td colSpan={6} className='py-10 px-4'>
                        <EmptyState
                          icon={Package}
                          title='Henüz gönderin yok'
                          description='İlk gönderinizi oluşturun, dakikalar içinde teklifler gelmeye başlayacak. Ortalama bekleme süresi 5-15 dakikadır.'
                          action={{
                            label: 'Yeni Gönderi Oluştur',
                            onClick: () => navigate('/individual/create-shipment'),
                          }}
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {/* Mobile Card View */}
          <div className='md:hidden'>
            {sortedShipments.length > 0 ? (
              sortedShipments.map((shipment, index) => (
                <div
                  key={`${shipment.id}-${shipment.trackingCode}-${index}`}
                  className='bg-white rounded-2xl shadow-md border border-slate-200 mb-4'
                >
                  <div className='p-4'>
                    <div className='flex items-center justify-between mb-3'>
                      <div className='text-lg font-bold text-slate-900'>{shipment.trackingCode}</div>
                      <div className='text-xs text-slate-500'>{formatDate(shipment.createdAt, 'long')}</div>
                    </div>
                    <div className='text-sm font-medium text-slate-900 mb-2'>{shipment.title}</div>
                    <div className='text-xs text-slate-500'>{shipment.from} → {shipment.to}</div>
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
                  </div>

                  {/* Carrier */}
                  <div className='mb-3'>
                    {shipment.carrierId && shipment.carrierName ? (
                      <CarrierInfoCard
                        carrierId={String(shipment.carrierId)}
                        carrierName={shipment.carrierName}
                        companyName={shipment.carrierCompany}
                        carrierRating={shipment.carrierRating || 0}
                        carrierReviews={shipment.carrierReviews || 0}
                        carrierVerified={shipment.carrierVerified || false}
                        successRate={shipment.successRate || 0}
                        completedJobs={shipment.completedJobs || 0}
                        variant="compact"
                        showMessaging={false}
                        className="w-full"
                      />
                    ) : (
                      <div className='text-sm font-medium text-slate-500'>
                        Nakliyeci atanmamış
                      </div>
                    )}
                  </div>

                  {/* Price and Date */}
                  <div className='mb-4'>
                    <div className='text-lg font-bold text-slate-900 mb-1'>
                      {formatCurrency(shipment.price)}
                    </div>
                    <div className='text-xs text-slate-500 space-y-1'>
                      <div>Teslimat: {formatDate(shipment.estimatedDelivery, 'long')}</div>
                      {shipment.volume && shipment.volume !== '0' && (
                        <div>Hacim: {shipment.volume} m³</div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className='flex flex-wrap gap-2'>
                    <button
                      onClick={() => handleViewDetails(shipment.id)}
                      className='flex-1 min-w-[80px] min-h-[44px] px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-medium rounded-lg transition-colors flex items-center justify-center'
                      aria-label={`${shipment.trackingCode} gönderisinin detaylarını görüntüle`}
                    >
                      Detay
                    </button>
                    {isTrackEnabledForShipment(shipment.status) && (
                      <button
                        onClick={() => handleTrackShipment(shipment.id)}
                        className='flex-1 min-w-[80px] min-h-[44px] px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 text-xs font-medium rounded-lg transition-colors flex items-center justify-center'
                        aria-label={`${shipment.trackingCode} gönderisini takip et`}
                      >
                        Takip
                      </button>
                    )}
                    <button
                      onClick={() => handleMessage(shipment)}
                      disabled={!isMessagingEnabledForShipment(shipment.status)}
                      className={`flex-1 min-w-[80px] min-h-[44px] px-3 py-2 text-xs font-medium rounded-lg transition-colors flex items-center justify-center ${
                        isMessagingEnabledForShipment(shipment.status)
                          ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                          : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                      }`}
                      aria-label={!isMessagingEnabledForShipment(shipment.status) ? 'Mesajlaşma teklif kabul edilince açılır' : 'Nakliyeci ile mesajlaş'}
                    >
                      Mesaj
                    </button>
                  </div>

                  {/* Additional Actions for Delivered */}
                  {shipment.status === 'delivered' && (
                    <div className='flex flex-wrap gap-2 mt-2'>
                      <button
                        onClick={() => handleConfirmDelivery(shipment)}
                        className='flex-1 min-w-[80px] min-h-[44px] px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 text-xs font-medium rounded-lg transition-colors flex items-center justify-center'
                        aria-label='Teslimatı onayla'
                      >
                        Onayla
                      </button>
                      {shipment.carrierName && !shipment.rating && !isShipmentLocallyRated(shipment.id) && (
                        <button
                          onClick={() => handleRateCarrier(shipment)}
                          className='flex-1 min-w-[80px] min-h-[44px] px-3 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 text-xs font-medium rounded-lg transition-colors flex items-center justify-center'
                          aria-label='Nakliyeciyi değerlendir'
                        >
                          Değerlendir
                        </button>
                      )}
                    </div>
                  )}

                  {/* Cancel Action */}
                  {canCancelShipment(shipment.status) && (
                    <div className='mt-2'>
                      <button
                        onClick={() => handleCancelClick(shipment)}
                        className='w-full min-h-[44px] px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-medium rounded-lg transition-colors flex items-center justify-center'
                        aria-label='Gönderiyi iptal et'
                      >
                        İptal Et
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className='min-h-[50vh] flex items-center justify-center px-4 py-12'>
                <div className='bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center w-full max-w-sm'>
                  <EmptyState
                    icon={Package}
                    title='Henüz gönderin yok'
                    description='İlk gönderinizi oluşturun, dakikalar içinde teklifler gelmeye başlayacak. Ortalama bekleme süresi 5-15 dakikadır. Gönderilerinizi buradan takip edebilir ve yönetebilirsiniz.'
                    action={{
                      label: 'Yeni Gönderi Oluştur',
                      onClick: () => navigate('/individual/create-shipment'),
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {pagination.pages > 1 && (
          <div className='mt-6 flex flex-col sm:flex-row items-center justify-between gap-3'>
            <div className='text-sm text-slate-600'>
              Toplam {pagination.total} gönderi
            </div>
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.pages}
              onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
            />
          </div>
        )}
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
          onSubmitted={(payload) => {
            const sid = String(payload?.shipmentId || '').trim();
            if (!sid) return;
            setLocallyRatedShipmentIds((prev) => {
              const next = prev.includes(sid) ? prev : [...prev, sid];
              try {
                localStorage.setItem('yolnext:ratedShipmentIds', JSON.stringify(next));
              } catch (_) {
                // ignore
              }
              return next;
            });
            setShipments((prev) =>
              prev.map((s) =>
                String(s.id) === sid
                  ? ({
                      ...s,
                      rating: Number(payload.rating) || s.rating,
                      ratingComment: payload.comment,
                    } as any)
                  : s
              )
            );
          }}
          ratedUser={selectedCarrier}
          currentUser={{
            id: user.id.toString(),
            name: (user as any).name || user.email || 'Kullanıcı',
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
              
              {/* İptal Kuralları Bilgisi */}
              <div className='mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg'>
                <div className='flex items-start gap-3'>
                  <Info className='w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5' />
                  <div className='flex-1'>
                    <h4 className='text-sm font-semibold text-blue-900 mb-2'>İptal Kuralları</h4>
                    <ul className='text-xs text-blue-800 space-y-1.5'>
                      <li className='flex items-start gap-2'>
                        <span className='font-semibold'>•</span>
                        <span>Teklif kabul edilmeden önce: İptal edebilirsiniz, herhangi bir ücret kesintisi olmaz.</span>
                      </li>
                      <li className='flex items-start gap-2'>
                        <span className='font-semibold'>•</span>
                        <span>Teklif kabul edildikten sonra: İptal işlemi ilgili taraflara bildirilir. Ödeme güvence altındaysa iade süreci başlatılır.</span>
                      </li>
                      <li className='flex items-start gap-2'>
                        <span className='font-semibold'>•</span>
                        <span>Yük yola çıktıktan sonra: İptal edilemez. Sorun olursa nakliyeci ile mesajlaşarak çözüm bulun.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              
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
                          const prefill = `Merhaba, ödeme (IBAN/alıcı adı/açıklama) ve yükleme saatini netleştirelim. İş No: ${selectedShipment.trackingCode || `TRK${String(selectedShipment.id).padStart(6, '0')}`}`;
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
                        disabled={!isTrackEnabledForShipment(selectedShipment.status)}
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
                        : selectedShipment.status === 'completed'
                          ? 'bg-gray-100 text-gray-800'
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
              {selectedShipment.carrierId && selectedShipment.carrierName ? (
                <CarrierInfoCard
                  carrierId={selectedShipment.carrierId}
                  carrierName={selectedShipment.carrierName}
                  companyName={selectedShipment.carrierCompany}
                  carrierRating={selectedShipment.carrierRating || 0}
                  carrierReviews={selectedShipment.carrierReviews || 0}
                  carrierVerified={selectedShipment.carrierVerified || false}
                  successRate={selectedShipment.successRate || 0}
                  completedJobs={selectedShipment.completedJobs || 0}
                  variant="detailed"
                  showMessaging={isMessagingEnabledForShipment(selectedShipment.status)}
                  messagingEnabled={isMessagingEnabledForShipment(selectedShipment.status)}
                  onMessageClick={() => {
                    if (selectedShipment.carrierId && selectedShipment.carrierName) {
                      setSelectedCarrier({
                        id: selectedShipment.carrierId,
                        name: selectedShipment.carrierName,
                        email: selectedShipment.carrierEmail || '',
                        type: 'nakliyeci'
                      });
                      setSelectedShipmentId(selectedShipment.id);
                      setShowMessagingModal(true);
                    }
                  }}
                  className="mb-6"
                />
              ) : (
                <div className='bg-blue-50 rounded-lg p-5 border border-blue-200 mb-6'>
                  <div className='flex items-center gap-2 text-amber-600 bg-amber-50 rounded-lg p-3 border border-amber-200'>
                    <AlertCircle className='w-5 h-5' />
                    <p className='font-medium'>Nakliyeci bekleniyor</p>
                  </div>
                </div>
              )}

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
                        Taşıyıcı Adı
                      </label>
                      <p className='text-gray-900 font-semibold'>{selectedShipment.driverName}</p>
                    </div>
                    {selectedShipment.driverPhone && (
                      <div>
                        <label className='text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block flex items-center gap-1'>
                          <Phone className='w-3 h-3' />
                          Taşıyıcı Telefonu
                        </label>
                        <p className='text-gray-900 font-semibold'>{selectedShipment.driverPhone}</p>
                      </div>
                    )}
                    {selectedShipment.vehiclePlate && (
                      <div>
                        <label className='text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block flex items-center gap-1'>
                          <Truck className='w-3 h-3' />
                          Araç Plakası
                        </label>
                        <p className='text-gray-900 font-semibold'>{selectedShipment.vehiclePlate}</p>
                      </div>
                    )}
                    {selectedShipment.vehicleType && (
                      <div>
                        <label className='text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block flex items-center gap-1'>
                          <Truck className='w-3 h-3' />
                          Araç Tipi
                        </label>
                        <p className='text-gray-900 font-semibold'>{selectedShipment.vehicleType}</p>
                      </div>
                    )}
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

              {/* Teslimat Onayı Bilgisi */}
              {selectedShipment.status === 'delivered' && (
                <div className='mb-6 p-4 bg-emerald-50 border-2 border-emerald-200 rounded-lg'>
                  <div className='flex items-start gap-3'>
                    <CheckCircle className='w-6 h-6 text-emerald-700 flex-shrink-0 mt-0.5' />
                    <div className='flex-1'>
                      <h4 className='text-sm font-semibold text-emerald-900 mb-2'>Teslimat Onayı</h4>
                      <p className='text-xs text-emerald-800 leading-relaxed mb-3'>
                        Yükünüz teslim edildi. Lütfen yükü kontrol edip onaylayın. Onayladığınızda ödeme nakliyeciye aktarılır.
                      </p>
                      <p className='text-xs text-emerald-700'>
                        <span className='font-semibold'>Sorun varsa:</span> Yükü onaylamadan önce nakliyeci ile mesajlaşarak durumu netleştirin. Sorunlar taraflar arasında çözülmelidir.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Ödeme Detayları Bilgisi - Teklif kabul edildikten sonra */}
              {(selectedShipment.status === 'offer_accepted' || selectedShipment.status === 'accepted' || selectedShipment.status === 'in_progress' || selectedShipment.status === 'picked_up' || selectedShipment.status === 'in_transit') && selectedShipment.carrierId && (
                <div className='mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg'>
                  <div className='flex items-start gap-3'>
                    <DollarSign className='w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5' />
                    <div className='flex-1'>
                      <h4 className='text-sm font-semibold text-blue-900 mb-2'>Ödeme Detayları</h4>
                      <p className='text-xs text-blue-800 leading-relaxed mb-2'>
                        Ödeme tutarı güvence altına alınmıştır. Ödeme yöntemi (IBAN, alıcı adı, açıklama) ve yükleme saatini nakliyeci ile mesajlaşma üzerinden netleştirin.
                      </p>
                            <p className='text-xs text-blue-700'>
                              <span className='font-semibold'>Önemli:</span> Ödeme detaylarını yazılı olarak teyit edin. Sorun olursa nakliyeci ile mesajlaşarak çözüm bulun. Platform sadece tarafları buluşturan bir pazaryeridir.
                            </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Acil Durum Bilgilendirmesi - Yolda olan gönderiler için */}
              {(selectedShipment.status === 'picked_up' || selectedShipment.status === 'in_transit') && (
                <div className='mb-6 p-4 bg-red-50 border-2 border-red-300 rounded-lg'>
                  <div className='flex items-start gap-3'>
                    <AlertCircle className='w-5 h-5 text-red-700 flex-shrink-0 mt-0.5' />
                    <div className='flex-1'>
                      <h4 className='text-sm font-semibold text-red-900 mb-2'>Acil Durumlar ve Sorumluluk</h4>
                      <p className='text-xs text-red-800 leading-relaxed mb-3'>
                        <strong>YolNext bir pazaryeri platformudur. Hiçbir sorumluluk almaz.</strong>
                      </p>
                      <div className='space-y-2 text-xs text-red-800 mb-3'>
                        <p>
                          <strong>Kaza, yangın, çalınma gibi durumlarda:</strong>
                        </p>
                        <ul className='list-disc list-inside space-y-1 ml-2'>
                          <li>Doğrudan nakliyeci ve taşıyıcı ile iletişime geçin</li>
                          <li>Tüm sorunlar taraflar arasında çözülmelidir</li>
                          <li>Platform sadece tarafları buluşturan bir aracıdır</li>
                          <li>Sigorta ihtiyacınız varsa, kendi sigortanızı yaptırmak sizin sorumluluğunuzdadır</li>
                        </ul>
                      </div>
                      <p className='text-xs text-red-700'>
                        <span className='font-semibold'>İletişim:</span> Yukarıdaki taşıyıcı ve nakliyeci bilgilerini kullanarak doğrudan iletişime geçin.
                      </p>
                    </div>
                  </div>
                </div>
              )}

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
