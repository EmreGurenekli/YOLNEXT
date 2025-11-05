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

const CorporateMyShipments: React.FC = () => {
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
        console.log('🔄 Kurumsal gönderiler yükleniyor...');
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

        if (response.ok) {
          // Backend'den direkt array döndürüyor veya data.data içinde
          const shipments = data.success
            ? data.data?.shipments || (Array.isArray(data.data) ? data.data : [])
            : Array.isArray(data) ? data : [];
          console.log('✅ Kurumsal gönderiler yüklendi:', shipments.length);

          // Backend verilerini frontend formatına çevir
          const formattedShipments = shipments.map((shipment: any) => ({
            id: shipment.id.toString(),
            title: shipment.title || 'Gönderi',
            from: shipment.from_city || 'Bilinmiyor',
            to: shipment.to_city || 'Bilinmiyor',
            status: (shipment.status === 'pending'
              ? 'waiting'
              : shipment.status === 'accepted'
                ? 'in_transit'
                : shipment.status === 'delivered'
                  ? 'delivered'
                  : 'preparing') as
              | 'delivered'
              | 'in_transit'
              | 'preparing'
              | 'waiting'
              | 'cancelled',
            createdAt: shipment.created_at || new Date().toISOString(),
            estimatedDelivery:
              shipment.delivery_date || new Date().toISOString(),
            actualDelivery:
              shipment.status === 'delivered'
                ? shipment.delivery_date
                : undefined,
            price: shipment.price || 0,
            carrierName: shipment.carrier_name || undefined,
            trackingNumber: shipment.tracking_number || undefined,
            description: shipment.description || '',
            category: shipment.category || 'Genel',
            weight: shipment.weight?.toString() || '0',
            dimensions: shipment.volume?.toString() || '0',
            specialRequirements: shipment.special_requirements
              ? [shipment.special_requirements]
              : [],
            trackingCode: `TRK${shipment.id.toString().padStart(6, '0')}`,
            subCategory: shipment.category || 'Genel',
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
  }, [pagination.page, statusFilter]);

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
          text: 'Bekliyor',
          color: 'bg-orange-100 text-orange-800',
          icon: Clock,
        };
      case 'in_transit':
        return {
          text: 'Yolda',
          color: 'bg-blue-100 text-blue-800',
          icon: Truck,
        };
      case 'delivered':
        return {
          text: 'Teslim Edildi',
          color: 'bg-green-100 text-green-800',
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
    const { icon: Icon } = getStatusInfo(status);
    return <Icon className='w-3 h-3 mr-1' />;
  };

  const handleViewDetails = (shipmentId: string) => {
    console.log('Gönderi detayları:', shipmentId);
  };

  const handleTrackShipment = (shipmentId: string) => {
    console.log('Gönderi takibi:', shipmentId);
  };

  const filteredShipments = shipments.filter(shipment => {
    const matchesSearch =
      shipment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.trackingCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.to.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' &&
        ['in_transit', 'preparing', 'waiting'].includes(shipment.status)) ||
      (statusFilter === 'completed' && shipment.status === 'delivered') ||
      (statusFilter === 'pending' && shipment.status === 'waiting');

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-16 h-16 bg-gradient-to-br from-slate-800 to-blue-900 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse'>
            <Package className='w-8 h-8 text-white' />
          </div>
          <h3 className='text-lg font-semibold text-slate-900 mb-2'>
            Gönderiler yükleniyor...
          </h3>
          <p className='text-slate-600'>Lütfen bekleyin</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50'>
      <Helmet>
        <title>Gönderilerim - YolNext Kargo Platform</title>
        <meta
          name='description'
          content='Kurumsal gönderilerinizi takip edin ve yönetin'
        />
      </Helmet>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-slate-900 mb-2'>
                Gönderilerim
              </h1>
              <p className='text-slate-600'>
                Kurumsal gönderilerinizi takip edin ve yönetin
              </p>
            </div>
            <Link
              to='/corporate/create-shipment'
              className='inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl'
            >
              <Plus className='w-5 h-5' />
              Yeni Gönderi
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
          <div className='bg-white rounded-xl p-6 shadow-sm border border-slate-200'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-slate-600'>Toplam Gönderi</p>
                <p className='text-2xl font-bold text-slate-900'>
                  {shipments.length}
                </p>
              </div>
              <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center'>
                <Package className='w-6 h-6 text-blue-600' />
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl p-6 shadow-sm border border-slate-200'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-slate-600'>Aktif Gönderi</p>
                <p className='text-2xl font-bold text-orange-600'>
                  {
                    shipments.filter(s =>
                      ['preparing', 'waiting', 'in_transit'].includes(s.status)
                    ).length
                  }
                </p>
              </div>
              <div className='w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center'>
                <Truck className='w-6 h-6 text-orange-600' />
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl p-6 shadow-sm border border-slate-200'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-slate-600'>Teslim Edilen</p>
                <p className='text-2xl font-bold text-green-600'>
                  {shipments.filter(s => s.status === 'delivered').length}
                </p>
              </div>
              <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center'>
                <CheckCircle className='w-6 h-6 text-green-600' />
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl p-6 shadow-sm border border-slate-200'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-slate-600'>Toplam Tutar</p>
                <p className='text-2xl font-bold text-slate-900'>
                  ₺
                  {formatCurrency(
                    shipments.reduce((sum, s) => sum + s.price, 0)
                  )}
                </p>
              </div>
              <div className='w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center'>
                <Package className='w-6 h-6 text-slate-600' />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className='bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-6'>
          <div className='flex flex-col sm:flex-row gap-4'>
            <div className='flex-1'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4' />
                <input
                  type='text'
                  placeholder='Gönderi ara...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                />
              </div>
            </div>

            <div className='flex gap-3'>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className='px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              >
                <option value='all'>Tüm Durumlar</option>
                <option value='active'>Aktif</option>
                <option value='completed'>Tamamlanan</option>
                <option value='pending'>Bekleyen</option>
              </select>

              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className='px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              >
                <option value='date'>Tarihe Göre</option>
                <option value='status'>Duruma Göre</option>
                <option value='price'>Fiyata Göre</option>
              </select>
            </div>
          </div>
        </div>

        {/* Shipments Table */}
        <div className='bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden'>
          {filteredShipments.length === 0 ? (
            <div className='text-center py-12'>
              <Package className='w-16 h-16 text-slate-300 mx-auto mb-4' />
              <h3 className='text-lg font-semibold text-slate-900 mb-2'>
                Gönderi bulunamadı
              </h3>
              <p className='text-slate-600 mb-6'>
                Henüz gönderiniz bulunmuyor veya arama kriterlerinize uygun
                gönderi yok.
              </p>
              <Link
                to='/corporate/create-shipment'
                className='inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors'
              >
                <Plus className='w-5 h-5' />
                İlk Gönderinizi Oluşturun
              </Link>
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead className='bg-slate-50 border-b border-slate-200'>
                  <tr>
                    <th className='px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider'>
                      Gönderi
                    </th>
                    <th className='px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider'>
                      Güzergah
                    </th>
                    <th className='px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider'>
                      Durum
                    </th>
                    <th className='px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider'>
                      Taşıyıcı
                    </th>
                    <th className='px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider'>
                      Fiyat & Detaylar
                    </th>
                    <th className='px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider'>
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className='bg-white divide-y divide-slate-200'>
                  {filteredShipments.map(shipment => (
                    <tr
                      key={shipment.id}
                      className='border-b border-slate-100 hover:bg-slate-50 transition-colors'
                    >
                      <td className='py-4 px-6'>
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
                      <td className='py-4 px-6'>
                        <div className='text-sm font-medium text-slate-900'>
                          {shipment.from} → {shipment.to}
                        </div>
                        <div className='text-xs text-slate-500'>
                          {shipment.category} - {shipment.subCategory}
                        </div>
                      </td>
                      <td className='py-4 px-6'>
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
                      <td className='py-4 px-6'>
                        <div className='text-sm font-medium text-slate-900'>
                          {shipment.carrierName || 'Atanmamış'}
                        </div>
                        {shipment.carrierName && shipment.rating && (
                          <div className='text-xs text-slate-500'>
                            {shipment.rating}/5 ⭐
                          </div>
                        )}
                      </td>
                      <td className='py-4 px-6'>
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
                      <td className='py-4 px-6'>
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && pagination.pages > 1 && (
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
    </div>
  );
};

export default CorporateMyShipments;
