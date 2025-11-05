import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  MapPin,
  Truck,
  Package,
  Weight,
  Ruler,
  Clock,
  DollarSign,
  Plus,
  Minus,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Route,
  Navigation,
  Target,
  Zap,
  Calculator,
  TrendingUp,
  Calendar,
  Phone,
  Mail,
  Eye,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Settings,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Breadcrumb from '../../components/common/Breadcrumb';
import LoadingState from '../../components/common/LoadingState';

interface Vehicle {
  id: number;
  name: string;
  type: string;
  maxWeight: number;
  maxVolume: number;
  currentWeight: number;
  currentVolume: number;
}

interface RoutePoint {
  id: string;
  name: string;
  address: string;
  coordinates: { lat: number; lng: number };
  order: number;
  type: 'pickup' | 'delivery';
  weight?: number;
  volume?: number;
  price?: number;
  deadline?: string;
}

interface AvailableLoad {
  id: number;
  title: string;
  pickupAddress: string;
  deliveryAddress: string;
  weight: number;
  volume: number;
  price: number;
  deadline: string;
  distance: number;
  shipper: {
    name: string;
    phone: string;
    email: string;
  };
}

export default function RoutePlanner() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [loadsLoading, setLoadsLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [availableLoads, setAvailableLoads] = useState<AvailableLoad[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [weightFilter, setWeightFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [showLoadDetails, setShowLoadDetails] = useState<number | null>(null);
  const [totalDistance, setTotalDistance] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalWeight, setTotalWeight] = useState(0);
  const [isOptimized, setIsOptimized] = useState(false);

  const breadcrumbItems = [
    { label: 'Güzergah Planlayıcı', icon: <Route className='w-4 h-4' /> },
  ];

  // Araç listesi state'i
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  // Load vehicles from API
  const loadVehicles = async () => {
    setVehiclesLoading(true);
    try {
      const userId =
        user?.id ||
        (localStorage.getItem('user')
          ? JSON.parse(localStorage.getItem('user') || '{}').id
          : null);
      const token = localStorage.getItem('authToken');

      if (!userId) {
        throw new Error('Kullanıcı ID bulunamadı');
      }

      const response = await fetch('/api/vehicles/nakliyeci', {
        headers: {
          Authorization: `Bearer ${token || ''}`,
          'X-User-Id': userId,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load vehicles');
      }

      const data = await response.json();
      // Backend format: { success: true, vehicles: [...] }
      const vehicles = data.vehicles || data.data || [];
      setVehicles(vehicles);

      // İlk aracı seç
      if (vehicles.length > 0) {
        setSelectedVehicle(vehicles[0]);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error loading vehicles:', error);
      }
      setVehicles([]);
    } finally {
      setVehiclesLoading(false);
    }
  };

  // Load available loads from API
  const loadAvailableLoads = async () => {
    setLoadsLoading(true);
    try {
      const userId =
        user?.id ||
        (localStorage.getItem('user')
          ? JSON.parse(localStorage.getItem('user') || '{}').id
          : null);
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/loads/available', {
        headers: {
          Authorization: `Bearer ${token || ''}`,
          'X-User-Id': userId || '',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load available loads');
      }

      const data = await response.json();
      // Backend format: { success: true, data: [...] }
      const loads = data.data || data.loads || [];
      setAvailableLoads(loads);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error loading available loads:', error);
      }
      setAvailableLoads([]);
    } finally {
      setLoadsLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
    loadAvailableLoads();
  }, []);

  useEffect(() => {
    setIsLoading(vehiclesLoading || loadsLoading);
  }, [vehiclesLoading, loadsLoading]);

  useEffect(() => {
    calculateTotals();
  }, [routePoints]);

  const calculateTotals = () => {
    const total = routePoints.reduce(
      (sum, point) => sum + (point.weight || 0),
      0
    );
    const earnings = routePoints.reduce(
      (sum, point) => sum + (point.price || 0),
      0
    );
    // Calculate total distance using Haversine formula (simplified)
    // For production, use a routing API like Google Maps, Mapbox, etc.
    let distance = 0;
    if (routePoints.length > 1) {
      for (let i = 0; i < routePoints.length - 1; i++) {
        const point1 = routePoints[i];
        const point2 = routePoints[i + 1];
        if (point1.coordinates && point2.coordinates && 
            point1.coordinates.lat !== 0 && point2.coordinates.lat !== 0) {
          // Haversine formula for distance calculation
          const R = 6371; // Earth radius in km
          const dLat = (point2.coordinates.lat - point1.coordinates.lat) * Math.PI / 180;
          const dLon = (point2.coordinates.lng - point1.coordinates.lng) * Math.PI / 180;
          const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(point1.coordinates.lat * Math.PI / 180) *
            Math.cos(point2.coordinates.lat * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          distance += R * c;
        }
      }
    }

    setTotalWeight(total);
    setTotalEarnings(earnings);
    setTotalDistance(distance);
  };

  const addLoadToRoute = (load: AvailableLoad) => {
    if (!selectedVehicle) return;

    const newWeight = totalWeight + load.weight;
    const newVolume =
      routePoints.reduce((sum, point) => sum + (point.volume || 0), 0) +
      load.volume;

    // Kapasite kontrolü
    if (newWeight > selectedVehicle.maxWeight) {
      alert(
        `Ağırlık limiti aşıldı! Maksimum: ${selectedVehicle.maxWeight}kg, Mevcut: ${newWeight}kg`
      );
      return;
    }

    if (newVolume > selectedVehicle.maxVolume) {
      alert(
        `Hacim limiti aşıldı! Maksimum: ${selectedVehicle.maxVolume}m³, Mevcut: ${newVolume}m³`
      );
      return;
    }

    const pickupPoint: RoutePoint = {
      id: `pickup-${load.id}`,
      name: `Yükleme - ${load.title}`,
      address: load.pickupAddress,
      coordinates: { lat: 0, lng: 0 }, // Will be geocoded when address is available
      // Note: For production, use a geocoding service (Google Maps, Mapbox, etc.)
      // This is a placeholder - coordinates should be set via geocoding API
      order: routePoints.length + 1,
      type: 'pickup',
      weight: load.weight,
      volume: load.volume,
      price: load.price,
      deadline: load.deadline,
    };

    const deliveryPoint: RoutePoint = {
      id: `delivery-${load.id}`,
      name: `Teslimat - ${load.title}`,
      address: load.deliveryAddress,
      coordinates: { lat: 0, lng: 0 }, // Will be geocoded when address is available
      // Note: For production, use a geocoding service (Google Maps, Mapbox, etc.)
      // This is a placeholder - coordinates should be set via geocoding API
      order: routePoints.length + 2,
      type: 'delivery',
      weight: load.weight,
      volume: load.volume,
      price: load.price,
      deadline: load.deadline,
    };

    setRoutePoints([...routePoints, pickupPoint, deliveryPoint]);
  };

  const removePointFromRoute = (pointId: string) => {
    setRoutePoints(routePoints.filter(point => point.id !== pointId));
  };

  const optimizeRoute = () => {
    // Basit optimizasyon - gerçekte daha karmaşık algoritma olacak
    const sortedPoints = [...routePoints].sort((a, b) => {
      if (a.type === 'pickup' && b.type === 'delivery') return -1;
      if (a.type === 'delivery' && b.type === 'pickup') return 1;
      return 0;
    });

    setRoutePoints(sortedPoints);
    setIsOptimized(true);
  };

  const filteredLoads = availableLoads.filter(load => {
    const matchesSearch =
      load.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      load.pickupAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      load.deliveryAddress.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesWeight =
      weightFilter === 'all' ||
      (weightFilter === 'light' && load.weight < 3000) ||
      (weightFilter === 'medium' &&
        load.weight >= 3000 &&
        load.weight < 7000) ||
      (weightFilter === 'heavy' && load.weight >= 7000);

    const matchesPrice =
      priceFilter === 'all' ||
      (priceFilter === 'low' && load.price < 2000) ||
      (priceFilter === 'medium' && load.price >= 2000 && load.price < 4000) ||
      (priceFilter === 'high' && load.price >= 4000);

    return matchesSearch && matchesWeight && matchesPrice;
  });

  const getCapacityPercentage = () => {
    if (!selectedVehicle) return 0;
    return (totalWeight / selectedVehicle.maxWeight) * 100;
  };

  const getVolumePercentage = () => {
    if (!selectedVehicle) return 0;
    const currentVolume = routePoints.reduce(
      (sum, point) => sum + (point.volume || 0),
      0
    );
    return (currentVolume / selectedVehicle.maxVolume) * 100;
  };

  if (isLoading) {
    return <LoadingState message='Güzergah planlayıcı yükleniyor...' />;
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50'>
      <Helmet>
        <title>Güzergah Planlayıcı - YolNext Nakliyeci</title>
        <meta
          name='description'
          content='Akıllı güzergah planlama ve yol üstü yük arama sistemi'
        />
      </Helmet>

      <div className='max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6'>
        {/* Breadcrumb */}
        <div className='mb-4 sm:mb-6'>
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* Header */}
        <div className='text-center mb-8 sm:mb-12'>
          <div className='flex justify-center mb-4 sm:mb-6'>
            <div className='w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg'>
              <Route className='w-6 h-6 sm:w-8 sm:h-8 text-white' />
            </div>
          </div>
          <h1 className='text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-2 sm:mb-3'>
            Güzergah{' '}
            <span className='text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-blue-900'>
              Planlayıcı
            </span>
          </h1>
          <p className='text-sm sm:text-base md:text-lg text-slate-600 px-4'>
            Akıllı güzergah planlama ve yol üstü yük arama sistemi
          </p>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Sol Panel - Araç ve Güzergah */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Araç Seçimi */}
            <div className='bg-white rounded-xl p-6 shadow-lg border border-slate-200'>
              <div className='flex items-center gap-3 mb-4'>
                <Truck className='w-6 h-6 text-slate-700' />
                <h2 className='text-xl font-bold text-slate-900'>
                  Araç Seçimi
                </h2>
              </div>

              {vehiclesLoading ? (
                <div className='flex items-center justify-center py-8'>
                  <div className='flex items-center gap-2 text-slate-600'>
                    <RefreshCw className='w-5 h-5 animate-spin' />
                    <span>Araçlar yükleniyor...</span>
                  </div>
                </div>
              ) : vehicles.length === 0 ? (
                <div className='text-center py-8 text-slate-500'>
                  <Truck className='w-12 h-12 mx-auto mb-3 text-slate-300' />
                  <p>Henüz araç bulunmuyor</p>
                </div>
              ) : (
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  {vehicles.map(vehicle => (
                    <div
                      key={vehicle.id}
                      onClick={() => setSelectedVehicle(vehicle)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedVehicle?.id === vehicle.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className='flex items-center gap-3 mb-2'>
                        <Truck className='w-5 h-5 text-slate-600' />
                        <span className='font-semibold text-slate-900'>
                          {vehicle.name}
                        </span>
                      </div>
                      <div className='text-sm text-slate-600'>
                        <div>
                          Kapasite: {vehicle.maxWeight.toLocaleString()}kg
                        </div>
                        <div>Hacim: {vehicle.maxVolume}m³</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Güzergah */}
            <div className='bg-white rounded-xl p-6 shadow-lg border border-slate-200'>
              <div className='flex items-center justify-between mb-4'>
                <div className='flex items-center gap-3'>
                  <Navigation className='w-6 h-6 text-slate-700' />
                  <h2 className='text-xl font-bold text-slate-900'>Güzergah</h2>
                </div>
                <button
                  onClick={optimizeRoute}
                  className='flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                >
                  <Zap className='w-4 h-4' />
                  Optimize Et
                </button>
              </div>

              {routePoints.length === 0 ? (
                <div className='text-center py-8 text-slate-500'>
                  <Route className='w-12 h-12 mx-auto mb-4 text-slate-300' />
                  <p>Henüz güzergah noktası eklenmedi</p>
                  <p className='text-sm'>Sağ panelden yük seçerek başlayın</p>
                </div>
              ) : (
                <div className='space-y-3'>
                  {routePoints.map((point, index) => (
                    <div
                      key={point.id}
                      className='flex items-center gap-4 p-4 bg-slate-50 rounded-lg'
                    >
                      <div className='flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold'>
                        {index + 1}
                      </div>
                      <div className='flex-1'>
                        <div className='flex items-center gap-2 mb-1'>
                          <MapPin className='w-4 h-4 text-slate-600' />
                          <span className='font-medium text-slate-900'>
                            {point.name}
                          </span>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              point.type === 'pickup'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {point.type === 'pickup' ? 'Yükleme' : 'Teslimat'}
                          </span>
                        </div>
                        <p className='text-sm text-slate-600'>
                          {point.address}
                        </p>
                        {point.weight && (
                          <div className='flex items-center gap-4 mt-2 text-xs text-slate-500'>
                            <span>📦 {point.weight}kg</span>
                            <span>💰 ₺{point.price?.toLocaleString()}</span>
                            <span>
                              📅{' '}
                              {(() => {
                                try {
                                  if (
                                    point.deadline &&
                                    !point.deadline.includes('T')
                                  ) {
                                    return point.deadline;
                                  }
                                  if (!point.deadline) return 'Belirtilmemiş';
                                  const date = new Date(point.deadline);
                                  if (isNaN(date.getTime()))
                                    return 'Belirtilmemiş';
                                  return date.toLocaleDateString('tr-TR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                  });
                                } catch {
                                  return point.deadline || 'Belirtilmemiş';
                                }
                              })()}
                            </span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => removePointFromRoute(point.id)}
                        className='p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors'
                      >
                        <Minus className='w-4 h-4' />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Özet */}
            <div className='bg-white rounded-xl p-6 shadow-lg border border-slate-200'>
              <h3 className='text-lg font-bold text-slate-900 mb-4'>
                Güzergah Özeti
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div className='text-center p-4 bg-slate-50 rounded-lg'>
                  <div className='text-2xl font-bold text-slate-900'>
                    {totalDistance}km
                  </div>
                  <div className='text-sm text-slate-600'>Toplam Mesafe</div>
                </div>
                <div className='text-center p-4 bg-slate-50 rounded-lg'>
                  <div className='text-2xl font-bold text-slate-900'>
                    {totalWeight.toLocaleString()}kg
                  </div>
                  <div className='text-sm text-slate-600'>Toplam Ağırlık</div>
                </div>
                <div className='text-center p-4 bg-slate-50 rounded-lg'>
                  <div className='text-2xl font-bold text-slate-900'>
                    ₺{totalEarnings.toLocaleString()}
                  </div>
                  <div className='text-sm text-slate-600'>Toplam Kazanç</div>
                </div>
              </div>
            </div>
          </div>

          {/* Sağ Panel - Yük Arama */}
          <div className='space-y-6'>
            {/* Kapasite Durumu */}
            {selectedVehicle && (
              <div className='bg-white rounded-xl p-6 shadow-lg border border-slate-200'>
                <h3 className='text-lg font-bold text-slate-900 mb-4'>
                  Kapasite Durumu
                </h3>

                <div className='space-y-4'>
                  <div>
                    <div className='flex justify-between text-sm mb-2'>
                      <span>Ağırlık</span>
                      <span>
                        {totalWeight.toLocaleString()} /{' '}
                        {selectedVehicle.maxWeight.toLocaleString()}kg
                      </span>
                    </div>
                    <div className='w-full bg-slate-200 rounded-full h-2'>
                      <div
                        className={`h-2 rounded-full transition-all ${
                          getCapacityPercentage() > 90
                            ? 'bg-red-500'
                            : getCapacityPercentage() > 70
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                        }`}
                        style={{
                          width: `${Math.min(getCapacityPercentage(), 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className='flex justify-between text-sm mb-2'>
                      <span>Hacim</span>
                      <span>
                        {routePoints.reduce(
                          (sum, point) => sum + (point.volume || 0),
                          0
                        )}{' '}
                        / {selectedVehicle.maxVolume}m³
                      </span>
                    </div>
                    <div className='w-full bg-slate-200 rounded-full h-2'>
                      <div
                        className={`h-2 rounded-full transition-all ${
                          getVolumePercentage() > 90
                            ? 'bg-red-500'
                            : getVolumePercentage() > 70
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                        }`}
                        style={{
                          width: `${Math.min(getVolumePercentage(), 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                {getCapacityPercentage() > 90 && (
                  <div className='mt-4 p-3 bg-red-50 border border-red-200 rounded-lg'>
                    <div className='flex items-center gap-2 text-red-800'>
                      <AlertCircle className='w-4 h-4' />
                      <span className='text-sm font-medium'>
                        Kapasite limitine yaklaşıldı!
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Yük Arama */}
            <div className='bg-white rounded-xl p-6 shadow-lg border border-slate-200'>
              <h3 className='text-lg font-bold text-slate-900 mb-4'>
                Mevcut Yükler
              </h3>

              {/* Filtreler */}
              <div className='space-y-4 mb-4'>
                <div>
                  <input
                    type='text'
                    placeholder='Yük ara...'
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className='w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  />
                </div>

                <div className='grid grid-cols-2 gap-2'>
                  <select
                    value={weightFilter}
                    onChange={e => setWeightFilter(e.target.value)}
                    className='px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  >
                    <option value='all'>Tüm Ağırlıklar</option>
                    <option value='light'>Hafif (&lt;3t)</option>
                    <option value='medium'>Orta (3-7t)</option>
                    <option value='heavy'>Ağır (&gt;7t)</option>
                  </select>

                  <select
                    value={priceFilter}
                    onChange={e => setPriceFilter(e.target.value)}
                    className='px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  >
                    <option value='all'>Tüm Fiyatlar</option>
                    <option value='low'>Düşük (&lt;2k)</option>
                    <option value='medium'>Orta (2-4k)</option>
                    <option value='high'>Yüksek (&gt;4k)</option>
                  </select>
                </div>
              </div>

              {/* Yük Listesi */}
              {loadsLoading ? (
                <div className='flex items-center justify-center py-8'>
                  <div className='flex items-center gap-2 text-slate-600'>
                    <RefreshCw className='w-5 h-5 animate-spin' />
                    <span>Yükler yükleniyor...</span>
                  </div>
                </div>
              ) : filteredLoads.length === 0 ? (
                <div className='text-center py-8 text-slate-500'>
                  <Package className='w-12 h-12 mx-auto mb-3 text-slate-300' />
                  <p>Mevcut yük bulunamadı</p>
                </div>
              ) : (
                <div className='space-y-3 max-h-96 overflow-y-auto'>
                  {filteredLoads.map(load => (
                    <div
                      key={load.id}
                      className='p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors'
                    >
                      <div className='flex items-start justify-between mb-2'>
                        <h4 className='font-medium text-slate-900'>
                          {load.title}
                        </h4>
                        <button
                          onClick={() => addLoadToRoute(load)}
                          disabled={
                            !selectedVehicle ||
                            totalWeight + load.weight >
                              (selectedVehicle?.maxWeight || 0)
                          }
                          className='px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors'
                        >
                          Ekle
                        </button>
                      </div>

                      <div className='space-y-2 text-sm text-slate-600'>
                        <div className='flex items-center gap-2'>
                          <MapPin className='w-4 h-4' />
                          <span>
                            {load.pickupAddress} → {load.deliveryAddress}
                          </span>
                        </div>

                        <div className='flex items-center gap-4'>
                          <span className='flex items-center gap-1'>
                            <Weight className='w-4 h-4' />
                            {load.weight.toLocaleString()}kg
                          </span>
                          <span className='flex items-center gap-1'>
                            <DollarSign className='w-4 h-4' />₺
                            {load.price.toLocaleString()}
                          </span>
                          <span className='flex items-center gap-1'>
                            <Clock className='w-4 h-4' />
                            {(() => {
                              try {
                                if (
                                  load.deadline &&
                                  !load.deadline.includes('T')
                                ) {
                                  return load.deadline;
                                }
                                const date = new Date(load.deadline);
                                if (isNaN(date.getTime()))
                                  return 'Belirtilmemiş';
                                return date.toLocaleDateString('tr-TR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                });
                              } catch {
                                return load.deadline || 'Belirtilmemiş';
                              }
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
