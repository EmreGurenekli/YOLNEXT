import React, { useEffect, useState } from 'react';
import { createApiUrl } from '../../config/api';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Clock, MapPin, DollarSign, Truck, CheckCircle, ArrowRight, Package, Search, CheckCircle2, Navigation, Wifi, WifiOff, XCircle } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { TOAST_MESSAGES, showProfessionalToast } from '../../utils/toastMessages';
import Breadcrumb from '../../components/shared-ui-elements/Breadcrumb';
import LoadingState from '../../components/shared-ui-elements/LoadingState';
import Modal from '../../components/shared-ui-elements/Modal';
import GuidanceOverlay from '../../components/shared-ui-elements/GuidanceOverlay';
import TrackingModal from '../../components/TrackingModal';

const ActiveJobs: React.FC = () => {
  const { showToast } = useToast();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState<Record<number, boolean>>({});
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedJobToReject, setSelectedJobToReject] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [selectedTrackingJob, setSelectedTrackingJob] = useState<any | null>(null);

  const loadActiveJobs = async () => {
    try {
      setLoading(true);
      const userRaw = localStorage.getItem('user');
      const userId = userRaw ? JSON.parse(userRaw || '{}').id : undefined;
      const token = localStorage.getItem('authToken');
      const response = await fetch(createApiUrl('/api/shipments/tasiyici'), {
        headers: {
          Authorization: `Bearer ${token || ''}`,
          'X-User-Id': userId || '',
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Aktif işler alınamadı');
      const data = await response.json();
      const rows = (Array.isArray(data) ? data : data.data || []) as any[];
      const activeStatuses = new Set([
        'offer_accepted',
        'accepted',
        'assigned',
        'in_progress',
        'picked_up',
        'in_transit',
        'delivered',
      ]);
      const mapped = rows.map(row => {
        const categoryData = getCategoryData(row);
        return {
          id: row.id,
          title: row.title || `${row.pickupCity || ''} → ${row.deliveryCity || ''}`,
          from: row.pickupAddress || row.pickupCity || '-',
          to: row.deliveryAddress || row.deliveryCity || '-',
          pickupCity: row.pickupCity || '',
          deliveryCity: row.deliveryCity || '',
          price:
            typeof row.price === 'number'
              ? row.price
              : parseFloat(row.price?.replace(/[^0-9.,]/g, '').replace(',', '.')) || 0,
          status: row.status || 'offer_accepted',
          estimatedTime: row.deliveryDate || '-',
          pickupDate: row.pickupDate,
          weight: row.weight,
          volume: row.volume,
          unitType: row.unitType || row.unit_type || categoryData?.unitType || categoryData?.unit_type,
          temperatureSetpoint:
            row.temperatureSetpoint ||
            row.temperature_setpoint ||
            categoryData?.temperatureSetpoint ||
            categoryData?.temperature_setpoint,
          unNumber: row.unNumber || row.un_number || categoryData?.unNumber || categoryData?.un_number,
          loadingEquipment:
            row.loadingEquipment ||
            row.loading_equipment ||
            categoryData?.loadingEquipment ||
            categoryData?.loading_equipment,
        };
      });
      const activeOnly = mapped.filter((j) => activeStatuses.has(String(j.status || '')));
      setJobs(activeOnly);
    } catch (e) {
      if (import.meta.env.DEV) console.error(e);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryData = (row: any) => {
    if (!row) return undefined;
    if (row.categoryData && typeof row.categoryData === 'object') return row.categoryData;
    if (row.category_data && typeof row.category_data === 'object') return row.category_data;
    const md = row.metadata;
    if (!md) return undefined;
    try {
      const parsed = typeof md === 'string' ? JSON.parse(md) : md;
      if (parsed && typeof parsed === 'object') return parsed.categoryData || parsed.category_data;
    } catch {
      // ignore
    }
    return undefined;
  };

  const getCurrentUserForTracking = () => {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return null;
      const u = JSON.parse(raw);
      const id = u?.id != null ? String(u.id) : '';
      const name = String(u?.fullName || u?.name || `${u?.firstName || ''} ${u?.lastName || ''}`.trim() || 'Taşıyıcı').trim();
      if (!id) return null;
      return { id, name };
    } catch {
      return null;
    }
  };

  const openTracking = (job: any) => {
    setSelectedTrackingJob(job);
    setShowTrackingModal(true);
  };

  // Offline/Online durumu takibi
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Offline kaydedilmiş durum güncellemelerini gönder
  useEffect(() => {
    if (isOnline) {
      const pendingUpdates = JSON.parse(localStorage.getItem('tasiyici_pending_updates') || '[]');
      if (pendingUpdates.length > 0) {
        pendingUpdates.forEach(async (update: any) => {
          await sendStatusUpdate(update.jobId, update.status, true);
        });
        localStorage.removeItem('tasiyici_pending_updates');
        showProfessionalToast(showToast, 'SYNC_COMPLETED', 'success');
      }
    }
  }, [isOnline]);

  useEffect(() => {
    loadActiveJobs();
  }, []);

  useEffect(() => {
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        loadActiveJobs();
      }
    };

    const handleGlobalRefresh = () => {
      loadActiveJobs();
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

  // Extract city names from addresses
  const getCity = (address?: string, city?: string) => {
    if (city) return city;
    if (!address) return '';
    const parts = address.split(',');
    return parts[parts.length - 1]?.trim() || address;
  };

  // Durum güncelleme fonksiyonu (offline destekli)
  const sendStatusUpdate = async (jobId: number, newStatus: string, isRetry: boolean = false) => {
    try {
      const token = localStorage.getItem('authToken');
      const userRaw = localStorage.getItem('user');
      const userId = userRaw ? JSON.parse(userRaw || '{}').id : undefined;

      const response = await fetch(createApiUrl(`/api/shipments/${jobId}`), {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token || ''}`,
          'X-User-Id': userId || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const responseData = await response.json();
        if (responseData.success) {
          // Başarılı - iş listesini güncelle
          const uiStatus = newStatus;
          setJobs(prev => prev.map(job => 
            job.id === jobId ? { ...job, status: uiStatus } : job
          ));
          
          if (!isRetry) {
            const statusMessages: Record<string, string> = {
              'picked_up': 'Yük alındı',
              'in_transit': 'Yolda',
              'delivered': 'Teslim edildi',
            };
            showProfessionalToast(showToast, 'STATUS_UPDATED', 'success');
          }
          return true;
        }
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  // Teslimat onaylama
  const handleConfirmDelivery = async (jobId: number) => {
    if (!window.confirm('Teslimatı onaylamak istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      return;
    }

    try {
      setUpdatingStatus(prev => ({ ...prev, [jobId]: true }));
      const token = localStorage.getItem('authToken');
      const userRaw = localStorage.getItem('user');
      const userId = userRaw ? JSON.parse(userRaw || '{}').id : undefined;

      const response = await fetch(createApiUrl(`/api/shipments/${jobId}/confirm-delivery`), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token || ''}`,
          'X-User-Id': userId || '',
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          showProfessionalToast(showToast, 'DELIVERY_CONFIRMED', 'success');
          // İş listesini yeniden yükle
          const loadResponse = await fetch(createApiUrl('/api/shipments/tasiyici'), {
            headers: {
              Authorization: `Bearer ${token || ''}`,
              'X-User-Id': userId || '',
              'Content-Type': 'application/json',
            },
          });
          if (loadResponse.ok) {
            const loadData = await loadResponse.json();
            const rows = (Array.isArray(loadData) ? loadData : loadData.data || []) as any[];
            const mapped = rows.map(row => {
              const categoryData = getCategoryData(row);
              return {
                id: row.id,
                title: row.title || `${row.pickupCity || ''} → ${row.deliveryCity || ''}`,
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
                unitType: row.unitType || row.unit_type || categoryData?.unitType || categoryData?.unit_type,
                temperatureSetpoint:
                  row.temperatureSetpoint ||
                  row.temperature_setpoint ||
                  categoryData?.temperatureSetpoint ||
                  categoryData?.temperature_setpoint,
                unNumber: row.unNumber || row.un_number || categoryData?.unNumber || categoryData?.un_number,
                loadingEquipment:
                  row.loadingEquipment ||
                  row.loading_equipment ||
                  categoryData?.loadingEquipment ||
                  categoryData?.loading_equipment,
              };
            });
            setJobs(mapped);
          }
        } else {
          showProfessionalToast(showToast, 'OPERATION_FAILED', 'error');
        }
      } else {
        const errorData = await response.json();
        showProfessionalToast(showToast, 'OPERATION_FAILED', 'error');
      }
    } catch (error) {
      showProfessionalToast(showToast, 'NETWORK_ERROR', 'error');
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [jobId]: false }));
    }
  };

  // İş reddetme
  const handleRejectClick = (jobId: number) => {
    setSelectedJobToReject(jobId);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedJobToReject) return;

    setIsRejecting(true);
    try {
      const token = localStorage.getItem('authToken');
      const userRaw = localStorage.getItem('user');
      const userId = userRaw ? JSON.parse(userRaw || '{}').id : undefined;

      const response = await fetch(createApiUrl(`/api/shipments/${selectedJobToReject}/reject-assignment`), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token || ''}`,
          'X-User-Id': userId || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: rejectReason.trim() || undefined,
        }),
      });

      if (response.ok) {
        showProfessionalToast(showToast, 'JOB_REJECTED', 'success');
        setShowRejectModal(false);
        setSelectedJobToReject(null);
        setRejectReason('');
        // Reload jobs
        await loadActiveJobs();
      } else {
        const errorData = await response.json().catch(() => ({ message: 'İş reddedilemedi' }));
        showProfessionalToast(showToast, 'OPERATION_FAILED', 'error');
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'İş reddedilirken bir hata oluştu';
      if (errorMessage.includes('Network') || errorMessage.includes('fetch')) {
        showProfessionalToast(showToast, 'NETWORK_ERROR', 'error');
      } else {
        showProfessionalToast(showToast, 'OPERATION_FAILED', 'error');
      }
    } finally {
      setIsRejecting(false);
    }
  };

  // Durum güncelleme (offline destekli)
  const updateJobStatus = async (jobId: number, newStatus: string) => {
    setUpdatingStatus(prev => ({ ...prev, [jobId]: true }));

    try {
      if (!isOnline) {
        // Offline - localStorage'a kaydet
        const pendingUpdates = JSON.parse(localStorage.getItem('tasiyici_pending_updates') || '[]');
        pendingUpdates.push({ jobId, status: newStatus, timestamp: Date.now() });
        localStorage.setItem('tasiyici_pending_updates', JSON.stringify(pendingUpdates));
        
        // UI'ı hemen güncelle
        setJobs(prev => prev.map(job => 
          job.id === jobId ? { ...job, status: newStatus } : job
        ));
        
        showProfessionalToast(showToast, 'OFFLINE_SAVED', 'success');
        setUpdatingStatus(prev => ({ ...prev, [jobId]: false }));
        return;
      }

      // Online - direkt gönder
      const success = await sendStatusUpdate(jobId, newStatus);
      
      if (!success) {
        // Başarısız - offline'a kaydet
        const pendingUpdates = JSON.parse(localStorage.getItem('tasiyici_pending_updates') || '[]');
        pendingUpdates.push({ jobId, status: newStatus, timestamp: Date.now() });
        localStorage.setItem('tasiyici_pending_updates', JSON.stringify(pendingUpdates));
        
        setJobs(prev => prev.map(job => 
          job.id === jobId ? { ...job, status: newStatus } : job
        ));
        
        showProfessionalToast(showToast, 'OFFLINE_SAVED', 'success');
      }
    } catch (error) {
      showProfessionalToast(showToast, 'OPERATION_FAILED', 'error');
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [jobId]: false }));
    }
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
              <div className='flex items-center gap-3'>
                {!isOnline && (
                  <div className='bg-yellow-500/20 backdrop-blur-sm rounded-xl px-4 py-2 border border-yellow-400/30 flex items-center gap-2'>
                    <WifiOff className='w-4 h-4 text-yellow-300' />
                    <span className='text-yellow-200 font-medium text-sm'>İnternet Yok</span>
                  </div>
                )}
                <div className='bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20'>
                  <span className='text-slate-200 font-medium'>
                    {jobs.length} {jobs.length === 1 ? 'Aktif İş' : 'Aktif İş'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className='mb-6'>
          <GuidanceOverlay
            storageKey='tasiyici.active-jobs'
            isEmpty={!loading && jobs.length === 0}
            icon={Truck}
            title='Aktif İşler'
            description='Kabul edilen işlerinizi burada takip edebilirsiniz: durum güncellemeleri, rota ve teslimat bilgileri. Yeni iş almak için "Pazar" sayfasına, teklif geçmişiniz için "Tekliflerim" sayfasına geçebilirsiniz.'
            primaryAction={{
              label: 'Pazar',
              to: '/tasiyici/market',
            }}
            secondaryAction={{
              label: 'Tekliflerim',
              to: '/tasiyici/my-offers',
            }}
          />
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
          <div className='min-h-[50vh] flex items-center justify-center'>
            <div className='bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center w-full max-w-2xl'>
              <Truck className='w-16 h-16 text-gray-400 mx-auto mb-4' />
              <h3 className='text-xl font-bold text-gray-900 mb-2'>
                Aktif işin yok
              </h3>
              <p className='text-gray-600 mb-6'>
                Yeni iş almak için İş Pazarına gidip uygun ilanlara teklif verebilirsin.
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
        ) : filteredJobs.length === 0 ? (
          <div className='min-h-[50vh] flex items-center justify-center'>
            <div className='bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center w-full max-w-2xl'>
              <Search className='w-16 h-16 text-gray-400 mx-auto mb-4' />
              <h3 className='text-xl font-bold text-gray-900 mb-2'>
                Sonuç bulunamadı
              </h3>
              <p className='text-gray-600 mb-6'>
                Arama kriterlerine uygun aktif iş yok. Aramayı temizleyip tekrar deneyebilirsin.
              </p>
              <div className='flex flex-col sm:flex-row gap-3 justify-center'>
                <button
                  onClick={() => setSearchTerm('')}
                  className='px-6 py-3 bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl'
                >
                  Aramayı Temizle
                </button>
              </div>
            </div>
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
                    {typeof job.volume === 'number' && job.volume > 0 && (
                      <div className='flex items-center gap-1'>
                        <Package className='w-3 h-3' />
                        <span>{job.volume}m³</span>
                      </div>
                    )}
                  </div>

                  {(job.unitType || job.temperatureSetpoint || job.unNumber || job.loadingEquipment) && (
                    <div className='flex flex-wrap gap-1.5 mb-2.5'>
                      {job.unitType && (
                        <span className='px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full border border-gray-200 text-[10px]'>
                          {job.unitType}
                        </span>
                      )}
                      {job.temperatureSetpoint && (
                        <span className='px-2 py-0.5 bg-cyan-50 text-cyan-700 rounded-full border border-cyan-200 text-[10px]'>
                          {job.temperatureSetpoint}℃
                        </span>
                      )}
                      {job.unNumber && (
                        <span className='px-2 py-0.5 bg-red-50 text-red-700 rounded-full border border-red-200 text-[10px]'>
                          {job.unNumber}
                        </span>
                      )}
                      {job.loadingEquipment && (
                        <span className='px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200 text-[10px]'>
                          {job.loadingEquipment}
                        </span>
                      )}
                    </div>
                  )}

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
                      {job.status === 'assigned' ? 'Atandı' :
                       job.status === 'in_progress' ? 'Atandı' :
                       job.status === 'picked_up' ? 'Yük Alındı' :
                       job.status === 'in_transit' ? 'Yolda' :
                       job.status === 'delivered' ? 'Teslim Edildi' :
                       job.status === 'completed' ? 'Tamamlandı' :
                       job.status === 'cancelled' ? 'İptal Edildi' :
                       job.status === 'offer_accepted' || job.status === 'accepted' ? 'Kabul Edildi' : 'Aktif'}
                    </span>
                  </div>

                  {/* Durum Butonları - Basit ve Büyük */}
                  <div className='space-y-2'>
                    {/* İşi Reddet - sadece accepted/assigned durumunda */}
                    {(job.status === 'assigned' || job.status === 'in_progress' || job.status === 'offer_accepted') && (
                      <button
                        onClick={() => handleRejectClick(job.id)}
                        disabled={updatingStatus[job.id] || isRejecting}
                        className='w-full px-3 py-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white rounded-lg font-bold text-xs transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed'
                      >
                        <XCircle className='w-4 h-4' />
                        İşi Reddet
                      </button>
                    )}
                    
                    {/* Yükü Aldım - sadece assigned durumunda */}
                    {(job.status === 'assigned' || job.status === 'in_progress') && (
                      <button
                        onClick={() => updateJobStatus(job.id, 'picked_up')}
                        disabled={updatingStatus[job.id]}
                        className='w-full px-3 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed'
                      >
                        <CheckCircle2 className='w-5 h-5' />
                        ✅ Yükü Aldım
                      </button>
                    )}
                    
                    {/* Yoldayım - picked_up durumunda */}
                    {job.status === 'picked_up' && (
                      <button
                        onClick={() => updateJobStatus(job.id, 'in_transit')}
                        disabled={updatingStatus[job.id]}
                        className='w-full px-3 py-3 bg-gradient-to-r from-slate-800 to-blue-900 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed'
                      >
                        <Navigation className='w-5 h-5' />
                        Yoldayım
                      </button>
                    )}
                    
                    {/* Teslim Ettim - in_transit durumunda */}
                    {job.status === 'in_transit' && (
                      <button
                        onClick={() => updateJobStatus(job.id, 'delivered')}
                        disabled={updatingStatus[job.id]}
                        className='w-full px-3 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed'
                      >
                        <Package className='w-5 h-5' />
                        📦 Teslim Ettim
                      </button>
                    )}

                    {/* Konum / ETA Güncelle - operasyon boyunca */}
                    {(job.status === 'assigned' || job.status === 'picked_up' || job.status === 'in_transit' || job.status === 'delivered') && (
                      <button
                        onClick={() => openTracking(job)}
                        className='w-full px-3 py-2 bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 rounded-lg font-bold text-xs transition-all duration-300 flex items-center justify-center gap-2 shadow-sm hover:shadow'
                      >
                        <MapPin className='w-4 h-4' />
                        Konum / ETA Güncelle
                      </button>
                    )}
                    
                    {/* Detayları Gör - her zaman görünür */}
                    <Link
                      to={`/tasiyici/jobs/${job.id}`}
                      className='w-full px-2.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-all duration-300 flex items-center justify-center gap-1.5 border border-gray-300'
                    >
                      <ArrowRight className='w-3 h-3' />
                      Detayları Gör
                    </Link>
                  </div>
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

      {/* Reject Job Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setSelectedJobToReject(null);
          setRejectReason('');
        }}
        title='İşi Reddet'
        size='md'
      >
        <div className='space-y-4'>
          <p className='text-slate-700'>
            Bu işi reddetmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve nakliyeciye bildirilecektir.
          </p>
          <div>
            <label className='block text-sm font-medium text-slate-700 mb-2'>
              Reddetme Sebebi (İsteğe Bağlı)
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder='İşi neden reddettiğinizi açıklayın...'
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none'
              rows={3}
            />
          </div>
          <div className='flex justify-end gap-3'>
            <button
              onClick={() => {
                setShowRejectModal(false);
                setSelectedJobToReject(null);
                setRejectReason('');
              }}
              className='px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors'
              disabled={isRejecting}
            >
              Vazgeç
            </button>
            <button
              onClick={handleConfirmReject}
              className='px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
              disabled={isRejecting}
            >
              {isRejecting ? 'Reddediliyor...' : 'İşi Reddet'}
            </button>
          </div>
        </div>
      </Modal>

      {showTrackingModal && selectedTrackingJob && (() => {
        const currentUser = getCurrentUserForTracking();
        if (!currentUser) return null;

        const pickupCity = selectedTrackingJob.pickupCity || getCity(selectedTrackingJob.from, selectedTrackingJob.pickupCity);
        const deliveryCity = selectedTrackingJob.deliveryCity || getCity(selectedTrackingJob.to, selectedTrackingJob.deliveryCity);

        return (
          <TrackingModal
            isOpen={showTrackingModal}
            onClose={() => {
              setShowTrackingModal(false);
              setSelectedTrackingJob(null);
            }}
            shipment={{
              id: String(selectedTrackingJob.id),
              title: String(selectedTrackingJob.title || `Gönderi #${selectedTrackingJob.id}`),
              from_city: String(pickupCity || ''),
              to_city: String(deliveryCity || ''),
              status: String(selectedTrackingJob.status || ''),
            }}
            currentUser={currentUser}
          />
        );
      })()}
    </div>
  );
};

export default ActiveJobs;











