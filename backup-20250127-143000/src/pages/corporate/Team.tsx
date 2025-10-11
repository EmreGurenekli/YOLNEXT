import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Mail, 
  Phone, 
  Edit, 
  Trash2, 
  UserPlus, 
  Shield, 
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  MapPin,
  Calendar
} from 'lucide-react';

export default function CorporateTeam() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  const teamMembers = [
    {
      id: 1,
      name: 'Ahmet Yılmaz',
      email: 'ahmet.yilmaz@migros.com.tr',
      phone: '+90 212 555 0123',
      role: 'Lojistik Müdürü',
      department: 'Lojistik',
      status: 'active',
      lastActive: '2 saat önce',
      avatar: 'AY',
      permissions: ['admin', 'shipment', 'reports'],
      joinDate: '2020-03-15',
      location: 'İstanbul'
    },
    {
      id: 2,
      name: 'Ayşe Demir',
      email: 'ayse.demir@migros.com.tr',
      phone: '+90 212 555 0124',
      role: 'Operasyon Uzmanı',
      department: 'Lojistik',
      status: 'active',
      lastActive: '5 dakika önce',
      avatar: 'AD',
      permissions: ['shipment', 'tracking'],
      joinDate: '2021-07-20',
      location: 'İstanbul'
    },
    {
      id: 3,
      name: 'Mehmet Kaya',
      email: 'mehmet.kaya@migros.com.tr',
      phone: '+90 212 555 0125',
      role: 'Mali İşler Uzmanı',
      department: 'Mali İşler',
      status: 'active',
      lastActive: '1 saat önce',
      avatar: 'MK',
      permissions: ['reports', 'payments'],
      joinDate: '2019-11-10',
      location: 'Ankara'
    },
    {
      id: 4,
      name: 'Fatma Özkan',
      email: 'fatma.ozkan@migros.com.tr',
      phone: '+90 212 555 0126',
      role: 'Müşteri Hizmetleri',
      department: 'Müşteri Hizmetleri',
      status: 'away',
      lastActive: '3 gün önce',
      avatar: 'FÖ',
      permissions: ['messages', 'support'],
      joinDate: '2022-01-15',
      location: 'İzmir'
    },
    {
      id: 5,
      name: 'Ali Veli',
      email: 'ali.veli@migros.com.tr',
      phone: '+90 212 555 0127',
      role: 'IT Uzmanı',
      department: 'Bilgi İşlem',
      status: 'inactive',
      lastActive: '1 hafta önce',
      avatar: 'AV',
      permissions: ['admin', 'settings'],
      joinDate: '2018-05-03',
      location: 'İstanbul'
    }
  ];

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.role.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || member.role.toLowerCase().includes(filterRole.toLowerCase());
    
    return matchesSearch && matchesRole;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'away':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Aktif';
      case 'away':
        return 'Uzakta';
      case 'inactive':
        return 'Pasif';
      default:
        return 'Bilinmiyor';
    }
  };

  const getRoleColor = (role: string) => {
    if (role.includes('Müdür')) return 'bg-blue-100 text-blue-800';
    if (role.includes('Uzman')) return 'bg-green-100 text-green-800';
    if (role.includes('Hizmetleri')) return 'bg-purple-100 text-purple-800';
    if (role.includes('IT')) return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <>
      <Helmet>
        <title>Ekip Yönetimi - YolNet Kargo</title>
        <meta name="description" content="Kurumsal ekip yönetimi" />
      </Helmet>

      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Ekip Yönetimi</h1>
              <p className="text-gray-600">Takım üyelerinizi yönetin ve izinlerini düzenleyin</p>
            </div>
            <div className="flex items-center gap-4">
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Toplu Ekleme
              </button>
              <button 
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Üye Ekle
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-600">Toplam Üye</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{teamMembers.length}</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-600">Aktif Üye</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {teamMembers.filter(m => m.status === 'active').length}
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-600">Admin</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {teamMembers.filter(m => m.permissions.includes('admin')).length}
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-5 h-5 text-orange-600" />
                <span className="text-sm font-medium text-gray-600">Son 24 Saat</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {teamMembers.filter(m => m.lastActive.includes('saat') || m.lastActive.includes('dakika')).length}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Üye ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Tüm Roller</option>
                <option value="müdür">Müdür</option>
                <option value="uzman">Uzman</option>
                <option value="hizmetleri">Müşteri Hizmetleri</option>
                <option value="it">IT</option>
              </select>

              <button className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                <Filter className="w-4 h-4" />
                Filtrele
              </button>
            </div>
          </div>
        </div>

        {/* Team Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map((member) => (
            <div key={member.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                      {member.avatar}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{member.name}</h3>
                      <p className="text-sm text-gray-600">{member.role}</p>
                    </div>
                  </div>
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{member.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{member.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{member.location}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(member.status)}`}>
                    {getStatusText(member.status)}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(member.role)}`}>
                    {member.department}
                  </span>
                </div>

                <div className="text-xs text-gray-500 mb-4">
                  Son aktif: {member.lastActive}
                </div>

                <div className="flex items-center gap-2">
                  <button className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                    <Edit className="w-4 h-4" />
                    Düzenle
                  </button>
                  <button className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors">
                    <Mail className="w-4 h-4" />
                  </button>
                  <button className="px-3 py-2 border border-red-300 text-red-700 text-sm rounded-lg hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredMembers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Üye bulunamadı</h3>
            <p className="text-gray-500 mb-6">Arama kriterlerinize uygun üye bulunamadı</p>
            <button 
              onClick={() => { setSearchTerm(''); setFilterRole('all'); }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Tümünü Göster
            </button>
          </div>
        )}
      </div>
    </>
  );
}