import React, { useState, useEffect, useRef } from 'react';
import { X, Send, MessageSquare, User, Clock } from 'lucide-react';
import { createApiUrl } from '../config/api';

interface MessagingModalProps {
  isOpen: boolean;
  onClose: () => void;
  otherUser: {
    id: string;
    name: string;
    email: string;
    type: string;
  };
  currentUser: {
    id: string;
    name: string;
  };
  shipmentId?: string;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
  sender_name: string;
  receiver_name: string;
}

const MessagingModal: React.FC<MessagingModalProps> = ({
  isOpen,
  onClose,
  otherUser,
  currentUser,
  shipmentId,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const shipmentRef = shipmentId ? `#${shipmentId}` : '';

  const ibanRegex = /\bTR\d{2}(?:\s?\d{4}){1,5}\s?\d{0,2}\b/i;
  const hasIbanInConversation = messages.some(m => ibanRegex.test(String(m.message || '')));

  const templates = [
    {
      label: 'IBAN iste',
      text: `Merhaba, ödeme için IBAN bilgilerinizi paylaşır mısınız? İş No: ${shipmentRef}`.trim(),
    },
    {
      label: 'Ödeme teyidi',
      text: `Ödeme ile ilgili teyit rica ederim. İş No: ${shipmentRef}`.trim(),
    },
    {
      label: 'Dekont iste',
      text: `Ödeme dekontunu paylaşabilir misiniz? İş No: ${shipmentRef}`.trim(),
    },
    {
      label: 'Açıklama öner',
      text: `Ödeme açıklamasına lütfen "${shipmentRef}" yazalım. Tutar ve alıcı adı teyit edelim.`.trim(),
    },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && otherUser?.id) {
      loadConversation();
    }
  }, [isOpen, otherUser?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversation = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');

      // Use shipmentId if available, otherwise get all messages and filter
      let endpoint = '/api/messages';
      if (shipmentId) {
        endpoint = `/api/messages/shipment/${shipmentId}`;
      }

      const response = await fetch(
        createApiUrl(endpoint),
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        let messagesData = data.data || data.messages || data || [];
        
        // If we got all messages and have otherUser, filter by otherUser
        if (!shipmentId && otherUser?.id && Array.isArray(messagesData)) {
          const otherId = String(parseInt(otherUser.id));
          messagesData = messagesData.filter(
            (msg: any) => msg.sender_id === otherId || msg.receiver_id === otherId
          );
        }
        
        setMessages(messagesData);
      } else {
        // Failed to load conversation - log removed for performance
        setMessages([]);
      }
    } catch (error) {
      // Error loading conversation - log removed for performance
      // Only log critical errors in development
      if (import.meta.env.DEV && error instanceof Error && error.message.includes('500')) {
        console.error('Critical error loading conversation:', error);
      }
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    try {
      setIsSending(true);
      const token = localStorage.getItem('authToken');

      const response = await fetch(createApiUrl('/api/messages'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiverId: parseInt(otherUser?.id) || otherUser?.id,
          message: newMessage.trim(),
          shipmentId: shipmentId ? parseInt(shipmentId) : null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Add the new message to the list
        const messageData = data.data || data;
        const newMsg: Message = {
          id: messageData.id || Date.now().toString(),
          sender_id: currentUser.id,
          receiver_id: otherUser?.id || '',
          message: newMessage.trim(),
          created_at: messageData.created_at || new Date().toISOString(),
          sender_name: currentUser.name,
          receiver_name: otherUser?.name || '',
        };
        setMessages(prev => [...prev, newMsg]);
        setNewMessage('');
        // Reload conversation to get updated messages
        loadConversation();
      } else {
        const errorData = await response.json().catch(() => ({}));
        // Failed to send message - log removed for performance
        // Only log critical errors in development
        if (import.meta.env.DEV && errorData.message?.includes('500')) {
          console.error('Critical error sending message:', errorData.message);
        }
      }
    } catch (error) {
      // Error sending message - log removed for performance
      // Only log critical errors in development
      if (import.meta.env.DEV && error instanceof Error && error.message.includes('500')) {
        console.error('Critical error sending message:', error);
      }
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-xl shadow-2xl w-full max-w-2xl h-[600px] flex flex-col'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-200'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center'>
              <User className='w-5 h-5 text-blue-600' />
            </div>
            <div>
              <h2 className='text-lg font-bold text-gray-900'>
                {otherUser?.name}
              </h2>
              <div className='flex flex-wrap items-center gap-2'>
                <p className='text-sm text-gray-600'>
                  {otherUser?.type} • {otherUser?.email}
                </p>
                {shipmentId && (
                  <span className='inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200'>
                    İş No: #{shipmentId}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
          >
            <X className='w-5 h-5 text-gray-500' />
          </button>
        </div>

        <div className='px-6 pt-4'>
          <div className='bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-900'>
            Bu kanal ödeme ve süreç koordinasyonu içindir. IBAN/ödeme paylaşırken alıcı adını doğrulayın ve açıklamaya {shipmentRef || 'iş numarasını'} ekleyin.
          </div>
          {hasIbanInConversation && (
            <div className='mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900'>
              Konuşmada IBAN bilgisi tespit edildi. Lütfen alıcı adını ve tutarı tekrar teyit edin.
            </div>
          )}
        </div>

        {/* Messages */}
        <div className='flex-1 overflow-y-auto p-4 space-y-4'>
          {isLoading ? (
            <div className='flex justify-center items-center h-32'>
              <div className='w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin' />
            </div>
          ) : messages.length === 0 ? (
            <div className='flex flex-col items-center justify-center h-32 text-gray-500'>
              <MessageSquare className='w-8 h-8 mb-2' />
              <p>Henüz mesaj yok</p>
              <p className='text-sm'>İlk mesajı siz gönderin</p>
            </div>
          ) : (
            messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.sender_id === currentUser.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className='text-sm'>{message.message}</p>
                  <div className='flex items-center gap-1 mt-1'>
                    <Clock className='w-3 h-3' />
                    <span className='text-xs opacity-75'>
                      {formatTime(message.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form onSubmit={sendMessage} className='p-4 border-t border-gray-200'>
          <div className='flex flex-wrap gap-2 mb-3'>
            {templates.map(t => (
              <button
                key={t.label}
                type='button'
                onClick={() => setNewMessage(t.text)}
                className='px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors'
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className='flex gap-2'>
            <input
              type='text'
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder='Ödeme/IBAN ve süreç için mesaj yazın...'
              className='flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              disabled={isSending}
            />
            <button
              type='submit'
              disabled={!newMessage.trim() || isSending}
              className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2'
            >
              {isSending ? (
                <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
              ) : (
                <Send className='w-4 h-4' />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MessagingModal;
