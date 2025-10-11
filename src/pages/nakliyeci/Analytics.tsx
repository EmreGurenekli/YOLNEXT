import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Package,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  Award,
  Target,
  Activity,
  PieChart,
  LineChart,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import Breadcrumb from '../../components/common/Breadcrumb';
import EmptyState from '../../components/common/EmptyState';
import LoadingState from '../../components/common/LoadingState';

export default function NakliyeciAnalytics() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30days');
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  const breadcrumbItems = [
    { label: 'Ana Sayfa', icon: <BarChart3 className="w-4 h-4" /> },
    { label: 'Analitik', icon: <BarChart3 className="w-4 h-4" /> }
  ];

  const [analytics] = useState({
    revenue: {
      current: 125000,
      previous: 110000,
      change: 13.6
    },
    shipments: {
      current: 156,
      previous: 142,
      change: 9.9
    },
    carriers: {
      current: 12,
      previous: 10,
      change: 20.0
    },
    successRate: {
      current: 91.0,
      previous: 88.5,
      change: 2.8
    }
  });

  const [chartData] = useState({
    revenue: [
      { month: 'Oca', value: 95000 },
      { month: 'Şub', value: 110000 },
      { month: 'Mar', value: 105000 },
      { month: 'Nis', value: 120000 },
      { month: 'May', value: 115000 },
      { month: 'Haz', value: 125000 }
    ],
    shipments: [
      { month: 'Oca', value: 120 },
      { month: 'Şub', value: 135 },
      { month: 'Mar', value: 128 },
      { month: 'Nis', value: 145 },
      { month: 'May', value: 138 },
      { month: 'Haz', value: 156 }
    ],
    carriers: [
      { month: 'Oca', value: 8 },
      { month: 'Şub', value: 9 },
      { month: 'Mar', value: 9 },
      { month: 'Nis', value: 10 },
      { month: 'May', value: 11 },
      { month: 'Haz', value: 12 }
    ]
  });

  const [topCarriers] = useState([
    { name: 'Mehmet Kaya', jobs: 45, revenue: 25000, rating: 4.8 },
    { name: 'Ali Veli', jobs: 38, revenue: 22000, rating: 4.6 },
    { name: 'Hasan Yılmaz', jobs: 32, revenue: 18000, rating: 4.4 },
    { name: 'Fatma Demir', jobs: 28, revenue: 16000, rating: 4.7 },
    { name: 'Ahmet Öz', jobs: 25, revenue: 14000, rating: 4.5 }
  ]);

  const [recentActivities] = useState([
    { type: 'shipment', message: 'Yeni gönderi eklendi', time: '2 saat önce', value: '+₺2,450' },
    { type: 'carrier', message: 'Yeni taşıyıcı katıldı', time: '4 saat önce', value: '+1' },
    { type: 'revenue', message: 'Ödeme alındı', time: '6 saat önce', value: '+₺5,200' },
    { type: 'rating', message: 'Puan güncellendi', time: '8 saat önce', value: '4.8' }
  ]);

  useEffect(() => {
    // Simulate loading
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  const getChangeIcon = (change: number) => {
    return change > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />;
  };

  const getChangeColor = (change: number) => {
    return change > 0 ? 'text-green-600' : 'text-red-600';
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'shipment': return <Package className="w-4 h-4" />;
      case 'carrier': return <Users className="w-4 h-4" />;
      case 'revenue': return <DollarSign className="w-4 h-4" />;
      case 'rating': return <Star className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'shipment': return 'text-blue-600 bg-blue-100';
      case 'carrier': return 'text-green-600 bg-green-100';
      case 'revenue': return 'text-yellow-600 bg-yellow-100';
      case 'rating': return 'text-purple-600 bg-purple-100';
      default: return 'text-slate-600 bg-slate-100';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <LoadingState text="Analitik veriler yükleniyor..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-50">
      <Helmet>
        <title>Analitik - Nakliyeci Panel - YolNet</title>
        <meta name="description" content="Nakliyeci analitik ve raporlar" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Breadcrumb */}
        <div className="mb-4 sm:mb-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>

      {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-3 mb-4 sm:mb-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl flex items-center justify-center shadow-lg">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Analitik</h1>
              <p className="text-sm text-slate-600">Performans verilerinizi analiz edin</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 sm:px-4 py-2 sm:py-3 border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm"
            >
              <option value="7days">Son 7 Gün</option>
              <option value="30days">Son 30 Gün</option>
              <option value="90days">Son 90 Gün</option>
              <option value="1year">Son 1 Yıl</option>
            </select>
            <button className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-white border border-slate-200 text-slate-700 rounded-lg sm:rounded-xl hover:bg-slate-50 transition-all duration-200 text-sm font-medium">
              <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Rapor İndir</span>
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div className={`flex items-center gap-1 ${getChangeColor(analytics.revenue.change)}`}>
                {getChangeIcon(analytics.revenue.change)}
                <span className="text-sm font-medium">%{analytics.revenue.change}</span>
              </div>
            </div>
              <div>
              <p className="text-sm text-slate-600 mb-1">Toplam Gelir</p>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900">₺{analytics.revenue.current.toLocaleString()}</p>
              <p className="text-xs text-slate-500">Önceki dönem: ₺{analytics.revenue.previous.toLocaleString()}</p>
            </div>
                </div>

          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div className={`flex items-center gap-1 ${getChangeColor(analytics.shipments.change)}`}>
                {getChangeIcon(analytics.shipments.change)}
                <span className="text-sm font-medium">%{analytics.shipments.change}</span>
              </div>
            </div>
              <div>
              <p className="text-sm text-slate-600 mb-1">Toplam Gönderi</p>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900">{analytics.shipments.current}</p>
              <p className="text-xs text-slate-500">Önceki dönem: {analytics.shipments.previous}</p>
            </div>
                </div>

          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className={`flex items-center gap-1 ${getChangeColor(analytics.carriers.change)}`}>
                {getChangeIcon(analytics.carriers.change)}
                <span className="text-sm font-medium">%{analytics.carriers.change}</span>
              </div>
            </div>
              <div>
              <p className="text-sm text-slate-600 mb-1">Aktif Taşıyıcı</p>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900">{analytics.carriers.current}</p>
              <p className="text-xs text-slate-500">Önceki dönem: {analytics.carriers.previous}</p>
            </div>
                </div>

          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-white" />
              </div>
              <div className={`flex items-center gap-1 ${getChangeColor(analytics.successRate.change)}`}>
                {getChangeIcon(analytics.successRate.change)}
                <span className="text-sm font-medium">%{analytics.successRate.change}</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Başarı Oranı</p>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900">%{analytics.successRate.current}</p>
              <p className="text-xs text-slate-500">Önceki dönem: %{analytics.successRate.previous}</p>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
          {/* Revenue Chart */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Gelir Trendi</h3>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-slate-800 rounded-full"></div>
                <span className="text-sm text-slate-600">Gelir</span>
              </div>
            </div>
            <div className="h-64 flex items-end justify-between gap-2">
              {chartData.revenue.map((item, index) => (
                <div key={index} className="flex flex-col items-center gap-2 flex-1">
                  <div 
                    className="w-full bg-gradient-to-t from-slate-800 to-blue-900 rounded-t-lg transition-all duration-500 hover:from-slate-700 hover:to-blue-800"
                    style={{ height: `${(item.value / 125000) * 200}px` }}
                  ></div>
                  <span className="text-xs text-slate-600">{item.month}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Shipments Chart */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Gönderi Trendi</h3>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-slate-600">Gönderi</span>
              </div>
            </div>
            <div className="h-64 flex items-end justify-between gap-2">
              {chartData.shipments.map((item, index) => (
                <div key={index} className="flex flex-col items-center gap-2 flex-1">
                  <div 
                    className="w-full bg-gradient-to-t from-green-500 to-green-600 rounded-t-lg transition-all duration-500 hover:from-green-400 hover:to-green-500"
                    style={{ height: `${(item.value / 156) * 200}px` }}
                  ></div>
                  <span className="text-xs text-slate-600">{item.month}</span>
                  </div>
                ))}
              </div>
            </div>
        </div>

        {/* Top Carriers */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200 mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">En Başarılı Taşıyıcılar</h3>
            <button className="text-sm text-slate-600 hover:text-slate-900">Tümünü Gör</button>
            </div>
              <div className="space-y-4">
            {topCarriers.map((carrier, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-slate-800 to-blue-900 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                      </div>
                      <div>
                    <p className="font-medium text-slate-900">{carrier.name}</p>
                    <p className="text-sm text-slate-600">{carrier.jobs} iş • ₺{carrier.revenue.toLocaleString()} gelir</p>
                      </div>
                    </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium text-slate-900">{carrier.rating}</span>
                  </div>
                </div>
              </div>
            ))}
            </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Son Aktiviteler</h3>
            <button className="text-sm text-slate-600 hover:text-slate-900">Tümünü Gör</button>
          </div>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-lg transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getActivityColor(activity.type)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{activity.message}</p>
                  <p className="text-xs text-slate-500">{activity.time}</p>
                </div>
                <div className="text-sm font-medium text-slate-900">{activity.value}</div>
              </div>
            ))}
              </div>
            </div>
          </div>
    </div>
  );
}