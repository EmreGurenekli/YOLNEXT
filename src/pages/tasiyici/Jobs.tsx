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
  DollarSign,
  XCircle,
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { TOAST_MESSAGES, showProfessionalToast } from '../../utils/toastMessages';
import Breadcrumb from '../../components/shared-ui-elements/Breadcrumb';
import LoadingState from '../../components/shared-ui-elements/LoadingState';
import { createApiUrl } from '../../config/api';
import { analytics } from '../../services/businessAnalytics';
import { formatDate, formatDateTime } from '../../utils/format';
import { logger } from '../../utils/logger';
import { getStatusText as getShipmentStatusText } from '../../utils/shipmentStatus';

const safeFormatDate = (dateString: string, format: 'date' | 'datetime' = 'date') => {
  if (!dateString) return 'Belirtilmemiş';
  
  try {
    if (format === 'date') {
      const formatted = formatDate(dateString, 'long');
      return formatted || 'Belirtilmemiş';
    } else {
      const formatted = formatDateTime(dateString);
      return formatted || 'Belirtilmemiş';
    }
  } catch (error) {
    return 'Belirtilmemiş';
  }
};

const normalizeCityKey = (input?: string | null): string => {
  const s = String(input || '').trim();
  if (!s) return '';
  return s
    .replace(/İ/g, 'I')
    .replace(/ı/g, 'i')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const getDriverProfileCity = (): string => {
  try {
    const userRaw = localStorage.getItem('user');
    const u: any = userRaw ? JSON.parse(userRaw) : null;
    return String(u?.city || u?.City || u?.il || u?.province || '').trim();
  } catch {
    return '';
  }
};

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
  carrierName?: string;
  nakliyeciName?: string;
  nakliyeciEmail?: string;
  nakliyeciPhone?: string;
  nakliyeciCompany?: string;
  carrierId?: number;
  shipperName?: string;
  shipperCompany?: string;
  ownerName?: string;
  ownerCompany?: string;
  senderName?: string;
  senderCompany?: string;
  metadata?: any;
}

const TasiyiciJobs: React.FC = () => {
  const { showToast } = useToast();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [acceptingAssignment, setAcceptingAssignment] = useState(false);
  const [rejectingAssignment, setRejectingAssignment] = useState(false);

  const loadJob = React.useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const userRaw = localStorage.getItem('user');
      const userId = userRaw ? JSON.parse(userRaw || '{}').id : undefined;

      const response = await fetch(createApiUrl(`/api/shipments/${id}`), {
        headers: {
          Authorization: `Bearer ${token || ''}`,
          'X-User-Id': userId || '',
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const jobData: any = data.data || data;

        // Normalize backend field names (lowercase) to frontend expectations
        jobData.pickupCity = jobData.pickupCity ?? jobData.pickup_city ?? jobData.pickupcity ?? jobData.fromCity ?? jobData.from_city ?? 'Şehir Belirtilmemiş';
        jobData.deliveryCity = jobData.deliveryCity ?? jobData.delivery_city ?? jobData.deliverycity ?? jobData.toCity ?? jobData.to_city ?? 'Şehir Belirtilmemiş';
        jobData.pickupAddress =
          jobData.pickupAddress ?? jobData.pickup_address ?? jobData.pickupaddress ?? jobData.from_address ?? jobData.fromAddress ?? 
          jobData.senderAddress ?? jobData.sender_address ?? `${jobData.pickupCity || 'Şehir Belirtilmemiş'} - Detaylı adres belirtilmemiş`;
        jobData.deliveryAddress =
          jobData.deliveryAddress ?? jobData.delivery_address ?? jobData.deliveryaddress ?? jobData.to_address ?? jobData.toAddress ??
          jobData.receiverAddress ?? jobData.receiver_address ?? `${jobData.deliveryCity || 'Şehir Belirtilmemiş'} - Detaylı adres belirtilmemiş`;
        jobData.pickupDate = jobData.pickupDate ?? jobData.pickup_date ?? jobData.pickupdate ?? jobData.createdAt ?? jobData.created_at ?? jobData.createdat ?? new Date().toISOString();
        jobData.deliveryDate = jobData.deliveryDate ?? jobData.delivery_date ?? jobData.deliverydate ?? jobData.expectedDelivery ?? jobData.expected_delivery;
        jobData.createdAt =
          jobData.createdAt ??
          jobData.created_at ??
          jobData.createdat ??
          jobData.updatedAt ??
          jobData.updated_at ??
          jobData.updatedat ??
          new Date().toISOString();
        jobData.title = jobData.title ?? jobData.description ?? `${jobData.pickupCity || 'Başlangıç'} → ${jobData.deliveryCity || 'Varış'}`.trim();
        jobData.price =
          jobData.displayPrice ?? jobData.price ?? jobData.offerPrice ?? jobData.offer_price ?? jobData.amount ?? jobData.totalAmount ?? 0;
        
        // Ensure weight and volume have default values for driver info
        jobData.weight = jobData.weight ?? jobData.totalWeight ?? jobData.total_weight ?? 0;
        jobData.volume = jobData.volume ?? jobData.totalVolume ?? jobData.total_volume ?? 0;

        // Backend /api/shipments/:id returns carrier* fields for nakliyeci (joined from users)
        // Map them to the UI's nakliyeci* fields.
        jobData.nakliyeciName = jobData.nakliyeciName ?? jobData.carrierName ?? '';
        jobData.nakliyeciCompany = jobData.nakliyeciCompany ?? jobData.carrierCompany ?? '';
        jobData.nakliyeciPhone = jobData.nakliyeciPhone ?? jobData.carrierPhone ?? '';
        jobData.nakliyeciEmail = jobData.nakliyeciEmail ?? jobData.carrierEmail ?? '';
        jobData.carrierId =
          jobData.carrierId ?? jobData.nakliyeci_id ?? jobData.carrier_id ?? undefined;

        // If some deployments return nested nakliyeci object, keep supporting it
        if (jobData.nakliyeci && typeof jobData.nakliyeci === 'object') {
          jobData.nakliyeciName = jobData.nakliyeci.name || jobData.nakliyeciName;
          jobData.nakliyeciCompany = jobData.nakliyeci.company || jobData.nakliyeciCompany;
          jobData.nakliyeciPhone = jobData.nakliyeci.phone || jobData.nakliyeciPhone;
          jobData.nakliyeciEmail = jobData.nakliyeci.email || jobData.nakliyeciEmail;
        }

        // Gönderici bilgilerini normalize et
        jobData.shipperName = jobData.shipperName || jobData.ownerName || jobData.owner_name || jobData.senderName || jobData.sender_name || jobData.shipper?.name || jobData.sender?.name || jobData.owner?.name || '';
        jobData.shipperCompany = jobData.shipperCompany || jobData.ownerCompany || jobData.owner_company || jobData.senderCompany || jobData.sender_company || jobData.shipper?.company || jobData.sender?.company || jobData.owner?.company || '';

        setJob(jobData as Job);
      } else if (response.status === 404) {
        showProfessionalToast(showToast, 'JOB_NOT_FOUND', 'error');
        navigate('/tasiyici/islerim');
      } else {
        throw new Error('İş yüklenemedi');
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('İş yüklenirken hata:', error);
      showProfessionalToast(showToast, 'REQUEST_FAILED', 'error');
      navigate('/tasiyici/islerim');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  const updateStatus = async (newStatus: string) => {
    setUpdatingStatus(true);
    const timeoutId = setTimeout(() => {
      setUpdatingStatus(false);
      showProfessionalToast(showToast, 'TIMEOUT_ERROR', 'error');
    }, 10000); // 10 seconds timeout

    try {
      const token = localStorage.getItem('authToken');
      const userRaw = localStorage.getItem('user');
      const userId = userRaw ? JSON.parse(userRaw || '{}').id : undefined;

      logger.log('🔄 Status güncelleniyor:', { id, newStatus, userId });

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

      logger.log('📥 API Response:', { status: response.status, data: responseData });

      if (response.ok && responseData.success) {
        clearTimeout(timeoutId);
        if (newStatus === 'picked_up') {
          showProfessionalToast(showToast, 'PICKUP_CONFIRMED', 'success');
          await loadJob();
        } else if (newStatus === 'in_transit') {
          showProfessionalToast(showToast, 'TRANSIT_STARTED', 'success');
          await loadJob();
        } else if (newStatus === 'delivered') {
          showProfessionalToast(showToast, 'DELIVERY_CONFIRMED', 'success');
          await loadJob();
        } else {
          showProfessionalToast(showToast, 'STATUS_UPDATED', 'success');
          await loadJob();
        }
      } else {
        clearTimeout(timeoutId);
        const errorMsg = responseData.message || 'Bu işlem şu an yapılamıyor.';
        logger.error('❌ Status güncelleme hatası:', errorMsg);
        showProfessionalToast(showToast, 'UPDATE_FAILED', 'error');
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      logger.error('❌ Status güncelleme exception:', error);
      showProfessionalToast(showToast, 'NETWORK_ERROR', 'error');
    } finally {
      clearTimeout(timeoutId);
      setUpdatingStatus(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'offer_accepted':
      case 'assigned':
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'picked_up':
      case 'in_transit':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'delivered':
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    // Centralize shipment status names in one place
    const base = getShipmentStatusText(status);
    return base !== 'Bilinmiyor' ? base : status;
  };

  const getRoutePlan = () => {
    if (!job) return null;
    let meta = (job as any).metadata;
    if (typeof meta === 'string') {
      try {
        meta = JSON.parse(meta);
      } catch {
        meta = null;
      }
    }
    const plan = meta && typeof meta === 'object' ? meta.routePlan : null;
    if (!plan || typeof plan !== 'object') return null;
    const points = Array.isArray(plan.points) ? plan.points : [];
    if (!points.length) return null;
    return {
      createdAt: plan.createdAt,
      vehicle: plan.vehicle,
      summary: plan.summary,
      points,
    };
  };

  const getDriverOffer = () => {
    if (!job) return null;
    let meta = (job as any).metadata;
    if (typeof meta === 'string') {
      try {
        meta = JSON.parse(meta);
      } catch {
        meta = null;
      }
    }
    const offer = meta && typeof meta === 'object' ? (meta as any).driverOffer : null;
    return offer && typeof offer === 'object' ? offer : null;
  };

  const acceptAssignmentOffer = async () => {
    if (!job) return;
    try {
      setAcceptingAssignment(true);

      const driverCity = getDriverProfileCity();
      const driverKey = normalizeCityKey(driverCity);
      const pickupKey = normalizeCityKey(job.pickupCity);
      if (driverKey && pickupKey && driverKey !== pickupKey) {
        showToast({
          type: 'error',
          title: 'İş kabul edilemedi',
          message: `Şehir kuralı: Yükleme şehri profil şehrinle aynı olmalı. Profil: ${driverCity || '—'} • Yükleme: ${job.pickupCity || '—'}`,
          duration: 5000,
        });
        return;
      }

      const token = localStorage.getItem('authToken');
      const userRaw = localStorage.getItem('user');
      const userId = userRaw ? JSON.parse(userRaw || '{}').id : undefined;

      const res = await fetch(createApiUrl(`/api/shipments/${job.id}/assignment/accept`), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token || ''}`,
          'X-User-Id': userId || '',
          'Content-Type': 'application/json',
        },
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        const msg = json?.message || 'İş kabul edilemedi';
        showToast({ type: 'error', title: 'İş kabul edilemedi', message: msg, duration: 4500 });
        return;
      }
      analytics.track('driver_assignment_offer_accepted', { shipmentId: job.id });
      showToast({ type: 'success', title: 'İş kabul edildi', message: 'İş başlatıldı.', duration: 3000 });
      await loadJob();
    } finally {
      setAcceptingAssignment(false);
    }
  };

  const rejectAssignmentOffer = async () => {
    if (!job) return;
    try {
      setRejectingAssignment(true);
      const reason = window.prompt('Reddetme sebebi (opsiyonel):') || '';
      const token = localStorage.getItem('authToken');
      const userRaw = localStorage.getItem('user');
      const userId = userRaw ? JSON.parse(userRaw || '{}').id : undefined;

      const res = await fetch(createApiUrl(`/api/shipments/${job.id}/assignment/reject`), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token || ''}`,
          'X-User-Id': userId || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        const msg = json?.message || 'İş reddedilemedi';
        showToast({ type: 'error', title: 'İş reddedilemedi', message: msg, duration: 4500 });
        return;
      }
      analytics.track('driver_assignment_offer_rejected', { shipmentId: job.id, reason: reason || undefined });
      showToast({ type: 'success', title: 'Teklif reddedildi', message: 'Nakliyeci bilgilendirildi.', duration: 3000 });
      await loadJob();
    } finally {
      setRejectingAssignment(false);
    }
  };

  if (loading) {
    return <LoadingState message='İş yükleniyor...' />;
  }

  if (!job) {
    return (
      <div className='min-h-screen bg-white flex items-center justify-center'>
        <div className='text-center'>
          <AlertCircle className='w-16 h-16 text-gray-400 mx-auto mb-4' />
          <h3 className='text-lg font-semibold text-gray-900 mb-2'>İş bulunamadı</h3>
          <Link
            to='/tasiyici/islerim'
            className='inline-block mt-4 px-4 py-2 bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 text-white rounded-lg font-medium transition-all duration-300'
          >
            İşlerime Dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-50'>
      <Helmet>
        <title>İş Detayı - {job.title} - Taşıyıcı Panel</title>
      </Helmet>

      <div className='max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6'>
        {/* Breadcrumb */}
        <div className='mb-4 sm:mb-6'>
          <Breadcrumb
            items={[
              { label: 'İşlerim', href: '/tasiyici/islerim' },
              { label: job.title || `İş #${job.id}`, href: `/tasiyici/jobs/${job.id}` },
            ]}
          />
        </div>

        {/* Back Button */}
        <Link
          to='/tasiyici/islerim'
          className='inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg border border-gray-200 mb-6'
        >
          <ArrowLeft className='w-4 h-4' />
          İşlerime Dön
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

        {(() => {
          const offer = getDriverOffer();
          const userRaw = localStorage.getItem('user');
          const currentUserId = userRaw ? String(JSON.parse(userRaw || '{}')?.id || '') : '';
          const isMine = offer && currentUserId && String(offer.driverId || '') === currentUserId;
          const expMs = offer?.expiresAt ? Date.parse(String(offer.expiresAt)) : NaN;
          const minutesLeft = Number.isFinite(expMs) ? Math.max(0, Math.ceil((expMs - Date.now()) / 60000)) : null;
          const isPending = offer?.status === 'pending' && (minutesLeft == null || minutesLeft > 0);
          if (!offer || !isMine || !isPending) return null;

          const driverCity = getDriverProfileCity();
          const cityMismatch = Boolean(normalizeCityKey(driverCity)) &&
            Boolean(normalizeCityKey(job.pickupCity)) &&
            normalizeCityKey(driverCity) !== normalizeCityKey(job.pickupCity);

          return (
            <div className='bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-6 mb-6'>
              <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
                <div>
                  <div className='text-lg font-bold text-amber-900'>Yeni İş Teklifi</div>
                  <div className='text-sm text-amber-800'>
                    30 dakika içinde kabul etmelisin{minutesLeft != null ? ` • Kalan: ${minutesLeft} dk` : ''}.
                  </div>
                  {cityMismatch && (
                    <div className='text-xs text-rose-700 font-semibold mt-2'>
                      Şehir kuralı: Yükleme şehri profil şehrinle aynı olmalı. Profil: {driverCity || '—'} • Yükleme: {job.pickupCity || '—'}
                    </div>
                  )}
                </div>
                <div className='flex flex-col sm:flex-row gap-2'>
                  <button
                    type='button'
                    onClick={acceptAssignmentOffer}
                    disabled={acceptingAssignment || rejectingAssignment || cityMismatch}
                    className='px-5 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl font-bold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed'
                  >
                    Kabul Et
                  </button>
                  <button
                    type='button'
                    onClick={rejectAssignmentOffer}
                    disabled={acceptingAssignment || rejectingAssignment}
                    className='px-5 py-3 bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-xl font-bold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2'
                  >
                    <XCircle className='w-5 h-5' />
                    Reddet
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Main Content */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Route Information */}
            <div className='bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sm:p-8'>
              <h2 className='text-xl font-bold text-slate-900 mb-6 flex items-center gap-2'>
                <MapPin className='w-5 h-5 text-blue-600' />
                Rota Bilgileri
              </h2>
              <div className='space-y-4'>
                <div className='flex items-start gap-4'>
                  <div className='w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-700 rounded-lg flex items-center justify-center'>
                    <MapPin className='w-6 h-6 text-white' />
                  </div>
                  <div className='flex-1'>
                    <div className='text-xs text-slate-500 mb-1 font-medium'>📍 YÜKLEME ADRESİ</div>
                    <div className='font-bold text-slate-900 text-lg'>{job.pickupCity}</div>
                    <div className='text-sm text-slate-700 mt-1 bg-slate-50 p-2 rounded-lg border'>
                      {job.pickupAddress || `${job.pickupCity} - Detaylı adres yüklemeden önce nakliyeci ile koordine edilecek`}
                    </div>
                  </div>
                </div>
                <div className='flex justify-center my-2'>
                  <div className='w-0.5 h-12 bg-gradient-to-b from-blue-600 to-blue-400'></div>
                </div>
                <div className='flex items-start gap-4'>
                  <div className='w-12 h-12 bg-gradient-to-br from-red-600 to-pink-700 rounded-lg flex items-center justify-center'>
                    <MapPin className='w-6 h-6 text-white' />
                  </div>
                  <div className='flex-1'>
                    <div className='text-xs text-slate-500 mb-1 font-medium'>🎯 TESLİMAT ADRESİ</div>
                    <div className='font-bold text-slate-900 text-lg'>{job.deliveryCity}</div>
                    <div className='text-sm text-slate-700 mt-1 bg-slate-50 p-2 rounded-lg border'>
                      {job.deliveryAddress || `${job.deliveryCity} - Detaylı adres teslimat öncesi nakliyeci ile koordine edilecek`}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Job Details */}
            <div className='bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sm:p-8'>
              <h2 className='text-xl font-bold text-slate-900 mb-6'>İş Detayları</h2>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center'>
                    <Calendar className='w-5 h-5 text-white' />
                  </div>
                  <div>
                    <div className='text-xs text-slate-500'>Yükleme Tarihi</div>
                    <div className='font-semibold text-slate-900'>
                      {safeFormatDate(job.pickupDate)}
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
                        {safeFormatDate(job.deliveryDate)}
                      </div>
                    </div>
                  </div>
                )}
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center'>
                    <Truck className='w-5 h-5 text-white' />
                  </div>
                  <div>
                    <div className='text-xs text-slate-500'>Ağırlık</div>
                    <div className='font-semibold text-slate-900'>
                      {(job.weight && job.weight > 0) ? `${job.weight} kg` : 'Belirtilmemiş (Nakliyeci ile koordine edilecek)'}
                    </div>
                  </div>
                </div>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center'>
                    <Package className='w-5 h-5 text-white' />
                  </div>
                  <div>
                    <div className='text-xs text-slate-500'>Hacim</div>
                    <div className='font-semibold text-slate-900'>
                      {(job.volume && job.volume > 0) ? `${job.volume} m³` : 'Belirtilmemiş (Nakliyeci ile koordine edilecek)'}
                    </div>
                  </div>
                </div>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center'>
                    <Package className='w-5 h-5 text-white' />
                  </div>
                  <div>
                    <div className='text-xs text-slate-500'>Ücret</div>
                    <div className='font-semibold text-green-700 text-lg'>
                      {job.price > 0 ? `₺${job.price.toLocaleString('tr-TR', {minimumFractionDigits: 2})}` : 'Teklif Verilecek'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Route Plan */}
            {getRoutePlan() && (
              <div className='bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sm:p-8'>
                <h2 className='text-xl font-bold text-slate-900 mb-6 flex items-center gap-2'>
                  <MapPin className='w-5 h-5 text-blue-600' />
                  Rota Planı
                </h2>
                <div className='space-y-4'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center'>
                      <Calendar className='w-5 h-5 text-white' />
                    </div>
                    <div>
                      <div className='text-xs text-slate-500'>Oluşturulma Tarihi</div>
                      <div className='font-semibold text-slate-900'>
                        {safeFormatDate(getRoutePlan()?.createdAt)}
                      </div>
                    </div>
                  </div>
                  {getRoutePlan()?.vehicle?.name && (
                    <div className='text-sm text-slate-700 mb-3'>
                      Araç: <span className='font-semibold'>{String(getRoutePlan()?.vehicle.name)}</span>
                    </div>
                  )}
                  <div className='space-y-2'>
                    {getRoutePlan()?.points
                      .slice()
                      .sort((a: any, b: any) => (Number(a.order || 0) - Number(b.order || 0)))
                      .map((p: any, idx: number) => (
                        <div key={String(p.id || idx)} className='flex items-start gap-3'>
                          <div className='w-7 h-7 rounded-full bg-gradient-to-r from-slate-800 to-blue-900 text-white flex items-center justify-center text-xs font-bold flex-shrink-0'>
                            {idx + 1}
                          </div>
                          <div className='flex-1'>
                            <div className='text-sm font-semibold text-slate-900'>
                              {p.type === 'pickup' ? '📦 Yük Al' : p.type === 'delivery' ? '🏠 Teslim Et' : 'Durak'}
                              {p.name ? ` - ${String(p.name)}` : ''}
                            </div>
                            {p.address && <div className='text-xs text-slate-600 font-medium'>📍 {String(p.address)}</div>}
                            {p.price && p.price > 0 && (
                              <div className='text-xs text-green-600 font-bold mt-1'>💰 ₺{Number(p.price).toLocaleString('tr-TR')} (bilgi)</div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            <div className='bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sm:p-8'>
              <h3 className='text-lg font-bold text-slate-900 mb-4'>Aksiyonlar</h3>
              <div className='space-y-4'>
                {/* İşi Kabul Et - offer_accepted durumunda */}
                {(job.status === 'offer_accepted' || job.status === 'accepted') && (
                  <button
                    onClick={() => updateStatus('assigned')}
                    disabled={updatingStatus}
                    className='w-full px-4 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-bold text-base transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl disabled:opacity-50'
                  >
                    <CheckCircle className='w-6 h-6' />
                    ✅ İşi Kabul Et
                  </button>
                )}

                {/* Yükü Aldım - assigned/in_progress durumunda */}
                {(job.status === 'assigned' || job.status === 'in_progress') && (
                  <button
                    onClick={() => updateStatus('picked_up')}
                    disabled={updatingStatus}
                    className='w-full px-4 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-bold text-base transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl disabled:opacity-50'
                  >
                    <Truck className='w-6 h-6' />
                    ✅ Yükü Aldım
                  </button>
                )}

                {/* Yola Çıktım - picked_up durumunda */}
                {job.status === 'picked_up' && (
                  <button
                    onClick={() => updateStatus('in_transit')}
                    disabled={updatingStatus}
                    className='w-full px-4 py-4 bg-gradient-to-r from-slate-800 to-blue-900 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-bold text-base transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl disabled:opacity-50'
                  >
                    <Truck className='w-6 h-6' />
                    Yola Çıktım
                  </button>
                )}
                
                {/* Teslim Ettim - in_transit durumunda */}
                {job.status === 'in_transit' && (
                  <button
                    onClick={() => updateStatus('delivered')}
                    disabled={updatingStatus}
                    className='w-full px-4 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-bold text-base transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl disabled:opacity-50'
                  >
                    <Package className='w-6 h-6' />
                    📦 Teslimatı Tamamladım
                  </button>
                )}
                
                {/* Nakliyeci ile telefon iletişimi */}
                {job.nakliyeciPhone && (
                  <a
                    href={`tel:${job.nakliyeciPhone}`}
                    className='block w-full px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 border-2 border-blue-200'
                  >
                    <Phone className='w-5 h-5' />
                    Nakliyeciyi Ara
                  </a>
                )}
              </div>
            </div>

            {/* Ödeme Bilgisi */}
            {job.price > 0 && (
              <div className='bg-green-50 rounded-2xl shadow-lg border border-green-200 p-6 sm:p-8'>
                <h3 className='text-lg font-bold text-slate-900 mb-4 flex items-center gap-2'>
                  <DollarSign className='w-5 h-5 text-green-600' />
                  Ödeme Bilgisi
                </h3>
                <div className='space-y-3 text-sm'>
                  <div>
                    <span className='text-slate-500 block mb-1'>İş Ücreti</span>
                    <span className='font-bold text-green-700 text-lg'>₺{job.price.toLocaleString('tr-TR', {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className='mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700'>
                    <strong>Önemli:</strong> Ödeme işlemi nakliyeci ile gönderici arasında gerçekleşir. İş tamamlandığında nakliyeci ödemeyi yapar. Ödeme detaylarını nakliyeci ile koordine edin. Platform sadece tarafları buluşturan bir pazaryeridir.
                  </div>

                </div>
              </div>
            )}

            {/* Job Info */}
            <div className='bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sm:p-8'>
              <h3 className='text-lg font-bold text-slate-900 mb-4'>İş Bilgileri</h3>
              <div className='space-y-3 text-sm'>
                <div className='flex justify-between'>
                  <span className='text-slate-500'>İş No</span>
                  <span className='font-semibold text-slate-900'>#{job.id}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-slate-500'>Oluşturulma</span>
                  <span className='font-semibold text-slate-900'>
                    {safeFormatDate(job.createdAt)}
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










