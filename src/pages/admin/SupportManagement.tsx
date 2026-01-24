import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  User,
  Search,
  Filter,
  Send,
  Paperclip,
  Eye,
  Edit,
  X,
  UserPlus
} from 'lucide-react';
import { createApiUrl } from '../../config/api';

interface SupportTicket {
  id: number;
  ticket_number: string;
  user_name: string;
  user_email: string;
  category: string;
  priority: string;
  status: string;
  subject: string;
  created_at: string;
  assigned_admin_name?: string;
  user_message_count: number;
  admin_message_count: number;
}

interface TicketDetail {
  ticket: any;
  messages: any[];
  attachments: any[];
  relatedShipment?: any;
}

const SupportManagement: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({});
  const [admins, setAdmins] = useState([]);
  
  // Filters
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    priority: 'all',
    assignedTo: 'all',
    search: ''
  });

  // Response form
  const [responseForm, setResponseForm] = useState({
    message: '',
    isInternal: false,
    files: [] as File[]
  });

  useEffect(() => {
    loadTickets();
    loadAdmins();
  }, [filters]);

  const loadTickets = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          params.append(key, value);
        }
      });

      const response = await fetch(createApiUrl(`/api/admin/support/tickets?${params}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTickets(data.data?.tickets || []);
        setStats(data.data?.statistics || {});
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAdmins = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(createApiUrl('/api/admin/support/admins'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAdmins(data.data || []);
      }
    } catch (error) {
      console.error('Error loading admins:', error);
    }
  };

  const loadTicketDetails = async (ticketId: number) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(createApiUrl(`/api/admin/support/tickets/${ticketId}`), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedTicket(data.data);
      }
    } catch (error) {
      console.error('Error loading ticket details:', error);
    }
  };

  const updateTicket = async (ticketId: number, updates: any) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(createApiUrl(`/api/admin/support/tickets/${ticketId}`), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        loadTickets();
        if (selectedTicket) {
          loadTicketDetails(ticketId);
        }
      }
    } catch (error) {
      console.error('Error updating ticket:', error);
    }
  };

  const sendResponse = async () => {
    if (!selectedTicket || !responseForm.message.trim()) return;

    try {
      const token = localStorage.getItem('authToken');
      const formData = new FormData();
      
      formData.append('message', responseForm.message);
      formData.append('isInternal', responseForm.isInternal.toString());
      
      responseForm.files.forEach(file => {
        formData.append('attachments', file);
      });

      const response = await fetch(createApiUrl(`/api/admin/support/tickets/${selectedTicket.ticket.id}/messages`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        setResponseForm({ message: '', isInternal: false, files: [] });
        loadTicketDetails(selectedTicket.ticket.id);
        loadTickets();
      }
    } catch (error) {
      console.error('Error sending response:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      open: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      waiting_user: 'bg-orange-100 text-orange-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      urgent: 'text-red-600',
      high: 'text-orange-600',
      medium: 'text-yellow-600',
      low: 'text-green-600'
    };
    return colors[priority as keyof typeof colors] || 'text-gray-600';
  };

  return (
    <>
      <Helmet>
        <title>Destek Yönetimi - Admin Panel - YolNext</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        <div className="flex h-screen">
          {/* Sidebar - Tickets List */}
          <div className="w-1/2 bg-white border-r border-gray-200 flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Destek Yönetimi</h1>
              
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-sm text-blue-600">Açık Talepler</div>
                  <div className="text-xl font-bold text-blue-900">
                    {stats.open_tickets || 0}
                  </div>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <div className="text-sm text-orange-600">Atanmamış</div>
                  <div className="text-xl font-bold text-orange-900">
                    {stats.unassigned_tickets || 0}
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Destek taleplerinde ara..."
                    value={filters.search}
                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Tüm Durumlar</option>
                    <option value="open">Açık</option>
                    <option value="in_progress">İşlemde</option>
                    <option value="waiting_user">Kullanıcı Bekliyor</option>
                    <option value="resolved">Çözüldü</option>
                  </select>

                  <select
                    value={filters.priority}
                    onChange={(e) => setFilters({...filters, priority: e.target.value})}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Tüm Öncelikler</option>
                    <option value="urgent">Acil</option>
                    <option value="high">Yüksek</option>
                    <option value="medium">Orta</option>
                    <option value="low">Düşük</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tickets List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Yükleniyor...</p>
                </div>
              ) : tickets.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Destek talebi bulunamadı</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      onClick={() => loadTicketDetails(ticket.id)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedTicket?.ticket.id === ticket.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                            {ticket.status}
                          </span>
                          <span className={`text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(ticket.created_at).toLocaleDateString('tr-TR')}
                        </div>
                      </div>
                      
                      <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
                        {ticket.subject}
                      </h3>
                      
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                        <span>#{ticket.ticket_number}</span>
                        <span>•</span>
                        <span>{ticket.user_name}</span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">{ticket.category}</span>
                        <div className="flex items-center gap-3">
                          {ticket.assigned_admin_name && (
                            <span className="text-blue-600">
                              <UserPlus className="w-3 h-3 inline mr-1" />
                              {ticket.assigned_admin_name}
                            </span>
                          )}
                          <span className="text-gray-500">
                            {ticket.user_message_count + ticket.admin_message_count} mesaj
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main Content - Ticket Details */}
          <div className="flex-1 flex flex-col">
            {selectedTicket ? (
              <>
                {/* Ticket Header */}
                <div className="p-6 bg-white border-b border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-2">
                        {selectedTicket.ticket.subject}
                      </h2>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>#{selectedTicket.ticket.ticket_number}</span>
                        <span>•</span>
                        <span>{selectedTicket.ticket.user_name}</span>
                        <span>•</span>
                        <span>{selectedTicket.ticket.category}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedTicket.ticket.status}
                        onChange={(e) => updateTicket(selectedTicket.ticket.id, { status: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="open">Açık</option>
                        <option value="in_progress">İşlemde</option>
                        <option value="waiting_user">Kullanıcı Bekliyor</option>
                        <option value="resolved">Çözüldü</option>
                        <option value="closed">Kapatıldı</option>
                      </select>

                      <select
                        value={selectedTicket.ticket.assigned_admin_id || ''}
                        onChange={(e) => updateTicket(selectedTicket.ticket.id, { assignedAdminId: e.target.value || null })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Atanmamış</option>
                        {admins.map((admin: any) => (
                          <option key={admin.id} value={admin.id}>
                            {admin.name} ({admin.active_tickets})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">İlk Açıklama:</h4>
                    <p className="text-gray-700">{selectedTicket.ticket.description}</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                  <div className="space-y-4">
                    {selectedTicket.messages.map((message, index) => (
                      <div
                        key={message.id}
                        className={`p-4 rounded-lg ${
                          message.sender_type === 'user'
                            ? 'bg-white border-l-4 border-blue-500'
                            : message.is_internal
                            ? 'bg-yellow-50 border-l-4 border-yellow-500'
                            : 'bg-green-50 border-l-4 border-green-500'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">
                              {message.sender_name}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              message.sender_type === 'user' 
                                ? 'bg-blue-100 text-blue-800'
                                : message.is_internal
                                ? 'bg-yellow-100 text-yellow-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {message.sender_type === 'user' ? 'Kullanıcı' : 
                               message.is_internal ? 'Dahili Not' : 'Admin'}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(message.created_at).toLocaleString('tr-TR')}
                          </span>
                        </div>
                        <p className="text-gray-800 whitespace-pre-wrap">{message.message_content}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Response Form */}
                <div className="p-6 bg-white border-t border-gray-200">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={responseForm.isInternal}
                          onChange={(e) => setResponseForm({...responseForm, isInternal: e.target.checked})}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">Dahili not (sadece adminler görebilir)</span>
                      </label>
                    </div>

                    <textarea
                      value={responseForm.message}
                      onChange={(e) => setResponseForm({...responseForm, message: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={4}
                      placeholder="Yanıtınızı yazınız..."
                    />

                    <div className="flex items-center justify-between">
                      <input
                        type="file"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setResponseForm({...responseForm, files});
                        }}
                        className="text-sm"
                      />

                      <button
                        onClick={sendResponse}
                        disabled={!responseForm.message.trim()}
                        className="bg-gradient-to-r from-slate-800 to-blue-900 text-white px-6 py-2 rounded-lg hover:from-blue-900 hover:to-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        Gönder
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Destek Talebi Seçiniz
                  </h3>
                  <p className="text-gray-500">
                    Detayları görüntülemek için soldaki listeden bir destek talebi seçiniz.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SupportManagement;











