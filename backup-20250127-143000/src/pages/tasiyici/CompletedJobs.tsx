import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  CheckCircle, 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Star, 
  Eye, 
  Download,
  MessageCircle,
  Star as StarIcon,
  Clock,
  Award
} from 'lucide-react';

export default function TasiyiciCompletedJobs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  const completedJobs = [
    {
      id: 1,
      title: "Ev Eşyaları Taşıma",
      from: "Kadıköy, İstanbul",
      to: "Çankaya, Ankara",
      completedDate: "2024-01-15",
      earnings: 1500,
      customer: "Ahmet Bey",
      rating: 5,
      customerRating: 5,
      duration: "6 saat",
      distance: "450 km",
      vehicleType: "Kamyon",
      status: "completed",
      feedback: "Çok memnun kaldım, çok dikkatli taşıdılar.",
      invoiceNumber: "INV-2024-001"
    },
    {
      id: 2,
      title: "Ofis Malzemeleri",
      from: "Şişli, İstanbul",
      to: "Konak, İzmir",
      completedDate: "2024-01-14",
      earnings: 2200,
      customer: "ABC Şirketi",
      rating: 4,
      customerRating: 4,
      duration: "8 saat",
      distance: "565 km",
      vehicleType: "Tır",
      status: "completed",
      feedback: "Profesyonel hizmet, zamanında teslim.",
      invoiceNumber: "INV-2024-002"
    },
    {
      id: 3,
      title: "Hammade Taşıma",
      from: "Gebze, Kocaeli",
      to: "Merkez, Bursa",
      completedDate: "2024-01-13",
      earnings: 1200,
      customer: "DEF Fabrikası",
      rating: 5,
      customerRating: 5,
      duration: "3 saat",
      distance: "180 km",
      vehicleType: "Kamyonet",
      status: "completed",
      feedback: "Mükemmel hizmet, tekrar çalışmak isteriz.",
      invoiceNumber: "INV-2024-003"
    },
    {
      id: 4,
      title: "Ev Eşyaları - 2+1",
      from: "Üsküdar, İstanbul",
      to: "Çankaya, Ankara",
      completedDate: "2024-01-12",
      earnings: 1800,
      customer: "Mehmet Bey",
      rating: 5,
      customerRating: 5,
      duration: "6 saat",
      distance: "450 km",
      vehicleType: "Kamyon",
      status: "completed",
      feedback: "Çok dikkatli ve güvenilir, tavsiye ederim.",
      invoiceNumber: "INV-2024-004"
    },
    {
      id: 5,
      title: "Ofis Eşyaları",
      from: "Beşiktaş, İstanbul",
      to: "Konak, İzmir",
      completedDate: "2024-01-11",
      earnings: 2050,
      customer: "GHI Ofis",
      rating: 4,
      customerRating: 4,
      duration: "5 saat",
      distance: "320 km",
      vehicleType: "Tır",
      status: "completed",
      feedback: "İyi hizmet, memnun kaldık.",
      invoiceNumber: "INV-2024-005"
    }
  ];

  const filteredJobs = completedJobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.to.toLowerCase().includes(searchTerm.toLowerCase());
    
    const now = new Date();
    const jobDate = new Date(job.completedDate);
    const daysDiff = Math.floor((now.getTime() - jobDate.getTime()) / (1000 * 60 * 60 * 24));
    
    let matchesPeriod = true;
    if (filterPeriod === 'week') matchesPeriod = daysDiff <= 7;
    else if (filterPeriod === 'month') matchesPeriod = daysDiff <= 30;
    else if (filterPeriod === 'quarter') matchesPeriod = daysDiff <= 90;
    
    return matchesSearch && matchesPeriod;
  });

  const sortedJobs = filteredJobs.sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.completedDate).getTime() - new Date(a.completedDate).getTime();
      case 'earnings':
        return b.earnings - a.earnings;
      case 'rating':
        return b.rating - a.rating;
      default:
        return 0;
    }
  });

  const totalEarnings = completedJobs.reduce((sum, job) => sum + job.earnings, 0);
  const averageRating = completedJobs.reduce((sum, job) => sum + job.rating, 0) / completedJobs.length;
  const totalJobs = completedJobs.length;

  const handleDownloadInvoice = (invoiceNumber: string) => {
    console.log('Fatura indiriliyor:', invoiceNumber);
    // Fatura indirme işlemi
  };

  const handleViewDetails = (jobId: number) => {
    console.log('İş detayları görüntüleniyor:', jobId);
    // İş detayları sayfasına yönlendirme
  };

  const handleMessage = (customer: string) => {
    console.log('Mesaj gönderiliyor:', customer);
    // Mesaj sayfasına yönlendirme
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Tamamlanan İşler - Taşıyıcı Panel</title>
      </Helmet>

      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tamamlanan İşler</h1>
          <p className="text-gray-600">Geçmiş işlerinizi görüntüleyin ve analiz edin</p>
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Toplam İş</p>
                <p className="text-3xl font-bold text-gray-900">{totalJobs}</p>
                <p className="text-green-600 text-sm flex items-center mt-1">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Tamamlandı
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Toplam Kazanç</p>
                <p className="text-3xl font-bold text-gray-900">{totalEarnings.toLocaleString()}₺</p>
                <p className="text-blue-600 text-sm flex items-center mt-1">
                  <DollarSign className="w-4 h-4 mr-1" />
                  Tüm zamanlar
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Ortalama Puan</p>
                <p className="text-3xl font-bold text-gray-900">{averageRating.toFixed(1)}</p>
                <p className="text-yellow-600 text-sm flex items-center mt-1">
                  <Star className="w-4 h-4 mr-1" />
                  Müşteri değerlendirmesi
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
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
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">Tüm Zamanlar</option>
              <option value="week">Son 1 Hafta</option>
              <option value="month">Son 1 Ay</option>
              <option value="quarter">Son 3 Ay</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="date">Tarihe Göre</option>
              <option value="earnings">Kazanca Göre</option>
              <option value="rating">Puana Göre</option>
            </select>

            <button className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center">
              <Filter className="w-5 h-5 mr-2" />
              Filtrele
            </button>
          </div>
        </div>

        {/* İş Listesi */}
        <div className="space-y-4">
          {sortedJobs.map((job) => (
            <div key={job.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      Tamamlandı
                    </span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {job.invoiceNumber}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-6 text-gray-600 mb-3">
                    <div className="flex items-center">
                      <MapPin className="w-5 h-5 mr-2" />
                      <span>{job.from} → {job.to}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-5 h-5 mr-2" />
                      <span>{job.completedDate}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-5 h-5 mr-2" />
                      <span>{job.duration}</span>
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
                  <p className="text-sm text-gray-600">Araç Tipi</p>
                  <p className="font-semibold text-gray-900">{job.vehicleType}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Müşteri Puanı</p>
                  <p className="font-semibold text-gray-900 flex items-center">
                    <Star className="w-4 h-4 text-yellow-500 mr-1" />
                    {job.customerRating}
                  </p>
                </div>
              </div>

              {/* Müşteri Geri Bildirimi */}
              {job.feedback && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <StarIcon className="w-5 h-5 text-green-600 mt-1" />
                    <div>
                      <p className="text-sm font-medium text-green-800">Müşteri Geri Bildirimi</p>
                      <p className="text-green-700 mt-1">"{job.feedback}"</p>
                    </div>
                  </div>
                </div>
              )}

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
                  
                  <button
                    onClick={() => handleMessage(job.customer)}
                    className="flex items-center text-green-600 hover:text-green-700 font-medium"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Mesaj Gönder
                  </button>
                  
                  <button
                    onClick={() => handleDownloadInvoice(job.invoiceNumber)}
                    className="flex items-center text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Fatura İndir
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="flex items-center text-green-600 font-medium">
                    <Award className="w-5 h-5 mr-2" />
                    Başarılı
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Boş Durum */}
        {sortedJobs.length === 0 && (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tamamlanan iş bulunamadı</h3>
            <p className="text-gray-600 mb-6">Arama kriterlerinize uygun tamamlanan iş bulunmuyor.</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterPeriod('all');
                setSortBy('date');
              }}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Filtreleri Temizle
            </button>
          </div>
        )}

        {/* Başarı Özeti */}
        <div className="mt-8 bg-gradient-to-r from-green-600 to-green-800 rounded-xl p-8 text-white">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Başarı Özeti</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-green-100 text-sm mb-1">Toplam İş</p>
                <p className="text-3xl font-bold">{totalJobs}</p>
              </div>
              <div>
                <p className="text-green-100 text-sm mb-1">Toplam Kazanç</p>
                <p className="text-3xl font-bold">{totalEarnings.toLocaleString()}₺</p>
              </div>
              <div>
                <p className="text-green-100 text-sm mb-1">Ortalama Puan</p>
                <p className="text-3xl font-bold">{averageRating.toFixed(1)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}







