import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Bell, 
  Search, 
  Filter, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  X, 
  Archive,
  Trash2,
  Clock,
  DollarSign,
  Truck,
  Package
} from 'lucide-react';

export default function NakliyeciNotifications() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const notifications = [
    {
      id: 1,
      type: 'offer',
      title: 'Yeni Teklif Talebi',
      message: 'Ev Eşyaları taşıma işi için teklif talebi geldi.',
      time: '2 dakika önce',
      isRead: false,
      priority: 'high'
    },
    {
      id: 2,
      type: 'commission',
      title: 'Komisyon Kesildi',
      message: 'Gönderi #1234 için 38₺ komisyon cüzdanınızdan kesildi.',
      time: '15 dakika önce',
      isRead: false,
      priority: 'medium'
    },
    {
      id: 3,
      type: 'vehicle',
      title: 'Araç Optimizasyon Önerisi',
      message: 'Kamyon #001 için 3 ek yük önerisi mevcut.',
      time: '1 saat önce',
      isRead: true,
      priority: 'low'
    },
    {
      id: 4,
      type: 'system',
      title: 'Sistem Güncellemesi',
      message: 'Yeni araç optimizasyon özellikleri eklendi.',
      time: '3 saat önce',
      isRead: true,
      priority: 'low'
    }
  ];

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || notification.type === filterType;
    
    return matchesSearch && matchesType;
  });

  const handleMarkAsRead = (id: number) => {
    console.log('Bildirim okundu olarak işaretlendi:', id);
  };

  const handleDelete = (id: number) => {
    console.log('Bildirim silindi:', id);
  };

  const handleArchive = (id: number) => {
    console.log('Bildirim arşivlendi:', id);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'offer': return <DollarSign className="w-5 h-5 text-blue-600" />;
      case 'commission': return <Package className="w-5 h-5 text-green-600" />;
      case 'vehicle': return <Truck className="w-5 h-5 text-purple-600" />;
      case 'system': return <Info className="w-5 h-5 text-gray-600" />;
      default: return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-green-500';
      default: return 'border-l-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Bildirimler - Nakliyeci Panel</title>
      </Helmet>

      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bildirimler</h1>
          <p className="text-gray-600">Sistem bildirimleri ve güncellemeler</p>
        </div>

        {/* Filtreler */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Bildirim ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tüm Bildirimler</option>
              <option value="offer">Teklif</option>
              <option value="commission">Komisyon</option>
              <option value="vehicle">Araç</option>
              <option value="system">Sistem</option>
            </select>

            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center">
              <Filter className="w-5 h-5 mr-2" />
              Filtrele
            </button>
          </div>
        </div>

        {/* Bildirim Listesi */}
        <div className="space-y-4">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow border-l-4 ${getPriorityColor(notification.priority)} ${
                !notification.isRead ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                      {!notification.isRead && (
                        <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                      )}
                    </div>
                    
                    <p className="text-gray-600 mb-3">{notification.message}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {notification.time}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {!notification.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                      title="Okundu olarak işaretle"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleArchive(notification.id)}
                    className="p-2 text-gray-400 hover:text-yellow-600 transition-colors"
                    title="Arşivle"
                  >
                    <Archive className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={() => handleDelete(notification.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="Sil"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Boş Durum */}
        {filteredNotifications.length === 0 && (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Bildirim bulunamadı</h3>
            <p className="text-gray-600 mb-6">Arama kriterlerinize uygun bildirim bulunmuyor.</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterType('all');
              }}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Filtreleri Temizle
            </button>
          </div>
        )}
      </div>
    </div>
  );
}







