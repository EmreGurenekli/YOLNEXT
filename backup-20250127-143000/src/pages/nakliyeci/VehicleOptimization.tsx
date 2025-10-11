import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Truck, 
  MapPin, 
  Package, 
  Zap, 
  Target, 
  Plus, 
  CheckCircle, 
  ArrowRight,
  Clock,
  DollarSign,
  Weight,
  Ruler,
  Star,
  Eye,
  Filter,
  Search
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function VehicleOptimization() {
  const navigate = useNavigate();
  const [selectedVehicle, setSelectedVehicle] = useState('truck-001');
  const [searchTerm, setSearchTerm] = useState('');

  // Araç filosu
  const vehicles = [
    {
      id: 'truck-001',
      name: 'Kamyon #001',
      type: 'Kamyon',
      capacity: '8 ton',
      volume: '40m³',
      currentLoad: 'Ev Eşyaları',
      currentWeight: '3.5 ton',
      currentVolume: '25m³',
      remainingCapacity: '4.5 ton',
      remainingVolume: '15m³',
      route: 'İstanbul → Sakarya → Bolu → Ankara',
      driver: 'Mehmet Yılmaz',
      status: 'Yolda',
      progress: 65
    },
    {
      id: 'truck-002',
      name: 'Tır #002',
      type: 'Tır',
      capacity: '12 ton',
      volume: '60m³',
      currentLoad: 'Ofis Malzemeleri',
      currentWeight: '2.8 ton',
      currentVolume: '18m³',
      remainingCapacity: '9.2 ton',
      remainingVolume: '42m³',
      route: 'İstanbul → Bursa → İzmir',
      driver: 'Ali Demir',
      status: 'Yükleme',
      progress: 25
    },
    {
      id: 'truck-003',
      name: 'Kamyonet #003',
      type: 'Kamyonet',
      capacity: '3 ton',
      volume: '15m³',
      currentLoad: 'Hammade',
      currentWeight: '2.1 ton',
      currentVolume: '12m³',
      remainingCapacity: '0.9 ton',
      remainingVolume: '3m³',
      route: 'Gebze → Bursa',
      driver: 'Ahmet Kaya',
      status: 'Hazırlanıyor',
      progress: 10
    }
  ];

  // Güzergah üzeri ek yükler
  const additionalLoads = [
    {
      id: 1,
      title: 'Ofis Malzemeleri',
      location: 'Sakarya',
      weight: '3 ton',
      volume: '12m³',
      price: 800,
      commission: 8,
      compatibility: 'Mükemmel',
      route: 'İstanbul → Ankara',
      estimatedTime: '2 saat',
      customer: 'ABC Şirketi',
      rating: 4.8,
      distance: '150 km'
    },
    {
      id: 2,
      title: 'Ev Eşyaları',
      location: 'Bolu',
      weight: '2 ton',
      volume: '8m³',
      price: 1200,
      commission: 12,
      compatibility: 'İyi',
      route: 'İstanbul → Ankara',
      estimatedTime: '3 saat',
      customer: 'XYZ Ailesi',
      rating: 4.6,
      distance: '200 km'
    },
    {
      id: 3,
      title: 'Hammade Taşıma',
      location: 'Eskişehir',
      weight: '4 ton',
      volume: '20m³',
      price: 2100,
      commission: 21,
      compatibility: 'Orta',
      route: 'İstanbul → Ankara',
      estimatedTime: '4 saat',
      customer: 'DEF Fabrikası',
      rating: 4.4,
      distance: '300 km'
    },
    {
      id: 4,
      title: 'Ofis Mobilyaları',
      location: 'Sakarya',
      weight: '1.5 ton',
      volume: '6m³',
      price: 600,
      commission: 6,
      compatibility: 'Mükemmel',
      route: 'İstanbul → Ankara',
      estimatedTime: '1.5 saat',
      customer: 'GHI Ofis',
      rating: 4.9,
      distance: '150 km'
    }
  ];

  const selectedVehicleData = vehicles.find(v => v.id === selectedVehicle);
  const filteredLoads = additionalLoads.filter(load => 
    load.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    load.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAssignLoad = (loadId: number) => {
    // Yük atama işlemi
    console.log('Yük atandı:', loadId);
    alert('Yük başarıyla atandı!');
  };

  const handleOptimizeRoute = (vehicleId: string) => {
    // Rota optimizasyonu
    console.log('Rota optimize edildi:', vehicleId);
    alert('Rota başarıyla optimize edildi!');
  };

  const getCompatibilityColor = (compatibility: string) => {
    switch (compatibility) {
      case 'Mükemmel': return 'bg-green-100 text-green-800';
      case 'İyi': return 'bg-blue-100 text-blue-800';
      case 'Orta': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Araç Optimizasyonu - Nakliyeci Panel</title>
      </Helmet>

      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Araç Optimizasyonu</h1>
          <p className="text-gray-600">Araçlarınızı doldurun ve ek gelir elde edin</p>
        </div>

        {/* Araç Seçimi */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Araç Seçin</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                onClick={() => setSelectedVehicle(vehicle.id)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedVehicle === vehicle.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{vehicle.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    vehicle.status === 'Yolda' ? 'bg-green-100 text-green-800' :
                    vehicle.status === 'Yükleme' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {vehicle.status}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 mb-3">
                  <p>🚛 {vehicle.type} • 👤 {vehicle.driver}</p>
                  <p>📍 {vehicle.route}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-600">Kapasite</p>
                    <p className="font-semibold">{vehicle.capacity}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Hacim</p>
                    <p className="font-semibold">{vehicle.volume}</p>
                  </div>
                </div>
                
                <div className="mt-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>İlerleme</span>
                    <span>{vehicle.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${vehicle.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Seçili Araç Detayları */}
        {selectedVehicleData && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Araç Detayları</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Mevcut Yük</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="font-medium text-gray-900">{selectedVehicleData.currentLoad}</p>
                  <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                    <div>
                      <p className="text-gray-600">Ağırlık</p>
                      <p className="font-semibold">{selectedVehicleData.currentWeight}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Hacim</p>
                      <p className="font-semibold">{selectedVehicleData.currentVolume}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Kalan Kapasite</h3>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Ağırlık</p>
                      <p className="font-semibold text-green-800">{selectedVehicleData.remainingCapacity}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Hacim</p>
                      <p className="font-semibold text-green-800">{selectedVehicleData.remainingVolume}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Güzergah Üzeri Ek Yükler */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Güzergah Üzeri Ek Yükler</h2>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Yük ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => handleOptimizeRoute(selectedVehicle)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center"
              >
                <Zap className="w-4 h-4 mr-2" />
                Rota Optimize Et
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredLoads.map((load) => (
              <div key={load.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{load.title}</h3>
                    <p className="text-gray-600 text-sm">📍 {load.location}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCompatibilityColor(load.compatibility)}`}>
                    {load.compatibility}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-600">Ağırlık</p>
                    <p className="font-semibold">{load.weight}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-600">Hacim</p>
                    <p className="font-semibold">{load.volume}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-600">Fiyat</p>
                    <p className="font-semibold text-green-600">{load.price.toLocaleString()}₺</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-600">Komisyon</p>
                    <p className="font-semibold text-blue-600">{load.commission}₺</p>
                  </div>
                </div>

                <div className="text-sm text-gray-600 mb-4">
                  <p><span className="font-medium">Güzergah:</span> {load.route}</p>
                  <p><span className="font-medium">Müşteri:</span> {load.customer}</p>
                  <p><span className="font-medium">Mesafe:</span> {load.distance}</p>
                  <p><span className="font-medium">Tahmini Süre:</span> {load.estimatedTime}</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-gray-600">{load.rating}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button className="text-gray-600 hover:text-gray-900 font-medium text-sm">
                      <Eye className="w-4 h-4 mr-1 inline" />
                      Detay
                    </button>
                    <button
                      onClick={() => handleAssignLoad(load.id)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      Hemen Ata
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Optimizasyon Önerileri */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start space-x-4">
            <Target className="w-6 h-6 text-blue-600 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Optimizasyon Önerileri</h3>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>• Uyumluluk skoru yüksek olan yükleri öncelikle atayın</li>
                <li>• Güzergah üzerindeki yükleri birleştirerek yakıt tasarrufu sağlayın</li>
                <li>• Müşteri değerlendirmelerini dikkate alarak güvenilir yükleri seçin</li>
                <li>• Rota optimizasyonu ile en verimli güzergahı belirleyin</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}







