import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { dashboardAPI, notificationAPI, shipmentAPI } from '../../services/api';
import { createApiUrl } from '../../config/api';
import NotificationModal from '../../components/modals/NotificationModal';
import {
  Package,
  CheckCircle2,
  Clock,
  Plus,
  Bell,
  MessageSquare,
  TrendingUp,
  Truck,
  FileText,
  Settings,
  Star,
  Award,
  Users,
  MapPin,
  BarChart3,
  ArrowRight,
  Calendar,
  Weight,
  Ruler,
  Building2,
  User,
  Eye,
  Edit,
  Trash2,
  Activity,
  X,
  Route,
  Map,
  Target,
  Zap,
  TrendingDown,
  Copy,
  CheckCircle,
} from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import { normalizeTrackingCode } from '../../utils/trackingCode';
import { formatDate } from '../../utils/format';
import { logger } from '../../utils/logger';

interface Shipment {
  id: string | number;
  trackingNumber?: string;
  date?: string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  description?: string;
  status: string;
  from?: string;
  to?: string;
  pickupCity?: string;
  pickup_city?: string;
  pickupAddress?: string;
  pickup_address?: string;
  deliveryCity?: string;
  delivery_city?: string;
  deliveryAddress?: string;
  delivery_address?: string;
  weight?: number;
  price?: number;
  value?: number;
  priority?: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [stats, setStats] = useState({
    totalShipments: 0,
    deliveredShipments: 0,
    pendingShipments: 0,
    cancelledShipments: 0,
    successRate: 0,
    activeDrivers: 0,
    totalOffers: 0,
    acceptedOffers: 0,
    openListings: 0,
    routeOptimizations: 0,
  });
  const [recentShipments, setRecentShipments] = useState<Shipment[]>([]);
  const [recentOffers, setRecentOffers] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Bildirimleri okundu olarak işaretleme fonksiyonu
  const markNotificationsAsRead = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const userId = user?.id || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || '{}').id : null);
      
      const response = await fetch(createApiUrl('/api/notifications/mark-all-read'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token || ''}`,
          'X-User-Id': userId || '',
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        setUnreadCount(0);
      }
    } catch (error) {
      logger.error('Bildirimler okundu olarak işaretlenemedi:', error);
    }
  };

  // Yeni kullanıcılar için boş veriler
  const emptyData = {
    stats: {
      totalShipments: 0,
      deliveredShipments: 0,
      pendingShipments: 0,
      cancelledShipments: 0,
      successRate: 0,
      activeDrivers: 0,
      totalOffers: 0,
      acceptedOffers: 0,
      openListings: 0,
      routeOptimizations: 0,
    },
    recentShipments: [],
    recentOffers: [],
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    
    // Timeout protection - maksimum 10 saniye bekle
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
    }, 10000);
    
    try {
      // Dashboard stats
      try {
        const statsResponse = await dashboardAPI.getStats('nakliyeci');
        if (statsResponse?.success) {
          const backendStats =
            (statsResponse.data?.stats || statsResponse.data || {}) as any;
          setStats({
            ...emptyData.stats,
            totalShipments: backendStats.activeShipments || 0,
            pendingShipments: backendStats.activeShipments || 0,
            totalOffers: backendStats.totalOffers || 0,
            acceptedOffers: backendStats.acceptedOffers || 0,
            openListings: backendStats.openListings || 0,
            deliveredShipments: 0,
            cancelledShipments: 0,
            successRate: 0,
            activeDrivers: 0,
            routeOptimizations: 0,
          });
        } else {
          setStats(emptyData.stats);
        }
      } catch (error) {
        logger.error('Error loading dashboard stats:', error);
        setStats(emptyData.stats);
      }

      // Recent shipments - Only active shipments for dashboard summary
      try {
        const shipmentsResponse = await shipmentAPI.getNakliyeci();
        if (shipmentsResponse?.success) {
          const rows =
            (Array.isArray(shipmentsResponse.data) ? shipmentsResponse.data : null) ||
            (Array.isArray((shipmentsResponse.data as any)?.shipments) ? (shipmentsResponse.data as any).shipments : null) ||
            [];
          
          // Filter for active shipments only (not delivered/cancelled)
          const activeShipments = rows.filter((shipment: any) => {
            const status = String(shipment.status || '').toLowerCase();
            return !['delivered', 'completed', 'finished', 'cancelled', 'canceled', 'rejected'].includes(status);
          });
          
          // Sort by creation date (newest first) and limit to 5
          const sortedActiveShipments = activeShipments
            .sort((a: any, b: any) => {
              const dateA = new Date(a.createdAt || a.created_at || a.date || 0);
              const dateB = new Date(b.createdAt || b.created_at || b.date || 0);
              return dateB.getTime() - dateA.getTime();
            })
            .slice(0, 5);
          
          setRecentShipments(sortedActiveShipments);
        } else {
          setRecentShipments(emptyData.recentShipments);
        }
      } catch (error) {
        logger.error('Error loading shipments:', error);
        setRecentShipments(emptyData.recentShipments);
      }

      // Unread notifications count
      try {
        const notificationsResponse = await notificationAPI.getUnreadCount();
        if (notificationsResponse?.success) {
          setUnreadCount(
            (notificationsResponse.data as any)?.count ||
              (notificationsResponse.data as any)?.unreadCount ||
              0
          );
        } else {
          setUnreadCount(0);
        }
      } catch (error) {
        logger.error('Bildirim sayısı alınamadı:', error);
        setUnreadCount(0);
      }

      // Wallet balance
      try {
        const token = localStorage.getItem('authToken');
        const userId = user?.id || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || '{}').id : null);
        const walletResponse = await fetch(createApiUrl('/api/wallet/nakliyeci'), {
          headers: {
            Authorization: `Bearer ${token || ''}`,
            'X-User-Id': userId || '',
            'Content-Type': 'application/json',
          },
        });
        if (walletResponse.ok) {
          const walletData = await walletResponse.json();
          if (walletData.success) {
            setWalletBalance(walletData.data.balance || 0);
          }
        }
      } catch (error) {
        logger.error('Bakiye yüklenemedi:', error);
      }
    } catch (error) {
      logger.error('Error loading dashboard data:', error);
      setStats(emptyData.stats);
      setRecentShipments(emptyData.recentShipments);
      setUnreadCount(0);
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const s = String(status || '').toLowerCase();
    switch (s) {
      case 'pending':
      case 'waiting_for_offers':
      case 'open':
      case 'draft':
        return 'text-yellow-600 bg-yellow-100';
      case 'assigned':
      case 'accepted':
      case 'offer_accepted':
      case 'confirmed':
        return 'text-purple-600 bg-purple-100';
      case 'picked_up':
      case 'loaded':
      case 'in_progress':
        return 'text-indigo-600 bg-indigo-100';
      case 'in_transit':
      case 'shipping':
      case 'on_the_way':
        return 'text-blue-600 bg-blue-100';
      case 'delivered':
      case 'completed':
      case 'finished':
        return 'text-green-600 bg-green-100';
      case 'cancelled':
      case 'canceled':
      case 'rejected':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    const s = String(status || '').toLowerCase();
    switch (s) {
      case 'pending':
      case 'waiting_for_offers':
      case 'open':
        return 'Teklif Bekliyor';
      case 'assigned':
        return 'Taşıyıcı Atandı';
      case 'accepted':
      case 'offer_accepted':
      case 'confirmed':
        return 'Teklif Kabul Edildi';
      case 'picked_up':
      case 'loaded':
        return 'Yük Alındı';
      case 'in_transit':
      case 'shipping':
      case 'on_the_way':
        return 'Yolda';
      case 'in_progress':
        return 'Devam Ediyor';
      case 'delivered':
      case 'completed':
      case 'finished':
        return 'Teslim Edildi';
      case 'cancelled':
      case 'canceled':
      case 'rejected':
        return 'İptal Edildi';
      case 'draft':
        return 'Taslak';
      default:
        return status || 'Bilinmiyor';
    }
  };

  const formatDateSafe = (value: unknown) => {
    if (!value) return '-';
    return formatDate(value, 'short');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'normal':
        return 'text-blue-600 bg-blue-100';
      case 'low':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-white flex items-center justify-center'>
        <LoadingState
          message='Ana Sayfa yükleniyor...'
          size='lg'
          className='py-12'
        />
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-white'>
      <Helmet>
        <title>Ana Sayfa - YolNext Nakliyeci</title>
        <meta
          name='description'
          content='YolNext nakliyeci panel ana sayfası'
        />
      </Helmet>

      <div className='max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6'>
        {/* Hero Section */}
        <div className='relative overflow-hidden bg-gradient-to-br from-slate-800 via-blue-900 to-indigo-900 rounded-3xl p-6 text-white shadow-2xl mb-8'>
          <div className='absolute inset-0 bg-gradient-to-br from-white/5 to-transparent'></div>
          <div className='absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full -translate-y-40 translate-x-40'></div>
          <div className='absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-slate-400/10 to-blue-400/10 rounded-full translate-y-32 -translate-x-32'></div>

          <div className='relative z-10'>
            <div className='flex items-center justify-between'>
              <div className='flex-1'>
                <div className='flex items-center gap-4 mb-4'>
                  <div className='w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-xl border border-white/20'>
                    <Truck className='w-8 h-8 text-white' />
                  </div>
                  <div>
                    <h1 className='text-3xl font-bold mb-2 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent'>
                      Merhaba{' '}
                      {user?.firstName ||
                        user?.fullName?.split(' ')[0] ||
                        'Kullanıcı'}
                    </h1>
                    <p className='text-slate-200 text-lg leading-relaxed'>
                      Nakliyeci panelinize hoş geldiniz.
                      <br />
                      <span className='text-blue-300 font-semibold'>
                        Akıllı rota optimizasyonu
                      </span>{' '}
                      ve karlı iş fırsatlarıyla yanınızdayız.
                    </p>
                  </div>
                </div>

                <div className='flex items-center gap-4'>
                  <div className='flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2 border border-white/20'>
                    <div className='w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-lg'></div>
                    <span className='text-slate-200 font-medium'>
                      Çevrimiçi
                    </span>
                  </div>
                  {(user?.nakliyeciCode || (user as any)?.nakliyecicode || user?.id) && (
                    <div className='bg-gradient-to-r from-slate-800/30 to-blue-900/30 backdrop-blur-sm rounded-2xl px-4 py-2 border border-slate-400/30 flex items-center gap-2'>
                      <span className='text-slate-200 font-medium text-sm'>Kodum:</span>
                      <span className='text-white font-mono font-bold text-base'>{user?.nakliyeciCode || (user as any)?.nakliyecicode || `NK${user?.id?.toString().padStart(3, '0')}`}</span>
                      <button
                        onClick={() => {
                          const code = user?.nakliyeciCode || (user as any)?.nakliyecicode || `NK${user?.id?.toString().padStart(3, '0')}`;
                          if (code) {
                            navigator.clipboard.writeText(code);
                            setCopiedCode(true);
                            setTimeout(() => setCopiedCode(false), 2000);
                          }
                        }}
                        className='ml-1 p-1.5 hover:bg-white/10 rounded-lg transition-colors'
                        title='Kodu Kopyala'
                      >
                        {copiedCode ? (
                          <CheckCircle className='w-4 h-4 text-emerald-300' />
                        ) : (
                          <Copy className='w-4 h-4 text-slate-300' />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          const code = user?.nakliyeciCode || (user as any)?.nakliyecicode || `NK${user?.id?.toString().padStart(3, '0')}`;
                          if (code) {
                            const shareText = `YolNext Nakliyeci Kodum: ${code}\n\nBu kodla taşıyıcılar benimle kolayca çalışabilir!\n\n🚀 YolNext - Tamamen Ücretsiz Lojistik Platformu`;
                            
                            // Web Share API destekliyorsa doğrudan paylaş
                            if (navigator.share) {
                              navigator.share({
                                title: 'YolNext Nakliyeci Kodum',
                                text: shareText,
                                url: `https://yolnext.com/nakliyeci/${code}`
                              });
                            } else {
                              // Sosyal medya paylaşım seçenekleri
                              const encodedText = encodeURIComponent(shareText);
                              const encodedUrl = encodeURIComponent(`https://yolnext.com/nakliyeci/${code}`);
                              
                              // Sosyal medya linkleri
                              const socialLinks = {
                                whatsapp: `https://wa.me/?text=${encodedText}`,
                                facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
                                twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
                                instagram: `https://www.instagram.com/`, // Instagram direkt link desteklemez
                                telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
                                linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
                              };
                              
                              // Modal oluştur veya seçenek sun
                              const shareOptions = [
                                { name: 'WhatsApp', url: socialLinks.whatsapp, icon: '💬' },
                                { name: 'Facebook', url: socialLinks.facebook, icon: '📘' },
                                { name: 'Twitter', url: socialLinks.twitter, icon: '🐦' },
                                { name: 'Telegram', url: socialLinks.telegram, icon: '✈️' },
                                { name: 'LinkedIn', url: socialLinks.linkedin, icon: '💼' },
                                { name: 'Panoya Kopyala', url: null, icon: '📋' }
                              ];
                              
                              // Basit seçim modalı
                              const choice = confirm(
                                'Nasıl paylaşmak istersiniz?\n\n' +
                                '1. WhatsApp\n' +
                                '2. Facebook\n' +
                                '3. Twitter\n' +
                                '4. Telegram\n' +
                                '5. LinkedIn\n' +
                                '6. Panoya Kopyala\n\n' +
                                'Tamam için WhatsApp, İptal için Panoya Kopyala'
                              );
                              
                              if (choice) {
                                // WhatsApp varsayılan
                                window.open(socialLinks.whatsapp, '_blank');
                              } else {
                                // Panoya kopyala
                                navigator.clipboard.writeText(shareText);
                                showToast({ type: 'success', title: 'Başarılı', message: 'Kod panoya kopyalandı!' });
                              }
                            }
                          }
                        }}
                        className='p-1.5 hover:bg-white/10 rounded-lg transition-colors'
                        title='Kodu Paylaş'
                      >
                        <Users className='w-4 h-4 text-slate-300' />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className='flex items-center gap-3'>
                <button
                  onClick={() => {
                    setShowNotificationModal(true);
                    // Bildirimleri okundu olarak işaretle
                    markNotificationsAsRead();
                  }}
                  className='relative group min-w-[44px] min-h-[44px] w-12 h-12 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center hover:bg-white/20 transition-all duration-300 border border-white/20 group-hover:scale-110'
                >
                  <Bell size={20} className='text-white' />
                  {unreadCount > 0 && (
                    <span className='absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg'>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
                <Link to='/nakliyeci/jobs'>
                  <button className='bg-gradient-to-r from-slate-800 to-blue-900 hover:from-slate-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 text-base shadow-lg hover:shadow-xl'>
                    <Plus size={20} />
                    Yük Pazarı
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Komisyon İade Politikası Bilgilendirmesi */}

        {/* Stats Grid - 4 Kart: Aktif Yükler, Tamamlanan Yükler, Bekleyen Yükler, Bakiye */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
          <div className='bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-300 transition-all duration-300'>
            <div className='flex items-center justify-between mb-4'>
              <div className='w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center'>
                <Package className='w-6 h-6 text-white' />
              </div>
              <div className='text-right'>
                <div className='text-2xl font-bold text-slate-900 mb-1'>
                  {stats.totalShipments}
                </div>
                <div className='flex items-center gap-1'>
                  <svg
                    className='w-3 h-3 text-blue-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M7 17l9.2-9.2M17 17V7H7'
                    />
                  </svg>
                  <span className='text-xs text-blue-600 font-semibold'>
                    Aktif
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h3 className='text-lg font-bold text-slate-900 mb-1'>Aktif Yükler</h3>
              <p className='text-sm text-slate-600'>Devam eden taşımalar</p>
            </div>
          </div>

          <div className='bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-300 transition-all duration-300'>
            <div className='flex items-center justify-between mb-4'>
              <div className='w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center'>
                <CheckCircle2 className='w-6 h-6 text-white' />
              </div>
              <div className='text-right'>
                <div className='text-2xl font-bold text-slate-900 mb-1'>
                  {stats.deliveredShipments}
                </div>
                <div className='flex items-center gap-1'>
                  <svg
                    className='w-3 h-3 text-blue-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M5 13l4 4L19 7'
                    />
                  </svg>
                  <span className='text-xs text-blue-600 font-semibold'>
                    Tamamlandı
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h3 className='text-lg font-bold text-slate-900 mb-1'>Tamamlanan Yükler</h3>
              <p className='text-sm text-slate-600'>Teslim edilen gönderiler</p>
            </div>
          </div>

          <div className='bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-300 transition-all duration-300'>
            <div className='flex items-center justify-between mb-4'>
              <div className='w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center'>
                <Clock className='w-6 h-6 text-white' />
              </div>
              <div className='text-right'>
                <div className='text-2xl font-bold text-slate-900 mb-1'>
                  {stats.pendingShipments}
                </div>
                <div className='flex items-center gap-1'>
                  <svg
                    className='w-3 h-3 text-blue-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                    />
                  </svg>
                  <span className='text-xs text-blue-600 font-semibold'>
                    Beklemede
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h3 className='text-lg font-bold text-slate-900 mb-1'>Bekleyen Yükler</h3>
              <p className='text-sm text-slate-600'>Teklif bekleyen ilanlar</p>
            </div>
          </div>

          <div className='bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-300 transition-all duration-300'>
            <div className='flex items-center justify-between mb-4'>
              <div className='w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center'>
                <TrendingUp className='w-6 h-6 text-white' />
              </div>
              <div className='text-right'>
                <div className='text-2xl font-bold text-slate-900 mb-1'>
                  {walletBalance !== null ? `₺${walletBalance.toFixed(0)}` : '₺0'}
                </div>
                <div className='flex items-center gap-1'>
                  <svg
                    className='w-3 h-3 text-blue-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                    />
                  </svg>
                  <span className='text-xs text-blue-600 font-semibold'>
                    Bakiye
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h3 className='text-lg font-bold text-slate-900 mb-1'>Cüzdan Bakiyesi</h3>
              <p className='text-sm text-slate-600'>Kazancınız</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className='bg-white rounded-2xl p-8 shadow-xl border border-slate-200 mb-8'>
          <div className='flex items-center justify-between mb-8'>
            <div>
              <h2 className='text-2xl font-bold text-slate-900 mb-2'>
                Hızlı İşlemler
              </h2>
              <p className='text-slate-600'>
                Nakliyeci hizmetlerinize hızlı erişim
              </p>
            </div>
            <div className='w-14 h-14 bg-gradient-to-br from-slate-800 to-blue-900 rounded-2xl flex items-center justify-center shadow-lg'>
              <Truck className='w-7 h-7 text-white' />
            </div>
          </div>

          <div className='grid grid-cols-2 md:grid-cols-4 gap-6'>
            <Link to='/nakliyeci/jobs'>
              <div className='group bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl hover:border-blue-300 transition-all duration-300 hover:-translate-y-2'>
                <div className='flex flex-col items-center text-center'>
                  <div className='w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mb-4'>
                    <Target className='w-6 h-6 text-white' />
                  </div>
                  <h3 className='text-lg font-bold text-slate-900 mb-2'>
                    Yük Pazarı
                  </h3>
                  <p className='text-sm text-slate-600'>
                    Açık ilanlar ve teklifler
                  </p>
                  <div className='mt-3 w-8 h-1 bg-blue-600 rounded-full group-hover:w-12 transition-all duration-300'></div>
                </div>
              </div>
            </Link>

            <Link to='/nakliyeci/route-planner'>
              <div className='group bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl hover:border-emerald-300 transition-all duration-300 hover:-translate-y-2'>
                <div className='flex flex-col items-center text-center'>
                  <div className='w-12 h-12 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mb-4'>
                    <Map className='w-6 h-6 text-white' />
                  </div>
                  <h3 className='text-lg font-bold text-slate-900 mb-2'>
                    Akıllı Rota
                  </h3>
                  <p className='text-sm text-slate-600'>Yük optimizasyonu</p>
                  <div className='mt-3 w-8 h-1 bg-emerald-600 rounded-full group-hover:w-12 transition-all duration-300'></div>
                </div>
              </div>
            </Link>

            <Link to='/nakliyeci/active-shipments'>
              <div className='group bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl hover:border-purple-300 transition-all duration-300 hover:-translate-y-2'>
                <div className='flex flex-col items-center text-center'>
                  <div className='w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mb-4'>
                    <Package className='w-6 h-6 text-white' />
                  </div>
                  <h3 className='text-lg font-bold text-slate-900 mb-2'>
                    Gönderilerim
                  </h3>
                  <p className='text-sm text-slate-600'>
                    Aktif ve tamamlanan yükler
                  </p>
                  <div className='mt-3 w-8 h-1 bg-purple-600 rounded-full group-hover:w-12 transition-all duration-300'></div>
                </div>
              </div>
            </Link>

            <Link to='/nakliyeci/drivers'>
              <div className='group bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl hover:border-amber-300 transition-all duration-300 hover:-translate-y-2'>
                <div className='flex flex-col items-center text-center'>
                  <div className='w-12 h-12 bg-gradient-to-br from-amber-600 to-orange-700 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mb-4'>
                    <Users className='w-6 h-6 text-white' />
                  </div>
                  <h3 className='text-lg font-bold text-slate-900 mb-2'>
                    Taşıyıcılarım
                  </h3>
                  <p className='text-sm text-slate-600'>
                    Şoför ve araç yönetimi
                  </p>
                  <div className='mt-3 w-8 h-1 bg-amber-600 rounded-full group-hover:w-12 transition-all duration-300'></div>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Son Gönderiler - Aktif Yükler Özeti */}
        <div className='bg-white rounded-2xl p-8 shadow-xl border border-slate-200 mb-8'>
          <div className='flex items-center justify-between mb-6'>
            <div>
              <h2 className='text-2xl font-bold text-slate-900 mb-2'>
                Aktif Yükler
              </h2>
              <p className='text-slate-600'>
                Devam eden yüklerinizin özeti (en son 5)
              </p>
            </div>
            <Link
              to='/nakliyeci/active-shipments'
              className='text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2'
            >
              Tümünü Gör
              <ArrowRight className='w-4 h-4' />
            </Link>
          </div>

          {recentShipments.length > 0 ? (
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead>
                  <tr className='border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50'>
                    <th className='text-left py-3 px-4 font-semibold text-slate-800'>
                      Yük No
                    </th>
                    <th className='text-left py-3 px-4 font-semibold text-slate-800'>
                      Durum
                    </th>
                    <th className='text-left py-3 px-4 font-semibold text-slate-800'>
                      Güzergah
                    </th>
                    <th className='text-left py-3 px-4 font-semibold text-slate-800'>
                      Tutar
                    </th>
                    <th className='text-left py-3 px-4 font-semibold text-slate-800'>
                      Tarih
                    </th>
                    <th className='text-left py-3 px-4 font-semibold text-slate-800'>
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentShipments.map(shipment => (
                    <tr
                      key={shipment.id}
                      className='border-b border-slate-100 hover:bg-slate-50 transition-colors'
                    >
                      <td className='py-4 px-4'>
                        <div className='text-sm text-slate-900'>
                          #{normalizeTrackingCode(shipment.trackingNumber, shipment.id)}
                        </div>
                      </td>
                      <td className='py-4 px-4'>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(shipment.status)}`}
                        >
                          {getStatusText(shipment.status)}
                        </span>
                      </td>
                      <td className='py-4 px-4'>
                        <div className='text-sm text-slate-900'>
                          {(shipment.pickupCity || shipment.pickup_city || shipment.from || 'İstanbul')} → {(shipment.deliveryCity || shipment.delivery_city || shipment.to || 'Ankara')}
                        </div>
                      </td>
                      <td className='py-4 px-4'>
                        <div className='text-sm font-semibold text-slate-900'>
                          ₺{(shipment.price || shipment.value || 0).toLocaleString()}
                        </div>
                      </td>
                      <td className='py-4 px-4'>
                        <div className='text-sm text-slate-500'>
                          {formatDateSafe(shipment.createdAt || shipment.created_at || shipment.date || shipment.updatedAt || shipment.updated_at)}
                        </div>
                      </td>
                      <td className='py-4 px-4'>
                        <div className='flex items-center gap-2'>
                          <Link 
                            to={`/nakliyeci/active-shipments`}
                            className='text-blue-600 hover:text-blue-700 text-sm font-medium'
                            title='Aktif Yükler sayfasına git'
                          >
                            <Eye className='w-4 h-4' />
                          </Link>
                          {shipment.status === 'pending' && (
                            <Link 
                              to={`/nakliyeci/jobs/${shipment.id}`}
                              className='text-slate-600 hover:text-slate-700 text-sm font-medium'
                              title='Yük detaylarını düzenle'
                            >
                              <Edit className='w-4 h-4' />
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={Package}
              title='Aktif yük bulunmuyor'
              description='Devam eden yükünüz yok. Yük pazarından yeni yükler alabilirsiniz.'
              action={{
                label: 'Yük Pazarı',
                onClick: () => navigate('/nakliyeci/jobs'),
              }}
            />
          )}
        </div>
      </div>

      {/* Notification Modal */}
      <NotificationModal
        isOpen={showNotificationModal}
        onClose={() => {
          setShowNotificationModal(false);
          // Modal kapatıldığında bildirimleri okundu olarak işaretle
          markNotificationsAsRead();
        }}
      />
    </div>
  );
};

export default Dashboard;