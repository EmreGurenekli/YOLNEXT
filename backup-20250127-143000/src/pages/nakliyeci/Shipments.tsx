import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { 
  ArrowLeft, 
  Package, 
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
  Truck
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'

const NakliyeciShipments: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')

  const [shipments] = useState([
    {
      id: 1,
      trackingNumber: 'YN123456789',
      sender: 'TechCorp A.Ş.',
      receiver: 'Ahmet Yılmaz',
      from: 'İstanbul',
      to: 'Ankara',
      status: 'in_transit',
      date: '2024-01-15',
      price: 150,
      weight: '2.5 kg',
      category: 'Döküman',
      estimatedDelivery: '2024-01-17',
      carrier: 'Hızlı Kargo A.Ş.',
      priority: 'normal'
    },
    {
      id: 2,
      trackingNumber: 'YN123456790',
      sender: 'E-Ticaret Ltd.',
      receiver: 'Fatma Demir',
      from: 'İzmir',
      to: 'Bursa',
      status: 'delivered',
      date: '2024-01-16',
      price: 200,
      weight: '5.0 kg',
      category: 'Paket',
      estimatedDelivery: '2024-01-18',
      carrier: 'Güvenli Taşımacılık',
      priority: 'high'
    },
    {
      id: 3,
      trackingNumber: 'YN123456791',
      sender: 'Lojistik A.Ş.',
      receiver: 'Mehmet Kaya',
      from: 'Antalya',
      to: 'İstanbul',
      status: 'pending',
      date: '2024-01-17',
      price: 300,
      weight: '8.0 kg',
      category: 'Kırılabilir',
      estimatedDelivery: '2024-01-20',
      carrier: 'Özel Kargo Hizmetleri',
      priority: 'urgent'
    }
  ])

  const statuses = [
    { value: 'all', label: 'Tümü', count: shipments.length },
    { value: 'pending', label: 'Beklemede', count: shipments.filter(s => s.status === 'pending').length },
    { value: 'in_transit', label: 'Yolda', count: shipments.filter(s => s.status === 'in_transit').length },
    { value: 'delivered', label: 'Teslim Edildi', count: shipments.filter(s => s.status === 'delivered').length }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'in_transit': return 'bg-blue-100 text-blue-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Beklemede'
      case 'in_transit': return 'Yolda'
      case 'delivered': return 'Teslim Edildi'
      case 'cancelled': return 'İptal Edildi'
      default: return 'Bilinmiyor'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />
      case 'in_transit': return <Truck className="w-4 h-4" />
      case 'delivered': return <CheckCircle className="w-4 h-4" />
      case 'cancelled': return <XCircle className="w-4 h-4" />
      default: return <Package className="w-4 h-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'normal': return 'bg-blue-100 text-blue-800'
      case 'low': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Acil'
      case 'high': return 'Yüksek'
      case 'normal': return 'Normal'
      case 'low': return 'Düşük'
      default: return 'Bilinmiyor'
    }
  }

  const filteredShipments = shipments.filter(shipment => {
    const matchesSearch = shipment.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shipment.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shipment.receiver.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shipment.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shipment.to.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = selectedStatus === 'all' || shipment.status === selectedStatus
    
    return matchesSearch && matchesStatus
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Gönderiler - YolNet Kargo</title>
        <meta name="description" content="Gönderileri yönetin ve takip edin." />
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
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gönderiler</h1>
              <p className="text-sm text-gray-600">Gönderileri yönetin ve takip edin</p>
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
                  placeholder="Gönderi ara..."
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
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              <span>Yeni Gönderi</span>
            </Button>
          </div>
        </Card>

        {/* Shipments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredShipments.map((shipment) => (
            <Card key={shipment.id} className="hover:shadow-lg transition-all duration-200">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center text-white font-semibold">
                      {shipment.trackingNumber.slice(-2)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{shipment.trackingNumber}</h3>
                      <p className="text-sm text-gray-600">{shipment.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(shipment.status)}`}>
                      {getStatusIcon(shipment.status)}
                      <span className="ml-1">{getStatusText(shipment.status)}</span>
                    </span>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>{shipment.from} → {shipment.to}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>Teslim: {new Date(shipment.estimatedDelivery).toLocaleDateString('tr-TR')}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Truck className="w-4 h-4 mr-2" />
                    <span>{shipment.carrier}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm">
                    <p className="text-gray-600">Gönderen: {shipment.sender}</p>
                    <p className="text-gray-600">Alıcı: {shipment.receiver}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">₺{shipment.price}</p>
                    <p className="text-sm text-gray-500">{shipment.weight}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(shipment.priority)}`}>
                    {getPriorityText(shipment.priority)} Öncelik
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200">
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
                    <p className="text-xs text-gray-500">{new Date(shipment.date).toLocaleDateString('tr-TR')}</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredShipments.length === 0 && (
          <Card className="p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Gönderi bulunamadı</h3>
            <p className="text-gray-600 mb-4">Arama kriterlerinize uygun gönderi bulunamadı.</p>
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

export default NakliyeciShipments