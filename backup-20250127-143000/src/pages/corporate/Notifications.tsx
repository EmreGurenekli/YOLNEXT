import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Bell, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info, 
  Package, 
  Truck, 
  DollarSign, 
  Star, 
  Clock, 
  MapPin, 
  Users, 
  Settings, 
  Trash2, 
  Archive, 
  Eye, 
  EyeOff,
  MoreVertical,
  CheckCheck,
  AlertCircle,
  TrendingUp,
  Shield,
  Calendar
} from 'lucide-react';

export default function CorporateNotifications() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedNotifications, setSelectedNotifications] = useState<number[]>([]);

  const handleMarkAsRead = (notificationId: number) => {
    console.log('Bildirim okundu işaretlendi:', notificationId);
  };

  const handleMarkAllAsRead = () => {
    console.log('Tüm bildirimler okundu işaretlendi');
  };

  const handleDeleteNotification = (notificationId: number) => {
    console.log('Bildirim silindi:', notificationId);
  };

  const handleDeleteAllNotifications = () => {
    if (confirm('Tüm bildirimleri silmek istediğinizden emin misiniz?')) {
      console.log('Tüm bildirimler silindi');
    }
  };

  const handleToggleSelection = (notificationId: number) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId) 
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const handleBulkAction = (action: string) => {
    console.log(`${action} işlemi:`, selectedNotifications);
  };

  // Mock data for notifications
  const notifications = [
    {
      id: 1,
      type: 'shipment',
      priority: 'high',
      title: 'Gönderi Yüklendi',
      message: 'CORP-2024-001 numaralı gönderiniz yüklendi ve yola çıktı. Tahmini teslimat: Yarın 09:00',
      time: '2 saat önce',
      isRead: false,
      icon: <Package className="w-5 h-5" />,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      actions: [
        { label: 'Detay', action: 'view' },
        { label: 'Takip Et', action: 'track' }
      ],
      metadata: {
        shipmentId: 'CORP-2024-001',
        carrier: 'Kargo Express A.Ş.',
        status: 'Yolda',
        estimatedDelivery: 'Yarın 09:00'
      }
    },
    {
      id: 2,
      type: 'offer',
      priority: 'medium',
      title: 'Yeni Teklif Geldi',
      message: 'Hızlı Lojistik, CORP-2024-002 numaralı gönderiniz için ₺2,500 teklif verdi.',
      time: '4 saat önce',
      isRead: false,
      icon: <DollarSign className="w-5 h-5" />,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      actions: [
        { label: 'Teklifi Gör', action: 'view_offer' },
        { label: 'Kabul Et', action: 'accept' },
        { label: 'Reddet', action: 'reject' }
      ],
      metadata: {
        shipmentId: 'CORP-2024-002',
        carrier: 'Hızlı Lojistik',
        offer: '₺2,500',
        rating: 4.7
      }
    },
    {
      id: 3,
      type: 'delivery',
      priority: 'high',
      title: 'Teslimat Tamamlandı',
      message: 'CORP-2024-003 numaralı gönderiniz başarıyla teslim edildi. Müşteri memnuniyeti: 5/5',
      time: '1 gün önce',
      isRead: true,
      icon: <CheckCircle className="w-5 h-5" />,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      actions: [
        { label: 'Detay', action: 'view' },
        { label: 'Değerlendir', action: 'rate' }
      ],
      metadata: {
        shipmentId: 'CORP-2024-003',
        carrier: 'Güvenli Taşımacılık',
        status: 'Teslim Edildi',
        rating: 5
      }
    },
    {
      id: 4,
      type: 'alert',
      priority: 'urgent',
      title: 'Gecikme Uyarısı',
      message: 'CORP-2024-004 numaralı gönderinizde gecikme yaşanıyor. Yeni tahmini teslimat: 2 gün sonra',
      time: '3 saat önce',
      isRead: false,
      icon: <AlertTriangle className="w-5 h-5" />,
      iconColor: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      actions: [
        { label: 'Detay', action: 'view' },
        { label: 'Nakliyeci Ara', action: 'call' },
        { label: 'Alternatif Ara', action: 'find_alternative' }
      ],
      metadata: {
        shipmentId: 'CORP-2024-004',
        carrier: 'Mega Kargo',
        status: 'Gecikme',
        delay: '2 gün'
      }
    },
    {
      id: 5,
      type: 'payment',
      priority: 'medium',
      title: 'Ödeme Onaylandı',
      message: 'CORP-2024-005 numaralı gönderi için ₺3,200 ödemeniz onaylandı ve nakliyeciye aktarıldı.',
      time: '6 saat önce',
      isRead: true,
      icon: <DollarSign className="w-5 h-5" />,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      actions: [
        { label: 'Fatura', action: 'invoice' },
        { label: 'Detay', action: 'view' }
      ],
      metadata: {
        shipmentId: 'CORP-2024-005',
        amount: '₺3,200',
        status: 'Ödendi'
      }
    },
    {
      id: 6,
      type: 'system',
      priority: 'low',
      title: 'Sistem Güncellemesi',
      message: 'YolNet platformu 2.1.0 sürümüne güncellendi. Yeni özellikler için yardım merkezini ziyaret edin.',
      time: '2 gün önce',
      isRead: true,
      icon: <Settings className="w-5 h-5" />,
      iconColor: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      actions: [
        { label: 'Yardım', action: 'help' },
        { label: 'Güncellemeler', action: 'updates' }
      ],
      metadata: {
        version: '2.1.0',
        type: 'Sistem Güncellemesi'
      }
    }
  ];

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || notification.type === filterType;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'unread' && !notification.isRead) ||
                         (filterStatus === 'read' && notification.isRead);
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'medium':
        return 'text-blue-600 bg-blue-100';
      case 'low':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'shipment':
        return <Package className="w-4 h-4" />;
      case 'offer':
        return <DollarSign className="w-4 h-4" />;
      case 'delivery':
        return <CheckCircle className="w-4 h-4" />;
      case 'alert':
        return <AlertTriangle className="w-4 h-4" />;
      case 'payment':
        return <DollarSign className="w-4 h-4" />;
      case 'system':
        return <Settings className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <>
      <Helmet>
        <title>Bildirimler - YolNet Kargo</title>
        <meta name="description" content="Kurumsal bildirim yönetimi" />
      </Helmet>

      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Bildirimler</h1>
              <p className="text-gray-600">Sistem bildirimlerinizi yönetin</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500">
                {unreadCount} okunmamış bildirim
              </div>
              <button 
                onClick={handleMarkAllAsRead}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <CheckCheck className="w-4 h-4" />
                Tümünü Okundu İşaretle
              </button>
              <button 
                onClick={handleDeleteAllNotifications}
                className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Tümünü Sil
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Bildirim ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Tüm Türler</option>
                <option value="shipment">Gönderi</option>
                <option value="offer">Teklif</option>
                <option value="delivery">Teslimat</option>
                <option value="alert">Uyarı</option>
                <option value="payment">Ödeme</option>
                <option value="system">Sistem</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Tüm Durumlar</option>
                <option value="unread">Okunmamış</option>
                <option value="read">Okunmuş</option>
              </select>

              <button className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                <Filter className="w-4 h-4" />
                Filtrele
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedNotifications.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-blue-900">
                  {selectedNotifications.length} bildirim seçildi
                </span>
                <button 
                  onClick={() => handleBulkAction('mark_read')}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Okundu İşaretle
                </button>
                <button 
                  onClick={() => handleBulkAction('delete')}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                >
                  Sil
                </button>
                <button 
                  onClick={() => handleBulkAction('archive')}
                  className="px-3 py-1 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Arşivle
                </button>
              </div>
              <button 
                onClick={() => setSelectedNotifications([])}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Seçimi Temizle
              </button>
            </div>
          </div>
        )}

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`bg-white rounded-xl shadow-sm border transition-all hover:shadow-md ${
                  notification.isRead ? 'border-gray-200' : 'border-blue-200 bg-blue-50/30'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedNotifications.includes(notification.id)}
                        onChange={() => handleToggleSelection(notification.id)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <div className={`w-12 h-12 rounded-xl ${notification.bgColor} ${notification.borderColor} border flex items-center justify-center`}>
                        <div className={notification.iconColor}>
                          {notification.icon}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <h3 className={`text-lg font-semibold ${
                            notification.isRead ? 'text-gray-900' : 'text-gray-900'
                          }`}>
                            {notification.title}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(notification.priority)}`}>
                            {notification.priority === 'urgent' ? 'Acil' :
                             notification.priority === 'high' ? 'Yüksek' :
                             notification.priority === 'medium' ? 'Orta' : 'Düşük'}
                          </span>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">{notification.time}</span>
                          <button className="p-1 text-gray-500 hover:text-gray-700">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 mb-4">{notification.message}</p>
                      
                      {/* Metadata */}
                      {notification.metadata && (
                        <div className="bg-gray-50 rounded-lg p-3 mb-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            {Object.entries(notification.metadata).map(([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="text-gray-500 capitalize">{key}:</span>
                                <span className="font-medium text-gray-900">{value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Actions */}
                      <div className="flex items-center gap-3">
                        {notification.actions.map((action, index) => (
                          <button
                            key={index}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            {action.label}
                          </button>
                        ))}
                        <button 
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          {notification.isRead ? 'Okundu' : 'Okundu İşaretle'}
                        </button>
                        <button 
                          onClick={() => handleDeleteNotification(notification.id)}
                          className="px-3 py-1 border border-red-300 text-red-700 text-sm rounded-lg hover:bg-red-50 transition-colors"
                        >
                          Sil
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Bildirim bulunamadı</h3>
              <p className="text-gray-500">Arama kriterlerinize uygun bildirim bulunamadı</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}



