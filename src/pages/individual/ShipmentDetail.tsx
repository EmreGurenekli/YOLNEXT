import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  MapPin,
  Calendar,
  Clock,
  Weight,
  DollarSign,
  Truck,
  User,
  Phone,
  MessageSquare,
  Star,
  CheckCircle,
  AlertCircle,
  XCircle,
  RefreshCw,
  Download,
  Share2,
  Edit,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Info,
  ExternalLink,
  FileText,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { createApiUrl } from '../../config/api';
import { useToast } from '../../contexts/ToastContext';
import { TOAST_MESSAGES, showProfessionalToast } from '../../utils/toastMessages';
import { sanitizeShipmentTitle } from '../../utils/format';
import { normalizeTrackingCode } from '../../utils/trackingCode';

interface ShipmentDetail {
  id: string;
  title: string;
  description: string;
  trackingCode: string;
  status:
    | 'pending'
    | 'bidding'
    | 'offer_accepted'
    | 'accepted'
    | 'in_progress'
    | 'picked_up'
    | 'in_transit'
    | 'delivered'
    | 'completed'
    | 'cancelled';
  priority: 'urgent' | 'high' | 'normal' | 'low';
  fromAddress: {
    name: string;
    address: string;
    city: string;
    district: string;
    postalCode: string;
    phone: string;
  };
  toAddress: {
    name: string;
    address: string;
    city: string;
    district: string;
    postalCode: string;
    phone: string;
  };
  cargoDetails: {
    type: 'ev_esyasi' | 'kisisel' | 'ciftci' | 'is_yeri' | 'ozel';
    weight: number;
    volume: number;
    value: number;
    description: string;
  };
  schedule: {
    preferredDate: string;
    timePreference: 'herhangi' | 'sabah' | 'ogleden_sonra' | 'aksam';
    estimatedDelivery: string;
    actualDelivery?: string;
  };
  carrier?: {
    id: string;
    name: string;
    company: string;
    phone: string;
    email: string;
    rating: number;
    avatar?: string;
  };
  offers: Offer[];
  tracking: TrackingUpdate[];
  documents: Document[];
  createdAt: string;
  updatedAt: string;
}

interface Offer {
  id: string;
  carrierId: string;
  carrierName: string;
  carrierCompany: string;
  price: number;
  message: string;
  estimatedDelivery: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  createdAt: string;
}

interface TrackingUpdate {
  id: string;
  status: string;
  location: string;
  description: string;
  timestamp: string;
  isDelivered: boolean;
}

interface Document {
  id: string;
  name: string;
  type: 'contract' | 'invoice' | 'receipt' | 'other';
  url: string;
  uploadedAt: string;
}

// Mock data kaldırıldı - gerçek API çağrıları kullanılacak

const getStatusInfo = (status: ShipmentDetail['status']) => {
  switch (status) {
    case 'pending':
      return {
        text: 'Beklemede',
        color: 'orange',
        icon: <Clock className='w-5 h-5' />,
      };
    case 'bidding':
      return {
        text: 'Teklifler Alındı',
        color: 'blue',
        icon: <DollarSign className='w-5 h-5' />,
      };
    case 'offer_accepted':
    case 'accepted':
      return {
        text: 'Kabul Edildi',
        color: 'purple',
        icon: <CheckCircle className='w-5 h-5' />,
      };
    case 'picked_up':
    case 'in_transit':
    case 'in_progress':
      return {
        text: 'Yolda',
        color: 'green',
        icon: <Truck className='w-5 h-5' />,
      };
    case 'delivered':
      return {
        text: 'Teslim Edildi',
        color: 'gray',
        icon: <Package className='w-5 h-5' />,
      };
    case 'completed':
      return {
        text: 'Tamamlandı',
        color: 'gray',
        icon: <Package className='w-5 h-5' />,
      };
    case 'cancelled':
      return {
        text: 'İptal Edildi',
        color: 'red',
        icon: <XCircle className='w-5 h-5' />,
      };
    default:
      return {
        text: 'Bilinmiyor',
        color: 'gray',
        icon: <AlertCircle className='w-5 h-5' />,
      };
  }
};

const getPriorityInfo = (priority: ShipmentDetail['priority']) => {
  switch (priority) {
    case 'urgent':
      return { text: 'Acil', color: 'red' };
    case 'high':
      return { text: 'Yüksek', color: 'orange' };
    case 'normal':
      return { text: 'Normal', color: 'blue' };
    case 'low':
      return { text: 'Düşük', color: 'gray' };
    default:
      return { text: 'Bilinmiyor', color: 'gray' };
  }
};

const getCargoTypeInfo = (type: ShipmentDetail['cargoDetails']['type']) => {
  switch (type) {
    case 'ev_esyasi':
      return { text: 'Ev Eşyası', icon: '🏠' };
    case 'kisisel':
      return { text: 'Kişisel', icon: '📦' };
    case 'ciftci':
      return { text: 'Çiftçi', icon: '🚜' };
    case 'is_yeri':
      return { text: 'İş Yeri', icon: '🏢' };
    case 'ozel':
      return { text: 'Özel', icon: '📦' };
    default:
      return { text: 'Diğer', icon: '❓' };
  }
};

const IndividualShipmentDetail: React.FC = () => {
  const { showToast } = useToast();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [shipment, setShipment] = useState<ShipmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showOffers, setShowOffers] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const normalizeDetailStatus = (raw: any): ShipmentDetail['status'] => {
    const s = String(raw || '').toLowerCase();
    if (s === 'waiting' || s === 'open' || s === 'waiting_for_offers') return 'pending';
    if (s === 'bidding') return 'bidding';
    if (s === 'offer_accepted') return 'offer_accepted';
    if (s === 'accepted') return 'accepted';
    if (s === 'in_progress') return 'in_progress';
    if (s === 'picked_up') return 'picked_up';
    if (s === 'in_transit') return 'in_transit';
    if (s === 'delivered') return 'delivered';
    if (s === 'completed') return 'completed';
    if (s === 'cancelled') return 'cancelled';
    return 'pending';
  };

  const fetchTrackingUpdates = async (shipmentId: string, token: string | null) => {
    if (!shipmentId || !token) return [] as TrackingUpdate[];
    try {
      const resp = await fetch(createApiUrl(`/api/shipments/${shipmentId}/tracking`), {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!resp.ok) return [] as TrackingUpdate[];
      const data = await resp.json();
      const rows = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
      return (rows || []).map((r: any, idx: number) => {
        const status = String(r.status || '');
        const ts = String(r.created_at || r.createdAt || new Date().toISOString());
        const isDelivered = status === 'delivered' || status === 'completed';
        return {
          id: String(r.id || `${shipmentId}-${idx}`),
          status,
          location: String(r.location || ''),
          description: String(r.notes || r.note || r.description || status || 'Güncelleme'),
          timestamp: ts,
          isDelivered,
        } as TrackingUpdate;
      });
    } catch {
      return [] as TrackingUpdate[];
    }
  };

  const loadShipmentDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(createApiUrl(`/api/shipments/${id}`), {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        setShipment(null);
        return;
      }

      const data = await response.json();
      const maybeShipment = data?.shipment || data?.data?.shipment || data?.data || data;
      const tracking = await fetchTrackingUpdates(String(id), token);

      if (maybeShipment) {
        const raw: any = maybeShipment as any;
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

        const pickupCity = pickStr('pickupCity', 'pickup_city', 'fromCity', 'from_city');
        const pickupDistrict = pickStr('pickupDistrict', 'pickup_district', 'fromDistrict', 'from_district');
        const pickupAddress = pickStr('pickupAddress', 'pickup_address', 'fromAddress', 'from_address');
        const deliveryCity = pickStr('deliveryCity', 'delivery_city', 'toCity', 'to_city');
        const deliveryDistrict = pickStr('deliveryDistrict', 'delivery_district', 'toDistrict', 'to_district');
        const deliveryAddress = pickStr('deliveryAddress', 'delivery_address', 'toAddress', 'to_address');

        const weight = Number(raw.weight ?? 0) || 0;
        const volume = Number(raw.volume ?? 0) || 0;
        const value = Number(raw.value ?? raw.price ?? 0) || 0;

        const createdAt = pickStr('createdAt', 'created_at', 'createdat') || new Date().toISOString();
        const updatedAt = pickStr('updatedAt', 'updated_at', 'updatedat') || createdAt;
        const pickupDate = pickStr('pickupDate', 'pickup_date', 'pickupdate') || createdAt;
        const deliveryDate = pickStr('deliveryDate', 'delivery_date', 'estimatedDelivery', 'estimated_delivery', 'deliverydate') || updatedAt;

        const normalized: ShipmentDetail = {
          ...(raw as any),
          id: String(raw.id ?? id),
          title: sanitizeShipmentTitle(raw.title || raw.productDescription || raw.description || 'Gönderi'),
          description: String(raw.description || ''),
          trackingCode: normalizeTrackingCode(raw.trackingCode || raw.trackingNumber || raw.tracking_number, raw.id ?? id),
          status: normalizeDetailStatus(raw.status),
          priority: (raw.priority as any) || 'normal',
          fromAddress: {
            name: String(raw.fromName || raw.senderName || raw.sender_name || 'Gönderici'),
            address: pickupAddress,
            city: pickupCity,
            district: pickupDistrict,
            postalCode: String(raw.fromPostalCode || raw.from_postal_code || ''),
            phone: String(raw.fromPhone || raw.senderPhone || raw.sender_phone || ''),
          },
          toAddress: {
            name: String(raw.toName || raw.receiverName || raw.receiver_name || 'Alıcı'),
            address: deliveryAddress,
            city: deliveryCity,
            district: deliveryDistrict,
            postalCode: String(raw.toPostalCode || raw.to_postal_code || ''),
            phone: String(raw.toPhone || raw.receiverPhone || raw.receiver_phone || ''),
          },
          cargoDetails: {
            type: (raw.cargoDetails?.type as any) || (raw.cargoType as any) || 'kisisel',
            weight,
            volume,
            value,
            description: String(raw.cargoDetails?.description || raw.cargoDescription || raw.cargo_description || raw.description || ''),
          },
          schedule: {
            preferredDate: String(raw.schedule?.preferredDate || raw.preferredDate || raw.preferred_date || pickupDate),
            timePreference: (raw.schedule?.timePreference as any) || (raw.timePreference as any) || (raw.time_preference as any) || 'herhangi',
            estimatedDelivery: String(raw.schedule?.estimatedDelivery || raw.estimatedDelivery || raw.estimated_delivery || deliveryDate),
            actualDelivery: raw.actualDelivery || raw.actual_delivery || raw.actualDeliveryDate || raw.actual_delivery_date,
          },
          carrier: raw.carrier
            ? raw.carrier
            : (raw.carrierId || raw.carrier_id || raw.nakliyeci_id || raw.carrierEmail || raw.carrier_email || raw.carrierName || raw.carrier_name || raw.nakliyeciName || raw.nakliyeci_name)
              ? {
                  id: String(raw.carrierId || raw.carrier_id || raw.nakliyeci_id || ''),
                  name: String(raw.carrierName || raw.carrier_name || raw.nakliyeciName || raw.nakliyeci_name || raw.carrierEmail || raw.carrier_email || ''),
                  company: String(raw.carrierCompany || raw.carrier_company || raw.nakliyeciCompany || raw.nakliyeci_company || ''),
                  phone: String(raw.carrierPhone || raw.carrier_phone || ''),
                  email: String(raw.carrierEmail || raw.carrier_email || ''),
                  rating: Number(raw.carrierRating || raw.carrier_rating || 0) || 0,
                  avatar: raw.carrierAvatar || raw.carrier_avatar,
                }
              : undefined,
          offers: Array.isArray(raw.offers) ? raw.offers : [],
          documents: Array.isArray(raw.documents) ? raw.documents : [],
          tracking: Array.isArray(raw.tracking) ? raw.tracking : tracking,
          createdAt,
          updatedAt,
        };

        setShipment({
          ...normalized,
        });
      } else {
        setShipment(null);
      }
    } catch {
      setShipment(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShipmentDetail();
  }, [id]);

  const handleAcceptOffer = async (offerId: string) => {
    if (!window.confirm('Bu teklifi kabul etmek istediğinizden emin misiniz? Diğer tüm teklifler otomatik olarak reddedilecektir.')) {
      return;
    }

    setIsConfirming(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(createApiUrl(`/api/offers/${offerId}/accept`), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        await loadShipmentDetail();
        showProfessionalToast(showToast, 'OFFER_ACCEPTED', 'success');        // Navigate to shipments page
        navigate('/individual/my-shipments');
      } else {
        const errorData = await response.json().catch(() => ({}));
        showProfessionalToast(showToast, 'OPERATION_FAILED', 'error');      }
    } catch (error) {
      showProfessionalToast(showToast, 'NETWORK_ERROR', 'error');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleRejectOffer = async (offerId: string) => {
    if (!window.confirm('Bu teklifi reddetmek istediğinizden emin misiniz?')) {
      return;
    }

    setIsConfirming(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(createApiUrl(`/api/offers/${offerId}/reject`), {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        await loadShipmentDetail();
        showProfessionalToast(showToast, 'OFFER_REJECTED', 'success');
      } else {
        const errorData = await response.json().catch(() => ({}));
        showProfessionalToast(showToast, 'OPERATION_FAILED', 'error');      }
    } catch (error) {
      showProfessionalToast(showToast, 'NETWORK_ERROR', 'error');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleContactCarrier = () => {
    if (shipment?.carrier) {
      // Contact carrier
      // Implement contact logic
    }
  };

  const handleDownloadDocument = (document: Document) => {
    // Download document
    // Implement document download logic
  };

  const handleConfirmDelivery = async () => {
    if (!shipment || shipment.status !== 'delivered') {
      return;
    }

    if (!window.confirm('Teslimatı onaylamak istediğinizden emin misiniz?')) {
      return;
    }

    setIsConfirming(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(createApiUrl(`/api/shipments/${shipment.id}/confirm-delivery`), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Update local state
        setShipment((prev: ShipmentDetail | null) => prev ? { ...prev, status: 'delivered' } : null);
        showProfessionalToast(showToast, 'DELIVERY_CONFIRMED', 'success');
        await loadShipmentDetail();
      } else {
        const errorData = await response.json();
        showProfessionalToast(showToast, 'OPERATION_FAILED', 'error');      }
    } catch (error) {
      // Error confirming delivery
      showProfessionalToast(showToast, 'NETWORK_ERROR', 'error');
    } finally {
      setIsConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-100 flex items-center justify-center'>
        <div className='text-lg text-gray-600'>
          Gönderi detayları yükleniyor...
        </div>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className='min-h-screen bg-gray-100 flex items-center justify-center'>
        <div className='text-center'>
          <Package className='w-16 h-16 mx-auto mb-4 text-gray-400' />
          <h2 className='text-xl font-semibold text-gray-900 mb-2'>
            Gönderi Bulunamadı
          </h2>
          <p className='text-gray-600 mb-4'>Aradığınız gönderi bulunamadı.</p>
          <button
            onClick={() => navigate('/individual/my-shipments')}
            className='px-4 py-2 bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 text-white rounded-md transition-all duration-200 shadow-md hover:shadow-lg'
          >
            Gönderilerime Dön
          </button>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(shipment.status);
  const priorityInfo = getPriorityInfo(shipment.priority);
  const cargoInfo = getCargoTypeInfo(shipment.cargoDetails.type);

  return (
    <div className='min-h-screen bg-gray-100 text-gray-800 font-sans'>
      {/* Header */}
      <header className='bg-white shadow-sm border-b border-gray-200 py-4 px-8'>
        <div className='flex items-center justify-between max-w-7xl mx-auto'>
          <div className='flex items-center space-x-4'>
            <button
              onClick={() => navigate('/individual/my-shipments')}
              className='p-2 text-gray-400 hover:text-gray-600'
            >
              <ArrowLeft className='w-5 h-5' />
            </button>
            <div>
              <h1 className='text-2xl font-bold text-gray-900'>
                {shipment.title}
              </h1>
              <p className='text-sm text-gray-600'>#{shipment.trackingCode}</p>
            </div>
          </div>
          <div className='flex items-center space-x-3'>
            <button className='flex items-center px-4 py-2 bg-gray-600 text-white rounded-md text-sm font-medium hover:bg-gray-700 transition-colors duration-200 shadow-md'>
              <Download className='w-4 h-4 mr-2' /> İndir
            </button>
            <button className='flex items-center px-4 py-2 bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 text-white rounded-md text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg'>
              <Share2 className='w-4 h-4 mr-2' /> Paylaş
            </button>
          </div>
        </div>
      </header>

      <main className='max-w-7xl mx-auto px-8 py-10'>
        {/* Status Banner */}
        <div className='bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-200'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-4'>
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  statusInfo.color === 'orange'
                    ? 'bg-orange-100'
                    : statusInfo.color === 'blue'
                      ? 'bg-blue-100'
                      : statusInfo.color === 'green'
                        ? 'bg-green-100'
                        : statusInfo.color === 'purple'
                          ? 'bg-purple-100'
                          : statusInfo.color === 'red'
                            ? 'bg-red-100'
                            : 'bg-gray-100'
                }`}
              >
                <div
                  className={`${
                    statusInfo.color === 'orange'
                      ? 'text-orange-600'
                      : statusInfo.color === 'blue'
                        ? 'text-blue-600'
                        : statusInfo.color === 'green'
                          ? 'text-green-600'
                          : statusInfo.color === 'purple'
                            ? 'text-purple-600'
                            : statusInfo.color === 'red'
                              ? 'text-red-600'
                              : 'text-gray-600'
                  }`}
                >
                  {statusInfo.icon}
                </div>
              </div>
              <div>
                <h2 className='text-xl font-semibold text-gray-900'>
                  {statusInfo.text}
                </h2>
                <p className='text-sm text-gray-600'>
                  {shipment.status === 'in_progress' && 'Gönderiniz yolda'}
                  {shipment.status === 'delivered' &&
                    'Gönderiniz teslim edildi'}
                  {shipment.status === 'pending' && 'Gönderiniz beklemede'}
                  {shipment.status === 'bidding' && 'Teklifler alınıyor'}
                  {shipment.status === 'accepted' && 'Teklif kabul edildi'}
                  {shipment.status === 'cancelled' && 'Gönderi iptal edildi'}
                </p>
              </div>
            </div>
            <div className='flex items-center space-x-2'>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  priorityInfo.color === 'red'
                    ? 'bg-red-100 text-red-800'
                    : priorityInfo.color === 'orange'
                      ? 'bg-orange-100 text-orange-800'
                      : priorityInfo.color === 'blue'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                }`}
              >
                {priorityInfo.text}
              </span>
              <span className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800'>
                {cargoInfo.icon} {cargoInfo.text}
              </span>
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Sol Kolon - Ana Bilgiler */}
          <div className='lg:col-span-2'>
            {/* Tab Navigation */}
            <div className='bg-white rounded-lg shadow-md border border-gray-200 mb-6'>
              <div className='border-b border-gray-200'>
                <nav className='flex space-x-8 px-6'>
                  {[
                    {
                      id: 'overview',
                      label: 'Genel Bakış',
                      icon: <Eye className='w-4 h-4' />,
                    },
                    {
                      id: 'tracking',
                      label: 'Takip',
                      icon: <Truck className='w-4 h-4' />,
                    },
                    {
                      id: 'offers',
                      label: 'Teklifler',
                      icon: <DollarSign className='w-4 h-4' />,
                    },
                    {
                      id: 'documents',
                      label: 'Belgeler',
                      icon: <FileText className='w-4 h-4' />,
                    },
                  ].map(tab => (
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

              <div className='p-6'>
                {/* Genel Bakış */}
                {activeTab === 'overview' && (
                  <div className='space-y-6'>
                    <div>
                      <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                        Gönderi Bilgileri
                      </h3>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Açıklama
                          </label>
                          <p className='text-gray-900'>
                            {shipment.description}
                          </p>
                        </div>
                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Takip Kodu
                          </label>
                          <p className='text-gray-900 font-mono'>
                            {shipment.trackingCode}
                          </p>
                        </div>
                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Ağırlık
                          </label>
                          <p className='text-gray-900'>
                            {shipment.cargoDetails.weight} kg
                          </p>
                        </div>
                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Hacim
                          </label>
                          <p className='text-gray-900'>
                            {shipment.cargoDetails.volume} m³
                          </p>
                        </div>
                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Değer
                          </label>
                          <p className='text-gray-900'>
                            ₺{shipment.cargoDetails.value.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Oluşturulma Tarihi
                          </label>
                          <p className='text-gray-900'>
                            {new Date(shipment.createdAt).toLocaleDateString(
                              'tr-TR'
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                        Adres Bilgileri
                      </h3>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        <div>
                          <h4 className='text-md font-medium text-gray-900 mb-2'>
                            Gönderici
                          </h4>
                          <div className='p-4 bg-gray-50 rounded-lg'>
                            <p className='font-medium text-gray-900'>
                              {shipment.fromAddress.name}
                            </p>
                            <p className='text-gray-600'>
                              {shipment.fromAddress.address}
                            </p>
                            <p className='text-gray-600'>
                              {shipment.fromAddress.district},{' '}
                              {shipment.fromAddress.city}{' '}
                              {shipment.fromAddress.postalCode}
                            </p>
                            {/* Telefon numarası gizlilik nedeniyle gösterilmiyor */}
                          </div>
                        </div>
                        <div>
                          <h4 className='text-md font-medium text-gray-900 mb-2'>
                            Alıcı
                          </h4>
                          <div className='p-4 bg-gray-50 rounded-lg'>
                            <p className='font-medium text-gray-900'>
                              {shipment.toAddress.name}
                            </p>
                            <p className='text-gray-600'>
                              {shipment.toAddress.address}
                            </p>
                            <p className='text-gray-600'>
                              {shipment.toAddress.district},{' '}
                              {shipment.toAddress.city}{' '}
                              {shipment.toAddress.postalCode}
                            </p>
                            {/* Telefon numarası gizlilik nedeniyle gösterilmiyor */}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                        Teslimat Bilgileri
                      </h3>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Tercih Edilen Tarih
                          </label>
                          <p className='text-gray-900'>
                            {new Date(
                              shipment.schedule.preferredDate
                            ).toLocaleDateString('tr-TR')}
                          </p>
                        </div>
                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Saat Tercihi
                          </label>
                          <p className='text-gray-900'>
                            {shipment.schedule.timePreference === 'sabah'
                              ? 'Sabah'
                              : shipment.schedule.timePreference ===
                                  'ogleden_sonra'
                                ? 'Öğleden Sonra'
                                : shipment.schedule.timePreference === 'aksam'
                                  ? 'Akşam'
                                  : 'Herhangi'}
                          </p>
                        </div>
                        <div>
                          <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Tahmini Teslimat
                          </label>
                          <p className='text-gray-900'>
                            {new Date(
                              shipment.schedule.estimatedDelivery
                            ).toLocaleDateString('tr-TR')}
                          </p>
                        </div>
                        {shipment.schedule.actualDelivery && (
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-2'>
                              Gerçek Teslimat
                            </label>
                            <p className='text-gray-900'>
                              {new Date(
                                shipment.schedule.actualDelivery
                              ).toLocaleDateString('tr-TR')}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Takip */}
                {activeTab === 'tracking' && (
                  <div className='space-y-6'>
                    <h3 className='text-lg font-semibold text-gray-900'>
                      Takip Geçmişi
                    </h3>
                    <div className='space-y-4'>
                      {shipment.tracking.map((update, index) => (
                        <div
                          key={update.id}
                          className='flex items-start space-x-4'
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              update.isDelivered
                                ? 'bg-green-100'
                                : 'bg-blue-100'
                            }`}
                          >
                            <div
                              className={`${
                                update.isDelivered
                                  ? 'text-green-600'
                                  : 'text-blue-600'
                              }`}
                            >
                              {update.isDelivered ? (
                                <CheckCircle className='w-4 h-4' />
                              ) : (
                                <Clock className='w-4 h-4' />
                              )}
                            </div>
                          </div>
                          <div className='flex-1'>
                            <div className='flex items-center justify-between'>
                              <h4 className='text-sm font-medium text-gray-900'>
                                {update.status}
                              </h4>
                              <span className='text-xs text-gray-500'>
                                {new Date(update.timestamp).toLocaleDateString(
                                  'tr-TR'
                                )}
                              </span>
                            </div>
                            <p className='text-sm text-gray-600'>
                              {update.description}
                            </p>
                            <p className='text-xs text-gray-500'>
                              {update.location}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Teklifler */}
                {activeTab === 'offers' && (
                  <div className='space-y-6'>
                    <div className='flex items-center justify-between'>
                      <h3 className='text-lg font-semibold text-gray-900'>
                        Teklifler
                      </h3>
                      <span className='text-sm text-gray-500'>
                        {shipment.offers.length} teklif
                      </span>
                    </div>
                    <div className='space-y-4'>
                      {shipment.offers.map(offer => (
                        <div
                          key={offer.id}
                          className='border border-gray-200 rounded-lg p-4'
                        >
                          <div className='flex items-center justify-between mb-3'>
                            <div className='flex items-center space-x-3'>
                              <div className='w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center'>
                                <User className='w-5 h-5 text-gray-600' />
                              </div>
                              <div>
                                <h4 className='text-sm font-medium text-gray-900'>
                                  {offer.carrierName}
                                </h4>
                                <p className='text-xs text-gray-500'>
                                  {offer.carrierCompany}
                                </p>
                              </div>
                            </div>
                            <div className='text-right'>
                              <p className='text-lg font-semibold text-gray-900'>
                                ₺{offer.price.toLocaleString()}
                              </p>
                              <p className='text-xs text-gray-500'>
                                {new Date(
                                  offer.estimatedDelivery
                                ).toLocaleDateString('tr-TR')}
                              </p>
                            </div>
                          </div>
                          <p className='text-sm text-gray-600 mb-3'>
                            {offer.message}
                          </p>
                          <div className='flex items-center justify-between'>
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                offer.status === 'accepted'
                                  ? 'bg-green-100 text-green-800'
                                  : offer.status === 'rejected'
                                    ? 'bg-red-100 text-red-800'
                                    : offer.status === 'withdrawn'
                                      ? 'bg-gray-100 text-gray-800'
                                      : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {offer.status === 'accepted'
                                ? 'Kabul Edildi'
                                : offer.status === 'rejected'
                                  ? 'Reddedildi'
                                  : offer.status === 'withdrawn'
                                    ? 'Geri Çekildi'
                                    : 'Beklemede'}
                            </span>
                            {offer.status === 'pending' && (
                              <div className='flex items-center space-x-2'>
                                <button
                                  onClick={() => handleAcceptOffer(offer.id)}
                                  className='px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700'
                                >
                                  Kabul Et
                                </button>
                                <button
                                  onClick={() => handleRejectOffer(offer.id)}
                                  className='px-3 py-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded text-sm transition-all duration-200 shadow-md hover:shadow-lg'
                                >
                                  Reddet
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Belgeler */}
                {activeTab === 'documents' && (
                  <div className='space-y-6'>
                    <div className='flex items-center justify-between'>
                      <h3 className='text-lg font-semibold text-gray-900'>
                        Belgeler
                      </h3>
                      <span className='text-sm text-gray-500'>
                        {shipment.documents.length} belge
                      </span>
                    </div>
                    <div className='space-y-4'>
                      {shipment.documents.map(document => (
                        <div
                          key={document.id}
                          className='border border-gray-200 rounded-lg p-4'
                        >
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center space-x-3'>
                              <div className='w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center'>
                                <FileText className='w-5 h-5 text-gray-600' />
                              </div>
                              <div>
                                <h4 className='text-sm font-medium text-gray-900'>
                                  {document.name}
                                </h4>
                                <p className='text-xs text-gray-500'>
                                  {document.type === 'contract'
                                    ? 'Sözleşme'
                                    : document.type === 'invoice'
                                      ? 'Fatura'
                                      : document.type === 'receipt'
                                        ? 'Makbuz'
                                        : 'Diğer'}
                                </p>
                              </div>
                            </div>
                            <div className='flex items-center space-x-2'>
                              <span className='text-xs text-gray-500'>
                                {new Date(
                                  document.uploadedAt
                                ).toLocaleDateString('tr-TR')}
                              </span>
                              <button
                                onClick={() => handleDownloadDocument(document)}
                                className='p-2 text-gray-400 hover:text-gray-600'
                              >
                                <Download className='w-4 h-4' />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sağ Kolon - Taşıyıcı ve İletişim */}
          <div className='space-y-6'>
            {/* Taşıyıcı Bilgileri */}
            {shipment.carrier && (
              <div className='bg-white rounded-lg shadow-md p-6 border border-gray-200'>
                <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                  Taşıyıcı Bilgileri
                </h3>
                <div className='flex items-center space-x-4 mb-4'>
                  <div className='w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center'>
                    {shipment.carrier.avatar ? (
                      <img
                        src={shipment.carrier.avatar}
                        alt={shipment.carrier.name}
                        className='w-12 h-12 rounded-full object-cover'
                      />
                    ) : (
                      <User className='w-6 h-6 text-gray-400' />
                    )}
                  </div>
                  <div>
                    <h4 className='text-md font-medium text-gray-900'>
                      {shipment.carrier.name}
                    </h4>
                    <p className='text-sm text-gray-600'>
                      {shipment.carrier.company}
                    </p>
                    <div className='flex items-center space-x-1'>
                      <Star className='w-4 h-4 text-yellow-400 fill-current' />
                      <span className='text-sm text-gray-600'>
                        {shipment.carrier.rating}
                      </span>
                    </div>
                  </div>
                </div>
                <div className='space-y-2 mb-4'>
                  <div className='flex items-center space-x-2'>
                    <Phone className='w-4 h-4 text-gray-500' />
                    <span className='text-sm text-gray-900'>
                      {shipment.carrier.phone}
                    </span>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <MessageSquare className='w-4 h-4 text-gray-500' />
                    <span className='text-sm text-gray-900'>
                      {shipment.carrier.email}
                    </span>
                  </div>
                </div>
                <div className='flex space-x-2'>
                  <button
                    onClick={handleContactCarrier}
                    className='flex-1 px-4 py-2 bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 text-white rounded-md text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg'
                  >
                    <Phone className='w-4 h-4 inline mr-2' />
                    Ara
                  </button>
                  <button className='flex-1 px-4 py-2 bg-gray-600 text-white rounded-md text-sm font-medium hover:bg-gray-700 transition-colors duration-200'>
                    <MessageSquare className='w-4 h-4 inline mr-2' />
                    Mesaj
                  </button>
                </div>
              </div>
            )}

            {/* Hızlı İşlemler */}
            <div className='bg-white rounded-lg shadow-md p-6 border border-gray-200'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                Hızlı İşlemler
              </h3>
              <div className='space-y-3'>
                {shipment?.status === 'delivered' && (
                  <button
                    onClick={handleConfirmDelivery}
                    disabled={isConfirming}
                    className='w-full flex items-center justify-center px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-md text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    {isConfirming ? (
                      <>
                        <RefreshCw className='w-4 h-4 mr-2 animate-spin' />
                        Onaylanıyor...
                      </>
                    ) : (
                      <>
                        <CheckCircle className='w-4 h-4 mr-2' />
                        Teslimatı Onayla
                      </>
                    )}
                  </button>
                )}
                <button className='w-full flex items-center justify-center px-4 py-2 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white rounded-md text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg'>
                  <RefreshCw className='w-4 h-4 mr-2' />
                  Durumu Güncelle
                </button>
                <button className='w-full flex items-center justify-center px-4 py-2 bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white rounded-md text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg'>
                  <XCircle className='w-4 h-4 mr-2' />
                  İptal Et
                </button>
              </div>
            </div>

            {/* İstatistikler */}
            <div className='bg-white rounded-lg shadow-md p-6 border border-gray-200'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                İstatistikler
              </h3>
              <div className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-gray-600'>Toplam Teklif</span>
                  <span className='text-sm font-medium text-gray-900'>
                    {shipment.offers.length}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-gray-600'>
                    Kabul Edilen Teklif
                  </span>
                  <span className='text-sm font-medium text-gray-900'>
                    {
                      shipment.offers.filter(o => o.status === 'accepted')
                        .length
                    }
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-gray-600'>Toplam Belge</span>
                  <span className='text-sm font-medium text-gray-900'>
                    {shipment.documents.length}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-gray-600'>
                    Takip Güncellemesi
                  </span>
                  <span className='text-sm font-medium text-gray-900'>
                    {shipment.tracking.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default IndividualShipmentDetail;











