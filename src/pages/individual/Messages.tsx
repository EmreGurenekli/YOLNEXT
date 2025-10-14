import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  MessageSquare, 
  Send, 
  User, 
  Search,
  Plus,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
  Truck,
  Package,
  Bell
} from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import Modal from '../../components/common/Modal';
import SuccessMessage from '../../components/common/SuccessMessage';

interface Message {
  id: string;
  from: string;
  fromType: 'carrier' | 'system';
  message: string;
  timestamp: string;
  isRead: boolean;
  shipmentId?: string;
  shipmentTitle?: string;
}

interface Conversation {
  id: string;
  carrierName: string;
  carrierCompany: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
  messages: Message[];
}

const IndividualMessages: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data
  const mockConversations: Conversation[] = [
    {
      id: '1',
      carrierName: 'Ahmet Kaya',
      carrierCompany: 'Hızlı Nakliyat',
      lastMessage: 'Gönderiniz yola çıktı, takip edebilirsiniz.',
      lastMessageTime: '10:30',
      unreadCount: 2,
      isOnline: true,
      messages: [
        {
          id: '1',
          from: 'Ahmet Kaya',
          fromType: 'carrier',
          message: 'Merhaba, gönderiniz için teklif hazırladım.',
          timestamp: '09:15',
          isRead: true,
          shipmentId: 'IND-001',
          shipmentTitle: 'Elektronik Eşya Gönderisi'
        },
        {
          id: '2',
          from: 'Ahmet Kaya',
          fromType: 'carrier',
          message: 'Gönderiniz yola çıktı, takip edebilirsiniz.',
          timestamp: '10:30',
          isRead: false,
          shipmentId: 'IND-001',
          shipmentTitle: 'Elektronik Eşya Gönderisi'
        }
      ]
    },
    {
      id: '2',
      carrierName: 'Mehmet Öz',
      carrierCompany: 'Güven Kargo',
      lastMessage: 'Teslimat adresini onaylayabilir misiniz?',
      lastMessageTime: '14:20',
      unreadCount: 0,
      isOnline: false,
      messages: [
        {
          id: '3',
          from: 'Mehmet Öz',
          fromType: 'carrier',
          message: 'Teslimat adresini onaylayabilir misiniz?',
          timestamp: '14:20',
          isRead: true,
          shipmentId: 'IND-002',
          shipmentTitle: 'Doküman Gönderisi'
        }
      ]
    },
    {
      id: '3',
      carrierName: 'Sistem',
      carrierCompany: 'YolNet',
      lastMessage: 'Gönderiniz teslim edildi.',
      lastMessageTime: '16:45',
      unreadCount: 1,
      isOnline: true,
      messages: [
        {
          id: '4',
          from: 'Sistem',
          fromType: 'system',
          message: 'Gönderiniz teslim edildi.',
          timestamp: '16:45',
          isRead: false,
          shipmentId: 'IND-003',
          shipmentTitle: 'Kıyafet Gönderisi'
        }
      ]
    }
  ];

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setConversations(mockConversations);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredConversations = conversations.filter(conv =>
    conv.carrierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.carrierCompany.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedConversation) {
    const message: Message = {
      id: Date.now().toString(),
      from: 'Siz',
        fromType: 'carrier',
      message: newMessage,
        timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        isRead: true
    };

    setConversations(prev => prev.map(conv => 
      conv.id === selectedConversation.id 
          ? {
              ...conv,
              messages: [...conv.messages, message],
              lastMessage: message.message,
              lastMessageTime: message.timestamp
            }
        : conv
    ));

    setNewMessage('');
    }
  };

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    // Mark messages as read
    setConversations(prev => prev.map(conv => 
      conv.id === conversation.id 
        ? { ...conv, unreadCount: 0, messages: conv.messages.map(msg => ({ ...msg, isRead: true })) }
        : conv
    ));
  };

  const breadcrumbItems = [
    { label: 'Mesajlar', icon: <MessageSquare className="w-4 h-4" /> }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <LoadingState text="Mesajlar yükleniyor..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Helmet>
        <title>Mesajlar - YolNet Bireysel</title>
        <meta name="description" content="Bireysel gönderici mesajları - nakliyeci ve sistem mesajlarını görüntüleyin" />
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
              <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-2 sm:mb-3">
            Mesajlarınız{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-blue-900">Merkezi</span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-slate-600 px-4">Nakliyeci ve sistem mesajlarınızı takip edin</p>
        </div>

        {/* Stats Cards - Mobile Optimized */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-slate-600">Toplam Mesaj</p>
                <p className="text-lg sm:text-xl font-bold text-slate-900">
                  {conversations.reduce((sum, conv) => sum + conv.messages.length, 0)}
                </p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
            </div>
        </div>

          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-slate-600">Okunmamış</p>
                <p className="text-lg sm:text-xl font-bold text-slate-900">
                  {conversations.reduce((sum, conv) => sum + conv.unreadCount, 0)}
                </p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-slate-600">Aktif Sohbet</p>
                <p className="text-lg sm:text-xl font-bold text-slate-900">
                  {conversations.filter(conv => conv.isOnline).length}
                </p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-slate-600">Nakliyeci</p>
                <p className="text-lg sm:text-xl font-bold text-slate-900">
                  {conversations.filter(conv => conv.carrierName !== 'Sistem').length}
                </p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Search - Mobile Optimized */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4 sm:p-6 mb-6 sm:mb-8">
                <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
              placeholder="Nakliyeci veya mesaj ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-slate-50 focus:bg-white transition-colors"
                  />
                </div>
              </div>

        {/* Messages Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-slate-200">
                <h3 className="text-lg font-medium text-slate-900">Sohbetler</h3>
              </div>
              <div className="max-h-96 lg:max-h-[600px] overflow-y-auto">
                {filteredConversations.length === 0 ? (
                  <div className="p-4 text-center text-slate-500">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                    <p>Mesaj bulunamadı</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200">
                {filteredConversations.map((conversation) => (
                      <button
                    key={conversation.id}
                        onClick={() => handleConversationSelect(conversation)}
                        className={`w-full p-4 text-left hover:bg-slate-50 transition-colors ${
                          selectedConversation?.id === conversation.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                      <div className="relative">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                              {conversation.carrierName === 'Sistem' ? (
                                <Package className="w-5 h-5 text-white" />
                              ) : (
                                <Truck className="w-5 h-5 text-white" />
                              )}
                        </div>
                        {conversation.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                              <h4 className="text-sm font-medium text-slate-900 truncate">
                                {conversation.carrierName}
                              </h4>
                          {conversation.unreadCount > 0 && (
                                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-red-500 rounded-full">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                            <p className="text-xs text-slate-500 truncate">
                              {conversation.carrierCompany}
                            </p>
                            <p className="text-sm text-slate-600 truncate mt-1">
                              {conversation.lastMessage}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              {conversation.lastMessageTime}
                        </p>
                      </div>
                    </div>
                      </button>
                ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2">
            {selectedConversation ? (
              <div className="bg-white rounded-xl shadow-lg border border-slate-200 h-96 lg:h-[600px] flex flex-col">
                {/* Chat Header */}
                <div className="p-4 sm:p-6 border-b border-slate-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                      {selectedConversation.carrierName === 'Sistem' ? (
                        <Package className="w-5 h-5 text-white" />
                      ) : (
                        <Truck className="w-5 h-5 text-white" />
                      )}
                      </div>
                      <div>
                      <h3 className="text-lg font-medium text-slate-900">
                        {selectedConversation.carrierName}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {selectedConversation.carrierCompany}
                      </p>
                      </div>
                    {selectedConversation.isOnline && (
                      <div className="flex items-center text-sm text-green-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Çevrimiçi
                    </div>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                  {selectedConversation.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.from === 'Siz' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.from === 'Siz'
                            ? 'bg-blue-600 text-white'
                            : message.fromType === 'system'
                            ? 'bg-slate-100 text-slate-900'
                            : 'bg-slate-200 text-slate-900'
                        }`}
                      >
                        <p className="text-sm">{message.message}</p>
                        <p className={`text-xs mt-1 ${
                          message.from === 'Siz' ? 'text-blue-100' : 'text-slate-500'
                        }`}>
                          {message.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="p-4 sm:p-6 border-t border-slate-200">
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Mesajınızı yazın..."
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg border border-slate-200 h-96 lg:h-[600px] flex items-center justify-center">
                <EmptyState
                  icon={<MessageSquare className="w-8 h-8 text-slate-400" />}
                  title="Sohbet Seçin"
                  description="Bir sohbet seçerek mesajlaşmaya başlayın"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndividualMessages;