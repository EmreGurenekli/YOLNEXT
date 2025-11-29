import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Truck,
  MapPin,
  Clock,
  DollarSign,
  Package,
  Star,
  Filter,
  Search,
  Calendar,
  User,
  Phone,
  Mail,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  RefreshCw,
  TrendingUp,
  Navigation,
  Target,
  Zap,
  Plus,
  Minus,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Breadcrumb from '../../components/common/Breadcrumb';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import SuccessMessage from '../../components/common/SuccessMessage';
import Pagination from '../../components/common/Pagination';
import { createApiUrl } from '../../config/api';
import { formatCurrency, formatDate } from '../../utils/format';

interface Job {
  id: number;
  title: string;
  description: string;
  pickupAddress: string;
  deliveryAddress: string;
  pickupDate: string;
  weight: number;
  dimensions: string;
  specialRequirements: string;
  price: number;
  status: string;
  createdAt: string;
  shipperName?: string;
  shipperEmail?: string;
  shipperPhone?: string;
}

const Jobs: React.FC = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFromCity, setFilterFromCity] = useState('');
  const [filterToCity, setFilterToCity] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'price' | 'distance'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    limit: 20,
  });

  useEffect(() => {
    loadJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, statusFilter, searchTerm]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      if (searchTerm && searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }

      const response = await fetch(
        `${createApiUrl('/api/shipments/open')}?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Gönderiler yüklenemedi');
      }

      const data = await response.json();

      if (data.success) {
        setJobs(data.data || []);
        if (data.pagination) {
          setPagination(prev => ({
            ...prev,
            page: data.pagination.page,
            pages: data.pagination.pages,
            total: data.pagination.total,
          }));
        }
      } else {
        throw new Error(data.message || 'Gönderiler yüklenemedi');
      }
    } catch (err) {
      console.error('Gönderiler yüklenemedi:', err);
      setError(err instanceof Error ? err.message : 'Bilinmeyen hata');
    } finally {
      setLoading(false);
    }
  };

  const submitOffer = async () => {
    if (!selectedJob || !offerPrice) return;

    try {
      const response = await fetch(createApiUrl('/api/offers'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shipmentId: selectedJob.id,
          price: parseFloat(offerPrice),
          message: offerMessage,
          estimatedDelivery: new Date(
            Date.now() + 3 * 24 * 60 * 60 * 1000
          ).toISOString(), // 3 gün sonra
        }),
      });

      if (response.ok) {
        setShowOfferModal(false);
        setOfferPrice('');
        setOfferMessage('');
        setSuccessMessage('Teklifiniz başarıyla gönderildi!');
        setShowSuccessMessage(true);
        // Bu nakliyeci için ilgili ilanı listeden kaldır
        setJobs(prev => prev.filter(j => j.id !== selectedJob.id));
        setSelectedJob(null);
      } else {
        console.error('Failed to submit offer');
        setError('Teklif gönderilemedi');
      }
    } catch (error) {
      console.error('Error submitting offer:', error);
      setError('Teklif gönderilemedi');
    }
  };

  const handleOfferSubmit = async () => {
    if (!selectedJob || !offerPrice) return;

    try {
      const response = await fetch(createApiUrl('/api/offers'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shipmentId: selectedJob.id,
          price: parseFloat(offerPrice),
          message: offerMessage,
          estimatedDelivery: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          ).toISOString(),
        }),
      });

      if (response.ok) {
        setSuccessMessage('Teklifiniz başarıyla gönderildi!');
        setShowSuccessMessage(true);
        setShowOfferModal(false);
        setOfferPrice('');
        setOfferMessage('');
        // Bu nakliyeci için ilgili ilanı listeden kaldır
        setJobs(prev => prev.filter(j => j.id !== selectedJob.id));
        setSelectedJob(null);
      } else {
        setError('Teklif gönderilirken hata oluştu');
      }
    } catch (err) {
      console.error('Teklif gönderme hatası:', err);
      setError('Teklif gönderilirken hata oluştu');
    }
  };

  const openOfferModal = (job: Job) => {
    setSelectedJob(job);
    setOfferPrice('');
    setOfferMessage('');
    setShowOfferModal(true);
  };

  const inferLoadType = (job: Job) => {
    const text = `${job.title} ${job.description}`.toLowerCase();
    if (text.includes('mobilya') || text.includes('ev')) return 'mobilya';
    if (
      text.includes('beyaz eşya') ||
      text.includes('buzdolabı') ||
      text.includes('çamaşır')
    )
      return 'beyaz_esya';
    if (text.includes('palet')) return 'palet';
    if (text.includes('araç') || text.includes('oto')) return 'arac';
    return 'diger';
  };

  const normalize = (s: string) =>
    (s || '')
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/İ/g, 'i');

  // Parse inline filters from the single search input
  // Supports: from:istanbul  to:ankara  type:palet
  // Also supports Turkish: cikis:, çıkış:, varis:, varış:, yuk:, yük:
  const parseSearchFilters = (text: string) => {
    const src = normalize(text || '');
    const get = (keys: string[]) => {
      for (const k of keys) {
        const re = new RegExp(`${k}:("[^"]+"|[^\\s]+)`, 'i');
        const m = src.match(re);
        if (m) return m[1].replace(/"/g, '').replace(/^"|"$/g, '');
      }
      return '';
    };
    const from = get(['from', 'cikis', 'çıkış']);
    const to = get(['to', 'varis', 'varış']);
    const type = get(['type', 'yuk', 'yük']);
    // Remove these tokens to get free text
    const cleaned = src
      .replace(/(from|cikis|çıkış):("[^"]+"|\S+)/gi, '')
      .replace(/(to|varis|varış):("[^"]+"|\S+)/gi, '')
      .replace(/(type|yuk|yük):("[^"]+"|\S+)/gi, '')
      .trim();
    return { from, to, type, free: cleaned };
  };

  // Extract city name from address
  const getCityFromAddress = (address?: string): string => {
    if (!address) return '';
    const parts = address.split(',');
    const cityPart = parts[parts.length - 1]?.trim() || '';
    return cityPart.replace(/\s*(İl|İli|Şehri)$/i, '').trim();
  };

  const { from, to, type, free } = parseSearchFilters(searchTerm);
  
  // Combine search term filters with dedicated city filters
  const effectiveFromCity = filterFromCity || from;
  const effectiveToCity = filterToCity || to;
  
  const filteredJobs = jobs
    .filter(job => {
    const jt = normalize(job.title);
    const jd = normalize(job.description);
    const jp = normalize(job.pickupAddress);
    const jv = normalize(job.deliveryAddress);
      const pickupCity = normalize(getCityFromAddress(job.pickupAddress));
      const deliveryCity = normalize(getCityFromAddress(job.deliveryAddress));
      
    const matchesSearch =
      !free ||
      jt.includes(free) ||
      jd.includes(free) ||
      jp.includes(free) ||
      jv.includes(free);

    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;

    const matchesPrice =
      priceFilter === 'all' ||
      (priceFilter === 'low' && job.price < 500) ||
      (priceFilter === 'medium' && job.price >= 500 && job.price < 1000) ||
      (priceFilter === 'high' && job.price >= 1000);

      // City filtering - check both dedicated filters and search term filters
      const matchesFrom = !effectiveFromCity || 
        pickupCity.includes(normalize(effectiveFromCity)) ||
        jp.includes(normalize(effectiveFromCity));
      
      const matchesTo = !effectiveToCity || 
        deliveryCity.includes(normalize(effectiveToCity)) ||
        jv.includes(normalize(effectiveToCity));
      
    const inferred = inferLoadType(job);
    const matchesType = !type || inferred === type;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesPrice &&
      matchesFrom &&
      matchesTo &&
      matchesType
    );
    })
    .sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'date') {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        comparison = dateA - dateB;
      } else if (sortBy === 'price') {
        comparison = (a.price || 0) - (b.price || 0);
      } else if (sortBy === 'distance') {
        const pickupCityA = getCityFromAddress(a.pickupAddress);
        const deliveryCityA = getCityFromAddress(a.deliveryAddress);
        const pickupCityB = getCityFromAddress(b.pickupAddress);
        const deliveryCityB = getCityFromAddress(b.deliveryAddress);
        // Simple approximation
        comparison = (pickupCityA.length + deliveryCityA.length) - (pickupCityB.length + deliveryCityB.length);
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Using format helpers from utils/format.ts
  const formatPrice = formatCurrency;

  const breadcrumbItems = [
    {
      label: 'Ana Sayfa',
      icon: <BarChart3 className='w-4 h-4' />,
      href: '/nakliyeci/dashboard',
    },
    { label: 'İş İlanları', icon: <Truck className='w-4 h-4' /> },
  ];

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-50'>
        <div className='max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6'>
          <LoadingState message='İş ilanları yükleniyor...' />
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50'>
      <Helmet>
        <title>İş İlanları - Nakliyeci Panel - YolNext</title>
        <meta
          name='description'
          content='Nakliyeci için açık iş ilanları ve gönderi teklifleri'
        />
      </Helmet>

      <div className='max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6'>
        {/* Breadcrumb */}
        <div className='mb-4 sm:mb-6'>
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Header */}
        <div className='text-center mb-8 sm:mb-12'>
          <div className='flex justify-center mb-4 sm:mb-6'>
            <div className='w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg'>
              <Target className='w-6 h-6 sm:w-8 sm:h-8 text-white' />
            </div>
          </div>
          <h1 className='text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-2 sm:mb-3'>
            İş{' '}
            <span className='text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-blue-900'>
              İlanları
            </span>
          </h1>
          <p className='text-sm sm:text-base md:text-lg text-slate-600 px-4'>
            Açık gönderiler için teklif verin ve iş alın
          </p>
        </div>

        {/* İstatistikler - Başlığın hemen altında */}

        {/* Action Buttons */}
        <div className='flex justify-center mb-8'>
          <div className='flex flex-wrap gap-2 sm:gap-3'>
            <button
              onClick={loadJobs}
              className='flex items-center gap-2 px-4 py-2 bg-white text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-lg border border-slate-200'
            >
              <RefreshCw className='w-4 h-4' />
              Yenile
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className='flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-slate-800 to-blue-900 text-white rounded-lg hover:shadow-lg transition-all duration-200 font-medium'
            >
              <Filter className='w-4 h-4' />
              Filtrele
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className='bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-slate-200 mb-4 sm:mb-6'>
            <div className='space-y-4'>
              {/* Search Row */}
              <div>
                <label className='block text-sm font-medium text-slate-700 mb-2'>
                  <Search className='inline w-4 h-4 mr-1' />
                  Genel Arama
                </label>
                <input
                  type='text'
                  placeholder='Başlık, açıklama veya adres ara...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm'
                />
              </div>

              {/* City Filters Row */}
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                {/* Başlangıç Şehri */}
                <div>
                  <label className='block text-sm font-medium text-slate-700 mb-2'>
                    <MapPin className='inline w-4 h-4 mr-1 text-blue-600' />
                    Başlangıç Şehri
                  </label>
                  <input
                    type='text'
                    placeholder='Örn: İstanbul, Ankara, İzmir...'
                    value={filterFromCity}
                    onChange={e => setFilterFromCity(e.target.value)}
                    className='w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm'
                  />
                  <p className='mt-1 text-xs text-slate-500'>
                    Yükün alınacağı şehir
                  </p>
                </div>

                {/* Bitiş Şehri */}
                <div>
                  <label className='block text-sm font-medium text-slate-700 mb-2'>
                    <MapPin className='inline w-4 h-4 mr-1 text-green-600' />
                    Bitiş Şehri
                  </label>
                  <input
                    type='text'
                    placeholder='Örn: İstanbul, Ankara, İzmir...'
                    value={filterToCity}
                    onChange={e => setFilterToCity(e.target.value)}
                    className='w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm'
                />
                  <p className='mt-1 text-xs text-slate-500'>
                    Yükün teslim edileceği şehir
                  </p>
                </div>
              </div>

              {/* Additional Filters Row */}
              <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
                {/* Status Filter */}
                <div>
                  <label className='block text-sm font-medium text-slate-700 mb-2'>
                    Durum
                  </label>
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className='w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm'
                  >
                    <option value='all'>Tümü</option>
                    <option value='pending'>Beklemede</option>
                    <option value='open'>Açık</option>
                    <option value='accepted'>Kabul Edildi</option>
                  </select>
                </div>

                {/* Price Filter */}
                <div>
                  <label className='block text-sm font-medium text-slate-700 mb-2'>
                    Fiyat Aralığı
                  </label>
                  <select
                    value={priceFilter}
                    onChange={e => setPriceFilter(e.target.value)}
                    className='w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm'
                  >
                    <option value='all'>Tümü</option>
                    <option value='low'>Düşük (&lt; 500₺)</option>
                    <option value='medium'>Orta (500-1000₺)</option>
                    <option value='high'>Yüksek (&gt; 1000₺)</option>
                  </select>
                </div>

                {/* Sort */}
                <div>
                  <label className='block text-sm font-medium text-slate-700 mb-2'>
                    Sıralama
                  </label>
                  <div className='flex gap-2'>
                    <select
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value as 'date' | 'price' | 'distance')}
                      className='flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm'
                    >
                      <option value='date'>Tarih</option>
                      <option value='price'>Fiyat</option>
                      <option value='distance'>Mesafe</option>
                    </select>
                    <button
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className='px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors'
                      title={sortOrder === 'asc' ? 'Artan' : 'Azalan'}
                    >
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Active Filters Info & Clear */}
              <div className='flex items-center justify-between pt-2 border-t border-slate-200'>
                {(filterFromCity || filterToCity || searchTerm) && (
                  <div className='flex flex-wrap gap-2 text-sm'>
                    {filterFromCity && (
                      <span className='inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md'>
                        <MapPin className='w-3 h-3' />
                        Başlangıç: {filterFromCity}
                      </span>
                    )}
                    {filterToCity && (
                      <span className='inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-md'>
                        <MapPin className='w-3 h-3' />
                        Bitiş: {filterToCity}
                      </span>
                    )}
                  </div>
                )}
              <button
                onClick={() => {
                  setSearchTerm('');
                    setFilterFromCity('');
                    setFilterToCity('');
                  setStatusFilter('all');
                  setPriceFilter('all');
                    setSortBy('date');
                    setSortOrder('desc');
                }}
                  className='inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all duration-200 text-sm'
              >
                <RefreshCw className='w-4 h-4' />
                  Tümünü Temizle
              </button>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className='bg-red-50 border border-red-200 rounded-xl p-4 mb-4 sm:mb-6'>
            <div className='flex items-center'>
              <AlertCircle className='w-5 h-5 text-red-400 mr-2' />
              <p className='text-red-800'>{error}</p>
            </div>
          </div>
        )}

        {/* Jobs List */}
        {!loading && filteredJobs.length === 0 ? (
          <EmptyState
            icon={Package}
            title='Henüz iş ilanı yok'
            description='Şu anda görüntülenecek açık gönderi bulunmuyor.'
            action={{
              label: 'Yeniden Yükle',
              onClick: loadJobs,
            }}
          />
        ) : (
          <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6'>
            {filteredJobs.map(job => (
              <div
                key={job.id}
                className='bg-white rounded-xl shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-200 overflow-hidden'
              >
                {/* Header */}
                <div className='p-4 sm:p-6 border-b border-slate-200'>
                  <div className='flex items-start justify-between mb-3'>
                    <div className='flex-1'>
                      <h3 className='text-lg font-bold text-slate-900 mb-1'>
                        {job.title}
                      </h3>
                      <p className='text-sm text-slate-600 line-clamp-2'>
                        {job.description}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        job.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : job.status === 'accepted'
                            ? 'bg-green-100 text-green-800'
                            : job.status === 'in_progress'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {job.status === 'pending'
                        ? 'Bekleyen'
                        : job.status === 'accepted'
                          ? 'Kabul Edilen'
                          : job.status === 'in_progress'
                            ? 'Devam Eden'
                            : job.status}
                    </span>
                  </div>

                  <div className='flex items-center gap-2 text-slate-600 mb-3'>
                    <MapPin className='w-4 h-4' />
                    <span className='text-sm'>
                      {job.pickupAddress} → {job.deliveryAddress}
                    </span>
                  </div>

                  <div className='flex items-center gap-4 text-sm text-slate-600'>
                    <div className='flex items-center gap-1'>
                      <Package className='w-4 h-4' />
                      <span>{job.weight}kg</span>
                    </div>
                    <div className='flex items-center gap-1'>
                      <Clock className='w-4 h-4' />
                      <span>{formatDate(job.pickupDate, 'long')}</span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className='p-4 sm:p-6'>
                  <div className='flex items-center justify-between mb-4'>
                    <div>
                      <div className='text-2xl font-bold text-slate-900'>
                        {formatPrice(job.price)}
                      </div>
                      <div className='text-sm text-slate-600'>
                        Teklif fiyatı
                      </div>
                    </div>
                    <div className='text-right'>
                      <div className='text-sm text-slate-600'>Gönderen</div>
                      <div className='font-medium text-slate-900'>
                        {job.shipperName || 'Bilinmiyor'}
                      </div>
                    </div>
                  </div>

                  {job.specialRequirements && (
                    <div className='mb-4 p-3 bg-slate-50 rounded-lg'>
                      <div className='text-sm font-medium text-slate-700 mb-1'>
                        Özel Gereksinimler:
                      </div>
                      <div className='text-sm text-slate-600'>
                        {job.specialRequirements}
                      </div>
                    </div>
                  )}

                  <div className='flex gap-2'>
                    <button
                      onClick={() => openOfferModal(job)}
                      className='flex-1 bg-gradient-to-r from-slate-800 to-blue-900 text-white py-2 px-4 rounded-lg hover:shadow-lg transition-all duration-200 text-sm font-medium'
                    >
                      Teklif Ver
                    </button>
                    <button className='p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors'>
                      <Eye className='w-4 h-4' />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination.pages > 1 && (
          <div className='mt-6 sm:mt-8'>
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.pages}
              onPageChange={(page) =>
                setPagination((prev) => ({ ...prev, page }))
              }
            />
          </div>
        )}

        {/* Offer Modal */}
        {showOfferModal && selectedJob && (
          <Modal
            isOpen={showOfferModal}
            onClose={() => setShowOfferModal(false)}
            title='Teklif Ver'
          >
            <div className='space-y-4'>
              <div className='p-4 bg-slate-50 rounded-lg'>
                <h4 className='font-medium text-slate-900 mb-2'>
                  {selectedJob.title}
                </h4>
                <p className='text-sm text-slate-600'>
                  {selectedJob.pickupAddress} → {selectedJob.deliveryAddress}
                </p>
              </div>

              <div>
                <label className='block text-sm font-medium text-slate-700 mb-2'>
                  Teklif Fiyatı (₺)
                </label>
                <input
                  type='number'
                  min='1'
                  step='1'
                  value={offerPrice}
                  onChange={e => setOfferPrice(e.target.value)}
                  className='w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500'
                  placeholder='Teklif fiyatınızı girin'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-slate-700 mb-2'>
                  Mesaj (Opsiyonel)
                </label>
                <textarea
                  value={offerMessage}
                  onChange={e => setOfferMessage(e.target.value)}
                  className='w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500'
                  rows={3}
                  placeholder='Göndericiye mesajınızı yazın...'
                />
              </div>

              <div className='flex gap-3 pt-4'>
                <button
                  onClick={submitOffer}
                  disabled={
                    !offerPrice ||
                    isNaN(parseFloat(offerPrice)) ||
                    parseFloat(offerPrice) <= 0
                  }
                  className={`flex-1 py-2 px-4 rounded-lg transition-all duration-200 font-medium ${!offerPrice || isNaN(parseFloat(offerPrice)) || parseFloat(offerPrice) <= 0 ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-slate-800 to-blue-900 text-white hover:shadow-lg'}`}
                >
                  Teklif Gönder
                </button>
                <button
                  onClick={() => setShowOfferModal(false)}
                  className='px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors'
                >
                  İptal
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Success Message */}
        {showSuccessMessage && (
          <SuccessMessage
            message={successMessage}
            isVisible={showSuccessMessage}
            onClose={() => setShowSuccessMessage(false)}
          />
        )}
      </div>
    </div>
  );
};

export default Jobs;
