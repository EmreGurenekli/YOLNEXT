import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { 
  ArrowLeft, 
  Truck, 
  Search, 
  Filter, 
  Plus,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Star,
  Phone,
  Mail,
  MessageCircle
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'

const NakliyeciCarriers: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')

  const [carriers] = useState([
    {
      id: 1,
      name: 'Hızlı Kargo A.Ş.',
      contact: 'Ahmet Yılmaz',
      phone: '+90 555 123 45 67',
      email: 'ahmet@hizlikargo.com',
      location: 'İstanbul',
      rating: 4.8,
      completedJobs: 156,
      status: 'active',
      joinDate: '2023-01-15',
      lastActive: '2 saat önce',
      specialties: ['Döküman', 'Paket', 'Kırılabilir'],
      vehicles: ['Kamyonet', 'Kamyon'],
      coverage: ['İstanbul', 'Ankara', 'İzmir']
    },
    {
      id: 2,
      name: 'Güvenli Taşımacılık',
      contact: 'Fatma Demir',
      phone: '+90 555 234 56 78',
      email: 'fatma@guvenlitasimacilik.com',
      location: 'Ankara',
      rating: 4.6,
      completedJobs: 89,
      status: 'active',
      joinDate: '2023-03-20',
      lastActive: '4 saat önce',
      specialties: ['Paket', 'Elektronik'],
      vehicles: ['Kamyon', 'Tır'],
      coverage: ['Ankara', 'Konya', 'Kayseri']
    },
    {
      id: 3,
      name: 'Özel Kargo Hizmetleri',
      contact: 'Mehmet Kaya',
      phone: '+90 555 345 67 89',
      email: 'mehmet@ozelkargo.com',
      location: 'İzmir',
      rating: 4.9,
      completedJobs: 203,
      status: 'inactive',
      joinDate: '2023-06-10',
      lastActive: '1 hafta önce',
      specialties: ['Kırılabilir', 'Değerli Eşya'],
      vehicles: ['Kamyonet', 'Kamyon'],
      coverage: ['İzmir', 'Bursa', 'Antalya']
    }
  ])

  const statuses = [
    { value: 'all', label: 'Tümü', count: carriers.length },
    { value: 'active', label: 'Aktif', count: carriers.filter(c => c.status === 'active').length },
    { value: 'inactive', label: 'Pasif', count: carriers.filter(c => c.status === 'inactive').length }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Aktif'
      case 'inactive': return 'Pasif'
      default: return 'Bilinmiyor'
    }
  }

  const filteredCarriers = carriers.filter(carrier => {
    const matchesSearch = carrier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         carrier.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         carrier.location.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = selectedStatus === 'all' || carrier.status === selectedStatus
    
    return matchesSearch && matchesStatus
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Taşıyıcılar - YolNet Kargo</title>
        <meta name="description" content="Taşıyıcıları yönetin ve takip edin." />
      </Helmet>

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container-custom">
          <div className="flex items-center py-4">
            <Link
              to="/nakliyeci/dashboard"
              className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200 mr-4"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-4">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Taşıyıcılar</h1>
              <p className="text-sm text-gray-600">Taşıyıcıları yönetin ve takip edin</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container-custom py-8">
        {/* Filters and Search */}
        <Card className="p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Taşıyıcı ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  {statuses.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label} ({status.count})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Button className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Yeni Taşıyıcı</span>
            </Button>
          </div>
        </Card>

        {/* Carriers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCarriers.map((carrier) => (
            <Card key={carrier.id} className="hover:shadow-lg transition-all duration-200">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center text-white font-semibold">
                      {carrier.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{carrier.name}</h3>
                      <p className="text-sm text-gray-600">{carrier.contact}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(carrier.status)}`}>
                      {getStatusText(carrier.status)}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>{carrier.location}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="w-4 h-4 mr-2" />
                    <span>{carrier.phone}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="w-4 h-4 mr-2" />
                    <span>{carrier.email}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>Son aktif: {carrier.lastActive}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Değerlendirme</span>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-semibold text-gray-900">{carrier.rating}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Tamamlanan İş</span>
                    <span className="text-sm font-semibold text-gray-900">{carrier.completedJobs}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Uzmanlık Alanları:</p>
                  <div className="flex flex-wrap gap-1">
                    {carrier.specialties.map((specialty, index) => (
                      <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Araçlar:</p>
                  <div className="flex flex-wrap gap-1">
                    {carrier.vehicles.map((vehicle, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {vehicle}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Kapsama Alanı:</p>
                  <div className="flex flex-wrap gap-1">
                    {carrier.coverage.map((area, index) => (
                      <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    <button className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                      <MessageCircle className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors duration-200">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Katılım: {carrier.joinDate}</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredCarriers.length === 0 && (
          <Card className="p-12 text-center">
            <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Taşıyıcı bulunamadı</h3>
            <p className="text-gray-600 mb-4">Arama kriterlerinize uygun taşıyıcı bulunamadı.</p>
            <Button onClick={() => {
              setSearchTerm('')
              setSelectedStatus('all')
            }}>
              Filtreleri Temizle
            </Button>
          </Card>
        )}
      </main>
    </div>
  )
}

export default NakliyeciCarriers