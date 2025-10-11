import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  Truck, 
  Clock, 
  Star,
  Filter,
  Download,
  Calendar,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';

export default function CorporateAnalytics() {
  const [selectedPeriod, setSelectedPeriod] = useState('30days');
  const [selectedMetric, setSelectedMetric] = useState('all');

  const kpiData = [
    {
      title: 'Toplam Gönderi',
      value: '1,247',
      change: '+12.5%',
      trend: 'up',
      icon: <Package className="w-6 h-6" />,
      color: 'blue'
    },
    {
      title: 'Toplam Gelir',
      value: '₺2.4M',
      change: '+8.3%',
      trend: 'up',
      icon: <DollarSign className="w-6 h-6" />,
      color: 'green'
    },
    {
      title: 'Ortalama Teslimat Süresi',
      value: '2.3 gün',
      change: '-15.2%',
      trend: 'down',
      icon: <Clock className="w-6 h-6" />,
      color: 'orange'
    },
    {
      title: 'Müşteri Memnuniyeti',
      value: '4.8/5',
      change: '+0.3',
      trend: 'up',
      icon: <Star className="w-6 h-6" />,
      color: 'purple'
    }
  ];

  const chartData = [
    { month: 'Ocak', shipments: 120, revenue: 240000 },
    { month: 'Şubat', shipments: 135, revenue: 270000 },
    { month: 'Mart', shipments: 148, revenue: 296000 },
    { month: 'Nisan', shipments: 162, revenue: 324000 },
    { month: 'Mayıs', shipments: 175, revenue: 350000 },
    { month: 'Haziran', shipments: 189, revenue: 378000 }
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <ArrowUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <ArrowDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <>
      <Helmet>
        <title>Analitik - YolNet Kargo</title>
        <meta name="description" content="Kurumsal analitik ve raporlama" />
      </Helmet>

      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analitik</h1>
              <p className="text-gray-600">Performans metriklerinizi analiz edin</p>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="7days">Son 7 Gün</option>
                <option value="30days">Son 30 Gün</option>
                <option value="90days">Son 90 Gün</option>
                <option value="1year">Son 1 Yıl</option>
              </select>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                <Download className="w-4 h-4" />
                Rapor İndir
              </button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {kpiData.map((kpi, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    kpi.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                    kpi.color === 'green' ? 'bg-green-100 text-green-600' :
                    kpi.color === 'orange' ? 'bg-orange-100 text-orange-600' :
                    'bg-purple-100 text-purple-600'
                  }`}>
                    {kpi.icon}
                  </div>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(kpi.trend)}
                    <span className={`text-sm font-medium ${getTrendColor(kpi.trend)}`}>
                      {kpi.change}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">{kpi.value}</div>
                  <div className="text-sm text-gray-600">{kpi.title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Shipments Chart */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Gönderi Trendi</h3>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Gönderi Sayısı</span>
              </div>
            </div>
            <div className="h-64 flex items-end justify-between gap-2">
              {chartData.map((data, index) => (
                <div key={index} className="flex flex-col items-center gap-2">
                  <div 
                    className="bg-blue-500 rounded-t w-8 transition-all hover:bg-blue-600"
                    style={{ height: `${(data.shipments / 200) * 200}px` }}
                  ></div>
                  <span className="text-xs text-gray-600">{data.month}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Gelir Trendi</h3>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Gelir (₺)</span>
              </div>
            </div>
            <div className="h-64 flex items-end justify-between gap-2">
              {chartData.map((data, index) => (
                <div key={index} className="flex flex-col items-center gap-2">
                  <div 
                    className="bg-green-500 rounded-t w-8 transition-all hover:bg-green-600"
                    style={{ height: `${(data.revenue / 400000) * 200}px` }}
                  ></div>
                  <span className="text-xs text-gray-600">{data.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Top Carriers */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">En İyi Nakliyeciler</h3>
            <div className="space-y-4">
              {[
                { name: 'Kargo Express A.Ş.', shipments: 45, rating: 4.9, revenue: '₺89,500' },
                { name: 'Hızlı Lojistik', shipments: 38, rating: 4.7, revenue: '₺76,200' },
                { name: 'Güvenli Taşımacılık', shipments: 32, rating: 4.8, revenue: '₺64,800' },
                { name: 'Mega Kargo', shipments: 28, rating: 4.6, revenue: '₺56,400' }
              ].map((carrier, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{carrier.name}</div>
                    <div className="text-sm text-gray-600">{carrier.shipments} gönderi • {carrier.rating} ⭐</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{carrier.revenue}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performans Metrikleri</h3>
            <div className="space-y-4">
              {[
                { metric: 'Zamanında Teslimat', value: '94.2%', color: 'green' },
                { metric: 'Müşteri Memnuniyeti', value: '4.8/5', color: 'blue' },
                { metric: 'Geri Dönüş Oranı', value: '12.3%', color: 'orange' },
                { metric: 'Ortalama Yanıt Süresi', value: '2.1 saat', color: 'purple' }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-gray-600">{item.metric}</span>
                  <span className={`font-semibold ${
                    item.color === 'green' ? 'text-green-600' :
                    item.color === 'blue' ? 'text-blue-600' :
                    item.color === 'orange' ? 'text-orange-600' :
                    'text-purple-600'
                  }`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Son Aktiviteler</h3>
            <div className="space-y-4">
              {[
                { action: 'Yeni gönderi oluşturuldu', time: '2 saat önce', type: 'shipment' },
                { action: 'Teslimat tamamlandı', time: '4 saat önce', type: 'delivery' },
                { action: 'Yeni teklif alındı', time: '6 saat önce', type: 'offer' },
                { action: 'Rapor oluşturuldu', time: '1 gün önce', type: 'report' }
              ].map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'shipment' ? 'bg-blue-500' :
                    activity.type === 'delivery' ? 'bg-green-500' :
                    activity.type === 'offer' ? 'bg-orange-500' :
                    'bg-purple-500'
                  }`}></div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-900">{activity.action}</div>
                    <div className="text-xs text-gray-500">{activity.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}