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
import Breadcrumb from '../../components/common/Breadcrumb';
import LoadingState from '../../components/common/LoadingState';
import { Link } from 'react-router-dom';
import { createApiUrl } from '../../config/api';

interface Job {
  id: number;
  title: string;
  pickupCity: string;
  deliveryCity: string;
  completedDate: string;
  price: number;
  rating: number;
}

const TasiyiciCompletedJobs: React.FC = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

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
        console.error('Error parsing user data:', error);
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
        setJobs(data.shipments || data.data || []);
      }
    } catch (error) {
      console.error('Error loading completed jobs:', error);
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
                            {new Date(job.completedDate).toLocaleDateString('tr-TR')}
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
                  <Link
                    to={`/tasiyici/jobs/${job.id}`}
                    className='px-4 py-2 bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 text-white rounded-lg font-medium transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl'
                  >
                    <Eye className='w-4 h-4' />
                    Detayları Gör
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className='bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center'>
            <Package className='w-16 h-16 text-gray-400 mx-auto mb-4' />
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>
              Tamamlanan işiniz yok
            </h3>
            <p className='text-gray-600 mb-4'>
              Henüz hiç iş tamamlamadınız. Aktif işlerinizi tamamlayarak başlayın.
            </p>
            <Link to='/tasiyici/active-jobs' className='inline-block'>
              <button className='px-6 py-2 bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 text-white rounded-lg font-medium transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl mx-auto'>
                <ArrowRight className='w-4 h-4' />
                Aktif İşlere Git
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default TasiyiciCompletedJobs;
