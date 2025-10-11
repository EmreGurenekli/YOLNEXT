import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  MapPin, 
  Star, 
  Clock, 
  CheckCircle, 
  X, 
  Truck, 
  Calendar,
  Award,
  Activity,
  AlertCircle
} from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';

const Drivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDriver, setShowAddDriver] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock data - Gerçek API'den gelecek
  const mockDrivers = [
    {
      id: '1',
      name: 'Ahmet Yılmaz',
      phone: '+90 555 123 4567',
      email: 'ahmet@example.com',
      licenseNumber: 'A123456789',
      licenseType: 'B+E',
      experience: '5 yıl',
      rating: 4.8,
      totalTrips: 156,
      completedTrips: 148,
      status: 'active',
      location: 'İstanbul, Kadıköy',
      vehicle: {
        type: 'Kamyon',
        plate: '34 ABC 123',
        capacity: '10 ton'
      },
      lastActive: '2024-01-23T14:30:00Z',
      joinDate: '2022-03-15',
      specialties: ['Ev Eşyası', 'Elektronik', 'Ofis Mobilyası'],
      currentJob: {
        id: 'J001',
        from: 'İstanbul, Şişli',
        to: 'Ankara, Çankaya',
        status: 'in_transit'
      }
    },
    {
      id: '2',
      name: 'Mehmet Kaya',
      phone: '+90 555 234 5678',
      email: 'mehmet@example.com',
      licenseNumber: 'B987654321',
      licenseType: 'B',
      experience: '3 yıl',
      rating: 4.6,
      totalTrips: 89,
      completedTrips: 85,
      status: 'active',
      location: 'İzmir, Konak',
      vehicle: {
        type: 'Van',
        plate: '35 DEF 456',
        capacity: '2 ton'
      },
      lastActive: '2024-01-23T12:15:00Z',
      joinDate: '2023-01-20',
      specialties: ['Elektronik', 'Kişisel Eşya'],
      currentJob: null
    },
    {
      id: '3',
      name: 'Fatma Demir',
      phone: '+90 555 345 6789',
      email: 'fatma@example.com',
      licenseNumber: 'C456789123',
      licenseType: 'B+E',
      experience: '7 yıl',
      rating: 4.9,
      totalTrips: 234,
      completedTrips: 230,
      status: 'busy',
      location: 'Ankara, Keçiören',
      vehicle: {
        type: 'Kamyon',
        plate: '06 GHI 789',
        capacity: '15 ton'
      },
      lastActive: '2024-01-23T16:45:00Z',
      joinDate: '2021-08-10',
      specialties: ['Ev Eşyası', 'Ofis Mobilyası', 'Endüstriyel'],
      currentJob: {
        id: 'J002',
        from: 'Ankara, Keçiören',
        to: 'İstanbul, Beşiktaş',
        status: 'loading'
      }
    },
    {
      id: '4',
      name: 'Ali Özkan',
      phone: '+90 555 456 7890',
      email: 'ali@example.com',
      licenseNumber: 'D789123456',
      licenseType: 'B',
      experience: '2 yıl',
      rating: 4.4,
      totalTrips: 45,
      completedTrips: 42,
      status: 'inactive',
      location: 'Bursa, Osmangazi',
      vehicle: {
        type: 'Van',
        plate: '16 JKL 012',
        capacity: '1.5 ton'
      },
      lastActive: '2024-01-20T09:30:00Z',
      joinDate: '2023-06-01',
      specialties: ['Kişisel Eşya'],
      currentJob: null
    }
  ];

  useEffect(() => {
    const loadDrivers = async () => {
      setIsLoading(true);
      // Simüle edilmiş API çağrısı
      setTimeout(() => {
        setDrivers(mockDrivers);
        setIsLoading(false);
      }, 1000);
    };
    loadDrivers();
  }, []);

  const getStatusColor = (status: string) => {
    const colors = {
      'active': 'bg-green-100 text-green-800',
      'busy': 'bg-blue-100 text-blue-800',
      'inactive': 'bg-gray-100 text-gray-800',
      'offline': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    const texts = {
      'active': 'Aktif',
      'busy': 'Meşgul',
      'inactive': 'Pasif',
      'offline': 'Çevrimdışı'
    };
    return texts[status] || 'Bilinmiyor';
  };

  const getJobStatusColor = (status: string) => {
    const colors = {
      'in_transit': 'bg-blue-100 text-blue-800',
      'loading': 'bg-orange-100 text-orange-800',
      'unloading': 'bg-purple-100 text-purple-800',
      'completed': 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getJobStatusText = (status: string) => {
    const texts = {
      'in_transit': 'Yolda',
      'loading': 'Yükleme',
      'unloading': 'Boşaltma',
      'completed': 'Tamamlandı'
    };
    return texts[status] || 'Bilinmiyor';
  };

  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         driver.phone.includes(searchTerm) ||
                         driver.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || driver.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Helmet>
        <title>Şoför Yönetimi - YolNet Nakliyeci</title>
        <meta name="description" content="Nakliyeci şoför yönetimi ve filo takibi" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <Breadcrumb items={[
            { name: 'Ana Sayfa', href: '/nakliyeci/dashboard' },
            { name: 'Şoför Yönetimi', href: '/nakliyeci/drivers' }
          ]} />
          
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-800 to-blue-900 rounded-2xl flex items-center justify-center shadow-lg">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-slate-900 mb-2">
                    Şoför Yönetimi
                  </h1>
                  <p className="text-slate-600 text-lg">
                    Filo yönetimi ve şoför performans takibi
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddDriver(true)}
                className="px-6 py-3 bg-gradient-to-r from-slate-800 to-blue-900 text-white rounded-lg hover:from-slate-700 hover:to-blue-800 transition-all duration-300 flex items-center gap-2 shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Yeni Şoför Ekle
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-slate-900">{drivers.length}</div>
                <div className="text-sm text-slate-600">Toplam Şoför</div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">{drivers.filter(d => d.status === 'active').length}</div>
                <div className="text-sm text-slate-600">Aktif Şoför</div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">{drivers.filter(d => d.status === 'busy').length}</div>
                <div className="text-sm text-slate-600">Meşgul Şoför</div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-slate-900">
                  {drivers.reduce((sum, d) => sum + d.completedTrips, 0)}
                </div>
                <div className="text-sm text-slate-600">Toplam Gönderi</div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Truck className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Şoför ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Tüm Durumlar</option>
                <option value="active">Aktif</option>
                <option value="busy">Meşgul</option>
                <option value="inactive">Pasif</option>
                <option value="offline">Çevrimdışı</option>
              </select>
              <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filtrele
              </button>
            </div>
          </div>
        </div>

        {/* Drivers List */}
        <div className="space-y-6">
          {filteredDrivers.length > 0 ? (
            filteredDrivers.map((driver) => (
              <div key={driver.id} className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-slate-800 to-blue-900 rounded-2xl flex items-center justify-center">
                      <Users className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 mb-1">{driver.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <span>{driver.licenseNumber}</span>
                        <span>•</span>
                        <span>{driver.experience}</span>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span>{driver.rating}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(driver.status)}`}>
                      {getStatusText(driver.status)}
                    </span>
                    <div className="flex items-center gap-1">
                      <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <Eye className="w-4 h-4 text-slate-600" />
                      </button>
                      <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <Edit className="w-4 h-4 text-slate-600" />
                      </button>
                      <button className="p-2 hover:bg-red-100 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <div>
                      <div className="text-sm font-medium text-slate-900">{driver.phone}</div>
                      <div className="text-xs text-slate-500">Telefon</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <div>
                      <div className="text-sm font-medium text-slate-900">{driver.email}</div>
                      <div className="text-xs text-slate-500">E-posta</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <div>
                      <div className="text-sm font-medium text-slate-900">{driver.location}</div>
                      <div className="text-xs text-slate-500">Konum</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-slate-400" />
                    <div>
                      <div className="text-sm font-medium text-slate-900">{driver.vehicle.plate}</div>
                      <div className="text-xs text-slate-500">{driver.vehicle.type}</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="text-sm font-medium text-slate-700 mb-1">Performans</div>
                    <div className="text-lg font-bold text-slate-900">{driver.completedTrips}/{driver.totalTrips}</div>
                    <div className="text-xs text-slate-500">Tamamlanan/Toplam</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="text-sm font-medium text-slate-700 mb-1">Uzmanlık</div>
                    <div className="flex flex-wrap gap-1">
                      {driver.specialties.slice(0, 2).map((specialty, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {specialty}
                        </span>
                      ))}
                      {driver.specialties.length > 2 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{driver.specialties.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="text-sm font-medium text-slate-700 mb-1">Son Aktivite</div>
                    <div className="text-sm text-slate-900">
                      {new Date(driver.lastActive).toLocaleDateString('tr-TR')}
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(driver.lastActive).toLocaleTimeString('tr-TR')}
                    </div>
                  </div>
                </div>

                {driver.currentJob && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">Aktif İş</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getJobStatusColor(driver.currentJob.status)}`}>
                          {getJobStatusText(driver.currentJob.status)}
                        </span>
                      </div>
                      <div className="text-sm text-blue-700">
                        {driver.currentJob.from} → {driver.currentJob.to}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <EmptyState
              icon={Users}
              title="Şoför bulunamadı"
              description="Arama kriterlerinize uygun şoför bulunamadı."
              actionText="Yeni Şoför Ekle"
              onAction={() => setShowAddDriver(true)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Drivers;
