import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { 
  ArrowLeft, 
  MessageCircle, 
  Search, 
  Send, 
  Paperclip, 
  Smile, 
  MoreVertical,
  Phone,
  Video,
  Star,
  Archive,
  Trash2,
  CheckCircle,
  Clock,
  Building2,
  Truck
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

const NakliyeciMessages: React.FC = () => {
  const [selectedChat, setSelectedChat] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')

  const [chats] = useState([
    {
      id: '1',
      name: 'Hızlı Kargo A.Ş.',
      lastMessage: 'Gönderi teslim edildi',
      time: '2 saat önce',
      unread: 0,
      avatar: 'HK',
      status: 'online',
      rating: 5,
      type: 'carrier'
    },
    {
      id: '2',
      name: 'Güvenli Taşımacılık',
      lastMessage: 'Yeni gönderi teklifi hazırladım',
      time: '4 saat önce',
      unread: 1,
      avatar: 'GT',
      status: 'offline',
      rating: 4.8,
      type: 'carrier'
    },
    {
      id: '3',
      name: 'TechCorp A.Ş.',
      lastMessage: 'Kurumsal gönderi talebi',
      time: '1 gün önce',
      unread: 0,
      avatar: 'TC',
      status: 'online',
      rating: 4.9,
      type: 'client'
    }
  ])

  const [messages] = useState({
    '1': [
      {
        id: 1,
        text: 'Merhaba, gönderi hakkında bilgi almak istiyorum',
        sender: 'user',
        time: '10:30',
        status: 'delivered'
      },
      {
        id: 2,
        text: 'Merhaba! Gönderiniz YN123456789 numarası ile takip edilebilir. Şu anda yolda ve yarın teslim edilecek.',
        sender: 'other',
        time: '10:32',
        status: 'delivered'
      },
      {
        id: 3,
        text: 'Gönderi teslim edildi',
        sender: 'other',
        time: '14:20',
        status: 'delivered'
      }
    ],
    '2': [
      {
        id: 1,
        text: 'Yeni gönderi teklifi hazırladım',
        sender: 'other',
        time: '09:15',
        status: 'delivered'
      },
      {
        id: 2,
        text: 'Teşekkürler, teklifi inceliyorum',
        sender: 'user',
        time: '09:20',
        status: 'delivered'
      }
    ],
    '3': [
      {
        id: 1,
        text: 'Kurumsal gönderi talebi',
        sender: 'other',
        time: '16:45',
        status: 'delivered'
      }
    ]
  })

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedChat) {
      // Simulate sending message
      console.log('Sending message:', newMessage)
      setNewMessage('')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="w-4 h-4 text-blue-500" />
      case 'sent': return <Clock className="w-4 h-4 text-gray-400" />
      default: return null
    }
  }

  const getChatIcon = (type: string) => {
    switch (type) {
      case 'carrier': return <Truck className="w-4 h-4 text-blue-600" />
      case 'client': return <Building2 className="w-4 h-4 text-green-600" />
      default: return <MessageCircle className="w-4 h-4 text-gray-600" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Nakliyeci Mesajlar - YolNet Kargo</title>
        <meta name="description" content="Taşıyıcılarla ve müşterilerle mesajlaşın." />
      </Helmet>

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container-custom">
          <div className="flex items-center py-4">
            <Link
              to="/nakliyeci/dashboard"
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200 mr-4"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-4">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Nakliyeci Mesajlar</h1>
              <p className="text-sm text-gray-600">Taşıyıcılarla ve müşterilerle iletişim kurun</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container-custom py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
            {/* Chat List */}
            <div className="lg:col-span-1">
              <Card className="h-full">
                <div className="p-4 border-b border-gray-200">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Mesaj ara..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="overflow-y-auto">
                  {chats.map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => setSelectedChat(chat.id)}
                      className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors duration-200 ${
                        selectedChat === chat.id ? 'bg-green-50 border-green-200' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {chat.avatar}
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                            chat.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-gray-900 truncate">{chat.name}</h3>
                            <span className="text-xs text-gray-500">{chat.time}</span>
                          </div>
                          <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <div className="flex items-center space-x-1">
                              {getChatIcon(chat.type)}
                              <span className="text-xs text-gray-500">
                                {chat.type === 'carrier' ? 'Taşıyıcı' : 'Müşteri'}
                              </span>
                            </div>
                            {chat.rating > 0 && (
                              <div className="flex items-center space-x-1">
                                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                <span className="text-xs text-gray-500">{chat.rating}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        {chat.unread > 0 && (
                          <div className="w-5 h-5 bg-green-600 text-white text-xs rounded-full flex items-center justify-center">
                            {chat.unread}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Chat Area */}
            <div className="lg:col-span-2">
              {selectedChat ? (
                <Card className="h-full flex flex-col">
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {chats.find(c => c.id === selectedChat)?.avatar}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {chats.find(c => c.id === selectedChat)?.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {chats.find(c => c.id === selectedChat)?.status === 'online' ? 'Çevrimiçi' : 'Çevrimdışı'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200">
                          <Phone className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200">
                          <Video className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages[selectedChat as keyof typeof messages]?.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.sender === 'user'
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{message.text}</p>
                          <div className="flex items-center justify-end mt-1 space-x-1">
                            <span className="text-xs opacity-70">{message.time}</span>
                            {message.sender === 'user' && getStatusIcon(message.status)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200">
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200">
                        <Paperclip className="w-4 h-4" />
                      </button>
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          placeholder="Mesaj yazın..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                        <button className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-600 hover:text-green-600 transition-colors duration-200">
                          <Smile className="w-4 h-4" />
                        </button>
                      </div>
                      <Button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        className="flex items-center space-x-1 bg-green-600 hover:bg-green-700"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Mesaj Seçin</h3>
                    <p className="text-gray-600">Görüntülemek için bir mesaj seçin</p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default NakliyeciMessages