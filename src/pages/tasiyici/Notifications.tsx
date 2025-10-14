import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Bell, 
  Check, 
  X, 
  Filter, 
  Search, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  Star, 
  Truck, 
  Package, 
  DollarSign, 
  MessageSquare, 
  Phone, 
  MapPin, 
  Calendar,
  Eye,
  Trash2,
  Archive,
  MoreHorizontal
} from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import Modal from '../../components/common/Modal';
import SuccessMessage from '../../components/common/SuccessMessage';

interface Notification {
  id: number;
  type: 'job' | 'payment' | 'message' | 'system' | 'alert';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  priority: 'high' | 'medium' | 'low';
  actionUrl?: string;
  relatedId?: number;
}

export default function TasiyiciNotifications() {
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState<number[]>([]);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const breadcrumbItems = [
    { label: 'Ana Sayfa', icon: <Truck className="w-4 h-4" />, href: '/tasiyici/dashboard' },
    { label: 'Bildirimler', icon: <Bell className="w-4 h-4" /> }
  ];

  // Mock data
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: 1,
        type: 'job',
        title: 'Yeni İş Teklifi',
        message: 'İstanbul\'dan Ankara\'ya kargo taşıma işi için teklifiniz kabul edildi.',
        timestamp: '2 dakika önce',
        isRead: false,
        priority: 'high',
        actionUrl: '/tasiyici/jobs',
        relatedId: 101
      },
      {
        id: 2,
        type: 'payment',
        title: 'Ödeme Alındı',
        message: '₺2,500 ödeme hesabınıza yatırıldı. İş #TRK-2024-001',
        timestamp: '1 saat önce',
        isRead: false,
        priority: 'high',
        actionUrl: '/tasiyici/earnings',
        relatedId: 201
      },
      {
        id: 3,
        type: 'message',
        title: 'Yeni Mesaj',
        message: 'Müşteri Ahmet Yılmaz\'dan mesaj aldınız: "Kargo ne zaman teslim edilecek?"',
        timestamp: '3 saat önce',
        isRead: true,
        priority: 'medium',
        actionUrl: '/tasiyici/messages',
        relatedId: 301
      },
      {
        id: 4,
        type: 'system',
        title: 'Sistem Güncellemesi',
        message: 'YolNet uygulaması güncellendi. Yeni özellikler için yardım sayfasını ziyaret edin.',
        timestamp: '1 gün önce',
        isRead: true,
        priority: 'low',
        actionUrl: '/tasiyici/help'
      },
      {
        id: 5,
        type: 'alert',
        title: 'Araç Bakım Hatırlatması',
        message: 'Aracınızın periyodik bakım tarihi yaklaşıyor. 15 Ocak 2024',
        timestamp: '2 gün önce',
        isRead: false,
        priority: 'medium',
        actionUrl: '/tasiyici/profile'
      },
      {
        id: 6,
        type: 'job',
        title: 'İş Tamamlandı',
        message: 'İş #TRK-2024-002 başarıyla tamamlandı. Müşteri değerlendirmesi: 5 yıldız',
        timestamp: '3 gün önce',
        isRead: true,
        priority: 'medium',
        actionUrl: '/tasiyici/completed-jobs',
        relatedId: 102
      }
    ];

    setTimeout(() => {
      setNotifications(mockNotifications);
      setIsLoading(false);
    }, 1000);
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'job':
        return <Package className="w-5 h-5" />;
      case 'payment':
        return <DollarSign className="w-5 h-5" />;
      case 'message':
        return <MessageSquare className="w-5 h-5" />;
      case 'system':
        return <Info className="w-5 h-5" />;
      case 'alert':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'job':
        return 'text-blue-600 bg-blue-100';
      case 'payment':
        return 'text-green-600 bg-green-100';
      case 'message':
        return 'text-purple-600 bg-purple-100';
      case 'system':
        return 'text-slate-600 bg-slate-100';
      case 'alert':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-slate-600 bg-slate-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-slate-600 bg-slate-100';
      default:
        return 'text-slate-600 bg-slate-100';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesType = filterType === 'all' || notification.type === filterType;
    const matchesPriority = filterPriority === 'all' || notification.priority === filterPriority;
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesPriority && matchesSearch;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = (id: number) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, isRead: true }
          : notification
      )
    );
    setSuccessMessage('Bildirim okundu olarak işaretlendi');
    setShowSuccessMessage(true);
  };

  const handleMarkAsUnread = (id: number) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, isRead: false }
          : notification
      )
    );
    setSuccessMessage('Bildirim okunmadı olarak işaretlendi');
    setShowSuccessMessage(true);
  };

  const handleDelete = (id: number) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
    setSuccessMessage('Bildirim silindi');
    setShowSuccessMessage(true);
  };

  const handleBulkAction = (action: 'read' | 'unread' | 'delete') => {
    if (selectedNotifications.length === 0) return;

    if (action === 'delete') {
      setNotifications(prev => 
        prev.filter(notification => !selectedNotifications.includes(notification.id))
      );
      setSuccessMessage(`${selectedNotifications.length} bildirim silindi`);
    } else {
      setNotifications(prev => 
        prev.map(notification => 
          selectedNotifications.includes(notification.id)
            ? { ...notification, isRead: action === 'read' }
            : notification
        )
      );
      setSuccessMessage(`${selectedNotifications.length} bildirim güncellendi`);
    }
    
    setSelectedNotifications([]);
    setShowSuccessMessage(true);
  };

  const handleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map(n => n.id));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <Helmet>
          <title>Bildirimler - YolNet Taşıyıcı</title>
        </Helmet>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <Breadcrumb items={breadcrumbItems} />
          <LoadingState text="Bildirimler yükleniyor..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Helmet>
        <title>Bildirimler - YolNet Taşıyıcı</title>
        <meta name="description" content="Taşıyıcı bildirimleri ve uyarıları" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Breadcrumb */}
        <div className="mb-4 sm:mb-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-3 mb-4 sm:mb-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl flex items-center justify-center shadow-lg">
              <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Bildirimler</h1>
              <p className="text-sm text-slate-600">
                {unreadCount > 0 ? `${unreadCount} okunmamış bildirim` : 'Tüm bildirimler okundu'}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {selectedNotifications.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkAction('read')}
                  className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
                >
                  <Check className="w-4 h-4" />
                  Okundu İşaretle
                </button>
                <button
                  onClick={() => handleBulkAction('unread')}
                  className="flex items-center gap-2 px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors text-sm font-medium"
                >
                  <X className="w-4 h-4" />
                  Okunmadı İşaretle
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  Sil
                </button>
              </div>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-white border border-slate-200 text-slate-700 rounded-lg sm:rounded-xl hover:bg-slate-50 transition-all duration-200 text-sm font-medium"
            >
              <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Filtreler</span>
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Bildirimlerde ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            {showFilters && (
              <div className="flex flex-col sm:flex-row gap-4">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Tüm Türler</option>
                  <option value="job">İş</option>
                  <option value="payment">Ödeme</option>
                  <option value="message">Mesaj</option>
                  <option value="system">Sistem</option>
                  <option value="alert">Uyarı</option>
                </select>
                
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Tüm Öncelikler</option>
                  <option value="high">Yüksek</option>
                  <option value="medium">Orta</option>
                  <option value="low">Düşük</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Notifications List */}
        {filteredNotifications.length > 0 ? (
          <div className="space-y-4">
            {/* Select All */}
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
              <input
                type="checkbox"
                checked={selectedNotifications.length === filteredNotifications.length && filteredNotifications.length > 0}
                onChange={handleSelectAll}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-slate-600">
                Tümünü seç ({selectedNotifications.length}/{filteredNotifications.length})
              </span>
            </div>

            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-xl shadow-lg border border-slate-200 p-4 sm:p-6 transition-all duration-200 hover:shadow-xl ${
                  !notification.isRead ? 'border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={selectedNotifications.includes(notification.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedNotifications(prev => [...prev, notification.id]);
                      } else {
                        setSelectedNotifications(prev => prev.filter(id => id !== notification.id));
                      }
                    }}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 mt-1"
                  />
                  
                  <div className={`p-2 rounded-lg ${getTypeColor(notification.type)}`}>
                    {getTypeIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className={`text-lg font-semibold ${!notification.isRead ? 'text-slate-900' : 'text-slate-700'}`}>
                            {notification.title}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(notification.priority)}`}>
                            {notification.priority === 'high' ? 'Yüksek' : 
                             notification.priority === 'medium' ? 'Orta' : 'Düşük'}
                          </span>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                        
                        <p className="text-slate-600 mb-3 leading-relaxed">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {notification.timestamp}
                          </div>
                          {notification.actionUrl && (
                            <a
                              href={notification.actionUrl}
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
                            >
                              <Eye className="w-4 h-4" />
                              Detayları Gör
                            </a>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        {!notification.isRead ? (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                            title="Okundu olarak işaretle"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleMarkAsUnread(notification.id)}
                            className="p-2 text-slate-400 hover:text-yellow-600 hover:bg-yellow-100 rounded-lg transition-colors"
                            title="Okunmadı olarak işaretle"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleDelete(notification.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Bell}
            title="Bildirim Bulunamadı"
            description="Arama kriterlerinize uygun bildirim bulunamadı."
            actionText="Filtreleri Temizle"
            onAction={() => {
              setSearchTerm('');
              setFilterType('all');
              setFilterPriority('all');
            }}
          />
        )}

        {/* Success Message */}
        {showSuccessMessage && (
          <SuccessMessage
            message={successMessage}
            onClose={() => setShowSuccessMessage(false)}
          />
        )}
      </div>
    </div>
  );
}





















