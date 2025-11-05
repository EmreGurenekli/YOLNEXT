import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Package,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  Truck,
  User,
  Phone,
  Mail,
  ArrowLeft,
  AlertCircle,
  Building2,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Breadcrumb from '../../components/common/Breadcrumb';
import LoadingState from '../../components/common/LoadingState';
import { createApiUrl } from '../../config/api';

interface Job {
  id: number;
  title: string;
  description?: string;
  pickupAddress: string;
  pickupCity: string;
  deliveryAddress: string;
  deliveryCity: string;
  pickupDate: string;
  deliveryDate?: string;
  price: number;
  weight?: number;
  volume?: number;
  status: string;
  createdAt: string;
  shipperName?: string;
  shipperEmail?: string;
  shipperPhone?: string;
  carrierName?: string;
  nakliyeciName?: string;
  nakliyeciEmail?: string;
  nakliyeciPhone?: string;
  nakliyeciCompany?: string;
  carrierId?: number;
}

const TasiyiciJobs: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadJob = React.useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const userRaw = localStorage.getItem('user');
      const userId = userRaw ? JSON.parse(userRaw || '{}').id : undefined;

      const response = await fetch(`/api/shipments/${id}`, {
        headers: {
          Authorization: `Bearer ${token || ''}`,
          'X-User-Id': userId || '',
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const jobData = data.data || data;
        setJob(jobData);
      } else if (response.status === 404) {
        toast.error('İş bulunamadı');
        navigate('/tasiyici/active-jobs');
      } else {
        throw new Error('İş yüklenemedi');
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error loading job:', error);
      toast.error('İş yüklenemedi');
      navigate('/tasiyici/active-jobs');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadJob();
  }, [loadJob]);


  const updateStatus = async (newStatus: string) => {
    try {
      setUpdatingStatus(true);
      const token = localStorage.getItem('authToken');
      const userRaw = localStorage.getItem('user');
      const userId = userRaw ? JSON.parse(userRaw || '{}').id : undefined;

      if (import.meta.env.DEV) {
        console.log('🔄 Status güncelleniyor:', { id, newStatus, userId });
      }

      const response = await fetch(createApiUrl(`/api/shipments/${id}`), {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token || ''}`,
          'X-User-Id': userId || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const responseData = await response.json();

      if (import.meta.env.DEV) {
        console.log('📥 API Response:', { status: response.status, data: responseData });
      }

      if (response.ok && responseData.success) {
        if (newStatus === 'in_progress') {
          toast.success('✅ İşe başladınız! İş durumu "Devam Ediyor" olarak güncellendi.', {
            duration: 4000,
          });
          // Sayfayı yenile ama yönlendirmeyi biraz geciktir
          await loadJob();
          // Yönlendirmeyi daha uzun tut ki kullanıcı sonucu görebilsin
          setTimeout(() => {
            navigate('/tasiyici/active-jobs', { replace: true });
          }, 2500);
        } else if (newStatus === 'completed') {
          toast.success('🎉 İş tamamlandı! Tebrikler!', {
            duration: 4000,
          });
          await loadJob();
          setTimeout(() => {
            navigate('/tasiyici/completed-jobs', { replace: true });
          }, 1500);
        } else {
          toast.success('İş durumu başarıyla güncellendi');
          await loadJob();
        }
      } else {
        const errorMsg = responseData.message || 'Durum güncellenemedi';
        if (import.meta.env.DEV) {
          console.error('❌ Status güncelleme hatası:', errorMsg);
        }
        toast.error(errorMsg);
      }
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('❌ Status güncelleme exception:', error);
      }
      toast.error(error?.message || 'Durum güncellenemedi. Lütfen tekrar deneyin.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
      case 'accepted':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress':
      case 'in_transit':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: 'Beklemede',
      accepted: 'Kabul Edildi',
      in_progress: 'Devam Ediyor',
      in_transit: 'Yolda',
      completed: 'Tamamlandı',
      delivered: 'Teslim Edildi',
      cancelled: 'İptal Edildi',
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return <LoadingState />;
  }

  if (!job) {
    return (
      <div className='min-h-screen bg-white flex items-center justify-center'>
        <div className='text-center'>
          <AlertCircle className='w-16 h-16 text-gray-400 mx-auto mb-4' />
          <h3 className='text-lg font-semibold text-gray-900 mb-2'>İş bulunamadı</h3>
          <Link
            to='/tasiyici/active-jobs'
            className='inline-block mt-4 px-4 py-2 bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 text-white rounded-lg font-medium transition-all duration-300'
          >
            Aktif İşlere Dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-white'>
      <Helmet>
        <title>İş Detayı - {job.title} - Taşıyıcı Panel</title>
      </Helmet>

      <div className='max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6'>
        {/* Breadcrumb */}
        <div className='mb-4 sm:mb-6'>
          <Breadcrumb
            items={[
              { label: 'Aktif İşler', href: '/tasiyici/active-jobs' },
              { label: job.title || `İş #${job.id}`, href: `/tasiyici/jobs/${job.id}` },
            ]}
          />
        </div>

        {/* Back Button */}
        <Link
          to='/tasiyici/active-jobs'
          className='inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg border border-gray-200 mb-6'
        >
          <ArrowLeft className='w-4 h-4' />
          Geri Dön
        </Link>

        {/* Hero Section */}
        <div className='relative overflow-hidden bg-gradient-to-br from-slate-800 via-blue-900 to-indigo-900 rounded-3xl p-6 text-white shadow-2xl mb-8'>
          <div className='absolute inset-0 bg-gradient-to-br from-white/5 to-transparent'></div>
          <div className='absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full -translate-y-40 translate-x-40'></div>
          <div className='absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-slate-400/10 to-blue-400/10 rounded-full translate-y-32 -translate-x-32'></div>

          <div className='relative z-10'>
            <div className='flex items-start justify-between mb-4'>
              <div className='flex-1'>
                <div className='flex items-center gap-4 mb-4'>
                  <div className='w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-xl border border-white/20'>
                    <Package className='w-8 h-8 text-white' />
                  </div>
                  <div>
                    <h1 className='text-3xl font-bold mb-2 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent'>
                      {job.title || `Gönderi #${job.id}`}
                    </h1>
                    <span
                      className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(
                        job.status
                      )}`}
                    >
                      <CheckCircle className='w-4 h-4 mr-2' />
                      {getStatusText(job.status)}
                    </span>
                  </div>
                </div>
                {job.description && (
                  <p className='text-slate-200 text-base leading-relaxed'>{job.description}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Main Content */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Route Information */}
            <div className='bg-white rounded-xl p-6 shadow-lg border border-gray-100'>
              <h2 className='text-xl font-bold text-slate-900 mb-6 flex items-center gap-2'>
                <MapPin className='w-5 h-5 text-blue-600' />
                Rota Bilgileri
              </h2>
              <div className='space-y-4'>
                <div className='flex items-start gap-4'>
                  <div className='w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center'>
                    <MapPin className='w-6 h-6 text-white' />
                  </div>
                  <div className='flex-1'>
                    <div className='text-xs text-slate-500 mb-1'>Çıkış Noktası</div>
                    <div className='font-semibold text-slate-900'>{job.pickupCity}</div>
                    <div className='text-sm text-slate-600'>{job.pickupAddress}</div>
                  </div>
                </div>
                <div className='flex justify-center my-2'>
                  <div className='w-0.5 h-12 bg-gradient-to-b from-blue-600 to-blue-400'></div>
                </div>
                <div className='flex items-start gap-4'>
                  <div className='w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center'>
                    <MapPin className='w-6 h-6 text-white' />
          </div>
                  <div className='flex-1'>
                    <div className='text-xs text-slate-500 mb-1'>Varış Noktası</div>
                    <div className='font-semibold text-slate-900'>{job.deliveryCity}</div>
                    <div className='text-sm text-slate-600'>{job.deliveryAddress}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Job Details */}
            <div className='bg-white rounded-xl p-6 shadow-lg border border-gray-100'>
              <h2 className='text-xl font-bold text-slate-900 mb-6'>İş Detayları</h2>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center'>
                    <Calendar className='w-5 h-5 text-white' />
                  </div>
                  <div>
                    <div className='text-xs text-slate-500'>Yükleme Tarihi</div>
                    <div className='font-semibold text-slate-900'>
                      {new Date(job.pickupDate).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                </div>
                {job.deliveryDate && (
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center'>
                      <Clock className='w-5 h-5 text-white' />
                    </div>
                    <div>
                      <div className='text-xs text-slate-500'>Teslimat Tarihi</div>
                      <div className='font-semibold text-slate-900'>
                        {new Date(job.deliveryDate).toLocaleDateString('tr-TR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>
                )}
                {job.weight && (
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center'>
                        <Truck className='w-5 h-5 text-white' />
                      </div>
                      <div>
                        <div className='text-xs text-slate-500'>Ağırlık</div>
                        <div className='font-semibold text-slate-900'>{job.weight} kg</div>
                      </div>
                    </div>
                )}
                {job.volume && (
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center'>
                      <Package className='w-5 h-5 text-white' />
                    </div>
                    <div>
                      <div className='text-xs text-slate-500'>Hacim</div>
                      <div className='font-semibold text-slate-900'>{job.volume} m³</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Nakliyeci Contact */}
            {(job.nakliyeciName || job.nakliyeciCompany || job.carrierId) && (
              <div className='bg-white rounded-xl p-6 shadow-lg border border-gray-100'>
                <div className='flex items-center justify-between mb-6'>
                  <h2 className='text-xl font-bold text-slate-900 flex items-center gap-2'>
                    <Building2 className='w-5 h-5 text-blue-600' />
                    Nakliyeci Bilgileri
                  </h2>
                </div>
                

                <div className='space-y-3'>
                  {job.nakliyeciName && (
                    <div className='flex items-center gap-3'>
                      <User className='w-5 h-5 text-gray-400' />
                      <div>
                        <div className='text-xs text-slate-500'>Ad Soyad</div>
                        <div className='font-semibold text-slate-900'>{job.nakliyeciName}</div>
                      </div>
                    </div>
                  )}
                  {job.nakliyeciCompany && (
                    <div className='flex items-center gap-3'>
                      <Building2 className='w-5 h-5 text-gray-400' />
                      <div>
                        <div className='text-xs text-slate-500'>Şirket</div>
                        <div className='font-semibold text-slate-900'>{job.nakliyeciCompany}</div>
                      </div>
                    </div>
                  )}
                  {job.nakliyeciPhone && (
                    <div className='flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200'>
                      <div className='flex items-center gap-3 flex-1'>
                        <Phone className='w-5 h-5 text-blue-600' />
                        <div>
                          <div className='text-xs text-slate-500 mb-1'>Telefon</div>
                          <a
                            href={`tel:${job.nakliyeciPhone}`}
                            className='font-bold text-blue-600 hover:text-blue-700 text-base'
                          >
                            {job.nakliyeciPhone}
                          </a>
                        </div>
                      </div>
                      <a
                        href={`tel:${job.nakliyeciPhone}`}
                        className='px-4 py-2 bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 text-white rounded-lg font-medium transition-all duration-300 flex items-center gap-2 shadow-md hover:shadow-lg whitespace-nowrap'
                      >
                        <Phone className='w-4 h-4' />
                        Ara
                      </a>
                    </div>
                  )}
                  {job.nakliyeciEmail && (
                    <div className='flex items-center gap-3'>
                      <Mail className='w-5 h-5 text-gray-400' />
                      <div>
                        <div className='text-xs text-slate-500'>E-posta</div>
                        <a
                          href={`mailto:${job.nakliyeciEmail}`}
                          className='font-semibold text-blue-600 hover:text-blue-700'
                        >
                          {job.nakliyeciEmail}
                        </a>
                      </div>
                    </div>
                  )}
                  {!job.nakliyeciName && !job.nakliyeciCompany && !job.nakliyeciPhone && !job.nakliyeciEmail && (
                    <div className='text-sm text-slate-500 text-center py-4'>
                      Nakliyeci bilgileri bulunamadı
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Shipper Contact */}
            {job.shipperName && (
              <div className='bg-white rounded-xl p-6 shadow-lg border border-gray-100'>
                <h2 className='text-xl font-bold text-slate-900 mb-6 flex items-center gap-2'>
                  <User className='w-5 h-5 text-blue-600' />
                  Gönderici Bilgileri
                </h2>
                <div className='space-y-3'>
                  <div className='flex items-center gap-3'>
                    <User className='w-5 h-5 text-gray-400' />
                    <div>
                      <div className='text-xs text-slate-500'>Ad Soyad</div>
                      <div className='font-semibold text-slate-900'>{job.shipperName}</div>
                    </div>
                  </div>
                  {job.shipperPhone && (
                    <div className='flex items-center gap-3'>
                      <Phone className='w-5 h-5 text-gray-400' />
                      <div>
                        <div className='text-xs text-slate-500'>Telefon</div>
                        <a
                          href={`tel:${job.shipperPhone}`}
                          className='font-semibold text-blue-600 hover:text-blue-700'
                        >
                          {job.shipperPhone}
                        </a>
                      </div>
                    </div>
                  )}
                  {job.shipperEmail && (
                    <div className='flex items-center gap-3'>
                      <Mail className='w-5 h-5 text-gray-400' />
                      <div>
                        <div className='text-xs text-slate-500'>E-posta</div>
                        <a
                          href={`mailto:${job.shipperEmail}`}
                          className='font-semibold text-blue-600 hover:text-blue-700'
                        >
                          {job.shipperEmail}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
                </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            {/* Actions */}
            <div className='bg-white rounded-xl p-6 shadow-lg border border-gray-100'>
              <h3 className='text-lg font-bold text-slate-900 mb-4'>İşlemler</h3>
              <div className='space-y-3'>
                {/* İşe Başla - accepted, pending, test gibi durumlarda göster */}
                {(job.status === 'accepted' || 
                  job.status === 'pending' || 
                  job.status === 'test' ||
                  (!job.status || (job.status !== 'in_progress' && job.status !== 'completed' && job.status !== 'delivered'))) && (
                  <button
                    onClick={() => updateStatus('in_progress')}
                    disabled={updatingStatus}
                    className='w-full px-4 py-2 bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 text-white rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50'
                    title='İşe başladığınızda durum güncellenecek'
                  >
                    <Clock className='w-4 h-4' />
                    İşe Başla
                  </button>
                )}
                {/* Tamamlandı İşaretle - in_progress durumunda göster */}
                {(job.status === 'in_progress' || job.status === 'in_transit') && (
                  <button
                    onClick={() => updateStatus('completed')}
                    disabled={updatingStatus}
                    className='w-full px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50'
                    title='İş tamamlandığında durum güncellenecek'
                  >
                    <CheckCircle className='w-4 h-4' />
                    Tamamlandı İşaretle
                  </button>
                )}
                {/* Status bilgisi (debug için) */}
                {import.meta.env.DEV && (
                  <div className='text-xs text-gray-500 p-2 bg-gray-50 rounded'>
                    Status: <strong>{job.status || 'undefined'}</strong>
                  </div>
                )}
                {/* Nakliyeci ile telefon iletişimi (mesajlaşma yok) */}
                {job.nakliyeciPhone && (
                  <a
                    href={`tel:${job.nakliyeciPhone}`}
                    className='block w-full px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 border border-blue-200'
                    title='Nakliyeci ile telefon iletişimi'
                  >
                    <Phone className='w-4 h-4' />
                    Nakliyeciyi Ara
                  </a>
                )}
              </div>
            </div>

            {/* Job Info */}
            <div className='bg-white rounded-xl p-6 shadow-lg border border-gray-100'>
              <h3 className='text-lg font-bold text-slate-900 mb-4'>İş Bilgileri</h3>
              <div className='space-y-3 text-sm'>
                <div className='flex justify-between'>
                  <span className='text-slate-500'>İş No</span>
                  <span className='font-semibold text-slate-900'>#{job.id}</span>
                  </div>
                <div className='flex justify-between'>
                  <span className='text-slate-500'>Oluşturulma</span>
                  <span className='font-semibold text-slate-900'>
                    {new Date(job.createdAt).toLocaleDateString('tr-TR')}
                  </span>
                </div>
              </div>
            </div>
          </div>
          </div>
      </div>
    </div>
  );
};

export default TasiyiciJobs;
