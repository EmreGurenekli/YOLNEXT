import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import { MessageCircle, Send, User, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  senderName: string;
  receiverName: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

interface Conversation {
  userId: number;
  userName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<
    number | null
  >(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
    }
  }, [selectedConversation]);

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/messages/conversations', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data.data?.conversations || []);
      }
    } catch (error) {
      console.error('Konuşmalar yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (userId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/messages/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.data?.messages || []);
      }
    } catch (error) {
      console.error('Mesajlar yüklenirken hata:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const token = localStorage.getItem('token');
      
      // Get shipmentId from URL params or conversation data
      const urlParams = new URLSearchParams(window.location.search);
      const shipmentId = urlParams.get('shipment') || urlParams.get('shipmentId');
      
      // Prepare request body matching backend expectations
      const requestBody: {
        receiverId: number;
        message: string;
        shipmentId?: number;
        messageType?: string;
      } = {
        receiverId: selectedConversation,
        message: newMessage.trim(), // Backend expects 'message', not 'content'
        messageType: 'text',
      };
      
      // Add shipmentId if available
      if (shipmentId) {
        requestBody.shipmentId = parseInt(shipmentId, 10);
      }
      
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data = await response.json();
        setNewMessage('');
        
        // Refresh messages and conversations
        fetchMessages(selectedConversation);
        fetchConversations();
        
        // Add the new message to local state immediately for better UX
        if (data.success && data.data) {
          const newMsg: Message = {
            id: data.data.id,
            senderId: Number(user?.id),
            receiverId: selectedConversation,
            senderName: user?.fullName || user?.companyName || 'You',
            receiverName: conversations.find(c => c.userId === selectedConversation)?.userName || 'Unknown',
            content: newMessage.trim(),
            createdAt: data.data.createdAt || new Date().toISOString(),
            isRead: false,
          };
          setMessages(prev => [...prev, newMsg]);
        }
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Mesaj gönderilemedi' }));
        console.error('Mesaj gönderme hatası:', errorData);
        alert(errorData.message || 'Mesaj gönderilemedi');
      }
    } catch (error) {
      console.error('Mesaj gönderilirken hata:', error);
      alert('Mesaj gönderilirken bir hata oluştu');
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  return (
    <div className='h-[calc(100vh-4rem)] flex'>
      {/* Konuşma Listesi */}
      <div className='w-1/3 border-r border-gray-200 flex flex-col'>
        <div className='p-4 border-b border-gray-200'>
          <h1 className='text-xl font-semibold text-gray-900'>Mesajlar</h1>
        </div>

        <div className='flex-1 overflow-y-auto'>
          {conversations.length === 0 ? (
            <div className='p-4 text-center text-gray-500'>
              <MessageCircle className='w-8 h-8 mx-auto mb-2 text-gray-400' />
              <p>Henüz mesaj yok</p>
            </div>
          ) : (
            <div className='space-y-1'>
              {conversations.map(conversation => (
                <div
                  key={conversation.userId}
                  className={`p-4 cursor-pointer hover:bg-gray-50 border-l-4 ${
                    selectedConversation === conversation.userId
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-transparent'
                  }`}
                  onClick={() => setSelectedConversation(conversation.userId)}
                >
                  <div className='flex justify-between items-start'>
                    <div className='flex-1'>
                      <h3 className='font-medium text-gray-900'>
                        {conversation.userName}
                      </h3>
                      <p className='text-sm text-gray-600 truncate'>
                        {conversation.lastMessage}
                      </p>
                    </div>
                    <div className='text-right'>
                      <p className='text-xs text-gray-500'>
                        {conversation.lastMessageTime}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <span className='inline-block bg-blue-500 text-white text-xs rounded-full px-2 py-1 mt-1'>
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mesaj Alanı */}
      <div className='flex-1 flex flex-col'>
        {selectedConversation ? (
          <>
            {/* Mesaj Başlığı */}
            <div className='p-4 border-b border-gray-200 bg-gray-50'>
              <h2 className='font-semibold text-gray-900'>
                {
                  conversations.find(c => c.userId === selectedConversation)
                    ?.userName
                }
              </h2>
            </div>

            {/* Mesaj Listesi */}
            <div className='flex-1 overflow-y-auto p-4 space-y-4'>
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`flex ${message.senderId === Number(user?.id) ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.senderId === Number(user?.id)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    <p className='text-sm'>{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.senderId === Number(user?.id)
                          ? 'text-blue-100'
                          : 'text-gray-500'
                      }`}
                    >
                      {new Date(message.createdAt).toLocaleTimeString('tr-TR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Mesaj Gönderme */}
            <form
              onSubmit={sendMessage}
              className='p-4 border-t border-gray-200'
            >
              <div className='flex gap-2'>
                <Textarea
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder='Mesajınızı yazın...'
                  className='flex-1 resize-none'
                  rows={2}
                />
                <Button type='submit' disabled={!newMessage.trim()}>
                  <Send className='w-4 h-4' />
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className='flex-1 flex items-center justify-center text-gray-500'>
            <div className='text-center'>
              <MessageCircle className='w-12 h-12 mx-auto mb-4 text-gray-400' />
              <p>Bir konuşma seçin</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
