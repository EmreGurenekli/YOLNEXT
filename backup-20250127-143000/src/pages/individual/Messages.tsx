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
  AlertCircle
} from 'lucide-react';

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
      lastMessage: 'Gönderiniz Eskişehir\'e ulaştı. Tahmini teslimat 2 gün içinde.',
      lastMessageTime: '2024-01-22T15:00:00',
      unreadCount: 2,
      isOnline: true,
      messages: [
        {
          id: '1',
          from: 'Ahmet Kaya',
          fromType: 'carrier',
          message: 'Merhaba! Gönderiniz için teklif hazırladım.',
          timestamp: '2024-01-20T10:00:00',
          isRead: true,
          shipmentId: '1',
          shipmentTitle: 'Ev Eşyası Taşıma'
        },
        {
          id: '2',
          from: 'Siz',
          fromType: 'system',
          message: 'Teşekkürler, detayları inceleyeceğim.',
          timestamp: '2024-01-20T10:30:00',
          isRead: true,
          shipmentId: '1',
          shipmentTitle: 'Ev Eşyası Taşıma'
        },
        {
          id: '3',
          from: 'Ahmet Kaya',
          fromType: 'carrier',
          message: 'Gönderiniz Eskişehir\'e ulaştı. Tahmini teslimat 2 gün içinde.',
          timestamp: '2024-01-22T15:00:00',
          isRead: false,
          shipmentId: '1',
          shipmentTitle: 'Ev Eşyası Taşıma'
        }
      ]
    },
    {
      id: '2',
      carrierName: 'Mehmet Yılmaz',
      carrierCompany: 'Güvenli Taşıma',
      lastMessage: 'Gönderiniz başarıyla teslim edildi. Teşekkür ederiz.',
      lastMessageTime: '2024-01-17T11:35:00',
      unreadCount: 0,
      isOnline: false,
      messages: [
        {
          id: '1',
          from: 'Mehmet Yılmaz',
          fromType: 'carrier',
          message: 'Gönderiniz başarıyla teslim edildi. Teşekkür ederiz.',
          timestamp: '2024-01-17T11:35:00',
          isRead: true,
          shipmentId: '2',
          shipmentTitle: 'Ofis Mobilyası'
        }
      ]
    },
    {
      id: '3',
      carrierName: 'Fatma Demir',
      carrierCompany: 'Express Kargo',
      lastMessage: 'Teslimat adresini değiştirmek istiyorum.',
      lastMessageTime: '2024-01-22T16:30:00',
      unreadCount: 1,
      isOnline: true,
      messages: [
        {
          id: '1',
          from: 'Siz',
          fromType: 'system',
          message: 'Teslimat adresini değiştirmek istiyorum.',
          timestamp: '2024-01-22T16:30:00',
          isRead: true,
          shipmentId: '3',
          shipmentTitle: 'Kişisel Eşyalar'
        },
        {
          id: '2',
          from: 'Fatma Demir',
          fromType: 'carrier',
          message: 'Tabii, yeni adresi paylaşabilir misiniz?',
          timestamp: '2024-01-22T17:00:00',
          isRead: false,
          shipmentId: '3',
          shipmentTitle: 'Kişisel Eşyalar'
        }
      ]
    }
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setConversations(mockConversations);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const message: Message = {
      id: Date.now().toString(),
      from: 'Siz',
      fromType: 'system',
      message: newMessage,
      timestamp: new Date().toISOString(),
      isRead: true,
      shipmentId: selectedConversation.messages[0]?.shipmentId,
      shipmentTitle: selectedConversation.messages[0]?.shipmentTitle
    };

    setConversations(prev => prev.map(conv => 
      conv.id === selectedConversation.id 
        ? { ...conv, messages: [...conv.messages, message], lastMessage: message.message, lastMessageTime: message.timestamp }
        : conv
    ));

    setSelectedConversation(prev => prev ? { ...prev, messages: [...prev.messages, message] } : null);
    setNewMessage('');
  };

  const filteredConversations = conversations.filter(conv =>
    conv.carrierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.carrierCompany.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Mesajlar yükleniyor...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Helmet>
        <title>Mesajlar - YolNet</title>
        <meta name="description" content="Nakliyecilerle iletişim kurun" />
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Nakliyecilerle{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-indigo-700">
              İletişim
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Gönderileriniz hakkında nakliyecilerle mesajlaşın
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{conversations.length}</div>
                <div className="text-sm text-gray-600">Toplam Konuşma</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{conversations.filter(c => c.isOnline).length}</div>
                <div className="text-sm text-gray-600">Çevrimiçi</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{conversations.reduce((acc, c) => acc + c.unreadCount, 0)}</div>
                <div className="text-sm text-gray-600">Okunmamış</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Conversations List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              {/* Search */}
              <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Nakliyeci ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              </div>

              {/* Conversations */}
              <div className="max-h-96 overflow-y-auto">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation)}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedConversation?.id === conversation.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        {conversation.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900 truncate">{conversation.carrierName}</h3>
                          {conversation.unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 truncate">{conversation.carrierCompany}</p>
                        <p className="text-sm text-gray-500 truncate mt-1">{conversation.lastMessage}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(conversation.lastMessageTime).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2">
            {selectedConversation ? (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 h-96 flex flex-col">
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{selectedConversation.carrierName}</h3>
                        <p className="text-sm text-gray-600">{selectedConversation.carrierCompany}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                        <Phone className="w-4 h-4 text-gray-600" />
                      </button>
                      <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                        <Mail className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                  {selectedConversation.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.fromType === 'system' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.fromType === 'system'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.message}</p>
                        <p className={`text-xs mt-1 ${
                          message.fromType === 'system' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {new Date(message.timestamp).toLocaleTimeString('tr-TR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Mesajınızı yazın..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 h-96 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Konuşma Seçin</h3>
                  <p className="text-gray-600">Mesajlaşmak için sol taraftan bir konuşma seçin</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndividualMessages;