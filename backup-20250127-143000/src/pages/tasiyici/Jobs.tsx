import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Briefcase, 
  Search, 
  Filter, 
  MapPin, 
  Clock, 
  DollarSign, 
  Star, 
  Eye, 
  Plus,
  Truck,
  Package,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function TasiyiciJobs() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  const jobs = [
    {
      id: 1,
      title: "Ev Taşıma - 3+1",
      from: "Üsküdar, İstanbul",
      to: "Çankaya, Ankara",
      category: "Ev Taşıma",
      earnings: 1500,
      distance: "450 km",
      timeLeft: "2 saat 15 dk",
      priority: "Yüksek",
      customerRating: 4.8,
      vehicleType: "Kamyon",
      description: "2+1 daire eşyalarının taşınması. Özel eşyalar mevcut.",
      requirements: ["Kamyon", "2 kişi", "Özel ambalaj"],
      customer: "Ahmet Bey",
      phone: "+90 555 123 4567"
    },
    {
      id: 2,
      title: "Ofis Eşyaları",
      from: "Şişli, İstanbul",
      to: "Konak, İzmir",
      category: "Ofis Taşıma",
      earnings: 2200,
      distance: "565 km",
      timeLeft: "4 saat 30 dk",
      priority: "Orta",
      customerRating: 4.6,
      vehicleType: "Tır",
      description: "Büro mobilyaları ve elektronik eşyaların taşınması.",
      requirements: ["Tır", "3 kişi", "Elektronik taşıma"],
      customer: "ABC Şirketi",
      phone: "+90 555 234 5678"
    },
    {
      id: 3,
      title: "Hammade Taşıma",
      from: "Gebze, Kocaeli",
      to: "Merkez, Bursa",
      category: "Hammade",
      earnings: 1200,
      distance: "180 km",
      timeLeft: "6 saat 45 dk",
      priority: "Düşük",
      customerRating: 4.4,
      vehicleType: "Kamyonet",
      description: "Fabrika hammaddelerinin taşınması.",
      requirements: ["Kamyonet", "1 kişi", "Hammade taşıma"],
      customer: "DEF Fabrikası",
      phone: "+90 555 345 6789"
    },
    {
      id: 4,
      title: "Ev Eşyaları - 2+1",
      from: "Kadıköy, İstanbul",
      to: "Çankaya, Ankara",
      category: "Ev Taşıma",
      earnings: 1800,
      distance: "450 km",
      timeLeft: "1 saat 20 dk",
      priority: "Yüksek",
      customerRating: 4.9,
      vehicleType: "Kamyon",
      description: "2+1 daire eşyalarının taşınması.",
      requirements: ["Kamyon", "2 kişi", "Dikkatli taşıma"],
      customer: "Mehmet Bey",
      phone: "+90 555 456 7890"
    }
  ];

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.to.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || job.category.toLowerCase() === filterType.toLowerCase();
    const matchesPriority = filterPriority === 'all' || job.priority.toLowerCase() === filterPriority.toLowerCase();
    
    return matchesSearch && matchesType && matchesPriority;
  });

  const handleApplyJob = (jobId: number) => {
    navigate(`/tasiyici/jobs?apply=${jobId}`);
  };

  const handleViewDetails = (jobId: number) => {
    navigate(`/tasiyici/jobs?details=${jobId}`);
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
        <title>İş İlanları - Taşıyıcı Panel</title>
      </Helmet>

      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">İş İlanları</h1>
          <p className="text-gray-600">Size uygun iş ilanlarını bulun ve başvurun</p>
        </div>

        {/* Filtreler */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="İş ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">Tüm Kategoriler</option>
              <option value="ev taşıma">Ev Taşıma</option>
              <option value="ofis taşıma">Ofis Taşıma</option>
              <option value="hammade">Hammade</option>
            </select>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">Tüm Öncelikler</option>
              <option value="yüksek">Yüksek Öncelik</option>
              <option value="orta">Orta Öncelik</option>
              <option value="düşük">Düşük Öncelik</option>
            </select>

            <button className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center">
              <Filter className="w-5 h-5 mr-2" />
              Filtrele
            </button>
          </div>
        </div>

        {/* İş İlanları Listesi */}
        <div className="space-y-6">
          {filteredJobs.map((job) => (
            <div key={job.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(job.priority)}`}>
                      {job.priority}
                    </span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {job.category}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-6 text-gray-600 mb-3">
                    <div className="flex items-center">
                      <MapPin className="w-5 h-5 mr-2" />
                      <span>{job.from} → {job.to}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-5 h-5 mr-2" />
                      <span>{job.timeLeft}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-lg">{getVehicleIcon(job.vehicleType)}</span>
                      <span className="ml-1">{job.vehicleType}</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{job.earnings.toLocaleString()}₺</p>
                  <p className="text-sm text-gray-600">Kazanç</p>
                </div>
              </div>

              {/* İş Detayları */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Mesafe</p>
                  <p className="font-semibold text-gray-900">{job.distance}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Müşteri Puanı</p>
                  <p className="font-semibold text-gray-900 flex items-center">
                    <Star className="w-4 h-4 text-yellow-500 mr-1" />
                    {job.customerRating}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Müşteri</p>
                  <p className="font-semibold text-gray-900">{job.customer}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Araç Tipi</p>
                  <p className="font-semibold text-gray-900">{job.vehicleType}</p>
                </div>
              </div>

              {/* Açıklama */}
              <div className="mb-4">
                <p className="text-gray-700 mb-3">{job.description}</p>
                <div className="flex flex-wrap gap-2">
                  {job.requirements.map((req, index) => (
                    <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      {req}
                    </span>
                  ))}
                </div>
              </div>

              {/* Aksiyon Butonları */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleViewDetails(job.id)}
                    className="flex items-center text-gray-600 hover:text-gray-900 font-medium"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Detayları Gör
                  </button>
                  
                  <a
                    href={`tel:${job.phone}`}
                    className="flex items-center text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Müşteriyi Ara
                  </a>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleApplyJob(job.id)}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Başvur
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Boş Durum */}
        {filteredJobs.length === 0 && (
          <div className="text-center py-12">
            <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">İş ilanı bulunamadı</h3>
            <p className="text-gray-600 mb-6">Arama kriterlerinize uygun iş ilanı bulunmuyor.</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterType('all');
                setFilterPriority('all');
              }}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Filtreleri Temizle
            </button>
          </div>
        )}

        {/* Başvuru Rehberi */}
        <div className="mt-8 bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-start space-x-4">
            <AlertCircle className="w-6 h-6 text-green-600 mt-1" />
            <div>
              <h3 className="font-semibold text-green-900 mb-2">Başvuru Rehberi</h3>
              <ul className="text-green-800 text-sm space-y-1">
                <li>• Sadece size uygun işlere başvurun</li>
                <li>• Müşteri puanlarını dikkate alın</li>
                <li>• Başvuru yapmadan önce gereksinimleri kontrol edin</li>
                <li>• Başvuru yaptıktan sonra müşteri ile iletişime geçin</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}