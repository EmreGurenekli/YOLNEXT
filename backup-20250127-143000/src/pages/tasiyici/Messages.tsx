import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  MessageCircle, 
  Search, 
  Phone, 
  Video, 
  Send, 
  Paperclip, 
  MoreVertical,
  Star,
  Clock,
  CheckCircle,
  User
} from 'lucide-react';

export default function TasiyiciMessages() {
  const [selectedChat, setSelectedChat] = useState(1);
  const [newMessage, setNewMessage] = useState('');

  // Mesaj konuşmaları
  const conversations = [
    {
      id: 1,
      customer: "Ahmet Bey",
      lastMessage: "Teşekkürler, çok memnun kaldım!",
      time: "2 saat önce",
      unread: 0,
      avatar: "AB",
      rating: 5,
      jobTitle: "Ev Eşyaları Taşıma"
    },
    {
      id: 2,
      customer: "ABC Şirketi",
      lastMessage: "Yarın sabah 9'da geleceksiniz değil mi?",
      time: "4 saat önce",
      unread: 2,
      avatar: "AS",
      rating: 4,
      jobTitle: "Ofis Malzemeleri"
    },
    {
      id: 3,
      customer: "DEF Fabrikası",
      lastMessage: "Teslimat adresini gönderiyorum",
      time: "1 gün önce",
      unread: 1,
      avatar: "DF",
      rating: 4,
      jobTitle: "Hammade Taşıma"
    },
    {
      id: 4,
      customer: "Mehmet Bey",
      lastMessage: "İyi yolculuklar!",
      time: "2 gün önce",
      unread: 0,
      avatar: "MB",
      rating: 5,
      jobTitle: "Ev Eşyaları - 2+1"
    }
  ];

  // Seçili konuşmanın mesajları
  const messages = [
    {
      id: 1,
      sender: "customer",
      message: "Merhaba, ev eşyalarımı taşımak istiyorum.",
      time: "10:30",
      isRead: true
    },
    {
      id: 2,
      sender: "driver",
      message: "Merhaba! Hangi bölgeler arasında taşıma yapacağız?",
      time: "10:32",
      isRead: true
    },
    {
      id: 3,
      sender: "customer",
      message: "Kadıköy'den Çankaya'ya. 2+1 daire eşyaları.",
      time: "10:35",
      isRead: true
    },
    {
      id: 4,
      sender: "driver",
      message: "Anladım. Ne zaman taşımak istiyorsunuz?",
      time: "10:36",
      isRead: true
    },
    {
      id: 5,
      sender: "customer",
      message: "Yarın sabah 9'da başlayabilir miyiz?",
      time: "10:38",
      isRead: true
    },
    {
      id: 6,
      sender: "driver",
      message: "Tabii ki! Yarın sabah 9'da Kadıköy'de olacağım.",
      time: "10:40",
      isRead: true
    },
    {
      id: 7,
      sender: "customer",
      message: "Teşekkürler, çok memnun kaldım!",
      time: "14:30",
      isRead: true
    }
  ];

  const selectedConversation = conversations.find(conv => conv.id === selectedChat);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      console.log('Mesaj gönderildi:', newMessage);
      setNewMessage('');
    }
  };

  const handleCall = (customer: string) => {
    console.log('Arama başlatılıyor:', customer);
    alert(`${customer} aranıyor...`);
  };

  const handleVideoCall = (customer: string) => {
    console.log('Video arama başlatılıyor:', customer);
    alert(`${customer} ile video arama başlatılıyor...`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Mesajlar - Taşıyıcı Panel</title>
      </Helmet>

      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mesajlar</h1>
          <p className="text-gray-600">Müşterilerinizle iletişim kurun</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-[600px] flex">
          {/* Konuşma Listesi */}
          <div className="w-1/3 border-r border-gray-200 flex flex-col">
            {/* Arama */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Konuşma ara..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Konuşma Listesi */}
            <div className="flex-1 overflow-y-auto">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedChat(conversation.id)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                    selectedChat === conversation.id ? 'bg-green-50 border-l-4 border-l-green-500' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {conversation.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 truncate">{conversation.customer}</h3>
                        <div className="flex items-center space-x-2">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm text-gray-600">{conversation.rating}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{conversation.jobTitle}</p>
                      <p className="text-sm text-gray-500 truncate">{conversation.lastMessage}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-500">{conversation.time}</span>
                        {conversation.unread > 0 && (
                          <span className="bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {conversation.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mesaj Alanı */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Mesaj Başlığı */}
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {selectedConversation.avatar}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{selectedConversation.customer}</h3>
                        <p className="text-sm text-gray-600">{selectedConversation.jobTitle}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleCall(selectedConversation.customer)}
                        className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                        title="Ara"
                      >
                        <Phone className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleVideoCall(selectedConversation.customer)}
                        className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                        title="Video Ara"
                      >
                        <Video className="w-5 h-5" />
                      </button>
                      <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Mesajlar */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'driver' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender === 'driver'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.message}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className={`text-xs ${
                            message.sender === 'driver' ? 'text-green-100' : 'text-gray-500'
                          }`}>
                            {message.time}
                          </span>
                          {message.sender === 'driver' && message.isRead && (
                            <CheckCircle className="w-3 h-3 text-green-100" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Mesaj Gönderme */}
                <div className="p-4 border-t border-gray-200">
                  <div className="flex items-center space-x-3">
                    <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                      <Paperclip className="w-5 h-5" />
                    </button>
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Mesajınızı yazın..."
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <button
                      onClick={handleSendMessage}
                      className="p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Konuşma Seçin</h3>
                  <p className="text-gray-600">Mesajlaşmak istediğiniz müşteriyi seçin</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* İletişim İpuçları */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start space-x-4">
            <MessageCircle className="w-6 h-6 text-blue-600 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">İletişim İpuçları</h3>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>• Müşterilerle profesyonel ve nazik bir dil kullanın</li>
                <li>• Mesajlara hızlı yanıt verin</li>
                <li>• Sorunları çözmek için sabırlı olun</li>
                <li>• Müşteri memnuniyetini öncelikli tutun</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}