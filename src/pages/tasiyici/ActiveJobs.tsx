import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Clock, MapPin, DollarSign, Truck, CheckCircle, ArrowRight, Package, Search } from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';
import LoadingState from '../../components/common/LoadingState';

const ActiveJobs: React.FC = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadActiveJobs = async () => {
      try {
        setLoading(true);
        const userRaw = localStorage.getItem('user');
        const userId = userRaw ? JSON.parse(userRaw || '{}').id : undefined;
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/shipments/tasiyici', {
          headers: {
            Authorization: `Bearer ${token || ''}`,
            'X-User-Id': userId || '',
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) throw new Error('Aktif işler alınamadı');
        const data = await response.json();
        const rows = (Array.isArray(data) ? data : data.data || []) as any[];
        const mapped = rows.map(row => ({
          id: row.id,
          title:
            row.title || `${row.pickupCity || ''} → ${row.deliveryCity || ''}`,
          from: row.pickupAddress || row.pickupCity || '-',
          to: row.deliveryAddress || row.deliveryCity || '-',
          pickupCity: row.pickupCity || '',
          deliveryCity: row.deliveryCity || '',
          price:
            typeof row.price === 'number'
              ? row.price
              : parseFloat(row.price?.replace(/[^0-9.,]/g, '').replace(',', '.')) || 0,
          status: row.status || 'accepted',
          estimatedTime: row.deliveryDate || '-',
          pickupDate: row.pickupDate,
          weight: row.weight,
          volume: row.volume,
        }));
        setJobs(mapped);
      } catch (e) {
        if (import.meta.env.DEV) console.error(e);
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };
    loadActiveJobs();
  }, []);

  // Extract city names from addresses
  const getCity = (address?: string, city?: string) => {
    if (city) return city;
    if (!address) return '';
    const parts = address.split(',');
    return parts[parts.length - 1]?.trim() || address;
  };

  const filteredJobs = jobs.filter(job => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      job.title?.toLowerCase().includes(term) ||
      job.pickupCity?.toLowerCase().includes(term) ||
      job.deliveryCity?.toLowerCase().includes(term) ||
      job.from?.toLowerCase().includes(term) ||
      job.to?.toLowerCase().includes(term)
    );
  });

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50'>
      <Helmet>
        <title>Aktif İşler - Taşıyıcı Panel - YolNext</title>
      </Helmet>

      <div className='max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6'>
        {/* Breadcrumb */}
        <div className='mb-4 sm:mb-6'>
          <Breadcrumb items={[{ label: 'Aktif İşler', href: '/tasiyici/active-jobs' }]} />
        </div>

        {/* Hero Section */}
        <div className='relative overflow-hidden bg-gradient-to-br from-slate-800 via-blue-900 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl mb-6'>
          <div className='absolute inset-0 bg-gradient-to-br from-white/5 to-transparent'></div>
          <div className='absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full -translate-y-40 translate-x-40'></div>
          <div className='absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-slate-400/10 to-blue-400/10 rounded-full translate-y-32 -translate-x-32'></div>

          <div className='relative z-10'>
            <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
              <div className='flex items-center gap-4'>
                <div className='w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-xl border border-white/20'>
                  <Truck className='w-8 h-8 text-white' />
                </div>
                <div>
                  <h1 className='text-3xl font-bold mb-2 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent'>
                    Aktif İşler
                  </h1>
                  <p className='text-slate-200 text-base sm:text-lg leading-relaxed'>
                    Devam eden işlerinizi buradan takip edin ve yönetin
                  </p>
                </div>
                      </div>
              <div className='bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20'>
                <span className='text-slate-200 font-medium'>
                  {jobs.length} {jobs.length === 1 ? 'Aktif İş' : 'Aktif İş'}
                </span>
                      </div>
                      </div>
                    </div>
                  </div>

        {/* Search */}
        {jobs.length > 0 && (
          <div className='bg-white rounded-xl p-4 shadow-lg border border-gray-100 mb-6'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
              <input
                type='text'
                placeholder='İş ara... (başlık, şehir, adres)'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              />
            </div>
          </div>
        )}

        {/* Jobs List */}
        {jobs.length === 0 ? (
          <div className='bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center'>
            <Truck className='w-16 h-16 text-gray-400 mx-auto mb-4' />
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>
              Aktif iş bulunmuyor
            </h3>
            <p className='text-gray-600 mb-4'>
              Henüz aktif bir işiniz bulunmamaktadır. Yeni iş fırsatları için pazara göz atın.
            </p>
            <Link to='/tasiyici/market'>
              <button className='px-6 py-2 bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 text-white rounded-lg font-medium transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl mx-auto'>
                <ArrowRight className='w-4 h-4' />
                Pazara Git
              </button>
            </Link>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className='bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center'>
            <Search className='w-16 h-16 text-gray-400 mx-auto mb-4' />
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>
              Arama sonucu bulunamadı
            </h3>
            <p className='text-gray-600 mb-4'>
              Arama kriterlerinize uygun aktif iş bulunamadı.
            </p>
            <button
              onClick={() => setSearchTerm('')}
              className='px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-all duration-300'
            >
              Aramayı Temizle
            </button>
          </div>
        ) : (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3'>
            {filteredJobs.map(job => {
              const pickupCity = getCity(job.from, job.pickupCity);
              const deliveryCity = getCity(job.to, job.deliveryCity);

              return (
                <div
                  key={job.id}
                  className='bg-white rounded-lg p-3 shadow-md border border-gray-100 hover:shadow-lg hover:border-blue-300 transition-all duration-300 flex flex-col'
                >
                  {/* Title */}
                  <h3 className='text-sm font-bold text-slate-900 mb-2 line-clamp-1'>
                    {job.title}
                  </h3>
                  
                  {/* Route - Compact */}
                  <div className='mb-2.5'>
                    <div className='flex items-center gap-1 mb-1'>
                      <MapPin className='w-3 h-3 text-blue-600 flex-shrink-0' />
                      <span className='text-xs font-medium text-slate-900 truncate'>
                        {pickupCity || 'Belirtilmemiş'}
                      </span>
                    </div>
                    <div className='flex items-center gap-1'>
                      <ArrowRight className='w-2.5 h-2.5 text-slate-400 mx-1.5' />
                      <MapPin className='w-3 h-3 text-blue-600 flex-shrink-0' />
                      <span className='text-xs font-medium text-slate-900 truncate'>
                        {deliveryCity || 'Belirtilmemiş'}
                      </span>
                    </div>
                  </div>

                  {/* Details - Inline */}
                  <div className='flex flex-wrap items-center gap-2 mb-2.5 text-xs text-slate-600'>
                    {job.pickupDate && (
                      <div className='flex items-center gap-1'>
                        <Clock className='w-3 h-3' />
                        <span>
                          {new Date(job.pickupDate).toLocaleDateString('tr-TR', {
                            day: 'numeric',
                            month: 'short',
                          })}
                  </span>
                </div>
                    )}
                    {typeof job.weight === 'number' && (
                      <div className='flex items-center gap-1'>
                        <Truck className='w-3 h-3' />
                        <span>{job.weight}kg</span>
                      </div>
                    )}
                    {typeof job.volume === 'number' && job.volume > 0 && (
                      <div className='flex items-center gap-1'>
                        <Package className='w-3 h-3' />
                        <span>{job.volume}m³</span>
                      </div>
                    )}
                  </div>

                  {/* Price - Prominent */}
                  <div className='mb-2.5 pb-2.5 border-b border-gray-200'>
                    <div className='text-lg font-bold text-green-600'>
                      ₺{job.price.toLocaleString('tr-TR')}
                  </div>
              </div>

                  {/* Status Badge */}
                  <div className='mb-2.5'>
                    <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200'>
                      <CheckCircle className='w-3 h-3 mr-1' />
                      {job.status === 'accepted' ? 'Kabul Edildi' : 
                       job.status === 'in_progress' ? 'Devam Ediyor' :
                       job.status === 'in_transit' ? 'Yolda' : 'Aktif'}
                    </span>
                  </div>

                  {/* Action Button */}
                  <Link
                    to={`/tasiyici/jobs/${job.id}`}
                    className='w-full px-2.5 py-1.5 bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 text-white rounded-lg text-xs font-medium transition-all duration-300 flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg'
                  >
                    <ArrowRight className='w-3 h-3' />
                    Detayları Gör
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        {/* Results Count */}
        {searchTerm && filteredJobs.length > 0 && (
          <div className='mt-4 bg-blue-50 rounded-lg p-3 border border-blue-200 text-sm text-blue-800 text-center'>
            {filteredJobs.length} iş bulundu (toplam {jobs.length})
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveJobs;
