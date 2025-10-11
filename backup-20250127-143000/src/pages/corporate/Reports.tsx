import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  Calendar, 
  Filter, 
  RefreshCw, 
  FileText, 
  PieChart, 
  LineChart, 
  Activity,
  DollarSign,
  Package,
  Truck,
  Clock,
  Target,
  Users,
  MapPin,
  Star,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  Eye,
  Share2,
  Settings
} from 'lucide-react';

export default function CorporateReports() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedReport, setSelectedReport] = useState('operational');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('Rapor başarıyla oluşturuldu!');
    } catch (error) {
      alert('Hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadReport = (format: string) => {
    console.log(`Rapor indiriliyor: ${format}`);
    alert(`${format.toUpperCase()} formatında rapor indiriliyor...`);
  };

  // Mock data for reports
  const operationalData = {
    totalShipments: 1247,
    deliveredShipments: 1189,
    pendingShipments: 58,
    successRate: 95.3,
    averageDeliveryTime: 2.4,
    onTimeDelivery: 92.1,
    carrierPerformance: [
      { name: 'Kargo Express A.Ş.', rating: 4.9, shipments: 156, onTime: 98.1 },
      { name: 'Hızlı Lojistik', rating: 4.7, shipments: 134, onTime: 94.2 },
      { name: 'Güvenli Taşımacılık', rating: 4.8, shipments: 98, onTime: 96.8 },
      { name: 'Mega Kargo', rating: 4.6, shipments: 87, onTime: 91.5 }
    ],
    routePerformance: [
      { route: 'İstanbul → Ankara', shipments: 234, avgTime: 1.8, cost: 12500 },
      { route: 'İzmir → Bursa', shipments: 189, avgTime: 2.1, cost: 9800 },
      { route: 'Ankara → İzmir', shipments: 156, avgTime: 2.5, cost: 11200 },
      { route: 'İstanbul → Antalya', shipments: 134, avgTime: 3.2, cost: 15600 }
    ]
  };

  const financialData = {
    totalSpent: 125000,
    monthlySpent: 18750,
    averageCost: 100.2,
    costReduction: 18.5,
    savings: 28500,
    carrierCosts: [
      { name: 'Kargo Express A.Ş.', amount: 45000, percentage: 36 },
      { name: 'Hızlı Lojistik', amount: 32000, percentage: 25.6 },
      { name: 'Güvenli Taşımacılık', amount: 28000, percentage: 22.4 },
      { name: 'Mega Kargo', amount: 20000, percentage: 16 }
    ],
    monthlyTrend: [
      { month: 'Ocak', amount: 15200, shipments: 98 },
      { month: 'Şubat', amount: 16800, shipments: 112 },
      { month: 'Mart', amount: 19200, shipments: 134 },
      { month: 'Nisan', amount: 18750, shipments: 156 }
    ]
  };

  const strategicData = {
    marketShare: 12.5,
    competitorAnalysis: [
      { name: 'Rakip A', share: 25.3, growth: 5.2 },
      { name: 'Rakip B', share: 18.7, growth: 3.8 },
      { name: 'Rakip C', share: 15.2, growth: 2.1 },
      { name: 'Bizim', share: 12.5, growth: 8.9 }
    ],
    growthOpportunities: [
      { area: 'Yeni Güzergahlar', potential: 'Yüksek', impact: '₺45,000' },
      { area: 'Nakliyeci Çeşitliliği', potential: 'Orta', impact: '₺28,000' },
      { area: 'Teknoloji Entegrasyonu', potential: 'Yüksek', impact: '₺35,000' }
    ],
    riskFactors: [
      { factor: 'Yakıt Fiyat Artışı', risk: 'Yüksek', mitigation: 'Alternatif yakıt' },
      { factor: 'Trafik Yoğunluğu', risk: 'Orta', mitigation: 'Dinamik rota' },
      { factor: 'Hava Koşulları', risk: 'Düşük', mitigation: 'Erken uyarı' }
    ]
  };

  const reportTypes = [
    { id: 'operational', name: 'Operasyonel Raporlar', icon: <Activity size={20} />, color: 'blue' },
    { id: 'financial', name: 'Finansal Raporlar', icon: <DollarSign size={20} />, color: 'green' },
    { id: 'strategic', name: 'Stratejik Raporlar', icon: <Target size={20} />, color: 'purple' }
  ];

  const periods = [
    { value: 'week', label: 'Son 7 Gün' },
    { value: 'month', label: 'Son 30 Gün' },
    { value: 'quarter', label: 'Son 3 Ay' },
    { value: 'year', label: 'Son 1 Yıl' }
  ];

  const renderOperationalReport = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{operationalData.totalShipments.toLocaleString()}</div>
              <div className="text-sm text-green-600 font-medium">+12% bu ay</div>
            </div>
          </div>
          <div className="text-sm font-medium text-gray-900">Toplam Gönderi</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">%{operationalData.successRate}</div>
              <div className="text-sm text-green-600 font-medium">+2.3% bu ay</div>
            </div>
          </div>
          <div className="text-sm font-medium text-gray-900">Başarı Oranı</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{operationalData.averageDeliveryTime} gün</div>
              <div className="text-sm text-red-600 font-medium">-0.3 gün bu ay</div>
            </div>
          </div>
          <div className="text-sm font-medium text-gray-900">Ortalama Teslimat</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">%{operationalData.onTimeDelivery}</div>
              <div className="text-sm text-green-600 font-medium">+1.2% bu ay</div>
            </div>
          </div>
          <div className="text-sm font-medium text-gray-900">Zamanında Teslimat</div>
        </div>
      </div>

      {/* Carrier Performance */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Nakliyeci Performansı</h3>
          <button className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            Detaylı Görünüm
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Nakliyeci</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Puan</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Gönderi Sayısı</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Zamanında Teslimat</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Trend</th>
              </tr>
            </thead>
            <tbody>
              {operationalData.carrierPerformance.map((carrier, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                        <Truck className="w-4 h-4 text-gray-600" />
                      </div>
                      <span className="font-medium text-gray-900">{carrier.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="font-medium text-gray-900">{carrier.rating}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-gray-900">{carrier.shipments}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-gray-900">%{carrier.onTime}</span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1 text-green-600">
                      <ArrowUp className="w-4 h-4" />
                      <span className="text-sm">+5.2%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Route Performance */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Güzergah Performansı</h3>
          <button className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            Harita Görünümü
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {operationalData.routePerformance.map((route, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">{route.route}</h4>
                <span className="text-sm text-gray-500">{route.shipments} gönderi</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Ortalama Süre:</span>
                  <span className="text-gray-900">{route.avgTime} gün</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Toplam Maliyet:</span>
                  <span className="text-gray-900">₺{route.cost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Gönderi Başına:</span>
                  <span className="text-gray-900">₺{Math.round(route.cost / route.shipments)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderFinancialReport = () => (
    <div className="space-y-6">
      {/* Financial KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">₺{financialData.totalSpent.toLocaleString()}</div>
              <div className="text-sm text-green-600 font-medium">+15% bu ay</div>
            </div>
          </div>
          <div className="text-sm font-medium text-gray-900">Toplam Harcama</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">₺{financialData.savings.toLocaleString()}</div>
              <div className="text-sm text-green-600 font-medium">+₺5,200 bu ay</div>
            </div>
          </div>
          <div className="text-sm font-medium text-gray-900">Toplam Tasarruf</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">%{financialData.costReduction}</div>
              <div className="text-sm text-green-600 font-medium">+3.2% bu ay</div>
            </div>
          </div>
          <div className="text-sm font-medium text-gray-900">Maliyet Azaltma</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
              <Package className="w-6 h-6 text-orange-600" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">₺{financialData.averageCost}</div>
              <div className="text-sm text-red-600 font-medium">-₺12 bu ay</div>
            </div>
          </div>
          <div className="text-sm font-medium text-gray-900">Ortalama Maliyet</div>
        </div>
      </div>

      {/* Carrier Costs */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Nakliyeci Maliyetleri</h3>
          <button className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            Detaylı Analiz
          </button>
        </div>
        <div className="space-y-4">
          {financialData.carrierCosts.map((carrier, index) => (
            <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Truck className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">{carrier.name}</div>
                  <div className="text-sm text-gray-500">%{carrier.percentage} toplam harcama</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">₺{carrier.amount.toLocaleString()}</div>
                <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${carrier.percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Aylık Trend</h3>
          <button className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            Grafik Görünümü
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {financialData.monthlyTrend.map((month, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-900 mb-2">{month.month}</div>
              <div className="text-2xl font-bold text-gray-900 mb-1">₺{month.amount.toLocaleString()}</div>
              <div className="text-sm text-gray-500">{month.shipments} gönderi</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStrategicReport = () => (
    <div className="space-y-6">
      {/* Market Share */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Pazar Payı Analizi</h3>
          <div className="text-3xl font-bold text-blue-600">%{strategicData.marketShare}</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Rekabet Analizi</h4>
            <div className="space-y-3">
              {strategicData.competitorAnalysis.map((competitor, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      competitor.name === 'Bizim' ? 'bg-blue-500' : 'bg-gray-300'
                    }`}></div>
                    <span className="font-medium text-gray-900">{competitor.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">%{competitor.share}</div>
                    <div className={`text-sm flex items-center gap-1 ${
                      competitor.growth > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {competitor.growth > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                      %{competitor.growth}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Büyüme Fırsatları</h4>
            <div className="space-y-3">
              {strategicData.growthOpportunities.map((opportunity, index) => (
                <div key={index} className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{opportunity.area}</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      opportunity.potential === 'Yüksek' ? 'bg-green-100 text-green-800' :
                      opportunity.potential === 'Orta' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {opportunity.potential}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">Potansiyel Etki: {opportunity.impact}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Risk Factors */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Risk Faktörleri</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {strategicData.riskFactors.map((risk, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  risk.risk === 'Yüksek' ? 'bg-red-100' :
                  risk.risk === 'Orta' ? 'bg-yellow-100' :
                  'bg-green-100'
                }`}>
                  <AlertTriangle className={`w-4 h-4 ${
                    risk.risk === 'Yüksek' ? 'text-red-600' :
                    risk.risk === 'Orta' ? 'text-yellow-600' :
                    'text-green-600'
                  }`} />
                </div>
                <div>
                  <div className="font-medium text-gray-900">{risk.factor}</div>
                  <div className={`text-sm ${
                    risk.risk === 'Yüksek' ? 'text-red-600' :
                    risk.risk === 'Orta' ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    Risk: {risk.risk}
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <strong>Önlem:</strong> {risk.mitigation}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>Raporlar - YolNet Kargo</title>
        <meta name="description" content="Kurumsal raporlama sistemi" />
      </Helmet>

      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Raporlar</h1>
              <p className="text-gray-600">Detaylı analiz ve raporlama sistemi</p>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={handleGenerateReport}
                disabled={isGenerating}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Oluşturuluyor...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Rapor Oluştur
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Report Type Tabs */}
          <div className="bg-white rounded-xl p-2 shadow-sm border border-gray-200 mb-6">
            <div className="flex space-x-2">
              {reportTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedReport(type.id)}
                  className={`flex-1 flex items-center justify-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                    selectedReport === type.id
                      ? `bg-${type.color}-600 text-white`
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {type.icon}
                  {type.name}
                </button>
              ))}
            </div>
          </div>

          {/* Period and Filters */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Zaman Aralığı</label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {periods.map((period) => (
                    <option key={period.value} value={period.value}>{period.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
                <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="pdf">PDF</option>
                  <option value="excel">Excel</option>
                  <option value="csv">CSV</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
                <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="all">Tüm Kategoriler</option>
                  <option value="food">Gıda</option>
                  <option value="textile">Tekstil</option>
                  <option value="electronics">Elektronik</option>
                </select>
              </div>

              <div className="flex items-end">
                <button className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filtrele
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Report Content */}
        <div className="mb-8">
          {selectedReport === 'operational' && renderOperationalReport()}
          {selectedReport === 'financial' && renderFinancialReport()}
          {selectedReport === 'strategic' && renderStrategicReport()}
        </div>

        {/* Download Actions */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Rapor İndirme</h3>
              <p className="text-gray-600">Raporunuzu farklı formatlarda indirebilirsiniz</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => handleDownloadReport('pdf')}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                PDF
              </button>
              <button 
                onClick={() => handleDownloadReport('excel')}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                Excel
              </button>
              <button 
                onClick={() => handleDownloadReport('csv')}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                CSV
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}