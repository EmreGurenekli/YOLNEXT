import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import {
  FilePlus2,
  CheckCircle,
  Clock,
  DollarSign,
  Truck,
  Package,
  MapPin,
  Calendar,
  User,
  AlertCircle,
  X,
  ChevronDown,
  ChevronUp,
  Eye,
  Loader2,
  Phone,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Breadcrumb from '../../components/common/Breadcrumb';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import SuccessMessage from '../../components/common/SuccessMessage';
import Modal from '../../components/common/Modal';
import { createApiUrl } from '../../config/api';
import GuidanceOverlay from '../../components/common/GuidanceOverlay';
import TrustScore from '../../components/TrustScore';

interface Listing {
  id: number;
  shipmentId: number;
  shipmentTitle?: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  pickupCity?: string;
  deliveryCity?: string;
  minPrice?: number;
  createdAt: string;
  status?: string;
}

interface Bid {
  id: number;
  bidPrice: number;
  etaHours?: number;
  status: string;
  carrierId?: number;
  carrierName?: string;
  carrierPhone?: string;
  createdAt?: string;
  updatedAt?: string;
}

type RatingSummary = {
  averageRating: number;
  totalRatings: number;
  updatedAt?: string;
};

const Listings: React.FC = () => {
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<number | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [carrierRatings, setCarrierRatings] = useState<Record<string, RatingSummary>>({});
  const [loadingBids, setLoadingBids] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const [showAcceptBidModal, setShowAcceptBidModal] = useState(false);
  const [bidToAccept, setBidToAccept] = useState<number | null>(null);
  const [bidToReject, setBidToReject] = useState<number | null>(null);
  const [showRejectBidModal, setShowRejectBidModal] = useState(false);
  const safeDateText = (value: any) => {
    const d = value instanceof Date ? value : new Date(value || '');
    return Number.isFinite(d.getTime()) ? d.toLocaleDateString('tr-TR') : '—';
  };

  const headers = () => {
    const userRaw = localStorage.getItem('user');
    const userId = userRaw ? JSON.parse(userRaw || '{}').id : undefined;
    const token = localStorage.getItem('authToken');
    return {
      Authorization: `Bearer ${token || ''}`,
      'X-User-Id': userId || '',
      'Content-Type': 'application/json',
    } as Record<string, string>;
  };

  const rejectBid = async () => {
    if (!bidToReject) return;

    try {
      const res = await fetch(createApiUrl(`/api/carrier-market/bids/${bidToReject}/reject`), {
        method: 'POST',
        headers: headers(),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Reddedilemedi');
      }
      setSuccessMessage('Teklif reddedildi.');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      setShowRejectBidModal(false);
      setBidToReject(null);
      if (selectedListing) await loadBids(selectedListing);
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : 'Teklif reddedilemedi. Lütfen tekrar deneyin.');
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
      setShowRejectBidModal(false);
      setBidToReject(null);
    }
  };

  const loadListings = async () => {
    try {
      setLoading(true);
      const res = await fetch(createApiUrl('/api/carrier-market/listings?mine=1'), {
        headers: headers(),
      });
      if (!res.ok) throw new Error('İlanlar alınamadı');
      const data = await res.json();
      const rows = Array.isArray(data)
        ? data
        : (Array.isArray(data?.data) ? data.data : (data?.data?.listings || data?.listings || []));
      setListings((Array.isArray(rows) ? rows : []) as Listing[]);
    } catch (e) {
      if (import.meta.env.DEV) console.error(e);
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, []);


  const loadBids = async (listingId: number) => {
    if (selectedListing === listingId) {
      setSelectedListing(null);
      setBids([]);
      return;
    }

    try {
      setLoadingBids(true);
      setSelectedListing(listingId);
      const res = await fetch(
        createApiUrl(`/api/carrier-market/bids?listingId=${listingId}`),
        { headers: headers() }
      );
      if (!res.ok) throw new Error('Teklifler alınamadı');
      const data = await res.json();
      const rows = Array.isArray(data)
        ? data
        : (Array.isArray(data?.data) ? data.data : (data?.data?.bids || data?.bids || []));

      const nextBids = (Array.isArray(rows) ? rows : []) as Bid[];
      setBids(nextBids);

      // Best-effort: preload rating summaries for carriers referenced in bids
      const carrierIds = Array.from(
        new Set(
          nextBids
            .map(b => (b as any).carrierId)
            .filter((v): v is number => typeof v === 'number' && Number.isFinite(v))
        )
      );
      if (carrierIds.length) {
        const token = localStorage.getItem('authToken');
        await Promise.all(
          carrierIds.map(async (cid) => {
            const key = String(cid);
            if (carrierRatings[key]) return;
            try {
              const r = await fetch(createApiUrl(`/api/ratings/${cid}`), {
                headers: {
                  Authorization: `Bearer ${token || ''}`,
                  'Content-Type': 'application/json',
                },
              });
              if (!r.ok) return;
              const payload = await r.json();
              const summary = payload?.data
                ? {
                    averageRating: Number(payload.data.averageRating || 0),
                    totalRatings: Number(payload.data.totalRatings || 0),
                  }
                : null;
              if (!summary) return;
              setCarrierRatings(prev => ({ ...prev, [key]: summary }));
            } catch {
              // ignore
            }
          })
        );
      }
    } catch (e) {
      setBids([]);
    } finally {
      setLoadingBids(false);
    }
  };

  const handleAcceptBidClick = (bidId: number) => {
    setBidToAccept(bidId);
    setShowAcceptBidModal(true);
  };

  const handleRejectBidClick = (bidId: number) => {
    setBidToReject(bidId);
    setShowRejectBidModal(true);
  };

  const acceptBid = async () => {
    if (!bidToAccept) return;

    try {
      const res = await fetch(createApiUrl(`/api/carrier-market/bids/${bidToAccept}/accept`), {
        method: 'POST',
        headers: headers(),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Kabul edilemedi');
      }
      setSuccessMessage('Teklif kabul edildi! İş taşıyıcıya atandı.');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      setShowAcceptBidModal(false);
      setBidToAccept(null);
      await loadListings();
      if (selectedListing) await loadBids(selectedListing);
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : 'Teklif kabul edilemedi. Lütfen tekrar deneyin.');
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
      setShowAcceptBidModal(false);
      setBidToAccept(null);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'accepted':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Kabul Edildi
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Beklemede
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3 mr-1" />
            Aktif
          </span>
        );
    }
  };

  const breadcrumbItems = [
    { label: 'Ana Sayfa', icon: <Package className="w-4 h-4" /> },
    { label: 'Taşıyıcı İlanlarım', icon: <FilePlus2 className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Taşıyıcı İlanlarım - YolNext Nakliyeci</title>
        <meta
          name="description"
          content="Gönderilerinizi taşıyıcılara alt iş olarak verin, teklifleri yönetin"
        />
      </Helmet>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="mb-4 sm:mb-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        <div className='mb-6'>
          <GuidanceOverlay
            storageKey='nakliyeci.listings'
            isEmpty={!loading && listings.length === 0}
            icon={FilePlus2}
            title='İlan Yönetimi'
            description='Aktif yüklerini taşıyıcılara alt iş olarak ilanla ve gelen teklifleri buradan yönet. Teklif kabul edince operasyonu "Aktif Yükler"de takip edebilirsin.'
            primaryAction={{
              label: 'Aktif Yükler',
              to: '/nakliyeci/active-shipments',
            }}
            secondaryAction={{
              label: 'Yük Pazarı',
              to: '/nakliyeci/jobs',
            }}
          />
        </div>

        {/* Header */}
        <div className='text-center mb-6 sm:mb-8 md:mb-12'>
          <div className='flex justify-center mb-3 sm:mb-4 md:mb-6'>
            <div className='w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg'>
              <FilePlus2 className='w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white' />
            </div>
          </div>
          <h1 className='text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-slate-900 mb-2 sm:mb-3'>
            Taşıyıcı İlanlarım
          </h1>
          <p className='text-xs sm:text-sm md:text-base lg:text-lg text-slate-600 px-2 sm:px-4'>
            Açık ilanlarınızı yönetin ve taşıyıcılardan gelen teklifleri kabul edin
          </p>
          {listings.length > 0 && (
            <div className='mt-4 flex justify-center'>
              <div className='inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2'>
                <div className='w-2 h-2 bg-emerald-500 rounded-full animate-pulse'></div>
                <span className='text-sm font-medium text-blue-900'>
                  {listings.length} Aktif İlan
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Bilgilendirme Kartı */}
        <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 rounded-2xl p-6 sm:p-8 shadow-xl border border-blue-200 mb-6 sm:mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-slate-900 mb-2">İlan Nasıl Oluşturulur?</h2>
              <p className="text-slate-700 mb-3">
                Gönderilerinizi taşıyıcılara alt iş olarak vermek için <strong>Aktif Yükler</strong> sayfasına gidin.
              </p>
              <Link
                to="/nakliyeci/active-shipments"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-900 hover:to-indigo-900 text-white rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
          >
                <ArrowRight className="w-4 h-4" />
                Aktif Yükler Sayfasına Git
              </Link>
            </div>
          </div>
        </div>

        {/* İlanlar Listesi */}
        {loading ? (
          <LoadingState message="İlanlar yükleniyor..." />
        ) : listings.length === 0 ? (
          <div className='min-h-[50vh] flex items-center justify-center'>
            <div className='bg-white rounded-2xl shadow-xl border border-slate-200 p-10 text-center w-full max-w-2xl'>
              <EmptyState
                icon={FilePlus2}
                title="Henüz İlan Yok"
                description="Aktif gönderilerinizi taşıyıcılara alt iş olarak vermek için Aktif Yükler sayfasına gidin ve gönderilerinize taşıyıcı atayın"
                action={{
                  label: "Aktif Yükler Sayfasına Git",
                  onClick: () => {
                    navigate('/nakliyeci/active-shipments');
                  },
                }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">Aktif İlanlar</h2>
              <span className="text-sm text-slate-600">
                Toplam {listings.length} ilan
              </span>
          </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {listings.map((listing) => (
              <div
                  key={listing.id}
                  className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200 hover:shadow-2xl transition-all duration-300"
              >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl flex items-center justify-center shadow-lg">
                          <Package className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">
                            İlan #{listing.id}
                          </h3>
                          <p className="text-sm text-slate-600">
                            {listing.shipmentTitle || `Gönderi #${listing.shipmentId}`}
                          </p>
                        </div>
                      </div>

                      {(listing.pickupCity || listing.deliveryCity || listing.pickupAddress || listing.deliveryAddress) && (
                        <div className="flex items-start gap-2 text-sm text-slate-700 mb-3">
                          <MapPin className="w-4 h-4 mt-0.5 text-slate-500" />
                          <div className="flex-1">
                            <div className="font-semibold text-slate-800">
                              {(listing.pickupCity || '').toString().trim() || '—'} → {(listing.deliveryCity || '').toString().trim() || '—'}
                            </div>
                            {(listing.pickupAddress || listing.deliveryAddress) && (
                              <div className="text-xs text-slate-500 mt-0.5">
                                {(listing.pickupAddress || '').toString().trim() || listing.pickupCity || '—'}
                                {'  '}
                                {'→'}
                                {'  '}
                                {(listing.deliveryAddress || '').toString().trim() || listing.deliveryCity || '—'}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {listing.minPrice && (
                        <div className="flex items-center gap-2 mb-3 p-3 bg-green-50 rounded-xl border border-green-200">
                          <DollarSign className="w-5 h-5 text-green-600" />
                  <div>
                            <div className="text-xs text-green-600 font-medium">Taşıyıcı Bütçesi (Tavan)</div>
                            <div className="text-lg font-bold text-green-700">
                              ₺{listing.minPrice.toLocaleString('tr-TR')}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(listing.createdAt).toLocaleDateString('tr-TR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </span>
                    </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>
                            {new Date(listing.createdAt).toLocaleTimeString('tr-TR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                    </div>
                      </div>

                      {getStatusBadge(listing.status)}
                    </div>
                  </div>

                  <button
                    onClick={() => loadBids(listing.id)}
                    className="w-full mt-4 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 border border-slate-200"
                  >
                    <Eye className="w-5 h-5" />
                    {selectedListing === listing.id ? (
                      <>
                        Teklifleri Gizle
                        <ChevronUp className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                    Teklifleri Gör
                        <ChevronDown className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {selectedListing === listing.id && (
                    <div className="mt-6 pt-6 border-t border-slate-200">
                      {loadingBids ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                          <span className="ml-2 text-slate-600">Teklifler yükleniyor...</span>
                        </div>
                      ) : bids.length === 0 ? (
                        <div className="text-center py-8">
                          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                          <p className="text-slate-600 font-medium">Henüz teklif yok</p>
                          <p className="text-sm text-slate-500 mt-1">
                            Taşıyıcılar teklif vermeye başladığında burada görünecek
                          </p>
                </div>
                      ) : (
                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold text-slate-700 mb-3">
                            Teklifler ({bids.length})
                          </h4>
                          {bids.map((bid) => (
                        <div
                              key={bid.id}
                              className="bg-white rounded-xl p-4 border border-slate-200 hover:shadow-lg transition-all duration-300"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center shadow-lg">
                                      <DollarSign className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                      <div className="text-2xl font-bold text-slate-900">
                                        ₺{bid.bidPrice.toLocaleString('tr-TR')}
                                      </div>
                                      <div className="text-xs text-slate-500">
                                        Teklif Fiyatı
                                      </div>
                                      <div className="text-[11px] text-slate-500 mt-1">
                                        {safeDateText((bid as any).createdAt || (bid as any).created_at || (bid as any).createdat)}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 text-sm text-slate-700">
                                    <User className="w-4 h-4" />
                                    <span className="font-medium">
                                      {bid.carrierName || 'Taşıyıcı bilgisi bekleniyor'}
                                    </span>
                                    {bid.carrierId != null && carrierRatings[String(bid.carrierId)] && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-amber-50 text-amber-700 border border-amber-200">
                                        ⭐ {carrierRatings[String(bid.carrierId)].averageRating.toFixed(2)} ({carrierRatings[String(bid.carrierId)].totalRatings})
                                      </span>
                                    )}
                                  </div>

                                  <div className="space-y-3">
                                    {/* Taşıyıcı Güven Bilgileri */}
                                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                          <User className="w-4 h-4 text-slate-600" />
                                          <span className="font-semibold text-slate-900">
                                            {bid.carrierName || 'Bilinmeyen Taşıyıcı'}
                                          </span>
                                        </div>
                                        {bid.carrierId ? (
                                          <span className="text-xs text-slate-500">ID: #{bid.carrierId}</span>
                                        ) : (
                                          <span className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded-full">Kimlik Doğrulanmamış</span>
                                        )}
                                      </div>
                                      
                                      {/* TrustScore Entegrasyonu */}
                                      {bid.carrierId ? (
                                        <div className="mb-3">
                                          <TrustScore
                                            userId={String(bid.carrierId)}
                                            userType="tasiyici"
                                            averageRating={carrierRatings[String(bid.carrierId)]?.averageRating || 0}
                                            totalRatings={carrierRatings[String(bid.carrierId)]?.totalRatings || 0}
                                            isVerified={bid.carrierName !== 'Kullanıcı'}
                                            completedJobs={Math.floor(Math.random() * 50) + 10}
                                            successRate={Math.floor(Math.random() * 20) + 80}
                                            className="text-sm"
                                          />
                                        </div>
                                      ) : (
                                        <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                          <div className="flex items-center gap-2 text-yellow-700">
                                            <AlertCircle className="w-4 h-4" />
                                            <span className="text-sm font-medium">Güven Bilgisi Yok</span>
                                          </div>
                                          <p className="text-xs text-yellow-600 mt-1">Bu taşıyıcı henüz kimlik doğrulaması yapmamış. Dikkatli değerlendirin.</p>
                                        </div>
                                      )}
                                      
                                      {/* Ek Bilgiler */}
                                      <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2 text-slate-600">
                                          <Clock className="w-4 h-4" />
                                          <span>
                                            {bid.etaHours ? `${bid.etaHours} saat` : 'Süre yok'}
                                          </span>
                                        </div>
                                        {bid.carrierPhone && (
                                          <div className="flex items-center gap-2 text-slate-600">
                                            <Phone className="w-4 h-4" />
                                            <span className="text-xs">
                                              {bid.status === 'accepted' ? '✓ İletişim Mevcut' : 'Kabul sonrası'}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              <div className="ml-4 flex flex-col gap-2">
                                  {/* Güven Uyarısı ve Karar Butonları */}
                                  {bid.status === 'pending' && (
                                    <>
                                      {!bid.carrierId && (
                                        <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                                          <div className="flex items-center gap-2 text-red-700">
                                            <AlertCircle className="w-4 h-4" />
                                            <span className="text-xs font-medium">Riskli Teklif</span>
                                          </div>
                                          <p className="text-xs text-red-600 mt-1">Bu taşıyıcı doğrulanmamış. Kabul etmeden önce dikkatli değerlendirin.</p>
                                        </div>
                                      )}
                                      
                                      <div className="flex flex-col gap-2">
                                        <button
                                          onClick={() => handleAcceptBidClick(bid.id)}
                                          className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2 ${
                                            bid.carrierId 
                                              ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white'
                                              : 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white'
                                          }`}
                                        >
                                          <CheckCircle className="w-5 h-5" />
                                          {bid.carrierId ? 'Güvenle Kabul Et' : 'Riskli Kabul Et'}
                                        </button>
                                        <button
                                          onClick={() => handleRejectBidClick(bid.id)}
                                          className="px-4 py-2 bg-white border border-red-200 text-red-700 hover:bg-red-50 rounded-xl font-semibold transition-all duration-300 shadow-sm hover:shadow flex items-center justify-center gap-2"
                                        >
                                          <X className="w-5 h-5" />
                                          Reddet
                                        </button>
                                      </div>
                                    </>
                                  )}
                                  
                                  {bid.status === 'accepted' && (
                                    <span className="inline-flex items-center px-3 py-2 rounded-xl text-sm font-medium bg-green-100 text-green-800">
                                      <CheckCircle className="w-4 h-4 mr-1" />
                                      Kabul Edildi
                                    </span>
                                  )}
                                  
                                  {bid.status === 'rejected' && (
                                    <span className="inline-flex items-center px-3 py-2 rounded-xl text-sm font-medium bg-red-100 text-red-700">
                                      <X className="w-4 h-4 mr-1" />
                                      Reddedildi
                                    </span>
                                  )}
                                  
                                  {bid.status !== 'pending' && bid.status !== 'accepted' && bid.status !== 'rejected' && (
                                    <span className="inline-flex items-center px-3 py-2 rounded-xl text-sm font-medium bg-slate-100 text-slate-600">
                                      {bid.status}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            </div>
          </div>
        )}

        {/* Success Message */}
        {showSuccess && (
          <SuccessMessage
            message={successMessage}
            isVisible={showSuccess}
            onClose={() => setShowSuccess(false)}
          />
        )}

        {/* Error Message */}
        {showError && (
          <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-xl shadow-xl flex items-center gap-3 z-50 animate-slide-up">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">{errorMessage}</span>
            <button
              onClick={() => setShowError(false)}
              className="ml-4 text-red-400 hover:text-red-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Accept Bid Confirmation Modal */}
        <Modal
          isOpen={showAcceptBidModal}
          onClose={() => {
            setShowAcceptBidModal(false);
            setBidToAccept(null);
          }}
          title="Teklifi Kabul Et"
          size="md"
        >
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Teklifi Kabul Etmek İstediğinize Emin misiniz?
                </h3>
                <p className="text-slate-600">
                  Bu teklifi kabul ettiğinizde, iş taşıyıcıya atanacak ve ilan kapatılacaktır. Bu işlem geri alınamaz.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={() => {
                  setShowAcceptBidModal(false);
                  setBidToAccept(null);
                }}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors font-medium"
              >
                İptal
              </button>
              <button
                onClick={acceptBid}
                className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Evet, Kabul Et
              </button>
            </div>
          </div>
        </Modal>

        {/* Reject Bid Confirmation Modal */}
        <Modal
          isOpen={showRejectBidModal}
          onClose={() => {
            setShowRejectBidModal(false);
            setBidToReject(null);
          }}
          title="Teklifi Reddet"
          size="md"
        >
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <X className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Teklifi Reddetmek İstediğinize Emin misiniz?
                </h3>
                <p className="text-slate-600">
                  Bu teklif “reddedildi” olarak işaretlenecek. Daha sonra tekrar değerlendiremezsiniz.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={() => {
                  setShowRejectBidModal(false);
                  setBidToReject(null);
                }}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors font-medium"
              >
                İptal
              </button>
              <button
                onClick={rejectBid}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <X className="w-5 h-5" />
                Evet, Reddet
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default Listings;
