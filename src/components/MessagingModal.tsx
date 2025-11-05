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

      const response = await fetch(
        createApiUrl(`/api/messages/conversation/${otherUser?.id}`),
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      } else {
        console.error('Failed to load conversation');
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
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
          receiver_id: otherUser?.id,
          message: newMessage.trim(),
          shipment_id: shipmentId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Add the new message to the list
        const newMsg: Message = {
          id: data.data.id,
          sender_id: currentUser.id,
          receiver_id: otherUser?.id,
          message: newMessage.trim(),
          created_at: data.data.created_at,
          sender_name: currentUser.name,
          receiver_name: otherUser?.name,
        };
        setMessages(prev => [...prev, newMsg]);
        setNewMessage('');
      } else {
        console.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    });
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
              <p className='text-sm text-gray-600'>
                {otherUser?.type} • {otherUser?.email}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
          >
            <X className='w-5 h-5 text-gray-500' />
          </button>
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
          <div className='flex gap-2'>
            <input
              type='text'
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder='Mesajınızı yazın...'
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
