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
} from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import SuccessMessage from '../../components/common/SuccessMessage';
import { createApiUrl } from '../../config/api';
import { formatCurrency, formatDate } from '../../utils/format';

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
  pickupDate: string;
  deliveryDate: string;
  driver: {
    name: string;
    phone: string;
    vehicle: string;
  };
  shipper: {
    name: string;
    company: string;
    phone: string;
  };
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

  useEffect(() => {
    loadActiveShipments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, statusFilter]);

  useEffect(() => {
    if (showAssignModal && assignMode === 'direct') {
      loadDrivers();
    }
  }, [showAssignModal, assignMode]);

  const loadActiveShipments = async () => {
    try {
      setIsLoading(true);

      // Gerçek API çağrısı
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      const response = await fetch(
        `${createApiUrl('/api/shipments/nakliyeci/active')}?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setShipments(data.shipments || (Array.isArray(data) ? data : []));
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
      const response = await fetch(createApiUrl('/api/drivers/nakliyeci'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
          'X-User-Id': userId
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDrivers((data.drivers || []).filter((d: Driver) => d.status === 'available'));
      } else {
        setDrivers([]);
      }
    } catch (error) {
      console.error('Error loading drivers:', error);
      setDrivers([]);
    } finally {
      setLoadingDrivers(false);
    }
  };

  const handleAssignClick = (shipment: ActiveShipment) => {
    setSelectedShipment(shipment);
    setAssignMode('direct');
    setShowAssignModal(true);
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
        alert('Taşıyıcı atanamadı. Lütfen tekrar deneyin.');
      }
    } catch (error) {
      console.error('Error assigning driver:', error);
      alert('Taşıyıcı atanamadı. Lütfen tekrar deneyin.');
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
        alert('İlan oluşturulamadı. Lütfen tekrar deneyin.');
      }
    } catch (error) {
      console.error('Error creating listing:', error);
      alert('İlan oluşturulamadı. Lütfen tekrar deneyin.');
    } finally {
      setIsAssigning(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
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
    const matchesSearch =
      shipment.trackingNumber
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      shipment.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.to.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.driver.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || shipment.status === statusFilter;

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
            Devam eden taşımalarınızı takip edin
          </p>
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
                <option value='all'>Tüm Durumlar</option>
                <option value='pending'>Bekliyor</option>
                <option value='in_transit'>Yolda</option>
                <option value='delivered'>Teslim Edildi</option>
                <option value='cancelled'>İptal Edildi</option>
              </select>
            </div>
          </div>
        </div>

        {/* Shipments List */}
        {filteredShipments.length > 0 ? (
          <div className='grid gap-6'>
            {filteredShipments.map(shipment => (
              <div
                key={shipment.id}
                className='bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow'
              >
                <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
                  <div className='flex-1'>
                    <div className='flex items-center gap-3 mb-3'>
                      <span className='text-lg font-bold text-blue-600'>
                        #{shipment.trackingNumber}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(shipment.status)}`}
                      >
                        {getStatusText(shipment.status)}
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
                          <div className='flex items-center gap-1'>
                            <Weight className='w-4 h-4' />
                            <span>{shipment.weight} kg</span>
                          </div>
                          <div className='flex items-center gap-1'>
                            <Ruler className='w-4 h-4' />
                            <span>{shipment.volume} m³</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div>
                        <h4 className='font-semibold text-gray-900 mb-2'>
                          Şoför Bilgileri
                        </h4>
                        <div className='text-sm text-gray-600'>
                          <p>
                            <strong>Ad:</strong> {shipment.driver.name}
                          </p>
                          <p>
                            <strong>Araç:</strong> {shipment.driver.vehicle}
                          </p>
                          <p>
                            <strong>Tel:</strong> {shipment.driver.phone}
                          </p>
                        </div>
                      </div>

                      <div>
                        <h4 className='font-semibold text-gray-900 mb-2'>
                          Gönderici Bilgileri
                        </h4>
                        <div className='text-sm text-gray-600'>
                          <p>
                            <strong>Ad:</strong> {shipment.shipper.name}
                          </p>
                          <p>
                            <strong>Şirket:</strong> {shipment.shipper.company}
                          </p>
                          <p>
                            <strong>Tel:</strong> {shipment.shipper.phone}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className='flex flex-col gap-2'>
                    <div className='text-right mb-4'>
                      <div className='text-2xl font-bold text-gray-900'>
                        {formatCurrency(shipment.value)}
                      </div>
                      <div className='text-sm text-gray-500'>Toplam Tutar</div>
                    </div>

                    <div className='flex flex-col gap-2'>
                      {!shipment.driver || !shipment.driver.name ? (
                        <button
                          onClick={() => handleAssignClick(shipment)}
                          className='w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2'
                        >
                          <UserPlus className='w-4 h-4' />
                          Taşıyıcıya Ata
                        </button>
                      ) : (
                        <div className='text-sm text-slate-600 mb-2 text-center'>
                          <CheckCircle2 className='w-4 h-4 inline mr-1 text-green-600' />
                          Taşıyıcı Atandı
                        </div>
                      )}
                    <div className='flex gap-2'>
                      <button className='flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2'>
                        <Eye className='w-4 h-4' />
                        Detay
                      </button>
                      <button className='flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2'>
                        <MessageSquare className='w-4 h-4' />
                        Mesaj
                      </button>
                      </div>
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
                  <p><strong>Ağırlık:</strong> {selectedShipment.weight} kg</p>
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
                            {driver.name} - {driver.vehicle.plate} ({driver.vehicle.type})
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
      </div>
    </div>
  );
};

export default ActiveShipments;
