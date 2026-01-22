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
import GuidanceOverlay from '../../components/common/GuidanceOverlay';
import { createApiUrl } from '../../config/api';

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
    try {
      const raw = localStorage.getItem('user');
      const parsed = raw ? JSON.parse(raw) : null;
      const userId = parsed?.id;
      const role = String(parsed?.role || 'tasiyici').toLowerCase();
      if (!userId) return;
      localStorage.setItem(`yolnext:lastSeen:offers:${userId}:${role}`, new Date().toISOString());
      window.dispatchEvent(new Event('yolnext:refresh-badges'));
    } catch {
      // ignore
    }
  }, []);

  const loadOffers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const userRaw = localStorage.getItem('user');
      const userId = userRaw ? JSON.parse(userRaw || '{}').id : undefined;
      const url = createApiUrl('/api/carrier-market/bids?mine=1');
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
      const rows = (Array.isArray(data)
        ? data
        : (data?.data?.bids || data?.data || data?.offers || data?.bids || [])) as any[];

      const filteredRows = rows;
      setOffers(
        filteredRows.map(row => ({
          id: row.id,
          shipmentId: Number(row.shipmentId || row.shipment_id || row.listingId || row.listing_id || 0),
          price: row.bidPrice || row.price || 0,
          status: row.status || 'pending',
          createdAt: row.createdAt || '',
          shipmentTitle: row.shipmentTitle || row.title,
          pickupAddress: row.pickupAddress || row.pickup_address,
          deliveryAddress: row.deliveryAddress || row.delivery_address,
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

  useEffect(() => {
    loadOffers();
  }, []);

  useEffect(() => {
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        loadOffers();
      }
    };

    const handleGlobalRefresh = () => {
      loadOffers();
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('yolnext:refresh-badges', handleGlobalRefresh);

    return () => {
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('yolnext:refresh-badges', handleGlobalRefresh);
    };
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

        <div className='mb-6'>
          <GuidanceOverlay
            storageKey='tasiyici.my-offers'
            isEmpty={!loading && offers.length === 0}
            icon={DollarSign}
            title='Tekliflerim'
            description='Verdiğin tekliflerin durumunu buradan takip et. Kabul edilen işleri “Aktif İşler”de yönet; yeni iş almak için “Pazar”a dön.'
            primaryAction={{
              label: 'Aktif İşler',
              to: '/tasiyici/active-jobs',
            }}
            secondaryAction={{
              label: 'Pazar',
              to: '/tasiyici/market',
            }}
          />
        </div>

        {/* Offers List */}
        {offers.length === 0 ? (
          <div className='min-h-[50vh] flex items-center justify-center'>
            <div className='bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center w-full max-w-2xl'>
              <DollarSign className='w-16 h-16 text-gray-400 mx-auto mb-4' />
              <h3 className='text-xl font-bold text-gray-900 mb-2'>
                💰 Henüz teklif vermedin
              </h3>
              <p className='text-gray-600 mb-6'>
                Pazarda uygun işlere teklif ver, kabul edilince kazanmaya başla!
              </p>
              <div className='flex flex-col sm:flex-row gap-3 justify-center'>
                <Link to='/tasiyici/market'>
                  <button className='px-6 py-3 bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl'>
                    Pazara Git
                  </button>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className='space-y-4'>
            {offers.map(offer => (
              <div
                key={offer.id}
                className='bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-300 transition-all duration-300'
              >
                <div className='flex items-start justify-between mb-4'>
                  <div className='flex-1'>
                    <h3 className='text-lg font-semibold text-slate-900 mb-3'>
                      {offer.shipmentTitle || `Gönderi #${offer.shipmentId}`}
                    </h3>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600'>
                      <div className='flex items-center gap-2'>
                        <div className='w-10 h-10 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center'>
                          <MapPin className='w-5 h-5 text-white' />
                        </div>
                        <div>
                          <div className='text-xs text-slate-500'>Rota</div>
                          <div className='font-medium text-slate-900'>
                            {offer.pickupAddress || '—'} → {offer.deliveryAddress || '—'}
                          </div>
                        </div>
                      </div>
                      <div className='flex items-center gap-2'>
                        <div className='w-10 h-10 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center'>
                          <DollarSign className='w-5 h-5 text-white' />
                        </div>
                        <div>
                          <div className='text-xs text-slate-500'>Teklif</div>
                          <div className='font-medium text-slate-900'>
                            ₺{offer.price.toLocaleString('tr-TR')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <span className='px-4 py-2 bg-slate-100 text-slate-800 rounded-full text-sm font-semibold border border-slate-200'>
                    {statusPill(offer.status)}
                  </span>
                </div>

                <div className='flex items-center justify-between pt-4 border-t border-gray-200'>
                  <span className='text-sm text-slate-500'>#{offer.id}{offer.shipmentId ? ` • İş #${offer.shipmentId}` : ''}</span>
                  {offer.shipmentId ? (
                    <Link
                      to={`/tasiyici/jobs/${offer.shipmentId}`}
                      className='px-4 py-2 bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 text-white rounded-lg font-medium transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl'
                    >
                      <Eye className='w-4 h-4' />
                      Detayları Gör
                    </Link>
                  ) : (
                    <span className='px-4 py-2 bg-slate-100 text-slate-500 rounded-lg font-medium border border-slate-200'>
                      Detay Hazırlanıyor
                    </span>
                  )}
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
