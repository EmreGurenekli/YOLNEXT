import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { MapPin, DollarSign, Truck, ArrowRight, Search, Filter, X, Package } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Breadcrumb from '../../components/common/Breadcrumb';
import LoadingState from '../../components/common/LoadingState';
import Modal from '../../components/common/Modal';

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
  price?: number;
  pickupDate?: string;
}

const Market: React.FC = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [bidPrice, setBidPrice] = useState<Record<number, string>>({});
  const [eta, setEta] = useState<Record<number, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [showBidModal, setShowBidModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [bidPriceInput, setBidPriceInput] = useState('');
  const [etaInput, setEtaInput] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('authToken');
        const res = await fetch('/api/carrier-market/available', {
          headers: {
            Authorization: `Bearer ${token || ''}`,
            'Content-Type': 'application/json',
          },
        });
        if (!res.ok) throw new Error('Açık ilanlar alınamadı');
        const data = await res.json();
        setListings(
          (Array.isArray(data) ? data : data.data || []) as Listing[]
        );
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
      const res = await fetch('/api/carrier-market/bids', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token || ''}`,
          'X-User-Id': userId || '',
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
      const reloadRes = await fetch('/api/carrier-market/available', {
        headers: {
          Authorization: `Bearer ${token || ''}`,
          'Content-Type': 'application/json',
        },
      });
      if (reloadRes.ok) {
        const reloadData = await reloadRes.json();
        setListings((Array.isArray(reloadData) ? reloadData : reloadData.data || []) as Listing[]);
      }
    } catch (e: any) {
      toast.error(e.message || 'Teklif gönderilemedi');
    }
  };

  const filteredListings = listings.filter(listing => {
    const matchesSearch = !searchTerm || 
      (listing.title || `Gönderi #${listing.shipmentId}`).toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.pickupAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.deliveryAddress?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCity = !filterCity ||
      listing.pickupAddress?.toLowerCase().includes(filterCity.toLowerCase()) ||
      listing.deliveryAddress?.toLowerCase().includes(filterCity.toLowerCase());
    
    return matchesSearch && matchesCity;
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
        <div className='bg-white rounded-xl p-4 shadow-lg border border-gray-100 mb-6'>
          <div className='flex flex-col sm:flex-row gap-4 items-end'>
            {/* Search */}
            <div className='flex-1 w-full'>
              <label className='block text-sm font-medium text-slate-700 mb-2'>
                Arama
              </label>
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

            {/* City Filter */}
            <div className='w-full sm:w-64'>
              <label className='block text-sm font-medium text-slate-700 mb-2'>
                Şehir
              </label>
              <input
                type='text'
                placeholder='Örn: İstanbul'
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              />
            </div>

            {/* Clear Filters */}
            {(filterCity || searchTerm) && (
              <button
                onClick={() => {
                  setFilterCity('');
                  setSearchTerm('');
                }}
                className='px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap'
              >
                <X className='w-4 h-4' />
                Temizle
              </button>
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
                  {filteredListings.map(l => {
                    // Extract city names from addresses
                    const getCity = (address?: string) => {
                      if (!address) return '';
                      const parts = address.split(',');
                      return parts[parts.length - 1]?.trim() || address;
                    };
                    
                    const pickupCity = getCity(l.pickupAddress);
                    const deliveryCity = getCity(l.deliveryAddress);

                    return (
                      <div
                        key={l.id}
                        className='bg-white rounded-lg p-3 shadow-md border border-gray-100 hover:shadow-lg hover:border-blue-300 transition-all duration-300 flex flex-col'
                      >
                        {/* Title */}
                        <h3 className='text-sm font-bold text-slate-900 mb-2 line-clamp-1'>
                          {l.title || `Gönderi #${l.shipmentId}`}
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
                          {typeof l.weight === 'number' && (
                            <div className='flex items-center gap-1'>
                              <Truck className='w-3 h-3' />
                              <span>{l.weight}kg</span>
                            </div>
                          )}
                          {typeof l.volume === 'number' && l.volume > 0 && (
                            <div className='flex items-center gap-1'>
                              <Package className='w-3 h-3' />
                              <span>{l.volume}m³</span>
                            </div>
                          )}
                        </div>

                        {/* Listing Age removed as requested */}

                        {/* Price - Prominent */}
                        <div className='mb-2.5 pb-2.5 border-b border-gray-200'>
                          {typeof l.price === 'number' ? (
                            <div>
                              <div className='text-lg font-bold text-green-600'>
                                ₺{l.price.toLocaleString()}
                              </div>
                              {l.minPrice && l.minPrice < l.price && (
                                <div className='text-[10px] text-slate-500 mt-0.5'>
                                  Min: ₺{l.minPrice.toLocaleString()}
                                </div>
                              )}
                            </div>
                          ) : l.minPrice ? (
                            <div>
                              <div className='text-[10px] text-slate-500 mb-0.5'>Min. Teklif</div>
                              <div className='text-lg font-bold text-slate-900'>
                                ₺{l.minPrice.toLocaleString()}
                              </div>
                            </div>
                          ) : (
                            <div className='text-sm text-slate-500'>Fiyat belirtilmemiş</div>
                          )}
                        </div>

                        {/* Action Button */}
                        <button
                          onClick={() => openBidModal(l)}
                          className='w-full px-2.5 py-1.5 bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 text-white rounded-lg text-xs font-medium transition-all duration-300 flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg'
                        >
                          <DollarSign className='w-3 h-3' />
                          Teklif Ver
                        </button>
                      </div>
                    );
                  })}
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
