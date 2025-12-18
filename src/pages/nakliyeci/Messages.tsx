import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  MessageSquare,
  Search,
  Send,
  MoreVertical,
  Video,
  Paperclip,
  Smile,
  Clock,
  CheckCircle,
  CheckCircle2,
  User,
  BarChart3,
  Filter,
  RefreshCw,
} from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import Modal from '../../components/common/Modal';
import SuccessMessage from '../../components/common/SuccessMessage';
import Pagination from '../../components/common/Pagination';
import { createApiUrl } from '../../config/api';
import { formatDateTime } from '../../utils/format';

interface Message {
  id: number;
  sender: string;
  senderType: 'client' | 'admin' | 'system' | 'carrier';
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
  participantType?: 'client' | 'admin' | 'carrier' | 'individual' | 'corporate' | 'tasiyici';
  participantId?: number;
  participantPhone?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
  avatar: string;
  status: 'active' | 'archived' | 'blocked';
}

export default function NakliyeciMessages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    limit: 20,
  });

  // Load conversations from API
  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const userRaw = localStorage.getItem('user');
      const currentUserId = userRaw ? JSON.parse(userRaw || '{}').id : undefined;

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      const response = await fetch(
        `${createApiUrl('/api/messages')}?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-User-Id': currentUserId || '',
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const responseData = await response.json();
        const messagesData = Array.isArray(responseData)
          ? responseData
          : (responseData.data || responseData.messages || []);
        
        if (responseData.pagination) {
          setPagination(prev => ({
            ...prev,
            page: responseData.pagination.page,
            pages: responseData.pagination.pages,
            total: responseData.pagination.total,
          }));
        }
        
        // Group messages by conversation
        const conversationMap = new Map();

        messagesData.forEach((msg: any, idx: number) => {
          const senderId = msg.sender_id || msg.senderId;
          const receiverId = msg.receiver_id || msg.receiverId;
          const otherUserId = senderId === currentUserId ? receiverId : senderId;
          const otherUserType = senderId === currentUserId 
            ? (msg.receiverType || msg.receiver_type) 
            : (msg.senderType || msg.sender_type);
          const otherUserPhone = senderId === currentUserId 
            ? (msg.receiverPhone || msg.receiver_phone) 
            : (msg.senderPhone || msg.sender_phone);
          const otherUserName = senderId === currentUserId 
            ? (msg.receiverName || msg.receiver_name) 
            : (msg.senderName || msg.sender_name);
          
          const conversationIdRaw = msg.conversation_id || otherUserId || msg.other_user_id;
          const conversationId =
            conversationIdRaw != null && String(conversationIdRaw).trim() !== ''
              ? String(conversationIdRaw)
              : `conv_${String(otherUserId || 'unknown')}_${idx}`;
          if (!conversationMap.has(conversationId)) {
            conversationMap.set(conversationId, {
              id: conversationId,
              participant: otherUserName || msg.sender_name || msg.receiver_name || 'Müşteri',
              participantId: otherUserId,
              participantType: (otherUserType || 'client') as Conversation['participantType'],
              participantPhone: otherUserPhone,
              lastMessage: msg.message,
              lastMessageTime: msg.created_at || msg.createdAt,
              unreadCount: 0,
              isOnline: false,
              avatar: '',
              status: 'active' as const,
            });
          }
        });

        const conversationsList = Array.from(conversationMap.values());
        setConversations(conversationsList);
      } else {
        throw new Error('Failed to load conversations');
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error loading conversations:', error);
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      setMessages([]);
    }
  }, [selectedConversation]);

  const breadcrumbItems = [
    {
      label: 'Ana Sayfa',
      icon: <BarChart3 className='w-4 h-4' />,
      href: '/nakliyeci/dashboard',
    },
    { label: 'Mesajlar', icon: <MessageSquare className='w-4 h-4' /> },
  ];

  const filteredConversations = conversations.filter(conv =>
    conv.participant.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendMessage = async () => {
    // Block messaging to tasiyici
    if (selectedConversation?.participantType === 'tasiyici') {
      setSuccessMessage('Taşıyıcı ile mesajlaşma yapılamaz. Lütfen telefon numarası üzerinden iletişime geçin.');
      setShowSuccessMessage(true);
      return;
    }

    if (newMessage.trim() && selectedConversation && selectedConversation.participantId) {
      try {
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        const userRaw = localStorage.getItem('user');
        const currentUserId = userRaw ? JSON.parse(userRaw || '{}').id : undefined;

        const response = await fetch(createApiUrl('/api/messages'), {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'X-User-Id': currentUserId || '',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            receiver_id: selectedConversation.participantId,
            message: newMessage.trim(),
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const message: Message = {
            id: data.data?.id || messages.length + 1,
            sender: 'Siz',
            senderType: 'admin',
            message: newMessage.trim(),
            timestamp: formatDateTime(new Date()),
            isRead: true,
            isDelivered: true,
          };
          setMessages([...messages, message]);
          setNewMessage('');
          setSuccessMessage('Mesaj gönderildi');
          setShowSuccessMessage(true);
          loadConversations(); // Reload to update last message
        } else {
          const errorData = await response.json().catch(() => ({}));
          setSuccessMessage(errorData.message || 'Mesaj gönderilemedi');
          setShowSuccessMessage(true);
        }
      } catch (error) {
        if (import.meta.env.DEV) console.error('Error sending message:', error);
        setSuccessMessage('Mesaj gönderilemedi. Lütfen tekrar deneyin.');
        setShowSuccessMessage(true);
      }
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
      return date.toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else {
      return date.toLocaleDateString('tr-TR');
    }
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-50'>
        <div className='max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6'>
          <LoadingState message='Mesajlar yükleniyor...' />
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-50'>
      <Helmet>
        <title>Mesajlar - Nakliyeci Panel - YolNext</title>
        <meta name='description' content='Nakliyeci mesaj yönetimi' />
      </Helmet>

      <div className='max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6'>
        {/* Breadcrumb */}
        <div className='mb-4 sm:mb-6'>
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Header */}
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6'>
          <div className='flex items-center gap-3 mb-4 sm:mb-0'>
            <div className='w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl flex items-center justify-center shadow-lg'>
              <MessageSquare className='w-5 h-5 sm:w-6 sm:h-6 text-white' />
            </div>
            <div>
              <h1 className='text-xl sm:text-2xl font-bold text-slate-900'>
                Mesajlar
              </h1>
              <p className='text-sm text-slate-600'>
                Müşteriler ve taşıyıcılarla iletişim kurun
              </p>
            </div>
          </div>

          <div className='flex flex-wrap gap-2 sm:gap-3'>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className='flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-white border border-slate-200 text-slate-700 rounded-lg sm:rounded-xl hover:bg-slate-50 transition-all duration-200 text-sm font-medium'
            >
              <Filter className='w-4 h-4 sm:w-5 sm:h-5' />
              <span className='hidden sm:inline'>Filtreler</span>
            </button>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Conversations List */}
          <div className='lg:col-span-1'>
            <div className='bg-white rounded-xl sm:rounded-2xl shadow-lg border border-slate-200'>
              <div className='p-4 border-b border-slate-200'>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4' />
                  <input
                    type='text'
                    placeholder='Konuşma ara...'
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className='w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm'
                  />
                </div>
              </div>

              <div className='max-h-96 overflow-y-auto'>
                {filteredConversations.length === 0 ? (
                  <EmptyState
                    icon={MessageSquare}
                    title='Konuşma bulunamadı'
                    description='Arama kriterlerinize uygun konuşma bulunamadı.'
                  />
                ) : (
                  <div className='space-y-1'>
                    {filteredConversations.map(conversation => (
                      <div
                        key={conversation.id}
                        onClick={() => setSelectedConversation(conversation)}
                        className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors ${
                          selectedConversation?.id === conversation.id
                            ? 'bg-slate-100 border-r-2 border-slate-800'
                            : ''
                        }`}
                      >
                        <div className='flex items-center gap-3'>
                          <div className='relative'>
                            <div className='w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center'>
                              <User className='w-5 h-5 text-slate-600' />
                            </div>
                            {conversation.isOnline && (
                              <div className='absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white'></div>
                            )}
                          </div>
                          <div className='flex-1 min-w-0'>
                            <div className='flex items-center justify-between'>
                              <h3 className='text-sm font-medium text-slate-900 truncate'>
                                {conversation.participant}
                              </h3>
                              <span className='text-xs text-slate-500'>
                                {formatTime(conversation.lastMessageTime)}
                              </span>
                            </div>
                            <p className='text-sm text-slate-600 truncate'>
                              {conversation.lastMessage}
                            </p>
                            {conversation.unreadCount > 0 && (
                              <div className='flex items-center justify-between mt-1'>
                                <span className='text-xs text-slate-500'>
                                  {conversation.participantType === 'client'
                                    ? 'Müşteri'
                                    : 'Taşıyıcı'}
                                </span>
                                <span className='bg-slate-800 text-white text-xs rounded-full px-2 py-1'>
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
          <div className='lg:col-span-2'>
            {!selectedConversation ? (
              <div className='bg-white rounded-xl sm:rounded-2xl shadow-lg border border-slate-200 h-96 flex items-center justify-center'>
                <EmptyState
                  icon={MessageSquare}
                  title='Konuşma seçin'
                  description='Bir konuşma seçerek mesajlaşmaya başlayın.'
                />
              </div>
            ) : (
              <div className='bg-white rounded-xl sm:rounded-2xl shadow-lg border border-slate-200 flex flex-col h-96'>
                {/* Chat Header */}
                <div className='p-4 border-b border-slate-200 flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center'>
                      <User className='w-4 h-4 text-slate-600' />
                    </div>
                    <div>
                      <h3 className='font-medium text-slate-900'>
                        {selectedConversation.participant}
                      </h3>
                      <p className='text-sm text-slate-600'>
                        {selectedConversation.isOnline
                          ? 'Çevrimiçi'
                          : 'Çevrimdışı'}
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    <button className='p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors'>
                      <Video className='w-4 h-4' />
                    </button>
                    <button className='p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors'>
                      <MoreVertical className='w-4 h-4' />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className='flex-1 overflow-y-auto p-4 space-y-4'>
                  {messages.map(message => (
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
                        <p className='text-sm'>{message.message}</p>
                        <div className='flex items-center justify-between mt-1'>
                          <span className='text-xs opacity-70'>
                            {formatTime(message.timestamp)}
                          </span>
                          {message.sender === 'Siz' && (
                            <div className='flex items-center gap-1'>
                              {message.isDelivered && (
                                <CheckCircle2 className='w-3 h-3' />
                              )}
                              {message.isRead && (
                                <CheckCircle2 className='w-3 h-3 text-blue-400' />
                              )}
                            </div>
                          )}
                        </div>
                        {message.attachments && (
                          <div className='mt-2 p-2 bg-white bg-opacity-20 rounded'>
                            <div className='flex items-center gap-2'>
                              <Paperclip className='w-3 h-3' />
                              <span className='text-xs'>
                                {message.attachments[0].name}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className='p-4 border-t border-slate-200'>
                  <div className='flex items-center gap-2'>
                    <button className='p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors'>
                      <Paperclip className='w-4 h-4' />
                    </button>
                    <div className='flex-1 relative'>
                      <input
                        type='text'
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder='Mesajınızı yazın...'
                        className='w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm'
                      />
                    </div>
                    <button className='p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors'>
                      <Smile className='w-4 h-4' />
                    </button>
                    <button
                      onClick={handleSendMessage}
                      className='p-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors'
                    >
                      <Send className='w-4 h-4' />
                    </button>
                  </div>
                </div>
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
