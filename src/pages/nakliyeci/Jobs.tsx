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
  category?: string;
  subcategory?: string;
  pickupCity?: string;
  pickupDistrict?: string;
  deliveryCity?: string;
  deliveryDistrict?: string;
  senderType?: string;
  userType?: string;
  user_type?: string;
  role?: string;
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
  }, [pagination.page, statusFilter, searchTerm, filterFromCity, filterToCity]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[JOBS] Loading jobs...');

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

      // Add city filters to API request
      if (filterFromCity && filterFromCity.trim()) {
        params.append('fromCity', filterFromCity.trim());
      }
      if (filterToCity && filterToCity.trim()) {
        params.append('toCity', filterToCity.trim());
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      let response: Response;
      try {
        response = await fetch(
          `${createApiUrl('/api/shipments/open')}?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('authToken')}`,
              'Content-Type': 'application/json; charset=utf-8',
              'Accept': 'application/json; charset=utf-8',
            },
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[JOBS] API error response:', errorText);
          throw new Error(`Gönderiler yüklenemedi: ${response.status} ${response.statusText}`);
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('İstek zaman aşımına uğradı. Lütfen tekrar deneyin.');
        }
        throw fetchError;
      }

      // Ensure proper UTF-8 decoding
      const responseText = await response.text();
      const data = JSON.parse(responseText);
      console.log('[JOBS] API response:', data);

      if (data.success) {
        // Map API response to include all necessary fields
        const mappedJobs = (data.data || []).map((job: any) => ({
          ...job,
          shipperName: job.senderName || job.shipperName,
          senderType: job.senderType || job.userType || job.user_type || job.role,
          pickupCity: job.pickupCity,
          pickupDistrict: job.pickupDistrict,
          deliveryCity: job.deliveryCity,
          deliveryDistrict: job.deliveryDistrict,
        }));
        setJobs(mappedJobs);
        console.log('[JOBS] Jobs loaded:', mappedJobs.length);
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
      const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
      setError(errorMessage);
      // Set empty jobs array to show empty state instead of staying in loading
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const submitOffer = async () => {
    const trimmedPrice = offerPrice.trim();
    if (!selectedJob || !trimmedPrice || isNaN(parseFloat(trimmedPrice)) || parseFloat(trimmedPrice) <= 0) {
      return;
    }

    try {
      const offerData = {
        shipmentId: selectedJob.id,
        price: parseFloat(trimmedPrice),
        message: offerMessage.trim(),
        estimatedDelivery: new Date(
          Date.now() + 3 * 24 * 60 * 60 * 1000
        ).toISOString(), // 3 gün sonra
      };
      const response = await fetch(createApiUrl('/api/offers'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(offerData),
      });

      const data = await response.json();
      
      if (response.ok) {
        setShowOfferModal(false);
        setOfferPrice('');
        setOfferMessage('');
        setSuccessMessage(data.message || 'Teklifiniz başarıyla gönderildi!');
        setShowSuccessMessage(true);
        setError(null);
        // Reload jobs to ensure sync with backend
        await loadJobs();
        setSelectedJob(null);
      } else {
        const errorMessage = data.message || data.error || 'Teklif gönderilemedi';
        setError(errorMessage);
        setShowOfferModal(false);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Teklif gönderilirken bir hata oluştu';
      setError(errorMessage);
      setShowOfferModal(false);
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

  const { type, free } = parseSearchFilters(searchTerm);
  
  // Backend already filters by city, so we only need to filter by:
  // - Free text search (if not using city filters)
  // - Status
  // - Price
  // - Type
  const filteredJobs = jobs
    .filter(job => {
      const jt = normalize(job.title);
      const jd = normalize(job.description);
      const jp = normalize(job.pickupAddress || '');
      const jv = normalize(job.deliveryAddress || '');
      const pickupCity = normalize(job.pickupCity || '');
      const deliveryCity = normalize(job.deliveryCity || '');
      
      // Free text search (only if not using city filters from search term)
      const matchesSearch =
        !free ||
        jt.includes(free) ||
        jd.includes(free) ||
        jp.includes(free) ||
        jv.includes(free) ||
        pickupCity.includes(free) ||
        deliveryCity.includes(free);

      const matchesStatus = statusFilter === 'all' || job.status === statusFilter;

      const matchesPrice =
        priceFilter === 'all' ||
        (priceFilter === 'low' && job.price < 500) ||
        (priceFilter === 'medium' && job.price >= 500 && job.price < 1000) ||
        (priceFilter === 'high' && job.price >= 1000);
      
      const inferred = inferLoadType(job);
      const matchesType = !type || inferred === type;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPrice &&
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
        // Use direct city fields for sorting
        const pickupCityA = (a.pickupCity || '').length;
        const deliveryCityA = (a.deliveryCity || '').length;
        const pickupCityB = (b.pickupCity || '').length;
        const deliveryCityB = (b.deliveryCity || '').length;
        // Simple approximation
        comparison = (pickupCityA + deliveryCityA) - (pickupCityB + deliveryCityB);
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Using format helpers from utils/format.ts
  const formatPrice = formatCurrency;

  // Category name mapping
  const getCategoryName = (category?: string): string => {
    if (!category) return 'Genel Gönderi';
    
    const categoryMap: { [key: string]: string } = {
      'house_move': 'Ev Taşınması',
      'furniture_goods': 'Mobilya Taşıma',
      'electronics': 'Elektronik & Teknoloji',
      'clothing': 'Giyim & Tekstil',
      'food': 'Gıda & İçecek',
      'construction': 'İnşaat Malzemeleri',
      'automotive': 'Otomotiv',
      'medical': 'Tıbbi Malzemeler',
      'other': 'Diğer',
    };
    
    return categoryMap[category.toLowerCase()] || category;
  };

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
        <Helmet>
          <title>İş İlanları - Nakliyeci Panel - YolNext</title>
        </Helmet>
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
                        {getCategoryName(job.category)}
                      </h3>
                      <p className='text-sm text-slate-600 line-clamp-3 break-words'>
                        {job.description || job.title || 'Açıklama belirtilmemiş'}
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
                      {(() => {
                        // Fix common encoding issues for Turkish characters
                        const fixEncoding = (str: string | null | undefined): string => {
                          if (!str) return '';
                          let fixed = str;
                          
                          // Remove replacement characters first
                          fixed = fixed.replace(/\uFFFD/g, '');
                          fixed = fixed.replace(/�/g, '');
                          
                          // Fix common encoding issues (replacement characters)
                          fixed = fixed.replace(/�/g, 'İ');
                          fixed = fixed.replace(/�/g, 'ı');
                          fixed = fixed.replace(/�/g, 'ş');
                          fixed = fixed.replace(/�/g, 'Ş');
                          fixed = fixed.replace(/�/g, 'ğ');
                          fixed = fixed.replace(/�/g, 'Ğ');
                          fixed = fixed.replace(/�/g, 'ü');
                          fixed = fixed.replace(/�/g, 'Ü');
                          fixed = fixed.replace(/�/g, 'ö');
                          fixed = fixed.replace(/�/g, 'Ö');
                          fixed = fixed.replace(/�/g, 'ç');
                          fixed = fixed.replace(/�/g, 'Ç');
                          
                          // Fix common city name issues (case-insensitive, with or without Turkish chars)
                          fixed = fixed.replace(/^stanbul$/i, 'İstanbul');
                          fixed = fixed.replace(/^Istanbul$/i, 'İstanbul');
                          fixed = fixed.replace(/^zmir$/i, 'İzmir');
                          fixed = fixed.replace(/^Izmir$/i, 'İzmir');
                          fixed = fixed.replace(/^anlurfa$/i, 'Şanlıurfa');
                          fixed = fixed.replace(/^Sanliurfa$/i, 'Şanlıurfa');
                          fixed = fixed.replace(/^Diyarbakr$/i, 'Diyarbakır');
                          fixed = fixed.replace(/^Diyarbakir$/i, 'Diyarbakır');
                          fixed = fixed.replace(/^Balkesir$/i, 'Balıkesir');
                          fixed = fixed.replace(/^Balikesir$/i, 'Balıkesir');
                          fixed = fixed.replace(/^Kahramanmara$/i, 'Kahramanmaraş');
                          fixed = fixed.replace(/^Kahramanmaras$/i, 'Kahramanmaraş');
                          fixed = fixed.replace(/^Aydn$/i, 'Aydın');
                          fixed = fixed.replace(/^Aydin$/i, 'Aydın');
                          fixed = fixed.replace(/^Tekirda$/i, 'Tekirdağ');
                          fixed = fixed.replace(/^Tekirdag$/i, 'Tekirdağ');
                          fixed = fixed.replace(/^Mula$/i, 'Muğla');
                          fixed = fixed.replace(/^Mugla$/i, 'Muğla');
                          fixed = fixed.replace(/^Elaz$/i, 'Elazığ');
                          fixed = fixed.replace(/^Elazig$/i, 'Elazığ');
                          fixed = fixed.replace(/^Ktahya$/i, 'Kütahya');
                          fixed = fixed.replace(/^Kutahya$/i, 'Kütahya');
                          fixed = fixed.replace(/^Uak$/i, 'Uşak');
                          fixed = fixed.replace(/^Usak$/i, 'Uşak');
                          fixed = fixed.replace(/^anakkale$/i, 'Çanakkale');
                          fixed = fixed.replace(/^Canakkale$/i, 'Çanakkale');
                          fixed = fixed.replace(/^orum$/i, 'Çorum');
                          fixed = fixed.replace(/^Corum$/i, 'Çorum');
                          fixed = fixed.replace(/^Nevehir$/i, 'Nevşehir');
                          fixed = fixed.replace(/^Nevsehir$/i, 'Nevşehir');
                          fixed = fixed.replace(/^Nide$/i, 'Niğde');
                          fixed = fixed.replace(/^Nigde$/i, 'Niğde');
                          fixed = fixed.replace(/^Krehir$/i, 'Kırşehir');
                          fixed = fixed.replace(/^Kirsehir$/i, 'Kırşehir');
                          fixed = fixed.replace(/^Kr�ehir$/i, 'Kırşehir');
                          fixed = fixed.replace(/^Ar$/i, 'Ağrı');
                          fixed = fixed.replace(/^Agri$/i, 'Ağrı');
                          fixed = fixed.replace(/^Idr$/i, 'Iğdır');
                          fixed = fixed.replace(/^Igdir$/i, 'Iğdır');
                          fixed = fixed.replace(/^Bingl$/i, 'Bingöl');
                          fixed = fixed.replace(/^Bingol$/i, 'Bingöl');
                          fixed = fixed.replace(/^Mu(?![ğla])$/i, 'Muş'); // Mu but not Muğla
                          fixed = fixed.replace(/^Mus$/i, 'Muş');
                          fixed = fixed.replace(/^rnak$/i, 'Şırnak');
                          fixed = fixed.replace(/^Sirnak$/i, 'Şırnak');
                          
                          return fixed;
                        };
                        const from = job.pickupCity 
                          ? (job.pickupDistrict ? `${fixEncoding(job.pickupCity)}, ${fixEncoding(job.pickupDistrict)}` : fixEncoding(job.pickupCity))
                          : (job.pickupAddress || 'Adres belirtilmemiş');
                        const to = job.deliveryCity 
                          ? (job.deliveryDistrict ? `${fixEncoding(job.deliveryCity)}, ${fixEncoding(job.deliveryDistrict)}` : fixEncoding(job.deliveryCity))
                          : (job.deliveryAddress || 'Adres belirtilmemiş');
                        return `${from} → ${to}`;
                      })()}
                    </span>
                  </div>

                  <div className='flex items-center gap-4 text-sm text-slate-600'>
                    <div className='flex items-center gap-1'>
                      <Clock className='w-4 h-4' />
                      <span>{formatDate(job.pickupDate, 'long')}</span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className='p-4 sm:p-6'>
                  <div className='flex items-center justify-end mb-4'>
                    <div className='text-right'>
                      <div className='text-sm text-slate-600'>Gönderen</div>
                      <div className='font-medium text-slate-900'>
                        {(() => {
                          const senderType = job.senderType || job.userType || job.user_type || job.role;
                          // Sadece individual veya corporate gönderen olabilir
                          if (senderType === 'individual') return 'Bireysel Gönderici';
                          if (senderType === 'corporate') return 'Kurumsal Gönderici';
                          // Diğer roller (nakliyeci, tasiyici) gönderen olamaz
                          return 'Bilinmiyor';
                        })()}
                      </div>
                    </div>
                  </div>

                  {job.specialRequirements && (
                    <div className='mb-4 p-3 bg-slate-50 rounded-lg'>
                      <div className='text-sm font-medium text-slate-700 mb-1'>
                        Özel Gereksinimler:
                      </div>
                      <div className='text-sm text-slate-600 break-words whitespace-pre-wrap'>
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
            onClose={() => {
              setShowOfferModal(false);
              setOfferPrice('');
              setOfferMessage('');
              setSelectedJob(null);
            }}
            title='Teklif Ver'
          >
            <div className='space-y-4'>
              <div className='p-4 bg-slate-50 rounded-lg'>
                <h4 className='font-medium text-slate-900 mb-2'>
                  {selectedJob.title}
                </h4>
                <p className='text-sm text-slate-600'>
                  {(() => {
                    const from = selectedJob.pickupCity 
                      ? (selectedJob.pickupDistrict ? `${selectedJob.pickupCity}, ${selectedJob.pickupDistrict}` : selectedJob.pickupCity)
                      : (selectedJob.pickupAddress || 'Adres belirtilmemiş');
                    const to = selectedJob.deliveryCity 
                      ? (selectedJob.deliveryDistrict ? `${selectedJob.deliveryCity}, ${selectedJob.deliveryDistrict}` : selectedJob.deliveryCity)
                      : (selectedJob.deliveryAddress || 'Adres belirtilmemiş');
                    return `${from} → ${to}`;
                  })()}
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
                  onChange={e => {
                    const value = e.target.value.trim();
                    setOfferPrice(value);
                  }}
                  onBlur={e => {
                    const value = e.target.value.trim();
                    if (value && !isNaN(parseFloat(value)) && parseFloat(value) > 0) {
                      setOfferPrice(value);
                    }
                  }}
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
                  onChange={e => setOfferMessage(e.target.value.trimStart())}
                  onBlur={e => setOfferMessage(e.target.value.trim())}
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
                    offerPrice.trim() === '' ||
                    isNaN(parseFloat(offerPrice.trim())) ||
                    parseFloat(offerPrice.trim()) <= 0
                  }
                  className={`flex-1 py-2 px-4 rounded-lg transition-all duration-200 font-medium ${!offerPrice || offerPrice.trim() === '' || isNaN(parseFloat(offerPrice.trim())) || parseFloat(offerPrice.trim()) <= 0 ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-slate-800 to-blue-900 text-white hover:shadow-lg'}`}
                >
                  Teklif Gönder
                </button>
                <button
                  onClick={() => setShowOfferModal(false)}
                  className='px-4 py-2 bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg'
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
