import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

interface Shipment {
  id: number;
  title: string;
  trackingCode: string;
  from: string;
  to: string;
  status: string;
  carrier: string;
  rating: number;
  value: number;
  weight: number;
  volume: number;
  estimatedDelivery: string;
  statusText: string;
  progress: number;
  notes: string;
  specialRequirements: string[];
  createdAt: string;
  category: string;
  subCategory: string;
  statusColor: string;
}
import {
  Package,
  Search,
  Filter,
  SortAsc,
  Eye,
  MapPin,
  Clock,
  Star,
  Truck,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ArrowRight,
  Calendar,
  Weight,
  Ruler,
  Building2,
  Target,
  TrendingUp,
  BarChart3,
  Download,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Share2,
  ChevronDown,
  ChevronUp,
  X,
  Navigation,
  FileText,
  Plus,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Breadcrumb from '../../components/common/Breadcrumb';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import Modal from '../../components/common/Modal';
import SuccessMessage from '../../components/common/SuccessMessage';
import Pagination from '../../components/common/Pagination';

export default function CorporateShipments() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [expandedItems, setExpandedItems] = useState<number[]>([]);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [selectedShipmentForTracking, setSelectedShipmentForTracking] =
    useState<number | null>(null);
  const [acceptedShipmentId, setAcceptedShipmentId] = useState<string | null>(
    null
  );
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedShipmentForDetails, setSelectedShipmentForDetails] = useState<
    number | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // URL parametresini oku ve kabul edilen gönderiyi işaretle
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const accepted = urlParams.get('accepted');
    if (accepted) {
      setAcceptedShipmentId(accepted);
      // URL'den parametreyi temizle
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  const handleViewDetails = (shipmentId: number) => {
    // Gönderi detay modalını aç
    setSelectedShipmentForDetails(shipmentId);
    setShowDetailsModal(true);
  };

  const handleTrackShipment = (shipmentId: number) => {
    setSelectedShipmentForTracking(shipmentId);
    setShowTrackingModal(true);
  };

  const handleMessage = (shipmentId: number) => {
    // Mesajlaşma sayfasına yönlendir
    navigate('/corporate/messages');
  };

  const toggleExpanded = (id: number) => {
    setExpandedItems(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Gerçek API'den gönderileri yükle
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [isLoadingShipments, setIsLoadingShipments] = useState(true);

  useEffect(() => {
    const loadShipments = async () => {
      try {
        setIsLoadingShipments(true);
        const userRaw = localStorage.getItem('user');
        const userId = userRaw ? JSON.parse(userRaw || '{}').id : undefined;
        const token = localStorage.getItem('authToken');
        const url = userId
          ? `/api/shipments?userId=${userId}`
          : '/api/shipments';
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token || ''}`,
            'X-User-Id': userId || '',
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to load shipments');
        }

        const data = await response.json();
        const rows = (
          Array.isArray(data)
            ? data
            : data.data || data.shipments || data.rows || []
        ) as any[];
        const mapped: Shipment[] = rows.map((row: any) => ({
          id: row.id,
          title:
            row.title || `${row.pickupCity || ''} → ${row.deliveryCity || ''}`,
          trackingCode: row.trackingCode || `SHP-${row.id}`,
          from: row.pickupAddress || row.pickupCity || '-',
          to: row.deliveryAddress || row.deliveryCity || '-',
          status:
            row.status === 'accepted'
              ? 'Yolda'
              : row.status === 'completed'
                ? 'Teslim Edildi'
                : 'Beklemede',
          carrier: row.carrierName || '',
          rating: row.rating || 0,
          value:
            typeof row.price === 'number'
              ? `₺${row.price.toLocaleString()}`
              : row.price || '₺0',
          weight: row.weight || 0,
          volume: row.volume || 0,
          estimatedDelivery: row.deliveryDate || '-',
          statusText: row.status || 'Beklemede',
          progress:
            row.status === 'completed'
              ? 100
              : row.status === 'accepted'
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
          createdAt: row.createdAt || '',
          category: row.cargoType || '-',
          subCategory: row.cargoSubType || '-',
          statusColor:
            row.status === 'completed'
              ? 'bg-green-500'
              : row.status === 'accepted'
                ? 'bg-blue-500'
                : 'bg-yellow-500',
        }));

        setShipments(mapped);
      } catch (error) {
        console.error('Error loading shipments:', error);
        setShipments([]);
      } finally {
        setIsLoadingShipments(false);
      }
    };

    loadShipments();
  }, []);

  const filteredShipments = shipments.filter(shipment => {
    const matchesSearch =
      shipment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.trackingCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.to.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' &&
        ['Yolda', 'Yükleme', 'Beklemede'].includes(shipment.status)) ||
      (filterStatus === 'completed' && shipment.status === 'Teslim Edildi') ||
      (filterStatus === 'pending' && shipment.status === 'Beklemede');

    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredShipments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedShipments = filteredShipments.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const breadcrumbItems = [
    { label: 'Gönderilerim', icon: <Package className='w-4 h-4' /> },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Yüksek':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Normal':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Düşük':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Teslim Edildi':
        return 'bg-green-100 text-green-800';
      case 'Yolda':
        return 'bg-blue-100 text-blue-800';
      case 'Yükleme':
        return 'bg-orange-100 text-orange-800';
      case 'Beklemede':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50'>
      <div className='max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6'>
        {/* Breadcrumb */}
        <div className='mb-4 sm:mb-6'>
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Header - Mobile Optimized */}
        <div className='text-center mb-8 sm:mb-12'>
          <div className='flex justify-center mb-4 sm:mb-6'>
            <div className='w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg'>
              <Package className='w-6 h-6 sm:w-8 sm:h-8 text-white' />
            </div>
          </div>
          <h1 className='text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-2 sm:mb-3'>
            Gönderilerinizi{' '}
            <span className='text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-blue-900'>
              Takip Edin
            </span>
          </h1>
          <p className='text-sm sm:text-base md:text-lg text-slate-600 px-4'>
            Gönderilerinizin durumunu takip edin ve yönetin
          </p>
        </div>

        {/* Filters Card - Mobile Optimized */}
        <div className='bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 shadow-xl border border-slate-200 mb-6 sm:mb-8'>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4' />
              <input
                type='text'
                placeholder='Gönderi ara...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='w-full pl-10 pr-4 py-2 sm:py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base'
              />
            </div>

            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className='px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base'
            >
              <option value='all'>Tüm Durumlar</option>
              <option value='active'>Aktif Gönderiler</option>
              <option value='completed'>Tamamlanan</option>
              <option value='pending'>Beklemede</option>
            </select>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className='px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base'
            >
              <option value='date'>Tarihe Göre</option>
              <option value='status'>Duruma Göre</option>
              <option value='priority'>Önceliğe Göre</option>
              <option value='value'>Değere Göre</option>
            </select>

            <button className='px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base'>
              <Filter className='w-4 h-4' />
              Filtrele
            </button>
          </div>
        </div>

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
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className='py-8'>
                      <LoadingState message='Gönderiler yükleniyor...' />
                    </td>
                  </tr>
                ) : paginatedShipments.length > 0 ? (
                  paginatedShipments.map(shipment => (
                    <tr
                      key={shipment.id}
                      className='border-b border-slate-100 hover:bg-slate-50 transition-colors'
                    >
                      <td className='py-4 px-4'>
                        <div className='font-mono text-sm font-semibold text-slate-900'>
                          {shipment.trackingCode}
                        </div>
                        <div className='text-xs text-slate-500'>
                          {shipment.createdAt}
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
                          {shipment.category} - {shipment.subCategory}
                        </div>
                      </td>
                      <td className='py-4 px-4'>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            shipment.status === 'Teslim Edildi'
                              ? 'bg-green-100 text-green-800'
                              : shipment.status === 'Yolda'
                                ? 'bg-blue-100 text-blue-800'
                                : shipment.status === 'Yükleme'
                                  ? 'bg-orange-100 text-orange-800'
                                  : acceptedShipmentId === shipment.trackingCode
                                    ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                                    : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {getStatusIcon(shipment.status)}
                          {acceptedShipmentId === shipment.trackingCode
                            ? 'Kabul Edildi'
                            : shipment.statusText}
                        </span>
                      </td>
                      <td className='py-4 px-4'>
                        <div className='text-sm font-medium text-slate-900'>
                          {shipment.carrier || 'Atanmamış'}
                        </div>
                        {shipment.carrier && (
                          <div className='text-xs text-slate-500'>
                            {shipment.rating}/5 ⭐
                          </div>
                        )}
                      </td>
                      <td className='py-4 px-4'>
                        <div className='text-sm font-bold text-slate-900'>
                          {shipment.value}
                        </div>
                        <div className='text-xs text-slate-500'>
                          {shipment.weight} • {shipment.volume}
                        </div>
                        <div className='text-xs text-slate-500'>
                          {shipment.estimatedDelivery}
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
                          {shipment.status !== 'Beklemede' && (
                            <button
                              onClick={() => handleTrackShipment(shipment.id)}
                              className='px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 text-xs font-medium rounded-lg transition-colors'
                            >
                              Takip
                            </button>
                          )}
                          <button
                            onClick={() => handleMessage(shipment.id)}
                            className='px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors'
                          >
                            Mesaj
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className='py-12 text-center'>
                      <EmptyState
                        icon={Package}
                        title='Gönderi bulunamadı'
                        description='Arama kriterlerinize uygun gönderi bulunamadı'
                        action={{
                          label: 'Yeni Gönderi Oluştur',
                          onClick: () =>
                            (window.location.href =
                              '/corporate/create-shipment'),
                        }}
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className='lg:hidden space-y-4'>
            {filteredShipments.map(shipment => (
              <div
                key={shipment.id}
                className='bg-slate-50 rounded-xl p-4 border border-slate-200'
              >
                <div className='flex items-start justify-between mb-3'>
                  <div>
                    <div className='font-mono text-sm font-semibold text-slate-900'>
                      #{shipment.trackingCode}
                    </div>
                    <div className='text-xs text-slate-500'>
                      {shipment.createdAt}
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(shipment.status)}`}
                  >
                    {shipment.statusText}
                  </span>
                </div>

                <div className='space-y-2 mb-4'>
                  <div className='flex items-center gap-2'>
                    <MapPin className='w-4 h-4 text-blue-500' />
                    <span className='text-sm font-medium text-slate-900'>
                      {shipment.from} → {shipment.to}
                    </span>
                  </div>
                  <div className='text-xs text-slate-500'>{shipment.title}</div>

                  <div className='flex items-center gap-2'>
                    <div className='w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center'>
                      <Truck className='w-3 h-3 text-white' />
                    </div>
                    <div>
                      <div className='text-sm font-medium text-slate-900'>
                        {shipment.carrier}
                      </div>
                      <div className='text-xs text-slate-500'>
                        {shipment.rating}/5 ⭐
                      </div>
                    </div>
                  </div>

                  <div className='flex items-center justify-between'>
                    <div>
                      <div className='text-sm font-bold text-slate-900'>
                        {shipment.value}
                      </div>
                      <div className='text-xs text-slate-500'>
                        {shipment.estimatedDelivery}
                      </div>
                    </div>
                    <div className='text-right'>
                      <div className='text-xs text-slate-500'>
                        %{shipment.progress} tamamlandı
                      </div>
                    </div>
                  </div>
                </div>

                <div className='flex gap-2'>
                  <button
                    onClick={() => setSelectedShipmentForTracking(shipment.id)}
                    className='flex-1 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-medium rounded-lg transition-colors'
                  >
                    Takip Et
                  </button>
                  <button
                    onClick={() => setSelectedShipmentForDetails(shipment.id)}
                    className='flex-1 px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 text-xs font-medium rounded-lg transition-colors'
                  >
                    Detay
                  </button>
                  <button className='flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors'>
                    Mesaj
                  </button>
                </div>
              </div>
            ))}
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
                              s => s.id === selectedShipmentForTracking
                            )?.title
                          }
                        </h3>
                        <p className='text-gray-600'>
                          Takip Kodu:{' '}
                          {
                            shipments.find(
                              s => s.id === selectedShipmentForTracking
                            )?.trackingCode
                          }
                        </p>
                        <div className='flex items-center gap-4 mt-2'>
                          <div className='flex items-center gap-1'>
                            <MapPin className='w-4 h-4 text-blue-500' />
                            <span className='text-sm text-gray-600'>
                              {
                                shipments.find(
                                  s => s.id === selectedShipmentForTracking
                                )?.from
                              }{' '}
                              →{' '}
                              {
                                shipments.find(
                                  s => s.id === selectedShipmentForTracking
                                )?.to
                              }
                            </span>
                          </div>
                          <div className='flex items-center gap-1'>
                            <Clock className='w-4 h-4 text-orange-500' />
                            <span className='text-sm text-gray-600'>
                              {
                                shipments.find(
                                  s => s.id === selectedShipmentForTracking
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
                              s => s.id === selectedShipmentForTracking
                            )?.statusColor === 'bg-green-500'
                              ? 'bg-green-100 text-green-800'
                              : shipments.find(
                                    s => s.id === selectedShipmentForTracking
                                  )?.statusColor === 'bg-orange-500'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {
                            shipments.find(
                              s => s.id === selectedShipmentForTracking
                            )?.statusText
                          }
                        </div>
                        <div className='text-sm text-gray-500 mt-1'>
                          %
                          {
                            shipments.find(
                              s => s.id === selectedShipmentForTracking
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
                    {[].map((event: any) => (
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
                        <p className='text-sm text-gray-600'>34 ABC 123</p>
                        <p className='text-xs text-gray-500'>Soğutmalı Tır</p>
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
                  <p className='text-gray-600 mt-1'>
                    Kurumsal gönderi bilgileri ve takip detayları
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
                const shipment = shipments.find(
                  s => s.id === selectedShipmentForDetails
                );
                if (!shipment) return null;

                return (
                  <div className='space-y-6'>
                    {/* Gönderi Özeti */}
                    <div className='bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200'>
                      <div className='flex items-start justify-between mb-4'>
                        <div className='flex-1'>
                          <h3 className='text-xl font-bold text-gray-900 mb-2'>
                            {shipment.title}
                          </h3>
                          <div className='flex items-center gap-4 text-sm text-gray-600'>
                            <span className='flex items-center gap-1'>
                              <Package className='w-4 h-4' />
                              Takip No: {shipment.trackingCode}
                            </span>
                            <span className='flex items-center gap-1'>
                              <Calendar className='w-4 h-4' />
                              Oluşturulma: {shipment.createdAt}
                            </span>
                          </div>
                        </div>
                        <div className='text-right'>
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                              shipment.status === 'Teslim Edildi'
                                ? 'bg-green-100 text-green-800'
                                : shipment.status === 'Yolda'
                                  ? 'bg-blue-100 text-blue-800'
                                  : shipment.status === 'Yükleme'
                                    ? 'bg-orange-100 text-orange-800'
                                    : acceptedShipmentId ===
                                        shipment.trackingCode
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {acceptedShipmentId === shipment.trackingCode
                              ? 'Kabul Edildi'
                              : shipment.statusText}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Ana Bilgiler */}
                    <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                      {/* Rota Bilgileri */}
                      <div className='bg-white border border-gray-200 rounded-xl p-6'>
                        <div className='flex items-center gap-2 mb-4'>
                          <MapPin className='w-5 h-5 text-blue-600' />
                          <h4 className='text-lg font-semibold text-gray-900'>
                            Rota Bilgileri
                          </h4>
                        </div>
                        <div className='space-y-3'>
                          <div className='flex items-start gap-3'>
                            <div className='w-2 h-2 bg-blue-500 rounded-full mt-2'></div>
                            <div>
                              <p className='font-medium text-gray-900'>
                                Yükleme Noktası
                              </p>
                              <p className='text-gray-600'>{shipment.from}</p>
                            </div>
                          </div>
                          <div className='flex items-start gap-3'>
                            <div className='w-2 h-2 bg-green-500 rounded-full mt-2'></div>
                            <div>
                              <p className='font-medium text-gray-900'>
                                Teslimat Noktası
                              </p>
                              <p className='text-gray-600'>{shipment.to}</p>
                            </div>
                          </div>
                          <div className='flex items-center gap-2 pt-2 border-t border-gray-100'>
                            <Clock className='w-4 h-4 text-gray-500' />
                            <span className='text-sm text-gray-600'>
                              Tahmini Teslimat: {shipment.estimatedDelivery}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Kargo Bilgileri */}
                      <div className='bg-white border border-gray-200 rounded-xl p-6'>
                        <div className='flex items-center gap-2 mb-4'>
                          <Package className='w-5 h-5 text-purple-600' />
                          <h4 className='text-lg font-semibold text-gray-900'>
                            Kargo Bilgileri
                          </h4>
                        </div>
                        <div className='space-y-3'>
                          <div className='flex justify-between'>
                            <span className='text-gray-600'>Kategori:</span>
                            <span className='font-medium text-gray-900'>
                              {shipment.category}
                            </span>
                          </div>
                          <div className='flex justify-between'>
                            <span className='text-gray-600'>Alt Kategori:</span>
                            <span className='font-medium text-gray-900'>
                              {shipment.subCategory}
                            </span>
                          </div>
                          <div className='flex justify-between'>
                            <span className='text-gray-600'>Ağırlık:</span>
                            <span className='font-medium text-gray-900'>
                              {shipment.weight}
                            </span>
                          </div>
                          <div className='flex justify-between'>
                            <span className='text-gray-600'>Hacim:</span>
                            <span className='font-medium text-gray-900'>
                              {shipment.volume}
                            </span>
                          </div>
                          <div className='flex justify-between'>
                            <span className='text-gray-600'>Değer:</span>
                            <span className='font-medium text-gray-900'>
                              {shipment.value}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Nakliyeci Bilgileri */}
                    {shipment.carrier && (
                      <div className='bg-white border border-gray-200 rounded-xl p-6'>
                        <div className='flex items-center gap-2 mb-4'>
                          <Truck className='w-5 h-5 text-blue-600' />
                          <h4 className='text-lg font-semibold text-gray-900'>
                            Nakliyeci Bilgileri
                          </h4>
                        </div>
                        <div className='flex items-center gap-4 p-4 bg-blue-50 rounded-lg'>
                          <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center'>
                            <Building2 className='w-6 h-6 text-blue-600' />
                          </div>
                          <div className='flex-1'>
                            <h5 className='font-semibold text-gray-900 text-lg'>
                              {shipment.carrier}
                            </h5>
                            <div className='flex items-center gap-4 mt-2'>
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

                    {/* Özel Gereksinimler ve Notlar */}
                    <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                      {/* Özel Gereksinimler */}
                      {shipment.specialRequirements &&
                        shipment.specialRequirements.length > 0 && (
                          <div className='bg-white border border-gray-200 rounded-xl p-6'>
                            <div className='flex items-center gap-2 mb-4'>
                              <AlertCircle className='w-5 h-5 text-orange-600' />
                              <h4 className='text-lg font-semibold text-gray-900'>
                                Özel Gereksinimler
                              </h4>
                            </div>
                            <div className='flex flex-wrap gap-2'>
                              {shipment.specialRequirements.map(
                                (req, index) => (
                                  <span
                                    key={index}
                                    className='px-3 py-2 bg-orange-100 text-orange-800 rounded-lg text-sm font-medium border border-orange-200'
                                  >
                                    {req}
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        )}

                      {/* Notlar */}
                      {shipment.notes && (
                        <div className='bg-white border border-gray-200 rounded-xl p-6'>
                          <div className='flex items-center gap-2 mb-4'>
                            <FileText className='w-5 h-5 text-gray-600' />
                            <h4 className='text-lg font-semibold text-gray-900'>
                              Özel Notlar
                            </h4>
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

        {/* Success Message */}
        <SuccessMessage
          message={successMessage}
          isVisible={showSuccessMessage}
          onClose={() => setShowSuccessMessage(false)}
        />
      </div>
    </div>
  );
}
