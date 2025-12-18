import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  CheckCircle,
  Clock,
  XCircle,
  MapPin,
  Truck,
  DollarSign,
  ArrowRight,
  Eye,
} from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';
import LoadingState from '../../components/common/LoadingState';
import { Link } from 'react-router-dom';

interface CarrierOffer {
  id: number;
  shipmentId: number;
  price: number;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  createdAt: string;
  shipmentTitle?: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  weight?: number;
}

const MyOffers: React.FC = () => {
  const [offers, setOffers] = useState<CarrierOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOffers = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('authToken');
        const userRaw = localStorage.getItem('user');
        const userId = userRaw ? JSON.parse(userRaw || '{}').id : undefined;
        const url = '/api/carrier-market/bids?mine=1';
        const headers = {
          Authorization: `Bearer ${token || ''}`,
          'X-User-Id': userId || '',
          'Content-Type': 'application/json',
        };

        const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        let res = await fetch(url, { headers });
        if (res.status === 429) {
          await sleep(800);
          res = await fetch(url, { headers });
        }
        if (!res.ok) throw new Error('Teklifler alınamadı');
        const data = await res.json();
        const rows = (
          Array.isArray(data) ? data : data.data || data.offers || []
        ) as any[];

        const filteredRows = rows;
        setOffers(
          filteredRows.map(row => ({
            id: row.id,
            shipmentId: row.shipmentId,
            price: row.bidPrice || row.price || 0,
            status: row.status || 'pending',
            createdAt: row.createdAt || '',
            shipmentTitle: row.shipmentTitle || row.title,
            pickupAddress: row.pickupAddress,
            deliveryAddress: row.deliveryAddress,
            weight: row.weight,
          }))
        );
      } catch (e) {
        if (import.meta.env.DEV) console.error(e);
        setOffers([]);
      } finally {
        setLoading(false);
      }
    };
    loadOffers();
  }, []);

  const statusPill = (status: string) => {
    switch (status) {
      case 'accepted':
        return (
          <span className='px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 inline-flex items-center gap-1'>
            <CheckCircle className='w-3 h-3' />
            Kabul
          </span>
        );
      case 'rejected':
        return (
          <span className='px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 inline-flex items-center gap-1'>
            <XCircle className='w-3 h-3' />
            Red
          </span>
        );
      default:
        return (
          <span className='px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 inline-flex items-center gap-1'>
            <Clock className='w-3 h-3' />
            Beklemede
          </span>
        );
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className='min-h-screen bg-white'>
      <Helmet>
        <title>Tekliflerim - Taşıyıcı - YolNext</title>
      </Helmet>

      <div className='max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6'>
        {/* Breadcrumb */}
        <div className='mb-4 sm:mb-6'>
          <Breadcrumb items={[{ label: 'Tekliflerim', href: '/tasiyici/my-offers' }]} />
        </div>

        {/* Hero Section */}
        <div className='relative overflow-hidden bg-gradient-to-br from-slate-800 via-blue-900 to-indigo-900 rounded-3xl p-6 text-white shadow-2xl mb-8'>
          <div className='absolute inset-0 bg-gradient-to-br from-white/5 to-transparent'></div>
          <div className='absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full -translate-y-40 translate-x-40'></div>
          <div className='absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-slate-400/10 to-blue-400/10 rounded-full translate-y-32 -translate-x-32'></div>

          <div className='relative z-10'>
            <div className='flex items-center gap-4 mb-4'>
              <div className='w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-xl border border-white/20'>
                <CheckCircle className='w-8 h-8 text-white' />
              </div>
              <div>
                <h1 className='text-3xl font-bold mb-2 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent'>
                  Tekliflerim
                </h1>
                <p className='text-slate-200 text-lg leading-relaxed'>
                  Verdiğiniz tekliflerin durumunu buradan takip edin
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Offers List */}
        {offers.length === 0 ? (
          <div className='bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center'>
            <Truck className='w-16 h-16 text-gray-400 mx-auto mb-4' />
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>
              Henüz teklif bulunmuyor
            </h3>
            <p className='text-gray-600 mb-4'>
              Açık işlere teklif vererek başlayın ve yeni iş fırsatları yakalayın.
            </p>
            <Link to='/tasiyici/market' className='inline-block'>
              <button className='px-6 py-2 bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 text-white rounded-lg font-medium transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl mx-auto'>
                <ArrowRight className='w-4 h-4' />
                Pazara Git
              </button>
            </Link>
          </div>
        ) : (
          <div className='space-y-4'>
            {offers.map(o => (
              <div
                key={o.id}
                className='bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-300 transition-all duration-300'
              >
                <div className='flex items-start justify-between mb-4'>
                  <div className='flex-1'>
                    <h3 className='text-xl font-bold text-slate-900 mb-3'>
                      {o.shipmentTitle || `Gönderi #${o.shipmentId}`}
                    </h3>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600'>
                      <div className='flex items-center gap-2'>
                        <div className='w-10 h-10 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center'>
                          <MapPin className='w-5 h-5 text-white' />
                        </div>
                        <div>
                          <div className='text-xs text-slate-500'>Rota</div>
                          <div className='font-medium text-slate-900'>
                            {o.pickupAddress} → {o.deliveryAddress}
                          </div>
                        </div>
                      </div>
                      {typeof o.weight === 'number' && (
                        <div className='flex items-center gap-2'>
                          <div className='w-10 h-10 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center'>
                            <Truck className='w-5 h-5 text-white' />
                          </div>
                          <div>
                            <div className='text-xs text-slate-500'>Ağırlık</div>
                            <div className='font-medium text-slate-900'>{o.weight}kg</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className='text-right ml-4'>
                    <div className='text-2xl font-bold text-slate-900 mb-2 inline-flex items-center gap-1'>
                      <DollarSign className='w-5 h-5' />
                      {o.price.toLocaleString('tr-TR')}
                    </div>
                    <div>{statusPill(o.status)}</div>
                  </div>
                </div>
                <div className='pt-4 border-t border-gray-200 flex gap-2'>
                  {o.status === 'pending' && (
                    <Link
                      to={`/tasiyici/market`}
                      className='px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-all duration-300 flex items-center gap-2'
                    >
                      <ArrowRight className='w-4 h-4' />
                      İlanı Gör
                    </Link>
                  )}
                  {o.status === 'accepted' && (
                    <Link
                      to={`/tasiyici/active-jobs`}
                      className='px-4 py-2 bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 text-white rounded-lg font-medium transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl'
                    >
                      <ArrowRight className='w-4 h-4' />
                      İşe Git
                    </Link>
                  )}
                  <button className='px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-all duration-300 flex items-center gap-2'>
                    <Eye className='w-4 h-4' />
                    Detaylar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOffers;
