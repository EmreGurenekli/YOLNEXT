import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Truck, Plus, Edit, Trash2, MapPin, Fuel, Wrench, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface Vehicle {
  id: string;
  plate: string;
  type: string;
  capacity: number;
  status: 'active' | 'maintenance' | 'inactive';
  location: string;
  driver: string;
  fuelLevel: number;
  lastMaintenance: string;
  nextMaintenance: string;
  mileage: number;
  utilization: number;
}

export default function FleetManagement() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    {
      id: '1',
      plate: '34 ABC 123',
      type: 'Kamyon',
      capacity: 5000,
      status: 'active',
      location: 'İstanbul',
      driver: 'Ahmet Yılmaz',
      fuelLevel: 75,
      lastMaintenance: '2024-01-01',
      nextMaintenance: '2024-02-01',
      mileage: 150000,
      utilization: 85
    },
    {
      id: '2',
      plate: '06 DEF 456',
      type: 'Kamyonet',
      capacity: 2000,
      status: 'maintenance',
      location: 'Ankara',
      driver: 'Mehmet Demir',
      fuelLevel: 45,
      lastMaintenance: '2024-01-15',
      nextMaintenance: '2024-01-20',
      mileage: 120000,
      utilization: 70
    },
    {
      id: '3',
      plate: '35 GHI 789',
      type: 'Tır',
      capacity: 10000,
      status: 'active',
      location: 'İzmir',
      driver: 'Zeynep Kaya',
      fuelLevel: 90,
      lastMaintenance: '2023-12-15',
      nextMaintenance: '2024-02-15',
      mileage: 200000,
      utilization: 95
    }
  ]);

  const [isAddingVehicle, setIsAddingVehicle] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'maintenance':
        return <Wrench className="w-4 h-4" />;
      case 'inactive':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getFuelColor = (level: number) => {
    if (level >= 70) return 'text-green-600';
    if (level >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 80) return 'text-green-600';
    if (utilization >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Filo Yönetimi - YolNet</title>
        <meta name="description" content="YolNet nakliyeci filo yönetim sistemi" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Filo Yönetimi</h1>
            <p className="text-gray-600 mt-2">Araçlarınızı yönetin ve takip edin</p>
          </div>
          <button
            onClick={() => setIsAddingVehicle(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Araç Ekle
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Truck className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600">Toplam Araç</h3>
                <p className="text-2xl font-bold text-gray-900">{vehicles.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600">Aktif Araç</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {vehicles.filter(v => v.status === 'active').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <Wrench className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600">Bakımda</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {vehicles.filter(v => v.status === 'maintenance').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <MapPin className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600">Ortalama Doluluk</h3>
                <p className="text-2xl font-bold text-gray-900">
                  %{Math.round(vehicles.reduce((sum, v) => sum + v.utilization, 0) / vehicles.length)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Araç Listesi</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {vehicles.map((vehicle) => (
                <div key={vehicle.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Truck className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{vehicle.plate}</h3>
                        <p className="text-sm text-gray-600">{vehicle.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${getStatusColor(vehicle.status)}`}>
                        {getStatusIcon(vehicle.status)}
                        {vehicle.status === 'active' ? 'Aktif' : 
                         vehicle.status === 'maintenance' ? 'Bakımda' : 'Pasif'}
                      </span>
                      <div className="flex items-center gap-1">
                        <button className="p-1 text-gray-600 hover:text-gray-900">
                          <Edit size={16} />
                        </button>
                        <button className="p-1 text-red-600 hover:text-red-900">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Şoför</span>
                      <span className="font-medium text-gray-900">{vehicle.driver}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Konum</span>
                      <span className="font-medium text-gray-900">{vehicle.location}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Kapasite</span>
                      <span className="font-medium text-gray-900">{vehicle.capacity} kg</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Kilometre</span>
                      <span className="font-medium text-gray-900">{vehicle.mileage.toLocaleString()} km</span>
                    </div>
                  </div>

                  {/* Fuel Level */}
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Yakıt Seviyesi</span>
                      <span className={getFuelColor(vehicle.fuelLevel)}>%{vehicle.fuelLevel}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          vehicle.fuelLevel >= 70 ? 'bg-green-500' : 
                          vehicle.fuelLevel >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${vehicle.fuelLevel}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Utilization */}
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Doluluk Oranı</span>
                      <span className={getUtilizationColor(vehicle.utilization)}>%{vehicle.utilization}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          vehicle.utilization >= 80 ? 'bg-green-500' : 
                          vehicle.utilization >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${vehicle.utilization}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Maintenance Info */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Son Bakım</span>
                      <span className="text-gray-900">{vehicle.lastMaintenance}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-gray-600">Sonraki Bakım</span>
                      <span className="text-gray-900">{vehicle.nextMaintenance}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}