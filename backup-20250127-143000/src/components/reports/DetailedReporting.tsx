import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { BarChart3, Download, Filter, Calendar, TrendingUp, TrendingDown, DollarSign, Package, Truck, Users } from 'lucide-react';

interface ReportData {
  id: string;
  title: string;
  type: 'shipment' | 'financial' | 'performance' | 'user';
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor: string;
      borderColor: string;
    }[];
  };
  summary: {
    total: number;
    change: number;
    changeType: 'increase' | 'decrease';
    period: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  isActive: boolean;
}

export default function DetailedReporting() {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedType, setSelectedType] = useState('all');

  const reportTemplates: ReportTemplate[] = [
    {
      id: '1',
      name: 'Gönderi Raporu',
      description: 'Gönderi istatistikleri ve analizi',
      category: 'shipment',
      isActive: true
    },
    {
      id: '2',
      name: 'Mali Rapor',
      description: 'Gelir ve gider analizi',
      category: 'financial',
      isActive: true
    },
    {
      id: '3',
      name: 'Performans Raporu',
      description: 'Operasyonel performans metrikleri',
      category: 'performance',
      isActive: true
    },
    {
      id: '4',
      name: 'Kullanıcı Raporu',
      description: 'Kullanıcı aktivite analizi',
      category: 'user',
      isActive: true
    }
  ];

  const sampleReports: ReportData[] = [
    {
      id: '1',
      title: 'Aylık Gönderi Raporu',
      type: 'shipment',
      period: 'monthly',
      data: {
        labels: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran'],
        datasets: [{
          label: 'Gönderi Sayısı',
          data: [120, 150, 180, 200, 220, 250],
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderColor: 'rgba(59, 130, 246, 1)'
        }]
      },
      summary: {
        total: 250,
        change: 15.5,
        changeType: 'increase',
        period: 'Bu ay'
      },
      createdAt: '2024-01-01',
      updatedAt: '2024-01-15'
    },
    {
      id: '2',
      title: 'Gelir Analizi',
      type: 'financial',
      period: 'monthly',
      data: {
        labels: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran'],
        datasets: [{
          label: 'Gelir (₺)',
          data: [45000, 52000, 61000, 68000, 75000, 82000],
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          borderColor: 'rgba(34, 197, 94, 1)'
        }]
      },
      summary: {
        total: 82000,
        change: 12.3,
        changeType: 'increase',
        period: 'Bu ay'
      },
      createdAt: '2024-01-01',
      updatedAt: '2024-01-15'
    }
  ];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'shipment':
        return <Package className="w-5 h-5" />;
      case 'financial':
        return <DollarSign className="w-5 h-5" />;
      case 'performance':
        return <TrendingUp className="w-5 h-5" />;
      case 'user':
        return <Users className="w-5 h-5" />;
      default:
        return <BarChart3 className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'shipment':
        return 'bg-blue-100 text-blue-600';
      case 'financial':
        return 'bg-green-100 text-green-600';
      case 'performance':
        return 'bg-purple-100 text-purple-600';
      case 'user':
        return 'bg-orange-100 text-orange-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Detaylı Raporlama - YolNet</title>
        <meta name="description" content="YolNet detaylı raporlama sistemi" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Detaylı Raporlama</h1>
            <p className="text-gray-600 mt-2">Kapsamlı analiz ve raporlar oluşturun</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2">
              <Filter size={20} />
              Filtrele
            </button>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
              <Download size={20} />
              Dışa Aktar
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rapor Türü</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tümü</option>
                <option value="shipment">Gönderi</option>
                <option value="financial">Mali</option>
                <option value="performance">Performans</option>
                <option value="user">Kullanıcı</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Zaman Aralığı</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="daily">Günlük</option>
                <option value="weekly">Haftalık</option>
                <option value="monthly">Aylık</option>
                <option value="yearly">Yıllık</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tarih Aralığı</label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="date"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Report Templates */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Rapor Şablonları</h2>
              </div>
              <div className="p-4 space-y-3">
                {reportTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getCategoryColor(template.category)}`}>
                        {getCategoryIcon(template.category)}
                      </div>
                      <h3 className="font-semibold text-gray-900">{template.name}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        template.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {template.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        Kullan
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Reports */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {sampleReports.map((report) => (
                <div key={report.id} className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{report.title}</h3>
                        <p className="text-gray-600 mt-1">
                          {report.period === 'monthly' ? 'Aylık' : 
                           report.period === 'weekly' ? 'Haftalık' :
                           report.period === 'daily' ? 'Günlük' : 'Yıllık'} Rapor
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-2 text-gray-600 hover:text-gray-900">
                          <Download size={20} />
                        </button>
                        <button className="p-2 text-gray-600 hover:text-gray-900">
                          <Calendar size={20} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <BarChart3 className="w-5 h-5 text-blue-600" />
                          <span className="text-sm font-medium text-blue-700">Toplam</span>
                        </div>
                        <div className="text-2xl font-bold text-blue-900">
                          {report.type === 'financial' ? `₺${report.summary.total.toLocaleString()}` : report.summary.total.toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          {report.summary.changeType === 'increase' ? 
                            <TrendingUp className="w-5 h-5 text-green-600" /> : 
                            <TrendingDown className="w-5 h-5 text-red-600" />
                          }
                          <span className="text-sm font-medium text-green-700">Değişim</span>
                        </div>
                        <div className={`text-2xl font-bold ${
                          report.summary.changeType === 'increase' ? 'text-green-900' : 'text-red-900'
                        }`}>
                          %{report.summary.change}
                        </div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-5 h-5 text-purple-600" />
                          <span className="text-sm font-medium text-purple-700">Dönem</span>
                        </div>
                        <div className="text-2xl font-bold text-purple-900">{report.summary.period}</div>
                      </div>
                    </div>

                    {/* Chart Placeholder */}
                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                      <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-600">Grafik burada görüntülenecek</p>
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