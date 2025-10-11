import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  DollarSign, 
  Search, 
  Filter, 
  Calendar, 
  TrendingUp, 
  BarChart3, 
  Download, 
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  Target
} from 'lucide-react';

export default function TasiyiciEarnings() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('month');
  const [activeTab, setActiveTab] = useState('overview');

  // Kazanç verileri
  const earningsData = {
    totalEarnings: 45200,
    thisMonthEarnings: 8750,
    lastMonthEarnings: 7200,
    thisWeekEarnings: 2100,
    lastWeekEarnings: 1800,
    averagePerJob: 1250,
    totalJobs: 36,
    thisMonthJobs: 7,
    lastMonthJobs: 6
  };

  // İş geçmişi
  const jobHistory = [
    {
      id: 1,
      title: "Ev Eşyaları Taşıma",
      customer: "Ahmet Bey",
      earnings: 1500,
      date: "2024-01-15",
      status: "completed",
      rating: 5,
      distance: "450 km",
      duration: "6 saat"
    },
    {
      id: 2,
      title: "Ofis Malzemeleri",
      customer: "ABC Şirketi",
      earnings: 2200,
      date: "2024-01-14",
      status: "completed",
      rating: 4,
      distance: "565 km",
      duration: "8 saat"
    },
    {
      id: 3,
      title: "Hammade Taşıma",
      customer: "DEF Fabrikası",
      earnings: 1200,
      date: "2024-01-13",
      status: "completed",
      rating: 5,
      distance: "180 km",
      duration: "3 saat"
    },
    {
      id: 4,
      title: "Ev Eşyaları - 2+1",
      customer: "Mehmet Bey",
      earnings: 1800,
      date: "2024-01-12",
      status: "completed",
      rating: 5,
      distance: "450 km",
      duration: "6 saat"
    },
    {
      id: 5,
      title: "Ofis Eşyaları",
      customer: "GHI Ofis",
      earnings: 2050,
      date: "2024-01-11",
      status: "completed",
      rating: 4,
      distance: "320 km",
      duration: "5 saat"
    }
  ];

  const filteredJobs = jobHistory.filter(job => 
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.customer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Tamamlandı';
      case 'pending': return 'Beklemede';
      case 'cancelled': return 'İptal';
      default: return 'Bilinmiyor';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Kazançlarım - Taşıyıcı Panel</title>
      </Helmet>

      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Kazançlarım</h1>
          <p className="text-gray-600">Gelir takibi ve performans analizi</p>
        </div>

        {/* Kazanç Özeti */}
        <div className="bg-gradient-to-r from-green-600 to-green-800 rounded-xl p-8 text-white mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Toplam Kazanç</h2>
              <p className="text-green-100">Tüm zamanların kazancı</p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold">{earningsData.totalEarnings.toLocaleString()}₺</p>
              <p className="text-green-100">Toplam Kazanç</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-green-100 text-sm mb-1">Bu Ay</p>
              <p className="text-2xl font-bold">{earningsData.thisMonthEarnings.toLocaleString()}₺</p>
            </div>
            <div>
              <p className="text-green-100 text-sm mb-1">Geçen Ay</p>
              <p className="text-2xl font-bold">{earningsData.lastMonthEarnings.toLocaleString()}₺</p>
            </div>
            <div>
              <p className="text-green-100 text-sm mb-1">Bu Hafta</p>
              <p className="text-2xl font-bold">{earningsData.thisWeekEarnings.toLocaleString()}₺</p>
            </div>
          </div>
        </div>

        {/* KPI Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Ortalama İş Kazancı</p>
                <p className="text-3xl font-bold text-gray-900">{earningsData.averagePerJob.toLocaleString()}₺</p>
                <p className="text-green-600 text-sm flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +8% geçen aya göre
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Toplam İş</p>
                <p className="text-3xl font-bold text-gray-900">{earningsData.totalJobs}</p>
                <p className="text-blue-600 text-sm flex items-center mt-1">
                  <Target className="w-4 h-4 mr-1" />
                  {earningsData.thisMonthJobs} bu ay
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Bu Ay İş</p>
                <p className="text-3xl font-bold text-gray-900">{earningsData.thisMonthJobs}</p>
                <p className="text-purple-600 text-sm flex items-center mt-1">
                  <Star className="w-4 h-4 mr-1" />
                  Mükemmel performans
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Haftalık Artış</p>
                <p className="text-3xl font-bold text-gray-900">
                  +{((earningsData.thisWeekEarnings - earningsData.lastWeekEarnings) / earningsData.lastWeekEarnings * 100).toFixed(1)}%
                </p>
                <p className="text-orange-600 text-sm flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Pozitif trend
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Menü */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Genel Bakış', icon: BarChart3 },
                { id: 'history', label: 'İş Geçmişi', icon: Clock },
                { id: 'analytics', label: 'Analitik', icon: TrendingUp }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Genel Bakış */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Aylık Kazanç Trendi</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Bu Ay</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                          </div>
                          <span className="font-semibold text-gray-900">{earningsData.thisMonthEarnings.toLocaleString()}₺</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Geçen Ay</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: '82%' }}></div>
                          </div>
                          <span className="font-semibold text-gray-900">{earningsData.lastMonthEarnings.toLocaleString()}₺</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Haftalık Performans</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Bu Hafta</span>
                        <span className="font-semibold text-gray-900">{earningsData.thisWeekEarnings.toLocaleString()}₺</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Geçen Hafta</span>
                        <span className="font-semibold text-gray-900">{earningsData.lastWeekEarnings.toLocaleString()}₺</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Artış</span>
                        <span className="font-semibold text-green-600">
                          +{((earningsData.thisWeekEarnings - earningsData.lastWeekEarnings) / earningsData.lastWeekEarnings * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* İş Geçmişi */}
            {activeTab === 'history' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">İş Geçmişi</h3>
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="İş ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                      <option value="all">Tüm İşler</option>
                      <option value="completed">Tamamlanan</option>
                      <option value="pending">Beklemede</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredJobs.map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{job.title}</p>
                          <p className="text-sm text-gray-600">
                            {job.customer} • {job.date} • {job.distance} • {job.duration}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{job.earnings.toLocaleString()}₺</p>
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-500 mr-1" />
                            <span className="text-sm text-gray-600">{job.rating}</span>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                          {getStatusText(job.status)}
                        </span>
                        <button className="text-gray-600 hover:text-gray-900">
                          <Eye className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Analitik */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Kazanç Analizi</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Ortalama/Gün</span>
                        <span className="font-semibold text-gray-900">{(earningsData.thisMonthEarnings / 30).toFixed(0)}₺</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Ortalama/İş</span>
                        <span className="font-semibold text-gray-900">{earningsData.averagePerJob.toLocaleString()}₺</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">En Yüksek İş</span>
                        <span className="font-semibold text-gray-900">2.200₺</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Performans Skoru</h3>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-2">92</div>
                      <p className="text-gray-600 text-sm">Mükemmel performans</p>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Hedefler</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Aylık Hedef</span>
                        <span className="font-semibold text-gray-900">10.000₺</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '87%' }}></div>
                      </div>
                      <p className="text-sm text-gray-600">%87 tamamlandı</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}