import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Package, 
  Search, 
  Filter, 
  MapPin, 
  Clock, 
  DollarSign, 
  Truck, 
  Star, 
  Eye, 
  Plus,
  ArrowRight,
  Target,
  Zap,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function NakliyeciLoads() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  // Yeni ilanlar
  const newLoads = [
    {
      id: 1,
      title: "Ev Eşyaları - 3+1",
      from: "Üsküdar, İstanbul",
      to: "Çankaya, Ankara",
      category: "Ev Taşıma",
      weight: "3.5 ton",
      volume: "25m³",
      vehicleType: "Kamyon",
      budget: "4.000-5.000₺",
      priority: "Yüksek",
      timeLeft: "2 saat 15 dk",
      additionalLoads: 3,
      distance: "450 km",
      estimatedTime: "6 saat"
    },
    {
      id: 2,
      title: "Ofis Eşyaları",
      from: "Şişli, İstanbul",
      to: "Konak, İzmir",
      category: "Ofis Taşıma",
      weight: "2.8 ton",
      volume: "18m³",
      vehicleType: "Tır",
      budget: "3.500-4.200₺",
      priority: "Orta",
      timeLeft: "4 saat 30 dk",
      additionalLoads: 1,
      distance: "565 km",
      estimatedTime: "8 saat"
    },
    {
      id: 3,
      title: "Hammade Taşıma",
      from: "Gebze, Kocaeli",
      to: "Merkez, Bursa",
      category: "Hammade",
      weight: "5.2 ton",
      volume: "35m³",
      vehicleType: "Tır",
      budget: "2.800-3.500₺",
      priority: "Düşük",
      timeLeft: "6 saat 45 dk",
      additionalLoads: 0,
      distance: "180 km",
      estimatedTime: "3 saat"
    },
    {
      id: 4,
      title: "Ev Eşyaları - 2+1",
      from: "Kadıköy, İstanbul",
      to: "Çankaya, Ankara",
      category: "Ev Taşıma",
      weight: "2.1 ton",
      volume: "15m³",
      vehicleType: "Kamyon",
      budget: "3.200-4.000₺",
      priority: "Yüksek",
      timeLeft: "1 saat 20 dk",
      additionalLoads: 2,
      distance: "450 km",
      estimatedTime: "6 saat"
    }
  ];

  // Filtrelenmiş ilanlar
  const filteredLoads = newLoads.filter(load => {
    const matchesSearch = load.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         load.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         load.to.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || load.priority.toLowerCase() === filterStatus.toLowerCase();
    const matchesPriority = filterPriority === 'all' || load.priority.toLowerCase() === filterPriority.toLowerCase();
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleMakeOffer = (loadId: number) => {
    navigate(`/nakliyeci/offers?load=${loadId}`);
  };

  const handleViewDetails = (loadId: number) => {
    navigate(`/nakliyeci/loads?details=${loadId}`);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Yüksek': return 'bg-red-100 text-red-800';
      case 'Orta': return 'bg-yellow-100 text-yellow-800';
      case 'Düşük': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVehicleIcon = (vehicleType: string) => {
    switch (vehicleType) {
      case 'Kamyon': return '🚛';
      case 'Tır': return '🚚';
      case 'Kamyonet': return '🚐';
      default: return '🚛';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Yeni İlanlar - Nakliyeci Panel</title>
      </Helmet>

      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Yeni İlanlar</h1>
          <p className="text-gray-600">Bölgenizdeki yeni taşıma ilanlarına teklif verin</p>
        </div>

        {/* Filtreler */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="İlan ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tüm Öncelikler</option>
              <option value="yüksek">Yüksek Öncelik</option>
              <option value="orta">Orta Öncelik</option>
              <option value="düşük">Düşük Öncelik</option>
            </select>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tüm Kategoriler</option>
              <option value="ev taşıma">Ev Taşıma</option>
              <option value="ofis taşıma">Ofis Taşıma</option>
              <option value="hammade">Hammade</option>
            </select>

            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center">
              <Filter className="w-5 h-5 mr-2" />
              Filtrele
            </button>
          </div>
        </div>

        {/* İlan Listesi */}
        <div className="space-y-6">
          {filteredLoads.map((load) => (
            <div key={load.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{load.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(load.priority)}`}>
                      {load.priority}
                    </span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {load.category}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-6 text-gray-600 mb-3">
                    <div className="flex items-center">
                      <MapPin className="w-5 h-5 mr-2" />
                      <span>{load.from} → {load.to}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-5 h-5 mr-2" />
                      <span>{load.timeLeft}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-lg">{getVehicleIcon(load.vehicleType)}</span>
                      <span className="ml-1">{load.vehicleType}</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{load.budget}</p>
                  <p className="text-sm text-gray-600">Bütçe aralığı</p>
                </div>
              </div>

              {/* Yük Detayları */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Ağırlık</p>
                  <p className="font-semibold text-gray-900">{load.weight}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Hacim</p>
                  <p className="font-semibold text-gray-900">{load.volume}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Mesafe</p>
                  <p className="font-semibold text-gray-900">{load.distance}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Tahmini Süre</p>
                  <p className="font-semibold text-gray-900">{load.estimatedTime}</p>
                </div>
              </div>

              {/* Ek Yük Uyarısı */}
              {load.additionalLoads > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center">
                    <Target className="w-5 h-5 text-green-600 mr-2" />
                    <p className="text-green-800 font-medium">
                      🎯 Güzergah üzerinde {load.additionalLoads} ek yük mevcut! 
                      <span className="text-green-600 ml-1">Ek gelir fırsatı</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Aksiyon Butonları */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleViewDetails(load.id)}
                    className="flex items-center text-gray-600 hover:text-gray-900 font-medium"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Detayları Gör
                  </button>
                  
                  {load.additionalLoads > 0 && (
                    <Link
                      to={`/nakliyeci/vehicle-optimization?load=${load.id}`}
                      className="flex items-center text-green-600 hover:text-green-700 font-medium"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Araç Optimize Et
                    </Link>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleMakeOffer(load.id)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Teklif Ver
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Boş Durum */}
        {filteredLoads.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">İlan bulunamadı</h3>
            <p className="text-gray-600 mb-6">Arama kriterlerinize uygun ilan bulunmuyor.</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
                setFilterPriority('all');
              }}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Filtreleri Temizle
            </button>
          </div>
        )}

        {/* Alt Bilgi */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start space-x-4">
            <AlertCircle className="w-6 h-6 text-blue-600 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Teklif Verme Rehberi</h3>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>• Komisyon için cüzdanınızda yeterli bakiye olmalıdır</li>
                <li>• Güzergah üzerindeki ek yüklerden faydalanabilirsiniz</li>
                <li>• Rekabetçi fiyatlar vererek kazanma şansınızı artırın</li>
                <li>• Müşteri değerlendirmeleriniz teklif seçiminde etkilidir</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}




