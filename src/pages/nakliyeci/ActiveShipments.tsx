  import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../contexts/AuthContext';
import {
  Package,
  Clock,
  MapPin,
  Truck,
  Eye,
  Edit,
  Phone,
  MessageSquare,
  Navigation,
  Calendar,
  Weight,
  Ruler,
  ArrowRight,
  Filter,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  UserPlus,
  FilePlus2,
  Users,
  DollarSign,
  Loader2,
  X,
  Route,
  Star,
} from 'lucide-react';
import Breadcrumb from '../../components/shared-ui-elements/Breadcrumb';
import EmptyState from '../../components/shared-ui-elements/EmptyState';
import LoadingState from '../../components/shared-ui-elements/LoadingState';
import GuidanceOverlay from '../../components/shared-ui-elements/GuidanceOverlay';
import { normalizeTrackingCode } from '../../utils/trackingCode';
import { logger } from '../../utils/logger';
import Pagination from '../../components/shared-ui-elements/Pagination';
import Modal from '../../components/shared-ui-elements/Modal';
import SuccessMessage from '../../components/shared-ui-elements/SuccessMessage';
import MessagingModal from '../../components/MessagingModal';
import RatingModal from '../../components/RatingModal';
import TrackingModal from '../../components/TrackingModal';
import { createApiUrl } from '../../config/api';
import { formatCurrency, formatDate, sanitizeAddressLabel, sanitizeMessageText, sanitizeShipmentTitle } from '../../utils/format';
import { getStatusInfo, getStatusDescription } from '../../utils/shipmentStatus';
import { resolveShipmentRoute } from '../../utils/shipmentRoute';
import ActiveShipmentsHeader from '../../components/shipment/ActiveShipmentsHeader';
import ActiveShipmentsFilters from '../../components/shipment/ActiveShipmentsFilters';

interface ActiveShipment {
  id: string;
  trackingNumber: string;
  title?: string;
  description?: string;
  category?: string;
  categoryData?: any;
  from: string;
  to: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  pickupDistrict?: string;
  deliveryDistrict?: string;
  status: string;
  priority: string;
  weight: number;
  volume: number;
  dimensions?: any;
  requiresInsurance?: boolean;
  specialRequirements?: string;
  value: number;
  price?: number;
  isExclusiveToCarrier?: boolean;
  pickupDate: string;
  deliveryDate: string;
  driver_id?: string | number | null;
  driver: {
    name: string;
    phone: string;
    vehicle: string;
  } | null;
  shipper: {
    id?: string;
    name: string;
    company: string;
    email?: string;
    phone?: string;
  };
  hasRatedShipper?: boolean;
  createdAt: string;
}

interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicle: {
    plate: string;
    type: string;
  };
  status: 'available' | 'busy' | 'offline';
}

const ActiveShipments = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const focusShipmentId = searchParams.get('shipmentId');
  const didFocusScrollRef = useRef(false);

  const getDisplayShipperName = (raw: any) => {
    const s = String(raw ?? '').trim();
    if (!s) return 'Gönderici';
    if (s.includes('@')) return 'Gönderici';
    return sanitizeShipmentTitle(s);
  };

  const toTrackingCode = normalizeTrackingCode;
  const [shipments, setShipments] = useState<ActiveShipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    limit: 20,
  });
  
  // Taşıyıcıya atama modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<ActiveShipment | null>(null);
  const [assignMode, setAssignMode] = useState<'direct' | 'listing'>('direct');
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [minPrice, setMinPrice] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showMessagingModal, setShowMessagingModal] = useState(false);
  const [selectedShipper, setSelectedShipper] = useState<{id: string; name: string; email: string; type: string} | null>(null);
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedShipperForRating, setSelectedShipperForRating] = useState<{id: string; name: string; email: string; type: string} | null>(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [selectedTrackingShipment, setSelectedTrackingShipment] = useState<ActiveShipment | null>(null);

  useEffect(() => {
    loadActiveShipments();
  }, [pagination.page, statusFilter]);

  useEffect(() => {
    if (!focusShipmentId) return;
    if (!shipments || shipments.length === 0) return;
    if (didFocusScrollRef.current) return;

    const el = document.getElementById(`shipment-${focusShipmentId}`);
    if (el && typeof (el as any).scrollIntoView === 'function') {
      (el as any).scrollIntoView({ behavior: 'smooth', block: 'start' });
      didFocusScrollRef.current = true;
    }
  }, [focusShipmentId, shipments]);

  useEffect(() => {
    if (showAssignModal && assignMode === 'direct') {
      loadDrivers();
    }
  }, [showAssignModal, assignMode]);

  const loadActiveShipments = async () => {
    try {
      setIsLoading(true);

      // Tüm gönderileri getir (teklif kabul edilen, taşıyıcı atanan, devam eden, tamamlanan, iptal edilen)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      // Backend /api/shipments/nakliyeci expects a real shipment status (s.status = $X).
      // UI-only filters like "waiting_driver" and "active" must be handled client-side.
      const backendStatusAllowed = new Set([
        'pending',
        'open',
        'waiting_for_offers',
        'offer_accepted',
        'accepted',
        'assigned',
        'in_progress',
        'picked_up',
        'in_transit',
        'delivered',
        'completed',
        'cancelled',
      ]);

      // NOTE: UI'daki "Tamamlanan" filtresi hem delivered hem completed kapsar.
      // Backend'e status=delivered gönderirsek completed kayıtlar dışarıda kalır.
      // Bu nedenle bu filtrede backend'i daraltmayıp client-side filtreliyoruz.
      if (statusFilter !== 'all' && statusFilter !== 'delivered' && backendStatusAllowed.has(statusFilter)) {
        params.append('status', statusFilter);
      }
      const response = await fetch(
        `${createApiUrl('/api/shipments/nakliyeci')}?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const rawShipments = (data.data || data.shipments || (Array.isArray(data) ? data : [])) as any[];
        
        
        // Map backend data to frontend format
        const toNumber = (value: any, fallback = 0) => {
          if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
          if (typeof value === 'string') {
            const n = parseFloat(value.replace(/[^0-9.,-]/g, '').replace(',', '.'));
            return Number.isFinite(n) ? n : fallback;
          }
          return fallback;
        };

        const mappedShipments = (Array.isArray(rawShipments) ? rawShipments : []).filter(Boolean).map((shipment: any) => {
          const carrierAssignedId =
            shipment.carrier_id ||
            shipment.carrierId ||
            shipment.nakliyeci_id ||
            shipment.nakliyeciId ||
            null;

          const isExclusiveToCarrier =
            !!carrierAssignedId &&
            (shipment.status === 'waiting_for_offers' || shipment.status === 'pending' || shipment.status === 'open');

          // Build driver object - only if driver is actually assigned
          // Check if driver_id exists in shipment data
          const hasDriver = shipment.driver_id || shipment.driverId || (shipment.driver && shipment.driver.id);
          const driver = hasDriver
            ? {
                name:
                  (shipment.driver && (shipment.driver.name || shipment.driver.fullName)) ||
                  shipment.assignedDriverName ||
                  shipment.driverName ||
                  shipment.driver_full_name ||
                  'Atanmadı',
                phone:
                  (shipment.driver && (shipment.driver.phone || shipment.driverPhone)) ||
                  shipment.assignedDriverPhone ||
                  shipment.driverPhone ||
                  shipment.driver_phone ||
                  '',
                vehicle:
                  (shipment.driver && (shipment.driver.vehicle || shipment.driverVehicle)) ||
                  shipment.driverVehicle ||
                  shipment.driver_vehicle ||
                  [shipment.vehiclePlate, shipment.vehicleType].filter(Boolean).join(' ') ||
                  '',
              }
            : null;

          // Build shipper object with fallback logic
          // PRIVACY: Gönderici telefon numarası gizlenmeli - nakliyeci sadece mesaj yoluyla ulaşabilir
          // IMPORTANT: Include userId for messaging - this is the shipper's user ID
          const shipperUserId =
            shipment.userId ||
            shipment.user_id ||
            shipment.userid ||
            shipment.ownerId ||
            shipment.owner_id ||
            shipment.shipper?.id ||
            shipment.shipper?.userId;
          const shipperName =
            shipment.shipper?.name ||
            shipment.shipper?.fullName ||
            shipment.shipper?.fullname ||
            shipment.shipper?.companyName ||
            shipment.shipperName ||
            shipment.shipper_name ||
            shipment.ownerName ||
            shipment.owner_name ||
            shipment.shipmentOwnerName ||
            shipment.shipmentownername ||
            shipment.senderName ||
            shipment.sender_name ||
            shipment.sender ||
            shipment.user?.fullName ||
            shipment.user?.name ||
            shipment.owner?.fullName ||
            shipment.owner?.name ||
            shipment.ownerEmail ||
            shipment.owner_email ||
            shipment.email ||
            shipment.contactPerson ||
            'Bilinmiyor';
          const shipperCompany =
            shipment.shipper?.company ||
            shipment.shipper?.companyName ||
            shipment.shipper?.company_name ||
            shipment.ownerCompany ||
            shipment.owner_company ||
            shipment.shipperCompany ||
            shipment.shipper_company ||
            shipment.companyName ||
            '';
          const shipperEmail =
            shipment.shipper?.email ||
            shipment.shipperEmail ||
            shipment.shipper_email ||
            shipment.ownerEmail ||
            shipment.owner_email ||
            shipment.senderEmail ||
            shipment.sender_email ||
            shipment.email ||
            '';

          const shipperType = String(
            shipment.ownerRole || shipment.owner_role || shipment.shipper?.role || shipment.shipper?.type || 'individual'
          );

          const shipper = shipment.shipper ? {
            id: shipperUserId || shipment.shipper.id || shipment.shipper.userId,
            name: shipperName,
            company: shipperCompany,
            email: shipperEmail,
            // phone: HIDDEN - Gizlilik nedeniyle gönderici telefon numarası gösterilmemektedir
          } : {
            id: shipperUserId,
            name: shipperName,
            company: shipperCompany,
            email: shipperEmail,
            // phone: HIDDEN - Gizlilik nedeniyle gönderici telefon numarası gösterilmemektedir
          };

          const { from, to } = resolveShipmentRoute(shipment);
          const rawTracking =
            shipment.trackingNumber ||
            shipment.tracking_number ||
            shipment.trackingnumber ||
            shipment.trackingCode ||
            shipment.tracking_code ||
            shipment.trackingcode ||
            shipment.tracking ||
            undefined;
          const trackingNumber = toTrackingCode(rawTracking, shipment.id);
          const value = toNumber(
            shipment.displayPrice ??
              shipment.display_price ??
              shipment.price ??
              shipment.value ??
              shipment.offerPrice ??
              shipment.offer_price,
            0
          );

          return {
            id: shipment.id?.toString() || '',
            trackingNumber,
            title: shipment.title || undefined,
            description: shipment.description || undefined,
            category: shipment.category || shipment.categoryType || shipment.shipmentType || undefined,
            categoryData: shipment.categoryData || shipment.category_data || undefined,
            from,
            to,
            pickupAddress: shipment.pickupAddress || shipment.pickup_address || shipment.pickupCity || shipment.pickup_city || shipment.from_address || undefined,
            deliveryAddress: shipment.deliveryAddress || shipment.delivery_address || shipment.deliveryCity || shipment.delivery_city || shipment.to_address || undefined,
            pickupDistrict: shipment.pickupDistrict || shipment.pickup_district || undefined,
            deliveryDistrict: shipment.deliveryDistrict || shipment.delivery_district || undefined,
            status: shipment.status || 'pending',
            priority: shipment.priority || 'normal',
            weight: shipment.weight ? (typeof shipment.weight === 'number' ? shipment.weight : parseFloat(shipment.weight) || 0) : 0,
            volume: shipment.volume ? (typeof shipment.volume === 'number' ? shipment.volume : parseFloat(shipment.volume) || 0) : 0,
            dimensions: shipment.dimensions || undefined,
            requiresInsurance:
              typeof shipment.requiresInsurance === 'boolean'
                ? shipment.requiresInsurance
                : typeof shipment.requires_insurance === 'boolean'
                  ? shipment.requires_insurance
                  : typeof shipment.insurance_required === 'boolean'
                    ? shipment.insurance_required
                    : undefined,
            specialRequirements: shipment.specialRequirements || shipment.special_requirements || undefined,
            value,
            isExclusiveToCarrier,
            pickupDate: shipment.pickupDate || shipment.pickup_date || '',
            deliveryDate: shipment.deliveryDate || shipment.delivery_date || '',
            driver_id: shipment.driver_id || shipment.driverId || null,
            driver,
            shipper,
            createdAt: shipment.createdAt || shipment.created_at || new Date().toISOString(),
          };
        });
        
        setShipments(mappedShipments);

        // Pagination compatibility:
        // - Some APIs return { pagination: { page, pages, total } }
        // - backend/routes/v1/shipments.js returns { meta: { total, totalPages, page, limit } }
        if (data.pagination) {
          setPagination(prev => ({
            ...prev,
            page: data.pagination.page,
            pages: data.pagination.pages,
            total: data.pagination.total,
          }));
        } else if (data.meta) {
          setPagination(prev => ({
            ...prev,
            page: Number(data.meta.page || prev.page),
            pages: Number(data.meta.totalPages || prev.pages),
            total: Number(data.meta.total || prev.total),
            limit: Number(data.meta.limit || prev.limit),
          }));
        }
      } else {
        logger.error('Aktif gönderiler yüklenemedi');
        setShipments([]);
      }
    } catch (error) {
      logger.error('Aktif gönderiler yüklenirken hata:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDrivers = async () => {
    try {
      setLoadingDrivers(true);
      const storedUser = localStorage.getItem('user');
      const userId = storedUser ? (JSON.parse(storedUser)?.id || '') : '';
      logger.debug('[DEBUG] ActiveShipments - Loading drivers for userId:', userId);
      const response = await fetch(createApiUrl('/api/drivers/nakliyeci'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
          'X-User-Id': userId
        }
      });
      
        logger.debug('[DEBUG] ActiveShipments - Drivers API response status:', response.status);
      if (response.ok) {
        const data = await response.json();
          logger.debug('[DEBUG] ActiveShipments - Drivers API response data:', data);
        // Show all drivers for now (available and busy)
        // TODO: Add filter option in UI to show only available drivers
        setDrivers(data.drivers || []);
          logger.debug('[DEBUG] ActiveShipments - Set drivers count:', (data.drivers || []).length);
      } else {
        const errorText = await response.text();
          logger.error('[DEBUG] ActiveShipments - Taşıyıcı API hatası:', response.status, errorText);
        setDrivers([]);
      }
    } catch (error) {
        logger.error('[DEBUG] ActiveShipments - Taşıyıcılar yüklenirken hata:', error);
      setDrivers([]);
    } finally {
      setLoadingDrivers(false);
    }
  };

  const handleAssignClick = (shipment: ActiveShipment) => {
    setSelectedShipment(shipment);
    setAssignMode('direct');
    setShowAssignModal(true);
    loadDrivers(); // Load drivers when modal opens
  };

  const handleMessageClick = (shipment: ActiveShipment) => {
    if (!shipment.shipper) return;

    const resolvedShipperId =
      shipment.shipper.id ||
      (shipment as any).userId ||
      (shipment as any).user_id ||
      (shipment as any).userid ||
      (shipment as any).ownerId ||
      (shipment as any).owner_id ||
      (shipment as any).shipperId ||
      (shipment as any).shipper_id ||
      (shipment as any).senderId ||
      (shipment as any).sender_id;

    if (!resolvedShipperId || String(resolvedShipperId).trim() === '') {
      setErrorMessage('Gönderici bilgisi bulunamadı, mesajlaşamazsınız.');
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
      return;
    }

    setSelectedShipper({
      id: String(resolvedShipperId || ''),
      name: getDisplayShipperName(shipment.shipper.name),
      email: String((shipment.shipper as any).email || ''),
      type: String((shipment as any).ownerRole || (shipment as any).owner_role || 'individual'),
    });
    setSelectedShipmentId(shipment.id);
    setShowMessagingModal(true);
  };

  const getCurrentUserForTracking = () => {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return null;
      const u = JSON.parse(raw);
      const id = u?.id != null ? String(u.id) : '';
      const name = String(u?.fullName || u?.name || `${u?.firstName || ''} ${u?.lastName || ''}`.trim() || 'Nakliyeci').trim();
      if (!id) return null;
      return { id, name };
    } catch {
      return null;
    }
  };

  const openTracking = (shipment: ActiveShipment) => {
    setSelectedTrackingShipment(shipment);
    setShowTrackingModal(true);
  };

  const handleDirectAssign = async () => {
    if (!selectedDriver || !selectedShipment) return;

    setIsAssigning(true);
    const timeoutId = setTimeout(() => {
      setIsAssigning(false);
      setErrorMessage('Taşıyıcı atama işlemi zaman aşımına uğradı. Lütfen tekrar deneyin.');
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
    }, 10000); // 10 seconds timeout

    try {
      const response = await fetch(
        createApiUrl(`/api/shipments/${selectedShipment.id}/assign-driver`),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ driverId: selectedDriver }),
        }
      );

      if (response.ok) {
        clearTimeout(timeoutId);
        setSuccessMessage('Taşıyıcı başarıyla atandı. İşlem başlatıldı.');
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        setShowAssignModal(false);
        setSelectedShipment(null);
        setSelectedDriver('');
        await loadActiveShipments();
      } else {
        clearTimeout(timeoutId);
        const errorData = await response.json().catch(() => ({}));
        setErrorMessage(errorData.message || 'Taşıyıcı atanamadı. Lütfen tekrar deneyin.');
        setShowError(true);
        setTimeout(() => setShowError(false), 5000);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      logger.error('Taşıyıcı atanırken hata:', error);
      setErrorMessage('Taşıyıcı atanamadı. Lütfen tekrar deneyin.');
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
    } finally {
      clearTimeout(timeoutId);
      setIsAssigning(false);
    }
  };

  const handleCreateListing = async () => {
    if (!selectedShipment) return;

    try {
      setIsAssigning(true);
      const body = {
        shipmentId: Number(selectedShipment.id),
        minPrice: minPrice ? Number(minPrice) : undefined,
      };

      const token = localStorage.getItem('authToken');
      const response = await fetch(createApiUrl('/api/carrier-market/listings'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      // Fallback: some deployments don't ship carrier-market routes.
      // If we get a 501 or a known "routes not available" message, open broadcast via shipments route.
      let responsePayload: any = null;
      if (!response.ok) {
        responsePayload = await response.json().catch(() => ({}));
        const msg = String(responsePayload?.message || '').toLowerCase();
        const shouldFallback =
          response.status === 501 ||
          msg.includes('carrier-market routes not available') ||
          msg.includes('carrier marketing routes not available') ||
          msg.includes('routes not available');

        if (shouldFallback) {
          const fallbackRes = await fetch(createApiUrl(`/api/shipments/${selectedShipment.id}/open-broadcast`), {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            // open-broadcast endpoint doesn't require minPrice; keep body empty for compatibility
            body: JSON.stringify({}),
          });

          if (fallbackRes.ok) {
            setSuccessMessage('📢 İlan yayınlandı! Taşıyıcılar teklif verecek.');
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
            setShowAssignModal(false);
            setSelectedShipment(null);
            setMinPrice('');
            await loadActiveShipments();
            return;
          }

          const fbErr = await fallbackRes.json().catch(() => ({}));
          setErrorMessage(fbErr.message || '❌ İlan oluşturulamadı, tekrar dene.');
          setShowError(true);
          setTimeout(() => setShowError(false), 5000);
          return;
        }
      }

      if (response.ok) {
        setSuccessMessage('İlan başarıyla oluşturuldu! Taşıyıcılar teklif vermeye başlayacak.');
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        setShowAssignModal(false);
        setSelectedShipment(null);
        setMinPrice('');
        await loadActiveShipments();
      } else {
        setErrorMessage(responsePayload?.message || 'İlan oluşturulamadı. Lütfen tekrar deneyin.');
        setShowError(true);
        setTimeout(() => setShowError(false), 5000);
      }
    } catch (error) {
      logger.error('İlan oluşturulurken hata:', error);
      setErrorMessage('İlan oluşturulamadı. Lütfen tekrar deneyin.');
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
    } finally {
      setIsAssigning(false);
    }
  };

  // Use utility function for status info
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'offer_accepted':
      case 'accepted':
        return 'text-blue-600 bg-blue-100';
      case 'in_progress':
        return 'text-indigo-600 bg-indigo-100';
      case 'in_transit':
        return 'text-blue-600 bg-blue-100';
      case 'delivered':
        return 'text-green-600 bg-green-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Bekliyor';
      case 'offer_accepted':
      case 'accepted':
        return 'Teklif Kabul Edildi';
      case 'in_progress':
        return 'Hazırlanıyor';
      case 'in_transit':
        return 'Yolda';
      case 'delivered':
        return 'Teslim Edildi';
      case 'cancelled':
        return 'İptal Edildi';
      default:
        return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'normal':
        return 'text-blue-600 bg-blue-100';
      case 'low':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Yüksek';
      case 'normal':
        return 'Normal';
      case 'low':
        return 'Düşük';
      default:
        return priority;
    }
  };

  const getCategoryText = (categoryRaw?: string) => {
    const k = String(categoryRaw || '').trim().toLowerCase();
    if (!k) return null;
    if (k === 'warehouse_transfer' || k === 'warehouse transfer') return 'Depo Transferi';
    if (k === 'house_move' || k === 'house move' || k === 'home_move') return 'Ev Taşıma';
    if (k === 'furniture' || k === 'furniture_transport') return 'Mobilya';
    if (k === 'general' || k === 'general_cargo') return 'Genel Yük';
    return categoryRaw;
  };

  const filteredShipments = shipments.filter(shipment => {
    const matchesSearch = !searchTerm || searchTerm.trim() === '' || (
      (shipment.trackingNumber || '')
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (shipment.from || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (shipment.to || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      ((shipment.driver?.name || '').toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Gelişmiş durum filtreleme
    let matchesStatus = true;
    if (statusFilter !== 'all') {
      switch (statusFilter) {
        case 'waiting_driver':
          // Taşıyıcı bekliyor: offer_accepted veya accepted durumunda ama driver yok
          matchesStatus = (shipment.status === 'offer_accepted' || shipment.status === 'accepted') && !shipment.driver_id;
          break;
        case 'active':
          // Aktif: in_progress/in_transit/delivered (driver varsa)
          matchesStatus = (shipment.status === 'in_progress' || shipment.status === 'in_transit' || shipment.status === 'delivered') &&
                         !!shipment.driver_id;
          break;
        case 'delivered':
          // UI label: Tamamlanan
          matchesStatus = shipment.status === 'delivered' || shipment.status === 'completed';
          break;
        case 'cancelled':
          matchesStatus = shipment.status === 'cancelled';
          break;
        default:
          matchesStatus = shipment.status === statusFilter;
      }
    }

    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50'>
      <Helmet>
        <title>Aktif Yükler - YolNext Nakliyeci</title>
        <meta name='description' content='Aktif yüklerinizi takip edin' />
      </Helmet>

      <div className='max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6'>
        {/* Breadcrumb */}
        <div className='mb-4 sm:mb-6'>
          <Breadcrumb
            items={[
              { label: 'Aktif Yükler', icon: <Package className='w-4 h-4' /> },
            ]}
          />
        </div>

        <div className='mb-6'>
          <GuidanceOverlay
            storageKey='nakliyeci.active-shipments'
            isEmpty={!isLoading && shipments.length === 0}
            icon={Truck}
            title='Aktif Yükler'
            description='Kabul edilen yüklerinizi burada yönetebilirsiniz: taşıyıcı atama, mesajlaşma ve takip işlemleri. Yeni yük almak için "Yük Pazarı" sayfasına geçebilirsiniz.'
            primaryAction={{
              label: 'Yük Pazarına Git',
              to: '/nakliyeci/jobs',
            }}
            secondaryAction={{
              label: 'Yenile',
              onClick: () => loadActiveShipments(),
            }}
          />
        </div>

        {/* Header */}
        <ActiveShipmentsHeader />

        {/* Action Buttons */}
        <div className='flex justify-center mb-6 sm:mb-8'>
          <div className='flex flex-wrap gap-2 sm:gap-3'>
            <button
              onClick={loadActiveShipments}
              disabled={isLoading}
              className='flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-white text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-lg border border-slate-200 text-sm sm:text-base disabled:opacity-60 disabled:cursor-not-allowed'
            >
              <RefreshCw className='w-3 h-3 sm:w-4 sm:h-4' />
              <span className='hidden sm:inline'>Yenile</span>
              <span className='sm:hidden'>↻</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <ActiveShipmentsFilters
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          onSearchChange={setSearchTerm}
          onStatusFilterChange={setStatusFilter}
        />

        {/* Shipments List */}
        {filteredShipments.length > 0 ? (
          <div className='grid gap-6'>
            {filteredShipments.map((shipment, index) => (
              <div
                key={`${shipment.id}-${shipment.trackingNumber}-${index}`}
                id={`shipment-${shipment.id}`}
                className={`bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow${
                  focusShipmentId && String(shipment.id) === String(focusShipmentId)
                    ? ' ring-2 ring-blue-400 ring-offset-2'
                    : ''
                }`}
              >
                <div className='flex flex-col gap-3 sm:gap-4'>
                  {/* Header Section */}
                  <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <span className='text-sm sm:text-base md:text-lg font-bold text-blue-600'>
                        {shipment.trackingNumber}
                      </span>
                      {shipment.isExclusiveToCarrier && (
                        <span className='px-2 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200'>
                          Sana Özel
                        </span>
                      )}
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusInfo(shipment.status).color}`}
                        title={getStatusDescription(shipment.status)}
                      >
                        {getStatusInfo(shipment.status).text}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(shipment.priority)}`}
                      >
                        {getPriorityText(shipment.priority)}
                      </span>
                      {getCategoryText(shipment.category) && (
                        <span className='px-2 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200'>
                          {getCategoryText(shipment.category)}
                        </span>
                      )}
                    </div>
                    <div className='text-right'>
                      <div className='text-lg sm:text-xl md:text-2xl font-bold text-gray-900'>
                        {formatCurrency(shipment.value || shipment.price || 0)}
                      </div>
                      <div className='text-xs sm:text-sm text-gray-500'>Toplam Tutar</div>
                    </div>
                  </div>

                  {(shipment.title || shipment.description) && (
                    <div className='bg-slate-50 border border-slate-200 rounded-lg p-3 sm:p-4'>
                      {shipment.title && (
                        <div className='text-sm sm:text-base font-semibold text-slate-900'>
                          {sanitizeShipmentTitle(shipment.title)}
                        </div>
                      )}
                      {shipment.description && (
                        <div className='text-xs sm:text-sm text-slate-700 mt-1 whitespace-pre-line'>
                          {sanitizeMessageText(sanitizeShipmentTitle(shipment.description))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Route and Info Section */}
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4'>
                    <div>
                      <h3 className='text-sm sm:text-base font-semibold text-gray-900 mb-2'>
                        Güzergah
                      </h3>
                      <div className='flex items-center gap-1 sm:gap-2 text-gray-600 text-xs sm:text-sm'>
                        <MapPin className='w-3 h-3 sm:w-4 sm:h-4' />
                        <span className='break-words'>
                          {shipment.from} → {shipment.to}
                        </span>
                      </div>
                      {(shipment.pickupAddress || shipment.deliveryAddress) && (
                        <div className='mt-2 text-xs sm:text-sm text-gray-600 space-y-1'>
                          {shipment.pickupAddress && (
                            <div className='break-words'>
                              <strong>Yükleme:</strong> {sanitizeAddressLabel(shipment.pickupAddress)}
                            </div>
                          )}
                          {shipment.deliveryAddress && (
                            <div className='break-words'>
                              <strong>Teslim:</strong> {sanitizeAddressLabel(shipment.deliveryAddress)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className='text-sm sm:text-base font-semibold text-gray-900 mb-2'>
                        Yük Bilgileri
                      </h3>
                      <div className='flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600'>
                        {shipment.weight != null && Number(shipment.weight) > 0 && (
                          <div className='flex items-center gap-1'>
                            <Weight className='w-3 h-3 sm:w-4 sm:h-4' />
                            <span>{shipment.weight} kg</span>
                          </div>
                        )}
                        {shipment.volume != null && Number(shipment.volume) > 0 && (
                          <div className='flex items-center gap-1'>
                            <Ruler className='w-3 h-3 sm:w-4 sm:h-4' />
                            <span>{typeof shipment.volume === 'number' ? shipment.volume.toFixed(2) : shipment.volume} m³</span>
                          </div>
                        )}
                        {shipment.dimensions && (
                          <div className='text-gray-700'>
                            <strong>Ölçüler:</strong> {typeof shipment.dimensions === 'string' ? shipment.dimensions : JSON.stringify(shipment.dimensions)}
                          </div>
                        )}
                        {(!shipment.volume || shipment.volume === 0) && (
                          <span className='text-gray-400 text-xs'>Hacim bilgisi yok</span>
                        )}
                      </div>
                      {(shipment.requiresInsurance || shipment.specialRequirements) && (
                        <div className='mt-2 text-xs sm:text-sm text-gray-600 space-y-1'>
                          {shipment.requiresInsurance && (
                            <div>
                              <strong>Sigorta:</strong> İsteniyor
                            </div>
                          )}
                          {shipment.specialRequirements && (
                            <div className='break-words'>
                              <strong>Özel İstek:</strong> {sanitizeMessageText(sanitizeShipmentTitle(shipment.specialRequirements))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {(shipment.pickupDate || shipment.deliveryDate) && (
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4'>
                      <div>
                        <h4 className='text-sm sm:text-base font-semibold text-gray-900 mb-2'>
                          Tarihler
                        </h4>
                        <div className='text-xs sm:text-sm text-gray-600 space-y-1'>
                          {shipment.pickupDate && (
                            <div className='flex items-center gap-2'>
                              <Calendar className='w-3 h-3 sm:w-4 sm:h-4' />
                              <span>
                                <strong>Yükleme:</strong> {formatDate(shipment.pickupDate)}
                              </span>
                            </div>
                          )}
                          {shipment.deliveryDate && (
                            <div className='flex items-center gap-2'>
                              <Calendar className='w-3 h-3 sm:w-4 sm:h-4' />
                              <span>
                                <strong>Teslim:</strong> {formatDate(shipment.deliveryDate)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4'>
                    <div>
                      <h4 className='text-sm sm:text-base font-semibold text-gray-900 mb-2'>
                        Taşıyıcı Bilgileri
                      </h4>
                      {shipment.driver_id ? (
                        <div className='text-xs sm:text-sm text-gray-600 space-y-1'>
                          {shipment.driver && shipment.driver.name !== 'Atanmadı' ? (
                            <p>
                              <strong>Ad:</strong> {shipment.driver.name}
                            </p>
                          ) : (
                            <p className='text-gray-500'>
                              <strong>Durum:</strong> Taşıyıcı atandı (bilgiler yükleniyor). Birazdan görünmezse “Yenile”ye basın.
                            </p>
                          )}
                          {shipment.driver?.vehicle && (
                            <p>
                              <strong>Araç:</strong> {shipment.driver.vehicle}
                            </p>
                          )}
                          {shipment.driver?.phone && (
                            <p className='break-words'>
                              <strong>Tel:</strong> {shipment.driver.phone}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className='text-xs sm:text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-2 sm:p-3'>
                          <p className='font-medium'>⏳ Taşıyıcı Bekleniyor</p>
                          <p className='text-xs mt-1 text-amber-700'>Taşıyıcı ataması yapılmadı</p>
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 className='text-sm sm:text-base font-semibold text-gray-900 mb-2'>
                        Gönderici Bilgileri
                      </h4>
                      <div className='text-xs sm:text-sm text-gray-600 space-y-1'>
                        <p>
                          <strong>Ad:</strong> {getDisplayShipperName(shipment.shipper.name)}
                        </p>
                        {shipment.shipper.company && (
                          <p>
                            <strong>Şirket:</strong> {sanitizeShipmentTitle(shipment.shipper.company)}
                          </p>
                        )}
                        <div className='mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700'>
                          <strong>Not:</strong> Gönderici telefon numarası gizlilik nedeniyle gösterilmemektedir. İletişim için mesaj sistemi kullanın. Platform sadece tarafları buluşturan bir pazaryeridir.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons - Mobile First */}
                  {shipment.status === 'cancelled' || shipment.status === 'canceled' ? (
                    <div className='text-xs sm:text-sm text-red-700 text-center bg-red-50 border border-red-200 rounded-lg p-2 sm:p-3'>
                      Bu gönderi iptal edildi. İşlem yapılamaz.
                    </div>
                  ) : (
                    <div className='flex flex-col gap-2 sm:gap-3'>
                      {(shipment.status === 'waiting_for_offers' || shipment.status === 'offer_accepted' || shipment.status === 'accepted') && !shipment.driver_id && (
                        <button
                          onClick={() => {
                            setSelectedShipment(shipment);
                            setAssignMode('listing');
                            setShowAssignModal(true);
                          }}
                          className='w-full bg-gradient-to-r from-slate-800 to-blue-900 hover:from-blue-700 hover:to-indigo-700 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-sm sm:text-base'
                        >
                          <FilePlus2 className='w-4 h-4' />
                          Teklifleri Yönet
                        </button>
                      )}

                      {shipment.driver_id ? (
                        <div className='text-xs sm:text-sm text-green-600 mb-2 text-center bg-green-50 border border-green-200 rounded-lg p-2'>
                          <CheckCircle2 className='w-3 h-3 sm:w-4 sm:h-4 inline mr-1' />
                          Taşıyıcı Atandı
                        </div>
                      ) : shipment.status !== 'waiting_for_offers' ? (
                        <button
                          onClick={() => handleAssignClick(shipment)}
                          className='w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-sm sm:text-base'
                        >
                          <UserPlus className='w-4 h-4' />
                          Taşıyıcıya Ata
                        </button>
                      ) : null}
                      
                      <div className='grid grid-cols-1 gap-2'>
                        <button 
                          onClick={() => handleMessageClick(shipment)}
                          className='bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 text-white px-2 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-1 text-xs sm:text-sm'
                        >
                          <MessageSquare className='w-3 h-3 sm:w-4 sm:h-4' />
                          Mesaj
                        </button>

                        {shipment.driver_id && (
                          <button
                            onClick={() => openTracking(shipment)}
                            className='bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 px-2 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow flex items-center justify-center gap-1 text-xs sm:text-sm'
                          >
                            <MapPin className='w-3 h-3 sm:w-4 sm:h-4' />
                            <span className='hidden xs:inline'>Takip / ETA</span>
                            <span className='xs:hidden'>📍</span>
                          </button>
                        )}

                        {shipment.driver?.phone && (
                          <a
                            href={`tel:${shipment.driver.phone}`}
                            className='bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 px-2 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow flex items-center justify-center gap-1 text-xs sm:text-sm'
                          >
                            <Phone className='w-3 h-3 sm:w-4 sm:h-4' />
                            <span className='hidden xs:inline'>Ara</span>
                            <span className='xs:hidden'>📞</span>
                          </a>
                        )}
                      </div>
                      
                      {shipment.driver_id && (
                        <button
                          onClick={() => navigate(`/nakliyeci/route-planner?shipmentId=${shipment.id}`)}
                          className='w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base'
                          title='Rota üzerinde ek gönderiler bul ve optimize et'
                        >
                          <Route className='w-4 h-4' />
                          <span className='hidden sm:inline'>Rota Optimize Et</span>
                          <span className='sm:hidden'>🗺️ Optimize</span>
                        </button>
                      )}
                      
                      {shipment.status === 'delivered' && shipment.shipper.id && !shipment.hasRatedShipper && (
                        <button
                          onClick={() => {
                            setSelectedShipperForRating({
                              id: shipment.shipper.id || '',
                              name: shipment.shipper.name,
                              email: shipment.shipper.email || '',
                              type: shipment.shipper.company ? 'corporate' : 'individual',
                            });
                            setSelectedShipmentId(shipment.id);
                            setShowRatingModal(true);
                          }}
                          className='w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base'
                        >
                          <Star className='w-4 h-4' />
                          <span className='hidden sm:inline'>Taşıyıcıyı Değerlendir</span>
                          <span className='sm:hidden'>⭐ Değerlendir</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className='min-h-[50vh] flex items-center justify-center'>
            <div className='bg-white rounded-2xl shadow-xl border border-slate-200 p-10 text-center w-full max-w-2xl'>
              <EmptyState
                icon={Package}
                title='Henüz aktif yük yok'
                description='Teklif kabul edilince aktif yükler burada görünecek. Yük Pazarı sayfasından teklif verebilirsiniz.'
                action={{
                  label: 'Yük Pazarı',
                  onClick: () => navigate('/nakliyeci/jobs'),
                }}
              />
            </div>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && pagination.pages > 1 && (
          <div className='mt-6 sm:mt-8'>
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.pages}
              onPageChange={(page) =>
                setPagination((prev) => ({ ...prev, page }))
              }
            />
          </div>
        )}

        {/* Taşıyıcıya Atama Modal */}
        <Modal
          isOpen={showAssignModal}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedShipment(null);
            setAssignMode('direct');
            setSelectedDriver('');
            setMinPrice('');
          }}
          title="Taşıyıcıya Ata"
          size="lg"
        >
          {selectedShipment && (
            <div className="space-y-6">
              {/* Gönderi Bilgisi */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <h4 className="font-semibold text-slate-900 mb-2">Gönderi Bilgisi</h4>
                <div className="text-sm text-slate-600 space-y-1">
                  <p><strong>Takip No:</strong> {selectedShipment.trackingNumber}</p>
                  <p><strong>Güzergah:</strong> {selectedShipment.from} → {selectedShipment.to}</p>
                </div>
              </div>

              {/* Araç ve Ekipman Gereksinimleri */}
              {selectedShipment.categoryData?.vehicleRequirements && (
                <div className="bg-amber-50 rounded-xl p-4 border-2 border-amber-200">
                  <h4 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                    <Truck className="w-5 h-5 text-amber-600" />
                    Göndericinin Araç Gereksinimleri
                  </h4>
                  <div className="text-sm text-amber-800 space-y-2">
                    {(() => {
                      const vr = selectedShipment.categoryData.vehicleRequirements;
                      const requirements: string[] = [];
                      
                      if (vr.vehicleType) {
                        const vehicleTypeMap: Record<string, string> = {
                          'van': 'Van',
                          'kamyonet': 'Kamyonet',
                          'kamyon': 'Kamyon',
                          'refrigerated': 'Soğutmalı Araç',
                          'open_truck': 'Açık Kasa Kamyon',
                          'closed_truck': 'Kapalı Kasa Kamyon',
                        };
                        requirements.push(`Araç Tipi: ${vehicleTypeMap[vr.vehicleType] || vr.vehicleType}`);
                      }
                      if (vr.trailerType) {
                        const trailerTypeMap: Record<string, string> = {
                          'tenteli': 'Tenteli Dorse',
                          'frigorific': 'Frigorifik Dorse',
                          'lowbed': 'Lowbed Dorse',
                          'kapalı': 'Kapalı Dorse',
                          'açık': 'Açık Dorse',
                        };
                        requirements.push(`Dorse: ${trailerTypeMap[vr.trailerType] || vr.trailerType}`);
                      }
                      if (vr.requiresCrane) requirements.push('Vinç Gerekli');
                      if (vr.requiresForklift) requirements.push('Forklift Gerekli');
                      if (vr.requiresHydraulicLifter) requirements.push('Hidrolik Kaldırıcı Gerekli');
                      if (vr.heavyTonage) {
                        requirements.push(`Ağır Tonaj: ${vr.heavyTonageAmount ? vr.heavyTonageAmount + ' ton' : '40+ ton'}`);
                      }
                      if (vr.oversizedLoad) {
                        const dims = vr.oversizedDimensions;
                        if (dims && (dims.length || dims.width || dims.height)) {
                          const dimStr = [dims.length, dims.width, dims.height].filter(Boolean).join(' x ');
                          requirements.push(`Geniş Yük: ${dimStr} m`);
                        } else {
                          requirements.push('Geniş Yük (Özel izin gerektiren)');
                        }
                      }
                      if (vr.temperatureControl) {
                        const tempRange = [vr.temperatureMin, vr.temperatureMax].filter(Boolean).join(' - ');
                        requirements.push(`Sıcaklık Kontrolü: ${tempRange ? tempRange + ' ℃' : 'Gerekli'}`);
                      }
                      
                      return requirements.length > 0 ? (
                        <ul className="list-disc list-inside space-y-1">
                          {requirements.map((req, idx) => (
                            <li key={idx}>{req}</li>
                          ))}
                        </ul>
                      ) : null;
                    })()}
                  </div>
                  <p className="text-xs text-amber-700 mt-3 font-semibold">
                    ⚠️ Bu gereksinimlere uygun taşıyıcı seçin veya ilan açarken bu bilgileri belirtin.
                  </p>
                </div>
              )}

              {/* Mod Seçimi */}
              <div className="flex gap-3">
                <button
                  onClick={() => setAssignMode('direct')}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all duration-300 ${
                    assignMode === 'direct'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Users className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                  <div className="font-semibold text-slate-900">Doğrudan Ata</div>
                  <div className="text-xs text-slate-600 mt-1">Taşıyıcılarınızdan seçin</div>
                </button>
                <button
                  onClick={() => setAssignMode('listing')}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all duration-300 ${
                    assignMode === 'listing'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <FilePlus2 className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                  <div className="font-semibold text-slate-900">İlan Aç</div>
                  <div className="text-xs text-slate-600 mt-1">Teklifler alsın</div>
                </button>
              </div>

              {/* Doğrudan Atama */}
              {assignMode === 'direct' && (
                <div className="space-y-4">
                  {loadingDrivers ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                      <span className="ml-2 text-slate-600">Taşıyıcılar yükleniyor...</span>
                    </div>
                  ) : drivers.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50 rounded-xl">
                      <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-600 font-medium">Müsait taşıyıcı bulunmuyor</p>
                      <p className="text-sm text-slate-500 mt-1">
                        Taşıyıcı eklemek için <Link to="/nakliyeci/drivers" className="text-blue-600 hover:underline">Taşıyıcılarım</Link> sayfasına gidin
                      </p>
                    </div>
                  ) : (
                    <>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Taşıyıcı Seçin *
                      </label>
                      <select
                        value={selectedDriver}
                        onChange={(e) => setSelectedDriver(e.target.value)}
                        className="w-full p-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
                      >
                        <option value="">Taşıyıcı seçiniz</option>
                        {drivers.map((driver) => (
                          <option key={driver.id} value={driver.id}>
                            {driver.name} {driver.vehicle?.plate ? `- ${driver.vehicle.plate}` : ''} {driver.vehicle?.type ? `(${driver.vehicle.type})` : ''}
                          </option>
                        ))}
                      </select>
                    </>
                  )}
                </div>
              )}

              {/* İlan Açma */}
              {assignMode === 'listing' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      <DollarSign className="w-4 h-4 inline mr-2" />
                      Taşıyıcı Bütçesi (Tavan) (₺) - Opsiyonel
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="w-full p-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
                      placeholder="Örn: 5000"
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      Taşıyıcı teklifleri bu tutarı aşamaz
                    </p>
                  </div>
                </div>
              )}

              {/* Butonlar */}
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedShipment(null);
                    setAssignMode('direct');
                    setSelectedDriver('');
                    setMinPrice('');
                  }}
                  className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={assignMode === 'direct' ? handleDirectAssign : handleCreateListing}
                  disabled={
                    isAssigning ||
                    (assignMode === 'direct' && !selectedDriver) ||
                    (assignMode === 'listing' && false) // listing için her zaman aktif
                  }
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isAssigning ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {assignMode === 'direct' ? 'Atanıyor...' : 'Oluşturuluyor...'}
                    </>
                  ) : (
                    <>
                      {assignMode === 'direct' ? (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          Ata
                        </>
                      ) : (
                        <>
                          <FilePlus2 className="w-5 h-5" />
                          İlan Oluştur
                        </>
                      )}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* Success Message */}
        {showSuccess && (
          <SuccessMessage
            message={successMessage}
            isVisible={showSuccess}
            onClose={() => setShowSuccess(false)}
          />
        )}

        {/* Messaging Modal */}
        {showMessagingModal && selectedShipper && user && (
          <MessagingModal
            isOpen={showMessagingModal}
            onClose={() => {
              setShowMessagingModal(false);
              setSelectedShipper(null);
              setSelectedShipmentId(null);
            }}
            otherUser={selectedShipper}
            currentUser={{
              id: user.id || '',
              name: user.fullName || 'Kullanıcı',
            }}
            shipmentId={selectedShipmentId || undefined}
          />
        )}

        {/* Tracking Modal */}
        {showTrackingModal && selectedTrackingShipment && (() => {
          const currentUser = getCurrentUserForTracking();
          if (!currentUser) return null;

          return (
            <TrackingModal
              isOpen={showTrackingModal}
              onClose={() => {
                setShowTrackingModal(false);
                setSelectedTrackingShipment(null);
              }}
              mode='view'
              shipment={{
                id: String(selectedTrackingShipment.id),
                title: `Takip No: ${selectedTrackingShipment.trackingNumber}`,
                from_city: String(selectedTrackingShipment.from || ''),
                to_city: String(selectedTrackingShipment.to || ''),
                status: String(selectedTrackingShipment.status || ''),
              }}
              currentUser={currentUser}
            />
          );
        })()}

        {/* Rating Modal */}
        {showRatingModal && selectedShipperForRating && user && (
          <RatingModal
            isOpen={showRatingModal}
            onClose={() => {
              setShowRatingModal(false);
              setSelectedShipperForRating(null);
              setSelectedShipmentId(null);
              loadActiveShipments(); // Reload to show updated rating
            }}
            ratedUser={selectedShipperForRating}
            currentUser={{
              id: user.id || '',
              name: user.fullName || 'Kullanıcı',
            }}
            shipmentId={selectedShipmentId || undefined}
          />
        )}

        {/* Error Message */}
        {showError && (
          <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-xl shadow-xl flex items-center gap-3 z-50 animate-slide-up">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">{errorMessage}</span>
            <button
              onClick={() => setShowError(false)}
              className="ml-4 text-red-400 hover:text-red-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveShipments;











