import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { MapPin, DollarSign, Truck, ArrowRight, Search, Filter, X, Package } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Breadcrumb from '../../components/common/Breadcrumb';
import LoadingState from '../../components/common/LoadingState';
import Modal from '../../components/common/Modal';
import { createApiUrl } from '../../config/api';

interface Listing {
  id: number;
  shipmentId: number;
  minPrice?: number;
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
    const load = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('authToken');
        const res = await fetch(createApiUrl('/api/carrier-market/available'), {
          headers: {
            Authorization: `Bearer ${token || ''}`,
            'Content-Type': 'application/json',
          },
        });
        if (!res.ok) throw new Error('Açık ilanlar alınamadı');
        const data = await res.json();
        const listingsData = (Array.isArray(data) ? data : data.data || []) as Listing[];
        console.log('🔍 [Market] Loaded listings:', JSON.stringify(listingsData, null, 2));
        console.log('🔍 [Market] Listings count:', listingsData.length);
        
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

        // Map carrier-market listings to Market component format
        const mappedListings = listingsData.map((listing: any) => {
          const shipment = listing.shipment || {};
          const categoryData = getShipmentCategoryData(shipment);
          return {
            id: listing.id,
            shipmentId: listing.shipmentId,
            minPrice: listing.minPrice,
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
      } catch (e) {
        if (import.meta.env.DEV) console.error(e);
        setListings([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

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
      toast.error('Lütfen geçerli bir teklif fiyatı girin');
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
      toast.success('Teklif başarıyla gönderildi!');
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
            minPrice: listing.minPrice,
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
      toast.error(e.message || 'Teklif gönderilemedi');
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
        const priceA = a.price || a.minPrice || 0;
        const priceB = b.price || b.minPrice || 0;
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
              <div className='bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center'>
                <Truck className='w-16 h-16 text-gray-400 mx-auto mb-4' />
                <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                  {listings.length === 0 ? 'Açık ilan bulunamadı' : 'Filtreye uygun ilan bulunamadı'}
                </h3>
                <p className='text-gray-600'>
                  {listings.length === 0
                    ? 'Şu anda açık ilan bulunmamaktadır. Daha sonra tekrar kontrol edin.'
                    : 'Filtreleri değiştirip tekrar deneyin.'}
                </p>
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
                            {l.pickupAddress || 'Belirtilmemiş'}
                          </span>
                        </div>
                        <div className='flex items-center gap-1'>
                          <ArrowRight className='w-2.5 h-2.5 text-slate-400 mx-1.5' />
                          <MapPin className='w-3 h-3 text-green-600 flex-shrink-0' />
                          <span className='text-xs font-medium text-slate-900 truncate'>
                            {l.deliveryAddress || 'Belirtilmemiş'}
                          </span>
                        </div>
                      </div>

                      <div className='flex items-center justify-between text-xs text-slate-600 mb-2.5'>
                        <div className='flex items-center gap-1'>
                          <Package className='w-3 h-3 text-blue-600' />
                          <span>{(l.weight || 0).toLocaleString('tr-TR')} kg</span>
                        </div>
                        <div className='flex items-center gap-1'>
                          <Package className='w-3 h-3 text-purple-600' />
                          <span>{(l.volume || 0).toLocaleString('tr-TR')} m³</span>
                        </div>
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
                              {l.minPrice && l.minPrice < l.price && (
                                <div className='text-[10px] text-slate-500 mt-0.5'>
                                  Min: ₺{l.minPrice.toLocaleString('tr-TR')}
                                </div>
                              )}
                            </div>
                          ) : l.minPrice ? (
                            <div>
                              <div className='text-[10px] text-slate-500 mb-0.5'>Min. Teklif</div>
                              <div className='text-lg font-bold text-slate-900'>
                                ₺{l.minPrice.toLocaleString('tr-TR')}
                              </div>
                            </div>
                          ) : (
                            <div className='text-sm text-slate-500'>Fiyat belirtilmemiş</div>
                          )}
                        </div>

                        <button
                          onClick={() => openBidModal(l)}
                          className='w-full px-2.5 py-2 bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 text-white rounded-lg text-xs font-medium transition-all duration-300 flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg'
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
                {selectedListing.minPrice && (
                  <div className='text-xs text-blue-700 mt-2'>
                    Minimum Teklif: ₺{selectedListing.minPrice.toLocaleString()}
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
                min={selectedListing.minPrice || 0}
              />
              {selectedListing.minPrice && Number(bidPriceInput) < selectedListing.minPrice && (
                <p className='text-xs text-red-600 mt-1'>
                  Minimum {selectedListing.minPrice.toLocaleString()} ₺ olmalı
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
                disabled={!bidPriceInput || Number(bidPriceInput) <= 0 || (selectedListing.minPrice !== undefined && selectedListing.minPrice > 0 && Number(bidPriceInput) < selectedListing.minPrice)}
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
