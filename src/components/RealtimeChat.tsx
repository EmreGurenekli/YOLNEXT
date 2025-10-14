import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { Send, Phone, Video, MoreVertical, Smile } from 'lucide-react';

interface Message {
  id: number;
  senderId: number;
  message: string;
  timestamp: string;
  senderName?: string;
}

interface RealtimeChatProps {
  shipmentId: number;
  receiverId: number;
  receiverName: string;
  isOnline: boolean;
}

const RealtimeChat: React.FC<RealtimeChatProps> = ({ 
  shipmentId, 
  receiverId, 
  receiverName, 
  isOnline 
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { socket, isConnected, sendMessage, joinShipment, leaveShipment, startTyping, stopTyping } = useSocket();

  useEffect(() => {
    if (socket && isConnected) {
      // Join shipment room
      joinShipment(shipmentId);

      // Listen for new messages
      socket.on('new_message', (data) => {
        if (data.shipmentId === shipmentId) {
          setMessages(prev => [...prev, {
            id: Date.now(),
            senderId: data.senderId,
            message: data.message,
            timestamp: data.timestamp,
            senderName: data.senderId === receiverId ? receiverName : 'Sen'
          }]);
        }
      });

      // Listen for typing indicators
      socket.on('user_typing', (data) => {
        if (data.shipmentId === shipmentId && data.userId !== socket.id) {
          setOtherUserTyping(data.isTyping);
        }
      });

      return () => {
        leaveShipment(shipmentId);
      };
    }
  }, [socket, isConnected, shipmentId, receiverId, receiverName]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && socket && isConnected) {
      sendMessage({
        shipmentId,
        message: newMessage.trim(),
        receiverId
      });
      setNewMessage('');
      stopTyping(shipmentId);
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (e.target.value.trim() && !isTyping) {
      setIsTyping(true);
      startTyping(shipmentId);
    } else if (!e.target.value.trim() && isTyping) {
      setIsTyping(false);
      stopTyping(shipmentId);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex flex-col h-96 bg-white rounded-lg shadow-lg">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
              {receiverName.charAt(0).toUpperCase()}
            </div>
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
              isOnline ? 'bg-green-500' : 'bg-gray-400'
            }`}></div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{receiverName}</h3>
            <p className="text-sm text-gray-500">
              {isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            <Phone className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            <Video className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>Henüz mesaj yok. İlk mesajı siz gönderin!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.senderId === receiverId ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.senderId === receiverId
                    ? 'bg-gray-100 text-gray-900'
                    : 'bg-blue-600 text-white'
                }`}
              >
                <p className="text-sm">{message.message}</p>
                <p className={`text-xs mt-1 ${
                  message.senderId === receiverId ? 'text-gray-500' : 'text-blue-100'
                }`}>
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          ))
        )}
        
        {/* Typing Indicator */}
        {otherUserTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-4 py-2 rounded-lg">
              <div className="flex items-center gap-1">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-xs text-gray-500 ml-2">Yazıyor...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <button
            type="button"
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Smile className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            placeholder="Mesajınızı yazın..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={!isConnected}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || !isConnected}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        {!isConnected && (
          <p className="text-xs text-red-500 mt-2">Bağlantı kesildi. Yeniden bağlanılıyor...</p>
        )}
      </div>
    </div>
  );
};

export default RealtimeChat;





