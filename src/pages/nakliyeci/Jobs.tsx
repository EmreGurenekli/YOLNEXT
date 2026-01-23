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
  Shield,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Breadcrumb from '../../components/common/Breadcrumb';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import SuccessMessage from '../../components/common/SuccessMessage';
import GuidanceOverlay from '../../components/common/GuidanceOverlay';
import { createApiUrl } from '../../config/api';
import { logger } from '../../utils/logger';
import { formatCurrency, formatDate, sanitizeAddressLabel, sanitizeShipmentTitle } from '../../utils/format';
import { normalizeTrackingCode } from '../../utils/trackingCode';

interface Job {
  id: number;
  title: string;
  description: string;
  pickupAddress: string;
  deliveryAddress: string;
  pickupDate: string;
  deliveryDate?: string;
  weight: number;
  dimensions: string;
  quantity?: number;
  specialRequirements: string;
  categoryData?: any;
  price: number;
  volume?: number;
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
  isExclusiveToCarrier?: boolean;
  trackingNumber?: string;
  trackingCode?: string;
  shipmentCode?: string;
  code?: string;
  metadata?: any;
}

const Jobs: React.FC = () => {
  const { user } = useAuth();
  const { token } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRequestUrl, setLastRequestUrl] = useState<string>('');
  const [lastResponseStatus, setLastResponseStatus] = useState<number | null>(null);
  const [lastBackendTotal, setLastBackendTotal] = useState<number | null>(null);
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
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailJob, setDetailJob] = useState<Job | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const showApiDebug =
    !!(import.meta as any)?.env?.DEV &&
    (() => {
      try {
        return localStorage.getItem('debug:api') === '1';
      } catch {
        return false;
      }
    })();
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    limit: 50,
  });
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    // Auto-upgrade older sessions that still have a low limit so new jobs don't "disappear" onto page 2.
    setPagination(prev => (prev.limit < 50 ? { ...prev, limit: 50, page: 1 } : prev));
  }, []);

  useEffect(() => {
    const userId = (user as any)?.id;
    const role = String((user as any)?.role || 'nakliyeci').toLowerCase();
    if (!userId) return;
    localStorage.setItem(`yolnext:lastSeen:market:${userId}:${role}`, new Date().toISOString());
    window.dispatchEvent(new Event('yolnext:refresh-badges'));
  }, [user]);

  useEffect(() => {
    if (pagination.page === 1) {
      loadJobs(false);
    } else {
      loadJobs(true);
    }
  }, [pagination.page]);

  // Reset to page 1 and clear jobs when filters/search change
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
    setJobs([]);
    setHasMore(true);
  }, [statusFilter, searchTerm, filterFromCity, filterToCity]);

  // Load jobs when filters/search change (after reset)
  useEffect(() => {
    if (pagination.page === 1) {
      loadJobs(false);
    }
  }, [statusFilter, searchTerm, filterFromCity, filterToCity]);

  const loadMore = () => {
    if (!hasMore || isLoadingMore) return;
    setPagination(prev => ({ ...prev, page: prev.page + 1 }));
  };

  const STATUS_LABELS: Record<string, string> = {
    waiting_for_offers: 'Teklif Bekliyor',
    open: 'Teklif Bekliyor',
    pending: 'Beklemede',
    offer_accepted: 'Teklif Kabul Edildi',
    accepted: 'Teklif Kabul Edildi',
    assigned: 'Taşıyıcı Atandı',
    in_progress: 'Yükleme',
    picked_up: 'Yük Alındı',
    in_transit: 'Yolda',
    delivered: 'Teslim Edildi',
    completed: 'Tamamlandı',
    cancelled: 'İptal Edildi',
  };

  const normalizeStatus = (raw?: any) => {
    const s = String(raw || '').trim();
    if (!s) return 'waiting_for_offers';
    if (s === 'open') return 'waiting_for_offers';
    return s;
  };

  const formatStatusText = (raw?: any) => {
    const key = normalizeStatus(raw);
    return STATUS_LABELS[key] || key;
  };

  const loadJobs = async (isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setIsLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
      }
      if (showApiDebug) {
        logger.log('[JOBS] Loading jobs...', isLoadMore ? '(load more)' : '');
      }

      const authToken = token || localStorage.getItem('authToken') || localStorage.getItem('token') || '';

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
        const requestUrl = `${createApiUrl('/api/shipments/open')}?${params.toString()}`;
        if (showApiDebug) {
          logger.debug('[JOBS] Request URL:', requestUrl);
        }
        setLastRequestUrl(requestUrl);
        response = await fetch(requestUrl, {
          headers: {
            Authorization: authToken ? `Bearer ${authToken}` : '',
            'Content-Type': 'application/json; charset=utf-8',
            'Accept': 'application/json; charset=utf-8',
          },
          signal: controller.signal,
        });

        if (showApiDebug) {
          logger.debug('[JOBS] Response status:', response.status);
        }
        setLastResponseStatus(response.status);
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
      if (showApiDebug) {
        logger.debug('[JOBS] API response:', data);
      }

      if (data.success) {
        if (showApiDebug) {
          logger.debug('[JOBS] API returned rows:', Array.isArray(data.data) ? data.data.length : 0);
        }
        setLastBackendTotal(typeof data?.pagination?.total === 'number' ? data.pagination.total : null);
        // Map API response to include all necessary fields
        const mappedJobs = (data.data || []).map((job: any) => {
          const requesterId = user?.id != null && String(user.id).trim() !== '' ? Number(user.id) : NaN;
          const pickupCity =
            job.pickupCity || job.pickup_city || job.pickupcity || job.fromCity || job.from_city || job.fromcity;
          const pickupDistrict = job.pickupDistrict || job.pickup_district || job.pickupdistrict;
          const deliveryCity =
            job.deliveryCity || job.delivery_city || job.deliverycity || job.toCity || job.to_city || job.tocity;
          const deliveryDistrict = job.deliveryDistrict || job.delivery_district || job.deliverydistrict;
          const pickupAddress =
            job.pickupAddress || job.pickup_address || job.pickupaddress || job.from_address || job.fromaddress || '';
          const deliveryAddress =
            job.deliveryAddress || job.delivery_address || job.deliveryaddress || job.to_address || job.toaddress || '';
          const category = job.category || job.cargoType || job.shipmentType || job.categoryType;
          const description = job.description || job.productDescription || '';
          const title = sanitizeShipmentTitle(job.title || `${pickupCity || '—'} → ${deliveryCity || '—'}`);
          const status = normalizeStatus(job.status);

          const trackingNumber =
            job.trackingNumber || job.tracking_number || job.trackingnumber ||
            job.trackingCode || job.tracking_code || job.trackingcode ||
            job.shipmentCode || job.shipment_code || job.shipmentcode ||
            job.code || job.trackingNo || job.tracking_no || job.tracking;

          let metadata: any = job.metadata ?? job.meta ?? job.shipment_meta ?? job.shipmentMeta;
          if (typeof metadata === 'string') {
            try {
              metadata = JSON.parse(metadata);
            } catch (_) {
              // keep as string
            }
          }

          const weight =
            typeof job.weight === 'number'
              ? job.weight
              : typeof job.weight_kg === 'number'
                ? job.weight_kg
                : parseFloat(String(job.weight ?? job.weight_kg ?? 0)) || 0;

          const dimensions =
            job.dimensions || job.dimension || job.size || job.dimensions_text || '';

          const quantity =
            typeof job.quantity === 'number'
              ? job.quantity
              : typeof job.quantity_count === 'number'
                ? job.quantity_count
                : typeof job.itemCount === 'number'
                  ? job.itemCount
                  : typeof job.item_count === 'number'
                    ? job.item_count
                    : job.quantity != null
                      ? Number(job.quantity)
                      : job.quantity_count != null
                        ? Number(job.quantity_count)
                        : job.itemCount != null
                          ? Number(job.itemCount)
                          : job.item_count != null
                            ? Number(job.item_count)
                            : undefined;

          let categoryData: any = job.categoryData || job.category_data || undefined;
          if (typeof categoryData === 'string') {
            try {
              categoryData = JSON.parse(categoryData);
            } catch (_) {
              categoryData = undefined;
            }
          }

          const publishTypeRaw =
            job.publishType || job.publish_type || metadata?.publishType || metadata?.publish_type || null;
          const publishType = String(publishTypeRaw || '').trim().toLowerCase();
          const targetIdRaw =
            job.targetNakliyeciId || job.target_nakliyeci_id || metadata?.targetNakliyeciId || metadata?.target_nakliyeci_id;
          const targetId = targetIdRaw != null && String(targetIdRaw).trim() !== '' ? Number(targetIdRaw) : null;
          const exclusiveFallback = publishType === 'specific' && targetId != null && Number.isFinite(requesterId) && requesterId === Number(targetId);

          const volume =
            typeof job.volume === 'number'
              ? job.volume
              : typeof job.volume_m3 === 'number'
                ? job.volume_m3
                : typeof job.cbm === 'number'
                  ? job.cbm
                  : parseFloat(String(job.volume ?? job.volume_m3 ?? job.cbm ?? '')) || undefined;

          const price =
            typeof job.price === 'number'
              ? job.price
              : typeof job.budget === 'number'
                ? job.budget
                : typeof job.targetPrice === 'number'
                  ? job.targetPrice
                  : typeof job.expectedPrice === 'number'
                    ? job.expectedPrice
                    : typeof job.displayPrice === 'number'
                      ? job.displayPrice
                      : parseFloat(
                          String(
                            job.price ??
                              job.budget ??
                              job.targetPrice ??
                              job.expectedPrice ??
                              job.displayPrice ??
                              ''
                          ).replace(/[^0-9.,-]/g, '').replace(',', '.')
                        ) || 0;

          return {
            ...job,
            id: job.id,
            title,
            description,
            pickupAddress: sanitizeAddressLabel(pickupAddress),
            deliveryAddress: sanitizeAddressLabel(deliveryAddress),
            pickupCity,
            pickupDistrict,
            deliveryCity,
            deliveryDistrict,
            status,
            trackingNumber: normalizeTrackingCode(trackingNumber, job.id),
            trackingCode: normalizeTrackingCode(job.trackingCode || job.tracking_code || job.trackingcode, job.id),
            shipmentCode: job.shipmentCode || job.shipment_code || job.shipmentcode,
            code: job.code,
            metadata,
            weight,
            dimensions,
            quantity,
            categoryData,
            volume,
            price,
            createdAt: job.createdAt || job.created_at || '',
            specialRequirements: job.specialRequirements || job.special_requirements || '',
            shipperName: job.senderName || job.shipperName || job.ownerName || job.owner_name,
            shipperEmail: job.senderEmail || job.shipperEmail || job.ownerEmail || job.owner_email || job.email,
            shipperPhone: job.senderPhone || job.shipperPhone || job.ownerPhone || job.owner_phone || job.phone,
            senderType:
              job.senderType ||
              job.userType ||
              job.user_type ||
              job.ownerRole ||
              job.owner_role ||
              job.role,
            isExclusiveToCarrier: !!job.isExclusiveToCarrier || exclusiveFallback,
          };
        });
        setJobs(prev => (isLoadMore ? [...prev, ...mappedJobs] : mappedJobs));
        if (showApiDebug) {
          logger.debug('[JOBS] Jobs loaded:', mappedJobs.length);
          logger.debug('[JOBS] Total jobs:', data.pagination.total);
        }
        if (data.pagination) {
          setPagination(prev => ({
            ...prev,
            page: data.pagination.page,
            pages: data.pagination.pages,
            total: data.pagination.total,
          }));
          setHasMore(data.pagination.page < data.pagination.pages);
        }
      } else {
        const errorMessage = data.message || 'İş ilanları yüklenirken bir hata oluştu.';
        logger.error('[JOBS] API Error:', errorMessage);
        setError(errorMessage);
        // Set empty jobs array to show empty state instead of staying in loading
        setJobs([]);
        setLastBackendTotal(null);
      }
    } catch (err: any) {
      logger.error('[JOBS] Fetch error:', err);
      const errorMessage = err.message || 'İş ilanları yüklenirken bir hata oluştu.';
      setError(errorMessage);
      setJobs([]);
      setLastBackendTotal(null);
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  const submitOffer = async () => {
    const trimmedPrice = offerPrice.trim();
    if (!selectedJob || !trimmedPrice || isNaN(parseFloat(trimmedPrice)) || parseFloat(trimmedPrice) <= 0) {
      return;
    }

    try {
      const authToken = token || localStorage.getItem('authToken') || localStorage.getItem('token') || '';
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
          Authorization: authToken ? `Bearer ${authToken}` : '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(offerData),
      });

      const data = await response.json().catch(() => ({} as any));
      
      if (response.ok) {
        setSuccessMessage(data?.message || 'Teklifiniz başarıyla iletilmiştir. Gönderici tarafından değerlendirilecektir. Kabul edildiğinde ödeme güvence altına alınır ve bildirim alırsınız.');
        setShowSuccessMessage(true);
        setError(null);

        // Remove from current list immediately (so it "pazardan düşer")
        setJobs(prev => prev.filter(j => j.id !== selectedJob.id));

        // Close & reset modal
        setShowOfferModal(false);
        setOfferPrice('');
        setOfferMessage('');
        setSelectedJob(null);

        // Reload jobs to ensure sync with backend (esp. pagination/filters)
        await loadJobs();
      } else {
        const errorMessage =
          data?.message ||
          data?.error ||
          data?.details ||
          (response.status === 402
            ? 'Teklif oluşturulamadı: Cüzdan bakiyesi yetersiz'
            : `Teklif gönderilemedi (HTTP ${response.status})`);
        setError(errorMessage);
        // Keep modal open so user can adjust price/message and retry
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Teklif gönderilirken bir hata oluştu';
      setError(errorMessage);
      // Keep modal open to allow retry
    }
  };

  const handleOfferSubmit = async () => {
    if (!selectedJob || !offerPrice) return;

    try {
      const authToken = token || localStorage.getItem('authToken') || localStorage.getItem('token') || '';
      const response = await fetch(createApiUrl('/api/offers'), {
        method: 'POST',
        headers: {
          Authorization: authToken ? `Bearer ${authToken}` : '',
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
        setSuccessMessage('Teklifiniz gönderildi. Gönderici onayladığında bildirim alacaksınız.');
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
      logger.error('Teklif gönderme hatası:', err);
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
      const jid = normalize(String(job.id ?? ''));
      const tracking = normalize(
        String(
          normalizeTrackingCode(
            job.trackingNumber ?? job.trackingCode ?? job.shipmentCode ?? job.code,
            job.id
          )
        )
      );
      const metaText = normalize(
        typeof job.metadata === 'string'
          ? job.metadata
          : job.metadata && typeof job.metadata === 'object'
            ? JSON.stringify(job.metadata)
            : ''
      );
      const freeDigits = free ? String(free).replace(/\D/g, '') : '';
      const freeDigitsNorm = freeDigits.replace(/^0+/, '');
      const idNorm = String(job.id ?? '').replace(/^0+/, '');
      const trackingDigitsNorm = String(
        normalizeTrackingCode(job.trackingNumber ?? job.trackingCode ?? job.shipmentCode ?? job.code, job.id).replace(/\D/g, '')
      ).replace(/^0+/, '');
      const matchesDigits =
        !freeDigitsNorm ||
        (idNorm && freeDigitsNorm.includes(idNorm)) ||
        (trackingDigitsNorm && freeDigitsNorm.includes(trackingDigitsNorm)) ||
        (idNorm && freeDigitsNorm === idNorm) ||
        (trackingDigitsNorm && freeDigitsNorm === trackingDigitsNorm);
      
      // Free text search (only if not using city filters from search term)
      const matchesSearch =
        !free ||
        jt.includes(free) ||
        jd.includes(free) ||
        jp.includes(free) ||
        jv.includes(free) ||
        pickupCity.includes(free) ||
        deliveryCity.includes(free) ||
        jid.includes(free) ||
        tracking.includes(free) ||
        metaText.includes(free) ||
        matchesDigits;

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
      // Always show "Sana Özel" jobs first
      const exA = a.isExclusiveToCarrier ? 1 : 0;
      const exB = b.isExclusiveToCarrier ? 1 : 0;
      if (exA !== exB) return exB - exA;

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
      'warehouse_transfer': 'Depo Transferi',
      'raw_materials': 'Hammadde',
      'special_cargo': 'Özel Yük',
      'chemical_hazardous': 'Kimyasal / Tehlikeli Madde',
      'automotive_parts': 'Otomotiv Parçaları',
      'furniture': 'Mobilya',
      'furniture_goods': 'Mobilya Taşıma',
      'electronics': 'Elektronik & Teknoloji',
      'clothing': 'Giyim & Tekstil',
      'food': 'Gıda & İçecek',
      'construction': 'İnşaat Malzemeleri',
      'automotive': 'Otomotiv',
      'medical': 'Tıbbi Malzemeler',
      'other': 'Diğer',
      'general': 'Genel Gönderi',
      // Kurumsal kategoriler
      'retail_consumer': 'Perakende & Tüketim Malı',
      'retail consumer': 'Perakende & Tüketim Malı',
      'raw_materials_industrial': 'Ham Madde & Endüstriyel Mal',
      'textile': 'Tekstil & Giyim',
      'food_beverage': 'Gıda & İçecek',
      'furniture_home': 'Mobilya & Ev Eşyası',
      'chemical': 'Kimyasal & Tehlikeli Madde',
      'document': 'Doküman & Önemli Kargo',
      'warehouse': 'Depo Transferi',
      'bulk': 'Dökme Yük',
      'refrigerated': 'Soğutmalı Yük',
      'oversized': 'Büyük Boy Yük',
      'office': 'Ofis Ekipmanı',
      'machinery': 'Makine & Ekipman',
      'exhibition': 'Vitrin & Sergi Malzemesi',
    };

    const raw = String(category || '').trim();
    const key = raw.toLowerCase();
    const mapped = categoryMap[key];
    if (mapped) return mapped;

    // Fallback: never show raw snake_case / english-ish codes to nakliyeci.
    const humanize = (s: string) =>
      s
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const translateTokens: Record<string, string> = {
      general: 'Genel',
      shipment: 'Gönderi',
      cargo: 'Kargo',
      load: 'Yük',
      fragile: 'Kırılabilir',
      heavy: 'Ağır',
      pallet: 'Palet',
      parcel: 'Koli/Parça',
      container: 'Konteyner',
      food: 'Gıda',
      textile: 'Tekstil',
      electronics: 'Elektronik',
      furniture: 'Mobilya',
      automotive: 'Otomotiv',
      chemical: 'Kimyasal',
      machinery: 'Makine',
      construction: 'İnşaat',
      house: 'Ev',
      move: 'Taşınma',
      transfer: 'Transfer',
      warehouse: 'Depo',
      materials: 'Malzemeler',
      raw: 'Hammadde',
      parts: 'Parçaları',
      medical: 'Tıbbi',
      clothing: 'Giyim',
      hazardous: 'Tehlikeli',
      special: 'Özel',
      other: 'Diğer',
    };

    const looksLikeCode = /^[a-z0-9_\-\s]+$/.test(key);
    if (!looksLikeCode) return raw;

    const tokens = humanize(key).split(' ').filter(Boolean);
    const translated = tokens.map(t => translateTokens[t] || t);
    const titled = translated
      .map(w => (w.length ? w.charAt(0).toUpperCase() + w.slice(1) : w))
      .join(' ');

    return titled || 'Genel Gönderi';
  };

  const getCategoryDetailLines = (job: Job): Array<{ label: string; value: string }> => {
    const cd = job.categoryData && typeof job.categoryData === 'object' ? job.categoryData : null;
    if (!cd) return [];

    const lines: Array<{ label: string; value: string }> = [];
    const add = (label: string, v: any) => {
      if (v == null) return;
      if (typeof v === 'string' && v.trim() === '') return;
      if (typeof v === 'boolean') {
        if (v) lines.push({ label, value: 'Evet' });
        return;
      }
      lines.push({ label, value: String(v) });
    };

    // These are fields coming from CreateShipment form's categoryData
    add('Birim Tipi', cd.unitType);
    add('Malzeme Tipi', cd.materialType);
    add('Ambalaj Tipi', cd.packagingType);
    add('Paletli', cd.isPalletized);
    add('Palet Sayısı', cd.palletCount);
    add('Tehlike Sınıfı', cd.hazardClass);
    add('UN No', cd.unNumber);
    add('MSDS', cd.hasMSDS);
    add('Son Kullanma', cd.expiryDate);
    add('Sıcaklık Seti', cd.temperatureSetpoint);
    add('Soğuk Zincir', cd.coldChainRequired ?? cd.requiresColdChain ?? cd.temperatureControlled);
    add('Yükleme Ekipmanı', cd.loadingEquipment);
    add('Depo Tipi', cd.warehouseType);
    add('Dökme Transfer', cd.isBulkTransfer);
    add('Dökme Tipi', cd.bulkType);
    add('Üst Örtü', cd.requiresCover);
    add('Orijinal Ambalaj', cd.isOriginalPackaging);
    add('Kırılgan', cd.isFragile);
    add('Anti-Statik', cd.requiresAntiStatic);
    add('Malzeme Miktarı', cd.materialQuantity);
    add('Hava Koşulu Koruma', cd.requiresWeatherProtection);
    add('Ekipman Tipi', cd.equipmentType);
    add('Montaj', cd.requiresAssembly);
    add('Özel Araç', cd.requiresSpecialVehicle);
    add('Özel İzin', cd.requiresSpecialPermit);
    add('Sertifika', cd.hasCertification);

    // Araç ve Ekipman Gereksinimleri (vehicleRequirements)
    if (cd.vehicleRequirements && typeof cd.vehicleRequirements === 'object') {
      const vr = cd.vehicleRequirements;
      if (vr.vehicleType) {
        const vehicleTypeMap: Record<string, string> = {
          'van': 'Van',
          'kamyonet': 'Kamyonet',
          'kamyon': 'Kamyon',
          'refrigerated': 'Soğutmalı Araç',
          'open_truck': 'Açık Kasa Kamyon',
          'closed_truck': 'Kapalı Kasa Kamyon',
        };
        add('Araç Tipi', vehicleTypeMap[vr.vehicleType] || vr.vehicleType);
      }
      if (vr.trailerType) {
        const trailerTypeMap: Record<string, string> = {
          'tenteli': 'Tenteli Dorse',
          'frigorific': 'Frigorifik Dorse',
          'lowbed': 'Lowbed Dorse',
          'kapalı': 'Kapalı Dorse',
          'açık': 'Açık Dorse',
          'yok': 'Dorse Gerekmiyor',
        };
        add('Dorse Tipi', trailerTypeMap[vr.trailerType] || vr.trailerType);
      }
      add('Vinç Gerekli', vr.requiresCrane);
      add('Forklift Gerekli', vr.requiresForklift);
      add('Hidrolik Kaldırıcı Gerekli', vr.requiresHydraulicLifter);
      if (vr.heavyTonage) {
        add('Ağır Tonaj', vr.heavyTonageAmount ? `${vr.heavyTonageAmount} ton` : '40+ ton');
      }
      if (vr.oversizedLoad) {
        const dims = vr.oversizedDimensions;
        if (dims && (dims.length || dims.width || dims.height)) {
          const dimStr = [dims.length, dims.width, dims.height].filter(Boolean).join(' x ');
          add('Geniş Yük Boyutları', dimStr ? `${dimStr} m` : 'Özel izin gerektiren');
        } else {
          add('Geniş Yük', 'Özel izin gerektiren');
        }
      }
      if (vr.temperatureControl) {
        const tempRange = [vr.temperatureMin, vr.temperatureMax].filter(Boolean).join(' - ');
        add('Sıcaklık Kontrolü', tempRange ? `${tempRange} ℃` : 'Gerekli');
      }
    }

    return lines;
  };

  const getAllCategoryDataLines = (job: Job): Array<{ label: string; value: string }> => {
    const cd = job.categoryData && typeof job.categoryData === 'object' ? job.categoryData : null;
    if (!cd) return [];

    const known = getCategoryDetailLines(job);
    const knownLabels = new Set(known.map(x => x.label));

    const formatKey = (k: string) => {
      const s = String(k || '').replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
      if (!s) return '';
      return s.charAt(0).toUpperCase() + s.slice(1);
    };

    const extra: Array<{ label: string; value: string }> = [];
    const normKey = (k: string) => String(k || '').replace(/[_\s]/g, '').toLowerCase();
    const skipKeys = new Set(
      [
        'unitType',
        'unNumber',
        'hazardClass',
        'hasMsds',
        'requiresSpecialPermit',
        'msds',
      ].map(normKey)
    );
    const addExtra = (k: string, v: any) => {
      if (v == null) return;
      if (typeof v === 'string' && v.trim() === '') return;
      if (skipKeys.has(normKey(k))) return;
      const label = formatKey(k);
      if (!label) return;
      if (knownLabels.has(label)) return;
      if (typeof v === 'boolean') {
        if (v) extra.push({ label, value: 'Evet' });
        return;
      }
      if (typeof v === 'object') {
        try {
          extra.push({ label, value: JSON.stringify(v) });
        } catch (_) {
          extra.push({ label, value: String(v) });
        }
        return;
      }
      extra.push({ label, value: String(v) });
    };

    Object.keys(cd).forEach((k) => addExtra(k, (cd as any)[k]));

    return [...known, ...extra];
  };

  const getQuickInfoLines = (job: Job): Array<{ label: string; value: string }> => {
    const lines: Array<{ label: string; value: string }> = [];
    const add = (label: string, value: any) => {
      if (value == null) return;
      const v = String(value).trim();
      if (!v) return;
      lines.push({ label, value: v });
    };

    add('Başlangıç', [job.pickupCity, job.pickupDistrict].filter(Boolean).join(', '));
    add('Bitiş', [job.deliveryCity, job.deliveryDistrict].filter(Boolean).join(', '));
    add('Yükleme Adresi', sanitizeAddressLabel(job.pickupAddress));
    add('Teslim Adresi', sanitizeAddressLabel(job.deliveryAddress));
    add('Yükleme Tarihi', job.pickupDate ? formatDate(job.pickupDate, 'long') : '');
    add('Teslim Tarihi', job.deliveryDate ? formatDate(job.deliveryDate, 'long') : '');
    add('Ağırlık', job.weight && job.weight > 0 ? `${job.weight} kg` : '');
    add('Hacim', job.volume && Number(job.volume) > 0 ? `${job.volume}` : '');
    add('Ölçüler', job.dimensions);
    add('Adet', job.quantity && Number(job.quantity) > 0 ? `${job.quantity}` : '');
    add('Özel İstekler', job.specialRequirements);
    add('Bütçe', job.price && job.price > 0 ? formatPrice(job.price) : '');

    for (const l of getAllCategoryDataLines(job)) {
      add(l.label, l.value);
    }

    return lines;
  };

  const openDetailModal = (job: Job) => {
    setDetailJob(job);
    setShowDetailModal(true);
  };

  const getJobMeta = (job: any): any => {
    let meta: any = job?.metadata;
    if (typeof meta === 'string') {
      try {
        meta = JSON.parse(meta);
      } catch (_) {
        meta = null;
      }
    }
    return meta && typeof meta === 'object' ? meta : null;
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

        <div className='mb-6'>
          <GuidanceOverlay
            storageKey='nakliyeci.jobs'
            isEmpty={!loading && jobs.length === 0}
            icon={Package}
            title='İş İlanları'
            description='Açık gönderiler için teklif verin. Teklif kabul edildiğinde ödeme güvence altına alınır ve işlem başlar. Teklif durumunuzu "Tekliflerim" sayfasından takip edebilirsiniz.'
            primaryAction={{
              label: 'Aktif Yükler',
              to: '/nakliyeci/active-shipments',
            }}
            secondaryAction={{
              label: 'Tekliflerim',
              to: '/nakliyeci/offers',
            }}
          />
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
              onClick={() => {
                setPagination(prev => ({ ...prev, page: 1, limit: Math.max(prev.limit, 50) }));
              }}
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

        {showApiDebug && (
          <div className='text-[11px] text-slate-500 break-all'>
            API: {lastRequestUrl || '—'} {lastResponseStatus != null ? `(${lastResponseStatus})` : ''}
          </div>
        )}

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
          <div className='min-h-[50vh] flex items-center justify-center'>
            <div className='bg-white rounded-2xl shadow-xl border border-slate-200 p-10 text-center w-full max-w-2xl'>
              <EmptyState
                icon={Package}
                title='Şimdilik iş yok'
                description='Yeni gönderiler gelince burada görünecek. Filtreleri temizleyip tekrar deneyebilirsiniz.'
                action={{
                  label: 'Filtreleri Temizle',
                  onClick: () => {
                    setSearchTerm('');
                    setFilterFromCity('');
                    setFilterToCity('');
                    setStatusFilter('all');
                    setPriceFilter('all');
                    setSortBy('date');
                    setSortOrder('desc');
                  },
                }}
              />
            </div>
          </div>
        ) : (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4'>
            {filteredJobs.map(job => {
              const routeText = (job.pickupCity || job.pickupDistrict || job.deliveryCity || job.deliveryDistrict)
                ? `${[job.pickupCity, job.pickupDistrict].filter(Boolean).join(', ')} → ${[job.deliveryCity, job.deliveryDistrict].filter(Boolean).join(', ')}`
                : '';
              const showBudget = job.price > 0;
              const showPickup = !!job.pickupDate;
              const categoryName = getCategoryName(job.category);
              const isExclusive = !!job.isExclusiveToCarrier;

              return (
                <div
                  key={job.id}
                  className={
                    isExclusive
                      ? 'h-full relative rounded-2xl ring-1 ring-amber-300/70 shadow-[0_10px_30px_-18px_rgba(245,158,11,0.65)]'
                      : 'h-full relative'
                  }
                >
                  <div
                    className={`h-full bg-white rounded-2xl border overflow-hidden relative ${
                      isExclusive ? 'border-amber-200/70 shadow-md' : 'border-slate-200 shadow-md'
                    }`}
                  >
                    {isExclusive ? (
                      <div className='pointer-events-none absolute -top-3 -right-10 rotate-45'>
                        <div className='bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[11px] font-extrabold px-10 py-1 shadow-lg'>
                          Sana Özel
                        </div>
                      </div>
                    ) : null}
                    <div className='h-full p-4 flex flex-col'>
                      <div className='flex items-start justify-between gap-2'>
                        <div className='min-w-0 flex-1'>
                          <div className='text-sm font-semibold text-slate-900 truncate'>
                            {routeText || categoryName}
                          </div>
                          <div className='mt-1 flex items-center gap-2 flex-wrap'>
                            <span className='inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200'>
                              {categoryName}
                            </span>
                            {isExclusive && (
                              <span className='inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200 shadow-sm'>
                                Sana Özel
                              </span>
                            )}
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                normalizeStatus(job.status) === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : normalizeStatus(job.status) === 'offer_accepted' || normalizeStatus(job.status) === 'accepted'
                                    ? 'bg-green-100 text-green-800'
                                    : normalizeStatus(job.status) === 'in_progress' || normalizeStatus(job.status) === 'in_transit'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-slate-100 text-slate-800'
                              }`}
                            >
                              {formatStatusText(job.status)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {isExclusive && (
                        <div className='mt-2 text-xs font-semibold text-orange-700'>
                          Bu ilan sadece senin hesabına özel yayınlandı. Diğer nakliyeciler göremez.
                        </div>
                      )}

                      {getQuickInfoLines(job).length > 0 ? (
                        <div className='mt-2 flex-1'>
                          <div className='text-[11px] font-semibold text-slate-700 mb-1'>Hızlı Bilgiler</div>
                          <div className='grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-slate-700 max-h-[92px] overflow-auto pr-1'>
                            {getQuickInfoLines(job)
                              .slice(0, 16)
                              .map((line, idx) => (
                                <div key={idx} className='col-span-1 min-w-0'>
                                  <span className='text-slate-500'>{line.label}:</span>{' '}
                                  <span className='font-medium break-words'>{line.value}</span>
                                </div>
                              ))}
                          </div>
                        </div>
                      ) : (
                        <div className='mt-2 text-xs text-slate-600 line-clamp-3 flex-1'>
                          {(job.description || '').trim()}
                        </div>
                      )}

                      <div className='mt-2 flex items-center gap-3 text-xs text-slate-600 flex-wrap'>
                        {showPickup && (
                          <span className='inline-flex items-center gap-1'>
                            <Clock className='w-3.5 h-3.5' />
                            {formatDate(job.pickupDate, 'long')}
                          </span>
                        )}
                        {showBudget && (
                          <span className='inline-flex items-center gap-1'>
                            <DollarSign className='w-3.5 h-3.5' />
                            {formatPrice(job.price)}
                          </span>
                        )}
                        {!!job.weight && job.weight > 0 && (
                          <span className='inline-flex items-center gap-1'>
                            <Package className='w-3.5 h-3.5' />
                            {`${job.weight} kg`}
                          </span>
                        )}
                      </div>

                    <div className='mt-auto pt-3 flex items-center gap-2'>
                      <button
                        type='button'
                        onClick={() => openDetailModal(job)}
                        className='flex-1 px-3 py-2 bg-slate-100 text-slate-800 rounded-lg hover:bg-slate-200 transition-all duration-200 text-xs font-medium'
                      >
                        Detay
                      </button>
                      <button
                        onClick={() => openOfferModal(job)}
                        className='flex-1 px-3 py-2 bg-gradient-to-r from-slate-800 to-blue-900 text-white rounded-lg hover:shadow-lg transition-all duration-200 text-xs font-medium'
                      >
                        Teklif Ver
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}

        {/* Infinite Scroll Trigger */}
        {!loading && hasMore && (
          <div className='mt-6 sm:mt-8 flex justify-center'>
            <button
              onClick={loadMore}
              disabled={isLoadingMore}
              className='px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors font-medium'
            >
              {isLoadingMore ? 'Yükleniyor...' : 'Daha fazla yükle'}
            </button>
          </div>
        )}
        {!loading && !hasMore && jobs.length > 0 && (
          <div className='mt-6 sm:mt-8 text-center text-slate-500 text-sm'>
            Tüm ilanlar yüklendi.
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && detailJob && (
          <Modal
            isOpen={showDetailModal}
            onClose={() => {
              setShowDetailModal(false);
              setDetailJob(null);
            }}
            title='İlan Detayı'
          >
            <div className='space-y-3'>
              {detailJob.isExclusiveToCarrier && (
                <div className='p-3 bg-white rounded-lg border border-slate-200'>
                  <div className='text-xs font-semibold text-slate-700 mb-2'>Yayın Bilgisi</div>
                  <div className='text-sm text-slate-700'>Bu ilan sana özel yayınlandı.</div>
                </div>
              )}

              {/* Temel Gönderi Bilgileri */}
              <div className='p-3 bg-white rounded-lg border border-slate-200'>
                <div className='text-xs font-semibold text-slate-700 mb-2'>Gönderi Bilgileri</div>
                <div className='space-y-1 text-sm text-slate-700'>
                  <div>
                    <span className='font-semibold'>İlan No:</span>{' '}
                    #{detailJob.id}
                  </div>
                  <div>
                    <span className='font-semibold'>Kategori:</span>{' '}
                    {detailJob.category || 'Belirtilmemiş'}
                  </div>
                  {detailJob.subcategory && (
                    <div>
                      <span className='font-semibold'>Alt Kategori:</span>{' '}
                      {detailJob.subcategory}
                    </div>
                  )}
                  <div>
                    <span className='font-semibold'>Durum:</span>{' '}
                    <span className='inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800'>
                      {detailJob.status === 'pending' ? 'Teklif Bekliyor' : detailJob.status === 'offer_accepted' ? 'Teklif Kabul Edildi' : detailJob.status === 'in_progress' ? 'Devam Ediyor' : detailJob.status === 'delivered' ? 'Teslim Edildi' : detailJob.status}
                    </span>
                  </div>
                  {detailJob.description && (
                    <div>
                      <span className='font-semibold'>Açıklama:</span>{' '}
                      <span className='break-words'>{detailJob.description}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Adres Bilgileri */}
              {(detailJob.pickupAddress || detailJob.deliveryAddress || detailJob.pickupCity || detailJob.deliveryCity) && (
                <div className='p-3 bg-slate-50 rounded-lg border border-slate-200'>
                  <div className='text-xs font-semibold text-slate-700 mb-2'>Adres Bilgileri</div>
                  <div className='space-y-1 text-sm text-slate-700'>
                    <div>
                      <span className='font-semibold'>Yükleme Şehri:</span>{' '}
                      {detailJob.pickupCity || 'Belirtilmemiş'}
                    </div>
                    {detailJob.pickupDistrict && (
                      <div>
                        <span className='font-semibold'>Yükleme İlçesi:</span>{' '}
                        {detailJob.pickupDistrict}
                      </div>
                    )}
                    {detailJob.pickupAddress && (
                      <div>
                        <span className='font-semibold'>Yükleme Adresi:</span>{' '}
                        <span className='break-words'>{sanitizeAddressLabel(detailJob.pickupAddress)}</span>
                      </div>
                    )}
                    <div>
                      <span className='font-semibold'>Teslimat Şehri:</span>{' '}
                      {detailJob.deliveryCity || 'Belirtilmemiş'}
                    </div>
                    {detailJob.deliveryDistrict && (
                      <div>
                        <span className='font-semibold'>Teslimat İlçesi:</span>{' '}
                        {detailJob.deliveryDistrict}
                      </div>
                    )}
                    {detailJob.deliveryAddress && (
                      <div>
                        <span className='font-semibold'>Teslimat Adresi:</span>{' '}
                        <span className='break-words'>{sanitizeAddressLabel(detailJob.deliveryAddress)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Zaman Bilgileri */}
              {(detailJob.pickupDate || detailJob.deliveryDate) && (
                <div className='p-3 bg-white rounded-lg border border-slate-200'>
                  <div className='text-xs font-semibold text-slate-700 mb-2'>Zaman Bilgileri</div>
                  <div className='space-y-1 text-sm text-slate-700'>
                    {detailJob.pickupDate && (
                      <div>
                        <span className='font-semibold'>Yükleme Tarihi:</span>{' '}
                        {formatDate(detailJob.pickupDate, 'long')}
                      </div>
                    )}
                    {detailJob.deliveryDate && (
                      <div>
                        <span className='font-semibold'>Teslimat Tarihi:</span>{' '}
                        {formatDate(detailJob.deliveryDate, 'long')}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Yük Özellikleri */}
              {(detailJob.weight || detailJob.dimensions || detailJob.volume || (typeof detailJob.quantity === 'number' && Number.isFinite(detailJob.quantity))) && (
                <div className='p-3 bg-slate-50 rounded-lg border border-slate-200'>
                  <div className='text-xs font-semibold text-slate-700 mb-2'>Yük Özellikleri</div>
                  <div className='space-y-1 text-sm text-slate-700'>
                    {detailJob.weight && detailJob.weight > 0 && (
                      <div>
                        <span className='font-semibold'>Ağırlık:</span>{' '}
                        {detailJob.weight} kg
                      </div>
                    )}
                    {typeof detailJob.quantity === 'number' && Number.isFinite(detailJob.quantity) && (
                      <div>
                        <span className='font-semibold'>Miktar:</span>{' '}
                        {detailJob.quantity} adet
                      </div>
                    )}
                    {detailJob.volume && detailJob.volume > 0 && (
                      <div>
                        <span className='font-semibold'>Hacim:</span>{' '}
                        {detailJob.volume.toFixed(2)} m³
                      </div>
                    )}
                    {!!detailJob.dimensions && String(detailJob.dimensions).trim() !== '' && (
                      <div>
                        <span className='font-semibold'>Ölçüler:</span>{' '}
                        <span className='break-words'>{String(detailJob.dimensions)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Fiyat Bilgisi */}
              {detailJob.price && detailJob.price > 0 && (
                <div className='p-3 bg-white rounded-lg border border-slate-200'>
                  <div className='text-xs font-semibold text-slate-700 mb-2'>Fiyat Bilgisi</div>
                  <div className='space-y-1 text-sm text-slate-700'>
                    <div>
                      <span className='font-semibold'>Bütçe:</span>{' '}
                      <span className='font-bold text-green-600'>₺{detailJob.price.toLocaleString('tr-TR')}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Özel Gereksinimler */}
              {detailJob.specialRequirements && (
                <div className='p-3 bg-slate-50 rounded-lg border border-slate-200'>
                  <div className='text-xs font-semibold text-slate-700 mb-2'>Özel Gereksinimler</div>
                  <div className='text-sm text-slate-600 break-words whitespace-pre-wrap'>
                    {detailJob.specialRequirements}
                  </div>
                </div>
              )}

              {/* Formda Doldurulan Ek Bilgiler */}
              {getAllCategoryDataLines(detailJob).length > 0 && (
                <div className='p-3 bg-white rounded-lg border border-slate-200'>
                  <div className='text-xs font-semibold text-slate-700 mb-2'>Ek Bilgiler</div>
                  <div className='space-y-1 text-sm text-slate-700'>
                    {getAllCategoryDataLines(detailJob).map((line, idx) => (
                      <div key={idx} className='flex gap-2'>
                        <span className='font-semibold text-slate-700 min-w-[110px]'>{line.label}:</span>
                        <span className='break-words'>{line.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Gönderici Bilgileri */}
              {detailJob.shipperName && (
                <div className='p-3 bg-green-50 rounded-lg border border-green-200'>
                  <div className='text-xs font-semibold text-slate-700 mb-2'>Gönderici Bilgileri</div>
                  <div className='space-y-1 text-sm text-slate-700'>
                    <div>
                      <span className='font-semibold'>Gönderici Adı:</span>{' '}
                      {detailJob.shipperName}
                    </div>
                    {detailJob.shipperEmail && (
                      <div>
                        <span className='font-semibold'>E-posta:</span>{' '}
                        {detailJob.shipperEmail}
                      </div>
                    )}
                  </div>
                  <div className='mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700'>
                    <strong>Not:</strong> Gönderici telefon numarası gizlilik nedeniyle gösterilmemektedir. İletişim için "Teklif Ver" butonunu kullanarak mesaj gönderebilirsiniz.
                  </div>
                </div>
              )}

              {/* İletişim Bilgisi */}
              <div className='p-3 bg-blue-50 rounded-lg border border-blue-200'>
                <div className='text-xs font-semibold text-slate-700 mb-2'>İletişim</div>
                <div className='text-sm text-slate-700'>
                  Göndericiye teklif mesajı üzerinden ulaşabilirsiniz.
                </div>
                <div className='mt-2 text-xs text-blue-700'>
                  İletişim kurmak için "Teklif Ver" butonunu kullanın
                </div>
              </div>
            </div>
          </Modal>
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
                  type='text'
                  inputMode='decimal'
                  autoComplete='off'
                  value={offerPrice}
                  onChange={e => {
                    // Allow user to type freely (including comma) and validate on blur/submit.
                    setOfferPrice(e.target.value);
                  }}
                  onBlur={e => {
                    const raw = String(e.target.value || '').trim();
                    if (!raw) return;
                    const normalized = raw.replace(/\s+/g, '').replace(',', '.').replace(/[^0-9.]/g, '');
                    const n = parseFloat(normalized);
                    if (Number.isFinite(n) && n > 0) {
                      setOfferPrice(String(n));
                    }
                  }}
                  className='w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-slate-900 caret-slate-900'
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
                  className='w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-slate-900 caret-slate-900'
                  rows={3}
                  placeholder='Göndericiye mesajınızı yazın...'
                />
              </div>

              {/* Ödeme Güvencesi Bilgisi */}
              <div className='p-4 bg-blue-50 border border-blue-200 rounded-lg'>
                <div className='flex items-start gap-3'>
                  <Shield className='w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5' />
                  <div className='flex-1'>
                    <h4 className='text-sm font-semibold text-blue-900 mb-2'>Ödeme Güvencesi</h4>
                    <div className='text-xs text-blue-800 leading-relaxed space-y-2'>
                      <p>
                        Teklifiniz kabul edildiğinde ödeme tutarı gönderici tarafından güvence altına alınır. 
                        Teslimat tamamlandığında ve gönderici onayı sonrasında ödemeniz hesabınıza aktarılır.
                      </p>
                      <p className='font-semibold mt-2'>
                        Önemli: Ödeme detaylarını (IBAN, alıcı adı, açıklama) ve yükleme saatini gönderici ile mesajlaşma üzerinden yazılı olarak netleştirmeniz önerilir. Platform sadece tarafları buluşturan bir pazaryeridir, ödeme işlemleri taraflar arasında gerçekleşir.
                      </p>
                    </div>
                  </div>
                </div>
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


