import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Search,
  Filter,
  MapPin,
  Clock,
  DollarSign,
  Eye,
  Truck,
  Calendar,
  User,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  Plus,
  Download,
  MoreVertical,
  FileText,
} from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import Modal from '../../components/common/Modal';
import SuccessMessage from '../../components/common/SuccessMessage';

const NakliyeciShipments: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [openingListing, setOpeningListing] = useState<number | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const breadcrumbItems = [
    { label: 'Ana Sayfa', icon: <Package className='w-4 h-4' /> },
    { label: 'Gönderiler', icon: <Package className='w-4 h-4' /> },
  ];

  // Gerçek API'den gönderileri yükle
  const [shipments, setShipments] = useState<any[]>([]);
  const [isLoadingShipments, setIsLoadingShipments] = useState(true);

  useEffect(() => {
    const loadShipments = async () => {
      try {
        setIsLoadingShipments(true);
        const userRaw = localStorage.getItem('user');
        const userId = userRaw ? JSON.parse(userRaw || '{}').id : undefined;
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/shipments/nakliyeci', {
          headers: {
            Authorization: `Bearer ${token || ''}`,
            'X-User-Id': userId || '',
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();

        if (data.success) {
          setShipments(data.data);
        } else {
          console.error('Gönderiler yüklenemedi:', data.message);
          setShipments([]);
        }
      } catch (error) {
        console.error('API hatası:', error);
        setShipments([]);
      } finally {
        setIsLoadingShipments(false);
      }
    };

    loadShipments();
  }, []);

  const openToCarriers = async (shipmentId: number) => {
    try {
      setOpeningListing(shipmentId);
      const userRaw = localStorage.getItem('user');
      const userId = userRaw ? JSON.parse(userRaw || '{}').id : undefined;
      const token = localStorage.getItem('authToken');
      const res = await fetch('/api/carrier-market/listings', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token || ''}`,
          'X-User-Id': userId || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shipmentId }),
      });
      if (!res.ok) throw new Error('İlan açılamadı');
      setSuccessMessage('İlan taşıyıcılara açıldı');
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        navigate('/nakliyeci/listings');
      }, 2000);
    } catch (e) {
      setErrorMessage('İlan açılamadı. Lütfen tekrar deneyin.');
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
    } finally {
      setOpeningListing(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className='w-4 h-4 text-yellow-500' />;
      case 'in_transit':
        return <Truck className='w-4 h-4 text-blue-500' />;
      case 'delivered':
        return <CheckCircle className='w-4 h-4 text-green-500' />;
      case 'cancelled':
        return <XCircle className='w-4 h-4 text-red-500' />;
      default:
        return <AlertCircle className='w-4 h-4 text-gray-500' />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Beklemede';
      case 'in_transit':
        return 'Yolda';
      case 'delivered':
        return 'Teslim Edildi';
      case 'cancelled':
        return 'İptal Edildi';
      default:
        return 'Bilinmiyor';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_transit':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredShipments = shipments.filter(shipment => {
    const matchesSearch =
      shipment.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.trackingNumber
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      shipment.from?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.to?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || shipment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const sortedShipments = [...filteredShipments].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return (
          new Date(b.date || b.createdAt).getTime() -
          new Date(a.date || a.createdAt).getTime()
        );
      case 'price':
        return (b.price || 0) - (a.price || 0);
      case 'status':
        return a.status.localeCompare(b.status);
      default:
        return 0;
    }
  });

  if (isLoadingShipments) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50'>
        <LoadingState />
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50'>
      <div className='max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6'>
        <Breadcrumb items={breadcrumbItems} />

        {/* Header */}
        <div className='text-center mb-8 sm:mb-12'>
          <div className='flex justify-center mb-4 sm:mb-6'>
            <div className='w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg'>
              <Package className='w-6 h-6 sm:w-8 sm:h-8 text-white' />
            </div>
          </div>
          <h1 className='text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-2 sm:mb-3'>
            Gönderilerim
          </h1>
          <p className='text-sm sm:text-base md:text-lg text-slate-600 px-4'>
            Taşıdığınız gönderileri görüntüleyin ve yönetin
          </p>
        </div>

        {/* Tabs + Filters */}
        <div className='bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6'>
          {/* Tabs */}
          <div className='flex items-center gap-2 mb-4'>
            {[
              { key: 'in_transit', label: 'Aktif' },
              { key: 'delivered', label: 'Tamamlanan' },
              { key: 'cancelled', label: 'İptal' },
              { key: 'all', label: 'Tümü' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                  statusFilter === tab.key
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className='flex flex-col sm:flex-row gap-4'>
            <div className='flex-1'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
                <input
                  type='text'
                  placeholder='Gönderi ara...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                />
              </div>
            </div>

            <div className='flex gap-3'>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className='px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              >
                <option value='date'>Tarihe Göre</option>
                <option value='price'>Fiyata Göre</option>
                <option value='status'>Duruma Göre</option>
              </select>
            </div>
          </div>
        </div>

        {/* Shipments List */}
        {sortedShipments.length === 0 ? (
          <EmptyState
            icon={Package}
            title='Gönderi bulunamadı'
            description='Arama kriterlerinize uygun gönderi bulunamadı.'
          />
        ) : (
          <div className='space-y-4'>
            {sortedShipments.map(shipment => (
              <div
                key={shipment.id}
                className='bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow'
              >
                <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
                  <div className='flex-1'>
                    <div className='flex items-center justify-between mb-4'>
                      <div className='flex items-center gap-3'>
                        <div className='w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center'>
                          <Package className='w-5 h-5 text-blue-600' />
                        </div>
                        <div>
                          <h3 className='font-semibold text-gray-900'>
                            {shipment.title || 'Gönderi'}
                          </h3>
                          <p className='text-sm text-gray-600'>
                            Takip No: {shipment.trackingNumber || shipment.id}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-2 ${getStatusColor(shipment.status)}`}
                      >
                        {getStatusIcon(shipment.status)}
                        <span>{getStatusText(shipment.status)}</span>
                      </div>
                    </div>

                    <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4'>
                      <div className='flex items-center space-x-2'>
                        <MapPin className='w-4 h-4 text-gray-400' />
                        <div>
                          <p className='text-sm text-gray-600'>Gönderen</p>
                          <p className='font-medium text-gray-900'>
                            {shipment.sender || 'Bilinmiyor'}
                          </p>
                        </div>
                      </div>
                      <div className='flex items-center space-x-2'>
                        <MapPin className='w-4 h-4 text-gray-400' />
                        <div>
                          <p className='text-sm text-gray-600'>Alıcı</p>
                          <p className='font-medium text-gray-900'>
                            {shipment.receiver || 'Bilinmiyor'}
                          </p>
                        </div>
                      </div>
                      <div className='flex items-center space-x-2'>
                        <Calendar className='w-4 h-4 text-gray-400' />
                        <div>
                          <p className='text-sm text-gray-600'>Tarih</p>
                          <p className='font-medium text-gray-900'>
                            {shipment.date || shipment.createdAt}
                          </p>
                        </div>
                      </div>
                      <div className='flex items-center space-x-2'>
                        <DollarSign className='w-4 h-4 text-gray-400' />
                        <div>
                          <p className='text-sm text-gray-600'>Fiyat</p>
                          <p className='font-medium text-gray-900'>
                            ₺{shipment.price || 0}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className='text-sm text-gray-600'>
                      <p>
                        <span className='font-medium'>Ağırlık:</span>{' '}
                        {shipment.weight || 'Bilinmiyor'} •{' '}
                        <span className='font-medium'>Kategori:</span>{' '}
                        {shipment.category || 'Bilinmiyor'}
                      </p>
                      {shipment.description && (
                        <p>
                          <span className='font-medium'>Açıklama:</span>{' '}
                          {shipment.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className='flex flex-col space-y-2 lg:min-w-[200px]'>
                    <div className='text-xs text-gray-500 text-right'>
                      {shipment.estimatedDelivery &&
                        `Tahmini Teslimat: ${shipment.estimatedDelivery}`}
                    </div>

                    <div className='flex flex-col space-y-2'>
                      <button
                        onClick={() => {
                          setSelectedShipment(shipment);
                          setShowDetailsModal(true);
                        }}
                        className='w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2'
                      >
                        <Eye className='w-4 h-4' />
                        <span>Detaylar</span>
                      </button>
                      {(shipment.status === 'accepted' ||
                        shipment.status === 'in_transit') && (
                        <button
                          onClick={() => openToCarriers(shipment.id)}
                          disabled={openingListing === shipment.id}
                          className='w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50'
                        >
                          <FileText className='w-4 h-4' />
                          <span>
                            {openingListing === shipment.id
                              ? 'Açılıyor...'
                              : 'Taşıyıcılara Aç'}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedShipment && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          title='Gönderi Detayları'
        >
          <div className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Gönderen
                </label>
                <p className='text-gray-900'>
                  {selectedShipment.sender || 'Bilinmiyor'}
                </p>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Alıcı
                </label>
                <p className='text-gray-900'>
                  {selectedShipment.receiver || 'Bilinmiyor'}
                </p>
              </div>
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Gönderi Tarihi
                </label>
                <p className='text-gray-900'>
                  {selectedShipment.date || selectedShipment.createdAt}
                </p>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Tahmini Teslimat
                </label>
                <p className='text-gray-900'>
                  {selectedShipment.estimatedDelivery || 'Bilinmiyor'}
                </p>
              </div>
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Ağırlık
                </label>
                <p className='text-gray-900'>
                  {selectedShipment.weight || 'Bilinmiyor'}
                </p>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Fiyat
                </label>
                <p className='text-gray-900'>₺{selectedShipment.price || 0}</p>
              </div>
            </div>

            {selectedShipment.description && (
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Açıklama
                </label>
                <p className='text-gray-900'>{selectedShipment.description}</p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Success Message */}
      {showSuccess && (
        <SuccessMessage
          message={successMessage}
          isVisible={showSuccess}
          onClose={() => setShowSuccess(false)}
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
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default NakliyeciShipments;
