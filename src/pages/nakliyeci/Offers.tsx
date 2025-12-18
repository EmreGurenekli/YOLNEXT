import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  DollarSign,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Package,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Download,
  Upload,
  MoreHorizontal,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Hand,
  Star,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import Modal from '../../components/common/Modal';
import SuccessMessage from '../../components/common/SuccessMessage';
import Pagination from '../../components/common/Pagination';
import { createApiUrl } from '../../config/api';

export default function NakliyeciOffers() {
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  interface OfferDetail {
    shipmentId: string | number;
    status: string;
    sender: string;
    from: string;
    to: string;
    price: number;
    matchScore: number;
    description: string;
  }
  
  const [selectedOffer, setSelectedOffer] = useState<OfferDetail | null>(null);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState<any>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editMessage, setEditMessage] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [offersPerPage] = useState(10);

  const breadcrumbItems = [
    { label: 'Ana Sayfa', icon: <DollarSign className='w-4 h-4' /> },
    { label: 'Teklifler', icon: <DollarSign className='w-4 h-4' /> },
  ];

  const [offers, setOffers] = useState<any[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const mapOffer = (o: any) => ({
    id: o.id,
    shipmentId: o.shipmentid || o.shipmentId,
    sender: o.shipmentownername || o.sender || o.ownerName || 'Gönderici',
    from: o.pickupcity || o.from || o.pickupCity,
    to: o.deliverycity || o.to || o.deliveryCity,
    status: o.status,
    date: o.createdat || o.createdAt,
    price: Number(o.price || 0),
    weight: o.weight
      ? `${o.weight} kg`
      : o.shipmentWeight
        ? `${o.shipmentWeight} kg`
        : '—',
    category: o.category || o.shipmentCategory || 'Genel',
    estimatedDelivery: o.estimateddelivery || o.estimatedDelivery,
    description: o.message || o.description || '',
    priority: o.priority || 'normal',
    matchScore: o.matchScore || 80,
  });

  const loadOffers = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      
      const userRaw = localStorage.getItem('user');
      const userId = userRaw ? JSON.parse(userRaw || '{}').id : undefined;
      const token = localStorage.getItem('authToken');
      
      const statusParam =
        filterStatus && filterStatus !== 'all'
          ? `?status=${encodeURIComponent(filterStatus)}`
          : '';
      
      const url = createApiUrl(`/api/offers${statusParam}`);
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token || ''}`,
          'X-User-Id': userId || '',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const list = (
        data?.data && Array.isArray(data.data)
          ? data.data
          : Array.isArray(data)
            ? data
            : data?.offers || []
      ) as any[];
      setOffers(list.map(mapOffer));
    } catch (err: any) {
      console.error('Offers load error:', err);
      setLoadError(err?.message || 'Teklifler yüklenemedi');
      setOffers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOffers();
  }, [filterStatus]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'expired':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className='w-4 h-4' />;
      case 'pending':
        return <Clock className='w-4 h-4' />;
      case 'rejected':
        return <XCircle className='w-4 h-4' />;
      case 'expired':
        return <AlertCircle className='w-4 h-4' />;
      default:
        return <DollarSign className='w-4 h-4' />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'Kabul Edildi';
      case 'pending':
        return 'Beklemede';
      case 'rejected':
        return 'Reddedildi';
      case 'expired':
        return 'Süresi Doldu';
      default:
        return 'Bilinmiyor';
    }
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'normal':
        return 'bg-slate-100 text-slate-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredOffers = offers.filter(offer => {
    const shipmentIdText = String(offer.shipmentId || '').toLowerCase();
    const senderText = String(offer.sender || '').toLowerCase();
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      shipmentIdText.includes(query) || senderText.includes(query);
    const matchesStatus =
      filterStatus === 'all' || offer.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const sortedOffers = [...filteredOffers].sort((a, b) => {
    if (sortBy === 'date') {
      return sortOrder === 'asc'
        ? new Date(a.date).getTime() - new Date(b.date).getTime()
        : new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    if (sortBy === 'price') {
      return sortOrder === 'asc' ? a.price - b.price : b.price - a.price;
    }
    if (sortBy === 'matchScore') {
      return sortOrder === 'asc'
        ? a.matchScore - b.matchScore
        : b.matchScore - a.matchScore;
    }
    return 0;
  });

  const indexOfLastOffer = currentPage * offersPerPage;
  const indexOfFirstOffer = indexOfLastOffer - offersPerPage;
  const currentOffers = sortedOffers.slice(indexOfFirstOffer, indexOfLastOffer);

  const handleViewDetails = (offer: any) => {
    setSelectedOffer(offer);
    setShowOfferModal(true);
  };

  // Auto-assign or open broadcast
  const handleAutoAssign = async (offer: any) => {
    try {
      const token = localStorage.getItem('authToken');
      const userRaw = localStorage.getItem('user');
      const userId = userRaw ? JSON.parse(userRaw || '{}').id : undefined;
      
      // Try assign with preferred (no body) - backend will read user settings
      const response1 = await fetch(createApiUrl(`/api/shipments/${offer.shipmentId}/assign-carrier`), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token || ''}`,
          'X-User-Id': userId || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      
      if (response1.ok) {
        setSuccessMessage('Tercihli taşıyıcı atandı');
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
        await loadOffers();
        return;
      }
      
      // If no preferred, open broadcast
      const response2 = await fetch(createApiUrl(`/api/shipments/${offer.shipmentId}/open-broadcast`), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token || ''}`,
          'X-User-Id': userId || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ target: 'my-network' }),
      });
      
      if (response2.ok) {
        setSuccessMessage('Taşıyıcılar için ilan açıldı');
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
        await loadOffers();
      } else {
        throw new Error('İşlem başarısız');
      }
    } catch (err: any) {
      setSuccessMessage(err?.message || 'İşlem başarısız');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    }
  };

  const handleAccept = async (id: number) => {
    try {
      const token = localStorage.getItem('authToken');
      const userRaw = localStorage.getItem('user');
      const userId = userRaw ? JSON.parse(userRaw || '{}').id : undefined;
      
      const response = await fetch(createApiUrl(`/api/offers/${id}/accept`), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token || ''}`,
          'X-User-Id': userId || '',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Teklif kabul edilemedi');
      }

      setSuccessMessage('Teklif başarıyla kabul edildi');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
      await loadOffers();
    } catch (e) {
      setSuccessMessage('Teklif kabul edilemedi');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    }
  };

  const handleReject = async (id: number) => {
    try {
      const token = localStorage.getItem('authToken');
      const userRaw = localStorage.getItem('user');
      const userId = userRaw ? JSON.parse(userRaw || '{}').id : undefined;
      
      const response = await fetch(createApiUrl(`/api/offers/${id}/reject`), {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token || ''}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Teklif reddedilemedi');
      }

      setSuccessMessage('Teklif reddedildi');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
      await loadOffers();
    } catch (e) {
      setSuccessMessage('Teklif reddedilemedi');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    }
  };

  const handleEditClick = (offer: any) => {
    setEditingOffer(offer);
    setEditPrice(offer.price.toString());
    setEditMessage(offer.description || '');
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    if (!editingOffer) return;

    try {
      const token = localStorage.getItem('authToken');
      const userRaw = localStorage.getItem('user');
      const userId = userRaw ? JSON.parse(userRaw || '{}').id : undefined;
      
      const response = await fetch(createApiUrl(`/api/offers/${editingOffer.id}`), {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token || ''}`,
          'X-User-Id': userId || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price: parseFloat(editPrice),
          message: editMessage,
        }),
      });

      if (!response.ok) {
        throw new Error('Teklif güncellenemedi');
      }

      setSuccessMessage('Teklif başarıyla güncellendi');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
      setShowEditModal(false);
      setEditingOffer(null);
      await loadOffers();
    } catch (e: any) {
      setSuccessMessage(e?.message || 'Teklif güncellenemedi');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    }
  };

  const handleCancelClick = (offer: any) => {
    setEditingOffer(offer);
    setShowCancelModal(true);
  };

  const [cancelReason, setCancelReason] = useState('');

  const handleCancelSubmit = async () => {
    if (!editingOffer) return;

    try {
      const token = localStorage.getItem('authToken');
      const userRaw = localStorage.getItem('user');
      const userId = userRaw ? JSON.parse(userRaw || '{}').id : undefined;
      
      // Determine endpoint based on offer status
      const endpoint = editingOffer.status === 'accepted' 
        ? `/api/offers/${editingOffer.id}/cancel-accepted`
        : `/api/offers/${editingOffer.id}/cancel`;
      
      const response = await fetch(createApiUrl(endpoint), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token || ''}`,
          'X-User-Id': userId || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: cancelReason.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Teklif iptal edilemedi');
      }

      const data = await response.json();
      let message = 'Teklif başarıyla iptal edildi';
      if (editingOffer.status === 'accepted' && data.data?.commissionRefunded) {
        message = `Teklif iptal edildi. Komisyon iadesi yapıldı (${data.data.commissionRefunded.toFixed(2)} TL).`;
      }

      setSuccessMessage(message);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);
      setShowCancelModal(false);
      setEditingOffer(null);
      setCancelReason('');
      await loadOffers();
    } catch (e: any) {
      setSuccessMessage(e?.message || 'Teklif iptal edilemedi');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);
    }
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50'>
        <div className='max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6'>
          <LoadingState message='Teklifler yükleniyor...' />
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50'>
      <Helmet>
        <title>Teklifler - Nakliyeci Panel - YolNext</title>
        <meta name='description' content='Nakliyeci teklif yönetimi' />
      </Helmet>

      <div className='max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6'>
        {loadError && (
          <div className='mb-4 p-3 rounded-lg border border-red-200 bg-red-50 text-red-700'>
            {loadError}
          </div>
        )}
        {/* Breadcrumb */}
        <div className='mb-4 sm:mb-6'>
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Header */}
        <div className='text-center mb-8 sm:mb-12'>
          <div className='flex justify-center mb-4 sm:mb-6'>
            <div className='w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg'>
              <DollarSign className='w-6 h-6 sm:w-8 sm:h-8 text-white' />
            </div>
          </div>
          <h1 className='text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-2 sm:mb-3'>
            Tekliflerim
          </h1>
          <p className='text-sm sm:text-base md:text-lg text-slate-600 px-4'>
            Gönderilen ve alınan tüm tekliflerinizi yönetin
          </p>
          {/* Bilgilendirme */}
          <div className='mt-4 max-w-2xl mx-auto space-y-3'>
            <div className='bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800'>
              <p className='font-semibold mb-1'>💡 Bilgi:</p>
              <p>Beklemede olan tekliflerinizi düzenleyebilir veya iptal edebilirsiniz. Kabul edilen teklifler "Aktif Yükler" sayfasına otomatik olarak aktarılır.</p>
            </div>
            <div className='bg-amber-50 border border-amber-300 rounded-lg p-4 text-sm'>
              <div className='flex items-start gap-2'>
                <AlertCircle className='w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5' />
                <div>
                  <p className='font-bold text-amber-900 mb-2'>⚠️ Komisyon İade Politikası</p>
                  <ul className='space-y-1 text-amber-800 text-xs'>
                    <li>• Teklifiniz kabul edildiğinde %1 komisyon cüzdanınızdan kesilir.</li>
                    <li>• <strong>İade sadece şu koşullarda yapılır:</strong></li>
                    <li className='ml-4'>- Taşıyıcı atanmadan önce iptal edilirse</li>
                    <li className='ml-4'>- İlk 24 saat içinde iptal edilirse</li>
                    <li>• İade yapılırsa işlem maliyeti (min. 2 TL) kesilir.</li>
                    <li>• <strong>Taşıyıcı atandıktan sonra iade yapılmaz.</strong></li>
                    <li>• <strong>24 saat sonra iade yapılmaz.</strong></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6'>
          <div className='flex items-center gap-3 mb-4 sm:mb-0'>
            <div className='w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl flex items-center justify-center shadow-lg'>
              <DollarSign className='w-5 h-5 sm:w-6 sm:h-6 text-white' />
            </div>
            <div>
              <h1 className='text-xl sm:text-2xl font-bold text-slate-900'>
                Teklifler
              </h1>
              <p className='text-sm text-slate-600'>
                Nakliye tekliflerinizi yönetin
              </p>
            </div>
          </div>

          <div className='flex flex-wrap gap-2 sm:gap-3'>
            <button className='flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-slate-800 to-blue-900 text-white rounded-lg sm:rounded-xl hover:shadow-lg transition-all duration-200 text-sm font-medium'>
              <Plus className='w-4 h-4 sm:w-5 sm:h-5' />
              <span className='hidden sm:inline'>Yeni Teklif</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8'>
          <div className='bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-slate-600'>Toplam Teklif</p>
                <p className='text-2xl sm:text-3xl font-bold text-slate-900'>
                  {offers.length}
                </p>
              </div>
              <div className='w-10 h-10 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center'>
                <DollarSign className='w-5 h-5 text-white' />
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-slate-600'>Kabul Edilen</p>
                <p className='text-2xl sm:text-3xl font-bold text-green-600'>
                  {offers.filter(o => o.status === 'accepted').length}
                </p>
              </div>
              <div className='w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center'>
                <CheckCircle className='w-5 h-5 text-white' />
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-slate-600'>Bekleyen</p>
                <p className='text-2xl sm:text-3xl font-bold text-yellow-600'>
                  {offers.filter(o => o.status === 'pending').length}
                </p>
              </div>
              <div className='w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center'>
                <Clock className='w-5 h-5 text-white' />
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-slate-600'>Reddedilen</p>
                <p className='text-2xl sm:text-3xl font-bold text-red-600'>
                  {offers.filter(o => o.status === 'rejected').length}
                </p>
              </div>
              <div className='w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center'>
                <XCircle className='w-5 h-5 text-white' />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className='bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200 mb-6 sm:mb-8'>
          <div className='flex flex-col sm:flex-row gap-4'>
            <div className='flex-1'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4' />
                <input
                  type='text'
                  placeholder='Teklif ara...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='w-full pl-10 pr-4 py-2 sm:py-3 border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm'
                />
              </div>
            </div>

            <div className='flex gap-2 sm:gap-3'>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className='px-3 sm:px-4 py-2 sm:py-3 border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm'
              >
                <option value='all'>Tüm Durumlar</option>
                <option value='pending'>Beklemede</option>
                <option value='accepted'>Kabul Edilen</option>
                <option value='rejected'>Reddedilen</option>
                <option value='expired'>Süresi Dolan</option>
              </select>

              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className='px-3 sm:px-4 py-2 sm:py-3 border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm'
              >
                <option value='date'>Tarihe Göre</option>
                <option value='price'>Fiyata Göre</option>
                <option value='matchScore'>Eşleşme Skoruna Göre</option>
              </select>

              <button
                onClick={() =>
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                }
                className='px-3 sm:px-4 py-2 sm:py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg sm:rounded-xl transition-colors'
              >
                {sortOrder === 'asc' ? (
                  <ArrowUp className='w-4 h-4' />
                ) : (
                  <ArrowDown className='w-4 h-4' />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Offers List */}
        {currentOffers.length === 0 ? (
          <EmptyState
            icon={DollarSign}
            title='Teklif bulunamadı'
            description='Arama kriterlerinize uygun teklif bulunamadı.'
          />
        ) : (
          <div className='space-y-4'>
            {currentOffers.map(offer => (
              <div
                key={offer.id}
                className='bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-200'
              >
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                  <div className='flex-1'>
                    <div className='flex items-center gap-3 mb-2'>
                      <span className='text-sm font-medium text-slate-600'>
                        #{offer.shipmentId}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusStyle(offer.status)}`}
                      >
                        {getStatusText(offer.status)}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityStyle(offer.priority)}`}
                      >
                        {offer.priority === 'high'
                          ? 'Yüksek'
                          : offer.priority === 'normal'
                            ? 'Normal'
                            : 'Düşük'}
                      </span>
                      <div className='flex items-center gap-1'>
                        <Star className='w-3 h-3 text-yellow-500' />
                        <span
                          className={`text-xs font-medium ${getMatchScoreColor(offer.matchScore)}`}
                        >
                          %{offer.matchScore} Eşleşme
                        </span>
                      </div>
                    </div>

                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4'>
                      <div>
                        <p className='text-xs text-slate-500 mb-1'>Gönderen</p>
                        <p className='text-sm font-medium text-slate-900'>
                          {offer.sender}
                        </p>
                      </div>
                      <div>
                        <p className='text-xs text-slate-500 mb-1'>Güzergah</p>
                        <p className='text-sm font-medium text-slate-900'>
                          {offer.from} → {offer.to}
                        </p>
                      </div>
                      <div>
                        <p className='text-xs text-slate-500 mb-1'>Fiyat</p>
                        <p className='text-sm font-medium text-slate-900'>
                          ₺{offer.price.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className='flex items-center gap-4 text-xs text-slate-500'>
                      <div className='flex items-center gap-1'>
                        <Calendar className='w-3 h-3' />
                        <span>
                          {new Date(offer.date).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                      <div className='flex items-center gap-1'>
                        <Clock className='w-3 h-3' />
                        <span>
                          Teslimat:{' '}
                          {new Date(offer.estimatedDelivery).toLocaleDateString(
                            'tr-TR'
                          )}
                        </span>
                      </div>
                      <div className='flex items-center gap-1'>
                        <Package className='w-3 h-3' />
                        <span>{offer.category}</span>
                      </div>
                    </div>
                  </div>

                  <div className='flex items-center gap-2'>
                    {offer.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleEditClick(offer)}
                          className='px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-1'
                          title='Teklifi düzenle'
                        >
                          <Edit className='w-4 h-4' />
                          <span className='hidden sm:inline'>Düzenle</span>
                        </button>
                        <button
                          onClick={() => handleCancelClick(offer)}
                          className='px-3 py-2 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-1'
                          title='Teklifi iptal et'
                        >
                          <XCircle className='w-4 h-4' />
                          <span className='hidden sm:inline'>İptal Et</span>
                        </button>
                      </>
                    )}
                    {offer.status === 'accepted' && (
                      <>
                        <button
                          onClick={() => handleAutoAssign(offer)}
                          className='px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-medium transition-colors'
                        >
                          Otomatik Ata
                        </button>
                        <button
                          onClick={() => handleCancelClick(offer)}
                          className='px-3 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-1'
                          title='Kabul edilen teklifi iptal et'
                        >
                          <XCircle className='w-4 h-4' />
                          <span className='hidden sm:inline'>Teklifi İptal Et</span>
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleViewDetails(offer)}
                      className='p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors'
                      title='Detayları görüntüle'
                    >
                      <Eye className='w-4 h-4' />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {filteredOffers.length > offersPerPage && (
          <div className='mt-6 sm:mt-8'>
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredOffers.length / offersPerPage)}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Offer Detail Modal */}
      {showOfferModal && selectedOffer && (
        <Modal
          isOpen={showOfferModal}
          onClose={() => setShowOfferModal(false)}
          title='Teklif Detayları'
        >
          <div className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <p className='text-sm text-slate-500'>Gönderi ID</p>
                <p className='font-medium'>{selectedOffer.shipmentId}</p>
              </div>
              <div>
                <p className='text-sm text-slate-500'>Durum</p>
                <p className='font-medium'>
                  {getStatusText(selectedOffer.status)}
                </p>
              </div>
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <p className='text-sm text-slate-500'>Gönderen</p>
                <p className='font-medium'>{selectedOffer.sender}</p>
              </div>
              <div>
                <p className='text-sm text-slate-500'>Güzergah</p>
                <p className='font-medium'>
                  {selectedOffer.from} → {selectedOffer.to}
                </p>
              </div>
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <p className='text-sm text-slate-500'>Fiyat</p>
                <p className='font-medium'>
                  ₺{selectedOffer.price.toLocaleString()}
                </p>
              </div>
              <div>
                <p className='text-sm text-slate-500'>Eşleşme Skoru</p>
                <p
                  className={`font-medium ${getMatchScoreColor(selectedOffer.matchScore)}`}
                >
                  %{selectedOffer.matchScore}
                </p>
              </div>
            </div>
            <div>
              <p className='text-sm text-slate-500'>Açıklama</p>
              <p className='font-medium'>{selectedOffer.description}</p>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Offer Modal */}
      {showEditModal && editingOffer && (
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingOffer(null);
            setEditPrice('');
            setEditMessage('');
          }}
          title='Teklifi Düzenle'
        >
          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-slate-700 mb-2'>
                Fiyat (₺)
              </label>
              <input
                type='number'
                value={editPrice}
                onChange={e => setEditPrice(e.target.value)}
                className='w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                placeholder='Fiyat girin'
                min='0'
                step='0.01'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-slate-700 mb-2'>
                Mesaj
              </label>
              <textarea
                value={editMessage}
                onChange={e => setEditMessage(e.target.value)}
                className='w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                placeholder='Teklif mesajınızı yazın'
                rows={4}
              />
            </div>
            <div className='flex gap-3 justify-end'>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingOffer(null);
                  setEditPrice('');
                  setEditMessage('');
                }}
                className='px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors'
              >
                İptal
              </button>
              <button
                onClick={handleEditSubmit}
                className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
              >
                Kaydet
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Cancel Offer Modal */}
      {showCancelModal && editingOffer && (
        <Modal
          isOpen={showCancelModal}
          onClose={() => {
            setShowCancelModal(false);
            setEditingOffer(null);
            setCancelReason('');
          }}
          title={editingOffer.status === 'accepted' ? 'Kabul Edilen Teklifi İptal Et' : 'Teklifi İptal Et'}
        >
          <div className='p-6'>
            {editingOffer.status === 'accepted' && (
              <div className='mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800'>
                <p className='font-semibold mb-1'>⚠️ Önemli Bilgi:</p>
                <ul className='list-disc list-inside space-y-0.5'>
                  <li>Kabul edilen teklifi iptal ederseniz, komisyonunuz tam olarak iade edilecektir.</li>
                  <li>Gönderi durumu "Teklif Bekliyor" olarak değişecek ve gönderici tekrar teklif alabilecektir.</li>
                  <li>Eğer taşıyıcı atandıysa, teklif iptal edilemez.</li>
                  <li>Gönderi yolda veya teslim edildiyse, teklif iptal edilemez.</li>
                </ul>
              </div>
            )}
            <p className='text-slate-600 mb-4'>
              Bu teklifi iptal etmek istediğinizden emin misiniz?
            </p>
            <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4'>
              <p className='text-sm text-yellow-800'>
                <strong>Gönderi:</strong> #{editingOffer.shipmentId}
              </p>
              <p className='text-sm text-yellow-800'>
                <strong>Fiyat:</strong> ₺{editingOffer.price.toLocaleString()}
              </p>
            </div>
            {editingOffer.status === 'accepted' && (
              <div className='mb-4'>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  İptal Sebebi (Opsiyonel)
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500'
                  rows={3}
                  placeholder='İptal sebebinizi açıklayın...'
                />
              </div>
            )}
            <div className='flex justify-end gap-3'>
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setEditingOffer(null);
                  setCancelReason('');
                }}
                className='px-4 py-2 bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg'
              >
                Vazgeç
              </button>
              <button
                onClick={handleCancelSubmit}
                className='px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg'
              >
                {editingOffer.status === 'accepted' ? 'Teklifi İptal Et ve Komisyon İadesi Al' : 'Teklifi İptal Et'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Success Message */}
      {showSuccessMessage && (
        <SuccessMessage
          message={successMessage}
          onClose={() => setShowSuccessMessage(false)}
          isVisible={showSuccessMessage}
        />
      )}
    </div>
  );
}
