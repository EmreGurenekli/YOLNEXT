import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../contexts/AuthContext';
import {
  Package,
  MapPin,
  Calendar,
  CheckCircle,
  Star,
  Eye,
  Download,
  ArrowRight,
} from 'lucide-react';
import Breadcrumb from '../../components/shared-ui-elements/Breadcrumb';
import LoadingState from '../../components/shared-ui-elements/LoadingState';
import RatingModal from '../../components/RatingModal';
import { Link } from 'react-router-dom';
import { createApiUrl } from '../../config/api';
import GuidanceOverlay from '../../components/shared-ui-elements/GuidanceOverlay';

interface Job {
  id: number;
  title: string;
  pickupCity: string;
  deliveryCity: string;
  completedDate: string;
  price: number;
  rating: number;
  carrierId?: number;
  carrierName?: string;
  hasRatedCarrier?: boolean;
}

const safeDateText = (value?: string) => {
  if (!value) return '-';
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) return '-';
  return d.toLocaleDateString('tr-TR');
};

const TasiyiciCompletedJobs: React.FC = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState<{id: string; name: string; email: string; type: string} | null>(null);
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);

  useEffect(() => {
    loadCompletedJobs();
  }, []);

  const loadCompletedJobs = async () => {
    try {
      setLoading(true);
      const userRaw = localStorage.getItem('user');
      let userId: string | undefined;
      try {
        userId = userRaw ? JSON.parse(userRaw).id : undefined;
      } catch (error) {
        console.error('Kullanıcı verisi ayrıştırılırken hata:', error);
        userId = undefined;
      }
      const token = localStorage.getItem('authToken');
      const response = await fetch(createApiUrl('/api/shipments/tasiyici/completed'), {
        headers: {
          Authorization: `Bearer ${token || ''}`,
          'X-User-Id': userId || '',
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const rows = Array.isArray(data)
          ? data
          : (data.shipments || data.data || []);

        const mapped = (Array.isArray(rows) ? rows : []).map((s: any) => ({
          id: typeof s.id === 'number' ? s.id : parseInt(String(s.id || 0), 10),
          title: String(s.title || s.shipmentTitle || 'Gönderi'),
          pickupCity: String(s.pickupCity || s.pickup_city || ''),
          deliveryCity: String(s.deliveryCity || s.delivery_city || ''),
          completedDate: String(
            s.actualdeliverydate || s.actualDeliveryDate || s.actual_delivery_date ||
            s.deliveredAt || s.delivered_at || 
            s.completedAt || s.completed_at ||
            s.updatedAt || s.updated_at ||
            s.createdAt || s.created_at || ''
          ),
          price: typeof s.price === 'number' ? s.price : parseFloat(String(s.price || s.displayPrice || 0)) || 0,
          rating: typeof s.rating === 'number' ? s.rating : parseFloat(String(s.rating || 0)) || 0,
          carrierId: s.carrierId != null ? Number(s.carrierId) : (s.nakliyeci_id != null ? Number(s.nakliyeci_id) : undefined),
          carrierName: String(s.carrierName || s.carrier_name || s.nakliyeciName || s.nakliyeci_name || s.carrierEmail || s.carrier_email || ''),
          hasRatedCarrier: Boolean(s.hasRatedCarrier || s.has_rated_carrier),
        }));

        setJobs(mapped);
      }
    } catch (error) {
      console.error('Tamamlanan işler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className='min-h-screen bg-white'>
      <Helmet>
        <title>Tamamlanan İşler - Taşıyıcı Panel - YolNext</title>
      </Helmet>

      <div className='max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6'>
        {/* Breadcrumb */}
        <div className='mb-4 sm:mb-6'>
          <Breadcrumb items={[{ label: 'Tamamlanan İşler', href: '/tasiyici/completed-jobs' }]} />
        </div>

        {/* Hero Section */}
        <div className='relative overflow-hidden bg-gradient-to-br from-slate-800 via-blue-900 to-indigo-900 rounded-3xl p-6 text-white shadow-2xl mb-8'>
          <div className='absolute inset-0 bg-gradient-to-br from-white/5 to-transparent'></div>
          <div className='absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full -translate-y-40 translate-x-40'></div>
          <div className='absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-slate-400/10 to-blue-400/10 rounded-full translate-y-32 -translate-x-32'></div>

          <div className='relative z-10'>
            <div className='flex items-center gap-4 mb-6'>
              <div className='w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-xl border border-white/20'>
                <CheckCircle className='w-8 h-8 text-white' />
              </div>
              <div>
                <h1 className='text-3xl font-bold mb-2 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent'>
                  Tamamlanan İşler
                </h1>
                <p className='text-slate-200 text-lg leading-relaxed'>
                  Başarıyla tamamladığınız işlerin geçmişi
                </p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className='grid grid-cols-1 gap-4'>
              <div className='bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20'>
                <div className='flex items-center justify-between'>
                  <div>
                    <div className='text-sm text-slate-300 mb-1'>Tamamlanan İş</div>
                    <div className='text-2xl font-bold text-white'>{jobs.length}</div>
                  </div>
                  <CheckCircle className='w-8 h-8 text-blue-300' />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className='mb-6'>
          <GuidanceOverlay
            storageKey='tasiyici.completed-jobs'
            isEmpty={!loading && jobs.length === 0}
            icon={CheckCircle}
            title='Tamamlanan İşler'
            description='Tamamlanan işlerini buradan inceleyebilirsin. Yeni iş almak için “Pazar”a geç; devam eden operasyonlar için “İşlerim”e bak.'
            primaryAction={{
              label: 'Pazar',
              to: '/tasiyici/market',
            }}
            secondaryAction={{
              label: 'İşlerim',
              to: '/tasiyici/islerim',
            }}
          />
        </div>

        {/* Jobs List */}
        {jobs.length > 0 ? (
          <div className='space-y-4'>
            {jobs.map(job => (
              <div
                key={job.id}
                className='bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-300 transition-all duration-300'
              >
                <div className='flex items-start justify-between mb-4'>
                  <div className='flex-1'>
                    <h3 className='text-lg font-semibold text-slate-900 mb-3'>
                      {job.title}
                    </h3>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600'>
                      <div className='flex items-center gap-2'>
                        <div className='w-10 h-10 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center'>
                          <MapPin className='w-5 h-5 text-white' />
                        </div>
                        <div>
                          <div className='text-xs text-slate-500'>Rota</div>
                          <div className='font-medium text-slate-900'>
                            {job.pickupCity} → {job.deliveryCity}
                          </div>
                        </div>
                      </div>
                      <div className='flex items-center gap-2'>
                        <div className='w-10 h-10 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center'>
                          <Calendar className='w-5 h-5 text-white' />
                        </div>
                        <div>
                          <div className='text-xs text-slate-500'>Tamamlanma</div>
                          <div className='font-medium text-slate-900'>
                            {safeDateText(job.completedDate)}
                          </div>
                        </div>
                      </div>
                      {job.rating && (
                        <div className='flex items-center gap-2'>
                          <div className='w-10 h-10 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center'>
                            <Star className='w-5 h-5 text-yellow-400 fill-current' />
                          </div>
                          <div>
                            <div className='text-xs text-slate-500'>Puan</div>
                            <div className='font-medium text-slate-900'>{job.rating}/5</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <span className='px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold border border-green-200 flex items-center gap-2'>
                    <CheckCircle className='w-4 h-4' />
                    Tamamlandı
                  </span>
                </div>

                <div className='flex items-center justify-between pt-4 border-t border-gray-200'>
                  <span className='text-sm text-slate-500'>#{job.id}</span>
                  <div className='flex gap-2'>
                    {job.carrierId && !job.hasRatedCarrier && (
                      <button
                        onClick={() => {
                          setSelectedCarrier({
                            id: job.carrierId?.toString() || '',
                            name: job.carrierName || 'Nakliyeci',
                            email: '',
                            type: 'nakliyeci',
                          });
                          setSelectedShipmentId(job.id.toString());
                          setShowRatingModal(true);
                        }}
                        className='px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl'
                      >
                        <Star className='w-4 h-4' />
                        Değerlendir
                      </button>
                    )}
                    <Link
                      to={`/tasiyici/jobs/${job.id}`}
                      className='px-4 py-2 bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 text-white rounded-lg font-medium transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl'
                    >
                      <Eye className='w-4 h-4' />
                      Detayları Gör
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className='min-h-[50vh] flex items-center justify-center'>
            <div className='bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center w-full max-w-2xl'>
              <Package className='w-16 h-16 text-gray-400 mx-auto mb-4' />
              <h3 className='text-xl font-bold text-gray-900 mb-2'>
                Tamamlanan işin yok
              </h3>
              <p className='text-gray-600 mb-6'>
                Tamamlanan işler burada listelenir. Önce “İşlerim” sayfasından iş alıp tamamlayabilirsin.
              </p>
              <div className='flex flex-col sm:flex-row gap-3 justify-center'>
                <Link to='/tasiyici/islerim'>
                  <button className='px-6 py-3 bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl'>
                    İşlerime Git
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}

      {/* Rating Modal */}
      {showRatingModal && selectedCarrier && user && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={() => {
            setShowRatingModal(false);
            setSelectedCarrier(null);
            setSelectedShipmentId(null);
            loadCompletedJobs(); // Reload to show updated rating
          }}
          ratedUser={selectedCarrier}
          currentUser={{
            id: user.id || '',
            name: user.fullName || 'Kullanıcı',
          }}
          shipmentId={selectedShipmentId || undefined}
        />
      )}
      </div>
    </div>
  );
};

export default TasiyiciCompletedJobs;











