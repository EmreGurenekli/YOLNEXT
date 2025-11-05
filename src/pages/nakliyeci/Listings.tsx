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

interface Listing {
  id: number;
  shipmentId: number;
  minPrice?: number;
  createdAt: string;
  status?: string;
}

interface Bid {
  id: number;
  bidPrice: number;
  etaHours?: number;
  status: string;
  carrierName?: string;
  carrierPhone?: string;
  createdAt?: string;
}

const Listings: React.FC = () => {
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<number | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loadingBids, setLoadingBids] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showError, setShowError] = useState(false);

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

  const loadListings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/carrier-market/listings?mine=1', {
        headers: headers(),
      });
      if (!res.ok) throw new Error('İlanlar alınamadı');
      const data = await res.json();
      setListings((Array.isArray(data) ? data : data.data || []) as Listing[]);
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
        `/api/carrier-market/bids?listingId=${listingId}`,
        { headers: headers() }
      );
      if (!res.ok) throw new Error('Teklifler alınamadı');
      const data = await res.json();
      setBids((Array.isArray(data) ? data : data.data || []) as Bid[]);
    } catch (e) {
      setBids([]);
    } finally {
      setLoadingBids(false);
    }
  };

  const acceptBid = async (bidId: number) => {
    if (!confirm('Bu teklifi kabul etmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      const res = await fetch(`/api/carrier-market/bids/${bidId}/accept`, {
        method: 'POST',
        headers: headers(),
      });
      if (!res.ok) throw new Error('Kabul edilemedi');
      setSuccessMessage('Teklif kabul edildi! İş taşıyıcıya atandı.');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      await loadListings();
      if (selectedListing) await loadBids(selectedListing);
    } catch (e) {
      setErrorMessage('Teklif kabul edilemedi. Lütfen tekrar deneyin.');
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
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

        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-blue-900 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl mb-6 sm:mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full -translate-y-40 translate-x-40"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-slate-400/10 to-blue-400/10 rounded-full translate-y-32 -translate-x-32"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-slate-800 to-blue-900 rounded-2xl flex items-center justify-center shadow-xl border border-white/20">
                <FilePlus2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                  Taşıyıcı İlanlarım
                </h1>
                <p className="text-slate-200 text-lg leading-relaxed">
                  Açık ilanlarınızı yönetin ve taşıyıcılardan gelen teklifleri kabul edin
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-6">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2 border border-white/20">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-lg"></div>
                <span className="text-slate-200 font-medium">
                  {listings.length} Aktif İlan
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bilgilendirme Kartı */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 sm:p-8 shadow-xl border border-blue-200 mb-6 sm:mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-slate-900 mb-2">İlan Nasıl Oluşturulur?</h2>
              <p className="text-slate-700 mb-3">
                Gönderilerinizi taşıyıcılara alt iş olarak vermek için <strong>Aktif Yükler</strong> sayfasına gidin.
              </p>
              <Link
                to="/nakliyeci/active-shipments"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
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
          <EmptyState
            icon={FilePlus2}
            title="Henüz İlan Yok"
            description="Aktif gönderilerinizi taşıyıcılara alt iş olarak vermek için Aktif Yükler sayfasına gidin ve gönderilerinize taşıyıcı atayın"
            action={{
              label: "Aktif Yükler Sayfasına Git",
              onClick: () => {
                navigate('/nakliyeci/active-shipments');
              }
            }}
          />
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
                  className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg">
                          <Package className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">
                            İlan #{listing.id}
                          </h3>
                          <p className="text-sm text-slate-600">
                            Gönderi ID: {listing.shipmentId}
                          </p>
                        </div>
                      </div>

                      {listing.minPrice && (
                        <div className="flex items-center gap-2 mb-3 p-3 bg-green-50 rounded-xl border border-green-200">
                          <DollarSign className="w-5 h-5 text-green-600" />
                          <div>
                            <div className="text-xs text-green-600 font-medium">Minimum Fiyat</div>
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
                    className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 text-slate-700 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2"
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
                              className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-4 border border-slate-200 hover:shadow-md transition-all duration-300"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg">
                                      <DollarSign className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                      <div className="text-2xl font-bold text-slate-900">
                                        ₺{bid.bidPrice.toLocaleString('tr-TR')}
                                      </div>
                                      <div className="text-xs text-slate-500">
                                        Teklif Fiyatı
                                      </div>
                                    </div>
                                  </div>

                                  {bid.etaHours && (
                                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                                      <Clock className="w-4 h-4" />
                                      <span>Tahmini Süre: {bid.etaHours} saat</span>
                                    </div>
                                  )}

                                  {bid.carrierName && (
                                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                                      <User className="w-4 h-4" />
                                      <span>{bid.carrierName}</span>
                                    </div>
                                  )}

                                  {bid.carrierPhone && (
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                      <Phone className="w-4 h-4" />
                                      <span>{bid.carrierPhone}</span>
                                    </div>
                                  )}
                                </div>

                                <div className="ml-4">
                                  {bid.status === 'pending' ? (
                                    <button
                                      onClick={() => acceptBid(bid.id)}
                                      className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2"
                                    >
                                      <CheckCircle className="w-5 h-5" />
                                      Kabul Et
                                    </button>
                                  ) : bid.status === 'accepted' ? (
                                    <span className="inline-flex items-center px-3 py-2 rounded-xl text-sm font-medium bg-green-100 text-green-800">
                                      <CheckCircle className="w-4 h-4 mr-1" />
                                      Kabul Edildi
                                    </span>
                                  ) : (
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
      </div>
    </div>
  );
};

export default Listings;
