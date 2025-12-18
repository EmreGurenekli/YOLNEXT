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
  Filter,
  Search,
  Download,
  Star,
  DollarSign,
  Building2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createApiUrl } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';

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

const IndividualHistory: React.FC = () => {
  const { user } = useAuth();
  const [shipments, setShipments] = useState<ShipmentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  useEffect(() => {
    const loadHistoryData = async () => {
      try {
        console.log('🔄 Geçmiş gönderiler yükleniyor...');
        setLoading(true);

        // Use regular shipments endpoint and filter for delivered status on frontend
        const userId = user?.id;
        if (!userId) {
          setShipments([]);
          setLoading(false);
          return;
        }

        const params = new URLSearchParams({
          page: '1',
          limit: '100',
          userId: userId.toString(),
        });
        const response = await fetch(createApiUrl(`/api/shipments?${params.toString()}`), {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to load history data');
        }

        const data = await response.json();
        // Get shipments from response
        const allShipments = data.data?.shipments || data.shipments || (Array.isArray(data.data) ? data.data : []) || [];
        
        // Only show delivered shipments in history
        const deliveredShipments = allShipments.filter(
          (shipment: any) => shipment.status === 'delivered'
        ).map((shipment: any) => ({
          id: shipment.id?.toString() || '',
          title: shipment.title || shipment.productDescription || 'Gönderi',
          from: shipment.pickupCity || shipment.fromCity || '',
          to: shipment.deliveryCity || shipment.toCity || '',
          status: 'delivered' as const,
          createdAt: shipment.createdAt || shipment.created_at || '',
          estimatedDelivery: shipment.deliveryDate || shipment.estimatedDelivery || '',
          actualDelivery: shipment.actualDelivery || shipment.deliveredAt || '',
          price: typeof shipment.price === 'string' ? parseFloat(shipment.price) || 0 : (shipment.price || 0),
          carrierName: shipment.carrierName || shipment.nakliyeciName || 'Nakliyeci',
          rating: shipment.rating || 0,
          trackingCode: shipment.trackingNumber || shipment.trackingCode || shipment.id?.toString() || '',
          category: shipment.category || '',
          weight: shipment.weight?.toString() || '',
          dimensions: shipment.dimensions || '',
          description: shipment.description || shipment.productDescription || '',
        }));
        
        setShipments(deliveredShipments);
        console.log(
          '✅ Geçmiş gönderiler yüklendi (sadece teslim edilenler):',
          deliveredShipments.length
        );
      } catch (error) {
        console.error('❌ Geçmiş gönderiler yüklenirken hata:', error);
        setShipments([]);
      } finally {
        setLoading(false);
      }
    };

    loadHistoryData();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
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
        <title>Geçmiş Gönderiler - YolNext Bireysel</title>
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
              Gönderileriniz
            </span>
          </h1>
          <p className='text-lg text-slate-600'>
            Tamamlanan gönderilerinizi görüntüleyin ve analiz edin
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

            <button className='px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2'>
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
                            to={`/individual/shipments/${shipment.id}`}
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
        </div>

        {/* Quick Actions */}
        <div className='mt-8 text-center'>
          <Link
            to='/individual/create-shipment'
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

export default IndividualHistory;
