import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  MessageSquare, 
  Search, 
  Send, 
  MoreVertical,
  Phone,
  Video,
  Paperclip,
  Smile,
  Clock,
  CheckCircle,
  CheckCircle2,
  User,
  BarChart3,
  Filter,
  RefreshCw
} from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import Modal from '../../components/common/Modal';
import SuccessMessage from '../../components/common/SuccessMessage';

interface Message {
  id: number;
  sender: string;
  senderType: 'client' | 'admin' | 'system';
  message: string;
  timestamp: string;
  isRead: boolean;
  isDelivered: boolean;
  attachments?: {
    name: string;
    type: string;
    size: string;
  }[];
}

interface Conversation {
  id: number;
  participant: string;
  participantType: 'client' | 'admin';
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
  avatar: string;
  status: 'active' | 'archived' | 'blocked';
}

const generateMockConversations = (count: number): Conversation[] => {
  const participants = ['TechCorp A.Ş.', 'E-Ticaret Ltd.', 'Gıda A.Ş.', 'Lojistik Pro', 'Hızlı Kargo', 'Mega Nakliyat'];
  const messages = [
    'Merhaba, iş hakkında konuşalım',
    'Teslimat zamanı hakkında bilgi alabilir miyim?',
    'Fiyat teklifiniz nedir?',
    'Teşekkürler, görüşürüz',
    'Yarın sabah teslim edebilir misiniz?'
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    participant: participants[Math.floor(Math.random() * participants.length)],
    participantType: Math.random() > 0.5 ? 'client' : 'admin',
    lastMessage: messages[Math.floor(Math.random() * messages.length)],
    lastMessageTime: `2024-01-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')} ${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
    unreadCount: Math.floor(Math.random() * 5),
    isOnline: Math.random() > 0.5,
    avatar: `https://ui-avatars.com/api/?name=${participants[Math.floor(Math.random() * participants.length)]}&background=random`,
    status: 'active'
  }));
};

const generateMockMessages = (conversationId: number): Message[] => {
  const messages = [
    'Merhaba, iş hakkında konuşalım',
    'Teslimat zamanı hakkında bilgi alabilir miyim?',
    'Fiyat teklifiniz nedir?',
    'Teşekkürler, görüşürüz',
    'Yarın sabah teslim edebilir misiniz?',
    'Evet, sabah 8:00\'da başlayabilirim',
    'Mükemmel, o zaman görüşürüz',
    'İyi günler'
  ];

  return Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    sender: i % 2 === 0 ? 'Siz' : 'Müşteri',
    senderType: i % 2 === 0 ? 'client' : 'admin',
    message: messages[Math.floor(Math.random() * messages.length)],
    timestamp: `2024-01-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')} ${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
    isRead: i % 3 === 0,
    isDelivered: i % 2 === 0,
    attachments: Math.random() > 0.8 ? [{
      name: 'dokuman.pdf',
      type: 'PDF',
      size: '2.5 MB'
    }] : undefined
  }));
};

export default function TasiyiciMessages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setConversations(generateMockConversations(8));
      setIsLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      setMessages(generateMockMessages(selectedConversation.id));
    }
  }, [selectedConversation]);

  const breadcrumbItems = [
    { label: 'Ana Sayfa', icon: <BarChart3 className="w-4 h-4" />, href: '/tasiyici/dashboard' },
    { label: 'Mesajlar', icon: <MessageSquare className="w-4 h-4" /> }
  ];

  const filteredConversations = conversations.filter(conv => 
    conv.participant.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message: Message = {
        id: messages.length + 1,
        sender: 'Siz',
        senderType: 'client',
        message: newMessage,
        timestamp: new Date().toLocaleString('tr-TR'),
        isRead: true,
        isDelivered: false
      };
      setMessages([...messages, message]);
      setNewMessage('');
      setSuccessMessage('Mesaj gönderildi');
      setShowSuccessMessage(true);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('tr-TR');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <LoadingState text="Mesajlar yükleniyor..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-50">
      <Helmet>
        <title>Mesajlar - Taşıyıcı Panel - YolNet</title>
        <meta name="description" content="Taşıyıcı mesaj yönetimi" />
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
              <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Mesajlar</h1>
              <p className="text-sm text-slate-600">Müşterilerle iletişim kurun</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-white border border-slate-200 text-slate-700 rounded-lg sm:rounded-xl hover:bg-slate-50 transition-all duration-200 text-sm font-medium"
            >
              <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Filtreler</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-slate-200">
              <div className="p-4 border-b border-slate-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Konuşma ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm"
                  />
                </div>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                  <EmptyState
                    icon={MessageSquare}
                    title="Konuşma bulunamadı"
                    description="Arama kriterlerinize uygun konuşma bulunamadı."
                  />
                ) : (
                  <div className="space-y-1">
                    {filteredConversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        onClick={() => setSelectedConversation(conversation)}
                        className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors ${
                          selectedConversation?.id === conversation.id ? 'bg-slate-100 border-r-2 border-slate-800' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-slate-600" />
                            </div>
                            {conversation.isOnline && (
                              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-medium text-slate-900 truncate">
                                {conversation.participant}
                              </h3>
                              <span className="text-xs text-slate-500">
                                {formatTime(conversation.lastMessageTime)}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 truncate">
                              {conversation.lastMessage}
                            </p>
                            {conversation.unreadCount > 0 && (
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-xs text-slate-500">
                                  {conversation.participantType === 'client' ? 'Müşteri' : 'Admin'}
                                </span>
                                <span className="bg-slate-800 text-white text-xs rounded-full px-2 py-1">
                                  {conversation.unreadCount}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2">
            {selectedConversation ? (
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-slate-200 flex flex-col h-96">
                {/* Chat Header */}
                <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-slate-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900">{selectedConversation.participant}</h3>
                      <p className="text-sm text-slate-600">
                        {selectedConversation.isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                      <Phone className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                      <Video className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'Siz' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender === 'Siz'
                            ? 'bg-slate-800 text-white'
                            : 'bg-slate-100 text-slate-900'
                        }`}
                      >
                        <p className="text-sm">{message.message}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs opacity-70">
                            {formatTime(message.timestamp)}
                          </span>
                          {message.sender === 'Siz' && (
                            <div className="flex items-center gap-1">
                              {message.isDelivered && (
                                <CheckCircle2 className="w-3 h-3" />
                              )}
                              {message.isRead && (
                                <CheckCircle2 className="w-3 h-3 text-blue-400" />
                              )}
                            </div>
                          )}
                        </div>
                        {message.attachments && (
                          <div className="mt-2 p-2 bg-white bg-opacity-20 rounded">
                            <div className="flex items-center gap-2">
                              <Paperclip className="w-3 h-3" />
                              <span className="text-xs">{message.attachments[0].name}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-slate-200">
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                      <Paperclip className="w-4 h-4" />
                    </button>
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Mesajınızı yazın..."
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm"
                      />
                    </div>
                    <button className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                      <Smile className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleSendMessage}
                      className="p-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-slate-200 h-96 flex items-center justify-center">
                <EmptyState
                  icon={MessageSquare}
                  title="Konuşma seçin"
                  description="Bir konuşma seçerek mesajlaşmaya başlayın."
                />
              </div>
            )}
          </div>
        </div>
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