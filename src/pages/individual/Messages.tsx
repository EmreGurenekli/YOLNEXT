import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams } from 'react-router-dom';
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
  Bell,
  Paperclip,
  Upload,
  FileText,
  Image as ImageIcon,
  X,
  Loader2,
  Check,
  CheckCheck,
} from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';
import Modal from '../../components/common/Modal';
import SuccessMessage from '../../components/common/SuccessMessage';
import { messageAPI } from '../../services/api';
import socketService from '../../services/socket';
import { sanitizeInput, escapeHtml } from '../../utils/security';
import { createApiUrl } from '../../config/api';

interface Message {
  id: string;
  from: string;
  fromType: 'carrier' | 'system';
  message: string;
  timestamp: string;
  isRead: boolean;
  shipmentId?: string;
  shipmentTitle?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  messageType?: 'text' | 'image' | 'file';
  status?: 'sending' | 'sent' | 'delivered' | 'read';
}

interface Conversation {
  id: string;
  carrierId: string;
  shipmentId: string;
  carrierName: string;
  carrierCompany: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount?: number;
  isOnline?: boolean;
  messages?: Message[];
}

const IndividualMessages: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const userIdParam = searchParams.get('userId');
  const shipmentIdParam = searchParams.get('shipmentId');
  const prefillParam = searchParams.get('prefill');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Hazır mesajlar - Ödeme ve İşlem Odaklı
  const quickMessages = [
    'Ödeme yöntemini belirleyelim',
    'Nakit ödeme yapacağım',
    'Havale/EFT ile ödeme yapacağım',
    'Ödeme ne zaman yapılacak?',
    'Ödeme onayını aldım',
    'Fatura bilgilerini paylaşabilir misiniz?',
    'Ödeme planını konuşalım',
    'Ödeme tamamlandı',
    'Ödeme durumunu kontrol edebilir misiniz?',
    'Ödeme ile ilgili sorularım var'
  ];

  useEffect(() => {
    const loadConversations = async () => {
      try {
        setLoading(true);

        const response = await messageAPI.getAll();
        if (response.success && response.data) {
          setConversations(response.data);
        } else {
          setConversations([]);
        }
      } catch (error) {
        console.error('Error loading conversations:', error);
        setConversations([]);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, []);

  // Auto-select or create conversation when userId is provided in URL
  useEffect(() => {
    if (userIdParam && conversations.length >= 0) {
      // Try to find existing conversation
      const conversation = conversations.find(
        conv => String(conv.carrierId) === String(userIdParam)
      );
      
      if (conversation) {
        setSelectedConversation(conversation);
      } else if (userIdParam && shipmentIdParam) {
        // Create a new conversation entry if it doesn't exist
        // This will be created when first message is sent
        const newConversation: Conversation = {
          id: `temp-${userIdParam}-${shipmentIdParam}`,
          carrierId: userIdParam,
          shipmentId: shipmentIdParam,
          carrierName: 'Nakliyeci',
          carrierCompany: '',
          lastMessage: '',
          lastMessageTime: '',
          unreadCount: 0,
          isOnline: false,
          messages: [],
        };
        setSelectedConversation(newConversation);
        // Add to conversations list if not already there
        if (!conversations.find(c => String(c.carrierId) === String(userIdParam))) {
          setConversations(prev => [...prev, newConversation]);
        }
      }
      
      // Clean up URL params after a short delay
      setTimeout(() => {
        setSearchParams(prev => {
          const newParams = new URLSearchParams(prev);
          newParams.delete('userId');
          newParams.delete('prefill');
          if (shipmentIdParam) {
            newParams.set('shipmentId', shipmentIdParam);
          }
          return newParams;
        });
      }, 100);
    }
  }, [userIdParam, conversations.length]);

  useEffect(() => {
    const value = (prefillParam || '').trim();
    if (!value) return;
    setNewMessage(value);
  }, [prefillParam]);

  useEffect(() => {
    // Socket.IO real-time messaging
    const handleNewMessage = (message: any) => {
      setConversations(prev => {
        const updated = [...prev];
        // Try to find conversation by receiverId or senderId
        const conversationIndex = updated.findIndex(
          c => String(c.carrierId) === String(message.receiverId || message.senderId)
        );
        if (conversationIndex !== -1) {
          const newMessage: Message = {
            id: message.id || `msg-${Date.now()}`,
            from: message.senderId === userIdParam ? 'Siz' : (updated[conversationIndex].carrierName || 'Nakliyeci'),
            fromType: 'carrier',
            message: message.message || message.content || '',
            timestamp: new Date(message.createdAt || Date.now()).toLocaleTimeString('tr-TR', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            isRead: false,
            fileUrl: message.fileUrl || message.file_url,
            fileName: message.fileName || message.file_name,
            fileSize: message.fileSize || message.file_size,
            mimeType: message.mimeType || message.mime_type,
            messageType: message.messageType || message.message_type || 'text',
            status: 'delivered',
          };
          updated[conversationIndex].messages = [...(updated[conversationIndex].messages || []), newMessage];
          updated[conversationIndex].lastMessage = newMessage.message;
          updated[conversationIndex].lastMessageTime = newMessage.timestamp;
          updated[conversationIndex].unreadCount = (updated[conversationIndex].unreadCount || 0) + 1;
        }
        return updated;
      });

      // Update selected conversation if it matches
      setSelectedConversation(prev => {
        if (!prev) return prev;
        if (String(prev.carrierId) === String(message.receiverId || message.senderId)) {
          const newMessage: Message = {
            id: message.id || `msg-${Date.now()}`,
            from: message.senderId === userIdParam ? 'Siz' : (prev.carrierName || 'Nakliyeci'),
            fromType: 'carrier',
            message: message.message || message.content || '',
            timestamp: new Date(message.createdAt || Date.now()).toLocaleTimeString('tr-TR', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            isRead: true,
            fileUrl: message.fileUrl || message.file_url,
            fileName: message.fileName || message.file_name,
            fileSize: message.fileSize || message.file_size,
            mimeType: message.mimeType || message.mime_type,
            messageType: message.messageType || message.message_type || 'text',
            status: 'delivered',
          };
          return {
            ...prev,
            messages: [...(prev.messages || []), newMessage],
            lastMessage: newMessage.message,
            lastMessageTime: newMessage.timestamp,
          };
        }
        return prev;
      });
    };

    const handleMessageRead = (data: { messageId: string; readAt: string }) => {
      setConversations(prev => {
        const updated = [...prev];
        updated.forEach(conversation => {
          const messageIndex = conversation.messages?.findIndex(m => m.id === data.messageId);
          if (messageIndex !== undefined && messageIndex !== -1) {
            conversation.messages![messageIndex].isRead = true;
            conversation.messages![messageIndex].status = 'read';
          }
        });
        return updated;
      });

      setSelectedConversation(prev => {
        if (!prev) return prev;
        const messageIndex = prev.messages?.findIndex(m => m.id === data.messageId);
        if (messageIndex !== undefined && messageIndex !== -1) {
          return {
            ...prev,
            messages: prev.messages!.map((m, i) => 
              i === messageIndex ? { ...m, isRead: true, status: 'read' as const } : m
            ),
          };
        }
        return prev;
      });
    };

    // Enable real-time messaging
    socketService.onNewMessage(handleNewMessage);
    socketService.on('message:read', handleMessageRead);

    return () => {
      socketService.off('new_message', handleNewMessage);
      socketService.off('message:read', handleMessageRead);
    };
  }, [userIdParam]);

  const filteredConversations = conversations.filter(
    conv => {
      const searchLower = (searchTerm || '').toLowerCase();
      const carrierName = (conv.carrierName || '').toLowerCase();
      const carrierCompany = (conv.carrierCompany || '').toLowerCase();
      return carrierName.includes(searchLower) || carrierCompany.includes(searchLower);
    }
  );

  // Toast notification helper
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      showToast('Dosya boyutu 10MB\'dan büyük olamaz', 'error');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      showToast('Sadece resim, PDF ve Word dosyaları yüklenebilir', 'error');
      return;
    }

    setSelectedFile(file);
  };

  // Handle file upload
  const handleFileUpload = async () => {
    if (!selectedFile || !selectedConversation) return;

    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('receiverId', selectedConversation.carrierId);
      if (selectedConversation.shipmentId) {
        formData.append('shipmentId', selectedConversation.shipmentId);
      }

      const token = localStorage.getItem('authToken');
      const response = await fetch(createApiUrl('/api/messages/upload'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token || localStorage.getItem('token')}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Dosya yüklenemedi');
      }

      const message: Message = {
        id: data.data?.id || `temp-${Date.now()}`,
        from: 'Siz',
        fromType: 'carrier',
        message: selectedFile.name,
        timestamp: new Date().toLocaleTimeString('tr-TR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        isRead: true,
        fileUrl: data.data?.fileUrl || data.data?.file_url,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        mimeType: selectedFile.type,
        messageType: selectedFile.type.startsWith('image/') ? 'image' : 'file',
        status: 'sent',
      };

      // Update conversations
      setConversations(prev => {
        const updated = prev.map(conv =>
          String(conv.carrierId) === String(selectedConversation.carrierId)
            ? {
                ...conv,
                messages: [...(conv.messages || []), message],
                lastMessage: `📎 ${selectedFile.name}`,
                lastMessageTime: message.timestamp,
              }
            : conv
        );
        
        if (!updated.find(c => String(c.carrierId) === String(selectedConversation.carrierId))) {
          updated.push({
            ...selectedConversation,
            messages: [message],
            lastMessage: `📎 ${selectedFile.name}`,
            lastMessageTime: message.timestamp,
          });
        }
        
        return updated;
      });

      // Update selected conversation
      setSelectedConversation(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...(prev.messages || []), message],
          lastMessage: `📎 ${selectedFile.name}`,
          lastMessageTime: message.timestamp,
        };
      });

      setSelectedFile(null);
      showToast('Dosya başarıyla gönderildi', 'success');
    } catch (error: any) {
      console.error('Error uploading file:', error);
      showToast(error.message || 'Dosya yüklenirken bir hata oluştu', 'error');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !selectedConversation) {
      if (!selectedConversation) {
        showToast('Lütfen bir konuşma seçin', 'error');
      }
      return;
    }

    // If file is selected, upload it first
    if (selectedFile) {
      await handleFileUpload();
      return;
    }

    const messageText = sanitizeInput(newMessage.trim());
    if (!messageText) {
      showToast('Mesaj boş olamaz', 'error');
      return;
    }

    // Validate receiverId before proceeding
    if (!selectedConversation.carrierId) {
      showToast('Alıcı bilgisi bulunamadı. Lütfen sayfayı yenileyin.', 'error');
      return;
    }

    setSendingMessage(true);
    const originalMessage = newMessage; // Store original message for error recovery
    setNewMessage(''); // Clear input immediately for better UX

    // Add temporary message with "sending" status
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      from: 'Siz',
      fromType: 'carrier',
      message: messageText,
      timestamp: new Date().toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      isRead: false,
      status: 'sending',
    };

    // Update UI immediately
    setSelectedConversation(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        messages: [...(prev.messages || []), tempMessage],
        lastMessage: messageText,
        lastMessageTime: tempMessage.timestamp,
      };
    });

    try {
      // Ensure receiverId is a valid string or number
      const receiverId = String(selectedConversation.carrierId);
      if (!receiverId || receiverId === 'undefined' || receiverId === 'null' || receiverId === '') {
        throw new Error('Geçersiz alıcı ID. Lütfen sayfayı yenileyin.');
      }

      const response = await messageAPI.send({
        receiverId: receiverId,
        message: messageText,
        shipmentId: selectedConversation.shipmentId || undefined,
      });

      if (!response.success) {
        throw new Error(response.error || 'Mesaj gönderilemedi');
      }

      const message: Message = {
        id: response.data?.id || tempMessage.id,
        from: 'Siz',
        fromType: 'carrier',
        message: messageText,
        timestamp: new Date().toLocaleTimeString('tr-TR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        isRead: false,
        status: 'sent',
      };

      // Update conversations - replace temp message
      setConversations(prev => {
        const updated = prev.map(conv =>
          String(conv.carrierId) === String(selectedConversation.carrierId)
            ? {
                ...conv,
                messages: (conv.messages || []).map(m => m.id === tempMessage.id ? message : m),
                lastMessage: message.message,
                lastMessageTime: message.timestamp,
              }
            : conv
        );
        
        if (!updated.find(c => String(c.carrierId) === String(selectedConversation.carrierId))) {
          updated.push({
            ...selectedConversation,
            messages: [message],
            lastMessage: message.message,
            lastMessageTime: message.timestamp,
          });
        }
        
        return updated;
      });

      // Update selected conversation - replace temp message
      setSelectedConversation(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: (prev.messages || []).map(m => m.id === tempMessage.id ? message : m),
          lastMessage: message.message,
          lastMessageTime: message.timestamp,
        };
      });

      showToast('Mesaj gönderildi', 'success');
    } catch (error: any) {
      console.error('Error sending message:', error);
      // Remove temp message on error
      setSelectedConversation(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: (prev.messages || []).filter(m => m.id !== tempMessage.id),
        };
      });
      // Restore message on error
      setNewMessage(originalMessage);
      // Show user-friendly error message
      const errorMessage = error.message || error.error || 'Mesaj gönderilemedi. Lütfen tekrar deneyin.';
      showToast(errorMessage, 'error');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    // Mark messages as read
    setConversations(prev =>
      prev.map(conv =>
        conv.id === conversation.id
          ? {
              ...conv,
              unreadCount: 0,
              messages: (conv.messages || []).map(msg => ({ ...msg, isRead: true })),
            }
          : conv
      )
    );
  };

  const breadcrumbItems = [
    { label: 'Mesajlar', icon: <MessageSquare className='w-4 h-4' /> },
  ];

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50'>
        <div className='max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6'>
          <LoadingState message='Mesajlar yükleniyor...' />
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50'>
      <Helmet>
        <title>Mesajlar - YolNext Bireysel</title>
        <meta
          name='description'
          content='Bireysel gönderici mesajları - nakliyeci ve sistem mesajlarını görüntüleyin'
        />
      </Helmet>

      <div className='max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6'>
        {/* Breadcrumb */}
        <div className='mb-4 sm:mb-6'>
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Header - Mobile Optimized */}
        <div className='text-center mb-8 sm:mb-12'>
          <div className='flex justify-center mb-4 sm:mb-6'>
            <div className='w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg'>
              <MessageSquare className='w-6 h-6 sm:w-8 sm:h-8 text-white' />
            </div>
          </div>
          <h1 className='text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-2 sm:mb-3'>
            Mesajlarınız{' '}
            <span className='text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-blue-900'>
              Merkezi
            </span>
          </h1>
          <p className='text-sm sm:text-base md:text-lg text-slate-600 px-4'>
            Nakliyeci ve sistem mesajlarınızı takip edin
          </p>
        </div>

        {/* Stats Cards - Mobile Optimized */}
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8'>
          <div className='bg-white rounded-xl shadow-lg border border-slate-200 p-3 sm:p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs sm:text-sm font-medium text-slate-600'>
                  Toplam Mesaj
                </p>
                <p className='text-lg sm:text-xl font-bold text-slate-900'>
                  {conversations.reduce(
                    (sum, conv) => sum + (conv.messages?.length || 0),
                    0
                  )}
                </p>
              </div>
              <div className='w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center'>
                <MessageSquare className='w-4 h-4 sm:w-5 sm:h-5 text-white' />
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl shadow-lg border border-slate-200 p-3 sm:p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs sm:text-sm font-medium text-slate-600'>
                  Okunmamış
                </p>
                <p className='text-lg sm:text-xl font-bold text-slate-900'>
                  {conversations.reduce(
                    (sum, conv) => sum + (conv.unreadCount || 0),
                    0
                  )}
                </p>
              </div>
              <div className='w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center'>
                <Bell className='w-4 h-4 sm:w-5 sm:h-5 text-white' />
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl shadow-lg border border-slate-200 p-3 sm:p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs sm:text-sm font-medium text-slate-600'>
                  Aktif Sohbet
                </p>
                <p className='text-lg sm:text-xl font-bold text-slate-900'>
                  {conversations.filter(conv => conv.isOnline === true).length}
                </p>
              </div>
              <div className='w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center'>
                <CheckCircle className='w-4 h-4 sm:w-5 sm:h-5 text-white' />
              </div>
            </div>
          </div>

          <div className='bg-white rounded-xl shadow-lg border border-slate-200 p-3 sm:p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs sm:text-sm font-medium text-slate-600'>
                  Nakliyeci
                </p>
                <p className='text-lg sm:text-xl font-bold text-slate-900'>
                  {
                    conversations.filter(conv => (conv.carrierName || '') !== 'Sistem')
                      .length
                  }
                </p>
              </div>
              <div className='w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center'>
                <Truck className='w-4 h-4 sm:w-5 sm:h-5 text-white' />
              </div>
            </div>
          </div>
        </div>

        {/* Search - Mobile Optimized */}
        <div className='bg-white rounded-xl shadow-lg border border-slate-200 p-4 sm:p-6 mb-6 sm:mb-8'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4' />
            <input
              type='text'
              placeholder='Nakliyeci veya mesaj ara...'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className='w-full pl-10 pr-4 py-2.5 sm:py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-slate-50 focus:bg-white transition-colors'
            />
          </div>
        </div>

        {/* Messages Layout */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Conversations List */}
          <div className='lg:col-span-1'>
            <div className='bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden'>
              <div className='p-4 sm:p-6 border-b border-slate-200'>
                <h3 className='text-lg font-medium text-slate-900'>
                  Sohbetler
                </h3>
              </div>
              <div className='max-h-96 lg:max-h-[600px] overflow-y-auto'>
                {filteredConversations.length === 0 ? (
                  <div className='p-4 text-center text-slate-500'>
                    <MessageSquare className='w-8 h-8 mx-auto mb-2 text-slate-400' />
                    <p>Mesaj bulunamadı</p>
                  </div>
                ) : (
                  <div className='divide-y divide-slate-200'>
                    {filteredConversations.map(conversation => (
                      <button
                        key={conversation.id}
                        onClick={() => handleConversationSelect(conversation)}
                        className={`w-full p-4 text-left hover:bg-slate-50 transition-colors ${
                          selectedConversation?.id === conversation.id
                            ? 'bg-blue-50 border-r-2 border-blue-500'
                            : ''
                        }`}
                      >
                        <div className='flex items-start space-x-3'>
                          <div className='relative'>
                            <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center'>
                              {conversation.carrierName === 'Sistem' ? (
                                <Package className='w-5 h-5 text-white' />
                              ) : (
                                <Truck className='w-5 h-5 text-white' />
                              )}
                            </div>
                            {conversation.isOnline && (
                              <div className='absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white'></div>
                            )}
                          </div>
                          <div className='flex-1 min-w-0'>
                            <div className='flex items-center justify-between'>
                              <h4 className='text-sm font-medium text-slate-900 truncate'>
                                {conversation.carrierName || 'Nakliyeci'}
                              </h4>
                              {(conversation.unreadCount || 0) > 0 && (
                                <span className='inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-red-500 rounded-full'>
                                  {conversation.unreadCount || 0}
                                </span>
                              )}
                            </div>
                            <p className='text-xs text-slate-500 truncate'>
                              {conversation.carrierCompany || 'Şirket bilgisi yok'}
                            </p>
                            <p className='text-sm text-slate-600 truncate mt-1'>
                              {conversation.lastMessage}
                            </p>
                            <p className='text-xs text-slate-400 mt-1'>
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
          <div className='lg:col-span-2'>
            {selectedConversation ? (
              <div className='bg-white rounded-xl shadow-lg border border-slate-200 h-96 lg:h-[600px] flex flex-col'>
                {/* Chat Header */}
                <div className='p-4 sm:p-6 border-b border-slate-200'>
                  <div className='flex items-center space-x-3'>
                    <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center'>
                      {selectedConversation.carrierName === 'Sistem' ? (
                        <Package className='w-5 h-5 text-white' />
                      ) : (
                        <Truck className='w-5 h-5 text-white' />
                      )}
                    </div>
                    <div>
                      <h3 className='text-lg font-medium text-slate-900'>
                        {selectedConversation.carrierName || 'Nakliyeci'}
                      </h3>
                      <p className='text-sm text-slate-500'>
                        {selectedConversation.carrierCompany || 'Şirket bilgisi yok'}
                      </p>
                    </div>
                    {selectedConversation.isOnline && (
                      <div className='flex items-center text-sm text-green-600'>
                        <div className='w-2 h-2 bg-green-500 rounded-full mr-2'></div>
                        Çevrimiçi
                      </div>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div className='flex-1 overflow-y-auto p-4 sm:p-6 space-y-4'>
                  {(selectedConversation.messages || []).map((message, index) => {
                    // Group messages by date
                    const currentDate = new Date(message.timestamp || Date.now()).toDateString();
                    const prevDate = index > 0 
                      ? new Date((selectedConversation.messages || [])[index - 1].timestamp || Date.now()).toDateString()
                      : null;
                    const showDateSeparator = currentDate !== prevDate;

                    return (
                      <React.Fragment key={message.id}>
                        {showDateSeparator && (
                          <div className='flex items-center justify-center my-4'>
                            <div className='px-3 py-1 bg-slate-100 rounded-full text-xs text-slate-600'>
                              {new Date(message.timestamp || Date.now()).toLocaleDateString('tr-TR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </div>
                          </div>
                        )}
                        <div
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
                            {/* File attachment */}
                            {message.fileUrl && (
                              <div className='mb-2'>
                                {message.messageType === 'image' ? (
                                  <img 
                                    src={message.fileUrl} 
                                    alt={message.fileName || 'Resim'}
                                    className='max-w-full rounded-lg cursor-pointer'
                                    onClick={() => window.open(message.fileUrl, '_blank')}
                                  />
                                ) : (
                                  <a
                                    href={message.fileUrl}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className='flex items-center gap-2 p-2 bg-white bg-opacity-20 rounded hover:bg-opacity-30 transition-colors'
                                  >
                                    <FileText className='w-4 h-4' />
                                    <div className='flex-1 min-w-0'>
                                      <p className='text-xs font-medium truncate'>{message.fileName}</p>
                                      {message.fileSize && (
                                        <p className='text-xs opacity-75'>{formatFileSize(message.fileSize)}</p>
                                      )}
                                    </div>
                                  </a>
                                )}
                              </div>
                            )}
                            
                            {/* Message text */}
                            {message.message && (
                              <p className='text-sm whitespace-pre-wrap'>{escapeHtml(message.message)}</p>
                            )}
                            
                            {/* Timestamp and status */}
                            <div className='flex items-center justify-between mt-1'>
                              <p
                                className={`text-xs ${
                                  message.from === 'Siz'
                                    ? 'text-blue-100'
                                    : 'text-slate-500'
                                }`}
                              >
                                {message.timestamp}
                              </p>
                              {message.from === 'Siz' && message.status && (
                                <div className='ml-2'>
                                  {message.status === 'sending' && (
                                    <Loader2 className='w-3 h-3 text-blue-100 animate-spin' />
                                  )}
                                  {message.status === 'sent' && (
                                    <Check className='w-3 h-3 text-blue-100' />
                                  )}
                                  {message.status === 'delivered' && (
                                    <CheckCheck className='w-3 h-3 text-blue-100' />
                                  )}
                                  {message.status === 'read' && (
                                    <CheckCheck className='w-3 h-3 text-blue-300' />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Message Input */}
                <div className='p-4 sm:p-6 border-t border-slate-200'>
                  {/* Quick Messages - Horizontal Scroll */}
                  <div className='mb-3 bg-white rounded-lg border border-slate-200 p-2'>
                    <div className='overflow-x-auto scrollbar-hide'>
                      <div className='flex space-x-2 min-w-max'>
                        {quickMessages.map((msg, index) => (
                          <button
                            key={index}
                            onClick={() => setNewMessage(msg)}
                            className='px-3 py-1.5 text-xs whitespace-nowrap bg-slate-50 border border-slate-300 text-slate-700 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors flex-shrink-0'
                          >
                            {msg}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Selected file preview */}
                  {selectedFile && (
                    <div className='mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between'>
                      <div className='flex items-center gap-2 flex-1 min-w-0'>
                        {selectedFile.type.startsWith('image/') ? (
                          <ImageIcon className='w-5 h-5 text-blue-600 flex-shrink-0' />
                        ) : (
                          <FileText className='w-5 h-5 text-blue-600 flex-shrink-0' />
                        )}
                        <div className='flex-1 min-w-0'>
                          <p className='text-sm font-medium text-blue-900 truncate'>{selectedFile.name}</p>
                          <p className='text-xs text-blue-600'>{formatFileSize(selectedFile.size)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedFile(null)}
                        className='p-1 text-blue-600 hover:text-blue-800 transition-colors'
                      >
                        <X className='w-4 h-4' />
                      </button>
                    </div>
                  )}

                  <div className='flex space-x-3'>
                    <div className='flex-1 relative'>
                      <input
                        type='text'
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                        placeholder='Mesajınızı yazın...'
                        className='w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm'
                      />
                    </div>
                    <input
                      type='file'
                      id='file-input'
                      className='hidden'
                      accept='image/*,.pdf,.doc,.docx'
                      onChange={handleFileSelect}
                    />
                    <label
                      htmlFor='file-input'
                      className='px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer flex-shrink-0 flex items-center justify-center'
                      title='Dosya ekle'
                    >
                      {uploadingFile ? (
                        <Loader2 className='w-4 h-4 animate-spin' />
                      ) : (
                        <Paperclip className='w-4 h-4' />
                      )}
                    </label>
                    <button
                      onClick={handleSendMessage}
                      disabled={(!newMessage.trim() && !selectedFile) || sendingMessage || uploadingFile}
                      className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex-shrink-0 flex items-center justify-center'
                    >
                      {sendingMessage || uploadingFile ? (
                        <Loader2 className='w-4 h-4 animate-spin' />
                      ) : (
                        <Send className='w-4 h-4' />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className='bg-white rounded-xl shadow-lg border border-slate-200 h-96 lg:h-[600px] flex items-center justify-center'>
                <EmptyState
                  icon={MessageSquare}
                  title='Sohbet Seçin'
                  description='Bir sohbet seçerek mesajlaşmaya başlayın'
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className='fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5'>
          <div
            className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
              toast.type === 'success'
                ? 'bg-green-500 text-white'
                : toast.type === 'error'
                  ? 'bg-red-500 text-white'
                  : 'bg-blue-500 text-white'
            }`}
          >
            {toast.type === 'success' && <CheckCircle className='w-5 h-5' />}
            {toast.type === 'error' && <AlertCircle className='w-5 h-5' />}
            {toast.type === 'info' && <Bell className='w-5 h-5' />}
            <p className='text-sm font-medium'>{toast.message}</p>
            <button
              onClick={() => setToast(null)}
              className='ml-2 hover:opacity-75 transition-opacity'
            >
              <X className='w-4 h-4' />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default IndividualMessages;
