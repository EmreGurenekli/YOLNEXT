import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Package, 
  MapPin, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Truck,
  Calendar,
  Eye,
  MessageCircle,
  Plus,
  Filter,
  Search,
  Download
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Shipment {
  id: string;
  title: string;
  from: string;
  to: string;
  status: 'preparing' | 'waiting' | 'in_transit' | 'delivered' | 'cancelled';
  createdAt: string;
  estimatedDelivery: string;
  actualDelivery?: string;
  price: number;
  carrierName?: string;
  trackingNumber?: string;
  description: string;
  category: string;
  weight: string;
  dimensions: string;
  specialRequirements: string[];
  trackingCode: string;
  subCategory: string;
  rating?: number;
  volume: string;
}

const IndividualMyShipments: React.FC = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  // Mock data
  const mockShipments: Shipment[] = [
    {
      id: '1',
      title: 'Ev Eşyası Taşıma',
      from: 'İstanbul, Kadıköy',
      to: 'Ankara, Çankaya',
      status: 'in_transit',
      createdAt: '2024-01-20',
      estimatedDelivery: '2024-01-25',
      price: 2500,
      carrierName: 'Hızlı Nakliyat',
      trackingNumber: 'TRK001234567',
      description: '2+1 daire eşyası taşıma',
      category: 'Ev Eşyası',
      weight: '500 kg',
      dimensions: '3x2x2 m',
      specialRequirements: ['Sigorta', 'Ambalaj'],
      trackingCode: 'IND-2024-001',
      subCategory: 'Daire Eşyası',
      rating: 4.8,
      volume: '12 m³'
    },
    {
      id: '2',
      title: 'Ofis Mobilyası',
      from: 'İzmir, Konak',
      to: 'Bursa, Osmangazi',
      status: 'delivered',
      createdAt: '2024-01-15',
      estimatedDelivery: '2024-01-18',
      actualDelivery: '2024-01-17',
      price: 1800,
      carrierName: 'Güvenli Taşıma',
      trackingNumber: 'TRK001234568',
      description: 'Ofis masası ve sandalyeler',
      category: 'Ofis Mobilyası',
      weight: '200 kg',
      dimensions: '2x1x1 m',
      specialRequirements: ['Özel Ambalaj'],
      trackingCode: 'IND-2024-002',
      subCategory: 'Mobilya',
      rating: 4.7,
      volume: '4 m³'
    },
    {
      id: '3',
      title: 'Kişisel Eşyalar',
      from: 'Antalya, Muratpaşa',
      to: 'İstanbul, Beşiktaş',
      status: 'waiting',
      createdAt: '2024-01-22',
      estimatedDelivery: '2024-01-28',
      price: 1200,
      description: 'Kişisel eşya ve kitaplar',
      category: 'Kişisel Eşya',
      weight: '100 kg',
      dimensions: '1x1x1 m',
      specialRequirements: ['Hassas Eşya'],
      trackingCode: 'IND-2024-003',
      subCategory: 'Kişisel',
      volume: '1 m³'
    },
    {
      id: '4',
      title: 'Elektronik Cihazlar',
      from: 'Ankara, Keçiören',
      to: 'İzmir, Karşıyaka',
      status: 'preparing',
      createdAt: '2024-01-23',
      estimatedDelivery: '2024-01-30',
      price: 900,
      description: 'Bilgisayar ve elektronik cihazlar',
      category: 'Elektronik',
      weight: '50 kg',
      dimensions: '0.5x0.5x0.5 m',
      specialRequirements: ['Hassas Eşya', 'Sigorta'],
      trackingCode: 'IND-2024-004',
      subCategory: 'Bilgisayar',
      volume: '0.125 m³'
    }
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setShipments(mockShipments);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'preparing':
        return { text: 'Hazırlanıyor', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle };
      case 'waiting':
        return { text: 'Teklif Bekliyor', color: 'bg-blue-100 text-blue-800', icon: Clock };
      case 'in_transit':
        return { text: 'Yolda', color: 'bg-green-100 text-green-800', icon: Truck };
      case 'delivered':
        return { text: 'Teslim Edildi', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle };
      case 'cancelled':
        return { text: 'İptal Edildi', color: 'bg-red-100 text-red-800', icon: XCircle };
      default:
        return { text: 'Bilinmiyor', color: 'bg-gray-100 text-gray-800', icon: AlertCircle };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_transit':
        return <Truck className="w-4 h-4" />;
      case 'preparing':
        return <Package className="w-4 h-4" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4" />;
      case 'waiting':
        return <Clock className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const handleViewDetails = (shipmentId: string) => {
    console.log('Gönderi detayları:', shipmentId);
  };

  const handleTrackShipment = (shipmentId: string) => {
    console.log('Gönderi takibi:', shipmentId);
  };

  const filteredShipments = shipments.filter(shipment => {
    const matchesSearch = shipment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shipment.trackingCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shipment.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shipment.to.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && ['in_transit', 'preparing', 'waiting'].includes(shipment.status)) ||
                         (statusFilter === 'completed' && shipment.status === 'delivered') ||
                         (statusFilter === 'pending' && shipment.status === 'waiting');
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-slate-800 to-blue-900 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Package className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Gönderiler yükleniyor...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Helmet>
        <title>Gönderilerim - YolNet</title>
        <meta name="description" content="Gönderilerinizi takip edin ve yönetin" />
      </Helmet>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header - Match Corporate Design */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-slate-800 to-blue-900 rounded-2xl flex items-center justify-center shadow-lg">
              <Package className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-3">
            Gönderilerinizi{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-blue-900">Takip Edin</span>
          </h1>
          <p className="text-lg text-slate-600">Gönderilerinizin durumunu takip edin ve yönetin</p>
        </div>

        {/* Filters Card */}
        <div className="bg-white rounded-2xl p-8 shadow-xl border border-slate-200 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Gönderi ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="active">Aktif Gönderiler</option>
              <option value="completed">Tamamlanan</option>
              <option value="pending">Beklemede</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="date">Tarihe Göre</option>
              <option value="status">Duruma Göre</option>
              <option value="priority">Önceliğe Göre</option>
              <option value="value">Değere Göre</option>
            </select>

            <button className="px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
              <Filter className="w-4 h-4" />
              Filtrele
            </button>
          </div>
        </div>

        {/* Shipments Table */}
        <div className="bg-white rounded-2xl p-8 shadow-xl border border-slate-200">
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Gönderi No</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Rota</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Durum</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Nakliyeci</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Fiyat</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filteredShipments.length > 0 ? (
                  filteredShipments.map((shipment) => (
                    <tr key={shipment.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-mono text-sm font-semibold text-slate-900">{shipment.trackingCode}</div>
                        <div className="text-xs text-slate-500">{shipment.createdAt}</div>
                        <div className="text-xs text-slate-500">{shipment.title}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm font-medium text-slate-900">{shipment.from} → {shipment.to}</div>
                        <div className="text-xs text-slate-500">{shipment.category} - {shipment.subCategory}</div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          shipment.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          shipment.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                          shipment.status === 'preparing' ? 'bg-orange-100 text-orange-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {getStatusIcon(shipment.status)}
                          {getStatusInfo(shipment.status).text}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm font-medium text-slate-900">{shipment.carrierName || 'Atanmamış'}</div>
                        {shipment.carrierName && shipment.rating && (
                          <div className="text-xs text-slate-500">{shipment.rating}/5 ⭐</div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm font-bold text-slate-900">₺{shipment.price.toLocaleString()}</div>
                        <div className="text-xs text-slate-500">{shipment.weight} • {shipment.volume}</div>
                        <div className="text-xs text-slate-500">{new Date(shipment.estimatedDelivery).toLocaleDateString('tr-TR')}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleViewDetails(shipment.id)}
                            className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-medium rounded-lg transition-colors"
                          >
                            Detay
                          </button>
                          {shipment.status !== 'waiting' && (
                            <button 
                              onClick={() => handleTrackShipment(shipment.id)}
                              className="px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 text-xs font-medium rounded-lg transition-colors"
                            >
                              Takip
                            </button>
                          )}
                          <button className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors">
                            Mesaj
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-slate-900 mb-2">Gönderi bulunamadı</h3>
                      <p className="text-slate-500">Arama kriterlerinize uygun gönderi bulunmuyor.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndividualMyShipments;