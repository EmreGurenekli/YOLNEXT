import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  MapPin, 
  Truck, 
  Package, 
  Clock, 
  DollarSign, 
  Navigation, 
  Route,
  Plus,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Fuel,
  Calendar,
  Users,
  Star
} from 'lucide-react';

interface RoutePoint {
  id: string;
  city: string;
  district: string;
  address: string;
  type: 'pickup' | 'delivery' | 'waypoint';
  time: string;
  distance: number;
  load?: {
    id: string;
    title: string;
    weight: string;
    volume: string;
    price: number;
    customer: string;
  };
}

interface OptimizationResult {
  totalDistance: number;
  totalTime: number;
  totalEarnings: number;
  fuelCost: number;
  netProfit: number;
  efficiency: number;
  suggestions: string[];
}

const RouteOptimization: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState<RoutePoint[]>([]);
  const [availableLoads, setAvailableLoads] = useState<any[]>([]);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [selectedLoads, setSelectedLoads] = useState<string[]>([]);

  // Mock data
  useEffect(() => {
    const mockRoute: RoutePoint[] = [
      {
        id: '1',
        city: 'İstanbul',
        district: 'Şişli',
        address: 'Cumhuriyet Caddesi No:123',
        type: 'pickup',
        time: '09:00',
        distance: 0,
        load: {
          id: 'load-1',
          title: 'Elektronik Eşya Taşıma',
          weight: '50 kg',
          volume: '0.5 m³',
          price: 1200,
          customer: 'TechCorp A.Ş.'
        }
      },
      {
        id: '2',
        city: 'Ankara',
        district: 'Çankaya',
        address: 'Atatürk Bulvarı No:456',
        type: 'delivery',
        time: '15:00',
        distance: 450,
        load: {
          id: 'load-1',
          title: 'Elektronik Eşya Taşıma',
          weight: '50 kg',
          volume: '0.5 m³',
          price: 1200,
          customer: 'TechCorp A.Ş.'
        }
      }
    ];

    const mockAvailableLoads = [
      {
        id: 'load-2',
        title: 'Ofis Mobilyası',
        from: { city: 'Kayseri', district: 'Melikgazi' },
        to: { city: 'İstanbul', district: 'Beşiktaş' },
        weight: '200 kg',
        volume: '2 m³',
        price: 1800,
        customer: 'OfficePlus Ltd.',
        pickupTime: '14:00',
        deliveryTime: '18:00',
        distance: 120,
        compatibility: 95
      },
      {
        id: 'load-3',
        title: 'Ev Eşyası',
        from: { city: 'Eskişehir', district: 'Odunpazarı' },
        to: { city: 'Ankara', district: 'Keçiören' },
        weight: '300 kg',
        volume: '3 m³',
        price: 2200,
        customer: 'HomeMove A.Ş.',
        pickupTime: '16:00',
        deliveryTime: '20:00',
        distance: 80,
        compatibility: 88
      }
    ];

    setCurrentRoute(mockRoute);
    setAvailableLoads(mockAvailableLoads);
  }, []);

  const optimizeRoute = async () => {
    setIsOptimizing(true);
    
    // Simulate optimization calculation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const result: OptimizationResult = {
      totalDistance: 650,
      totalTime: 8.5,
      totalEarnings: 5200,
      fuelCost: 800,
      netProfit: 4400,
      efficiency: 92,
      suggestions: [
        'Kayseri yükü eklenerek %15 daha fazla kazanç',
        'Eskişehir yükü ile dönüş yolunda ek gelir',
        'Yakıt tüketimi optimize edildi'
      ]
    };
    
    setOptimizationResult(result);
    setIsOptimizing(false);
  };

  const addLoadToRoute = (loadId: string) => {
    setSelectedLoads(prev => [...prev, loadId]);
  };

  const removeLoadFromRoute = (loadId: string) => {
    setSelectedLoads(prev => prev.filter(id => id !== loadId));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>Güzergah Optimizasyonu - Nakliyeci Panel - YolNet</title>
        <meta name="description" content="Akıllı güzergah optimizasyonu ve yol üstü yük alma sistemi" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center">
              <Route className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Güzergah Optimizasyonu</h1>
              <p className="text-slate-600">Akıllı rota planlama ve yol üstü yük alma sistemi</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sol Panel - Mevcut Güzergah */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mevcut Rota */}
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-900">Mevcut Rota</h2>
                <div className="flex items-center space-x-2 text-sm text-slate-600">
                  <Truck className="w-4 h-4" />
                  <span>06 DEF 456</span>
                </div>
              </div>

              <div className="space-y-4">
                {currentRoute.map((point, index) => (
                  <div key={point.id} className="flex items-start space-x-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        point.type === 'pickup' ? 'bg-green-100 text-green-600' :
                        point.type === 'delivery' ? 'bg-red-100 text-red-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {point.type === 'pickup' ? <Package className="w-4 h-4" /> :
                         point.type === 'delivery' ? <CheckCircle className="w-4 h-4" /> :
                         <MapPin className="w-4 h-4" />}
                      </div>
                      {index < currentRoute.length - 1 && (
                        <div className="w-0.5 h-8 bg-slate-200 mt-2"></div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-slate-900">{point.city}, {point.district}</h3>
                          <p className="text-sm text-slate-600">{point.address}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-slate-900">{point.time}</p>
                          {point.distance > 0 && (
                            <p className="text-xs text-slate-500">{point.distance} km</p>
                          )}
                        </div>
                      </div>
                      
                      {point.load && (
                        <div className="mt-2 p-3 bg-slate-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-slate-900">{point.load.title}</p>
                              <p className="text-sm text-slate-600">{point.load.customer}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-green-600">₺{point.load.price}</p>
                              <p className="text-xs text-slate-500">{point.load.weight} • {point.load.volume}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Yol Üstü Yük Önerileri */}
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-6">Yol Üstü Yük Önerileri</h2>
              
              <div className="space-y-4">
                {availableLoads.map((load) => (
                  <div key={load.id} className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-medium text-slate-900">{load.title}</h3>
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                            %{load.compatibility} Uyumlu
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm text-slate-600 mb-3">
                          <div>
                            <p><span className="font-medium">Nereden:</span> {load.from.city}, {load.from.district}</p>
                            <p><span className="font-medium">Nereye:</span> {load.to.city}, {load.to.district}</p>
                          </div>
                          <div>
                            <p><span className="font-medium">Alış:</span> {load.pickupTime}</p>
                            <p><span className="font-medium">Teslim:</span> {load.deliveryTime}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="flex items-center space-x-1">
                            <Package className="w-4 h-4 text-slate-400" />
                            <span>{load.weight} • {load.volume}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Navigation className="w-4 h-4 text-slate-400" />
                            <span>{load.distance} km</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <DollarSign className="w-4 h-4 text-slate-400" />
                            <span className="font-semibold text-green-600">₺{load.price}</span>
                          </span>
                        </div>
                      </div>
                      
                      <div className="ml-4">
                        {selectedLoads.includes(load.id) ? (
                          <button
                            onClick={() => removeLoadFromRoute(load.id)}
                            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center space-x-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>Kaldır</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => addLoadToRoute(load.id)}
                            className="px-4 py-2 bg-gradient-to-r from-slate-800 to-blue-900 text-white rounded-lg hover:from-slate-700 hover:to-blue-800 transition-colors flex items-center space-x-2"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Ekle</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sağ Panel - Optimizasyon Sonuçları */}
          <div className="space-y-6">
            {/* Optimizasyon Butonu */}
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
              <button
                onClick={optimizeRoute}
                disabled={isOptimizing}
                className="w-full bg-gradient-to-r from-slate-800 to-blue-900 text-white py-3 px-4 rounded-lg hover:from-slate-700 hover:to-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isOptimizing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Optimize Ediliyor...</span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-5 h-5" />
                    <span>Rotayı Optimize Et</span>
                  </>
                )}
              </button>
            </div>

            {/* Optimizasyon Sonuçları */}
            {optimizationResult && (
              <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Optimizasyon Sonuçları</h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <Navigation className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-slate-900">{optimizationResult.totalDistance} km</p>
                      <p className="text-sm text-slate-600">Toplam Mesafe</p>
                    </div>
                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <Clock className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-slate-900">{optimizationResult.totalTime}h</p>
                      <p className="text-sm text-slate-600">Toplam Süre</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <DollarSign className="w-6 h-6 text-green-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-green-600">₺{optimizationResult.totalEarnings}</p>
                      <p className="text-sm text-slate-600">Toplam Kazanç</p>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <Fuel className="w-6 h-6 text-red-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-red-600">₺{optimizationResult.fuelCost}</p>
                      <p className="text-sm text-slate-600">Yakıt Maliyeti</p>
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-r from-slate-800 to-blue-900 text-white rounded-lg">
                    <p className="text-3xl font-bold">₺{optimizationResult.netProfit}</p>
                    <p className="text-sm opacity-90">Net Kar</p>
                    <div className="mt-2 flex items-center justify-center space-x-2">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm">%{optimizationResult.efficiency} Verimlilik</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Akıllı Öneriler */}
            {optimizationResult && (
              <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Akıllı Öneriler</h3>
                <div className="space-y-3">
                  {optimizationResult.suggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-slate-700">{suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteOptimization;





















