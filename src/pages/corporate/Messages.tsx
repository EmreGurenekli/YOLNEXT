import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  MessageCircle, 
  Search, 
  Filter, 
  Send, 
  Phone, 
  Mail, 
  MoreVertical, 
  Star, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Paperclip,
  Smile,
  Mic,
  Video,
  PhoneCall,
  User,
  Building2,
  Truck,
  Package,
  MapPin,
  Calendar,
  Eye,
  Archive,
  Trash2,
  Pin,
  Reply,
  Forward,
  Bell,
  Settings,
  RefreshCw
} from 'lucide-react';

export default function CorporateMessages() {
  const [selectedChat, setSelectedChat] = useState(1);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      console.log('Mesaj gönderiliyor:', newMessage);
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCallCarrier = (carrierId: number) => {
    console.log('Nakliyeci aranıyor:', carrierId);
    window.open('tel:+905551234567');
  };

  const handleVideoCall = (carrierId: number) => {
    console.log('Video arama başlatılıyor:', carrierId);
    // Video arama implementasyonu
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 2000);
  };

  // Mock data for conversations
  const conversations = [
    {
      id: 1,
      carrier: {
        id: 1,
        name: "Kargo Express A.Ş.",
        logo: "KE",
        rating: 4.9,
        status: "online",
        lastSeen: "Şimdi çevrimiçi"
      },
      lastMessage: {
        text: "Gönderiniz yüklendi, yola çıktı. Tahmini teslimat: Yarın 09:00",
        time: "14:30",
        isRead: false,
        sender: "carrier"
      },
      unreadCount: 2,
      shipment: {
        id: "CORP-2024-001",
        title: "Gıda Ürünleri - Soğuk Zincir",
        status: "Yolda",
        from: "İstanbul",
        to: "Ankara"
      },
      messages: [
        {
          id: 1,
          text: "Merhaba, gönderiniz için teklifimiz hazır. Detayları paylaşabilir miyim?",
          time: "09:15",
          sender: "carrier",
          isRead: true
        },
        {
          id: 2,
          text: "Tabii, detayları bekliyorum.",
          time: "09:20",
          sender: "user",
          isRead: true
        },
        {
          id: 3,
          text: "Gönderiniz yüklendi, yola çıktı. Tahmini teslimat: Yarın 09:00",
          time: "14:30",
          sender: "carrier",
          isRead: false
        }
      ]
    },
    {
      id: 2,
      carrier: {
        id: 2,
        name: "Hızlı Lojistik",
        logo: "HL",
        rating: 4.7,
        status: "offline",
        lastSeen: "2 saat önce"
      },
      lastMessage: {
        text: "Teslimat tamamlandı. Teşekkürler!",
        time: "12:45",
        isRead: true,
        sender: "carrier"
      },
      unreadCount: 0,
      shipment: {
        id: "CORP-2024-002",
        title: "Tekstil Ürünleri",
        status: "Teslim Edildi",
        from: "İzmir",
        to: "Bursa"
      },
      messages: [
        {
          id: 1,
          text: "Teslimat tamamlandı. Teşekkürler!",
          time: "12:45",
          sender: "carrier",
          isRead: true
        }
      ]
    },
    {
      id: 3,
      carrier: {
        id: 3,
        name: "Güvenli Taşımacılık",
        logo: "GT",
        rating: 4.8,
        status: "online",
        lastSeen: "5 dakika önce"
      },
      lastMessage: {
        text: "Yeni teklifimiz hazır. İnceleyebilir misiniz?",
        time: "11:20",
        isRead: false,
        sender: "carrier"
      },
      unreadCount: 1,
      shipment: {
        id: "CORP-2024-003",
        title: "Elektronik Ürünler",
        status: "Teklif Bekliyor",
        from: "Ankara",
        to: "İstanbul"
      },
      messages: [
        {
          id: 1,
          text: "Yeni teklifimiz hazır. İnceleyebilir misiniz?",
          time: "11:20",
          sender: "carrier",
          isRead: false
        }
      ]
    }
  ];

  const selectedConversation = conversations.find(conv => conv.id === selectedChat);

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.carrier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.shipment.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'unread' && conv.unreadCount > 0) ||
                         (filterStatus === 'online' && conv.carrier.status === 'online');
    return matchesSearch && matchesFilter;
  });

  return (
    <>
      <Helmet>
        <title>Mesajlar - YolNet Kurumsal</title>
        <meta name="description" content="Nakliyecilerle iletişim kurun ve mesajlaşın" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Professional Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-slate-800 to-blue-900 rounded-3xl flex items-center justify-center shadow-2xl">
                <MessageCircle className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-4">
              Mesajlar{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-blue-900">& İletişim</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Nakliyecilerinizle profesyonel iletişim kurun ve gönderilerinizi takip edin
            </p>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            {/* Professional Action Bar */}
            <div className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200 px-8 py-6">
              <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
                <div className="flex items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Mesaj Merkezi</h2>
                    <p className="text-slate-600">Nakliyecilerinizle gerçek zamanlı iletişim</p>
                  </div>
                  <div className="hidden lg:block w-px h-12 bg-slate-300"></div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Clock className="w-4 h-4" />
                    Son güncelleme: {new Date().toLocaleString('tr-TR')}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-slate-700">Filtre:</label>
                    <select 
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      <option value="all">Tüm Mesajlar</option>
                      <option value="unread">Okunmamış</option>
                      <option value="online">Çevrimiçi</option>
                    </select>
                  </div>
                  
                  <button 
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Yenile
                  </button>
                  
                  <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors">
                    <Settings className="w-4 h-4" />
                    Ayarlar
                  </button>
                </div>
              </div>
            </div>

            <div className="flex h-[600px]">
              {/* Conversations List */}
              <div className="w-1/3 border-r border-slate-200 bg-slate-50">
                {/* Search Bar */}
                <div className="p-4 border-b border-slate-200">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Nakliyeci veya gönderi ara..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
                    />
                  </div>
                </div>

                {/* Conversations */}
                <div className="flex-1 overflow-y-auto">
                  {filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => setSelectedChat(conversation.id)}
                      className={`p-4 border-b border-slate-200 cursor-pointer transition-all hover:bg-white ${
                        selectedChat === conversation.id ? 'bg-white border-r-4 border-r-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                            {conversation.carrier.logo}
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                            conversation.carrier.status === 'online' ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}></div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-slate-900 truncate">{conversation.carrier.name}</h3>
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-amber-500" />
                              <span className="text-xs text-slate-500">{conversation.carrier.rating}</span>
                            </div>
                          </div>
                          
                          <div className="text-sm text-slate-600 mb-2 truncate">
                            {conversation.shipment.title}
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              conversation.shipment.status === 'Yolda' ? 'bg-blue-100 text-blue-700' :
                              conversation.shipment.status === 'Teslim Edildi' ? 'bg-emerald-100 text-emerald-700' :
                              'bg-orange-100 text-orange-700'
                            }`}>
                              {conversation.shipment.status}
                            </span>
                            <span className="text-xs text-slate-500">{conversation.lastMessage.time}</span>
                          </div>
                          
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-sm text-slate-600 truncate flex-1">
                              {conversation.lastMessage.text}
                            </p>
                            {conversation.unreadCount > 0 && (
                              <div className="w-5 h-5 bg-gradient-to-r from-slate-800 to-blue-900 text-white text-xs rounded-full flex items-center justify-center ml-2">
                                {conversation.unreadCount}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 flex flex-col">
                {selectedConversation ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-6 border-b border-slate-200 bg-white">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                              {selectedConversation.carrier.logo}
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                              selectedConversation.carrier.status === 'online' ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}></div>
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-slate-900">{selectedConversation.carrier.name}</h3>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-amber-500" />
                                <span className="text-sm text-slate-600">{selectedConversation.carrier.rating}</span>
                              </div>
                              <span className="text-sm text-slate-500">•</span>
                              <span className="text-sm text-slate-500">{selectedConversation.carrier.lastSeen}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCallCarrier(selectedConversation.carrier.id)}
                            className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Phone className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleVideoCall(selectedConversation.carrier.id)}
                            className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Video className="w-5 h-5" />
                          </button>
                          <button className="p-2 text-slate-600 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                            <MoreVertical className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Shipment Info */}
                      <div className="mt-4 p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-slate-900">{selectedConversation.shipment.title}</h4>
                            <div className="flex items-center gap-4 mt-1">
                              <div className="flex items-center gap-1 text-sm text-slate-600">
                                <MapPin className="w-4 h-4" />
                                {selectedConversation.shipment.from} → {selectedConversation.shipment.to}
                              </div>
                              <div className="flex items-center gap-1 text-sm text-slate-600">
                                <Package className="w-4 h-4" />
                                {selectedConversation.shipment.id}
                              </div>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            selectedConversation.shipment.status === 'Yolda' ? 'bg-blue-100 text-blue-700' :
                            selectedConversation.shipment.status === 'Teslim Edildi' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {selectedConversation.shipment.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                      <div className="space-y-4">
                        {selectedConversation.messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                              message.sender === 'user'
                                ? 'bg-gradient-to-r from-slate-800 to-blue-900 text-white'
                                : 'bg-white text-slate-900 border border-slate-200 shadow-sm'
                            }`}>
                              <p className="text-sm">{message.text}</p>
                              <div className={`flex items-center justify-between mt-2 text-xs ${
                                message.sender === 'user' ? 'text-blue-100' : 'text-slate-500'
                              }`}>
                                <span>{message.time}</span>
                                {message.sender === 'user' && (
                                  <div className="flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    {message.isRead && <CheckCircle className="w-3 h-3 -ml-1" />}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Message Input */}
                    <div className="p-6 border-t border-slate-200 bg-white">
                      <div className="flex items-end gap-3">
                        <button className="p-2 text-slate-600 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                          <Paperclip className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-slate-600 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                          <Smile className="w-5 h-5" />
                        </button>
                        
                        <div className="flex-1 relative">
                          <textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Mesajınızı yazın..."
                            className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white"
                            rows={1}
                          />
                          <button className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-slate-600 hover:text-slate-700">
                            <Mic className="w-5 h-5" />
                          </button>
                        </div>
                        
                        <button
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim()}
                          className="p-3 bg-gradient-to-r from-slate-800 to-blue-900 text-white rounded-xl hover:from-slate-900 hover:to-blue-950 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                        >
                          <Send className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center bg-slate-50">
                    <div className="text-center">
                      <MessageCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-slate-600 mb-2">Mesaj Seçin</h3>
                      <p className="text-slate-500">Görüntülemek istediğiniz konuşmayı seçin</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}