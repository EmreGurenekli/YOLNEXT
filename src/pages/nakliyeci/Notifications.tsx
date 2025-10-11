import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Bell, 
  Search, 
  Filter, 
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Clock,
  BarChart3,
  RefreshCw,
  MarkAsRead,
  MarkAsUnread,
  Trash2,
  MoreVertical
} from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import Modal from '../../components/common/Modal';
import SuccessMessage from '../../components/common/SuccessMessage';
import Pagination from '../../components/common/Pagination';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'job' | 'payment' | 'system' | 'message' | 'alert';
  isRead: boolean;
  timestamp: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  actionUrl?: string;
  actionText?: string;
}

const generateMockNotifications = (count: number): Notification[] => {
  const types = ['info', 'success', 'warning', 'error'];
  const categories = ['job', 'payment', 'system', 'message', 'alert'];
  const priorities = ['low', 'normal', 'high', 'urgent'];
  
  const titles = [
    'Yeni İş Teklifi',
    'Ödeme Onaylandı',
    'Sistem Güncellemesi',
    'Yeni Mesaj',
    'Acil Bildirim',
    'İş Tamamlandı',
    'Fiyat Güncellendi',
    'Müşteri Yorumu'
  ];
  
  const messages = [
    'Size yeni bir iş teklifi gönderildi. Detayları görüntülemek için tıklayın.',
    'Ödemeniz başarıyla işlendi ve hesabınıza yansıtıldı.',
    'Sistem güncellemesi tamamlandı. Yeni özellikler kullanıma hazır.',
    'Müşterinizden yeni bir mesaj aldınız.',
    'Acil müdahale gerektiren bir durum oluştu.',
    'İşiniz başarıyla tamamlandı. Müşteri değerlendirmesi bekleniyor.',
    'Fiyat teklifiniz güncellendi ve müşteriye gönderildi.',
    'Müşteriniz işiniz hakkında yorum yaptı.'
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    title: titles[Math.floor(Math.random() * titles.length)],
    message: messages[Math.floor(Math.random() * messages.length)],
    type: types[Math.floor(Math.random() * types.length)] as any,
    category: categories[Math.floor(Math.random() * categories.length)] as any,
    isRead: Math.random() > 0.3,
    timestamp: `2024-01-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')} ${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
    priority: priorities[Math.floor(Math.random() * priorities.length)] as any,
    actionUrl: Math.random() > 0.5 ? '/nakliyeci/offers' : undefined,
    actionText: Math.random() > 0.5 ? 'Detayları Gör' : undefined
  }));
};

export default function NakliyeciNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const notificationsPerPage = 10;

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setNotifications(generateMockNotifications(25));
      setIsLoading(false);
    }, 1000);
  }, []);

  const breadcrumbItems = [
    { label: 'Ana Sayfa', icon: <BarChart3 className="w-4 h-4" />, href: '/nakliyeci/dashboard' },
    { label: 'Bildirimler', icon: <Bell className="w-4 h-4" /> }
  ];

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = searchTerm === '' ||
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'all' || notification.type === filterType;
    const matchesCategory = filterCategory === 'all' || notification.category === filterCategory;
    const matchesPriority = filterPriority === 'all' || notification.priority === filterPriority;

    return matchesSearch && matchesType && matchesCategory && matchesPriority;
  });

  const indexOfLastNotification = currentPage * notificationsPerPage;
  const indexOfFirstNotification = indexOfLastNotification - notificationsPerPage;
  const currentNotifications = filteredNotifications.slice(indexOfFirstNotification, indexOfLastNotification);
  const totalPages = Math.ceil(filteredNotifications.length / notificationsPerPage);

  const getTypeStyle = (type: Notification['type']) => {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-800 border-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getTypeIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4" />;
      case 'warning': return <AlertCircle className="w-4 h-4" />;
      case 'error': return <XCircle className="w-4 h-4" />;
      case 'info': return <Info className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getPriorityStyle = (priority: Notification['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-slate-100 text-slate-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getCategoryText = (category: Notification['category']) => {
    switch (category) {
      case 'job': return 'İş';
      case 'payment': return 'Ödeme';
      case 'system': return 'Sistem';
      case 'message': return 'Mesaj';
      case 'alert': return 'Uyarı';
      default: return 'Bilinmiyor';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Az önce';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} saat önce`;
    } else {
      return date.toLocaleDateString('tr-TR');
    }
  };

  const handleMarkAsRead = (id: number) => {
    setNotifications(notifications.map(notification => 
      notification.id === id ? { ...notification, isRead: true } : notification
    ));
    setSuccessMessage('Bildirim okundu olarak işaretlendi');
    setShowSuccessMessage(true);
  };

  const handleMarkAsUnread = (id: number) => {
    setNotifications(notifications.map(notification => 
      notification.id === id ? { ...notification, isRead: false } : notification
    ));
    setSuccessMessage('Bildirim okunmadı olarak işaretlendi');
    setShowSuccessMessage(true);
  };

  const handleDelete = (id: number) => {
    setNotifications(notifications.filter(notification => notification.id !== id));
    setSuccessMessage('Bildirim silindi');
    setShowSuccessMessage(true);
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(notification => ({ ...notification, isRead: true })));
    setSuccessMessage('Tüm bildirimler okundu olarak işaretlendi');
    setShowSuccessMessage(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <LoadingState text="Bildirimler yükleniyor..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-50">
      <Helmet>
        <title>Bildirimler - Nakliyeci Panel - YolNet</title>
        <meta name="description" content="Nakliyeci bildirim yönetimi" />
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
              <p className="text-sm text-slate-600">Sistem bildirimlerinizi yönetin</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-slate-800 to-blue-900 text-white rounded-lg sm:rounded-xl hover:shadow-lg transition-all duration-200 text-sm font-medium"
            >
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Tümünü Okundu İşaretle</span>
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-white border border-slate-200 text-slate-700 rounded-lg sm:rounded-xl hover:bg-slate-50 transition-all duration-200 text-sm font-medium"
            >
              <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Filtreler</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Toplam Bildirim</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900">{notifications.length}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Okunmamış</p>
                <p className="text-2xl sm:text-3xl font-bold text-red-600">
                  {notifications.filter(n => !n.isRead).length}
                </p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Bugün</p>
                <p className="text-2xl sm:text-3xl font-bold text-blue-600">
                  {notifications.filter(n => {
                    const today = new Date().toDateString();
                    return new Date(n.timestamp).toDateString() === today;
                  }).length}
                </p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Acil</p>
                <p className="text-2xl sm:text-3xl font-bold text-orange-600">
                  {notifications.filter(n => n.priority === 'urgent').length}
                </p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200 mb-6 sm:mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Bildirim ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm"
                />
              </div>
              
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm"
              >
                <option value="all">Tüm Türler</option>
                <option value="info">Bilgi</option>
                <option value="success">Başarı</option>
                <option value="warning">Uyarı</option>
                <option value="error">Hata</option>
              </select>
              
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm"
              >
                <option value="all">Tüm Kategoriler</option>
                <option value="job">İş</option>
                <option value="payment">Ödeme</option>
                <option value="system">Sistem</option>
                <option value="message">Mesaj</option>
                <option value="alert">Uyarı</option>
              </select>
              
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm"
              >
                <option value="all">Tüm Öncelikler</option>
                <option value="urgent">Acil</option>
                <option value="high">Yüksek</option>
                <option value="normal">Normal</option>
                <option value="low">Düşük</option>
              </select>
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('all');
                  setFilterCategory('all');
                  setFilterPriority('all');
                  setShowFilters(false);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all duration-200"
              >
                <RefreshCw className="w-4 h-4" />
                Filtreleri Temizle
              </button>
            </div>
          </div>
        )}

        {/* Notifications List */}
        {currentNotifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="Bildirim bulunamadı"
            description="Arama kriterlerinize uygun bildirim bulunamadı."
          />
        ) : (
          <div className="space-y-4">
            {currentNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-200 ${
                  !notification.isRead ? 'border-l-4 border-l-slate-800' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getTypeStyle(notification.type)}`}>
                    {getTypeIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-900 mb-1">
                          {notification.title}
                        </h3>
                        <p className="text-sm text-slate-600 mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityStyle(notification.priority)}`}>
                            {notification.priority === 'urgent' ? 'Acil' : 
                             notification.priority === 'high' ? 'Yüksek' : 
                             notification.priority === 'normal' ? 'Normal' : 'Düşük'}
                          </span>
                          <span className="px-2 py-1 bg-slate-100 text-slate-800 rounded-full text-xs font-medium">
                            {getCategoryText(notification.category)}
                          </span>
                          <span className="text-xs text-slate-500">
                            {formatTime(notification.timestamp)}
                          </span>
                        </div>
                        {notification.actionUrl && notification.actionText && (
                          <a
                            href={notification.actionUrl}
                            className="inline-flex items-center text-sm text-slate-800 hover:text-slate-900 font-medium"
                          >
                            {notification.actionText} →
                          </a>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        {!notification.isRead ? (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Okundu İşaretle"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleMarkAsUnread(notification.id)}
                            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Okunmadı İşaretle"
                          >
                            <Clock className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notification.id)}
                          className="p-2 text-red-600 hover:text-red-900 hover:bg-red-100 rounded-lg transition-colors"
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
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 sm:mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Success Message */}
      {showSuccessMessage && (
        <SuccessMessage
          message={successMessage}
          onClose={() => setShowSuccessMessage(false)}
          isVisible={showSuccessMessage}
        />
      )}
    </div>
  );
}