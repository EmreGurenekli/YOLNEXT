import React, { useState, useEffect } from 'react';
// import { Helmet } from 'react-helmet-async';
import { createApiUrl } from '../../config/api';
import { formatDate } from '../../utils/format';
import { resolveShipmentRoute } from '../../utils/shipmentRoute';
import { getStatusInfo } from '../../utils/shipmentStatus';

interface Shipment {
  id: number;
  title: string;
  trackingCode: string;
  from: string;
  to: string;
  status: string;
  carrier: string;
  carrierId?: number;
  carrierCompany?: string;
  vehiclePlate?: string;
  vehicleType?: string;
  rating: number;
  value: string;
  weight: number;
  volume: number;
  unitType?: string;
  temperatureSetpoint?: string;
  unNumber?: string;
  loadingEquipment?: string;
  estimatedDelivery: string;
  statusText: string;
  progress: number;
  notes: string;
  specialRequirements: string[];
  createdAt: string;
  category: string;
  subCategory: string;
  statusColor: string;
  hasRatedCarrier?: boolean;
  // Detay kartı için ek alanlar
  description?: string;
  driverName?: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  pickupCity?: string;
  deliveryCity?: string;
}

const buildRoute = (raw: any) => resolveShipmentRoute(raw);

// Backend durum kodlarını kullanıcıya gösterilecek Türkçe metinlere çevir
// Merkezi status utility kullanılıyor
function normalizeShipmentStatus(rawStatus?: any) {
  const s = String(rawStatus || '').trim();
  if (!s) return 'waiting_for_offers';
  if (s === 'open') return 'waiting_for_offers';
  return s;
}

const formatStatusText = (rawStatus?: string): string => {
  if (!rawStatus) return 'Beklemede';
  const normalized = normalizeShipmentStatus(rawStatus);
  return getStatusInfo(normalized).text;
};

// Özel gereksinim etiketlerini Türkçe göster
const SPECIAL_REQ_LABELS: Record<string, string> = {
  fragile: 'Kırılgan',
  urgent: 'Acil',
  signature: 'İmzalı Teslimat',
  temperature: 'Soğuk Zincir',
  valuable: 'Değerli',
};

const formatSpecialRequirement = (req: string): string => {
  const key = String(req).trim();
  return SPECIAL_REQ_LABELS[key] || key;
};
import {
  Package,
  Search,
  MapPin,
  Clock,
  Star,
  Truck,
  CheckCircle,
  AlertCircle,
  Calendar,
  Building2,
  DollarSign,
  X,
  Navigation,
  FileText,
  Info,
  Phone,
  User,
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import Breadcrumb from '../../components/shared-ui-elements/Breadcrumb';
import EmptyState from '../../components/shared-ui-elements/EmptyState';
import LoadingState from '../../components/shared-ui-elements/LoadingState';
// import SuccessMessage from '../../components/shared-ui-elements/SuccessMessage';
import RatingModal from '../../components/RatingModal';
import Pagination from '../../components/shared-ui-elements/Pagination';
import { useAuth } from '../../contexts/AuthContext';
import GuidanceOverlay from '../../components/shared-ui-elements/GuidanceOverlay';
import { useToast } from '../../contexts/ToastContext';
import { TOAST_MESSAGES, showProfessionalToast } from '../../utils/toastMessages';
import CorporateShipmentsHeader from '../../components/shipment/CorporateShipmentsHeader';
import CorporateShipmentsFilters from '../../components/shipment/CorporateShipmentsFilters';
import CorporateShipmentsTableRow from '../../components/shipment/CorporateShipmentsTableRow';
import CorporateShipmentsCard from '../../components/shipment/CorporateShipmentsCard';
import { logger } from '../../utils/logger';

export default function CorporateShipments() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  // State variables
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'price' | 'status' | 'value' | 'priority'>('date');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedShipmentDetail, setSelectedShipmentDetail] = useState<Shipment | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedShipmentForDetails, setSelectedShipmentForDetails] = useState<Shipment | null>(null);
  const [selectedShipmentForCancel, setSelectedShipmentForCancel] = useState<Shipment | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [selectedShipmentForTracking, setSelectedShipmentForTracking] = useState<Shipment | null>(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState<any>(null);
  const [selectedShipmentId, setSelectedShipmentId] = useState<number | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [acceptedShipmentId, setAcceptedShipmentId] = useState<number | null>(null);
  const [showProcessAssistantDetails, setShowProcessAssistantDetails] = useState(false);

  // Base shipment template
  const baseShipment: Shipment = {
    id: 0,
    title: '',
    trackingCode: '',
    from: '',
    to: '',
    status: 'waiting_for_offers',
    carrier: '',
    rating: 0,
    value: '₺0',
    weight: 0,
    volume: 0,
    estimatedDelivery: '',
    statusText: 'Beklemede',
    progress: 0,
    notes: '',
    specialRequirements: [],
    createdAt: '',
    category: '',
    subCategory: '',
    statusColor: '',
  };

  // Helper functions
  const toTrackingCode = (raw: any, id: number | string): string => {
    if (raw && String(raw).trim() !== '') return String(raw);
    return `YOL${String(id).padStart(6, '0')}`;
  };

  const toNumber = (value: any, defaultValue: number = 0): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value.replace(/[^\d.-]/g, ''));
      return isNaN(parsed) ? defaultValue : parsed;
    }
    return defaultValue;
  };

  const isMessagingEnabledForStatus = (status: string): boolean => {
    const normalized = normalizeShipmentStatus(status);
    return ['accepted', 'offer_accepted', 'in_progress', 'in_transit', 'picked_up'].includes(normalized);
  };

  const handleViewDetails = (shipment: Shipment) => {
    setSelectedShipmentForDetails(shipment);
    setShowDetailsModal(true);
    loadShipmentDetail(String(shipment.id));
  };

  const loadShipmentDetail = async (shipmentId: string) => {
    setIsLoading(true);
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
    }, 10000); // 10 seconds timeout

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        createApiUrl(`/api/shipments/${shipmentId}`),
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const detail = data.shipment || data.data || data;

        const pickStr = (...keys: string[]) => {
          for (const k of keys) {
            const v = (detail as any)?.[k];
            if (v != null && String(v).trim() !== '') return String(v);
            const lk = String(k).toLowerCase();
            const lv = (detail as any)?.[lk];
            if (lv != null && String(lv).trim() !== '') return String(lv);
          }
          return '';
        };

        const detailCategoryData =
          (detail && (detail.categoryData || detail.category_data)) || {};

        setSelectedShipmentDetail({
          ...baseShipment,
          carrier:
            pickStr('carrierName', 'carrier_name', 'carrierEmail', 'carrier_email') ||
            baseShipment.carrier,
          vehiclePlate:
            detail.vehiclePlate ||
            detail.vehicle_plate ||
            baseShipment.vehiclePlate,
          vehicleType:
            detail.vehicleType ||
            detail.vehicle_type ||
            baseShipment.vehicleType,
          carrierId:
            detail.nakliyeci_id ||
              detail.carrierId ||
              detail.carrier_id ||
              baseShipment.carrierId,
          carrierCompany:
            detail.carrierCompany ||
            detail.carrier_company ||
            baseShipment.carrierCompany,
          driverName: detail.driverName || baseShipment.driverName,
          pickupAddress:
            pickStr('pickupAddress', 'pickup_address', 'fromAddress', 'from_address') ||
            baseShipment.pickupAddress,
          deliveryAddress:
            pickStr('deliveryAddress', 'delivery_address', 'toAddress', 'to_address') ||
            baseShipment.deliveryAddress,
          pickupCity:
            pickStr('pickupCity', 'pickup_city', 'fromCity', 'from_city') ||
            baseShipment.pickupCity,
          deliveryCity:
            pickStr('deliveryCity', 'delivery_city', 'toCity', 'to_city') ||
            baseShipment.deliveryCity,
          description: detail.description || baseShipment.description,
          unitType:
            detailCategoryData.unitType ||
            detail.unitType ||
            baseShipment.unitType,
          temperatureSetpoint:
            detailCategoryData.temperatureSetpoint ||
            detailCategoryData.temperature_setpoint ||
            detail.temperatureSetpoint ||
            detail.temperature_setpoint ||
            baseShipment.temperatureSetpoint,
          unNumber:
            detailCategoryData.unNumber ||
            detailCategoryData.un_number ||
            detail.unNumber ||
            detail.un_number ||
            baseShipment.unNumber,
          loadingEquipment:
            detailCategoryData.loadingEquipment ||
            detailCategoryData.loading_equipment ||
            detail.loadingEquipment ||
            detail.loading_equipment ||
            baseShipment.loadingEquipment,
        });
      } else {
        clearTimeout(timeoutId);
        setSelectedShipmentDetail(baseShipment);
      }
    } catch {
      clearTimeout(timeoutId);
      setSelectedShipmentDetail(baseShipment);
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  const handleTrackShipment = (shipment: Shipment | number) => {
    const id = typeof shipment === 'number' ? shipment : shipment.id;
    // Gönderi takip sayfasına yönlendir
    navigate(`/corporate/live-tracking?shipmentId=${id}`);
  };

  const handleMessage = (shipment: Shipment) => {
    const carrierId = shipment.carrierId ? String(shipment.carrierId) : '';
    const prefill = `Merhaba, ödeme ve yükleme planını netleştirelim. İş No: ${shipment.trackingCode}`;
    if (!carrierId) {
      navigate('/corporate/messages');
      return;
    }
    const params = new URLSearchParams();
    params.set('userId', carrierId);
    params.set('prefill', prefill);
    navigate(`/corporate/messages?${params.toString()}`);
  };

  const handleCancelClick = (shipment: Shipment) => {
    setSelectedShipmentForCancel(shipment);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const handleConfirmDelivery = async (shipment: Shipment) => {
    const status = normalizeShipmentStatus(shipment.status);
    if (status !== 'delivered' && status !== 'completed') {
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
        // Reload shipments
        const userRaw = localStorage.getItem('user');
        const userId = userRaw ? JSON.parse(userRaw || '{}').id : undefined;
        const loadResponse = await fetch(createApiUrl('/api/shipments'), {
          headers: {
            Authorization: `Bearer ${token || ''}`,
            'X-User-Id': userId || '',
            'Content-Type': 'application/json',
          },
        });
        if (loadResponse.ok) {
          const loadData = await loadResponse.json();
          type ReloadBackendShipment = {
            id: number | string;
            title?: string;
            pickupCity?: string;
            deliveryCity?: string;
            trackingCode?: string;
            status?: string;
            createdAt?: string;
            createdat?: string;
            estimatedDelivery?: string;
            estimateddelivery?: string;
            actualDelivery?: string;
            actualdelivery?: string;
            price?: number | string;
            carrierName?: string;
            carrierId?: number | string;
            carrierid?: number | string;
            rating?: number;
            weight?: number;
            volume?: number;
            notes?: string;
            specialRequirements?: string | string[];
            category?: string;
            subCategory?: string;
            subcategory?: string;
          };

          const rows: ReloadBackendShipment[] = (loadData.data ||
            loadData.shipments ||
            []) as ReloadBackendShipment[];

          const mapped: Shipment[] =
            rows.map((row: ReloadBackendShipment) => {
              const rowCategoryData = (row as any).categoryData || (row as any).category_data || {};
              const { from, to } = buildRoute(row as any);
              const rawTracking =
                (row as any).trackingNumber ||
                (row as any).tracking_number ||
                (row as any).trackingnumber ||
                (row as any).trackingCode ||
                (row as any).tracking_code ||
                (row as any).trackingcode ||
                (row as any).shipmentCode ||
                (row as any).shipment_code ||
                (row as any).shipmentcode ||
                undefined;
              return ({
              id: typeof row.id === 'number' ? row.id : parseInt(String(row.id), 10),
              trackingCode: toTrackingCode(rawTracking, row.id),
              title: row.title || '',
              from,
              to,
              status: normalizeShipmentStatus(row.status),
              unitType: rowCategoryData.unitType || (row as any).unitType,
              temperatureSetpoint:
                rowCategoryData.temperatureSetpoint ||
                rowCategoryData.temperature_setpoint ||
                (row as any).temperatureSetpoint ||
                (row as any).temperature_setpoint ||
                undefined,
              unNumber: rowCategoryData.unNumber || rowCategoryData.un_number || (row as any).unNumber || (row as any).un_number,
              loadingEquipment:
                rowCategoryData.loadingEquipment ||
                rowCategoryData.loading_equipment ||
                (row as any).loadingEquipment ||
                (row as any).loading_equipment ||
                undefined,
              createdAt: row.createdAt || row.createdat || '',
              estimatedDelivery:
                row.estimatedDelivery || row.estimateddelivery || '',
              actualDelivery: row.actualDelivery || row.actualdelivery || '',
              carrier: row.carrierName || '',
              carrierId: row.carrierId
                ? Number(row.carrierId)
                : row.carrierid
                  ? Number(row.carrierid)
                  : undefined,
              rating: row.rating || 0,
              value: `₺${toNumber(row.price, 0).toLocaleString()}`,
              weight: row.weight || 0,
              volume: row.volume || 0,
              statusText: formatStatusText(row.status),
              progress:
                normalizeShipmentStatus(row.status) === 'completed' || normalizeShipmentStatus(row.status) === 'delivered'
                  ? 100
                  : normalizeShipmentStatus(row.status) === 'accepted' || normalizeShipmentStatus(row.status) === 'offer_accepted'
                    ? 60
                    : 10,
              notes: row.notes || '',
              specialRequirements: row.specialRequirements
                ? Array.isArray(row.specialRequirements)
                  ? row.specialRequirements
                  : String(row.specialRequirements)
                      .split(',')
                      .map((s: string) => s.trim())
                : [],
              category: row.category || '',
              subCategory: row.subCategory || row.subcategory || '',
              statusColor:
                normalizeShipmentStatus(row.status) === 'completed' || normalizeShipmentStatus(row.status) === 'delivered'
                  ? 'bg-green-500'
                  : normalizeShipmentStatus(row.status) === 'accepted' || normalizeShipmentStatus(row.status) === 'offer_accepted'
                    ? 'bg-blue-500'
                    : 'bg-yellow-500',
            });
            }) || [];
          setShipments(mapped);
        }
        showProfessionalToast(showToast, 'DELIVERY_CONFIRMED', 'success');
      } else {
        const errorData = await response.json();
        showProfessionalToast(showToast, 'OPERATION_FAILED', 'error');
      }
    } catch (error) {
      // Error confirming delivery
      showProfessionalToast(showToast, 'NETWORK_ERROR', 'error');    }
  };

  const handleCancelShipment = async () => {
    if (!selectedShipmentForCancel || !cancelReason.trim()) {
      return;
    }

    try {
      setIsCancelling(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        createApiUrl(`/api/shipments/${selectedShipmentForCancel.id}/cancel`),
        {
          method: 'PUT',
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
        setSelectedShipmentForCancel(null);

        showProfessionalToast(showToast, 'ACTION_COMPLETED', 'success');        
        // Reload shipments
        await loadShipments();
      } else {
        const errorData = await response.json();
        showProfessionalToast(showToast, 'OPERATION_FAILED', 'error');
      }
    } catch (error) {
      showProfessionalToast(showToast, 'NETWORK_ERROR', 'error');    } finally {
      setIsCancelling(false);
    }
  };

  const canCancelShipment = (status: string) => {
    const cancellableStatuses = ['pending', 'waiting', 'preparing', 'offer_accepted', 'active', 'draft', 'waiting_for_offers'];
    const mappedStatus = normalizeShipmentStatus(status).toLowerCase();
    return cancellableStatuses.includes(mappedStatus);
  };

  // Gerçek API'den gönderileri yükle
  const [isLoadingShipments, setIsLoadingShipments] = useState(true);

  const loadShipments = async () => {
    try {
      setIsLoadingShipments(true);
      const userRaw = localStorage.getItem('user');
      const userId = userRaw ? JSON.parse(userRaw || '{}').id : undefined;
      const token = localStorage.getItem('authToken');
      const response = await fetch(createApiUrl('/api/shipments'), {
        headers: {
          Authorization: `Bearer ${token || ''}`,
          'X-User-Id': userId || '',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Gönderiler yüklenemedi');
      }

      const data = await response.json();

      type BackendShipment = {
        id: number;
        title?: string;
        pickupCity?: string;
        pickup_city?: string;
        pickupAddress?: string;
        pickup_address?: string;
        deliveryCity?: string;
        delivery_city?: string;
        deliveryAddress?: string;
        delivery_address?: string;
        status?: string;
        unitType?: string;
        temperatureSetpoint?: string;
        temperature_setpoint?: string;
        unNumber?: string;
        un_number?: string;
        loadingEquipment?: string;
        loading_equipment?: string;
        categoryData?: any;
        category_data?: any;
        carrierName?: string;
        carrierId?: number;
        carrier_id?: number;
        rating?: number;
        price?: number | string;
        weight?: number;
        volume?: number;
        deliveryDate?: string;
        createdAt?: string;
        created_at?: string;
        notes?: string;
        specialRequirements?: string | string[];
        cargoType?: string;
        cargoSubType?: string;
        subCategory?: string;
        trackingCode?: string;
      };
      const rows = (
        Array.isArray(data) ? data : data.data || data.shipments || data.rows || []
      ) as BackendShipment[];

      // Remove duplicates based on id
      const uniqueRows = rows.filter(
        (row, index, self) => index === self.findIndex(r => r.id === row.id)
      );

      const mapped: Shipment[] = uniqueRows.map((row: BackendShipment) => {
        const rowCategoryData = row.categoryData || row.category_data || {};
        const { from, to } = buildRoute(row as any);
        const rawTracking =
          (row as any).trackingNumber ||
          (row as any).tracking_number ||
          (row as any).trackingnumber ||
          (row as any).trackingCode ||
          (row as any).tracking_code ||
          (row as any).trackingcode ||
          (row as any).shipmentCode ||
          (row as any).shipment_code ||
          (row as any).shipmentcode ||
          undefined;
        return {
          id: row.id,
          title: row.title || `${row.pickupCity || ''} → ${row.deliveryCity || ''}`,
          trackingCode: toTrackingCode(rawTracking, row.id),
          from,
          to,
          status: normalizeShipmentStatus(row.status),
          unitType: rowCategoryData.unitType || row.unitType,
          temperatureSetpoint:
            rowCategoryData.temperatureSetpoint ||
            rowCategoryData.temperature_setpoint ||
            row.temperatureSetpoint ||
            row.temperature_setpoint ||
            undefined,
          unNumber:
            rowCategoryData.unNumber ||
            rowCategoryData.un_number ||
            row.unNumber ||
            row.un_number,
          loadingEquipment:
            rowCategoryData.loadingEquipment ||
            rowCategoryData.loading_equipment ||
            row.loadingEquipment ||
            row.loading_equipment ||
            undefined,
          carrier: row.carrierName || '',
          carrierId: row.carrierId || row.carrier_id || undefined,
          rating: row.rating || 0,
          value: `₺${toNumber(row.price, 0).toLocaleString()}`,
          weight: row.weight || 0,
          volume: row.volume || 0,
          estimatedDelivery: row.deliveryDate || '-',
          statusText: formatStatusText(row.status),
          progress:
            normalizeShipmentStatus(row.status) === 'completed' ||
            normalizeShipmentStatus(row.status) === 'delivered'
              ? 100
              : normalizeShipmentStatus(row.status) === 'accepted' ||
                  normalizeShipmentStatus(row.status) === 'offer_accepted'
                ? 60
                : 10,
          notes: row.notes || '',
          specialRequirements: row.specialRequirements
            ? Array.isArray(row.specialRequirements)
              ? row.specialRequirements
              : String(row.specialRequirements)
                  .split(',')
                  .map((s: string) => s.trim())
                  .filter(Boolean)
            : [],
          // Bireysel paneldeki gibi okunabilir tarih & kategori
          createdAt: row.createdAt || row.created_at || '',
          category:
            row.cargoType ||
            (row as unknown as { category?: string }).category ||
            row.title ||
            '-',
          subCategory: row.cargoSubType || row.subCategory || '-',
          statusColor:
            normalizeShipmentStatus(row.status) === 'completed' ||
            normalizeShipmentStatus(row.status) === 'delivered'
              ? 'bg-green-500'
              : normalizeShipmentStatus(row.status) === 'accepted' ||
                  normalizeShipmentStatus(row.status) === 'offer_accepted'
                ? 'bg-blue-500'
                : 'bg-yellow-500',
        };
      });

      setShipments(mapped);
    } catch (error) {
      logger.error('Gönderiler yüklenirken hata:', error);
      setShipments([]);
    } finally {
      setIsLoadingShipments(false);
    }
  };

  useEffect(() => {
    loadShipments();
  }, []);

  useEffect(() => {
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        loadShipments();
      }
    };

    const handleGlobalRefresh = () => {
      loadShipments();
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('yolnext:refresh-badges', handleGlobalRefresh);

    return () => {
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('yolnext:refresh-badges', handleGlobalRefresh);
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchTerm, sortBy]);

  const filteredShipments = shipments.filter(shipment => {
    const matchesSearch =
      shipment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.trackingCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.to.toLowerCase().includes(searchTerm.toLowerCase());

    const st = normalizeShipmentStatus(shipment.status).toLowerCase();
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && ['waiting_for_offers', 'waiting', 'pending', 'preparing', 'offer_accepted', 'accepted', 'in_progress', 'in_transit'].includes(st)) ||
      (filterStatus === 'completed' && ['delivered', 'completed'].includes(st)) ||
      (filterStatus === 'pending' && ['waiting_for_offers', 'waiting', 'pending', 'preparing'].includes(st));

    return matchesSearch && matchesStatus;
  });

  const sortedShipments = filteredShipments
    .slice()
    .sort((a: Shipment, b: Shipment) => {
      const getTime = (v: any) => {
        const t = new Date(v || 0).getTime();
        return Number.isFinite(t) ? t : 0;
      };

      const statusRank = (s: Shipment) => {
        const v = normalizeShipmentStatus(s.status).toLowerCase();
        if (['waiting_for_offers', 'waiting', 'pending', 'preparing'].includes(v)) return 1;
        if (v === 'offer_accepted' || v === 'accepted') return 2;
        if (v === 'in_progress' || v === 'in_transit') return 3;
        if (v === 'delivered' || v === 'completed') return 4;
        if (v === 'cancelled') return 5;
        return 9;
      };

      const isUrgent = (s: Shipment) =>
        (s.specialRequirements || []).some(
          r => String(r || '').trim().toLowerCase() === 'urgent'
        );

      if (sortBy === 'status') {
        const d = statusRank(a) - statusRank(b);
        if (d !== 0) return d;
        return getTime(b.createdAt) - getTime(a.createdAt);
      }

      if (sortBy === 'value') {
        const d = toNumber(b.value, 0) - toNumber(a.value, 0);
        if (d !== 0) return d;
        return getTime(b.createdAt) - getTime(a.createdAt);
      }

      if (sortBy === 'priority') {
        const ua = isUrgent(a) ? 0 : 1;
        const ub = isUrgent(b) ? 0 : 1;
        if (ua !== ub) return ua - ub;
        const d = statusRank(a) - statusRank(b);
        if (d !== 0) return d;
        return getTime(b.createdAt) - getTime(a.createdAt);
      }

      // date (default)
      return getTime(b.createdAt) - getTime(a.createdAt);
    });

  // Pagination logic
  const totalPages = Math.ceil(sortedShipments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedShipments = sortedShipments.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const breadcrumbItems = [
    { label: 'Gönderilerim', icon: <Package className='w-4 h-4' /> },
  ];

  const getStatusIcon = (status: string) => {
    const s = formatStatusText(status);
    switch (s) {
      case 'Yolda':
        return <Truck className='w-4 h-4' />;
      case 'Yükleme':
        return <Package className='w-4 h-4' />;
      case 'Teslim Edildi':
        return <CheckCircle className='w-4 h-4' />;
      case 'Beklemede':
        return <Clock className='w-4 h-4' />;
      default:
        return <AlertCircle className='w-4 h-4' />;
    }
  };

  const getStatusStyle = (status: string) => {
    const normalized = normalizeShipmentStatus(status);
    return getStatusInfo(normalized).color;
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50'>
      <div className='max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6'>
        {/* Breadcrumb */}
        <div className='mb-4 sm:mb-6'>
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Header - Mobile Optimized */}
        <CorporateShipmentsHeader />

        <div className='mb-6'>
          <GuidanceOverlay
            storageKey='corporate.shipments'
            isEmpty={!isLoadingShipments && shipments.length === 0}
            icon={Package}
            title='Gönderi Yönetimi'
            description='Yeni gönderi oluşturup teklif toplayabilir, kabul edilen tekliflerin sürecini buradan takip edebilirsiniz. Düzenli çalıştığınız nakliyecileri "Nakliyeciler" sayfasından yönetebilirsiniz.'
            primaryAction={{
              label: 'Gönderi Oluştur',
              to: '/corporate/create-shipment',
            }}
            secondaryAction={{
              label: 'Nakliyeciler',
              to: '/corporate/carriers',
            }}
          />
        </div>

        {/* Filters Card - Mobile Optimized */}
        <CorporateShipmentsFilters
          searchTerm={searchTerm}
          filterStatus={filterStatus}
          sortBy={sortBy}
          onSearchChange={setSearchTerm}
          onStatusFilterChange={setFilterStatus}
          onSortByChange={(value: string) => setSortBy(value as 'date' | 'price' | 'status' | 'value' | 'priority')}
          onReset={() => {
            setSearchTerm('');
            setFilterStatus('all');
            setSortBy('date' as 'date' | 'price' | 'status' | 'value' | 'priority');
            setCurrentPage(1);
          }}
        />

        {/* Shipments Table - Mobile Optimized */}
        <div className='bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 shadow-xl border border-slate-200'>
          {/* Desktop Table */}
          <div className='hidden lg:block overflow-x-auto'>
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
                {isLoadingShipments ? (
                  <tr>
                    <td colSpan={6} className='py-8'>
                      <LoadingState message='Gönderiler yükleniyor...' />
                    </td>
                  </tr>
                ) : paginatedShipments.length > 0 ? (
                  paginatedShipments.map((shipment, index) => (
                    <CorporateShipmentsTableRow
                      key={shipment.id}
                      shipment={shipment}
                      acceptedShipmentId={acceptedShipmentId ? String(acceptedShipmentId) : undefined}
                      onViewDetails={(shipmentId: number) => {
                        const shipment = shipments.find(s => s.id === shipmentId);
                        if (shipment) handleViewDetails(shipment);
                      }}
                      onTrack={handleTrackShipment}
                      onMessage={(shipment: any) => handleMessage(shipment as Shipment)}
                      onConfirmDelivery={(shipment: any) => handleConfirmDelivery(shipment as Shipment)}
                      onRateCarrier={(shipment) => {
                        setSelectedCarrier({
                          id: shipment.carrierId?.toString() || '',
                          name: shipment.carrier || 'Nakliyeci',
                          email: '',
                          type: 'nakliyeci',
                        });
                        setSelectedShipmentId(shipment.id);
                        setShowRatingModal(true);
                      }}
                      onCancel={(shipment: any) => handleCancelClick(shipment as Shipment)}
                      isMessagingEnabled={isMessagingEnabledForStatus}
                      canCancel={canCancelShipment}
                      normalizeStatus={normalizeShipmentStatus}
                      getStatusIcon={getStatusIcon}
                      getStatusStyle={getStatusStyle}
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className='p-0'>
                      <div className='min-h-[50vh] flex items-center justify-center px-4 py-12'>
                        <div className='bg-white rounded-2xl shadow-xl border border-slate-200 p-10 text-center w-full max-w-2xl'>
                          <EmptyState
                            icon={Package}
                            title='Henüz Gönderin Yok'
                            description='İlk gönderinizi oluşturun, nakliyecilerden teklif alın'
                            action={{
                              label: 'Yeni Gönderi Oluştur',
                              onClick: () => navigate('/corporate/create-shipment'),
                            }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className='lg:hidden space-y-4'>
            {isLoadingShipments ? (
              <LoadingState message='Gönderiler yükleniyor...' />
            ) : paginatedShipments.length > 0 ? (
              paginatedShipments.map((shipment, index) => (
                <CorporateShipmentsCard
                  key={`${shipment.id}-${shipment.trackingCode}-${index}`}
                  shipment={shipment}
                  index={index}
                  onViewDetails={(shipmentId: number) => {
                    const shipment = shipments.find(s => s.id === shipmentId);
                    if (shipment) handleViewDetails(shipment);
                  }}
                  onTrack={(shipmentId: number) => handleTrackShipment(shipmentId)}
                  onMessage={(shipment: any) => handleMessage(shipment as Shipment)}
                  isMessagingEnabled={isMessagingEnabledForStatus}
                  getStatusStyle={getStatusStyle}
                  onShowTracking={(shipment: any) => {
                    setSelectedShipmentForTracking(shipment as Shipment);
                    setShowTrackingModal(true);
                  }}
                />
              ))
            ) : (
              <div className='py-12'>
                <EmptyState
                  icon={Package}
                  title='📦 Henüz gönderin yok'
                  description='İlk gönderinizi oluşturun, nakliyecilerden teklif alın'
                  action={{
                    label: 'Yeni Gönderi Oluştur',
                    onClick: () => navigate('/corporate/create-shipment'),
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className='mt-8'>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}

        {/* Takip Modal */}
        {showTrackingModal && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
            <div className='bg-white rounded-2xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto'>
              <div className='flex items-center justify-between mb-6'>
                <h2 className='text-2xl font-bold text-gray-900'>
                  Gönderi Takibi
                </h2>
                <button
                  onClick={() => setShowTrackingModal(false)}
                  className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
                >
                  <X className='w-6 h-6' />
                </button>
              </div>

              {selectedShipmentForTracking && (
                <>
                  {/* Gönderi Bilgileri */}
                  <div className='bg-gray-50 rounded-lg p-6 mb-6'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <h3 className='text-xl font-bold text-gray-900'>
                          {
                            shipments.find(
                              s => s.id === selectedShipmentForTracking?.id
                            )?.title
                          }
                        </h3>
                        <p className='text-gray-600'>
                          Takip Kodu:{' '}
                          {
                            shipments.find(
                              s => s.id === selectedShipmentForTracking?.id
                            )?.trackingCode
                          }
                        </p>
                        <div className='flex items-center gap-4 mt-2'>
                          <div className='flex items-center gap-1'>
                            <MapPin className='w-4 h-4 text-blue-500' />
                            <span className='text-sm text-gray-600'>
                              {
                                shipments.find(
                                  s => s.id === selectedShipmentForTracking?.id
                                )?.from
                              }{' '}
                              →{' '}
                              {
                                shipments.find(
                                  s => s.id === selectedShipmentForTracking?.id
                                )?.to
                              }
                            </span>
                          </div>
                          <div className='flex items-center gap-1'>
                            <Clock className='w-4 h-4 text-orange-500' />
                            <span className='text-sm text-gray-600'>
                              {
                                shipments.find(
                                  s => s.id === selectedShipmentForTracking?.id
                                )?.estimatedDelivery
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className='text-right'>
                        <div
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            shipments.find(
                              s => s.id === selectedShipmentForTracking?.id
                            )?.statusColor === 'bg-green-500'
                              ? 'bg-green-100 text-green-800'
                              : shipments.find(
                                    s => s.id === selectedShipmentForTracking?.id
                                  )?.statusColor === 'bg-orange-500'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {
                            shipments.find(
                              s => s.id === selectedShipmentForTracking?.id
                            )?.statusText
                          }
                        </div>
                        <div className='text-sm text-gray-500 mt-1'>
                          %
                          {
                            shipments.find(
                              s => s.id === selectedShipmentForTracking?.id
                            )?.progress
                          }{' '}
                          tamamlandı
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Takip Geçmişi */}
                  <div className='space-y-4'>
                    <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                      Takip Geçmişi
                    </h3>

                    {/* Takip Geçmişi - API'den gelecek */}
                    {[].map((event: { id: string; status: string; title: string; description: string; timestamp: string; location: string }) => (
                      <div
                        key={event.id}
                        className='flex items-start space-x-3'
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            event.status === 'completed'
                              ? 'bg-green-100 text-green-600'
                              : event.status === 'in-progress'
                                ? 'bg-blue-100 text-blue-600'
                                : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {event.status === 'completed' ? (
                            <CheckCircle className='w-4 h-4' />
                          ) : event.status === 'in-progress' ? (
                            <Clock className='w-4 h-4' />
                          ) : (
                            <Package className='w-4 h-4' />
                          )}
                        </div>
                        <div className='flex-1'>
                          <h4 className='text-sm font-medium text-gray-900'>
                            {event.title}
                          </h4>
                          <p className='text-sm text-gray-600'>
                            {event.description}
                          </p>
                          <p className='text-xs text-gray-500 mt-1'>
                            {event.timestamp} - {event.location}
                          </p>
                        </div>
                      </div>
                    )) || (
                      <div className='text-center py-8 text-gray-500'>
                        Takip geçmişi bulunamadı
                      </div>
                    )}
                  </div>

                  {/* Canlı Takip */}
                  <div className='mt-8 bg-blue-50 rounded-lg p-6'>
                    <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                      Canlı Takip
                    </h3>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                      <div className='bg-white rounded-lg p-4 border border-blue-200'>
                        <div className='flex items-center gap-2 mb-2'>
                          <Navigation className='w-5 h-5 text-blue-600' />
                          <span className='font-semibold text-gray-900'>
                            Mevcut Konum
                          </span>
                        </div>
                        <p className='text-sm text-gray-600'>
                          Ankara Çevre Yolu
                        </p>
                        <p className='text-xs text-gray-500'>
                          Son güncelleme: 2 dakika önce
                        </p>
                      </div>
                      <div className='bg-white rounded-lg p-4 border border-blue-200'>
                        <div className='flex items-center gap-2 mb-2'>
                          <Clock className='w-5 h-5 text-orange-600' />
                          <span className='font-semibold text-gray-900'>
                            Tahmini Varış
                          </span>
                        </div>
                        <p className='text-sm text-gray-600'>09:30 - 10:00</p>
                        <p className='text-xs text-gray-500'>Bugün</p>
                      </div>
                      <div className='bg-white rounded-lg p-4 border border-blue-200'>
                        <div className='flex items-center gap-2 mb-2'>
                          <Truck className='w-5 h-5 text-green-600' />
                          <span className='font-semibold text-gray-900'>
                            Araç Bilgisi
                          </span>
                        </div>
                        <p className='text-sm text-gray-600'>
                          {selectedShipmentDetail?.vehiclePlate || '-'}
                        </p>
                        <p className='text-xs text-gray-500'>
                          {selectedShipmentDetail?.vehicleType || '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Gönderi Detay Modalı */}
        {showDetailsModal && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
            <div className='bg-white rounded-xl p-6 max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl'>
              <div className='flex items-center justify-between mb-6 border-b border-gray-200 pb-4'>
                <div>
                  <h2 className='text-2xl font-bold text-gray-900'>
                    Gönderi Detayları
                  </h2>
                  <p className='text-gray-600 mt-1 text-sm'>
                    {(() => {
                      const s = selectedShipmentForDetails ? shipments.find(sh => sh.id === selectedShipmentForDetails.id) : null;
                      return s ? (
                        <>
                          Takip Kodu:{' '}
                          <span className='font-mono font-semibold'>
                            {s.trackingCode}
                          </span>
                        </>
                      ) : (
                        'Kurumsal gönderi bilgileri ve takip detayları'
                      );
                    })()}
                  </p>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
                >
                  <X className='w-6 h-6 text-gray-500' />
                </button>
              </div>

              {(() => {
                const shipment =
                  selectedShipmentDetail ||
                  (selectedShipmentForDetails ? shipments.find(s => s.id === selectedShipmentForDetails.id) : null);
                if (!shipment) return null;

                return (
                  <div className='space-y-6'>
                    {/* HEADER - bireysel detay kartı ile aynı yapı */}
                    <div className='p-6 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-blue-50 -mx-6 -mt-2 mb-2'>
                      <div className='flex justify-between items-start'>
                        <div>
                          <h2 className='text-2xl font-bold text-gray-900 mb-1'>
                            Gönderi Detayları
                          </h2>
                          <p className='text-gray-600 text-sm'>
                            Takip Kodu:{' '}
                            <span className='font-mono font-semibold'>
                              {shipment.trackingCode}
                            </span>
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(shipment.status)}`}
                        >
                          {getStatusIcon(shipment.status)}
                          {acceptedShipmentId === shipment.id || (acceptedShipmentId && shipment.trackingCode && String(acceptedShipmentId) === shipment.trackingCode.replace('YOL', ''))
                            ? 'Kabul Edildi'
                            : shipment.statusText}
                        </span>
                      </div>
                    </div>

                    {(() => {
                      const s = normalizeShipmentStatus(shipment.status);
                      const enabled =
                        s === 'offer_accepted' ||
                        s === 'accepted' ||
                        s === 'in_progress' ||
                        s === 'assigned' ||
                        s === 'in_transit' ||
                        s === 'delivered' ||
                        s === 'completed';
                      if (!enabled) return null;

                      return (
                        <div className='bg-white rounded-lg border border-slate-200 p-5 shadow-sm'>
                          <div className='flex items-start justify-between gap-4'>
                            <div>
                              <div className='flex items-center gap-2'>
                                <AlertCircle className='w-4 h-4 text-slate-700' />
                                <h3 className='text-sm font-semibold text-slate-900'>Sıradaki Adım</h3>
                              </div>
                              <p className='mt-2 text-sm text-slate-700'>
                                Ödeme (IBAN/açıklama) ve yükleme saatini yazılı olarak teyitleyin.
                              </p>
                            </div>
                            <div className='flex items-center gap-2 flex-shrink-0'>
                              <button
                                onClick={() => handleMessage(shipment)}
                                disabled={!shipment.carrierId || !isMessagingEnabledForStatus(shipment.status)}
                                className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                                  shipment.carrierId && isMessagingEnabledForStatus(shipment.status)
                                    ? 'bg-slate-900 hover:bg-slate-800 text-white'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                              >
                                Mesajı Aç
                              </button>
                              <button
                                onClick={() => handleTrackShipment(shipment.id)}
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
                      );
                    })()}

                    {/* GÖNDERİ BİLGİLERİ - bireysel tasarıma yakın */}
                    <div className='bg-gray-50 rounded-lg p-5 border border-gray-200'>
                      <div className='flex items-center gap-2 mb-4'>
                        <Package className='w-5 h-5 text-blue-600' />
                        <h3 className='text-lg font-semibold text-gray-900'>
                          Gönderi Bilgileri
                        </h3>
                      </div>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div>
                          <label className='text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block'>
                            Başlık
                          </label>
                          <p className='text-gray-900 font-medium'>
                            {shipment.title}
                          </p>
                        </div>
                        <div>
                          <label className='text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block flex items-center gap-1'>
                            <DollarSign className='w-3 h-3' />
                            Fiyat
                          </label>
                          <p className='text-gray-900 font-semibold text-lg'>
                            {shipment.value}
                          </p>
                        </div>
                        <div>
                          <label className='text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block flex items-center gap-1'>
                            <MapPin className='w-3 h-3' />
                            Rota
                          </label>
                          <p className='text-gray-900 font-medium'>
                            {shipment.from} → {shipment.to}
                          </p>
                        </div>
                        <div>
                          <label className='text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block flex items-center gap-1'>
                            <Calendar className='w-3 h-3' />
                            Oluşturulma
                          </label>
                          <p className='text-gray-900'>
                            {formatDate(shipment.createdAt)}
                          </p>
                        </div>
                        <div>
                          <label className='text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block flex items-center gap-1'>
                            <Clock className='w-3 h-3' />
                            Tahmini Teslimat
                          </label>
                          <p className='text-gray-900'>
                            {shipment.estimatedDelivery}
                          </p>
                        </div>
                        <div>
                          <label className='text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block'>
                            Kategori
                          </label>
                          <p className='text-gray-900'>
                            {shipment.category}
                            {shipment.subCategory
                              ? ` / ${shipment.subCategory}`
                              : ''}
                          </p>
                        </div>
                        <div>
                          <label className='text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block'>
                            Ağırlık
                          </label>
                          <p className='text-gray-900'>{shipment.weight}</p>
                        </div>
                        {shipment.unitType && (
                          <div>
                            <label className='text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block'>
                              Birim Tipi
                            </label>
                            <p className='text-gray-900'>{shipment.unitType}</p>
                          </div>
                        )}
                        {shipment.unNumber && (
                          <div>
                            <label className='text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block'>
                              UN Numarası
                            </label>
                            <p className='text-gray-900'>{shipment.unNumber}</p>
                          </div>
                        )}
                        {shipment.temperatureSetpoint && (
                          <div>
                            <label className='text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block'>
                              Sıcaklık Setpoint
                            </label>
                            <p className='text-gray-900'>{shipment.temperatureSetpoint}</p>
                          </div>
                        )}
                        {shipment.loadingEquipment && (
                          <div>
                            <label className='text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block'>
                              Yükleme Ekipmanı
                            </label>
                            <p className='text-gray-900'>{shipment.loadingEquipment}</p>
                          </div>
                        )}
                        <div>
                          <label className='text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block'>
                            Hacim
                          </label>
                          <p className='text-gray-900'>{shipment.volume}</p>
                        </div>
                      </div>
                    </div>

                    {/* Teslimat Onayı Bilgisi */}
                    {normalizeShipmentStatus(shipment.status) === 'delivered' && (
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
                    {(normalizeShipmentStatus(shipment.status) === 'offer_accepted' || normalizeShipmentStatus(shipment.status) === 'accepted' || normalizeShipmentStatus(shipment.status) === 'in_progress' || normalizeShipmentStatus(shipment.status) === 'picked_up' || normalizeShipmentStatus(shipment.status) === 'in_transit') && shipment.carrierId && (
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
                    {(normalizeShipmentStatus(shipment.status) === 'picked_up' || normalizeShipmentStatus(shipment.status) === 'in_transit') && (
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

                    {/* NAKLİYECİ BİLGİLERİ - bireysel tasarıma benzer */}
                    {shipment.carrier && (
                      <div className='bg-blue-50 rounded-lg p-5 border border-blue-200'>
                        <div className='flex items-center gap-2 mb-4'>
                          <Building2 className='w-5 h-5 text-blue-600' />
                          <h3 className='text-lg font-semibold text-gray-900'>
                            Nakliyeci Bilgileri
                          </h3>
                        </div>
                        <div className='flex items-center gap-4'>
                          <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center'>
                            <Truck className='w-6 h-6 text-blue-600' />
                          </div>
                          <div className='flex-1 space-y-2'>
                            <div>
                              <label className='text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block'>
                                Firma
                              </label>
                              <p className='text-gray-900 font-semibold'>
                                {shipment.carrier}
                              </p>
                            </div>
                            <div className='flex items-center gap-4'>
                              <div className='flex items-center gap-1'>
                                <Star className='w-4 h-4 text-yellow-500' />
                                <span className='text-sm font-medium text-gray-700'>
                                  {shipment.rating}/5 Puan
                                </span>
                              </div>
                              <div className='flex items-center gap-1'>
                                <CheckCircle className='w-4 h-4 text-green-500' />
                                <span className='text-sm text-gray-600'>
                                  Güvenilir Nakliyeci
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Özel Gereksinimler ve Notlar - yapıyı bireysel ile hizala */}
                    <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                      {shipment.specialRequirements &&
                        shipment.specialRequirements.length > 0 && (
                          <div className='bg-white border border-gray-200 rounded-lg p-5'>
                            <div className='flex items-center gap-2 mb-4'>
                              <AlertCircle className='w-5 h-5 text-orange-600' />
                              <h3 className='text-lg font-semibold text-gray-900'>
                                Özel Gereksinimler
                              </h3>
                            </div>
                            <div className='flex flex-wrap gap-2'>
                              {shipment.specialRequirements.map(
                                (req, index) => (
                                  <span
                                    key={index}
                                    className='px-3 py-2 bg-orange-100 text-orange-800 rounded-lg text-sm font-medium border border-orange-200'
                                  >
                                    {formatSpecialRequirement(req)}
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        )}

                      {shipment.notes && (
                        <div className='bg-white border border-gray-200 rounded-lg p-5'>
                          <div className='flex items-center gap-2 mb-4'>
                            <FileText className='w-5 h-5 text-gray-600' />
                            <h3 className='text-lg font-semibold text-gray-900'>
                              Özel Notlar
                            </h3>
                          </div>
                          <div className='bg-gray-50 rounded-lg p-4'>
                            <p className='text-gray-700 leading-relaxed'>
                              {shipment.notes}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Rating Modal */}
        {showRatingModal && selectedCarrier && user && (
          <RatingModal
            isOpen={showRatingModal}
            onClose={() => {
              setShowRatingModal(false);
              setSelectedCarrier(null);
              setSelectedShipmentId(null);
              // Reload shipments to show updated rating
              const loadShipments = async () => {
                try {
                  setIsLoadingShipments(true);
                  const userRaw = localStorage.getItem('user');
                  const userId = userRaw ? JSON.parse(userRaw || '{}').id : undefined;
                  const token = localStorage.getItem('authToken');
                  const response = await fetch(createApiUrl('/api/shipments'), {
                    headers: {
                      Authorization: `Bearer ${token || ''}`,
                      'X-User-Id': userId || '',
                      'Content-Type': 'application/json',
                    },
                  });

                  if (!response.ok) {
                    throw new Error('Gönderiler yüklenemedi');
                  }

                  const data = await response.json();
                  const rows = data.shipments || data.data || [];
                  const mapped = rows.map((row: any) => ({
                    id: row.id,
                    title: row.title || 'Gönderi',
                    trackingCode: toTrackingCode(
                      row.trackingNumber ||
                        row.tracking_number ||
                        row.trackingnumber ||
                        row.trackingCode ||
                        row.tracking_code ||
                        row.trackingcode ||
                        row.shipmentCode ||
                        row.shipment_code ||
                        row.shipmentcode,
                      row.id
                    ),
                    from: row.pickupCity || row.from || 'Bilinmeyen',
                    to: row.deliveryCity || row.to || 'Bilinmeyen',
                    status: normalizeShipmentStatus(row.status),
                    carrier: row.carrierName || '',
                    carrierId: row.carrierId || row.carrierid,
                    rating: row.rating || 0,
                    value: `₺${toNumber(row.price, 0).toLocaleString()}`,
                    weight: row.weight || 0,
                    volume: row.volume || 0,
                    estimatedDelivery: row.estimatedDelivery || row.estimateddelivery || '',
                    statusText: formatStatusText(row.status),
                    progress:
                      normalizeShipmentStatus(row.status) === 'completed' || normalizeShipmentStatus(row.status) === 'delivered'
                        ? 100
                        : normalizeShipmentStatus(row.status) === 'accepted' || normalizeShipmentStatus(row.status) === 'offer_accepted'
                          ? 60
                          : 10,
                    notes: row.notes || '',
                    specialRequirements: row.specialRequirements
                      ? Array.isArray(row.specialRequirements)
                        ? row.specialRequirements
                        : String(row.specialRequirements)
                            .split(',')
                            .map((s: string) => s.trim())
                      : [],
                    createdAt: row.createdAt || row.createdat || '',
                    category: row.category || '',
                    subCategory: row.subCategory || row.subcategory || '',
                    statusColor:
                      normalizeShipmentStatus(row.status) === 'completed' || normalizeShipmentStatus(row.status) === 'delivered'
                        ? 'bg-green-500'
                        : normalizeShipmentStatus(row.status) === 'accepted' || normalizeShipmentStatus(row.status) === 'offer_accepted'
                          ? 'bg-blue-500'
                          : 'bg-yellow-500',
                  }));
                  setShipments(mapped);
                } catch (error) {
                  // Error loading shipments
                  setShipments([]);
                } finally {
                  setIsLoadingShipments(false);
                }
              };
              loadShipments();
            }}
            ratedUser={selectedCarrier}
            currentUser={{
              id: user.id || '',
              name: user.fullName || 'Kullanıcı',
            }}
          shipmentId={selectedShipmentId ? String(selectedShipmentId) : undefined}
        />
        )}

        {/* Cancel Modal */}
        {showCancelModal && selectedShipmentForCancel && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
            <div className='bg-white rounded-xl shadow-2xl w-full max-w-md'>
              <div className='p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <h2 className='text-xl font-bold text-gray-900'>Gönderiyi İptal Et</h2>
                  <button
                    onClick={() => {
                      setShowCancelModal(false);
                      setCancelReason('');
                      setSelectedShipmentForCancel(null);
                    }}
                    className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
                  >
                    <X className='w-5 h-5 text-gray-500' />
                  </button>
                </div>
                <p className='text-gray-600 mb-4'>
                  Gönderi {selectedShipmentForCancel.trackingCode ? selectedShipmentForCancel.trackingCode : `#${selectedShipmentForCancel.id}`} - {selectedShipmentForCancel.title}
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
                    onChange={(e) => setCancelReason(e.target.value)}
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
                      setSelectedShipmentForCancel(null);
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
      </div>
    </div>
  );
}










