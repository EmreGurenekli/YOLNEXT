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
  Phone,
  MessageCircle,
  CheckCircle,
  AlertCircle,
  Truck,
  Package
} from 'lucide-react';

export default function TasiyiciActiveJobs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const activeJobs = [
    {
      id: 1,
      title: "Ev Eşyaları Taşıma",
      from: "Kadıköy, İstanbul",
      to: "Çankaya, Ankara",
      status: "Yolda",
      progress: 65,
      earnings: 1200,
      estimatedArrival: "2 saat",
      customer: "Ahmet Bey",
      rating: 4.9,
      phone: "+90 555 123 4567",
      startTime: "08:00",
      endTime: "18:00",
      distance: "450 km",
      vehicleType: "Kamyon",
      description: "2+1 daire eşyalarının taşınması. Özel eşyalar mevcut."
    },
    {
      id: 2,
      title: "Ofis Malzemeleri",
      from: "Beşiktaş, İstanbul",
      to: "Konak, İzmir",
      status: "Yükleme",
      progress: 25,
      earnings: 1800,
      estimatedArrival: "4 saat",
      customer: "ABC Şirketi",
      rating: 4.7,
      phone: "+90 555 234 5678",
      startTime: "09:00",
      endTime: "17:00",
      distance: "565 km",
      vehicleType: "Tır",
      description: "Büro mobilyaları ve elektronik eşyaların taşınması."
    },
    {
      id: 3,
      title: "Hammade Taşıma",
      from: "Gebze, Kocaeli",
      to: "Merkez, Bursa",
      status: "Hazırlanıyor",
      progress: 10,
      earnings: 950,
      estimatedArrival: "6 saat",
      customer: "DEF Fabrikası",
      rating: 4.6,
      phone: "+90 555 345 6789",
      startTime: "10:00",
      endTime: "16:00",
      distance: "180 km",
      vehicleType: "Kamyonet",
      description: "Fabrika hammaddelerinin taşınması."
    }
  ];

  const filteredJobs = activeJobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.to.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || job.status.toLowerCase() === filterStatus.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Yolda': return 'bg-green-100 text-green-800';
      case 'Yükleme': return 'bg-blue-100 text-blue-800';
      case 'Hazırlanıyor': return 'bg-yellow-100 text-yellow-800';
      case 'Teslim Edildi': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCall = (phone: string) => {
    window.open(`tel:${phone}`);
  };

  const handleMessage = (customer: string) => {
    console.log('Mesaj gönderiliyor:', customer);
    // Mesaj sayfasına yönlendirme
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Aktif İşlerim - Taşıyıcı Panel</title>
      </Helmet>

      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Aktif İşlerim</h1>
          <p className="text-gray-600">Şu anda devam eden işlerinizi takip edin</p>
        </div>

        {/* Filtreler */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="hazırlanıyor">Hazırlanıyor</option>
              <option value="yükleme">Yükleme</option>
              <option value="yolda">Yolda</option>
              <option value="teslim edildi">Teslim Edildi</option>
            </select>

            <button className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center">
              <Filter className="w-5 h-5 mr-2" />
              Filtrele
            </button>
          </div>
        </div>

        {/* İş Listesi */}
        <div className="space-y-6">
          {filteredJobs.map((job) => (
            <div key={job.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(job.status)}`}>
                      {job.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-6 text-gray-600 mb-3">
                    <div className="flex items-center">
                      <MapPin className="w-5 h-5 mr-2" />
                      <span>{job.from} → {job.to}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-5 h-5 mr-2" />
                      <span>{job.estimatedArrival}</span>
                    </div>
                    <div className="flex items-center">
                      <Truck className="w-5 h-5 mr-2" />
                      <span>{job.vehicleType}</span>
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
                  <p className="text-sm text-gray-600">Müşteri</p>
                  <p className="font-semibold text-gray-900">{job.customer}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Mesafe</p>
                  <p className="font-semibold text-gray-900">{job.distance}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Çalışma Saati</p>
                  <p className="font-semibold text-gray-900">{job.startTime} - {job.endTime}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Müşteri Puanı</p>
                  <p className="font-semibold text-gray-900 flex items-center">
                    <Star className="w-4 h-4 text-yellow-500 mr-1" />
                    {job.rating}
                  </p>
                </div>
              </div>

              {/* Açıklama */}
              <div className="mb-4">
                <p className="text-gray-700">{job.description}</p>
              </div>

              {/* İlerleme Çubuğu */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>İlerleme</span>
                  <span>{job.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-green-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${job.progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Aksiyon Butonları */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleCall(job.phone)}
                    className="flex items-center text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Ara
                  </button>
                  
                  <button
                    onClick={() => handleMessage(job.customer)}
                    className="flex items-center text-green-600 hover:text-green-700 font-medium"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Mesaj
                  </button>
                  
                  <button className="flex items-center text-gray-600 hover:text-gray-900 font-medium">
                    <Eye className="w-4 h-4 mr-2" />
                    Detay
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  {job.status === 'Teslim Edildi' ? (
                    <span className="flex items-center text-green-600 font-medium">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Tamamlandı
                    </span>
                  ) : (
                    <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                      Güncelle
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Boş Durum */}
        {filteredJobs.length === 0 && (
          <div className="text-center py-12">
            <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aktif iş bulunamadı</h3>
            <p className="text-gray-600 mb-6">Arama kriterlerinize uygun aktif iş bulunmuyor.</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
              }}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Filtreleri Temizle
            </button>
          </div>
        )}

        {/* İpuçları */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start space-x-4">
            <AlertCircle className="w-6 h-6 text-blue-600 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">İş Takip İpuçları</h3>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>• İş durumunu düzenli olarak güncelleyin</li>
                <li>• Müşteri ile sürekli iletişim halinde olun</li>
                <li>• Gecikmeleri önceden bildirin</li>
                <li>• İş tamamlandığında durumu güncelleyin</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}







