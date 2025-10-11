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
  Minus,
  FileText,
  Users,
  Target,
  Award,
  Activity,
  Zap,
  Shield,
  CheckCircle,
  Eye,
  MoreVertical,
  RefreshCw,
  Settings,
  Bell,
  AlertCircle,
  Info
} from 'lucide-react';

export default function CorporateAnalytics() {
  const [selectedPeriod, setSelectedPeriod] = useState('30days');
  const [selectedMetric, setSelectedMetric] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const kpiData = [
    {
      title: 'Toplam Gönderi',
      value: '1,247',
      change: '+12.5%',
      trend: 'up',
      icon: <Package className="w-6 h-6" />,
      color: 'blue',
      description: 'Bu ay tamamlanan gönderi sayısı',
      previousValue: '1,108',
      period: 'vs geçen ay',
      status: 'excellent'
    },
    {
      title: 'Toplam Gelir',
      value: '₺2.4M',
      change: '+8.3%',
      trend: 'up',
      icon: <DollarSign className="w-6 h-6" />,
      color: 'green',
      description: 'Toplam nakliye geliri',
      previousValue: '₺2.2M',
      period: 'vs geçen ay',
      status: 'excellent'
    },
    {
      title: 'Ortalama Teslimat Süresi',
      value: '2.3 gün',
      change: '-15.2%',
      trend: 'down',
      icon: <Clock className="w-6 h-6" />,
      color: 'orange',
      description: 'Gönderi başına ortalama süre',
      previousValue: '2.7 gün',
      period: 'vs geçen ay',
      status: 'good'
    },
    {
      title: 'Müşteri Memnuniyeti',
      value: '4.8/5',
      change: '+0.3',
      trend: 'up',
      icon: <Star className="w-6 h-6" />,
      color: 'purple',
      description: 'Ortalama müşteri puanı',
      previousValue: '4.5/5',
      period: 'vs geçen ay',
      status: 'excellent'
    },
    {
      title: 'Aktif Nakliyeci',
      value: '24',
      change: '+2',
      trend: 'up',
      icon: <Truck className="w-6 h-6" />,
      color: 'indigo',
      description: 'Sözleşmeli nakliyeci sayısı',
      previousValue: '22',
      period: 'vs geçen ay',
      status: 'good'
    },
    {
      title: 'Başarı Oranı',
      value: '94.2%',
      change: '+1.8%',
      trend: 'up',
      icon: <CheckCircle className="w-6 h-6" />,
      color: 'emerald',
      description: 'Zamanında teslimat oranı',
      previousValue: '92.4%',
      period: 'vs geçen ay',
      status: 'excellent'
    }
  ];

  const chartData = [
    { month: 'Oca', shipments: 120, revenue: 180000, cost: 150000, profit: 30000 },
    { month: 'Şub', shipments: 135, revenue: 195000, cost: 162000, profit: 33000 },
    { month: 'Mar', shipments: 142, revenue: 210000, cost: 168000, profit: 42000 },
    { month: 'Nis', shipments: 158, revenue: 235000, cost: 185000, profit: 50000 },
    { month: 'May', shipments: 165, revenue: 245000, cost: 192000, profit: 53000 },
    { month: 'Haz', shipments: 172, revenue: 260000, cost: 200000, profit: 60000 }
  ];

  const topCarriers = [
    { 
      name: 'Kargo Express A.Ş.', 
      shipments: 45, 
      rating: 4.9, 
      revenue: '₺89,500',
      efficiency: 96.5,
      status: 'excellent',
      lastDelivery: '2 saat önce'
    },
    { 
      name: 'Hızlı Lojistik', 
      shipments: 38, 
      rating: 4.7, 
      revenue: '₺76,200',
      efficiency: 94.2,
      status: 'good',
      lastDelivery: '4 saat önce'
    },
    { 
      name: 'Güvenli Taşımacılık', 
      shipments: 32, 
      rating: 4.8, 
      revenue: '₺64,800',
      efficiency: 95.1,
      status: 'excellent',
      lastDelivery: '6 saat önce'
    },
    { 
      name: 'Mega Kargo', 
      shipments: 28, 
      rating: 4.6, 
      revenue: '₺56,400',
      efficiency: 92.8,
      status: 'good',
      lastDelivery: '1 gün önce'
    }
  ];

  const performanceMetrics = [
    { 
      metric: 'Zamanında Teslimat', 
      value: '94.2%', 
      target: '95%',
      color: 'green',
      status: 'on-track'
    },
    { 
      metric: 'Müşteri Memnuniyeti', 
      value: '4.8/5', 
      target: '4.5/5',
      color: 'blue',
      status: 'exceeded'
    },
    { 
      metric: 'Geri Dönüş Oranı', 
      value: '12.3%', 
      target: '15%',
      color: 'orange',
      status: 'good'
    },
    { 
      metric: 'Ortalama Yanıt Süresi', 
      value: '2.1 saat', 
      target: '3 saat',
      color: 'purple',
      status: 'exceeded'
    },
    { 
      metric: 'Maliyet Optimizasyonu', 
      value: '8.5%', 
      target: '5%',
      color: 'emerald',
      status: 'exceeded'
    },
    { 
      metric: 'Kapasite Kullanımı', 
      value: '87.3%', 
      target: '85%',
      color: 'indigo',
      status: 'exceeded'
    }
  ];

  const recentActivity = [
    { 
      action: 'Yeni gönderi oluşturuldu', 
      time: '2 saat önce', 
      type: 'shipment',
      user: 'Ahmet Yılmaz',
      details: 'CORP-2024-001'
    },
    { 
      action: 'Teslimat tamamlandı', 
      time: '4 saat önce', 
      type: 'delivery',
      user: 'Kargo Express A.Ş.',
      details: 'CORP-2024-002'
    },
    { 
      action: 'Yeni teklif alındı', 
      time: '6 saat önce', 
      type: 'offer',
      user: 'Hızlı Lojistik',
      details: '₺15,500'
    },
    { 
      action: 'Rapor oluşturuldu', 
      time: '1 gün önce', 
      type: 'report',
      user: 'Sistem',
      details: 'Aylık Performans Raporu'
    },
    { 
      action: 'Nakliyeci eklendi', 
      time: '2 gün önce', 
      type: 'carrier',
      user: 'Mehmet Demir',
      details: 'Güvenli Taşımacılık'
    }
  ];

  const reportTypes = [
    { 
      name: 'Aylık Performans Raporu', 
      date: '2024-01-15', 
      size: '2.4 MB', 
      type: 'PDF',
      status: 'ready',
      downloads: 12,
      category: 'Performans'
    },
    { 
      name: 'Nakliyeci Analiz Raporu', 
      date: '2024-01-10', 
      size: '1.8 MB', 
      type: 'Excel',
      status: 'ready',
      downloads: 8,
      category: 'Analiz'
    },
    { 
      name: 'Maliyet Analizi', 
      date: '2024-01-05', 
      size: '3.2 MB', 
      type: 'PDF',
      status: 'ready',
      downloads: 15,
      category: 'Maliyet'
    },
    { 
      name: 'Müşteri Memnuniyet Raporu', 
      date: '2024-01-01', 
      size: '1.5 MB', 
      type: 'PDF',
      status: 'ready',
      downloads: 6,
      category: 'Müşteri'
    },
    { 
      name: 'Operasyonel Rapor', 
      date: '2024-01-20', 
      size: '2.1 MB', 
      type: 'Excel',
      status: 'processing',
      downloads: 0,
      category: 'Operasyon'
    },
    { 
      name: 'Finansal Özet', 
      date: '2024-01-18', 
      size: '1.9 MB', 
      type: 'PDF',
      status: 'ready',
      downloads: 9,
      category: 'Finans'
    }
  ];

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-emerald-600 bg-emerald-50';
      case 'good': return 'text-blue-600 bg-blue-50';
      case 'on-track': return 'text-amber-600 bg-amber-50';
      case 'exceeded': return 'text-purple-600 bg-purple-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="w-4 h-4" />;
      case 'good': return <TrendingUp className="w-4 h-4" />;
      case 'on-track': return <Target className="w-4 h-4" />;
      case 'exceeded': return <Award className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  return (
    <>
      <Helmet>
        <title>Analiz & Raporlar - YolNet Kurumsal</title>
        <meta name="description" content="Profesyonel analiz ve raporlarınızı görüntüleyin" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          {/* Professional Header - Mobile Optimized */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-slate-800 to-blue-900 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-2xl">
                <BarChart3 className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-2 sm:mb-4">
              Analiz &{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-blue-900">Raporlar</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed px-4">
              Kurumsal performansınızı detaylı analizler ve profesyonel raporlarla takip edin
            </p>
          </div>

          {/* Main Content - Mobile Optimized */}
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            {/* Professional Action Bar - Mobile Optimized */}
            <div className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200 px-4 sm:px-6 md:px-8 py-4 sm:py-6">
              <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 justify-between items-start lg:items-center">
                <div className="flex items-center gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Kurumsal Dashboard</h2>
                    <p className="text-sm sm:text-base text-slate-600">Gerçek zamanlı performans metrikleri ve analizler</p>
                  </div>
                  <div className="hidden lg:block w-px h-12 bg-slate-300"></div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Clock className="w-4 h-4" />
                    Son güncelleme: {new Date().toLocaleString('tr-TR')}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-slate-700">Dönem:</label>
                    <select 
                      value={selectedPeriod}
                      onChange={(e) => setSelectedPeriod(e.target.value)}
                      className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    >
                      <option value="7days">Son 7 Gün</option>
                      <option value="30days">Son 30 Gün</option>
                      <option value="90days">Son 90 Gün</option>
                      <option value="1year">Son 1 Yıl</option>
                    </select>
                  </div>
                  
                  <button 
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Yenile
                  </button>
                  
                  <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors">
                    <Filter className="w-4 h-4" />
                    Filtrele
                  </button>
                  
                  <button className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-slate-800 to-blue-900 text-white rounded-lg hover:from-slate-900 hover:to-blue-950 transition-all shadow-lg">
                    <Download className="w-4 h-4" />
                    Rapor Oluştur
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-8">
              {/* Professional KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-12">
                {kpiData.map((kpi, index) => (
                  <div key={index} className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 group">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 ${
                        kpi.color === 'blue' ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' :
                        kpi.color === 'green' ? 'bg-gradient-to-br from-slate-800 to-blue-900 text-white' :
                        kpi.color === 'orange' ? 'bg-gradient-to-br from-slate-800 to-blue-900 text-white' :
                        kpi.color === 'purple' ? 'bg-gradient-to-br from-slate-800 to-blue-900 text-white' :
                        kpi.color === 'indigo' ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white' :
                        'bg-gradient-to-br from-slate-800 to-blue-900 text-white'
                      }`}>
                        {kpi.icon}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                          kpi.trend === 'up' ? 'bg-emerald-100 text-emerald-700' :
                          kpi.trend === 'down' ? 'bg-red-100 text-red-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {kpi.trend === 'up' ? <ArrowUp className="w-3 h-3" /> :
                           kpi.trend === 'down' ? <ArrowDown className="w-3 h-3" /> :
                           <Minus className="w-3 h-3" />}
                          {kpi.change}
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(kpi.status)}`}>
                          {getStatusIcon(kpi.status)}
                        </div>
                      </div>
                    </div>
                    <div className="mb-3">
                      <div className="text-3xl font-bold text-slate-900 mb-1">{kpi.value}</div>
                      <div className="text-sm font-semibold text-slate-700">{kpi.title}</div>
                      <div className="text-xs text-slate-500 mt-1">{kpi.description}</div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Önceki: {kpi.previousValue}</span>
                      <span>{kpi.period}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Professional Charts Section */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-12">
                {/* Revenue Chart */}
                <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-8 shadow-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">Gelir Trendi</h3>
                      <p className="text-slate-600">Aylık gelir ve maliyet analizi</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-slate-600">Gelir</span>
                      <div className="w-3 h-3 bg-orange-500 rounded-full ml-4"></div>
                      <span className="text-sm text-slate-600">Maliyet</span>
                    </div>
                  </div>
                  <div className="h-80 flex items-end justify-between gap-3">
                    {chartData.map((data, index) => (
                      <div key={index} className="flex flex-col items-center gap-3 flex-1 group">
                        <div className="w-full bg-slate-100 rounded-t-2xl relative">
                          <div
                            className="bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-2xl w-full transition-all hover:from-blue-600 hover:to-blue-500 group-hover:shadow-lg"
                            style={{ height: `${(data.revenue / 300000) * 250}px` }}
                          ></div>
                          <div
                            className="bg-gradient-to-t from-orange-500 to-orange-400 rounded-t-2xl w-full mt-1 transition-all hover:from-orange-600 hover:to-orange-500 group-hover:shadow-lg"
                            style={{ height: `${(data.cost / 300000) * 250}px` }}
                          ></div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-semibold text-slate-700">{data.month}</div>
                          <div className="text-xs text-slate-500">₺{(data.revenue / 1000).toFixed(0)}K</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Performance Chart */}
                <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-8 shadow-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">Performans Metrikleri</h3>
                      <p className="text-slate-600">Hedef vs gerçekleşen değerler</p>
                    </div>
                    <button className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors">
                      <Download className="w-4 h-4" />
                      İndir
                    </button>
                  </div>
                  <div className="space-y-6">
                    {performanceMetrics.map((metric, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-700">{metric.metric}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900">{metric.value}</span>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(metric.status)}`}>
                              {getStatusIcon(metric.status)}
                            </div>
                          </div>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-1000 ${
                              metric.color === 'green' ? 'bg-gradient-to-r from-slate-800 to-blue-900' :
                              metric.color === 'blue' ? 'bg-gradient-to-r from-blue-400 to-blue-500' :
                              metric.color === 'orange' ? 'bg-gradient-to-r from-slate-800 to-blue-900' :
                              metric.color === 'purple' ? 'bg-gradient-to-r from-slate-800 to-blue-900' :
                              metric.color === 'emerald' ? 'bg-gradient-to-r from-slate-800 to-blue-900' :
                              'bg-gradient-to-r from-indigo-400 to-indigo-500'
                            }`}
                            style={{ width: `${parseFloat(metric.value.replace(/[^\d.]/g, ''))}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>Hedef: {metric.target}</span>
                          <span>{metric.status === 'exceeded' ? 'Hedefi aştı' : metric.status === 'on-track' ? 'Hedefte' : 'İyi gidiyor'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Professional Detailed Analytics */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-12">
                {/* Top Carriers */}
                <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-8 shadow-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-slate-900">En İyi Nakliyeciler</h3>
                    <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">Tümünü Gör</button>
                  </div>
                  <div className="space-y-4">
                    {topCarriers.map((carrier, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 hover:shadow-md transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                            {carrier.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{carrier.name}</div>
                            <div className="text-sm text-slate-600">{carrier.shipments} gönderi • {carrier.rating} ⭐</div>
                            <div className="text-xs text-slate-500">{carrier.lastDelivery}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-slate-900">{carrier.revenue}</div>
                          <div className="text-sm text-slate-600">{carrier.efficiency}% verimlilik</div>
                          <div className={`text-xs px-2 py-1 rounded-full mt-1 ${getStatusColor(carrier.status)}`}>
                            {carrier.status === 'excellent' ? 'Mükemmel' : 'İyi'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-8 shadow-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-slate-900">Son Aktiviteler</h3>
                    <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">Tümünü Gör</button>
                  </div>
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-start gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:shadow-md transition-all group">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          activity.type === 'shipment' ? 'bg-blue-100 text-blue-600' :
                          activity.type === 'delivery' ? 'bg-emerald-100 text-emerald-600' :
                          activity.type === 'offer' ? 'bg-orange-100 text-orange-600' :
                          activity.type === 'report' ? 'bg-purple-100 text-purple-600' :
                          'bg-indigo-100 text-indigo-600'
                        }`}>
                          {activity.type === 'shipment' ? <Package className="w-5 h-5" /> :
                           activity.type === 'delivery' ? <CheckCircle className="w-5 h-5" /> :
                           activity.type === 'offer' ? <DollarSign className="w-5 h-5" /> :
                           activity.type === 'report' ? <FileText className="w-5 h-5" /> :
                           <Users className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-900 group-hover:text-blue-600 transition-colors">{activity.action}</div>
                          <div className="text-xs text-slate-500 mt-1">{activity.details}</div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-slate-400">{activity.user}</span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs text-slate-400">{activity.time}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-8 shadow-lg border border-slate-200">
                  <h3 className="text-xl font-bold text-slate-900 mb-6">Hızlı İstatistikler</h3>
                  <div className="space-y-6">
                    <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                      <div className="text-2xl font-bold text-blue-600 mb-1">₺2.4M</div>
                      <div className="text-sm text-slate-600">Toplam Gelir</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl">
                      <div className="text-2xl font-bold text-emerald-600 mb-1">94.2%</div>
                      <div className="text-sm text-slate-600">Başarı Oranı</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl">
                      <div className="text-2xl font-bold text-orange-600 mb-1">2.3 gün</div>
                      <div className="text-sm text-slate-600">Ortalama Süre</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl">
                      <div className="text-2xl font-bold text-purple-600 mb-1">4.8/5</div>
                      <div className="text-sm text-slate-600">Memnuniyet</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Professional Reports Section */}
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Kurumsal Raporlar</h3>
                    <p className="text-slate-600">Detaylı analiz ve raporlarınızı görüntüleyin ve indirin</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-500">{reportTypes.length} rapor mevcut</span>
                    <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-slate-800 to-blue-900 text-white rounded-lg hover:from-slate-900 hover:to-blue-950 transition-all">
                      <FileText className="w-4 h-4" />
                      Yeni Rapor
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {reportTypes.map((report, index) => (
                    <div key={index} className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all group">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <FileText className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full">
                            {report.type}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            report.status === 'ready' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {report.status === 'ready' ? 'Hazır' : 'İşleniyor'}
                          </span>
                        </div>
                      </div>
                      <h4 className="font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">{report.name}</h4>
                      <div className="space-y-2 text-sm text-slate-600 mb-4">
                        <div className="flex justify-between">
                          <span>Tarih:</span>
                          <span className="font-medium">{report.date}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Boyut:</span>
                          <span className="font-medium">{report.size}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Kategori:</span>
                          <span className="font-medium">{report.category}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>İndirme:</span>
                          <span className="font-medium">{report.downloads} kez</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="flex-1 px-4 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium">
                          <Eye className="w-4 h-4 inline mr-2" />
                          Görüntüle
                        </button>
                        <button className="flex-1 px-4 py-2 text-sm bg-gradient-to-r from-slate-800 to-blue-900 text-white rounded-lg hover:from-slate-900 hover:to-blue-950 transition-all font-medium">
                          <Download className="w-4 h-4 inline mr-2" />
                          İndir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}