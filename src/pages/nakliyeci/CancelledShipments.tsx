
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../contexts/AuthContext';
import {
  Package,
  XCircle,
  MapPin,
  Truck,
  Eye,
  Calendar,
  Weight,
  Ruler,
  ArrowRight,
  Filter,
  Search,
  RefreshCw,
  AlertTriangle,
  Clock,
  MessageSquare,
  RotateCcw,
} from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import Pagination from '../../components/common/Pagination';
import { createApiUrl } from '../../config/api';
import { formatCurrency, formatDate } from '../../utils/format';

interface CancelledShipment {
  id: string;
  trackingNumber: string;
  from: string;
  to: string;
  status: string;
  weight: number;
  volume: number;
  value: number;
  pickupDate: string;
  deliveryDate: string;
  cancelledDate: string;
  cancellationReason: string;
  cancelledBy: string;
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

const CancelledShipments = () => {
  const { user } = useAuth();
  const [shipments, setShipments] = useState<CancelledShipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [reasonFilter, setReasonFilter] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    limit: 20,
  });

  useEffect(() => {
    loadCancelledShipments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page]);

  const loadCancelledShipments = async () => {
    try {
      setIsLoading(true);

      // Gerçek API çağrısı
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      const response = await fetch(
        `${createApiUrl('/api/shipments/nakliyeci/cancelled')}?${params.toString()}`,
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
        console.error('Failed to load cancelled shipments');
        setShipments([]);
      }
    } catch (error) {
      console.error('Error loading cancelled shipments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCancellationReasonColor = (reason: string) => {
    if (reason.includes('Araç arızası')) return 'text-red-600 bg-red-100';
    if (reason.includes('Gönderici')) return 'text-orange-600 bg-orange-100';
    if (reason.includes('Hava koşulları')) return 'text-blue-600 bg-blue-100';
    if (reason.includes('Trafik')) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  const filteredShipments = shipments.filter(shipment => {
    const matchesSearch =
      shipment.trackingNumber
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      shipment.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.to.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.driver.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesReason =
      reasonFilter === 'all' ||
      (reasonFilter === 'vehicle_issue' &&
        shipment.cancellationReason.includes('Araç arızası')) ||
      (reasonFilter === 'shipper_cancelled' &&
        shipment.cancellationReason.includes('Gönderici')) ||
      (reasonFilter === 'weather' &&
        shipment.cancellationReason.includes('Hava koşulları')) ||
      (reasonFilter === 'traffic' &&
        shipment.cancellationReason.includes('Trafik'));

    return matchesSearch && matchesReason;
  });

  const totalCancelled = filteredShipments.length;
  const totalLostRevenue = filteredShipments.reduce(
    (sum, shipment) => sum + shipment.value,
    0
  );

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50'>
      <Helmet>
        <title>İptal Edilen Yükler - YolNext Nakliyeci</title>
        <meta
          name='description'
          content='İptal edilen yüklerinizi görüntüleyin'
        />
      </Helmet>

      <div className='max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6'>
        {/* Breadcrumb */}
        <div className='mb-4 sm:mb-6'>
          <Breadcrumb
            items={[
              {
                label: 'İptal Edilen Yükler',
                icon: <XCircle className='w-4 h-4' />,
              },
            ]}
          />
        </div>

        {/* Header */}
        <div className='text-center mb-8 sm:mb-12'>
          <div className='flex justify-center mb-4 sm:mb-6'>
            <div className='w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg'>
              <XCircle className='w-6 h-6 sm:w-8 sm:h-8 text-white' />
            </div>
          </div>
          <h1 className='text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-2 sm:mb-3'>
            İptal Edilen Yükler
          </h1>
          <p className='text-sm sm:text-base md:text-lg text-slate-600 px-4'>
            İptal edilen veya tekliften çekilen işlerinizi görüntüleyin
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

        {/* Stats */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-8'>
          <div className='bg-white rounded-xl p-6 shadow-lg border border-gray-200'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>
                  Toplam İptal
                </p>
                <p className='text-2xl font-bold text-gray-900'>
                  {totalCancelled}
                </p>
              </div>
              <div className='w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center'>
                <XCircle className='w-6 h-6 text-red-600' />
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl p-6 shadow-lg border border-gray-200'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Kayıp Gelir</p>
                <p className='text-2xl font-bold text-gray-900'>
                  {formatCurrency(totalLostRevenue)}
                </p>
              </div>
              <div className='w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center'>
                <AlertTriangle className='w-6 h-6 text-orange-600' />
              </div>
            </div>
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
                value={reasonFilter}
                onChange={e => setReasonFilter(e.target.value)}
                className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              >
                <option value='all'>Tüm Sebepler</option>
                <option value='vehicle_issue'>Araç Arızası</option>
                <option value='shipper_cancelled'>Gönderici İptali</option>
                <option value='weather'>Hava Koşulları</option>
                <option value='traffic'>Trafik</option>
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
                      <span className='text-lg font-bold text-red-600'>
                        #{shipment.trackingNumber}
                      </span>
                      <span className='px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-600'>
                        İptal Edildi
                      </span>
                      <span className='px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600'>
                        {shipment.cancelledBy}
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

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
                      <div>
                        <h4 className='font-semibold text-gray-900 mb-2'>
                          Tarih Bilgileri
                        </h4>
                        <div className='text-sm text-gray-600'>
                          <p>
                            <strong>Alış:</strong>{' '}
                            {formatDate(shipment.pickupDate, 'long')}
                          </p>
                          <p>
                            <strong>Teslim:</strong>{' '}
                            {formatDate(shipment.deliveryDate, 'long')}
                          </p>
                          <p>
                            <strong>İptal:</strong>{' '}
                            {formatDate(shipment.cancelledDate, 'long')}
                          </p>
                        </div>
                      </div>

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
                    </div>

                    <div className='bg-red-50 rounded-lg p-4'>
                      <h4 className='font-semibold text-gray-900 mb-2'>
                        İptal Sebebi
                      </h4>
                      <p className='text-sm text-gray-600'>
                        {shipment.cancellationReason}
                      </p>
                    </div>
                  </div>

                  <div className='flex flex-col gap-2'>
                    <div className='text-right mb-4'>
                      <div className='text-2xl font-bold text-gray-900'>
                        {formatCurrency(shipment.value)}
                      </div>
                      <div className='text-sm text-gray-500'>Kayıp Gelir</div>
                    </div>

                    <div className='flex gap-2'>
                      <button className='flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2'>
                        <Eye className='w-4 h-4' />
                        Detay
                      </button>
                      <button className='flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2'>
                        <RotateCcw className='w-4 h-4' />
                        Tekrar Teklif
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={XCircle}
            title='İptal edilen yük bulunamadı'
            description='Henüz iptal edilen yükünüz bulunmuyor.'
            action={{
              label: 'Yük Pazarı',
              onClick: () => (window.location.href = '/nakliyeci/jobs'),
            }}
          />
        )}
      </div>

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
    </div>
  );
};

export default CancelledShipments;
