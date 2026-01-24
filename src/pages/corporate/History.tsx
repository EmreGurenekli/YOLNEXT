import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  History as HistoryIcon,
  Package,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Truck,
  Calendar,
  Eye,
  MessageCircle,
  Plus,
  Search,
  Download,
  Star,
  DollarSign,
  Building2,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createApiUrl } from '../../config/api';
import Pagination from '../../components/shared-ui-elements/Pagination';
import { logger } from '../../utils/logger';

interface ShipmentHistory {
  id: string;
  title: string;
  from: string;
  to: string;
  status: 'delivered' | 'cancelled' | 'failed' | 'in_progress';
  createdAt: string;
  estimatedDelivery: string;
  actualDelivery?: string;
  price: number;
  carrierName: string;
  rating: number;
  trackingCode: string;
  category: string;
  weight: string;
  dimensions: string;
  description: string;
}

const CorporateHistory: React.FC = () => {
  const [shipments, setShipments] = useState<ShipmentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Sayfa başına 10 gönderi

  useEffect(() => {
    const loadHistoryData = async () => {
      try {
        logger.log('🔄 Geçmiş gönderiler yükleniyor...');
        setLoading(true);
        const response = await fetch(createApiUrl('/api/shipments?status=completed'), {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          throw new Error('Geçmiş verileri yüklenemedi');
        }
        const data = await response.json();
        // Format shipments to include city/district information
        const formattedShipments = (data.shipments || data.data || []).map((shipment: any) => {
          const pickupCity = shipment.pickupCity || shipment.pickup_city || 'Bilinmiyor';
          const pickupDistrict = shipment.pickupDistrict || shipment.pickup_district || '';
          const deliveryCity = shipment.deliveryCity || shipment.delivery_city || 'Bilinmiyor';
          const deliveryDistrict = shipment.deliveryDistrict || shipment.delivery_district || '';

          // Format: "Şehir / İlçe" or just "Şehir" if district is missing
          const fromDisplay = pickupDistrict ? `${pickupCity} / ${pickupDistrict}` : pickupCity;
          const toDisplay = deliveryDistrict ? `${deliveryCity} / ${deliveryDistrict}` : deliveryCity;

          return {
            ...shipment,
            from: fromDisplay,
            to: toDisplay,
            trackingCode: shipment.trackingNumber || shipment.tracking_number || `TRK${shipment.id?.toString().padStart(6, '0') || '000000'}`,
          };
        });
        setShipments(formattedShipments);
        logger.log(
          '✅ Geçmiş gönderiler yüklendi:',
          formattedShipments.length
        );
      } catch (error) {
        logger.error('❌ Geçmiş gönderiler yüklenirken hata:', error);
        setShipments([]);
      } finally {
        setLoading(false);
      }
    };
    loadHistoryData();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return <CheckCircle className='w-3 h-3 mr-1' />;
      case 'cancelled':
        return <XCircle className='w-3 h-3 mr-1' />;
      case 'failed':
        return <AlertCircle className='w-3 h-3 mr-1' />;
      case 'in_progress':
        return <Clock className='w-3 h-3 mr-1' />;
      default:
        return <Clock className='w-3 h-3 mr-1' />;
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return { text: 'Teslim Edildi', color: 'bg-green-100 text-green-800' };
      case 'cancelled':
        return { text: 'İptal Edildi', color: 'bg-red-100 text-red-800' };
      case 'failed':
        return { text: 'Başarısız', color: 'bg-red-100 text-red-800' };
      case 'in_progress':
        return { text: 'Devam Ediyor', color: 'bg-yellow-100 text-yellow-800' };
      default:
        return { text: 'Bilinmiyor', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const filteredShipments = shipments.filter(shipment => {
    const matchesSearch =
      shipment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.carrierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.trackingCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || shipment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedShipments = filteredShipments.slice().sort((a, b) => {
    const getTime = (v: any) => {
      const t = new Date(v || 0).getTime();
      return Number.isFinite(t) ? t : 0;
    };

    const statusRank = (s: ShipmentHistory) => {
      const v = String(s.status || '').toLowerCase();
      if (v === 'in_progress') return 1;
      if (v === 'failed') return 2;
      if (v === 'cancelled') return 3;
      if (v === 'delivered') return 4;
      return 9;
    };

    if (sortBy === 'status') {
      const d = statusRank(a) - statusRank(b);
      if (d !== 0) return d;
      return getTime(b.createdAt) - getTime(a.createdAt);
    }

    if (sortBy === 'price') {
      const d = (Number(b.price) || 0) - (Number(a.price) || 0);
      if (d !== 0) return d;
      return getTime(b.createdAt) - getTime(a.createdAt);
    }

    if (sortBy === 'rating') {
      const d = (Number(b.rating) || 0) - (Number(a.rating) || 0);
      if (d !== 0) return d;
      return getTime(b.createdAt) - getTime(a.createdAt);
    }

    // date (default)
    return getTime(b.createdAt) - getTime(a.createdAt);
  });

  // Pagination calculations
  const totalPages = Math.ceil(sortedShipments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedShipments = sortedShipments.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm, sortBy]);

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Geçmiş yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <Helmet>
        <title>Geçmiş Siparişler - YolNext Kurumsal</title>
        <meta
          name='description'
          content='Gönderi geçmişinizi görüntüleyin ve yönetin'
        />
      </Helmet>
      <div className='max-w-5xl mx-auto px-4 py-6'>
        {/* Header - Match MyShipments Design */}
        <div className='text-center mb-12'>
          <div className='flex justify-center mb-6'>
            <div className='w-16 h-16 bg-gradient-to-br from-slate-800 to-blue-900 rounded-2xl flex items-center justify-center shadow-lg'>
              <HistoryIcon className='w-8 h-8 text-white' />
            </div>
          </div>
          <h1 className='text-4xl md:text-5xl font-bold text-slate-900 mb-3'>
            Geçmiş{' '}
            <span className='text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-blue-900'>
              Siparişleriniz
            </span>
          </h1>
          <p className='text-lg text-slate-600'>
            Tüm gönderi geçmişinizi görüntüleyin ve analiz edin
          </p>
        </div>

        {/* Stats Cards */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
          <div className='bg-white rounded-2xl p-6 shadow-xl border border-slate-200'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-slate-600'>
                  Toplam Gönderi
                </p>
                <p className='text-2xl font-bold text-slate-900'>
                  {shipments.length}
                </p>
              </div>
              <div className='w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl flex items-center justify-center'>
                <Package className='w-6 h-6 text-white' />
              </div>
            </div>
          </div>
          <div className='bg-white rounded-2xl p-6 shadow-xl border border-slate-200'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-slate-600'>
                  Teslim Edilen
                </p>
                <p className='text-2xl font-bold text-slate-900'>
                  {shipments.filter(s => s.status === 'delivered').length}
                </p>
              </div>
              <div className='w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-700 rounded-xl flex items-center justify-center'>
                <CheckCircle className='w-6 h-6 text-white' />
              </div>
            </div>
          </div>
          <div className='bg-white rounded-2xl p-6 shadow-xl border border-slate-200'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-slate-600'>
                  Toplam Harcama
                </p>
                <p className='text-2xl font-bold text-slate-900'>
                  ₺
                  {shipments
                    .reduce((sum, s) => sum + s.price, 0)
                    .toLocaleString()}
                </p>
              </div>
              <div className='w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl flex items-center justify-center'>
                <DollarSign className='w-6 h-6 text-white' />
              </div>
            </div>
          </div>
          <div className='bg-white rounded-2xl p-6 shadow-xl border border-slate-200'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-slate-600'>
                  Ortalama Puan
                </p>
                <p className='text-2xl font-bold text-slate-900'>
                  {shipments.length > 0
                    ? (
                      shipments.reduce((sum, s) => sum + s.rating, 0) /
                      shipments.length
                    ).toFixed(1)
                    : 0}
                </p>
              </div>
              <div className='w-12 h-12 bg-gradient-to-br from-yellow-600 to-orange-700 rounded-xl flex items-center justify-center'>
                <Star className='w-6 h-6 text-white' />
              </div>
            </div>
          </div>
        </div>

        {/* Filters Card */}
        <div className='bg-white rounded-2xl p-8 shadow-xl border border-slate-200 mb-8'>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4' />
              <input
                type='text'
                placeholder='Gönderi ara...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className='px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            >
              <option value='all'>Tüm Durumlar</option>
              <option value='delivered'>Teslim Edilen</option>
              <option value='cancelled'>İptal Edilen</option>
              <option value='failed'>Başarısız</option>
              <option value='in_progress'>Devam Eden</option>
            </select>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className='px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            >
              <option value='date'>Tarihe Göre</option>
              <option value='status'>Duruma Göre</option>
              <option value='price'>Fiyata Göre</option>
              <option value='rating'>Puana Göre</option>
            </select>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setSortBy('date');
                setCurrentPage(1);
              }}
              className='px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2'
            >
              <X className='w-4 h-4' />
              Sıfırla
            </button>
          </div>
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
                {paginatedShipments.length > 0 ? (
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
                          {new Date(shipment.createdAt).toLocaleDateString(
                            'tr-TR'
                          )}
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
                          {shipment.category}
                        </div>
                      </td>
                      <td className='py-4 px-4'>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusInfo(shipment.status).color}`}
                        >
                          {getStatusIcon(shipment.status)}
                          {getStatusInfo(shipment.status).text}
                        </span>
                      </td>
                      <td className='py-4 px-4'>
                        <div className='flex items-center gap-2'>
                          <Building2 className='w-4 h-4 text-slate-400' />
                          <div>
                            <div className='text-sm font-medium text-slate-900'>
                              {shipment.carrierName}
                            </div>
                            <div className='flex items-center gap-1'>
                              <Star className='w-3 h-3 text-yellow-500' />
                              <span className='text-xs text-slate-500'>
                                {shipment.rating}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className='py-4 px-4'>
                        <div className='text-sm font-semibold text-slate-900'>
                          ₺{shipment.price.toLocaleString()}
                        </div>
                        <div className='text-xs text-slate-500'>
                          {shipment.weight}
                        </div>
                      </td>
                      <td className='py-4 px-4'>
                        <div className='flex items-center gap-2'>
                          <Link
                            to={`/corporate/shipments/${shipment.id}`}
                            className='p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors'
                            title='Detayları Görüntüle'
                          >
                            <Eye className='w-4 h-4' />
                          </Link>
                          <button
                            className='p-2 text-slate-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors'
                            title='Mesaj Gönder'
                          >
                            <MessageCircle className='w-4 h-4' />
                          </button>
                          <button
                            className='p-2 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors'
                            title='İndir'
                          >
                            <Download className='w-4 h-4' />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className='py-12 text-center'>
                      <div className='text-slate-500'>
                        <Package className='w-12 h-12 mx-auto mb-4 text-slate-300' />
                        <p className='text-lg font-medium mb-2'>
                          Geçmiş bulunamadı
                        </p>
                        <p className='text-sm'>
                          Arama kriterlerinize uygun gönderi geçmişi bulunamadı.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {sortedShipments.length > itemsPerPage && (
            <div className='mt-6'>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className='mt-8 text-center'>
          <Link
            to='/corporate/create-shipment'
            className='inline-flex items-center gap-2 bg-gradient-to-r from-slate-800 to-blue-900 text-white px-6 py-3 rounded-xl font-semibold hover:from-slate-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl'
          >
            <Plus className='w-5 h-5' />
            Yeni Gönderi Oluştur
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CorporateHistory;










