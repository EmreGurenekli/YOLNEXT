import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Package, 
  Search, 
  Filter, 
  SortAsc, 
  Eye, 
  MapPin, 
  Clock, 
  Star, 
  Truck, 
  CheckCircle, 
  CheckCircle2,
  AlertCircle, 
  XCircle,
  ArrowRight,
  Calendar,
  Weight,
  Ruler,
  Building2,
  Target,
  TrendingUp,
  BarChart3,
  Download,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Share2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function CorporateShipments() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [expandedItems, setExpandedItems] = useState<number[]>([]);

  const handleViewDetails = (shipmentId: number) => {
    console.log('Gönderi detayları:', shipmentId);
    navigate(`/corporate/shipments?details=${shipmentId}`);
  };

  const handleTrackShipment = (shipmentId: number) => {
    console.log('Gönderi takibi:', shipmentId);
    navigate('/corporate/tracking');
  };

  const toggleExpanded = (id: number) => {
    setExpandedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const shipments = [
    {
      id: 1,
      title: "Gıda Ürünleri - Soğuk Zincir",
      trackingCode: "CORP-2024-001",
      from: "Migros Depo - İstanbul",
      to: "Migros Mağaza - Ankara",
      status: "Yolda",
      statusColor: "bg-orange-500",
      statusText: "Yolda",
      carrier: "Kargo Express A.Ş.",
      rating: 4.9,
      offers: 5,
      createdAt: "2024-01-15",
      estimatedDelivery: "2024-01-16 09:00",
      progress: 75,
      priority: "Yüksek",
      category: "Gıda",
      subCategory: "Soğuk Zincir",
      weight: "2.5 ton",
      volume: "15 m³",
      value: "₺45,000",
      specialRequirements: ["Soğuk Taşıma", "Acil"],
      dimensions: "300x200x150 cm",
      insurance: "Tam Sigorta",
      paymentMethod: "Fatura",
      notes: "Özel soğuk zincir gereksinimleri var"
    },
    {
      id: 2,
      title: "Tekstil Ürünleri",
      trackingCode: "CORP-2024-002",
      from: "Migros Depo - İzmir",
      to: "Migros Mağaza - Bursa",
      status: "Yükleme",
      statusColor: "bg-blue-500",
      statusText: "Yükleme",
      carrier: "Hızlı Lojistik",
      rating: 4.7,
      offers: 3,
      createdAt: "2024-01-15",
      estimatedDelivery: "2024-01-15 18:00",
      progress: 25,
      priority: "Normal",
      category: "Tekstil",
      subCategory: "Giyim",
      weight: "1.8 ton",
      volume: "12 m³",
      value: "₺28,500",
      specialRequirements: ["Güvenli"],
      dimensions: "250x180x120 cm",
      insurance: "Kısmi Sigorta",
      paymentMethod: "Nakit",
      notes: "Kırılabilir ürünler mevcut"
    },
    {
      id: 3,
      title: "Elektronik Ürünler",
      trackingCode: "CORP-2024-003",
      from: "Migros Depo - Ankara",
      to: "Migros Mağaza - İzmir",
      status: "Teslim Edildi",
      statusColor: "bg-green-500",
      statusText: "Teslim Edildi",
      carrier: "Güvenli Taşımacılık",
      rating: 4.8,
      offers: 7,
      createdAt: "2024-01-14",
      estimatedDelivery: "2024-01-15 14:00",
      progress: 100,
      priority: "Düşük",
      category: "Elektronik",
      subCategory: "Bilgisayar",
      weight: "0.8 ton",
      volume: "8 m³",
      value: "₺67,200",
      specialRequirements: ["Kırılabilir", "Güvenli"],
      dimensions: "200x150x100 cm",
      insurance: "Tam Sigorta",
      paymentMethod: "Fatura",
      notes: "Elektronik cihazlar için özel ambalaj"
    },
    {
      id: 4,
      title: "Kimyasal Ürünler",
      trackingCode: "CORP-2024-004",
      from: "Migros Depo - İstanbul",
      to: "Migros Mağaza - Antalya",
      status: "Beklemede",
      statusColor: "bg-yellow-500",
      statusText: "Teklif Bekliyor",
      carrier: null,
      rating: null,
      offers: 0,
      createdAt: "2024-01-15",
      estimatedDelivery: "2024-01-17 10:00",
      progress: 0,
      priority: "Yüksek",
      category: "Kimyasal",
      subCategory: "Temizlik",
      weight: "1.2 ton",
      volume: "10 m³",
      value: "₺15,600",
      specialRequirements: ["Tehlikeli Madde", "Güvenli"],
      dimensions: "180x120x90 cm",
      insurance: "Tam Sigorta",
      paymentMethod: "Fatura",
      notes: "Tehlikeli madde sınıfı: Sınıf 3"
    }
  ];

  const filteredShipments = shipments.filter(shipment => {
    const matchesSearch = shipment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shipment.trackingCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shipment.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shipment.to.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && ['Yolda', 'Yükleme', 'Beklemede'].includes(shipment.status)) ||
                         (filterStatus === 'completed' && shipment.status === 'Teslim Edildi') ||
                         (filterStatus === 'pending' && shipment.status === 'Beklemede');
    
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Yolda':
        return <Truck className="w-4 h-4" />;
      case 'Yükleme':
        return <Package className="w-4 h-4" />;
      case 'Teslim Edildi':
        return <CheckCircle className="w-4 h-4" />;
      case 'Beklemede':
        return <Clock className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Yüksek':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Normal':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Düşük':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header - Match Individual My Shipments (no card) */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg">
              <Package className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-3">
            Gönderilerinizi{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-indigo-700">Takip Edin</span>
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
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
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
                          shipment.status === 'Teslim Edildi' ? 'bg-green-100 text-green-800' :
                          shipment.status === 'Yolda' ? 'bg-blue-100 text-blue-800' :
                          shipment.status === 'Yükleme' ? 'bg-orange-100 text-orange-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {getStatusIcon(shipment.status)}
                          {shipment.statusText}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm font-medium text-slate-900">{shipment.carrier || 'Atanmamış'}</div>
                        {shipment.carrier && (
                          <div className="text-xs text-slate-500">{shipment.rating}/5 ⭐</div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm font-bold text-slate-900">{shipment.value}</div>
                        <div className="text-xs text-slate-500">{shipment.weight} • {shipment.volume}</div>
                        <div className="text-xs text-slate-500">{shipment.estimatedDelivery}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleViewDetails(shipment.id)}
                            className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-medium rounded-lg transition-colors"
                          >
                            Detay
                          </button>
                          {shipment.status !== 'Beklemede' && (
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
}