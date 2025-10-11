import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Bell, 
  BellOff, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Info, 
  Package, 
  Truck, 
  DollarSign, 
  MessageSquare, 
  Star, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  MapPin, 
  Weight, 
  Eye, 
  EyeOff, 
  Trash2, 
  Archive, 
  CheckCircle2, 
  Filter, 
  SortAsc, 
  SortDesc, 
  Search, 
  RefreshCw, 
  Settings, 
  Download, 
  Share2, 
  MoreVertical, 
  ExternalLink 
} from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import Modal from '../../components/common/Modal';
import SuccessMessage from '../../components/common/SuccessMessage';

interface Notification {
  id: string;
  type: 'shipment' | 'payment' | 'offer' | 'message' | 'system' | 'promotion' | 'reminder';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  isImportant: boolean;
  isUrgent: boolean;
  actionUrl?: string;
  actionText?: string;
  metadata?: {
    [key: string]: any;
  };
  shipmentId?: string;
  shipmentTitle?: string;
  carrierId?: string;
  carrierName?: string;
  carrierCompany?: string;
  amount?: number;
  status?: 'success' | 'warning' | 'error' | 'info';
  expiresAt?: string;
  category: 'general' | 'shipment' | 'payment' | 'offer' | 'message' | 'system' | 'promotion' | 'reminder';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  source: 'system' | 'carrier' | 'support' | 'user';
  tags: string[];
}

interface NotificationFilter {
  type: 'all' | 'unread' | 'important' | 'urgent' | 'shipment' | 'payment' | 'offer' | 'message' | 'system' | 'promotion' | 'reminder';
  dateRange: 'all' | 'today' | 'week' | 'month' | 'year';
  searchTerm: string;
  priority: 'all' | 'low' | 'normal' | 'high' | 'urgent';
  source: 'all' | 'system' | 'carrier' | 'support' | 'user';
}

const IndividualNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<NotificationFilter>({
    type: 'all',
    dateRange: 'all',
    searchTerm: '',
    priority: 'all',
    source: 'all'
  });
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Mock data
  const mockNotifications: Notification[] = [
    {
      id: '1',
      type: 'shipment',
      title: 'Gönderi Durumu Güncellendi',
      message: 'Gönderiniz "Elektronik Eşya" yola çıktı ve teslimat aşamasında.',
      timestamp: '2024-01-15T10:30:00Z',
      read: false,
      isImportant: true,
      isUrgent: false,
      actionUrl: '/individual/shipments/IND-001',
      actionText: 'Detayları Görüntüle',
      shipmentId: 'IND-001',
      shipmentTitle: 'Elektronik Eşya Gönderisi',
      carrierId: 'CAR-001',
      carrierName: 'Ahmet Kaya',
      carrierCompany: 'Hızlı Nakliyat',
      status: 'info',
      category: 'shipment',
      priority: 'normal',
      source: 'carrier',
      tags: ['gönderi', 'durum', 'teslimat']
    },
    {
      id: '2',
      type: 'offer',
      title: 'Yeni Teklif Alındı',
      message: 'Gönderiniz için 3 yeni teklif alındı. En düşük fiyat ₺450.',
      timestamp: '2024-01-15T09:15:00Z',
      read: false,
      isImportant: false,
      isUrgent: false,
      actionUrl: '/individual/offers',
      actionText: 'Teklifleri Görüntüle',
      shipmentId: 'IND-002',
      shipmentTitle: 'Doküman Gönderisi',
      amount: 450,
      status: 'success',
      category: 'offer',
      priority: 'normal',
      source: 'system',
      tags: ['teklif', 'fiyat', 'gönderi']
    },
    {
      id: '3',
      type: 'payment',
      title: 'Ödeme Onaylandı',
      message: 'Gönderiniz için yapılan ödeme başarıyla onaylandı.',
      timestamp: '2024-01-15T08:45:00Z',
      read: true,
      isImportant: false,
      isUrgent: false,
      actionUrl: '/individual/payments',
      actionText: 'Ödeme Detayları',
      amount: 320,
      status: 'success',
      category: 'payment',
      priority: 'normal',
      source: 'system',
      tags: ['ödeme', 'onay', 'başarılı']
    },
    {
      id: '4',
      type: 'message',
      title: 'Yeni Mesaj',
      message: 'Nakliyeci Ahmet Kaya\'dan yeni mesaj: "Gönderiniz hazır, ne zaman alabiliriz?"',
      timestamp: '2024-01-15T07:20:00Z',
      read: false,
      isImportant: false,
      isUrgent: true,
      actionUrl: '/individual/messages',
      actionText: 'Mesajı Görüntüle',
      carrierId: 'CAR-001',
      carrierName: 'Ahmet Kaya',
      carrierCompany: 'Hızlı Nakliyat',
      status: 'info',
      category: 'message',
      priority: 'high',
      source: 'carrier',
      tags: ['mesaj', 'nakliyeci', 'iletişim']
    },
    {
      id: '5',
      type: 'system',
      title: 'Sistem Bakımı',
      message: 'Sistem bakımı nedeniyle 15 Ocak 2024, 02:00-04:00 saatleri arasında hizmet kesintisi yaşanabilir.',
      timestamp: '2024-01-14T18:00:00Z',
      read: true,
      isImportant: true,
      isUrgent: false,
      status: 'warning',
      category: 'system',
      priority: 'normal',
      source: 'system',
      tags: ['bakım', 'sistem', 'kesinti']
    }
  ];

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setNotifications(mockNotifications);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    let filtered = notifications;

    // Filter by type
    if (filter.type !== 'all') {
      if (filter.type === 'unread') {
        filtered = filtered.filter(n => !n.read);
      } else if (filter.type === 'important') {
        filtered = filtered.filter(n => n.isImportant);
      } else if (filter.type === 'urgent') {
        filtered = filtered.filter(n => n.isUrgent);
      } else {
        filtered = filtered.filter(n => n.type === filter.type);
      }
    }

    // Filter by priority
    if (filter.priority !== 'all') {
      filtered = filtered.filter(n => n.priority === filter.priority);
    }

    // Filter by source
    if (filter.source !== 'all') {
      filtered = filtered.filter(n => n.source === filter.source);
    }

    // Filter by search term
    if (filter.searchTerm) {
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(filter.searchTerm.toLowerCase()) ||
        n.message.toLowerCase().includes(filter.searchTerm.toLowerCase())
      );
    }

    // Filter by date range
    if (filter.dateRange !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(n => {
        const notificationDate = new Date(n.timestamp);
        
        switch (filter.dateRange) {
          case 'today':
            return notificationDate >= today;
          case 'week':
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            return notificationDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            return notificationDate >= monthAgo;
          case 'year':
            const yearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
            return notificationDate >= yearAgo;
          default:
            return true;
        }
      });
    }

    setFilteredNotifications(filtered);
  }, [notifications, filter]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'shipment':
        return <Package className="w-5 h-5" />;
      case 'payment':
        return <DollarSign className="w-5 h-5" />;
      case 'offer':
        return <Star className="w-5 h-5" />;
      case 'message':
        return <MessageSquare className="w-5 h-5" />;
      case 'system':
        return <Settings className="w-5 h-5" />;
      case 'promotion':
        return <Bell className="w-5 h-5" />;
      case 'reminder':
        return <Clock className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getNotificationColor = (type: string, status?: string) => {
    if (status) {
      switch (status) {
        case 'success':
          return 'text-green-600 bg-green-100';
        case 'warning':
          return 'text-yellow-600 bg-yellow-100';
        case 'error':
          return 'text-red-600 bg-red-100';
        case 'info':
          return 'text-blue-600 bg-blue-100';
        default:
          return 'text-slate-600 bg-slate-100';
      }
    }

    switch (type) {
      case 'shipment':
        return 'text-blue-600 bg-blue-100';
      case 'payment':
        return 'text-green-600 bg-green-100';
      case 'offer':
        return 'text-purple-600 bg-purple-100';
      case 'message':
        return 'text-orange-600 bg-orange-100';
      case 'system':
        return 'text-slate-600 bg-slate-100';
      case 'promotion':
        return 'text-pink-600 bg-pink-100';
      case 'reminder':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-slate-600 bg-slate-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'normal':
        return 'text-blue-600 bg-blue-100';
      case 'low':
        return 'text-slate-600 bg-slate-100';
      default:
        return 'text-slate-600 bg-slate-100';
    }
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const handleMarkAsUnread = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: false } : n
    ));
  };

  const handleDelete = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleBulkAction = (action: 'read' | 'unread' | 'delete') => {
    if (action === 'read') {
      setNotifications(prev => prev.map(n => 
        selectedNotifications.includes(n.id) ? { ...n, read: true } : n
      ));
    } else if (action === 'unread') {
      setNotifications(prev => prev.map(n => 
        selectedNotifications.includes(n.id) ? { ...n, read: false } : n
      ));
    } else if (action === 'delete') {
      setNotifications(prev => prev.filter(n => !selectedNotifications.includes(n.id)));
    }
    setSelectedNotifications([]);
    setShowBulkActions(false);
  };

  const handleSelectNotification = (id: string) => {
    setSelectedNotifications(prev => 
      prev.includes(id) 
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map(n => n.id));
    }
  };

  const breadcrumbItems = [
    { label: 'Bildirimler', icon: <Bell className="w-4 h-4" /> }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <LoadingState text="Bildirimler yükleniyor..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Helmet>
        <title>Bildirimler - YolNet Bireysel</title>
        <meta name="description" content="Bireysel gönderici bildirimleri - tüm bildirimlerinizi takip edin" />
      </Helmet>

      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Breadcrumb */}
        <div className="mb-4 sm:mb-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Header - Mobile Optimized */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
              <Bell className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-2 sm:mb-3">
            Bildirimleriniz{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-blue-900">Merkezi</span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-slate-600 px-4">Tüm bildirimlerinizi tek yerden takip edin</p>
        </div>

        {/* Stats Cards - Mobile Optimized */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-slate-600">Toplam Bildirim</p>
                <p className="text-lg sm:text-xl font-bold text-slate-900">{notifications.length}</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-slate-600">Okunmamış</p>
                <p className="text-lg sm:text-xl font-bold text-slate-900">
                  {notifications.filter(n => !n.read).length}
                </p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                <EyeOff className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-slate-600">Önemli</p>
                <p className="text-lg sm:text-xl font-bold text-slate-900">
                  {notifications.filter(n => n.isImportant).length}
                </p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-slate-600">Acil</p>
                <p className="text-lg sm:text-xl font-bold text-slate-900">
                  {notifications.filter(n => n.isUrgent).length}
                </p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters - Mobile Optimized */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Bildirim ara..."
                value={filter.searchTerm}
                onChange={(e) => setFilter(prev => ({ ...prev, searchTerm: e.target.value }))}
                className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-slate-50 focus:bg-white transition-colors"
              />
            </div>
            
            <select
              value={filter.type}
              onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value as any }))}
              className="px-3 py-2.5 sm:py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-slate-50 focus:bg-white transition-colors"
            >
              <option value="all">Tüm Türler</option>
              <option value="unread">Okunmamış</option>
              <option value="important">Önemli</option>
              <option value="urgent">Acil</option>
              <option value="shipment">Gönderi</option>
              <option value="payment">Ödeme</option>
              <option value="offer">Teklif</option>
              <option value="message">Mesaj</option>
              <option value="system">Sistem</option>
            </select>

            <select
              value={filter.priority}
              onChange={(e) => setFilter(prev => ({ ...prev, priority: e.target.value as any }))}
              className="px-3 py-2.5 sm:py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-slate-50 focus:bg-white transition-colors"
            >
              <option value="all">Tüm Öncelikler</option>
              <option value="urgent">Acil</option>
              <option value="high">Yüksek</option>
              <option value="normal">Normal</option>
              <option value="low">Düşük</option>
            </select>

            <select
              value={filter.dateRange}
              onChange={(e) => setFilter(prev => ({ ...prev, dateRange: e.target.value as any }))}
              className="px-3 py-2.5 sm:py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-slate-50 focus:bg-white transition-colors"
            >
              <option value="all">Tüm Zamanlar</option>
              <option value="today">Bugün</option>
              <option value="week">Bu Hafta</option>
              <option value="month">Bu Ay</option>
              <option value="year">Bu Yıl</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedNotifications.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">
                {selectedNotifications.length} bildirim seçildi
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleBulkAction('read')}
                  className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-900 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  Okundu İşaretle
                </button>
                <button
                  onClick={() => handleBulkAction('unread')}
                  className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-900 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  Okunmadı İşaretle
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="px-3 py-1.5 text-sm text-red-600 hover:text-red-900 hover:bg-red-100 rounded-lg transition-colors"
                >
                  Sil
                </button>
                <button
                  onClick={() => setSelectedNotifications([])}
                  className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="Bildirim Bulunamadı"
              description="Arama kriterlerinize uygun bildirim bulunamadı."
            />
          ) : (
            <>
              {/* Select All */}
              <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedNotifications.length === filteredNotifications.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm font-medium text-slate-700">
                    Tümünü Seç ({filteredNotifications.length})
                  </span>
                </label>
              </div>

              {/* Notifications */}
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`bg-white rounded-xl shadow-lg border border-slate-200 p-4 sm:p-6 transition-all ${
                    !notification.read ? 'ring-2 ring-blue-200' : ''
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedNotifications.includes(notification.id)}
                        onChange={() => handleSelectNotification(notification.id)}
                        className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                      />
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getNotificationColor(notification.type, notification.status)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className={`text-sm font-medium ${!notification.read ? 'text-slate-900' : 'text-slate-700'}`}>
                              {notification.title}
                            </h3>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            )}
                            {notification.isImportant && (
                              <span className="px-2 py-1 text-xs font-medium text-orange-800 bg-orange-100 rounded-full">
                                Önemli
                              </span>
                            )}
                            {notification.isUrgent && (
                              <span className="px-2 py-1 text-xs font-medium text-red-800 bg-red-100 rounded-full">
                                Acil
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 mb-3">{notification.message}</p>
                          
                          <div className="flex items-center space-x-4 text-xs text-slate-500">
                            <span className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {new Date(notification.timestamp).toLocaleString('tr-TR')}
                            </span>
                            <span className={`px-2 py-1 rounded-full ${getPriorityColor(notification.priority)}`}>
                              {notification.priority}
                            </span>
                            {notification.carrierName && (
                              <span className="flex items-center">
                                <Truck className="w-3 h-3 mr-1" />
                                {notification.carrierName}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {notification.actionUrl && (
                            <a
                              href={notification.actionUrl}
                              className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              {notification.actionText || 'Detay'}
                            </a>
                          )}
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => notification.read ? handleMarkAsUnread(notification.id) : handleMarkAsRead(notification.id)}
                              className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                              {notification.read ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleDelete(notification.id)}
                              className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default IndividualNotifications;