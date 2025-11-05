import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../contexts/AuthContext';
import {
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  Star,
  Truck,
  MapPin,
  Calendar,
  DollarSign,
  Eye,
  MessageSquare,
  Phone,
  Mail,
  Package,
  User,
  Building2,
  Users,
  TrendingUp,
  BarChart3,
  CheckSquare,
  X,
  Plus,
  ArrowRight,
  Bell,
  AlertCircle,
  FileText,
  Zap,
  Shield,
  Award,
  Timer,
  Target,
  Sparkles,
  ThumbsUp,
  MessageCircle,
  Heart,
  Flag,
  CheckCircle2,
} from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import Modal from '../../components/common/Modal';
import SuccessMessage from '../../components/common/SuccessMessage';

interface Offer {
  id: string;
  shipmentTitle: string;
  carrierName: string;
  carrierRating: number;
  carrierVerified: boolean;
  carrierReviews: number;
  carrierExperience: string;
  price: number;
  estimatedDelivery: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  pickupAddress: string;
  deliveryAddress: string;
  weight: string;
  dimensions: string;
  specialFeatures: string[];
  tracking: boolean;
  priority: 'low' | 'medium' | 'high';
  trackingCode: string;
  carrierPhone: string;
  carrierEmail: string;
  carrierLogo: string;
  recentComments: string[];
  responseTime: string;
  successRate: number;
}

export default function Offers() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [offerToReject, setOfferToReject] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [offers, setOffers] = useState<Offer[]>([]);
  const [stats, setStats] = useState({
    totalOffers: 0,
    pendingOffers: 0,
    acceptedOffers: 0,
    rejectedOffers: 0,
    averagePrice: 0,
    topCarrier: '',
    responseTime: 0,
  });

  useEffect(() => {
    loadOffers();
  }, [filterStatus, searchTerm]);

  const loadOffers = async () => {
    setIsLoading(true);
    try {
      const user = localStorage.getItem('user')
        ? JSON.parse(localStorage.getItem('user') || '{}')
        : null;
      const userId = user?.id;
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `/api/offers?${userId ? `userId=${userId}` : ''}`,
        {
          headers: {
            Authorization: `Bearer ${token || ''}`,
            'X-User-Id': userId || '',
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load offers');
      }

      const data = await response.json();
      setOffers(data.data || data.offers || (Array.isArray(data) ? data : []));
      setStats(
        data.stats || {
          totalOffers: 0,
          pendingOffers: 0,
          acceptedOffers: 0,
          rejectedOffers: 0,
          averagePrice: 0,
          topCarrier: '',
          responseTime: 0,
        }
      );
    } catch (error) {
      console.error('Error loading offers:', error);
      setOffers([]);
      setStats({
        totalOffers: 0,
        pendingOffers: 0,
        acceptedOffers: 0,
        rejectedOffers: 0,
        averagePrice: 0,
        topCarrier: '',
        responseTime: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredOffers = offers.filter(offer => {
    const matchesStatus =
      filterStatus === 'all' || offer.status === filterStatus;
    const matchesSearch =
      offer.shipmentTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.carrierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.trackingCode.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className='w-3 h-3 mr-1' />;
      case 'rejected':
        return <XCircle className='w-3 h-3 mr-1' />;
      case 'pending':
        return <Clock className='w-3 h-3 mr-1' />;
      default:
        return <Clock className='w-3 h-3 mr-1' />;
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'accepted':
        return { text: 'Kabul Edildi', color: 'bg-green-100 text-green-800' };
      case 'rejected':
        return { text: 'Reddedildi', color: 'bg-red-100 text-red-800' };
      case 'pending':
        return { text: 'Beklemede', color: 'bg-yellow-100 text-yellow-800' };
      default:
        return { text: 'Bilinmiyor', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const handleAcceptOffer = async (offerId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/offers/${offerId}/accept`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to accept offer');
      }

      setSuccessMessage(
        'Teklif başarıyla kabul edildi! Gönderilerim sayfasına yönlendiriliyorsunuz...'
      );
      setShowSuccessMessage(true);
      setOffers(prev =>
        prev.map(offer =>
          offer.id === offerId
            ? { ...offer, status: 'accepted' as const }
            : offer
        )
      );
      setStats(prev => ({
        ...prev,
        pendingOffers: prev.pendingOffers - 1,
        acceptedOffers: prev.acceptedOffers + 1,
      }));
      setTimeout(() => {
        setShowSuccessMessage(false);
        navigate('/individual/my-shipments');
      }, 2000);
    } catch (error) {
      console.error('Error accepting offer:', error);
      setSuccessMessage('Teklif kabul edilirken bir hata oluştu.');
      setShowSuccessMessage(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectOffer = async (offerId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/offers/${offerId}/reject`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to reject offer');
      }

      setSuccessMessage('Teklif başarıyla reddedildi!');
      setShowSuccessMessage(true);
      setOffers(prev =>
        prev.map(offer =>
          offer.id === offerId
            ? { ...offer, status: 'rejected' as const }
            : offer
        )
      );
      setStats(prev => ({
        ...prev,
        pendingOffers: prev.pendingOffers - 1,
        rejectedOffers: prev.rejectedOffers + 1,
      }));
      setTimeout(() => setShowSuccessMessage(false), 2000);
    } catch (error) {
      console.error('Error rejecting offer:', error);
      setSuccessMessage('Teklif reddedilirken bir hata oluştu.');
      setShowSuccessMessage(true);
    } finally {
      setIsLoading(false);
      setOfferToReject(null);
      setShowRejectModal(false);
    }
  };

  const handleViewDetails = (offerId: string) => {
    const offer = offers.find(o => o.id === offerId);
    if (offer) {
      setSelectedOffer(offer);
      setShowDetailModal(true);
    }
  };

  const handleContactCarrier = (carrierPhone: string, carrierEmail: string) => {
    // Open contact options
    const contactMethod = window.confirm(
      'Nakliyeci ile iletişim kurmak için telefon aramak ister misiniz? (Hayır derseniz e-posta gönderilir)'
    );
    if (contactMethod) {
      window.open(`tel:${carrierPhone}`);
    } else {
      window.open(`mailto:${carrierEmail}`);
    }
  };

  if (isLoading) {
    return <LoadingState message='Teklifler yükleniyor...' />;
  }

  if (showSuccessMessage) {
    return (
      <SuccessMessage
        isVisible={showSuccessMessage}
        message={successMessage}
        onClose={() => setShowSuccessMessage(false)}
      />
    );
  }

  return (
    <div className='min-h-screen bg-white'>
      <Helmet>
        <title>Tekliflerim - YolNext Bireysel</title>
        <meta
          name='description'
          content='Gönderileriniz için gelen teklifleri yönetin'
        />
      </Helmet>

      <div className='max-w-5xl mx-auto px-4 py-6'>
        {/* Header - Match MyShipments Design */}
        <div className='text-center mb-12'>
          <div className='flex justify-center mb-6'>
            <div className='w-16 h-16 bg-gradient-to-br from-slate-800 to-blue-900 rounded-2xl flex items-center justify-center shadow-lg'>
              <FileText className='w-8 h-8 text-white' />
            </div>
          </div>
          <h1 className='text-4xl md:text-5xl font-bold text-slate-900 mb-3'>
            Tekliflerinizi{' '}
            <span className='text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-blue-900'>
              Yönetin
            </span>
          </h1>
          <p className='text-lg text-slate-600'>
            Gönderileriniz için gelen teklifleri karşılaştırın ve en uygun
            olanını seçin
          </p>
        </div>

        {/* Stats Cards */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
          <div className='bg-white rounded-2xl p-6 shadow-xl border border-slate-200'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-slate-600'>
                  Toplam Teklif
                </p>
                <p className='text-2xl font-bold text-slate-900'>
                  {stats.totalOffers}
                </p>
              </div>
              <div className='w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl flex items-center justify-center'>
                <FileText className='w-6 h-6 text-white' />
              </div>
            </div>
          </div>

          <div className='bg-white rounded-2xl p-6 shadow-xl border border-slate-200'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-slate-600'>Bekleyen</p>
                <p className='text-2xl font-bold text-slate-900'>
                  {stats.pendingOffers}
                </p>
              </div>
              <div className='w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center'>
                <Clock className='w-6 h-6 text-white' />
              </div>
            </div>
          </div>

          <div className='bg-white rounded-2xl p-6 shadow-xl border border-slate-200'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-slate-600'>
                  Kabul Edilen
                </p>
                <p className='text-2xl font-bold text-slate-900'>
                  {stats.acceptedOffers}
                </p>
              </div>
              <div className='w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center'>
                <CheckCircle className='w-6 h-6 text-white' />
              </div>
            </div>
          </div>

          <div className='bg-white rounded-2xl p-6 shadow-xl border border-slate-200'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-slate-600'>
                  Ortalama Fiyat
                </p>
                <p className='text-2xl font-bold text-slate-900'>
                  ₺{stats.averagePrice.toFixed(0)}
                </p>
              </div>
              <div className='w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl flex items-center justify-center'>
                <DollarSign className='w-6 h-6 text-white' />
              </div>
            </div>
          </div>
        </div>

        {/* Filters Card */}
        <div className='bg-white rounded-2xl p-8 shadow-xl border border-slate-200 mb-8'>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4' />
              <input
                type='text'
                placeholder='Teklif ara...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              />
            </div>

            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className='px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            >
              <option value='all'>Tüm Durumlar</option>
              <option value='pending'>Bekleyen</option>
              <option value='accepted'>Kabul Edilen</option>
              <option value='rejected'>Reddedilen</option>
            </select>

            <select className='px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'>
              <option value='price'>Fiyata Göre</option>
              <option value='rating'>Puana Göre</option>
              <option value='date'>Tarihe Göre</option>
              <option value='delivery'>Teslimat Süresine Göre</option>
            </select>

            <button className='px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2'>
              <Filter className='w-4 h-4' />
              Filtrele
            </button>
          </div>
        </div>

        {/* Offers Cards */}
        <div className='space-y-4'>
          {filteredOffers.length > 0 ? (
            filteredOffers.map(offer => (
              <div
                key={offer.id}
                className='bg-white rounded-xl shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 group'
              >
                <div className='p-6'>
                  {/* Compact Header */}
                  <div className='flex items-center justify-between mb-4'>
                    <div className='flex items-center gap-3'>
                      <div className='w-10 h-10 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl flex items-center justify-center'>
                        <FileText className='w-5 h-5 text-white' />
                      </div>
                      <div>
                        <h3 className='text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors'>
                          {offer.shipmentTitle}
                        </h3>
                        <div className='flex items-center gap-3 text-sm text-slate-500'>
                          <span className='font-mono bg-slate-100 text-slate-800 px-2 py-1 rounded'>
                            {offer.trackingCode}
                          </span>
                          <span>
                            {new Date(offer.createdAt).toLocaleDateString(
                              'tr-TR'
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className='text-right'>
                      <div className='text-2xl font-bold text-blue-600'>
                        ₺{offer.price.toLocaleString()}
                      </div>
                      <div className='text-sm text-slate-500'>
                        Teslimat: {offer.estimatedDelivery}
                      </div>
                    </div>
                  </div>

                  {/* Compact Info */}
                  <div className='flex items-center justify-between mb-4'>
                    <div className='flex items-center gap-4 text-sm text-slate-600'>
                      <div className='flex items-center gap-1'>
                        <MapPin className='w-4 h-4' />
                        <span>
                          {offer.pickupAddress} → {offer.deliveryAddress}
                        </span>
                      </div>
                      <div className='flex items-center gap-1'>
                        <Package className='w-4 h-4' />
                        <span>
                          {offer.weight} • {offer.dimensions}
                        </span>
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold ${getStatusInfo(offer.status).color}`}
                      >
                        {getStatusIcon(offer.status)}
                        {getStatusInfo(offer.status).text}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                          offer.priority === 'high'
                            ? 'bg-red-100 text-red-800'
                            : offer.priority === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {offer.priority === 'high'
                          ? 'Yüksek'
                          : offer.priority === 'medium'
                            ? 'Orta'
                            : 'Düşük'}{' '}
                        Öncelik
                      </span>
                    </div>
                  </div>

                  {/* Carrier Preview */}
                  <div className='flex items-center justify-between mb-4'>
                    <div className='flex items-center gap-3'>
                      <div className='w-8 h-8 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center text-white font-bold text-sm'>
                        {offer.carrierLogo}
                      </div>
                      <div>
                        <div className='flex items-center gap-2'>
                          <span className='font-semibold text-slate-900'>
                            {offer.carrierName}
                          </span>
                          {offer.carrierVerified && (
                            <Shield className='w-4 h-4 text-green-600' />
                          )}
                        </div>
                        <div className='flex items-center gap-2 text-sm text-slate-500'>
                          <div className='flex items-center gap-1'>
                            <Star className='w-3 h-3 text-yellow-500 fill-current' />
                            <span>{offer.carrierRating}</span>
                          </div>
                          <span>•</span>
                          <span>{offer.carrierReviews} yorum</span>
                          <span>•</span>
                          <span>{offer.carrierExperience} deneyim</span>
                        </div>
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      {offer.tracking && (
                        <span className='px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-lg'>
                          Takip ✓
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className='flex items-center justify-between'>
                    <div className='text-sm text-slate-500'>
                      {offer.message.length > 60
                        ? offer.message.substring(0, 60) + '...'
                        : offer.message}
                    </div>
                    <div className='flex items-center gap-2'>
                      {offer.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleAcceptOffer(offer.id)}
                            className='px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1'
                          >
                            <CheckCircle className='w-4 h-4' />
                            Kabul Et
                          </button>
                          <button
                            onClick={() => {
                              setOfferToReject(offer.id);
                              setShowRejectModal(true);
                            }}
                            className='px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1'
                          >
                            <XCircle className='w-4 h-4' />
                            Reddet
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleViewDetails(offer.id)}
                        className='px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm font-medium rounded-lg transition-colors flex items-center gap-1'
                      >
                        <Eye className='w-4 h-4' />
                        Detay
                      </button>
                      <button
                        onClick={() =>
                          handleContactCarrier(
                            offer.carrierPhone,
                            offer.carrierEmail
                          )
                        }
                        className='px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors flex items-center gap-1'
                      >
                        <MessageCircle className='w-4 h-4' />
                        İletişim
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className='bg-white rounded-2xl p-12 shadow-xl border border-slate-200 text-center'>
              <FileText className='w-16 h-16 text-slate-300 mx-auto mb-6' />
              <h3 className='text-2xl font-bold text-slate-900 mb-4'>
                Teklif Bulunamadı
              </h3>
              <p className='text-slate-600 text-lg mb-8'>
                Arama kriterlerinize uygun teklif bulunamadı.
              </p>
              <Link
                to='/individual/create-shipment'
                className='inline-flex items-center gap-3 bg-gradient-to-r from-slate-800 to-blue-900 text-white px-8 py-4 rounded-xl font-semibold hover:from-slate-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl'
              >
                <Plus className='w-6 h-6' />
                Yeni Gönderi Oluştur
              </Link>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className='mt-8 text-center'>
          <Link
            to='/individual/create-shipment'
            className='inline-flex items-center gap-2 bg-gradient-to-r from-slate-800 to-blue-900 text-white px-6 py-3 rounded-xl font-semibold hover:from-slate-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl'
          >
            <Plus className='w-5 h-5' />
            Yeni Gönderi Oluştur
          </Link>
        </div>
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title=''
        size='xl'
      >
        {selectedOffer && (
          <div className='p-0'>
            {/* Modern Header */}
            <div className='relative bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 p-8 text-white rounded-t-2xl'>
              <div className='absolute inset-0 bg-gradient-to-r from-white/5 to-transparent rounded-t-2xl'></div>
              <div className='relative z-10'>
                <div className='flex items-start justify-between mb-6'>
                  <div className='flex-1'>
                    <div className='flex items-center gap-3 mb-4'>
                      <div className='w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center'>
                        <FileText className='w-6 h-6 text-white' />
                      </div>
                      <div>
                        <h3 className='text-2xl font-bold mb-2'>
                          {selectedOffer.shipmentTitle}
                        </h3>
                        <div className='flex items-center gap-4 text-blue-200'>
                          <span className='font-mono bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-sm'>
                            {selectedOffer.trackingCode}
                          </span>
                          <span className='text-sm'>
                            {new Date(
                              selectedOffer.createdAt
                            ).toLocaleDateString('tr-TR')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className='flex items-center gap-6 text-blue-200'>
                      <div className='flex items-center gap-2'>
                        <MapPin className='w-5 h-5' />
                        <span className='font-medium'>
                          {selectedOffer.pickupAddress} →{' '}
                          {selectedOffer.deliveryAddress}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className='text-right'>
                    <div className='text-4xl font-bold mb-2'>
                      ₺{selectedOffer.price.toLocaleString()}
                    </div>
                    <div className='text-blue-200'>
                      Teslimat: {selectedOffer.estimatedDelivery}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className='p-8'>
              {/* Carrier Profile */}
              <div className='bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl p-8 mb-8 border border-slate-200'>
                <div className='flex items-center gap-6 mb-6'>
                  <div className='w-20 h-20 bg-gradient-to-br from-slate-800 to-blue-900 rounded-3xl flex items-center justify-center text-white font-bold text-2xl shadow-xl'>
                    {selectedOffer.carrierLogo}
                  </div>
                  <div className='flex-1'>
                    <div className='flex items-center gap-3 mb-3'>
                      <h4 className='text-2xl font-bold text-slate-900'>
                        {selectedOffer.carrierName}
                      </h4>
                      {selectedOffer.carrierVerified && (
                        <div className='flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold'>
                          <Shield className='w-4 h-4' />
                          Doğrulanmış
                        </div>
                      )}
                    </div>
                    <div className='grid grid-cols-2 lg:grid-cols-4 gap-6'>
                      <div className='bg-white rounded-xl p-4 shadow-sm'>
                        <div className='flex items-center gap-2 mb-1'>
                          <Star className='w-5 h-5 text-yellow-500 fill-current' />
                          <span className='text-lg font-bold text-slate-900'>
                            {selectedOffer.carrierRating}
                          </span>
                        </div>
                        <div className='text-sm text-slate-500'>
                          {selectedOffer.carrierReviews} yorum
                        </div>
                      </div>
                      <div className='bg-white rounded-xl p-4 shadow-sm'>
                        <div className='text-lg font-bold text-slate-900 mb-1'>
                          {selectedOffer.carrierExperience}
                        </div>
                        <div className='text-sm text-slate-500'>Deneyim</div>
                      </div>
                      <div className='bg-white rounded-xl p-4 shadow-sm'>
                        <div className='text-lg font-bold text-slate-900 mb-1'>
                          %{selectedOffer.successRate}
                        </div>
                        <div className='text-sm text-slate-500'>
                          Başarı Oranı
                        </div>
                      </div>
                      <div className='bg-white rounded-xl p-4 shadow-sm'>
                        <div className='text-lg font-bold text-slate-900 mb-1'>
                          {selectedOffer.responseTime}
                        </div>
                        <div className='text-sm text-slate-500'>
                          Yanıt Süresi
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reviews Section */}
              <div className='mb-8'>
                <h5 className='text-xl font-bold text-slate-900 mb-6 flex items-center gap-2'>
                  <Star className='w-6 h-6 text-yellow-500' />
                  Müşteri Değerlendirmeleri
                </h5>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                  {selectedOffer.recentComments.map((comment, index) => (
                    <div
                      key={index}
                      className='bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow'
                    >
                      <div className='flex items-center gap-3 mb-3'>
                        <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold'>
                          {index + 1}
                        </div>
                        <div>
                          <div className='font-semibold text-slate-900'>
                            Müşteri {index + 1}
                          </div>
                          <div className='flex items-center gap-1'>
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className='w-4 h-4 text-yellow-400 fill-current'
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className='text-slate-600 italic'>"{comment}"</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div className='mb-8'>
                <h5 className='text-lg font-bold text-slate-900 mb-4 flex items-center gap-2'>
                  <MessageSquare className='w-5 h-5 text-blue-600' />
                  Nakliyeci Mesajı
                </h5>
                <div className='bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6'>
                  <div className='flex items-start gap-3'>
                    <div className='w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0'>
                      <MessageSquare className='w-4 h-4 text-white' />
                    </div>
                    <p className='text-slate-700 leading-relaxed'>
                      {selectedOffer.message}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Info - Only show after acceptance */}
              {selectedOffer.status === 'accepted' && (
                <div className='mb-8'>
                  <div className='bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-8'>
                    <div className='flex items-center gap-3 mb-6'>
                      <div className='w-12 h-12 bg-green-600 rounded-2xl flex items-center justify-center'>
                        <CheckCircle className='w-6 h-6 text-white' />
                      </div>
                      <div>
                        <h5 className='text-xl font-bold text-slate-900'>
                          Anlaşma Sağlandı!
                        </h5>
                        <p className='text-slate-600'>
                          Nakliyeci ile iletişim bilgileri
                        </p>
                      </div>
                    </div>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                      <div className='flex items-center gap-4 p-4 bg-white rounded-xl border border-green-200'>
                        <div className='w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center'>
                          <Phone className='w-6 h-6 text-green-600' />
                        </div>
                        <div>
                          <div className='text-sm text-slate-500 font-medium'>
                            Telefon
                          </div>
                          <div className='text-lg font-bold text-slate-900'>
                            {selectedOffer.carrierPhone}
                          </div>
                        </div>
                      </div>
                      <div className='flex items-center gap-4 p-4 bg-white rounded-xl border border-green-200'>
                        <div className='w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center'>
                          <Mail className='w-6 h-6 text-blue-600' />
                        </div>
                        <div>
                          <div className='text-sm text-slate-500 font-medium'>
                            E-posta
                          </div>
                          <div className='text-lg font-bold text-slate-900'>
                            {selectedOffer.carrierEmail}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className='flex justify-end gap-4'>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className='px-6 py-3 text-slate-600 hover:text-slate-800 transition-colors font-medium'
                >
                  Kapat
                </button>
                {selectedOffer.status === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        handleAcceptOffer(selectedOffer.id);
                      }}
                      className='px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-800 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl'
                    >
                      <CheckCircle className='w-5 h-5' />
                      Kabul Et
                    </button>
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        setOfferToReject(selectedOffer.id);
                        setShowRejectModal(true);
                      }}
                      className='px-8 py-3 bg-gradient-to-r from-red-600 to-rose-700 text-white rounded-xl font-semibold hover:from-red-700 hover:to-rose-800 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl'
                    >
                      <XCircle className='w-5 h-5' />
                      Reddet
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Confirmation Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title='Teklifi Reddet'
      >
        <div className='p-6'>
          <p className='text-slate-600 mb-6'>
            Bu teklifi reddetmek istediğinizden emin misiniz? Bu işlem geri
            alınamaz.
          </p>
          <div className='flex justify-end gap-3'>
            <button
              onClick={() => setShowRejectModal(false)}
              className='px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors'
            >
              İptal
            </button>
            <button
              onClick={() => offerToReject && handleRejectOffer(offerToReject)}
              className='px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors'
            >
              Reddet
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
