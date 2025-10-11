import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Search, 
  Package, 
  MapPin, 
  Clock, 
  DollarSign, 
  Truck, 
  Filter, 
  Eye,
  MessageSquare,
  Calendar,
  Weight,
  Ruler,
  User,
  Star,
  ArrowRight,
  Plus,
  X
} from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    category: '',
    minPrice: '',
    maxPrice: '',
    date: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // Mock data - Gerçek API'den gelecek
  const mockJobs = [
    {
      id: '1',
      title: 'Elektronik Eşya Taşıma',
      from: 'İstanbul, Şişli',
      to: 'Ankara, Çankaya',
      category: 'Elektronik',
      subCategory: 'Bilgisayar',
      weight: '50 kg',
      volume: '0.5 m³',
      price: 1200,
      estimatedDelivery: '2 gün',
      pickupDate: '2024-01-25',
      description: 'Laptop ve monitör taşıma işi. Özel ambalaj gerekiyor.',
      customer: {
        name: 'Ahmet Yılmaz',
        rating: 4.8,
        completedShipments: 15
      },
      requirements: ['Özel ambalaj', 'Sigortalı taşıma'],
      createdAt: '2024-01-23T10:30:00Z'
    },
    {
      id: '2',
      title: 'Ev Eşyası Taşıma',
      from: 'İzmir, Konak',
      to: 'Bursa, Osmangazi',
      category: 'Ev Eşyası',
      subCategory: 'Daire Eşyası',
      weight: '500 kg',
      volume: '12 m³',
      price: 2500,
      estimatedDelivery: '1 gün',
      pickupDate: '2024-01-26',
      description: '3+1 daire eşyası taşıma. Montaj ve demontaj dahil.',
      customer: {
        name: 'Fatma Demir',
        rating: 4.9,
        completedShipments: 8
      },
      requirements: ['Montaj hizmeti', 'Sigortalı taşıma', 'Temizlik'],
      createdAt: '2024-01-23T09:15:00Z'
    },
    {
      id: '3',
      title: 'Ofis Mobilyası',
      from: 'Ankara, Keçiören',
      to: 'İstanbul, Beşiktaş',
      category: 'Ofis Mobilyası',
      subCategory: 'Mobilya',
      weight: '200 kg',
      volume: '4 m³',
      price: 1800,
      estimatedDelivery: '3 gün',
      pickupDate: '2024-01-27',
      description: 'Ofis masaları ve sandalyeleri taşıma.',
      customer: {
        name: 'Mehmet Kaya',
        rating: 4.7,
        completedShipments: 23
      },
      requirements: ['Dikkatli taşıma', 'Sigortalı taşıma'],
      createdAt: '2024-01-22T16:45:00Z'
    }
  ];

  useEffect(() => {
    const loadJobs = async () => {
      setIsLoading(true);
      // Simüle edilmiş API çağrısı
      setTimeout(() => {
        setJobs(mockJobs);
        setIsLoading(false);
      }, 1000);
    };
    loadJobs();
  }, []);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    // Filtreleme mantığı burada olacak
    console.log('Filters applied:', filters);
  };

  const handleMakeOffer = (jobId: string) => {
    // Teklif verme modalı açılacak
    console.log('Make offer for job:', jobId);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Elektronik': 'bg-blue-100 text-blue-800',
      'Ev Eşyası': 'bg-green-100 text-green-800',
      'Ofis Mobilyası': 'bg-purple-100 text-purple-800',
      'Kişisel Eşya': 'bg-orange-100 text-orange-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (createdAt: string) => {
    const now = new Date();
    const jobDate = new Date(createdAt);
    const hoursDiff = (now.getTime() - jobDate.getTime()) / (1000 * 60 * 60);
    
    if (hoursDiff < 2) return 'bg-red-100 text-red-800';
    if (hoursDiff < 6) return 'bg-orange-100 text-orange-800';
    return 'bg-green-100 text-green-800';
  };

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Helmet>
        <title>Yeni Yük Ara - YolNet Nakliyeci</title>
        <meta name="description" content="Nakliyeci için yeni yük fırsatları" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <Breadcrumb items={[
            { name: 'Ana Sayfa', href: '/nakliyeci/dashboard' },
            { name: 'Yeni Yük Ara', href: '/nakliyeci/jobs' }
          ]} />
          
          <div className="mt-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-slate-800 to-blue-900 rounded-2xl flex items-center justify-center shadow-lg">
                <Search className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-slate-900 mb-2">
                  Yeni Yük Ara
                </h1>
                <p className="text-slate-600 text-lg">
                  Müsait yük fırsatlarını keşfedin ve teklif verin
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900">Filtreler</h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? 'Filtreleri Gizle' : 'Filtreleri Göster'}
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nereden</label>
                <input
                  type="text"
                  value={filters.from}
                  onChange={(e) => handleFilterChange('from', e.target.value)}
                  placeholder="Şehir, İlçe"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nereye</label>
                <input
                  type="text"
                  value={filters.to}
                  onChange={(e) => handleFilterChange('to', e.target.value)}
                  placeholder="Şehir, İlçe"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Kategori</label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Tüm Kategoriler</option>
                  <option value="Elektronik">Elektronik</option>
                  <option value="Ev Eşyası">Ev Eşyası</option>
                  <option value="Ofis Mobilyası">Ofis Mobilyası</option>
                  <option value="Kişisel Eşya">Kişisel Eşya</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Min. Fiyat</label>
                <input
                  type="number"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  placeholder="₺0"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Max. Fiyat</label>
                <input
                  type="number"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  placeholder="₺10000"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tarih</label>
                <input
                  type="date"
                  value={filters.date}
                  onChange={(e) => handleFilterChange('date', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end mt-4">
            <button
              onClick={applyFilters}
              className="px-6 py-2 bg-gradient-to-r from-slate-800 to-blue-900 text-white rounded-lg hover:from-slate-700 hover:to-blue-800 transition-all duration-300"
            >
              Filtreleri Uygula
            </button>
          </div>
        </div>

        {/* Jobs List */}
        <div className="space-y-6">
          {jobs.length > 0 ? (
            jobs.map((job) => (
              <div key={job.id} className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-slate-900">{job.title}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(job.category)}`}>
                        {job.category}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(job.createdAt)}`}>
                        {new Date(job.createdAt).getHours() < 2 ? 'Yeni' : 'Normal'}
                      </span>
                    </div>
                    <p className="text-slate-600 mb-3">{job.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-700 mb-1">₺{job.price.toLocaleString()}</div>
                    <div className="text-sm text-slate-500">{job.estimatedDelivery}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <div>
                      <div className="text-sm font-medium text-slate-900">{job.from}</div>
                      <div className="text-xs text-slate-500">Nereden</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <div>
                      <div className="text-sm font-medium text-slate-900">{job.to}</div>
                      <div className="text-xs text-slate-500">Nereye</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Weight className="w-4 h-4 text-slate-400" />
                    <div>
                      <div className="text-sm font-medium text-slate-900">{job.weight}</div>
                      <div className="text-xs text-slate-500">Ağırlık</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-slate-400" />
                    <div>
                      <div className="text-sm font-medium text-slate-900">{job.volume}</div>
                      <div className="text-xs text-slate-500">Hacim</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <div>
                        <div className="text-sm font-medium text-slate-900">{job.customer.name}</div>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-400 fill-current" />
                          <span className="text-xs text-slate-500">{job.customer.rating} ({job.customer.completedShipments} gönderi)</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <div>
                        <div className="text-sm font-medium text-slate-900">{job.pickupDate}</div>
                        <div className="text-xs text-slate-500">Alım Tarihi</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Detay
                    </button>
                    <button 
                      onClick={() => handleMakeOffer(job.id)}
                      className="px-4 py-2 bg-gradient-to-r from-slate-800 to-blue-900 text-white rounded-lg hover:from-slate-700 hover:to-blue-800 transition-all duration-300 flex items-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Teklif Ver
                    </button>
                  </div>
                </div>

                {job.requirements && job.requirements.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Truck className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-700">Gereksinimler:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {job.requirements.map((req, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {req}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <EmptyState
              icon={Search}
              title="Yük bulunamadı"
              description="Arama kriterlerinize uygun yük bulunamadı. Filtreleri değiştirerek tekrar deneyin."
              actionText="Filtreleri Temizle"
              onAction={() => setFilters({
                from: '',
                to: '',
                category: '',
                minPrice: '',
                maxPrice: '',
                date: ''
              })}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Jobs;
