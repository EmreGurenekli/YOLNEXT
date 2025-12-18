import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import Breadcrumb from '../../components/common/Breadcrumb';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import SuccessMessage from '../../components/common/SuccessMessage';
import MessagingModal from '../../components/MessagingModal';
import RatingModal from '../../components/RatingModal';
import { createApiUrl } from '../../config/api';
import { formatCurrency, formatDate } from '../../utils/format';
import { getStatusInfo, getStatusDescription } from '../../utils/shipmentStatus';

interface ActiveShipment {
  id: string;
  trackingNumber: string;
  from: string;
  to: string;
  status: string;
  priority: string;
  weight: number;
  volume: number;
  value: number;
  price?: number;
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

  useEffect(() => {
    loadActiveShipments();
  }, [pagination.page, statusFilter]);

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
      if (statusFilter !== 'all') {
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
        const rawShipments = data.data || data.shipments || (Array.isArray(data) ? data : []);
        
        console.log('🔍 [DEBUG] ActiveShipments - Raw shipments from backend:', rawShipments);
        
        // Map backend data to frontend format
        const mappedShipments = rawShipments.map((shipment: any) => {
          // Build driver object - only if driver is actually assigned
          // Check if driver_id exists in shipment data
          const hasDriver = shipment.driver_id || shipment.driverId || (shipment.driver && shipment.driver.id);
          const driver = hasDriver && shipment.driver ? {
            name: shipment.driver.name || shipment.driverName || 'Atanmadı',
            phone: shipment.driver.phone || shipment.driverPhone || '',
            vehicle: shipment.driver.vehicle || shipment.driverVehicle || '',
          } : null;
          
          console.log(`🔍 [DEBUG] ActiveShipments - Shipment ID: ${shipment.id}, hasDriver: ${hasDriver}, driver:`, driver);

          // Build shipper object with fallback logic
          // PRIVACY: Gönderici telefon numarası gizlenmeli - nakliyeci sadece mesaj yoluyla ulaşabilir
          // IMPORTANT: Include userId for messaging - this is the shipper's user ID
          const shipperUserId = shipment.userId || shipment.user_id || shipment.shipper?.id || shipment.shipper?.userId;
          const shipper = shipment.shipper ? {
            id: shipperUserId || shipment.shipper.id || shipment.shipper.userId,
            name: shipment.shipper.name || shipment.ownerName || shipment.shipperName || shipment.senderName || shipment.sender || shipment.contactPerson || '',
            company: shipment.shipper.company || shipment.ownerCompany || shipment.shipperCompany || shipment.companyName || '',
            email: shipment.shipper.email || shipment.ownerEmail || shipment.senderEmail || '',
            // phone: HIDDEN - Gizlilik nedeniyle gönderici telefon numarası gösterilmemektedir
          } : {
            id: shipperUserId,
            name: shipment.ownerName || shipment.shipperName || shipment.senderName || shipment.sender || shipment.contactPerson || '',
            company: shipment.ownerCompany || shipment.shipperCompany || shipment.companyName || '',
            email: shipment.ownerEmail || shipment.senderEmail || '',
            // phone: HIDDEN - Gizlilik nedeniyle gönderici telefon numarası gösterilmemektedir
          };

          return {
            id: shipment.id?.toString() || '',
            trackingNumber: shipment.trackingNumber || shipment.tracking_code || shipment.id?.toString() || '',
            from: shipment.pickupCity || shipment.fromCity || `${shipment.pickupDistrict || ''} ${shipment.pickupCity || ''}`.trim() || 'Bilinmiyor',
            to: shipment.deliveryCity || shipment.toCity || `${shipment.deliveryDistrict || ''} ${shipment.deliveryCity || ''}`.trim() || 'Bilinmiyor',
            status: shipment.status || 'pending',
            priority: shipment.priority || 'normal',
            weight: shipment.weight ? (typeof shipment.weight === 'number' ? shipment.weight : parseFloat(shipment.weight) || 0) : 0,
            volume: shipment.volume ? (typeof shipment.volume === 'number' ? shipment.volume : parseFloat(shipment.volume) || 0) : 0,
            value: shipment.displayPrice || shipment.price || shipment.value || shipment.offerPrice || 0,
            pickupDate: shipment.pickupDate || shipment.pickup_date || '',
            deliveryDate: shipment.deliveryDate || shipment.delivery_date || '',
            driver_id: shipment.driver_id || shipment.driverId || null,
            driver,
            shipper,
            createdAt: shipment.createdAt || shipment.created_at || new Date().toISOString(),
          };
        });
        
        setShipments(mappedShipments);
        
        if (data.pagination) {
          setPagination(prev => ({
            ...prev,
            page: data.pagination.page,
            pages: data.pagination.pages,
            total: data.pagination.total,
          }));
        }
      } else {
        console.error('Failed to load active shipments');
        setShipments([]);
      }
    } catch (error) {
      console.error('Error loading active shipments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDrivers = async () => {
    try {
      setLoadingDrivers(true);
      const storedUser = localStorage.getItem('user');
      const userId = storedUser ? (JSON.parse(storedUser)?.id || '') : '';
      console.log('[DEBUG] ActiveShipments - Loading drivers for userId:', userId);
      const response = await fetch(createApiUrl('/api/drivers/nakliyeci'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
          'X-User-Id': userId
        }
      });
      
      console.log('[DEBUG] ActiveShipments - Drivers API response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('[DEBUG] ActiveShipments - Drivers API response data:', data);
        // Show all drivers for now (available and busy)
        // TODO: Add filter option in UI to show only available drivers
        setDrivers(data.drivers || []);
        console.log('[DEBUG] ActiveShipments - Set drivers count:', (data.drivers || []).length);
      } else {
        const errorText = await response.text();
        console.error('[DEBUG] ActiveShipments - Drivers API error:', response.status, errorText);
        setDrivers([]);
      }
    } catch (error) {
      console.error('[DEBUG] ActiveShipments - Error loading drivers:', error);
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
    if (shipment.shipper && shipment.shipper.name) {
      setSelectedShipper({
        id: shipment.id, // Use shipment ID as shipper ID for messaging
        name: shipment.shipper.name,
        email: '', // We don't have email in shipper object
        type: 'individual'
      });
      setSelectedShipmentId(shipment.id);
      setShowMessagingModal(true);
    }
  };

  const handleDirectAssign = async () => {
    if (!selectedDriver || !selectedShipment) return;

    try {
      setIsAssigning(true);
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
        setSuccessMessage('Taşıyıcı başarıyla atandı!');
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        setShowAssignModal(false);
        setSelectedShipment(null);
        setSelectedDriver('');
        await loadActiveShipments();
      } else {
        const errorData = await response.json().catch(() => ({}));
        setErrorMessage(errorData.message || 'Taşıyıcı atanamadı. Lütfen tekrar deneyin.');
        setShowError(true);
        setTimeout(() => setShowError(false), 5000);
      }
    } catch (error) {
      console.error('Error assigning driver:', error);
      setErrorMessage('Taşıyıcı atanamadı. Lütfen tekrar deneyin.');
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
    } finally {
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
      const response = await fetch(createApiUrl('/api/carrier-market/listings'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setSuccessMessage('İlan başarıyla oluşturuldu! Taşıyıcılar teklif vermeye başlayacak.');
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        setShowAssignModal(false);
        setSelectedShipment(null);
        setMinPrice('');
        await loadActiveShipments();
      } else {
        const errorData = await response.json().catch(() => ({}));
        setErrorMessage(errorData.message || 'İlan oluşturulamadı. Lütfen tekrar deneyin.');
        setShowError(true);
        setTimeout(() => setShowError(false), 5000);
      }
    } catch (error) {
      console.error('Error creating listing:', error);
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
          matchesStatus = (shipment.status === 'offer_accepted' || shipment.status === 'accepted') && 
                         (!shipment.driver || !shipment.driver_id || (shipment.driver && shipment.driver.name === 'Atanmadı'));
          break;
        case 'active':
          // Aktif: in_progress/in_transit/delivered (driver varsa)
          matchesStatus = (shipment.status === 'in_progress' || shipment.status === 'in_transit' || shipment.status === 'delivered') &&
                         !!(shipment.driver && shipment.driver_id && shipment.driver.name !== 'Atanmadı');
          break;
        case 'delivered':
          matchesStatus = shipment.status === 'delivered';
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

        {/* Header */}
        <div className='text-center mb-8 sm:mb-12'>
          <div className='flex justify-center mb-4 sm:mb-6'>
            <div className='w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg'>
              <Package className='w-6 h-6 sm:w-8 sm:h-8 text-white' />
            </div>
          </div>
          <h1 className='text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-2 sm:mb-3'>
            Aktif Yükler
          </h1>
          <p className='text-sm sm:text-base md:text-lg text-slate-600 px-4'>
            Tüm gönderilerinizi tek ekranda görüntüleyin ve yönetin
          </p>
          {/* Bilgilendirme */}
          <div className='mt-4 max-w-2xl mx-auto'>
            <div className='bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800'>
              <p className='font-semibold mb-1'>💡 Bilgi:</p>
              <p>Bu sayfada teklif kabul edilen tüm gönderilerinizi görebilirsiniz. Taşıyıcı atama, takip ve rota optimizasyonu işlemlerini buradan yapabilirsiniz.</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className='flex justify-center mb-8'>
          <div className='flex flex-wrap gap-2 sm:gap-3'>
            <button className='flex items-center gap-2 px-4 py-2 bg-white text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-lg border border-slate-200'>
              <RefreshCw className='w-4 h-4' />
              Yenile
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className='bg-white rounded-xl p-6 shadow-lg border border-gray-200 mb-6'>
          <div className='flex flex-col md:flex-row gap-4'>
            <div className='flex-1'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
                <input
                  type='text'
                  placeholder='Yük ara...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                />
              </div>
            </div>
            <div className='flex gap-2'>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              >
                <option value='all'>Tümü</option>
                <option value='waiting_driver'>Taşıyıcı Bekliyor</option>
                <option value='active'>Aktif</option>
                <option value='delivered'>Tamamlanan</option>
                <option value='cancelled'>İptal Edilen</option>
              </select>
            </div>
          </div>
        </div>

        {/* Shipments List */}
        {filteredShipments.length > 0 ? (
          <div className='grid gap-6'>
            {filteredShipments.map((shipment, index) => (
              <div
                key={`${shipment.id}-${shipment.trackingNumber}-${index}`}
                className='bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow'
              >
                <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
                  <div className='flex-1'>
                    <div className='flex items-center gap-3 mb-3'>
                      <span className='text-lg font-bold text-blue-600'>
                        #{shipment.trackingNumber}
                      </span>
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
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
                      <div>
                        <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                          Güzergah
                        </h3>
                        <div className='flex items-center gap-2 text-gray-600'>
                          <MapPin className='w-4 h-4' />
                          <span>
                            {shipment.from} → {shipment.to}
                          </span>
                        </div>
                      </div>

                      <div>
                        <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                          Yük Bilgileri
                        </h3>
                        <div className='flex items-center gap-4 text-sm text-gray-600'>
                          {shipment.volume && shipment.volume > 0 && (
                          <div className='flex items-center gap-1'>
                            <Ruler className='w-4 h-4' />
                              <span>{typeof shipment.volume === 'number' ? shipment.volume.toFixed(2) : shipment.volume} m³</span>
                          </div>
                          )}
                          {(!shipment.volume || shipment.volume === 0) && (
                            <span className='text-gray-400'>Hacim bilgisi yok</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div>
                        <h4 className='font-semibold text-gray-900 mb-2'>
                          Şoför Bilgileri
                        </h4>
                        {shipment.driver && shipment.driver.name !== 'Atanmadı' ? (
                          <div className='text-sm text-gray-600'>
                            <p>
                              <strong>Ad:</strong> {shipment.driver.name}
                            </p>
                            {shipment.driver.vehicle && (
                              <p>
                                <strong>Araç:</strong> {shipment.driver.vehicle}
                              </p>
                            )}
                            {shipment.driver.phone && (
                              <p>
                                <strong>Tel:</strong> {shipment.driver.phone}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className='text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3'>
                            <p className='font-medium'>⏳ Taşıyıcı Bekleniyor</p>
                            <p className='text-xs mt-1 text-amber-700'>Taşıyıcı ataması yapılmadı</p>
                          </div>
                        )}
                      </div>

                      <div>
                        <h4 className='font-semibold text-gray-900 mb-2'>
                          Gönderici Bilgileri
                        </h4>
                        <div className='text-sm text-gray-600'>
                          <p>
                            <strong>Ad:</strong> {shipment.shipper.name || 'Bilinmiyor'}
                          </p>
                          {shipment.shipper.company && (
                          <p>
                            <strong>Şirket:</strong> {shipment.shipper.company}
                          </p>
                          )}
                          <div className='mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700'>
                            <strong>Not:</strong> Gönderici ile iletişim için mesaj sistemi kullanın. Telefon numarası gizlilik nedeniyle gösterilmemektedir.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className='flex flex-col gap-2'>
                    <div className='text-right mb-4'>
                      <div className='text-2xl font-bold text-gray-900'>
                        {formatCurrency(shipment.value || shipment.price || 0)}
                      </div>
                      <div className='text-sm text-gray-500'>Toplam Tutar</div>
                    </div>

                    <div className='flex flex-col gap-2'>
                      {!shipment.driver || !shipment.driver_id || (shipment.driver && shipment.driver.name === 'Atanmadı') ? (
                        <button
                          onClick={() => handleAssignClick(shipment)}
                          className='w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2'
                        >
                          <UserPlus className='w-4 h-4' />
                          Taşıyıcıya Ata
                        </button>
                      ) : (
                        <div className='text-sm text-green-600 mb-2 text-center bg-green-50 border border-green-200 rounded-lg p-2'>
                          <CheckCircle2 className='w-4 h-4 inline mr-1' />
                          Taşıyıcı Atandı
                        </div>
                      )}
                    <div className='flex gap-2'>
                      <button className='flex-1 bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2'>
                        <Eye className='w-4 h-4' />
                        Detay
                      </button>
                      <button 
                        onClick={() => handleMessageClick(shipment)}
                        className='flex-1 bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2'
                      >
                        <MessageSquare className='w-4 h-4' />
                        Mesaj
                      </button>
                    </div>
                    {shipment.driver && shipment.driver_id && shipment.driver.name !== 'Atanmadı' && (
                      <button
                        onClick={() => navigate(`/nakliyeci/route-planner?shipmentId=${shipment.id}`)}
                        className='w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2'
                        title='Rota üzerinde ek gönderiler bul ve optimize et'
                      >
                        <Route className='w-4 h-4' />
                        Rota Optimize Et
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
                        className='w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2'
                      >
                        <Star className='w-4 h-4' />
                        Göndericiyi Değerlendir
                      </button>
                    )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Package}
            title='Aktif yük bulunamadı'
            description='Henüz aktif yükünüz bulunmuyor.'
            action={{
              label: 'Yük Pazarı',
              onClick: () => navigate('/nakliyeci/jobs'),
            }}
          />
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
                  <p><strong>Takip No:</strong> #{selectedShipment.trackingNumber}</p>
                  <p><strong>Güzergah:</strong> {selectedShipment.from} → {selectedShipment.to}</p>
                </div>
              </div>

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
                      <p className="text-slate-600 font-medium">Müsait taşıyıcı bulunamadı</p>
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
                      Minimum Fiyat (₺) - Opsiyonel
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
                      Taşıyıcılar bu fiyatın üzerinde teklif verebilir
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
