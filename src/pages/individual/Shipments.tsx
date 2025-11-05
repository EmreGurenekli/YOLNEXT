import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../contexts/AuthContext';
import { shipmentAPI } from '../../services/api';
import {
  Package,
  Truck,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  Filter,
  Search,
} from 'lucide-react';

interface Shipment {
  id: number;
  title: string;
  description: string;
  pickupAddress: string;
  deliveryAddress: string;
  pickupCity: string;
  deliveryCity: string;
  status: string;
  price: number;
  createdAt: string;
  pickupDate: string;
  deliveryDate: string;
}

const IndividualShipments: React.FC = () => {
  const { user } = useAuth();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadShipments();
  }, [filterStatus]);

  const loadShipments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const params = new URLSearchParams();
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }
      if (user?.id) {
        params.append('userId', user.id.toString());
      }

      const response = await fetch(`/api/shipments?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to load shipments');

      const data = await response.json();
      setShipments(data.shipments || (Array.isArray(data) ? data : []));
    } catch (error) {
      console.error('Error loading shipments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className='w-4 h-4' />;
      case 'in_transit':
        return <Truck className='w-4 h-4' />;
      case 'delivered':
        return <CheckCircle className='w-4 h-4' />;
      case 'cancelled':
        return <XCircle className='w-4 h-4' />;
      default:
        return <AlertCircle className='w-4 h-4' />;
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
        return status;
    }
  };

  const filteredShipments = shipments.filter(shipment => {
    const matchesSearch =
      shipment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.pickupCity?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.deliveryCity?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === 'all' || shipment.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className='min-h-screen bg-gray-50'>
      <Helmet>
        <title>Gönderilerim - YolNext</title>
      </Helmet>

      <div className='max-w-7xl mx-auto px-4 py-8'>
        {/* Header */}
        <div className='bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6'>
          <h1 className='text-2xl font-bold text-gray-900 mb-4'>
            Gönderilerim
          </h1>
          <p className='text-gray-600'>
            Oluşturduğunuz tüm gönderileri buradan yönetebilirsiniz
          </p>
        </div>

        {/* Filters */}
        <div className='bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
              <input
                type='text'
                placeholder='Gönderi ara...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              />
            </div>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            >
              <option value='all'>Tüm Durumlar</option>
              <option value='pending'>Beklemede</option>
              <option value='in_transit'>Yolda</option>
              <option value='delivered'>Teslim Edildi</option>
              <option value='cancelled'>İptal Edildi</option>
            </select>
          </div>
        </div>

        {/* Shipments List */}
        {loading ? (
          <div className='bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto'></div>
            <p className='mt-4 text-gray-600'>Yükleniyor...</p>
          </div>
        ) : filteredShipments.length > 0 ? (
          <div className='space-y-4'>
            {filteredShipments.map(shipment => (
              <div
                key={shipment.id}
                className='bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow'
              >
                <div className='flex items-start justify-between mb-4'>
                  <div className='flex-1'>
                    <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                      {shipment.title}
                    </h3>
                    <p className='text-gray-600 text-sm mb-3'>
                      {shipment.description}
                    </p>

                    <div className='flex flex-wrap items-center gap-4 text-sm text-gray-600'>
                      <div className='flex items-center gap-1'>
                        <MapPin className='w-4 h-4' />
                        <span>{shipment.pickupCity || 'N/A'}</span>
                      </div>
                      <span>→</span>
                      <div className='flex items-center gap-1'>
                        <MapPin className='w-4 h-4' />
                        <span>{shipment.deliveryCity || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className='flex items-center gap-2'>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${getStatusColor(shipment.status)}`}
                    >
                      {getStatusIcon(shipment.status)}
                      {getStatusText(shipment.status)}
                    </span>
                  </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-4'>
                  <div className='flex items-center gap-2 text-sm text-gray-600'>
                    <Calendar className='w-4 h-4' />
                    <span>
                      {new Date(shipment.pickupDate).toLocaleDateString(
                        'tr-TR'
                      )}
                    </span>
                  </div>
                  <div className='flex items-center gap-2 text-sm text-gray-600'>
                    <Package className='w-4 h-4' />
                    <span>Fiyat: ₺{shipment.price.toLocaleString()}</span>
                  </div>
                  <div className='flex items-center gap-2 text-sm text-gray-600'>
                    <Clock className='w-4 h-4' />
                    <span>
                      {new Date(shipment.createdAt).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                </div>

                <div className='flex items-center justify-between pt-4 border-t border-gray-200'>
                  <div className='text-sm text-gray-500'>#{shipment.id}</div>
                  <div className='flex gap-2'>
                    <button className='px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2'>
                      <Eye className='w-4 h-4' />
                      Detaylar
                    </button>
                    <button className='px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2'>
                      <Edit className='w-4 h-4' />
                      Düzenle
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className='bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center'>
            <Package className='w-16 h-16 text-gray-400 mx-auto mb-4' />
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>
              Gönderi bulunamadı
            </h3>
            <p className='text-gray-600 mb-6'>
              Henüz hiç gönderi oluşturmadınız veya arama kriterlerinize uygun
              gönderi yok.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default IndividualShipments;
