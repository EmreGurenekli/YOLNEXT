import React, { useState, useEffect } from 'react';
import { Bell, BellOff, CheckCircle, XCircle, Clock, AlertCircle, Info, Package, Truck, DollarSign, MessageSquare, Star, User, Phone, Mail, Calendar, MapPin, Weight, Eye, EyeOff, Trash2, Archive, MarkAsRead, MarkAsUnread, Filter, SortAsc, SortDesc, Search, RefreshCw, Settings, Download, Share2, MoreVertical, ExternalLink } from 'lucide-react';
import { realApiService } from '../../services/realApi';
import { useNavigate } from 'react-router-dom';

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

interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  shipmentUpdates: boolean;
  paymentUpdates: boolean;
  offerUpdates: boolean;
  messageUpdates: boolean;
  systemUpdates: boolean;
  promotionUpdates: boolean;
  reminderUpdates: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
}

const mockNotifications: Notification[] = [
  {
    id: 'NOTIF001',
    type: 'shipment',
    title: 'Gönderiniz Teslim Edildi',
    message: 'Gönderiniz #SHP001 başarıyla teslim edildi. Değerlendirmenizi yapabilirsiniz.',
    timestamp: '2024-07-20T15:30:00Z',
    read: false,
    isImportant: true,
    isUrgent: false,
    actionUrl: '/individual/shipments/SHP001',
    actionText: 'Gönderiyi Görüntüle',
    metadata: {
      deliveryTime: '2 gün',
      rating: 5
    },
    shipmentId: 'SHP001',
    shipmentTitle: 'Ev Eşyası Taşıma',
    carrierId: 'CAR001',
    carrierName: 'Hızlı Kargo A.Ş.',
    carrierCompany: 'Hızlı Kargo',
    status: 'success',
    category: 'shipment',
    priority: 'high',
    source: 'system',
    tags: ['teslimat', 'başarılı']
  },
  {
    id: 'NOTIF002',
    type: 'payment',
    title: 'Ödeme Onaylandı',
    message: 'Gönderi #SHP001 için ödeme işleminiz onaylandı. Tutar: ₺1,200',
    timestamp: '2024-07-18T10:15:00Z',
    read: true,
    isImportant: false,
    isUrgent: false,
    actionUrl: '/individual/payments',
    actionText: 'Ödemeleri Görüntüle',
    metadata: {
      paymentMethod: 'Kredi Kartı',
      transactionId: 'TXN123456789'
    },
    shipmentId: 'SHP001',
    amount: 1200,
    status: 'success',
    category: 'payment',
    priority: 'normal',
    source: 'system',
    tags: ['ödeme', 'onay']
  },
  {
    id: 'NOTIF003',
    type: 'offer',
    title: 'Yeni Teklif Alındı',
    message: 'Gönderiniz #SHP002 için yeni bir teklif alındı. Fiyat: ₺150',
    timestamp: '2024-07-17T14:20:00Z',
    read: false,
    isImportant: true,
    isUrgent: false,
    actionUrl: '/individual/offers',
    actionText: 'Teklifi Görüntüle',
    metadata: {
      offerCount: 3,
      lowestPrice: 150
    },
    shipmentId: 'SHP002',
    shipmentTitle: 'Kişisel Eşya Gönderimi',
    carrierId: 'CAR002',
    carrierName: 'Güven Lojistik',
    carrierCompany: 'Güven Taşımacılık',
    amount: 150,
    status: 'info',
    category: 'offer',
    priority: 'normal',
    source: 'carrier',
    tags: ['teklif', 'yeni']
  },
  {
    id: 'NOTIF004',
    type: 'message',
    title: 'Yeni Mesaj',
    message: 'Hızlı Kargo A.Ş. size mesaj gönderdi: "Gönderiniz yola çıktı."',
    timestamp: '2024-07-16T09:30:00Z',
    read: true,
    isImportant: false,
    isUrgent: false,
    actionUrl: '/individual/messages',
    actionText: 'Mesajı Görüntüle',
    metadata: {
      messageType: 'update',
      isRead: true
    },
    shipmentId: 'SHP001',
    carrierId: 'CAR001',
    carrierName: 'Hızlı Kargo A.Ş.',
    carrierCompany: 'Hızlı Kargo',
    status: 'info',
    category: 'message',
    priority: 'normal',
    source: 'carrier',
    tags: ['mesaj', 'güncelleme']
  },
  {
    id: 'NOTIF005',
    type: 'system',
    title: 'Sistem Güncellemesi',
    message: 'Platform güncellemesi yapıldı. Yeni özellikler: Gelişmiş takip sistemi, daha hızlı arama',
    timestamp: '2024-07-15T08:00:00Z',
    read: true,
    isImportant: false,
    isUrgent: false,
    actionUrl: '/individual/help',
    actionText: 'Detayları Görüntüle',
    metadata: {
      version: '2.1.0',
      features: ['Yeni takip sistemi', 'Gelişmiş filtreleme']
    },
    status: 'info',
    category: 'system',
    priority: 'low',
    source: 'system',
    tags: ['sistem', 'güncelleme']
  },
  {
    id: 'NOTIF006',
    type: 'reminder',
    title: 'Gönderi Hatırlatması',
    message: 'Gönderiniz #SHP003 için teslimat tarihi yaklaşıyor. Tarih: 22 Temmuz 2024',
    timestamp: '2024-07-14T16:45:00Z',
    read: false,
    isImportant: true,
    isUrgent: true,
    actionUrl: '/individual/shipments/SHP003',
    actionText: 'Gönderiyi Görüntüle',
    metadata: {
      deliveryDate: '2024-07-22T18:00:00Z',
      daysRemaining: 3
    },
    shipmentId: 'SHP003',
    shipmentTitle: 'Tarım Ürünleri Sevkiyatı',
    status: 'warning',
    category: 'reminder',
    priority: 'urgent',
    source: 'system',
    tags: ['hatırlatma', 'teslimat']
  },
  {
    id: 'NOTIF007',
    type: 'promotion',
    title: 'Özel İndirim Fırsatı',
    message: 'Bu hafta sonu özel indirim! Tüm gönderilerde %20 indirim. Hemen gönderi oluşturun!',
    timestamp: '2024-07-13T12:00:00Z',
    read: true,
    isImportant: false,
    isUrgent: false,
    actionUrl: '/individual/create-shipment',
    actionText: 'Gönderi Oluştur',
    metadata: {
      discountPercent: 20,
      validUntil: '2024-07-15T23:59:59Z'
    },
    status: 'info',
    category: 'promotion',
    priority: 'normal',
    source: 'system',
    tags: ['indirim', 'promosyon']
  }
];

const mockSettings: NotificationSettings = {
  emailNotifications: true,
  smsNotifications: false,
  pushNotifications: true,
  shipmentUpdates: true,
  paymentUpdates: true,
  offerUpdates: true,
  messageUpdates: true,
  systemUpdates: false,
  promotionUpdates: true,
  reminderUpdates: true,
  quietHours: {
    enabled: true,
    start: '22:00',
    end: '08:00'
  },
  frequency: 'immediate'
};

const getTypeInfo = (type: Notification['type']) => {
  switch (type) {
    case 'shipment': return { icon: <Package className="w-5 h-5" />, color: 'blue', text: 'Gönderi' };
    case 'payment': return { icon: <DollarSign className="w-5 h-5" />, color: 'green', text: 'Ödeme' };
    case 'offer': return { icon: <DollarSign className="w-5 h-5" />, color: 'purple', text: 'Teklif' };
    case 'message': return { icon: <MessageSquare className="w-5 h-5" />, color: 'orange', text: 'Mesaj' };
    case 'system': return { icon: <Info className="w-5 h-5" />, color: 'gray', text: 'Sistem' };
    case 'promotion': return { icon: <Star className="w-5 h-5" />, color: 'yellow', text: 'Promosyon' };
    case 'reminder': return { icon: <Clock className="w-5 h-5" />, color: 'red', text: 'Hatırlatma' };
    default: return { icon: <Bell className="w-5 h-5" />, color: 'gray', text: 'Bildirim' };
  }
};

const getStatusInfo = (status: Notification['status']) => {
  switch (status) {
    case 'success': return { color: 'green', icon: <CheckCircle className="w-4 h-4" /> };
    case 'warning': return { color: 'yellow', icon: <AlertCircle className="w-4 h-4" /> };
    case 'error': return { color: 'red', icon: <XCircle className="w-4 h-4" /> };
    case 'info': return { color: 'blue', icon: <Info className="w-4 h-4" /> };
    default: return { color: 'gray', icon: <Info className="w-4 h-4" /> };
  }
};

const getPriorityInfo = (priority: Notification['priority']) => {
  switch (priority) {
    case 'low': return { color: 'gray', text: 'Düşük' };
    case 'normal': return { color: 'blue', text: 'Normal' };
    case 'high': return { color: 'orange', text: 'Yüksek' };
    case 'urgent': return { color: 'red', text: 'Acil' };
    default: return { color: 'gray', text: 'Bilinmiyor' };
  }
};

const getSourceInfo = (source: Notification['source']) => {
  switch (source) {
    case 'system': return { text: 'Sistem', color: 'gray' };
    case 'carrier': return { text: 'Taşıyıcı', color: 'blue' };
    case 'support': return { text: 'Destek', color: 'green' };
    case 'user': return { text: 'Kullanıcı', color: 'purple' };
    default: return { text: 'Bilinmiyor', color: 'gray' };
  }
};

const IndividualNotifications: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<NotificationFilter>({
    type: 'all',
    dateRange: 'all',
    searchTerm: '',
    priority: 'all',
    source: 'all'
  });
  const [sortBy, setSortBy] = useState<'timestamp' | 'priority' | 'type'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'all' | 'unread' | 'important'>('all');

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        // const response = await realApiService.getNotifications();
        // if (response.success) {
        //   setNotifications(response.data.notifications);
        //   setSettings(response.data.settings);
        // } else {
        //   console.error('Failed to fetch notifications:', response.message);
        //   setNotifications(mockNotifications);
        //   setSettings(mockSettings);
        // }
        setNotifications(mockNotifications);
        setSettings(mockSettings);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setNotifications(mockNotifications);
        setSettings(mockSettings);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const filteredNotifications = notifications.filter(notification => {
    const matchesType = filter.type === 'all' || notification.type === filter.type;
    const matchesSearch = filter.searchTerm === '' ||
      notification.title.toLowerCase().includes(filter.searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(filter.searchTerm.toLowerCase()) ||
      notification.shipmentTitle?.toLowerCase().includes(filter.searchTerm.toLowerCase()) ||
      notification.carrierName?.toLowerCase().includes(filter.searchTerm.toLowerCase());

    const matchesDate = filter.dateRange === 'all' || (() => {
      const notificationDate = new Date(notification.timestamp);
      const now = new Date();
      const daysDiff = Math.ceil((now.getTime() - notificationDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (filter.dateRange === 'today' && daysDiff > 1) return false;
      if (filter.dateRange === 'week' && daysDiff > 7) return false;
      if (filter.dateRange === 'month' && daysDiff > 30) return false;
      if (filter.dateRange === 'year' && daysDiff > 365) return false;
      return true;
    })();

    const matchesPriority = filter.priority === 'all' || notification.priority === filter.priority;
    const matchesSource = filter.source === 'all' || notification.source === filter.source;

    let matchesViewMode = true;
    if (viewMode === 'unread') matchesViewMode = !notification.read;
    if (viewMode === 'important') matchesViewMode = notification.isImportant;

    return matchesType && matchesSearch && matchesDate && matchesPriority && matchesSource && matchesViewMode;
  });

  const sortedNotifications = [...filteredNotifications].sort((a, b) => {
    let compare = 0;
    if (sortBy === 'timestamp') {
      compare = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    } else if (sortBy === 'priority') {
      const priorityOrder = { 'low': 1, 'normal': 2, 'high': 3, 'urgent': 4 };
      compare = priorityOrder[a.priority] - priorityOrder[b.priority];
    } else if (sortBy === 'type') {
      compare = a.type.localeCompare(b.type);
    }

    return sortOrder === 'asc' ? compare : -compare;
  });

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === notificationId ? { ...notif, read: true } : notif
    ));
  };

  const handleMarkAsUnread = (notificationId: string) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === notificationId ? { ...notif, read: false } : notif
    ));
  };

  const handleMarkAsImportant = (notificationId: string) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === notificationId ? { ...notif, isImportant: !notif.isImportant } : notif
    ));
  };

  const handleDeleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
  };

  const handleDeleteSelected = () => {
    setNotifications(prev => prev.filter(notif => !selectedNotifications.includes(notif.id)));
    setSelectedNotifications([]);
  };

  const handleSelectNotification = (notificationId: string) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId) 
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const handleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map(notif => notif.id));
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const unreadCount = notifications.filter(notif => !notif.read).length;
  const importantCount = notifications.filter(notif => notif.isImportant).length;
  const urgentCount = notifications.filter(notif => notif.isUrgent).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-lg text-gray-600">Bildirimler yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 py-4 px-8">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bildirimler</h1>
            <p className="text-sm text-gray-600 mt-1">Tüm bildirimlerinizi buradan yönetin</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md text-sm font-medium hover:bg-gray-700 transition-colors duration-200 shadow-md"
            >
              <Filter className="w-4 h-4 mr-2" /> Filtreler
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors duration-200 shadow-md"
            >
              <Settings className="w-4 h-4 mr-2" /> Ayarlar
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-10">
        {/* İstatistikler */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-500">Toplam Bildirim</div>
                <div className="text-3xl font-bold text-gray-900 mt-1">{notifications.length}</div>
              </div>
              <Bell className="w-10 h-10 text-blue-400 opacity-75" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-500">Okunmamış</div>
                <div className="text-3xl font-bold text-gray-900 mt-1">{unreadCount}</div>
              </div>
              <BellOff className="w-10 h-10 text-orange-400 opacity-75" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-500">Önemli</div>
                <div className="text-3xl font-bold text-gray-900 mt-1">{importantCount}</div>
              </div>
              <Star className="w-10 h-10 text-yellow-400 opacity-75" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-500">Acil</div>
                <div className="text-3xl font-bold text-gray-900 mt-1">{urgentCount}</div>
              </div>
              <AlertCircle className="w-10 h-10 text-red-400 opacity-75" />
            </div>
          </div>
        </div>

        {/* Filtreler */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tür</label>
                <select
                  value={filter.type}
                  onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">Tümü</option>
                  <option value="unread">Okunmamış</option>
                  <option value="important">Önemli</option>
                  <option value="urgent">Acil</option>
                  <option value="shipment">Gönderiler</option>
                  <option value="payment">Ödemeler</option>
                  <option value="offer">Teklifler</option>
                  <option value="message">Mesajlar</option>
                  <option value="system">Sistem</option>
                  <option value="promotion">Promosyonlar</option>
                  <option value="reminder">Hatırlatmalar</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tarih Aralığı</label>
                <select
                  value={filter.dateRange}
                  onChange={(e) => setFilter(prev => ({ ...prev, dateRange: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">Tümü</option>
                  <option value="today">Bugün</option>
                  <option value="week">Bu Hafta</option>
                  <option value="month">Bu Ay</option>
                  <option value="year">Bu Yıl</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Öncelik</label>
                <select
                  value={filter.priority}
                  onChange={(e) => setFilter(prev => ({ ...prev, priority: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">Tümü</option>
                  <option value="low">Düşük</option>
                  <option value="normal">Normal</option>
                  <option value="high">Yüksek</option>
                  <option value="urgent">Acil</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kaynak</label>
                <select
                  value={filter.source}
                  onChange={(e) => setFilter(prev => ({ ...prev, source: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">Tümü</option>
                  <option value="system">Sistem</option>
                  <option value="carrier">Taşıyıcı</option>
                  <option value="support">Destek</option>
                  <option value="user">Kullanıcı</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sıralama</label>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field as any);
                    setSortOrder(order as 'asc' | 'desc');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="timestamp-desc">Tarih (Yeni)</option>
                  <option value="timestamp-asc">Tarih (Eski)</option>
                  <option value="priority-desc">Öncelik (Yüksek)</option>
                  <option value="priority-asc">Öncelik (Düşük)</option>
                  <option value="type-asc">Tür (A-Z)</option>
                  <option value="type-desc">Tür (Z-A)</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Bildirim ara..."
                  value={filter.searchTerm}
                  onChange={(e) => setFilter(prev => ({ ...prev, searchTerm: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Bildirim Listesi */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          {/* Başlık ve Aksiyonlar */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h2 className="text-lg font-semibold text-gray-900">Bildirimler</h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setViewMode('all')}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      viewMode === 'all' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    Tümü
                  </button>
                  <button
                    onClick={() => setViewMode('unread')}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      viewMode === 'unread' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    Okunmamış
                  </button>
                  <button
                    onClick={() => setViewMode('important')}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      viewMode === 'important' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    Önemli
                  </button>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSelectAll}
                  className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-sm hover:bg-gray-200"
                >
                  {selectedNotifications.length === filteredNotifications.length ? 'Tümünü Kaldır' : 'Tümünü Seç'}
                </button>
                {selectedNotifications.length > 0 && (
                  <button
                    onClick={handleDeleteSelected}
                    className="px-3 py-1 bg-red-100 text-red-600 rounded text-sm hover:bg-red-200"
                  >
                    Seçilenleri Sil
                  </button>
                )}
                <button
                  onClick={handleMarkAllAsRead}
                  className="px-3 py-1 bg-blue-100 text-blue-600 rounded text-sm hover:bg-blue-200"
                >
                  Tümünü Okundu İşaretle
                </button>
              </div>
            </div>
          </div>

          {/* Bildirim Listesi */}
          <div className="max-h-96 overflow-y-auto">
            {sortedNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-xl font-medium">Bildirim bulunamadı.</p>
                <p className="text-sm mt-2">Filtreleri ayarlayarak arama yapabilirsiniz.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {sortedNotifications.map((notification) => {
                  const typeInfo = getTypeInfo(notification.type);
                  const statusInfo = getStatusInfo(notification.status);
                  const priorityInfo = getPriorityInfo(notification.priority);
                  const sourceInfo = getSourceInfo(notification.source);
                  const isSelected = selectedNotifications.includes(notification.id);

                  return (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-colors duration-200 ${
                        !notification.read ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      } ${isSelected ? 'bg-gray-100' : ''}`}
                    >
                      <div className="flex items-start space-x-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectNotification(notification.id)}
                          className="mt-1"
                        />
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          typeInfo.color === 'blue' ? 'bg-blue-100' :
                          typeInfo.color === 'green' ? 'bg-green-100' :
                          typeInfo.color === 'purple' ? 'bg-purple-100' :
                          typeInfo.color === 'orange' ? 'bg-orange-100' :
                          typeInfo.color === 'yellow' ? 'bg-yellow-100' :
                          typeInfo.color === 'red' ? 'bg-red-100' :
                          'bg-gray-100'
                        }`}>
                          <div className={`${
                            typeInfo.color === 'blue' ? 'text-blue-600' :
                            typeInfo.color === 'green' ? 'text-green-600' :
                            typeInfo.color === 'purple' ? 'text-purple-600' :
                            typeInfo.color === 'orange' ? 'text-orange-600' :
                            typeInfo.color === 'yellow' ? 'text-yellow-600' :
                            typeInfo.color === 'red' ? 'text-red-600' :
                            'text-gray-600'
                          }`}>
                            {typeInfo.icon}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium text-gray-900">{notification.title}</h3>
                            <div className="flex items-center space-x-2">
                              {notification.isImportant && (
                                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                              )}
                              {notification.isUrgent && (
                                <AlertCircle className="w-4 h-4 text-red-500" />
                              )}
                              <span className="text-xs text-gray-500">
                                {new Date(notification.timestamp).toLocaleDateString('tr-TR')}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full ${
                              typeInfo.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                              typeInfo.color === 'green' ? 'bg-green-100 text-green-800' :
                              typeInfo.color === 'purple' ? 'bg-purple-100 text-purple-800' :
                              typeInfo.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                              typeInfo.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                              typeInfo.color === 'red' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {typeInfo.text}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full ${
                              priorityInfo.color === 'red' ? 'bg-red-100 text-red-800' :
                              priorityInfo.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                              priorityInfo.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {priorityInfo.text}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full ${
                              sourceInfo.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                              sourceInfo.color === 'green' ? 'bg-green-100 text-green-800' :
                              sourceInfo.color === 'purple' ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {sourceInfo.text}
                            </span>
                            {notification.amount && (
                              <span className="font-medium text-gray-900">₺{notification.amount.toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          {!notification.read ? (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                              title="Okundu İşaretle"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleMarkAsUnread(notification.id)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                              title="Okunmadı İşaretle"
                            >
                              <EyeOff className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleMarkAsImportant(notification.id)}
                            className={`p-1 ${
                              notification.isImportant ? 'text-yellow-400' : 'text-gray-400'
                            } hover:text-yellow-600`}
                            title="Önemli İşaretle"
                          >
                            <Star className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteNotification(notification.id)}
                            className="p-1 text-gray-400 hover:text-red-600"
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          {notification.actionUrl && (
                            <button
                              onClick={() => handleNotificationClick(notification)}
                              className="p-1 text-blue-400 hover:text-blue-600"
                              title="Aç"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default IndividualNotifications;