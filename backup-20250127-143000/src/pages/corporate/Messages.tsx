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
  Forward
} from 'lucide-react';

export default function CorporateMessages() {
  const [selectedChat, setSelectedChat] = useState(1);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

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
        text: "Yeni gönderi teklifi var, inceleyebilir misiniz?",
        time: "16:20",
        isRead: false,
        sender: "carrier"
      },
      unreadCount: 1,
      shipment: {
        id: "CORP-2024-003",
        title: "Elektronik Ürünler",
        status: "Teklif Bekliyor",
        from: "Ankara",
        to: "İzmir"
      },
      messages: [
        {
          id: 1,
          text: "Yeni gönderi teklifi var, inceleyebilir misiniz?",
          time: "16:20",
          sender: "carrier",
          isRead: false
        }
      ]
    }
  ];

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.carrier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.shipment.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'unread' && conv.unreadCount > 0) ||
                         (filterStatus === 'online' && conv.carrier.status === 'online');
    
    return matchesSearch && matchesStatus;
  });

  const selectedConversation = conversations.find(conv => conv.id === selectedChat);

  return (
    <>
      <Helmet>
        <title>Mesajlar - YolNet Kargo</title>
        <meta name="description" content="Nakliyecilerle mesajlaşma sistemi" />
      </Helmet>

      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mesajlar</h1>
              <p className="text-gray-600">Nakliyecilerinizle iletişim kurun</p>
            </div>
            <div className="flex items-center gap-4">
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                <Archive className="w-4 h-4" />
                Arşivle
              </button>
              <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Yeni Mesaj
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Mesaj ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Tüm Mesajlar</option>
                <option value="unread">Okunmamış</option>
                <option value="online">Çevrimiçi</option>
              </select>

              <button className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                <Filter className="w-4 h-4" />
                Filtrele
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          {/* Conversations List */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Konuşmalar</h3>
            </div>
            <div className="overflow-y-auto h-[520px]">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedChat(conversation.id)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedChat === conversation.id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
                        {conversation.carrier.logo}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                        conversation.carrier.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                      }`}></div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-gray-900 truncate">{conversation.carrier.name}</h4>
                        <div className="flex items-center gap-2">
                          <Star className="w-3 h-3 text-yellow-400 fill-current" />
                          <span className="text-xs text-gray-500">{conversation.carrier.rating}</span>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-1 truncate">
                        {conversation.shipment.title}
                      </div>
                      
                      <div className="text-xs text-gray-500 mb-2">
                        {conversation.shipment.from} → {conversation.shipment.to}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className={`text-sm truncate ${
                          conversation.lastMessage.isRead ? 'text-gray-600' : 'text-gray-900 font-medium'
                        }`}>
                          {conversation.lastMessage.text}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">{conversation.lastMessage.time}</span>
                          {conversation.unreadCount > 0 && (
                            <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
                        {selectedConversation.carrier.logo}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{selectedConversation.carrier.name}</h3>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            selectedConversation.carrier.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                          }`}></div>
                          <span className="text-sm text-gray-500">{selectedConversation.carrier.lastSeen}</span>
                          <Star className="w-3 h-3 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-500">{selectedConversation.carrier.rating}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleCallCarrier(selectedConversation.carrier.id)}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleVideoCall(selectedConversation.carrier.id)}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Video className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Shipment Info */}
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-900">{selectedConversation.shipment.id}</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        selectedConversation.shipment.status === 'Yolda' ? 'bg-orange-100 text-orange-800' :
                        selectedConversation.shipment.status === 'Teslim Edildi' ? 'bg-green-100 text-green-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedConversation.shipment.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {selectedConversation.shipment.title} • {selectedConversation.shipment.from} → {selectedConversation.shipment.to}
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {selectedConversation.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] ${
                        message.sender === 'user' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-900'
                      } rounded-lg p-3`}>
                        <p className="text-sm">{message.text}</p>
                        <div className={`flex items-center gap-1 mt-1 ${
                          message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          <span className="text-xs">{message.time}</span>
                          {message.sender === 'user' && (
                            <CheckCircle className="w-3 h-3" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200">
                  <div className="flex items-center gap-3">
                    <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                      <Paperclip className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                      <Smile className="w-4 h-4" />
                    </button>
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Mesajınızı yazın..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12"
                      />
                      <button className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700">
                        <Mic className="w-4 h-4" />
                      </button>
                    </div>
                    <button 
                      onClick={handleSendMessage}
                      className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Konuşma Seçin</h3>
                  <p className="text-gray-500">Sol taraftan bir konuşma seçerek mesajlaşmaya başlayın</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}