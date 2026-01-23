import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { MapPin, DollarSign, Truck, ArrowRight, Search, X, Package } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { TOAST_MESSAGES, showProfessionalToast } from '../../utils/toastMessages';
import Breadcrumb from '../../components/common/Breadcrumb';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import GuidanceOverlay from '../../components/common/GuidanceOverlay';
import { createApiUrl } from '../../config/api';

interface Listing {
  id: number;
  shipmentId: number;
  pickupCity?: string;
  deliveryCity?: string;
  carrierBudgetMax?: number; // Taşıyıcı bütçesi (tavan)
  notes?: string;
  createdAt: string;
  title?: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  weight?: number;
  volume?: number;
  unitType?: string;
  temperatureSetpoint?: string;
  unNumber?: string;
  loadingEquipment?: string;
  price?: number;
  pickupDate?: string;
}

const Market: React.FC = () => {
  const { showToast } = useToast();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [bidPrice, setBidPrice] = useState<Record<number, string>>({});
  const [eta, setEta] = useState<Record<number, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFromCity, setFilterFromCity] = useState('');
  const [filterToCity, setFilterToCity] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'price' | 'distance'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showBidModal, setShowBidModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [bidPriceInput, setBidPriceInput] = useState('');
  const [etaInput, setEtaInput] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return;
      const u = JSON.parse(raw);
      const userId = u?.id;
      const role = String(u?.role || 'tasiyici').toLowerCase();
      if (userId) {
        localStorage.setItem(`yolnext:lastSeen:market:${userId}:${role}`, new Date().toISOString());
        window.dispatchEvent(new Event('yolnext:refresh-badges'));
      }
      const city = (u?.city || u?.profile?.city || '').toString().trim();
      if (city && !filterFromCity) {
        setFilterFromCity(city);
      }
    } catch {
      // ignore
    }
    // only on mount
  }, []);

  const loadListings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');

      const params = new URLSearchParams();
      if (filterFromCity && filterFromCity.trim()) {
        params.set('fromCity', filterFromCity.trim());
      }
      if (filterToCity && filterToCity.trim()) {
        params.set('toCity', filterToCity.trim());
      }

      const url = params.toString()
        ? `${createApiUrl('/api/carrier-market/available')}?${params.toString()}`
        : createApiUrl('/api/carrier-market/available');

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token || ''}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error('Açık ilanlar alınamadı');
      const data = await res.json();
      const listingsData = (Array.isArray(data) ? data : data.data || []) as Listing[];

      const getShipmentCategoryData = (shipment: any) => {
        if (!shipment || typeof shipment !== 'object') return {};
        if (shipment.categoryData || shipment.category_data) {
          return shipment.categoryData || shipment.category_data;
        }
        let meta = shipment.metadata;
        if (typeof meta === 'string') {
          try {
            meta = JSON.parse(meta);
          } catch {
            meta = null;
          }
        }
        if (meta && typeof meta === 'object' && meta.categoryData) {
          return meta.categoryData;
        }
        return {};
      };

      const mappedListings = listingsData.map((listing: any) => {
        const shipment = listing.shipment || {};
        const categoryData = getShipmentCategoryData(shipment);

        const pickupCity =
          shipment.pickupCity ||
          shipment.pickup_city ||
          shipment.pickupcity ||
          shipment.fromCity ||
          shipment.from_city ||
          shipment.from_city_name ||
          shipment.from ||
          '';
        const deliveryCity =
          shipment.deliveryCity ||
          shipment.delivery_city ||
          shipment.deliverycity ||
          shipment.toCity ||
          shipment.to_city ||
          shipment.to_city_name ||
          shipment.to ||
          '';

        const pickupAddress =
          shipment.pickupAddress ||
          shipment.pickup_address ||
          shipment.pickupaddress ||
          shipment.from_address ||
          shipment.fromAddress ||
          pickupCity ||
          '';
        const deliveryAddress =
          shipment.deliveryAddress ||
          shipment.delivery_address ||
          shipment.deliveryaddress ||
          shipment.to_address ||
          shipment.toAddress ||
          deliveryCity ||
          '';

        const weightRaw = shipment.weight ?? shipment.weight_kg ?? shipment.total_weight;
        const volumeRaw = shipment.volume ?? shipment.volume_m3;
        const weight = typeof weightRaw === 'number' ? weightRaw : parseFloat(String(weightRaw || 0)) || 0;
        const volume = typeof volumeRaw === 'number' ? volumeRaw : parseFloat(String(volumeRaw || 0)) || 0;

        const shipmentId = Number(listing.shipmentId ?? listing.shipment_id ?? shipment.id ?? shipment.shipment_id ?? 0);
        const createdAt = listing.createdAt || listing.created_at || '';

        const budgetMax = listing.minPrice ?? listing.min_price;
        const priceRaw =
          listing.price ??
          listing.price_try ??
          listing.total_price ??
          shipment.displayPrice ??
          shipment.display_price ??
          shipment.price ??
          shipment.value;
        const price =
          typeof priceRaw === 'number'
            ? priceRaw
            : priceRaw != null && String(priceRaw).trim() !== ''
              ? Number(priceRaw)
              : undefined;

        const routeTitle = `${String(pickupCity || '').trim()} → ${String(deliveryCity || '').trim()}`.trim();
        const rawTitle = String((shipment.title || listing.title || '') ?? '').trim();
        const shouldPreferRouteTitle =
          !!routeTitle &&
          (!rawTitle || /teklif\s*akışı/i.test(rawTitle));

        return {
          id: listing.id,
          shipmentId,
          pickupCity: String(pickupCity || '').trim() || undefined,
          deliveryCity: String(deliveryCity || '').trim() || undefined,
          carrierBudgetMax: budgetMax,
          title:
            (shouldPreferRouteTitle ? routeTitle : rawTitle) ||
            `${String(pickupCity || getCityFromAddress(pickupAddress) || '').trim()} → ${String(deliveryCity || getCityFromAddress(deliveryAddress) || '').trim()}`.trim() ||
            `Gönderi #${shipmentId || listing.shipmentId}`,
          pickupAddress,
          deliveryAddress,
          weight,
          volume,
          unitType: categoryData.unitType || shipment.unitType,
          temperatureSetpoint:
            categoryData.temperatureSetpoint ||
            categoryData.temperature_setpoint ||
            shipment.temperatureSetpoint ||
            shipment.temperature_setpoint ||
            undefined,
          unNumber:
            categoryData.unNumber ||
            categoryData.un_number ||
            shipment.unNumber ||
            shipment.un_number ||
            undefined,
          loadingEquipment:
            categoryData.loadingEquipment ||
            categoryData.loading_equipment ||
            shipment.loadingEquipment ||
            shipment.loading_equipment ||
            undefined,
          price: typeof price === 'number' && Number.isFinite(price) ? price : 0,
          pickupDate: shipment.pickupDate || shipment.pickup_date || shipment.pickupdate || '',
          createdAt,
        };
      });

      setListings(mappedListings);
    } catch (e) {
      if (import.meta.env.DEV) console.error(e);
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, [filterFromCity, filterToCity]);

  const openBidModal = (listing: Listing) => {
    setSelectedListing(listing);
    setBidPriceInput(bidPrice[listing.id] || '');
    setEtaInput(eta[listing.id] || '');
    setShowBidModal(true);
  };

  const closeBidModal = () => {
    setShowBidModal(false);
    setSelectedListing(null);
    setBidPriceInput('');
    setEtaInput('');
  };

  const sendBid = async () => {
    if (!selectedListing || !bidPriceInput || Number(bidPriceInput) <= 0) {
      showProfessionalToast(showToast, 'INVALID_AMOUNT', 'error');
      return;
    }

    try {
      const userRaw = localStorage.getItem('user');
      const userId = userRaw ? JSON.parse(userRaw || '{}').id : undefined;
      const token = localStorage.getItem('authToken');
      const body = {
        listingId: selectedListing.id,
        bidPrice: Number(bidPriceInput),
        etaHours: etaInput ? Number(etaInput) : undefined,
      };
      const res = await fetch(createApiUrl('/api/carrier-market/bids'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token || ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Teklif gönderilemedi' }));
        throw new Error(errorData.message || 'Teklif gönderilemedi');
      }
      showProfessionalToast(showToast, 'OFFER_SENT', 'success');
      setBidPrice(prev => ({ ...prev, [selectedListing.id]: bidPriceInput }));
      if (etaInput) {
        setEta(prev => ({ ...prev, [selectedListing.id]: etaInput }));
      }
      closeBidModal();
      
      // Reload listings
      const reloadRes = await fetch(createApiUrl('/api/carrier-market/available'), {
        headers: {
          Authorization: `Bearer ${token || ''}`,
          'Content-Type': 'application/json',
        },
      });
      if (reloadRes.ok) {
        const reloadData = await reloadRes.json();
        const listingsData = (Array.isArray(reloadData) ? reloadData : reloadData.data || []) as any[];
        const mappedListings = listingsData.map((listing: any) => {
          const shipment = listing.shipment || {};
          const categoryData =
            shipment.categoryData ||
            shipment.category_data ||
            (() => {
              let meta = shipment.metadata;
              if (typeof meta === 'string') {
                try {
                  meta = JSON.parse(meta);
                } catch {
                  meta = null;
                }
              }
              return meta && typeof meta === 'object' ? meta.categoryData || {} : {};
            })();
          return {
            id: listing.id,
            shipmentId: listing.shipmentId,
            carrierBudgetMax: listing.minPrice, // Backend'den minPrice geliyor, frontend'de carrierBudgetMax olarak kullanıyoruz
            title: shipment.title || listing.title || `Gönderi #${listing.shipmentId}`,
            pickupAddress: shipment.pickupAddress || shipment.from || shipment.pickupCity || '',
            deliveryAddress: shipment.deliveryAddress || shipment.to || shipment.deliveryCity || '',
            weight: shipment.weight || 0,
            volume: shipment.volume || 0,
            unitType: categoryData.unitType || shipment.unitType,
            temperatureSetpoint:
              categoryData.temperatureSetpoint ||
              categoryData.temperature_setpoint ||
              shipment.temperatureSetpoint ||
              shipment.temperature_setpoint ||
              undefined,
            unNumber:
              categoryData.unNumber ||
              categoryData.un_number ||
              shipment.unNumber ||
              shipment.un_number ||
              undefined,
            loadingEquipment:
              categoryData.loadingEquipment ||
              categoryData.loading_equipment ||
              shipment.loadingEquipment ||
              shipment.loading_equipment ||
              undefined,
            price: listing.minPrice || 0,
            pickupDate: shipment.pickupDate || '',
            createdAt: listing.createdAt || '',
          };
        });
        setListings(mappedListings);
      }
    } catch (e: any) {
      showProfessionalToast(showToast, 'OPERATION_FAILED', 'error');
    }
  };

  // Extract city name from address
  const getCityFromAddress = (address?: string): string => {
    if (!address) return '';
    const parts = address.split(',');
    const cityPart = parts[parts.length - 1]?.trim() || '';
    // Remove common suffixes
    return cityPart.replace(/\s*(İl|İli|Şehri)$/i, '').trim();
  };

  const filteredListings = listings
    .filter(listing => {
    const matchesSearch = !searchTerm || 
      (listing.title || `Gönderi #${listing.shipmentId}`).toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.pickupAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.deliveryAddress?.toLowerCase().includes(searchTerm.toLowerCase());
    
      const pickupCity = getCityFromAddress(listing.pickupAddress);
      const deliveryCity = getCityFromAddress(listing.deliveryAddress);
      
      const matchesFromCity = !filterFromCity ||
        pickupCity.toLowerCase().includes(filterFromCity.toLowerCase()) ||
        listing.pickupAddress?.toLowerCase().includes(filterFromCity.toLowerCase());
      
      const matchesToCity = !filterToCity ||
        deliveryCity.toLowerCase().includes(filterToCity.toLowerCase()) ||
        listing.deliveryAddress?.toLowerCase().includes(filterToCity.toLowerCase());
    
      return matchesSearch && matchesFromCity && matchesToCity;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'date') {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        comparison = dateA - dateB;
      } else if (sortBy === 'price') {
        const priceA = a.price || a.carrierBudgetMax || 0;
        const priceB = b.price || b.carrierBudgetMax || 0;
        comparison = priceA - priceB;
      } else if (sortBy === 'distance') {
        // Simple distance approximation - can be enhanced with actual distance calculation
        const pickupCityA = getCityFromAddress(a.pickupAddress);
        const deliveryCityA = getCityFromAddress(a.deliveryAddress);
        const pickupCityB = getCityFromAddress(b.pickupAddress);
        const deliveryCityB = getCityFromAddress(b.deliveryAddress);
        // For now, just sort by city name length as approximation
        comparison = (pickupCityA.length + deliveryCityA.length) - (pickupCityB.length + deliveryCityB.length);
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
  });


  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50'>
      <Helmet>
        <title>Taşıyıcı Pazarı - YolNext</title>
      </Helmet>
      
      <div className='max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6'>
        {/* Breadcrumb */}
        <div className='mb-4 sm:mb-6'>
          <Breadcrumb items={[{ label: 'Pazar', href: '/tasiyici/market' }]} />
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
                    Taşıyıcı Pazarı
                  </h1>
                  <p className='text-slate-200 text-base sm:text-lg leading-relaxed'>
                    Açık ilanlara teklif verin ve yeni iş fırsatları yakalayın
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className='mb-6'>
          <GuidanceOverlay
            storageKey='tasiyici.market'
            isEmpty={!loading && listings.length === 0}
            icon={Truck}
            title='Taşıyıcı Pazarı'
            description='Pazardaki ilanlara uygun bütçe/tarih kriterleriyle teklif ver. Verdiğin teklifleri “Tekliflerim”den, kabul edilen işleri “Aktif İşler”den yönetebilirsin.'
            primaryAction={{
              label: 'Tekliflerim',
              to: '/tasiyici/my-offers',
            }}
            secondaryAction={{
              label: 'Aktif İşler',
              to: '/tasiyici/active-jobs',
            }}
          />
        </div>

        {/* Filters */}
        <div className='bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-gray-100 mb-6'>
          <div className='space-y-4'>
            {/* Search Row */}
            <div className='flex flex-col sm:flex-row gap-4'>
              <div className='flex-1'>
              <label className='block text-sm font-medium text-slate-700 mb-2'>
                  <Search className='inline w-4 h-4 mr-1' />
                  Genel Arama
              </label>
                <input
                  type='text'
                  placeholder='Başlık, açıklama veya adres ara...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                />
              </div>
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
                  onChange={(e) => setFilterFromCity(e.target.value)}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
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
                  onChange={(e) => setFilterToCity(e.target.value)}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                />
                <p className='mt-1 text-xs text-slate-500'>
                  Yükün teslim edileceği şehir
                </p>
              </div>
            </div>

            {/* Sort and Clear Row */}
            <div className='flex flex-col sm:flex-row gap-4 items-end'>
              {/* Sort By */}
              <div className='flex-1 sm:flex-initial sm:w-48'>
                <label className='block text-sm font-medium text-slate-700 mb-2'>
                  Sıralama
                </label>
                <div className='flex gap-2'>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'date' | 'price' | 'distance')}
                    className='flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm'
                  >
                    <option value='date'>Tarih</option>
                    <option value='price'>Fiyat</option>
                    <option value='distance'>Mesafe</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className='px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
                    title={sortOrder === 'asc' ? 'Artan' : 'Azalan'}
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
            </div>

            {/* Clear Filters */}
              {(filterFromCity || filterToCity || searchTerm) && (
              <button
                onClick={() => {
                    setFilterFromCity('');
                    setFilterToCity('');
                  setSearchTerm('');
                }}
                className='px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap'
              >
                <X className='w-4 h-4' />
                  Filtreleri Temizle
              </button>
              )}
            </div>

            {/* Active Filters Info */}
            {(filterFromCity || filterToCity) && (
              <div className='bg-blue-50 rounded-lg p-3 border border-blue-200'>
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
              </div>
            )}
          </div>
        </div>

        {/* Listings Grid */}
        <div>
            {filteredListings.length === 0 ? (
              <div className='min-h-[50vh] flex items-center justify-center'>
                <div className='bg-white rounded-2xl shadow-xl border border-slate-200 p-10 text-center w-full max-w-2xl'>
                  <EmptyState
                    icon={Truck}
                    title={listings.length === 0 ? 'Şimdilik İş Yok' : 'Filtreye Uygun İş Yok'}
                    description={listings.length === 0
                      ? 'Şu anda açık ilan bulunmuyor. Birkaç dakika sonra tekrar deneyebilirsin.'
                      : 'Filtreleri temizleyip tekrar deneyebilirsin.'}
                    action={listings.length === 0 ? {
                      label: 'Yenile',
                      onClick: loadListings,
                    } : {
                      label: 'Filtreleri Temizle',
                      onClick: () => {
                        setFilterFromCity('');
                        setFilterToCity('');
                        setSearchTerm('');
                        setSortBy('date');
                        setSortOrder('desc');
                      },
                    }}
                  />
                </div>
              </div>
            ) : (
              <>
                {filteredListings.length !== listings.length && (
                  <div className='bg-blue-50 rounded-lg p-3 border border-blue-200 text-sm text-blue-800 mb-4'>
                    {filteredListings.length} ilan bulundu (toplam {listings.length})
                  </div>
                )}
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3'>
                  {filteredListings.map(l => (
                    <div
                      key={l.id}
                      className='bg-white rounded-lg p-3 shadow-md border border-gray-100 hover:shadow-lg hover:border-blue-300 transition-all duration-300 flex flex-col'
                    >
                      <h3 className='text-sm font-bold text-slate-900 mb-2 line-clamp-1'>
                        {l.title || `Gönderi #${l.shipmentId}`}
                      </h3>

                      <div className='mb-2.5'>
                        <div className='flex items-center gap-1 mb-1'>
                          <MapPin className='w-3 h-3 text-blue-600 flex-shrink-0' />
                          <span className='text-xs font-medium text-slate-900 truncate'>
                            {(l.pickupCity || getCityFromAddress(l.pickupAddress) || l.pickupAddress || 'Belirtilmemiş').toString()}
                          </span>
                        </div>
                        {l.pickupAddress && (
                          <div className='text-[10px] text-slate-500 truncate pl-4'>
                            {l.pickupAddress}
                          </div>
                        )}
                        <div className='flex items-center gap-1'>
                          <ArrowRight className='w-2.5 h-2.5 text-slate-400 mx-1.5' />
                          <MapPin className='w-3 h-3 text-green-600 flex-shrink-0' />
                          <span className='text-xs font-medium text-slate-900 truncate'>
                            {(l.deliveryCity || getCityFromAddress(l.deliveryAddress) || l.deliveryAddress || 'Belirtilmemiş').toString()}
                          </span>
                        </div>
                        {l.deliveryAddress && (
                          <div className='text-[10px] text-slate-500 truncate pl-8'>
                            {l.deliveryAddress}
                          </div>
                        )}
                      </div>

                      {/* 🚚 Ağırlık/Hacim Bilgisi - Kamyoncu için kritik */}
                      <div className='bg-blue-50 border border-blue-200 rounded-lg p-2.5 mb-2.5'>
                        <div className='flex items-center justify-between text-xs'>
                          <div className='flex items-center gap-1'>
                            <Package className='w-3 h-3 text-blue-600' />
                            <span className='font-semibold text-blue-800'>
                              {l.weight && l.weight > 0 
                                ? `${l.weight.toLocaleString('tr-TR')} kg`
                                : (l.title?.includes('ev') || l.title?.includes('mobilya') 
                                    ? 'Tahmini 800-1500 kg' 
                                    : l.title?.includes('kargo') || l.title?.includes('koli')
                                    ? 'Tahmini 50-200 kg'
                                    : 'Ağırlık belirtilmemiş')
                              }
                            </span>
                          </div>
                          <div className='flex items-center gap-1'>
                            <Package className='w-3 h-3 text-purple-600' />
                            <span className='font-semibold text-purple-800'>
                              {l.volume && l.volume > 0 
                                ? `${l.volume.toLocaleString('tr-TR')} m³`
                                : (l.title?.includes('ev') || l.title?.includes('mobilya')
                                    ? 'Tahmini 8-15 m³'
                                    : l.title?.includes('kargo') || l.title?.includes('koli')
                                    ? 'Tahmini 1-3 m³'
                                    : 'Hacim belirtilmemiş')
                              }
                            </span>
                          </div>
                        </div>
                        {(!l.weight || l.weight === 0) && (!l.volume || l.volume === 0) && (
                          <p className='text-xs text-blue-600 mt-1 font-medium'>
                            📞 Teklif kabul edilirse nakliyeci ile direkt konuşarak kesin ölçüler alabilirsiniz
                          </p>
                        )}
                      </div>

                      {(l.unitType || l.temperatureSetpoint || l.unNumber || l.loadingEquipment) && (
                        <div className='flex flex-wrap gap-1.5 mb-2.5'>
                          {l.unitType && (
                            <span className='px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full border border-gray-200 text-[10px]'>
                              {l.unitType}
                            </span>
                          )}
                          {l.temperatureSetpoint && (
                            <span className='px-2 py-0.5 bg-cyan-50 text-cyan-700 rounded-full border border-cyan-200 text-[10px]'>
                              {l.temperatureSetpoint}℃
                            </span>
                          )}
                          {l.unNumber && (
                            <span className='px-2 py-0.5 bg-red-50 text-red-700 rounded-full border border-red-200 text-[10px]'>
                              {l.unNumber}
                            </span>
                          )}
                          {l.loadingEquipment && (
                            <span className='px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200 text-[10px]'>
                              {l.loadingEquipment}
                            </span>
                          )}
                        </div>
                      )}

                      <div className='mt-auto'>
                        <div className='mb-2.5 pb-2.5 border-b border-gray-200'>
                          {typeof l.price === 'number' && l.price > 0 ? (
                            <div>
                              <div className='text-lg font-bold text-green-600'>
                                ₺{l.price.toLocaleString('tr-TR')}
                              </div>
                              {l.carrierBudgetMax && l.carrierBudgetMax < l.price && (
                                <div className='text-[10px] text-slate-500 mt-0.5'>
                                  Bütçe (Tavan): ₺{l.carrierBudgetMax.toLocaleString('tr-TR')}
                                </div>
                              )}
                            </div>
                          ) : l.carrierBudgetMax ? (
                            <div>
                              <div className='text-[10px] text-slate-500 mb-0.5'>Bütçe (Tavan)</div>
                              <div className='text-lg font-bold text-slate-900'>
                                ₺{l.carrierBudgetMax.toLocaleString('tr-TR')}
                              </div>
                            </div>
                          ) : (
                            <div className='text-sm text-slate-500'>Fiyat belirtilmemiş</div>
                          )}
                        </div>

                        <button
                          onClick={() => openBidModal(l)}
                          className='w-full px-4 py-4 bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 text-white rounded-lg text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg touch-manipulation min-h-[48px]'
                        >
                          <DollarSign className='w-3 h-3' />
                          Teklif Ver
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
        </div>
      </div>

      {/* Bid Modal */}
      <Modal
        isOpen={showBidModal}
        onClose={closeBidModal}
        title={`Teklif Ver - ${selectedListing?.title || `Gönderi #${selectedListing?.shipmentId}`}`}
      >
        {selectedListing && (
          <div className='space-y-4'>
            {/* Listing Info */}
            <div className='bg-blue-50 rounded-lg p-4 border border-blue-200'>
              <div className='text-sm text-slate-600 space-y-1'>
                <div className='flex items-center gap-2'>
                  <MapPin className='w-4 h-4' />
                  <span className='font-medium'>{selectedListing.pickupAddress}</span>
                  <ArrowRight className='w-3 h-3 mx-1' />
                  <span className='font-medium'>{selectedListing.deliveryAddress}</span>
                </div>
                {selectedListing.carrierBudgetMax && (
                  <div className='text-xs text-blue-700 mt-2'>
                    Bütçe (Tavan): ₺{selectedListing.carrierBudgetMax.toLocaleString()}
                  </div>
                )}
              </div>
            </div>

            {/* Bid Price */}
            <div>
              <label className='block text-sm font-medium text-slate-700 mb-2'>
                Teklif Fiyatı (₺) <span className='text-red-500'>*</span>
              </label>
              <input
                type='number'
                value={bidPriceInput}
                onChange={(e) => setBidPriceInput(e.target.value)}
                placeholder='Örn: 3500'
                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                max={selectedListing.carrierBudgetMax || undefined}
              />
              {selectedListing.carrierBudgetMax && Number(bidPriceInput) > selectedListing.carrierBudgetMax && (
                <p className='text-xs text-red-600 mt-1'>
                  Teklif {selectedListing.carrierBudgetMax.toLocaleString()} ₺ tavanını aşamaz
                </p>
              )}
            </div>

            {/* ETA */}
            <div>
              <label className='block text-sm font-medium text-slate-700 mb-2'>
                Tahmini Süre (saat) <span className='text-slate-400'>(Opsiyonel)</span>
              </label>
              <input
                type='number'
                value={etaInput}
                onChange={(e) => setEtaInput(e.target.value)}
                placeholder='Örn: 24'
                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              />
            </div>

            {/* Actions */}
            <div className='flex gap-3 pt-4'>
              <button
                onClick={closeBidModal}
                className='flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-all duration-300'
              >
                İptal
              </button>
              <button
                onClick={sendBid}
                disabled={!bidPriceInput || Number(bidPriceInput) <= 0 || (selectedListing.carrierBudgetMax !== undefined && selectedListing.carrierBudgetMax > 0 && Number(bidPriceInput) > selectedListing.carrierBudgetMax)}
                className='flex-1 px-4 py-2 bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 text-white rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed'
              >
                Teklifi Gönder
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Market;
