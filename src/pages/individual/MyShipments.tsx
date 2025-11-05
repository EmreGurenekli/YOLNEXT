import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
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
  Filter,
  Search,
  Download,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createApiUrl } from '../../config/api';
import { formatCurrency, formatDate } from '../../utils/format';
import Pagination from '../../components/common/Pagination';

interface Shipment {
  id: string;
  title: string;
  from: string;
  to: string;
  status: 'preparing' | 'waiting' | 'in_transit' | 'delivered' | 'cancelled';
  createdAt: string;
  estimatedDelivery: string;
  actualDelivery?: string;
  price: number;
  carrierName?: string;
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
}

const IndividualMyShipments: React.FC = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    limit: 20,
  });

  // Yeni kullanıcılar için boş veriler
  const emptyShipments: Shipment[] = [];

  useEffect(() => {
    const loadShipments = async () => {
      try {
        console.log('🔄 Bireysel gönderiler yükleniyor...');
        setLoading(true);
        const token = localStorage.getItem('authToken');

        if (!token) {
          console.error('❌ Token bulunamadı');
          setShipments(emptyShipments);
          setLoading(false);
          return;
        }

        console.log('🌐 API çağrısı yapılıyor...');
        const params = new URLSearchParams({
          page: pagination.page.toString(),
          limit: pagination.limit.toString(),
        });
        if (statusFilter !== 'all') {
          params.append('status', statusFilter);
        }
        if (searchTerm && searchTerm.trim()) {
          params.append('search', searchTerm.trim());
        }
        const response = await fetch(
          `${createApiUrl('/api/shipments')}?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        console.log('📥 API Response Status:', response.status);
        const data = await response.json();
        console.log('📊 API Response Data:', data);

        if (response.ok && data.success) {
          // Backend'den dönen data structure'ı kontrol et
          const shipments =
            data.data?.shipments || (Array.isArray(data.data) ? data.data : []);
          console.log('✅ Bireysel gönderiler yüklendi:', shipments.length);

          // Backend verilerini frontend formatına çevir
          const formattedShipments = shipments.map((shipment: any) => ({
            id: shipment.id.toString(),
            title: shipment.title || 'Gönderi',
            from:
              shipment.pickupCity ||
              shipment.fromCity ||
              `${shipment.pickupDistrict || ''} ${shipment.pickupCity || ''}`.trim() ||
              'Bilinmiyor',
            to:
              shipment.deliveryCity ||
              shipment.toCity ||
              `${shipment.deliveryDistrict || ''} ${shipment.deliveryCity || ''}`.trim() ||
              'Bilinmiyor',
            status: (shipment.status === 'open'
              ? 'waiting'
              : shipment.status === 'accepted'
                ? 'in_transit'
                : shipment.status === 'in_progress'
                  ? 'in_transit'
                  : shipment.status === 'delivered'
                    ? 'delivered'
                    : shipment.status === 'cancelled'
                      ? 'cancelled'
                      : 'waiting') as
              | 'delivered'
              | 'in_transit'
              | 'preparing'
              | 'waiting'
              | 'cancelled',
            createdAt:
              shipment.createdAt ||
              shipment.created_at ||
              new Date().toISOString(),
            estimatedDelivery:
              shipment.deliveryDate ||
              shipment.delivery_date ||
              shipment.pickupDate ||
              new Date().toISOString(),
            actualDelivery:
              shipment.status === 'delivered'
                ? shipment.actualDeliveryDate || shipment.deliveryDate
                : undefined,
            price: shipment.price || 0,
            carrierName:
              shipment.carrierName || shipment.carrier_name || undefined,
            trackingNumber:
              shipment.trackingNumber || shipment.tracking_number || undefined,
            description: shipment.description || '',
            category: shipment.category || 'Genel',
            weight: shipment.weight?.toString() || '0',
            dimensions:
              shipment.dimensions || shipment.volume?.toString() || '0',
            specialRequirements: shipment.specialRequirements
              ? Array.isArray(shipment.specialRequirements)
                ? shipment.specialRequirements
                : [shipment.specialRequirements]
              : [],
            trackingCode:
              shipment.trackingNumber ||
              `TRK${shipment.id.toString().padStart(6, '0')}`,
            subCategory: shipment.subCategory || shipment.category || 'Genel',
            rating: shipment.rating || undefined,
            volume: shipment.volume?.toString() || '0',
          }));

          setShipments(formattedShipments);
          if (data.pagination) {
            setPagination(prev => ({
              ...prev,
              page: data.pagination.page,
              pages: data.pagination.pages,
              total: data.pagination.total,
            }));
          }
        } else {
          console.error(
            '❌ Gönderiler yüklenemedi:',
            data.message || data.error
          );
          setShipments(emptyShipments);
        }
      } catch (error) {
        console.error('❌ API hatası:', error);
        setShipments(emptyShipments);
      } finally {
        setLoading(false);
        console.log('✅ Loading tamamlandı');
      }
    };

    loadShipments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, statusFilter, searchTerm]);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'preparing':
        return {
          text: 'Hazırlanıyor',
          color: 'bg-yellow-100 text-yellow-800',
          icon: AlertCircle,
        };
      case 'waiting':
        return {
          text: 'Teklif Bekliyor',
          color: 'bg-blue-100 text-blue-800',
          icon: Clock,
        };
      case 'in_transit':
        return {
          text: 'Yolda',
          color: 'bg-green-100 text-green-800',
          icon: Truck,
        };
      case 'delivered':
        return {
          text: 'Teslim Edildi',
          color: 'bg-emerald-100 text-emerald-800',
          icon: CheckCircle,
        };
      case 'cancelled':
        return {
          text: 'İptal Edildi',
          color: 'bg-red-100 text-red-800',
          icon: XCircle,
        };
      default:
        return {
          text: 'Bilinmiyor',
          color: 'bg-gray-100 text-gray-800',
          icon: AlertCircle,
        };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_transit':
        return <Truck className='w-4 h-4' />;
      case 'preparing':
        return <Package className='w-4 h-4' />;
      case 'delivered':
        return <CheckCircle className='w-4 h-4' />;
      case 'waiting':
        return <Clock className='w-4 h-4' />;
      default:
        return <AlertCircle className='w-4 h-4' />;
    }
  };

  const handleViewDetails = (shipmentId: string) => {
    console.log('Gönderi detayları:', shipmentId);
  };

  const handleTrackShipment = (shipmentId: string) => {
    console.log('Gönderi takibi:', shipmentId);
  };

  // Arama backend'de yapıldığı için sadece status filtresi uygulanıyor
  const filteredShipments = shipments.filter(shipment => {
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' &&
        ['in_transit', 'preparing', 'waiting'].includes(shipment.status)) ||
      (statusFilter === 'completed' && shipment.status === 'delivered') ||
      (statusFilter === 'pending' && shipment.status === 'waiting');

    return matchesStatus;
  });

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-16 h-16 bg-gradient-to-br from-slate-800 to-blue-900 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse'>
            <Package className='w-8 h-8 text-white' />
          </div>
          <h2 className='text-xl font-semibold text-gray-900'>
            Gönderiler yükleniyor...
          </h2>
        </div>
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

      <div className='max-w-5xl mx-auto px-4 py-6'>
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
              <option value='active'>Aktif Gönderiler</option>
              <option value='completed'>Tamamlanan</option>
              <option value='pending'>Beklemede</option>
            </select>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className='px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            >
              <option value='date'>Tarihe Göre</option>
              <option value='status'>Duruma Göre</option>
              <option value='priority'>Önceliğe Göre</option>
              <option value='value'>Değere Göre</option>
            </select>

            <button className='min-h-[44px] px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2'>
              <Filter className='w-4 h-4' />
              Filtrele
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
                {filteredShipments.length > 0 ? (
                  filteredShipments.map(shipment => (
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
                            shipment.status === 'delivered'
                              ? 'bg-green-100 text-green-800'
                              : shipment.status === 'in_transit'
                                ? 'bg-blue-100 text-blue-800'
                                : shipment.status === 'preparing'
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {getStatusIcon(shipment.status)}
                          {getStatusInfo(shipment.status).text}
                        </span>
                      </td>
                      <td className='py-4 px-4'>
                        <div className='text-sm font-medium text-slate-900'>
                          {shipment.carrierName || 'Atanmamış'}
                        </div>
                        {shipment.carrierName && shipment.rating && (
                          <div className='text-xs text-slate-500'>
                            {shipment.rating}/5 ⭐
                          </div>
                        )}
                      </td>
                      <td className='py-4 px-4'>
                        <div className='text-sm font-bold text-slate-900'>
                          {formatCurrency(shipment.price)}
                        </div>
                        <div className='text-xs text-slate-500'>
                          {shipment.weight} • {shipment.volume}
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
                          >
                            Detay
                          </button>
                          {shipment.status !== 'waiting' && (
                            <button
                              onClick={() => handleTrackShipment(shipment.id)}
                              className='px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 text-xs font-medium rounded-lg transition-colors'
                            >
                              Takip
                            </button>
                          )}
                          <button className='px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors'>
                            Mesaj
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className='py-12 text-center'>
                      <Package className='w-16 h-16 text-slate-300 mx-auto mb-4' />
                      <h3 className='text-lg font-medium text-slate-900 mb-2'>
                        Gönderi bulunamadı
                      </h3>
                      <p className='text-slate-500'>
                        Arama kriterlerinize uygun gönderi bulunmuyor.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndividualMyShipments;
